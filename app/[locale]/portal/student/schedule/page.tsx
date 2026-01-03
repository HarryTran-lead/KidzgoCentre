'use client';

import { useState, useRef, useEffect } from 'react';
import { Clock, MapPin, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

type ClassItem = { title: string; time: string; room: string };
type DayItem = { dow: string; date: number; classes: ClassItem[] };

type ViewType = 'Lịch Học' | 'Ngày' | '3 Ngày' | 'Tuần' | 'Tháng';

// Time slots từ 09:00 đến 21:00
const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', 
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
];

/** DATA TĨNH — thay đổi ở đây nếu cần */
const WEEK: DayItem[] = [
  { dow: 'Thứ 2', date: 3, classes: [{ title: 'Lớp Tiếng Anh A1', time: '19:00 - 21:00', room: 'Phòng 201' }] },
  { dow: 'Thứ 3', date: 4, classes: [{ title: 'Lớp Tiếng Anh B1', time: '18:00 - 20:00', room: 'Phòng 102' }] },
  { dow: 'Thứ 4', date: 5, classes: [] },
  { dow: 'Thứ 5', date: 6, classes: [{ title: 'Lớp Tiếng Anh A1', time: '19:00 - 21:00', room: 'Phòng 201' }] },
  { dow: 'Thứ 6', date: 7, classes: [{ title: 'Lớp Tiếng Nhật N5', time: '19:30 - 21:30', room: 'Phòng 203' }] },
  { dow: 'Thứ 7', date: 8, classes: [] },
  { dow: 'Chủ nhật', date: 9, classes: [] },
];

const MONTHS = [
  'Thg 1', 'Thg 2', 'Thg 3', 'Thg 4', 'Thg 5', 'Thg 6',
  'Thg 7', 'Thg 8', 'Thg 9', 'Thg 10', 'Thg 11', 'Thg 12'
];

const VIEW_TYPES: ViewType[] = ['Lịch Học', 'Ngày', '3 Ngày', 'Tuần', 'Tháng'];

// Helper function to get days in month
const getDaysInMonth = (month: number, year: number): number => {
  return new Date(year, month, 0).getDate();
};

// Helper function to get first day of month (0 = Sunday, 1 = Monday, etc.)
const getFirstDayOfMonth = (month: number, year: number): number => {
  return new Date(year, month - 1, 1).getDay();
};

// Helper function to check if year is leap year
const isLeapYear = (year: number): boolean => {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
};

