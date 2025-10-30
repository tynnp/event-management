# Database Design - Event Management System

## Tổng quan

Hệ thống quản lý sự kiện sử dụng kiến trúc database hybrid với **PostgreSQL** và **MongoDB** để tối ưu hóa hiệu suất và lưu trữ dữ liệu phù hợp.

## Kiến trúc Database

### PostgreSQL - Dữ liệu có cấu trúc
- **Mục đích**: Lưu trữ dữ liệu có cấu trúc, quan hệ phức tạp
- **Sử dụng cho**: Users, Events, Participants, Ratings, Categories
- **Ưu điểm**: ACID compliance, complex queries, data integrity

### MongoDB - Dữ liệu phi cấu trúc
- **Mục đích**: Lưu trữ dữ liệu phi cấu trúc, logs, analytics
- **Sử dụng cho**: Comments, User Activities, Analytics, System Logs
- **Ưu điểm**: Flexible schema, horizontal scaling, fast writes

## Cấu trúc thư mục

```
database/
├── postgresql/
│   ├── schema.sql                 # Schema hoàn chỉnh
│   ├── migrations/                # Migration scripts
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_additional_tables.sql
│   │   ├── 003_triggers_and_functions.sql
│   │   └── 004_views.sql
│   └── seed_data.sql             # Dữ liệu mẫu
├── mongodb/
│   ├── collections.js            # Schema definitions
│   └── seed_data.js              # Dữ liệu mẫu
├── config/
│   ├── database.js               # Cấu hình kết nối
└── scripts/
    └── setup.js                  # Script thiết lập database
```

## PostgreSQL Schema

### Bảng chính

#### Users
```sql
- id (UUID, Primary Key)
- email (VARCHAR, Unique)
- password_hash (VARCHAR)
- name (VARCHAR)
- avatar_url (TEXT)
- role (ENUM: admin, moderator, user)
- phone (VARCHAR)
- is_locked (BOOLEAN)
- events_attended (INTEGER)
- created_at, updated_at, last_login (TIMESTAMP)
```

#### Events
```sql
- id (UUID, Primary Key)
- title (VARCHAR)
- description (TEXT)
- start_time, end_time (TIMESTAMP)
- location (VARCHAR)
- image_url (TEXT)
- is_public (BOOLEAN)
- max_participants (INTEGER)
- created_by (UUID, Foreign Key)
- category_id (UUID, Foreign Key)
- status (ENUM: pending, approved, rejected, cancelled)
- rejection_reason (TEXT)
- cancellation_reason (TEXT)
- average_rating (DECIMAL)
- total_ratings (INTEGER)
- created_at, updated_at (TIMESTAMP)
```

#### Participants
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key)
- event_id (UUID, Foreign Key)
- qr_code (VARCHAR, Unique)
- joined_at (TIMESTAMP)
- checked_in (BOOLEAN)
- check_in_time (TIMESTAMP)
```

#### Ratings
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key)
- event_id (UUID, Foreign Key)
- rating (INTEGER, 1-5)
- review (TEXT)
- created_at, updated_at (TIMESTAMP)
```

### Bảng bổ sung

- **Categories**: Danh mục sự kiện
- **Event Images**: Hình ảnh sự kiện
- **Notifications**: Thông báo
- **User Sessions**: Phiên đăng nhập
- **Audit Logs**: Nhật ký kiểm toán

### Views

- **event_statistics**: Thống kê sự kiện
- **user_statistics**: Thống kê người dùng
- **upcoming_events**: Sự kiện sắp diễn ra
- **popular_events**: Sự kiện phổ biến
- **category_statistics**: Thống kê theo danh mục

## MongoDB Collections

### Comments
```javascript
{
  _id: ObjectId,
  eventId: String,        // UUID từ PostgreSQL
  userId: String,         // UUID từ PostgreSQL
  content: String,
  parentId: String,       // ID comment gốc
  isHidden: Boolean,
  likes: Number,
  dislikes: Number,
  createdAt: Date,
  replies: [Comment]      // Nested replies
}
```

### User Activities
```javascript
{
  _id: ObjectId,
  userId: String,
  activityType: String,   // login, view_event, join_event, etc.
  eventId: String,        // Optional
  metadata: {
    ipAddress: String,
    userAgent: String,
    location: Object,
    device: Object
  },
  timestamp: Date
}
```

### Event Analytics
```javascript
{
  _id: ObjectId,
  eventId: String,
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
  demographics: Object,
  traffic: Object
}
```

### System Logs
```javascript
{
  _id: ObjectId,
  level: String,          // error, warn, info, debug
  message: String,
  service: String,        // auth, events, notifications
  userId: String,         // Optional
  eventId: String,        // Optional
  stack: String,          // Stack trace
  metadata: Object,
  timestamp: Date
}
```

### Notifications Queue
```javascript
{
  _id: ObjectId,
  userId: String,
  type: String,           // email, push, sms
  template: String,
  data: Object,
  priority: String,       // low, normal, high, urgent
  status: String,         // pending, sent, failed
  scheduledAt: Date,
  sentAt: Date,
  attempts: Number,
  maxAttempts: Number,
  error: String,
  createdAt: Date
}
```

