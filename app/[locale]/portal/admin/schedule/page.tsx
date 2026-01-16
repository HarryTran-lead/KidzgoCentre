"use client";

import { useMemo, useState, useEffect, useRef } from "react";
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
  Palette,
  X,
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
  color?: string; // Mới: gradient class từ Tailwind
};

/* =================== DATA với màu sắc =================== */
const SLOTS: Slot[] = [
  // Tuần 1
  { id: "S001", title: "PRE-IELTS 11", type: "CLASS", teacher: "Cô Hạnh", room: "Phòng 101", time: "18:30 - 20:00", date: "02/12/2024", color: "bg-gradient-to-r from-pink-500 to-rose-500" },
  { id: "S002", title: "IELTS Speaking Club", type: "EVENT", teacher: "Academic", room: "Hội trường", time: "20:15 - 21:15", date: "03/12/2024", color: "bg-gradient-to-r from-amber-500 to-orange-500" },
  { id: "S003", title: "TOEFL Junior A", type: "CLASS", teacher: "Thầy Tín", room: "Phòng 202", time: "17:30 - 19:00", date: "04/12/2024", color: "bg-gradient-to-r from-blue-500 to-sky-500" },
  { id: "S004", title: "IELTS Foundation - A1", type: "CLASS", teacher: "Cô Phương", room: "Phòng 301", time: "19:00 - 21:00", date: "05/12/2024", color: "bg-gradient-to-r from-emerald-500 to-teal-500" },
  { id: "S005", title: "TOEIC Intermediate", type: "MAKEUP", teacher: "Thầy Minh", room: "Phòng 205", time: "16:00 - 18:00", date: "06/12/2024", note: "Bù cho 03/12", color: "bg-gradient-to-r from-fuchsia-500 to-purple-500" },
  { id: "S006", title: "Kids English F1", type: "CLASS", teacher: "Cô Vi", room: "Phòng 102", time: "18:30 - 20:00", date: "06/12/2024", color: "bg-gradient-to-r from-indigo-500 to-blue-500" },
  { id: "S007", title: "Họp phụ huynh tháng 12", type: "EVENT", teacher: "Ban quản lý", room: "Hội trường", time: "09:00 - 11:00", date: "07/12/2024", color: "bg-gradient-to-r from-violet-500 to-purple-600" },
  { id: "S008", title: "Mock Test IELTS", type: "EVENT", teacher: "Academic", room: "Phòng 201", time: "08:00 - 11:30", date: "08/12/2024", color: "bg-gradient-to-r from-rose-500 to-pink-600" },

  // Tuần 2
  { id: "S009",  title: "PRE-IELTS 11", type: "CLASS", teacher: "Cô Hạnh", room: "Phòng 101", time: "18:30 - 20:00", date: "09/12/2024", color: "bg-gradient-to-r from-pink-500 to-rose-500" },
  { id: "S010",  title: "Grammar Booster", type: "CLASS", teacher: "Thầy Lộc", room: "Online (Zoom)", time: "19:30 - 20:30", date: "10/12/2024", color: "bg-gradient-to-r from-blue-500 to-sky-500" },
  { id: "S011",  title: "TOEIC Bridge", type: "CLASS", teacher: "Cô Uyên", room: "Phòng 203", time: "18:00 - 19:30", date: "11/12/2024", color: "bg-gradient-to-r from-emerald-500 to-teal-500" },
  { id: "S012",  title: "IELTS Foundation - A1", type: "CLASS", teacher: "Cô Phương", room: "Phòng 301", time: "19:00 - 21:00", date: "12/12/2024", color: "bg-gradient-to-r from-emerald-500 to-teal-500" },
  { id: "S013",  title: "TOEIC Intermediate", type: "MAKEUP", teacher: "Thầy Minh", room: "Phòng 205", time: "16:00 - 18:00", date: "13/12/2024", color: "bg-gradient-to-r from-fuchsia-500 to-purple-500" },
  { id: "S014",  title: "Workshop Kỹ năng nghe", type: "EVENT", teacher: "Academic", room: "Phòng 201", time: "09:30 - 11:00", date: "14/12/2024", color: "bg-gradient-to-r from-amber-500 to-orange-500" },

  // Tuần 3
  { id: "S015",  title: "PRE-IELTS 11", type: "CLASS", teacher: "Cô Hạnh", room: "Phòng 101", time: "18:30 - 20:00", date: "16/12/2024", color: "bg-gradient-to-r from-pink-500 to-rose-500" },
  { id: "S016",  title: "Communication English", type: "CLASS", teacher: "Cô Tiên", room: "Online (Zoom)", time: "19:00 - 20:30", date: "17/12/2024", color: "bg-gradient-to-r from-blue-500 to-sky-500" },
  { id: "S017",  title: "TOEFL Junior A", type: "CLASS", teacher: "Thầy Tín", room: "Phòng 202", time: "17:30 - 19:00", date: "18/12/2024", color: "bg-gradient-to-r from-blue-500 to-sky-500" },
  { id: "S018",  title: "IELTS Foundation - A1", type: "CLASS", teacher: "Cô Phương", room: "Phòng 301", time: "19:00 - 21:00", date: "19/12/2024", color: "bg-gradient-to-r from-emerald-500 to-teal-500" },
  { id: "S019",  title: "TOEIC Intermediate", type: "MAKEUP", teacher: "Thầy Minh", room: "Phòng 205", time: "16:00 - 18:00", date: "20/12/2024", color: "bg-gradient-to-r from-fuchsia-500 to-purple-500" },
  { id: "S020",  title: "Christmas Rehearsal", type: "EVENT", teacher: "CLB Văn nghệ", room: "Hội trường", time: "15:00 - 17:00", date: "21/12/2024", color: "bg-gradient-to-r from-violet-500 to-purple-600" },
  { id: "S021",  title: "Mock Test 2", type: "EVENT", teacher: "Academic", room: "Phòng 201", time: "08:00 - 11:30", date: "22/12/2024", color: "bg-gradient-to-r from-rose-500 to-pink-600" },

  // Tuần 4
  { id: "S022",  title: "PRE-IELTS 11", type: "CLASS", teacher: "Cô Hạnh", room: "Phòng 101", time: "18:30 - 20:00", date: "23/12/2024", color: "bg-gradient-to-r from-pink-500 to-rose-500" },
  { id: "S023",  title: "Noel Party", type: "EVENT", teacher: "Ban quản lý", room: "Hội trường", time: "18:30 - 21:00", date: "24/12/2024", color: "bg-gradient-to-r from-amber-500 to-orange-500" },
  { id: "S024",  title: "Giáng sinh (Nghỉ)", type: "EVENT", teacher: "Thông báo", room: "Toàn hệ thống", time: "00:00 - 23:59", date: "25/12/2024", color: "bg-gradient-to-r from-gray-500 to-slate-500" },
  { id: "S025",  title: "IELTS Foundation - A1", type: "CLASS", teacher: "Cô Phương", room: "Phòng 301", time: "19:00 - 21:00", date: "26/12/2024", color: "bg-gradient-to-r from-emerald-500 to-teal-500" },
  { id: "S026",  title: "TOEIC Intermediate", type: "MAKEUP", teacher: "Thầy Minh", room: "Online (Zoom)", time: "16:30 - 18:00", date: "27/12/2024", color: "bg-gradient-to-r from-fuchsia-500 to-purple-500" },
  { id: "S027",  title: "Tổng kết tháng 12", type: "EVENT", teacher: "Academic", room: "Hội trường", time: "08:30 - 10:00", date: "28/12/2024", color: "bg-gradient-to-r from-violet-500 to-purple-600" },
  { id: "S028",  title: "PRE-IELTS 12 (khai giảng)", type: "EVENT", teacher: "Tuyển sinh", room: "Phòng 101", time: "09:00 - 10:00", date: "29/12/2024", color: "bg-gradient-to-r from-amber-500 to-orange-500" },
  { id: "S029",  title: "PRE-IELTS 11 Ôn tập", type: "CLASS", teacher: "Cô Hạnh", room: "Online (Zoom)", time: "18:30 - 20:00", date: "30/12/2024", color: "bg-gradient-to-r from-pink-500 to-rose-500" },
  { id: "S030",  title: "CLB Phát âm", type: "EVENT", teacher: "Academic", room: "Phòng 103", time: "19:00 - 20:00", date: "31/12/2024", color: "bg-gradient-to-r from-amber-500 to-orange-500" },
];

