# QA Bug Report

## Bug BUG-001
- Bug ID: BUG-001
- Feature/Flow: 01-admissions-flow.spec.ts
- Role: Need confirmation
- Severity: Critical
- Steps to reproduce:
  - Run Playwright test: staff can manage admissions pipeline and class assignment visibility
  - Open test trace/video and repeat the same UI flow.
- Expected result:
  - Test flow completes successfully.
- Actual result:
  - Error: expect(page).not.toHaveURL(expected) failed  Expected pattern: not /\/auth\/login/ Received string: "http://127.0.0.1:3000/vi/auth/login" Timeout: 15000ms  Call log:   - Expect "not toHaveURL" with timeout 15000ms
- Screenshot/video path: C:\Users\RAZER\Downloads\REX_SYSTEM\KidzgoCentre\test-results\01-admissions-flow-Admissi-097d5-class-assignment-visibility-chromium\error-context.md, C:\Users\RAZER\Downloads\REX_SYSTEM\KidzgoCentre\test-results\01-admissions-flow-Admissi-097d5-class-assignment-visibility-chromium\trace.zip
- Possible cause:
  - Backend validation/authorization mismatch or unstable UI selectors/state handling.
- Suggested fix:
  - Align API contract and UI feedback; add deterministic test ids and stronger loading/error handling.

## Bug BUG-002
- Bug ID: BUG-002
- Feature/Flow: 02-teaching-homework-flow.spec.ts
- Role: Need confirmation
- Severity: Critical
- Steps to reproduce:
  - Run Playwright test: teacher attendance-homework and student submission visibility
  - Open test trace/video and repeat the same UI flow.
- Expected result:
  - Test flow completes successfully.
- Actual result:
  - Error: expect(page).not.toHaveURL(expected) failed  Expected pattern: not /\/auth\/login/ Received string: "http://127.0.0.1:3000/vi/auth/login" Timeout: 15000ms  Call log:   - Expect "not toHaveURL" with timeout 15000ms
- Screenshot/video path: C:\Users\RAZER\Downloads\REX_SYSTEM\KidzgoCentre\test-results\02-teaching-homework-flow--f825b-udent-submission-visibility-chromium\test-failed-1.png, C:\Users\RAZER\Downloads\REX_SYSTEM\KidzgoCentre\test-results\02-teaching-homework-flow--f825b-udent-submission-visibility-chromium\error-context.md, C:\Users\RAZER\Downloads\REX_SYSTEM\KidzgoCentre\test-results\02-teaching-homework-flow--f825b-udent-submission-visibility-chromium\trace.zip
- Possible cause:
  - Backend validation/authorization mismatch or unstable UI selectors/state handling.
- Suggested fix:
  - Align API contract and UI feedback; add deterministic test ids and stronger loading/error handling.

## Bug BUG-003
- Bug ID: BUG-003
- Feature/Flow: 03-parent-multi-child-flow.spec.ts
- Role: Need confirmation
- Severity: High
- Steps to reproduce:
  - Run Playwright test: parent can switch child context and cannot access foreign profile
  - Open test trace/video and repeat the same UI flow.
- Expected result:
  - Test flow completes successfully.
- Actual result:
  - Error: expect(page).not.toHaveURL(expected) failed  Expected pattern: not /\/auth\/login/ Received string: "http://127.0.0.1:3000/vi/auth/login" Timeout: 15000ms  Call log:   - Expect "not toHaveURL" with timeout 15000ms
- Screenshot/video path: C:\Users\RAZER\Downloads\REX_SYSTEM\KidzgoCentre\test-results\03-parent-multi-child-flow-2f06b-nnot-access-foreign-profile-chromium\test-failed-1.png, C:\Users\RAZER\Downloads\REX_SYSTEM\KidzgoCentre\test-results\03-parent-multi-child-flow-2f06b-nnot-access-foreign-profile-chromium\error-context.md, C:\Users\RAZER\Downloads\REX_SYSTEM\KidzgoCentre\test-results\03-parent-multi-child-flow-2f06b-nnot-access-foreign-profile-chromium\trace.zip
- Possible cause:
  - Backend validation/authorization mismatch or unstable UI selectors/state handling.
- Suggested fix:
  - Align API contract and UI feedback; add deterministic test ids and stronger loading/error handling.

## Bug BUG-004
- Bug ID: BUG-004
- Feature/Flow: 04-finance-flow.spec.ts
- Role: Need confirmation
- Severity: Critical
- Steps to reproduce:
  - Run Playwright test: accountant/staff and parent can see finance statuses
  - Open test trace/video and repeat the same UI flow.
- Expected result:
  - Test flow completes successfully.
- Actual result:
  - Error: expect(page).not.toHaveURL(expected) failed  Expected pattern: not /\/auth\/login/ Received string: "http://127.0.0.1:3000/vi/auth/login" Timeout: 15000ms  Call log:   - Expect "not toHaveURL" with timeout 15000ms
- Screenshot/video path: C:\Users\RAZER\Downloads\REX_SYSTEM\KidzgoCentre\test-results\04-finance-flow-Finance-Fl-72569-nt-can-see-finance-statuses-chromium\test-failed-1.png, C:\Users\RAZER\Downloads\REX_SYSTEM\KidzgoCentre\test-results\04-finance-flow-Finance-Fl-72569-nt-can-see-finance-statuses-chromium\error-context.md, C:\Users\RAZER\Downloads\REX_SYSTEM\KidzgoCentre\test-results\04-finance-flow-Finance-Fl-72569-nt-can-see-finance-statuses-chromium\trace.zip
- Possible cause:
  - Backend validation/authorization mismatch or unstable UI selectors/state handling.
