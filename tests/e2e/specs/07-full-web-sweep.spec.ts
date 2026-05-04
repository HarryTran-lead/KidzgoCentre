import fs from "fs";
import path from "path";
import type { Page } from "@playwright/test";
import { test, expect } from "../helpers/fixture";
import { loginAs } from "../helpers/auth";
import { hasCredentials, RoleKey } from "../helpers/env";

type RoleName =
  | "Public"
  | "All"
  | "Admin"
  | "Staff_Manager"
  | "Staff_Accountant"
  | "Teacher"
  | "Student"
  | "Parent"
  | "Need confirmation (legacy staff)"
  | "Authenticated (chooser)";

type ScanRoute = {
  no: number;
  route: string;
  role: RoleName;
};

type RouteResult = {
  no: number;
  route: string;
  role: string;
  status: "PASS" | "FAIL" | "SKIP";
  detail: string;
};

const ROLE_TO_KEY: Partial<Record<RoleName, RoleKey>> = {
  Admin: "admin",
  Staff_Manager: "staff",
  "Need confirmation (legacy staff)": "staff",
  Staff_Accountant: "accountant",
  Teacher: "teacher",
  Student: "student",
  Parent: "parent",
};

function parseRouteInventory(): ScanRoute[] {
  const mapPath = path.resolve(process.cwd(), "QA_FLOW_MAP.md");
  const markdown = fs.readFileSync(mapPath, "utf8");
  const routes: ScanRoute[] = [];

  const lines = markdown.split(/\r?\n/);
  for (const line of lines) {
    if (!line.startsWith("|")) continue;
    if (!/^\|\s*\d+\s*\|/.test(line)) continue;

    const cols = line.split("|").map((c) => c.trim());
    if (cols.length < 6) continue;

    const no = Number(cols[1]);
    const route = cols[2];
    const role = cols[4] as RoleName;

    if (!Number.isFinite(no) || !route) continue;
    if (route.includes("[")) continue;

    routes.push({ no, route, role });
  }

  return routes;
}

function normalizeRoute(route: string, locale = "vi") {
  return route.replaceAll("{locale}", locale);
}

function canScanRouteRole(role: RoleName) {
  if (role === "Staff_Accountant") return false;
  return role === "Public" || role === "All" || role === "Authenticated (chooser)" || role in ROLE_TO_KEY;
}

async function scanRoute(page: Page, route: ScanRoute): Promise<RouteResult> {
  const to = normalizeRoute(route.route);

  try {
    await page.goto(to.startsWith("/") ? to : `/${to}`);
    await page.waitForLoadState("domcontentloaded");

    const current = page.url();
    const body = (await page.locator("body").innerText()).slice(0, 280);

    if (/\/undefined\//i.test(current)) {
      return {
        no: route.no,
        route: route.route,
        role: route.role,
        status: "FAIL",
        detail: `Malformed redirect contains undefined segment. url=${current}`,
      };
    }

    if (/\/404|not-found/i.test(current) || /not found|khong tim thay|không tìm thấy/i.test(body)) {
      return {
        no: route.no,
        route: route.route,
        role: route.role,
        status: "FAIL",
        detail: `Possible 404. url=${current}`,
      };
    }

    if (route.route !== "/403" && route.role !== "All" && /\/403(\?|#|$)/.test(current)) {
      return {
        no: route.no,
        route: route.route,
        role: route.role,
        status: "FAIL",
        detail: `Redirected to forbidden page unexpectedly. url=${current}`,
      };
    }

    if (/\/auth\/login/.test(current) && route.role !== "Public") {
      return {
        no: route.no,
        route: route.route,
        role: route.role,
        status: "FAIL",
        detail: `Redirected to login unexpectedly. url=${current}`,
      };
    }

    return {
      no: route.no,
      route: route.route,
      role: route.role,
      status: "PASS",
      detail: `url=${current}`,
    };
  } catch (error) {
    return {
      no: route.no,
      route: route.route,
      role: route.role,
      status: "FAIL",
      detail: String(error),
    };
  }
}

function asMarkdown(results: RouteResult[]) {
  const total = results.length;
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  const skipped = results.filter((r) => r.status === "SKIP").length;

  const lines = [
    "# Full Web Sweep Report",
    "",
    `- Total routes scanned: ${total}`,
    `- Passed: ${passed}`,
    `- Failed: ${failed}`,
    `- Skipped: ${skipped}`,
    "",
    "| No | Route | Role | Status | Detail |",
    "|---:|---|---|---|---|",
  ];

  for (const row of results) {
    lines.push(`| ${row.no} | ${row.route} | ${row.role} | ${row.status} | ${row.detail.replaceAll("|", "\\|")} |`);
  }

  return lines.join("\n");
}

test.describe("Full Website Sweep", () => {
  test("scan all static routes from QA flow map", async ({ page }, testInfo) => {
    test.setTimeout(20 * 60 * 1000);
    const routes = parseRouteInventory().filter((r) => canScanRouteRole(r.role));
    const grouped = new Map<RoleName, ScanRoute[]>();

    for (const route of routes) {
      const group = grouped.get(route.role) || [];
      group.push(route);
      grouped.set(route.role, group);
    }

    const results: RouteResult[] = [];

    for (const [role, roleRoutes] of grouped.entries()) {
      if (role === "Public" || role === "All") {
        for (const route of roleRoutes) {
          results.push(await scanRoute(page, route));
        }
        continue;
      }

      if (role === "Authenticated (chooser)") {
        if (!hasCredentials("admin")) {
          for (const route of roleRoutes) {
            results.push({
              no: route.no,
              route: route.route,
              role: route.role,
              status: "SKIP",
              detail: "Missing admin credentials for authenticated route check.",
            });
          }
          continue;
        }

        try {
          await loginAs(page, "admin");
        } catch (error) {
          for (const route of roleRoutes) {
            results.push({
              no: route.no,
              route: route.route,
              role: route.role,
              status: "FAIL",
              detail: `Role login failed for admin: ${String(error).slice(0, 160)}`,
            });
          }
          continue;
        }

        for (const route of roleRoutes) {
          results.push(await scanRoute(page, route));
        }
        continue;
      }

      const key = ROLE_TO_KEY[role];
      if (!key || !hasCredentials(key)) {
        for (const route of roleRoutes) {
          results.push({
            no: route.no,
            route: route.route,
            role: route.role,
            status: "SKIP",
            detail: `Missing credentials for role ${role}.`,
          });
        }
        continue;
      }

      try {
        await loginAs(page, key);
      } catch (error) {
        for (const route of roleRoutes) {
          results.push({
            no: route.no,
            route: route.route,
            role: route.role,
            status: "FAIL",
            detail: `Role login failed for ${role}: ${String(error).slice(0, 160)}`,
          });
        }
        continue;
      }

      for (const route of roleRoutes) {
        results.push(await scanRoute(page, route));
      }
    }

    const report = asMarkdown(results);
    await testInfo.attach("full-web-sweep-report", {
      body: report,
      contentType: "text/markdown",
    });

    const outputPath = path.resolve(process.cwd(), "QA_WEB_SWEEP_REPORT.md");
    fs.writeFileSync(outputPath, report, "utf8");

    const failedCount = results.filter((r) => r.status === "FAIL").length;
    expect(failedCount, "Route sweep found broken routes.").toBe(0);
  });
});
