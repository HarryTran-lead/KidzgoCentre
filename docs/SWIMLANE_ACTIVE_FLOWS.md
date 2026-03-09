# Swimlane - Active API Flows (Web)

Mục tiêu tài liệu:
- Chỉ liệt kê các luồng đã gắn API thật và đang chạy trên web.
- Dùng trực tiếp để vẽ swimlane.

Định dạng chuẩn:
- `Step | Actor | UI Action | API | System Decision | Output | Exception`

---

## 1) Login + Profile Switch

| Step | Actor | UI Action | API | System Decision | Output | Exception |
|---|---|---|---|---|---|---|
| 1 | User | Nhập email/password, bấm Login | `POST /api/auth/login` | Validate credential, issue token/session | Login success, token lưu local/cookie | 401 sai mật khẩu, account inactive |
| 2 | FE | Tải profile liên kết | `GET /api/auth/profile` | Trả list profile theo account | Danh sách Parent/Student/... | 401 token hết hạn |
| 3 | User | Chọn Student profile | `POST /api/auth/profile/select-student` | Set active student context | Vào Student portal | 400 profile không thuộc account |
| 4 | User | Chọn Parent profile + nhập PIN | `POST /api/auth/profile/verify-parent-pin` | Verify PIN parent profile | Vào Parent portal | 403 sai PIN |
| 5 | FE | Token hết hạn, tự refresh | `POST /api/auth/refresh-token` | Rotate token | Tiếp tục phiên | Refresh fail -> logout |

---

## 2) Lead -> Placement -> Enrollment

| Step | Actor | UI Action | API | System Decision | Output | Exception |
|---|---|---|---|---|---|---|
| 1 | Visitor/Staff | Tạo lead | `POST /api/leads/public` hoặc `POST /api/leads` | Chuẩn hóa contact | Lead record tạo | Duplicate lead |
| 2 | Staff | Xem/lọc lead | `GET /api/leads` | Filter theo status/staff/SLA | Danh sách xử lý | 403 scope |
| 3 | Staff | Gán lead | `POST /api/leads/{id}/assign` hoặc `.../self-assign` | Kiểm tra quyền assign | Lead owner cập nhật | Conflict owner |
| 4 | Staff | Thêm note/children | `POST /api/leads/{id}/notes`, `.../children` | Validate dữ liệu | Timeline lead đầy đủ | Validation lỗi |
| 5 | Staff | Tạo placement test | `POST /api/placement-tests` | Tạo lịch test | Test created | Thiếu thông tin bắt buộc |
| 6 | Staff/Teacher | Nhập kết quả test | `POST /api/placement-tests/{id}/results` | Đánh giá mức phù hợp | Placement completed | Status test không hợp lệ |
| 7 | Staff | Convert to enrolled | `POST /api/placement-tests/{id}/convert-to-enrolled` | Map sang enrollment | Enrollment mới | Mapping fail |
| 8 | Staff | Quản lý enrollment lifecycle | `POST/PATCH /api/enrollments`, `.../pause/drop/reactivate` | Validate state transition | Enrollment cập nhật | Transition invalid |
| 9 | Staff | Gán tuition plan | `POST /api/enrollments/{id}/assign-tuition-plan` | Kiểm tra plan | Enrollment có tuition | Plan không tồn tại |

---

## 3) Leave Request + Makeup Credit

| Step | Actor | UI Action | API | System Decision | Output | Exception |
|---|---|---|---|---|---|---|
| 1 | Parent/Staff | Tạo đơn xin nghỉ | `POST /api/leave-requests` | Rule 24h + loại nghỉ | Request created | Thiếu session/date |
| 2 | Parent/Staff | Xem đơn nghỉ | `GET /api/leave-requests` | Filter theo student/status/date | Danh sách đơn | Scope mismatch |
| 3 | Staff | Duyệt đơn | `POST /api/leave-requests/{id}/approve` | Check status hiện tại | Approved | Already handled |
| 4 | Staff | Từ chối đơn | `POST /api/leave-requests/{id}/reject` | Check trạng thái | Rejected | State invalid |
| 5 | FE | Load makeup credits | `GET /api/makeup-credits`, `/all`, `/students` | Aggregate usable/expired | Danh sách credit | 404 student |
| 6 | Parent/Staff | Lấy gợi ý buổi bù | `GET /api/makeup-credits/{id}/suggestions` | Match lịch/lớp | Danh sách session | No slot |
| 7 | Parent/Staff | Chốt dùng credit | `POST /api/makeup-credits/{id}/use` | Kiểm tra hạn + slot | Credit consumed | Credit expired/slot full |
| 8 | Staff | Expire credit | `POST /api/makeup-credits/{id}/expire` | Check expiry policy | Credit expired | Already used |

---

## 4) Teacher Attendance + Session Report

| Step | Actor | UI Action | API | System Decision | Output | Exception |
|---|---|---|---|---|---|---|
| 1 | Teacher | Mở timetable | `GET /api/teacher/timetable` | Scope theo teacher + branch | Session list | 403 |
| 2 | Teacher | Mở session detail | `GET /api/sessions/{id}` | Validate quyền lớp | Session detail | Not found |
| 3 | Teacher | Nộp điểm danh | `POST/PUT` qua route teacher attendance | Set actual attendance + actual teacher | Attendance saved | Session locked |
| 4 | Teacher | Tạo session note | `POST /api/teacher/session-reports` | Validate student/session mapping | Report created | Duplicate note |
| 5 | Teacher | Sửa session note | `PUT /api/teacher/session-reports/{id}` | Check owner/scope | Report updated | Forbidden |

---

## 5) Homework (Teacher -> Student)

