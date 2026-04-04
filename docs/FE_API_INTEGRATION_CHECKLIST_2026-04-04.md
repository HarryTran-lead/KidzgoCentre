# FE API Integration Checklist

Ngày tạo: 2026-04-04

Giả định của tài liệu này:

- BE đã cung cấp đầy đủ request/response theo `docs/BE_API_HANDOFF_CHECKLIST_2026-04-04.md`
- Mục tiêu còn lại của FE là:
- bỏ local/mock ở những chỗ đang giả lập
- thêm `app/api/*` proxy và `lib/api/*Service` ở những module còn thiếu lớp FE trung gian
- nối page/component vào API thật

## 1. Ưu tiên làm ngay

### 1.1 Notifications broadcast history

- Trạng thái hiện tại:
- `app/api/notifications/broadcast/history/route.ts` đang đọc local file
- `app/api/notifications/broadcast/route.ts` đang append campaign vào `.data/notifications.json`
- FE task:
- đổi `broadcast/history` sang proxy BE thật
- bỏ logic local campaign store trong `broadcast/route.ts`
- `hooks/useNotifications.ts` giữ nguyên flow, chỉ đổi nguồn data sang backend
- File cần sửa:
- `app/api/notifications/broadcast/history/route.ts`
- `app/api/notifications/broadcast/route.ts`
- `app/api/_lib/notification-store.ts`
- `lib/api/notificationService.ts`
- `hooks/useNotifications.ts`

### 1.2 Class / Teacher / Homework contract cleanup

- Trạng thái hiện tại:
- `app/api/admin/classes.ts`, `app/api/teacher/classes.ts`, `lib/api/studentService.ts` còn nhiều fallback `0`, `Đang cập nhật`, `Chưa có`
- FE task:
- map lại đúng field mới từ BE
- bỏ fallback generate `id = Date.now()`
- bỏ fallback ghép field cũ của homework submission nếu BE đã chốt schema mới
- File cần sửa:
- `app/api/admin/classes.ts`
- `app/api/admin/programs.ts`
- `app/api/admin/rooms.ts`
- `app/api/admin/sessions.ts`
- `app/api/teacher/classes.ts`
- `app/api/teacher/timetable/route.ts`
- `lib/api/studentService.ts`

## 2. FE đã có proxy/service, chỉ cần nối UI

Các màn dưới đây không thiếu API ở lớp FE nữa, chủ yếu đang chưa gọi service thật hoặc còn hardcode UI.

### 2.1 Parent support

- Có sẵn:
- `app/api/tickets/**`
- `lib/api/ticketService.ts`
- FE task:
- thay `MOCK_TICKETS` ở page bằng ticket API thật
- nối create/list/detail/comment nếu BE đã mở quyền cho parent
- File:
- `app/[locale]/portal/parent/support/page.tsx`

### 2.2 Staff-management accounts

- Có sẵn:
- `app/api/admin/users/**`
- `lib/api/userService.ts`
- FE task:
- bỏ `ACCS` hardcode
- dùng `getAllUsers`, `updateUserStatus`
- map filter role/branch/search/last login
- File:
- `app/[locale]/portal/staff-management/accounts/page.tsx`

### 2.3 Parent / Student / Teacher basic profile

- Có sẵn:
- `app/api/profiles/**`
- `app/api/auth/change-password/route.ts`
- `lib/api/profileService.ts`
- `lib/api/authService.ts`
- FE task:
- nối data thật cho basic info
- nối update profile
- nối change password
- File:
- `app/[locale]/portal/parent/account/page.tsx`
- `app/[locale]/portal/student/profile/page.tsx`
- `app/[locale]/portal/teacher/profile/page.tsx`

### 2.4 Admin center summary

- Có sẵn:
- `app/api/dashboard/**`
- `lib/api/dashboardService.ts`
- FE task:
- bỏ `BRANCHES`, `revenueData`, `studentDistribution`, `attendanceData` hardcode
- map lại theo dashboard response
- File:
- `app/[locale]/portal/admin/center/page.tsx`

### 2.5 Templates page staff-management

- Có sẵn:
- `app/api/notifications/templates/**`
- `lib/api/notificationService.ts`
- FE task:
- bỏ `INIT` hardcode
- dùng template API thật
- File:
- `app/[locale]/portal/staff-management/templates/page.tsx`

### 2.6 Parent timetable / Student timetable

- Có sẵn:
- `app/api/parent/timetable/route.ts`
- `lib/api/parentScheduleService.ts`
- `app/api/students/timetable/route.ts`
- `lib/api/studentTimetableService.ts`
- FE task:
- ưu tiên reuse service thật ở các màn đang tự dựng schedule nếu phù hợp
- File:
- `app/[locale]/portal/parent/page.tsx`
- `app/[locale]/portal/student/page.tsx`
- `app/[locale]/portal/student/schedule/page.tsx`

