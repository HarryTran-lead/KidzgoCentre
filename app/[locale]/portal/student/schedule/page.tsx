"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  User2,
  Users,
  BookOpen,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import {
  extractStudentTimetableSessions,
  getStudentTimetable,
} from "@/lib/api/studentTimetableService";
import {
  parseApiDateKeepWallClock,
  toISOStartOfDayVN,
  toISOEndOfDayVN,
} from "@/lib/datetime";
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
  { key: "morning" as TimeSlot, label: "Sáng", hours: "7:00 - 12:00" },
  { key: "afternoon" as TimeSlot, label: "Chiều", hours: "12:00 - 18:00" },
  { key: "evening" as TimeSlot, label: "Tối", hours: "18:00 - 22:00" },
];

const TYPE_META = {
  regular: {
    text: "Buổi thường",
    badge: "bg-emerald-500/20 border border-emerald-400/30 text-emerald-300",
    glow: "shadow-emerald-500/20",
  },
  makeup: {
    text: "Buổi bù",
    badge: "bg-amber-500/20 border border-amber-400/30 text-amber-300",
    glow: "shadow-amber-500/20",
  },
};

function TypeBadge({ type }: { type: "regular" | "makeup" }) {
  const { text, badge } = TYPE_META[type];
  return (
    <span
      className={`rounded-full px-3 py-1 text-[11px] font-semibold backdrop-blur-sm ${badge}`}
    >
      {text}
    </span>
  );
}

