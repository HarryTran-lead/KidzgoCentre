# Homework AI + Homework Current FE Audit

Ngày cập nhật: 2026-04-02

Màn hình/khối đã đối chiếu trong repo `KidzgoCentre`:
- `Student Homework` trên portal student
- `Teacher Homework` trên portal teacher
- `Question Bank` trên portal admin
- các route proxy trong `app/api/*`
- các service/type homework trong `lib/api/*` và `types/*`

## 1. Mục đích file này

File này không cố thay thế hoàn toàn tài liệu BE/spec AI.

Mục tiêu là:
- chốt những gì **frontend repo hiện tại đang expose thật**
- chỉ ra những phần **doc AI của BE chưa có route/UI tương ứng trong FE**
- bổ sung các điểm homework hiện có trong FE nhưng tài liệu cũ chưa nhắc hoặc đã lỗi thời

## 2. Nguồn kiểm tra trực tiếp trong FE repo

Các file chính đã đối chiếu:
- `app/[locale]/portal/student/homework/[id]/page.tsx`
- `app/[locale]/portal/teacher/assignments/page.tsx`
- `app/[locale]/portal/teacher/assignments/[id]/page.tsx`
- `app/[locale]/portal/teacher/assignments/[id]/submissions/[homeworkStudentId]/page.tsx`
- `app/[locale]/portal/admin/question-bank/page.tsx`
- `app/[locale]/portal/parent/homework/page.tsx`
- `app/api/students/homework/*`
- `app/api/homework/*`
- `app/api/question-bank/*`
- `lib/api/studentService.ts`
- `lib/api/homeworkService.ts`
- `types/student/homework.ts`
- `types/teacher/homework.ts`

Lưu ý:
- repo hiện tại là FE repo
- không có source `Kidzgo.API`, `Kidzgo.Application`, `Kidzgo.Domain`
- vì vậy các nội dung BE-only trong doc gốc cần được hiểu là **spec/hướng nghiệp vụ**, chưa phải phần đã verify từ repo này

## 3. Kết luận nhanh

### 3.1. Homework core flow hiện có trong FE

FE hiện đã có đầy đủ các nhóm chính:
- teacher tạo homework thường
- teacher tạo homework multiple choice
- teacher import homework multiple choice từ question bank
- teacher xem danh sách homework và submission
- teacher chấm bài thủ công
- teacher đánh dấu `Late/Missing`
- student xem danh sách homework
- student xem detail homework
- student nộp bài thường
- student làm và nộp multiple choice
- student xem feedback và review

### 3.2. AI flow hiện có thật trong FE

FE hiện **mới thấy rõ một nhánh AI đang nối UI/proxy**:
- `Teacher AI feedback` trên màn chi tiết submission:
  - route FE: `POST /api/homework/submissions/{homeworkStudentId}/ai-feedback`
  - UI button: `Tạo phản hồi bằng AI`
  - mục tiêu hiện tại: sinh thêm đoạn feedback AI để chèn vào phần nhận xét/chấm bài

### 3.3. AI flow trong doc BE nhưng chưa thấy FE expose đầy đủ

Chưa thấy route/UI FE cho các API sau:
- `POST /api/students/homework/{homeworkStudentId}/hint`
- `POST /api/students/homework/{homeworkStudentId}/recommendations`
- `POST /api/students/homework/{homeworkStudentId}/speaking-analysis`
- `POST /api/students/ai-speaking/analyze`
- `POST /api/homework/submissions/{homeworkStudentId}/quick-grade`
- `POST /api/question-bank/ai-generate`

Nghĩa là:
- doc AI role gốc có thể đúng ở BE/spec
- nhưng trong FE repo hiện tại, các flow AI đó **chưa thấy được expose trọn vẹn**

## 4. Inventory route FE hiện có

### 4.1. Student homework routes đang có

Các proxy FE hiện có:
- `GET /api/students/homework/my`
- `GET /api/students/homework/submitted`
- `GET /api/students/homework/feedback/my`
- `GET /api/students/homework/{homeworkStudentId}`
- `POST /api/students/homework/submit`
- `POST /api/students/homework/multiple-choice/submit`

Nhận xét:
- đây là nhóm route homework student chuẩn
- chưa thấy route AI student-side trong `app/api/students/homework`

