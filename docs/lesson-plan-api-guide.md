# Hướng Dẫn API Lesson Plan

Tài liệu này chốt lại flow chuẩn mà frontend nên bám cho `lesson plan` và `lesson plan template` theo backend hiện tại.

Mục tiêu của bản này là:
- tách rõ dữ liệu `syllabus chuẩn` và `giáo án thực tế`,
- xác định đúng endpoint chính cho từng role,
- loại bỏ tư duy CRUD cũ không còn phù hợp với controller mới.

## 1. Tư duy dữ liệu

### 1.1. Lesson plan template

- `lesson_plan_templates` là syllabus chuẩn của chương trình.
- Mỗi template map theo cặp `ProgramId + SessionIndex`.
- Template do `Admin` hoặc `ManagementStaff` quản lý.
- Template có thể được:
  - tạo thủ công,
  - cập nhật thủ công,
  - import hàng loạt từ `xlsx/xls/csv`.

### 1.2. Lesson plan

- `lesson_plans` là giáo án thực tế của một buổi học cụ thể.
- Mỗi lesson plan gắn với `Class + Session`.
- Teacher chỉ được thao tác các session mình dạy.
- Nội dung teacher cập nhật chỉ áp dụng cho buổi học đó, không ghi đè template gốc.

### 1.3. Quan hệ giữa template và lesson plan

- Template là nguồn syllabus chuẩn.
- Lesson plan là bản áp dụng thực tế cho một session của một class.
- Khi tạo lesson plan:
  - nếu `templateId = null`, backend tự tìm template theo `Class.ProgramId + SessionIndex`,
  - nếu `plannedContent` rỗng hoặc `null`, backend tự copy từ `template.SyllabusContent`.

## 2. Flow chuẩn theo vai trò

### 2.1. Flow của Admin hoặc ManagementStaff

Đây là luồng quản lý syllabus chuẩn.

1. Import syllabus chuẩn vào `lesson_plan_templates`.
2. Hệ thống map từng template theo `ProgramId + SessionIndex`.
3. Staff/Admin có thể xem danh sách template theo bộ lọc.
4. Staff/Admin có thể mở chi tiết một template.
5. Staff/Admin có thể chỉnh sửa từng template nếu cần.
6. Nếu cần tạo lẻ một buổi riêng biệt, dùng API create thủ công.

Endpoint chính:
- `POST /api/lesson-plan-templates/import`
- `GET /api/lesson-plan-templates`
- `GET /api/lesson-plan-templates/{id}`
- `POST /api/lesson-plan-templates`
- `PUT /api/lesson-plan-templates/{id}`

### 2.2. Flow của Teacher

Đây là luồng vận hành giáo án theo class.

1. Teacher mở lớp.
2. Frontend gọi `GET /api/lesson-plans/classes/{classId}/syllabus`.
3. Backend trả về toàn bộ session của lớp, template tương ứng, lesson plan tương ứng, và quyền `canEdit`.
4. Frontend render danh sách session theo `sessionIndex` do backend tính.
5. Nếu session chưa có lesson plan và `canEdit = true`, frontend cho phép tạo lesson plan.
6. Nếu session đã có lesson plan và `canEdit = true`, frontend cho phép mở chi tiết và cập nhật.

Endpoint chính:
- `GET /api/lesson-plans/classes/{classId}/syllabus`
- `POST /api/lesson-plans`
- `GET /api/lesson-plans/{id}`
- `PUT /api/lesson-plans/{id}`

### 2.3. Kết luận quan trọng

- Với teacher, màn hình chính phải xoay quanh `GET /api/lesson-plans/classes/{classId}/syllabus`.
- Frontend không nên lấy danh sách lesson plan tổng quát rồi tự map lại theo class/session.
- Frontend không tự tính `sessionIndex`.
- Frontend không tự map `program -> template` bằng constant local.

## 3. Các API còn dùng

### 3.1. Nhóm lesson plan template

- `POST /api/lesson-plan-templates`
- `GET /api/lesson-plan-templates`
- `GET /api/lesson-plan-templates/{id}`
- `PUT /api/lesson-plan-templates/{id}`
- `POST /api/lesson-plan-templates/import`

### 3.2. Nhóm lesson plan

- `GET /api/lesson-plans/classes/{classId}/syllabus`
- `POST /api/lesson-plans`
- `GET /api/lesson-plans/{id}`
- `PUT /api/lesson-plans/{id}`

## 4. Các API đã bỏ, frontend không được gọi lại

- `DELETE /api/lesson-plan-templates/{id}`
- `GET /api/lesson-plans`
- `DELETE /api/lesson-plans/{id}`
- `GET /api/lesson-plans/{id}/template`
- `PATCH /api/lesson-plans/{id}/actual`