/* =================== MÀU RÕ RÀNG THEO LOẠI =================== */
const TYPE_META: Record<
  SlotType,
  { text: string; badge: string; chip: string; bar: string; defaultColor: string }
> = {
  CLASS: {
    text: "Lớp học",
    badge: "bg-indigo-600 text-white",
    chip: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    bar: "border-l-4 border-indigo-400",
    defaultColor: "bg-gradient-to-r from-indigo-500 to-blue-500"
  },
  MAKEUP: {
    text: "Buổi bù",
    badge: "bg-rose-600 text-white",
    chip: "bg-rose-50 text-rose-700 border border-rose-200",
    bar: "border-l-4 border-rose-400",
    defaultColor: "bg-gradient-to-r from-fuchsia-500 to-purple-500"
  },
  EVENT: {
    text: "Sự kiện",
    badge: "bg-amber-500 text-white",
    chip: "bg-amber-50 text-amber-700 border border-amber-200",
    bar: "border-l-4 border-amber-400",
    defaultColor: "bg-gradient-to-r from-amber-500 to-orange-500"
  },
};

/* =================== COLOR OPTIONS =================== */
const COLOR_OPTIONS = [
  { name: 'Pink', value: 'bg-gradient-to-r from-pink-500 to-rose-500' },
  { name: 'Purple', value: 'bg-gradient-to-r from-fuchsia-500 to-purple-500' },
  { name: 'Amber', value: 'bg-gradient-to-r from-amber-500 to-orange-500' },
  { name: 'Emerald', value: 'bg-gradient-to-r from-emerald-500 to-teal-500' },
  { name: 'Blue', value: 'bg-gradient-to-r from-blue-500 to-sky-500' },
  { name: 'Indigo', value: 'bg-gradient-to-r from-indigo-500 to-blue-500' },
  { name: 'Rose', value: 'bg-gradient-to-r from-rose-500 to-pink-600' },
  { name: 'Violet', value: 'bg-gradient-to-r from-violet-500 to-purple-600' },
];

