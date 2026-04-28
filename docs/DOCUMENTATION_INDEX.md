# 📚 Project Documentation Index

## Nhanh Chóng Tìm Kiếm

### 🚀 Bắt Đầu Nhanh
- [Project Submission Checklist](PROJECT_SUBMISSION_CHECKLIST.md) - **Tài liệu chính cho nộp bài**
- [Installation Guide](INSTALLATION_GUIDE.md) - Cài đặt toàn hệ thống
- [Quick Start (5 mins)](#quick-start)

### 🗄️ Database & Dữ liệu
- [Database Setup](DATABASE_SETUP.md) - Schema, scripts, migration
- [Demo Accounts](DEMO_ACCOUNTS.md) - Tài khoản demo, roles, quyền hạn

### 🔧 Configuration & Integration
- [API Configuration](API_CONFIGURATION.md) - Endpoints, auth, integration
- [Dependencies & Tools](DEPENDENCIES_AND_TOOLS.md) - Tất cả dependencies

### 📖 Tài liệu Người Dùng
- [User Manual - Vietnamese](USER_MANUAL_VI.md) *(In progress)*
- [User Manual - English](USER_MANUAL_EN.md) *(In progress)*
- [Admin Guide](ADMIN_GUIDE.md) *(In progress)*

---

## 📋 Tổng quan Các Tài liệu

### 1. DATABASE_SETUP.md
**Nội dung:**
- Cấu hình database connection string
- 10 bảng chính của hệ thống
- SQL scripts tạo table
- Demo data scripts
- Backup & restore procedures
- Indexing strategies

**Sử dụng khi:** Bạn cần cài đặt hoặc cấu hình database

**Link nhanh:** [DATABASE_SETUP.md](DATABASE_SETUP.md)

---

### 2. DEMO_ACCOUNTS.md
**Nội dung:**
- 6 vai trò (Roles) trong hệ thống
- 10+ tài khoản demo
- Mô tả quyền hạn từng role
- Demo classes, homework, students
- PIN management
- Login procedures

**Sử dụng khi:** Bạn cần đăng nhập để test hoặc demo

**Tài khoản phổ biến:**
```
Admin: admin / Admin@123456
Teacher: teacher_eng_basic / Teacher@123456
Student: student_001 / Student@123456
Parent: parent_001 / Parent@123456
```

**Link nhanh:** [DEMO_ACCOUNTS.md](DEMO_ACCOUNTS.md)

---

### 3. INSTALLATION_GUIDE.md
**Nội dung:**
- System requirements (hardware, OS, software)
- Step-by-step installation
- Backend setup (.NET, SQL Server)
- Frontend setup (Node.js, npm)
- Environment variables configuration
- Third-party services setup
- Health check procedures
- Troubleshooting common issues
- Docker deployment

**Sử dụng khi:** Bạn cần cài đặt toàn bộ hệ thống từ đầu

**Điều kiện tiên quyết:**
- Node.js 18+
- .NET SDK 8.0+
- SQL Server 2019+
- Git

**Link nhanh:** [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)

---

### 4. API_CONFIGURATION.md
**Nội dung:**
- Backend API URLs (dev, staging, production)
- Authentication & JWT configuration
- 20+ API endpoints (Login, Students, Teachers)
- CORS configuration
- Rate limiting
- Error handling
- Security headers
- API testing with cURL
- Health check endpoints

**Sử dụng khi:** Bạn cần tích hợp API hoặc call endpoints

**Base URLs:**
```
Dev:  http://localhost:5000/api
Prod: http://103.146.22.206:5000/api
```

**Link nhanh:** [API_CONFIGURATION.md](API_CONFIGURATION.md)

---

### 5. DEPENDENCIES_AND_TOOLS.md
**Nội dung:**
- 40+ Frontend dependencies
- Backend dependencies (.NET stack)
- System requirements
- Third-party services (Vercel Blob, Zalo OTP, Google Analytics)
- Package installation commands
- Version management strategy
- Security considerations
- Performance optimization
- Troubleshooting npm/dotnet issues

**Sử dụng khi:** Bạn cần biết dependencies hoặc update packages

**Package manager:**
```
Frontend: npm
Backend: dotnet
```

**Link nhanh:** [DEPENDENCIES_AND_TOOLS.md](DEPENDENCIES_AND_TOOLS.md)

---

### 6. PROJECT_SUBMISSION_CHECKLIST.md
**Nội dung:**
- Tổng quan dự án
- Module phần mềm
- Source code structure
- Demo data deliverables
- Installation checklist
- Functional testing checklist
- Deployment checklist
- Submission requirements
- Sign-off

**Sử dụng khi:** Bạn cần chuẩn bị nộp bài hoặc kiểm tra yêu cầu

**Checklist chính:**
- ✅ Database setup
- ✅ Demo accounts
- ✅ Configuration files
- ✅ Documentation
- ✅ Source code

**Link nhanh:** [PROJECT_SUBMISSION_CHECKLIST.md](PROJECT_SUBMISSION_CHECKLIST.md)

---

### 7. DOCUMENTATION_INDEX.md (File này)
**Nội dung:**
- Index tất cả tài liệu
- Mô tả từng file
- Quick links
- FAQ

---

## 🎯 Hướng dẫn Theo Tình huống

### Scenario 1: Tôi muốn test hệ thống ngay bây giờ
```
1. Đọc: INSTALLATION_GUIDE.md (Frontend Setup)
2. Chạy: npm install && npm run dev
3. Đăng nhập: DEMO_ACCOUNTS.md
4. Test: Có thể sử dụng admin / Admin@123456
```
⏱️ **Thời gian:** 10 phút

---

### Scenario 2: Tôi cần setup database mới
```
1. Đọc: DATABASE_SETUP.md
2. Chuẩn bị: SQL Server connection
3. Chạy: Scripts từ DATABASE_SETUP.md
4. Verify: Check demo data
```
⏱️ **Thời gian:** 30 phút

---

### Scenario 3: Tôi cần integrate API
```
1. Đọc: API_CONFIGURATION.md (Endpoints section)
2. Setup: Backend URL trong .env.local
3. Auth: Xem JWT token flow
4. Call: Sử dụng axios client
```
⏱️ **Thời gian:** 20 phút

---

### Scenario 4: Tôi cần install toàn bộ hệ thống
```
1. Đọc: INSTALLATION_GUIDE.md (full)
2. Setup: Backend, Database, Frontend
3. Configure: Environment variables
4. Verify: Health checks
5. Test: Functional testing
```
⏱️ **Thời gian:** 2 giờ

---

### Scenario 5: Tôi cần nộp bài dự án
```
1. Checklist: PROJECT_SUBMISSION_CHECKLIST.md
2. Documentation: Đảm bảo đầy đủ
3. Testing: Run tất cả tests
4. Packaging: Chuẩn bị deliverables
5. Submit: Gửi cùng tất cả files
```
⏱️ **Thời gian:** 1 ngày

---

## ❓ Câu hỏi Thường gặp (FAQ)

### Q1: Tôi không có database, làm sao?
**A:** Theo INSTALLATION_GUIDE.md → Database Configuration → Khởi tạo Database

### Q2: Cái nào là default password?
**A:** Xem DEMO_ACCOUNTS.md, hoặc bảng Quick Start ở trên

### Q3: Sao tôi không kết nối được API?
**A:** 
1. Kiểm tra NEXT_PUBLIC_API_URL trong .env.local
2. Chắc chắn backend đang chạy
3. Xem INSTALLATION_GUIDE.md → Troubleshooting

### Q4: Có bao nhiêu roles?
**A:** 6 roles - xem DEMO_ACCOUNTS.md → Tổng quan Hệ thống Roles

### Q5: Làm sao để add user mới?
**A:** Đăng nhập Admin → Admin Portal → Quản lý người dùng

### Q6: API documentation ở đâu?
**A:** [API_CONFIGURATION.md](API_CONFIGURATION.md) hoặc http://localhost:5000/swagger

### Q7: Các dependencies là gì?
**A:** [DEPENDENCIES_AND_TOOLS.md](DEPENDENCIES_AND_TOOLS.md)

### Q8: Tôi cần chuẩn bị gì để nộp?
**A:** [PROJECT_SUBMISSION_CHECKLIST.md](PROJECT_SUBMISSION_CHECKLIST.md)

---

## 📚 Danh sách Tài liệu Hoàn chỉnh

| File | Mục đích | Lần cập nhật cuối |
|------|---------|------------------|
| DATABASE_SETUP.md | Database configuration | 2026-05-28 |
| DEMO_ACCOUNTS.md | Demo users & roles | 2026-05-28 |
| INSTALLATION_GUIDE.md | System setup | 2026-05-28 |
| API_CONFIGURATION.md | API endpoints & auth | 2026-05-28 |
| DEPENDENCIES_AND_TOOLS.md | Dependencies list | 2026-05-28 |
| PROJECT_SUBMISSION_CHECKLIST.md | Submission guide | 2026-05-28 |
| DOCUMENTATION_INDEX.md | This file | 2026-05-28 |

---

## 🔗 Liên kết Nhanh

### 🚀 Bắt đầu
- [Installation Guide](INSTALLATION_GUIDE.md) - Setup toàn hệ thống
- [Quick Start](#quick-start) - 5 phút test

### 🗄️ Dữ liệu
- [Database Setup](DATABASE_SETUP.md) - Database configuration
- [Demo Accounts](DEMO_ACCOUNTS.md) - Test accounts

### 🔧 Kỹ thuật
- [API Configuration](API_CONFIGURATION.md) - API endpoints
- [Dependencies](DEPENDENCIES_AND_TOOLS.md) - All libraries

### 📋 Nộp bài
- [Submission Checklist](PROJECT_SUBMISSION_CHECKLIST.md) - Full checklist

---

## 💡 Quick Start

### Để chạy project (5 phút)
```bash
# 1. Clone repo (hoặc download)
cd KidzgoCentre

# 2. Install dependencies
npm install

# 3. Tạo .env.local
echo "NEXT_PUBLIC_API_URL=http://103.146.22.206:5000/api" > .env.local

# 4. Chạy dev server
npm run dev

# 5. Mở browser
# http://localhost:3000

# 6. Đăng nhập
# Username: admin
# Password: Admin@123456
```

### Để cài đặt toàn bộ
Xem [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md) - Section "Cài đặt Phần mềm"

### Để setup database
Xem [DATABASE_SETUP.md](DATABASE_SETUP.md) - Section "Initial Data Setup"

---

## 🎓 Cấu trúc Folder Tài liệu

```
docs/
├── DATABASE_SETUP.md              # Database configuration
├── DEMO_ACCOUNTS.md              # Demo accounts & roles
├── INSTALLATION_GUIDE.md         # Installation instructions
├── API_CONFIGURATION.md          # API endpoints
├── DEPENDENCIES_AND_TOOLS.md     # Dependencies list
├── PROJECT_SUBMISSION_CHECKLIST.md # Submission guide
├── DOCUMENTATION_INDEX.md        # This file
├── USER_MANUAL_VI.md             # User guide (Vietnamese)
├── USER_MANUAL_EN.md             # User guide (English)
├── ADMIN_GUIDE.md                # Admin guide
├── TROUBLESHOOTING.md            # Troubleshooting
├── ARCHITECTURE.md               # Architecture docs
└── samples/                      # Sample files
```

---

## 📞 Support & Contact

### Need Help?
1. **Tìm kiếm FAQ** - Xem ❓ Câu hỏi Thường gặp ở trên
2. **Đọc tài liệu liên quan** - Xem bảng 📚 Danh sách Tài liệu
3. **Kiểm tra Troubleshooting** - [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
4. **Liên hệ Support:**
   - Email: support@kidzgocentre.com
   - Hotline: +84-XXX-XXX-XXXX
   - Support Portal: https://support.kidzgocentre.com

---

## 📊 Document Statistics

- **Total Documents:** 7 main docs
- **Total Pages:** ~100 pages
- **Last Updated:** 2026-05-28
- **Status:** ✅ COMPLETE

---

## ✅ Checklist Trước Khi Bắt Đầu

- [ ] Đã đọc [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)
- [ ] Đã chuẩn bị system requirements
- [ ] Đã có Node.js 18+
- [ ] Đã có .NET SDK 8.0+ (nếu setup backend)
- [ ] Đã có SQL Server (nếu setup database)
- [ ] Đã xem [DEMO_ACCOUNTS.md](DEMO_ACCOUNTS.md)
- [ ] Đã bookmark [PROJECT_SUBMISSION_CHECKLIST.md](PROJECT_SUBMISSION_CHECKLIST.md)

---

**Bắt đầu:** [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)  
**Bầu cử Demo:** [DEMO_ACCOUNTS.md](DEMO_ACCOUNTS.md)  
**Nộp bài:** [PROJECT_SUBMISSION_CHECKLIST.md](PROJECT_SUBMISSION_CHECKLIST.md)

---

*Last Updated: 2026-05-28 | Version 1.0*
