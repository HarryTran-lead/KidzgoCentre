import { expect, Locator, Page, TestInfo } from "@playwright/test";

export type QaIssue = {
  type: string;
  detail: string;
};

export type QaContext = {
  issues: QaIssue[];
  expectedErrorPatterns: RegExp[];
};

const LOADING_SELECTORS = [
  '[data-testid*="loading"]',
  '[aria-busy="true"]',
  'text=/dang tai|đang tải|loading/i',
];

const FEEDBACK_SELECTORS = [
  'text=/thanh cong|thành công|success/i',
  'text=/that bai|thất bại|error|loi|lỗi/i',
  'text=/invalid|required|bat buoc|bắt buộc/i',
  '[role="alert"]',
  '[data-sonner-toast]',
  '[data-testid*="toast"]',
];

export function createQaContext(): QaContext {
  return {
    issues: [],
    expectedErrorPatterns: [],
  };
}

export function attachGlobalBugDetectors(page: Page, ctx: QaContext) {
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      ctx.issues.push({
        type: "console-error",
        detail: msg.text(),
      });
    }
  });

  page.on("response", async (response) => {
    const status = response.status();
    if (![400, 401, 403, 404, 500].includes(status)) {
      return;
    }

    const url = response.url();
    const isExpected = ctx.expectedErrorPatterns.some((pattern) => pattern.test(url));
    if (isExpected) {
      return;
    }

    ctx.issues.push({
      type: "api-error",
      detail: `${status} ${url}`,
    });
  });
}

export async function failIfBugIssues(ctx: QaContext, testInfo: TestInfo) {
  if (!ctx.issues.length) {
    return;
  }

  const body = ctx.issues.map((issue, idx) => `${idx + 1}. [${issue.type}] ${issue.detail}`).join("\n");
  await testInfo.attach("qa-detected-issues", {
    body,
    contentType: "text/plain",
  });

  expect(ctx.issues, body).toHaveLength(0);
}

export async function waitForLoadingToEnd(page: Page, timeout = 15_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeout) {
    let hasLoading = false;

    for (const selector of LOADING_SELECTORS) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        hasLoading = true;
        break;
      }
    }

    if (!hasLoading) {
      return;
    }

    await page.waitForTimeout(300);
  }

  throw new Error("Loading state never ended within timeout.");
}

export async function clickAndExpectEffect(page: Page, button: Locator) {
  const beforeUrl = page.url();
  const beforeDom = await page.locator("body").innerText();

  await button.click();
  await page.waitForTimeout(1200);

  const afterUrl = page.url();
  const afterDom = await page.locator("body").innerText();
  const changed = beforeUrl !== afterUrl || beforeDom !== afterDom;

  expect(changed, "Button click does nothing.").toBeTruthy();
}

export async function submitAndExpectFeedback(page: Page, submitBtn: Locator, timeout = 8_000) {
  await submitBtn.click();

  const feedbackLocators = FEEDBACK_SELECTORS.map((selector) => page.locator(selector).first());

  const startedAt = Date.now();
  while (Date.now() - startedAt < timeout) {
    for (const locator of feedbackLocators) {
      if (await locator.count()) {
        const visible = await locator.isVisible().catch(() => false);
        if (visible) {
          return;
        }
      }
    }
    await page.waitForTimeout(250);
  }

  throw new Error("Form submit has no success/error feedback.");
}

export async function expectTableDataChanges(page: Page, tableSelector: string, action: () => Promise<void>) {
  const table = page.locator(tableSelector).first();
  const before = await table.innerText();
  await action();
  await page.waitForTimeout(1200);
  const after = await table.innerText();

  expect(after, "Table data did not update after action.").not.toEqual(before);
}

export async function expectFilterAffectsData(page: Page, tableSelector: string, inputSelector: string, query: string) {
  const table = page.locator(tableSelector).first();
  const before = await table.innerText();
  await page.locator(inputSelector).fill(query);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1200);
  const after = await table.innerText();

  expect(after, "Search/filter does not affect displayed data.").not.toEqual(before);
}
