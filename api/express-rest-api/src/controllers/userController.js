const { getPostgresPool } = require('../config/database');

exports.getUserProfile = async (req, res) => {
  const pool = getPostgresPool();
  try {
    const result = await pool.query('SELECT id, email, name, avatar_url, role, phone, events_attended, created_at, updated_at, last_login FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching profile', error: err.message });
  }
};

exports.updateUserProfile = async (req, res) => {
  const pool = getPostgresPool();
  const { name, phone, avatar_url } = req.body;
  try {
    await pool.query(
      'UPDATE users SET name = $1, phone = $2, avatar_url = $3, updated_at = NOW() WHERE id = $4',
      [name, phone, avatar_url, req.user.id]
    );
    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating profile', error: err.message });
  }
};