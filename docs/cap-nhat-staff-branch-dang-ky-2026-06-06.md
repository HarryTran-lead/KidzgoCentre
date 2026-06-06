# Ghi chú cập nhật ngày 06/06/2026

## 1. Chi tiết đăng ký

- Bổ sung ô thông tin **Trình độ** trong modal chi tiết đăng ký, hiển thị `levelName` của chương trình chính và `secondaryLevelName` nếu có chương trình song song.
- Điều chỉnh ô **Chương trình** chỉ hiển thị tên chương trình, tránh trộn tên trình độ vào cùng một nhãn.
- Việt hóa cột **Nội dung** trong lịch sử vé học:
  - `Purchase ...` hiển thị thành `Cấp vé từ gói học: ...`.
  - `Void remaining tickets because registration was cancelled` hiển thị thành `Hủy vé còn lại vì đăng ký đã bị hủy`.

File đã chỉnh:

- `components/portal/registrations/modals/RegistrationDetailModal.tsx`

## 2. Quản lý danh sách lớp học cho staff

- Bưng giao diện và luồng xử lý quản lý lớp học của admin sang staff để staff dùng chung logic hiện tại.
- Thêm route staff: `/portal/staff-management/classes`.
- Thêm menu **Quản lý lớp học** trong sidebar staff.
- Thêm mục tìm kiếm nhanh trong Global Search cho staff.
- Khóa phạm vi dữ liệu lớp học theo chi nhánh của tài khoản staff đang đăng nhập:
  - Danh sách lớp chỉ tải theo `currentUser.branchId`.
  - Tạo lớp mới tự gán chi nhánh staff, không cho chọn chi nhánh khác.
  - Sửa lớp giữ nguyên logic cũ nhưng bị giới hạn trong dữ liệu chi nhánh staff.

File đã chỉnh:

- `app/[locale]/portal/admin/classes/page.tsx`
- `app/[locale]/portal/staff-management/classes/page.tsx`
- `components/portal/menu/staffManager.ts`
- `components/portal/header/GlobalSearchModal.tsx`

## 3. Tổng quan báo cáo V3 cho staff

- Ẩn field **Chi nhánh** ở phần tổng quan báo cáo khi người dùng là staff/management.
- Tự động dùng chi nhánh của tài khoản staff đang đăng nhập để tải dữ liệu:
  - Danh sách lớp.
  - Dữ liệu dashboard/tổng quan.
  - Tạo báo cáo.
  - Modal tạo báo cáo.
- Admin vẫn giữ nguyên quyền chọn chi nhánh như cũ.

File đã chỉnh:

- `components/reports-v3/ReportsV3FunctionalWorkspace.tsx`
- `components/reports-v3/tabs/GenerateReportModal.tsx`

## 4. Các phần staff tương tự đã rà và chỉnh

### Lịch học staff

- Khóa danh sách lớp và lịch học theo chi nhánh staff.
- Modal tạo lịch học tự dùng chi nhánh staff, không cho chọn chi nhánh khác.

File đã chỉnh:

- `app/[locale]/portal/staff-management/schedule/page.tsx`

### Báo cáo sự cố staff

- Khóa danh sách báo cáo sự cố, thống kê và modal tạo báo cáo theo chi nhánh staff.
- Staff không thể chọn hoặc tạo dữ liệu cho chi nhánh khác.

File đã chỉnh:

- `components/portal/shared/IncidentReportWorkspace.tsx`
- `app/[locale]/portal/staff-management/incident-reports/page.tsx`

### Bảo lưu học staff

- Khóa danh sách yêu cầu bảo lưu, bộ lọc lớp và danh sách lớp chuyển xếp lại theo chi nhánh staff.
- Nếu tài khoản staff không có chi nhánh, giao diện sẽ báo không xác định được chi nhánh.

File đã chỉnh:

- `components/portal/pause-enrollment/PauseEnrollmentWorkspace.tsx`

## 5. Các chỉnh sửa liên quan từ phần đăng ký/xếp lớp trước đó

- Bổ sung phân biệt loại vé/gói học trong UI tạo đăng ký.
- Ẩn chương trình song song khi gói học không phải vé `STANDARD`.
- Lọc lớp thủ công và lớp gợi ý theo loại vé học:
  - Gói `NATIVE` chỉ hiện lớp native.
  - Gói `STANDARD` chỉ hiện lớp standard/phù hợp.
- Hiển thị đề xuất trình độ chính và đề xuất trình độ song song trong chi tiết bài kiểm tra.

File đã chỉnh:

