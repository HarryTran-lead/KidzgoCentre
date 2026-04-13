"use client";

import React, { useEffect, useMemo, useState } from "react";
import { History, AlertCircle, CheckCircle2 } from "lucide-react";
import { fetchStudentAttendanceHistory } from "@/app/api/teacher/attendance";
import type { StudentAttendanceHistoryItem, AttendanceRawStatus } from "@/types/teacher/attendance";

/* ===================== Constants ===================== */

const attendanceLabels: Record<AttendanceRawStatus, string> = {
  Present: "Có mặt",
  Absent: "Vắng mặt",
  Makeup: "Học bù",
  NotMarked: "Chưa điểm danh",
};

const attendanceStyles: Record<AttendanceRawStatus, string> = {
  Present: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  Absent: "border border-rose-200 bg-rose-50 text-rose-700",
  Makeup: "border border-sky-200 bg-sky-50 text-sky-700",
  NotMarked: "border border-amber-200 bg-amber-50 text-amber-700",
};

const attendanceAbsenceTypeLabels: Record<string, string> = {
  WithNotice24H: "Báo trước >= 24h",
  Under24H: "Báo trước < 24h",
  NoNotice: "Không báo trước",
  LongTerm: "Nghi dai han",
};

/* ===================== Helper Functions ===================== */

function toVNDateLabel(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function getAttendanceHistoryTitle(item: StudentAttendanceHistoryItem) {
  const sessionName = String(item.sessionName ?? "").trim();
  if (sessionName) return sessionName;

  const className = String(item.className ?? "").trim();
  if (className) return className;

  const sessionId = String(item.sessionId ?? "").trim();
  if (sessionId) return `Buổi học ${sessionId.slice(0, 8)}`;

  return "Buổi học";
}

function getAttendanceAbsenceTypeLabel(value?: string | null) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return null;
  return attendanceAbsenceTypeLabels[normalized] ?? normalized;
}

/* ===================== UI Components ===================== */

function Banner({ kind, text }: { kind: "error" | "success"; text: string }) {
  const cls =
    kind === "error"
      ? "border-red-200 bg-gradient-to-r from-red-50 to-red-100 text-red-700"
      : "border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700";
  const Icon = kind === "error" ? AlertCircle : CheckCircle2;

  return (
    <div className={`rounded-2xl border p-3 ${cls}`}>
      <div className="flex items-start gap-2">
        <Icon size={16} className="mt-0.5" />
        <div className="text-sm font-medium whitespace-pre-line">{text}</div>
      </div>
    </div>
  );
}

/* ===================== Main Component ===================== */

