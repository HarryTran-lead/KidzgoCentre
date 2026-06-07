"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BarChart3, GraduationCap, Layers, Users } from "lucide-react";
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

function isTabKey(value: string | null | undefined): value is TabKey {
  return value === "dashboard" || value === "levels" || value === "student-progress";
}

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
  const searchParams = useSearchParams();
  const requestedTab = searchParams?.get("tab");
  const requestedProgramId = searchParams?.get("programId")?.trim() || undefined;
  const requestedLevelId = searchParams?.get("levelId")?.trim() || undefined;
  const requestedModuleId = searchParams?.get("moduleId")?.trim() || undefined;
  const requestedReturnTo = searchParams?.get("returnTo")?.trim() || "";
  const returnToCurriculumHref =
    requestedReturnTo.startsWith("/") &&
    !requestedReturnTo.startsWith("//") &&
    requestedReturnTo.includes("/portal/admin/curriculum-overview")
      ? requestedReturnTo
      : "";
  const tabs = useMemo<Tab[]>(
    () => (roleMode === "teacher" ? TEACHER_TABS : ADMIN_STAFF_TABS),
    [roleMode]
  );

  const defaultTab = useMemo(
    () =>
      isTabKey(requestedTab)
        ? requestedTab
        : roleMode === "teacher"
          ? "student-progress"
          : "dashboard",
    [requestedTab, roleMode]
  );

  const [activeTab, setActiveTab] = useState<TabKey>(defaultTab);
  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([]);
  const [studentOptionsLoading, setStudentOptionsLoading] = useState(false);
  const [studentOptionsError, setStudentOptionsError] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState(studentId ?? "");
  const [selectedStudentName, setSelectedStudentName] = useState(studentName ?? "");
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  useEffect(() => {
    if (tabs.some((tab) => tab.key === defaultTab)) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab, tabs]);

  useEffect(() => {
    let cancelled = false;

    const loadStudentOptions = async () => {
      setStudentOptionsLoading(true);
      setStudentOptionsError(null);

      try {
        const pageSize = 500;
        const maxPages = 100;
        const allItems: Array<{ id?: string | null; displayName?: string | null }> = [];
        let pageNumber = 1;

        while (pageNumber <= maxPages) {
          const response = await getAllStudents({
            profileType: "Student",
            isActive: true,
            pageNumber,
            pageSize,
          });

          const isSuccess = Boolean(response?.isSuccess ?? response?.success);
          const data = response?.data;
          const items = Array.isArray(data?.items) ? data.items : [];

          if (!isSuccess) {
            throw new Error(response?.message || "Không thể tải danh sách học viên");
          }

          allItems.push(...items);

          const totalPages = Number(data?.totalPages);
          const hasNextPage =
            Boolean(data?.hasNextPage) ||
            (Number.isFinite(totalPages) && totalPages > 0 && pageNumber < totalPages);

          if (!hasNextPage) break;
          pageNumber += 1;
        }

        const seenStudentIds = new Set<string>();
        const options = allItems
          .map((student) => ({
            id: String(student.id || "").trim(),
            name: String(student.displayName || "").trim(),
          }))
          .filter((student) => {
            if (!student.id || !student.name || seenStudentIds.has(student.id)) return false;
            seenStudentIds.add(student.id);
            return true;
          });

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
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="space-y-6">
        {/* Page header */}
        <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-linear-to-r from-red-600 to-red-700 p-3 text-white shadow-lg">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-gray-900">{ROLE_TITLE[roleMode]}</h1>
              <p className="text-sm text-gray-600">{ROLE_SUBTITLE[roleMode]}</p>
            </div>
          </div>
          {returnToCurriculumHref ? (
            <Link
              href={returnToCurriculumHref}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition-colors hover:bg-red-50"
            >
              ← Quay về chỗ cũ
            </Link>
          ) : null}
        </div>

        {/* Tabs */}
        {tabs.length > 1 && (
          <div className={`flex gap-1 rounded-xl border border-gray-200 bg-white p-1 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
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
          <LevelModuleWorkspace
            roleMode={roleMode === "admin" ? "admin" : "staff"}
            programId={requestedProgramId}
            levelId={requestedLevelId}
            moduleId={requestedModuleId}
          />
        )}

        {activeTab === "student-progress" ? (
          <div className={`space-y-4 transition-all duration-700 delay-200 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
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
