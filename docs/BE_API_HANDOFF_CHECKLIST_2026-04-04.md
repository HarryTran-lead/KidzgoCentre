# BE API Handoff Checklist

Ngày tạo: 2026-04-04

## Cách đọc tài liệu này

- `Status = Existing` nghĩa là FE đã gọi route này hoặc route tương đương, nhưng BE cần trả đúng field hơn.
- `Status = New` nghĩa là hiện FE chưa có API thật cho màn đó, BE cần cung cấp mới.
- Tên endpoint bên dưới là đề xuất theo hướng FE đang dùng. Nếu BE đã có naming convention khác thì có thể đổi path, miễn request/response capability giữ nguyên.

## 1. P0 - Cần BE làm trước

### 1.1 Broadcast history

- Status: `New`
- Method: `GET`
- Endpoint: `/notifications/broadcast-history`
- Query:
- `senderRole`
- `branchId?`
- `classId?`
- `from?`
- `to?`
- `pageNumber?`
- `pageSize?`
- Response item bắt buộc:
- `id`
- `title`
- `content`
- `channel`
- `kind`
- `priority`
- `branchId`
- `classId`
- `studentProfileId`
- `senderRole`
- `senderName`
- `createdAt`
- `createdCount` hoặc `deliveredCount`

### 1.2 Broadcast send response

- Status: `Existing`
- Method: `POST`
- Endpoint: `/notifications/broadcast`
- Body FE đang gửi:
- `title`
- `content`
- `deeplink`
- `channel`
- `role`
- `kind`
- `priority`
- `senderRole`
- `senderName`
- `branchId`
- `classId`
- `studentProfileId`
- `userIds[]`
- `profileIds[]`
- Response bắt buộc:
- `campaignId` hoặc `id`
- `createdAt`
- `createdCount` hoặc `deliveredCount`

## 2. P1 - Route đang có nhưng contract cần chốt lại

### 2.1 Class list

- Status: `Existing`
- Method: `GET`
- Endpoint: `/classes`
- Query đề xuất:
- `pageNumber`
- `pageSize`
- `branchId?`
- `programId?`
- `teacherId?`
- `status?`
- `search?`
- Mỗi row bắt buộc:
- `id`
- `code`
- `name`
- `branchId`
- `branchName`
- `programId`
- `programName`
- `roomId`
- `roomName`
- `mainTeacherId`
- `mainTeacherName`
- `assistantTeacherId`
- `assistantTeacherName`
- `schedulePattern` hoặc `scheduleText`
- `startDate`
- `endDate`
- `studentCount`
- `totalSessions`
- `completedSessions`
- `progressPercent`
- `status`

### 2.2 Class detail

- Status: `Existing`
- Method: `GET`
- Endpoint: `/classes/:id`
- Response bắt buộc:
- toàn bộ field của class list
- `description`
- `teacherIds[]`
- `teacherNames[]`
- `schedulePattern`
- `scheduleText`
- `roomName`
- `progressPercent`
- `totalSessions`
- `completedSessions`

### 2.3 Class students

- Status: `Existing` hoặc BE có thể embed trong class detail
- Method: `GET`
- Endpoint: `/classes/:id/students`
- Mỗi item bắt buộc:
- `studentProfileId`
- `fullName`
- `avatarUrl`
- `email`
- `phone`
- `enrollDate`
- `status`
- `attendanceRate`
- `progressPercent`
- `stars`
- `lastActiveAt`

### 2.4 Create/update class

- Status: `Existing`
- Method: `POST`, `PUT`
- Endpoint:
- `POST /classes`
- `PUT /classes/:id`
- Request body tối thiểu:
- `name`
- `code`
- `branchId`
- `programId`
- `roomId`
- `mainTeacherId`
- `assistantTeacherId?`
- `schedulePattern`
- `startDate`
- `endDate`
- `description?`
- Response bắt buộc:
- object class đầy đủ
- luôn có `id`

### 2.5 Teacher timetable

