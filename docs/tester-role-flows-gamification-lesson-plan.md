# Checklist Test Theo Role

Tài liệu này gom 2 nhóm chức năng để tester test trực tiếp trên web:

- `Gamification`
- `Giáo án / Lesson Plan / Plan theo buổi`

Nội dung bám theo implementation hiện có trong frontend `KidzgoCentre`.

## 1. Tổng quan route theo role

### 1.1. Gamification

| Role | Route chính | Ghi chú |
|---|---|---|
| `Admin` | `/vi/portal/admin/gamification` | Full mission, sao/xp, reward store, redemption |
| `ManagementStaff` | `/vi/portal/staff-management/gamification` | Gần như full như Admin |
| `Teacher` | `/vi/portal/teacher/gamification` | Có mission, snapshot sao/xp theo học sinh, xem redemption; không có reward store admin actions |
| `Parent` | `/vi/portal/parent/gamification` | Theo student-context đang chọn |
| `Student` | `/vi/portal/student/gamification` | Learner workspace |
| `Student` shortcut | `/vi/portal/student/rewards` | Mở thẳng tab đổi thưởng |
| `AccountantStaff` | Không có page riêng | Không thấy luồng gamification chuyên biệt trong repo hiện tại |

### 1.2. Lesson Plan / Giáo án

| Role | Route chính | Ghi chú |
|---|---|---|
| `Teacher` | `/vi/portal/teacher/subjects` | Dùng `LessonPlanWorkspace(scope="teacher")`, mặc định vào tab `Giao án theo buổi` |
| `ManagementStaff` | `/vi/portal/staff-management/lesson-plans` | Dùng `LessonPlanWorkspace(scope="staff-management")`, mặc định vào tab `Mẫu giáo án` |
| `Admin` | `/vi/portal/admin/documents` | Dùng `LessonPlanWorkspace(scope="admin")`, mặc định vào tab `Mẫu giáo án` |
| `Parent` | Không có page | Không có luồng lesson plan |
| `Student` | Không có page | Không có luồng lesson plan |
| `AccountantStaff` | Không có page | Không có luồng lesson plan |

## 2. Chuẩn bị data trước khi test

### 2.1. Gamification

- Có ít nhất `1 Admin` hoặc `1 ManagementStaff`.
- Có ít nhất `1 Teacher`.
- Có ít nhất `1 Student`.
- Có ít nhất `1 Parent` đã link với student profile.
- Parent phải chọn học sinh trước nếu muốn test các API dạng `me`, `check-in`, `redeem`, `confirm received`.
- Nên có sẵn:
  - ít nhất `1 class`
  - ít nhất `1 student profile`
  - ít nhất `1 mission`
  - ít nhất `1 reward item active`

### 2.2. Lesson Plan

- Có ít nhất `1 program`.
- Có ít nhất `1 class`.
- Có ít nhất `1 session` thuộc class đó.
- Nếu test role `Teacher`, teacher phải đang được gán class/session tương ứng.
- Nên chuẩn bị sẵn:
  - `1 file mẫu` để upload attachment
  - `1 lesson plan template`
  - `1 lesson plan` gắn vào buổi học

## 3. Gamification theo role

## 3.1. Admin

### Màn hình cần thấy

- Vào `/vi/portal/admin/gamification`
- Phải thấy các tab:
  - `Mission`
  - `Sao / XP`
  - `Kho quà`
  - `Đổi thưởng`

### Luồng A1. Tạo mission

1. Mở tab `Mission`.
2. Bấm `Tạo mission`.
3. Nhập:
   - `Tiêu đề`
   - `Mô tả`
   - `Scope`
   - `Mission type`
   - `StartAt`, `EndAt`
   - `Reward stars`, `Reward XP`
4. Nếu chọn `Scope = Class` thì chọn thêm `Lớp áp dụng`.
5. Nếu chọn `Scope = Group` thì nhập thêm `Nhóm áp dụng`.
6. Bấm `Lưu mission`.

Kỳ vọng:

- Mission mới xuất hiện trong list.
- Bấm `Sửa` mở lại đúng dữ liệu vừa tạo.

### Luồng A2. Sửa mission

