# Ghi Chú Cập Nhật Backend - Homework, Registration, Class

Ngày cập nhật: `2026-04-06`

Tài liệu này tổng hợp các thay đổi backend đã được chốt gần đây ở các module `Homework`, `Registrations`, và `Classes`.
Tài liệu này chỉ là note bổ sung, không thay thế các file tài liệu nghiệp vụ chính đang có trong folder `docs`.

---

## 1. Homework

### 1.1. `HomeworkStreak` đã đồng nhất giữa homework thường và quiz

Hiện tại mission type `HomeworkStreak` được cộng progress trong 2 luồng:

- `POST /api/students/homework/submit`
- `POST /api/students/homework/multiple-choice/submit`

Rule hiện tại:

- Chỉ tính khi học sinh nộp bài đúng hạn.
- Homework thường nộp đúng hạn sẽ tăng progress mission `HomeworkStreak`.
- Quiz / multiple-choice nộp đúng hạn cũng tăng progress mission `HomeworkStreak`.
- Quiz chỉ tính progress ở lần nộp đúng hạn đầu tiên, không farm progress bằng resubmit.

### 1.2. `RewardStars` của quiz không còn bị cộng lặp khi resubmit

Trước đây, quiz có thể bị cộng `RewardStars` lặp lại nếu `allowResubmit = true`.

Hiện tại:

- Quiz chỉ được cộng `RewardStars` ở lần nộp đúng hạn đầu tiên.
- Nếu học sinh nộp lại sau đó, hệ thống vẫn chấm lại theo luồng quiz, nhưng không cộng thêm sao thưởng.

### 1.3. `missionId` đã bị ẩn khỏi public API của homework

Hiện tại `missionId` không còn được expose trên bề mặt API homework:

- Không còn trong request tạo homework.
- Không còn trong các response homework.
- Không còn route public để link homework với mission.

Lý do:

- `HomeworkStreak` đang được tính theo hành vi nộp bài đúng hạn, không cần homework phải gắn mission cụ thể.
- Nếu sau này cần mở lại use case link homework với mission, domain/entity vẫn còn dữ liệu để mở lại logic.

Lưu ý:

- Field liên quan đến mission vẫn được giữ ở tầng domain/nội bộ để tránh mất hướng mở rộng về sau.
- Hiện tại từ góc nhìn API public, homework được xem như độc lập với mission.

### 1.4. Cách test nhanh mission progress cho homework

Flow test nhanh:

1. Tạo mission `HomeworkStreak` đang active cho đúng class hoặc đúng student.
2. Tạo homework thường với `submissionType = Text` hoặc `File`.
3. Student submit qua `POST /api/students/homework/submit` trước `dueAt`.
4. Kiểm tra mission progress của student đã tăng.

Gợi ý:

- Dùng `Text` để test nhanh nhất.
- Không nên dùng quiz nếu muốn test luồng submit homework thường.
- Nếu test quiz, dùng `POST /api/students/homework/multiple-choice/submit`.

---

## 2. Registrations

### 2.1. `ExpiryDate` tạm thời không tham gia business logic

`ExpiryDate` hiện vẫn được giữ trong entity `Registration` để tránh phải thay đổi schema/migration ngay lúc này.

Trạng thái hiện tại của field này:

- Vẫn tồn tại ở entity.
- Tạm thời không được dùng để block nghiệp vụ.
- Tạm thời không dùng để auto đổi status registration.
- Tạm thời không được xem là source-of-truth cho "hạn sử dụng gói học".

Kết luận:

- `ExpiryDate` đang ở trạng thái "để sẵn", chưa bật logic thực tế.
- Khi nào team chốt nghiệp vụ rõ ràng cho "hạn sử dụng gói học", có thể mở lại và bổ sung logic sau.

### 2.2. API upgrade registration đã đổi sang update trên cùng registration

Trước đây, luồng upgrade tuition plan tạo registration mới và complete registration cũ.

Hiện tại, `POST /api/registrations/{id}/upgrade` đã đổi sang hướng update trên cùng registration hiện có:

- Không tạo registration mới.
- Không complete registration cũ chỉ để gia hạn thêm số buổi.
- Cập nhật `TuitionPlanId` sang gói mới.
- Cộng thêm số buổi vào `RemainingSessions`.
- Tính lại `TotalSessions`.
- Giữ nguyên `UsedSessions`.
- Đánh dấu `OperationType = Upgrade`.

