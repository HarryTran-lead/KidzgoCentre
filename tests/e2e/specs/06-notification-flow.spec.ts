import { test, expect } from "../helpers/fixture";
import { gotoPortal, loginAs } from "../helpers/auth";
import { hasCredentials } from "../helpers/env";
import { waitForLoadingToEnd } from "../helpers/qaRules";

async function assertNotificationFields(page: any) {
  const body = await page.locator("body").innerText();
  const hasTitle = /thong bao|thông báo|notification|title|tieu de|tiêu đề/i.test(body);
  const hasContent = /noi dung|nội dung|content|message/i.test(body);
  const hasDate = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}:\d{2}/.test(body);

  expect(hasTitle, "Notification title missing").toBeTruthy();
  expect(hasContent, "Notification content missing").toBeTruthy();
  expect(hasDate, "Notification date/time missing").toBeTruthy();
}

test.describe("Notification Flow", () => {
  test("teacher can view notifications", async ({ page }) => {
    test.skip(!hasCredentials("teacher"), "Missing teacher credentials");
    await loginAs(page, "teacher");
    await gotoPortal(page, "/portal/teacher/notifications");
    await waitForLoadingToEnd(page);
    await assertNotificationFields(page);
  });

  test("parent can view notifications", async ({ page }) => {
    test.skip(!hasCredentials("parent"), "Missing parent credentials");
    await loginAs(page, "parent");
    await gotoPortal(page, "/portal/parent/notifications");
    await waitForLoadingToEnd(page);
    await assertNotificationFields(page);
  });

  test("student can view notifications", async ({ page }) => {
    test.skip(!hasCredentials("student"), "Missing student credentials");
    await loginAs(page, "student");
    await gotoPortal(page, "/portal/student/notifications");
    await waitForLoadingToEnd(page);
    await assertNotificationFields(page);
  });
});
