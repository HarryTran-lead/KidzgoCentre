# FE/BE API Gap Audit - Web Portal

Ngày audit: 2026-04-04

Checklist giao BE: `docs/BE_API_HANDOFF_CHECKLIST_2026-04-04.md`
Checklist thực thi FE: `docs/FE_API_INTEGRATION_CHECKLIST_2026-04-04.md`

## 1. Phạm vi

- Đã rà các khu vực chính trong `app/[locale]/portal/**`, `app/api/**`, `lib/api/**`, `hooks/**`, `components/**`.
- Mục tiêu của tài liệu này là chỉ ra:
- chỗ FE vẫn đang dùng mock/local data
- chỗ FE đã gọi API thật nhưng vẫn phải tự bù field vì contract BE chưa đủ
- chỗ page vẫn là UI demo, nếu muốn go-live thì BE cần cung cấp data/API

## 2. Kết luận nhanh

- P0 quan trọng nhất hiện tại: lịch sử broadcast notification chưa lấy từ backend, FE đang lưu local trong `.data/notifications.json`.
- P1 quan trọng tiếp theo: class/program/room/session/homework contract còn thiếu field hoặc response chưa ổn định nên FE phải tự gán mặc định như `0`, `Đang cập nhật`, `Chưa có`, hoặc tự generate `id`.
- P2: còn khá nhiều page dashboard/profile/finance/report/media/test đang là static demo. Một phần có thể reuse API sẵn có, phần còn lại cần endpoint mới hoặc summary endpoint cho từng role.

## 3. P0 - Đang fake/local nhưng UI đã dùng thật

### 3.1 Broadcast notification history đang local-only

- FE files:
- `app/api/notifications/broadcast/route.ts`
- `app/api/notifications/broadcast/history/route.ts`
- `app/api/_lib/notification-store.ts`
- `hooks/useNotifications.ts`
- Hiện trạng:
- FE gọi BE để gửi broadcast.
- Sau khi BE trả thành công, FE tự append campaign vào file local `.data/notifications.json`.
- Màn history lại đọc từ file local này, không đọc từ backend.
- Rủi ro:
- không đồng bộ giữa các máy/môi trường
- restart/deploy có thể lệch dữ liệu
- không audit được lịch sử thật trên server
- BE cần cung cấp:
- `GET /notifications/broadcast-history` hoặc endpoint tương đương
- filter tối thiểu: `senderRole`, `branchId?`, `classId?`, `from?`, `to?`, `pageNumber?`, `pageSize?`
- mỗi item tối thiểu cần: `id`, `title`, `content`, `channel`, `kind`, `priority`, `branchId`, `classId`, `studentProfileId`, `deliveredCount` hoặc `createdCount`, `senderRole`, `senderName`, `createdAt`
- response của API broadcast nên trả luôn: `campaignId`, `createdAt`, `createdCount` hoặc `deliveredCount`

## 4. P1 - API có rồi nhưng contract/data còn thiếu

### 4.1 Admin classes

- FE files:
- `app/api/admin/classes.ts`
- FE đang phải tự bù:
- `attendance: 100`, `progress: 0`, `stars: 0` cho student row
- `progress: 0`, `completedLessons: 0` cho class detail
- nếu create/update class mà response không có `id` thì FE tự gán `CLASS-${Date.now()}`
- FE hiện đang phải tự ghép teacher/program/enrollment từ nhiều API phụ
- BE cần trả ổn định:
- create/update class phải luôn có `id`
- class detail nên có đủ: `id`, `name`, `code`, `branchId`, `branchName`, `programId`, `programName`, `roomId`, `roomName`, `mainTeacherId`, `mainTeacherName`, `assistantTeacherId`, `assistantTeacherName`, `description`, `schedulePattern`, `startDate`, `endDate`, `totalSessions`, `completedSessions`, `progressPercent`
- class student list nên có luôn: `studentProfileId`, `fullName`, `avatarUrl`, `email`, `phone`, `attendanceRate`, `progressPercent`, `stars`, `lastActiveAt`, `enrollDate`, `status`

### 4.2 Teacher classes và timetable

