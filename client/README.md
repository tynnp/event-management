# Hướng dẫn cài đặt và chạy Client

Ứng dụng client được xây dựng bằng React + TypeScript (Vite) và Tailwind CSS.

## Yêu cầu hệ thống
- Node.js >= 18
- npm >= 9 (hoặc dùng pnpm/yarn nếu bạn quen)
- Quyền truy cập Internet để cài đặt phụ thuộc (dependencies)

Kiểm tra phiên bản:

```bash
node -v
npm -v
```

## Cài đặt
1. Mở terminal (PowerShell trên Windows) tại thư mục dự án `client/`:
   ```bash
   cd client
   ```
2. Cài đặt dependencies:
   ```bash
   npm install
   ```

## Chạy môi trường phát triển
- Chạy dev (Vite):
  ```bash
  npm run dev
  ```
- Mặc định Vite chạy ở `http://localhost:5173` (terminal sẽ hiển thị URL chính xác).

## Build sản phẩm
- Tạo bản build tối ưu:
  ```bash
  npm run build
  ```
- Xem thử bản build:
  ```bash
  npm run preview
  ```

## Cấu trúc quan trọng
- `src/` chứa mã nguồn React (components, context, types,...)
- `index.html` điểm vào của ứng dụng Vite
- `tailwind.config.js` cấu hình Tailwind CSS
- `tsconfig*.json` cấu hình TypeScript
- `public/` chứa tài nguyên tĩnh (ví dụ: `default-avatar.png`)

## Thiết lập môi trường (tùy chọn)
Ứng dụng client không yêu cầu biến môi trường bắt buộc trong thư mục `client/` theo mặc định.
Nếu backend chạy ở cổng/địa chỉ khác, cập nhật hằng số/endpoint trong mã nguồn nơi bạn gọi API (ví dụ bên trong các controller phía server hoặc các service gọi API trong client nếu có).

## Lệnh hữu ích
- Kiểm tra và sửa lỗi lint (nếu đã cấu hình script):
  ```bash
  npm run lint
  ```

## Lỗi thường gặp
- Node quá cũ: hãy nâng cấp Node.js >= 18.
- Port 5173 bị chiếm: bật dev server sẽ đề xuất cổng khác; chấp nhận hoặc đóng tiến trình đang chiếm cổng.
- Lỗi quyền trên Windows PowerShell khi chạy script: thử chạy PowerShell với quyền Administrator hoặc dùng Git Bash.

## Gợi ý phát triển
- Sử dụng VS Code với các tiện ích: ESLint, Tailwind CSS IntelliSense.
- Bật format-on-save để giữ code nhất quán.

---
Nếu bạn gặp vấn đề khi cài đặt/chạy, vui lòng cung cấp log lỗi trong terminal để hỗ trợ nhanh hơn.