- Status: `Existing`
- Method: `GET`
- Endpoint: `/teacher/timetable`
- Query đề xuất:
- `teacherUserId?`
- `from?`
- `to?`
- `branchId?`
- `classId?`
- Response item bắt buộc:
- `sessionId`
- `classId`
- `className`
- `plannedDate`
- `startTime`
- `endTime`
- `roomId`
- `roomName`
- `teacherId`
- `teacherName`
- `status`
- `attendanceStatus?`

### 2.6 Program list/detail

- Status: `Existing`
- Methods:
- `GET /programs`
- `GET /programs/:id`
- `POST /programs`
- `PUT /programs/:id`
- Response bắt buộc:
- `id`
- `name`
- `code`
- `branchId`
- `branchName`
- `description`
- `totalSessions`
- `fee` hoặc `baseFee`
- `classCount`
- `studentCount`
- `status`

### 2.7 Classroom list/detail

- Status: `Existing`
- Methods:
- `GET /classrooms`
- `GET /classrooms/:id`
- `POST /classrooms`
- `PUT /classrooms/:id`
- Response bắt buộc:
- `id`
- `name`
- `branchId`
- `branchName`
- `capacity`
- `floor`
- `area`
- `equipment[]`
- `note`
- `status`
- `utilizationPercent`

### 2.8 Session create/update

- Status: `Existing`
- Methods:
- `POST /sessions`
- `PUT /sessions/:id`
- Response bắt buộc:
- object session đầy đủ
- luôn có `id`

### 2.9 Student classes contract

- Status: `Existing nhưng cần chốt 1 route`
- Methods:
- `GET /students/classes`
- hoặc `GET /classes?studentProfileId=...`
- BE cần chốt 1 contract thống nhất để FE không phải fallback qua 2 route
- Response item bắt buộc:
- `classId`
- `className`
- `programName`
- `teacherName`
- `roomName`
- `schedulePattern` hoặc `scheduleText`
- `startDate`
- `endDate`
- `progressPercent`
- `status`

### 2.10 Student homework detail

- Status: `Existing`
- Method: `GET`
- Endpoint: `/students/homework/:homeworkStudentId`
- Response bắt buộc:
- `homeworkStudentId`
- `homeworkId`
- `title`
- `description`
- `dueDate`
- `status`
- `subject`
- `teacherName`
- `assignmentAttachmentUrls[]`
- `submission.textAnswer`
- `submission.attachmentUrls[]`
- `submission.links[]`
- `submission.submittedAt`
- `submission.gradedAt`
- `submission.score`
- `submission.teacherFeedback`

### 2.11 Student homework submit

- Status: `Existing`
- Method: `POST`
- Endpoint: `/students/homework/submit`
- Body FE cần support:
- `homeworkStudentId`
- `textAnswer?`
- `attachmentUrls[]?`
- `linkUrl?` hoặc `links[]`
- Response bắt buộc:
- `submissionId`
- `submittedAt`
- `status`
- `attachmentUrls[]`
- `links[]`

## 3. Parent APIs cần BE cung cấp

### 3.1 Parent overview

- Status: `Existing candidate` vì FE đã có `parent/overview` trong constants
- Method: `GET`
- Endpoint: `/parent/overview`
- Query:
- `studentProfileId?`
- Response bắt buộc:
- `studentInfo`
- `classInfo`
- `attendanceRate`
- `homeworkCompletion`
- `xp`
- `level`
- `streak`
- `stars`
- `nextClasses[]`
- `pendingApprovals[]`
- `tuitionDue`
- `unreadNotifications`

### 3.2 Parent invoices

- Status: `New`
- Method: `GET`
- Endpoint: `/parent/invoices`
- Query:
- `studentProfileId?`
- `status?`
- `pageNumber?`
- `pageSize?`
- Response item bắt buộc:
- `id`
- `description`
- `amount`
- `remainingAmount`
- `dueDate`
- `status`
- `paidDate?`
- `paymentLink?`
- `paymentQr?`

### 3.3 Parent payment history

- Status: `New`
- Method: `GET`
- Endpoint: `/parent/payments`
- Query:
- `studentProfileId?`
- `invoiceId?`
- Response item bắt buộc:
- `id`
- `invoiceId`
- `amount`
- `method`
- `paidAt`
- `status`
- `transactionRef`

