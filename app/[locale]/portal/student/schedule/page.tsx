"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  User2,
  Ticket,
} from "lucide-react";
import {
  extractStudentTimetableSessions,
  getStudentTimetable,
} from "@/lib/api/studentTimetableService";
import type { StudentTimetableSession } from "@/types/student/timetable";

type TabType = "all" | "regular" | "makeup";

const DAY_LABELS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];

function getWeekStart(date: Date) {
  const next = new Date(date);
  const day = (next.getDay() + 6) % 7;
  next.setDate(next.getDate() - day);
  next.setHours(0, 0, 0, 0);
  return next;
}

function getWeekDates(weekStart: Date) {
  return DAY_LABELS.map((_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseSessionDate(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatWeekLabel(weekStart: Date) {
  const end = new Date(weekStart);
  end.setDate(weekStart.getDate() + 6);
  return `${weekStart.toLocaleDateString("vi-VN")} - ${end.toLocaleDateString("vi-VN")}`;
}

function formatTimeRange(session: StudentTimetableSession) {
  const raw = session.plannedDatetime ?? session.actualDatetime;
  const start = parseSessionDate(raw);
  if (!start) return "Chưa có giờ học";

  const startText = start.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const duration = Number(session.durationMinutes ?? 0);
  if (duration <= 0) return startText;

  const end = new Date(start.getTime() + duration * 60 * 1000);
  const endText = end.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${startText} - ${endText}`;
}

function getTrackLabel(track?: string | null) {
  const normalized = String(track ?? "").trim().toLowerCase();
  if (!normalized) return "Primary";
  if (normalized === "secondary") return "Secondary";
  if (normalized === "primary") return "Primary";
  return track ?? "Primary";
}

function getAttendanceLabel(session: StudentTimetableSession) {
  const attendanceStatus = String(session.attendanceStatus ?? "").trim();
  const absenceType = String(session.absenceType ?? "").trim();

  if (attendanceStatus && absenceType) {
    return `${attendanceStatus} • ${absenceType}`;
  }

  return attendanceStatus || absenceType || "";
}

export default function StudentSchedulePage() {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(new Date()));
  const [sessions, setSessions] = useState<StudentTimetableSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const from = new Date(currentWeekStart);
        const to = new Date(currentWeekStart);
        to.setDate(currentWeekStart.getDate() + 6);
        to.setHours(23, 59, 59, 999);

        const response = await getStudentTimetable({
          from: from.toISOString(),
          to: to.toISOString(),
        });

        if (!active) return;
        setSessions(extractStudentTimetableSessions(response));
      } catch (fetchError) {
        console.error("Fetch student timetable error:", fetchError);
        if (!active) return;
        setSessions([]);
        setError("Không thể tải lịch học. Vui lòng thử lại.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [currentWeekStart]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const makeup = Boolean(session.isMakeup);
      if (activeTab === "regular") return !makeup;
      if (activeTab === "makeup") return makeup;
      return true;
    });
  }, [activeTab, sessions]);

  const weekDates = useMemo(() => getWeekDates(currentWeekStart), [currentWeekStart]);

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, StudentTimetableSession[]>();

    filteredSessions.forEach((session) => {
      const date = parseSessionDate(session.plannedDatetime ?? session.actualDatetime);
      if (!date) return;
      const key = toDateKey(date);
      const current = map.get(key) ?? [];
      current.push(session);
      map.set(key, current);
    });

    for (const list of map.values()) {
      list.sort((a, b) => {
        const aTime = parseSessionDate(a.plannedDatetime ?? a.actualDatetime)?.getTime() ?? 0;
        const bTime = parseSessionDate(b.plannedDatetime ?? b.actualDatetime)?.getTime() ?? 0;
        return aTime - bTime;
      });
    }

    return map;
  }, [filteredSessions]);

  const summary = useMemo(() => {
    const makeupCount = sessions.filter((session) => Boolean(session.isMakeup)).length;
    return {
      total: sessions.length,
      regular: sessions.length - makeupCount,
      makeup: makeupCount,
    };
  }, [sessions]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-4 md:p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-gradient-to-r from-red-600 to-red-700 p-3 text-white shadow-lg">
            <CalendarDays size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Lịch học của em</h1>
            <p className="mt-1 text-sm text-gray-600">
              Dữ liệu hiển thị theo session được assign thật sự từ backend.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { key: "all", label: "Tất cả" },
            { key: "regular", label: "Regular" },
            { key: "makeup", label: "Makeup" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveTab(item.key as TabType)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === item.key
                  ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
                  : "border border-red-200 bg-white text-gray-700 hover:bg-red-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-red-100 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Tổng session tuần này</div>
          <div className="mt-1 text-3xl font-bold text-gray-900">{summary.total}</div>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-sm">
          <div className="text-sm text-emerald-700">Regular</div>
          <div className="mt-1 text-3xl font-bold text-emerald-700">{summary.regular}</div>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4 shadow-sm">
          <div className="text-sm text-amber-700">Makeup</div>
          <div className="mt-1 text-3xl font-bold text-amber-700">{summary.makeup}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-red-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-red-100 bg-gradient-to-r from-red-50 to-white px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-lg font-semibold text-gray-900">Tuần học</div>
            <div className="text-sm text-gray-600">{formatWeekLabel(currentWeekStart)}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const next = new Date(currentWeekStart);
                next.setDate(currentWeekStart.getDate() - 7);
                setCurrentWeekStart(next);
              }}
              className="rounded-xl border border-red-200 bg-white p-2 text-gray-700 hover:bg-red-50"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => setCurrentWeekStart(getWeekStart(new Date()))}
              className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-red-50"
            >
              Tuần này
            </button>
            <button
              type="button"
              onClick={() => {
                const next = new Date(currentWeekStart);
                next.setDate(currentWeekStart.getDate() + 7);
                setCurrentWeekStart(next);
              }}
              className="rounded-xl border border-red-200 bg-white p-2 text-gray-700 hover:bg-red-50"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="p-5">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="py-12 text-center text-sm text-gray-500">Đang tải lịch học…</div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
              {weekDates.map((date, index) => {
                const dateKey = toDateKey(date);
                const daySessions = sessionsByDate.get(dateKey) ?? [];

                return (
                  <section
                    key={dateKey}
                    className="rounded-2xl border border-red-100 bg-gradient-to-b from-white to-red-50/40 p-4"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-red-100 pb-3">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{DAY_LABELS[index]}</div>
                        <div className="text-xs text-gray-500">{date.toLocaleDateString("vi-VN")}</div>
                      </div>
                      <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                        {daySessions.length} session
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      {daySessions.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-5 text-sm text-gray-400">
                          Không có lịch học.
                        </div>
                      ) : (
                        daySessions.map((session) => {
                          const attendanceLabel = getAttendanceLabel(session);

                          return (
                            <article
                              key={session.id}
                              className="rounded-2xl border border-red-100 bg-white p-4 shadow-sm"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <div className="text-sm font-semibold text-gray-900">
                                    {session.classTitle ?? session.classCode ?? "Buổi học"}
                                  </div>
                                  <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                                    <Clock3 size={14} className="text-red-500" />
                                    {formatTimeRange(session)}
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                                    {getTrackLabel(session.track)}
                                  </span>
                                  <span
                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                      session.isMakeup
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-emerald-100 text-emerald-700"
                                    }`}
                                  >
                                    {session.isMakeup ? "Makeup" : "Regular"}
                                  </span>
                                </div>
                              </div>

                              <div className="mt-3 grid gap-2 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <MapPin size={14} className="text-red-500" />
                                  {session.plannedRoomName ?? session.actualRoomName ?? "Chưa có phòng học"}
                                </div>
                                <div className="flex items-center gap-2">
                                  <User2 size={14} className="text-red-500" />
                                  {session.plannedTeacherName ?? session.actualTeacherName ?? "Chưa có giáo viên"}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Ticket size={14} className="text-red-500" />
                                  <span className="truncate" title={session.registrationId ?? ""}>
                                    Registration: {session.registrationId ?? "Chưa có"}
                                  </span>
                                </div>
                              </div>

                              {attendanceLabel ? (
                                <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                                  {attendanceLabel}
                                </div>
                              ) : null}
                            </article>
                          );
                        })
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
