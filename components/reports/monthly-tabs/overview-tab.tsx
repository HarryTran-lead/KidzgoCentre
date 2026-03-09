"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import type { ReactNode } from "react";

type PriorityReport = {
  id: string;
  studentName?: string;
  studentProfileId?: string;
  className?: string;
  classId?: string;
  status: string;
};

type TeacherClassRow = {
  id: string;
  name: string;
  code?: string;
  expectedStudents: number;
  reportCount: number;
  statusLabel: string;
  statusClass: string;
};

type Props = {
  isTeacher: boolean;
  canManage: boolean;
  isViewer: boolean;
  month: number;
  year: number;
  showManageTools: boolean;
  setShowManageTools: (updater: (prev: boolean) => boolean) => void;
  setStatusFilter: (value: string) => void;
  openClassScope: (classId: string) => void;
  openReportDetail: (reportId: string) => void;
  focusReport: (reportId: string) => void;
  teacherClassSummary: { total: number; noReport: number; inProgress: number; completed: number };
  teacherClassStatusRows: TeacherClassRow[];
  teacherTaskSummary: { draftCount: number; rejectedCount: number; hasCommentCount: number };
  teacherPriorityReports: PriorityReport[];
  adminSummary: { pendingReview: number; needTeacherFix: number; readyToPublish: number; published: number };
  adminPriorityReports: PriorityReport[];
  renderStatusBadge: (status: string) => ReactNode;
};

