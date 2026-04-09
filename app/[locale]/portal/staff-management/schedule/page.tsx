"use client";

import { useMemo, useState, useRef } from "react";
import {
  CalendarRange,
  MapPin,
  Users,
  ArrowLeftRight,
  Clock3,
  PlusCircle,
  Download,
  Send,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CalendarDays,
  AlertCircle,
  CheckCircle2,
  X,
  GripVertical,
  Palette,
} from "lucide-react";
import { useEffect } from "react";
import { getAllSessions } from "@/lib/api/sessionService";

type SlotType = "CLASS" | "MAKEUP" | "EVENT";

type Slot = {
  id: string;
  title: string;
  type: SlotType;
  teacher: string;
  room: string;
  time: string;
  date: string;
  note?: string;
  color?: string;
  conflict?: boolean;
  branch?: string;
};

const TYPE_META: Record<
  SlotType,
  { text: string; badge: string; chip: string; bar: string; defaultColor: string }
> = {
  CLASS: {
    text: "Lớp học",
    badge: "bg-red-600 text-white",
    chip: "bg-red-50 text-red-700 border border-red-200",
    bar: "border-l-4 border-red-400",
    defaultColor: "bg-gradient-to-r from-red-600 to-red-700"
  },
  MAKEUP: {
    text: "Buổi bù",
    badge: "bg-gray-700 text-white",
    chip: "bg-gray-100 text-gray-700 border border-gray-200",
    bar: "border-l-4 border-gray-400",
    defaultColor: "bg-gradient-to-r from-gray-600 to-gray-700"
  },
  EVENT: {
    text: "Sự kiện",
    badge: "bg-black/10 text-gray-800 border border-gray-200",
    chip: "bg-gray-100 text-gray-800 border border-gray-200",
    bar: "border-l-4 border-gray-400",
    defaultColor: "bg-gradient-to-r from-amber-500 to-orange-500"
  },
};

const COLOR_OPTIONS = [
  { name: 'Đỏ đậm', value: 'bg-gradient-to-r from-red-600 to-red-700' },
  { name: 'Đỏ nhạt', value: 'bg-gradient-to-r from-red-500 to-red-600' },
  { name: 'Xám đậm', value: 'bg-gradient-to-r from-gray-600 to-gray-700' },
  { name: 'Xám nhạt', value: 'bg-gradient-to-r from-gray-500 to-gray-600' },
  { name: 'Đen', value: 'bg-gradient-to-r from-gray-700 to-gray-800' },
  { name: 'Trắng-xám', value: 'bg-gradient-to-r from-gray-200 to-gray-300' },
  { name: 'Đỏ xám', value: 'bg-gradient-to-r from-red-600 to-gray-600' },
  { name: 'Xanh dương', value: 'bg-gradient-to-r from-blue-500 to-sky-500' },
];

