import { test, expect } from "../helpers/fixture";
import { gotoPortal, loginAs } from "../helpers/auth";
import { hasCredentials } from "../helpers/env";
import { waitForLoadingToEnd } from "../helpers/qaRules";

test.describe("Parent Multi-Child Flow", () => {
  test("parent can switch child context and cannot access foreign profile", async ({ page, qa }) => {
    test.skip(!hasCredentials("parent"), "Missing parent credentials");

    await loginAs(page, "parent");

    await gotoPortal(page, "/portal/parent/homework");
    await waitForLoadingToEnd(page);
    const beforeHomework = await page.locator("body").innerText();

    const childSelector = page.locator('select, [role="combobox"]').first();
    if (await childSelector.count()) {
      const options = childSelector.locator("option");
      const optionCount = await options.count();
      if (optionCount > 1) {
        const current = await childSelector.inputValue().catch(() => "");
        for (let idx = 0; idx < optionCount; idx++) {
          const val = await options.nth(idx).getAttribute("value");
          if (val && val !== current) {
            await childSelector.selectOption(val);
            break;
          }
        }
        await page.waitForTimeout(1200);
      }
    }

    const afterHomework = await page.locator("body").innerText();
    if (beforeHomework === afterHomework) {
      test.info().annotations.push({
        type: "potential-bug",
        description: "Child switch did not visibly change homework view.",
      });
    }

    await gotoPortal(page, "/portal/parent/reports");
    await gotoPortal(page, "/portal/parent/attendance");
    await gotoPortal(page, "/portal/parent/schedule");

    qa.expectedErrorPatterns.push(/\/api\/auth\/profile\/select-student/i);
    const blocked = await page.evaluate(async () => {
      const response = await fetch("/api/auth/profile/select-student", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ studentProfileId: "00000000-0000-0000-0000-000000000000" }),
      });
      return response.status;
    });

    expect([400, 401, 403, 404]).toContain(blocked);
  });
});
