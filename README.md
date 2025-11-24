
# Đồ án quản lý sự kiện - Event Management
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
---

## Giới thiệu

Project quản lý sự kiện được xây dựng nhằm:

- Tạo nền tảng trực tuyến để tổ chức và quản lý sự kiện.
- Hỗ trợ đăng ký/đăng nhập, phân quyền theo vai trò (Admin, Moderator, User).
- Người dùng có thể tạo sự kiện, tham gia, điểm danh bằng QR code.
- Sau sự kiện, người tham gia có thể bình luận, đánh giá và tích lũy điểm.
- Cung cấp thống kê chi tiết cho cả ban tổ chức và người tham gia.
- Triển khai trên nền tảng web, hướng tới mở rộng mobile app trong tương lai.

### Các yêu cầu chính

- **Quản lý người dùng & phân quyền**: Đăng ký, đăng nhập, quản lý hồ sơ, vai trò (Admin, Moderator, User).
- **Quản lý sự kiện**: Tạo, duyệt, tìm kiếm, đăng ký tham gia sự kiện.
- **Điểm danh QR code**: Quét mã để xác nhận tham gia.
- **Bình luận & đánh giá**: Người tham gia có thể để lại feedback.
- **Thống kê & báo cáo**: Số liệu người tham gia, độ hài lòng, lịch sử sự kiện.

---

### Công nghệ sử dụng

* [![React][React.js]][React-url] – Frontend  
* [![Node.js][Node.js]][Node-url] – Backend (ExpressJS)  
* [![PostgreSQL][PostgreSQL]][PostgreSQL-url] – Database  
* [![MongoDB][MongoDB]][MongoDB-url] – Database phụ trợ  
* [![Redis][Redis]][Redis-url] – Cache / Session store  
* [![TypeScript][TypeScript]][TypeScript-url] – Static typing  
* [![Swagger][Swagger]][Swagger-url] – API Documentation  
* [![QR Code][QRCode]][QRCode-url] – QR Code generator  
---
## Bắt đầu

Hướng dẫn để chạy dự án trên máy local.

### Yêu cầu hệ thống (phiên bản mới nhất càng tốt)
- Node.js (>=18)
- npm (>=9)
- PostgreSQL (>=14)
- MongoDB 
- Redis
- git (để clone mã nguồn)

### Cài đặt

1. Clone repository:
   ```bash
   git clone https://github.com/tynnp/event_management.git
   cd event_management
   ```
2. Cài đặt Database (PostgreSQL + MongoDB):
   Tham khảo hướng dẫn chi tiết trong thư mục [`database/`](database/README.md).
3. Cài đặt Backend (server):
   Tham khảo hướng dẫn chi tiết trong thư mục [`server/`](server/README.md).
4. Cài đặt Frontend (client):
   ```bash
   cd client
   npm install
   npm run dev
   ```
---

## Sử dụng

- Admin quản lý thông số liệu toàn bộ quá trình của Moderator và User
- Moderator có quyền quản lý sự kiện 
- Người dùng có thể đăng ký, tham gia, bình luận và đánh giá sự kiện.
- QR Code được tạo cho mỗi người tham gia → quét để điểm danh.
- Xem thống kê và báo cáo sau khi sự kiện kết thúc.
---

## Lộ trình

- [x] Đăng ký / Đăng nhập / Phân quyền
- [x] Quản lý sự kiện (tạo, duyệt, tham gia)
- [x] Điểm danh bằng QR Code
- [x] Bình luận & đánh giá
- [x] Thống kê & báo cáo nâng cao
- [ ] Mobile App (React Native)

---

## Đóng góp

Đóng góp luôn được hoan nghênh!

1. Fork dự án
2. Tạo nhánh mới (git checkout -b feature/somethingfun)
3. Commit thay đổi (git commit -m 'Add somethingfun')
4. Push (git push origin feature/somethingfun)
5. Tạo Pull Request

Cảm ơn những người đã đóng góp cho dự án này.

## License
Distributed under the MIT License. See `LICENSE.txt` for more information.

## Liên hệ

Nhóm phát triển tynnp.dhsp@gmail.com (Tỷ Phú A.K.A của Project)

Link project: [https://github.com/tynnp/event_management](https://github.com/tynnp/event_management)

[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/

[Node.js]: https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white
[Node-url]: https://nodejs.org/

[PostgreSQL]: https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white
[PostgreSQL-url]: https://www.postgresql.org/

[MongoDB]: https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white
[MongoDB-url]: https://www.mongodb.com/

[Redis]: https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white
[Redis-url]: https://redis.io/

[TypeScript]: https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/

[Swagger]: https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black
[Swagger-url]: https://swagger.io/

[QRCode]: https://img.shields.io/badge/QR%20Code-000000?style=for-the-badge&logo=qrcode&logoColor=white
[QRCode-url]: https://www.npmjs.com/package/qrcode.react

[contributors-shield]: https://img.shields.io/github/contributors/tynnp/event_management.svg?style=for-the-badge
[contributors-url]: https://github.com/tynnp/event_management/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/tynnp/event_management.svg?style=for-the-badge
[forks-url]: https://github.com/tynnp/event_management/network/members
[stars-shield]: https://img.shields.io/github/stars/tynnp/event_management.svg?style=for-the-badge
[stars-url]: https://github.com/tynnp/event_management/stargazers
[issues-shield]: https://img.shields.io/github/issues/tynnp/event_management.svg?style=for-the-badge

[issues-url]: https://github.com/tynnp/event_management/issues


