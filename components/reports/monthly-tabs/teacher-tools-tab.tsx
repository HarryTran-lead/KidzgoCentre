"use client";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/lightswind/select";
import type { SessionReportItem } from "@/types/teacher/sessionReport";

type ClassOption = { id: string; name?: string; students?: number; code?: string };
type StudentOption = { id: string; name?: string };
type ClassProgress = {
  id: string;
  name: string;
  total: number;
  submitted: number;
  approved: number;
  pending: number;
  draft: number;
};
type ReportLite = { id: string; classId?: string; status?: string };

type Props = {
  month: number;
  year: number;
  classQuery: string;
  setClassQuery: (value: string) => void;
  setMonth: (value: number) => void;
  setYear: (value: number) => void;
  showTeacherTools: boolean;
  setShowTeacherTools: (updater: (prev: boolean) => boolean) => void;
  teacherClasses: ClassOption[];
  classesLoading: boolean;
  classesError: string;
  selectedClassId: string | null;
  setSelectedClassId: (id: string | null) => void;
  setSelectedStudentId: (id: string | null) => void;
  setSessionReports: (items: SessionReportItem[]) => void;
  classStudents: StudentOption[];
  studentsLoading: boolean;
  studentsError: string;
  selectedStudentId: string | null;
  activeReport: { id: string } | undefined;
  displayReport: { id: string } | undefined;
  sessionReports: SessionReportItem[];
  sessionsLoading: boolean;
  sessionsError: string;
  actionLoading: Record<string, boolean>;
  runAction: (reportId: string, action: string) => Promise<void>;
  generateAiDraftFromStudent: () => Promise<void>;
  openReportDetail: (reportId: string) => void;
  teacherClassProgress: ClassProgress[];
  teacherReports: ReportLite[];
  setActiveTab: (tab: "reports") => void;
};

const STATUS_ALIAS: Record<string, string> = {
  Review: "Submitted",
};

function normalizeStatus(status?: string) {
  const normalized = String(status ?? "").trim();
  return STATUS_ALIAS[normalized] ?? normalized;
}

