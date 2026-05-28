# Full Web Sweep Report

- Total routes scanned: 142
- Passed: 12
- Failed: 109
- Skipped: 21

| No | Route | Role | Status | Detail |
|---:|---|---|---|---|
| 1 | / | Public | FAIL | TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
[2m  - navigating to "http://127.0.0.1:3000/", waiting until "load"[22m
 |
| 3 | /{locale} | Public | PASS | url=http://127.0.0.1:3000/vi |
| 4 | /{locale}/activate-profile | Public | PASS | url=http://127.0.0.1:3000/vi/activate-profile |
| 5 | /{locale}/auth/forgotpassword | Public | PASS | url=http://127.0.0.1:3000/vi/auth/forgotpassword |
| 6 | /{locale}/auth/login | Public | PASS | url=http://127.0.0.1:3000/vi/auth/login |
| 7 | /{locale}/auth/register | Public | PASS | url=http://127.0.0.1:3000/vi/auth/register |
| 8 | /{locale}/auth/reset-password | Public | PASS | url=http://127.0.0.1:3000/vi/auth/reset-password |
| 9 | /{locale}/auth/reset-pin | Public | PASS | url=http://127.0.0.1:3000/vi/auth/reset-pin |
| 10 | /{locale}/blogs | Public | PASS | url=http://127.0.0.1:3000/vi/blogs |
| 11 | /{locale}/contact | Public | PASS | url=http://127.0.0.1:3000/vi/contact |
| 12 | /{locale}/faqs | Public | PASS | url=http://127.0.0.1:3000/vi/faqs |
| 162 | /{locale}/profile/update | Public | PASS | url=http://127.0.0.1:3000/vi/profile/update |
| 2 | /403 | All | PASS | url=http://127.0.0.1:3000/vi/403 |
| 13 | /{locale}/portal | Authenticated (chooser) | FAIL | Role login failed for admin: TimeoutError: locator.fill: Timeout 20000ms exceeded.
Call log:
[2m  - waiting for locator('input[name="email"]')[22m
 |
| 14 | /{locale}/portal/admin | Admin | FAIL | Role login failed for Admin: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 15 | /{locale}/portal/admin/accounts | Admin | FAIL | Role login failed for Admin: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 16 | /{locale}/portal/admin/blogs | Admin | FAIL | Role login failed for Admin: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 17 | /{locale}/portal/admin/branches | Admin | FAIL | Role login failed for Admin: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 18 | /{locale}/portal/admin/cashbook | Admin | FAIL | Role login failed for Admin: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 19 | /{locale}/portal/admin/center | Admin | FAIL | Role login failed for Admin: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 20 | /{locale}/portal/admin/classes | Admin | FAIL | Role login failed for Admin: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 22 | /{locale}/portal/admin/courses | Admin | FAIL | Role login failed for Admin: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 23 | /{locale}/portal/admin/courses/branch | Admin | FAIL | Role login failed for Admin: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 24 | /{locale}/portal/admin/courses/system | Admin | FAIL | Role login failed for Admin: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 25 | /{locale}/portal/admin/discount-campaigns | Admin | FAIL | Role login failed for Admin: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 26 | /{locale}/portal/admin/documents | Admin | FAIL | Role login failed for Admin: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 27 | /{locale}/portal/admin/enrollments | Admin | FAIL | Role login failed for Admin: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 28 | /{locale}/portal/admin/extracurricular | Admin | FAIL | Role login failed for Admin: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 29 | /{locale}/portal/admin/faqs | Admin | FAIL | Role login failed for Admin: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 30 | /{locale}/portal/admin/feedback | Admin | FAIL | Role login failed for Admin: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 31 | /{locale}/portal/admin/feedback/monthly | Admin | FAIL | Role login failed for Admin: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 32 | /{locale}/portal/admin/feedback/session | Admin | FAIL | Role login failed for Admin: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 33 | /{locale}/portal/admin/fees | Admin | FAIL | Role login failed for Admin: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 34 | /{locale}/portal/admin/gamification | Admin | FAIL | Role login failed for Admin: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 35 | /{locale}/portal/admin/leads | Admin | FAIL | Role login failed for Admin: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 36 | /{locale}/portal/admin/materials | Admin | FAIL | Role login failed for Admin: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 37 | /{locale}/portal/admin/media | Admin | FAIL | Role login failed for Admin: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 38 | /{locale}/portal/admin/notifications | Admin | FAIL | Role login failed for Admin: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 39 | /{locale}/portal/admin/pause-enrollments | Admin | FAIL | Role login failed for Admin: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 40 | /{locale}/portal/admin/payment-setting | Admin | FAIL | Role login failed for Admin: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 41 | /{locale}/portal/admin/payment-setting/branch | Admin | FAIL | Role login failed for Admin: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 42 | /{locale}/portal/admin/payroll | Admin | FAIL | Role login failed for Admin: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 43 | /{locale}/portal/admin/placement-tests | Admin | FAIL | Role login failed for Admin: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 44 | /{locale}/portal/admin/profile | Admin | FAIL | Role login failed for Admin: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 45 | /{locale}/portal/admin/question-bank | Admin | FAIL | Role login failed for Admin: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 46 | /{locale}/portal/admin/registrations | Admin | FAIL | Role login failed for Admin: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 47 | /{locale}/portal/admin/registrations/payment-setting | Admin | FAIL | Role login failed for Admin: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 48 | /{locale}/portal/admin/registrations/payment-setting/branch | Admin | FAIL | Role login failed for Admin: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 49 | /{locale}/portal/admin/report-requests | Admin | FAIL | Role login failed for Admin: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 50 | /{locale}/portal/admin/reports | Admin | FAIL | Role login failed for Admin: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 51 | /{locale}/portal/admin/rooms | Admin | FAIL | Role login failed for Admin: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 52 | /{locale}/portal/admin/schedule | Admin | FAIL | Role login failed for Admin: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 54 | /{locale}/portal/admin/settings | Admin | FAIL | Role login failed for Admin: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 55 | /{locale}/portal/admin/teachers | Admin | FAIL | Role login failed for Admin: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 56 | /{locale}/portal/admin/tuition-plans | Admin | FAIL | Role login failed for Admin: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 57 | /{locale}/portal/parent | Parent | FAIL | Role login failed for Parent: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 58 | /{locale}/portal/parent/account | Parent | FAIL | Role login failed for Parent: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 59 | /{locale}/portal/parent/approvals | Parent | FAIL | Role login failed for Parent: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 60 | /{locale}/portal/parent/attendance | Parent | FAIL | Role login failed for Parent: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 61 | /{locale}/portal/parent/attendance-history | Parent | FAIL | Role login failed for Parent: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 62 | /{locale}/portal/parent/enrollment-pause | Parent | FAIL | Role login failed for Parent: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 63 | /{locale}/portal/parent/gamification | Parent | FAIL | Role login failed for Parent: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 64 | /{locale}/portal/parent/homework | Parent | FAIL | Role login failed for Parent: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 66 | /{locale}/portal/parent/media | Parent | FAIL | Role login failed for Parent: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 67 | /{locale}/portal/parent/notifications | Parent | FAIL | Role login failed for Parent: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 68 | /{locale}/portal/parent/payment | Parent | FAIL | Role login failed for Parent: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 69 | /{locale}/portal/parent/profile | Parent | FAIL | Role login failed for Parent: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 70 | /{locale}/portal/parent/progress | Parent | FAIL | Role login failed for Parent: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 71 | /{locale}/portal/parent/schedule | Parent | FAIL | Role login failed for Parent: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 72 | /{locale}/portal/parent/support | Parent | FAIL | Role login failed for Parent: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 73 | /{locale}/portal/parent/tests | Parent | FAIL | Role login failed for Parent: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 74 | /{locale}/portal/parent/tuition | Parent | FAIL | Role login failed for Parent: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 75 | /{locale}/portal/staff | Need confirmation (legacy staff) | FAIL | Role login failed for Need confirmation (legacy staff): Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 76 | /{locale}/portal/staff/announcements | Need confirmation (legacy staff) | FAIL | Role login failed for Need confirmation (legacy staff): Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 77 | /{locale}/portal/staff/enrollments | Need confirmation (legacy staff) | FAIL | Role login failed for Need confirmation (legacy staff): Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 78 | /{locale}/portal/staff/enrollments/announcements | Need confirmation (legacy staff) | FAIL | Role login failed for Need confirmation (legacy staff): Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 79 | /{locale}/portal/staff/fees | Need confirmation (legacy staff) | FAIL | Role login failed for Need confirmation (legacy staff): Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 80 | /{locale}/portal/staff/reports | Need confirmation (legacy staff) | FAIL | Role login failed for Need confirmation (legacy staff): Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 81 | /{locale}/portal/staff/students | Need confirmation (legacy staff) | FAIL | Role login failed for Need confirmation (legacy staff): Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 92 | /{locale}/portal/staff-management | Staff_Manager | FAIL | Role login failed for Staff_Manager: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 93 | /{locale}/portal/staff-management/accounts | Staff_Manager | FAIL | Role login failed for Staff_Manager: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 94 | /{locale}/portal/staff-management/enrollments | Staff_Manager | FAIL | Role login failed for Staff_Manager: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 95 | /{locale}/portal/staff-management/feedback | Staff_Manager | FAIL | Role login failed for Staff_Manager: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 96 | /{locale}/portal/staff-management/feedback/monthly | Staff_Manager | FAIL | Role login failed for Staff_Manager: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 97 | /{locale}/portal/staff-management/feedback/session | Staff_Manager | FAIL | Role login failed for Staff_Manager: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 98 | /{locale}/portal/staff-management/gamification | Staff_Manager | FAIL | Role login failed for Staff_Manager: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 99 | /{locale}/portal/staff-management/incident-reports | Staff_Manager | FAIL | Role login failed for Staff_Manager: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 100 | /{locale}/portal/staff-management/leads | Staff_Manager | FAIL | Role login failed for Staff_Manager: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 101 | /{locale}/portal/staff-management/lesson-plans | Staff_Manager | FAIL | Role login failed for Staff_Manager: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 102 | /{locale}/portal/staff-management/makeup | Staff_Manager | FAIL | Role login failed for Staff_Manager: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 103 | /{locale}/portal/staff-management/materials | Staff_Manager | FAIL | Role login failed for Staff_Manager: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 104 | /{locale}/portal/staff-management/media | Staff_Manager | FAIL | Role login failed for Staff_Manager: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 105 | /{locale}/portal/staff-management/monthly-report | Staff_Manager | FAIL | Role login failed for Staff_Manager: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 106 | /{locale}/portal/staff-management/notifications | Staff_Manager | FAIL | Role login failed for Staff_Manager: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 107 | /{locale}/portal/staff-management/pause-enrollments | Staff_Manager | FAIL | Role login failed for Staff_Manager: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 108 | /{locale}/portal/staff-management/placement-tests | Staff_Manager | FAIL | Role login failed for Staff_Manager: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 109 | /{locale}/portal/staff-management/profile | Staff_Manager | FAIL | Role login failed for Staff_Manager: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 110 | /{locale}/portal/staff-management/report-requests | Staff_Manager | FAIL | Role login failed for Staff_Manager: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 111 | /{locale}/portal/staff-management/schedule | Staff_Manager | FAIL | Role login failed for Staff_Manager: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 113 | /{locale}/portal/staff-management/session-report | Staff_Manager | FAIL | Role login failed for Staff_Manager: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 114 | /{locale}/portal/staff-management/students | Staff_Manager | FAIL | Role login failed for Staff_Manager: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 115 | /{locale}/portal/staff-management/templates | Staff_Manager | FAIL | Role login failed for Staff_Manager: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 116 | /{locale}/portal/staff-management/tickets | Staff_Manager | FAIL | Role login failed for Staff_Manager: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 117 | /{locale}/portal/student | Student | SKIP | Missing credentials for role Student. |
| 118 | /{locale}/portal/student/ai-speaking | Student | SKIP | Missing credentials for role Student. |
| 119 | /{locale}/portal/student/ai-tutor | Student | SKIP | Missing credentials for role Student. |
| 120 | /{locale}/portal/student/application | Student | SKIP | Missing credentials for role Student. |
| 121 | /{locale}/portal/student/attendance | Student | SKIP | Missing credentials for role Student. |
| 122 | /{locale}/portal/student/gamification | Student | SKIP | Missing credentials for role Student. |
| 123 | /{locale}/portal/student/homework | Student | SKIP | Missing credentials for role Student. |
| 125 | /{locale}/portal/student/level | Student | SKIP | Missing credentials for role Student. |
| 126 | /{locale}/portal/student/materials | Student | SKIP | Missing credentials for role Student. |
| 127 | /{locale}/portal/student/media | Student | SKIP | Missing credentials for role Student. |
| 128 | /{locale}/portal/student/missions | Student | SKIP | Missing credentials for role Student. |
| 129 | /{locale}/portal/student/notifications | Student | SKIP | Missing credentials for role Student. |
| 130 | /{locale}/portal/student/notifications/materials | Student | SKIP | Missing credentials for role Student. |
| 131 | /{locale}/portal/student/profile | Student | SKIP | Missing credentials for role Student. |
| 132 | /{locale}/portal/student/reports | Student | SKIP | Missing credentials for role Student. |
| 133 | /{locale}/portal/student/rewards | Student | SKIP | Missing credentials for role Student. |
| 134 | /{locale}/portal/student/schedule | Student | SKIP | Missing credentials for role Student. |
| 135 | /{locale}/portal/student/stars | Student | SKIP | Missing credentials for role Student. |
| 136 | /{locale}/portal/student/streak | Student | SKIP | Missing credentials for role Student. |
| 137 | /{locale}/portal/student/tests | Student | SKIP | Missing credentials for role Student. |
| 139 | /{locale}/portal/student/xp | Student | SKIP | Missing credentials for role Student. |
| 140 | /{locale}/portal/teacher | Teacher | FAIL | Role login failed for Teacher: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 141 | /{locale}/portal/teacher/applications | Teacher | FAIL | Role login failed for Teacher: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 142 | /{locale}/portal/teacher/assignments | Teacher | FAIL | Role login failed for Teacher: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 145 | /{locale}/portal/teacher/attendance | Teacher | FAIL | Role login failed for Teacher: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 146 | /{locale}/portal/teacher/classes | Teacher | FAIL | Role login failed for Teacher: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 148 | /{locale}/portal/teacher/feedback | Teacher | FAIL | Role login failed for Teacher: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 149 | /{locale}/portal/teacher/feedback/monthly-report | Teacher | FAIL | Role login failed for Teacher: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 150 | /{locale}/portal/teacher/feedback/session-report | Teacher | FAIL | Role login failed for Teacher: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 151 | /{locale}/portal/teacher/gamification | Teacher | FAIL | Role login failed for Teacher: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 152 | /{locale}/portal/teacher/incident-reports | Teacher | FAIL | Role login failed for Teacher: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 153 | /{locale}/portal/teacher/materials | Teacher | FAIL | Role login failed for Teacher: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 154 | /{locale}/portal/teacher/media | Teacher | FAIL | Role login failed for Teacher: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 155 | /{locale}/portal/teacher/notifications | Teacher | FAIL | Role login failed for Teacher: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 156 | /{locale}/portal/teacher/profile | Teacher | FAIL | Role login failed for Teacher: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 157 | /{locale}/portal/teacher/report-requests | Teacher | FAIL | Role login failed for Teacher: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 158 | /{locale}/portal/teacher/schedule | Teacher | FAIL | Role login failed for Teacher: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 160 | /{locale}/portal/teacher/subjects | Teacher | FAIL | Role login failed for Teacher: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |
| 161 | /{locale}/portal/teacher/timesheet | Teacher | FAIL | Role login failed for Teacher: Error: page.goto: Page crashed
Call log:
[2m  - navigating to "http://127.0.0.1:3000/vi/auth/login", waiting until "load"[22m
 |