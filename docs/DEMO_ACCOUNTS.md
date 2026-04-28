# Demo Accounts & Roles Documentation

## Tổng quan Hệ thống Roles

Hệ thống Kidz Go Centre có 6 vai trò chính với các quyền khác nhau:

| Role ID | Role Name | Display Name | Mô tả |
|---------|-----------|--------------|-------|
| 1 | Admin | Quản trị viên | Quản lý toàn bộ hệ thống |
| 2 | Staff_Accountant | Kế toán | Quản lý tài chính, hóa đơn |
| 3 | Staff_Manager | Quản lý | Quản lý hoạt động trung tâm |
| 4 | Teacher | Giáo viên | Quản lý lớp, bài tập, điểm danh |
| 5 | Student | Học viên | Xem lớp, bài tập, kết quả |
| 6 | Parent | Phụ huynh | Theo dõi con em |

## Demo Accounts

### 1. Admin Account
```
Username: admin
Email: admin@kidzgocentre.com
Password: Admin@123456
Role: Admin
Access: Toàn bộ hệ thống
```

**Quyền hạn Admin:**
- Quản lý người dùng (tạo, sửa, xóa)
- Cấu hình hệ thống
- Quản lý roles và permissions
- Xem báo cáo toàn hệ thống
- Quản lý các lớp học
- Quản lý giáo viên, học viên

### 2. Staff Accountant Account
```
Username: accountant
Email: accountant@kidzgocentre.com
Password: Accountant@123456
Role: Staff_Accountant
Access: Tài chính, Hóa đơn, Thu chi
```

**Quyền hạn Staff Accountant:**
- Quản lý hóa đơn
- Theo dõi thanh toán
- Báo cáo tài chính
- Quản lý học phí

### 3. Staff Manager Account
```
Username: manager
Email: manager@kidzgocentre.com
Password: Manager@123456
Role: Staff_Manager
Access: Quản lý Trung tâm
```

**Quyền hạn Staff Manager:**
- Quản lý lịch khóa học
- Quản lý lớp học
- Quản lý giáo viên
- Quản lý ghi danh
- Báo cáo hoạt động

### 4. Teacher Accounts

#### Teacher 1 - Tiếng Anh Cơ Bản
```
Username: teacher_eng_basic
Email: teacher1@kidzgocentre.com
Password: Teacher@123456
Role: Teacher
Specialization: Tiếng Anh Cơ Bản
Classes: Basic English A1, Basic English A2
```

#### Teacher 2 - Tiếng Anh Nâng Cao
```
Username: teacher_eng_advanced
Email: teacher2@kidzgocentre.com
Password: Teacher@234567
Role: Teacher
Specialization: Tiếng Anh Nâng Cao
Classes: Advanced English B1, Advanced English B2
```

#### Teacher 3 - Speaking
```
Username: teacher_speaking
Email: teacher3@kidzgocentre.com
Password: Teacher@345678
Role: Teacher
Specialization: Speaking
Classes: Conversation Class A, Conversation Class B
```

**Quyền hạn Teacher:**
- Quản lý lớp học của mình
- Tạo và chấm bài tập
- Điểm danh
- Xem kết quả học viên
- Gửi thông báo cho học viên
- Lập báo cáo tiến độ

### 5. Student Accounts

#### Student 1
```
Username: student_001
Email: student1@kidzgocentre.com
Password: Student@123456
Role: Student
Full Name: Nguyễn Văn An
Level: A1
Classes: Basic English A1, Conversation Class A
```

#### Student 2
```
Username: student_002
Email: student2@kidzgocentre.com
Password: Student@234567
Role: Student
Full Name: Trần Thị Bình
Level: A2
Classes: Basic English A2, Conversation Class B
```

#### Student 3
```
Username: student_003
Email: student3@kidzgocentre.com
Password: Student@345678
Role: Student
Full Name: Phạm Minh Cường
Level: B1
Classes: Advanced English B1
```

#### Student 4
```
Username: student_004
Email: student4@kidzgocentre.com
Password: Student@456789
Role: Student
Full Name: Võ Hương Dung
Level: B2
Classes: Advanced English B2, Conversation Class A
```

#### Student 5
```
Username: student_005
Email: student5@kidzgocentre.com
Password: Student@567890
Role: Student
Full Name: Đỗ Quang Khôi
Level: A1
Classes: Basic English A1
```

**Quyền hạn Student:**
- Xem thông tin cá nhân
- Xem các lớp học đang tham gia
- Xem bài tập được giao
- Nộp bài tập
- Xem điểm và nhận xét
- Xem lịch học
- Xem thông báo

### 6. Parent Accounts

#### Parent 1 (Phụ huynh của Student 1 & 2)
```
Username: parent_001
Email: parent1@kidzgocentre.com
Password: Parent@123456
Role: Parent
Full Name: Nguyễn Văn Huy
PIN: 123456
Children: 
  - Nguyễn Văn An (student_001)
  - Trần Thị Bình (student_002)
```

#### Parent 2 (Phụ huynh của Student 3)
```
Username: parent_002
Email: parent2@kidzgocentre.com
Password: Parent@234567
Role: Parent
Full Name: Phạm Thị Liễu
PIN: 234567
Children: 
  - Phạm Minh Cường (student_003)
```

