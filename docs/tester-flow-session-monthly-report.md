# Test Theo Luồng - Session Report & Monthly Report

Tài liệu này viết theo kiểu `đi từng bước từ đầu đến cuối` để tester test dễ hơn.

Không chia nặng theo role nữa, mà chia theo `luồng thực tế`:

- `Luồng 1`: Session Report
- `Luồng 2`: Monthly Report

## 1. Route sẽ dùng khi test

| Role | Route | Dùng để làm gì |
|---|---|---|
| `Teacher` | `/vi/portal/teacher/attendance` | Tạo, sửa, submit `Session Report` |
| `Teacher` | `/vi/portal/teacher/feedback` | Làm `Monthly Report`, xem list `Session Report` |
| `Management/Staff/Admin` | `/vi/portal/staff-management/monthly-report` | Review monthly + review session |
| `Management/Staff/Admin` | `/vi/portal/staff/reports` | Review monthly + review session |
| `Management/Staff/Admin` | `/vi/portal/admin/reports` | Review monthly + review session |
| `Management/Staff/Admin` | `/vi/portal/admin/feedback` | Review monthly + review session |
| `Parent` | `/vi/portal/parent/tests` | Xem report đã `Published` |

## 2. Data cần chuẩn bị trước

- Có `1 Teacher` đã được gán lớp.
- Có `1 Staff/Admin/Management` cùng chi nhánh với lớp đang test.
- Có `1 Parent` đã link với học sinh.
- Có `1 Class`.
- Có `1 Session` thuộc class đó.
- Có `1 Student` nằm trong class đó.
- Nên chọn `1 tháng` có session thực tế để test monthly report.

## 3. Luồng 1 - Session Report

Luồng chuẩn:

`Teacher tạo note -> Teacher submit review -> Management review -> Approve hoặc Reject -> Publish -> Parent xem`

## 3.1. Bước 1 - Teacher tạo Session Report

Ai làm:

- `Teacher`

Route:

- `/vi/portal/teacher/attendance`

Thao tác:

1. Mở 1 session có học sinh.
2. Ở dòng học sinh, bấm `Note`.
3. Nhập nhận xét buổi học.
4. Bấm `Gửi nhận xét`.

Kỳ vọng:

- Modal đóng.
- Note hiển thị lại ở danh sách điểm danh.
- Session report được tạo hoặc cập nhật cho đúng học sinh, đúng session.

Data đi tiếp:

- Có `Session Report` ở trạng thái gần như `DRAFT`.

## 3.2. Bước 2 - Teacher submit Session Report để review

Ai làm:

- `Teacher`

Route:

- `/vi/portal/teacher/attendance`

Thao tác:

1. Mở lại modal note của học sinh vừa tạo report.
2. Bấm `Submit review`.

Kỳ vọng:

- Status chuyển sang `REVIEW`.
- Management nhìn thấy report này ở màn review session report.

Negative nên test:

- Nếu chưa lưu note mà bấm submit review thì phải báo lỗi kiểu `Vui lòng lưu note trước khi submit review`.

## 3.3. Bước 3 - Management mở hàng chờ review

Ai làm:

- `Management/Staff/Admin`

Route:

- Một trong các route management ở trên
- Chọn tab `Báo cáo theo buổi`

Thao tác:

1. Mở page review.
2. Kiểm tra filter mặc định.

Kỳ vọng:

- Filter mặc định là `REVIEW`.
- Report vừa submit xuất hiện trong danh sách.

## 3.4. Nhánh A - Management reject Session Report

Ai làm:

- `Management/Staff/Admin`

Route:

- Tab `Báo cáo theo buổi`

Thao tác:

1. Chọn report đang `REVIEW`.
2. Bấm `Từ chối`.
3. Nhập lý do từ chối.
4. Bấm `Xác nhận từ chối`.

Kỳ vọng:

- Report chuyển sang `REJECTED`.
- Teacher nhìn thấy lý do reject ở màn session report.

### Sau khi reject, Teacher sửa lại

Ai làm:

- `Teacher`

Route:

- `/vi/portal/teacher/feedback`
- Chọn tab `Báo cáo buổi học`

Thao tác:

1. Lọc `REJECTED`.
2. Chọn đúng report bị trả về.
3. Sửa nội dung.
4. Bấm `Lưu`.
5. Bấm `Gửi duyệt`.

Kỳ vọng:

- Report quay lại trạng thái `REVIEW`.
- Management thấy lại report trong hàng chờ.

