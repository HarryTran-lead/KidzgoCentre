"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  User2,
  Users,
} from "lucide-react";
import {
  extractStudentTimetableSessions,
  getStudentTimetable,
} from "@/lib/api/studentTimetableService";
import { toISOStartOfDayVN, toISOEndOfDayVN } from "@/lib/datetime";
import type { StudentTimetableSession } from "@/types/student/timetable";

type TabType = "all" | "regular" | "makeup";
type TimeSlot = "morning" | "afternoon" | "evening";

interface SessionEvent {
  id: string;
  time: string;
  title: string;
  room?: string;
  type: "regular" | "makeup";
  teacher?: string;
  track?: string;
  color?: string | null;
  attendanceStatus?: string | null;
  absenceType?: string | null;
}

interface DaySchedule {
  [key: string]: SessionEvent[];
}

const DAY_LABELS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];
const TIME_SLOTS = [
  { key: "morning" as TimeSlot, label: "Sáng" },
  { key: "afternoon" as TimeSlot, label: "Chiều" },
  { key: "evening" as TimeSlot, label: "Tối" },
];

const TYPE_META = {
  regular: {
    text: "Regular",
    badge: "bg-emerald-600 text-white",
  },
  makeup: {
    text: "Makeup",
    badge: "bg-amber-600 text-white",
  },
};

