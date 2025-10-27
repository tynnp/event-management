// file: api/express-rest-api/src/controllers/eventController.js
const Event = require('../models/Event');
const Category = require('../models/Category');
const { v4: uuidv4 } = require('uuid');
const { sendNotification } = require('./notificationController');

// CREATE: logic duyệt dựa trên role và is_public
exports.createEvent = async (req, res) => {
  try {
    const { title, description, start_time, end_time, location, is_public, max_participants, category_id } = req.body;

    // Nếu có upload hình
    let image_url = null;
    if (req.file) {
      const { buildImageUrl } = require('../middleware/uploadMiddleware');
      image_url = buildImageUrl(req.file.path);
    }

    const id = uuidv4();
    
    // Xác định status dựa trên role và is_public
    let status = 'pending';
    // Admin hoặc Moderator tạo -> không cần duyệt
    if (req.user.role === 'admin' || req.user.role === 'moderator') {
      status = 'approved';
    } 
    // User thường tạo sự kiện riêng tư (is_public = false) -> không cần duyệt
    else if (is_public === 'false' || is_public === false) {
      status = 'approved';
    }
    // User thường tạo sự kiện công khai -> cần duyệt (status = 'pending')

    const eventData = {
      id, title, description, start_time, end_time, location, image_url,
      is_public, max_participants, created_by: req.user.id, category_id, status
    };

    await Event.create(eventData);

    // Nếu có ảnh upload -> chèn vào event_images
    if (image_url) {
      const imageId = uuidv4();
      await Event.addImage(imageId, id, image_url);
    }

    // Trả về thông báo khác nhau dựa trên status
    if (status === 'approved') {
      res.status(201).json({ 
        message: 'Event created successfully', 
        eventId: id, 
        status: 'approved',
        data: eventData 
      });
    } else {
      res.status(201).json({ 
        message: 'Event created and pending approval', 
        eventId: id, 
        status: 'pending' 
      });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error creating event', error: err.message });
  }
};

// READ: chỉ lấy các event được duyệt hoặc của chính mình
exports.getEvents = async (req, res) => {
  try {
    const events = await Event.findAll(req.user.id, req.user.role);
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching events', error: err.message });
  }
};

// DETAIL
exports.getEventDetail = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Admin/Mod có thể xem tất cả events
    if (req.user.role === 'admin' || req.user.role === 'moderator') {
      res.json(event);
      return;
    }

    // User thường chỉ xem:
    // 1. Sự kiện do chính mình tạo
    // 2. Sự kiện công khai đã được duyệt (status = 'approved' AND is_public = true)
    const isOwner = event.created_by === req.user.id;
    const isPublicAndApproved = event.status === 'approved' && event.is_public === true;
    
    if (!isOwner && !isPublicAndApproved) {
      return res.status(403).json({ message: 'Not allowed to view this event' });
    }

    res.json(event);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching event', error: err.message });
  }
};

// APPROVE
exports.approveEvent = async (req, res) => {
  if (req.user.role !== 'moderator' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only moderator or admin can approve events' });
  }

  try {
    const event = await Event.approve(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // 🔔 Gửi thông báo cho user tạo event
    await sendNotification(
      event.created_by,
      'Sự kiện đã được duyệt',
      `Sự kiện "${event.title}" của bạn đã được phê duyệt.`,
      'event_approved',
      event.id
    );

    res.json({ message: 'Event approved', event });
  } catch (err) {
    res.status(500).json({ message: 'Error approving event', error: err.message });
  }
};

// REJECT
exports.rejectEvent = async (req, res) => {
  if (req.user.role !== 'moderator' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only moderator or admin can reject events' });
  }

  const { reason } = req.body;
  try {
    const event = await Event.reject(req.params.id, reason);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // 🔔 Gửi thông báo cho user tạo event
    await sendNotification(
      event.created_by,
      'Sự kiện bị từ chối',
      `Sự kiện "${event.title}" của bạn đã bị từ chối. Lý do: ${reason || 'Không xác định'}.`,
      'event_rejected',
      event.id
    );

    res.json({ message: 'Event rejected', event });
  } catch (err) {
    res.status(500).json({ message: 'Error rejecting event', error: err.message });
  }
};

// UPDATE - improved
exports.updateEvent = async (req, res) => {
  const allowedFields = ['title','description','start_time','end_time','location','image_url','is_public','max_participants','category_id'];
  const payload = req.body;

  try {
    // Nếu có upload hình
    if (req.file) {
      const { buildImageUrl } = require('../middleware/uploadMiddleware');
      payload.image_url = buildImageUrl(req.file.path);

      // Chèn vào event_images
      const imageId = uuidv4();
      await Event.addImage(imageId, req.params.id, payload.image_url);
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const canEdit = await Event.canEdit(req.params.id, req.user.id, req.user.role);
    if (!canEdit) return res.status(403).json({ message: 'Not authorized to edit this event' });

    // Build updates object
    const updates = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(payload, field) && payload[field] !== undefined) {
        updates[field] = payload[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    const updatedEvent = await Event.update(req.params.id, updates);

    res.json({ message: 'Event updated and pending re-approval', event: updatedEvent });
  } catch (err) {
    res.status(500).json({ message: 'Error updating event', error: err.message });
  }
};

// DELETE
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const isOwner = event.created_by === req.user.id;
    const canDelete = await Event.canDelete(req.params.id, req.user.id, req.user.role);

    if (!canDelete) return res.status(403).json({ message: 'Not authorized to delete this event' });

    await Event.delete(req.params.id);

    // 🔔 Thông báo nếu moderator/admin xóa sự kiện của người khác
    if (!isOwner) {
      await sendNotification(
        event.created_by,
        'Sự kiện bị xóa',
        `Sự kiện "${event.title}" của bạn đã bị xóa bởi quản trị viên.`,
        'event_deleted',
        req.params.id
      );
    }

    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting event', error: err.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching categories', error: err.message });
  }
};