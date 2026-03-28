# Checklist Test Theo Role - Session Report & Monthly Report

Tài liệu này gom 2 chức năng để tester test nhanh trên web:

- `Session Report`
- `Monthly Report`

Nội dung bám theo implementation frontend hiện có trong repo `KidzgoCentre`.

## 1. Tổng quan route theo role

### 1.1. Teacher

| Role | Route chính | Mục đích |
|---|---|---|
| `Teacher` | `/vi/portal/teacher/attendance` | Tạo, sửa, AI enhance, submit `Session Report` theo từng buổi |
| `Teacher` | `/vi/portal/teacher/feedback` | Workspace tổng hợp cho `Monthly Report` và danh sách `Session Report` |

Ghi chú:

- Trong `/vi/portal/teacher/feedback` có 2 tab lớn:
- `Báo cáo tháng`
- `Báo cáo buổi học`

### 1.2. Management / Admin / Staff

| Role | Route chính | Ghi chú |
|---|---|---|
| `StaffManagement` | `/vi/portal/staff-management/monthly-report` | Dùng `ManagementFeedbackWorkspace` |
| `Staff` | `/vi/portal/staff/reports` | Dùng cùng workspace với StaffManagement |
| `Admin` | `/vi/portal/admin/reports` | Dùng cùng workspace với StaffManagement |
| `Admin` | `/vi/portal/admin/feedback` | Dùng cùng workspace với StaffManagement |

Ghi chú:

- Các route trên đang dùng cùng 1 workspace quản lý.
- Workspace này có 2 tab lớn:
- `Báo cáo theo tháng`
- `Báo cáo theo buổi`

### 1.3. Parent / Viewer

| Role | Route chính | Mục đích |
|---|---|---|
| `Parent` | `/vi/portal/parent/tests` | Xem `Monthly Report` và `Session Report` đã ở trạng thái `Published` |

Ghi chú:

- Parent hiện chỉ thấy report đã publish.
- Trong repo hiện tại, đây là luồng xem report rõ nhất cho phụ huynh.

### 1.4. Student

| Role | Route chính | Ghi chú |
|---|---|---|
| `Student` | Chưa thấy page report riêng trong repo hiện tại | Có `viewer mode` trong component monthly report, nhưng chưa thấy route mount riêng cho student |

## 2. Chuẩn bị data trước khi test

- Có ít nhất `1 Teacher` đã được gán lớp.
- Có ít nhất `1 Staff/Admin/Management` cùng chi nhánh với lớp đang test.
- Có ít nhất `1 Parent` đã link với học sinh đang test.
- Có ít nhất `1 Class`.
- Có ít nhất `1 Session` thuộc class đó.
- Có ít nhất `1 Student` trong class.
- Nên có ít nhất `1 tháng` có dữ liệu học thật để test monthly report.

### 2.1. Điều kiện để test Session Report

- Teacher phải thấy session ở màn `/vi/portal/teacher/attendance`.
- Học sinh phải xuất hiện trong danh sách điểm danh của session.
- Teacher cần có quyền tạo hoặc sửa note của học sinh ở session đó.

### 2.2. Điều kiện để test Monthly Report

- Trước khi teacher test monthly report, nên có sẵn `Session Report` trong tháng đó.
- Management cần bấm `Khởi tạo dữ liệu` cho đúng `tháng / năm / chi nhánh` để sinh dữ liệu monthly report.
- Nếu chưa có dữ liệu monthly report cho học sinh đó, teacher sẽ không đi tiếp được phần AI draft / edit / submit.

### 2.3. Thứ tự test dễ nhất

1. Teacher tạo `Session Report` từ màn Attendance.
2. Management review `Session Report`.
3. Management khởi tạo dữ liệu `Monthly Report`.
4. Teacher soạn và submit `Monthly Report`.
5. Management comment / reject / approve / publish `Monthly Report`.
6. Parent mở report đã publish để xem.

## 3. Trạng thái cần nhớ

### 3.1. Session Report

