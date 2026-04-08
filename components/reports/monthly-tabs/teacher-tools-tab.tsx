"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import type { SessionReportItem } from "@/types/teacher/sessionReport";

type ClassOption = { id: string; name?: string; students?: number; code?: string };
type StudentOption = { id: string; name?: string };

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
  runAction: (reportId: string, action: string) => void;
  openReportDetail: (reportId: string) => void;
};

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
  openReportDetail,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold">Luồng làm việc Teacher</h3>
        <button
          className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
          onClick={() => setShowTeacherTools((prev) => !prev)}
        >
          {showTeacherTools ? "Thu gọn công cụ" : "Mở công cụ soạn báo cáo"}
          {showTeacherTools ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>
      <p className="text-xs text-gray-600">
        1) Chọn lớp đang dạy → 2) Chọn tháng/năm → 3) Chọn học sinh → 4) Xem dữ liệu theo buổi và Generate AI draft → 5)
        Chỉnh sửa rồi Submit → 6) Nhận comment (nếu có) → 7) Sửa lại và Submit → 8) Staff/Admin approve → 9) Publish cho
        parent/student.
      </p>
      {!showTeacherTools && (
        <p className="rounded-xl border border-red-100 bg-red-50/40 px-3 py-2 text-xs text-gray-700">
          Mở công cụ để chọn lớp, học sinh, xem dữ liệu buổi học và tạo nháp AI.
        </p>
      )}

      {showTeacherTools && (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Tìm lớp</label>
              <input
                value={classQuery}
                onChange={(e) => setClassQuery(e.target.value)}
                placeholder="Nhập tên lớp..."
                className="w-full rounded-xl border border-red-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="text-xs text-gray-600">
              <div className="space-y-2">
                <div className="font-medium text-gray-700">Chọn thời gian trước</div>
                <div className="flex gap-2">
                  <input
                    className="w-24 rounded-xl border px-3 py-2 text-sm"
                    type="number"
                    min={1}
                    max={12}
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                  />
                  <input
                    className="w-28 rounded-xl border px-3 py-2 text-sm"
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                  />
                </div>
                <div>Khuyến nghị chọn tháng/năm trước rồi mới chọn lớp và học sinh.</div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-red-100 p-3">
              <div className="mb-2 text-xs font-semibold text-gray-700">Danh sách lớp ({teacherClasses.length})</div>
              <div className="max-h-40 space-y-1 overflow-auto">
                {classesLoading && <p className="text-xs text-gray-500">Đang tải lớp...</p>}
                {classesError && <p className="text-xs text-red-500">{classesError}</p>}
                {teacherClasses.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedClassId(item.id);
                      setSelectedStudentId(null);
                      setSessionReports([]);
                    }}
                    className={`w-full rounded-lg px-2 py-2 text-left text-xs ${
                      selectedClassId === item.id ? "bg-red-600 text-white" : "bg-red-50 text-gray-700"
                    }`}
                  >
                    <div className="font-medium">{item.name}</div>
                    <div>{item.students} học sinh • {item.code}</div>
                  </button>
                ))}
                {!classesLoading && !teacherClasses.length && (
                  <p className="text-xs text-gray-500">Chưa có lớp phù hợp.</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-red-100 p-3">
              <div className="mb-2 text-xs font-semibold text-gray-700">
                Danh sách học sinh {selectedClassId ? `(${classStudents.length})` : ""}
              </div>
              <div className="max-h-40 space-y-1 overflow-auto">
                {studentsLoading && <p className="text-xs text-gray-500">Đang tải học sinh...</p>}
                {studentsError && <p className="text-xs text-red-500">{studentsError}</p>}
                {classStudents.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedStudentId(item.id)}
                    className={`w-full rounded-lg px-2 py-2 text-left text-xs ${
                      selectedStudentId === item.id ? "bg-red-600 text-white" : "bg-red-50 text-gray-700"
                    }`}
                  >
                    <div className="font-medium">{item.name}</div>
                    <div>Student ID: {item.id.slice(0, 8)}</div>
                  </button>
                ))}
                {selectedClassId && !studentsLoading && !classStudents.length && (
                  <p className="text-xs text-gray-500">Lớp này chưa có monthly report.</p>
                )}
                {!selectedClassId && (
                  <p className="text-xs text-gray-500">Vui lòng chọn lớp trước.</p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-red-100 bg-red-50/30 p-3">
            <div className="mb-2 text-xs font-semibold text-gray-700">Buổi học trong thời gian đã chọn</div>
            {!selectedStudentId && <p className="text-xs text-gray-500">Chọn học sinh để xem nhận xét buổi học.</p>}
            {selectedStudentId && (
              <div className="space-y-2">
                {sessionsLoading && <p className="text-xs text-gray-500">Đang tải nhận xét buổi học...</p>}
                {sessionsError && <p className="text-xs text-red-500">{sessionsError}</p>}
                {!sessionsLoading && !sessionReports.length && (
                  <p className="text-xs text-gray-500">Chưa có nhận xét buổi học.</p>
                )}
                {!activeReport && (
                  <p className="text-xs text-amber-700">
                    Không tìm thấy monthly report của học sinh này trong phạm vi lớp bạn phụ trách ở {month}/{year}. Vui lòng
                    kiểm tra lại lớp/teacher phụ trách hoặc nhờ Staff/Admin hỗ trợ.
                  </p>
                )}
                {sessionReports.map((report) => (
                  <div key={report.id ?? report.sessionId} className="rounded-lg border bg-white p-2 text-xs">
                    <div className="font-semibold">{report.reportDate ? `Ngày: ${report.reportDate}` : "Buổi học"}</div>
                    <div className="text-gray-600">{report.feedback || "Chưa có nhận xét."}</div>
                  </div>
                ))}
                <button
                  disabled={!activeReport || sessionReports.length === 0 || actionLoading[`${displayReport?.id}:generate-draft`]}
                  onClick={() =>
                    activeReport && sessionReports.length > 0 && displayReport && runAction(displayReport.id, "generate-draft")
                  }
                  className="w-full rounded bg-red-600 px-3 py-2 text-xs text-white disabled:bg-slate-300"
                >
                  {actionLoading[`${displayReport?.id}:generate-draft`] ? "Đang tổng hợp AI..." : "AI tổng hợp và tạo nháp báo cáo tháng"}
                </button>
                <button
                  disabled={!displayReport?.id}
                  onClick={() => displayReport?.id && openReportDetail(displayReport.id)}
                  className="w-full rounded border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 disabled:bg-slate-100 disabled:text-slate-400"
                >
                  Đi tới báo cáo để chỉnh sửa và submit
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
