# Branch-Based Lead Filtering Implementation

## Tổng quan
Tính năng này cho phép staff chỉ xem và quản lý leads thuộc chi nhánh của họ.

## Các thay đổi đã thực hiện

### 1. Types (types/lead/index.ts)
- Thêm `branchId?: string` vào `GetAllLeadsParams` để support filter theo branch ID

### 2. Lead Service (lib/api/leadService.ts)
- Update `getAllLeads()` function để forward `branchId` parameter đến API endpoint
- API sẽ tự động filter leads dựa trên `branchId` được truyền vào

### 3. Custom Hook (hooks/useCurrentUser.ts) - MỚI
- Tạo hook `useCurrentUser()` để fetch thông tin user hiện tại từ `/api/auth/me`
- Return user data bao gồm:
  - `id`: User ID
  - `email`: Email
  - `fullName`: Tên đầy đủ
  - `role`: Vai trò
  - `branchId`: ID chi nhánh (quan trọng cho filtering)
  - `branchName`: Tên chi nhánh (hiển thị UI)
  - `isActive`: Trạng thái active

### 4. Staff Leads Page (app/[locale]/portal/staff-management/leads/page.tsx)
- Import và sử dụng `useCurrentUser()` hook
- Tự động filter leads theo `branchId` của staff đang đăng nhập:
  - `fetchInitialData()`: Load stats với branch filter
  - `fetchLeads()`: Load paginated data với branch filter
- Hiển thị tên chi nhánh trong page header để user biết context
- Chỉ fetch data khi user info đã được load (`currentUser && !isLoadingUser`)

## Cách hoạt động

1. **Staff đăng nhập vào hệ thống**
   - Backend trả về thông tin user bao gồm `branchId`

2. **Trang Leads được load**
   - `useCurrentUser()` hook fetch thông tin user hiện tại
   - Component chờ user data được load (`isLoadingUser === false`)

3. **API calls tự động filter theo branch**
   - Mọi API call đến `/api/leads` đều include parameter `branchId`
   - Backend filter và chỉ trả về leads của chi nhánh đó
   - Stats và filters cũng được tính dựa trên leads của chi nhánh

4. **UI hiển thị context**
   - Tên chi nhánh được hiển thị trong header
   - User biết rõ họ đang xem leads của chi nhánh nào

## API Flow

```
Staff Login → GET /api/auth/me → Returns user with branchId
                                    ↓
                              Leads Page loads
                                    ↓
                         useCurrentUser() fetches user info
                                    ↓
                    GET /api/leads?branchId={userBranchId}
                                    ↓
                    Backend filters leads by branch
                                    ↓
                    Returns only leads for that branch
```

## Testing

Để test tính năng:

1. Đăng nhập với staff account có `branchId` khác nhau
2. Verify rằng mỗi staff chỉ thấy leads của chi nhánh mình
3. Kiểm tra header có hiển thị đúng tên chi nhánh
4. Verify stats (số lượng leads theo status) chỉ tính leads của chi nhánh đó

## Backend Requirements

Backend API `/api/leads` cần support parameter `branchId`:
- Accept `branchId` query parameter
- Filter leads WHERE `branchId = :branchId`
- Apply filter cho cả data và count/stats queries

## Security Considerations

- Frontend filter chỉ là UI convenience
- Backend PHẢI validate và enforce branch-based access control
- Staff không được phép request leads của branch khác thông qua API manipulation
- Consider implement middleware check: user's branchId MUST match requested branchId

## Future Enhancements

Có thể cải thiện thêm:
- Cache user info để giảm API calls
- Add loading skeleton cho initial data fetch
- Support multi-branch access cho Admin/Manager roles
- Add branch selector dropdown cho users có access nhiều branches
