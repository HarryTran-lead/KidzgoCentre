KidzGo Staff Module (Next.js App Router)
----------------------------------------
Cách dùng:
1) Giải nén ZIP này vào thư mục gốc của dự án (my-center-fe).
   - Nếu đã có 'middleware.ts', hãy gộp logic bảo vệ '/staff' vào file hiện có thay vì ghi đè.
2) Cài icon nếu chưa có: npm i lucide-react
3) Chạy dev: npm run dev
4) Truy cập: http://localhost:3000/staff

Middleware mặc định đọc cookie 'role' và chỉ cho phép STAFF/ADMIN vào /staff.