- `lib/tuitionPlanTicketType.ts`
- `types/registration/index.ts`
- `lib/api/registrationService.ts`
- `components/portal/placement-tests/RegistrationFlowModal.tsx`
- `components/portal/placement-tests/registration-flow/CreateRegistrationStep.tsx`
- `components/portal/placement-tests/registration-flow/SuggestAssignStep.tsx`
- `components/portal/registrations/StaffRegistrationOverview.tsx`
- `components/portal/placement-tests/PlacementTestDetailModal.tsx`

## 6. Kiểm tra

- Đã chạy kiểm tra lint theo các file liên quan.
- Lệnh lint hiện vẫn báo nhiều lỗi cũ có sẵn trong các file lớn, chủ yếu là `any`, biến chưa dùng và một số cảnh báo hook cũ. Các lỗi này không được sửa lan rộng để tránh thay đổi ngoài phạm vi yêu cầu.

## 7. Cập nhật bổ sung cho class detail và classrooms staff

### Chi tiết lớp học cho staff

- Sửa nút **Xem chi tiết** trong danh sách lớp dùng chung để staff đi về route staff: `/portal/staff-management/classes/{id}` thay vì route admin.
- Thêm route chi tiết lớp học cho staff, dùng lại giao diện chi tiết lớp học của admin.
- Trang chi tiết lớp học tự nhận biết đang ở staff route để nút **Quay lại danh sách lớp** quay về `/portal/staff-management/classes`.
- Bổ sung kiểm tra chi nhánh ở chi tiết lớp học: nếu dữ liệu detail có `branchId` khác chi nhánh staff đang đăng nhập thì không cho xem.

File đã chỉnh/thêm:

- `app/[locale]/portal/admin/classes/page.tsx`
- `app/[locale]/portal/admin/classes/[id]/page.tsx`
- `app/[locale]/portal/staff-management/classes/[id]/page.tsx`
- `app/api/admin/classes.ts`
- `types/admin/classes.ts`

### Quản lý phòng học cho staff

- Bưng giao diện và chức năng **Quản lý phòng học** của admin sang staff.
- Thêm route staff: `/portal/staff-management/rooms`.
- Thêm menu **Quản lý phòng học** cho sidebar staff.
- Thêm mục tìm kiếm nhanh **Phòng học** trong Global Search của staff.
- Khóa dữ liệu phòng học theo chi nhánh của tài khoản staff đang đăng nhập:
  - Danh sách phòng chỉ tải theo `currentUser.branchId`.
  - Modal tạo/sửa phòng tự dùng chi nhánh staff và không cho chọn chi nhánh khác.
  - Lịch sử dụng phòng trong ngày chỉ lấy session thuộc chi nhánh staff.
  - Sau tạo/sửa/tạm dừng/kích hoạt phòng, danh sách reload lại đúng chi nhánh staff.
- Bổ sung fallback cho modal **Chi tiết phòng học**: nếu API detail bị chặn, modal vẫn hiển thị thông tin tóm tắt từ row đang chọn để không làm đứt luồng thao tác.

File đã chỉnh/thêm:

- `app/[locale]/portal/admin/rooms/page.tsx`
- `app/[locale]/portal/staff-management/rooms/page.tsx`
- `components/portal/menu/staffManager.ts`
- `components/portal/header/GlobalSearchModal.tsx`

### Proxy classrooms

- Bổ sung proxy `/api/classrooms` cho danh sách/tạo phòng học.
- Bổ sung proxy `/api/classrooms/{id}` cho xem/cập nhật phòng học.
- Giữ nguyên proxy toggle-status hiện có.

File đã thêm:

- `app/api/classrooms/route.ts`
- `app/api/classrooms/[id]/route.ts`

### Kiểm tra bổ sung

- Đã chạy lint riêng cho các file route/proxy/menu mới:
  - `app/api/classrooms/route.ts`
  - `app/api/classrooms/[id]/route.ts`
  - `app/[locale]/portal/staff-management/classes/[id]/page.tsx`
  - `app/[locale]/portal/staff-management/rooms/page.tsx`
  - `components/portal/menu/staffManager.ts`
- Nhóm file mới này lint sạch.
- Khi lint kèm các page admin lớn đang dùng chung, lệnh vẫn báo các lỗi cũ như `any`, import/biến chưa dùng trong `classes/[id]/page.tsx`, `rooms/page.tsx` và `GlobalSearchModal.tsx`; các lỗi này không được sửa lan rộng để tránh thay đổi ngoài phạm vi.
