"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/lightswind/select";

type ManagementClass = { id: string; name: string; reportCount: number };
type ManagementStudent = { id: string; name: string; reportCount: number };
type ClassProgress = {
  id: string;
  name: string;
  total: number;
  published: number;
  approved: number;
  pending: number;
};

type ReportLite = { id: string; classId?: string };

type Props = {
  classQuery: string;
  setClassQuery: (value: string) => void;
  selectedClassId: string | null;
  selectedStudentId: string | null;
  managementClasses: ManagementClass[];
  managementStudents: ManagementStudent[];
  managementClassProgress: ClassProgress[];
  reports: ReportLite[];
  bulkLoading: string;
  setActiveTab: (tab: "reports") => void;
  syncScopeToReports: (classId: string | null, studentId: string | null, openReports?: boolean) => void;
  runBulkAction: (action: "approve" | "publish", ids: string[]) => void;
};

export default function ManageToolsTab({
  classQuery,
  setClassQuery,
  selectedClassId,
  selectedStudentId,
  managementClasses,
  managementStudents,
  managementClassProgress,
  reports,
  bulkLoading,
  setActiveTab,
  syncScopeToReports,
  runBulkAction,
}: Props) {
  // Tính tổng thể
  const totalStats = managementClassProgress.reduce(
    (acc, item) => ({
      total: acc.total + item.total,
      published: acc.published + item.published,
      approved: acc.approved + item.approved,
      pending: acc.pending + item.pending,
    }),
    { total: 0, published: 0, approved: 0, pending: 0 }
  );

  const overallPercentage = totalStats.total > 0 ? (totalStats.published / totalStats.total) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Progress Section - Creative & Beautiful Design */}
      <div className="rounded-xl bg-gradient-to-br from-white to-red-50 transition-all duration-500 hover:shadow-xl hover:shadow-red-200/40 border border-red-100 p-5">
        {/* Header với tổng quan */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-500 to-red-500 blur-lg opacity-30"></div>
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-red-500 text-white shadow-md">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Tiến độ báo cáo</h3>
                <p className="text-xs text-gray-500">Tổng quan tình hình các lớp</p>
              </div>
            </div>
            <div className="rounded-lg bg-gradient-to-r from-amber-100 to-red-100 px-3 py-1.5 shadow-inner">
              <span className="text-xs font-semibold text-gray-700">
                Hoàn thành: <span className="text-emerald-600">{Math.round(overallPercentage)}%</span>
              </span>
            </div>
          </div>

          {/* Overall Progress Ring */}
          <div className="mb-5 flex items-center justify-center gap-6">
            <div className="relative">
              <svg className="h-20 w-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="6"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 32}`}
                  strokeDashoffset={`${2 * Math.PI * 32 * (1 - overallPercentage / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-gray-800">{Math.round(overallPercentage)}%</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                <span className="text-xs text-gray-600">Đã công bố: <strong className="text-emerald-700">{totalStats.published}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                <span className="text-xs text-gray-600">Đã duyệt: <strong className="text-red-700">{totalStats.approved}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                <span className="text-xs text-gray-600">Chờ xử lý: <strong className="text-amber-700">{totalStats.pending}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Class Cards Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 max-h-[400px] overflow-auto pr-1">
          {managementClassProgress.map((item, idx) => {
            const completed = item.total > 0 && item.published === item.total;
            const percentage = item.total > 0 ? (item.published / item.total) * 100 : 0;
            const progressColor = completed ? "from-emerald-400 to-emerald-600" : "from-amber-400 to-red-500";

            return (
              <div
                key={item.id}
                onClick={() => {
                  syncScopeToReports(item.id, null, false);
                  setActiveTab("reports");
                }}
                className="group relative overflow-hidden rounded-xl bg-white border border-gray-100 p-4 transition-all duration-300 hover:shadow-lg hover:border-red-200 hover:-translate-y-0.5 cursor-pointer"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Decorative background */}
                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br from-red-100 to-amber-100 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>

                <div className="relative">
                  {/* Header */}
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`h-2 w-2 rounded-full ${completed ? "bg-emerald-500" : "bg-amber-500"} animate-pulse`}></div>
                        <h4 className="font-semibold text-gray-800 truncate">{item.name}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${completed
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                          }`}>
                          {completed ? (
                            <>
                              <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                              Hoàn thành
                            </>
                          ) : (
                            <>
                              <svg className="h-2.5 w-2.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Đang thực hiện
                            </>
                          )}
                        </span>
                        <span className="text-[10px] text-gray-400">{item.total} báo cáo</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-800">{Math.round(percentage)}%</div>
                      <div className="text-[9px] text-gray-400">tiến độ</div>
                      <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="inline-flex items-center gap-1 text-[9px] text-red-500 font-medium">
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Xem
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar với animation */}
                  <div className="mb-3">
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r ${progressColor} transition-all duration-1000 ease-out`}
                        style={{ width: `${percentage}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid với icons */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-emerald-50/50 p-1.5 text-center transition-all hover:bg-emerald-50">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <svg className="h-3 w-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-bold text-emerald-700">{item.published}</span>
                      </div>
                      <div className="text-[9px] text-emerald-600">Đã CB</div>
                    </div>
                    <div className="rounded-lg bg-red-50/50 p-1.5 text-center transition-all hover:bg-red-50">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <svg className="h-3 w-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-bold text-red-700">{item.approved}</span>
                      </div>
                      <div className="text-[9px] text-red-600">Đã DV</div>
                    </div>
                    <div className="rounded-lg bg-amber-50/50 p-1.5 text-center transition-all hover:bg-amber-50">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <svg className="h-3 w-3 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-bold text-amber-700">{item.pending}</span>
                      </div>
                      <div className="text-[9px] text-amber-600">Chờ</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {!managementClassProgress.length && (
            <div className="col-span-full py-12 text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
                <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-500">Chưa có dữ liệu</p>
              <p className="text-xs text-gray-400">Không có báo cáo nào trong tháng này</p>
            </div>
          )}
        </div>
      </div>

      {/* 2-Column Layout for Filter & Quick Actions */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Filter Section */}
        <div className="rounded-xl border border-red-100 bg-gradient-to-br from-white to-red-50 p-5 transition-all duration-500 hover:shadow-xl hover:shadow-red-200/40">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-red-600 text-white">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Lọc báo cáo</h3>
            </div>
            <button
              onClick={() => setActiveTab("reports")}
              disabled={!selectedClassId && !selectedStudentId}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-3 py-1.5 text-xs font-semibold cursor-pointer text-white transition-all hover:shadow-md disabled:opacity-50"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Xem báo cáo
            </button>
          </div>

          <div className="relative mb-3">
            <input
              value={classQuery}
              onChange={(e) => setClassQuery(e.target.value)}
              placeholder="Tìm lớp học..."
              className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 pl-8 text-sm text-gray-700 placeholder:text-gray-400 focus:border-red-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-200"
            />
            <svg className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {/* Class Select - Using lightswind Select */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600">Lớp học</span>
                <span className="text-xs text-red-600">{managementClasses.length}</span>
              </div>
              <Select
                value={selectedClassId || ""}
                onValueChange={(val) => syncScopeToReports(val || null, null, false)}
              >
                <SelectTrigger className="w-full rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:ring-2 focus:ring-red-200">
                  <SelectValue placeholder="Chọn lớp học" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">-- Chọn lớp học --</SelectItem>
                  {managementClasses.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate">{item.name}</span>
                        <span className="ml-2 text-xs text-gray-400">({item.reportCount})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Student Select - Using lightswind Select */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600">Học viên</span>
                {selectedClassId && (
                  <span className="text-xs text-red-600">{managementStudents.length}</span>
                )}
              </div>
              <Select
                value={selectedStudentId || ""}
                onValueChange={(val) => syncScopeToReports(selectedClassId, val || null, false)}
                disabled={!selectedClassId}
              >
                <SelectTrigger className="w-full rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:ring-2 focus:ring-red-200 disabled:bg-gray-100 disabled:cursor-not-allowed">
                  <SelectValue placeholder={selectedClassId ? "Chọn học viên" : "Chọn lớp trước"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">-- Tất cả học viên --</SelectItem>
                  {managementStudents.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate">{item.name}</span>
                        <span className="ml-2 text-xs text-gray-400">({item.reportCount})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!selectedClassId && (
                <p className="text-[10px] text-gray-400 mt-1">* Chọn lớp trước khi chọn học viên</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions - Compact */}
        <div className="rounded-xl border border-red-100 bg-gradient-to-br from-white to-red-50 p-5 transition-all duration-500 hover:shadow-xl hover:shadow-red-200/40">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900">Hành động nhanh</h3>
          </div>

          <div className="mb-3 rounded-lg bg-gradient-to-r from-amber-50 to-red-50 p-2.5 border border-amber-200">
            <div className="flex items-center gap-2 text-xs text-amber-800">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-200">
                <svg className="h-3 w-3 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span>Đang chọn lớp: <strong className="font-semibold">{selectedClassId ? managementClasses.find(c => c.id === selectedClassId)?.name || "Đã chọn" : "Chưa có"}</strong></span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              disabled={!selectedClassId || bulkLoading !== ""}
              onClick={() => {
                const classIds = reports.filter((report) => report.classId === selectedClassId).map((report) => report.id);
                runBulkAction("approve", classIds);
              }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-2 cursor-pointer text-xs font-semibold text-white transition-all hover:shadow-md disabled:opacity-50"
            >
              {bulkLoading === "approve" ? (
                <>
                  <svg className="h-3 w-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Đang xử lý
                </>
              ) : (
                <>
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Duyệt tất cả
                </>
              )}
            </button>
            <button
              disabled={!selectedClassId || bulkLoading !== ""}
              onClick={() => {
                const classIds = reports.filter((report) => report.classId === selectedClassId).map((report) => report.id);
                runBulkAction("publish", classIds);
              }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-3 py-2 cursor-pointer text-xs font-semibold text-white transition-all hover:shadow-md disabled:opacity-50"
            >
              {bulkLoading === "publish" ? (
                <>
                  <svg className="h-3 w-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Đang xử lý
                </>
              ) : (
                <>
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  Công bố tất cả
                </>
              )}
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] text-gray-400">
            Áp dụng cho toàn bộ {reports.filter(r => r.classId === selectedClassId).length} báo cáo trong lớp
          </p>
        </div>
      </div>
    </div>
  );
}
