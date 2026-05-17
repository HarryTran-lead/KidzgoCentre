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
    <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6">
      <div className="space-y-6">
        {/* Page header */}
        <div className="rounded-2xl border border-red-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                <GraduationCap className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">{ROLE_TITLE[roleMode]}</h1>
                <p className="text-sm text-gray-500">{ROLE_SUBTITLE[roleMode]}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-1.5">
              <BookOpen className="h-3.5 w-3.5 text-red-500" />
              <span className="text-xs font-medium text-red-600">Phase 2</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        {tabs.length > 1 && (
          <div className="flex gap-1 rounded-xl border border-gray-200 bg-white p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
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
