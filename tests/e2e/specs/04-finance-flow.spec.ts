import { test, expect } from "../helpers/fixture";
import { gotoPortal, loginAs } from "../helpers/auth";
import { hasCredentials } from "../helpers/env";
import { waitForLoadingToEnd } from "../helpers/qaRules";

test.describe("Finance Flow", () => {
  test("accountant/staff and parent can see finance statuses", async ({ page }) => {
    const hasFinanceUser = hasCredentials("accountant") || hasCredentials("staff");
    test.skip(!hasFinanceUser, "Missing accountant/staff credentials");

    if (hasCredentials("accountant")) {
      await loginAs(page, "accountant");
      await gotoPortal(page, "/portal/staff-accountant/invoices");
      await waitForLoadingToEnd(page);
      await gotoPortal(page, "/portal/staff-accountant/dues");
      await waitForLoadingToEnd(page);
      await gotoPortal(page, "/portal/staff-accountant/payos");
      await waitForLoadingToEnd(page);
    } else {
      await loginAs(page, "staff");
      await gotoPortal(page, "/portal/staff-management/enrollments");
      await waitForLoadingToEnd(page);
    }

    await loginAs(page, "parent");
    await gotoPortal(page, "/portal/parent/payment");
    await waitForLoadingToEnd(page);

    const bodyText = await page.locator("body").innerText();
    const hasAnyStatus = /paid|unpaid|overdue|da thanh toan|chua thanh toan|qua han/i.test(bodyText);

    expect(hasAnyStatus, "Payment statuses are not displayed.").toBeTruthy();
  });
});