## 5. Read model mà frontend nên bám

### 5.1. Read model cho teacher

`GET /api/lesson-plans/classes/{classId}/syllabus` là read model quan trọng nhất.

API này trả về:
- thông tin lớp,
- thông tin chương trình,
- metadata chung của syllabus,
- danh sách session theo thứ tự,
- template tương ứng của từng session,
- lesson plan hiện tại của từng session,
- quyền `canEdit` của user hiện tại.

Ý nghĩa triển khai:
- chỉ cần một API để render màn syllabus của teacher,
- không cần tự ghép dữ liệu từ nhiều nguồn rời rạc,
- nếu lesson plan chưa tồn tại, frontend vẫn có thể hiển thị fallback từ template.

### 5.2. Read model cho staff hoặc admin

`GET /api/lesson-plan-templates` là read model chính cho màn quản lý template.

API này phục vụ:
- lọc theo `program`,
- lọc theo `level`,
- lọc theo `title`,
- lọc theo `isActive`,
- phân trang.

Lưu ý:
- `title` hiện đang so sánh theo dạng bằng tuyệt đối sau khi lowercase, không phải tìm kiếm contains.

## 6. Dữ liệu chính mà frontend phải hiểu đúng

### 6.1. LessonPlanTemplate

Field chính:
- `programId`
- `level`
- `title`
- `sessionIndex`
- `syllabusMetadata`
- `syllabusContent`
- `sourceFileName`
- `attachment`
- `isActive`

### 6.2. LessonPlan

Field chính:
- `classId`
- `sessionId`
- `templateId`
- `plannedContent`
- `actualContent`
- `actualHomework`
- `teacherNotes`

### 6.3. `syllabusMetadata` và `syllabusContent`

- `syllabusMetadata` là metadata chung của file hoặc sheet syllabus.
- `syllabusContent` là JSON nội dung chuẩn của một session.
- Frontend nên parse JSON này để render theo UI.
- Không nên coi `syllabusContent` là plain text thông thường.
- Nếu parse lỗi thì mới fallback sang raw text.

## 7. Chuỗi call chuẩn cho từng use case

### 7.1. Import syllabus chuẩn

1. User chọn file `xlsx/xls/csv`.
2. Frontend gọi `POST /api/lesson-plan-templates/import`.
3. Backend parse file và upsert theo `ProgramId + SessionIndex`.
4. Frontend reload danh sách template bằng `GET /api/lesson-plan-templates`.

Ghi nhớ:
- `csv` bắt buộc có `programId`.
- `xlsx/xls` có thể nhiều sheet.
- `overwriteExisting = true` thì update template trùng.
- `overwriteExisting = false` thì bỏ qua template đã tồn tại.

### 7.2. Teacher mở màn syllabus của lớp

1. Frontend có `classId`.
2. Gọi `GET /api/lesson-plans/classes/{classId}/syllabus`.
3. Render header lớp và danh sách session.
4. Với mỗi session:
   - nếu có `lessonPlanId` thì hiển thị dữ liệu lesson plan,
   - nếu chưa có `lessonPlanId` thì hiển thị dữ liệu fallback từ template,
   - nếu `canEdit = false` thì disable hành động chỉnh sửa.

### 7.3. Teacher tạo lesson plan

1. User bấm tạo ở session có `lessonPlanId = null` và `canEdit = true`.
2. Frontend gọi `POST /api/lesson-plans`.
3. Có thể gửi:
   - `templateId = null`,
   - `plannedContent = null`.
4. Backend tự resolve template và tự copy planned content nếu cần.
5. Sau khi tạo xong, frontend reload lại syllabus của lớp hoặc lấy chi tiết lesson plan mới.

### 7.4. Teacher cập nhật lesson plan

1. User mở chi tiết qua `GET /api/lesson-plans/{id}`.
2. User chỉnh nội dung thực tế.
3. Frontend gọi `PUT /api/lesson-plans/{id}`.
4. Sau khi lưu thành công, frontend reload detail hoặc reload syllabus list.

## 8. Rule nghiệp vụ quan trọng

### 8.1. Rule của `GET /api/lesson-plans/classes/{classId}/syllabus`

- `sessionIndex` được backend tính theo thứ tự `PlannedDatetime`.
- Nếu lesson plan chưa có:
  - `lessonPlanId = null`,
  - `plannedContent` có thể fallback từ template.
- `canEdit = true` khi:
  - user không phải teacher, hoặc
  - user là teacher đang là `PlannedTeacher` hoặc `ActualTeacher` của session đó.

