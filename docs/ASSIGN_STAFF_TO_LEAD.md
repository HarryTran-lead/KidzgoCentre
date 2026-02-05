# Tính năng Assign Staff cho Lead

## Tổng quan
Tính năng này cho phép quản trị viên phân công nhân viên ManagementStaff để chăm sóc và tư vấn các lead (khách hàng tiềm năng).

## Các thành phần đã thêm

### 1. Component AssignStaffModal
**File**: `components/portal/leads/AssignStaffModal.tsx`

Component modal cho phép:
- Hiển thị danh sách nhân viên ManagementStaff đang hoạt động
- Tìm kiếm nhân viên theo tên hoặc email
- Chọn nhân viên để phân công
- Hiển thị thông tin nhân viên hiện tại đang phụ trách lead (nếu có)
- Cập nhật phân công nhân viên cho lead

### 2. API Integration
**Endpoints sử dụng**:

#### GET `/api/admin/users`
- **Mục đích**: Lấy danh sách nhân viên ManagementStaff
- **Query Parameters**:
  - `role`: "ManagementStaff" (bắt buộc)
  - `isActive`: true (lọc chỉ lấy nhân viên đang hoạt động)
- **Response**: Danh sách nhân viên với thông tin id, fullName, email, role, isActive

#### POST `/api/leads/[id]/assign`
- **Mục đích**: Phân công nhân viên cho lead
- **Body**: 
  ```json
  {
    "userId": "string" // ID của nhân viên được chọn
  }
  ```
- **Response**: Kết quả phân công thành công hoặc thất bại

## Cách sử dụng

### Trong giao diện Lead Management

1. **Mở trang Lead**: Truy cập vào trang quản lý lead tại `/portal/staff-management/leads`

2. **Chọn lead cần phân công**: 
   - Trong bảng danh sách lead, tìm lead cần phân công
   - Click vào biểu tượng "Phân công" (UserCheck icon) trong cột "Thao tác"

3. **Modal Assign Staff sẽ hiển thị**:
   - Thông tin lead được chọn (tên, ID)
   - Nhân viên hiện tại đang phụ trách (nếu có)
   - Ô tìm kiếm nhân viên
   - Danh sách nhân viên ManagementStaff khả dụng

4. **Tìm kiếm và chọn nhân viên**:
   - Gõ tên hoặc email vào ô tìm kiếm để lọc danh sách
   - Click vào radio button bên cạnh tên nhân viên muốn chọn
   - Nhân viên được chọn sẽ được highlight màu hồng

5. **Xác nhận phân công**:
   - Click nút "Phân công" để xác nhận
   - Hệ thống sẽ hiển thị thông báo kết quả
   - Danh sách lead sẽ tự động refresh để hiển thị thông tin cập nhật

6. **Hủy bỏ**:
   - Click nút "Hủy" hoặc icon X để đóng modal mà không thay đổi

## Luồng hoạt động

```
[User clicks "Phân công" button]
        ↓
[AssignStaffModal opens]
        ↓
[Fetch ManagementStaff list from API]
        ↓
[User searches and selects staff]
        ↓
[User clicks "Phân công" button]
        ↓
[Call API POST /api/leads/[id]/assign]
        ↓
[Show success/error notification]
        ↓
[Refresh lead list and close modal]
```

## Xử lý lỗi

Modal có xử lý các trường hợp lỗi:
- Không thể tải danh sách nhân viên
- Không chọn nhân viên trước khi phân công
- Lỗi từ API khi phân công
- Timeout hoặc lỗi mạng

Tất cả lỗi đều được hiển thị dưới dạng thông báo màu đỏ trong modal.

## Cập nhật trong các file

### Modified Files:
1. `app/[locale]/portal/staff-management/leads/page.tsx`
   - Thêm state `isAssignModalOpen`
   - Thêm handler `handleAssignSuccess`
   - Cập nhật `handleLeadAction` để xử lý action "assign"
   - Thêm component `<AssignStaffModal />` vào render

2. `components/portal/leads/index.ts`
   - Export component `AssignStaffModal`

3. `components/portal/leads/LeadTable.tsx` (already has assign button)
   - Đã có nút "Phân công" trong cột "Thao tác"
   - Gọi `onAction(lead, "assign")` khi click

### New Files:
1. `components/portal/leads/AssignStaffModal.tsx`
   - Component modal mới để phân công nhân viên

## Tính năng nổi bật

✅ Tìm kiếm real-time nhân viên
✅ Hiển thị avatar nhân viên với chữ cái đầu
✅ Highlight nhân viên đang phụ trách hiện tại
✅ Validation trước khi submit
✅ Loading states và error handling
✅ UI/UX thân thiện, responsive
✅ Toast notification cho feedback
✅ Auto-refresh danh sách sau khi phân công

## Testing

### Test Cases cần kiểm tra:
1. ✅ Mở modal assign staff từ bảng lead
2. ✅ Danh sách staff hiển thị đúng (chỉ ManagementStaff)
3. ✅ Tìm kiếm staff hoạt động chính xác
4. ✅ Chọn staff và submit thành công
5. ✅ Hiển thị staff hiện tại nếu lead đã được assign
6. ✅ Xử lý lỗi khi API fail
7. ✅ Validation khi không chọn staff
8. ✅ Loading state hiển thị đúng
9. ✅ Toast notification hiển thị đúng
10. ✅ Danh sách lead refresh sau khi assign

## Screenshots

### Modal Assign Staff
- Header với gradient màu hồng
- Hiển thị thông tin lead
- Box màu xanh hiển thị staff hiện tại (nếu có)
- Ô tìm kiếm với icon search
- Danh sách staff với radio buttons
- Footer với nút "Hủy" và "Phân công"

### Lead Table
- Cột "Phụ trách" hiển thị tên staff hoặc "Chưa phân công"
- Nút "Phân công" (UserCheck icon) màu xanh lá trong cột "Thao tác"

## Future Enhancements

Các cải tiến có thể thêm trong tương lai:
- [ ] Thêm filter theo branch/chi nhánh
- [ ] Hiển thị số lượng lead đã assign cho mỗi staff
- [ ] Thêm bulk assign (phân công nhiều lead cùng lúc)
- [ ] Lịch sử phân công (assignment history)
- [ ] Thông báo realtime cho staff khi được assign lead mới
- [ ] Auto-assign dựa trên workload
- [ ] Re-assign lead sang staff khác