- Suggested fix:
  - Align API contract and UI feedback; add deterministic test ids and stronger loading/error handling.

## Bug BUG-005
- Bug ID: BUG-005
- Feature/Flow: 05-admin-management-flow.spec.ts
- Role: Need confirmation
- Severity: High
- Steps to reproduce:
  - Run Playwright test: non-admin role cannot access admin pages
  - Open test trace/video and repeat the same UI flow.
- Expected result:
  - Test flow completes successfully.
- Actual result:
  - Error: 1. [api-error] 404 http://127.0.0.1:3000/vi/403 2. [console-error] Failed to load resource: the server responded with a status of 404 (Not Found)  expect(received).toHaveLength(expected)  Expected length: 0 Received length: 2 Received array:  [{"detail": "404 http://127.0.0.1:3000/vi/403", "type": "api-error"}, {"detail": "Failed to load resource: the server responded with a status of 404 (Not Found)", "type": "console-error"}]
- Screenshot/video path: C:\Users\RAZER\Downloads\REX_SYSTEM\KidzgoCentre\test-results\05-admin-management-flow-A-404b6-e-cannot-access-admin-pages-chromium\video.webm, C:\Users\RAZER\Downloads\REX_SYSTEM\KidzgoCentre\test-results\05-admin-management-flow-A-404b6-e-cannot-access-admin-pages-chromium\test-failed-1.png, C:\Users\RAZER\Downloads\REX_SYSTEM\KidzgoCentre\test-results\05-admin-management-flow-A-404b6-e-cannot-access-admin-pages-chromium\error-context.md, C:\Users\RAZER\Downloads\REX_SYSTEM\KidzgoCentre\test-results\05-admin-management-flow-A-404b6-e-cannot-access-admin-pages-chromium\trace.zip
- Possible cause:
  - Backend validation/authorization mismatch or unstable UI selectors/state handling.
- Suggested fix:
  - Align API contract and UI feedback; add deterministic test ids and stronger loading/error handling.

## Bug BUG-006
- Bug ID: BUG-006
- Feature/Flow: 06-notification-flow.spec.ts
- Role: Need confirmation
- Severity: Medium
- Steps to reproduce:
  - Run Playwright test: teacher can view notifications
  - Open test trace/video and repeat the same UI flow.
- Expected result:
  - Test flow completes successfully.
- Actual result:
  - Error: Notification content missing  expect(received).toBeTruthy()  Received: false    11 |   12 |   expect(hasTitle, "Notification title missing").toBeTruthy();
- Screenshot/video path: C:\Users\RAZER\Downloads\REX_SYSTEM\KidzgoCentre\test-results\06-notification-flow-Notif-3443e-cher-can-view-notifications-chromium\test-failed-1.png, C:\Users\RAZER\Downloads\REX_SYSTEM\KidzgoCentre\test-results\06-notification-flow-Notif-3443e-cher-can-view-notifications-chromium\video.webm, C:\Users\RAZER\Downloads\REX_SYSTEM\KidzgoCentre\test-results\06-notification-flow-Notif-3443e-cher-can-view-notifications-chromium\error-context.md, C:\Users\RAZER\Downloads\REX_SYSTEM\KidzgoCentre\test-results\06-notification-flow-Notif-3443e-cher-can-view-notifications-chromium\trace.zip
- Possible cause:
  - Backend validation/authorization mismatch or unstable UI selectors/state handling.
- Suggested fix:
  - Align API contract and UI feedback; add deterministic test ids and stronger loading/error handling.

## Bug BUG-007
- Bug ID: BUG-007
- Feature/Flow: 06-notification-flow.spec.ts
- Role: Need confirmation
- Severity: Medium
- Steps to reproduce:
  - Run Playwright test: parent can view notifications
  - Open test trace/video and repeat the same UI flow.
- Expected result:
  - Test flow completes successfully.
- Actual result:
  - Error: Notification title missing  expect(received).toBeTruthy()  Received: false    10 |   const hasDate = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}:\d{2}/.test(body);   11 |
- Screenshot/video path: C:\Users\RAZER\Downloads\REX_SYSTEM\KidzgoCentre\test-results\06-notification-flow-Notif-a0da6-rent-can-view-notifications-chromium\test-failed-1.png, C:\Users\RAZER\Downloads\REX_SYSTEM\KidzgoCentre\test-results\06-notification-flow-Notif-a0da6-rent-can-view-notifications-chromium\video.webm, C:\Users\RAZER\Downloads\REX_SYSTEM\KidzgoCentre\test-results\06-notification-flow-Notif-a0da6-rent-can-view-notifications-chromium\error-context.md, C:\Users\RAZER\Downloads\REX_SYSTEM\KidzgoCentre\test-results\06-notification-flow-Notif-a0da6-rent-can-view-notifications-chromium\trace.zip
- Possible cause:
  - Backend validation/authorization mismatch or unstable UI selectors/state handling.
- Suggested fix:
  - Align API contract and UI feedback; add deterministic test ids and stronger loading/error handling.
