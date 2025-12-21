// lib/dict/menu/menuParent.ts
export const menuParent = {
  vi: {
    groups: {
      childManagement: "Quản lý con",
      scheduleAttendance: "Thời khóa biểu & Điểm danh",
      homework: "Bài tập",
      testsReports: "Kiểm tra & Báo cáo",
      payment: "Thanh toán",
      gamification: "Gamification",
      media: "Media",
      notificationsSupport: "Thông báo & Hỗ trợ",
    },
    items: {
      home: "Trang chủ",
      // Quản lý con
      manageChildren: "Chọn/Lọc theo con",
      // Thời khóa biểu & Điểm danh
      childSchedule: "Xem TKB của con",
      childAttendance: "Lịch sử điểm danh",
      leaveRequest: "Đơn xin nghỉ",
      makeupCredits: "Make-up Credits",
      // Bài tập
      homeworkStatus: "Trạng thái bài tập",
      homeworkScores: "Điểm bài tập",
      teacherComments: "Nhận xét giáo viên",
      // Kiểm tra & Báo cáo
      placementTest: "Kết quả Placement Test",
      testResults: "Kết quả kiểm tra định kỳ",
      monthlyReports: "Báo cáo học tập tháng",
      reportHistory: "Lịch sử báo cáo",
      // Thanh toán
      invoices: "Hóa đơn/Công nợ",
      paymentStatus: "Trạng thái thanh toán",
      makePayment: "Thanh toán học phí",
      paymentHistory: "Lịch sử thanh toán",
      // Gamification
      childMissions: "Mission của con",
      childStreak: "Streak của con",
      childStars: "Sao (Star)",
      childXp: "XP",
      childLevel: "Level",
      // Media
      childMedia: "Album ảnh/video con",
      classMedia: "Album hoạt động lớp",
      // Thông báo & Hỗ trợ
      importantNotifications: "Thông báo quan trọng",
      supportTicket: "Gửi phản hồi/Ticket",
    },
  },
  en: {
    groups: {
      childManagement: "Manage Children",
      scheduleAttendance: "Schedule & Attendance",
      homework: "Homework",
      testsReports: "Tests & Reports",
      payment: "Payment",
      gamification: "Gamification",
      media: "Media",
      notificationsSupport: "Notifications & Support",
    },
    items: {
      home: "Home",
      // Manage Children
      manageChildren: "Select/Filter by Child",
      // Schedule & Attendance
      childSchedule: "Child's Schedule",
      childAttendance: "Attendance History",
      leaveRequest: "Leave Request",
      makeupCredits: "Make-up Credits",
      // Homework
      homeworkStatus: "Homework Status",
      homeworkScores: "Homework Scores",
      teacherComments: "Teacher Comments",
      // Tests & Reports
      placementTest: "Placement Test Results",
      testResults: "Periodic Test Results",
      monthlyReports: "Monthly Reports",
      reportHistory: "Report History",
      // Payment
      invoices: "Invoices/Debts",
      paymentStatus: "Payment Status",
      makePayment: "Make Payment",
      paymentHistory: "Payment History",
      // Gamification
      childMissions: "Child's Missions",
      childStreak: "Child's Streak",
      childStars: "Stars",
      childXp: "XP",
      childLevel: "Level",
      // Media
      childMedia: "Child's Photos/Videos",
      classMedia: "Class Activities Album",
      // Notifications & Support
      importantNotifications: "Important Notifications",
      supportTicket: "Send Feedback/Ticket",
    },
  },
} as const;