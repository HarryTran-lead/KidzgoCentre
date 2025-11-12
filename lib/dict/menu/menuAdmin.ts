// lib/dict/menu/menuAdmin.ts
export const menuAdmin = {
  vi: {
    quick: {
      businessOverview: "Tổng quan kinh doanh",
      centerOverview: "Tổng quan trung tâm",
    },
    groups: {
      leads: {
        title: "Quản lý tuyển sinh",
        manageLeads: "Quản lý leads",
        admissions: "Quản lý tuyển sinh",
      },
      campaign: {
        title: "Chiến dịch & Khuyến mãi",
        createCampaign: "Tạo chiến dịch",
        manageCampaigns: "Quản lý chiến dịch",
        promoPrograms: "Quản lý CT khuyến mãi",
        promotions: "Quản lý khuyến mãi",
      },
      learning: {
        title: "Học tập",
        courses: {
          create: "Tạo khóa học",
          list: "Danh sách khóa học",
          registrations: "Đăng ký học",
          registrationsHistory: "Lịch sử đăng ký",
        },
        classes: {
          create: "Tạo lớp học",
          list: "Danh sách lớp học",
          transfer: "Chuyển lớp (lớp học)",
          roomCheck: "Kiểm tra lịch phòng học",
        },
        students: {
          list: "Danh sách học viên",
          transfer: "Chuyển lớp (học viên)",
          defer: "Bảo lưu",
        },
      },
      ops: {
        title: "Vận hành",
        rooms: "Quản lý phòng học",
        schedule: "Lịch & Phân bổ",
        fees: "Học phí & Công nợ",
        feedback: "Feedback lớp học",
        extracurricular: "Ngoại khóa & Trại hè",
      },
      system: {
        title: "Hệ thống",
        accounts: "Quản lý tài khoản",
        teachers: "Quản lý giáo viên",
        reports: "Báo cáo",
        settings: "Cài đặt",
      },
    },
  },

  en: {
    quick: {
      businessOverview: "Business Overview",
      centerOverview: "Center Overview",
    },
    groups: {
      leads: {
        title: "Admissions",
        manageLeads: "Leads",
        admissions: "Admissions Management",
      },
      campaign: {
        title: "Campaigns & Promotions",
        createCampaign: "Create Campaign",
        manageCampaigns: "Manage Campaigns",
        promoPrograms: "Promotion Programs",
        promotions: "Promotions",
      },
      learning: {
        title: "Learning",
        courses: {
          create: "Create Course",
          list: "Courses",
          registrations: "Enrollments",
          registrationsHistory: "Enrollment History",
        },
        classes: {
          create: "Create Class",
          list: "Classes",
          transfer: "Class Transfer",
          roomCheck: "Room Availability",
        },
        students: {
          list: "Students",
          transfer: "Student Transfer",
          defer: "Deferment",
        },
      },
      ops: {
        title: "Operations",
        rooms: "Rooms",
        schedule: "Schedule & Allocation",
        fees: "Tuition & Receivables",
        feedback: "Class Feedback",
        extracurricular: "Extracurricular & Camps",
      },
      system: {
        title: "System",
        accounts: "Accounts",
        teachers: "Teachers",
        reports: "Reports",
        settings: "Settings",
      },
    },
  },
} as const;