## 3.5. Nhánh B - Management approve Session Report

Ai làm:

- `Management/Staff/Admin`

Route:

- Tab `Báo cáo theo buổi`

Thao tác:

1. Chọn report đang `REVIEW`.
2. Bấm `Duyệt`.

Kỳ vọng:

- Report chuyển sang `APPROVED`.

## 3.6. Bước 4 - Management publish Session Report

Ai làm:

- `Management/Staff/Admin`

Route:

- Tab `Báo cáo theo buổi`

Thao tác:

1. Lọc `APPROVED`.
2. Chọn report vừa duyệt.
3. Bấm `Xuất bản`.

Kỳ vọng:

- Report chuyển sang `PUBLISHED`.

## 3.7. Bước 5 - Parent xem Session Report đã publish

Ai làm:

- `Parent`

Route:

- `/vi/portal/parent/tests`

Thao tác:

1. Chọn đúng học sinh ở parent context.
2. Mở phần session report.
3. Mở chi tiết report.

Kỳ vọng:

- Parent chỉ thấy report đã `PUBLISHED`.
- Nếu report chưa publish thì parent không thấy.
- Parent chỉ có quyền xem.

## 4. Luồng 2 - Monthly Report

Luồng chuẩn:

`Management khởi tạo dữ liệu -> Teacher chọn lớp/học sinh -> AI tạo draft -> Teacher submit -> Management review -> Reject hoặc Approve -> Publish -> Parent xem`

## 4.1. Bước 1 - Management khởi tạo dữ liệu monthly report

Ai làm:

- `Management/Staff/Admin`

Route:

- Một trong các route management ở trên
- Chọn tab `Báo cáo theo tháng`

Thao tác:

1. Chọn đúng `tháng / năm`.
2. Kiểm tra đúng branch ở sidebar.
3. Bấm `Khởi tạo dữ liệu`.

Kỳ vọng:

- Tạo được job monthly report cho đúng tháng, năm, chi nhánh.
- Hệ thống tự aggregate data.
- Hiện message kiểu `Đã khởi tạo đợt báo cáo và đồng bộ dữ liệu`.

Lưu ý rất quan trọng:

- Field `Chi nhánh` trên màn này đang là `read-only`.
- Nó lấy theo branch filter ở sidebar.
- Nếu tester chọn sai branch ở sidebar thì monthly report sẽ nhìn như “không có dữ liệu”.

## 4.2. Bước 2 - Teacher mở luồng soạn monthly report

Ai làm:

- `Teacher`

Route:

- `/vi/portal/teacher/feedback`
- Chọn tab `Báo cáo tháng`

Thao tác:

1. Mở khu vực `Bắt đầu soạn`.
2. Chọn `tháng / năm`.
3. Chọn `lớp`.
4. Chọn `học sinh`.

Kỳ vọng:

- Hệ thống load danh sách học sinh của lớp.
- Hệ thống load session reports của học sinh trong tháng đã chọn.
- Nếu chưa có dữ liệu monthly report cho học sinh đó, UI sẽ báo không tìm thấy monthly report trong scope hiện tại.

## 4.3. Bước 3 - Teacher dùng AI tạo draft monthly report

Ai làm:

- `Teacher`

Route:

- `/vi/portal/teacher/feedback`
- Tab `Báo cáo tháng`

Thao tác:

1. Chọn học sinh đã có session reports trong tháng.
2. Bấm `AI tổng hợp và tạo nháp báo cáo tháng`.

Kỳ vọng:

- Draft được sinh từ các session reports trong tháng.
- Teacher có thể bấm `Đi tới báo cáo để chỉnh sửa và submit`.

## 4.4. Bước 4 - Teacher sửa draft monthly report

Ai làm:

- `Teacher`

Route:

- `/vi/portal/teacher/feedback`
- Tab `Báo cáo tháng`
- Tab `Danh sách báo cáo`

Thao tác:

1. Chọn report vừa tạo draft.
2. Bấm `Chỉnh sửa`.
3. Sửa nội dung.
4. Bấm `Lưu nháp`.

Kỳ vọng:

- Nội dung mới được lưu.
- Mở lại report vẫn thấy đúng draft vừa sửa.

## 4.5. Bước 5 - Teacher submit monthly report

Ai làm:

- `Teacher`

Route:

- `/vi/portal/teacher/feedback`
- Tab `Báo cáo tháng`

Thao tác:

1. Mở report đang `Draft` hoặc `Rejected`.
2. Bấm `Submit`.

Kỳ vọng:

