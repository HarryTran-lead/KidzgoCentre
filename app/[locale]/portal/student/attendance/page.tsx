"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CalendarRange, PieChart, TrendingUp, BellRing, ChevronLeft, ChevronRight, ChevronDown, Clock, MapPin, X } from "lucide-react";

type MonthlySummary = {
  month: string;
  totalSlots: number;
  attended: number;
  excused: number;
  makeup: number;
  homeworkRate: number;
};

type DailyRecord = {
  date: string;
  day: number;
  className: string;
  status: "PRESENT" | "ABSENT" | "MAKEUP";
  time: string;
  room: string;
  note?: string;
  homeworkSubmitted?: boolean;
};

const MONTHS_DATA: MonthlySummary[] = [
  { month: "12/2024", totalSlots: 12, attended: 10, excused: 1, makeup: 1, homeworkRate: 92 },
  { month: "11/2024", totalSlots: 12, attended: 11, excused: 0, makeup: 1, homeworkRate: 88 },
  { month: "10/2024", totalSlots: 12, attended: 9, excused: 1, makeup: 2, homeworkRate: 85 },
];

const DAILY: Record<string, DailyRecord[]> = {
  "12/2024": [
    { date: "01/12", day: 1, className: "Lớp Tiếng Anh A1", status: "PRESENT", time: "19:00 - 21:00", room: "Phòng 201", homeworkSubmitted: true },
    { date: "03/12", day: 3, className: "Lớp Tiếng Anh A1", status: "ABSENT", time: "19:00 - 21:00", room: "Phòng 201", note: "Ốm, xin phép trước 24h", homeworkSubmitted: false },
    { date: "05/12", day: 5, className: "Lớp Tiếng Anh A1", status: "MAKEUP", time: "18:00 - 20:00", room: "Phòng 102", note: "Bù tại lớp A1B", homeworkSubmitted: true },
    { date: "08/12", day: 8, className: "Lớp Tiếng Anh A1", status: "PRESENT", time: "19:00 - 21:00", room: "Phòng 201", homeworkSubmitted: true },
    { date: "10/12", day: 10, className: "Lớp Tiếng Anh A1", status: "PRESENT", time: "19:00 - 21:00", room: "Phòng 201", homeworkSubmitted: false },
    { date: "12/12", day: 12, className: "Lớp Tiếng Anh A1", status: "PRESENT", time: "19:00 - 21:00", room: "Phòng 201", homeworkSubmitted: true },
    { date: "15/12", day: 15, className: "Lớp Tiếng Anh A1", status: "PRESENT", time: "19:00 - 21:00", room: "Phòng 201", homeworkSubmitted: true },
    { date: "17/12", day: 17, className: "Lớp Tiếng Anh A1", status: "PRESENT", time: "19:00 - 21:00", room: "Phòng 201", homeworkSubmitted: true },
    { date: "19/12", day: 19, className: "Lớp Tiếng Anh A1", status: "PRESENT", time: "19:00 - 21:00", room: "Phòng 201", homeworkSubmitted: true },
    { date: "21/12", day: 21, className: "Lớp Tiếng Anh A1", status: "PRESENT", time: "19:00 - 21:00", room: "Phòng 201", homeworkSubmitted: true },
  ],
};

const MONTHS = [
  'Thg 1', 'Thg 2', 'Thg 3', 'Thg 4', 'Thg 5', 'Thg 6',
  'Thg 7', 'Thg 8', 'Thg 9', 'Thg 10', 'Thg 11', 'Thg 12'
];

// Helper functions
const getDaysInMonth = (month: number, year: number): number => {
  return new Date(year, month, 0).getDate();
};

const getFirstDayOfMonth = (month: number, year: number): number => {
  return new Date(year, month - 1, 1).getDay();
};

function ratio(attended: number, total: number) {
  if (total === 0) return 0;
  return Math.round((attended / total) * 100);
}

function StatusBadge({ status }: { status: DailyRecord["status"] }) {
  const map = {
    PRESENT: { text: "Có mặt", color: "bg-emerald-500" },
    ABSENT: { text: "Vắng", color: "bg-rose-500" },
    MAKEUP: { text: "Bù", color: "bg-sky-500" },
  } as const;
  const { text, color } = map[status];
  return (
    <div className="flex items-center gap-1">
      <div className={`w-2 h-2 rounded-full ${color}`}></div>
      <span className="text-xs text-slate-600">{text}</span>
    </div>
  );
}


