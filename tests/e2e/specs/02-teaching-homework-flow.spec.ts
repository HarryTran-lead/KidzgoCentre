import { test, expect } from "../helpers/fixture";
import { gotoPortal, loginAs } from "../helpers/auth";
import { hasCredentials } from "../helpers/env";
import { waitForLoadingToEnd } from "../helpers/qaRules";

test.describe("Teaching and Homework Flow", () => {
  test("teacher attendance-homework and student submission visibility", async ({ page }) => {
    test.skip(!hasCredentials("teacher"), "Missing teacher credentials");

    await loginAs(page, "teacher");

    await gotoPortal(page, "/portal/teacher/schedule");
    await waitForLoadingToEnd(page);
    await expect(page).toHaveURL(/portal\/teacher\/schedule/);

    await gotoPortal(page, "/portal/teacher/attendance");
    await waitForLoadingToEnd(page);
    await expect(page).toHaveURL(/portal\/teacher\/attendance/);

    await gotoPortal(page, "/portal/teacher/assignments");
    await waitForLoadingToEnd(page);
    await expect(page).toHaveURL(/portal\/teacher\/assignments/);

    if (hasCredentials("student")) {
      await loginAs(page, "student");
      await gotoPortal(page, "/portal/student/homework");
      await waitForLoadingToEnd(page);
      await expect(page).toHaveURL(/portal\/student\/homework/);
    }

    await loginAs(page, "teacher");
    await gotoPortal(page, "/portal/teacher/assignments");
    await waitForLoadingToEnd(page);
    await expect(page).toHaveURL(/portal\/teacher\/assignments/);
  });
});