Ý nghĩa nghiệp vụ:

- Phù hợp hơn với trường hợp "gia hạn thêm số buổi" cho cùng một hành trình học.
- Tránh bị tách registration thành nhiều bản ghi mới trong khi học sinh vẫn đang học tiếp cùng luồng.

Lưu ý về response:

- Để tránh gãy frontend, response upgrade vẫn giữ `OriginalRegistrationId` và `NewRegistrationId`.
- Hiện tại cả hai field này sẽ cùng trỏ đến registration hiện tại.

---

## 3. Classes

### 3.1. Đã vá bug class bị kẹt ở status `Full`

Trước đây class có thể bị set sang `Full` khi đầy chỗ, nhưng khi học sinh bị cancel, transfer ra ngoài, hoặc drop enrollment thì class không tự mở lại status.

Hiện tại đã thêm logic đồng bộ lại status sức chứa của class:

- Nếu số enrollment `Active` >= `Capacity` thì class là `Full`.
- Nếu class đang `Full` mà số enrollment `Active` giảm xuống < `Capacity` thì class tự `unfull`.
- Khi `unfull`:
  - nếu lớp đã đến ngày bắt đầu thì về `Active`
  - nếu lớp chưa bắt đầu thì về `Recruiting`

### 3.2. Capacity hiện chỉ đếm enrollment `Active`

Để tránh đếm sai sĩ số, các luồng liên quan đến sức chứa class hiện chỉ tính theo enrollment đang `Active`.

Điều này được áp dụng cho các luồng:

- Assign class
- Transfer class
- Cancel registration
- Drop enrollment
- Reactivate enrollment
- Suggest classes

Tác động:

- Class không bị xem là đầy nếu chỉ còn enrollment đã nghỉ / đã drop / không còn active.
- Gợi ý lớp và kiểm tra capacity sát hơn với nghiệp vụ thực tế.

### 3.3. `GET /api/classes` đã có filter theo `schedulePattern`

API danh sách class hiện tại đã có thêm query param:

- `schedulePattern`

Rule hiện tại:

- Filter theo kiểu partial match trên `Class.SchedulePattern`.

Ví dụ:

```http
GET /api/classes?schedulePattern=BYDAY=MO
GET /api/classes?schedulePattern=FREQ=WEEKLY
```

Use case:

- Lọc nhanh các lớp học theo RRULE / lịch học đã lưu.
- Hỗ trợ vận hành lọc lớp học theo thứ học, tần suất học, hoặc một phần pattern cụ thể.

---

## 4. Tóm tắt thay đổi chính

- `HomeworkStreak` đã đồng nhất cho cả homework thường và quiz.
- Quiz không còn cộng lặp `RewardStars` khi resubmit.
- `missionId` đã được ẩn khỏi public API của homework.
- `ExpiryDate` được giữ lại trong entity, nhưng chưa bật business logic.
- Upgrade registration đã đổi sang update trên cùng registration.
- Class đã có logic tự `unfull` khi sĩ số active giảm.
- `GET /api/classes` đã có filter `schedulePattern`.

---

## 5. Ghi chú cho team

- Nếu sau này cần mở lại logic mission gắn trực tiếp vào homework, có thể mở lại public API từng bước mà không cần đổi hướng `HomeworkStreak`.
- Nếu sau này cần dùng `ExpiryDate` thật sự, nên chốt nghiệp vụ rõ trước khi bật logic để tránh dữ liệu bị hiểu sai.
- Response của API upgrade registration hiện vẫn để theo kiểu tương thích ngược với frontend cũ.

---

## 6. Frontend đã align gì theo note này

- Teacher homework form không còn gửi `missionId` trong payload public.
- Flow public `link homework -> mission` đã được gỡ khỏi frontend workspace.
- Registration UI đã đổi wording từ "gia hạn" sang "cập nhật gói học trên cùng đăng ký".
- Registration detail chỉ coi `ExpiryDate` là field nội bộ tham khảo, không xem như nguồn nghiệp vụ chính.
- Admin class list đã hỗ trợ truyền `schedulePattern` khi gọi `GET /api/classes`.