export default function TeacherToolsTab({
  month,
  year,
  classQuery,
  setClassQuery,
  setMonth,
  setYear,
  showTeacherTools,
  setShowTeacherTools,
  teacherClasses,
  classesLoading,
  classesError,
  selectedClassId,
  setSelectedClassId,
  setSelectedStudentId,
  setSessionReports,
  classStudents,
  studentsLoading,
  studentsError,
  selectedStudentId,
  activeReport,
  displayReport,
  sessionReports,
  sessionsLoading,
  sessionsError,
  actionLoading,
  runAction,
  generateAiDraftFromStudent,
  openReportDetail,
  teacherClassProgress,
  teacherReports,
  setActiveTab,
}: Props) {
  // Tính tổng thể
  const totalStats = teacherClassProgress.reduce(
    (acc, item) => ({
      total: acc.total + item.total,
      submitted: acc.submitted + item.submitted,
      approved: acc.approved + item.approved,
      pending: acc.pending + item.pending,
      draft: acc.draft + item.draft,
    }),
    { total: 0, submitted: 0, approved: 0, pending: 0, draft: 0 }
  );

  return (
    <div className="space-y-4">
      {/* Teacher Tools Section */}
      <div className="group relative overflow-hidden rounded-2xl border border-red-200/50 bg-gradient-to-br from-white to-red-50 p-4 transition-all duration-500 hover:shadow-xl hover:shadow-red-200/40">
        <div className="relative">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-800">Hướng dẫn quy trình</span>
            </div>
            <div className="rounded-full bg-gradient-to-r from-red-500 to-amber-500 px-3 py-1 text-xs font-bold text-white shadow-md shadow-red-500/30">
              {month}/{year}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            {[
              { step: 1, label: "Chọn lớp", desc: "Bước 1" },
              { step: 2, label: "Chọn tháng/năm", desc: "Bước 2" },
              { step: 3, label: "Chọn học sinh", desc: "Bước 3" },
              { step: 4, label: "Xem dữ liệu & AI", desc: "Bước 4" },
              { step: 5, label: "Chỉnh sửa & Submit", desc: "Bước 5" },
              { step: 6, label: "Nhận comment", desc: "Bước 6" },
              { step: 7, label: "Sửa lại & Submit", desc: "Bước 7" },
              { step: 8, label: "Admin duyệt", desc: "Bước 8" },
              { step: 9, label: "Publish", desc: "Bước 9" },
            ].map((item, idx) => (
              <div key={`step-${item.step}`} className="contents">
                <div
                  className="group/step flex flex-1 min-w-[90px] items-center gap-2 rounded-xl border border-white/60 bg-white/70 backdrop-blur-md px-3 py-2.5 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:bg-white/90 hover:shadow-lg hover:shadow-red-500/10 hover:border-red-200/50"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white font-bold text-xs shadow-lg shadow-red-500/40 ring-2 ring-red-200">
                    {item.step}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-medium text-red-400">{item.desc}</span>
                    <span className="text-xs font-bold text-gray-800">{item.label}</span>
                  </div>
                </div>
                {idx < 8 && (
                  <svg className="h-4 w-4 flex-shrink-0 text-amber-400 hidden sm:block drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Collapsible Tools */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold">Công cụ soạn báo cáo</h3>
          <button
            className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
            onClick={() => setShowTeacherTools((prev) => !prev)}
          >
            {showTeacherTools ? "Thu gọn" : "Mở công cụ"}
            {showTeacherTools ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
        {!showTeacherTools && (
          <p className="rounded-xl border border-red-100 bg-red-50/40 px-3 py-2 text-xs text-gray-700">
            Mở công cụ để chọn lớp, học sinh, xem dữ liệu buổi học và tạo nháp AI.
          </p>
        )}

        {showTeacherTools && (
          <>
            {/* Filter Row */}
            <div className="rounded-xl border border-red-100/60 bg-gradient-to-br from-white to-red-50/30 p-4 transition-all hover:shadow-md hover:shadow-red-200/30">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-sm">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-gray-800">Bộ lọc</span>
                </div>

                <div className="h-8 w-px bg-red-200/50"></div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-500">Tìm lớp:</label>
                  <div className="relative">
                    <input
                      value={classQuery}
                      onChange={(e) => setClassQuery(e.target.value)}
                      placeholder="Nhập tên lớp..."
                      className="w-40 rounded-lg border border-red-200 bg-white px-3 py-1.5 pr-7 text-xs text-gray-700 placeholder:text-gray-400 focus:border-red-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-200"
                    />
                    <svg className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                <div className="h-8 w-px bg-red-200/50"></div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-500">Tháng:</label>
                  <input
                    className="w-16 rounded-lg border border-red-200 bg-white px-2 py-1.5 text-xs text-gray-700 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                    type="number"
                    min={1}
                    max={12}
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                  />
                </div>

                <div className="h-8 w-px bg-red-200/50"></div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-500">Năm:</label>
                  <input
                    className="w-20 rounded-lg border border-red-200 bg-white px-2 py-1.5 text-xs text-gray-700 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                  />
                </div>

                <div className="h-8 w-px bg-red-200/50"></div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 rounded-full bg-red-100/60 px-2.5 py-1">
                    <svg className="h-3 w-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="text-[10px] font-semibold text-red-700">{teacherClasses.length}</span>
                    <span className="text-[10px] text-red-500">lớp</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Selects */}
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-red-100/60 bg-gradient-to-br from-white to-red-50/30 p-4 transition-all hover:shadow-md hover:shadow-red-200/30">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-800">Chọn lớp</span>
                  <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">{teacherClasses.length}</span>
                </div>
                <Select
                  value={selectedClassId || ""}
                  onValueChange={(val) => {
                    setSelectedClassId(val || null);
                    setSelectedStudentId(null);
                    setSessionReports([]);
                  }}
                >
                  <SelectTrigger className="w-full rounded-lg border border-red-200 bg-white text-sm text-gray-700 focus:border-red-400 focus:ring-2 focus:ring-red-200">
                    <SelectValue placeholder="-- Chọn lớp học --" />
                  </SelectTrigger>
                  <SelectContent>
                    {classesLoading && <div className="p-2 text-xs text-gray-500">Đang tải...</div>}
                    {classesError && <p className="p-2 text-xs text-red-500">{classesError}</p>}
                    {!classesLoading && !classesError && teacherClasses.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        <div>{item.name} ({item.code})</div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-xl border border-red-100/60 bg-gradient-to-br from-white to-red-50/30 p-4 transition-all hover:shadow-md hover:shadow-red-200/30">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-800">Chọn học sinh</span>
                  {selectedClassId && <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-amber-600">{classStudents.length}</span>}
                </div>
                <Select
                  value={selectedStudentId || ""}
                  onValueChange={(val) => setSelectedStudentId(val || null)}
                  disabled={!selectedClassId}
                >
                  <SelectTrigger className="w-full rounded-lg border border-red-200 bg-white text-sm text-gray-700 focus:border-red-400 focus:ring-2 focus:ring-red-200 disabled:bg-gray-100 disabled:cursor-not-allowed">
                    <SelectValue placeholder={selectedClassId ? "-- Chọn học sinh --" : "Chọn lớp trước"} />
                  </SelectTrigger>
                  <SelectContent>
                    {!selectedClassId && <div className="p-2 text-xs text-gray-500">Vui lòng chọn lớp trước</div>}
                    {selectedClassId && studentsLoading && <div className="p-2 text-xs text-gray-500">Đang tải...</div>}
                    {selectedClassId && studentsError && <p className="p-2 text-xs text-red-500">{studentsError}</p>}
                    {selectedClassId && !studentsLoading && !studentsError && classStudents.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        <div>{item.name}</div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!selectedStudentId && (
              <div className="flex items-center gap-2 rounded-lg border border-dashed border-red-200 bg-red-50/50 px-4 py-3">
                <svg className="h-5 w-5 flex-shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-gray-600">Vui lòng chọn lớp và học sinh để xem dữ liệu buổi học.</p>
              </div>
            )}

            {selectedStudentId && (
              <div className="space-y-3">
                <div className="rounded-lg border border-gray-100 bg-white/60 p-3">
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Nhận xét buổi học</div>
                  {sessionsLoading && <div className="p-2 text-xs text-gray-500">Đang tải...</div>}
                  {sessionsError && <p className="text-xs text-red-500">{sessionsError}</p>}
                  {!sessionsLoading && !sessionsError && !sessionReports.length && <p className="text-xs text-gray-400">Chưa có nhận xét buổi học.</p>}
                  <div className="max-h-32 space-y-1.5 overflow-auto">
                    {sessionReports.map((report) => (
                      <div key={report.id ?? report.sessionId} className="rounded-lg border border-gray-100 bg-white p-2.5 text-xs transition-all hover:border-red-200 hover:bg-red-50/30">
                        <div className="mb-1 flex items-center gap-1.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-red-500"></div>
                          <span className="font-semibold text-gray-800">{report.reportDate || "Buổi học"}</span>
                        </div>
                        <p className="pl-3.5 text-gray-600">{report.feedback || "Chưa có nhận xét."}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    disabled={!activeReport || sessionReports.length === 0 || actionLoading[`${displayReport?.id}:generate-draft`]}
                    onClick={() => {
                      if (!activeReport || !displayReport || sessionReports.length === 0) return;
                      void generateAiDraftFromStudent();
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-red-500/30 transition-all hover:shadow-xl hover:shadow-red-500/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Tạo nháp AI
                  </button>
                  <button
                    disabled={!displayReport?.id}
                    onClick={() => displayReport?.id && openReportDetail(displayReport.id)}
                    className="flex items-center justify-center gap-2 rounded-xl border-2 border-red-200 bg-white px-4 py-2.5 text-xs font-semibold text-red-600 shadow-sm transition-all hover:border-red-400 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Chỉnh sửa & Submit
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

}