1. Ở list `Mission`, bấm `Sửa`.
2. Đổi tiêu đề hoặc phần thưởng.
3. Bấm `Lưu mission`.

Kỳ vọng:

- Dữ liệu mission đổi đúng trên danh sách.

### Luồng A3. Xóa mission

1. Ở list `Mission`, bấm `Xóa`.
2. Confirm xóa.

Kỳ vọng:

- Mission bị remove khỏi list nếu backend cho phép xóa.
- Nếu mission đã có progress và backend chặn, UI phải báo lỗi.

### Luồng A4. Xem progress mission

1. Bấm `Tiến độ` ở một mission.

Kỳ vọng:

- Mở dialog `Tiến độ mission`.
- Nếu có data thì thấy danh sách học sinh + trạng thái + `% progress`.
- Nếu chưa có data thì hiện empty state.

### Luồng A5. Link homework vào mission

1. Tại tab `Mission`, bấm `Link homework`.
2. Nhập `Homework ID`.
3. Nhập `Mission ID`.
4. Bấm `Liên kết`.

Kỳ vọng:

- Thành công khi backend nhận đúng pair homework/mission.
- Nếu ID sai hoặc không tồn tại thì báo lỗi.

### Luồng A6. Cộng/trừ sao

1. Mở tab `Sao / XP`.
2. Chọn một học sinh.
3. Ở khối `Điều chỉnh sao`, nhập số sao và lý do.
4. Bấm `Cộng sao`.
5. Lặp lại với `Trừ sao`.

Kỳ vọng:

- Card `Số sao hiện tại` đổi theo đúng kết quả.
- `Giao dịch sao gần nhất` sinh thêm record.
- Nếu trừ quá số dư thì backend có thể trả lỗi.

### Luồng A7. Cộng/trừ XP

1. Ở cùng tab `Sao / XP`, nhập `Số XP` và lý do.
2. Bấm `Cộng XP`.
3. Lặp lại với `Trừ XP`.

Kỳ vọng:

- Card `Cấp độ` và `XP` đổi đúng theo backend.

### Luồng A8. Xem streak học sinh

1. Chọn học sinh ở tab `Sao / XP`.
2. Kiểm tra card streak và block `Điểm danh gần nhất`.

Kỳ vọng:

- Có dữ liệu `currentStreak`, `maxStreak`.
- Nếu học sinh chưa có lịch sử điểm danh thì hiện empty state.

### Luồng A9. Tạo vật phẩm reward store

1. Mở tab `Kho quà`.
2. Bấm `Tạo vật phẩm`.
3. Nhập:
   - `Tên vật phẩm`
   - `Mô tả`
   - `Ảnh vật phẩm`: bấm chọn file ảnh từ máy
   - `Cost stars`
   - `Quantity`
   - bật/tắt `Hiển thị trên cửa hàng active`
4. Bấm `Lưu vật phẩm`.

Kỳ vọng:

- Ảnh được upload và hiện preview trước khi lưu.
- Item mới xuất hiện trong danh sách.

### Luồng A10. Sửa / ẩn / mở / xóa vật phẩm

1. Ở tab `Kho quà`, chọn một item.
2. Test lần lượt:
   - `Sửa`
   - `Ẩn vật phẩm` hoặc `Mở vật phẩm`
   - `Xóa`

Kỳ vọng:

- Toggle thay đổi badge `Đang mở` / `Đang ẩn`.
- Item biến mất sau khi xóa nếu backend cho phép.

### Luồng A11. Xử lý redemption

1. Mở tab `Đổi thưởng`.
2. Chọn một đơn đang `Requested`.
3. Bấm `Duyệt`.
4. Sau đó bấm `Đánh dấu đã giao`.

Kỳ vọng:

- Status chuyển `Requested -> Approved -> Delivered`.

### Luồng A12. Hủy redemption

1. Chọn đơn đang `Requested` hoặc `Approved`.
2. Bấm `Hủy`.
3. Nhập hoặc bỏ trống lý do.

Kỳ vọng:

- Status chuyển `Cancelled`.
- Nếu backend hoàn lại tồn kho và sao thì learner sẽ thấy dữ liệu cập nhật sau reload.

