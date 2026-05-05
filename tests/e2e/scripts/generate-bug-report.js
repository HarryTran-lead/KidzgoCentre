const fs = require("fs");
const path = require("path");

const reportPath = path.resolve("test-results/playwright-report.json");
const outPath = path.resolve("QA_BUG_REPORT.md");

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function collectFailedTests(node, results = []) {
  if (!node) return results;
  if (Array.isArray(node.suites)) {
    node.suites.forEach((suite) => collectFailedTests(suite, results));
  }
  if (Array.isArray(node.specs)) {
    node.specs.forEach((spec) => {
      (spec.tests || []).forEach((test) => {
        const failedResult = (test.results || []).find((r) => r.status === "failed");
        if (failedResult) {
          const errors = (failedResult.errors || []).map((e) => e.message || "Unknown error");
          const attachments = (failedResult.attachments || [])
            .filter((a) => a.path)
            .map((a) => a.path);

          results.push({
            title: spec.title || "Untitled test",
            file: spec.file,
            errors,
            attachments,
          });
        }
      });
    });
  }
  return results;
}

function stripAnsi(input) {
  return String(input || "").replace(/\u001b\[[0-9;]*m/g, "");
}

function severityFromError(text) {
  const lower = text.toLowerCase();
  if (lower.includes("403") || lower.includes("401") || lower.includes("forbidden")) return "High";
  if (lower.includes("500") || lower.includes("crash") || lower.includes("timeout")) return "Critical";
  if (lower.includes("validation") || lower.includes("missing")) return "Medium";
  return "Low";
}

function toMarkdown(failedTests) {
  const lines = ["# QA Bug Report", ""];

  if (!failedTests.length) {
    lines.push("No bugs detected from Playwright failed tests.");
    return lines.join("\n");
  }

  failedTests.forEach((item, idx) => {
    const errorText = stripAnsi(item.errors.join(" | "));
    const severity = severityFromError(errorText);
    const bugId = `BUG-${String(idx + 1).padStart(3, "0")}`;
    lines.push(`## Bug BUG-${String(idx + 1).padStart(3, "0")}`);
    lines.push(`- Bug ID: ${bugId}`);
    lines.push(`- Feature/Flow: ${item.file}`);
    lines.push(`- Role: Need confirmation`);
    lines.push(`- Severity: ${severity}`);
    lines.push("- Steps to reproduce:");
    lines.push(`  - Run Playwright test: ${item.title}`);
    lines.push("  - Open test trace/video and repeat the same UI flow.");
    lines.push("- Expected result:");
    lines.push("  - Test flow completes successfully.");
    lines.push("- Actual result:");
    lines.push(`  - ${errorText.split("\n").slice(0, 8).join(" ")}`);
    lines.push(`- Screenshot/video path: ${item.attachments.join(", ") || "N/A"}`);
    lines.push("- Possible cause:");
    lines.push("  - Backend validation/authorization mismatch or unstable UI selectors/state handling.");
    lines.push("- Suggested fix:");
    lines.push("  - Align API contract and UI feedback; add deterministic test ids and stronger loading/error handling.");
    lines.push("");
  });

  return lines.join("\n");
}

const report = readJson(reportPath);
if (!report) {
  fs.writeFileSync(
    outPath,
    "# QA Bug Report\n\nNo Playwright JSON report found. Run E2E tests first.",
    "utf-8"
  );
  process.exit(0);
}

const failed = collectFailedTests(report);
const markdown = toMarkdown(failed);
fs.writeFileSync(outPath, markdown, "utf-8");
console.log(`Generated ${outPath}`);
