// file: api/express-rest-api/src/middleware/auditLogger.js
const { getPostgresPool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Hàm ẩn dữ liệu nhạy cảm (password, token, otp,...)
function maskSensitiveData(data) {
  if (!data || typeof data !== 'object') return data;

  const clone = JSON.parse(JSON.stringify(data)); // deep clone
  const sensitiveKeys = ['password', 'pass', 'pwd', 'otp', 'token', 'access_token', 'refresh_token'];

  const traverse = (obj) => {
    for (const key of Object.keys(obj)) {
      const lower = key.toLowerCase();
      if (sensitiveKeys.includes(lower)) {
        obj[key] = '******';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        traverse(obj[key]);
      }
    }
  };

  traverse(clone);
  return clone;
}

module.exports = async (req, res, next) => {
  const pool = getPostgresPool();

  // bỏ qua các request không cần log
  const skipPaths = [
    '/favicon.ico',
    '/api/stats',
  ];
  if (skipPaths.some(path => req.path.startsWith(path))) return next();

  const start = Date.now();

  res.on('finish', async () => {
    try {
      const duration = Date.now() - start;
      const userId = req.user?.id || null;
      const method = req.method;
      const url = req.originalUrl;
      const ip = req.ip;
      const ua = req.headers['user-agent'];
      const status = res.statusCode;

      // chỉ log các hành động quan trọng
      if (
        ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) ||
        /\/api\/auth\//.test(url) ||
        /\/api\/email/.test(url)
      ) {
        const safeBody = maskSensitiveData(req.body || {});

        await pool.query(
          `INSERT INTO audit_logs 
            (id, user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
          [
            uuidv4(),
            userId,
            `${method} ${url}`,
            null,
            null,
            '{}',
            JSON.stringify(safeBody),
            ip,
            ua
          ]
        );
      }

      console.log(`🪵 [${method}] ${url} - ${status} (${duration}ms)`);
    } catch (err) {
      console.error('Audit Logger Error:', err.message);
    }
  });

  next();
};
