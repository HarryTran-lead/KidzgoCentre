"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, GraduationCap, Route, ShieldCheck, UserRound } from "lucide-react";
import ProgramProgressionAssessmentsPanel from "../program-progressions/ProgramProgressionAssessmentsPanel";
import ProgramProgressionMySchedulesPanel from "../program-progressions/ProgramProgressionMySchedulesPanel";
import ProgramProgressionRulesPanel from "../program-progressions/ProgramProgressionRulesPanel";
import ProgramProgressionSchedulesPanel from "../program-progressions/ProgramProgressionSchedulesPanel";
import ProgramProgressionTabs from "../program-progressions/ProgramProgressionTabs";
import {
  getProgramProgressionDefaultTab,
  getProgramProgressionPermissions,
  getProgramProgressionTabs,
  type ProgramProgressionRoleMode,
  type ProgramProgressionTabKey,
} from "../program-progressions/config";

type ProgramProgressionWorkspaceProps = {
  roleMode: ProgramProgressionRoleMode;
};

const ROLE_TITLES: Record<ProgramProgressionRoleMode, string> = {
  admin: "Tiến trình chuyển chương trình - Quản trị",
  staff: "Tiến trình chuyển chương trình - Vận hành",
  teacher: "Tiến trình chuyển chương trình - Giáo viên",
  parent: "Tiến trình chuyển chương trình - Phụ huynh",
  student: "Tiến trình chuyển chương trình - Học sinh",
};

const ROLE_SUBTITLES: Record<ProgramProgressionRoleMode, string> = {
  admin: "Quản lý toàn bộ quy tắc, lịch và kết quả đánh giá chuyển chương trình.",
  staff: "Theo dõi quy tắc và vận hành lịch, duyệt kết quả đánh giá.",
  teacher: "Theo dõi lịch được phân công và ghi nhận kết quả đánh giá.",
  parent: "Xem lịch đánh giá của con theo từng thời điểm.",
  student: "Xem lịch đánh giá cá nhân và trạng thái kết quả.",
};

export default function ProgramProgressionWorkspace({
  roleMode,
}: ProgramProgressionWorkspaceProps) {
  const permissions = useMemo(
    () => getProgramProgressionPermissions(roleMode),
    [roleMode]
  );
  const tabs = useMemo(() => getProgramProgressionTabs(roleMode), [roleMode]);
  const defaultTab = useMemo(() => getProgramProgressionDefaultTab(roleMode), [roleMode]);

  const [activeTab, setActiveTab] = useState<ProgramProgressionTabKey>(defaultTab);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    if (!tabs.some((tab) => tab.key === activeTab)) {
      setActiveTab(defaultTab);
    }
  }, [activeTab, defaultTab, tabs]);

  const isStudentView = roleMode === "student";

  return (
    <div
      className={
        isStudentView
          ? "h-full overflow-y-auto p-4 text-white"
          : "min-h-screen bg-linear-to-b from-red-50/30 to-white p-6"
      }
    >
      <div className="space-y-6">
        <div
          className={
            isStudentView
              ? "rounded-2xl border border-indigo-400/30 bg-slate-900/80 p-5 backdrop-blur"
              : "rounded-2xl border border-red-200 bg-white p-5"
          }
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className={
                  isStudentView
                    ? "rounded-xl bg-linear-to-r from-indigo-500 to-purple-600 p-3 text-white shadow-lg"
                    : "rounded-xl bg-linear-to-r from-red-600 to-red-700 p-3 text-white shadow-lg"
                }
              >
                <GraduationCap size={24} />
              </div>

              <div>
                <h1 className={isStudentView ? "text-xl font-bold text-white" : "text-2xl font-bold text-gray-900"}>
                  {ROLE_TITLES[roleMode]}
                </h1>
                <p className={isStudentView ? "mt-1 text-sm text-indigo-100" : "mt-1 text-sm text-gray-600"}>
                  {ROLE_SUBTITLES[roleMode]}
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <div
                className={
                  isStudentView
                    ? "rounded-xl border border-indigo-300/30 bg-slate-950/60 px-3 py-2 text-xs text-indigo-100"
                    : "rounded-xl border border-red-100 bg-red-50/50 px-3 py-2 text-xs text-gray-700"
                }
              >
                <div className="mb-1 flex items-center gap-1 font-semibold">
                  <ShieldCheck size={12} /> Quy tắc
                </div>
                <div>{permissions.canViewRules ? "Có quyền xem" : "Không truy cập"}</div>
              </div>

              <div
                className={
                  isStudentView
                    ? "rounded-xl border border-indigo-300/30 bg-slate-950/60 px-3 py-2 text-xs text-indigo-100"
                    : "rounded-xl border border-red-100 bg-red-50/50 px-3 py-2 text-xs text-gray-700"
                }
              >
                <div className="mb-1 flex items-center gap-1 font-semibold">
                  <Route size={12} /> Lịch đánh giá
                </div>
                <div>
                  {permissions.canManageSchedules
                    ? "Tạo / sửa / vận hành"
                    : permissions.canViewSchedules
                    ? "Chỉ xem"
                    : "Không truy cập"}
                </div>
              </div>

              <div
                className={
                  isStudentView
                    ? "rounded-xl border border-indigo-300/30 bg-slate-950/60 px-3 py-2 text-xs text-indigo-100"
                    : "rounded-xl border border-red-100 bg-red-50/50 px-3 py-2 text-xs text-gray-700"
                }
              >
                <div className="mb-1 flex items-center gap-1 font-semibold">
                  <ClipboardCheck size={12} /> Đánh giá
                </div>
                <div>
                  {permissions.canApproveAssessments
                    ? "Có quyền phê duyệt"
                    : permissions.canManageAssessments
                    ? "Ghi nhận / chỉnh sửa"
                    : permissions.canViewMyAssessmentSchedules
                    ? "Theo dõi lịch cá nhân"
                    : "Không truy cập"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {tabs.length > 1 ? (
          <ProgramProgressionTabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
            isStudentView={isStudentView}
          />
        ) : null}

        {activeTab === "rules" && (
          <ProgramProgressionRulesPanel
            canManageRules={permissions.canManageRules}
            isStudentView={isStudentView}
          />
        )}

        {activeTab === "schedules" && (
          <ProgramProgressionSchedulesPanel
            canManageSchedules={permissions.canManageSchedules}
            canCancelSchedules={permissions.canCancelSchedules}
            canMarkNoShow={permissions.canMarkNoShow}
            isStudentView={isStudentView}
          />
        )}

        {activeTab === "assessments" && (
          <ProgramProgressionAssessmentsPanel
            canManageAssessments={permissions.canManageAssessments}
            canApproveAssessments={permissions.canApproveAssessments}
            canBulkApproveAssessments={permissions.canBulkApproveAssessments}
            isStudentView={isStudentView}
          />
        )}

        {activeTab === "my-schedules" && (
          <ProgramProgressionMySchedulesPanel
            canFilterByStudent={roleMode === "parent"}
            isStudentView={isStudentView}
          />
        )}

        {tabs.length === 0 && (
          <div
            className={
              isStudentView
                ? "rounded-2xl border border-indigo-400/30 bg-slate-900/80 p-6 text-center text-indigo-100 backdrop-blur"
                : "rounded-2xl border border-red-200 bg-white p-6 text-center text-gray-600"
            }
          >
            <UserRound size={22} className="mx-auto mb-2" />
            Bạn không có quyền truy cập module Tiến trình chuyển chương trình.
          </div>
        )}
      </div>
    </div>
  );
}
