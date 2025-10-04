//file: api/express-rest-api/src/controllers/eventController.js
const { getPostgresPool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

exports.createEvent = async (req, res) => {
  const pool = getPostgresPool();
  const { title, description, start_time, end_time, location, image_url, is_public, max_participants, category_id } = req.body;
  try {
    const id = uuidv4();
    await pool.query(
      'INSERT INTO events (id, title, description, start_time, end_time, location, image_url, is_public, max_participants, created_by, category_id, status, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())',
      [id, title, description, start_time, end_time, location, image_url, is_public, max_participants, req.user.id, category_id, 'pending']
    );
    res.status(201).json({ message: 'Event created', eventId: id });
  } catch (err) {
    res.status(500).json({ message: 'Error creating event', error: err.message });
  }
};

exports.getEvents = async (req, res) => {
  const pool = getPostgresPool();
  try {
    const result = await pool.query('SELECT * FROM events WHERE is_public = true AND status = $1', ['approved']);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching events', error: err.message });
  }
};

exports.getEventDetail = async (req, res) => {
  const pool = getPostgresPool();
  try {
    const result = await pool.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    const event = result.rows[0];
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching event', error: err.message });
  }
};

exports.approveEvent = async (req, res) => {
  const pool = getPostgresPool();
  try {
    await pool.query('UPDATE events SET status = $1 WHERE id = $2', ['approved', req.params.id]);
    res.json({ message: 'Event approved' });
  } catch (err) {
    res.status(500).json({ message: 'Error approving event', error: err.message });
  }
};

exports.rejectEvent = async (req, res) => {
  const pool = getPostgresPool();
  const { reason } = req.body;
  try {
    await pool.query('UPDATE events SET status = $1, rejection_reason = $2 WHERE id = $3', ['rejected', reason, req.params.id]);
    res.json({ message: 'Event rejected' });
  } catch (err) {
    res.status(500).json({ message: 'Error rejecting event', error: err.message });
  }
};

exports.updateEvent = async (req, res) => {
  const pool = getPostgresPool();
  const { title, description, start_time, end_time, location, image_url, is_public, max_participants, category_id } = req.body;

  const updates = [];
  const values = [];
  let i = 1;

  if (title) { updates.push(`title=$${i++}`); values.push(title); }
  if (description) { updates.push(`description=$${i++}`); values.push(description); }
  if (start_time) { updates.push(`start_time=$${i++}`); values.push(start_time); }
  if (end_time) { updates.push(`end_time=$${i++}`); values.push(end_time); }
  if (location) { updates.push(`location=$${i++}`); values.push(location); }
  if (image_url) { updates.push(`image_url=$${i++}`); values.push(image_url); }
  if (is_public !== undefined) { updates.push(`is_public=$${i++}`); values.push(is_public); }
  if (max_participants) { updates.push(`max_participants=$${i++}`); values.push(max_participants); }
  if (category_id) { updates.push(`category_id=$${i++}`); values.push(category_id); }

  values.push(req.params.id);

  try {
    const result = await pool.query(`UPDATE events SET ${updates.join(', ')}, updated_at=NOW() WHERE id=$${i} RETURNING *`, values);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: 'Event updated', event: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Error updating event', error: err.message });
  }
};

exports.deleteEvent = async (req, res) => {
  const pool = getPostgresPool();
  try {
    const result = await pool.query('DELETE FROM events WHERE id=$1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting event', error: err.message });
  }
};