### 3.4 Parent homework list

- Status: `New`
- Method: `GET`
- Endpoint: `/parent/homework`
- Query:
- `studentProfileId`
- `status?`
- `pageNumber?`
- `pageSize?`
- Response item bắt buộc:
- `id`
- `subject`
- `title`
- `description`
- `dueDate`
- `status`
- `submittedAt?`
- `score?`
- `priority?`
- `attachmentCount`

### 3.5 Parent progress

- Status: `New`
- Method: `GET`
- Endpoint: `/parent/progress`
- Query:
- `studentProfileId`
- Response bắt buộc:
- `attendanceRate`
- `overallProgress`
- `skills[]`
- `recentScores[]`
- `teacherComments[]`
- `monthlySummaries[]`

### 3.6 Parent media

- Status: `New`
- Method: `GET`
- Endpoint: `/parent/media`
- Query:
- `studentProfileId`
- `type?`
- Response:
- `albums[]`
- mỗi album có `albumId`, `title`, `type`, `date`, `coverUrl`, `count`
- `items[]` nếu mở detail album

### 3.7 Parent approvals

- Status: `New`
- Method: `GET`
- Endpoint: `/parent/approvals`
- Query:
- `studentProfileId?`
- `status?`
- Response item bắt buộc:
- `id`
- `title`
- `description`
- `type`
- `status`
- `createdAt`
- `dueAt?`
- `actionUrl?`

### 3.8 Parent tests

- Status: `New`
- Methods:
- `GET /parent/tests`
- `GET /parent/tests/:id`
- List item bắt buộc:
- `id`
- `title`
- `type`
- `subject`
- `className`
- `testDate`
- `duration`
- `status`
- `score?`
- `maxScore?`
- `percentage?`
- `averageScore?`
- `rank?`
- `totalStudents`
- Detail bắt buộc thêm:
- `skillBreakdown[]`
- `sections[]`
- `feedback`
- `ranking`

### 3.9 Parent account

- Status: `Reuse existing + bổ sung`
- Methods:
- `GET /profiles/:id` hoặc endpoint account riêng
- `PUT /profiles/:id`
- `POST /auth/change-password`
- FE cần:
- basic profile data
- update profile
- đổi mật khẩu

## 4. Student APIs cần BE cung cấp

### 4.1 Student dashboard

- Status: `New`
- Method: `GET`
- Endpoint: `/student/dashboard`
- Response bắt buộc:
- `displayName`
- `stats`
- `notices[]`
- `todayClass`
- `teacherNote`
- `pendingTasks[]`

### 4.2 Student profile

- Status: `New` hoặc reuse profile + học tập
- Method: `GET`
- Endpoint: `/student/profile`
- Response bắt buộc:
- `studentInfo`
- `attendancePercent`
- `scores[]`
- `courseHistory[]`
- `certificates[]`

### 4.3 Student reports

- Status: `New`
- Method: `GET`
- Endpoint: `/student/reports`
- Query:
- `studentProfileId`
- `type=lesson|progress|monthly`
- Response:
- `lessonReports[]`
- `progressSummary`
- `monthlySummaries[]`

### 4.4 Student media

- Status: `New`
- Method: `GET`
- Endpoint: `/student/media`
- Response giống parent media

### 4.5 Student tests

- Status: `New`
- Methods:
- `GET /student/tests`
- `GET /student/tests/:id`
- Contract giống parent tests nhưng có thể thêm:
- `answerSheet`
- `improvement`

## 5. Teacher APIs cần BE cung cấp

### 5.1 Teacher dashboard

- Status: `New`
- Method: `GET`
- Endpoint: `/teacher/dashboard`
- Response bắt buộc:
- `stats`
- `todayClasses[]`
- `upcomingClasses[]`
- `alerts[]`
- `recentActivities[]`
- `pendingTasks[]`

### 5.2 Teacher profile

