"use client";

import { useMemo, useState } from "react";
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
} from "lucide-react";

type SlotType = "CLASS" | "MAKEUP" | "EVENT";

type Slot = {
  id: string;
  title: string;
  type: SlotType;
  teacher: string;
  room: string;   // "Phòng 101" | "Online (Zoom)"...
  time: string;   // "HH:MM - HH:MM"
  date: string;   // "dd/MM/yyyy"
  note?: string;
};

/* =================== DATA (nhiều hơn & phủ đều tháng) =================== */
const SLOTS: Slot[] = [
  // Tuần 1
  { id: "S001", title: "PRE-IELTS 11", type: "CLASS", teacher: "Cô Hạnh", room: "Phòng 101", time: "18:30 - 20:00", date: "02/12/2024" },
  { id: "S002", title: "IELTS Speaking Club", type: "EVENT", teacher: "Academic", room: "Hội trường", time: "20:15 - 21:15", date: "03/12/2024" },
  { id: "S003", title: "TOEFL Junior A", type: "CLASS", teacher: "Thầy Tín", room: "Phòng 202", time: "17:30 - 19:00", date: "04/12/2024" },
  { id: "S004", title: "IELTS Foundation - A1", type: "CLASS", teacher: "Cô Phương", room: "Phòng 301", time: "19:00 - 21:00", date: "05/12/2024" },
  { id: "S005", title: "TOEIC Intermediate", type: "MAKEUP", teacher: "Thầy Minh", room: "Phòng 205", time: "16:00 - 18:00", date: "06/12/2024", note: "Bù cho 03/12" },
  { id: "S006", title: "Kids English F1", type: "CLASS", teacher: "Cô Vi", room: "Phòng 102", time: "18:30 - 20:00", date: "06/12/2024" },
  { id: "S007", title: "Họp phụ huynh tháng 12", type: "EVENT", teacher: "Ban quản lý", room: "Hội trường", time: "09:00 - 11:00", date: "07/12/2024" },
  { id: "S008", title: "Mock Test IELTS", type: "EVENT", teacher: "Academic", room: "Phòng 201", time: "08:00 - 11:30", date: "08/12/2024" },

  // Tuần 2
  { id: "S009",  title: "PRE-IELTS 11", type: "CLASS", teacher: "Cô Hạnh", room: "Phòng 101", time: "18:30 - 20:00", date: "09/12/2024" },
  { id: "S010",  title: "Grammar Booster", type: "CLASS", teacher: "Thầy Lộc", room: "Online (Zoom)", time: "19:30 - 20:30", date: "10/12/2024" },
  { id: "S011",  title: "TOEIC Bridge", type: "CLASS", teacher: "Cô Uyên", room: "Phòng 203", time: "18:00 - 19:30", date: "11/12/2024" },
  { id: "S012",  title: "IELTS Foundation - A1", type: "CLASS", teacher: "Cô Phương", room: "Phòng 301", time: "19:00 - 21:00", date: "12/12/2024" },
  { id: "S013",  title: "TOEIC Intermediate", type: "MAKEUP", teacher: "Thầy Minh", room: "Phòng 205", time: "16:00 - 18:00", date: "13/12/2024" },
  { id: "S014",  title: "Workshop Kỹ năng nghe", type: "EVENT", teacher: "Academic", room: "Phòng 201", time: "09:30 - 11:00", date: "14/12/2024" },

  // Tuần 3
  { id: "S015",  title: "PRE-IELTS 11", type: "CLASS", teacher: "Cô Hạnh", room: "Phòng 101", time: "18:30 - 20:00", date: "16/12/2024" },
  { id: "S016",  title: "Communication English", type: "CLASS", teacher: "Cô Tiên", room: "Online (Zoom)", time: "19:00 - 20:30", date: "17/12/2024" },
  { id: "S017",  title: "TOEFL Junior A", type: "CLASS", teacher: "Thầy Tín", room: "Phòng 202", time: "17:30 - 19:00", date: "18/12/2024" },
  { id: "S018",  title: "IELTS Foundation - A1", type: "CLASS", teacher: "Cô Phương", room: "Phòng 301", time: "19:00 - 21:00", date: "19/12/2024" },
  { id: "S019",  title: "TOEIC Intermediate", type: "MAKEUP", teacher: "Thầy Minh", room: "Phòng 205", time: "16:00 - 18:00", date: "20/12/2024" },
  { id: "S020",  title: "Christmas Rehearsal", type: "EVENT", teacher: "CLB Văn nghệ", room: "Hội trường", time: "15:00 - 17:00", date: "21/12/2024" },
  { id: "S021",  title: "Mock Test 2", type: "EVENT", teacher: "Academic", room: "Phòng 201", time: "08:00 - 11:30", date: "22/12/2024" },

  // Tuần 4
  { id: "S022",  title: "PRE-IELTS 11", type: "CLASS", teacher: "Cô Hạnh", room: "Phòng 101", time: "18:30 - 20:00", date: "23/12/2024" },
  { id: "S023",  title: "Noel Party", type: "EVENT", teacher: "Ban quản lý", room: "Hội trường", time: "18:30 - 21:00", date: "24/12/2024" },
  { id: "S024",  title: "Giáng sinh (Nghỉ)", type: "EVENT", teacher: "Thông báo", room: "Toàn hệ thống", time: "00:00 - 23:59", date: "25/12/2024" },
  { id: "S025",  title: "IELTS Foundation - A1", type: "CLASS", teacher: "Cô Phương", room: "Phòng 301", time: "19:00 - 21:00", date: "26/12/2024" },
  { id: "S026",  title: "TOEIC Intermediate", type: "MAKEUP", teacher: "Thầy Minh", room: "Online (Zoom)", time: "16:30 - 18:00", date: "27/12/2024" },
  { id: "S027",  title: "Tổng kết tháng 12", type: "EVENT", teacher: "Academic", room: "Hội trường", time: "08:30 - 10:00", date: "28/12/2024" },
  { id: "S028",  title: "PRE-IELTS 12 (khai giảng)", type: "EVENT", teacher: "Tuyển sinh", room: "Phòng 101", time: "09:00 - 10:00", date: "29/12/2024" },
  { id: "S029",  title: "PRE-IELTS 11 Ôn tập", type: "CLASS", teacher: "Cô Hạnh", room: "Online (Zoom)", time: "18:30 - 20:00", date: "30/12/2024" },
  { id: "S030",  title: "CLB Phát âm", type: "EVENT", teacher: "Academic", room: "Phòng 103", time: "19:00 - 20:00", date: "31/12/2024" },
];