// Extended color palette with more vibrant options
const PROGRAM_COLOR_PALETTE = [
  {
    bg: "bg-gradient-to-r from-purple-500 to-purple-600",
    light: "bg-gradient-to-br from-purple-500/15 to-purple-600/5",
    border: "border-purple-500/30",
  },
  {
    bg: "bg-gradient-to-r from-pink-500 to-pink-600",
    light: "bg-gradient-to-br from-pink-500/15 to-pink-600/5",
    border: "border-pink-500/30",
  },
  {
    bg: "bg-gradient-to-r from-indigo-500 to-indigo-600",
    light: "bg-gradient-to-br from-indigo-500/15 to-indigo-600/5",
    border: "border-indigo-500/30",
  },
  {
    bg: "bg-gradient-to-r from-violet-500 to-violet-600",
    light: "bg-gradient-to-br from-violet-500/15 to-violet-600/5",
    border: "border-violet-500/30",
  },
  {
    bg: "bg-gradient-to-r from-fuchsia-500 to-fuchsia-600",
    light: "bg-gradient-to-br from-fuchsia-500/15 to-fuchsia-600/5",
    border: "border-fuchsia-500/30",
  },
  {
    bg: "bg-gradient-to-r from-rose-500 to-rose-600",
    light: "bg-gradient-to-br from-rose-500/15 to-rose-600/5",
    border: "border-rose-500/30",
  },
  {
    bg: "bg-gradient-to-r from-sky-500 to-sky-600",
    light: "bg-gradient-to-br from-sky-500/15 to-sky-600/5",
    border: "border-sky-500/30",
  },
  {
    bg: "bg-gradient-to-r from-teal-500 to-teal-600",
    light: "bg-gradient-to-br from-teal-500/15 to-teal-600/5",
    border: "border-teal-500/30",
  },
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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [selectedClass, setSelectedClass] = useState<SessionEvent | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    getWeekStart(new Date())
  );
  const [sessions, setSessions] = useState<StudentTimetableSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

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
    const makeupCount = sessions.filter((session) =>
      Boolean(session.isMakeup)
    ).length;
    return {
      total: sessions.length,
      regular: sessions.length - makeupCount,
      makeup: makeupCount,
    };
  }, [sessions]);

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
    if (
      event?.color &&
      (event.color.startsWith("#") || event.color.startsWith("rgb"))
    ) {
      return "";
    }
    const key = event?.title ?? "";
    if (key && programColorMap.has(key)) {
      return PROGRAM_COLOR_PALETTE[programColorMap.get(key)!].light;
    }
    return event?.type === "makeup"
      ? "bg-gradient-to-br from-amber-500/15 to-amber-600/5"
      : "bg-gradient-to-br from-purple-500/15 to-purple-600/5";
  };

  const getEventColor = (event?: SessionEvent) => {
    if (
      event?.color &&
      (event.color.startsWith("#") || event.color.startsWith("rgb"))
    ) {
      return "";
    }
    const key = event?.title ?? "";
    if (key && programColorMap.has(key)) {
      return PROGRAM_COLOR_PALETTE[programColorMap.get(key)!].bg;
    }
    return event?.type === "makeup"
      ? "bg-gradient-to-r from-amber-500 to-orange-500"
      : "bg-gradient-to-r from-purple-500 to-pink-500";
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
      const start = parseApiDateKeepWallClock(planned);
      if (Number.isNaN(start.getTime())) return;

      const duration = Number(s.durationMinutes ?? 0);
      const end =
        duration > 0 ? new Date(start.getTime() + duration * 60000) : null;
      const timeLabel = end
        ? `${formatTime(start)} - ${formatTime(end)}`
        : formatTime(start);

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

  const getAttendanceIcon = (status?: string | null) => {
    switch (status) {
      case "Present":
        return <CheckCircle2 className="w-3 h-3 text-emerald-400" />;
      case "Absent":
        return <XCircle className="w-3 h-3 text-rose-400" />;
      default:
        return <AlertCircle className="w-3 h-3 text-amber-400" />;
    }
  };

  const getAttendanceLabel = (status?: string | null) => {
    switch (status) {
      case "Present":
        return "Có mặt";
      case "Absent":
        return "Vắng mặt";
      case "Makeup":
        return "Học bù";
      case "NotMarked":
        return "Chưa điểm danh";
      default:
        return status || "Chưa cập nhật";
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <div
        className={`flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6 transition-all duration-700 custom-scrollbar ${
          isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {/* Error State */}
        {error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 backdrop-blur-sm p-4 text-sm text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        
        {/* Tabs */}
        <div className="flex justify-center">
          <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-slate-900/80 backdrop-blur-xl p-2 inline-flex gap-2">
            {[
              { key: "all", label: "Tất cả" },
              { key: "regular", label: "Buổi thường" },
              { key: "makeup", label: "Buổi bù" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as TabType)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 cursor-pointer ${
                  activeTab === tab.key
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/40 scale-105"
                    : "bg-slate-800/50 border border-purple-500/30 text-purple-300 hover:border-purple-400/50 hover:text-white hover:bg-purple-500/20 backdrop-blur-sm"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Week Navigation + Calendar Grid */}
        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-slate-900/80 backdrop-blur-xl shadow-xl shadow-purple-500/10 overflow-hidden">
          {/* Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-6 border-b border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
            <div className="flex items-center gap-4">
              <div className="relative p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
                <CalendarDays size={24} className="text-white" />
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-md">
                  <span className="text-xs font-bold text-purple-600">
                    {weekDates[0]?.getDate?.()}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  Thời khóa biểu
                </div>
                <div className="text-purple-300/70 text-sm mt-1">
                  {currentWeekLabel}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                className="p-2 rounded-lg border border-purple-500/30 bg-slate-800/50 hover:bg-purple-500/30 hover:scale-110 transition-all duration-200 cursor-pointer"
                onClick={goToPreviousWeek}
              >
                <ChevronLeft size={18} className="text-purple-300" />
              </button>
              <div className="min-w-[220px] text-center text-sm font-semibold text-purple-300 bg-purple-500/10 py-2 px-3 rounded-lg">
                Tuần {currentWeekLabel}
              </div>
              <button
                type="button"
                className="p-2 rounded-lg border border-purple-500/30 bg-slate-800/50 hover:bg-purple-500/30 hover:scale-110 transition-all duration-200 cursor-pointer"
                onClick={goToNextWeek}
              >
                <ChevronRight size={18} className="text-purple-300" />
              </button>
              <button
                type="button"
                className="ml-2 rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-500/30 to-pink-500/30 backdrop-blur-sm px-5 py-2 text-sm font-semibold hover:from-purple-500/50 hover:to-pink-500/50 hover:scale-105 transition-all duration-200 cursor-pointer text-white shadow-lg"
                onClick={goToCurrentWeek}
              >
                Tuần này
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[1200px]">
              {/* Header Row */}
              <div className="grid grid-cols-8 border-t border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                <div className="px-4 py-4 text-sm font-bold text-purple-300 text-center">
                  Ca / Ngày
                </div>
                {DAY_LABELS.map((day, index) => (
                  <div
                    key={day}
                    className="px-4 py-4 border-l border-purple-500/30 text-center"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="capitalize text-purple-300 font-semibold text-lg">
                        {day}
                      </span>
                      <span className="h-10 w-10 flex items-center justify-center rounded-full text-sm font-bold bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-purple-200 border border-purple-500/40 shadow-lg">
                        {weekDates[index]?.getDate?.() ?? index + 1}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Time Slots Rows */}
              {TIME_SLOTS.map((slot, rowIdx) => (
                <div
                  key={slot.key}
                  className="grid grid-cols-8 border-t border-purple-500/30"
                >
                  <div className="px-4 py-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 flex items-center justify-center">
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-purple-300 text-xl">
                        {slot.label}
                      </span>
                      <span className="text-xs text-purple-400/70 mt-1">
                        {slot.hours}
                      </span>
                    </div>
                  </div>

                  {DAY_LABELS.map((day) => {
                    const events = weekSchedule[slot.key][day] || [];
                    const filteredEvents = filterEvents(events);

                    return (
                      <div
                        key={`${slot.key}-${day}`}
                        className={`min-h-[180px] p-3 ${
                          rowIdx % 2 ? "bg-purple-500/5" : "bg-slate-900/30"
                        } border-l border-purple-500/30 transition-all duration-200`}
                      >
                        <div className="space-y-2">
                          {filteredEvents.map((event) => {
                            const lightColor = getLightColor(event);
                            const isHexColor =
                              event.color &&
                              (event.color.startsWith("#") ||
                                event.color.startsWith("rgb"));
                            const hexBgStyle = isHexColor
                              ? { backgroundColor: `${event.color}33` }
                              : undefined;
                            const hexAccentStyle = isHexColor
                              ? { backgroundColor: event.color ?? undefined }
                              : undefined;

                            return (
                              <button
                                key={event.id}
                                type="button"
                                onClick={() => setSelectedClass(event)}
                                className={`w-full text-left rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer border backdrop-blur-sm group ${
                                  isHexColor ? "" : "border-purple-500/30"
                                } ${lightColor}`}
                                style={
                                  isHexColor
                                    ? {
                                        ...hexBgStyle,
                                        borderColor: `${event.color}66`,
                                      }
                                    : undefined
                                }
                              >
                                {isHexColor && (
                                  <div
                                    className="h-1 w-full"
                                    style={hexAccentStyle}
                                  />
                                )}
                                <div className="px-3 py-2">
                                  <div className="font-bold text-purple-100 truncate text-sm group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-300 group-hover:to-pink-300 transition-all duration-200">
                                    {event.title}
                                  </div>
                                  <div className="text-purple-300/70 text-[11px] mt-1.5 flex items-center gap-1.5">
                                    <Clock3 size={10} />
                                    <span>{event.time}</span>
                                  </div>
                                  {event.room && (
                                    <div className="text-purple-400/60 text-[10px] flex items-center gap-1.5 mt-1">
                                      <MapPin size={10} />
                                      <span className="truncate">
                                        {event.room}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    <span
                                      className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
                                        event.type === "makeup"
                                          ? "bg-amber-500/20 text-amber-300 border border-amber-400/30"
                                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                                      }`}
                                    >
                                      {event.type === "makeup"
                                        ? "Buổi bù"
                                        : "Buổi thường"}
                                    </span>
                                    {event.attendanceStatus &&
                                      event.attendanceStatus !== "NotMarked" && (
                                        <span
                                          className={`text-[9px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                                            event.attendanceStatus === "Present"
                                              ? "bg-green-500/20 text-green-300 border border-green-400/30"
                                              : event.attendanceStatus === "Absent"
                                              ? "bg-red-500/20 text-red-300 border border-red-400/30"
                                              : "bg-gray-500/20 text-gray-300 border border-gray-400/30"
                                          }`}
                                        >
                                          {getAttendanceIcon(
                                            event.attendanceStatus
                                          )}
                                          {getAttendanceLabel(
                                            event.attendanceStatus
                                          )}
                                        </span>
                                      )}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                          {filteredEvents.length === 0 && !loading && (
                            <div className="text-[11px] text-purple-400/50 italic text-center py-6">
                              Trống
                            </div>
                          )}
                          {loading && (
                            <div className="text-[11px] text-purple-400/50 italic text-center py-6">
                              <div className="animate-pulse flex items-center justify-center gap-2">
                                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce delay-100" />
                                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200" />
                              </div>
                            </div>
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
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
            onClick={() => setSelectedClass(null)}
          >
            <div
              className="rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-purple-500/30 bg-gradient-to-br from-slate-900 to-purple-950/90 backdrop-blur-xl animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-purple-500/30 px-6 py-4 flex items-center justify-between backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl ${getEventColor(
                      selectedClass
                    )} text-white shadow-md`}
                    style={
                      selectedClass.color &&
                      (selectedClass.color.startsWith("#") ||
                        selectedClass.color.startsWith("rgb"))
                        ? { backgroundColor: selectedClass.color }
                        : undefined
                    }
                  >
                    <GraduationCap size={18} />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                      Chi tiết buổi học
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedClass(null)}
                  className="p-2 rounded-lg hover:bg-purple-500/30 bg-slate-800/50 border border-purple-500/30 transition-all duration-200 cursor-pointer text-purple-300 hover:text-white hover:scale-110"
                >
                  <span className="text-lg">✕</span>
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <TypeBadge type={selectedClass.type} />
                    <h3 className="text-lg font-bold text-white">
                      {selectedClass.title}
                    </h3>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all duration-200">
                      <Clock3 className="w-4 h-4 text-purple-400" />
                      <div>
                        <div className="font-medium text-purple-300">
                          Thời gian
                        </div>
                        <div className="text-purple-100">
                          {selectedClass.time}
                        </div>
                      </div>
                    </div>

                    {selectedClass.room && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all duration-200">
                        <MapPin className="w-4 h-4 text-purple-400" />
                        <div>
                          <div className="font-medium text-purple-300">
                            Phòng học
                          </div>
                          <div className="text-purple-100">
                            {selectedClass.room}
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedClass.teacher && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all duration-200">
                        <User2 className="w-4 h-4 text-purple-400" />
                        <div>
                          <div className="font-medium text-purple-300">
                            Giáo viên
                          </div>
                          <div className="text-purple-100">
                            {selectedClass.teacher}
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedClass.track && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all duration-200">
                        <BookOpen className="w-4 h-4 text-purple-400" />
                        <div>
                          <div className="font-medium text-purple-300">
                            Track
                          </div>
                          <div className="text-purple-100">
                            {selectedClass.track}
                          </div>
                        </div>
                      </div>
                    )}

                    {(selectedClass.attendanceStatus ||
                      selectedClass.absenceType) && (
                      <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500/15 to-pink-500/15 border border-purple-500/20">
                        <div className="flex flex-wrap items-center gap-2">
                          {selectedClass.attendanceStatus && (
                            <span
                              className={`text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1.5 ${
                                selectedClass.attendanceStatus === "Present"
                                  ? "bg-green-500/20 text-green-300 border border-green-400/30"
                                  : selectedClass.attendanceStatus === "Absent"
                                  ? "bg-red-500/20 text-red-300 border border-red-400/30"
                                  : selectedClass.attendanceStatus === "Makeup"
                                  ? "bg-blue-500/20 text-blue-300 border border-blue-400/30"
                                  : selectedClass.attendanceStatus === "NotMarked"
                                  ? "bg-orange-500/20 text-orange-300 border border-orange-400/30"
                                  : "bg-gray-500/20 text-gray-300 border border-gray-400/30"
                              }`}
                            >
                              {getAttendanceIcon(selectedClass.attendanceStatus)}
                              {getAttendanceLabel(selectedClass.attendanceStatus)}
                            </span>
                          )}
                          {selectedClass.absenceType && (
                            <span className="text-xs px-3 py-1 rounded-full bg-gray-500/20 text-gray-300 border border-gray-400/30 font-medium">
                              {selectedClass.absenceType === "WithNotice24H"
                                ? "Báo trước 24h"
                                : selectedClass.absenceType === "Under24H"
                                ? "Báo dưới 24h"
                                : selectedClass.absenceType === "NoNotice"
                                ? "Không báo"
                                : selectedClass.absenceType === "LongTerm"
                                ? "Nghỉ dài hạn"
                                : selectedClass.absenceType}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-purple-500/30 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedClass(null)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:shadow-xl hover:shadow-purple-500/40 hover:scale-105 transition-all duration-200 cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-slate-900/80 backdrop-blur-xl p-5">
          <div className="text-sm font-bold text-purple-300 mb-4 flex items-center gap-2">
            <ChevronDown size={16} className="text-purple-400" />
            Chú thích
          </div>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2.5">
              <div className="h-4 w-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-sm"></div>
              <span className="text-sm text-purple-200">Buổi thường</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-4 w-6 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 shadow-sm"></div>
              <span className="text-sm text-purple-200">Buổi bù</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span className="text-sm text-purple-200">Có mặt</span>
            </div>
            <div className="flex items-center gap-2.5">
              <XCircle size={16} className="text-rose-400" />
              <span className="text-sm text-purple-200">Vắng mặt</span>
            </div>
            <div className="flex items-center gap-2.5">
              <AlertCircle size={16} className="text-amber-400" />
              <span className="text-sm text-purple-200">Chưa điểm danh</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}