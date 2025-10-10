// file: api/express-rest-api/src/app.js
const express = require('express');
const dotenv = require('dotenv');
const { connectMongoDB } = require('./config/database');
const authMiddleware = require('./middleware/authMiddleware');
const auditLogger = require('./middleware/auditLogger');
const errorHandler = require('./middleware/errorHandler');

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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use('/api/comments', commentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/audit', auditRoutes);

// ---------------------------
// ERROR HANDLER
// ---------------------------
app.use(errorHandler);

connectMongoDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
  });
});
