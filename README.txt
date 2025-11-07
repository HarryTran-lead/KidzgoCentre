KidzGo Roles (ACCOUNTANT & MANAGEMENT) — Drop-in for Next.js App Router
----------------------------------------------------------------------
Thêm 2 role mới:
- ACCOUNTANT (Kế toán): /portal/accountant/*
- MANAGEMENT (Vận hành): /portal/management/*

Cấu trúc:
- lib/roles.ts (bổ sung ROLES, ALL_ROLES, ACCESS_MAP)
- components/accountant/Sidebar.tsx
- app/portal/accountant/(layout + các trang con)
- components/management/Sidebar.tsx
- app/portal/management/(layout + các trang con)

Yêu cầu:
- Tailwind + lucide-react đã cài (nếu thiếu: npm i lucide-react)

Routing bảo vệ:
- Dùng proxy.ts theo hướng dẫn trước đó; chỉ cần đảm bảo ACCESS_MAP chứa 2 prefix:
  "/portal/accountant" và "/portal/management".
- Không để middleware.ts (Next 16 dùng proxy.ts).

Sau khi dán:
- rm -rf .next && npm run dev
- Truy cập: /portal/accountant hoặc /portal/management (cookie role phải là ACCOUNTANT/MANAGEMENT hoặc ADMIN)