### Luồng A13. Batch deliver

1. Ở tab `Đổi thưởng`, nhập `Năm`, `Tháng`.
2. Bấm `Batch deliver`.

Kỳ vọng:

- Những redemption đủ điều kiện được mark delivered theo backend rule.
- Nếu input sai tháng/năm thì báo lỗi.

## 3.2. ManagementStaff

### Màn hình cần thấy

- Vào `/vi/portal/staff-management/gamification`
- Phải thấy đủ 4 tab:
  - `Mission`
  - `Sao / XP`
  - `Kho quà`
  - `Đổi thưởng`

### Checklist test

- Test lại toàn bộ luồng `A1 -> A13`.
- Kỳ vọng tương đương `Admin`.

## 3.3. Teacher

### Màn hình cần thấy

- Vào `/vi/portal/teacher/gamification`
- Phải thấy các tab:
  - `Mission`
  - `Sao / XP`
  - `Đổi thưởng`
- Không được thấy tab `Kho quà`.

### Luồng T1. Tạo và sửa mission

1. Mở tab `Mission`.
2. Tạo mission mới.
3. Sửa mission đó.

Kỳ vọng:

- Tạo và sửa được.

### Luồng T2. Không có quyền xóa mission

1. Mở list `Mission`.

Kỳ vọng:

- Không thấy nút `Xóa`.

### Luồng T3. Xem progress mission

1. Bấm `Tiến độ` trên một mission.

Kỳ vọng:

- Dialog progress mở bình thường.

### Luồng T4. Link homework với mission

1. Bấm `Link homework`.
2. Nhập `Homework ID` + `Mission ID`.
3. Bấm `Liên kết`.

Kỳ vọng:

- Thành công khi cặp ID hợp lệ.

### Luồng T5. Cộng/trừ sao và XP

1. Mở tab `Sao / XP`.
2. Chọn học sinh.
3. Test `Cộng sao`, `Trừ sao`, `Cộng XP`, `Trừ XP`.

Kỳ vọng:

- Snapshot học sinh cập nhật ngay sau thao tác.

### Luồng T6. Chỉ xem redemption

1. Mở tab `Đổi thưởng`.
2. Quan sát từng đơn.

Kỳ vọng:

- Thấy nút `Chi tiết`.
- Không thấy các nút staff-only:
  - `Duyệt`
  - `Hủy`
  - `Đánh dấu đã giao`
  - `Batch deliver`

### Luồng T7. Không có quyền quản lý reward store

Kỳ vọng:

- Không có tab `Kho quà`.

## 3.4. Parent

### Màn hình cần thấy

- Vào `/vi/portal/parent/gamification`
- Parent phải chọn học sinh trước.
- Nếu chưa chọn student profile, các action theo `me` có thể lỗi hoặc hiện nhắc chọn học sinh.

### Luồng P1. Xem tổng quan

1. Chọn học sinh.
2. Vào `/vi/portal/parent/gamification`.

Kỳ vọng:

- Thấy:
  - sao
  - XP
  - level
  - streak
  - mission
  - reward history

### Luồng P2. Điểm danh

1. Bấm `Điểm danh hôm nay`.

Kỳ vọng:

- Nếu chưa check-in trong ngày:
  - toast thành công
  - tăng sao/XP
  - tăng streak hoặc reset theo backend
- Nếu đã check-in:
  - toast báo đã điểm danh hôm nay

### Luồng P3. Xem tiến độ mission

1. Mở tab `Nhiệm vụ`.
2. Bấm `Xem tiến độ`.

Kỳ vọng:

- Dialog progress mở theo đúng học sinh đang chọn.

### Luồng P4. Đổi thưởng

1. Mở tab `Đổi thưởng`.
2. Chọn item active.
3. Chọn số lượng.
4. Bấm gửi redemption.

Kỳ vọng:

- Tạo đơn mới trong history.
- Sao bị trừ ngay nếu backend accept.

### Luồng P5. Xác nhận đã nhận quà

1. Chờ đơn ở trạng thái `Delivered`.
2. Bấm `Xác nhận đã nhận`.

Kỳ vọng:

- Status chuyển `Received`.

### Luồng P6. Case thiếu student context

