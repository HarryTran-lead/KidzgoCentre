// lib/dict/menu/menuAdmin.ts
export const menuAdmin = {
  vi: {
    quick: {
      businessOverview: "Tong quan kinh doanh",
      centerOverview: "Tong quan trung tam",
    },
    groups: {
      leads: {
        title: "Quan ly tuyen sinh",
        manageLeads: "Quan ly leads",
      },
      learning: {
        title: "Hoc tap",
        courses: {
          list: "Danh sach khoa hoc",
        },
        tuitionPlans: {
          list: "Danh sach goi hoc",
        },
        classes: {
          list: "Danh sach lop hoc",
        },
        students: {
          list: "Danh sach hoc vien",
        },
      },
      ops: {
        title: "Van hanh",
        rooms: "Quan ly phong hoc",
        schedule: "Lich & Phan bo",
        fees: "Hoc phi & Cong no",
        feedback: "Feedback lop hoc",
        extracurricular: "Ngoai khoa & Trai he",
        documents: "Giao an & Tai lieu",
      },
      finance: {
        title: "Tai chinh",
        cashbook: "So quy",
        payroll: "Bang luong",
      },
      system: {
        title: "He thong",
        accounts: "Quan ly tai khoan",
        teachers: "Quan ly giao vien",
        branches: "Quan ly chi nhanh",
        blogs: "Quan ly ban tin",
        reports: "Bao cao",
        notifications: "Thong bao",
        settings: "Cai dat",
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
        tuitionPlans: {
          list: "Tuition Plans",
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
        documents: "Lesson Plans & Materials",
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
        blogs: "Blogs",
        reports: "Reports",
        notifications: "Notifications",
        settings: "Settings",
      },
    },
  },
} as const;