#### Parent 3 (Phụ huynh của Student 4 & 5)
```
Username: parent_003
Email: parent3@kidzgocentre.com
Password: Parent@345678
Role: Parent
Full Name: Võ Anh Tuấn
PIN: 345678
Children:
  - Võ Hương Dung (student_004)
  - Đỗ Quang Khôi (student_005)
```

**Quyền hạn Parent:**
- Xem thông tin con em
- Xem tiến độ học tập
- Xem các lớp học con em tham gia
- Xem bài tập và kết quả
- Giao tiếp với giáo viên qua hệ thống
- Xem thông báo từ trung tâm

## Cấu trúc Demo Data

### Demo Classes
```
Class 1: Basic English A1
  - Teacher: teacher_eng_basic
  - Students: student_001, student_005
  - Schedule: Thứ 2, 4, 6 - 18:00-19:30
  - Max: 20 students

Class 2: Basic English A2
  - Teacher: teacher_eng_basic
  - Students: student_002
  - Schedule: Thứ 3, 5, 7 - 18:00-19:30
  - Max: 20 students

Class 3: Advanced English B1
  - Teacher: teacher_eng_advanced
  - Students: student_003
  - Schedule: Thứ 2, 4, 6 - 19:45-21:15
  - Max: 15 students

Class 4: Advanced English B2
  - Teacher: teacher_eng_advanced
  - Students: student_004
  - Schedule: Thứ 3, 5, 7 - 19:45-21:15
  - Max: 15 students

Class 5: Conversation A
  - Teacher: teacher_speaking
  - Students: student_001, student_004
  - Schedule: Thứ 7 - 14:00-15:30
  - Max: 10 students

Class 6: Conversation B
  - Teacher: teacher_speaking
  - Students: student_002
  - Schedule: Thứ 7 - 15:45-17:15
  - Max: 10 students
```

### Demo Homework
```
Homework 1: Present yourself
  - Class: Basic English A1
  - Due Date: 2026-05-10
  - Description: Prepare a 2-minute introduction about yourself
  
Homework 2: Reading comprehension
  - Class: Basic English A2
  - Due Date: 2026-05-12
  - Description: Read the article and answer 10 questions

Homework 3: Essay writing
  - Class: Advanced English B1
  - Due Date: 2026-05-15
  - Description: Write a 500-word essay about environmental protection
  
Homework 4: Listening practice
  - Class: Advanced English B2
  - Due Date: 2026-05-17
  - Description: Listen to the podcast and write a summary
```

## Quy trình Đăng nhập Thử nghiệm

### Cách 1: Sử dụng Demo Account
1. Truy cập: https://rexenglishcentresr.vercel.app
2. Chọn ngôn ngữ (VI/EN)
3. Nhập thông tin tài khoản từ danh sách trên
4. Nhấn "Đăng nhập"

### Cách 2: Bypass Đăng nhập (Dev Mode)
Nếu `NEXT_PUBLIC_DEV_AUTO_LOGIN=1`, bạn có thể:
```
https://rexenglishcentresr.vercel.app/auth/login?role=ADMIN&returnTo=/portal
```

Các role có thể dùng:
- `ADMIN`
- `STAFF_ACCOUNTANT`
- `STAFF_MANAGER`
- `TEACHER`
- `STUDENT`
- `PARENT`

## Parent PIN Management

Phụ huynh cần PIN để xác thực một số thao tác quan trọng.

### PIN Demo
```
Parent 1 - PIN: 123456
Parent 2 - PIN: 234567
Parent 3 - PIN: 345678
```

### Đặt lại PIN
1. Đăng nhập với tài khoản phụ huynh
2. Vào "Cài đặt" → "Bảo mật"
3. Chọn "Đặt lại PIN"
4. Xác nhận email
5. Tạo PIN mới

## Lưu ý Bảo mật

1. **Không sử dụng demo account trong Production**
2. **Thay đổi tất cả mật khẩu** trước khi đưa vào sử dụng thực tế
3. **Sử dụng mật khẩu mạnh** (tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, số, ký tự đặc biệt)
4. **Bảo vệ tài khoản Admin** - hạn chế quyền truy cập
5. **Thay đổi PIN định kỳ** cho phụ huynh
6. **Kiểm tra logs** thường xuyên để phát hiện hoạt động bất thường

## Kiểm tra Tài khoản

### SQL Query để kiểm tra
```sql
SELECT u.UserId, u.Username, u.Email, u.Role, u.Status, u.CreatedDate
FROM Users u
ORDER BY u.CreatedDate DESC;
```

### Test tất cả Roles
Hãy đảm bảo test các chức năng sau cho mỗi role:
- [ ] Đăng nhập thành công
- [ ] Xem dashboard
- [ ] Truy cập các tính năng được phép
- [ ] Bị chặn khỏi các tính năng không được phép
- [ ] Đăng xuất thành công

## Support

Nếu có vấn đề với demo accounts, liên hệ:
- Email: support@kidzgocentre.com
- Hotline: +84-XXX-XXX-XXXX
- Support Portal: https://support.kidzgocentre.com