- FE files:
- `app/api/teacher/classes.ts`
- `app/api/teacher/timetable/route.ts`
- FE đang phải tự bù:
- class list dùng fallback `Chưa có lịch`
- class detail dùng `Đang cập nhật` cho `schedule`, `room`
- class detail đang để `progress: 0`, `teacher: ""`, `description: ""`, `totalLessons: 0`, `completedLessons: 0`
- timetable route đang thử `/teacher/timetable`, nếu backend trả `403` thì FE fallback sang `/sessions`
- BE cần:
- teacher class list/detail có đủ `schedulePattern` hoặc `scheduleText`, `roomName`, `teacherName`, `description`, `totalSessions`, `completedSessions`, `progressPercent`
- endpoint `/teacher/timetable` chạy ổn định, không cần fallback `403 -> /sessions`
- nếu muốn dùng `/sessions` thay cho `/teacher/timetable` thì cần chốt 1 contract duy nhất

### 4.3 Admin programs

- FE file:
- `app/api/admin/programs.ts`
- FE đang phải tự bù:
- `classes = "0 lớp"`
- `students = "0 học viên"`
- duration/fee thiếu thì hiện `Đang cập nhật`
- create/update response thiếu `id` thì FE tự gán `PROG-${Date.now()}`
- BE cần:
- list/detail program có luôn aggregate `classCount`, `studentCount`
- có `totalSessions`, `fee` hoặc `baseFee`
- create/update program luôn trả `id`

### 4.4 Admin rooms

- FE file:
- `app/api/admin/rooms.ts`
- FE đang phải tự bù:
- `equipment` fallback thành `["Bàn ghế", "Máy lạnh", "Bảng viết"]`
- `utilization: 0`
- create/update response thiếu `id` thì FE tự gán `ROOM-${Date.now()}`
- BE cần:
- room detail/list có đủ `id`, `name`, `branchId`, `branchName`, `capacity`, `floor`, `area`, `equipment[]`, `status`, `note`, `utilizationPercent`
- create/update room luôn trả `id`

### 4.5 Admin sessions

- FE file:
- `app/api/admin/sessions.ts`
- FE đang phải tự gán `S-${Date.now()}` nếu create/update session response không có `id`
- BE cần:
- create/update session luôn trả `id`
- nên trả thêm object session chuẩn sau save để FE không cần refetch ngay

### 4.6 Student classes và homework detail/submission

- FE file:
- `lib/api/studentService.ts`
- FE hiện đang phải xử lý contract không thống nhất:
- class list thử cả `/api/classes` và `/api/students/classes`
- homework detail/submission phải fallback qua nhiều field như `attachmentUrls`, `submission.content.files`, `linkUrl`
- submit homework cũng đang phải tự chọn field `attachmentUrls` và `linkUrl`
- BE cần chốt rõ:
- chỉ 1 endpoint class list cho student hoặc 2 endpoint nhưng contract giống nhau
- homework detail/submission nên có schema ổn định, ví dụ:
- `submission.textAnswer`
- `submission.attachmentUrls[]`
- `submission.links[]`
- `submission.submittedAt`
- `submission.gradedAt`
- `submission.score`
- `submission.teacherFeedback`

## 5. Static page nhưng có thể reuse API sẵn có

Các page dưới đây hiện đang static/demo, nhưng khả năng cao BE không cần làm API hoàn toàn mới, chỉ cần xác nhận reuse endpoint hiện có hoặc mở thêm field/quyền.

### 5.1 Staff-management accounts

- FE file:
- `app/[locale]/portal/staff-management/accounts/page.tsx`
- Hiện trạng:
- page đang dùng `ACCS` hardcode
- Khả năng reuse:
- có thể reuse `USER_ENDPOINTS` hoặc user list hiện có
- BE cần nếu muốn page go-live:
- list user theo role/branch/status
- lock/unlock account
- reset password
- last login

### 5.2 Parent support

- FE file:
- `app/[locale]/portal/parent/support/page.tsx`
- Hiện trạng:
- page đang dùng `MOCK_TICKETS`
- Ghi chú:
- staff/teacher management tickets đang dùng thật `ticketService`
- Khả năng reuse:
- nếu parent role được phép dùng cùng ticket module thì BE gần như không cần API mới
- Cần xác nhận:
- parent có được `create/list/detail/comment` ticket hay không
- parent có xem được ticket theo child hay theo parent account

### 5.3 Parent account, Student profile, Teacher profile

- FE files:
- `app/[locale]/portal/parent/account/page.tsx`
- `app/[locale]/portal/student/profile/page.tsx`
- `app/[locale]/portal/teacher/profile/page.tsx`
- Hiện trạng:
- basic info đang hardcode
- teacher profile còn có certificates/stats hoàn toàn mock
- Ghi chú:
- admin profile hiện đã gọi `getUserMe()`
- Khả năng reuse:
- phần basic profile có thể reuse `auth/me` hoặc profile endpoint hiện có
- BE chỉ cần bổ sung nếu muốn support thêm:
- update profile
- change password
- certificates
- teaching stats
- avatar upload

