// lib/dict/menu/menuStaffManager.ts
export const menuStaffManager = {
  vi: {
    items: {
      dashboard: "Dashboard",
      accounts: "Quản lý tài khoản",
      crm: "Lead / CRM",
      allocation: "Điều phối lịch/lớp/phòng",
      makeup: "Bù (make-up)",
      monthlyReport: "Báo cáo tháng",
      studentProfiles: "Hồ sơ học sinh",
      templates: "Mẫu thông báo",
    },
  },
  en: {
    items: {
      dashboard: "Dashboard",
      accounts: "Account Management",
      crm: "Leads / CRM",
      allocation: "Schedule/Class/Room Allocation",
      makeup: "Make-up Sessions",
      monthlyReport: "Monthly Report",
      studentProfiles: "Student Profiles",
      templates: "Message Templates",
    },
  },
} as const;
