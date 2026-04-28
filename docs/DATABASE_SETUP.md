# Database Setup Guide

## Tổng quan
Hệ thống Kidz Go Centre sử dụng cơ sở dữ liệu SQL Server để lưu trữ dữ liệu toàn hệ thống.

## Database Configuration

### Connection String
```
Server={SERVER_ADDRESS};Database=KidzgoCentre;User Id={USERNAME};Password={PASSWORD};
```

**Ví dụ:**
```
Server=103.146.22.206;Database=KidzgoCentre;User Id=sa;Password=YourSecurePassword;
```

### Database Name
- **Production:** `KidzgoCentre`
- **Development:** `KidzgoCentre_Dev`

## Các Bảng Chính

### 1. Users (Tài khoản người dùng)
```sql
CREATE TABLE [dbo].[Users] (
    [UserId] INT PRIMARY KEY IDENTITY(1,1),
    [Username] NVARCHAR(100) NOT NULL UNIQUE,
    [Email] NVARCHAR(255) NOT NULL UNIQUE,
    [PasswordHash] NVARCHAR(MAX) NOT NULL,
    [Role] NVARCHAR(50) NOT NULL,
    [Status] NVARCHAR(20) DEFAULT 'Active',
    [CreatedDate] DATETIME DEFAULT GETDATE(),
    [UpdatedDate] DATETIME DEFAULT GETDATE()
);
```

### 2. Roles (Vai trò hệ thống)
```sql
CREATE TABLE [dbo].[Roles] (
    [RoleId] INT PRIMARY KEY IDENTITY(1,1),
    [RoleName] NVARCHAR(100) NOT NULL UNIQUE,
    [DisplayName] NVARCHAR(255),
    [Description] NVARCHAR(MAX),
    [CreatedDate] DATETIME DEFAULT GETDATE()
);
```

### 3. Students (Học viên)
```sql
CREATE TABLE [dbo].[Students] (
    [StudentId] INT PRIMARY KEY IDENTITY(1,1),
    [UserId] INT NOT NULL,
    [FullName] NVARCHAR(255) NOT NULL,
    [DateOfBirth] DATE,
    [Gender] NVARCHAR(10),
    [Phone] NVARCHAR(20),
    [Address] NVARCHAR(MAX),
    [Level] NVARCHAR(50),
    [Status] NVARCHAR(20) DEFAULT 'Active',
    [CreatedDate] DATETIME DEFAULT GETDATE(),
    FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users]([UserId])
);
```

### 4. Teachers (Giáo viên)
```sql
CREATE TABLE [dbo].[Teachers] (
    [TeacherId] INT PRIMARY KEY IDENTITY(1,1),
    [UserId] INT NOT NULL,
    [FullName] NVARCHAR(255) NOT NULL,
    [Specialization] NVARCHAR(255),
    [Qualifications] NVARCHAR(MAX),
    [Phone] NVARCHAR(20),
    [Email] NVARCHAR(255),
    [Status] NVARCHAR(20) DEFAULT 'Active',
    [CreatedDate] DATETIME DEFAULT GETDATE(),
    FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users]([UserId])
);
```

### 5. Classes (Lớp học)
```sql
CREATE TABLE [dbo].[Classes] (
    [ClassId] INT PRIMARY KEY IDENTITY(1,1),
    [ClassName] NVARCHAR(100) NOT NULL,
    [TeacherId] INT NOT NULL,
    [Schedule] NVARCHAR(255),
    [MaxStudents] INT DEFAULT 30,
    [CurrentStudents] INT DEFAULT 0,
    [Level] NVARCHAR(50),
    [Status] NVARCHAR(20) DEFAULT 'Active',
    [CreatedDate] DATETIME DEFAULT GETDATE(),
    FOREIGN KEY ([TeacherId]) REFERENCES [dbo].[Teachers]([TeacherId])
);
```

### 6. Enrollments (Ghi danh học viên)
```sql
CREATE TABLE [dbo].[Enrollments] (
    [EnrollmentId] INT PRIMARY KEY IDENTITY(1,1),
    [StudentId] INT NOT NULL,
    [ClassId] INT NOT NULL,
    [EnrollmentDate] DATE NOT NULL,
    [Status] NVARCHAR(20) DEFAULT 'Active',
    [CreatedDate] DATETIME DEFAULT GETDATE(),
    FOREIGN KEY ([StudentId]) REFERENCES [dbo].[Students]([StudentId]),
    FOREIGN KEY ([ClassId]) REFERENCES [dbo].[Classes]([ClassId])
);
```

### 7. Homework (Bài tập về nhà)
```sql
CREATE TABLE [dbo].[Homework] (
    [HomeworkId] INT PRIMARY KEY IDENTITY(1,1),
    [ClassId] INT NOT NULL,
    [TeacherId] INT NOT NULL,
    [Title] NVARCHAR(255) NOT NULL,
    [Description] NVARCHAR(MAX),
    [DueDate] DATETIME NOT NULL,
    [Content] NVARCHAR(MAX),
    [Status] NVARCHAR(20) DEFAULT 'Published',
    [CreatedDate] DATETIME DEFAULT GETDATE(),
    FOREIGN KEY ([ClassId]) REFERENCES [dbo].[Classes]([ClassId]),
    FOREIGN KEY ([TeacherId]) REFERENCES [dbo].[Teachers]([TeacherId])
);
```

