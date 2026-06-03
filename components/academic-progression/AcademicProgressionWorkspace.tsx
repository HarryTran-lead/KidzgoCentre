"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, BookOpen, GraduationCap, Layers, Users } from "lucide-react";
import { getAllStudents } from "@/lib/api/profileService";
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

interface StudentOption {
  id: string;
  name: string;
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
  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([]);
  const [studentOptionsLoading, setStudentOptionsLoading] = useState(false);
  const [studentOptionsError, setStudentOptionsError] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState(studentId ?? "");
  const [selectedStudentName, setSelectedStudentName] = useState(studentName ?? "");

  useEffect(() => {
    let cancelled = false;

    const loadStudentOptions = async () => {
      setStudentOptionsLoading(true);
      setStudentOptionsError(null);

      try {
        const response = await getAllStudents({
          profileType: "Student",
          isActive: true,
          pageNumber: 1,
          pageSize: 300,
        });

        const isSuccess = Boolean(response?.isSuccess ?? response?.success);
        const items = Array.isArray(response?.data?.items) ? response.data.items : [];

        if (!isSuccess) {
          throw new Error(response?.message || "Không thể tải danh sách học viên");
        }

        const options = items
          .map((item) => ({
            id: String(item.id || "").trim(),
            name: String(item.displayName || "").trim(),
          }))
          .filter((item) => item.id && item.name);

        if (cancelled) return;

        setStudentOptions(options);

        if (!selectedStudentId && options.length > 0) {
          setSelectedStudentId(options[0].id);
          setSelectedStudentName(options[0].name);
        }
      } catch (error: unknown) {
        if (cancelled) return;
        const message =
          error instanceof Error ? error.message : "Không thể tải danh sách học viên";
        setStudentOptions([]);
        setStudentOptionsError(message);
      } finally {
        if (!cancelled) {
          setStudentOptionsLoading(false);
        }
      }
    };

    void loadStudentOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedStudentId) return;
    const matched = studentOptions.find((item) => item.id === selectedStudentId);
    if (matched && matched.name !== selectedStudentName) {
      setSelectedStudentName(matched.name);
    }
  }, [selectedStudentId, selectedStudentName, studentOptions]);

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

        {activeTab === "student-progress" ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Tiến trình học viên</p>
                  <p className="text-xs text-gray-500">
                    Chọn học viên để xem tiến trình theo từng module, assessment và quyết định lên cấp.
                  </p>
                </div>

                <div className="w-full sm:w-[360px]">
                  <label className="mb-1 block text-xs font-medium text-gray-600">Học viên</label>
                  <select
                    value={selectedStudentId}
                    onChange={(event) => setSelectedStudentId(event.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                    disabled={studentOptionsLoading || studentOptions.length === 0}
                  >
                    {studentOptionsLoading ? (
                      <option value="">Đang tải danh sách học viên...</option>
                    ) : studentOptions.length === 0 ? (
                      <option value="">Không có học viên</option>
                    ) : (
                      studentOptions.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {studentOptionsError && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                  {studentOptionsError}
                </div>
              )}
            </div>

            {selectedStudentId ? (
              <StudentProgressWorkspace
                studentId={selectedStudentId}
                studentName={selectedStudentName}
                roleMode={roleMode}
              />
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
                <Users className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                <p className="text-sm font-medium text-gray-500">Chọn học viên để xem tiến trình</p>
                <p className="mt-1 text-xs text-gray-400">
                  Danh sách học viên sẽ hiển thị theo phạm vi tài khoản hiện tại.
                </p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
