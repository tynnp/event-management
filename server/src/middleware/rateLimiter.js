// file: api/express-rest-api/src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10); // ms (default 15m)
const maxReq = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10); // max per window

const generalLimiter = rateLimit({
  windowMs,
  max: maxReq,
  standardHeaders: true, // RateLimit-* headers
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      status: 429,
      message: 'Too many requests — take a short break and try again later.'
    });
  }
});

// limiter riêng cho login (ví dụ 5 requests / 5 phút)
const loginLimiter = rateLimit({
  windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || String(5 * 60 * 1000), 10), // 5 minutes
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX_REQUESTS || '5', 10), // 5 attempts
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: false, // có thể set true để chỉ đếm successful requests nếu muốn
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    res.status(429).json({
      status: 429,
      message: 'Quá nhiều lần đăng nhập. Vui lòng thử lại sau'
    });
  }
});

module.exports = {
  generalLimiter,
  loginLimiter
};
