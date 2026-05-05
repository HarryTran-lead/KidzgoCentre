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
