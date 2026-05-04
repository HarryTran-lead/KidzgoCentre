# Web Flow Map

## 1. Role Summary
- Admin
- Staff_Manager
- Staff_Accountant
- Teacher
- Student
- Parent
- Legacy `staff` routes exist in `/{locale}/portal/staff/*` and are marked Need confirmation.

Role enforcement evidence:
- `lib/role.ts`: canonical roles and `ACCESS_MAP` prefixes.
- `proxy.ts`: JWT/cookie role extraction and route-prefix authorization.
- Prefix rule: each role is allowed only its own portal prefix; unauthorized access redirects to `/403`.

## 2. Route Inventory
Source: auto-extracted from all `app/**/page.tsx` files (162 routes).

| No | Route | Page Name | Role | Purpose | Main Actions | API Used |
|---:|---|---|---|---|---|---|
| 1 | / | Home | Public | Landing entry | View/filter | Need confirmation |
| 2 | /403 | 403 | All | Forbidden page | View/filter | Need confirmation |
| 3 | /{locale} | {Locale} | Public | Localized home page | View/filter | Need confirmation |
| 4 | /{locale}/activate-profile | Activate Profile | Public | Need confirmation | View/filter | /api/admin/users*, /api/profiles*, /api/auth/* |
| 5 | /{locale}/auth/forgotpassword | Forgotpassword | Public | Authentication flow | Submit auth form | /api/auth/* |
| 6 | /{locale}/auth/login | Login | Public | Authentication flow | Submit auth form | /api/auth/* |
| 7 | /{locale}/auth/register | Register | Public | Authentication flow | Submit auth form | /api/auth/* |
| 8 | /{locale}/auth/reset-password | Reset Password | Public | Authentication flow | Submit auth form | /api/auth/* |
| 9 | /{locale}/auth/reset-pin | Reset Pin | Public | Authentication flow | Submit auth form | /api/auth/* |
| 10 | /{locale}/blogs | Blogs | Public | Public blog list | View/filter | Need confirmation |
| 11 | /{locale}/contact | Contact | Public | Public contact | View/filter | Need confirmation |
| 12 | /{locale}/faqs | Faqs | Public | Public FAQs | View/filter | Need confirmation |
| 13 | /{locale}/portal | Portal | Authenticated (chooser) | Need confirmation | View/filter | Need confirmation |
| 14 | /{locale}/portal/admin | Admin | Admin | Portal feature page | View/filter | Need confirmation |
| 15 | /{locale}/portal/admin/accounts | Accounts | Admin | Portal feature page | View/filter | /api/admin/users*, /api/profiles*, /api/auth/* |
| 16 | /{locale}/portal/admin/blogs | Blogs | Admin | Portal feature page | View/filter | Need confirmation |
| 17 | /{locale}/portal/admin/branches | Branches | Admin | Portal feature page | View/filter | /api/branches*, /api/classrooms* |
| 18 | /{locale}/portal/admin/cashbook | Cashbook | Admin | Portal feature page | View/filter | /api/finance/*, /api/tuition-plans* |
| 19 | /{locale}/portal/admin/center | Center | Admin | Portal feature page | View/filter | Need confirmation |
| 20 | /{locale}/portal/admin/classes | Classes | Admin | Portal feature page | View/filter | /api/classes*, /api/sessions* |
| 21 | /{locale}/portal/admin/classes/[id] | Id | Admin | Portal feature page | View/filter | /api/classes*, /api/sessions* |
| 22 | /{locale}/portal/admin/courses | Courses | Admin | Portal feature page | View/filter | Need confirmation |
| 23 | /{locale}/portal/admin/courses/branch | Branch | Admin | Portal feature page | View/filter | Need confirmation |
| 24 | /{locale}/portal/admin/courses/system | System | Admin | Portal feature page | View/filter | Need confirmation |
| 25 | /{locale}/portal/admin/discount-campaigns | Discount Campaigns | Admin | Portal feature page | View/filter | Need confirmation |
| 26 | /{locale}/portal/admin/documents | Documents | Admin | Portal feature page | View/filter | /api/teaching-materials*, /api/lesson-plans* |
| 27 | /{locale}/portal/admin/enrollments | Enrollments | Admin | Portal feature page | View/filter | /api/leads*, /api/placement-tests*, /api/enrollments*, /api/registrations* |
| 28 | /{locale}/portal/admin/extracurricular | Extracurricular | Admin | Portal feature page | View/filter | Need confirmation |
| 29 | /{locale}/portal/admin/faqs | Faqs | Admin | Portal feature page | View/filter | Need confirmation |
| 30 | /{locale}/portal/admin/feedback | Feedback | Admin | Portal feature page | View/filter | /api/report-requests*, /api/session-reports*, /api/monthly-reports* |
| 31 | /{locale}/portal/admin/feedback/monthly | Monthly | Admin | Portal feature page | View/filter | /api/report-requests*, /api/session-reports*, /api/monthly-reports* |
| 32 | /{locale}/portal/admin/feedback/session | Session | Admin | Portal feature page | View/filter | /api/report-requests*, /api/session-reports*, /api/monthly-reports* |
| 33 | /{locale}/portal/admin/fees | Fees | Admin | Portal feature page | View/filter | /api/finance/*, /api/tuition-plans* |
| 34 | /{locale}/portal/admin/gamification | Gamification | Admin | Portal feature page | Track missions, stars/xp, redeem rewards | /api/gamification*, /api/missions* |
| 35 | /{locale}/portal/admin/leads | Leads | Admin | Portal feature page | View/filter | /api/leads*, /api/placement-tests*, /api/enrollments*, /api/registrations* |
| 36 | /{locale}/portal/admin/materials | Materials | Admin | Portal feature page | View/filter | /api/teaching-materials*, /api/lesson-plans* |
| 37 | /{locale}/portal/admin/media | Media | Admin | Portal feature page | View/filter | Need confirmation |
| 38 | /{locale}/portal/admin/notifications | Notifications | Admin | Portal feature page | View/read/broadcast notifications | /api/notifications* |
| 39 | /{locale}/portal/admin/pause-enrollments | Pause Enrollments | Admin | Portal feature page | View/filter | /api/leads*, /api/placement-tests*, /api/enrollments*, /api/registrations* |
| 40 | /{locale}/portal/admin/payment-setting | Payment Setting | Admin | Portal feature page | View/filter | Need confirmation |
| 41 | /{locale}/portal/admin/payment-setting/branch | Branch | Admin | Portal feature page | View/filter | Need confirmation |
| 42 | /{locale}/portal/admin/payroll | Payroll | Admin | Portal feature page | View/filter | /api/finance/*, /api/tuition-plans* |
| 43 | /{locale}/portal/admin/placement-tests | Placement Tests | Admin | Portal feature page | View/filter | /api/leads*, /api/placement-tests*, /api/enrollments*, /api/registrations* |
| 44 | /{locale}/portal/admin/profile | Profile | Admin | Portal feature page | View/filter | /api/admin/users*, /api/profiles*, /api/auth/* |
| 45 | /{locale}/portal/admin/question-bank | Question Bank | Admin | Portal feature page | View/filter | Need confirmation |
| 46 | /{locale}/portal/admin/registrations | Registrations | Admin | Portal feature page | View/filter | /api/leads*, /api/placement-tests*, /api/enrollments*, /api/registrations* |
| 47 | /{locale}/portal/admin/registrations/payment-setting | Payment Setting | Admin | Portal feature page | View/filter | /api/leads*, /api/placement-tests*, /api/enrollments*, /api/registrations* |
| 48 | /{locale}/portal/admin/registrations/payment-setting/branch | Branch | Admin | Portal feature page | View/filter | /api/leads*, /api/placement-tests*, /api/enrollments*, /api/registrations* |
| 49 | /{locale}/portal/admin/report-requests | Report Requests | Admin | Portal feature page | Create/complete/cancel request | /api/report-requests*, /api/session-reports*, /api/monthly-reports* |
| 50 | /{locale}/portal/admin/reports | Reports | Admin | Portal feature page | View/filter | /api/report-requests*, /api/session-reports*, /api/monthly-reports* |
| 51 | /{locale}/portal/admin/rooms | Rooms | Admin | Portal feature page | View/filter | /api/branches*, /api/classrooms* |
| 52 | /{locale}/portal/admin/schedule | Schedule | Admin | Portal feature page | View/filter | /api/classes*, /api/sessions* |
| 53 | /{locale}/portal/admin/schedule/[id] | Id | Admin | Portal feature page | View/filter | /api/classes*, /api/sessions* |
| 54 | /{locale}/portal/admin/settings | Settings | Admin | Portal feature page | View/filter | Need confirmation |
| 55 | /{locale}/portal/admin/teachers | Teachers | Admin | Portal feature page | View/filter | Need confirmation |
| 56 | /{locale}/portal/admin/tuition-plans | Tuition Plans | Admin | Portal feature page | View/filter | /api/finance/*, /api/tuition-plans* |
| 57 | /{locale}/portal/parent | Parent | Parent | Portal feature page | View/filter | Need confirmation |
| 58 | /{locale}/portal/parent/account | Account | Parent | Portal feature page | View/filter | Need confirmation |
| 59 | /{locale}/portal/parent/approvals | Approvals | Parent | Portal feature page | View/filter | Need confirmation |
| 60 | /{locale}/portal/parent/attendance | Attendance | Parent | Portal feature page | Mark/view attendance, submit notes | /api/attendance*, /api/sessions*, /api/teacher/timetable |
| 61 | /{locale}/portal/parent/attendance-history | Attendance History | Parent | Portal feature page | Mark/view attendance, submit notes | /api/attendance*, /api/sessions*, /api/teacher/timetable |
| 62 | /{locale}/portal/parent/enrollment-pause | Enrollment Pause | Parent | Portal feature page | View/filter | /api/leads*, /api/placement-tests*, /api/enrollments*, /api/registrations* |
| 63 | /{locale}/portal/parent/gamification | Gamification | Parent | Portal feature page | Track missions, stars/xp, redeem rewards | /api/gamification*, /api/missions* |
| 64 | /{locale}/portal/parent/homework | Homework | Parent | Portal feature page | Create/submit/grade homework | /api/homework*, /api/students/homework* |
| 65 | /{locale}/portal/parent/homework/[id] | Id | Parent | Portal feature page | Create/submit/grade homework | /api/homework*, /api/students/homework* |
| 66 | /{locale}/portal/parent/media | Media | Parent | Portal feature page | View/filter | Need confirmation |
| 67 | /{locale}/portal/parent/notifications | Notifications | Parent | Portal feature page | View/read/broadcast notifications | /api/notifications* |
| 68 | /{locale}/portal/parent/payment | Payment | Parent | Portal feature page | View/filter | Need confirmation |
| 69 | /{locale}/portal/parent/profile | Profile | Parent | Portal feature page | View/filter | /api/admin/users*, /api/profiles*, /api/auth/* |
| 70 | /{locale}/portal/parent/progress | Progress | Parent | Portal feature page | View/filter | Need confirmation |
| 71 | /{locale}/portal/parent/schedule | Schedule | Parent | Portal feature page | View/filter | /api/classes*, /api/sessions* |
| 72 | /{locale}/portal/parent/support | Support | Parent | Portal feature page | View/filter | Need confirmation |
| 73 | /{locale}/portal/parent/tests | Tests | Parent | Portal feature page | View/filter | Need confirmation |
| 74 | /{locale}/portal/parent/tuition | Tuition | Parent | Portal feature page | View/filter | /api/finance/*, /api/tuition-plans* |
| 75 | /{locale}/portal/staff | Staff | Need confirmation (legacy staff) | Portal feature page | View/filter | Need confirmation |
| 76 | /{locale}/portal/staff/announcements | Announcements | Need confirmation (legacy staff) | Portal feature page | View/filter | Need confirmation |
| 77 | /{locale}/portal/staff/enrollments | Enrollments | Need confirmation (legacy staff) | Portal feature page | View/filter | /api/leads*, /api/placement-tests*, /api/enrollments*, /api/registrations* |
| 78 | /{locale}/portal/staff/enrollments/announcements | Announcements | Need confirmation (legacy staff) | Portal feature page | View/filter | /api/leads*, /api/placement-tests*, /api/enrollments*, /api/registrations* |
| 79 | /{locale}/portal/staff/fees | Fees | Need confirmation (legacy staff) | Portal feature page | View/filter | /api/finance/*, /api/tuition-plans* |
| 80 | /{locale}/portal/staff/reports | Reports | Need confirmation (legacy staff) | Portal feature page | View/filter | /api/report-requests*, /api/session-reports*, /api/monthly-reports* |
| 81 | /{locale}/portal/staff/students | Students | Need confirmation (legacy staff) | Portal feature page | View/filter | Need confirmation |
| 82 | /{locale}/portal/staff-accountant | Staff Accountant | Staff_Accountant | Portal feature page | View/filter | Need confirmation |
| 83 | /{locale}/portal/staff-accountant/adjustments | Adjustments | Staff_Accountant | Portal feature page | View/filter | /api/finance/*, /api/tuition-plans* |
| 84 | /{locale}/portal/staff-accountant/audit-log | Audit Log | Staff_Accountant | Portal feature page | View/filter | Need confirmation |
| 85 | /{locale}/portal/staff-accountant/dues | Dues | Staff_Accountant | Portal feature page | View/filter | /api/finance/*, /api/tuition-plans* |
| 86 | /{locale}/portal/staff-accountant/incident-reports | Incident Reports | Staff_Accountant | Portal feature page | Create, comment, assign, update status | /api/incident-reports* |
| 87 | /{locale}/portal/staff-accountant/invoices | Invoices | Staff_Accountant | Portal feature page | View/filter | /api/finance/*, /api/tuition-plans* |
| 88 | /{locale}/portal/staff-accountant/notifications | Notifications | Staff_Accountant | Portal feature page | View/read/broadcast notifications | /api/notifications* |
| 89 | /{locale}/portal/staff-accountant/payos | Payos | Staff_Accountant | Portal feature page | View/filter | /api/finance/*, /api/tuition-plans* |
| 90 | /{locale}/portal/staff-accountant/profile | Profile | Staff_Accountant | Portal feature page | View/filter | /api/admin/users*, /api/profiles*, /api/auth/* |
| 91 | /{locale}/portal/staff-accountant/reports | Reports | Staff_Accountant | Portal feature page | View/filter | /api/report-requests*, /api/session-reports*, /api/monthly-reports* |
| 92 | /{locale}/portal/staff-management | Staff Management | Staff_Manager | Portal feature page | View/filter | Need confirmation |
| 93 | /{locale}/portal/staff-management/accounts | Accounts | Staff_Manager | Portal feature page | View/filter | /api/admin/users*, /api/profiles*, /api/auth/* |
| 94 | /{locale}/portal/staff-management/enrollments | Enrollments | Staff_Manager | Portal feature page | View/filter | /api/leads*, /api/placement-tests*, /api/enrollments*, /api/registrations* |
| 95 | /{locale}/portal/staff-management/feedback | Feedback | Staff_Manager | Portal feature page | View/filter | /api/report-requests*, /api/session-reports*, /api/monthly-reports* |
| 96 | /{locale}/portal/staff-management/feedback/monthly | Monthly | Staff_Manager | Portal feature page | View/filter | /api/report-requests*, /api/session-reports*, /api/monthly-reports* |
| 97 | /{locale}/portal/staff-management/feedback/session | Session | Staff_Manager | Portal feature page | View/filter | /api/report-requests*, /api/session-reports*, /api/monthly-reports* |
| 98 | /{locale}/portal/staff-management/gamification | Gamification | Staff_Manager | Portal feature page | Track missions, stars/xp, redeem rewards | /api/gamification*, /api/missions* |
| 99 | /{locale}/portal/staff-management/incident-reports | Incident Reports | Staff_Manager | Portal feature page | Create, comment, assign, update status | /api/incident-reports* |
| 100 | /{locale}/portal/staff-management/leads | Leads | Staff_Manager | Portal feature page | View/filter | /api/leads*, /api/placement-tests*, /api/enrollments*, /api/registrations* |
| 101 | /{locale}/portal/staff-management/lesson-plans | Lesson Plans | Staff_Manager | Portal feature page | View/filter | /api/teaching-materials*, /api/lesson-plans* |
| 102 | /{locale}/portal/staff-management/makeup | Makeup | Staff_Manager | Portal feature page | View/filter | Need confirmation |
| 103 | /{locale}/portal/staff-management/materials | Materials | Staff_Manager | Portal feature page | View/filter | /api/teaching-materials*, /api/lesson-plans* |
| 104 | /{locale}/portal/staff-management/media | Media | Staff_Manager | Portal feature page | View/filter | Need confirmation |
| 105 | /{locale}/portal/staff-management/monthly-report | Monthly Report | Staff_Manager | Portal feature page | View/filter | Need confirmation |
| 106 | /{locale}/portal/staff-management/notifications | Notifications | Staff_Manager | Portal feature page | View/read/broadcast notifications | /api/notifications* |
| 107 | /{locale}/portal/staff-management/pause-enrollments | Pause Enrollments | Staff_Manager | Portal feature page | View/filter | /api/leads*, /api/placement-tests*, /api/enrollments*, /api/registrations* |
| 108 | /{locale}/portal/staff-management/placement-tests | Placement Tests | Staff_Manager | Portal feature page | View/filter | /api/leads*, /api/placement-tests*, /api/enrollments*, /api/registrations* |
| 109 | /{locale}/portal/staff-management/profile | Profile | Staff_Manager | Portal feature page | View/filter | /api/admin/users*, /api/profiles*, /api/auth/* |
| 110 | /{locale}/portal/staff-management/report-requests | Report Requests | Staff_Manager | Portal feature page | Create/complete/cancel request | /api/report-requests*, /api/session-reports*, /api/monthly-reports* |
| 111 | /{locale}/portal/staff-management/schedule | Schedule | Staff_Manager | Portal feature page | View/filter | /api/classes*, /api/sessions* |
| 112 | /{locale}/portal/staff-management/schedule/[id] | Id | Staff_Manager | Portal feature page | View/filter | /api/classes*, /api/sessions* |
| 113 | /{locale}/portal/staff-management/session-report | Session Report | Staff_Manager | Portal feature page | View/filter | Need confirmation |
| 114 | /{locale}/portal/staff-management/students | Students | Staff_Manager | Portal feature page | View/filter | Need confirmation |
| 115 | /{locale}/portal/staff-management/templates | Templates | Staff_Manager | Portal feature page | View/filter | Need confirmation |
| 116 | /{locale}/portal/staff-management/tickets | Tickets | Staff_Manager | Portal feature page | View/filter | Need confirmation |
| 117 | /{locale}/portal/student | Student | Student | Portal feature page | View/filter | Need confirmation |
| 118 | /{locale}/portal/student/ai-speaking | Ai Speaking | Student | Portal feature page | View/filter | Need confirmation |
| 119 | /{locale}/portal/student/ai-tutor | Ai Tutor | Student | Portal feature page | View/filter | Need confirmation |
| 120 | /{locale}/portal/student/application | Application | Student | Portal feature page | View/filter | Need confirmation |
| 121 | /{locale}/portal/student/attendance | Attendance | Student | Portal feature page | Mark/view attendance, submit notes | /api/attendance*, /api/sessions*, /api/teacher/timetable |
| 122 | /{locale}/portal/student/gamification | Gamification | Student | Portal feature page | Track missions, stars/xp, redeem rewards | /api/gamification*, /api/missions* |
| 123 | /{locale}/portal/student/homework | Homework | Student | Portal feature page | Create/submit/grade homework | /api/homework*, /api/students/homework* |
| 124 | /{locale}/portal/student/homework/[id] | Id | Student | Portal feature page | Create/submit/grade homework | /api/homework*, /api/students/homework* |
| 125 | /{locale}/portal/student/level | Level | Student | Portal feature page | View/filter | Need confirmation |
| 126 | /{locale}/portal/student/materials | Materials | Student | Portal feature page | View/filter | /api/teaching-materials*, /api/lesson-plans* |
| 127 | /{locale}/portal/student/media | Media | Student | Portal feature page | View/filter | Need confirmation |
| 128 | /{locale}/portal/student/missions | Missions | Student | Portal feature page | Track missions, stars/xp, redeem rewards | /api/gamification*, /api/missions* |
| 129 | /{locale}/portal/student/notifications | Notifications | Student | Portal feature page | View/read/broadcast notifications | /api/notifications* |
| 130 | /{locale}/portal/student/notifications/materials | Materials | Student | Portal feature page | View/read/broadcast notifications | /api/notifications* |
| 131 | /{locale}/portal/student/profile | Profile | Student | Portal feature page | View/filter | /api/admin/users*, /api/profiles*, /api/auth/* |
| 132 | /{locale}/portal/student/reports | Reports | Student | Portal feature page | View/filter | /api/report-requests*, /api/session-reports*, /api/monthly-reports* |
| 133 | /{locale}/portal/student/rewards | Rewards | Student | Portal feature page | Track missions, stars/xp, redeem rewards | /api/gamification*, /api/missions* |
| 134 | /{locale}/portal/student/schedule | Schedule | Student | Portal feature page | View/filter | /api/classes*, /api/sessions* |
| 135 | /{locale}/portal/student/stars | Stars | Student | Portal feature page | Track missions, stars/xp, redeem rewards | /api/gamification*, /api/missions* |
| 136 | /{locale}/portal/student/streak | Streak | Student | Portal feature page | Track missions, stars/xp, redeem rewards | /api/gamification*, /api/missions* |
| 137 | /{locale}/portal/student/tests | Tests | Student | Portal feature page | View/filter | Need confirmation |
| 138 | /{locale}/portal/student/tests/[id] | Id | Student | Portal feature page | View/filter | Need confirmation |
| 139 | /{locale}/portal/student/xp | Xp | Student | Portal feature page | Track missions, stars/xp, redeem rewards | /api/gamification*, /api/missions* |
| 140 | /{locale}/portal/teacher | Teacher | Teacher | Portal feature page | View/filter | Need confirmation |
| 141 | /{locale}/portal/teacher/applications | Applications | Teacher | Portal feature page | View/filter | Need confirmation |
| 142 | /{locale}/portal/teacher/assignments | Assignments | Teacher | Portal feature page | Create/submit/grade homework | /api/homework*, /api/students/homework* |
| 143 | /{locale}/portal/teacher/assignments/[id] | Id | Teacher | Portal feature page | Create/submit/grade homework | /api/homework*, /api/students/homework* |
| 144 | /{locale}/portal/teacher/assignments/[id]/submissions/[homeworkStudentId] | Homeworkstudentid | Teacher | Portal feature page | Create/submit/grade homework | /api/homework*, /api/students/homework* |
| 145 | /{locale}/portal/teacher/attendance | Attendance | Teacher | Portal feature page | Mark/view attendance, submit notes | /api/attendance*, /api/sessions*, /api/teacher/timetable |
| 146 | /{locale}/portal/teacher/classes | Classes | Teacher | Portal feature page | View/filter | /api/classes*, /api/sessions* |
| 147 | /{locale}/portal/teacher/classes/[id] | Id | Teacher | Portal feature page | View/filter | /api/classes*, /api/sessions* |
| 148 | /{locale}/portal/teacher/feedback | Feedback | Teacher | Portal feature page | View/filter | /api/report-requests*, /api/session-reports*, /api/monthly-reports* |
| 149 | /{locale}/portal/teacher/feedback/monthly-report | Monthly Report | Teacher | Portal feature page | View/filter | /api/report-requests*, /api/session-reports*, /api/monthly-reports* |
| 150 | /{locale}/portal/teacher/feedback/session-report | Session Report | Teacher | Portal feature page | View/filter | /api/report-requests*, /api/session-reports*, /api/monthly-reports* |
| 151 | /{locale}/portal/teacher/gamification | Gamification | Teacher | Portal feature page | Track missions, stars/xp, redeem rewards | /api/gamification*, /api/missions* |
| 152 | /{locale}/portal/teacher/incident-reports | Incident Reports | Teacher | Portal feature page | Create, comment, assign, update status | /api/incident-reports* |
| 153 | /{locale}/portal/teacher/materials | Materials | Teacher | Portal feature page | View/filter | /api/teaching-materials*, /api/lesson-plans* |
| 154 | /{locale}/portal/teacher/media | Media | Teacher | Portal feature page | View/filter | Need confirmation |
| 155 | /{locale}/portal/teacher/notifications | Notifications | Teacher | Portal feature page | View/read/broadcast notifications | /api/notifications* |
| 156 | /{locale}/portal/teacher/profile | Profile | Teacher | Portal feature page | View/filter | /api/admin/users*, /api/profiles*, /api/auth/* |
| 157 | /{locale}/portal/teacher/report-requests | Report Requests | Teacher | Portal feature page | Create/complete/cancel request | /api/report-requests*, /api/session-reports*, /api/monthly-reports* |
| 158 | /{locale}/portal/teacher/schedule | Schedule | Teacher | Portal feature page | View/filter | /api/classes*, /api/sessions* |
| 159 | /{locale}/portal/teacher/schedule/[id] | Id | Teacher | Portal feature page | View/filter | /api/classes*, /api/sessions* |
| 160 | /{locale}/portal/teacher/subjects | Subjects | Teacher | Portal feature page | View/filter | /api/teaching-materials*, /api/lesson-plans* |
| 161 | /{locale}/portal/teacher/timesheet | Timesheet | Teacher | Portal feature page | View/filter | Need confirmation |
| 162 | /{locale}/profile/update | Update | Public | Need confirmation | View/filter | /api/admin/users*, /api/profiles*, /api/auth/* |

### Route Notes
- Dynamic routes found: `[id]`, `[homeworkStudentId]`.
- Locale is route-prefixed in the App Router: `/{locale}/...`.
- The table lists current implemented pages only; API/action columns are derived from code usage and endpoint constants (`constants/apiURL.ts`) and may be broad where pages are wrapper-only.

### Form-heavy Pages (Required fields found in code)
- Incident reports (`.../incident-reports` via `IncidentReportWorkspace`): required `branchId`, `subject`, `message`; optional `category`, `evidenceUrl`.
- Report requests (`.../report-requests` via `ReportRequestsWorkspace`): class/teacher/session or month-year context, priority, message, due date (depending on type).
- Pause enrollment (`.../pause-enrollments` via `PauseEnrollmentWorkspace`): student/profile context, pause dates, reason, outcome (`ContinueSameClass` / `ReassignEquivalentClass` / `ContinueWithTutoring`), reassignment payload when applicable.
- Auth pages (`/auth/*`): credentials/PIN/reset fields per page.

### Common Success/Failure States Across Pages
- Success states: toast notifications, list refresh, status badge transition (`Pending -> Approved/Rejected`, `Requested -> InProgress -> Submitted/Approved`, etc.), redirect to role dashboard after auth.
- Failure states: validation errors (required fields), permission errors (`403`), expired token/refresh failure (`401` -> login), domain conflict/state-transition errors from API.

## 3. Business Flow List
| Flow ID | Flow Name | Role | Related Pages | Description | Priority |
|---|---|---|---|---|---|
| FL-01 | Authentication & access control | All | `/{locale}/auth/*`, `/{locale}/portal`, `/403` | Login, token refresh, role-based routing and forbidden handling. | High |
| FL-02 | Lead to enrollment | Admin, Staff_Manager | `/portal/admin/leads`, `/portal/admin/placement-tests`, `/portal/admin/registrations`, `/portal/staff-management/leads`, `/portal/staff-management/placement-tests`, `/portal/staff-management/enrollments` | Convert leads through placement to active enrollments. | High |
| FL-03 | Class/schedule management | Admin, Staff_Manager, Teacher | `/portal/admin/classes`, `/portal/admin/schedule`, `/portal/admin/rooms`, `/portal/teacher/classes`, `/portal/teacher/schedule`, `/portal/staff-management/schedule` | Manage classes, sessions, and timetable visibility/allocation. | High |
| FL-04 | Attendance & leave/makeup | Teacher, Parent, Staff_Manager | `/portal/teacher/attendance`, `/portal/parent/attendance`, `/portal/parent/enrollment-pause`, `/portal/staff-management/makeup`, `/portal/staff-management/pause-enrollments` | Attendance marking and leave/pause/makeup credit lifecycle. | High |
| FL-05 | Homework lifecycle | Teacher, Student, Parent | `/portal/teacher/assignments*`, `/portal/student/homework*`, `/portal/parent/homework*` | Teacher assigns and grades; student submits; parent monitors. | High |
| FL-06 | Reports workflow | Teacher, Staff_Manager, Admin, Parent | `/portal/teacher/feedback*`, `/portal/staff-management/session-report`, `/portal/staff-management/monthly-report`, `/portal/admin/reports`, `/portal/parent/tests` | Session/monthly report drafting, review, publish, and parent viewing. | High |
| FL-07 | Incident/report-request workflow | Admin, Staff_Manager, Teacher, Staff_Accountant | `*/incident-reports`, `*/report-requests` | Create incidents/requests, assign, comment, complete/cancel, track status. | Medium |
| FL-08 | Gamification & rewards | Admin, Staff_Manager, Teacher, Student, Parent | `*/gamification`, `/portal/student/missions`, `/portal/student/rewards`, `/portal/student/stars`, `/portal/student/xp`, `/portal/student/streak` | Mission progress, stars/xp, reward redemption. | Medium |
| FL-09 | Finance/payment operations | Admin, Staff_Accountant, Parent | `/portal/admin/fees`, `/portal/admin/tuition-plans`, `/portal/admin/payroll`, `/portal/admin/cashbook`, `/portal/staff-accountant/*`, `/portal/parent/payment`, `/portal/parent/tuition` | Fee setup, receivables/payment pages, accountant operations. | Medium |
| FL-10 | Notifications & templates | Admin, Staff_Manager, Teacher, Student, Parent, Staff_Accountant | `*/notifications`, `/portal/staff-management/templates` | Inbox/broadcast/template-driven communications. | Medium |
| FL-11 | Content & teaching materials | Admin, Staff_Manager, Teacher, Student | `/portal/admin/documents`, `/portal/admin/materials`, `/portal/teacher/subjects`, `/portal/teacher/materials`, `/portal/staff-management/lesson-plans`, `/portal/student/materials` | Lesson-plan/material creation, review, and learner access. | Medium |
| FL-12 | Profile/account management | All authenticated roles | `*/profile`, `/portal/admin/accounts`, `/portal/staff-management/accounts`, `/portal/parent/account`, `/{locale}/profile/update`, `/{locale}/activate-profile` | Account/profile updates, role/profile linking context. | Medium |

## 4. Detailed Flow Steps

### FL-01 Authentication & Access
- Preconditions:
  - User account exists.
  - Auth endpoints configured (`/api/auth/*`).
- Steps:
  - User opens login page and submits credentials.
  - Frontend calls `/api/auth/login`.
  - On success, user is redirected to `/{locale}/portal` and routed by role.
  - `proxy.ts` validates token/cookie role and checks prefix authorization.
- Expected result:
  - Role-specific portal loads.
  - Unauthorized path redirects to `/403`.
- Related API:
  - `/api/auth/login`, `/api/auth/refresh-token`, `/api/auth/me`, `/api/auth/logout`, `/api/auth/profile/*`.
- Possible bugs to check:
  - Role normalization mismatch in `normalizeRole`.
  - Refresh loop / stale token.
  - Wrong redirect locale/returnTo.

### FL-02 Lead -> Placement -> Enrollment
- Preconditions:
  - Admin/Staff_Manager role.
  - Leads and placement modules enabled.
- Steps:
  - Create/import lead, assign owner, add notes/children.
  - Create placement test and submit result.
  - Convert placement outcome into enrollment.
  - Assign tuition plan and class.
- Expected result:
  - Enrollment created in active lifecycle state.
- Related API:
  - `/api/leads*`, `/api/placement-tests*`, `/api/enrollments*`, `/api/registrations*`.
- Possible bugs to check:
  - Duplicate lead handling.
  - Invalid state transitions.
  - Branch scope leakage.

### FL-03 Class & Schedule Management
- Preconditions:
  - Admin or manager role; classes/rooms data exists.
- Steps:
  - Create/update class.
  - Generate sessions or edit schedule.
  - Assign teacher/room where supported.
  - Teacher verifies schedule visibility.
- Expected result:
  - Session timetable reflects changes consistently.
- Related API:
  - `/api/classes*`, `/api/sessions*`, `/api/classrooms*`, `/api/teacher/timetable`.
- Possible bugs to check:
  - Schedule conflicts not blocked.
  - Session generation duplicates.
  - Teacher timetable out-of-sync.

### FL-04 Attendance + Leave/Makeup/Pause
- Preconditions:
  - Teacher has class/session; parent has active student context.
- Steps:
  - Teacher marks attendance and submits note/report.
  - Parent submits leave or pause request.
  - Staff reviews/approves/rejects; reassign/continue outcome when needed.
  - Makeup credit is allocated/used/expired per workflow.
- Expected result:
  - Attendance and request states are auditable and consistent.
- Related API:
  - `/api/attendance*`, `/api/leave-requests*`, `/api/pause-enrollment-requests*`, `/api/makeup-credits*`.
- Possible bugs to check:
  - Re-open locked attendance sessions.
  - Partial approve-bulk failures without clear row feedback.
  - Credit expiry/use race conditions.

### FL-05 Homework Lifecycle
- Preconditions:
  - Teacher has class/session; student has active profile.
- Steps:
  - Teacher creates assignment with due date/content.
  - Student opens detail and submits answers/files.
  - Teacher reviews submissions and grades/feedback.
  - Parent views child homework status.
- Expected result:
  - Submission and grading states update correctly.
- Related API:
  - `/api/homework*`, `/api/homework/submissions*`, `/api/students/homework*`.
- Possible bugs to check:
  - Late submission policy inconsistency.
  - Grading permission bypass.
  - Missing feedback visibility for parent/student.

### FL-06 Session/Monthly Reports
- Preconditions:
  - Teacher reports exist for class sessions/month.
- Steps:
  - Teacher drafts and submits report.
  - Management/admin reviews: approve/reject/publish.
  - Parent views published reports.
- Expected result:
  - Status progression matches workflow and comments preserved.
- Related API:
  - `/api/session-reports*`, `/api/monthly-reports*`, `/api/report-requests*`.
- Possible bugs to check:
  - Status alias mismatch (`Review` vs `Submitted`).
  - Comment loss on reject/re-submit.
  - Published visibility to wrong audience.

### FL-07 Incident Reports
- Preconditions:
  - Authenticated role with incident page access.
- Steps:
  - Create incident with required fields.
  - Assign report to user and add comments.
  - Transition status through handling lifecycle.
- Expected result:
  - Timeline/audit of incident actions is complete.
- Related API:
  - `/api/incident-reports*`, `/api/admin/users`, `/api/branches/all`.
- Possible bugs to check:
  - Invalid status transitions allowed.
  - Assignee list scope incorrect.
  - Branch filtering mismatch.

### FL-08 Report Requests
- Preconditions:
  - Reporter and assignee role pages available.
- Steps:
  - Create request (monthly/session, class/student context, priority, due date).
  - Assignee updates progress and completes/cancels.
- Expected result:
  - Request status and due timeline visible to both sides.
- Related API:
  - `/api/report-requests*`, `/api/classes`, `/api/teacher/timetable`.
- Possible bugs to check:
  - Missing validation for due date/type fields.
  - Request completion without required output.

### FL-09 Gamification
- Preconditions:
  - Student profile context active.
- Steps:
  - Student tracks missions/xp/stars/streak.
  - Admin/manager config rewards/mission rules.
  - Student redeems reward; staff processes redemption.
- Expected result:
  - Balance, level, and redemption state remain consistent.
- Related API:
  - `/api/gamification*`, `/api/missions*`.
- Possible bugs to check:
  - Balance drift after cancel/approve flows.
  - Duplicate check-in or mission progress events.

### FL-10 Finance/Payment
- Preconditions:
  - Finance modules/pages accessible by role.
- Steps:
  - Admin defines tuition plans/fees.
  - Accountant processes invoice/dues/adjustments.
  - Parent checks payment/tuition pages.
- Expected result:
  - Financial status aligns across admin/accountant/parent views.
- Related API:
  - `/api/tuition-plans*`, `/api/finance/*`, plus role-specific finance integrations.
- Possible bugs to check:
  - Partial implementation placeholders.
  - Inconsistent payment status mapping.

### FL-11 Notifications
- Preconditions:
  - Notification pages enabled per role.
- Steps:
  - Admin/manager creates broadcast/template.
  - Recipients view inbox, mark as read, navigate to target action.
- Expected result:
  - Delivery and unread counters are accurate by role.
- Related API:
  - `/api/notifications*`, `/api/notifications/templates*`, `/api/notifications/broadcast*`.
- Possible bugs to check:
  - Role targeting errors.
  - Read state not persisting.

### FL-12 Profile & Account
- Preconditions:
  - Authenticated user or activation/reset token context.
- Steps:
  - User updates profile/account data.
  - Admin/staff updates account/branch assignment where permitted.
  - Activation/reset flows complete and redirect by role.
- Expected result:
  - Profile/account changes persist and role routing remains correct.
- Related API:
  - `/api/admin/users*`, `/api/profiles*`, `/api/auth/profile/*`, `/api/auth/reset-*`.
- Possible bugs to check:
  - Parent/student profile selection leakage.
  - Stale profile cache after update.

## 5. Missing or Unclear Flows
- Legacy staff routes under `/{locale}/portal/staff/*` exist, but role mapping is not in `lib/role.ts` (`Need confirmation`).
- Several pages appear wrapper/demo-heavy with limited direct API integration evidence (especially some finance/media/support/reports variants) (`Partial`).
- Role-specific permission details beyond route prefix (branch-level scope, per-entity ownership checks) are mostly backend-driven and not explicit in frontend (`Need confirmation`).
- Some pages are present in menu/docs but integration depth is inconsistent by role (for example monthly/session report variants and certain parent utility pages) (`Partial`).
- Route-level forms/actions for thin wrapper pages rely on nested components; where direct page code has no visible forms, mapping is inferred from imported workspace components (`Need confirmation`).

---
Validation scope used for this map:
- Route scan: all `app/**/page.tsx` files.
- Navigation/menu dictionaries: `lib/dict/menu/*`.
- Role guard: `proxy.ts`, `lib/role.ts`, `lib/routes/index.ts`.
- API references: `constants/apiURL.ts` and `lib/api/*Service.ts`.
- Flow behavior evidence: workspace components and docs `docs/SWIMLANE_ACTIVE_FLOWS.md`.