| Trạng thái | Ý nghĩa | Ai xử lý tiếp |
|---|---|---|
| `DRAFT` | Giáo viên mới lưu nháp | Teacher |
| `REVIEW` | Giáo viên đã gửi duyệt | Management / Admin / Staff |
| `APPROVED` | Đã duyệt xong | Management / Admin / Staff |
| `REJECTED` | Bị trả về để sửa | Teacher |
| `PUBLISHED` | Đã publish cho viewer | Parent xem được |

Luồng chuẩn:

- `DRAFT -> REVIEW -> APPROVED -> PUBLISHED`
- `DRAFT/REJECTED -> REVIEW` khi teacher submit lại
- `REVIEW -> REJECTED` khi management từ chối

### 3.2. Monthly Report

| Trạng thái | Ý nghĩa | Ai xử lý tiếp |
|---|---|---|
| `Draft` | Giáo viên đang soạn | Teacher |
| `Submitted` | Giáo viên đã gửi duyệt | Management / Admin / Staff |
| `Approved` | Đã duyệt xong | Management / Admin / Staff |
| `Rejected` | Bị trả về để sửa | Teacher |
| `Published` | Đã publish cho viewer | Parent xem được |

Ghi chú:

- Backend có thể trả về `Review`.
- Frontend monthly đang normalize `Review = Submitted`.

Luồng chuẩn:

- `Draft -> Submitted -> Approved -> Published`
- `Draft/Rejected -> Submitted` khi teacher submit lại
- `Submitted -> Rejected` khi management comment và trả về sửa

## 4. Session Report theo role

## 4.1. Teacher

### SR-T1. Tạo Session Report mới từ Attendance

Route:

- `/vi/portal/teacher/attendance`

Bước test:

1. Mở 1 session có học sinh.
2. Ở dòng học sinh, bấm `Note`.
3. Nhập nội dung nhận xét buổi học.
4. Bấm `Gửi nhận xét`.

Kỳ vọng:

- Modal đóng lại.
- Nội dung note xuất hiện ở danh sách điểm danh.
- Report được tạo hoặc update cho đúng học sinh và đúng session.

### SR-T2. Sửa Session Report đã có

Route:

- `/vi/portal/teacher/attendance`
- `/vi/portal/teacher/feedback` > tab `Báo cáo buổi học`

Bước test:

1. Mở lại học sinh đã có note.
2. Bấm `Edit` hoặc mở lại `Note`.
3. Sửa nội dung.
4. Bấm `Lưu chỉnh sửa` hoặc `Gửi nhận xét`.

Kỳ vọng:

- Nội dung mới được lưu.
- Ở trang `Báo cáo buổi học`, record tương ứng hiển thị nội dung mới nhất.

### SR-T3. AI enhance feedback

Route:

- `/vi/portal/teacher/attendance`

Bước test:

1. Mở modal `Note theo buổi`.
2. Nhập trước một đoạn feedback ngắn.
3. Bấm `AI enhance feedback`.

Kỳ vọng:

- Nội dung trong textarea được thay bằng phiên bản AI đã viết lại.
- Không tự submit nếu teacher chưa bấm nút lưu hoặc submit review.

### SR-T4. Submit Session Report để review

Route:

- `/vi/portal/teacher/attendance`

Bước test:

1. Mở modal note của học sinh đã có report.
2. Bấm `Submit review`.

Kỳ vọng:

- Status chuyển sang `REVIEW`.
- Management thấy report đó trong hàng chờ review.

Negative case nên test:

- Nếu chưa lưu note trước, hệ thống báo lỗi kiểu `Vui lòng lưu note trước khi submit review`.

### SR-T5. Theo dõi và sửa lại Session Report ở trang feedback

Route:

- `/vi/portal/teacher/feedback` > tab `Báo cáo buổi học`

Bước test:

1. Mở tab `Báo cáo buổi học`.
2. Lọc theo `REJECTED` hoặc `DRAFT`.
3. Chọn 1 report.
4. Sửa nội dung trong editor.
5. Bấm `Lưu`.
6. Bấm `Gửi duyệt`.

Kỳ vọng:

- Teacher thấy đúng trạng thái hiện tại của report.
- Nếu report bị reject, teacher thấy comment hoặc lý do từ admin.
- Chỉ luồng `DRAFT` hoặc `REJECTED` mới là luồng submit chuẩn ở màn này.

Negative case nên test:

- Thử submit lại report đã `PUBLISHED`.
- Kỳ vọng backend chặn và trả lỗi.

## 4.2. Management / Admin / Staff

### SR-M1. Mở hàng chờ review Session Report

Route:

- Một trong các route management ở mục 1.2
- Chọn tab `Báo cáo theo buổi`

Bước test:

1. Mở trang.
2. Kiểm tra filter mặc định.

Kỳ vọng:

- Filter mặc định là `REVIEW`.
- Chỉ các report đang chờ duyệt xuất hiện đầu tiên.

### SR-M2. Approve Session Report

Bước test:

1. Ở list `Báo cáo theo buổi`, chọn report đang `REVIEW`.
2. Bấm icon `Duyệt`.

Kỳ vọng:

- Status chuyển sang `APPROVED`.
- Report biến mất khỏi filter `REVIEW` nếu vẫn đang lọc `REVIEW`.

### SR-M3. Reject Session Report

Bước test:

1. Chọn report đang `REVIEW`.
2. Bấm icon `Từ chối`.
3. Nhập `Lý do từ chối`.
4. Bấm `Xác nhận từ chối`.

Kỳ vọng:

- Hệ thống gửi comment trước rồi reject report.
- Status chuyển sang `REJECTED`.
- Teacher nhìn thấy lý do reject ở màn `Báo cáo buổi học`.

### SR-M4. Publish Session Report đã approve

Bước test:

1. Lọc `APPROVED`.
2. Bấm icon `Xuất bản`.

Kỳ vọng:

- Status chuyển sang `PUBLISHED`.
- Parent có thể nhìn thấy report đó ở màn viewer.

### SR-M5. Xem chi tiết Session Report

Bước test:

1. Bấm icon `Xem`.
2. Kiểm tra nội dung detail modal.

Kỳ vọng:

- Hiển thị đúng học sinh, lớp, giáo viên, thời gian cập nhật.
- Nếu report từng bị reject, phần `Lý do từ chối` hiện đúng.

Ghi chú:

- Màn session review có checkbox chọn nhiều dòng.
- Hiện tại chưa thấy nút batch approve hoặc batch publish ở UI session review.
- Vì vậy checkbox hiện chủ yếu hỗ trợ chọn và theo dõi số lượng đã chọn.

## 4.3. Parent

### SR-P1. Xem Session Report đã publish

Route:

- `/vi/portal/parent/tests`

Bước test:

1. Chọn đúng học sinh ở parent context.
2. Mở tab session report trong page tests.
3. Kiểm tra danh sách.
4. Bấm xem chi tiết 1 report.

Kỳ vọng:

- Parent chỉ thấy report ở trạng thái `PUBLISHED`.
- Nếu chưa publish, parent không thấy report đó.
- Chi tiết chỉ có quyền xem, không có quyền sửa.

## 5. Monthly Report theo role

## 5.1. Management / Admin / Staff - chuẩn bị dữ liệu

### MR-M0. Kiểm tra branch scope trước khi test

Route:

- Một trong các route management ở mục 1.2
- Chọn tab `Báo cáo theo tháng`

Kỳ vọng:

- Trường `Chi nhánh` trên page đang để `disabled`.
- Giá trị chi nhánh được đồng bộ theo branch filter ở sidebar.

Ghi chú:

- Nếu đang sai branch, tester cần đổi branch ở sidebar trước.
- Đổi branch xong mới quay lại test report.

### MR-M1. Khởi tạo dữ liệu monthly report

Route:

- Một trong các route management ở mục 1.2
- Chọn tab `Báo cáo theo tháng`

Bước test:

1. Chọn đúng `tháng / năm`.
2. Đảm bảo branch ở sidebar là branch muốn test.
3. Bấm `Khởi tạo dữ liệu`.

Kỳ vọng:

- Hệ thống tạo `job` cho đúng tháng, năm, branch.
- Hệ thống tự chạy aggregate data sau khi tạo job.
- Hiện message thành công kiểu `Đã khởi tạo đợt báo cáo và đồng bộ dữ liệu`.
- Khu vực `Tiến độ đợt báo cáo` có record job tương ứng.

### MR-M2. Đồng bộ lại dữ liệu từ job