export default function ParentAttendanceHistoryPage() {
  const [attendanceHistory, setAttendanceHistory] = useState<StudentAttendanceHistoryItem[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  /* ===================== Fetch Attendance History ===================== */

  useEffect(() => {
    const fetchAttendance = async () => {
      setAttendanceLoading(true);
      setAttendanceError(null);

      try {
        const response = await fetchStudentAttendanceHistory({
          pageNumber: 1,
          pageSize: 100,
        });
        setAttendanceHistory(response.items || []);
      } catch (err) {
        console.error("Fetch attendance history error:", err);
        setAttendanceHistory([]);
        setAttendanceError("Không thể tải lịch sử điểm danh. Vui lòng thử lại.");
      } finally {
        setAttendanceLoading(false);
      }
    };

    fetchAttendance();
    setIsPageLoaded(true);
  }, []);

  /* ===================== Memos ===================== */

  const displayAttendance = useMemo(() => attendanceHistory, [attendanceHistory]);

  const stats = useMemo(() => {
    return {
      totalSessions: attendanceHistory.length,
      presentCount: attendanceHistory.filter(i => (i.attendanceStatus ?? "NotMarked") === "Present").length,
      absentCount: attendanceHistory.filter(i => (i.attendanceStatus ?? "NotMarked") === "Absent").length,
      makeupCount: attendanceHistory.filter(i => (i.attendanceStatus ?? "NotMarked") === "Makeup").length,
      attendanceRate: attendanceHistory.length > 0
        ? Math.round((attendanceHistory.filter(i => (i.attendanceStatus ?? "NotMarked") === "Present").length / attendanceHistory.length * 100))
        : 0,
    };
  }, [attendanceHistory]);

  /* ===================== Render ===================== */

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-linear-to-r from-red-600 to-red-700 shadow-lg">
            <History className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Lịch sử điểm danh</h1>
            <p className="text-sm text-gray-600">
              Xem chi tiết lịch sử điểm danh của học viên.
            </p>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-blue-100 grid place-items-center">
              <History className="text-blue-600" size={18} />
            </span>
            <div>
              <div className="text-sm text-gray-600">Tổng buổi học</div>
              <div className="text-2xl font-extrabold text-gray-900">{stats.totalSessions}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-emerald-100 grid place-items-center">
              <CheckCircle2 className="text-emerald-600" size={18} />
            </span>
            <div>
              <div className="text-sm text-gray-600">Có mặt</div>
              <div className="text-2xl font-extrabold text-gray-900">{stats.presentCount}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-sky-100 grid place-items-center">
              <History className="text-sky-600" size={18} />
            </span>
            <div>
              <div className="text-sm text-gray-600">Học bù</div>
              <div className="text-2xl font-extrabold text-gray-900">{stats.makeupCount}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-amber-100 grid place-items-center">
              <History className="text-amber-600" size={18} />
            </span>
            <div>
              <div className="text-sm text-gray-600">Tỷ lệ có mặt</div>
              <div className="text-2xl font-extrabold text-gray-900">{stats.attendanceRate}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {attendanceError && <Banner kind="error" text={attendanceError} />}

      {/* Content */}
      <div className={`rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-all duration-700 delay-200 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="bg-linear-to-r from-red-500/10 to-red-700/10 border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Chi tiết điểm danh</h2>
              {attendanceLoading ? <div className="text-sm text-gray-500 mt-1">Đang tải...</div> : null}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">{attendanceHistory.length} bản ghi</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-linear-to-r from-red-500/5 to-red-700/5 border-b border-gray-200">
              <tr>
                <th className="py-3 px-6 text-left text-sm font-semibold tracking-wide text-gray-700">Buổi học</th>
                <th className="py-3 px-6 text-left text-sm font-semibold tracking-wide text-gray-700">Ngày học</th>
                <th className="py-3 px-6 text-left text-sm font-semibold tracking-wide text-gray-700">Trạng thái</th>
                <th className="py-3 px-6 text-left text-sm font-semibold tracking-wide text-gray-700">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!displayAttendance.length && !attendanceLoading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-linear-to-r from-gray-100 to-gray-200 flex items-center justify-center">
                      <History size={24} className="text-gray-400" />
                    </div>
                    <div className="text-gray-600 font-medium">Chưa có lịch sử điểm danh</div>
                    <div className="text-sm text-gray-500 mt-1">Dữ liệu điểm danh sẽ hiển thị sau khi có buổi học.</div>
                  </td>
                </tr>
              ) : (
                displayAttendance.map((item) => {
                  const status = item.attendanceStatus ?? "NotMarked";
                  const absenceTypeLabel = getAttendanceAbsenceTypeLabel(item.absenceType);
                  return (
                    <tr key={`${item.sessionId}-${item.markedAt ?? item.date ?? ""}`} className="group hover:bg-linear-to-r hover:from-red-50/50 hover:to-white transition-all duration-200">
                      <td className="py-3 px-6">
                        <div className="font-medium text-gray-900">{getAttendanceHistoryTitle(item)}</div>
                        <div className="text-xs text-gray-500">{item.className ?? item.sessionId ?? "-"}</div>
                      </td>
                      <td className="py-3 px-6 whitespace-nowrap text-sm text-gray-700">
                        {toVNDateLabel(item.date)} {item.startTime ? `- ${item.startTime}` : ""}
                      </td>
                      <td className="py-3 px-6">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${attendanceStyles[status]}`}>
                            {attendanceLabels[status]}
                          </span>
                          {absenceTypeLabel ? <div className="text-xs text-gray-500">{absenceTypeLabel}</div> : null}
                        </div>
                      </td>
                      <td className="py-3 px-6 text-sm text-gray-700">{item.note ?? "-"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
