"use client";

import { useEffect, useState } from "react";
import { Download, Eye, FileCheck, MessageSquare, Search, TrendingUp, User, Zap } from "lucide-react";
import type { ReactNode } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/lightswind/select";

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
  pdfUrl?: string;
  pdfGeneratedAt?: string;
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
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 5;

  const totalPages = Math.ceil(filteredReports.length / PAGE_SIZE);
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredReports.length]);

  const normalizeStatus = (value?: string) => {
    const normalized = String(value ?? "").trim();
    if (normalized === "Review") return "Submitted";
    return normalized;
  };

  const isRejectedReport = normalizeStatus(displayReport?.status) === "Rejected";

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

  const handlePdfAction = async () => {
    if (!displayReport) return;

    if (displayReport.pdfUrl) {
      window.open(displayReport.pdfUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (!isTeacher && !canManage) return;

    await runAction(displayReport.id, "generate-pdf");
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Timeline Steps */}
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
                { step: 1, label: "Xem báo cáo", desc: "Bước 1" },
                { step: 2, label: "Bình luận", desc: "Bước 2" },
                { step: 3, label: "Duyệt", desc: "Bước 3" },
                { step: 4, label: "Công bố", desc: "Bước 4" },
              ].map((item, idx) => (
                <>
                  <div
                    key={item.step}
                    className="group/step flex flex-1 min-w-[100px] items-center gap-2 rounded-xl border border-white/60 bg-white/70 backdrop-blur-md px-3 py-2.5 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:bg-white/90 hover:shadow-lg hover:shadow-red-500/10 hover:border-red-200/50"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white font-bold text-xs shadow-lg shadow-red-500/40 ring-2 ring-red-200">
                      {item.step}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-medium text-red-400">{item.desc}</span>
                      <span className="text-xs font-bold text-gray-800">{item.label}</span>
                    </div>
                  </div>
                  {idx < 3 && (
                    <svg key={`arrow-${item.step}`} className="h-4 w-4 flex-shrink-0 text-amber-400 hidden sm:block drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </>
              ))}
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="rounded-2xl border border-red-200/50 bg-gradient-to-br from-white to-red-50 p-3 transition-all duration-500 hover:shadow-xl hover:shadow-red-200/40">
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative min-w-48 flex-1 max-w-70">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm học sinh..."
                className="w-full rounded-lg border border-red-200 bg-white pl-8 pr-3 py-1.5 text-xs text-gray-700 placeholder-gray-400 focus:border-red-300 focus:outline-none focus:ring-1 focus:ring-red-200 transition-all"
              />
            </div>
            {/* Class filter */}
            <Select
              value={selectedClassId || "all"}
              onValueChange={(val) => {
                const classId = val === "all" ? null : val;
                setSelectedClassId(classId);
                setSelectedStudentId(null);
              }}
            >
              <SelectTrigger className="h-7 rounded-lg border border-red-200 bg-white px-2 text-xs text-gray-700 focus:ring-1 focus:ring-red-200 transition-all w-32 flex-shrink-0">
                <SelectValue placeholder="Tất cả lớp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả lớp</SelectItem>
                {classFilterOptions.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Status filter */}
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val)}>
              <SelectTrigger className="h-7 rounded-lg border border-red-200 bg-white px-2 text-xs text-gray-700 focus:ring-1 focus:ring-red-200 transition-all w-32 flex-shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Tất cả", "Draft", "Submitted", "Approved", "Rejected", "Published", "Review"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Active scope filters */}
            {(selectedClassId || selectedStudentId) && (
              <>
                {selectedClassId && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-red-50 to-red-100 px-2 py-1 text-xs font-medium text-red-700 border border-red-200">
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    {selectedClassName}
                  </span>
                )}
                {selectedStudentId && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-50 to-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {selectedStudentName}
                  </span>
                )}
                <button
                  className="inline-flex items-center gap-1 rounded-full bg-white border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 transition-all cursor-pointer"
                  onClick={clearScopeFilter}
                >
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </>
            )}
            {/* Teacher shortcuts */}
            {isTeacher && (
              <>
                <div className="h-4 w-px bg-red-200 mx-1" />
                {[
                  { label: "Tất cả", value: "Tất cả" },
                  { label: "Cần submit", value: "Draft" },
                  { label: "Cần sửa", value: "Rejected" },
                  { label: "Chờ duyệt", value: "Submitted" },
                ].map((s) => (
                  <button
                    key={s.value}
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                      statusFilter === s.value
                        ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-sm"
                        : "bg-white border border-red-200 text-gray-700 hover:bg-red-50"
                    }`}
                    onClick={() => setStatusFilter(s.value)}
                  >
                    {s.label}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>



        {/* Reports Table */}
        <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 shadow-sm overflow-hidden">
          <div className="border-b border-red-200 bg-gradient-to-r from-red-500/5 to-red-700/5 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Danh sách báo cáo</h3>
              {canManage && selectedReportIds.size > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-gray-500">{selectedReportIds.size} đã chọn</span>
                  <button
                    className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
                    disabled={bulkLoading !== ""}
                    onClick={() => runBulkAction("approve", Array.from(selectedReportIds))}
                  >
                    {bulkLoading === "approve" ? (
                      <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : "Duyệt"}
                  </button>
                  <button
                    className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-3 py-1.5 text-xs font-semibold text-white hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
                    disabled={bulkLoading !== ""}
                    onClick={() => runBulkAction("publish", Array.from(selectedReportIds))}
                  >
                    {bulkLoading === "publish" ? (
                      <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : "Công bố"}
                  </button>
                </div>
              )}
              {loading && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Đang tải...
                </div>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-red-500/5 to-red-700/5 border-b border-red-200">
                <tr className="text-left">
                  {canManage && (
                    <th className="px-6 py-3 text-xs font-semibold text-gray-700 w-12">
                      <input
                        type="checkbox"
                        checked={selectedReportIds.size > 0 && selectedReportIds.size === filteredReports.length}
                        onChange={() => {
                          if (selectedReportIds.size > 0) {
                            clearSelection();
                          } else {
                            selectAllVisible();
                          }
                        }}
                        disabled={!filteredReports.length}
                        title="Chọn tất cả báo cáo đang lọc"
                        className="h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-200 cursor-pointer"
                      />
                    </th>
                  )}
                  <th className="px-6 py-3 text-xs font-semibold text-gray-700">Báo cáo</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-700">Giáo viên</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-700">Trạng thái</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-700">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {paginatedReports.map((report) => (
                  <tr
                    key={report.id}
                    className="group hover:bg-gradient-to-r hover:from-red-50/50 hover:to-white transition-all duration-200 cursor-pointer"
                    onClick={() => setActiveReportId(report.id)}
                  >
                    {canManage && (
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedReportIds.has(report.id)}
                          onChange={() => toggleReportSelection(report.id)}
                          className="h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-200 cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {report.studentName || report.studentProfileId || report.id}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {report.className || report.classId || "N/A"} • {report.month}/{report.year}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-1.5 text-sm text-gray-700">
                        <User size={14} className="text-gray-400" />
                        {report.teacherName || "Teacher"}
                      </div>
                    </td>
                    <td className="px-6 py-4">{renderStatusBadge(report.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600 cursor-pointer"
                          onClick={() => {
                            setActiveReportId(report.id);
                            setDetailModalOpen(true);
                          }}
                          title="Xem chi tiết"
                        >
                          <Eye size={14} />
                        </button>
                        {isTeacher && (
                          <button
                            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600 cursor-pointer"
                            onClick={() => {
                              setActiveReportId(report.id);
                              setEditModalOpen(true);
                            }}
                            title="Chỉnh sửa"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        {isTeacher && (
                          <button
                            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600 cursor-pointer disabled:opacity-50"
                            disabled={actionLoading[`${report.id}:generate-draft`]}
                            onClick={() => runAction(report.id, "generate-draft")}
                            title="Tạo bằng AI"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </button>
                        )}
                        {isTeacher && (
                          <button
                            disabled={!canTeacherSubmit(report.status)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${
                              canTeacherSubmit(report.status) 
                                ? "hover:bg-red-50 text-gray-400 hover:text-red-600" 
                                : "text-gray-300"
                            }`}
                            onClick={() => runAction(report.id, "submit")}
                            title={normalizeStatus(report.status) === "Rejected" ? "Submit lại" : "Submit"}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        )}
                        {canManage && (
                          <button 
                            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600 cursor-pointer"
                            onClick={() => openCommentDialog(report.id)}
                            title="Thêm bình luận"
                          >
                            <MessageSquare size={14} />
                          </button>
                        )}
                        {canManage && (
                          <button
                            disabled={!canManagementApprove(report.status)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${
                              canManagementApprove(report.status) 
                                ? "hover:bg-emerald-50 text-gray-400 hover:text-emerald-600" 
                                : "text-gray-300"
                            }`}
                            onClick={() => runAction(report.id, "approve")}
                            title="Duyệt"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        )}
                        {canManage && (
                          <button
                            disabled={!canManagementPublish(report.status)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${
                              canManagementPublish(report.status) 
                                ? "hover:bg-red-50 text-gray-400 hover:text-red-600" 
                                : "text-gray-300"
                            }`}
                            onClick={() => runAction(report.id, "publish")}
                            title="Công bố"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {paginatedReports.length === 0 && (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-red-100 to-red-200 flex items-center justify-center">
                  <Search size={24} className="text-red-400" />
                </div>
                <div className="text-gray-600 font-medium">Không có báo cáo phù hợp</div>
                <div className="text-sm text-gray-500 mt-1">Thử thay đổi bộ lọc để tìm kết quả khác</div>
              </div>
            )}
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-red-200 bg-gradient-to-r from-red-500/5 to-red-700/5 px-6 py-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-gray-500">
                Hiển thị {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredReports.length)} / {filteredReports.length} báo cáo
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-red-200 bg-white text-gray-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-[2rem] h-8 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      page === currentPage
                        ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-sm"
                        : "border border-red-200 bg-white text-gray-600 hover:bg-red-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-red-200 bg-white text-gray-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Report Detail Section */}
        <div className="rounded-2xl border border-red-200/50 bg-gradient-to-br from-white to-red-50 p-5 transition-all duration-500 hover:shadow-xl hover:shadow-red-200/40">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white shadow-sm">
              <FileCheck size={18} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Chi tiết báo cáo</h3>
          </div>
          {displayReport ? (
            <div className="space-y-3">
              {detailLoading && (
                <div className="flex items-center justify-center py-4">
                  <svg className="w-5 h-5 animate-spin text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              )}
              {detailError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {detailError}
                </div>
              )}
              <div className="font-semibold text-gray-900 text-base">
                {displayReport.studentName || displayReport.studentProfileId}
              </div>
              <div className="text-sm text-gray-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {displayReport.className || displayReport.classId || "N/A"}
              </div>
              <div>{renderStatusBadge(displayReport.status)}</div>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <User size={12} />
                Teacher: {displayReport.teacherName || "N/A"}
              </div>
              
              {isTeacher && (
                <>
                  <button
                    disabled={!canTeacherSubmit(displayReport.status)}
                    className="w-full rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() =>
                      runAction(displayReport.id, "draft", "PUT", {
                        draftContent: draftInput || "",
                      })
                    }
                  >
                    {actionLoading[`${displayReport.id}:draft`] ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Đang lưu...
                      </span>
                    ) : (
                      "Update Draft (manual)"
                    )}
                  </button>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-700">Nội dung nháp (có thể edit)</label>
                    <textarea
                      value={draftInput}
                      readOnly
                      rows={5}
                      placeholder="Nhấp để mở popup chỉnh sửa..."
                      onClick={() => setEditModalOpen(true)}
                      className="w-full rounded-xl border border-red-200 bg-white/50 px-3 py-2 text-sm cursor-pointer hover:border-red-300 transition-colors"
                    />
                    <button
                      className="w-full rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-red-100 px-4 py-2.5 text-sm font-medium text-red-700 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => setEditModalOpen(true)}
                    >
                      Mở popup chỉnh sửa
                    </button>
                  </div>
                  <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-amber-50 p-3">
                    <div className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-1">
                      <MessageSquare size={14} />
                      Góp ý từ Staff/Admin
                    </div>
                    {isRejectedReport && (
                      <p className="mb-3 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm text-rose-700 flex items-start gap-2">
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Báo cáo này đã bị trả về. Hãy cập nhật nội dung theo góp ý rồi bấm <b>Submit lại</b>.
                      </p>
                    )}
                    {displayReport.comments?.length ? (
                      <ul className="space-y-2 max-h-64 overflow-auto">
                        {(displayReport.comments ?? []).slice().reverse().map((c) => (
                          <li key={c.id} className="rounded-lg border border-amber-100 bg-white p-3">
                            <div className="font-medium text-gray-900 text-sm">{c.authorName || c.commenterName || "Staff/Admin"}</div>
                            <div className="mt-1 text-sm text-gray-700 whitespace-pre-line">{c.content}</div>
                            {c.createdAt && <div className="mt-2 text-xs text-gray-500">{formatDateTime(c.createdAt)}</div>}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-600">Chưa có góp ý.</p>
                    )}
                  </div>
                </>
              )}
              <button
                disabled={
                  !displayReport ||
                  actionLoading[`${displayReport.id}:generate-pdf`] ||
                  (!displayReport.pdfUrl && !isTeacher && !canManage)
                }
                onClick={handlePdfAction}
                className="w-full rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-red-50 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                <Download size={14} />
                {displayReport && actionLoading[`${displayReport.id}:generate-pdf`]
                  ? "Đang tạo PDF..."
                  : displayReport?.pdfUrl
                    ? "Xem PDF"
                    : isTeacher || canManage
                      ? "Tạo PDF"
                      : "Chưa có PDF"}
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
                <FileCheck size={24} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">Chọn report để xem chi tiết</p>
            </div>
          )}
        </div>

        {/* Job Progress */}
        {canManage && (
          <div className="rounded-2xl border border-red-200/50 bg-gradient-to-br from-white to-red-50 p-5 transition-all duration-500 hover:shadow-xl hover:shadow-red-200/40">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm">
                <TrendingUp size={18} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Tiến độ đợt báo cáo</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Đợt báo cáo tháng {month}/{year}: <span className="font-semibold text-red-600">{jobs.length}</span>
            </p>
            <div className="space-y-2 max-h-48 overflow-auto">
              {jobs.map((job) => (
                <div key={job.id} className="rounded-lg border border-red-200 bg-white p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {job.month}/{job.year}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                      job.status === "Active" 
                        ? "bg-gradient-to-r from-emerald-50 to-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-gradient-to-r from-gray-50 to-slate-50 text-gray-600 border border-gray-200"
                    }`}>
                      {job.status}
                    </span>
                  </div>
                  <button
                    className="w-full rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-3 py-2 text-xs font-semibold text-white hover:shadow-md transition-all cursor-pointer"
                    onClick={() => apiFetch(`/api/monthly-reports/jobs/${job.id}/aggregate`, { method: "POST" }).then(fetchData)}
                  >
                    Đồng bộ dữ liệu
                  </button>
                </div>
              ))}
              {jobs.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">Chưa có đợt báo cáo</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Comments */}
        <div className="rounded-2xl border border-red-200/50 bg-gradient-to-br from-white to-red-50 p-5 transition-all duration-500 hover:shadow-xl hover:shadow-red-200/40">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white shadow-sm">
                <MessageSquare size={18} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Bình luận gần nhất</h3>
            </div>
            <button
              className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 transition-all cursor-pointer"
              onClick={() => setShowRecentComments((prev) => !prev)}
            >
              {showRecentComments ? (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  Thu gọn
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  Mở
                </>
              )}
            </button>
          </div>
          {!showRecentComments && (
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Thu gọn để giảm chiều dài trang. Bấm Mở để xem chi tiết bình luận.
            </p>
          )}
          {showRecentComments && (
            <>
              {recentCommentsLoading && (
                <div className="flex justify-center py-4">
                  <svg className="w-5 h-5 animate-spin text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              )}
              {!recentCommentsLoading && recentComments.length ? (
                <ul className="space-y-2 max-h-64 overflow-auto">
                  {recentComments.slice(0, 3).map((c) => (
                    <li
                      key={c.id}
                      className="rounded-xl border border-red-200 bg-white p-3 cursor-pointer hover:shadow-md transition-all hover:border-red-300"
                      onClick={() => openReportFromComment(c.reportId)}
                    >
                      <div className="font-medium text-gray-900 text-sm flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        {c.studentName || "Học viên"} • {c.className || "N/A"}
                      </div>
                      <div className="mt-1 text-sm text-gray-700">
                        <span className="font-medium text-red-600">{c.authorName || "Staff/Admin"}:</span> {c.content}
                      </div>
                      {c.createdAt && (
                        <div className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatDateTime(c.createdAt)}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-6">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-sm text-gray-500">Chưa có bình luận</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Info Footer */}
        {/* <div className="rounded-xl border border-red-200 bg-gradient-to-r from-red-50/40 to-red-100/20 p-4 text-sm text-gray-700 flex items-center gap-2">
          <Zap size={14} className="text-red-600 flex-shrink-0" />
          <span>Luồng đã tối ưu theo vai trò: Giáo viên / Quản lý / Phụ huynh-Học viên.</span>
        </div>
        
        <div className="text-xs text-gray-500 flex items-center gap-2">
          <Users size={12} />
          Phụ huynh/học viên chỉ xem các báo cáo đã công bố.
        </div> */}
      </div>

      {/* Edit Modal */}
      {isTeacher && editModalOpen && displayReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white border border-red-200 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
              <h3 className="text-lg font-semibold text-white">Chỉnh sửa báo cáo tháng</h3>
              <p className="text-sm text-red-100 mt-1">
                {displayReport.studentName || displayReport.studentProfileId} •{" "}
                {displayReport.className || displayReport.classId || "N/A"} • {displayReport.month}/{displayReport.year}
              </p>
            </div>
            <div className="p-6">
              <textarea
                value={draftInput}
                onChange={(e) => setDraftInput(e.target.value)}
                rows={16}
                placeholder="Nhập nội dung báo cáo..."
                className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-gray-700 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200 transition-all"
              />
            </div>
            <div className="border-t border-red-200 bg-red-50/50 px-6 py-4 flex items-center justify-between gap-3">
              <button
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={actionLoading[`${displayReport.id}:generate-draft`]}
                onClick={() => runAction(displayReport.id, "generate-draft")}
              >
                {actionLoading[`${displayReport.id}:generate-draft`] ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Đang tạo AI...
                  </span>
                ) : (
                  <>
                    <Zap size={15} />
                    AI tạo nháp
                  </>
                )}
              </button>
              <div className="flex items-center gap-3">
                <button
                  className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 transition-all cursor-pointer"
                  onClick={() => setEditModalOpen(false)}
                >
                  Đóng
                </button>
                <button
                  className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!canTeacherSubmit(displayReport.status) || actionLoading[`${displayReport.id}:draft`]}
                  onClick={() =>
                    runAction(displayReport.id, "draft", "PUT", {
                      draftContent: draftInput || "",
                    })
                  }
                >
                  {actionLoading[`${displayReport.id}:draft`] ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Đang lưu...
                    </span>
                  ) : (
                    "Lưu nháp"
                  )}
                </button>
                <button
                  className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={
                    !canTeacherSubmit(displayReport.status) ||
                    submitFlowLoading ||
                    actionLoading[`${displayReport.id}:draft`] ||
                    actionLoading[`${displayReport.id}:submit`]
                  }
                  onClick={handleSubmitFromModal}
                >
                  {submitFlowLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Đang lưu và submit...
                    </span>
                  ) : (
                    isRejectedReport ? "Submit lại" : "Submit"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