1. Bỏ chọn student profile hoặc dùng token chưa có `StudentId`.
2. Thử:
   - check-in
   - xem progress
   - redeem

Kỳ vọng:

- Hệ thống báo lỗi hoặc nhắc chọn học sinh.

## 3.5. Student

### Màn hình cần thấy

- Vào `/vi/portal/student/gamification`
- Hoặc `/vi/portal/student/rewards` để vào thẳng tab đổi thưởng

### Checklist test

- Test tương tự `P1 -> P5`.
- Khác biệt:
  - Không cần child selector như Parent
  - Mọi action chạy theo student-context của chính token đó

## 3.6. AccountantStaff

### Kỳ vọng

- Không có page gamification chuyên biệt trong repo hiện tại.
- Không có checklist thao tác riêng cho gamification.

## 4. Lesson Plan / Giáo án theo role

## 4.1. Teacher

### Route và quyền nhìn thấy

- Route: `/vi/portal/teacher/subjects`
- Mặc định mở tab `Giao án theo buổi`
- Vẫn có thể chuyển sang tab `Mẫu giáo án`

### Dữ liệu teacher dùng để tạo plan

- `Lớp học` chỉ lấy từ danh sách lớp của teacher
- `Buổi học` chỉ lấy từ timetable của teacher trong khoảng:
  - `6 tháng trước`
  - `6 tháng sau`

### Luồng LPT1. Xem list lesson plan

1. Vào route teacher.
2. Kiểm tra tab mặc định là `Giao án theo buổi`.
3. Kiểm tra card thống kê:
   - tổng lesson plan
   - đã nộp
   - chưa nộp
   - gắn theo mẫu

### Luồng LPT2. Lọc và tìm lesson plan

1. Ở tab `Giao án theo buổi`, test:
   - search keyword
   - filter `Đã nộp`
   - filter `Chưa nộp`
   - filter `Gắn theo mẫu`
   - filter theo `Lớp`

Kỳ vọng:

- Bảng list thay đổi đúng theo filter.

### Luồng LPT3. Tạo lesson plan theo buổi

1. Ở tab `Giao án theo buổi`, bấm `Tạo lesson plan`.
2. Chọn:
   - `Lớp học`
   - `Buổi học`
   - `Template (tùy chọn)`
3. Nhập:
   - `Nội dung dự kiến`
   - `Nội dung thực tế`
   - `Homework`
   - `Ghi chú giáo viên`
4. Bấm `Tạo lesson plan`.

Kỳ vọng:

- Record mới xuất hiện trong list.
- Nếu chọn template, list hiển thị badge `Gắn theo mẫu`.

### Luồng LPT4. Sửa lesson plan

1. Tại list lesson plan, bấm `Chỉnh sửa`.
2. Sửa:
   - `Template`
   - `Nội dung dự kiến`
   - `Nội dung thực tế`
   - `Homework`
   - `Ghi chú giáo viên`
3. Bấm `Lưu lesson plan`.

Kỳ vọng:

- Dữ liệu mới hiển thị lại ở list/detail.

Lưu ý:

- Khi edit, `Lớp học` và `Buổi học` bị khóa.

### Luồng LPT5. Xem chi tiết lesson plan

1. Bấm icon `Xem chi tiết` ở một lesson plan.

Kỳ vọng:

- Dialog mở và hiển thị:
  - lớp học
  - buổi học
  - người nộp
  - thời gian
  - nội dung dự kiến
  - nội dung thực tế
  - homework
  - ghi chú giáo viên
  - template liên kết nếu có

### Luồng LPT6. Xóa lesson plan

1. Bấm `Xóa` tại một row.
2. Confirm xóa.

Kỳ vọng:

- Record biến mất khỏi list nếu backend cho phép.

### Luồng LPT7. Tạo template giáo án

1. Chuyển sang tab `Mẫu giáo án`.
2. Bấm `Tạo mẫu giáo án`.
3. Nhập:
   - `Program`
   - `Level`
   - `Tiêu đề`
   - `Session index`
4. Có thể:
   - nhập `Attachment URL`
   - hoặc chọn file để upload attachment
5. Bấm `Tạo mẫu giáo án`.