export default function OverviewTab({
  isTeacher,
  canManage,
  isViewer,
  month,
  year,
  showManageTools,
  setShowManageTools,
  setStatusFilter,
  openClassScope,
  openReportDetail,
  focusReport,
  teacherClassSummary,
  teacherClassStatusRows,
  teacherTaskSummary,
  teacherPriorityReports,
  adminSummary,
  adminPriorityReports,
  renderStatusBadge,
}: Props) {
  return (
    <>
      {isTeacher && (
        <div className="rounded-2xl border border-red-200 bg-white p-4 space-y-3">
          <h3 className="font-semibold">Tổng quan lớp trong tháng {month}/{year}</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-red-100 bg-red-50/40 p-3">
              <div className="text-xs text-gray-600">Tổng lớp dạy</div>
              <div className="text-xl font-bold">{teacherClassSummary.total}</div>
            </div>
            <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-3">
              <div className="text-xs text-gray-600">Chưa có báo cáo</div>
              <div className="text-xl font-bold">{teacherClassSummary.noReport}</div>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-3">
              <div className="text-xs text-gray-600">Đang làm</div>
              <div className="text-xl font-bold">{teacherClassSummary.inProgress}</div>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
              <div className="text-xs text-gray-600">Đã báo cáo</div>
              <div className="text-xl font-bold">{teacherClassSummary.completed}</div>
            </div>
          </div>

          <div className="max-h-52 overflow-auto rounded-xl border border-red-100">
            <table className="w-full text-xs">
              <thead className="bg-red-50/60 text-left text-gray-600">
                <tr>
                  <th className="px-3 py-2">Lớp</th>
                  <th className="px-3 py-2">Tiến độ</th>
                  <th className="px-3 py-2">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {teacherClassStatusRows.map((row) => (
                  <tr
                    key={row.id}
                    className="cursor-pointer hover:bg-red-50/50"
                    onClick={() => openClassScope(row.id)}
                  >
                    <td className="px-3 py-2">
                      <div className="font-medium text-gray-900">{row.name}</div>
                      <div className="text-gray-500">{row.code || row.id.slice(0, 8)}</div>
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {row.reportCount}/{row.expectedStudents || "?"} học sinh có báo cáo
                    </td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-1 text-[11px] ${row.statusClass}`}>
                        {row.statusLabel}
                      </span>
                    </td>
                  </tr>
                ))}
                {!teacherClassStatusRows.length && (
                  <tr>
                    <td className="px-3 py-3 text-gray-500" colSpan={3}>
                      Chưa có dữ liệu lớp trong tháng này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isTeacher && (
        <div className="rounded-2xl border border-red-200 bg-white p-4 space-y-3">
          <h3 className="font-semibold">Việc cần làm nhanh</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <button
              className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-left"
              onClick={() => setStatusFilter("Draft")}
            >
              <div className="text-xs text-gray-600">Đang là nháp</div>
              <div className="text-xl font-bold text-amber-700">{teacherTaskSummary.draftCount}</div>
            </button>
            <button
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-left"
              onClick={() => setStatusFilter("Rejected")}
            >
              <div className="text-xs text-gray-600">Bị trả về sửa</div>
              <div className="text-xl font-bold text-rose-700">{teacherTaskSummary.rejectedCount}</div>
            </button>
            <button
              className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-3 text-left"
              onClick={() => setStatusFilter("Tất cả")}
            >
              <div className="text-xs text-gray-600">Có góp ý từ admin/staff</div>
              <div className="text-xl font-bold text-blue-700">{teacherTaskSummary.hasCommentCount}</div>
            </button>
          </div>
          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-700">Danh sách ưu tiên xử lý</div>
            <div className="grid gap-2 md:grid-cols-2">
              {teacherPriorityReports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => openReportDetail(report.id)}
                  className="rounded-lg border border-red-100 bg-red-50/40 p-2 text-left text-xs hover:bg-red-100/60"
                >
                  <div className="font-semibold text-gray-900">
                    {report.studentName || report.studentProfileId || report.id}
                  </div>
                  <div className="text-gray-600">{report.className || report.classId || "N/A"}</div>
                  <div className="mt-1">{renderStatusBadge(report.status)}</div>
                </button>
              ))}
              {teacherPriorityReports.length === 0 && (
                <p className="text-xs text-gray-500">Không có report cần ưu tiên xử lý.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {canManage && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-semibold">Bảng điều phối review Admin/Staff</h3>
              <div className="text-xs text-gray-600">
                Ưu tiên xử lý theo thứ tự: Submitted → Rejected → Approved.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                onClick={() => setShowManageTools((prev) => !prev)}
              >
                {showManageTools ? "Thu gọn công cụ" : "Mở bộ công cụ quản lý"}
                {showManageTools ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <button
              className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-left"
              onClick={() => setStatusFilter("Submitted")}
            >
              <div className="text-xs text-gray-600">Chờ duyệt</div>
              <div className="text-xl font-bold text-blue-700">{adminSummary.pendingReview}</div>
            </button>
            <button
              className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-left"
              onClick={() => setStatusFilter("Rejected")}
            >
              <div className="text-xs text-gray-600">Đã trả teacher sửa</div>
              <div className="text-xl font-bold text-rose-700">{adminSummary.needTeacherFix}</div>
            </button>
            <button
              className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-left"
              onClick={() => setStatusFilter("Approved")}
            >
              <div className="text-xs text-gray-600">Sẵn sàng publish</div>
              <div className="text-xl font-bold text-emerald-700">{adminSummary.readyToPublish}</div>
            </button>
            <button
              className="rounded-xl border border-purple-200 bg-purple-50 p-3 text-left"
              onClick={() => setStatusFilter("Published")}
            >
              <div className="text-xs text-gray-600">Đã publish</div>
              <div className="text-xl font-bold text-purple-700">{adminSummary.published}</div>
            </button>
          </div>

          <div className="rounded-xl border border-red-100 bg-red-50/40 p-3">
            <div className="mb-2 text-xs font-semibold text-gray-700">Hàng đợi xử lý nhanh</div>
            <div className="grid gap-2 md:grid-cols-2">
              {adminPriorityReports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => openReportDetail(report.id)}
                  className="rounded-lg border border-red-100 bg-white p-2 text-left text-xs hover:bg-red-50"
                >
                  <div className="font-semibold text-gray-900">
                    {report.studentName || report.studentProfileId || report.id}
                  </div>
                  <div className="text-gray-600">{report.className || report.classId || "N/A"}</div>
                  <div className="mt-1">{renderStatusBadge(report.status)}</div>
                </button>
              ))}
              {!adminPriorityReports.length && (
                <p className="text-xs text-gray-500">Không có report cần xử lý ngay.</p>
              )}
            </div>
          </div>
          {!showManageTools && (
            <p className="rounded-xl border border-red-100 bg-red-50/30 px-3 py-2 text-xs text-gray-700">
              Đã thu gọn công cụ nâng cao. Bấm "Mở bộ công cụ quản lý" để xem lọc theo lớp, hành động nhanh và tiến độ theo lớp.
            </p>
          )}
        </div>
      )}

      {isViewer && (
        <div className="rounded-2xl border border-red-200 bg-white p-4 space-y-3">
          <h3 className="font-semibold">Luồng xem Parent/Student</h3>
          <p className="text-xs text-gray-600">
            Chỉ xem được báo cáo đã Publish. Dùng bộ lọc để tìm theo tháng/năm hoặc học sinh.
          </p>
        </div>
      )}
    </>
  );
}
