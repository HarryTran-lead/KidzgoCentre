"use client";

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
  month: number;
  year: number;
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
  month,
  year,
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
  return (
    <div className="space-y-6">
      {/* Hướng dẫn cho quản lý */}
      <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 p-5 shadow-sm transition-all duration-300 hover:shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Hướng dẫn cho quản lý</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          1) Xem báo cáo đã nộp → 2) Bình luận nếu cần chỉnh sửa → 3) Duyệt khi đạt yêu cầu → 4) Công bố.
        </p>
        <div className="rounded-xl border border-red-200 bg-gradient-to-r from-red-50/40 to-red-100/20 p-4 text-sm text-gray-700">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Nếu cần góp ý: dùng nút Comment để gửi phản hồi. Chỉ công bố sau khi đã duyệt.</span>
          </div>
        </div>
      </div>

      {/* Lọc theo lớp/học viên */}
      <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 p-5 shadow-sm transition-all duration-300 hover:shadow-md">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Lọc theo lớp/học viên</h3>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 mb-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Tìm lớp</label>
            <div className="relative">
              <input
                value={classQuery}
                onChange={(e) => setClassQuery(e.target.value)}
                placeholder="Nhập tên lớp..."
                className="w-full rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-200 transition-all"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div className="flex items-center">
            <div className="rounded-xl bg-gradient-to-r from-red-50 to-red-100/50 px-4 py-2.5 text-sm text-gray-700">
              Đang xem thời gian: <span className="font-semibold text-red-600">{month}/{year}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Danh sách lớp */}
          <div className="rounded-xl border border-red-200 bg-white/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">
                Danh sách lớp
              </div>
              <span className="inline-flex items-center rounded-full bg-gradient-to-r from-red-50 to-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 border border-red-200">
                {managementClasses.length}
              </span>
            </div>
            <div className="max-h-48 space-y-2 overflow-auto">
              {managementClasses.map((item) => (
                <button
                  key={item.id}
                  onClick={() => syncScopeToReports(item.id, null, false)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-all duration-200 ${
                    selectedClassId === item.id 
                      ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md" 
                      : "bg-gradient-to-r from-red-50 to-red-100/50 text-gray-700 hover:bg-red-100"
                  }`}
                >
                  <div className="font-medium">{item.name}</div>
                  <div className={`text-xs mt-1 ${selectedClassId === item.id ? "text-red-100" : "text-gray-500"}`}>
                    {item.reportCount} báo cáo
                  </div>
                </button>
              ))}
              {!managementClasses.length && (
                <p className="text-center text-sm text-gray-500 py-4">Chưa có lớp phù hợp.</p>
              )}
            </div>
          </div>

          {/* Danh sách học sinh */}
          <div className="rounded-xl border border-red-200 bg-white/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">
                Danh sách học sinh
              </div>
              {selectedClassId && (
                <span className="inline-flex items-center rounded-full bg-gradient-to-r from-red-50 to-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 border border-red-200">
                  {managementStudents.length}
                </span>
              )}
            </div>
            <div className="max-h-48 space-y-2 overflow-auto">
              {managementStudents.map((item) => (
                <button
                  key={item.id}
                  onClick={() => syncScopeToReports(selectedClassId, item.id)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-all duration-200 ${
                    selectedStudentId === item.id 
                      ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md" 
                      : "bg-gradient-to-r from-red-50 to-red-100/50 text-gray-700 hover:bg-red-100"
                  }`}
                >
                  <div className="font-medium">{item.name}</div>
                  <div className={`text-xs mt-1 ${selectedStudentId === item.id ? "text-red-100" : "text-gray-500"}`}>
                    {item.reportCount} báo cáo
                  </div>
                </button>
              ))}
              {selectedClassId && !managementStudents.length && (
                <p className="text-center text-sm text-gray-500 py-4">Lớp này chưa có báo cáo.</p>
              )}
              {!selectedClassId && (
                <p className="text-center text-sm text-gray-500 py-4">Vui lòng chọn lớp trước.</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end mt-4">
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setActiveTab("reports")}
            disabled={!selectedClassId && !selectedStudentId}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Xem danh sách báo cáo theo bộ lọc đã chọn
          </button>
        </div>
      </div>

      {/* Hành động nhanh theo lớp */}
      <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 p-5 shadow-sm transition-all duration-300 hover:shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Hành động nhanh theo lớp</h3>
        </div>
        
        <div className="flex flex-wrap gap-3 mb-3">
          <button
            disabled={!selectedClassId || bulkLoading !== ""}
            onClick={() => {
              const classIds = reports.filter((report) => report.classId === selectedClassId).map((report) => report.id);
              runBulkAction("approve", classIds);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {bulkLoading === "approve" ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Đang duyệt lớp...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Duyệt lớp
              </>
            )}
          </button>
          <button
            disabled={!selectedClassId || bulkLoading !== ""}
            onClick={() => {
              const classIds = reports.filter((report) => report.classId === selectedClassId).map((report) => report.id);
              runBulkAction("publish", classIds);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {bulkLoading === "publish" ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Đang công bố lớp...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                Công bố lớp
              </>
            )}
          </button>
        </div>
        <p className="text-sm text-gray-600 flex items-center gap-1">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Chọn lớp ở trên để duyệt/công bố toàn bộ báo cáo của lớp đó.
        </p>
      </div>

      {/* Tiến độ báo cáo theo lớp */}
      <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 p-5 shadow-sm transition-all duration-300 hover:shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Tiến độ báo cáo theo lớp</h3>
        </div>
        
        <p className="text-sm text-gray-600 mb-4 flex items-center gap-1">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Tổng hợp theo báo cáo tháng {month}/{year}. Hoàn thành khi tất cả báo cáo trong lớp đã Publish.
        </p>
        
        <div className="max-h-64 space-y-3 overflow-auto">
          {managementClassProgress.map((item) => {
            const completed = item.total > 0 && item.published === item.total;
            const percentage = item.total > 0 ? (item.published / item.total) * 100 : 0;
            
            return (
              <div key={item.id} className="rounded-xl border border-red-200 bg-white/50 p-4 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold text-gray-900">{item.name}</div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                      completed 
                        ? "bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border border-emerald-200" 
                        : "bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {completed ? (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    <span>{completed ? "Đã hoàn thành" : "Chưa hoàn thành"}</span>
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Tiến độ</span>
                    <span>{Math.round(percentage)}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${
                        completed ? "from-emerald-500 to-emerald-600" : "from-amber-500 to-amber-600"
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">{item.total}</div>
                    <div className="text-gray-500">Tổng</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-emerald-600">{item.published}</div>
                    <div className="text-gray-500">Published</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-red-600">{item.approved}</div>
                    <div className="text-gray-500">Approved</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-amber-600">{item.pending}</div>
                    <div className="text-gray-500">Chờ xử lý</div>
                  </div>
                </div>
              </div>
            );
          })}
          {!managementClassProgress.length && (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm text-gray-500">Chưa có dữ liệu báo cáo trong tháng này.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}