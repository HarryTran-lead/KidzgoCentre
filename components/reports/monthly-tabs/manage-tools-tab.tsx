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
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <h3 className="font-semibold">Hướng dẫn cho quản lý</h3>
        <p className="text-xs text-gray-600">
          1) Xem báo cáo đã nộp &rarr; 2) Bình luận nếu cần chỉnh sửa &rarr; 3) Duyệt khi đạt yêu cầu &rarr; 4) Công bố.
        </p>
        <div className="rounded-xl border border-red-100 bg-red-50/40 p-3 text-xs text-gray-700">
          Nếu cần góp ý: dùng nút Comment để gửi phản hồi. Chỉ công bố sau khi đã duyệt.
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        <h3 className="font-semibold">Lọc theo lớp/học viên</h3>
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
            Đang xem thời gian: <span className="font-semibold">{month}/{year}</span>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-red-100 p-3">
            <div className="mb-2 text-xs font-semibold text-gray-700">
              Danh sách lớp ({managementClasses.length})
            </div>
            <div className="max-h-40 space-y-1 overflow-auto">
              {managementClasses.map((item) => (
                <button
                  key={item.id}
                  onClick={() => syncScopeToReports(item.id, null, false)}
                  className={`w-full rounded-lg px-2 py-2 text-left text-xs ${
                    selectedClassId === item.id ? "bg-red-600 text-white" : "bg-red-50 text-gray-700"
                  }`}
                >
                  <div className="font-medium">{item.name}</div>
                  <div>{item.reportCount} báo cáo</div>
                </button>
              ))}
              {!managementClasses.length && (
                <p className="text-xs text-gray-500">Chưa có lớp phù hợp.</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-red-100 p-3">
            <div className="mb-2 text-xs font-semibold text-gray-700">
              Danh sách học sinh {selectedClassId ? `(${managementStudents.length})` : ""}
            </div>
            <div className="max-h-40 space-y-1 overflow-auto">
              {managementStudents.map((item) => (
                <button
                  key={item.id}
                  onClick={() => syncScopeToReports(selectedClassId, item.id)}
                  className={`w-full rounded-lg px-2 py-2 text-left text-xs ${
                    selectedStudentId === item.id ? "bg-indigo-600 text-white" : "bg-indigo-50 text-gray-700"
                  }`}
                >
                  <div className="font-medium">{item.name}</div>
                  <div>{item.reportCount} báo cáo</div>
                </button>
              ))}
              {selectedClassId && !managementStudents.length && (
                <p className="text-xs text-gray-500">Lớp này chưa có báo cáo.</p>
              )}
              {!selectedClassId && (
                <p className="text-xs text-gray-500">Vui lòng chọn lớp trước.</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50"
            onClick={() => setActiveTab("reports")}
            disabled={!selectedClassId && !selectedStudentId}
          >
            Xem danh sách báo cáo theo bộ lọc đã chọn
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <h3 className="font-semibold">Hành động nhanh theo lớp</h3>
        <div className="flex flex-wrap gap-2">
          <button
            disabled={!selectedClassId || bulkLoading !== ""}
            className="rounded bg-emerald-600 px-3 py-2 text-xs text-white disabled:bg-slate-300"
            onClick={() => {
              const classIds = reports.filter((report) => report.classId === selectedClassId).map((report) => report.id);
              runBulkAction("approve", classIds);
            }}
          >
            {bulkLoading === "approve" ? "Đang duyệt lớp..." : "Duyệt lớp"}
          </button>
          <button
            disabled={!selectedClassId || bulkLoading !== ""}
            className="rounded bg-sky-600 px-3 py-2 text-xs text-white disabled:bg-slate-300"
            onClick={() => {
              const classIds = reports.filter((report) => report.classId === selectedClassId).map((report) => report.id);
              runBulkAction("publish", classIds);
            }}
          >
            {bulkLoading === "publish" ? "Đang công bố lớp..." : "Công bố lớp"}
          </button>
        </div>
        <p className="text-xs text-gray-600">
          Chọn lớp ở trên để duyệt/công bố toàn bộ báo cáo của lớp đó.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <h3 className="font-semibold">Tiến độ báo cáo theo lớp</h3>
        <p className="text-xs text-gray-600">
          Tổng hợp theo báo cáo tháng {month}/{year}. Hoàn thành khi tất cả báo cáo trong lớp đã Publish.
        </p>
        <div className="max-h-48 space-y-2 overflow-auto">
          {managementClassProgress.map((item) => {
            const completed = item.total > 0 && item.published === item.total;
            return (
              <div key={item.id} className="rounded-lg border p-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{item.name}</div>
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] ${
                      completed ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {completed ? "Đã hoàn thành" : "Chưa hoàn thành"}
                  </span>
                </div>
                <div className="mt-1 text-gray-600">
                  Tổng: {item.total} • Published: {item.published} • Approved: {item.approved} • Chờ xử lý:{" "}
                  {item.pending}
                </div>
              </div>
            );
          })}
          {!managementClassProgress.length && (
            <p className="text-xs text-gray-500">Chưa có dữ liệu báo cáo trong tháng này.</p>
          )}
        </div>
      </div>
    </div>
  );
}
