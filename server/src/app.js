const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectMongoDB } = require('./config/database');
const authMiddleware = require('./middleware/authMiddleware');
const auditLogger = require('./middleware/auditLogger');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
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

// CORS configuration
const allowedOrigins = [
  process.env.PUBLIC_APP_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
].filter(Boolean); // Remove undefined/null values

// Add local network IPs dynamically
const networkInterfaces = require('os').networkInterfaces();
Object.values(networkInterfaces).forEach(interfaces => {
  interfaces?.forEach(iface => {
    if (iface.family === 'IPv4' && !iface.internal) {
      allowedOrigins.push(`http://${iface.address}:5173`);
      allowedOrigins.push(`http://${iface.address}:3000`);
    }
  });
});

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

const PORT = process.env.PORT || 5000;
const HOST = process.env.SERVER_HOST || 'localhost';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------------------
// HEALTH CHECK ENDPOINT (no rate limit, no logging)
// ---------------------------
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ---------------------------
// RATE LIMITER TOÀN CỤC
// ---------------------------
app.use(generalLimiter);

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
// ROUTES WITH PUBLIC SEGMENTS BEFORE GLOBAL AUTH
// ---------------------------
// Mount events router BEFORE global auth so /api/events/public/:id remains public.
app.use('/api/events', eventRoutes);

// ---------------------------
// ROUTES PRIVATE
// ---------------------------
app.use('/api', authMiddleware);
app.use('/api/users', userRoutes);
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
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
    console.log(`CORS allowed origins:`);
    allowedOrigins.forEach(origin => console.log(`  - ${origin}`));
  });
});