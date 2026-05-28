# BE Syllabus Parity Completion Checklist

Updated: 2026-05-24
Scope: admin full syllabus + syllabus từng buổi theo `classId` và `sessionId`

## 1. Mục tiêu

FE đã có 2 lớp hiển thị:

- Full syllabus: xem toàn bộ syllabus của lớp/chương trình
- Session syllabus: drill-down vào từng buổi học

Để hoàn thiện parity, BE cần bảo đảm mapping giữa syllabus tổng và session detail là ổn định, không phụ thuộc merge local ở FE.

## 2. BE cần bổ sung / xác nhận

### 2.1 Full syllabus payload

Endpoint full syllabus của lớp cần trả đủ:

- `classId`, `classCode`, `classTitle`
- `programId`, `programName`
- `syllabusMetadata`
- `sessions[]`

Mỗi session nên có tối thiểu:

- `sessionId`
- `sessionIndex`
- `moduleId`
- `sessionIndexInModule`
- `sessionDate`
- `lessonPlanId`
- `templateId`
- `templateTitle`
- `plannedContent`
- `actualContent`
- `actualHomework`
- `teacherNotes`
- `canEdit`

### 2.2 Canonical session document

Cần endpoint ổn định:

- `GET /api/sessions/{sessionId}/lesson-plan-document`

Response nên có:

- root linkage fields: `sessionId`, `classId`, `moduleId`, `lessonPlanTemplateId`, `plannedLessonPlanTemplateId`, `actualLessonPlanTemplateId`
- runtime fields: `plannedLessonTitle`, `actualLessonTitle`, `teachingLogStatus`, `teachingProgressStatus`
- `document` là object template đã resolve sẵn

### 2.3 Mapping full syllabus -> session

BE nên trả thêm một mapping chuẩn để FE highlight từ full syllabus sang session detail, ví dụ:

- `sessionId`
- `moduleId`
- `sessionIndexInModule`
- `templateId`
- `periodFrom` / `periodTo` hoặc `rowRef`
- `unitName`
- `lessonTitle`

Nếu chưa muốn thêm endpoint mới, mapping này phải xuất hiện nhất quán trong payload syllabus hiện có.

### 2.4 Không dùng 404 cho case dữ liệu thiếu

Nếu session tồn tại nhưng chưa resolve được document, BE nên trả business error thay vì 404 hạ tầng.

Khuyến nghị error code:

- `Session.LessonPlanTemplateMissing`
- `Session.LessonPlanTemplateInconsistent`
- `Session.CurriculumMappingMissing`
- `Session.LessonPlanDocumentNotFound`

## 3. Quy tắc dữ liệu

- `lessonPlanTemplateId` phải là canonical id cho cùng một `sessionId`
- `plannedLessonPlanTemplateId` chỉ là planned source
- `actualLessonPlanTemplateId` chỉ là runtime override khi có thay đổi thực tế
- Không dùng `Guid.Empty` làm linkage hợp lệ
- Full syllabus và session detail phải trỏ về cùng một template cho cùng `sessionId`

## 4. Acceptance criteria

1. Admin mở full syllabus thấy toàn bộ syllabus của lớp.
2. Click từng buổi từ syllabus tổng thì mở đúng session detail.
3. Teacher và Admin nhìn cùng document với cùng `sessionId`.
4. Endpoint dedicated trả 200 ổn định trên môi trường local/dev/staging.
5. Khi không resolve được mapping, BE trả error nghiệp vụ rõ ràng.

## 5. Ghi chú cho FE/BE phối hợp

FE hiện đã có fallback nhưng chỉ nên xem là phương án tạm. Mục tiêu cuối cùng vẫn là:

- Full syllabus dùng cho overview
- Session document dùng cho drill-down
- Canonical template linkage phải đồng bộ giữa list, detail và dedicated endpoint
