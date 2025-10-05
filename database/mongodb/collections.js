// MongoDB Collections Schema for Event Management System
// File này định nghĩa cấu trúc các collections trong MongoDB

import { ObjectId } from 'mongodb';

// Collection: comments
// Lưu trữ comments và replies cho events
const commentsSchema = {
  _id: ObjectId,
  eventId: String, // UUID từ PostgreSQL
  userId: String,  // UUID từ PostgreSQL
  content: String,
  parentId: String, // ID của comment gốc nếu đây là reply
  isHidden: Boolean,
  likes: Number,
  dislikes: Number,
  createdAt: Date,
  updatedAt: Date,
  // Nested replies
  replies: [{
    _id: ObjectId,
    userId: String,
    content: String,
    isHidden: Boolean,
    likes: Number,
    dislikes: Number,
    createdAt: Date,
    updatedAt: Date
  }]
};

// Collection: user_activities
// Lưu trữ hoạt động của người dùng (phi cấu trúc)
const userActivitiesSchema = {
  _id: ObjectId,
  userId: String, // UUID từ PostgreSQL
  activityType: String, // 'login', 'logout', 'view_event', 'join_event', 'leave_event', 'rate_event', 'comment'
  eventId: String, // UUID từ PostgreSQL (optional)
  metadata: {
    ipAddress: String,
    userAgent: String,
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    device: {
      type: String, // 'mobile', 'tablet', 'desktop'
      os: String,
      browser: String
    }
  },
  timestamp: Date
};

// Collection: event_analytics
// Lưu trữ dữ liệu phân tích sự kiện
const eventAnalyticsSchema = {
  _id: ObjectId,
  eventId: String, // UUID từ PostgreSQL
  date: Date,
  metrics: {
    views: Number,
    uniqueViews: Number,
    shares: Number,
    registrations: Number,
    checkIns: Number,
    comments: Number,
    ratings: Number
  },
  demographics: {
    ageGroups: {
      '18-25': Number,
      '26-35': Number,
      '36-45': Number,
      '46-55': Number,
      '55+': Number
    },
    genders: {
      male: Number,
      female: Number,
      other: Number
    }
  },
  traffic: {
    sources: {
      direct: Number,
      social: Number,
      search: Number,
      referral: Number
    },
    devices: {
      mobile: Number,
      tablet: Number,
      desktop: Number
    }
  }
};

// Collection: system_logs
// Lưu trữ logs hệ thống
const systemLogsSchema = {
  _id: ObjectId,
  level: String, // 'error', 'warn', 'info', 'debug'
  message: String,
  service: String, // 'auth', 'events', 'notifications', 'analytics'
  userId: String, // UUID từ PostgreSQL (optional)
  eventId: String, // UUID từ PostgreSQL (optional)
  stack: String, // Stack trace cho errors
  metadata: Object, // Thông tin bổ sung
  timestamp: Date
};

// Collection: notifications_queue
// Hàng đợi thông báo
const notificationsQueueSchema = {
  _id: ObjectId,
  userId: String, // UUID từ PostgreSQL
  type: String, // 'email', 'push', 'sms'
  template: String, // Template name
  data: Object, // Dữ liệu để render template
  priority: String, // 'low', 'normal', 'high', 'urgent'
  status: String, // 'pending', 'sent', 'failed', 'cancelled'
  scheduledAt: Date,
  sentAt: Date,
  attempts: Number,
  maxAttempts: Number,
  error: String,
  createdAt: Date
};

// Collection: file_uploads
// Thông tin về file uploads
const fileUploadsSchema = {
  _id: ObjectId,
  userId: String, // UUID từ PostgreSQL
  eventId: String, // UUID từ PostgreSQL (optional)
  fileName: String,
  originalName: String,
  mimeType: String,
  size: Number,
  url: String,
  thumbnailUrl: String, // Optional
  metadata: {
    width: Number, // For images
    height: Number, // For images
    duration: Number, // For videos
    format: String
  },
  status: String, // 'uploading', 'processing', 'completed', 'failed'
  createdAt: Date,
  updatedAt: Date
};

// Collection: search_index
// Index tìm kiếm cho events
const searchIndexSchema = {
  _id: ObjectId,
  eventId: String, // UUID từ PostgreSQL
  title: String,
  description: String,
  location: String,
  category: String,
  tags: [String],
  startTime: Date,
  endTime: Date,
  isPublic: Boolean,
  status: String,
  averageRating: Number,
  totalRatings: Number,
  participantCount: Number,
  // Full text search fields
  searchText: String, // Combined text for full-text search
  createdAt: Date,
  updatedAt: Date
};

// Collection: cache_data
// Cache data cho performance
const cacheDataSchema = {
  _id: ObjectId,
  key: String,
  value: Object,
  expiresAt: Date,
  createdAt: Date,
  updatedAt: Date
};

// Collection: api_usage
// Theo dõi sử dụng API
const apiUsageSchema = {
  _id: ObjectId,
  userId: String, // UUID từ PostgreSQL (optional)
  endpoint: String,
  method: String,
  statusCode: Number,
  responseTime: Number, // milliseconds
  requestSize: Number, // bytes
  responseSize: Number, // bytes
  ipAddress: String,
  userAgent: String,
  timestamp: Date
};

// Collection: event_recommendations
// Hệ thống gợi ý sự kiện
const eventRecommendationsSchema = {
  _id: ObjectId,
  userId: String, // UUID từ PostgreSQL
  eventId: String, // UUID từ PostgreSQL
  score: Number, // Điểm số gợi ý (0-1)
  reason: String, // Lý do gợi ý
  algorithm: String, // Thuật toán được sử dụng
  createdAt: Date,
  expiresAt: Date
};

// Collection: user_preferences
// Tùy chọn người dùng
const userPreferencesSchema = {
  _id: ObjectId,
  userId: String, // UUID từ PostgreSQL
  preferences: {
    notifications: {
      email: Boolean,
      push: Boolean,
      sms: Boolean,
      eventReminders: Boolean,
      eventUpdates: Boolean,
      newEvents: Boolean
    },
    privacy: {
      showProfile: Boolean,
      showEvents: Boolean,
      showRatings: Boolean
    },
    display: {
      theme: String, // 'light', 'dark', 'auto'
      language: String,
      timezone: String
    },
    interests: [String], // Danh sách categories quan tâm
    locations: [{
      name: String,
      latitude: Number,
      longitude: Number,
      radius: Number // km
    }]
  },
  updatedAt: Date
};

// Export schemas (for reference)
export {
  commentsSchema,
  userActivitiesSchema,
  eventAnalyticsSchema,
  systemLogsSchema,
  notificationsQueueSchema,
  fileUploadsSchema,
  searchIndexSchema,
  cacheDataSchema,
  apiUsageSchema,
  eventRecommendationsSchema,
  userPreferencesSchema
};
