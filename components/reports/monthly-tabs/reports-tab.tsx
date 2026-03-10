"use client";

import { useState } from "react";
import { Download, Eye, FileCheck, Filter, MessageSquare, Search, TrendingUp, User, Users, Zap } from "lucide-react";
import type { ReactNode } from "react";

type ReportItem = {
  id: string;
  studentName?: string;
  studentProfileId?: string;
  classId?: string;
  className?: string;
  teacherName?: string;
  status: string;
  month: number;
  year: number;
  comments?: Array<{ id: string; content: string; createdAt?: string; authorName?: string; commenterName?: string }>;
};

type JobItem = { id: string; month: number; year: number; status: string };
type RecentComment = { id: string; studentName?: string; className?: string; authorName?: string; content: string; createdAt?: string; reportId: string };
type ClassFilterOption = { id: string; name: string };

type Props = {
  canManage: boolean;
  isTeacher: boolean;
  month: number;
  year: number;
  jobs: JobItem[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  selectedClassId: string | null;
  selectedStudentId: string | null;
  setSelectedClassId: (id: string | null) => void;
  setSelectedStudentId: (id: string | null) => void;
  selectedClassName: string;
  selectedStudentName: string;
  classFilterOptions: ClassFilterOption[];
  clearScopeFilter: () => void;
  selectedReportIds: Set<string>;
  selectAllVisible: () => void;
  clearSelection: () => void;
  bulkLoading: string;
  runBulkAction: (action: "approve" | "publish", ids: string[]) => void;
  filteredReports: ReportItem[];
  displayReport: ReportItem | null | undefined;
  detailLoading: boolean;
  detailError: string;
  draftInput: string;
  setDraftInput: (value: string) => void;
  actionLoading: Record<string, boolean>;
  runAction: (
    reportId: string,
    action: string,
    method?: "POST" | "PUT",
    body?: Record<string, string>,
  ) => Promise<void>;
  canTeacherSubmit: (status: string) => boolean;
  canManagementApprove: (status: string) => boolean;
  canManagementPublish: (status: string) => boolean;
  setActiveReportId: (id: string) => void;
  setDetailModalOpen: (open: boolean) => void;
  toggleReportSelection: (id: string) => void;
  openCommentDialog: (id: string) => void;
  recentCommentsLoading: boolean;
  recentComments: RecentComment[];
  openReportFromComment: (reportId: string) => void;
  showRecentComments: boolean;
  setShowRecentComments: (updater: (prev: boolean) => boolean) => void;
  formatDateTime: (value?: string) => string;
  fetchData: () => void;
  apiFetch: <T = unknown>(url: string, init?: RequestInit) => Promise<T>;
  renderStatusBadge: (status: string) => ReactNode;
};

export default function ReportsTab({
  canManage,
  isTeacher,
  month,
  year,
  jobs,
  loading,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  selectedClassId,
  selectedStudentId,
  setSelectedClassId,
  setSelectedStudentId,
  selectedClassName,
  selectedStudentName,
  classFilterOptions,
  clearScopeFilter,
  selectedReportIds,
  selectAllVisible,
  clearSelection,
  bulkLoading,
  runBulkAction,
  filteredReports,
  displayReport,
  detailLoading,
  detailError,
  draftInput,
  setDraftInput,
  actionLoading,
  runAction,
  canTeacherSubmit,
  canManagementApprove,
  canManagementPublish,
  setActiveReportId,
  setDetailModalOpen,
  toggleReportSelection,
  openCommentDialog,
  recentCommentsLoading,
  recentComments,
  openReportFromComment,
  showRecentComments,
  setShowRecentComments,
  formatDateTime,
  fetchData,
  apiFetch,
  renderStatusBadge,
}: Props) {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [submitFlowLoading, setSubmitFlowLoading] = useState(false);

  const handleSubmitFromModal = async () => {
    if (!displayReport || !canTeacherSubmit(displayReport.status)) return;
    setSubmitFlowLoading(true);
    try {
      await runAction(displayReport.id, "draft", "PUT", {
        draftContent: draftInput || "",
      });
      await runAction(displayReport.id, "submit");
      setEditModalOpen(false);
    } finally {
      setSubmitFlowLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="relative w-full md:max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo học sinh, giáo viên, mã report..."
              className="w-full rounded-xl border border-red-200 py-2 pl-9 pr-3 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedClassId || ""}
              onChange={(e) => {
                const classId = e.target.value || null;
                setSelectedClassId(classId);
                setSelectedStudentId(null);
              }}
              className="rounded-xl border border-red-200 px-3 py-2 text-sm min-w-44"
            >
              <option value="">Tất cả lớp</option>
              {classFilterOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <Filter size={16} className="text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-red-200 px-3 py-2 text-sm"
            >
              {["Tất cả", "Draft", "Submitted", "Approved", "Rejected", "Published", "Review"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        {(selectedClassId || selectedStudentId) && (
          <div className="rounded-2xl border border-blue-100 bg-blue-50/40 px-3 py-2 text-xs text-blue-900 flex flex-wrap items-center gap-2">
            <span className="font-medium">Đang lọc theo:</span>
            {selectedClassId && (
              <span className="rounded-full border border-blue-200 bg-white px-2 py-1">
                Lớp: {selectedClassName}
              </span>
            )}
            {selectedStudentId && (
              <span className="rounded-full border border-blue-200 bg-white px-2 py-1">
                Học viên: {selectedStudentName}
              </span>
            )}
            <button
              className="ml-auto rounded border border-blue-200 bg-white px-2 py-1 hover:bg-blue-50"
              onClick={clearScopeFilter}
            >
              Xóa lọc lớp/học viên
            </button>
          </div>
        )}

        {isTeacher && (
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              className={`rounded-full border px-3 py-1 ${statusFilter === "Tất cả" ? "bg-red-600 text-white border-red-600" : "bg-white"}`}
              onClick={() => setStatusFilter("Tất cả")}
            >
              Tất cả
            </button>
            <button
              className={`rounded-full border px-3 py-1 ${statusFilter === "Draft" ? "bg-amber-600 text-white border-amber-600" : "bg-white"}`}
              onClick={() => setStatusFilter("Draft")}
            >
              Cần submit
            </button>
            <button
              className={`rounded-full border px-3 py-1 ${statusFilter === "Rejected" ? "bg-rose-600 text-white border-rose-600" : "bg-white"}`}
              onClick={() => setStatusFilter("Rejected")}
            >
              Cần sửa lại
            </button>
            <button
              className={`rounded-full border px-3 py-1 ${statusFilter === "Submitted" ? "bg-blue-600 text-white border-blue-600" : "bg-white"}`}
              onClick={() => setStatusFilter("Submitted")}
            >
              Đang chờ duyệt
            </button>
          </div>
        )}

        {canManage && (
          <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs text-gray-700 shadow-sm flex flex-wrap items-center gap-2">
            <span>Đã chọn: {selectedReportIds.size}</span>
            <button className="rounded border px-2 py-1" onClick={selectAllVisible} disabled={!filteredReports.length}>
              Chọn tất cả
            </button>
            <button className="rounded border px-2 py-1" onClick={clearSelection}>
              Bỏ chọn
            </button>
            <button
              className="rounded bg-emerald-600 px-2 py-1 text-white disabled:bg-slate-300"
              disabled={selectedReportIds.size === 0 || bulkLoading !== ""}
              onClick={() => runBulkAction("approve", Array.from(selectedReportIds))}
            >
              {bulkLoading === "approve" ? "Đang duyệt..." : "Duyệt mục đã chọn"}
            </button>
            <button
              className="rounded bg-sky-600 px-2 py-1 text-white disabled:bg-slate-300"
              disabled={selectedReportIds.size === 0 || bulkLoading !== ""}
              onClick={() => runBulkAction("publish", Array.from(selectedReportIds))}
            >
              {bulkLoading === "publish" ? "Đang công bố..." : "Công bố mục đã chọn"}
            </button>
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-red-100 p-4 flex items-center justify-between">
            <h3 className="font-semibold">Danh sách báo cáo ({filteredReports.length})</h3>
            {loading && <span className="text-sm text-gray-500">Đang tải...</span>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-red-50/60 text-left text-xs uppercase text-gray-600">
                <tr>
                  {canManage && <th className="px-4 py-3">Chọn</th>}
                  <th className="px-4 py-3">Báo cáo</th>
                  <th className="px-4 py-3">Giáo viên</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-red-50/40 cursor-pointer"
                    onClick={() => setActiveReportId(report.id)}
                  >
                    {canManage && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedReportIds.has(report.id)}
                          onChange={() => toggleReportSelection(report.id)}
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">
                        {report.studentName || report.studentProfileId || report.id}
                      </div>
                      <div className="text-xs text-gray-500">
                        {report.className || report.classId || "N/A"} • {report.month}/{report.year}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="inline-flex items-center gap-1">
                        <User size={12} />
                        {report.teacherName || "Teacher"}
                      </div>
                    </td>
                    <td className="px-4 py-3">{renderStatusBadge(report.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="rounded border px-2 py-1 text-xs"
                          onClick={() => {
                            setActiveReportId(report.id);
                            setDetailModalOpen(true);
                          }}
                        >
                          <Eye size={12} />
                        </button>
                        {isTeacher && (
                          <button
                            className="rounded border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs text-indigo-700"
                            onClick={() => {
                              setActiveReportId(report.id);
                              setEditModalOpen(true);
                            }}
                          >
                            Edit
                          </button>
                        )}
                        {isTeacher && (
                          <button
                            className="rounded bg-purple-600 px-2 py-1 text-xs text-white disabled:bg-slate-300"
                            disabled={actionLoading[`${report.id}:generate-draft`]}
                            onClick={() => runAction(report.id, "generate-draft")}
                          >
                            AI
                          </button>
                        )}
                        {isTeacher && (
                          <button
                            disabled={!canTeacherSubmit(report.status)}
                            className="rounded bg-indigo-600 px-2 py-1 text-xs text-white disabled:bg-slate-300"
                            onClick={() => runAction(report.id, "submit")}
                          >
                            Submit
                          </button>
                        )}
                        {canManage && (
                          <button className="rounded bg-pink-600 px-2 py-1 text-xs text-white" onClick={() => openCommentDialog(report.id)}>
                            Comment
                          </button>
                        )}
                        {canManage && (
                          <button
                            disabled={!canManagementApprove(report.status)}
                            className="rounded bg-emerald-600 px-2 py-1 text-xs text-white disabled:bg-slate-300"
                            onClick={() => runAction(report.id, "approve")}
                          >
                            Approve
                          </button>
                        )}
                        {canManage && (
                          <button
                            disabled={!canManagementApprove(report.status)}
                            className="rounded bg-amber-600 px-2 py-1 text-xs text-white disabled:bg-slate-300"
                            onClick={() => runAction(report.id, "reject")}
                          >
                            Reject
                          </button>
                        )}
                        {canManage && (
                          <button
                            disabled={!canManagementPublish(report.status)}
                            className="rounded bg-sky-600 px-2 py-1 text-xs text-white disabled:bg-slate-300"
                            onClick={() => runAction(report.id, "publish")}
                          >
                            Công bố
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredReports.length === 0 && (
              <div className="p-8 text-center text-sm text-gray-500">Không có báo cáo phù hợp.</div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-2 font-semibold flex items-center gap-2">
            <FileCheck size={16} /> Chi tiết báo cáo
          </h3>
          {displayReport ? (
            <div className="space-y-2 text-sm">
              {detailLoading && <div className="text-xs text-gray-500">Đang tải chi tiết...</div>}
              {detailError && <div className="text-xs text-red-500">{detailError}</div>}
              <div className="font-semibold">{displayReport.studentName || displayReport.studentProfileId}</div>
              <div className="text-gray-600">{displayReport.className || displayReport.classId || "N/A"}</div>
              {renderStatusBadge(displayReport.status)}
              <div className="text-xs text-gray-500">Teacher: {displayReport.teacherName || "N/A"}</div>
              {isTeacher && (
                <button
                  disabled={!canTeacherSubmit(displayReport.status)}
                  className="mt-2 w-full rounded bg-cyan-700 px-3 py-2 text-xs font-medium text-white disabled:bg-slate-300"
                  onClick={() =>
                    runAction(displayReport.id, "draft", "PUT", {
                      draftContent: draftInput || "",
                    })
                  }
                >
                  {actionLoading[`${displayReport.id}:draft`] ? "Đang lưu..." : "Update Draft (manual)"}
                </button>
              )}
              {isTeacher && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-700">Nội dung nháp (có thể edit)</label>
                  <textarea
                    value={draftInput}
                    readOnly
                    rows={5}
                    placeholder="Nhấp để mở popup chỉnh sửa..."
                    onClick={() => setEditModalOpen(true)}
                    className="w-full rounded-xl border border-red-200 px-3 py-2 text-xs"
                  />
                  <button
                    className="w-full rounded border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                    onClick={() => setEditModalOpen(true)}
                  >
                    Mở popup chỉnh sửa
                  </button>
                </div>
              )}
              {isTeacher && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-gray-700">
                  <div className="font-semibold text-gray-900">Góp ý từ Staff/Admin</div>
                  {displayReport.comments?.length ? (
                    <ul className="mt-2 space-y-2">
                      {(displayReport.comments ?? []).slice().reverse().map((c) => (
                        <li key={c.id} className="rounded border border-amber-100 bg-white p-2">
                          <div className="font-medium text-gray-900">{c.authorName || c.commenterName || "Staff/Admin"}</div>
                          <div className="mt-1 whitespace-pre-line">{c.content}</div>
                          {c.createdAt && <div className="mt-1 text-[11px] text-gray-500">{formatDateTime(c.createdAt)}</div>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-gray-600">Chưa có góp ý.</p>
                  )}
                </div>
              )}
              <button className="w-full rounded border border-red-200 px-3 py-2 text-xs">
                <Download size={12} className="inline mr-1" /> Export/PDF
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Chọn report để xem chi tiết.</p>
          )}
        </div>

        {canManage && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-2 font-semibold flex items-center gap-2">
              <TrendingUp size={16} /> Tiến độ đợt báo cáo
            </h3>
            <p className="text-sm text-gray-600">
              Đợt báo cáo tháng {month}/{year}: {jobs.length}
            </p>
            <div className="mt-2 space-y-2">
              {jobs.map((job) => (
                <div key={job.id} className="rounded-lg border p-2 text-xs">
                  <div>
                    {job.month}/{job.year} • {job.status}
                  </div>
                  <button
                    className="mt-1 rounded bg-blue-600 px-2 py-1 text-white"
                    onClick={() => apiFetch(`/api/monthly-reports/jobs/${job.id}/aggregate`, { method: "POST" }).then(fetchData)}
                  >
                    Đồng bộ dữ liệu
                  </button>
                </div>
              ))}
              {jobs.length === 0 && <p className="text-xs text-gray-500">Chưa có đợt báo cáo.</p>}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageSquare size={16} /> Bình luận gần nhất
            </h3>
            <button
              className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
              onClick={() => setShowRecentComments((prev) => !prev)}
            >
              {showRecentComments ? "Thu gọn" : "Mở"}
            </button>
          </div>
          {!showRecentComments && (
            <p className="text-xs text-gray-500">Thu gọn để giảm chiều dài trang. Bấm Mở để xem chi tiết bình luận.</p>
          )}
          {showRecentComments && (
            <>
              {recentCommentsLoading && <p className="text-xs text-gray-500">Đang tải bình luận...</p>}
              {!recentCommentsLoading && recentComments.length ? (
                <ul className="space-y-2 text-xs">
                  {recentComments.slice(0, 3).map((c) => (
                    <li
                      key={c.id}
                      className="rounded border p-2 cursor-pointer hover:bg-red-50/40"
                      onClick={() => openReportFromComment(c.reportId)}
                    >
                      <div className="font-medium text-gray-900">
                        {c.studentName || "Học viên"} • {c.className || "N/A"}
                      </div>
                      <div className="mt-1">
                        {c.authorName || "Staff/Admin"}: {c.content}
                      </div>
                      {c.createdAt && <div className="mt-1 text-[11px] text-gray-500">{formatDateTime(c.createdAt)}</div>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-500">Chưa có bình luận.</p>
              )}
            </>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs text-gray-600 shadow-sm flex items-center gap-2">
          <Zap size={14} className="text-red-500" /> Luồng đã tối ưu theo vai trò: Giáo viên / Quản lý / Phụ huynh-Học viên.
        </div>
      </div>

      <div className="lg:col-span-3 text-xs text-gray-500 flex items-center gap-2">
        <Users size={12} /> Phụ huynh/học viên chỉ xem các báo cáo đã công bố.
      </div>

      {isTeacher && editModalOpen && displayReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-3">
              <h3 className="text-lg font-semibold">Chỉnh sửa báo cáo tháng</h3>
              <p className="text-sm text-gray-500">
                {displayReport.studentName || displayReport.studentProfileId} •{" "}
                {displayReport.className || displayReport.classId || "N/A"} • {displayReport.month}/{displayReport.year}
              </p>
            </div>
            <textarea
              value={draftInput}
              onChange={(e) => setDraftInput(e.target.value)}
              rows={16}
              placeholder="Nhập nội dung báo cáo..."
              className="w-full rounded-xl border border-red-200 px-3 py-3 text-sm"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="rounded border px-3 py-2 text-sm"
                onClick={() => setEditModalOpen(false)}
              >
                Đóng
              </button>
              <button
                className="rounded bg-cyan-700 px-3 py-2 text-sm text-white disabled:bg-slate-300"
                disabled={!canTeacherSubmit(displayReport.status) || actionLoading[`${displayReport.id}:draft`]}
                onClick={() =>
                  runAction(displayReport.id, "draft", "PUT", {
                    draftContent: draftInput || "",
                  })
                }
              >
                {actionLoading[`${displayReport.id}:draft`] ? "Đang lưu..." : "Lưu nháp"}
              </button>
              <button
                className="rounded bg-indigo-600 px-3 py-2 text-sm text-white disabled:bg-slate-300"
                disabled={
                  !canTeacherSubmit(displayReport.status) ||
                  submitFlowLoading ||
                  actionLoading[`${displayReport.id}:draft`] ||
                  actionLoading[`${displayReport.id}:submit`]
                }
                onClick={handleSubmitFromModal}
              >
                {submitFlowLoading ? "Đang lưu và submit..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
