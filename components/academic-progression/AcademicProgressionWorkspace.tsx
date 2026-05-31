"use client";

import { useMemo, useState } from "react";
import { BarChart3, BookOpen, GraduationCap, Layers, Users } from "lucide-react";
import LevelModuleWorkspace from "./LevelModuleWorkspace";
import AcademicDashboard from "./AcademicDashboard";
import StudentProgressWorkspace from "./StudentProgressWorkspace";

export type AcademicProgressionRoleMode = "admin" | "staff" | "teacher";

interface Props {
  roleMode: AcademicProgressionRoleMode;
  /** Optionally pre-select a student to view progress */
  studentId?: string;
  studentName?: string;
}

type TabKey = "dashboard" | "levels" | "student-progress";

interface Tab {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
}

const ADMIN_STAFF_TABS: Tab[] = [
  { key: "dashboard", label: "Dashboard", icon: <BarChart3 className="h-4 w-4" /> },
  { key: "levels", label: "Level & Module", icon: <Layers className="h-4 w-4" /> },
  { key: "student-progress", label: "Tiến trình HV", icon: <Users className="h-4 w-4" /> },
];

const TEACHER_TABS: Tab[] = [
  { key: "student-progress", label: "Tiến trình HV", icon: <Users className="h-4 w-4" /> },
];

const ROLE_TITLE: Record<AcademicProgressionRoleMode, string> = {
  admin: "Academic Progression — Quản trị",
  staff: "Academic Progression — Vận hành",
  teacher: "Academic Progression — Giáo viên",
};

const ROLE_SUBTITLE: Record<AcademicProgressionRoleMode, string> = {
  admin: "Quản lý cấu trúc học thuật, theo dõi tiến trình và ra quyết định lên lớp.",
  staff: "Theo dõi tiến trình học viên, assessment và kế hoạch phụ đạo.",
  teacher: "Ghi nhận assessment, đánh giá và xét lên lớp cho học viên.",
};

export default function AcademicProgressionWorkspace({ roleMode, studentId, studentName }: Props) {
  const tabs = useMemo<Tab[]>(
    () => (roleMode === "teacher" ? TEACHER_TABS : ADMIN_STAFF_TABS),
    [roleMode]
  );

  const defaultTab = useMemo(
    () => (roleMode === "teacher" ? "student-progress" : "dashboard"),
    [roleMode]
  );

  const [activeTab, setActiveTab] = useState<TabKey>(defaultTab);

  return (
    <div className="min-h-screen bg-linear-to-b from-red-50/30 to-white p-2">
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-linear-to-r from-red-600 to-red-700 p-3 text-white shadow-lg">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-gray-900">{ROLE_TITLE[roleMode]}</h1>
              <p className="text-sm text-gray-600">{ROLE_SUBTITLE[roleMode]}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50/50 px-3 py-1.5 shrink-0">
            <BookOpen className="h-4 w-4 text-red-500" />
            <span className="text-xs font-semibold text-red-600">Phase 2</span>
          </div>
        </div>

        {/* Tabs */}
        {tabs.length > 1 && (
          <div className="flex gap-1 rounded-xl border border-gray-200 bg-white p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all cursor-pointer ${
                  activeTab === tab.key
                    ? "bg-red-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {activeTab === "dashboard" && <AcademicDashboard />}

        {activeTab === "levels" && (
          <LevelModuleWorkspace roleMode={roleMode === "admin" ? "admin" : "staff"} />
        )}

        {activeTab === "student-progress" && studentId ? (
          <StudentProgressWorkspace
            studentId={studentId}
            studentName={studentName}
            roleMode={roleMode}
          />
        ) : activeTab === "student-progress" ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
            <Users className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm font-medium text-gray-500">Chọn học viên để xem tiến trình</p>
            <p className="mt-1 text-xs text-gray-400">
              Vào trang chi tiết học viên hoặc lớp học để truy cập tiến trình
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
