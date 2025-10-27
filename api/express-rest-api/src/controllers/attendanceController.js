// file: api/express-rest-api/src/controllers/attendanceController.js
const AttendanceModel = require('../models/Attendance'); // PostgreSQL model
const AttendanceMongo = require('../models/Attendance'); // Mongo model (optional)
const { v4: uuidv4 } = require('uuid');

function parseQrData(qrData) {
  // qrData có thể là JSON string hoặc data URL chứa JSON
  try {
    // nếu qrcode client gửi là data URL (rare) -> bỏ phần trước nếu có
    if (qrData.startsWith('data:')) {
      // khách hàng thường gửi JSON sau khi scan QR; giữ này để an toàn
      const base64 = qrData.split(',')[1];
      const buf = Buffer.from(base64, 'base64');
      return JSON.parse(buf.toString('utf8'));
    }
    // thử parse trực tiếp
    return JSON.parse(qrData);
  } catch (e) {
    // không phải JSON
    return null;
  }
}

exports.generateQRCode = async (req, res) => {
  const { event_id } = req.query; // nhận event_id từ query param
  const Event = require('../models/Event');

  if (!event_id) {
      return res.status(400).json({ message: 'event_id is required' });
  }

  try {
      // 1. Kiểm tra sự kiện có tồn tại
      const event = await Event.findById(event_id);
      if (!event) {
          return res.status(404).json({ message: 'Event not found' });
      }

      // 2. Tạo QR code dựa trên event_id + random salt (để QR code khác nhau cho mỗi lần)
      const qrData = JSON.stringify({
          event_id,
          code: uuidv4()
      });

      const { generateQRCode } = require('../utils/qrGenerator');
      const qr_code_url = await generateQRCode(qrData);

      // 3. Không auto lưu participants ở đây (để tránh constraint); participants sẽ được tạo khi user check-in
      res.json({ qr_code_url, qr_payload: qrData }); // trả thêm qr_payload tiện test
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error generating QR code', error: err.message });
  }
};

exports.checkIn = async (req, res) => {
  const { event_id, qr_code, qr_data } = req.body;
  const User = require('../models/User');
  const Event = require('../models/Event');

  let eventId = event_id;
  let code = qr_code;

  if (!eventId || !code) {
    if (qr_data) {
      const parsed = parseQrData(qr_data);
      if (!parsed || !parsed.event_id || !parsed.code) {
        return res.status(400).json({ message: 'qr_data invalid. expected JSON with event_id and code' });
      }
      eventId = parsed.event_id;
      code = parsed.code;
    }
  }

  if (!eventId || !code) {
    return res.status(400).json({ message: 'event_id and qr_code (or qr_data) required' });
  }

  try {
    // 1) kiểm tra event tồn tại
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // 2) Cố gắng update participant (nếu đã tồn tại)
    const participant = await AttendanceModel.updateCheckIn(eventId, code);

    if (participant) {
      // Chỉ tăng events_attended nếu participant chưa check-in trước đó
      await User.incrementEventsAttended(req.user.id);

      // Ghi Mongo Attendance (option)
      try {
        await AttendanceMongo.create({ userId: req.user.id, eventId, timestamp: new Date() });
      } catch (e) {
        console.warn('Mongo attendance create failed:', e.message);
      }

      return res.json({ message: 'Check-in successful', participant });
    }

    // 3) Nếu không có participant tương ứng => tạo participant mới
    const newParticipantId = uuidv4();
    const newParticipant = await AttendanceModel.create({
      id: newParticipantId,
      user_id: req.user.id,
      event_id: eventId,
      qr_code: code
    });

    // Tăng events_attended vì đây là lần đầu check-in
    await User.incrementEventsAttended(req.user.id);

    // Ghi Mongo Attendance (option)
    try {
      await AttendanceMongo.create({ userId: req.user.id, eventId, timestamp: new Date() });
    } catch (e) {
      console.warn('Mongo attendance create failed:', e.message);
    }

    return res.json({ message: 'Check-in successful (participant auto-created)', participant: newParticipant });
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Participant already exists or qr_code conflict', error: err.detail });
    }
    res.status(500).json({ message: 'Check-in failed', error: err.message });
  }
};


