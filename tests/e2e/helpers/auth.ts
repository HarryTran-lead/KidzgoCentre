import { expect, Page } from "@playwright/test";
import { Credentials, RoleKey, getCredentials } from "./env";

function localePath(path: string, locale = "vi") {
  if (path.startsWith("/")) return `/${locale}${path}`;
  return `/${locale}/${path}`;
}

export async function loginAs(page: Page, role: RoleKey, locale = "vi", creds?: Credentials) {
  const account = creds || getCredentials(role);
  await page.goto(localePath("/auth/login", locale));

  await page.locator('input[name="email"]').fill(account.email);
  await page.locator('input[name="password"]').fill(account.password);

  await Promise.all([
    page.waitForLoadState("networkidle"),
    page.getByRole("button", { name: /dang nhap ngay|đăng nhập ngay|dang nhap|đăng nhập/i }).click(),
  ]);

  if (role === "student") {
    await completeStudentProfileSelection(page, locale);
  }

  await expect(page).not.toHaveURL(/\/auth\/login/);
}

async function completeStudentProfileSelection(page: Page, locale: string) {
  // If already at student portal, no chooser interaction is needed.
  if (/\/portal\/student/.test(page.url())) {
    return;
  }

  // Profile chooser appears at /{locale}/portal for multi-profile accounts.
  const chooserTitle = page.getByText(/vui long chon ho so|vui lòng chọn hồ sơ/i).first();
  const hasChooser = await chooserTitle.isVisible().catch(() => false);
  if (!hasChooser) {
    return;
  }

  const studentCard = page.getByRole("button").filter({ hasText: /hoc sinh|học sinh/i }).first();
  await expect(studentCard).toBeVisible({ timeout: 10000 });

  await Promise.all([
    page.waitForLoadState("networkidle"),
    studentCard.click(),
  ]);

  await expect(page).toHaveURL(new RegExp(`/${locale}/portal/student`), { timeout: 15000 });
}

export async function gotoPortal(page: Page, path: string, locale = "vi") {
  await page.goto(localePath(path, locale));
  await page.waitForLoadState("domcontentloaded");
}