### Search Index
```javascript
{
  _id: ObjectId,
  eventId: String,
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
  searchText: String,     // Combined text for full-text search
  createdAt: Date,
  updatedAt: Date
}
```

### User Preferences
```javascript
{
  _id: ObjectId,
  userId: String,
  preferences: {
    notifications: Object,
    privacy: Object,
    display: Object,
    interests: [String],
    locations: [Object]
  },
  updatedAt: Date
}
```

## Cài đặt và Thiết lập
### Yêu cầu cài đặt 
- MongoDB
  https://www.youtube.com/watch?v=aaspCQmBUbg - link hướng dẫn
- PostgreSQL
  https://www.youtube.com/watch?v=4qH-7w5LZsA - link hướng dẫn
*NOTE: Phải cài đặt cả hai để setup.js chạy ổn định
### 1. Cài đặt Dependencies

```bash
cd database
npm install pg mongodb
```

### 2. Cấu hình Environment Variables

Copy file `.env.example` thành `.env` và cập nhật các giá trị:

```bash
cp .env.example .env
```

### 3. Chạy Setup Script

```bash
node scripts/setup.js
```

Script này sẽ:
- Chạy tất cả PostgreSQL migrations
- Tạo indexes cho MongoDB
- Seed dữ liệu mẫu cho cả hai database

* NOTE: Nếu lỗi db Postgre không kết nối tới DATABASE thì thay đổi trong database/config/database.js
```bash
// Database Configuration
// Cấu hình kết nối cho PostgreSQL và MongoDB

import { Pool } from 'pg';
import { MongoClient, ObjectId } from 'mongodb';

// PostgreSQL Configuration
const postgresConfig = {
  host: process.env.POSTGRES_HOST || 'localhost', //CHANGE HERE
  port: process.env.POSTGRES_PORT || 5432,    //CHANGE HERE
  database: process.env.POSTGRES_DB || 'event_management', // CHANGE HERE
  user: process.env.POSTGRES_USER || 'postgres',  // CHANGE HERE
  password: process.env.POSTGRES_PASSWORD || 'password', // CHANGE HERE 
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// MongoDB Configuration
const mongoConfig = {
  url: process.env.MONGODB_URL || 'mongodb://localhost:27017', // CHANGE LOCALHOST TO 127.0.0.1 IF YOUR MONGGODB SETUP DEFAULT 
  database: process.env.MONGODB_DB || 'event_management',    
  options: {
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000 // Close sockets after 45 seconds of inactivity
    // bufferMaxEntries: 0, // Disable mongoose buffering
    // bufferCommands: false, // Disable mongoose buffering
  }
};
```
- Link lỗi: https://stackoverflow.com/questions/69878173/scram-server-first-message-client-password-must-be-a-string 
### 4. Kiểm tra kết nối

```javascript
const { checkDatabaseHealth } = require('./database/config/database');

const health = await checkDatabaseHealth();
console.log(health);
```

## Sử dụng trong Application

### PostgreSQL Queries

```javascript
const { getPostgresPool } = require('./database/config/database');

const pool = getPostgresPool();
const result = await pool.query('SELECT * FROM events WHERE status = $1', ['approved']);
```

### MongoDB Operations

```javascript
const { getMongoDB } = require('./database/config/database');

const db = getMongoDB();
const comments = await db.collection('comments').find({ eventId: 'event-uuid' }).toArray();
```

## Tối ưu hóa Performance

### PostgreSQL
- Sử dụng indexes cho các trường thường xuyên query
- Sử dụng views cho các query phức tạp
- Connection pooling
- Prepared statements

### MongoDB
- Compound indexes cho queries phức tạp
- Text indexes cho full-text search
- TTL indexes cho data có thời hạn
- Aggregation pipeline cho analytics

## Backup và Recovery

### PostgreSQL
```bash
# Backup
pg_dump -h localhost -U postgres event_management > backup.sql

# Restore
psql -h localhost -U postgres event_management < backup.sql
```

### MongoDB
```bash
# Backup
mongodump --db event_management --out backup/

# Restore
mongorestore --db event_management backup/event_management/
```

## Monitoring và Maintenance

### PostgreSQL
- Monitor connection pool usage
- Check slow queries
- Analyze table statistics
- Vacuum và reindex định kỳ

### MongoDB
- Monitor memory usage
- Check index usage
- Analyze query performance
- Compact collections định kỳ

## Security

### PostgreSQL
- Sử dụng SSL trong production
- Role-based access control
- Prepared statements để tránh SQL injection
- Regular security updates

### MongoDB
- Authentication và authorization
- Network encryption
- Input validation
- Regular security audits

## Scaling

### PostgreSQL
- Read replicas cho read-heavy workloads
- Connection pooling
- Query optimization
- Partitioning cho large tables

### MongoDB
- Sharding cho horizontal scaling
- Replica sets cho high availability
- Caching với Redis
- CDN cho static assets
