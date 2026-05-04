# QA Failed Routes Detail (26)

Nguon du lieu: [QA_WEB_SWEEP_REPORT.md](QA_WEB_SWEEP_REPORT.md#L1)

## Tong quan

- Tong route fail: 26
- Nhom A (2 route): redirect loi co `undefined` trong URL
- Nhom B (24 route): bi chuyen sang `/vi/403` (khong dung role hoac mapping role-prefix)

## Uu tien sua

1. P0: Sua 2 route Admin bi redirect `undefined` (anh huong truc tiep dieu huong).
2. P1: Kiem tra mapping role Parent va legacy Staff trong guard route.
3. P2: Chot policy cho legacy Staff (`/portal/staff/*`) de test expectation khop business.

## Chi tiet 26 route fail

| STT | Route | Role | Loi thuc te | Nhom nguyen nhan | Goi y fix nhanh |
|---:|---|---|---|---|---|
| 1 | `/{locale}/portal/admin/center` | Admin | Redirect den `http://127.0.0.1:3000/vi/undefined/portal/admin` | A | Sua xu ly `params.locale` async trong [app/[locale]/portal/admin/center/page.tsx](app/[locale]/portal/admin/center/page.tsx). |
| 2 | `/{locale}/portal/admin/teachers` | Admin | Redirect den `http://127.0.0.1:3000/vi/undefined/portal/admin/accounts` | A | Sua xu ly `params.locale` async trong [app/[locale]/portal/admin/teachers/page.tsx](app/[locale]/portal/admin/teachers/page.tsx). |
| 3 | `/{locale}/portal/parent` | Parent | Redirect `403` ngoai du kien | B | Kiem tra role cookie/JWT sau chon profile Parent va mapping prefix trong [proxy.ts](proxy.ts). |
| 4 | `/{locale}/portal/parent/account` | Parent | Redirect `403` ngoai du kien | B | Tuong tu route 3; doi chieu ACCESS_MAP trong [lib/role.ts](lib/role.ts). |
| 5 | `/{locale}/portal/parent/approvals` | Parent | Redirect `403` ngoai du kien | B | Tuong tu route 3; verify role normalization Parent. |
| 6 | `/{locale}/portal/parent/attendance` | Parent | Redirect `403` ngoai du kien | B | Tuong tu route 3; verify cookie `role` va prefix `/{locale}/portal/parent`. |
| 7 | `/{locale}/portal/parent/attendance-history` | Parent | Redirect `403` ngoai du kien | B | Tuong tu route 3. |
| 8 | `/{locale}/portal/parent/enrollment-pause` | Parent | Redirect `403` ngoai du kien | B | Tuong tu route 3. |
| 9 | `/{locale}/portal/parent/gamification` | Parent | Redirect `403` ngoai du kien | B | Tuong tu route 3. |
| 10 | `/{locale}/portal/parent/homework` | Parent | Redirect `403` ngoai du kien | B | Tuong tu route 3. |
| 11 | `/{locale}/portal/parent/media` | Parent | Redirect `403` ngoai du kien | B | Tuong tu route 3. |
| 12 | `/{locale}/portal/parent/notifications` | Parent | Redirect `403` ngoai du kien | B | Tuong tu route 3. |
| 13 | `/{locale}/portal/parent/payment` | Parent | Redirect `403` ngoai du kien | B | Tuong tu route 3. |
| 14 | `/{locale}/portal/parent/profile` | Parent | Redirect `403` ngoai du kien | B | Tuong tu route 3. |
| 15 | `/{locale}/portal/parent/progress` | Parent | Redirect `403` ngoai du kien | B | Tuong tu route 3. |
| 16 | `/{locale}/portal/parent/schedule` | Parent | Redirect `403` ngoai du kien | B | Tuong tu route 3. |
| 17 | `/{locale}/portal/parent/support` | Parent | Redirect `403` ngoai du kien | B | Tuong tu route 3. |
| 18 | `/{locale}/portal/parent/tests` | Parent | Redirect `403` ngoai du kien | B | Tuong tu route 3. |
| 19 | `/{locale}/portal/parent/tuition` | Parent | Redirect `403` ngoai du kien | B | Tuong tu route 3. |
| 20 | `/{locale}/portal/staff` | Need confirmation (legacy staff) | Redirect `403` ngoai du kien | B | Xac dinh route legacy co con duoc phep khong; neu co thi mo prefix trong [lib/role.ts](lib/role.ts) va guard trong [proxy.ts](proxy.ts). |
| 21 | `/{locale}/portal/staff/announcements` | Need confirmation (legacy staff) | Redirect `403` ngoai du kien | B | Tuong tu route 20. |
| 22 | `/{locale}/portal/staff/enrollments` | Need confirmation (legacy staff) | Redirect `403` ngoai du kien | B | Tuong tu route 20. |
| 23 | `/{locale}/portal/staff/enrollments/announcements` | Need confirmation (legacy staff) | Redirect `403` ngoai du kien | B | Tuong tu route 20. |
| 24 | `/{locale}/portal/staff/fees` | Need confirmation (legacy staff) | Redirect `403` ngoai du kien | B | Tuong tu route 20. |
| 25 | `/{locale}/portal/staff/reports` | Need confirmation (legacy staff) | Redirect `403` ngoai du kien | B | Tuong tu route 20. |
| 26 | `/{locale}/portal/staff/students` | Need confirmation (legacy staff) | Redirect `403` ngoai du kien | B | Tuong tu route 20. |

## Checklist sua loi de rerun

1. Fix redirect async params cho 2 page Admin:
   - [app/[locale]/portal/admin/center/page.tsx](app/[locale]/portal/admin/center/page.tsx)
   - [app/[locale]/portal/admin/teachers/page.tsx](app/[locale]/portal/admin/teachers/page.tsx)
2. Rasoat role guard:
   - [proxy.ts](proxy.ts)
   - [lib/role.ts](lib/role.ts)
3. Chot rule business cho legacy Staff:
   - Neu deprecate: doi expected test thanh deny-by-design.
   - Neu con ho tro: cap nhat ACCESS_MAP + cookie/session role mapping.
4. Rerun sweep:
   - `npm run test:e2e:sweep`

## Ghi chu

- Hien tai Student da quet PASS toan bo sau khi dang nhap va chon profile hoc sinh.
- File nay chi tap trung dung 26 route fail hien tai.