function ColorPicker({ 
  lessonId, 
  currentColor, 
  onColorChange 
}: { 
  lessonId: string; 
  currentColor: string; 
  onColorChange: (lessonId: string, color: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPicker]);

  return (
    <div className="relative" ref={pickerRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowPicker(!showPicker);
        }}
        className="text-xs bg-white/80 hover:bg-white backdrop-blur-sm rounded-lg px-2 py-1 transition-colors cursor-pointer flex items-center gap-1 border border-gray-200"
        title="Đổi màu"
      >
        <Palette size={12} className="text-gray-800" />
      </button>
      {showPicker && (
        <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-1.5 z-50 overflow-hidden w-[140px]">
          <div className="text-[10px] font-semibold text-gray-800 mb-1.5 px-1">Chọn màu</div>
          <div className="grid grid-cols-4 gap-1.5">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color.value}
                onClick={(e) => {
                  e.stopPropagation();
                  onColorChange(lessonId, color.value);
                  setShowPicker(false);
                }}
                className={`w-6 h-6 rounded-md ${color.value} border-2 ${currentColor === color.value ? 'border-white ring-1 ring-red-500' : 'border-transparent'} hover:scale-110 transition-all cursor-pointer`}
                title={color.name}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TypeBadge({ type }: { type: SlotType }) {
  const { text, badge } = TYPE_META[type];
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge}`}>{text}</span>;
}

function parseVNDate(dateStr: string) {
  const [d, m, y] = dateStr.split("/").map(Number);
  return new Date(y, m - 1, d);
}

function startMinutes(timeRange: string) {
  const [start] = timeRange.split(" - ");
  const [h, m] = start.split(":").map(Number);
  return h * 60 + m;
}

function keyYMD(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function addDays(d: Date, n: number) {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + n);
  return nd;
}

function startOfWeek(date: Date) {
  const dow = (date.getDay() + 6) % 7;
  const monday = new Date(date);
  monday.setDate(date.getDate() - dow);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

type Period = "MORNING" | "AFTERNOON" | "EVENING";
const PERIODS: { key: Period; label: string }[] = [
  { key: "MORNING", label: "Sáng" },
  { key: "AFTERNOON", label: "Chiều" },
  { key: "EVENING", label: "Tối" },
];

function getPeriod(timeRange: string): Period {
  const [start] = timeRange.split(" - ");
  const [h] = start.split(":").map(Number);
  if (h < 12) return "MORNING";
  if (h < 18) return "AFTERNOON";
  return "EVENING";
}

function formatDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function WeekTimetable({
  items,
  weekCursor,
  setWeekCursor,
  onSlotMove,
  onColorChange,
}: {
  items: Slot[];
  weekCursor: Date;
  setWeekCursor: (d: Date) => void;
  onSlotMove: (slotId: string, newDate: string, newPeriod: Period) => void;
  onColorChange?: (lessonId: string, color: string) => void;
}) {
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekCursor, i)), [weekCursor]);
  const [draggedSlot, setDraggedSlot] = useState<Slot | null>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map: Record<string, Slot[]> = {};
    for (const s of items) {
      const d = parseVNDate(s.date);
      const k = `${keyYMD(d)}|${getPeriod(s.time)}`;
      (map[k] ||= []).push(s);
    }
    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => startMinutes(a.time) - startMinutes(b.time))
    );
    return map;
  }, [items]);

  const rangeText = `${days[0].toLocaleDateString("vi-VN")} – ${days[6].toLocaleDateString("vi-VN")}`;
  const todayKey = keyYMD(new Date());

  const getLightColor = (colorClass: string | undefined) => {
    const defaultLight = "bg-gradient-to-br from-red-50 to-red-100";
    if (!colorClass) return defaultLight;
    
    return colorClass
      .replace('from-red-600 to-red-700', 'from-red-50 to-red-100')
      .replace('from-red-500 to-red-600', 'from-red-50 to-red-100')
      .replace('from-gray-600 to-gray-700', 'from-gray-100 to-gray-200')
      .replace('from-gray-500 to-gray-600', 'from-gray-100 to-gray-200')
      .replace('from-gray-700 to-gray-800', 'from-gray-200 to-gray-300')
      .replace('from-gray-200 to-gray-300', 'from-gray-100 to-gray-200')
      .replace('from-red-600 to-gray-600', 'from-red-50 to-gray-100')
      .replace('from-blue-500 to-sky-500', 'from-blue-100 to-sky-100')
      .replace('from-emerald-500 to-teal-500', 'from-emerald-100 to-teal-100')
      .replace('from-amber-500 to-orange-500', 'from-amber-100 to-orange-100')
      .replace('from-indigo-500 to-blue-500', 'from-indigo-100 to-blue-100');
  };

  const modeDot = (room: string) =>
    room.toLowerCase().includes("online") ? "bg-red-600" : "bg-gray-700";

  const handleDragStart = (e: React.DragEvent, slot: Slot) => {
    setDraggedSlot(slot);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", slot.id);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
    setDraggedSlot(null);
    setDragOverCell(null);
  };

  const handleDragOver = (e: React.DragEvent, cellKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCell(cellKey);
  };

  const handleDrop = (e: React.DragEvent, date: Date, period: Period) => {
    e.preventDefault();
    if (!draggedSlot) return;

    const newDate = formatDate(date);
    onSlotMove(draggedSlot.id, newDate, period);
    setDraggedSlot(null);
    setDragOverCell(null);
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-red-100">
        <div className="flex items-center gap-4">
          <div className={`relative p-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg`}>
            <CalendarDays size={24} />
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center">
              <span className="text-xs font-bold text-red-600">
                {days[0].getDate()}
              </span>
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">Lịch tuần</div>
            <div className="text-gray-700">{rangeText}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => setWeekCursor(addDays(weekCursor, -7))}
          >
            <ChevronLeft size={18} className="text-gray-700" />
          </button>
          <div className="min-w-[220px] text-center text-sm font-semibold text-gray-700">
            Tuần từ {days[0].getDate()}/{days[0].getMonth()+1} đến {days[6].getDate()}/{days[6].getMonth()+1}
          </div>
          <button
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => setWeekCursor(addDays(weekCursor, +7))}
          >
            <ChevronRight size={18} className="text-gray-700" />
          </button>
          <button
            className="ml-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-100 transition-colors cursor-pointer text-gray-700"
            onClick={() => setWeekCursor(startOfWeek(new Date()))}
          >
            Tuần này
          </button>
        </div>
      </div>

      <div className="grid grid-cols-8 border-t border-gray-200 bg-gradient-to-r from-red-50 to-gray-100 text-sm font-semibold text-gray-700">
        <div className="px-4 py-3">Ca / Ngày</div>
        {days.map((d) => {
          const key = keyYMD(d);
          const isToday = key === todayKey;
          const dow = d.toLocaleDateString("vi-VN", { weekday: "long" });
          return (
            <div
              key={key}
              className={`px-4 py-3 border-l border-gray-200 ${isToday ? "bg-gradient-to-r from-red-100 to-red-200" : ""}`}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="capitalize">{dow}</span>
                <span className={`h-8 w-8 flex items-center justify-center rounded-full text-sm font-bold ${
                  isToday 
                    ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md" 
                    : "bg-white text-gray-700 border border-gray-200"
                }`}>
                  {d.getDate()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {PERIODS.map((p, rowIdx) => (
        <div key={p.key} className="grid grid-cols-8 border-t border-gray-200">
          <div className="px-4 py-4 text-sm font-semibold text-gray-800 bg-gradient-to-r from-red-50 to-gray-100 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <span className="font-bold text-lg">{p.label}</span>
              {p.key === "MORNING" && <span className="text-xs text-gray-600 mt-1">7:00-12:00</span>}
              {p.key === "AFTERNOON" && <span className="text-xs text-gray-600 mt-1">12:00-18:00</span>}
              {p.key === "EVENING" && <span className="text-xs text-gray-600 mt-1">18:00-22:00</span>}
            </div>
          </div>

          {days.map((d) => {
            const k = `${keyYMD(d)}|${p.key}`;
            const evts = grouped[k] || [];
            const isDragOver = dragOverCell === k;
            
            return (
              <div 
                key={k} 
                className={`min-h-[130px] p-3 ${
                  rowIdx % 2 
                    ? "bg-white" 
                    : "bg-gray-50"
                } border-l border-gray-200 ${
                  isDragOver ? "bg-red-100 ring-2 ring-red-400 ring-offset-2" : ""
                }`}
                onDragOver={(e) => handleDragOver(e, k)}
                onDrop={(e) => handleDrop(e, d, p.key)}
                onDragLeave={handleDragLeave}
              >
                <div className="space-y-2">
                  {evts.map((s) => {
                    const lightColor = getLightColor(s.color);
                    return (
                      <div 
                        key={s.id} 
                        draggable
                        onDragStart={(e) => handleDragStart(e, s)}
                        onDragEnd={handleDragEnd}
                        className={`rounded-xl p-2.5 text-xs transition-all duration-200 hover:shadow-md cursor-move border border-gray-200 ${lightColor} ${
                          s.conflict ? "ring-2 ring-amber-400" : ""
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <GripVertical size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className={`h-2 w-2 rounded-full ${modeDot(s.room)}`} />
                              <span className="font-semibold text-gray-900 truncate">{s.title}</span>
                              {s.conflict && (
                                <AlertCircle size={10} className="text-amber-600 flex-shrink-0" />
                              )}
                            </div>
                            <div className="text-[11px] text-gray-700 mb-1">{s.time}</div>
                            <div className="text-[11px] text-gray-600 flex items-center gap-1">
                              <MapPin size={10} />
                              <span className="truncate">{s.room}</span>
                            </div>
                            <div className="text-[10px] text-gray-700 mt-1 flex items-center gap-1">
                              <Users size={10} />
                              <span>{s.teacher}</span>
                            </div>
                            {s.branch && (
                              <div className="text-[10px] text-gray-600 mt-0.5">
                                📍 {s.branch}
                              </div>
                            )}
                          </div>
                          {onColorChange && (
                            <div onClick={(e) => e.stopPropagation()}>
                              <ColorPicker 
                                lessonId={s.id} 
                                currentColor={s.color || TYPE_META[s.type].defaultColor}
                                onColorChange={onColorChange}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {evts.length === 0 && (
                    <div className="text-[13px] text-gray-500 italic text-center py-4">
                      {isDragOver ? "Thả vào đây" : "Trống"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default function Page() {
  const [filter, setFilter] = useState<SlotType | "ALL">("ALL");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const baseDate = slots.length ? parseVNDate(slots[0].date) : new Date();
  const [weekCursor, setWeekCursor] = useState<Date>(startOfWeek(baseDate));
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  useEffect(() => {
    let alive = true;
    getAllSessions({ pageSize: 200 })
      .then((res: any) => {
        if (!alive) return;
        const raw = res?.data?.data?.sessions ?? res?.data?.data?.items ?? res?.data?.data ?? res?.data ?? [];
        const list = (Array.isArray(raw) ? raw : []).map((s: any) => {
          const typeMap: Record<string, SlotType> = { makeup: "MAKEUP", event: "EVENT" };
          const typeVal = (s.type ?? s.sessionType ?? "CLASS").toLowerCase();
          const planned = s.plannedDatetime ?? s.startTime ?? "";
          let time = s.time ?? "";
          let date = s.date ?? "";
          if (planned && !time) {
            const dt = new Date(planned);
            const dur = s.durationMinutes ?? 90;
            const endDt = new Date(dt.getTime() + dur * 60000);
            time = `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")} - ${String(endDt.getHours()).padStart(2, "0")}:${String(endDt.getMinutes()).padStart(2, "0")}`;
            date = `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
          }
          return {
            id: s.id ?? "",
            title: s.classTitle ?? s.classCode ?? s.title ?? "",
            type: typeMap[typeVal] ?? "CLASS" as SlotType,
            teacher: s.teacherName ?? s.teacher ?? "",
            room: s.room ?? s.roomName ?? "",
            time,
            date,
            note: s.note ?? "",
            color: s.color ?? TYPE_META[typeMap[typeVal] ?? "CLASS"]?.defaultColor,
            conflict: s.conflict ?? false,
            branch: s.branchName ?? s.branch ?? "",
          } as Slot;
        });
        setSlots(list);
        if (list.length) {
          setWeekCursor(startOfWeek(parseVNDate(list[0].date)));
        }
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const list = useMemo(() => {
    if (filter === "ALL") return slots;
    return slots.filter((slot) => slot.type === filter);
  }, [filter, slots]);

  const sortedList = useMemo(() => {
    return [...list].sort((a, b) => {
      const da = parseVNDate(a.date).getTime();
      const db = parseVNDate(b.date).getTime();
      if (da !== db) return da - db;
      return startMinutes(a.time) - startMinutes(b.time);
    });
  }, [list]);

  const handleSlotMove = (slotId: string, newDate: string, newPeriod: Period) => {
    setSlots(prev => prev.map(slot => {
      if (slot.id === slotId) {
        const periodTimeRanges = {
          MORNING: "08:00 - 12:00",
          AFTERNOON: "13:00 - 18:00",
          EVENING: "18:00 - 22:00",
        };
        return {
          ...slot,
          date: newDate,
          time: periodTimeRanges[newPeriod],
        };
      }
      return slot;
    }));
  };

  const handleColorChange = (lessonId: string, newColor: string) => {
    setSlots(prev => prev.map(slot => 
      slot.id === lessonId 
        ? { ...slot, color: newColor }
        : slot
    ));
  };

  const stats = useMemo(() => {
    const total = slots.length;
    const conflicts = slots.filter(s => s.conflict).length;
    const byType = {
      CLASS: slots.filter(s => s.type === "CLASS").length,
      MAKEUP: slots.filter(s => s.type === "MAKEUP").length,
      EVENT: slots.filter(s => s.type === "EVENT").length,
    };
    return { total, conflicts, byType };
  }, [slots]);

  const getLightColor = (colorClass: string | undefined) => {
    const defaultLight = "bg-gradient-to-br from-red-50 to-red-100";
    if (!colorClass) return defaultLight;

    return colorClass
      .replace('from-red-600 to-red-700', 'from-red-50 to-red-100')
      .replace('from-red-500 to-red-600', 'from-red-50 to-red-100')
      .replace('from-gray-600 to-gray-700', 'from-gray-100 to-gray-200')
      .replace('from-gray-500 to-gray-600', 'from-gray-100 to-gray-200')
      .replace('from-gray-700 to-gray-800', 'from-gray-200 to-gray-300')
      .replace('from-gray-200 to-gray-300', 'from-gray-100 to-gray-200')
      .replace('from-red-600 to-gray-600', 'from-red-50 to-gray-100')
      .replace('from-blue-500 to-sky-500', 'from-blue-100 to-sky-100')
      .replace('from-emerald-500 to-teal-500', 'from-emerald-100 to-teal-100')
      .replace('from-amber-500 to-orange-500', 'from-amber-100 to-orange-100')
      .replace('from-indigo-500 to-blue-500', 'from-indigo-100 to-blue-100');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 p-6 space-y-6">
      <div className={`flex flex-wrap items-center justify-between gap-3 mb-8 transition-all duration-700 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
            <CalendarDays size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Điều phối lịch, lớp, phòng
            </h1>
            <p className="text-sm text-gray-700 mt-1">
              Tạo/đổi ca, gán giáo viên, xử lý xung đột lịch và gửi thông báo. Kéo thả để di chuyển lịch.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-100 transition-colors cursor-pointer text-gray-700">
            <Download size={16} /> Xuất lịch
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95">
            <PlusCircle size={16} /> Tạo ca mới
          </button>
        </div>
      </div>

      <div className={`grid gap-4 md:grid-cols-4 transition-all duration-700 delay-100 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-700">Tổng số ca</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-700">Xung đột</div>
          <div className="text-2xl font-bold text-gray-900">{stats.conflicts}</div>
        </div>
        <div className="rounded-2xl border border-red-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-700">Lớp học</div>
          <div className="text-2xl font-bold text-gray-900">{stats.byType.CLASS}</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-700">Buổi bù</div>
          <div className="text-2xl font-bold text-gray-900">{stats.byType.MAKEUP}</div>
        </div>
      </div>

      <div className={`rounded-2xl border border-gray-200 bg-white p-4 flex flex-wrap gap-2 transition-all duration-700 delay-100 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        {["ALL", "CLASS", "MAKEUP", "EVENT"].map((item) => {
          const isActive = filter === item;
          const meta = item === "ALL" 
            ? { text: "Tất cả", badge: "bg-gradient-to-r from-red-600 to-red-700" }
            : TYPE_META[item as SlotType];
          
          return (
            <button
              key={item}
              onClick={() => setFilter(item as typeof filter)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                isActive 
                  ? `${meta.badge} text-white shadow-md` 
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span>{item === "ALL" ? "Tất cả" : meta.text}</span>
              {item !== "ALL" && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  isActive ? "bg-white/20" : "bg-gray-100 text-gray-700"
                }`}>
                  {stats.byType[item as SlotType]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className={`transition-all duration-700 delay-200 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <WeekTimetable 
          items={sortedList} 
          weekCursor={weekCursor} 
          setWeekCursor={setWeekCursor}
          onSlotMove={handleSlotMove}
          onColorChange={handleColorChange}
        />
      </div>

      <div className={`rounded-2xl border border-gray-200 bg-white p-4 transition-all duration-700 delay-200 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <div className="text-sm font-semibold text-gray-900 mb-3">Chú thích:</div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-600"></div>
            <span className="text-sm text-gray-700">Online</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gray-700"></div>
            <span className="text-sm text-gray-700">Offline</span>
          </div>
          <div className="flex items-center gap-2">
            <GripVertical size={14} className="text-gray-500" />
            <span className="text-sm text-gray-700">Kéo thả để di chuyển</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="text-amber-600" />
            <span className="text-sm text-gray-700">Xung đột lịch</span>
          </div>
          <div className="flex items-center gap-2">
            <Palette size={14} className="text-gray-500" />
            <span className="text-sm text-gray-700">Nhấn để đổi màu</span>
          </div>
        </div>
      </div>

      <div className={`space-y-4 transition-all duration-700 delay-300 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <div className="text-lg font-semibold text-gray-900">Chi tiết lịch</div>
        {sortedList.map((slot) => {
          const lightColor = getLightColor(slot.color);
          
          return (
            <div
              key={slot.id}
              className={`rounded-2xl border border-gray-200 p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between hover:shadow-md transition-all ${lightColor} ${
                slot.conflict ? "ring-2 ring-amber-400" : ""
              }`}
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <TypeBadge type={slot.type} />
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-gray-900">{slot.title}</span>
                    <ColorPicker 
                      lessonId={slot.id} 
                      currentColor={slot.color || TYPE_META[slot.type].defaultColor}
                      onColorChange={handleColorChange}
                    />
                    {slot.conflict && (
                      <span className="px-2 py-1 rounded-lg text-xs bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1">
                        <AlertCircle size={12} />
                        Xung đột
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="text-sm text-gray-700 inline-flex items-center gap-2">
                    <CalendarRange size={16} className="text-red-600" /> {slot.date}
                  </div>
                  <div className="text-sm text-gray-700 inline-flex items-center gap-2">
                    <Clock3 size={16} className="text-red-600" /> {slot.time}
                  </div>
                  <div className="text-sm text-gray-700 inline-flex items-center gap-2">
                    <Users size={16} className="text-red-600" /> {slot.teacher}
                  </div>
                  <div className="text-sm text-gray-700 inline-flex items-center gap-2">
                    <MapPin size={16} className="text-red-600" /> {slot.room}
                  </div>
                </div>
                {slot.note && (
                  <div className="text-xs text-gray-600 bg-white/50 rounded-lg p-2 inline-block">
                    {slot.note}
                  </div>
                )}
                {slot.branch && (
                  <div className="text-xs text-gray-600">
                    Chi nhánh: {slot.branch}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">
                  <ArrowLeftRight size={16} /> Đổi phòng
                </button>
                <button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">
                  <Users size={16} /> Đổi GV
                </button>
                <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-medium text-white hover:shadow-md transition-colors cursor-pointer">
                  <Send size={16} /> Gửi Zalo
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}