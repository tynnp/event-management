// file: api/express-rest-api/src/controllers/emailVerificationController.js
const { connectRedis } = require('../config/redis');
const { sendMail } = require('../utils/emailService');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Gửi OTP để đổi email
exports.sendChangeEmailOTP = async (req, res) => {
  const { newEmail } = req.body;
  if (!newEmail) return res.status(400).json({ message: 'New email required' });

  // Kiểm tra định dạng email hợp lệ
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(newEmail)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  // Kiểm tra email có bị trùng với người khác không
  const exists = await User.findByEmail(newEmail);
  if (exists) {
    return res.status(400).json({ message: 'This email is already in use' });
  }

  const client = await connectRedis();
  const otp = generateOTP();
  await client.setEx(`changeEmail:${req.user.id}`, 300, JSON.stringify({ otp, newEmail }));

  // Lấy email hiện tại của user
  const user = await User.findById(req.user.id);
  const currentEmail = user?.email;
  if (!currentEmail) {
    return res.status(404).json({ message: 'User email not found' });
  }

  // Gửi OTP xác nhận về email cũ
  await sendMail(currentEmail, 'Confirm email change', `Your OTP code is: ${otp}`);
  res.json({ message: 'OTP sent to your current email for verification' });
};


// Xác thực OTP đổi email
exports.verifyChangeEmailOTP = async (req, res) => {
  const { otp } = req.body;
  const client = await connectRedis();

  const data = await client.get(`changeEmail:${req.user.id}`);
  if (!data) return res.status(400).json({ message: 'OTP expired or not found' });

  const { otp: storedOtp, newEmail } = JSON.parse(data);
  if (otp !== storedOtp) return res.status(400).json({ message: 'Invalid OTP' });

  await User.updateProfile(req.user.id, { email: newEmail });
  await client.del(`changeEmail:${req.user.id}`);

  res.json({ message: 'Email changed successfully' });
};

// Quên mật khẩu → gửi OTP
exports.sendResetPasswordOTP = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });

  const user = await User.findByEmail(email);
  if (!user) return res.status(404).json({ message: 'Email not found' });

  const client = await connectRedis();
  const otp = generateOTP();
  await client.setEx(`resetPassword:${user.id}`, 300, otp);

  await sendMail(email, 'Reset your password', `Hãy nhập mã này để reset mật khẩu bạn nhé! Mã OTP của bạn là: ${otp}`);

  res.json({ message: 'OTP sent to your email' });
};

// Reset mật khẩu bằng OTP
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findByEmail(email);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const client = await connectRedis();
  const storedOtp = await client.get(`resetPassword:${user.id}`);
  if (!storedOtp) return res.status(400).json({ message: 'OTP expired or not found' });
  if (storedOtp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await User.updatePassword(user.id, hashedPassword);
  await client.del(`resetPassword:${user.id}`);

  res.json({ message: 'Password reset successful' });
};