## 3. FE còn thiếu app/api proxy hoặc lib/api service

Các mục dưới đây là chỗ “thiếu api” ở phía FE đúng nghĩa: BE có rồi nhưng trong repo hiện tại chưa có đủ lớp FE để gọi.

### 3.1 Parent overview

- Hiện trạng:
- constants có `PARENT_ENDPOINTS.OVERVIEW`
- chưa có `app/api/parent/overview/route.ts`
- chưa có `lib/api/parentOverviewService.ts`
- FE task:
- thêm proxy route
- thêm service
- nối `parent/page.tsx` và `ChildOverviewCard`

### 3.2 Parent invoices / payments / homework / progress / media / approvals / tests

- Hiện trạng:
- các page này vẫn hardcode/mock
- chưa thấy `app/api/parent/*` tương ứng
- chưa thấy `lib/api/*Service` tương ứng
- FE task:
- thêm proxy route + service cho:
- `parent/invoices`
- `parent/payments`
- `parent/homework`
- `parent/progress`
- `parent/media`
- `parent/approvals`
- `parent/tests`
- `parent/tests/:id`
- File UI:
- `app/[locale]/portal/parent/tuition/page.tsx`
- `app/[locale]/portal/parent/payment/page.tsx`
- `app/[locale]/portal/parent/homework/page.tsx`
- `app/[locale]/portal/parent/progress/page.tsx`
- `app/[locale]/portal/parent/media/page.tsx`
- `app/[locale]/portal/parent/approvals/page.tsx`
- `app/[locale]/portal/parent/tests/page.tsx`

### 3.3 Student dashboard / profile extras / reports / media / tests

- Hiện trạng:
- `student/page.tsx`, `student/reports/page.tsx`, `student/media/page.tsx`, `student/tests/**` vẫn static
- chưa có route/service riêng cho dashboard, reports, media, tests
- FE task:
- thêm proxy route + service cho:
- `student/dashboard`
- `student/profile` nếu BE tách riêng
- `student/reports`
- `student/media`
- `student/tests`
- `student/tests/:id`
- File UI:
- `app/[locale]/portal/student/page.tsx`
- `app/[locale]/portal/student/profile/page.tsx`
- `app/[locale]/portal/student/reports/page.tsx`
- `app/[locale]/portal/student/media/page.tsx`
- `app/[locale]/portal/student/tests/page.tsx`
- `app/[locale]/portal/student/tests/[id]/page.tsx`

### 3.4 Teacher dashboard / profile extras / timesheet

- Hiện trạng:
- `teacher/page.tsx`, `teacher/profile/page.tsx`, `teacher/timesheet/page.tsx` vẫn mock
- chưa có route/service riêng cho dashboard, profile stats, timesheet
- FE task:
- thêm proxy route + service cho:
- `teacher/dashboard`
- `teacher/profile`
- `teacher/timesheet`
- File UI:
- `app/[locale]/portal/teacher/page.tsx`
- `app/[locale]/portal/teacher/profile/page.tsx`
- `app/[locale]/portal/teacher/timesheet/page.tsx`

### 3.5 Admin finance modules

- Hiện trạng:
- `admin/cashbook`, `admin/fees`, `admin/payroll` đang static
- chưa có `app/api/finance/**`
- chưa có `lib/api/finance*Service`
- FE task:
- thêm proxy route + service cho:
- `finance/cashbook`
- `finance/fees`
- `finance/payroll`
- nếu BE gom vào dashboard thì thêm service đọc summary tương ứng
- File UI:
- `app/[locale]/portal/admin/cashbook/page.tsx`
- `app/[locale]/portal/admin/fees/page.tsx`
- `app/[locale]/portal/admin/payroll/page.tsx`

### 3.6 Admin extracurricular

- Hiện trạng:
- `admin/extracurricular/page.tsx` đang dùng `PROGRAMS` hardcode
- chưa có route/service tương ứng
- FE task:
- thêm proxy route + service cho extracurricular program CRUD/list

### 3.7 Staff dashboard / announcements / enrollments / fees / students

- Hiện trạng:
- các page dưới `portal/staff/**` phần lớn đang static
- chưa có route/service riêng
- FE task:
- thêm proxy route + service cho:
- `staff/dashboard`
- `staff/announcements`
- `staff/enrollments/pending`
- `staff/fees/summary`
- `staff/students`
- File UI:
- `app/[locale]/portal/staff/page.tsx`
- `app/[locale]/portal/staff/announcements/page.tsx`
- `app/[locale]/portal/staff/enrollments/page.tsx`
- `app/[locale]/portal/staff/fees/page.tsx`
- `app/[locale]/portal/staff/students/page.tsx`

### 3.8 Staff-accountant

