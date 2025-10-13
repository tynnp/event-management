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

// Tạo image URL (baseURL/uploads/filename)
const buildImageUrl = (filePath) => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  if (!filePath) return null;

  // chuẩn hóa path (tránh \\ trên Windows)
  let clean = String(filePath).replace(/\\/g, '/').replace(/^\/+/, '');

  // nếu giá trị trong DB đã có 'uploads/' rồi, thì không thêm nữa
  if (clean.startsWith('uploads/')) {
    return `${baseUrl}/${clean}`;
  } else {
    return `${baseUrl}/uploads/${clean}`;
  }
};

module.exports = { upload, buildImageUrl };