/* ===== Components ===== */
function TypeBadge({ type }: { type: SlotType }) {
  const { text, badge } = TYPE_META[type];
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge}`}>{text}</span>;
}

function CreateScheduleModal({
  isOpen,
  onClose,
  date,
  period,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  period: Period | null;
  onSave: (slot: Omit<Slot, "id">) => void;
}) {
  const [formData, setFormData] = useState({
    title: "",
    type: "CLASS" as SlotType,
    teacher: "",
    room: "",
    time: "",
    note: "",
    color: "bg-gradient-to-r from-pink-500 to-rose-500",
  });

  if (!isOpen || !date || !period) return null;

  const periodTimeRanges = {
    MORNING: "07:00 - 12:00",
    AFTERNOON: "12:00 - 18:00",
    EVENING: "18:00 - 22:00",
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.teacher || !formData.room || !formData.time) {
      return;
    }
    
    const dateStr = `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
    
    onSave({
      ...formData,
      date: dateStr,
    });
    
    setFormData({
      title: "",
      type: "CLASS",
      teacher: "",
      room: "",
      time: "",
      note: "",
      color: "bg-gradient-to-r from-pink-500 to-rose-500",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-pink-200 bg-gradient-to-br from-white to-pink-50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-gradient-to-r from-pink-100 to-rose-100 border-b border-pink-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md">
              <CalendarDays size={18} />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900">Tạo lịch mới</h2>
              <p className="text-xs text-gray-600 mt-0.5">
                Chọn ngày, ca học và điền thông tin lớp/buổi bù/sự kiện.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-pink-200/60 bg-white/60 border border-pink-200 transition-colors"
          >
            <X size={18} className="text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày</label>
              <div className="px-4 py-2.5 rounded-xl border border-pink-200 bg-gray-50 text-gray-700">
                {date.toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ca học</label>
              <div className="px-4 py-2.5 rounded-xl border border-pink-200 bg-gray-50 text-gray-700">
                {PERIODS.find(p => p.key === period)?.label} ({periodTimeRanges[period]})
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-200"
              placeholder="VD: IELTS Foundation - A1"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại <span className="text-red-500">*</span></label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as SlotType })}
                className="w-full px-4 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-200"
                required
              >
                <option value="CLASS">Lớp học</option>
                <option value="MAKEUP">Buổi bù</option>
                <option value="EVENT">Sự kiện</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giáo viên <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.teacher}
                onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-200"
                placeholder="VD: Cô Phương"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phòng học <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-200"
                placeholder="VD: Phòng 101 hoặc Online (Zoom)"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-200"
                placeholder="VD: 18:30 - 20:00"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Màu sắc</label>
            <div className="grid grid-cols-8">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`h-8 w-8 rounded-lg cursor-pointer ${color.value} border-2 ${
                    formData.color === color.value ? 'border-white ring-2 ring-pink-500' : 'border-transparent'
                  } hover:scale-110 transition-all`}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-200"
              placeholder="VD: Bù cho 03/12"
              rows={2}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-pink-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-pink-200 text-gray-700 hover:bg-pink-50 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-lg transition-all cursor-pointer"
            >
              Tạo lịch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
        className="text-xs bg-white/80 hover:bg-white backdrop-blur-sm rounded-lg px-2 py-1 transition-colors cursor-pointer flex items-center gap-1 border border-pink-200"
        title="Đổi màu"
      >
        <Palette size={12} className="text-gray-700" />
      </button>
      {showPicker && (
        <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-pink-200 p-1.5 z-50 overflow-hidden w-[140px]">
          <div className="text-[10px] font-semibold text-gray-700 mb-1.5 px-1">Chọn màu</div>
          <div className="grid grid-cols-4 gap-1.5">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color.value}
                onClick={(e) => {
                  e.stopPropagation();
                  onColorChange(lessonId, color.value);
                  setShowPicker(false);
                }}
                className={`w-6 h-6 rounded-md ${color.value} border-2 ${currentColor === color.value ? 'border-white ring-1 ring-pink-500' : 'border-transparent'} hover:scale-110 transition-all cursor-pointer`}
                title={color.name}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== Helpers ===== */
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

/* =================== WEEK TIMETABLE với style giống trang trước =================== */
function WeekTimetable({
  items,
  weekCursor,
  setWeekCursor,
  onColorChange,
  onCellClick,
}: {
  items: Slot[];
  weekCursor: Date;
  setWeekCursor: (d: Date) => void;
  onColorChange?: (lessonId: string, color: string) => void;
  onCellClick?: (date: Date, period: Period) => void;
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

  // Hàm tạo màu nhạt từ gradient
  const getLightColor = (colorClass: string | undefined) => {
    const defaultLight = "bg-gradient-to-br from-pink-100 to-rose-100";
    if (!colorClass) return defaultLight;
    
    return colorClass
      .replace('from-pink-500 to-rose-500', 'from-pink-100 to-rose-100')
      .replace('from-rose-500 to-pink-600', 'from-rose-100 to-pink-100')
      .replace('from-fuchsia-500 to-purple-500', 'from-fuchsia-100 to-purple-100')
      .replace('from-blue-500 to-sky-500', 'from-blue-100 to-sky-100')
      .replace('from-emerald-500 to-teal-500', 'from-emerald-100 to-teal-100')
      .replace('from-amber-500 to-orange-500', 'from-amber-100 to-orange-100')
      .replace('from-indigo-500 to-blue-500', 'from-indigo-100 to-blue-100')
      .replace('from-violet-500 to-purple-600', 'from-violet-100 to-purple-100')
      .replace('from-gray-500 to-slate-500', 'from-gray-100 to-slate-100');
  };

  const modeDot = (room: string) =>
    room.toLowerCase().includes("online") ? "bg-emerald-500" : "bg-sky-500";

  return (
    <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 shadow-sm">
      {/* Header với style giống trang trước */}
      <div className="flex items-center justify-between p-6 border-b border-pink-200 bg-gradient-to-r from-pink-500/10 to-rose-500/10">
        <div className="flex items-center gap-4">
          <div className={`relative p-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg`}>
            <CalendarDays size={24} />
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center">
              <span className="text-xs font-bold text-pink-600">
                {days[0].getDate()}
              </span>
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">Lịch tuần</div>
            <div className="text-gray-600">{rangeText}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-lg border border-pink-200 hover:bg-pink-50 transition-colors cursor-pointer"
            onClick={() => setWeekCursor(addDays(weekCursor, -7))}
          >
            <ChevronLeft size={18} className="text-gray-600" />
          </button>
          <div className="min-w-[220px] text-center text-sm font-semibold text-gray-700">
            Tuần từ {days[0].getDate()}/{days[0].getMonth()+1} đến {days[6].getDate()}/{days[6].getMonth()+1}
          </div>
          <button
            className="p-2 rounded-lg border border-pink-200 hover:bg-pink-50 transition-colors cursor-pointer"
            onClick={() => setWeekCursor(addDays(weekCursor, +7))}
          >
            <ChevronRight size={18} className="text-gray-600" />
          </button>
          <button
            className="ml-2 rounded-xl border border-pink-200 bg-white px-4 py-2 text-sm hover:bg-pink-50 transition-colors cursor-pointer text-gray-700"
            onClick={() => setWeekCursor(startOfWeek(new Date()))}
          >
            Tuần này
          </button>
        </div>
      </div>

      {/* Head row (Mon..Sun) với style cải tiến */}
      <div className="grid grid-cols-8 border-t border-pink-200 bg-gradient-to-r from-pink-500/5 to-rose-500/5 text-sm font-semibold text-gray-700">
        <div className="px-4 py-3">Ca / Ngày</div>
        {days.map((d) => {
          const key = keyYMD(d);
          const isToday = key === todayKey;
          const dow = d.toLocaleDateString("vi-VN", { weekday: "long" });
          return (
            <div
              key={key}
              className={`px-4 py-3 border-l border-pink-200 ${isToday ? "bg-gradient-to-r from-pink-500/10 to-rose-500/10" : ""}`}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="capitalize">{dow}</span>
                <span className={`h-8 w-8 flex items-center justify-center rounded-full text-sm font-bold ${
                  isToday 
                    ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md" 
                    : "bg-white text-gray-700 border border-pink-200"
                }`}>
                  {d.getDate()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Body: 3 rows (Sáng / Chiều / Tối) với card style */}
      {PERIODS.map((p, rowIdx) => (
        <div key={p.key} className="grid grid-cols-8 border-t border-pink-100">
          {/* Row label với style đẹp */}
          <div className="px-4 py-4 text-sm font-semibold text-gray-700 bg-gradient-to-r from-pink-500/5 to-rose-500/5 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <span className="font-bold text-lg">{p.label}</span>
              {p.key === "MORNING" && <span className="text-xs text-gray-500 mt-1">7:00-12:00</span>}
              {p.key === "AFTERNOON" && <span className="text-xs text-gray-500 mt-1">12:00-18:00</span>}
              {p.key === "EVENING" && <span className="text-xs text-gray-500 mt-1">18:00-22:00</span>}
            </div>
          </div>

          {/* 7 day cells với card style */}
          {days.map((d) => {
            const k = `${keyYMD(d)}|${p.key}`;
            const evts = grouped[k] || [];
            return (
              <div 
                key={k} 
                className={`min-h-[130px] p-3 ${
                  rowIdx % 2 
                    ? "bg-white" 
                    : "bg-pink-50/30"
                } border-l border-pink-100`}
              >
                <div className="space-y-2">
                  {evts.map((s) => {
                    const lightColor = getLightColor(s.color);
                    return (
                      <div 
                        key={s.id} 
                        className={`rounded-xl p-2.5 text-xs transition-all duration-200 hover:shadow-md cursor-pointer border border-pink-200 ${lightColor}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className={`h-2 w-2 rounded-full ${modeDot(s.room)}`} />
                              <span className="font-semibold text-gray-900 truncate">{s.title}</span>
                            </div>
                            <div className="text-[11px] text-gray-600 mb-1">{s.time}</div>
                            <div className="text-[11px] text-gray-500 flex items-center gap-1">
                              <MapPin size={10} />
                              <span className="truncate">{s.room}</span>
                            </div>
                            <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                              <Users size={10} />
                              <span>{s.teacher}</span>
                            </div>
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
                    <div 
                      className="text-[13px] text-gray-400 italic text-center py-4 hover:bg-pink-50 rounded-lg cursor-pointer transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onCellClick) {
                          onCellClick(d, p.key);
                        }
                      }}
                    >
                      Trống 
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

/* =================== PAGE =================== */
export default function AdminSchedulePage() {
  const [filter, setFilter] = useState<SlotType | "ALL">("ALL");
  const [slots, setSlots] = useState<Slot[]>(SLOTS);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);

  const list = useMemo(() => {
    if (filter === "ALL") return slots;
    return slots.filter((slot) => slot.type === filter);
  }, [filter, slots]);

  const baseDate = list.length ? parseVNDate(list[0].date) : new Date();
  const [weekCursor, setWeekCursor] = useState<Date>(startOfWeek(baseDate));

  const sortedList = useMemo(() => {
    return [...list].sort((a, b) => {
      const da = parseVNDate(a.date).getTime();
      const db = parseVNDate(b.date).getTime();
      if (da !== db) return da - db;
      return startMinutes(a.time) - startMinutes(b.time);
    });
  }, [list]);

  // Xử lý thay đổi màu
  const handleColorChange = (lessonId: string, newColor: string) => {
    setSlots(prev => prev.map(slot => 
      slot.id === lessonId 
        ? { ...slot, color: newColor }
        : slot
    ));
  };

  // Xử lý click vào ô trống
  const handleCellClick = (date: Date, period: Period) => {
    setSelectedDate(date);
    setSelectedPeriod(period);
    setModalOpen(true);
  };

  // Xử lý tạo lịch mới
  const handleCreateSchedule = (slotData: Omit<Slot, "id">) => {
    const newId = `S${String(slots.length + 1).padStart(3, "0")}`;
    const newSlot: Slot = {
      ...slotData,
      id: newId,
    };
    setSlots(prev => [...prev, newSlot]);
    setModalOpen(false);
    setSelectedDate(null);
    setSelectedPeriod(null);
  };

  // Thống kê
  const stats = useMemo(() => {
    const total = slots.length;
    const byType = {
      CLASS: slots.filter(s => s.type === "CLASS").length,
      MAKEUP: slots.filter(s => s.type === "MAKEUP").length,
      EVENT: slots.filter(s => s.type === "EVENT").length,
    };
    return { total, byType };
  }, [slots]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-6 space-y-6">
      {/* Header với style giống trang trước */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
            <CalendarDays size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Lịch chung toàn hệ thống
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Quản lý và theo dõi lịch học theo tuần với 3 ca Sáng – Chiều – Tối
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-pink-50 transition-colors cursor-pointer">
              <Download size={16} /> Xuất lịch
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer">
              <PlusCircle size={16} /> Tạo lịch mới
            </button>
          </div>
        </div>
      </div>

      {/* Bộ lọc với style đẹp hơn */}
      <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-4 flex flex-wrap gap-2">
        {["ALL", "CLASS", "MAKEUP", "EVENT"].map((item) => {
          const isActive = filter === item;
          const meta = item === "ALL" 
            ? { text: "Tất cả", badge: "bg-gradient-to-r from-pink-500 to-rose-500" }
            : TYPE_META[item as SlotType];
          
          return (
            <button
              key={item}
              onClick={() => setFilter(item as typeof filter)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                isActive 
                  ? `${meta.badge} text-white shadow-md` 
                  : "bg-white border border-pink-200 text-gray-600 hover:bg-pink-50"
              }`}
            >
              <span>{item === "ALL" ? "Tất cả" : meta.text}</span>
              {item !== "ALL" && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  isActive ? "bg-white/20" : "bg-gray-100"
                }`}>
                  {stats.byType[item as SlotType]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ✅ Thời khoá biểu theo tuần với chức năng đổi màu */}
      <WeekTimetable 
        items={sortedList} 
        weekCursor={weekCursor} 
        setWeekCursor={setWeekCursor}
        onColorChange={handleColorChange}
        onCellClick={handleCellClick}
      />

      {/* Modal tạo lịch */}
      <CreateScheduleModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedDate(null);
          setSelectedPeriod(null);
        }}
        date={selectedDate}
        period={selectedPeriod}
        onSave={handleCreateSchedule}
      />

      {/* Legend (Chú thích) */}
      <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-4">
        <div className="text-sm font-semibold text-gray-900 mb-3">Chú thích:</div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
            <span className="text-sm text-gray-600">Online</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-sky-500"></div>
            <span className="text-sm text-gray-600">Offline</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-6 rounded bg-gradient-to-r from-pink-500 to-rose-500"></div>
            <span className="text-sm text-gray-600">PRE-IELTS</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-6 rounded bg-gradient-to-r from-blue-500 to-sky-500"></div>
            <span className="text-sm text-gray-600">TOEFL/General</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-6 rounded bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            <span className="text-sm text-gray-600">IELTS Foundation</span>
          </div>
        </div>
      </div>

      {/* Danh sách thẻ chi tiết với chức năng đổi màu */}
      <div className="space-y-4">
        <div className="text-lg font-semibold text-gray-900">Chi tiết lịch tháng 12</div>
        {sortedList.map((slot) => {
          const lightColor = slot.color 
            ? slot.color
              .replace('from-pink-500 to-rose-500', 'from-pink-100 to-rose-100')
              .replace('from-rose-500 to-pink-600', 'from-rose-100 to-pink-100')
              .replace('from-fuchsia-500 to-purple-500', 'from-fuchsia-100 to-purple-100')
              .replace('from-blue-500 to-sky-500', 'from-blue-100 to-sky-100')
              .replace('from-emerald-500 to-teal-500', 'from-emerald-100 to-teal-100')
              .replace('from-amber-500 to-orange-500', 'from-amber-100 to-orange-100')
              .replace('from-indigo-500 to-blue-500', 'from-indigo-100 to-blue-100')
              .replace('from-violet-500 to-purple-600', 'from-violet-100 to-purple-100')
              .replace('from-gray-500 to-slate-500', 'from-gray-100 to-slate-100')
            : "bg-gradient-to-br from-pink-50 to-rose-50";
          
          return (
            <div
              key={slot.id}
              className={`rounded-2xl border border-pink-200 p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between hover:shadow-md transition-all ${lightColor}`}
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
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="text-sm text-gray-600 inline-flex items-center gap-2">
                    <CalendarRange size={16} className="text-pink-500" /> {slot.date}
                  </div>
                  <div className="text-sm text-gray-600 inline-flex items-center gap-2">
                    <Clock3 size={16} className="text-pink-500" /> {slot.time}
                  </div>
                  <div className="text-sm text-gray-600 inline-flex items-center gap-2">
                    <Users size={16} className="text-pink-500" /> {slot.teacher}
                  </div>
                  <div className="text-sm text-gray-600 inline-flex items-center gap-2">
                    <MapPin size={16} className="text-pink-500" /> {slot.room}
                  </div>
                </div>
                {slot.note && (
                  <div className="text-xs text-gray-500 bg-white/50 rounded-lg p-2 inline-block">
                    📝 {slot.note}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {slot.type === "MAKEUP" ? (
                  <button className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer">
                    <ArrowLeftRight size={16} /> Phân bổ buổi bù
                  </button>
                ) : null}
                <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 text-sm font-medium text-white hover:shadow-md transition-colors cursor-pointer">
                  <Send size={16} /> Gửi thông báo
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-pink-50 to-white p-5 space-y-3">
        <div className="font-semibold text-gray-900 flex items-center gap-2">
          <div className="h-6 w-1 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full"></div>
          Ghi chú quản lý
        </div>
        <p className="text-sm text-gray-600">
          • Các buổi bù sẽ được tổng hợp và gửi báo cáo cuối tháng cho bộ phận tài chính<br/>
          • Nhấn vào biểu tượng <Palette size={12} className="inline ml-1" /> để đổi màu phân biệt các khóa học<br/>
          • Lịch học có thể xuất file Excel/PDF bằng nút "Xuất lịch"
        </p>
      </div>
    </div>
  );
}