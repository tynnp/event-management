# Express REST API

This project is a RESTful API built with Node.js and Express, designed to manage user functionalities, event management, attendance tracking, comments and reviews, and statistical reporting.

## Features

- **User Management**
  - Registration
  - Login
  - Authorization
  - Profile management

- **Event Management**
  - Create, Read, Update, Delete (CRUD) events
  - Event browsing

- **QR Attendance**
  - Mark attendance using QR codes
  - Retrieve attendance records

- **Comment and Review Systems**
  - Add, retrieve, and delete comments
  - Add, retrieve, and delete reviews

- **Statistical Reporting**
  - Generate reports on user and event statistics

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
│   │   ├── qrGenerator.js
│   │   └── statistics.js
│   └── config
│       └── database.js
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

## License

This project is licensed under the MIT License.