// Detail Modal Component
function AttendanceDetailModal({ 
  record, 
  onClose 
}: { 
  record: DailyRecord; 
  onClose: () => void;
}) {
  const statusInfo = {
    PRESENT: { 
      title: "Có mặt", 
      color: "text-emerald-700",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200"
    },
    ABSENT: { 
      title: "Vắng mặt", 
      color: "text-rose-700",
      bgColor: "bg-rose-50",
      borderColor: "border-rose-200"
    },
    MAKEUP: { 
      title: "Buổi bù", 
      color: "text-sky-700",
      bgColor: "bg-sky-50",
      borderColor: "border-sky-200"
    },
  };

  const info = statusInfo[record.status];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h3 className="text-xl font-bold text-gray-900">Chi tiết điểm danh</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Date */}
          <div>
            <div className="text-sm text-slate-500 mb-1">Ngày học</div>
            <div className="text-lg font-semibold text-gray-900">{record.date}</div>
          </div>

          {/* Class Name */}
          <div>
            <div className="text-sm text-slate-500 mb-1">Lớp học</div>
            <div className="text-base font-medium text-gray-900">{record.className}</div>
          </div>

          {/* Time */}
          <div>
            <div className="text-sm text-slate-500 mb-1">Thời gian</div>
            <div className="flex items-center gap-2 text-base text-gray-900">
              <Clock size={16} className="text-slate-400" />
              <span>{record.time}</span>
            </div>
          </div>

          {/* Room */}
          <div>
            <div className="text-sm text-slate-500 mb-1">Phòng học</div>
            <div className="flex items-center gap-2 text-base text-gray-900">
              <MapPin size={16} className="text-slate-400" />
              <span>{record.room}</span>
            </div>
          </div>

          {/* Status */}
          <div>
            <div className="text-sm text-slate-500 mb-2">Trạng thái</div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${info.borderColor} ${info.bgColor}`}>
              <div className={`w-2 h-2 rounded-full ${info.color.replace('text-', 'bg-')}`}></div>
              <span className={`font-semibold ${info.color}`}>{info.title}</span>
            </div>
          </div>

          {/* Homework */}
          <div>
            <div className="text-sm text-slate-500 mb-2">Bài tập</div>
            <div className={`flex items-center gap-2 text-sm ${
              record.homeworkSubmitted ? 'text-emerald-700' : 'text-slate-500'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                record.homeworkSubmitted ? 'bg-emerald-500' : 'bg-slate-400'
              }`}></div>
              <span>{record.homeworkSubmitted ? 'Đã nộp' : 'Chưa nộp'}</span>
            </div>
          </div>

          {/* Note */}
          {record.note && (
            <div>
              <div className="text-sm text-slate-500 mb-2">Ghi chú</div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700">
                {record.note}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

// Month Dropdown with Column Layout (no scroll) - similar to schedule page
function MonthDropdown({ 
  value, 
  onChange 
}: { 
  value: number; 
  onChange: (value: number) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-slate-50 transition-colors min-w-[100px]"
      >
        <span>Tháng</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 rounded-lg border border-slate-200 bg-white shadow-lg p-3 right-0">
          <div className="grid grid-cols-3 gap-2 w-max">
            {MONTHS.map((month, index) => (
              <button
                key={index}
                onClick={() => {
                  onChange(index + 1);
                  setIsOpen(false);
                }}
                className={`px-4 py-2 text-sm rounded hover:bg-slate-50 transition-colors whitespace-nowrap ${
                  value === index + 1 ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-900'
                }`}
              >
                {month}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}




export default function AttendancePage() {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(12);
  const [selectedYear] = useState(2024);
  const [selectedRecord, setSelectedRecord] = useState<DailyRecord | null>(null);
  const monthKey = `${selectedMonth}/2024`;
  
  const summary = MONTHS_DATA.find((m) => m.month === monthKey) || MONTHS_DATA[0];
  const records = DAILY[monthKey] || [];
  const attendPercent = ratio(summary.attended + summary.makeup, summary.totalSlots);
  const today = 21;

  const handlePrevious = () => {
    if (selectedMonth > 1) {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNext = () => {
    if (selectedMonth < 12) {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handleViewDetail = (record: DailyRecord) => {
    // Navigate to detail page
    router.push(`/vi/portal/student/attendance/${record.day}`);
  };

  // Build calendar data
  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  const firstDayOfWeek = getFirstDayOfMonth(selectedMonth, selectedYear);
  const daysOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Get records by day
  const getRecordsByDay = (day: number): DailyRecord[] => {
    return records.filter(r => r.day === day);
  };

  return (
    <div className="space-y-6">
      {/* Header with Navigation - Similar to Schedule Page */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Navigation Arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              disabled={selectedMonth === 1}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 hover:bg-slate-50 text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNext}
              disabled={selectedMonth === 12}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 hover:bg-slate-50 text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Center: Month Display */}
          <div className="text-xl font-bold text-blue-600">
            Thg {selectedMonth} {selectedYear}
          </div>

          {/* Right: Month Dropdown */}
          <div className="flex items-center gap-3">
            <MonthDropdown value={selectedMonth} onChange={setSelectedMonth} />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-slate-500">Số buổi đã học</div>
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-gray-900">{summary.attended}</div>
          <div className="text-xs text-slate-400 mt-1">Trong tổng {summary.totalSlots} buổi</div>
        </div>
        
        <div className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-slate-500">Buổi vắng có phép</div>
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-amber-600">{summary.excused}</div>
          <div className="text-xs text-slate-400 mt-1">Sẽ được sắp xếp bù</div>
        </div>
        
        <div className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-slate-500">Buổi bù đã hoàn thành</div>
            <div className="w-2 h-2 rounded-full bg-sky-500"></div>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-sky-600">{summary.makeup}</div>
          <div className="text-xs text-slate-400 mt-1">Từ các lớp tương đương</div>
        </div>
        
        <div className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-slate-500">Tỷ lệ chuyên cần</div>
            <TrendingUp size={16} className="text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600">{attendPercent}%</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">Bao gồm cả buổi bù</div>
        </div>
      </div>

      {/* Calendar View */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Lịch sử điểm danh</h2>
          <div className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 border border-slate-200">
            <PieChart size={16} className="text-slate-500" />
            Hoàn thành bài tập: <span className="font-semibold text-gray-900">{summary.homeworkRate}%</span>
          </div>
        </div>

        {/* Day of week headers */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {daysOfWeek.map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="min-h-[100px]" />;
            }

            const dayRecords = getRecordsByDay(day);
            const isToday = day === today;
            const hasRecords = dayRecords.length > 0;
            
            return (
              <div
                key={day}
                onClick={() => hasRecords && handleViewDetail(dayRecords[0])}
                className={`rounded-xl p-3 border min-h-[100px] transition-all ${
                  isToday ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white'
                } ${hasRecords ? 'cursor-pointer hover:shadow-md hover:border-blue-400' : ''}`}
              >
                {/* Day number */}
                <div className="flex items-center justify-center mb-2">
                  <div
                    className={`h-7 w-7 rounded-full grid place-items-center text-sm font-semibold ${
                      isToday ? 'bg-blue-600 text-white' : 'text-gray-900'
                    }`}
                  >
                    {day}
                  </div>
                </div>

                {/* Attendance info */}
                {hasRecords && (
                  <div className="space-y-1">
                    {dayRecords.map((record, i) => (
                      <div key={i} className="text-xs">
                        <StatusBadge status={record.status} />
                        <div className="mt-1 text-slate-600 truncate">
                          {record.time}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 rounded-xl border border-slate-200 p-4 bg-slate-50">
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-900">
            <label className="inline-flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              Có mặt
            </label>
            <label className="inline-flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500"></div>
              Vắng mặt
            </label>
            <label className="inline-flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-sky-500"></div>
              Buổi bù
            </label>
            <label className="inline-flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-600"></div>
              Hôm nay
            </label>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <BellRing size={24} className="text-emerald-600 mt-1 flex-shrink-0" />
            <div>
              <div className="font-semibold text-emerald-900">Nhắc nhở qua Zalo</div>
              <p className="text-sm text-emerald-800 mt-1">
                Nếu bạn chưa điểm danh, hệ thống sẽ nhắn phụ huynh qua Zalo sau 10 phút bắt đầu buổi học.
              </p>
            </div>
          </div>
          <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors whitespace-nowrap">
            <BellRing size={16} /> Cập nhật số Zalo
          </button>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <AttendanceDetailModal 
          record={selectedRecord} 
          onClose={() => setSelectedRecord(null)} 
        />
      )}
    </div>
  );
}