### 4.2. Teacher homework routes đang có

Các proxy FE hiện có:
- `GET /api/homework`
- `POST /api/homework`
- `GET /api/homework/{id}`
- `PUT /api/homework/{id}`
- `DELETE /api/homework/{id}`
- `POST /api/homework/multiple-choice`
- `POST /api/homework/multiple-choice/from-bank`
- `POST /api/homework/{id}/link-mission`
- `PUT /api/homework/{id}/reward-stars`
- `GET /api/homework/submissions`
- `GET /api/homework/submissions/{homeworkStudentId}`
- `POST /api/homework/submissions/{homeworkStudentId}/grade`
- `PUT /api/homework/submissions/{homeworkStudentId}/mark-status`
- `POST /api/homework/submissions/{homeworkStudentId}/ai-feedback`
- `GET /api/homework/students/{studentProfileId}/history`

Nhận xét:
- FE hiện có `ai-feedback`
- FE chưa thấy `quick-grade`

### 4.3. Question bank routes đang có

Các proxy FE hiện có:
- `GET /api/question-bank`
- `POST /api/question-bank`
- `GET /api/question-bank/{id}`
- `PUT /api/question-bank/{id}`
- `DELETE /api/question-bank/{id}`
- `PATCH /api/question-bank/{id}/toggle-status`
- `POST /api/question-bank/import`

Nhận xét:
- FE hiện có CRUD/import/toggle status
- chưa thấy route `POST /api/question-bank/ai-generate`

## 5. Luồng student homework hiện tại cần bổ sung vào doc

### 5.1. Student detail hiện có nhiều logic hơn doc cũ

Màn `app/[locale]/portal/student/homework/[id]/page.tsx` hiện đã support:
- render detail homework thường và multiple choice
- hiển thị `timeLimitMinutes`
- hiển thị `allowResubmit`
- hiển thị review multiple choice
- hiển thị `teacherFeedback`
- hiển thị `aiFeedback` nếu backend đã trả về sẵn trong detail/grading

### 5.2. Quiz timer + guard đã có ở FE

Đây là điểm cần bổ sung vì doc cũ đang ghi chưa support hoặc ghi chưa rõ:
- FE có logic lưu state quiz trong `localStorage`
- có key kiểu `quiz_${homeworkId}_remaining`, `quiz_${homeworkId}_answers`, `quiz_${homeworkId}_submitted`
- có warning modal khi học sinh rời trang lúc đang làm quiz
- có action `Rời khỏi & Nộp bài`

Điều này có nghĩa:
- flow multiple choice ở FE hiện không còn là “chỉ nộp đáp án đơn giản”
- đã có state client-side cho timer + unsaved work

### 5.3. Student AI hiện tại mới ở mức hiển thị, chưa có action call riêng

FE student hiện:
- có field `aiFeedback` trong detail/grading
- có thể hiển thị feedback AI nếu backend đã chấm và trả dữ liệu

Nhưng FE student hiện chưa thấy:
- nút gọi `AI Hint`
- nút gọi `AI Recommend`
- nút gọi `AI Speaking Analysis`
- nút `AI Speaking Practice` upload audio/video độc lập

## 6. Luồng teacher homework hiện tại cần bổ sung vào doc

### 6.1. Teacher submission detail hiện là manual grading + AI feedback generation

Màn `app/[locale]/portal/teacher/assignments/[id]/submissions/[homeworkStudentId]/page.tsx` hiện hỗ trợ:
- tải detail submission
- grade thủ công qua `POST /api/homework/submissions/{homeworkStudentId}/grade`
- mark `Late/Missing`
- gọi `POST /api/homework/submissions/{homeworkStudentId}/ai-feedback`

Vì vậy nếu viết doc theo FE hiện tại thì nên mô tả:
- AI ở teacher-side hiện là `Tạo phản hồi bằng AI`
- chưa nên mô tả FE như đã có `quick-grade` speaking/text đầy đủ

### 6.2. Teacher UI hiện có warning về dữ liệu quiz teacher-side chưa đủ sạch

Trên màn teacher submission detail hiện có note fallback:
- khi backend chưa trả đủ text câu hỏi/đáp án
- FE đang ẩn UUID fallback để tránh hiển thị sai dữ liệu

