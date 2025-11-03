# Teacher UI Starter (Next.js App Router)

Thêm giao diện **giảng viên** khớp style Admin.

## Cách dùng

1) Giải nén vào root project `my-center-fe` (giữ nguyên cấu trúc thư mục).
   - Tạo các thư mục:
     - `/app/teacher/...`
     - `/components/teacher/...`

2) Cài thêm packages nếu chưa có:
```bash
npm i lucide-react clsx
```

3) Chạy dev:
```bash
npm run dev
```

## Ghi chú
- Layout import `../globals.css` (mặc định Next App Router tạo ở `/app/globals.css`).
- Nếu màu số liệu bị nhạt, `StatCard` đã set `text-black` cho phần số `value`.
- Không tạo component bên trong hàm render, tránh lỗi: *Cannot create components during render*.
