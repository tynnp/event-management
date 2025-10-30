// file: src/middleware/uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = process.env.UPLOAD_DIR || 'uploads';
const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760', 10);
const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png').split(',');

// Tạo thư mục nếu chưa có
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error('File type not allowed'), false);
};

const upload = multer({
  storage,
  limits: { fileSize: maxSize },
  fileFilter,
});

// Chuẩn hóa path để lưu vào database (chỉ lưu /uploads/filename)
const normalizeImagePath = (filePath) => {
  if (!filePath) return null;
  
  // Chuẩn hóa path (tránh \\ trên Windows)
  let clean = String(filePath).replace(/\\/g, '/').replace(/^\/+/, '');
  
  // Nếu đã có http:// hoặc https:// thì chỉ lấy phần path
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    const match = clean.match(/\/uploads\/.+$/);
    return match ? match[0] : null;
  }
  
  // Nếu đã có 'uploads/' thì thêm '/' ở đầu
  if (clean.startsWith('uploads/')) {
    return `/${clean}`;
  }
  
  // Nếu đã có '/uploads/' thì giữ nguyên
  if (clean.startsWith('/uploads/')) {
    return clean;
  }
  
  // Còn lại thì thêm '/uploads/' ở đầu
  return `/uploads/${clean}`;
};

// Tạo image URL đầy đủ (baseURL + path) - chỉ dùng khi trả về client
const buildImageUrl = (filePath) => {
  const baseUrl = (process.env.BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
  if (!filePath) return null;

  // Nếu đã là URL đầy đủ thì return luôn
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }

  // Chuẩn hóa path trước
  const normalizedPath = normalizeImagePath(filePath);
  if (!normalizedPath) return null;
  
  return `${baseUrl}${normalizedPath}`;
};

module.exports = { upload, buildImageUrl, normalizeImagePath };
