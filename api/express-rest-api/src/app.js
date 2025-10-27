const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectMongoDB } = require('./config/database');
const authMiddleware = require('./middleware/authMiddleware');
const auditLogger = require('./middleware/auditLogger');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter'); // Thêm dòng này
const { connectRedis } = require('./config/redis');

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const commentRoutes = require('./routes/commentRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const statsRoutes = require('./routes/statsRoutes');
const emailRoutes = require('./routes/emailRoutes');
const notificationRoutes = require('./routes/notifications');
const sessionRoutes = require('./routes/sessions');
const auditRoutes = require('./routes/audit');
const categoryRoutes = require('./routes/categoryRoutes');

dotenv.config();

const app = express();

app.use(cors({
  origin: 'http://localhost:5173', // hoặc '*' nếu bạn chỉ test tạm
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------------------
// RATE LIMITER TOÀN CỤC
// ---------------------------
app.use(generalLimiter); // Giới hạn toàn bộ request (ví dụ: 100 req/15 phút/IP)

// ---------------------------
// GHI LOG TOÀN BỘ REQUEST (kể cả public)
// ---------------------------
app.use(auditLogger);

// ---------------------------
// ROUTES PUBLIC
// ---------------------------
app.use('/api/auth', authRoutes);
app.use('/api/email', emailRoutes);

// ---------------------------
// ROUTES PRIVATE
// ---------------------------
app.use('/api', authMiddleware);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/chats', commentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/categories', authMiddleware, categoryRoutes);

// ---------------------------
// ERROR HANDLER
// ---------------------------
app.use(errorHandler);

// Cho phép truy cập ảnh upload
app.use('/uploads', express.static(process.env.UPLOAD_DIR || 'uploads'));

connectMongoDB().then(async() => {
  await connectRedis();
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});