- Report chuyển sang `Submitted`.
- Management nhìn thấy report này trong hàng chờ duyệt.

## 4.6. Nhánh A - Management comment và reject monthly report

Ai làm:

- `Management/Staff/Admin`

Route:

- Tab `Báo cáo theo tháng`

Thao tác:

1. Lọc `Submitted`.
2. Chọn report cần góp ý.
3. Bấm `Thêm bình luận`.
4. Nhập comment.
5. Giữ checkbox `Đồng thời trả report về teacher để sửa lại (Reject)`.
6. Bấm `Gửi comment`.

Kỳ vọng:

- Comment được lưu vào report.
- Nếu report đang `Submitted`, status chuyển sang `Rejected`.
- Teacher nhìn thấy comment đó ở màn report.

### Sau khi reject, Teacher sửa lại

Ai làm:

- `Teacher`

Route:

- `/vi/portal/teacher/feedback`
- Tab `Báo cáo tháng`

Thao tác:

1. Lọc `Rejected`.
2. Mở report bị trả về.
3. Kiểm tra phần góp ý từ staff/admin.
4. Sửa nội dung.
5. Submit lại.

Kỳ vọng:

- Report quay về `Submitted`.
- Management nhìn thấy lại trong hàng chờ duyệt.

## 4.7. Nhánh B - Management approve monthly report

Ai làm:

- `Management/Staff/Admin`

Route:

- Tab `Báo cáo theo tháng`

Thao tác:

1. Lọc `Submitted`.
2. Chọn report.
3. Bấm `Duyệt`.

Kỳ vọng:

- Report chuyển sang `Approved`.

## 4.8. Bước 6 - Management publish monthly report

Ai làm:

- `Management/Staff/Admin`

Route:

- Tab `Báo cáo theo tháng`

Thao tác:

1. Lọc `Approved`.
2. Chọn report đã duyệt.
3. Bấm `Công bố`.

Kỳ vọng:

- Report chuyển sang `Published`.

## 4.9. Bước 7 - Parent xem monthly report đã publish

Ai làm:

- `Parent`

Route:

- `/vi/portal/parent/tests`

Thao tác:

1. Chọn đúng học sinh.
2. Mở phần monthly report.
3. Mở chi tiết report.

Kỳ vọng:

- Parent chỉ thấy report `Published`.
- Parent không thấy report draft, submitted, approved hay rejected.

## 5. Luồng ngắn nhất để tester chạy nhanh

Nếu cần test nhanh, chạy theo thứ tự này:

1. Teacher tạo và submit `Session Report`.
2. Management approve và publish `Session Report`.
3. Management `Khởi tạo dữ liệu` monthly report.
4. Teacher AI draft, sửa và submit `Monthly Report`.
5. Management approve và publish `Monthly Report`.
6. Parent vào `/vi/portal/parent/tests` xác nhận nhìn thấy cả 2 loại report.

## 6. Luồng cần test thêm để bắt bug

### 6.1. Luồng reject

1. Teacher submit `Session Report`.
2. Management reject.
3. Teacher sửa và submit lại.
4. Management approve và publish.
5. Lặp tương tự với `Monthly Report`.

### 6.2. Luồng sai branch

1. Management đứng sai branch ở sidebar.
2. Mở monthly report.
3. Bấm `Khởi tạo dữ liệu` hoặc xem list report.

Kỳ vọng:

- Dữ liệu sẽ lệch hoặc trống.
- Đổi lại branch đúng thì dữ liệu mới khớp.

### 6.3. Luồng parent chỉ xem published

1. Teacher submit report nhưng management chưa publish.
2. Parent mở page viewer.

Kỳ vọng:

- Parent chưa thấy report.
- Chỉ sau khi publish thì parent mới thấy.

## 7. Những điểm cần note để tester không hiểu nhầm

- `Session Report` được tạo chủ yếu từ màn `Attendance`.
- `Teacher Feedback` không phải nơi tạo session report đầu tiên, mà là nơi theo dõi, sửa và submit lại.
- `Monthly Report` không chạy trơn nếu management chưa `Khởi tạo dữ liệu`.
- Frontend monthly đang coi `Review = Submitted`.
- Nút `Export/PDF` đang hiện ở monthly report nhưng hiện chưa thấy wired action rõ trong frontend.
- Màn review session report có checkbox chọn nhiều dòng nhưng hiện chưa thấy batch action button riêng.
- Trong repo hiện tại chưa thấy route report riêng cho `Student`.