/* =================== MÀU RÕ RÀNG THEO LOẠI =================== */
const TYPE_META: Record<
  SlotType,
  { text: string; badge: string; chip: string; bar: string }
> = {
  CLASS: {
    text: "Lớp học",
    badge: "bg-indigo-600 text-white",
    chip: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    bar: "border-l-4 border-indigo-400",
  },
  MAKEUP: {
    text: "Buổi bù",
    badge: "bg-rose-600 text-white",
    chip: "bg-rose-50 text-rose-700 border border-rose-200",
    bar: "border-l-4 border-rose-400",
  },
  EVENT: {
    text: "Sự kiện",
    badge: "bg-amber-500 text-white",
    chip: "bg-amber-50 text-amber-700 border border-amber-200",
    bar: "border-l-4 border-amber-400",
  },
};

function TypeBadge({ type }: { type: SlotType }) {
  const { text, badge } = TYPE_META[type];
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge}`}>{text}</span>;
}

/* ===== Helpers: parse, sort, week grid ===== */
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
  const dow = (date.getDay() + 6) % 7; // Mon=0..Sun=6
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

/* =================== WEEK TIMETABLE (Mon→Sun x 3 ca) =================== */
function WeekTimetable({
  items,
  weekCursor,
  setWeekCursor,
}: {
  items: Slot[];
  weekCursor: Date; // Monday of week
  setWeekCursor: (d: Date) => void;
}) {
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekCursor, i)), [weekCursor]);

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

  const modeDot = (room: string) =>
    room.toLowerCase().includes("online") ? "bg-emerald-500" : "bg-sky-500";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <h2 className="text-lg font-bold">Thời khoá biểu theo tuần</h2>
        <div className="flex items-center gap-2">
          <button
            className="rounded-lg border border-slate-200 px-2 py-2 hover:bg-slate-50"
            onClick={() => setWeekCursor(addDays(weekCursor, -7))}
          >
            <ChevronLeft size={18} />
          </button>
          <div className="min-w-[220px] text-center text-sm font-semibold text-slate-700">
            Tuần {rangeText}
          </div>
          <button
            className="rounded-lg border border-slate-200 px-2 py-2 hover:bg-slate-50"
            onClick={() => setWeekCursor(addDays(weekCursor, +7))}
          >
            <ChevronRight size={18} />
          </button>
          <button
            className="ml-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
            onClick={() => setWeekCursor(startOfWeek(new Date()))}
          >
            Tuần này
          </button>
        </div>
      </div>

      {/* Head row (Mon..Sun) */}
      <div className="grid grid-cols-8 border-t border-slate-100 bg-slate-50 text-xs font-semibold text-slate-600">
        <div className="px-3 py-2">Ca / Ngày</div>
        {days.map((d) => {
          const key = keyYMD(d);
          const isToday = key === todayKey;
          const dow = d.toLocaleDateString("vi-VN", { weekday: "short" });
          return (
            <div
              key={key}
              className={`px-3 py-2 ${isToday ? "text-sky-700" : ""}`}
            >
              <div className="flex items-center gap-2">
                <span className="capitalize">{dow}</span>
                <span className={`h-6 w-6 grid place-items-center rounded-full text-[12px] font-bold ${isToday ? "bg-sky-600 text-white" : "bg-white text-slate-700 border border-slate-200"}`}>
                  {d.getDate()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Body: 3 rows (Sáng / Chiều / Tối) */}
      {PERIODS.map((p, rowIdx) => (
        <div key={p.key} className="grid grid-cols-8 border-t border-slate-100">
          {/* Row label */}
          <div className="px-3 py-3 text-sm font-semibold text-slate-700 bg-slate-50">
            {p.label}
          </div>

          {/* 7 day cells */}
          {days.map((d) => {
            const k = `${keyYMD(d)}|${p.key}`;
            const evts = grouped[k] || [];
            return (
              <div key={k} className={`min-h-[110px] p-2 ${rowIdx % 2 ? "bg-white" : "bg-slate-50/40"} border-l border-slate-100`}>
                <div className="space-y-1.5">
                  {evts.map((s) => {
                    const t = TYPE_META[s.type];
                    const mode = s.room?.toLowerCase().includes("online") ? "Online" : "Offline";
                    return (
                      <div key={s.id} className={`rounded-md px-2 py-1 text-[12px] ${t.chip} ${t.bar}`}>
                        <div className="flex items-center gap-1">
                          <span className={`h-1.5 w-1.5 rounded-full ${modeDot(s.room)}`} />
                          <span className="font-medium">{s.time}</span>
                          <span className="opacity-70">· {s.title}</span>
                        </div>
                        <div className="text-[11px] opacity-80">{s.room}</div>
                      </div>
                    );
                  })}
                  {evts.length === 0 && (
                    <div className="text-[12px] text-slate-400 italic">Trống</div>
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

/* =================== PAGE =================== */
export default function AdminSchedulePage() {
  const [filter, setFilter] = useState<SlotType | "ALL">("ALL");

  const list = useMemo(() => {
    if (filter === "ALL") return SLOTS;
    return SLOTS.filter((slot) => slot.type === filter);
  }, [filter]);

  // mặc định lấy tuần chứa slot đầu tiên; nếu không có thì tuần hiện tại
  const baseDate = list.length ? parseVNDate(list[0].date) : new Date();
  const [weekCursor, setWeekCursor] = useState<Date>(startOfWeek(baseDate));

  // sắp xếp để phần “danh sách thẻ” phía dưới đẹp
  const sortedList = useMemo(() => {
    return [...list].sort((a, b) => {
      const da = parseVNDate(a.date).getTime();
      const db = parseVNDate(b.date).getTime();
      if (da !== db) return da - db;
      return startMinutes(a.time) - startMinutes(b.time);
    });
  }, [list]);

  return (
    <div className="space-y-6 text-slate-900">
      {/* Header actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Lịch chung toàn hệ thống</h1>
          <p className="text-sm text-slate-500">
            Lịch dạng tuần (Thứ 2 → Chủ nhật) theo 3 ca Sáng – Chiều – Tối.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50">
            <Download size={16} /> Xuất lịch tuần
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">
            <PlusCircle size={16} /> Tạo lịch mới
          </button>
        </div>
      </div>

      {/* Bộ lọc */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-wrap gap-2">
        {["ALL", "CLASS", "MAKEUP", "EVENT"].map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item as typeof filter)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              filter === item ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            {item === "ALL" ? "Tất cả" : TYPE_META[item as SlotType].text}
          </button>
        ))}
      </div>

      {/* ✅ Thời khoá biểu theo tuần */}
      <WeekTimetable items={sortedList} weekCursor={weekCursor} setWeekCursor={setWeekCursor} />

      {/* Danh sách thẻ chi tiết (tuỳ thích giữ lại để thao tác nhanh) */}
      <div className="space-y-4">
        {sortedList.map((slot) => (
          <div
            key={slot.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <TypeBadge type={slot.type} />
                <span className="text-lg font-semibold text-gray-900">{slot.title}</span>
              </div>
              <div className="text-sm text-slate-600 inline-flex items-center gap-2">
                <CalendarRange size={16} /> {slot.date}
              </div>
              <div className="text-sm text-slate-600 inline-flex items-center gap-2">
                <Clock3 size={16} /> {slot.time}
              </div>
              <div className="text-sm text-slate-600 inline-flex items-center gap-2">
                <Users size={16} /> {slot.teacher}
              </div>
              <div className="text-sm text-slate-600 inline-flex items-center gap-2">
                <MapPin size={16} /> {slot.room}
              </div>
              {slot.note ? <div className="text-xs text-slate-400">{slot.note}</div> : null}
            </div>
            <div className="flex gap-2">
              {slot.type === "MAKEUP" ? (
                <button className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100">
                  <ArrowLeftRight size={16} /> Phân bổ buổi bù
                </button>
              ) : null}
              <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                <Send size={16} /> Gửi thông báo
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Ghi chú */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3">
        <div className="font-semibold text-gray-900">Ghi chú quản lý</div>
        <p className="text-sm text-slate-600">
          Các buổi bù sẽ được tổng hợp và gửi báo cáo cuối tháng cho bộ phận tài chính để đối soát học phí.
        </p>
      </div>
    </div>
  );
}