### 8. HomeworkSubmissions (Nộp bài tập)
```sql
CREATE TABLE [dbo].[HomeworkSubmissions] (
    [SubmissionId] INT PRIMARY KEY IDENTITY(1,1),
    [HomeworkId] INT NOT NULL,
    [StudentId] INT NOT NULL,
    [SubmissionDate] DATETIME DEFAULT GETDATE(),
    [Content] NVARCHAR(MAX),
    [Score] DECIMAL(5,2),
    [Feedback] NVARCHAR(MAX),
    [Status] NVARCHAR(20) DEFAULT 'Submitted',
    FOREIGN KEY ([HomeworkId]) REFERENCES [dbo].[Homework]([HomeworkId]),
    FOREIGN KEY ([StudentId]) REFERENCES [dbo].[Students]([StudentId])
);
```

### 9. Sessions (Phiên học)
```sql
CREATE TABLE [dbo].[Sessions] (
    [SessionId] INT PRIMARY KEY IDENTITY(1,1),
    [ClassId] INT NOT NULL,
    [SessionDate] DATETIME NOT NULL,
    [Topic] NVARCHAR(255),
    [Status] NVARCHAR(20) DEFAULT 'Scheduled',
    [CreatedDate] DATETIME DEFAULT GETDATE(),
    FOREIGN KEY ([ClassId]) REFERENCES [dbo].[Classes]([ClassId])
);
```

### 10. Attendance (Điểm danh)
```sql
CREATE TABLE [dbo].[Attendance] (
    [AttendanceId] INT PRIMARY KEY IDENTITY(1,1),
    [SessionId] INT NOT NULL,
    [StudentId] INT NOT NULL,
    [Status] NVARCHAR(20) NOT NULL,
    [Note] NVARCHAR(MAX),
    [RecordedDate] DATETIME DEFAULT GETDATE(),
    FOREIGN KEY ([SessionId]) REFERENCES [dbo].[Sessions]([SessionId]),
    FOREIGN KEY ([StudentId]) REFERENCES [dbo].[Students]([StudentId])
);
```

## Initial Data Setup

### Thêm Roles
```sql
INSERT INTO [dbo].[Roles] ([RoleName], [DisplayName], [Description]) VALUES
('Admin', 'Quản trị viên', 'Quản lý toàn bộ hệ thống'),
('Staff_Accountant', 'Kế toán', 'Quản lý tài chính'),
('Staff_Manager', 'Quản lý', 'Quản lý hoạt động trung tâm'),
('Teacher', 'Giáo viên', 'Giáo viên dạy lớp'),
('Student', 'Học viên', 'Học viên của trung tâm'),
('Parent', 'Phụ huynh', 'Phụ huynh học viên');
```

### Demo Users (Xem phần DEMO_ACCOUNTS.md)

## Backup và Restore

### Backup Database
```bash
# Using SQL Server Management Studio
sqlcmd -S SERVER_ADDRESS -U USERNAME -P PASSWORD -Q "BACKUP DATABASE [KidzgoCentre] TO DISK=N'C:\Backups\KidzgoCentre_backup.bak' WITH NOFORMAT, NOINIT, NAME=N'KidzgoCentre_backup', SKIP, NOREWIND, NOUNLOAD, STATS = 10"
```

### Restore Database
```bash
sqlcmd -S SERVER_ADDRESS -U USERNAME -P PASSWORD -Q "RESTORE DATABASE [KidzgoCentre] FROM DISK=N'C:\Backups\KidzgoCentre_backup.bak' WITH FILE = 1, NOUNLOAD, STATS = 10"
```

## Migrations (Nếu sử dụng Entity Framework)

```bash
dotnet ef migrations add InitialCreate
dotnet ef database update
```

## Indexing (Tối ưu hóa)

```sql
-- Index cho Users
CREATE INDEX IX_Users_Username ON [dbo].[Users]([Username]);
CREATE INDEX IX_Users_Email ON [dbo].[Users]([Email]);

-- Index cho Students
CREATE INDEX IX_Students_UserId ON [dbo].[Students]([UserId]);

-- Index cho Enrollments
CREATE INDEX IX_Enrollments_StudentId ON [dbo].[Enrollments]([StudentId]);
CREATE INDEX IX_Enrollments_ClassId ON [dbo].[Enrollments]([ClassId]);

-- Index cho Homework
CREATE INDEX IX_Homework_ClassId ON [dbo].[Homework]([ClassId]);
CREATE INDEX IX_Homework_TeacherId ON [dbo].[Homework]([TeacherId]);

-- Index cho Attendance
CREATE INDEX IX_Attendance_SessionId ON [dbo].[Attendance]([SessionId]);
CREATE INDEX IX_Attendance_StudentId ON [dbo].[Attendance]([StudentId]);
```

## Kiểm tra Status

```sql
-- Kiểm tra số lượng bản ghi
SELECT 'Users' as TableName, COUNT(*) as RecordCount FROM [dbo].[Users]
UNION ALL
SELECT 'Students', COUNT(*) FROM [dbo].[Students]
UNION ALL
SELECT 'Teachers', COUNT(*) FROM [dbo].[Teachers]
UNION ALL
SELECT 'Classes', COUNT(*) FROM [dbo].[Classes];
```

## Lưu ý Quan Trọng

1. **Backup thường xuyên** trước khi update hệ thống
2. **Kiểm tra Foreign Keys** trước khi xóa dữ liệu
3. **Sử dụng transaction** cho các thao tác quan trọng
4. **Giữ mật khẩu database** an toàn
5. **Cấp quyền tối thiểu** cho các tài khoản user

## Liên hệ Hỗ trợ

Nếu có vấn đề với database, vui lòng liên hệ đội IT:
- Email: it@kidzgocentre.com
- Phone: +84-XXX-XXX-XXXX