Điểm này nên được bổ sung vào doc QA/test vì:
- một số case review multiple choice teacher-side còn phụ thuộc chất lượng payload từ backend

## 7. Question bank + homework integration cần bổ sung

### 7.1. FE hiện có flow import multiple choice từ question bank

Đây là điểm nên bổ sung vào doc hiện tại:
- teacher assignments page có `ImportFromBankModal`
- `homeworkService.ts` có gọi `POST /api/homework/multiple-choice/from-bank`

Flow này không phải AI Creator, nhưng là một nhánh quan trọng kết nối:
- `Question Bank`
- `Teacher Homework`

### 7.2. AI Creator hiện chưa thấy trong FE

Nếu dùng doc AI role cho FE hiện tại, cần ghi rõ:
- chưa thấy route FE `POST /api/question-bank/ai-generate`
- chưa thấy UI draft AI question creator
- question bank hiện tại vẫn là CRUD/import thường

## 8. Các chỗ doc gốc nên sửa để hợp logic với FE hiện tại

### 8.1. Không nên ghi “đối chiếu trực tiếp từ code backend” nếu đang review trên repo FE này

Nên đổi thành:
- đối chiếu từ FE proxy/service/page hiện tại
- phần BE AI routes là spec hoặc contract kỳ vọng

### 8.2. Phần “Teacher / TA / Staff role” nên tách 2 lớp

Lớp 1: BE/spec kỳ vọng
- `quick-grade`
- speaking/text AI grading
- persist score khi `aiUsed=true`

Lớp 2: FE current
- manual grade
- `ai-feedback`
- mark late/missing

### 8.3. Phần “Student role” nên bổ sung current FE note

Nên ghi thêm:
- FE đã có multiple choice timer/leave warning/local persistence
- FE hiện chưa có UI gọi trực tiếp AI Hint/Recommend/Speaking
- FE chỉ hiển thị `aiFeedback` nếu backend đã trả trong detail/grading

### 8.4. Phần “Question Bank” nên bổ sung current FE note

Nên ghi thêm:
- FE hiện có CRUD/import/toggle status
- FE hiện có flow tạo homework multiple choice từ bank
- FE hiện chưa có AI Creator

## 9. Permission / scope note cần bổ sung

Nếu tài liệu dùng cho FE current:
- Student: rõ ràng là `own`
- Teacher: UI hiện là teacher portal, nhưng repo FE không thể tự chứng minh backend đã enforce `own classes` ở mọi AI/action
- Parent: có màn homework riêng ở parent portal, nhưng không thấy AI homework action trong flow này

## 10. Phiên bản mô tả ngắn gọn hợp lý hơn cho homework AI hiện tại

Có thể dùng đoạn này thay cho phần summary cũ:

1. Teacher tạo homework thường hoặc homework multiple choice, có thể liên kết mission và import câu hỏi từ question bank.
2. Student xem bài tập được giao, nộp bài thường hoặc làm multiple choice trực tiếp trên portal.
3. Với multiple choice, FE hiện đã có timer/local state/cảnh báo rời trang và flow review sau khi nộp.
4. Teacher xem submission detail, chấm bài thủ công, đánh dấu `Late/Missing`, và có thể dùng AI để sinh thêm phản hồi (`ai-feedback`).
5. Nếu backend trả `aiFeedback` trong detail/grading, student có thể xem phần phản hồi AI ở màn homework detail.
6. Các route AI như `hint`, `recommendations`, `speaking-analysis`, `instant speaking practice`, `quick-grade`, `question-bank/ai-generate` hiện chưa thấy được expose đầy đủ trong FE repo này.

## 11. Kết luận

Nếu mục tiêu là viết tài liệu cho **current FE repo**, thì nên chốt như sau:
- Homework flow core: đã có và khá đầy đủ
- AI hiện có thật trong FE: chủ yếu là `teacher ai-feedback`
- Student AI actions và AI Creator: chưa thấy route/UI FE tương ứng
- Multiple choice flow trong FE thực tế đã mạnh hơn doc cũ nhờ có timer, warning, local persistence và review

Nếu mục tiêu là viết tài liệu cho **BE intended flow**, thì giữ spec AI gốc nhưng phải thêm note:
- “Current FE chưa expose đầy đủ toàn bộ AI endpoints ở thời điểm audit này”
