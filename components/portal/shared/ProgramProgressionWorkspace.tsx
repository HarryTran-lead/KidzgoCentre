"use client";

import { useEffect, useMemo, useState } from "react";
import { GraduationCap, Sparkles, UserRound } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-2">
      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
              <GraduationCap className="text-white" size={25} />
            </div>
            <div>
              <h1 className="text-2xl md:text-2xl font-bold text-gray-900">
                {ROLE_TITLES[roleMode]}
              </h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <Sparkles size={14} className="text-red-600" />
                {ROLE_SUBTITLES[roleMode]}
              </p>
            </div>
          </div>
        </div>

        {tabs.length > 1 ? (
          <ProgramProgressionTabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        ) : null}

        {activeTab === "rules" && (
          <ProgramProgressionRulesPanel
            canManageRules={permissions.canManageRules}
          />
        )}

        {activeTab === "schedules" && (
          <ProgramProgressionSchedulesPanel
            canManageSchedules={permissions.canManageSchedules}
            canCancelSchedules={permissions.canCancelSchedules}
            canMarkNoShow={permissions.canMarkNoShow}
          />
        )}

        {activeTab === "assessments" && (
          <ProgramProgressionAssessmentsPanel
            canManageAssessments={permissions.canManageAssessments}
            canApproveAssessments={permissions.canApproveAssessments}
            canBulkApproveAssessments={permissions.canBulkApproveAssessments}
          />
        )}

        {activeTab === "my-schedules" && (
          <ProgramProgressionMySchedulesPanel
            canFilterByStudent={roleMode === "parent"}
          />
        )}

        {tabs.length === 0 && (
          <div className="rounded-2xl border border-red-200 bg-white p-6 text-center text-gray-600">
            <UserRound size={22} className="mx-auto mb-2" />
            Bạn không có quyền truy cập module Tiến trình chuyển chương trình.
          </div>
        )}
      </div>
    </div>
  );
}