- Status: `New` hoặc reuse profile + stats
- Methods:
- `GET /teacher/profile`
- `PUT /teacher/profile`
- Response bắt buộc:
- `basicInfo`
- `bio`
- `skills[]`
- `certificates[]`
- `securityInfo?`
- `teachingStats`

### 5.3 Teacher timesheet

- Status: `New`
- Method: `GET`
- Endpoint: `/teacher/timesheet`
- Query:
- `teacherUserId?`
- `year?`
- Response bắt buộc:
- `monthlyData[]`
- mỗi item: `month`, `hours`, `income`, `rate`, `classCount`, `status`
- `yearlySummary`
- gồm: `totalHours`, `totalIncome`, `averagePerMonth`, `totalClasses`

## 6. Admin finance/operation APIs cần BE cung cấp

### 6.1 Cashbook

- Status: `New`
- Methods:
- `GET /finance/cashbook`
- `POST /finance/cashbook`
- `PUT /finance/cashbook/:id`
- Response row bắt buộc:
- `id`
- `type`
- `title`
- `amount`
- `date`
- `method`
- `note`
- `category`
- `branch`
- `status`

### 6.2 Fees

- Status: `New`
- Method: `GET`
- Endpoint: `/finance/fees`
- Response row bắt buộc:
- `studentId`
- `studentName`
- `course`
- `total`
- `paid`
- `remaining`
- `dueDate`
- `status`
- `progressPercent`

### 6.3 Payroll

- Status: `New`
- Method: `GET`
- Endpoint: `/finance/payroll`
- Query:
- `month`
- `department?`
- Response row bắt buộc:
- `payrollId`
- `employeeId`
- `employeeName`
- `department`
- `baseSalary`
- `allowance`
- `bonus`
- `deduction`
- `total`
- `status`
- `performance`

### 6.4 Center dashboard

- Status: `New` hoặc reuse dashboard summary
- Method: `GET`
- Endpoint: `/dashboard/overall`
- Response bắt buộc:
- `branchSummaries[]`
- `revenueTrend[]`
- `studentDistribution[]`
- `attendanceTrend[]`

### 6.5 Extracurricular programs

- Status: `New`
- Methods:
- `GET /extracurricular-programs`
- `POST /extracurricular-programs`
- `PUT /extracurricular-programs/:id`
- Response item bắt buộc:
- `id`
- `name`
- `type`
- `date`
- `capacity`
- `registeredCount`
- `fee`
- `location`
- `status`

## 7. Staff APIs cần BE cung cấp

### 7.1 Staff dashboard

- Status: `New`
- Method: `GET`
- Endpoint: `/staff/dashboard`
- Response bắt buộc:
- `activeStudents`
- `tuitionCollected`
- `pendingRegistrations`
- `recentActivities[]`

### 7.2 Staff announcements

- Status: `New` hoặc reuse notifications broadcast scoped theo class
- Methods:
- `GET /staff/announcements/history`
- `POST /staff/announcements`
- Response item bắt buộc:
- `id`
- `title`
- `content`
- `classId?`
- `studentProfileId?`
- `createdAt`
- `senderName`

### 7.3 Staff enrollment approvals

- Status: `New` nếu không reuse registration/enrollment workflow hiện có
- Methods:
- `GET /staff/enrollments/pending`
- `POST /staff/enrollments/:id/approve`
- `POST /staff/enrollments/:id/reject`

### 7.4 Staff fees quick view

- Status: `New` hoặc reuse finance
- Method: `GET`
- Endpoint: `/staff/fees/summary`
- FE cần:
- dues list
- recent payments
- reconciliation export

### 7.5 Staff students quick directory

- Status: `New`
- Method: `GET`
- Endpoint: `/staff/students`
- Response item bắt buộc:
- `studentId`
- `fullName`
- `phone`
- `status`
- `course`

## 8. Staff-accountant APIs cần BE cung cấp

### 8.1 Accountant dashboard

- Status: `New`
- Method: `GET`
- Endpoint: `/finance/accountant/dashboard`
- Response bắt buộc:
- `totalInvoices`
- `overdueAmount`
- `transactionHealth`
- `paymentMethodBreakdown[]`

### 8.2 Dues aging