Bước test:

1. Trong khối `Tiến độ đợt báo cáo`, chọn 1 job.
2. Bấm `Đồng bộ dữ liệu`.

Kỳ vọng:

- Dữ liệu monthly report được refresh lại.
- Danh sách report tháng cập nhật theo dữ liệu mới.

## 5.2. Teacher

### MR-T1. Mở luồng soạn Monthly Report

Route:

- `/vi/portal/teacher/feedback`
- Chọn tab `Báo cáo tháng`

Bước test:

1. Mở tab `Bắt đầu soạn`.
2. Chọn `tháng / năm`.
3. Chọn `lớp`.
4. Chọn `học sinh`.

Kỳ vọng:

- Danh sách `Buổi học trong thời gian đã chọn` hiện ra.
- Nếu chưa có session report trong tháng, danh sách nguồn trống.
- Nếu chưa có monthly report record cho học sinh đó, UI hiện cảnh báo không tìm thấy monthly report trong scope hiện tại.

### MR-T2. AI tổng hợp và tạo nháp

Route:

- `/vi/portal/teacher/feedback` > tab `Báo cáo tháng`

Bước test:

1. Chọn học sinh có session report trong tháng.
2. Bấm `AI tổng hợp và tạo nháp báo cáo tháng`.

Kỳ vọng:

- Nút chỉ chạy được khi có session report nguồn và có monthly report record.
- Nội dung draft của monthly report được sinh ra từ session reports trong tháng.
- Sau đó teacher có thể bấm `Đi tới báo cáo để chỉnh sửa và submit`.

### MR-T3. Sửa draft monthly report

Route:

- `/vi/portal/teacher/feedback` > tab `Báo cáo tháng`
- Tab `Danh sách báo cáo`

Bước test:

1. Chọn report vừa tạo draft.
2. Bấm icon `Chỉnh sửa` hoặc mở popup chỉnh sửa.
3. Sửa nội dung draft.
4. Bấm `Lưu nháp`.

Kỳ vọng:

- Nội dung draft mới được lưu.
- Chi tiết report hiển thị lại đúng nội dung vừa sửa.

### MR-T4. Submit Monthly Report

Route:

- `/vi/portal/teacher/feedback` > tab `Báo cáo tháng`

Bước test:

1. Mở report đang `Draft` hoặc `Rejected`.
2. Bấm `Submit`.

Kỳ vọng:

- Status chuyển sang `Submitted`.
- Management thấy report đó trong hàng chờ duyệt.

Ghi chú:

- Frontend chỉ cho submit chuẩn với `Draft` hoặc `Rejected`.
- Nếu report bị reject trước đó, nút sẽ hiện logic `Submit lại`.

### MR-T5. Nhận góp ý và sửa lại Monthly Report

Route:

- `/vi/portal/teacher/feedback` > tab `Báo cáo tháng`

Bước test:

1. Nhờ management comment hoặc reject 1 report.
2. Teacher mở lại report đó.
3. Kiểm tra phần `Góp ý từ Staff/Admin`.
4. Sửa lại nội dung.
5. Submit lại.

Kỳ vọng:

- Teacher thấy comment trong danh sách bình luận của report.
- Nếu report đã reject, UI có cảnh báo report bị trả về.
- Submit lại thành công sẽ đưa report về `Submitted`.

## 5.3. Management / Admin / Staff - review monthly report

### MR-M3. Mở hàng chờ duyệt

Route:

- Một trong các route management ở mục 1.2
- Tab `Báo cáo theo tháng`

Bước test:

1. Bấm shortcut `Mở hàng chờ duyệt` hoặc tự lọc status `Submitted`.

Kỳ vọng:

- Chỉ các report `Submitted` hiện ra.

### MR-M4. Approve Monthly Report

Bước test:

1. Chọn 1 report đang `Submitted`.
2. Bấm icon `Duyệt`.

Kỳ vọng:

- Status chuyển sang `Approved`.

### MR-M5. Comment và trả report về teacher

Bước test:

1. Chọn 1 report đang `Submitted`.
2. Bấm icon `Thêm bình luận`.
3. Nhập comment.
4. Giữ checkbox `Đồng thời trả report về teacher để sửa lại (Reject)` ở trạng thái bật.
5. Bấm `Gửi comment`.