### 8.2. Rule của `POST /api/lesson-plans`

- `classId` phải tồn tại.
- `sessionId` phải tồn tại.
- `session` phải thuộc đúng `classId`.
- Mỗi `session` chỉ có tối đa một lesson plan chưa bị xóa mềm.
- Nếu user là teacher thì chỉ được tạo lesson plan cho session mình dạy.

### 8.3. Rule của `PUT /api/lesson-plans/{id}` và `PUT /api/lesson-plan-templates/{id}`

- Chỉ field nào khác `null` mới được cập nhật.
- Nếu field gửi lên là `null`, backend sẽ bỏ qua field đó.
- Backend hiện chưa hỗ trợ clear field về `null` một cách tường minh.

### 8.4. Rule của import template

Backend hiện đang:
- tìm dòng header chứa `Period / Date / Teacher`,
- bỏ qua metadata phía trên header,
- bỏ qua sub-header nếu có,
- gom nhiều dòng con cùng `Period` thành một session,
- xử lý một số trường hợp lệch cột do merge cell,
- upsert theo `ProgramId + SessionIndex`.

## 9. Response và error handling

### 9.1. Response thành công

Các API thành công có dạng:

```json
{
  "isSuccess": true,
  "data": {}
}
```

### 9.2. Problem details

Lỗi nghiệp vụ thường có dạng:

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.4",
  "title": "LessonPlan.ClassNotFound",
  "status": 404,
  "detail": "Class with Id = 'guid' was not found",
  "traceId": "00-..."
}
```

Frontend nên đọc:
- `status`
- `title`
- `detail`

### 9.3. Mapping status code hiện tại

- `Validation` -> `400 Bad Request`
- `NotFound` -> `404 Not Found`
- `Conflict` -> `409 Conflict`

### 9.4. Phân biệt 2 loại lỗi quyền

Lỗi auth framework:
- `401 Unauthorized`
- `403 Forbidden`

Lỗi phân quyền nghiệp vụ đang bị map thành `400`:
- `LessonPlan.Unauthorized`
- `LessonPlanTemplate.Unauthorized`

Frontend cần phân biệt:
- `401/403` là lỗi xác thực hoặc role của framework,
- `400` với `title` như trên là lỗi quyền ở tầng nghiệp vụ.

### 9.5. Trường hợp lỗi import không có file

Trường hợp không gửi file không trả về problem details mà trả:

```json
{
  "error": "No file provided"
}
```

Frontend phải xử lý case này riêng.

## 10. UI tối thiểu nên có

### 10.1. Màn của admin hoặc staff

- Bộ lọc theo `program`, `level`, `title`, `active`.
- Upload file `xlsx/xls/csv`.
- Tùy chọn `overwriteExisting`.
- Kết quả import theo từng program.
- Màn xem hoặc sửa một session template.

### 10.2. Màn của teacher

- Header lớp:
  - `classCode`
  - `classTitle`
  - `programName`
- Metadata chung của syllabus.
- Danh sách session theo thứ tự backend trả về.
- Trên mỗi session hiển thị:
  - template content,
  - planned content,
  - actual content,
  - homework,
  - teacher notes,
  - trạng thái có được sửa hay không.

### 10.3. State tối thiểu

- Empty state khi program chưa có template.
- Empty state khi session chưa có lesson plan.
- Disabled state khi `canEdit = false`.
- Loading state cho import file lớn.
- Error state rõ ràng khi sheet không map được sang program.
- Fallback raw text khi parse JSON lỗi.

## 11. Điều frontend không nên làm

- Không hardcode syllabus trong frontend.
- Không tự map `program -> template` bằng constant local.
- Không tự tính `sessionIndex`.
- Không lấy file Excel hoặc CSV ở frontend làm nguồn dữ liệu chuẩn.
- Không tiếp tục gọi các API đã bỏ.
- Không dùng `GET /api/lesson-plans` làm nguồn chính cho màn teacher.

## 12. Tóm tắt triển khai

- `lesson_plan_templates` là syllabus chuẩn theo `ProgramId + SessionIndex`.
- `lesson_plans` là dữ liệu thực tế của từng `Class + Session`.
- Admin hoặc Staff tập trung vào import, xem, sửa template.
- Teacher tập trung vào `GET /api/lesson-plans/classes/{classId}/syllabus`.
- Luồng teacher đúng là:
  - mở syllabus của class,
  - tạo lesson plan nếu session chưa có,
  - mở chi tiết lesson plan,
  - cập nhật lesson plan thực tế.
- Frontend phải xử lý đầy đủ `400/401/403/404/409` và parse `syllabusContent` như JSON có cấu trúc.