- Hiện trạng:
- toàn bộ cụm `portal/staff-accountant/**` vẫn static, trừ notifications inbox
- chưa có finance routes/service tương ứng
- FE task:
- thêm proxy route + service cho:
- `finance/accountant/dashboard`
- `finance/dues`
- `finance/invoices`
- `finance/payos/*`
- `finance/adjustments`
- `finance/audit-logs`
- `finance/reports`

### 3.9 Staff-management students / media

- Hiện trạng:
- `staff-management/students/page.tsx`
- `staff-management/media/page.tsx`
- vẫn dùng local data
- chưa có route/service riêng
- FE task:
- thêm proxy route + service cho:
- `staff-management/students`
- `staff-management/media`

## 4. Danh sách route FE còn thiếu rõ ràng

Nếu BE đã xong API, FE hiện còn thiếu các route proxy sau trong `app/api`:

- `app/api/parent/overview/route.ts`
- `app/api/parent/invoices/route.ts`
- `app/api/parent/payments/route.ts`
- `app/api/parent/homework/route.ts`
- `app/api/parent/progress/route.ts`
- `app/api/parent/media/route.ts`
- `app/api/parent/approvals/route.ts`
- `app/api/parent/tests/route.ts`
- `app/api/parent/tests/[id]/route.ts`
- `app/api/student/dashboard/route.ts`
- `app/api/student/profile/route.ts` hoặc reuse profile route qua service riêng
- `app/api/student/reports/route.ts`
- `app/api/student/media/route.ts`
- `app/api/student/tests/route.ts`
- `app/api/student/tests/[id]/route.ts`
- `app/api/teacher/dashboard/route.ts`
- `app/api/teacher/profile/route.ts`
- `app/api/teacher/timesheet/route.ts`
- `app/api/finance/cashbook/route.ts`
- `app/api/finance/fees/route.ts`
- `app/api/finance/payroll/route.ts`
- `app/api/extracurricular-programs/route.ts`
- `app/api/extracurricular-programs/[id]/route.ts`
- `app/api/staff/dashboard/route.ts`
- `app/api/staff/announcements/route.ts`
- `app/api/staff/enrollments/pending/route.ts`
- `app/api/staff/fees/summary/route.ts`
- `app/api/staff/students/route.ts`
- `app/api/finance/accountant/dashboard/route.ts`
- `app/api/finance/dues/route.ts`
- `app/api/finance/invoices/route.ts`
- `app/api/finance/invoices/[id]/route.ts`
- `app/api/finance/invoices/[id]/send/route.ts`
- `app/api/finance/payos/transactions/route.ts`
- `app/api/finance/payos/generate-link/route.ts`
- `app/api/finance/payos/generate-qr/route.ts`
- `app/api/finance/adjustments/route.ts`
- `app/api/finance/audit-logs/route.ts`
- `app/api/finance/reports/route.ts`
- `app/api/staff-management/students/route.ts`
- `app/api/staff-management/media/route.ts`
- `app/api/staff-management/media/[id]/approve/route.ts`
- `app/api/staff-management/media/[id]/reject/route.ts`

## 5. Danh sách service FE còn thiếu

Nếu BE đã xong API, FE hiện còn thiếu các service trong `lib/api`:

- `parentOverviewService.ts`
- `parentFinanceService.ts`
- `parentHomeworkService.ts`
- `parentProgressService.ts`
- `parentMediaService.ts`
- `parentApprovalService.ts`
- `parentTestService.ts`
- `studentDashboardService.ts`
- `studentReportService.ts`
- `studentMediaService.ts`
- `studentTestService.ts`
- `teacherDashboardService.ts`
- `teacherProfileService.ts`
- `teacherTimesheetService.ts`
- `financeCashbookService.ts`
- `financeFeeService.ts`
- `financePayrollService.ts`
- `extracurricularService.ts`
- `staffDashboardService.ts`
- `staffAnnouncementService.ts`
- `staffEnrollmentApprovalService.ts`
- `staffFeeSummaryService.ts`
- `staffStudentService.ts`
- `accountantFinanceService.ts`
- `staffManagementStudentService.ts`
- `staffManagementMediaService.ts`

## 6. Thứ tự FE nên làm

- 1. Bỏ local notifications store, nối history thật
- 2. Clean fallback mapping ở classes / teacher / homework
- 3. Nối các màn có service sẵn: parent support, staff-management accounts, templates, profile cơ bản, admin center
- 4. Thêm proxy + service cho parent overview và toàn bộ parent finance/homework/tests/progress/media
- 5. Thêm proxy + service cho student dashboard/reports/tests/media
- 6. Thêm proxy + service cho teacher dashboard/profile/timesheet
- 7. Thêm proxy + service cho admin finance modules
- 8. Thêm proxy + service cho staff / staff-accountant / staff-management còn lại