Kỳ vọng:

- Comment được lưu vào report.
- Nếu report đang `Submitted`, status chuyển sang `Rejected`.
- Teacher nhìn thấy comment đó ở màn report.

Ghi chú:

- Nếu report không ở trạng thái `Submitted`, comment vẫn gửi được.
- Nhưng khi đó hệ thống chỉ comment, không reject được.

### MR-M6. Publish Monthly Report đã approve

Bước test:

1. Lọc `Approved`.
2. Bấm icon `Công bố`.

Kỳ vọng:

- Status chuyển sang `Published`.
- Parent nhìn thấy report đó ở màn viewer.

### MR-M7. Batch approve hoặc batch publish

Route:

- Tab `Danh sách báo cáo`
- Hoặc tab `Hàng chờ xử lý`

Bước test:

1. Chọn nhiều report bằng checkbox.
2. Bấm `Duyệt mục đã chọn` hoặc `Công bố mục đã chọn`.

Kỳ vọng:

- Batch approve chỉ xử lý các report đang `Submitted`.
- Batch publish chỉ xử lý các report đang `Approved`.
- Những report sai trạng thái sẽ bị skip.
- Sau khi xử lý, list reload lại dữ liệu.

### MR-M8. Duyệt hoặc công bố theo lớp

Route:

- Tab `Hàng chờ xử lý`

Bước test:

1. Chọn 1 lớp ở cột trái.
2. Bấm `Duyệt lớp` hoặc `Công bố lớp`.

Kỳ vọng:

- Hệ thống chỉ xử lý các report thuộc lớp đó.
- Logic eligible status vẫn giữ nguyên:
- `Duyệt lớp` chỉ ăn các report `Submitted`
- `Công bố lớp` chỉ ăn các report `Approved`

## 5.4. Parent

### MR-P1. Xem Monthly Report đã publish

Route:

- `/vi/portal/parent/tests`

Bước test:

1. Chọn đúng học sinh trong parent context.
2. Mở phần monthly report.
3. Bấm xem chi tiết 1 report.

Kỳ vọng:

- Parent chỉ thấy report ở trạng thái `Published`.
- Nếu report chưa publish, parent không thấy report đó.
- Parent chỉ xem nội dung, không có nút sửa hay duyệt.

## 6. Những điểm tester rất dễ bỏ sót

- `Session Report` được tạo từ màn `Attendance`, không phải từ trang `Teacher Feedback`.
- `Monthly Report` của teacher chỉ đi tiếp được nếu management đã `Khởi tạo dữ liệu` trước cho đúng tháng và đúng branch.
- `Chi nhánh` ở management monthly page là field chỉ đọc, lấy theo sidebar filter.
- `Monthly Report` có alias trạng thái `Review`, nhưng frontend đang hiển thị và xử lý nó như `Submitted`.
- Parent chỉ xem được report đã `Published`.
- Nút `Export/PDF` đang xuất hiện ở detail panel của monthly report, nhưng trong frontend hiện tại chưa thấy click handler thực thi.
- Session review có checkbox chọn nhiều dòng, nhưng hiện chưa thấy batch action button ở UI session review.
- Trong repo hiện tại chưa thấy page report riêng cho student.

## 7. Checklist end-to-end ngắn gọn cho tester

1. Teacher vào `/vi/portal/teacher/attendance`, tạo note cho 1 học sinh và submit review session report.
2. Management vào tab `Báo cáo theo buổi`, approve rồi publish session report đó.
3. Management vào tab `Báo cáo theo tháng`, chọn đúng branch/tháng/năm và bấm `Khởi tạo dữ liệu`.
4. Teacher vào `/vi/portal/teacher/feedback`, tab `Báo cáo tháng`, chọn lớp và học sinh, bấm AI tạo draft rồi submit monthly report.
5. Management comment hoặc reject monthly report, xác nhận teacher thấy góp ý.
6. Teacher sửa lại và submit lại monthly report.
7. Management approve rồi publish monthly report.
8. Parent vào `/vi/portal/parent/tests` và xác nhận nhìn thấy cả `Session Report` và `Monthly Report` đã publish.