### 5.4 Staff-management templates

- FE file:
- `app/[locale]/portal/staff-management/templates/page.tsx`
- Hiện trạng:
- page đang dùng `INIT` template local
- Ghi chú:
- notifications template API hiện đã có route thật cho `notifications/templates`
- Khả năng reuse:
- nếu data model template hiện tại của BE đủ `title`, `channel`, `content`, `status`, `placeholders` thì có thể nối lại luôn
- BE cần xác nhận:
- có phân biệt category hay không
- có lưu usage count hay không

### 5.5 Student notification materials

- FE file:
- `app/[locale]/portal/student/notifications/materials/page.tsx`
- Hiện trạng:
- page static với `DATA`
- Khả năng reuse:
- có thể reuse teaching materials hoặc notification attachment endpoint nếu BE đã có
- Cần xác nhận:
- đây là tài liệu từ module teaching materials hay là attachment đi kèm notification

## 6. Static page cần endpoint mới hoặc summary contract mới

Nếu các màn dưới đây là scope go-live thật thì BE cần chuẩn bị data contract rõ ràng. Nếu chỉ là page demo thì có thể bỏ qua.

### 6.1 Admin

- `admin/cashbook`
- Cần ledger + stats: `id`, `type`, `title`, `amount`, `date`, `method`, `note`, `category`, `branch`, `status`
- Cần summary: total in/out, cashflow theo tháng, breakdown theo category, breakdown theo payment method

- `admin/fees`
- Cần fee rows: `studentId`, `studentName`, `course`, `total`, `paid`, `remaining`, `dueDate`, `status`, `progressPercent`
- Cần stats: tổng phải thu, đã thu, overdue, partial, pending

- `admin/payroll`
- Cần payroll rows: `payrollId`, `employeeId`, `employeeName`, `department`, `baseSalary`, `allowance`, `bonus`, `deduction`, `total`, `status`, `month`, `performance`
- Cần summary theo department và tháng

- `admin/students`
- Cần student directory: `studentId`, `fullName`, `phone`, `email`, `className`, `level`, `status`, `feeSummary`

- `admin/teachers`
- Cần teacher directory: `teacherId`, `fullName`, `phone`, `email`, `subjects[]`, `experience`, `teachingLoad`, `classCount`, `studentCount`, `rating`, `status`, `branchName`

- `admin/center`
- Cần dashboard theo chi nhánh: tổng học viên, lớp, doanh thu, attendance, revenue trend, student distribution, attendance trend

- `admin/settings`
- Cần dữ liệu cấu hình/policy nếu page này thật sự dùng production: policy version, effective date, toggle settings, audit trail

- `admin/extracurricular`
- Cần list chương trình ngoại khóa/trại hè: `id`, `name`, `type`, `date`, `capacity`, `registeredCount`, `fee`, `location`, `status`

### 6.2 Parent

- `parent/page` và `components/portal/parent/ChildOverviewCard.tsx`
- Cần summary endpoint theo child hoặc parent: `studentInfo`, `classInfo`, `attendanceRate`, `homeworkCompletion`, `xp`, `level`, `streak`, `stars`, `nextClasses[]`, `pendingApprovals[]`, `tuitionDue`, `unreadNotifications`

- `parent/tuition` và `parent/payment`
- Cần invoices: `id`, `description`, `amount`, `dueDate`, `status`, `paidDate?`, `paymentLink?`, `paymentQr?`
- Cần payment history: `id`, `invoiceId`, `amount`, `method`, `paidAt`, `status`, `transactionRef`

- `parent/homework`
- Cần list bài tập theo child: `id`, `subject`, `title`, `description`, `dueDate`, `status`, `submittedAt?`, `score?`, `priority?`, `attachmentCount`

- `parent/progress`
- Cần summary tiến độ: attendance, skill progress, goals, class progress, teacher comments, monthly summary

- `parent/media`
- Cần album/media/doc list: `albumId`, `title`, `type`, `date`, `coverUrl`, `count`, `items[]`

- `parent/approvals`
- Cần list approval action: `id`, `title`, `description`, `type`, `status`, `createdAt`, `dueAt`, `actionUrl` hoặc `approve/reject`

- `parent/tests`
- Hiện chỉ phần monthly report và session report là đang dùng API thật
- Phần periodic/quiz/test result vẫn là `MOCK_TEST_RESULTS`
- BE cần thêm test result list/detail cho parent: `id`, `title`, `type`, `subject`, `className`, `testDate`, `score`, `maxScore`, `percentage`, `averageScore`, `rank`, `totalStudents`, `skillBreakdown[]`

