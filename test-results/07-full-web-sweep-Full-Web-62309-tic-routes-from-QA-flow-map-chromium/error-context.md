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
Received: 26
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e6]:
    - complementary [ref=e7]:
      - generic [ref=e8]:
        - img "KidzGo" [ref=e10]
        - generic:
          - img "KidzGo"
        - button "Collapse sidebar" [ref=e11] [cursor=pointer]:
          - img [ref=e12]
        - separator
      - navigation [ref=e14]:
        - generic [ref=e15]:
          - generic "Tổng quan" [ref=e16]:
            - link "Tổng quan" [ref=e17] [cursor=pointer]:
              - /url: /vi/portal/teacher
              - img [ref=e19]
              - generic [ref=e24]: Tổng quan
          - generic "Hồ sơ cá nhân" [ref=e25]:
            - link "Hồ sơ cá nhân" [ref=e26] [cursor=pointer]:
              - /url: /vi/portal/teacher/profile
              - img [ref=e28]
              - generic [ref=e31]: Hồ sơ cá nhân
          - generic "Lớp học của tôi" [ref=e32]:
            - link "Lớp học của tôi" [ref=e33] [cursor=pointer]:
              - /url: /vi/portal/teacher/classes
              - img [ref=e35]
              - generic [ref=e37]: Lớp học của tôi
          - generic "Lịch giảng dạy" [ref=e38]:
            - link "Lịch giảng dạy" [ref=e39] [cursor=pointer]:
              - /url: /vi/portal/teacher/schedule
              - img [ref=e41]
              - generic [ref=e45]: Lịch giảng dạy
          - generic "Giáo án & Tài liệu" [ref=e46]:
            - link "Giáo án & Tài liệu" [ref=e47] [cursor=pointer]:
              - /url: /vi/portal/teacher/subjects
              - img [ref=e49]
              - generic [ref=e51]: Giáo án & Tài liệu
          - generic "Kho tài liệu" [ref=e52]:
            - link "Kho tài liệu" [ref=e53] [cursor=pointer]:
              - /url: /vi/portal/teacher/materials
              - img [ref=e55]
              - generic [ref=e57]: Kho tài liệu
          - generic "Media lớp học" [ref=e58]:
            - link "Media lớp học" [ref=e59] [cursor=pointer]:
              - /url: /vi/portal/teacher/media
              - img [ref=e61]
              - generic [ref=e65]: Media lớp học
          - generic "Bài tập & Nộp bài" [ref=e66]:
            - link "Bài tập & Nộp bài" [ref=e67] [cursor=pointer]:
              - /url: /vi/portal/teacher/assignments
              - img [ref=e69]
              - generic [ref=e73]: Bài tập & Nộp bài
          - generic "Nhiệm vụ & Đổi thưởng" [ref=e74]:
            - link "Nhiệm vụ & Đổi thưởng" [ref=e75] [cursor=pointer]:
              - /url: /vi/portal/teacher/gamification
              - img [ref=e77]
              - generic [ref=e80]: Nhiệm vụ & Đổi thưởng
          - generic "Điểm danh" [ref=e81]:
            - link "Điểm danh" [ref=e82] [cursor=pointer]:
              - /url: /vi/portal/teacher/attendance
              - img [ref=e84]
              - generic [ref=e87]: Điểm danh
          - generic "Đơn" [ref=e88]:
            - link "Đơn" [ref=e89] [cursor=pointer]:
              - /url: /vi/portal/teacher/applications
              - img [ref=e91]
              - generic [ref=e93]: Đơn
          - generic [ref=e94]:
            - button "Báo cáo" [ref=e95]:
              - generic [ref=e96]:
                - img [ref=e97]
                - generic [ref=e100]: Báo cáo
              - img [ref=e102]
            - generic [ref=e104]:
              - link "Báo cáo theo tháng" [ref=e105] [cursor=pointer]:
                - /url: /vi/portal/teacher/feedback/monthly-report
                - img [ref=e107]
                - generic [ref=e110]: Báo cáo theo tháng
              - link "Báo cáo theo buổi" [ref=e111] [cursor=pointer]:
                - /url: /vi/portal/teacher/feedback/session-report
                - img [ref=e113]
                - generic [ref=e115]: Báo cáo theo buổi
          - generic "Yêu cầu báo cáo" [ref=e116]:
            - link "Yêu cầu báo cáo" [ref=e117] [cursor=pointer]:
              - /url: /vi/portal/teacher/report-requests
              - img [ref=e119]
              - generic [ref=e122]: Yêu cầu báo cáo
          - generic "Báo cáo sự cố" [ref=e123]:
            - link "Báo cáo sự cố" [ref=e124] [cursor=pointer]:
              - /url: /vi/portal/teacher/incident-reports
              - img [ref=e126]
              - generic [ref=e128]: Báo cáo sự cố
          - generic "Công giờ & Thu nhập" [ref=e129]:
            - link "Công giờ & Thu nhập" [ref=e130] [cursor=pointer]:
              - /url: /vi/portal/teacher/timesheet
              - img [ref=e132]
              - generic [ref=e135]: Công giờ & Thu nhập
          - generic "Thông báo" [ref=e136]:
            - link "Thông báo" [ref=e137] [cursor=pointer]:
              - /url: /vi/portal/teacher/notifications
              - img [ref=e139]
              - generic [ref=e142]: Thông báo
      - generic [ref=e145]:
        - generic [ref=e148]: Hệ thống KidzGo
        - generic [ref=e149]: Phiên bản v1.0.0
    - generic [ref=e150]:
      - generic [ref=e152]:
        - heading "Chào mừng trở lại, Taylor Swift!" [level=1] [ref=e154]
        - generic [ref=e155]:
          - button "Switch language" [ref=e156]:
            - img "English flag" [ref=e157]
            - generic [ref=e158]: EN
          - button "Thông báo" [ref=e160]:
            - img [ref=e161]
          - button "Taylor Swift Swift T." [ref=e165]:
            - generic [ref=e166]:
              - generic "Taylor Swift" [ref=e168]:
                - img "Taylor Swift" [ref=e169]
              - generic "Taylor Swift" [ref=e171]: Swift T.
              - img [ref=e173]
      - generic [ref=e176]:
        - generic [ref=e177]:
          - generic [ref=e178]:
            - generic [ref=e179]:
              - generic [ref=e180]:
                - img [ref=e182]
                - img [ref=e185]
              - generic [ref=e188]:
                - heading "Công giờ & Thu nhập" [level=1] [ref=e189]
                - paragraph [ref=e190]: Phân tích hiệu suất và tài chính giảng dạy theo thời gian thực
            - generic [ref=e191]:
              - generic [ref=e192]:
                - combobox [ref=e193]:
                  - option "Năm 2025" [selected]
                  - option "Năm 2024"
                  - option "Năm 2023"
                - img
              - button "Xuất báo cáo" [ref=e194]:
                - img [ref=e195]
                - text: Xuất báo cáo
              - button [ref=e198]:
                - img [ref=e199]
          - generic [ref=e205]:
            - generic [ref=e211]:
              - generic [ref=e212]:
                - img [ref=e215]
                - generic [ref=e218]: Công giờ tháng này
              - generic [ref=e219]:
                - generic [ref=e220]: 68 giờ
                - generic [ref=e221]: Trung bình 28h/tuần
                - generic [ref=e222]:
                  - img [ref=e223]
                  - generic [ref=e226]: +12%
                  - generic [ref=e227]: vs tháng trước
            - generic [ref=e234]:
              - generic [ref=e235]:
                - img [ref=e238]
                - generic [ref=e240]: Thu nhập tháng này
              - generic [ref=e241]:
                - generic [ref=e242]: 20.400.000 ₫
                - generic [ref=e243]: Tăng trưởng ổn định
                - generic [ref=e244]:
                  - img [ref=e245]
                  - generic [ref=e248]: +8%
                  - generic [ref=e249]: vs tháng trước
            - generic [ref=e256]:
              - generic [ref=e257]:
                - img [ref=e260]
                - generic [ref=e263]: Đơn giá trung bình
              - generic [ref=e264]:
                - generic [ref=e265]: 300.000 ₫/h
                - generic [ref=e266]: Tối ưu hiệu suất
            - generic [ref=e273]:
              - generic [ref=e274]:
                - img [ref=e277]
                - generic [ref=e282]: Lớp đang dạy
              - generic [ref=e283]:
                - generic [ref=e284]: 4 lớp
                - generic [ref=e285]: 4 lớp chính thức
          - generic [ref=e288]:
            - generic [ref=e289]:
              - img [ref=e291]
              - generic [ref=e294]:
                - heading "Tổng kết hiệu suất 2025" [level=3] [ref=e295]
                - paragraph [ref=e296]: Thống kê toàn diện về giảng dạy
            - generic [ref=e297]:
              - generic [ref=e298]:
                - generic [ref=e299]: "402"
                - generic [ref=e300]: Giờ dạy
              - generic [ref=e301]:
                - generic [ref=e302]: 120.600.000 ₫
                - generic [ref=e303]: Tổng thu nhập
              - generic [ref=e304]:
                - generic [ref=e305]: 20.100.000 ₫
                - generic [ref=e306]: TB/tháng
              - generic [ref=e307]:
                - generic [ref=e308]: "24"
                - generic [ref=e309]: Lớp học
        - generic [ref=e310]:
          - generic [ref=e312]:
            - button "Tổng quan" [ref=e313]:
              - img [ref=e314]
              - text: Tổng quan
            - button "Chi tiết" [ref=e317]:
              - img [ref=e318]
              - text: Chi tiết
          - generic [ref=e323]:
            - generic [ref=e324]:
              - generic [ref=e326]:
                - button "Tháng này" [ref=e327]
                - button "6 tháng" [ref=e328]
                - button "1 năm" [ref=e329]
              - generic [ref=e330]:
                - generic [ref=e331]:
                  - generic [ref=e332]:
                    - heading "Công giờ theo tháng" [level=3] [ref=e333]
                    - paragraph [ref=e334]: Tổng số giờ giảng dạy
                  - generic [ref=e337]: Công giờ
                - generic [ref=e338]:
                  - generic [ref=e339]:
                    - generic [ref=e340]: 0h
                    - generic [ref=e341]: 20h
                    - generic [ref=e342]: 40h
                    - generic [ref=e343]: 60h
                    - generic [ref=e344]: 80h
                  - generic [ref=e345]:
                    - generic [ref=e346]:
                      - generic [ref=e351]: T6
                      - generic [ref=e352]: 68h
                    - generic [ref=e353]:
                      - generic [ref=e358]: T5
                      - generic [ref=e359]: 70h
                    - generic [ref=e360]:
                      - generic [ref=e365]: T4
                      - generic [ref=e366]: 60h
                    - generic [ref=e367]:
                      - generic [ref=e372]: T3
                      - generic [ref=e373]: 72h
                    - generic [ref=e374]:
                      - generic [ref=e379]: T2
                      - generic [ref=e380]: 68h
                    - generic [ref=e381]:
                      - generic [ref=e386]: T1
                      - generic [ref=e387]: 64h
              - generic [ref=e389]:
                - generic [ref=e390]:
                  - generic [ref=e391]:
                    - heading "Thu nhập theo tháng" [level=3] [ref=e392]
                    - paragraph [ref=e393]: Tổng thu nhập từ giảng dạy
                  - generic [ref=e396]: Thu nhập
                - generic [ref=e397]:
                  - generic [ref=e398]:
                    - generic [ref=e399]: 0M
                    - generic [ref=e400]: 5M
                    - generic [ref=e401]: 10M
                    - generic [ref=e402]: 15M
                    - generic [ref=e403]: 20M
                  - generic [ref=e404]:
                    - generic [ref=e405]:
                      - generic [ref=e410]: T6
                      - generic [ref=e411]: 20.4M
                    - generic [ref=e412]:
                      - generic [ref=e417]: T5
                      - generic [ref=e418]: 21.0M
                    - generic [ref=e419]:
                      - generic [ref=e424]: T4
                      - generic [ref=e425]: 18.0M
                    - generic [ref=e426]:
                      - generic [ref=e431]: T3
                      - generic [ref=e432]: 21.6M
                    - generic [ref=e433]:
                      - generic [ref=e438]: T2
                      - generic [ref=e439]: 20.4M
                    - generic [ref=e440]:
                      - generic [ref=e445]: T1
                      - generic [ref=e446]: 19.2M
            - generic [ref=e448]:
              - generic [ref=e449]:
                - generic [ref=e450]:
                  - heading "Báo cáo theo tháng" [level=3] [ref=e451]
                  - paragraph [ref=e452]: Chi tiết công giờ và thu nhập
                - button "Xem tất cả" [ref=e454]:
                  - img [ref=e455]
                  - text: Xem tất cả
              - table [ref=e460]:
                - rowgroup [ref=e461]:
                  - row "Tháng Công giờ Thu nhập Đơn giá Lớp học Trạng thái" [ref=e462]:
                    - columnheader "Tháng" [ref=e463]:
                      - generic [ref=e464]:
                        - img [ref=e465]
                        - text: Tháng
                    - columnheader "Công giờ" [ref=e467]:
                      - generic [ref=e468]:
                        - img [ref=e469]
                        - text: Công giờ
                    - columnheader "Thu nhập" [ref=e472]:
                      - generic [ref=e473]:
                        - img [ref=e474]
                        - text: Thu nhập
                    - columnheader "Đơn giá" [ref=e476]:
                      - generic [ref=e477]:
                        - img [ref=e478]
                        - text: Đơn giá
                    - columnheader "Lớp học" [ref=e481]:
                      - generic [ref=e482]:
                        - img [ref=e483]
                        - text: Lớp học
                    - columnheader "Trạng thái" [ref=e488]
                - rowgroup [ref=e489]:
                  - row "T6/2025 68 giờ giảng dạy 68 20.400.000 ₫ TB 300.000 ₫/h 300.000 ₫/h 4 Đã thanh toán" [ref=e490]:
                    - cell "T6/2025 68 giờ giảng dạy" [ref=e491]:
                      - generic [ref=e492]:
                        - img [ref=e494]
                        - generic [ref=e496]:
                          - generic [ref=e497]: T6/2025
                          - generic [ref=e498]: 68 giờ giảng dạy
                    - cell "68" [ref=e499]:
                      - generic [ref=e502]: "68"
                    - cell "20.400.000 ₫ TB 300.000 ₫/h" [ref=e503]:
                      - generic [ref=e504]:
                        - generic [ref=e505]: 20.400.000 ₫
                        - generic [ref=e506]: TB 300.000 ₫/h
                    - cell "300.000 ₫/h" [ref=e507]:
                      - generic [ref=e510]: 300.000 ₫/h
                    - cell "4" [ref=e511]:
                      - generic [ref=e512]:
                        - img [ref=e514]
                        - generic [ref=e519]: "4"
                    - cell "Đã thanh toán" [ref=e520]:
                      - generic [ref=e521]:
                        - img [ref=e522]
                        - generic [ref=e525]: Đã thanh toán
                  - row "T5/2025 70 giờ giảng dạy 70 21.000.000 ₫ TB 300.000 ₫/h 300.000 ₫/h 4 Đã thanh toán" [ref=e526]:
                    - cell "T5/2025 70 giờ giảng dạy" [ref=e527]:
                      - generic [ref=e528]:
                        - img [ref=e530]
                        - generic [ref=e532]:
                          - generic [ref=e533]: T5/2025
                          - generic [ref=e534]: 70 giờ giảng dạy
                    - cell "70" [ref=e535]:
                      - generic [ref=e538]: "70"
                    - cell "21.000.000 ₫ TB 300.000 ₫/h" [ref=e539]:
                      - generic [ref=e540]:
                        - generic [ref=e541]: 21.000.000 ₫
                        - generic [ref=e542]: TB 300.000 ₫/h
                    - cell "300.000 ₫/h" [ref=e543]:
                      - generic [ref=e546]: 300.000 ₫/h
                    - cell "4" [ref=e547]:
                      - generic [ref=e548]:
                        - img [ref=e550]
                        - generic [ref=e555]: "4"
                    - cell "Đã thanh toán" [ref=e556]:
                      - generic [ref=e557]:
                        - img [ref=e558]
                        - generic [ref=e561]: Đã thanh toán
                  - row "T4/2025 60 giờ giảng dạy 60 18.000.000 ₫ TB 300.000 ₫/h 300.000 ₫/h 3 Đã thanh toán" [ref=e562]:
                    - cell "T4/2025 60 giờ giảng dạy" [ref=e563]:
                      - generic [ref=e564]:
                        - img [ref=e566]
                        - generic [ref=e568]:
                          - generic [ref=e569]: T4/2025
                          - generic [ref=e570]: 60 giờ giảng dạy
                    - cell "60" [ref=e571]:
                      - generic [ref=e574]: "60"
                    - cell "18.000.000 ₫ TB 300.000 ₫/h" [ref=e575]:
                      - generic [ref=e576]:
                        - generic [ref=e577]: 18.000.000 ₫
                        - generic [ref=e578]: TB 300.000 ₫/h
                    - cell "300.000 ₫/h" [ref=e579]:
                      - generic [ref=e582]: 300.000 ₫/h
                    - cell "3" [ref=e583]:
                      - generic [ref=e584]:
                        - img [ref=e586]
                        - generic [ref=e591]: "3"
                    - cell "Đã thanh toán" [ref=e592]:
                      - generic [ref=e593]:
                        - img [ref=e594]
                        - generic [ref=e597]: Đã thanh toán
                  - row "T3/2025 72 giờ giảng dạy 72 21.600.000 ₫ TB 300.000 ₫/h 300.000 ₫/h 5 Đã thanh toán" [ref=e598]:
                    - cell "T3/2025 72 giờ giảng dạy" [ref=e599]:
                      - generic [ref=e600]:
                        - img [ref=e602]
                        - generic [ref=e604]:
                          - generic [ref=e605]: T3/2025
                          - generic [ref=e606]: 72 giờ giảng dạy
                    - cell "72" [ref=e607]:
                      - generic [ref=e610]: "72"
                    - cell "21.600.000 ₫ TB 300.000 ₫/h" [ref=e611]:
                      - generic [ref=e612]:
                        - generic [ref=e613]: 21.600.000 ₫
                        - generic [ref=e614]: TB 300.000 ₫/h
                    - cell "300.000 ₫/h" [ref=e615]:
                      - generic [ref=e618]: 300.000 ₫/h
                    - cell "5" [ref=e619]:
                      - generic [ref=e620]:
                        - img [ref=e622]
                        - generic [ref=e627]: "5"
                    - cell "Đã thanh toán" [ref=e628]:
                      - generic [ref=e629]:
                        - img [ref=e630]
                        - generic [ref=e633]: Đã thanh toán
                  - row "T2/2025 68 giờ giảng dạy 68 20.400.000 ₫ TB 300.000 ₫/h 300.000 ₫/h 4 Đã thanh toán" [ref=e634]:
                    - cell "T2/2025 68 giờ giảng dạy" [ref=e635]:
                      - generic [ref=e636]:
                        - img [ref=e638]
                        - generic [ref=e640]:
                          - generic [ref=e641]: T2/2025
                          - generic [ref=e642]: 68 giờ giảng dạy
                    - cell "68" [ref=e643]:
                      - generic [ref=e646]: "68"
                    - cell "20.400.000 ₫ TB 300.000 ₫/h" [ref=e647]:
                      - generic [ref=e648]:
                        - generic [ref=e649]: 20.400.000 ₫
                        - generic [ref=e650]: TB 300.000 ₫/h
                    - cell "300.000 ₫/h" [ref=e651]:
                      - generic [ref=e654]: 300.000 ₫/h
                    - cell "4" [ref=e655]:
                      - generic [ref=e656]:
                        - img [ref=e658]
                        - generic [ref=e663]: "4"
                    - cell "Đã thanh toán" [ref=e664]:
                      - generic [ref=e665]:
                        - img [ref=e666]
                        - generic [ref=e669]: Đã thanh toán
                  - row "T1/2025 64 giờ giảng dạy 64 19.200.000 ₫ TB 300.000 ₫/h 300.000 ₫/h 4 Đã thanh toán" [ref=e670]:
                    - cell "T1/2025 64 giờ giảng dạy" [ref=e671]:
                      - generic [ref=e672]:
                        - img [ref=e674]
                        - generic [ref=e676]:
                          - generic [ref=e677]: T1/2025
                          - generic [ref=e678]: 64 giờ giảng dạy
                    - cell "64" [ref=e679]:
                      - generic [ref=e682]: "64"
                    - cell "19.200.000 ₫ TB 300.000 ₫/h" [ref=e683]:
                      - generic [ref=e684]:
                        - generic [ref=e685]: 19.200.000 ₫
                        - generic [ref=e686]: TB 300.000 ₫/h
                    - cell "300.000 ₫/h" [ref=e687]:
                      - generic [ref=e690]: 300.000 ₫/h
                    - cell "4" [ref=e691]:
                      - generic [ref=e692]:
                        - img [ref=e694]
                        - generic [ref=e699]: "4"
                    - cell "Đã thanh toán" [ref=e700]:
                      - generic [ref=e701]:
                        - img [ref=e702]
                        - generic [ref=e705]: Đã thanh toán
            - generic [ref=e706]:
              - generic [ref=e707]:
                - generic [ref=e708]:
                  - img [ref=e710]
                  - generic [ref=e712]:
                    - heading "Tự động thanh toán" [level=4] [ref=e713]
                    - paragraph [ref=e714]: Hóa đơn được xử lý tự động
                - generic [ref=e715]:
                  - text: "Ngày thanh toán:"
                  - generic [ref=e716]: 05/T6
              - generic [ref=e717]:
                - generic [ref=e718]:
                  - img [ref=e720]
                  - generic [ref=e723]:
                    - heading "Mục tiêu tháng tới" [level=4] [ref=e724]
                    - paragraph [ref=e725]: Tăng trưởng 15%
                - generic [ref=e726]: "Đặt mục tiêu: 75 giờ"
              - generic [ref=e727]:
                - generic [ref=e728]:
                  - img [ref=e730]
                  - generic [ref=e733]:
                    - heading "Báo cáo chi tiết" [level=4] [ref=e734]
                    - paragraph [ref=e735]: Xuất dữ liệu đầy đủ
                - button "Tải xuống →" [ref=e736]
  - button "Open Next.js Dev Tools" [ref=e742] [cursor=pointer]:
    - generic [ref=e745]:
      - text: Compiling
      - generic [ref=e746]:
        - generic [ref=e747]: .
        - generic [ref=e748]: .
        - generic [ref=e749]: .
  - alert [ref=e750]
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