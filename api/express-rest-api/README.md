# Express REST API

Dự án này là một RESTful API được xây dựng bằng Node.js và Express, nhằm quản lý người dùng, quản lý sự kiện, điểm danh QR, bình luận & đánh giá, và báo cáo thống kê.

## Features

- **Quản lý người dùng**
  - Đăng ký
  - Đăng nhập
  - Phân quyền
  - Quản lý hồ sơ (profile)

- **Quản lý sự kiện**
  - Tạo, đọc, sửa, xoá (CRUD) sự kiện
  - Xem danh sách sự kiện

- **Điểm danh QR**
  - Điểm danh bằng mã QR
  - Lấy danh sách điểm danh

- **Hệ thống bình luận và đánh giá**
  - Thêm, xem, xoá bình luận
  - Thêm, xem, xoá đánh giá

- **Báo cáo thống kê**
  - Thống kê người dùng và sự kiện

## Project Structure

```
express-rest-api
├── src
│   ├── app.js
│   ├── controllers
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── eventController.js
│   │   ├── attendanceController.js
|   |   |-- emailVerificationController.js
│   │   ├── commentController.js
│   │   ├── reviewController.js
│   │   └── statsController.js
│   ├── routes
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── eventRoutes.js
│   │   ├── attendanceRoutes.js
│   │   ├── commentRoutes.js
│   │   ├── reviewRoutes.js
│   │   └── statsRoutes.js
|   |   |__ emailRoutes.js
│   ├── models
│   │   ├── User.js
│   │   ├── Event.js
│   │   ├── Attendance.js
│   │   ├── Comment.js
│   │   ├── Review.js
│   │   └── Stats.js
│   ├── middleware
│   │   ├── authMiddleware.js
│   │   ├── errorHandler.js
│   │   └── validateMiddleware.js
│   ├── utils
|   |   |__ emailService.js
│   │   ├── qrGenerator.js
│   │   └── statistics.js
│   └── config
│       └── database.js
|       |__ redis.js
├── package.json
├── .env.example
└── README.md
```

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd express-rest-api
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Set up environment variables by copying `.env.example` to `.env` and updating the values as needed.

## Usage

To start the server, run:
```
npm start
```

The API will be available at `http://localhost:5000`.
