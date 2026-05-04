import { test, expect } from "../helpers/fixture";
import { gotoPortal, loginAs } from "../helpers/auth";
import { hasCredentials } from "../helpers/env";
import { submitAndExpectFeedback, waitForLoadingToEnd } from "../helpers/qaRules";

test.describe("Admin Management Flow", () => {
  test("admin can access management pages and validation blocks empty required fields", async ({ page }) => {
    test.skip(!hasCredentials("admin"), "Missing admin credentials");

    await loginAs(page, "admin");

    await gotoPortal(page, "/portal/admin/accounts");
    await waitForLoadingToEnd(page);
    await expect(page).toHaveURL(/portal\/admin\/accounts/);

    await gotoPortal(page, "/portal/admin/programs");
    await waitForLoadingToEnd(page);

    await gotoPortal(page, "/portal/admin/classes");
    await waitForLoadingToEnd(page);

    await gotoPortal(page, "/portal/admin/teachers");
    await waitForLoadingToEnd(page);

    await gotoPortal(page, "/portal/admin/accounts");
    const addButton = page.getByRole("button", { name: /create|add|them|thêm|tao|tạo/i }).first();
    if (await addButton.count()) {
      await addButton.click();
      const saveButton = page.getByRole("button", { name: /save|luu|lưu|submit|tao|tạo/i }).first();
      if (await saveButton.count()) {
        await submitAndExpectFeedback(page, saveButton);
      }
    }
  });

  test("non-admin role cannot access admin pages", async ({ page, qa }) => {
    test.skip(!hasCredentials("teacher"), "Missing teacher credentials");

    await loginAs(page, "teacher");
    qa.expectedErrorPatterns.push(/\/portal\/admin/i);

    await page.goto("/vi/portal/admin/accounts");
    await page.waitForLoadState("domcontentloaded");

    await expect(page).toHaveURL(/\/403|\/portal\/teacher|\/auth\/login/);
  });
});