- `parent/account`
- Cần profile update + change password cho parent

### 6.3 Student

- `student/page`
- Cần dashboard summary: greeting name, notices, stats, today class, teacher note, next actions

- `student/profile`
- Cần profile basic info, attendance, scores, course history, certificate info

- `student/reports`
- Cần lesson reports, progress summary, monthly summaries

- `student/media`
- Cần album/media API tương tự parent

- `student/tests` và `student/tests/[id]`
- Cần test list + test detail thật
- field tối thiểu giống phần parent tests ở trên, thêm detail: `sections[]`, `feedback`, `answerSheet`, `ranking`, `improvement`

### 6.4 Teacher

- `teacher/page`
- Cần dashboard summary: today classes, upcoming classes, quick stats, alerts, recent activities, pending tasks

- `teacher/profile`
- Ngoài basic profile còn cần certificates, security info, teaching stats, monthly performance

- `teacher/timesheet`
- Cần timesheet/income theo tháng: `month`, `hours`, `income`, `rate`, `classCount`, `status`
- Cần yearly summary: `totalHours`, `totalIncome`, `averagePerMonth`, `totalClasses`

### 6.5 Staff

- `staff/page`
- Cần dashboard summary: active students, tuition collected, pending registrations, recent activities

- `staff/announcements` và `staff/enrollments/announcements`
- Cần compose/history notification theo class/student

- `staff/enrollments`
- Cần danh sách hồ sơ chờ duyệt + approve/reject action

- `staff/fees`
- Cần dues list, recent payments, reconciliation export

- `staff/students`
- Cần quick student directory/search/update

### 6.6 Staff-accountant

- `staff-accountant/page`
- Cần dashboard summary: total invoices, overdue amount, transaction health, payment method breakdown

- `staff-accountant/dues`
- Cần debt aging: `bucket`, `count`, `amount`, `student list`, `daysOverdue`, `lastContact`

- `staff-accountant/invoices`
- Cần invoice list/create/send/detail

- `staff-accountant/payos`
- Cần PayOS transaction matching, QR/payment link generation, reconciliation status

- `staff-accountant/adjustments`
- Cần refund/adjustment/write-off history và action endpoint

- `staff-accountant/audit-log`
- Cần finance audit trail theo user/action/reference/time/ip

- `staff-accountant/reports`
- Cần revenue/payment/dues report theo tháng/quý/năm

### 6.7 Staff-management

- `staff-management/students`
- Cần CRM/student operation list: attendance, makeup count, notes, contact, status

- `staff-management/media`
- Cần media approval queue: `id`, `title`, `className`, `month`, `status`, `type`, `uploader`, `uploadDate`

- `staff-management/accounts`
- Nếu không reuse `users` endpoint hiện có thì BE cần list account/lock/unlock/reset password

- `staff-management/templates`
- Nếu không reuse template module hiện có thì cần message template CRUD + placeholders + status + usage count

## 7. Màn đã nối API thật hoặc gần thật, hiện không ghi vào danh sách BE blocker

- leads
- placement tests
- enrollments/registrations/classes/rooms/programs core flow
- question bank
- teaching materials workspace
- lesson plans
- notifications inbox và notification templates
- gamification
- pause enrollments
- attendance/schedule main flows
- teacher assignments/homework main flows
- monthly report / session report workspaces

## 8. Thứ tự BE nên ưu tiên

- Ưu tiên 1: notification broadcast history backend
- Ưu tiên 2: class/program/room/session/homework contract ổn định
- Ưu tiên 3: parent/student/teacher summary + tests/media/profile data
- Ưu tiên 4: admin finance modules `cashbook`, `fees`, `payroll`, `center`
- Ưu tiên 5: staff-accountant full finance flow
- Ưu tiên 6: các page còn lại đang static nhưng không chặn flow chính

## 9. Ghi chú phối hợp FE/BE

- Có một số page static nhưng BE có thể đã có endpoint tương đương, chỉ là FE chưa nối. Các ví dụ rõ nhất là `parent/support`, `staff-management/accounts`, phần basic profile.
- Với các dashboard theo role, BE nên cân nhắc summary endpoint riêng cho từng role thay vì bắt FE ghép quá nhiều API nhỏ.
- Với các flow create/update, response nên luôn trả object đầy đủ sau save, tối thiểu phải có `id`.
