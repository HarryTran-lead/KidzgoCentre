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
      },
      learning: {
        title: "Học tập",
        courses: {
          list: "Danh sách khóa học",
        },
        classes: {
          list: "Danh sách lớp học",
        },
        students: {
          list: "Danh sách học viên",
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
      finance: {
        title: "Tài chính",
        cashbook: "Sổ quỹ",
        payroll: "Bảng lương",
      },
      system: {
        title: "Hệ thống",
        accounts: "Quản lý tài khoản",
        teachers: "Quản lý giáo viên",
        branches: "Quản lý chi nhánh",
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
      },
      learning: {
        title: "Learning",
        courses: {
          list: "Courses",
        },
        classes: {
          list: "Classes",
        },
        students: {
          list: "Students",
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
      finance: {
        title: "Finance",
        cashbook: "Cashbook",
        payroll: "Payroll",
      },
      system: {
        title: "System",
        accounts: "Accounts",
        teachers: "Teachers",
        branches: "Branches",
        reports: "Reports",
        settings: "Settings",
      },
    },
  },
} as const;
