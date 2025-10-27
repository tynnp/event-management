// file: api/express-rest-api/src/controllers/eventController.js
const { getPostgresPool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { sendNotification } = require('./notificationController'); // 🔔 thêm dòng này

// CREATE: user tạo được nhưng chỉ moderator duyệt
exports.createEvent = async (req, res) => {
  const pool = getPostgresPool();
  const { title, description, start_time, end_time, location, is_public, max_participants, category_id } = req.body;

  try {
    // Nếu có upload hình
    let image_url = null;
    if (req.file) {
      const { buildImageUrl } = require('../middleware/uploadMiddleware');
      image_url = buildImageUrl(req.file.path);
    }

    const id = uuidv4();
    await pool.query(
      `INSERT INTO events (id, title, description, start_time, end_time, location, image_url, 
        is_public, max_participants, created_by, category_id, status, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending',NOW())`,
      [id, title, description, start_time, end_time, location, image_url, is_public, max_participants, req.user.id, category_id]
    );

    // Nếu có ảnh upload -> chèn vào event_images
    if (image_url) {
      const imageId = uuidv4();
      await pool.query(
        'INSERT INTO event_images (id, event_id, image_url, uploaded_at) VALUES ($1, $2, $3, NOW())',
        [imageId, id, image_url]
      );
    }

    res.status(201).json({ message: 'Event created and pending approval', eventId: id });
  } catch (err) {
    res.status(500).json({ message: 'Error creating event', error: err.message });
  }
};

// READ: chỉ lấy các event được duyệt hoặc của chính mình
exports.getEvents = async (req, res) => {
  const pool = getPostgresPool();

  try {
    let result;
    if (req.user.role === 'admin' || req.user.role === 'moderator') {
      result = await pool.query('SELECT * FROM events');
    } else {
      result = await pool.query(
        'SELECT * FROM events WHERE status = $1 OR created_by = $2',
        ['approved', req.user.id]
      );
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching events', error: err.message });
  }
};

// DETAIL
exports.getEventDetail = async (req, res) => {
  const pool = getPostgresPool();
  try {
    const result = await pool.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    const event = result.rows[0];
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.status !== 'approved' && event.created_by !== req.user.id && req.user.role === 'user') {
      return res.status(403).json({ message: 'Not allowed to view this event' });
    }

    res.json(event);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching event', error: err.message });
  }
};

// APPROVE
exports.approveEvent = async (req, res) => {
  const pool = getPostgresPool();

  if (req.user.role !== 'moderator' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only moderator or admin can approve events' });
  }

  try {
    const result = await pool.query('UPDATE events SET status=$1 WHERE id=$2 RETURNING *', ['approved', req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Event not found' });
    const event = result.rows[0];

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
  const pool = getPostgresPool();

  if (req.user.role !== 'moderator' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only moderator or admin can reject events' });
  }

  const { reason } = req.body;
  try {
    const result = await pool.query(
      'UPDATE events SET status=$1, rejection_reason=$2 WHERE id=$3 RETURNING *',
      ['rejected', reason, req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'Event not found' });
    const event = result.rows[0];

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
  const pool = getPostgresPool();
  const allowedFields = ['title','description','start_time','end_time','location','image_url','is_public','max_participants','category_id'];
  const payload = req.body;

  try {

    // Nếu có upload hình
    if (req.file) {
      const { buildImageUrl } = require('../middleware/uploadMiddleware');
      payload.image_url = buildImageUrl(req.file.path);

      // Chèn vào event_images
      const imageId = uuidv4();
      await pool.query(
        'INSERT INTO event_images (id, event_id, image_url, uploaded_at) VALUES ($1, $2, $3, NOW())',
        [imageId, req.params.id, payload.image_url]
      );
    }

    const check = await pool.query('SELECT created_by FROM events WHERE id = $1', [req.params.id]);
    if (check.rowCount === 0) return res.status(404).json({ message: 'Event not found' });

    const event = check.rows[0];
    const isOwner = event.created_by === req.user.id;
    const canEdit = isOwner || req.user.role === 'moderator' || req.user.role === 'admin';

    if (!canEdit) return res.status(403).json({ message: 'Not authorized to edit this event' });

    const updates = [];
    const values = [];
    let i = 1;

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(payload, field) && payload[field] !== undefined) {
        updates.push(`${field} = $${i++}`);
        values.push(payload[field]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    values.push(req.params.id);
    const query = `UPDATE events SET ${updates.join(', ')}, updated_at = NOW(), status = 'pending' WHERE id = $${i} RETURNING *`;
    const result = await pool.query(query, values);

    res.json({ message: 'Event updated and pending re-approval', event: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Error updating event', error: err.message });
  }
};

// DELETE
exports.deleteEvent = async (req, res) => {
  const pool = getPostgresPool();

  try {
    const result = await pool.query('SELECT created_by, title FROM events WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Event not found' });

    const event = result.rows[0];
    const isOwner = event.created_by === req.user.id;
    const canDelete = isOwner || req.user.role === 'moderator' || req.user.role === 'admin';

    if (!canDelete) return res.status(403).json({ message: 'Not authorized to delete this event' });

    await pool.query('DELETE FROM events WHERE id = $1', [req.params.id]);

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
  const pool = getPostgresPool();
  try {
    const result = await pool.query(
      'SELECT id, name, description, color, icon, created_at FROM categories ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching categories', error: err.message });
  }
};