// file: api/express-rest-api/src/controllers/emailVerificationController.js
const { connectRedis } = require('../config/redis');
const { sendMail } = require('../utils/emailService');
const { getPostgresPool } = require('../config/database');
const bcrypt = require('bcryptjs');

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Gửi OTP để đổi email
exports.sendChangeEmailOTP = async (req, res) => {
  const { newEmail } = req.body;
  if (!newEmail) return res.status(400).json({ message: 'New email required' });

  const client = await connectRedis();
  const otp = generateOTP();
  await client.setEx(`changeEmail:${req.user.id}`, 300, JSON.stringify({ otp, newEmail }));

  await sendMail(newEmail, 'Verify your new email', `Your OTP code is: ${otp}`);

  res.json({ message: 'OTP sent to new email' });
};

// Xác thực OTP đổi email
exports.verifyChangeEmailOTP = async (req, res) => {
  const { otp } = req.body;
  const client = await connectRedis();

  const data = await client.get(`changeEmail:${req.user.id}`);
  if (!data) return res.status(400).json({ message: 'OTP expired or not found' });

  const { otp: storedOtp, newEmail } = JSON.parse(data);
  if (otp !== storedOtp) return res.status(400).json({ message: 'Invalid OTP' });

  const pool = getPostgresPool();
  await pool.query(
    'UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2',
    [newEmail, req.user.id]
  );
  await client.del(`changeEmail:${req.user.id}`);

  res.json({ message: 'Email changed successfully' });
};

// Quên mật khẩu → gửi OTP
exports.sendResetPasswordOTP = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });

  const pool = getPostgresPool();
  const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  const user = result.rows[0];
  if (!user) return res.status(404).json({ message: 'Email not found' });

  const client = await connectRedis();
  const otp = generateOTP();
  await client.setEx(`resetPassword:${user.id}`, 300, otp);

  await sendMail(email, 'Reset your password', `Your OTP code is: ${otp}`);

  res.json({ message: 'OTP sent to your email' });
};

// Reset mật khẩu bằng OTP
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const pool = getPostgresPool();
  const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  const user = result.rows[0];
  if (!user) return res.status(404).json({ message: 'User not found' });

  const client = await connectRedis();
  const storedOtp = await client.get(`resetPassword:${user.id}`);
  if (!storedOtp) return res.status(400).json({ message: 'OTP expired or not found' });
  if (storedOtp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await pool.query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [hashedPassword, user.id]
  );
  await client.del(`resetPassword:${user.id}`);

  res.json({ message: 'Password reset successful' });
};
