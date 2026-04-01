"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, ChevronLeft, ChevronRight, Clock3, RefreshCcw } from "lucide-react";
import { fetchStudentAttendanceHistory } from "@/app/api/teacher/attendance";
import type { AttendanceRawStatus, StudentAttendanceHistoryItem } from "@/types/teacher/attendance";

const STATUS_LABELS: Record<AttendanceRawStatus, string> = {
  Present: "Co mat",
  Absent: "Vang mat",
  Makeup: "Hoc bu",
  NotMarked: "Chua diem danh",
};

const STATUS_CLASSES: Record<AttendanceRawStatus, string> = {
  Present: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Absent: "border-red-200 bg-red-50 text-red-700",
  Makeup: "border-sky-200 bg-sky-50 text-sky-700",
  NotMarked: "border-amber-200 bg-amber-50 text-amber-700",
};

const ABSENCE_TYPE_LABELS: Record<string, string> = {
  WithNotice24H: "Bao truoc >= 24h",
  Under24H: "Bao truoc < 24h",
  NoNotice: "Khong bao truoc",
  LongTerm: "Nghi dai han",
};

function getHistoryTitle(item: StudentAttendanceHistoryItem) {
  const sessionName = String(item.sessionName ?? "").trim();
  if (sessionName) return sessionName;

  const className = String(item.className ?? "").trim();
  if (className) return className;

  const sessionId = String(item.sessionId ?? "").trim();
  if (sessionId) return `Buoi hoc ${sessionId.slice(0, 8)}`;

  return "Buoi hoc";
}

function getAbsenceTypeLabel(value?: string | null) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return null;
  return ABSENCE_TYPE_LABELS[normalized] ?? normalized;
}

function HistoryRow({ item }: { item: StudentAttendanceHistoryItem }) {
  const status = item.attendanceStatus ?? "NotMarked";
  const absenceTypeLabel = getAbsenceTypeLabel(item.absenceType);

  return (
    <tr className="border-b border-gray-100">
      <td className="px-5 py-4">
        <div className="font-semibold text-gray-900">{getHistoryTitle(item)}</div>
        <div className="text-xs text-gray-500">{item.className ?? item.sessionId ?? "-"}</div>
      </td>
      <td className="px-5 py-4 text-sm text-gray-700">
        <div>{item.date ?? "-"}</div>
        <div className="text-xs text-gray-500">{item.startTime ?? "-"}</div>
      </td>
      <td className="px-5 py-4">
        <div className="flex flex-col gap-2">
          <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_CLASSES[status]}`}>
            {STATUS_LABELS[status]}
          </span>
          {absenceTypeLabel ? <div className="text-xs text-gray-500">{absenceTypeLabel}</div> : null}
        </div>
      </td>
      <td className="px-5 py-4 text-sm text-gray-700">{item.note ?? "-"}</td>
    </tr>
  );
}

export default function StudentAttendancePage() {
  const [items, setItems] = useState<StudentAttendanceHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const loadHistory = async (pageNumber = currentPage) => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchStudentAttendanceHistory({ pageNumber, pageSize });
      setItems(result.items);
      setCurrentPage(result.pageNumber);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
    } catch (err: any) {
      setError(err?.message || "Khong the tai lich su diem danh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-4 md:p-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-red-700 text-white shadow">
              <CalendarCheck size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Lich su diem danh</h1>
              <p className="text-sm text-gray-600">Theo doi trang thai tham gia cac buoi hoc gan day.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => loadHistory(currentPage)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <RefreshCcw size={16} />
            Tai lai
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-500">Tong so ban ghi</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{totalCount}</div>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <div className="text-sm text-emerald-700">Co mat</div>
          <div className="mt-2 text-3xl font-bold text-emerald-700">
            {items.filter((item) => item.attendanceStatus === "Present").length}
          </div>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <div className="text-sm text-red-700">Vang mat</div>
          <div className="mt-2 text-3xl font-bold text-red-700">
            {items.filter((item) => item.attendanceStatus === "Absent").length}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <div className="text-lg font-semibold text-gray-900">Chi tiet diem danh</div>
            <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
              <Clock3 size={14} />
              Cap nhat theo du lieu token hien tai
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Trang {currentPage}/{Math.max(totalPages, 1)}
          </div>
        </div>

        {loading ? <div className="px-5 py-10 text-sm text-gray-500">Dang tai...</div> : null}
        {error ? <div className="px-5 py-10 text-sm text-red-600">{error}</div> : null}

        {!loading && !error ? (
          items.length ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-sm font-semibold text-gray-700">Buoi hoc</th>
                    <th className="px-5 py-3 text-left text-sm font-semibold text-gray-700">Thoi gian</th>
                    <th className="px-5 py-3 text-left text-sm font-semibold text-gray-700">Trang thai</th>
                    <th className="px-5 py-3 text-left text-sm font-semibold text-gray-700">Ghi chu</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <HistoryRow key={`${item.sessionId}-${item.markedAt ?? item.date ?? ""}`} item={item} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-5 py-10 text-sm text-gray-500">Chua co lich su diem danh.</div>
          )
        ) : null}

        {!loading && !error && totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-gray-200 px-5 py-4">
            <div className="text-sm text-gray-500">
              Hien thi trang {currentPage} / {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loadHistory(currentPage - 1)}
                disabled={currentPage <= 1}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft size={16} />
                Truoc
              </button>
              <button
                type="button"
                onClick={() => loadHistory(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sau
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