Kỳ vọng:

- Template mới xuất hiện trong thư viện.

### Luồng LPT8. Sửa template giáo án

1. Bấm `Chỉnh sửa` ở một template.
2. Sửa:
   - level
   - tiêu đề
   - session index
   - attachment
   - trạng thái active/inactive
3. Bấm `Lưu thay đổi`.

Kỳ vọng:

- Dữ liệu cập nhật đúng.

Lưu ý:

- Khi edit template, `Program` bị khóa.

### Luồng LPT9. Xem detail template và mở file

1. Bấm `Xem chi tiết` ở một template.
2. Nếu có attachment, bấm `Mở file`.

Kỳ vọng:

- File mở tab mới.

### Luồng LPT10. Xóa template

1. Bấm `Xóa` ở một template.
2. Confirm xóa.

Kỳ vọng:

- Template biến mất khỏi list nếu backend cho phép.

### Luồng LPT11. Trạng thái `Đã nộp` / `Chưa nộp`

Lưu ý cho tester:

- UI hiện tại không có nút `Nộp` riêng.
- Trạng thái được suy ra từ `submittedAt` trả về từ backend:
  - có `submittedAt` => `Đã nộp`
  - không có `submittedAt` => `Chưa nộp`

Tester nên kiểm tra:

- record mới tạo ra đang là `draft` hay `submitted`
- record update xong có đổi `submittedAt` hay không

## 4.2. ManagementStaff

### Route và quyền nhìn thấy

- Route: `/vi/portal/staff-management/lesson-plans`
- Mặc định vào tab `Mẫu giáo án`

### Checklist test

- Test toàn bộ luồng `LPT1 -> LPT11`
- Khác teacher ở chỗ:
  - class list lấy theo toàn hệ thống, không chỉ class của teacher
  - session list lấy từ admin sessions API theo class

## 4.3. Admin

### Route và quyền nhìn thấy

- Route: `/vi/portal/admin/documents`
- Mặc định vào tab `Mẫu giáo án`

### Checklist test

- Test toàn bộ luồng `LPT1 -> LPT11`
- Kỳ vọng tương tự `ManagementStaff`

## 4.4. Parent

### Kỳ vọng

- Không có route lesson plan riêng để thao tác.
- Không có menu lesson plan.

## 4.5. Student

### Kỳ vọng

- Không có route lesson plan riêng để thao tác.
- Không có menu lesson plan.

## 4.6. AccountantStaff

### Kỳ vọng

- Không có route lesson plan riêng để thao tác.

## 5. Checklist smoke test ngắn cho tester

## 5.1. Gamification

### Admin / ManagementStaff

1. Tạo mission
2. Tạo reward item
3. Chọn học sinh và cộng sao
4. Xử lý một redemption theo flow `Requested -> Approved -> Delivered`

### Teacher

1. Tạo mission
2. Cộng XP cho học sinh
3. Xem list redemption
4. Xác nhận không thấy `Kho quà`

### Parent / Student

1. Vào gamification
2. Check-in
3. Xem tiến độ mission
4. Redeem 1 item
5. Confirm received khi đơn ở trạng thái `Delivered`

## 5.2. Lesson Plan

### Teacher

1. Tạo 1 template
2. Tạo 1 lesson plan theo buổi
3. Edit lesson plan
4. Xem detail

### ManagementStaff / Admin

1. Tạo template
2. Upload attachment
3. Tạo lesson plan
4. Filter theo class/status
5. Xóa template hoặc lesson plan

## 6. Điểm tester cần lưu ý đặc biệt

- `Parent` test gamification phải chắc chắn đã chọn đúng học sinh.
- `Teacher` không có tab `Kho quà` ở gamification.
- `Teacher` có thể vào cả `Mẫu giáo án` và `Giao án theo buổi`.
- `Lesson plan` hiện chưa có nút submit riêng ở UI, trạng thái phụ thuộc `submittedAt` backend trả về.
- `Admin` lesson plan nằm ở route `documents`, không phải `/gamification` hay `/lesson-plans`.
- `Student` có 2 entry vào gamification:
  - `/portal/student/gamification`
  - `/portal/student/rewards`
