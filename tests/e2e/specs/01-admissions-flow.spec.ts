import { test, expect } from "../helpers/fixture";
import { gotoPortal, loginAs } from "../helpers/auth";
import { hasCredentials } from "../helpers/env";
import { expectFilterAffectsData, waitForLoadingToEnd } from "../helpers/qaRules";

test.describe("Admissions Flow", () => {
  test("staff can manage admissions pipeline and class assignment visibility", async ({ page }) => {
    test.skip(!hasCredentials("staff"), "Missing staff credentials in environment");

    await loginAs(page, "staff");

    await gotoPortal(page, "/portal/staff-management/leads");
    await waitForLoadingToEnd(page);
    await expect(page).toHaveURL(/portal\/staff-management\/leads/);

    const searchInput = page.locator('input[placeholder*="tim" i], input[placeholder*="search" i]').first();
    const table = page.locator("table").first();
    if (await searchInput.count() && await table.count()) {
      await expectFilterAffectsData(page, "table", 'input[placeholder*="tim" i], input[placeholder*="search" i]', "nguyen");
    }

    await gotoPortal(page, "/portal/staff-management/placement-tests");
    await waitForLoadingToEnd(page);
    await expect(page).toHaveURL(/portal\/staff-management\/placement-tests/);

    await gotoPortal(page, "/portal/staff-management/enrollments");
    await waitForLoadingToEnd(page);
    await expect(page).toHaveURL(/portal\/staff-management\/enrollments/);

    await gotoPortal(page, "/portal/staff-management/schedule");
    await waitForLoadingToEnd(page);
    await expect(page).toHaveURL(/portal\/staff-management\/schedule/);

    await loginAs(page, "parent");
    await gotoPortal(page, "/portal/parent/schedule");
    await waitForLoadingToEnd(page);
    await expect(page).toHaveURL(/portal\/parent\/schedule/);

    if (hasCredentials("student")) {
      await loginAs(page, "student");
      await gotoPortal(page, "/portal/student/schedule");
      await waitForLoadingToEnd(page);
      await expect(page).toHaveURL(/portal\/student\/schedule/);
    }
  });
});