// Custom Dropdown Component
function CustomDropdown({ 
  value, 
  options, 
  onChange,
  className = "" 
}: { 
  value: string; 
  options: string[]; 
  onChange: (value: string) => void;
  className?: string;
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
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-slate-50 transition-colors w-full"
      >
        <span>{value}</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden">
          <div className="max-h-[300px] overflow-y-auto">
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors ${
                  option === value ? 'bg-slate-100 font-medium' : ''
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Month Dropdown with Column Layout (no scroll)
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


export default function Page() {
  const todayIndex = 0; // giả định hôm nay là Thứ 2 (ô đầu)
  const [selectedMonth, setSelectedMonth] = useState(12);
  const [selectedYear] = useState(2025);
  const [viewType, setViewType] = useState<ViewType>('Tháng');
  const today = 21; // Ngày hiện tại

  const handlePrevious = () => {
    // Logic để chuyển về kỳ trước (tuần/tháng trước)
    console.log('Previous period');
  };

  const handleNext = () => {
    // Logic để chuyển tới kỳ tiếp (tuần/tháng sau)
    console.log('Next period');
  };

  // Render Day View with Time Slots
  const renderDayView = () => (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      {/* Day Header */}
      <div className="border-b border-slate-200 p-4 bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">CN</div>
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white font-semibold">
            {today}
          </div>
        </div>
      </div>
      
      {/* Time Slots */}
      <div className="p-4 overflow-y-auto" style={{ maxHeight: '600px' }}>
        {TIME_SLOTS.map((time) => (
          <div key={time} className="flex border-b border-slate-100 py-4 hover:bg-slate-50">
            <div className="w-16 text-sm text-gray-500">{time}</div>
            <div className="flex-1">
              {/* Placeholder for events - add logic to display events here */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Render 3 Days View with Time Slots
  const render3DaysView = () => {
    const days = [
      { dow: 'CN', date: 21 },
      { dow: 'T2', date: 22 },
      { dow: 'T3', date: 23 },
    ];

    return (
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {/* Days Header */}
        <div className="border-b border-slate-200 p-4 bg-slate-50">
          <div className="grid grid-cols-4 gap-4">
            <div className="w-16"></div>
            {days.map((day, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className="text-sm text-gray-500">{day.dow}</div>
                <div className={`mt-1 flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                  idx === 0 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-gray-900'
                }`}>
                  {day.date}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Time Slots Grid */}
        <div className="p-4 overflow-y-auto" style={{ maxHeight: '600px' }}>
          {TIME_SLOTS.map((time) => (
            <div key={time} className="grid grid-cols-4 gap-4 border-b border-slate-100 py-4 hover:bg-slate-50">
              <div className="w-16 text-sm text-gray-500">{time}</div>
              {days.map((_, idx) => (
                <div key={idx} className="flex-1">
                  {/* Placeholder for events */}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render Week View with Time Slots
  const renderWeekView = () => {
    const weekDays = [
      { dow: 'T2', date: 3 },
      { dow: 'T3', date: 4 },
      { dow: 'T4', date: 5 },
      { dow: 'T5', date: 6 },
      { dow: 'T6', date: 7 },
      { dow: 'T7', date: 8 },
      { dow: 'CN', date: 9 },
    ];

    return (
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {/* Week Header */}
        <div className="border-b border-slate-200 p-4 bg-slate-50">
          <div className="grid grid-cols-8 gap-2">
            <div className="w-16"></div>
            {weekDays.map((day, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className="text-sm text-gray-500">{day.dow}</div>
                <div className={`mt-1 flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                  idx === 0 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-gray-900'
                }`}>
                  {day.date}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Time Slots Grid */}
        <div className="p-4 overflow-y-auto" style={{ maxHeight: '600px' }}>
          {TIME_SLOTS.map((time) => (
            <div key={time} className="grid grid-cols-8 gap-2 border-b border-slate-100 py-4 hover:bg-slate-50">
              <div className="w-16 text-sm text-gray-500">{time}</div>
              {weekDays.map((_, idx) => (
                <div key={idx} className="flex-1">
                  {/* Placeholder for events */}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render Month Calendar View
  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const firstDayOfWeek = getFirstDayOfMonth(selectedMonth, selectedYear);
    const daysOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    
    // Generate calendar data
    const calendarDays: (number | null)[] = [];
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDayOfWeek; i++) {
      calendarDays.push(null);
    }
    
    // Add all days in month
    for (let day = 1; day <= daysInMonth; day++) {
      calendarDays.push(day);
    }
    
    // Sample classes data - replace with actual data
    const classesData: { [key: number]: ClassItem[] } = {
      3: [{ title: 'Lớp Tiếng Anh A1', time: '19:00 - 21:00', room: 'Phòng 201' }],
      4: [{ title: 'Lớp Tiếng Anh B1', time: '18:00 - 20:00', room: 'Phòng 102' }],
      6: [{ title: 'Lớp Tiếng Anh A1', time: '19:00 - 21:00', room: 'Phòng 201' }],
      7: [{ title: 'Lớp Tiếng Nhật N5', time: '19:30 - 21:30', room: 'Phòng 203' }],
    };
    
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
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
            const isToday = day === today;
            const hasClasses = day !== null && classesData[day];
            
            if (day === null) {
              return <div key={`empty-${idx}`} className="min-h-[120px]" />;
            }
            
            return (
              <div
                key={day}
                className={`rounded-xl p-3 border min-h-[120px] hover:shadow-md transition-shadow cursor-pointer ${
                  isToday ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white'
                }`}
              >
                {/* Day number */}
                <div className="flex items-center justify-center mb-2">
                  <div
                    className={`h-8 w-8 rounded-full grid place-items-center text-sm font-semibold ${
                      isToday ? 'bg-blue-600 text-white' : 'text-gray-900'
                    }`}
                  >
                    {day}
                  </div>
                </div>

                {/* Classes */}
                {hasClasses && (
                  <div className="space-y-1">
                    {classesData[day].map((c, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs"
                      >
                        <div className="font-medium text-gray-900 truncate">{c.title}</div>
                        <div className="mt-1 text-slate-600">
                          <div className="flex items-center gap-1">
                            <Clock size={12} /> {c.time}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin size={12} /> {c.room}
                          </div>
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
              <span className="h-4 w-4 rounded border border-slate-400 inline-block" />
              Lớp học thường
            </label>
            <label className="inline-flex items-center gap-2">
              <span className="h-4 w-4 rounded-full bg-blue-600 inline-block" />
              Ngày hôm nay
            </label>
            <label className="inline-flex items-center gap-2">
              <span className="h-4 w-4 rounded border border-dashed border-slate-400 inline-block" />
              Click để xem chi tiết
            </label>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Navigation and Dropdowns */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Navigation Arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 hover:bg-slate-50 text-gray-900 transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNext}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 hover:bg-slate-50 text-gray-900 transition-colors"
              aria-label="Next"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Center: Period Display */}
          <div className="text-xl font-bold text-blue-600">
            {viewType === 'Ngày' && `${today} Thg ${selectedMonth} ${selectedYear}`}
            {viewType === '3 Ngày' && `${today}-${today + 2} Thg ${selectedMonth} ${selectedYear}`}
            {viewType === 'Tuần' && `Thg ${selectedMonth} ${selectedYear}`}
            {viewType === 'Tháng' && `Thg ${selectedMonth} ${selectedYear}`}
            {viewType === 'Lịch Học' && `Lịch Học`}
          </div>

          {/* Right: Dropdowns */}
          <div className="flex items-center gap-3">
            {/* Month Selector */}
            <MonthDropdown value={selectedMonth} onChange={setSelectedMonth} />

            {/* View Type Selector */}
            <CustomDropdown 
              value={viewType} 
              options={VIEW_TYPES} 
              onChange={(val) => setViewType(val as ViewType)}
              className="w-[140px]"
            />
          </div>
        </div>
      </div>

      {/* Dynamic Content Based on View Type */}
      {viewType === 'Ngày' && renderDayView()}
      {viewType === '3 Ngày' && render3DaysView()}
      {viewType === 'Tuần' && renderWeekView()}
      {viewType === 'Tháng' && renderMonthView()}
      {viewType === 'Lịch Học' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-gray-500">
          Chức năng Lịch Học đang được phát triển
        </div>
      )}
    </div>
  );
}
