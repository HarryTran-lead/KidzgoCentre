# Placement Test Management System

Hệ thống quản lý Placement Test (Kiểm tra đầu vào) cho trung tâm Kidz Go.

## Cấu trúc file

### Types
- `types/placement-test/index.ts` - Định nghĩa các type và interface cho Placement Test

### API Routes
- `app/api/placement-tests/route.ts` - GET all, POST create
- `app/api/placement-tests/[id]/route.ts` - GET by ID, PUT update
- `app/api/placement-tests/[id]/cancel/route.ts` - POST cancel test
- `app/api/placement-tests/[id]/no-show/route.ts` - POST mark as no-show
- `app/api/placement-tests/[id]/results/route.ts` - PUT update results
- `app/api/placement-tests/[id]/notes/route.ts` - POST add note
- `app/api/placement-tests/[id]/convert-to-enrolled/route.ts` - POST convert to enrolled student

### Components
- `components/portal/placement-tests/PlacementTestTable.tsx` - Bảng hiển thị danh sách placement tests
- `components/portal/placement-tests/PlacementTestFormModal.tsx` - Form tạo/chỉnh sửa placement test
- `components/portal/placement-tests/ResultFormModal.tsx` - Form nhập kết quả test
- `components/portal/placement-tests/PlacementTestDetailModal.tsx` - Modal hiển thị chi tiết test
- `components/portal/placement-tests/PlacementTestFilterPanel.tsx` - Panel lọc nâng cao

### Pages
- `app/[locale]/portal/staff-management/placement-tests/page.tsx` - Trang quản lý placement tests

## Tính năng chính

### 1. Quản lý Placement Tests
- ✅ Tạo lịch test mới cho lead/trẻ
- ✅ Chỉnh sửa thông tin lịch test
- ✅ Xem chi tiết lịch test
- ✅ Hủy lịch test
- ✅ Đánh dấu không đến (No-show)

### 2. Nhập kết quả
- ✅ Nhập điểm các kỹ năng: Nghe, Nói, Đọc, Viết
- ✅ Tính điểm tổng
- ✅ Đề xuất trình độ phù hợp
- ✅ Ghi chú điểm mạnh, điểm yếu
- ✅ Đề xuất lộ trình học

### 3. Quản lý sau test
- ✅ Chuyển đổi thành học viên chính thức
- ✅ Thêm ghi chú
- ✅ Xem lịch sử hoạt động

### 4. Tìm kiếm và lọc
- ✅ Tìm kiếm theo tên, số điện thoại
- ✅ Lọc theo trạng thái
- ✅ Lọc theo chi nhánh
- ✅ Lọc theo giáo viên phụ trách
- ✅ Lọc theo khoảng thời gian

### 5. Sắp xếp
- ✅ Sắp xếp theo tên trẻ
- ✅ Sắp xếp theo tên phụ huynh
- ✅ Sắp xếp theo thời gian test
- ✅ Sắp xếp theo chi nhánh
- ✅ Sắp xếp theo trạng thái

## Các API Endpoints

### Backend API (được proxy qua Next.js API Routes)

#### Lấy danh sách placement tests
```
GET /api/placement-tests?status=Scheduled&branchId=xxx&searchTerm=xxx
```

Query Parameters:
- `status`: Scheduled, Completed, Cancelled, NoShow
- `branchId`: ID chi nhánh
- `assignedTeacherId`: ID giáo viên
- `fromDate`: Ngày bắt đầu (ISO format)
- `toDate`: Ngày kết thúc (ISO format)
- `searchTerm`: Từ khóa tìm kiếm
- `sortBy`: Trường sắp xếp
- `sortOrder`: asc/desc
- `page`: Trang hiện tại
- `pageSize`: Số item mỗi trang

#### Lấy chi tiết placement test
```
GET /api/placement-tests/{id}
```

#### Tạo placement test mới
```
POST /api/placement-tests
Content-Type: application/json

{
  "leadId": "string",
  "childId": "string",
  "scheduledAt": "2024-01-01T10:00:00Z",
  "testLocation": "string",
  "branchId": "string",
  "assignedTeacherId": "string",
  "notes": "string"
}
```