function TypeBadge({ type }: { type: "regular" | "makeup" }) {
  const { text, badge } = TYPE_META[type];
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge}`}>{text}</span>;
}

const PROGRAM_COLOR_PALETTE = [
  { bg: "bg-gradient-to-r from-red-600 to-red-700", light: "bg-gradient-to-br from-red-50 to-red-100" },
  { bg: "bg-gradient-to-r from-blue-600 to-blue-700", light: "bg-gradient-to-br from-blue-50 to-blue-100" },
  { bg: "bg-gradient-to-r from-emerald-600 to-emerald-700", light: "bg-gradient-to-br from-emerald-50 to-emerald-100" },
  { bg: "bg-gradient-to-r from-purple-600 to-purple-700", light: "bg-gradient-to-br from-purple-50 to-purple-100" },
  { bg: "bg-gradient-to-r from-amber-500 to-orange-500", light: "bg-gradient-to-br from-amber-50 to-amber-100" },
  { bg: "bg-gradient-to-r from-sky-500 to-blue-500", light: "bg-gradient-to-br from-sky-50 to-sky-100" },
  { bg: "bg-gradient-to-r from-indigo-500 to-indigo-600", light: "bg-gradient-to-br from-indigo-50 to-indigo-100" },
  { bg: "bg-gradient-to-r from-pink-500 to-rose-500", light: "bg-gradient-to-br from-pink-50 to-pink-100" },
];

function getWeekStart(date: Date) {
  const next = new Date(date);
  const day = (next.getDay() + 6) % 7;
  next.setDate(next.getDate() - day);
  next.setHours(0, 0, 0, 0);
  return next;
}

const formatDate = (d?: Date) =>
  d
    ? new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(d)
    : "";

const formatTime = (d: Date) =>
  d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

export default function StudentSchedulePage() {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [selectedClass, setSelectedClass] = useState<SessionEvent | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(new Date()));
  const [sessions, setSessions] = useState<StudentTimetableSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weekDates = useMemo(() => {
    return DAY_LABELS.map((_, idx) => {
      const d = new Date(currentWeekStart);
      d.setDate(currentWeekStart.getDate() + idx);
      return d;
    });
  }, [currentWeekStart]);

  const currentWeekLabel = useMemo(() => {
    const start = weekDates[0];
    const end = weekDates[6];
    return `${formatDate(start)} - ${formatDate(end)}`;
  }, [weekDates]);

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
          from: toISOStartOfDayVN(from),
          to: toISOEndOfDayVN(to),
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

  const summary = useMemo(() => {
    const makeupCount = sessions.filter((session) => Boolean(session.isMakeup)).length;
    return {
      total: sessions.length,
      regular: sessions.length - makeupCount,
      makeup: makeupCount,
    };
  }, [sessions]);

  // Stable program → color index map
  const programColorMap = useMemo(() => {
    const map = new Map<string, number>();
    let idx = 0;
    filteredSessions.forEach((s) => {
      const key = s.classTitle ?? s.classCode ?? "";
      if (key && !map.has(key)) {
        map.set(key, idx % PROGRAM_COLOR_PALETTE.length);
        idx++;
      }
    });
    return map;
  }, [filteredSessions]);

  const getLightColor = (event?: SessionEvent) => {
    if (event?.color && (event.color.startsWith("#") || event.color.startsWith("rgb"))) {
      return "";
    }
    const key = event?.title ?? "";
    if (key && programColorMap.has(key)) {
      return PROGRAM_COLOR_PALETTE[programColorMap.get(key)!].light;
    }
    return event?.type === "makeup"
      ? "bg-gradient-to-br from-amber-50 to-amber-100"
      : "bg-gradient-to-br from-red-50 to-red-100";
  };

  const getEventColor = (event?: SessionEvent) => {
    if (event?.color && (event.color.startsWith("#") || event.color.startsWith("rgb"))) {
      return "";
    }
    const key = event?.title ?? "";
    if (key && programColorMap.has(key)) {
      return PROGRAM_COLOR_PALETTE[programColorMap.get(key)!].bg;
    }
    return event?.type === "makeup"
      ? "bg-gradient-to-r from-amber-500 to-amber-600"
      : "bg-gradient-to-r from-red-600 to-red-700";
  };

  const goToPreviousWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(next);
  };

  const goToNextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(getWeekStart(new Date()));
  };

  // Build weekly grid schedule grouped by time slots
  const weekSchedule = useMemo((): { [key in TimeSlot]: DaySchedule } => {
    const blank: { [key in TimeSlot]: DaySchedule } = {
      morning: {},
      afternoon: {},
      evening: {},
    };
    DAY_LABELS.forEach((day) => {
      blank.morning[day] = [];
      blank.afternoon[day] = [];
      blank.evening[day] = [];
    });

    const toSlot = (date: Date): TimeSlot => {
      const hour = date.getHours();
      if (hour < 12) return "morning";
      if (hour < 18) return "afternoon";
      return "evening";
    };

    const toDayLabel = (date: Date) => {
      const idx = (date.getDay() + 6) % 7;
      return DAY_LABELS[idx];
    };

    filteredSessions.forEach((s) => {
      const planned = s.plannedDatetime ?? s.actualDatetime;
      if (!planned) return;
      const start = new Date(planned);
      if (Number.isNaN(start.getTime())) return;

      const duration = Number(s.durationMinutes ?? 0);
      const end = duration > 0 ? new Date(start.getTime() + duration * 60000) : null;
      const timeLabel = end ? `${formatTime(start)} - ${formatTime(end)}` : formatTime(start);

      const item: SessionEvent = {
        id: s.id,
        time: timeLabel,
        title: s.classTitle ?? s.classCode ?? "Buổi học",
        room: s.plannedRoomName ?? s.actualRoomName ?? undefined,
        type: s.isMakeup ? "makeup" : "regular",
        teacher: s.plannedTeacherName ?? s.actualTeacherName ?? undefined,
        track: s.track ?? undefined,
        color: s.color ?? null,
        attendanceStatus: s.attendanceStatus ?? null,
        absenceType: s.absenceType ?? null,
      };

      const slot = toSlot(start);
      const day = toDayLabel(start);
      blank[slot][day].push(item);
    });

    return blank;
  }, [filteredSessions]);

  const filterEvents = (events: SessionEvent[]) => {
    if (activeTab === "all") return events;
    if (activeTab === "regular") return events.filter((e) => e.type === "regular");
    if (activeTab === "makeup") return events.filter((e) => e.type === "makeup");
    return events;
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-gradient-to-b from-red-50/30 to-white p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
            <CalendarDays className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
              Lịch học của em
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Dữ liệu hiển thị theo session được assign thật sự từ backend.
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* Summary Stats */}
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

      {/* Tabs */}
      <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-2 inline-flex gap-2">
        {[
          { key: "all", label: "Tất cả" },
          { key: "regular", label: "Regular" },
          { key: "makeup", label: "Makeup" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as TabType)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === tab.key
                ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
                : "bg-white border border-red-200 text-gray-600 hover:bg-red-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Week Navigation + Calendar Grid */}
      <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between p-6 border-b border-red-200 bg-gradient-to-r from-red-50 to-red-100">
          <div className="flex items-center gap-4">
            <div className="relative p-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg">
              <CalendarDays size={24} />
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center">
                <span className="text-xs font-bold text-red-600">{weekDates[0]?.getDate?.()}</span>
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">Lịch tuần</div>
              <div className="text-gray-600">{currentWeekLabel}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="p-2 rounded-lg border border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
              onClick={goToPreviousWeek}
            >
              <ChevronLeft size={18} className="text-gray-600" />
            </button>
            <div className="min-w-[220px] text-center text-sm font-semibold text-gray-700">
              Tuần từ {currentWeekLabel}
            </div>
            <button
              type="button"
              className="p-2 rounded-lg border border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
              onClick={goToNextWeek}
            >
              <ChevronRight size={18} className="text-gray-600" />
            </button>
            <button
              type="button"
              className="ml-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm hover:bg-red-50 transition-colors cursor-pointer text-gray-700"
              onClick={goToCurrentWeek}
            >
              Tuần này
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div>
          <div className="min-w-[1200px]">
            {/* Header Row */}
            <div className="grid grid-cols-8 border-t border-red-200 bg-gradient-to-r from-red-50 to-gray-100 text-sm font-semibold text-gray-700">
              <div className="px-4 py-3">Ca / Ngày</div>
              {DAY_LABELS.map((day, index) => (
                <div key={day} className="px-4 py-3 border-l border-red-200">
                  <div className="flex flex-col items-center gap-1">
                    <span className="capitalize">{day}</span>
                    <span className="h-8 w-8 flex items-center justify-center rounded-full text-sm font-bold bg-white text-gray-700 border border-red-200">
                      {weekDates[index]?.getDate?.() ?? index + 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Time Slots Rows */}
            {TIME_SLOTS.map((slot, rowIdx) => (
              <div key={slot.key} className="grid grid-cols-8 border-t border-red-200">
                <div className="px-4 py-4 text-sm font-semibold text-gray-800 bg-gradient-to-r from-red-50 to-gray-100 flex items-center justify-center">
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-lg">{slot.label}</span>
                    {slot.key === "morning" && <span className="text-xs text-gray-500 mt-1">7:00-12:00</span>}
                    {slot.key === "afternoon" && <span className="text-xs text-gray-500 mt-1">12:00-18:00</span>}
                    {slot.key === "evening" && <span className="text-xs text-gray-500 mt-1">18:00-22:00</span>}
                  </div>
                </div>

                {DAY_LABELS.map((day) => {
                  const events = weekSchedule[slot.key][day] || [];
                  const filteredEvents = filterEvents(events);

                  return (
                    <div
                      key={`${slot.key}-${day}`}
                      className={`min-h-[140px] p-2 ${
                        rowIdx % 2 ? "bg-white" : "bg-gray-50"
                      } border-l border-red-200`}
                    >
                      <div className="space-y-1.5">
                        {filteredEvents.map((event) => {
                          const lightColor = getLightColor(event);
                          const isHexColor = event.color && (event.color.startsWith("#") || event.color.startsWith("rgb"));
                          const hexBgStyle = isHexColor ? { backgroundColor: `${event.color}33` } : undefined;
                          const hexAccentStyle = isHexColor ? { backgroundColor: event.color ?? undefined } : undefined;

                          return (
                            <button
                              key={event.id}
                              type="button"
                              onClick={() => setSelectedClass(event)}
                              className={`w-full text-left rounded-lg overflow-hidden text-[10px] leading-tight transition-all duration-200 hover:shadow-md cursor-pointer border ${isHexColor ? "" : "border-red-200"} ${lightColor}`}
                              style={isHexColor ? { ...hexBgStyle, borderColor: `${event.color}66` } : undefined}
                            >
                              {isHexColor && <div className="h-1 w-full" style={hexAccentStyle} />}
                              <div className="px-1.5 py-1">
                                <div className="font-semibold text-gray-900 truncate text-[11px]">{event.title}</div>
                                <div className="text-gray-600 mt-0.5">{event.time}</div>
                                <div className="text-gray-500 flex items-center gap-0.5 mt-0.5">
                                  <MapPin size={8} className="shrink-0" />
                                  <span className="truncate">{event.room || "—"}</span>
                                </div>
                                {event.teacher && (
                                  <div className="text-gray-400 flex items-center gap-0.5 mt-0.5">
                                    <Users size={8} className="shrink-0" />
                                    <span className="truncate">{event.teacher}</span>
                                  </div>
                                )}
                                <div className="flex flex-wrap gap-0.5 mt-1">
                                  {event.track && (
                                    <span className="text-[9px] px-1 py-px rounded bg-gray-100 text-gray-600 font-medium">
                                      {event.track}
                                    </span>
                                  )}
                                  <span
                                    className={`text-[9px] px-1 py-px rounded font-medium ${
                                      event.type === "makeup"
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-emerald-100 text-emerald-700"
                                    }`}
                                  >
                                    {event.type === "makeup" ? "Makeup" : "Regular"}
                                  </span>
                                </div>
                                {(event.attendanceStatus || event.attendanceStatus === "NotMarked") && (
                                  <div className="mt-0.5 flex flex-wrap gap-0.5">
                                    <span
                                      className={`text-[9px] px-1 py-px rounded font-medium ${
                                        event.attendanceStatus === "Present"
                                          ? "bg-green-100 text-green-700"
                                          : event.attendanceStatus === "Absent"
                                          ? "bg-red-100 text-red-700"
                                          : event.attendanceStatus === "Makeup"
                                          ? "bg-blue-100 text-blue-700"
                                          : event.attendanceStatus === "NotMarked"
                                          ? "bg-orange-100 text-orange-700"
                                          : "bg-gray-100 text-gray-600"
                                      }`}
                                    >
                                      {event.attendanceStatus === "Present"
                                        ? "Có mặt"
                                        : event.attendanceStatus === "Absent"
                                        ? "Vắng"
                                        : event.attendanceStatus === "Makeup"
                                        ? "Học bù"
                                        : event.attendanceStatus === "NotMarked"
                                        ? "Chưa điểm danh"
                                        : event.attendanceStatus}
                                    </span>
                                    {event.absenceType && (
                                      <span className="text-[9px] px-1 py-px rounded bg-gray-100 text-gray-500 font-medium">
                                        {event.absenceType === "WithNotice24H" ? "Báo trước 24h"
                                          : event.absenceType === "Under24H" ? "Báo dưới 24h"
                                          : event.absenceType === "NoNotice" ? "Không báo"
                                          : event.absenceType === "LongTerm" ? "Nghỉ dài hạn"
                                          : event.absenceType}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                        {filteredEvents.length === 0 && !loading && (
                          <div className="text-[11px] text-gray-400 italic text-center py-3">Trống</div>
                        )}
                        {loading && (
                          <div className="text-[11px] text-gray-400 italic text-center py-3">Đang tải…</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Class Detail Modal */}
      {selectedClass && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedClass(null)}
        >
          <div
            className="rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-red-200 bg-gradient-to-br from-white to-red-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-red-100 to-red-100 border-b border-red-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-xl ${getEventColor(selectedClass)} text-white shadow-md`}
                  style={
                    selectedClass.color &&
                    (selectedClass.color.startsWith("#") || selectedClass.color.startsWith("rgb"))
                      ? { backgroundColor: selectedClass.color }
                      : undefined
                  }
                >
                  <CalendarDays size={18} />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-gray-900">Chi tiết lịch học</h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClass(null)}
                className="p-2 rounded-lg hover:bg-red-200/60 bg-white/60 border border-red-200 transition-colors cursor-pointer"
              >
                <span className="text-lg">×</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <TypeBadge type={selectedClass.type} />
                  <h3 className="text-lg font-semibold text-gray-900">{selectedClass.title}</h3>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Clock3 className="w-4 h-4 text-red-600" />
                    <div>
                      <div className="font-medium text-gray-700">Thời gian</div>
                      <div className="text-gray-600">{selectedClass.time}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-red-600" />
                    <div>
                      <div className="font-medium text-gray-700">Phòng học</div>
                      <div className="text-gray-600">{selectedClass.room || "—"}</div>
                    </div>
                  </div>

                  {selectedClass.teacher && (
                    <div className="flex items-center gap-3">
                      <User2 className="w-4 h-4 text-red-600" />
                      <div>
                        <div className="font-medium text-gray-700">Giáo viên</div>
                        <div className="text-gray-600">{selectedClass.teacher}</div>
                      </div>
                    </div>
                  )}

                  {selectedClass.track && (
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-red-600" />
                      <div>
                        <div className="font-medium text-gray-700">Track</div>
                        <div className="text-gray-600">{selectedClass.track}</div>
                      </div>
                    </div>
                  )}

                  {selectedClass.attendanceStatus && (
                    <div className="mt-2 p-3 rounded-xl bg-white/60 border border-red-100">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            selectedClass.attendanceStatus === "Present"
                              ? "bg-green-100 text-green-700"
                              : selectedClass.attendanceStatus === "Absent"
                              ? "bg-red-100 text-red-700"
                              : selectedClass.attendanceStatus === "Makeup"
                              ? "bg-blue-100 text-blue-700"
                              : selectedClass.attendanceStatus === "NotMarked"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {selectedClass.attendanceStatus === "Present"
                            ? "Có mặt"
                            : selectedClass.attendanceStatus === "Absent"
                            ? "Vắng"
                            : selectedClass.attendanceStatus === "Makeup"
                            ? "Học bù"
                            : selectedClass.attendanceStatus === "NotMarked"
                            ? "Chưa điểm danh"
                            : selectedClass.attendanceStatus}
                        </span>
                        {selectedClass.absenceType && (
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500 font-medium">
                            {selectedClass.absenceType === "WithNotice24H" ? "Báo trước 24h"
                              : selectedClass.absenceType === "Under24H" ? "Báo dưới 24h"
                              : selectedClass.absenceType === "NoNotice" ? "Không báo"
                              : selectedClass.absenceType === "LongTerm" ? "Nghỉ dài hạn"
                              : selectedClass.absenceType}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-red-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedClass(null)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-lg transition-all cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-4">
        <div className="text-sm font-semibold text-gray-900 mb-3">Chú thích:</div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-6 rounded bg-gradient-to-r from-emerald-500 to-emerald-600"></div>
            <span className="text-sm text-gray-600">Regular</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-6 rounded bg-gradient-to-r from-amber-500 to-amber-600"></div>
            <span className="text-sm text-gray-600">Makeup</span>
          </div>
        </div>
      </div>
    </div>
  );
}