- Status: `New`
- Method: `GET`
- Endpoint: `/finance/dues`
- Response:
- `agingBuckets[]`
- `debts[]`
- mỗi debt cần `id`, `studentId`, `studentName`, `className`, `amount`, `dueDate`, `daysOverdue`, `status`, `bucket`, `lastContact`

### 8.3 Invoices

- Status: `New`
- Methods:
- `GET /finance/invoices`
- `POST /finance/invoices`
- `PUT /finance/invoices/:id`
- `POST /finance/invoices/:id/send`

### 8.4 PayOS transactions

- Status: `New`
- Methods:
- `GET /finance/payos/transactions`
- `POST /finance/payos/generate-link`
- `POST /finance/payos/generate-qr`
- Response item bắt buộc:
- `transactionId`
- `studentId`
- `studentName`
- `amount`
- `status`
- `method`
- `timestamp`
- `description`

### 8.5 Adjustments/refunds/write-off

- Status: `New`
- Methods:
- `GET /finance/adjustments`
- `POST /finance/adjustments`
- Response item bắt buộc:
- `id`
- `code`
- `amount`
- `type`
- `status`
- `timestamp`
- `note`
- `user`

### 8.6 Audit log

- Status: `New`
- Method: `GET`
- Endpoint: `/finance/audit-logs`
- Response item bắt buộc:
- `id`
- `timestamp`
- `user`
- `role`
- `action`
- `reference`
- `type`
- `ipAddress`
- `details`

### 8.7 Finance reports

- Status: `New`
- Method: `GET`
- Endpoint: `/finance/reports`
- Query:
- `period=monthly|quarterly|yearly`
- Response:
- `rows[]`
- `summary`
- `paymentMethodBreakdown[]`
- `growthTrend[]`

## 9. Staff-management APIs cần BE cung cấp

### 9.1 Students operation list

- Status: `New`
- Method: `GET`
- Endpoint: `/staff-management/students`
- Response item bắt buộc:
- `studentId`
- `fullName`
- `className`
- `attendanceRate`
- `makeupCount`
- `notes`
- `email`
- `phone`
- `status`

### 9.2 Media approval queue

- Status: `New`
- Methods:
- `GET /staff-management/media`
- `POST /staff-management/media/:id/approve`
- `POST /staff-management/media/:id/reject`
- Response item bắt buộc:
- `id`
- `title`
- `className`
- `month`
- `status`
- `type`
- `uploader`
- `uploadDate`

### 9.3 Accounts page

- Status: `Reuse existing`
- Candidate routes:
- `/admin/users`
- `/admin/users/:id/status`
- BE cần đảm bảo thêm:
- filter theo role
- filter theo branch
- lock/unlock
- last login

### 9.4 Templates page

- Status: `Reuse existing`
- Candidate routes:
- `/notifications/templates`
- `/notifications/templates/:id`
- BE cần đảm bảo nếu FE nối page này:
- `id`
- `title`
- `channel`
- `category?`
- `content`
- `status`
- `placeholders[]`
- `usageCount?`

## 10. API có thể dùng lại, không nhất thiết tạo route mới

- Parent support có thể reuse:
- `/tickets`
- `/tickets/:id`
- `/tickets/:id/comments`
- `/tickets/:id/status`

- Parent/Student/Teacher basic profile có thể reuse:
- `/profiles`
- `/profiles/:id`
- `/auth/change-password`

- Parent overview có thể reuse route đã có:
- `/parent/overview`

- Admin center summary có thể reuse:
- `/dashboard/overall`
- `/dashboard/student`
- `/dashboard/finance`

## 11. Thứ tự backend nên nhận việc

- 1. `notifications/broadcast-history` + fix response `notifications/broadcast`
- 2. fix contract `classes`, `teacher/timetable`, `programs`, `classrooms`, `sessions`, `students/homework`
- 3. parent overview + invoices + payments + tests
- 4. student dashboard/profile/reports/tests/media
- 5. teacher dashboard/profile/timesheet
- 6. admin finance modules
- 7. staff-accountant modules
- 8. staff/staff-management modules còn lại