#### Cập nhật placement test
```
PUT /api/placement-tests/{id}
Content-Type: application/json

{
  "scheduledAt": "2024-01-01T10:00:00Z",
  "testLocation": "string",
  "branchId": "string",
  "assignedTeacherId": "string",
  "notes": "string"
}
```

#### Hủy lịch test
```
POST /api/placement-tests/{id}/cancel
Content-Type: application/json

{
  "reason": "string"
}
```

#### Đánh dấu không đến
```
POST /api/placement-tests/{id}/no-show
Content-Type: application/json

{
  "notes": "string"
}
```

#### Nhập kết quả test
```
PUT /api/placement-tests/{id}/results
Content-Type: application/json

{
  "listeningScore": 8.5,
  "speakingScore": 7.0,
  "readingScore": 8.0,
  "writingScore": 7.5,
  "overallScore": 7.75,
  "suggestedLevel": "Intermediate",
  "strengths": "Good listening and reading skills",
  "weaknesses": "Need to improve speaking fluency",
  "recommendations": "Enroll in Intermediate level course"
}
```

#### Thêm ghi chú
```
POST /api/placement-tests/{id}/notes
Content-Type: application/json

{
  "content": "string"
}
```

#### Chuyển thành học viên
```
POST /api/placement-tests/{id}/convert-to-enrolled
Content-Type: application/json

{
  "programId": "string",
  "classId": "string",
  "startDate": "2024-01-01"
}
```

## Cách sử dụng

### 1. Truy cập trang Placement Tests
Đi đến: `/portal/staff-management/placement-tests`

### 2. Tạo Placement Test mới
1. Click nút "Tạo Test mới"
2. Chọn phụ huynh (Lead)
3. Chọn trẻ từ danh sách children của lead
4. Chọn thời gian test
5. Chọn chi nhánh (optional)
6. Nhập địa điểm test (optional)
7. Phân công giáo viên (optional)
8. Thêm ghi chú (optional)
9. Click "Tạo mới"

### 3. Nhập kết quả test
1. Tìm placement test có trạng thái "Đã lên lịch"
2. Click menu actions (3 chấm)
3. Chọn "Nhập kết quả"
4. Nhập điểm các kỹ năng
5. Nhập điểm tổng
6. Đề xuất trình độ
7. Ghi chú điểm mạnh, điểm yếu
8. Đưa ra đề xuất
9. Click "Lưu kết quả"

### 4. Chuyển thành học viên
1. Tìm placement test có trạng thái "Đã hoàn thành"
2. Click menu actions
3. Chọn "Chuyển thành học viên"
4. Xác nhận

### 5. Xem chi tiết
Click vào nút "Xem" (icon mắt) để xem chi tiết placement test và kết quả

## Trạng thái Placement Test

- **Scheduled (Đã lên lịch)**: Test đã được lên lịch, chưa thực hiện
- **Completed (Đã hoàn thành)**: Test đã hoàn thành và có kết quả
- **Cancelled (Đã hủy)**: Test đã bị hủy
- **NoShow (Không đến)**: Học viên không đến tham gia test

## Luồng xử lý

1. Lead được tạo → Children được thêm vào lead
2. Tạo Placement Test cho child
3. Thực hiện test → Nhập kết quả
4. Xem xét kết quả → Quyết định chuyển thành học viên hoặc không
5. Nếu đồng ý → Chuyển thành học viên → Ghi danh vào khóa học

## Lưu ý

- Token authentication được lưu trong localStorage
- Tất cả API calls đều cần Authorization header
- Dates được format theo ISO 8601 standard
- Việc chuyển đổi thành học viên cần được backend xử lý việc tạo student profile

## TODO - Tính năng mở rộng

- [ ] Pagination cho danh sách placement tests
- [ ] Export kết quả ra PDF/Excel
- [ ] In phiếu kết quả test
- [ ] Gửi email thông báo kết quả cho phụ huynh
- [ ] Lịch sử thay đổi trạng thái
- [ ] Upload file đính kèm (bài làm test)
- [ ] Tích hợp calendar view
- [ ] Báo cáo thống kê placement tests
- [ ] Dashboard analytics
