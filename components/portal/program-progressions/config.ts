export type ProgramProgressionRoleMode =
  | "admin"
  | "staff"
  | "teacher"
  | "parent"
  | "student";

export type ProgramProgressionTabKey =
  | "rules"
  | "schedules"
  | "assessments"
  | "my-schedules";

export interface ProgramProgressionPermissions {
  canViewRules: boolean;
  canManageRules: boolean;
  canViewSchedules: boolean;
  canManageSchedules: boolean;
  canCancelSchedules: boolean;
  canMarkNoShow: boolean;
  canViewAssessments: boolean;
  canManageAssessments: boolean;
  canApproveAssessments: boolean;
  canBulkApproveAssessments: boolean;
  canViewMyAssessmentSchedules: boolean;
}

export interface ProgramProgressionTabItem {
  key: ProgramProgressionTabKey;
  label: string;
  description: string;
}

const ROLE_PERMISSIONS: Record<ProgramProgressionRoleMode, ProgramProgressionPermissions> = {
  admin: {
    canViewRules: true,
    canManageRules: true,
    canViewSchedules: true,
    canManageSchedules: true,
    canCancelSchedules: true,
    canMarkNoShow: true,
    canViewAssessments: true,
    canManageAssessments: true,
    canApproveAssessments: true,
    canBulkApproveAssessments: true,
    canViewMyAssessmentSchedules: false,
  },
  staff: {
    canViewRules: true,
    canManageRules: false,
    canViewSchedules: true,
    canManageSchedules: true,
    canCancelSchedules: true,
    canMarkNoShow: true,
    canViewAssessments: true,
    canManageAssessments: true,
    canApproveAssessments: true,
    canBulkApproveAssessments: true,
    canViewMyAssessmentSchedules: false,
  },
  teacher: {
    canViewRules: false,
    canManageRules: false,
    canViewSchedules: true,
    canManageSchedules: false,
    canCancelSchedules: false,
    canMarkNoShow: false,
    canViewAssessments: true,
    canManageAssessments: true,
    canApproveAssessments: false,
    canBulkApproveAssessments: false,
    canViewMyAssessmentSchedules: true,
  },
  parent: {
    canViewRules: false,
    canManageRules: false,
    canViewSchedules: false,
    canManageSchedules: false,
    canCancelSchedules: false,
    canMarkNoShow: false,
    canViewAssessments: false,
    canManageAssessments: false,
    canApproveAssessments: false,
    canBulkApproveAssessments: false,
    canViewMyAssessmentSchedules: true,
  },
  student: {
    canViewRules: false,
    canManageRules: false,
    canViewSchedules: false,
    canManageSchedules: false,
    canCancelSchedules: false,
    canMarkNoShow: false,
    canViewAssessments: false,
    canManageAssessments: false,
    canApproveAssessments: false,
    canBulkApproveAssessments: false,
    canViewMyAssessmentSchedules: true,
  },
};

const TAB_DEFINITIONS: ProgramProgressionTabItem[] = [
  {
    key: "rules",
    label: "Quy tắc",
    description: "Điều kiện chuyển chương trình",
  },
  {
    key: "schedules",
    label: "Lịch đánh giá",
    description: "Quản lý lịch đánh giá chuyển chương trình",
  },
  {
    key: "assessments",
    label: "Đánh giá",
    description: "Kết quả đánh giá và phê duyệt",
  },
  {
    key: "my-schedules",
    label: "Lịch của tôi",
    description: "Lịch đánh giá cá nhân",
  },
];

export function getProgramProgressionPermissions(
  roleMode: ProgramProgressionRoleMode
): ProgramProgressionPermissions {
  return ROLE_PERMISSIONS[roleMode];
}

export function getProgramProgressionTabs(
  roleMode: ProgramProgressionRoleMode
): ProgramProgressionTabItem[] {
  const permissions = getProgramProgressionPermissions(roleMode);

  return TAB_DEFINITIONS.filter((tab) => {
    if (tab.key === "rules") return permissions.canViewRules;
    if (tab.key === "schedules") return permissions.canViewSchedules;
    if (tab.key === "assessments") return permissions.canViewAssessments;
    if (tab.key === "my-schedules") return permissions.canViewMyAssessmentSchedules;
    return false;
  });
}

export function getProgramProgressionDefaultTab(
  roleMode: ProgramProgressionRoleMode
): ProgramProgressionTabKey {
  const tabs = getProgramProgressionTabs(roleMode);
  if (tabs.length === 0) return "my-schedules";
  return tabs[0].key;
}
