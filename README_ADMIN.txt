# Admin Kit for my-center-fe

## Cách dán nhanh
1. Giải nén thư mục này vào gốc dự án `my-center-fe` (sẽ tạo các thư mục: `app/admin`, `components/admin`, `public/avatar-admin.png`).
2. Cài icon:
   ```bash
   npm i lucide-react
   ```
3. Chạy dev:
   ```bash
   npm run dev
   ```
4. Mở http://localhost:3000/admin để xem dashboard.

## Ghi chú
- Sidebar dùng logo tại `/public/image/LogoKidzgo.jpg` như bạn đã có sẵn.
- Có sẵn responsive: Sidebar trượt trên mobile, header cố định, layout 2 cột.
- Có thể tạo thêm các trang con: `app/admin/students/page.tsx` ... Sidebar sẽ tự highlight.
