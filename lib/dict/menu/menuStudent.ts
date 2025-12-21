// lib/dict/menu/menuStudent.ts
export const menuStudent = {
  vi: {
    groups: {
      scheduleAttendance: "Thời khóa biểu & Điểm danh",
      homework: "Bài tập",
      testsReports: "Kiểm tra & Báo cáo",
      gamification: "Gamification",
      media: "Media",
      notifications: "Thông báo",
    },
    items: {
      home: "Trang chủ",
      // Thời khóa biểu & Điểm danh
      viewSchedule: "Xem Thời khóa biểu",
      attendanceHistory: "Lịch sử điểm danh",
      // Bài tập
      homeworkList: "Danh sách bài tập",
      submitHomework: "Nộp bài tập",
      homeworkScores: "Xem điểm bài tập",
      homeworkFeedback: "Nhận xét & Feedback",
      // Kiểm tra & Báo cáo
      testResults: "Kết quả kiểm tra",
      monthlyReports: "Báo cáo học tập tháng",
      // Gamification
      missions: "Nhiệm vụ (Mission)",
      streak: "Streak học tập",
      stars: "Sao (Star)",
      xp: "XP",
      level: "Level",
      rewardStore: "Cửa hàng phần thưởng",
      // Media
      classMedia: "Album ảnh/video lớp",
      personalMedia: "Album cá nhân",
      // Thông báo
      homeworkNotifications: "Thông báo bài tập",
      scheduleNotifications: "Thông báo thay đổi TKB",
    },
  },
  en: {
    groups: {
      scheduleAttendance: "Schedule & Attendance",
      homework: "Homework",
      testsReports: "Tests & Reports",
      gamification: "Gamification",
      media: "Media",
      notifications: "Notifications",
    },
    items: {
      home: "Home",
      // Schedule & Attendance
      viewSchedule: "View Schedule",
      attendanceHistory: "Attendance History",
      // Homework
      homeworkList: "Homework List",
      submitHomework: "Submit Homework",
      homeworkScores: "Homework Scores",
      homeworkFeedback: "Comments & Feedback",
      // Tests & Reports
      testResults: "Test Results",
      monthlyReports: "Monthly Reports",
      // Gamification
      missions: "Missions",
      streak: "Learning Streak",
      stars: "Stars",
      xp: "XP",
      level: "Level",
      rewardStore: "Reward Store",
      // Media
      classMedia: "Class Photos/Videos",
      personalMedia: "Personal Album",
      // Notifications
      homeworkNotifications: "Homework Notifications",
      scheduleNotifications: "Schedule Change Notifications",
    },
  },
} as const;
