import { test as base } from "@playwright/test";
import { QaContext, attachGlobalBugDetectors, createQaContext, failIfBugIssues } from "./qaRules";

type QaFixtures = {
  qa: QaContext;
};

export const test = base.extend<QaFixtures>({
  qa: async ({ page }, use, testInfo) => {
    const ctx = createQaContext();
    attachGlobalBugDetectors(page, ctx);
    await use(ctx);
    await failIfBugIssues(ctx, testInfo);
  },
});

export { expect } from "@playwright/test";