| Step | Actor | UI Action | API | System Decision | Output | Exception |
|---|---|---|---|---|---|---|
| 1 | Teacher | Lấy lớp/session để giao bài | `GET /api/classes`, `GET /api/sessions...` | Scope theo teacher | Form options | 403 |
| 2 | Teacher | Tạo homework | `POST /api/homework` | Validate class/session/dueDate | Homework created | Validation fail |
| 3 | Teacher | Xem danh sách homework | `GET /api/homework` | Filter class/status | Homework list | Timeout |
| 4 | Teacher | Xem/chấm bài nộp | `GET /api/homework/{id}` + update | Check grading permission | Grade + feedback | Invalid score |
| 5 | Teacher | Sửa/xóa homework | `PATCH/DELETE /api/homework/{id}` | Check trạng thái cho phép | Homework updated/deleted | State locked |
| 6 | Student | Xem bài được giao | `GET /api/students/homework/*` | Scope theo active student | Assignment list/detail | No active profile |
| 7 | Student | Nộp bài | `POST /api/students/homework/submit` | Kiểm tra deadline/format | Submission created | File invalid/late |

---

## 6) Admin Governance (User/Branch/Profile)

| Step | Actor | UI Action | API | System Decision | Output | Exception |
|---|---|---|---|---|---|---|
| 1 | Admin | Xem users | `GET /api/admin/users` | RBAC admin | User list | Forbidden |
| 2 | Admin | Tạo/sửa user | `POST/PATCH /api/admin/users` | Validate role/email | User upsert | Duplicate email |
| 3 | Admin | Assign branch cho user | `POST /api/admin/users/{id}/assign-branch` | Check branch tồn tại | Branch assigned | Invalid branch |
| 4 | Admin | Đổi PIN user nội bộ | `POST /api/admin/users/{id}/change-pin` | PIN policy | PIN changed | Weak PIN |
| 5 | Admin | Active/Inactive user | `POST /api/admin/users/{id}/status` | Transition status | Status updated | Conflict |
| 6 | Admin | Quản lý branch | `GET/POST/PATCH /api/branches`, `/{id}/status` | Validate branch code | Branch lifecycle | Duplicate code |
| 7 | Admin | Quản lý profile + link | `GET/POST/PATCH /api/profiles`, `link/unlink` | Validate relation | Profile graph cập nhật | Link conflict |

---

## 7) Admin Academic Setup (Class/Room/Course/Schedule)

| Step | Actor | UI Action | API | System Decision | Output | Exception |
|---|---|---|---|---|---|---|
| 1 | Admin | CRUD class | `GET/POST/PATCH /api/classes`, `/{id}` | Validate program/teacher/branch | Class saved | Schedule conflict |
| 2 | Admin | Toggle class status | `POST /api/classes/{id}/status` | Active/inactive rules | Status updated | Invalid transition |
| 3 | Admin | CRUD program/course | `GET/POST/PATCH /api/programs` | Validate curriculum | Program updated | Duplicate |
| 4 | Admin | Toggle room status | `POST /api/classrooms/{id}/toggle-status` | Check availability | Room status changed | Room busy |
| 5 | Admin | Quản lý sessions | `GET/POST/PATCH /api/sessions...` | Conflict detection | Timetable updated | Clash detected |

---

## 8) Blog + Document

| Step | Actor | UI Action | API | System Decision | Output | Exception |
|---|---|---|---|---|---|---|
| 1 | Admin | CRUD blog | `GET/POST/PATCH/DELETE /api/blogs` | Validate content | Blog saved | Validation |
| 2 | Admin | Publish/Unpublish | `POST /api/blogs/{id}/publish|unpublish` | Status transition | Public visibility đổi | Invalid state |
| 3 | User | Xem blog public | `GET /api/blogs/published` | Chỉ lấy published | Public list | Empty list |
| 4 | Admin | CRUD document | `GET/POST/PATCH/DELETE /api/documents*` | Validate metadata/file | Document saved | Upload lỗi |

---

## 9) Parent Timetable

| Step | Actor | UI Action | API | System Decision | Output | Exception |
|---|---|---|---|---|---|---|
| 1 | Parent | Mở lịch học | `GET /api/parent/timetable` | Scope theo profile con | Timetable | No profile selected |
| 2 | Parent | Lọc theo thời gian | endpoint trên với query params | Query filter | Lịch theo điều kiện | Empty list |

---

## 10) Staff Management - Makeup Console

| Step | Actor | UI Action | API | System Decision | Output | Exception |
|---|---|---|---|---|---|---|
| 1 | Staff Ops | Load request + credits | `GET /api/leave-requests`, `GET /api/makeup-credits*` | Join leave-credit-session | Bảng xử lý makeup | Partial data |
| 2 | Staff Ops | Approve/Reject request | `POST /api/leave-requests/{id}/approve|reject` | Rule + status check | Request updated | Already handled |
| 3 | Staff Ops | Reload used credits | `GET /api/makeup-credits`, `/students` | Remap class/student/session | Used credits list | ID mismatch |

---

## Phần chưa tính là “active API flow”

Các màn hiện còn mock/demo, không đưa vào swimlane “đang hoạt động API thật”:
- `app/[locale]/portal/staff-management/monthly-report/page.tsx` (dữ liệu cứng + alert demo)
- nhiều màn parent như `payment`, `media`, `tests`, `support` vẫn có `MOCK_*`

---

## Gợi ý vẽ swimlane

- Lanes tối thiểu: `Actor UI`, `Portal FE`, `Next API (/api/*)`, `Backend Service`, `Policy/Rule`, `Output Channel`.
- Đặt decision node tại các điểm: RBAC/branch scope, status transition, rule 24h, deadline homework.

