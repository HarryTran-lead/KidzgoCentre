# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 07-full-web-sweep.spec.ts >> Full Website Sweep >> scan all static routes from QA flow map
- Location: tests\e2e\specs\07-full-web-sweep.spec.ts:173:7

# Error details

```
Error: Route sweep found broken routes.

expect(received).toBe(expected) // Object.is equality

Expected: 0
Received: 109
```

# Test source

```ts
  173 |   test("scan all static routes from QA flow map", async ({ page }, testInfo) => {
  174 |     test.setTimeout(20 * 60 * 1000);
  175 |     const routes = parseRouteInventory().filter((r) => canScanRouteRole(r.role));
  176 |     const grouped = new Map<RoleName, ScanRoute[]>();
  177 | 
  178 |     for (const route of routes) {
  179 |       const group = grouped.get(route.role) || [];
  180 |       group.push(route);
  181 |       grouped.set(route.role, group);
  182 |     }
  183 | 
  184 |     const results: RouteResult[] = [];
  185 | 
  186 |     for (const [role, roleRoutes] of grouped.entries()) {
  187 |       if (role === "Public" || role === "All") {
  188 |         for (const route of roleRoutes) {
  189 |           results.push(await scanRoute(page, route));
  190 |         }
  191 |         continue;
  192 |       }
  193 | 
  194 |       if (role === "Authenticated (chooser)") {
  195 |         if (!hasCredentials("admin")) {
  196 |           for (const route of roleRoutes) {
  197 |             results.push({
  198 |               no: route.no,
  199 |               route: route.route,
  200 |               role: route.role,
  201 |               status: "SKIP",
  202 |               detail: "Missing admin credentials for authenticated route check.",
  203 |             });
  204 |           }
  205 |           continue;
  206 |         }
  207 | 
  208 |         try {
  209 |           await loginAs(page, "admin");
  210 |         } catch (error) {
  211 |           for (const route of roleRoutes) {
  212 |             results.push({
  213 |               no: route.no,
  214 |               route: route.route,
  215 |               role: route.role,
  216 |               status: "FAIL",
  217 |               detail: `Role login failed for admin: ${String(error).slice(0, 160)}`,
  218 |             });
  219 |           }
  220 |           continue;
  221 |         }
  222 | 
  223 |         for (const route of roleRoutes) {
  224 |           results.push(await scanRoute(page, route));
  225 |         }
  226 |         continue;
  227 |       }
  228 | 
  229 |       const key = ROLE_TO_KEY[role];
  230 |       if (!key || !hasCredentials(key)) {
  231 |         for (const route of roleRoutes) {
  232 |           results.push({
  233 |             no: route.no,
  234 |             route: route.route,
  235 |             role: route.role,
  236 |             status: "SKIP",
  237 |             detail: `Missing credentials for role ${role}.`,
  238 |           });
  239 |         }
  240 |         continue;
  241 |       }
  242 | 
  243 |       try {
  244 |         await loginAs(page, key);
  245 |       } catch (error) {
  246 |         for (const route of roleRoutes) {
  247 |           results.push({
  248 |             no: route.no,
  249 |             route: route.route,
  250 |             role: route.role,
  251 |             status: "FAIL",
  252 |             detail: `Role login failed for ${role}: ${String(error).slice(0, 160)}`,
  253 |           });
  254 |         }
  255 |         continue;
  256 |       }
  257 | 
  258 |       for (const route of roleRoutes) {
  259 |         results.push(await scanRoute(page, route));
  260 |       }
  261 |     }
  262 | 
  263 |     const report = asMarkdown(results);
  264 |     await testInfo.attach("full-web-sweep-report", {
  265 |       body: report,
  266 |       contentType: "text/markdown",
  267 |     });
  268 | 
  269 |     const outputPath = path.resolve(process.cwd(), "QA_WEB_SWEEP_REPORT.md");
  270 |     fs.writeFileSync(outputPath, report, "utf8");
  271 | 
  272 |     const failedCount = results.filter((r) => r.status === "FAIL").length;
> 273 |     expect(failedCount, "Route sweep found broken routes.").toBe(0);
      |                                                             ^ Error: Route sweep found broken routes.
  274 |   });
  275 | });
  276 | 
```