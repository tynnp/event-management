const { getPostgresPool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

exports.checkIn = async (req, res) => {
  const pool = getPostgresPool();
  const { event_id, qr_code } = req.body;
  try {
    const result = await pool.query(
      'UPDATE participants SET checked_in = true, check_in_time = NOW() WHERE event_id = $1 AND qr_code = $2 RETURNING *',
      [event_id, qr_code]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'Participant not found or invalid QR code' });
    res.json({ message: 'Check-in successful', participant: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Check-in failed', error: err.message });
  }
};

exports.generateQRCode = async (req, res) => {
  // Dummy QR code generator, replace with real logic if needed
  const qr_code = uuidv4();
  res.json({ qr_code });
};