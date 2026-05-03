'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  CalendarDays, 
  Calendar as CalendarIcon, 
  MapPin, 
  Users, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  BookOpen, 
  CheckCircle,
  CalendarArrowDown,
  Building2,
  AlertCircle,
  X
} from 'lucide-react';
import { fetchTeacherTimetable, getVietnameseDow, formatDateISO } from '@/app/api/teacher/schedule';
import type { Lesson, DaySchedule } from '@/types/teacher/schedule';

// Utility functions
function getCurrentWeekRange(today: Date): { start: Date; end: Date } {
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(today);
  start.setDate(today.getDate() + diffToMonday);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}

function getWeekRangeByOffset(base: Date, weekOffset: number): { start: Date; end: Date } {
  const shifted = new Date(base);
  shifted.setDate(base.getDate() + weekOffset * 7);
  return getCurrentWeekRange(shifted);
}

function formatVNShort(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}/${m}`;
}

function formatVNShortWithYear(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function formatVNDate(d: string) {
  const [y, m, day] = d.split('-').map(Number);
  return `${String(day).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

function startOfWeek(date: Date) {
  const dow = (date.getDay() + 6) % 7;
  const monday = new Date(date);
  monday.setDate(date.getDate() - dow);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function isTimeOverlap(time1: string, time2: string): boolean {
  const parseTime = (timeStr: string) => {
    const [start, end] = timeStr.split(' - ');
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    return {
      start: startHour * 60 + startMin,
      end: endHour * 60 + endMin
    };
  };

  const t1 = parseTime(time1);
  const t2 = parseTime(time2);

  return !(t1.end <= t2.start || t2.end <= t1.start);
}

function checkTimeConflicts(lessons: Lesson[]): { hasConflict: boolean; conflicts: Array<{ lesson1: Lesson; lesson2: Lesson }> } {
  const conflicts: Array<{ lesson1: Lesson; lesson2: Lesson }> = [];

  for (let i = 0; i < lessons.length; i++) {
    for (let j = i + 1; j < lessons.length; j++) {
      if (isTimeOverlap(lessons[i].time, lessons[j].time)) {
        conflicts.push({ lesson1: lessons[i], lesson2: lessons[j] });
      }
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts
  };
}

function removeOverlappingLessons(lessons: Lesson[]): Lesson[] {
  const validLessons: Lesson[] = [];
  const processed = new Set<string>();

  const sortedLessons = [...lessons].sort((a, b) => {
    const [aStart] = a.time.split(' - ');
    const [bStart] = b.time.split(' - ');
    const [aHour, aMin] = aStart.split(':').map(Number);
    const [bHour, bMin] = bStart.split(':').map(Number);
    return (aHour * 60 + aMin) - (bHour * 60 + bMin);
  });

  for (const lesson of sortedLessons) {
    if (processed.has(lesson.id)) continue;

    const overlapsWithValid = validLessons.some(validLesson => isTimeOverlap(validLesson.time, lesson.time));

    if (!overlapsWithValid) {
      validLessons.push(lesson);
      processed.add(lesson.id);
    } else {
      processed.add(lesson.id);
    }
  }

  return validLessons;
}

function groupOverlappingLessons(lessons: Lesson[]): Map<string, { groupIndex: number; positionInGroup: number; totalInGroup: number }> {
  const result = new Map<string, { groupIndex: number; positionInGroup: number; totalInGroup: number }>();
  const processed = new Set<string>();
  let groupIndex = 0;

  for (let i = 0; i < lessons.length; i++) {
    if (processed.has(lessons[i].id)) continue;

    const overlappingGroup: Lesson[] = [lessons[i]];
    processed.add(lessons[i].id);

    for (let j = i + 1; j < lessons.length; j++) {
      if (processed.has(lessons[j].id)) continue;

      const overlapsWithGroup = overlappingGroup.some(l => isTimeOverlap(l.time, lessons[j].time));
      if (overlapsWithGroup) {
        overlappingGroup.push(lessons[j]);
        processed.add(lessons[j].id);
      }
    }

    if (overlappingGroup.length > 1) {
      overlappingGroup.forEach((lesson, idx) => {
        result.set(lesson.id, {
          groupIndex,
          positionInGroup: idx,
          totalInGroup: overlappingGroup.length
        });
      });
      groupIndex++;
    }
  }

  return result;
}

// GoToDateButton Component
function GoToDateButton({ onSelect }: { onSelect: (date: Date) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSubmit = () => {
    if (!selectedDate) return;
    const date = new Date(selectedDate);
    onSelect(date);
    setIsOpen(false);
    setSelectedDate("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setSelectedDate("");
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-100 transition-colors cursor-pointer text-gray-700 flex items-center gap-2"
        title="Đi đến ngày"
      >
        <CalendarArrowDown size={16} />
        <span className="hidden sm:inline">Đi đến</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-100 min-w-[280px]">
          <div className="text-sm font-semibold text-gray-800 mb-3">
            Chọn ngày để xem tuần
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-300 text-sm mb-3"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsOpen(false);
                setSelectedDate("");
              }}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedDate}
              className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-medium hover:shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Xem tuần
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Timeline Lesson Component
function TimelineLesson({ lesson, compact = false, hasConflict = false, layoutInfo, data }: { lesson: Lesson; compact?: boolean; hasConflict?: boolean; layoutInfo?: { groupIndex: number; positionInGroup: number; totalInGroup: number }; data?: DaySchedule }) {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const [startHour, startMin] = lesson.time.split(' - ')[0].split(':').map(Number);
  const startPosition = ((startHour - 7) * 60 + startMin);

  const baseLeft = 20;

  let left: string | number = baseLeft;
  let width = 'calc(100% - 40px)';

  if (layoutInfo && layoutInfo.totalInGroup > 1) {
    const gap = 4;
    const totalGaps = gap * (layoutInfo.totalInGroup - 1);
    const itemWidthPercent = 100 / layoutInfo.totalInGroup;

    const leftPercent = (layoutInfo.positionInGroup * itemWidthPercent);
    left = `calc(${baseLeft}px + ${leftPercent}% + ${layoutInfo.positionInGroup * gap}px)`;
    width = `calc(${itemWidthPercent}% - ${(totalGaps / layoutInfo.totalInGroup) + (baseLeft * 2 / layoutInfo.totalInGroup)}px)`;
  }

  const isHexColor = lesson.color.startsWith('#') || lesson.color.startsWith('rgb');

  const lightColor = isHexColor
    ? ''
    : lesson.color
      .replace('bg-gradient-to-r', 'bg-gradient-to-br')
      .replace('from-red-600 to-red-700', 'from-red-50 to-red-100')
      .replace('from-red-500 to-red-600', 'from-red-50 to-red-100')
      .replace('from-gray-600 to-gray-700', 'from-gray-100 to-gray-200')
      .replace('from-gray-500 to-gray-600', 'from-gray-100 to-gray-200')
      .replace('from-gray-700 to-gray-800', 'from-gray-200 to-gray-300')
      .replace('from-gray-200 to-gray-300', 'from-gray-100 to-gray-200')
      .replace('from-red-600 to-gray-600', 'from-red-50 to-gray-100');

  const lightBgStyle = isHexColor ? { backgroundColor: `${lesson.color}33` } : undefined;
  const accentStyle = isHexColor ? { backgroundColor: lesson.color } : undefined;

  return (
    <div
      className={`absolute rounded-xl shadow-lg transition-all duration-300 border border-gray-200 overflow-hidden ${isHovered ? 'shadow-gray-200 -translate-y-0.5 z-10' : 'shadow-gray-100'} ${lightColor} text-gray-900 ${hasConflict ? 'ring-2 ring-red-500 ring-offset-2' : ''}`}
      style={{
        left: typeof left === 'number' ? `${left}px` : left,
        top: `${startPosition}px`,
        width: width,
        height: `${lesson.duration}px`,
        ...lightBgStyle,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={hasConflict ? '⚠️ Cảnh báo: Buổi học này trùng giờ với buổi học khác trong ngày' : ''}
    >
      <div className={`h-1.5 w-full ${isHexColor ? '' : lesson.color}`} style={accentStyle} />
      <div className="h-full flex flex-col justify-between p-4">
        <div>
          <div className="font-bold text-sm">{lesson.course}</div>
          {!compact && (
            <div className="text-xs text-gray-700 mt-1">{lesson.time}</div>
          )}
        </div>

        {!compact && (
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <div className="flex items-center gap-1">
                <MapPin size={12} />
                <span>{lesson.room}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users size={12} />
                <span>{lesson.students}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  const lessonDate = data?.date || formatDateISO(new Date());
                  router.push(`/${locale}/portal/teacher/attendance?sessionId=${lesson.id}&date=${lessonDate}`);
                }}
                className="text-xs bg-gradient-to-r from-red-600 to-red-700 hover:shadow-md backdrop-blur-sm rounded-lg px-2 py-1 transition-all cursor-pointer text-white"
              >
                Điểm danh
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Day Timeline View
function DayTimeline({ data, hours = 12 }: { data: DaySchedule; hours?: number }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const timeSlots = Array.from({ length: hours }, (_, i) => i + 7);

  const validLessons = useMemo(() => removeOverlappingLessons(data.lessons), [data.lessons]);
  const conflictCheck = useMemo(() => checkTimeConflicts(data.lessons), [data.lessons]);
  const removedLessons = useMemo(() => {
    const validIds = new Set(validLessons.map(l => l.id));
    return data.lessons.filter(l => !validIds.has(l.id));
  }, [data.lessons, validLessons]);

  const lessonLayouts = useMemo(() => groupOverlappingLessons(validLessons), [validLessons]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const today = new Date();
  const isToday = data.date === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const getCurrentTimePosition = () => {
    if (!isToday) return null;
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    if (currentHour < 7 || currentHour >= 19) return null;
    return ((currentHour - 7) * 60 + currentMinute);
  };

  const currentTimePos = getCurrentTimePosition();
  const timeDisplay = `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}:${String(currentTime.getSeconds()).padStart(2, '0')}`;

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="bg-gradient-to-r from-red-50 to-red-100 border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative p-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg">
              <CalendarDays size={24} />
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center">
                <span className="text-xs font-bold text-red-600">{data.day}</span>
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{data.dow}</div>
              <div className="text-gray-600">{data.month} - {formatVNDate(data.date)}</div>
              {isToday && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                    Hôm nay
                  </div>
                  <div className="text-xs text-gray-500 font-mono">
                    {timeDisplay}
                  </div>
                </div>
              )}
              {conflictCheck.hasConflict && (
                <div className="flex items-center gap-1 mt-2">
                  <div className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full flex items-center gap-1 border border-red-300">
                    <span>⚠️</span>
                    <span>Đã loại bỏ {removedLessons.length} buổi học trùng giờ</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <span className="inline-flex items-center rounded-full bg-gradient-to-r from-red-600 to-red-700 text-white text-xs px-3 py-1.5 font-medium shadow-sm">
            {validLessons.length} buổi học
          </span>
        </div>
      </div>

      <div className="relative p-4 h-[720px] overflow-y-auto">
        <div className="absolute left-0 top-0 bottom-0 w-16">
          {timeSlots.map(hour => (
            <div
              key={hour}
              className="relative text-sm text-gray-500 text-right pr-2"
              style={{ height: '60px', lineHeight: '60px' }}
            >
              {hour}:00
            </div>
          ))}
        </div>

        <div className="ml-16 h-full relative" style={{ minHeight: '720px' }}>
          {timeSlots.map(hour => (
            <div
              key={`line-${hour}`}
              className="absolute left-0 right-0 border-t border-gray-100"
              style={{ top: `${(hour - 7) * 60}px` }}
            />
          ))}

          {currentTimePos !== null && (
            <div
              className="absolute left-0 right-0 z-30"
              style={{ top: `${currentTimePos}px` }}
            >
              <div className="absolute left-0 h-0.5 w-full bg-gradient-to-r from-red-600 to-red-700"></div>
              <div className="absolute -left-2 -top-1.5 w-3 h-3 rounded-full bg-red-600 shadow-lg"></div>
              <div className="absolute right-0 -top-2.5 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold shadow-md">
                {timeDisplay}
              </div>
            </div>
          )}

          {validLessons.map(lesson => {
            const layoutInfo = lessonLayouts.get(lesson.id);
            return (
              <TimelineLesson
                key={lesson.id}
                lesson={lesson}
                hasConflict={false}
                layoutInfo={layoutInfo}
                data={data}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Week Calendar View
function WeekCalendarView({
  weekData,
  weekOffset,
  onPrevWeek,
  onNextWeek,
  onGoThisWeek,
  onSetWeek,
}: {
  weekData: DaySchedule[];
  weekOffset: number;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onGoThisWeek: () => void;
  onSetWeek: (offset: number) => void;
}) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentHour = now.getHours() + now.getMinutes() / 60;

  const timeShifts = [
    { label: 'Sáng', start: 7, end: 12 },
    { label: 'Chiều', start: 12, end: 17 },
    { label: 'Tối', start: 17, end: 22 },
  ];

  const isCurrentShift = (shift: { start: number; end: number }) => {
    return currentHour >= shift.start && currentHour < shift.end;
  };

  const { start: weekStart, end: weekEnd } = getWeekRangeByOffset(now, weekOffset);
  
  const calendarDays: DaySchedule[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const date = formatDateISO(d);
    const found = weekData.find((x) => x.date === date);
    return (
      found ?? {
        date,
        dow: getVietnameseDow(d),
        day: d.getDate(),
        month: `Tháng ${d.getMonth() + 1}`,
        lessons: [],
      }
    );
  });

  const getShiftForLesson = (lesson: Lesson): string | null => {
    const [startTime] = lesson.time.split(' - ');
    const [hour] = startTime.split(':').map(Number);

    if (hour >= 7 && hour < 12) return 'Sáng';
    if (hour >= 12 && hour < 17) return 'Chiều';
    if (hour >= 17 && hour < 22) return 'Tối';
    return null;
  };

  const getLessonsForShift = (day: DaySchedule, shiftLabel: string): Lesson[] => {
    return day.lessons.filter(lesson => getShiftForLesson(lesson) === shiftLabel);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-red-100">
        <div className="flex items-center gap-4">
          <div className={`relative p-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg`}>
            <CalendarDays size={24} />
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center">
              <span className="text-xs font-bold text-red-600">
                {calendarDays[0].day}
              </span>
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">Lịch tuần</div>
            <div className="text-gray-700">{formatVNShortWithYear(weekStart)} – {formatVNShortWithYear(weekEnd)}</div>
          </div>
        </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onPrevWeek}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Tuần trước"
            >
              <ChevronLeft size={18} className="text-gray-700" />
            </button>
            <div className="min-w-[220px] text-center text-sm font-semibold text-gray-700">
              Tuần từ {formatVNShort(weekStart)} đến {formatVNShort(weekEnd)}
            </div>
            <button
              onClick={onNextWeek}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Tuần sau"
            >
              <ChevronRight size={18} className="text-gray-700" />
            </button>
            <button
              onClick={onGoThisWeek}
              className="ml-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-100 transition-colors cursor-pointer text-gray-700"
            >
              Tuần này
            </button>
            <GoToDateButton onSelect={(date) => {
              const newWeekStart = startOfWeek(date);
              const now = new Date();
              const offset = Math.round((newWeekStart.getTime() - startOfWeek(now).getTime()) / (7 * 24 * 60 * 60 * 1000));
              onSetWeek(offset);
            }} />
          </div>
        </div>

      <div className="grid grid-cols-8 border-t border-gray-200 bg-gradient-to-r from-red-50 to-red-100 text-sm font-semibold text-gray-700">
        <div className="px-4 py-3">Ca / Ngày</div>
        {calendarDays.map((day, dayIndex) => {
          const isToday = day.date === todayStr;
          return (
            <div
              key={dayIndex}
              className={`px-4 py-3 border-l border-gray-200 ${isToday ? "bg-gradient-to-r from-red-100 to-red-200" : ""}`}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="capitalize">{day.dow === 'Chủ nhật' ? 'CN' : day.dow.replace('Th ', 'Thứ ')}</span>
                <span className={`h-8 w-8 flex items-center justify-center rounded-full text-sm font-bold ${isToday
                  ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
                  : "bg-white text-gray-700 border border-gray-200"
                  }`}>
                  {day.day}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {timeShifts.map((shift, shiftIndex) => (
        <div key={shift.label} className="grid grid-cols-8 border-t border-gray-200">
          <div className="px-4 py-4 text-sm font-semibold text-gray-800 bg-gradient-to-r from-red-50 to-red-100 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <span className="font-bold text-lg">{shift.label}</span>
              {shift.label === 'Sáng' && <span className="text-xs text-gray-600 mt-1">7:00-12:00</span>}
              {shift.label === 'Chiều' && <span className="text-xs text-gray-600 mt-1">12:00-18:00</span>}
              {shift.label === 'Tối' && <span className="text-xs text-gray-600 mt-1">18:00-22:00</span>}
              {isCurrentShift(shift) && (
                <div className="text-[10px] mt-2 text-red-600 bg-red-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                  Đang diễn ra
                </div>
              )}
            </div>
          </div>

          {calendarDays.map((day, dayIndex) => {
            const lessons = getLessonsForShift(day, shift.label);
            return (
              <div
                key={dayIndex}
                className={`min-h-[130px] p-3 ${shiftIndex % 2 ? "bg-white" : "bg-gray-50"} border-l border-gray-200`}
              >
                <div className="space-y-2">
                  {lessons.length === 0 ? (
                    <div className="text-[13px] text-gray-500 italic text-center py-4 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
                      Trống
                    </div>
                  ) : (
                    lessons.map((lesson) => {
                      const isHex = lesson.color.startsWith('#') || lesson.color.startsWith('rgb');
                      const lightColor = isHex ? '' : lesson.color
                        .replace('bg-gradient-to-r', 'bg-gradient-to-br')
                        .replace('from-red-600 to-red-700', 'from-red-50 to-red-100')
                        .replace('from-red-500 to-red-600', 'from-red-50 to-red-100')
                        .replace('from-gray-600 to-gray-700', 'from-gray-100 to-gray-200')
                        .replace('from-gray-500 to-gray-600', 'from-gray-100 to-gray-200')
                        .replace('from-gray-700 to-gray-800', 'from-gray-200 to-gray-300')
                        .replace('from-gray-200 to-gray-300', 'from-gray-100 to-gray-200')
                        .replace('from-red-600 to-gray-600', 'from-red-50 to-gray-100')
                        .replace('from-red-500 to-gray-600', 'from-red-50 to-gray-100');
                      const lightBgStyle = isHex ? { backgroundColor: `${lesson.color}33` } : undefined;
                      const accentStyle = isHex ? { backgroundColor: lesson.color } : undefined;

                      return (
                        <div key={lesson.id} className="relative group">
                          <div
                            onClick={() => router.push(`/${locale}/portal/teacher/attendance?sessionId=${lesson.id}&date=${day.date}`)}
                            className={`rounded-xl overflow-hidden text-xs transition-all duration-200 hover:shadow-md cursor-pointer border border-gray-200 ${lightColor}`}
                            style={lightBgStyle}
                          >
                            <div className={`h-1.5 w-full ${isHex ? '' : lesson.color}`} style={accentStyle} />
                            <div className="p-2.5">
                            <div className="flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${isHex ? '' : lesson.color}`} style={accentStyle} />
                                  <span className="font-semibold text-gray-900 truncate">{lesson.course}</span>
                                </div>
                                <div className="text-[11px] text-gray-700 mb-1">{lesson.time}</div>
                                <div className="text-[11px] text-gray-600 flex items-center gap-1">
                                  <MapPin size={10} />
                                  <span className="truncate">{lesson.room}</span>
                                </div>
                              </div>
                            </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
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

// Main Page Component
export default function Page() {
  const [tab, setTab] = useState<'week' | 'timeline'>('week');
  const [currentWeek, setCurrentWeek] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [weekData, setWeekData] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [classFilter, setClassFilter] = useState<string>("ALL");
  const [classOptions, setClassOptions] = useState<{ id: string; name: string }[]>([]);

  const today = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const displayedWeek = useMemo(() => {
    return weekData;
  }, [weekData, currentWeek]);

  const weekDaysForSelector = useMemo((): DaySchedule[] => {
    const now = new Date();
    const { start } = getWeekRangeByOffset(now, currentWeek);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const date = formatDateISO(d);
      const found = weekData.find((x) => x.date === date);
      return (
        found ?? {
          date,
          dow: getVietnameseDow(d),
          day: d.getDate(),
          month: `Tháng ${d.getMonth() + 1}`,
          lessons: [],
        }
      );
    });
  }, [weekData, currentWeek]);

  const selectedDay = useMemo(() => {
    return (
      weekDaysForSelector.find((day) => day.date === selectedDate) ??
      weekDaysForSelector[0]
    );
  }, [selectedDate, weekDaysForSelector]);

  // Filter lessons by class
  const filteredWeekData = useMemo(() => {
    if (classFilter === "ALL") return displayedWeek;
    
    return displayedWeek.map(day => ({
      ...day,
      lessons: day.lessons.filter(lesson => {
        // Extract class name from course (assuming course contains class info)
        // This needs adjustment based on your actual data structure
        return lesson.course.toLowerCase().includes(classFilter.toLowerCase());
      })
    }));
  }, [displayedWeek, classFilter]);

  // Extract unique class names from lessons for filter
  useEffect(() => {
    const classNames = new Set<string>();
    weekData.forEach(day => {
      day.lessons.forEach(lesson => {
        classNames.add(lesson.course);
      });
    });
    setClassOptions(Array.from(classNames).map(name => ({ id: name, name })));
  }, [weekData]);

  const totalLessons = useMemo(() => {
    return filteredWeekData.reduce((sum, day) => sum + day.lessons.length, 0);
  }, [filteredWeekData]);

  const totalStudents = useMemo(() => {
    return filteredWeekData.reduce(
      (sum, day) =>
        sum +
        day.lessons.reduce((daySum, lesson) => daySum + lesson.students, 0),
      0
    );
  }, [filteredWeekData]);

  useEffect(() => {
    async function fetchWeekData() {
      try {
        setLoading(true);
        setError(null);

        const now = new Date();
        const { start, end } = getWeekRangeByOffset(now, currentWeek);
        const fromDate = formatDateISO(start);
        const toDate = formatDateISO(end);

        const from = `${fromDate}T00:00:00+07:00`;
        const to = `${toDate}T23:59:59+07:00`;

        const result = await fetchTeacherTimetable({ from, to });
        setWeekData(result.weekData);
      } catch (err: any) {
        console.error('Unexpected error when fetching timetable:', err);
        setError(err.message || 'Đã xảy ra lỗi khi tải lịch dạy.');
        setWeekData([]);
      } finally {
        setLoading(false);
        setIsLoaded(true);
      }
    }

    fetchWeekData();
  }, [today, currentWeek]);

  useEffect(() => {
    const hasToday = weekData.find((d) => d.date === today);
    setSelectedDate(hasToday ? hasToday.date : weekData[0]?.date ?? null);
  }, [weekData, today]);

  // Stats for filter badges
  const stats = useMemo(() => {
    const byClass: Record<string, number> = {};
    weekData.forEach(day => {
      day.lessons.forEach(lesson => {
        byClass[lesson.course] = (byClass[lesson.course] || 0) + 1;
      });
    });
    return { total: weekData.reduce((sum, day) => sum + day.lessons.length, 0), byClass };
  }, [weekData]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 p-6 space-y-6">
      {/* Header */}
      <div className={`transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
              <CalendarDays size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Lịch giảng dạy
              </h1>
              <p className="text-sm text-gray-700 mt-1">
                Quản lý và theo dõi lịch dạy theo tuần với 3 ca Sáng – Chiều – Tối
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="bg-white border border-gray-200 rounded-xl p-1 flex">
                <button
                  className={`px-4 py-2.5 text-sm rounded-lg flex items-center gap-2 transition-all cursor-pointer ${tab === 'week' ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md' : 'text-gray-700 hover:bg-gray-50'}`}
                  onClick={() => setTab('week')}
                >
                  <CalendarDays size={16} />
                  Tuần
                </button>
                <button
                  className={`px-4 py-2.5 text-sm rounded-lg flex items-center gap-2 transition-all cursor-pointer ${tab === 'timeline' ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md' : 'text-gray-700 hover:bg-gray-50'}`}
                  onClick={() => setTab('timeline')}
                >
                  <Sparkles size={16} />
                  Timeline
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className={`rounded-2xl border border-gray-200 bg-white p-4 flex flex-wrap gap-2 transition-all duration-700 delay-100 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-red-600" />
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-300 cursor-pointer"
          >
            <option value="ALL">Tất cả lớp</option>
            {classOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="border-l border-gray-200 mx-2"></div>

        <button
          onClick={() => setClassFilter("ALL")}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${classFilter === "ALL"
            ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
            : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
          }`}
        >
          <span>Tất cả</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${classFilter === "ALL" ? "bg-white/20" : "bg-gray-100 text-gray-700"}`}>
            {stats.total}
          </span>
        </button>

        {classOptions.slice(0, 4).map((c) => (
          <button
            key={c.id}
            onClick={() => setClassFilter(c.id)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${classFilter === c.id
              ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
            }`}
          >
            {c.name}
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${classFilter === c.id ? "bg-white/20" : "bg-gray-100 text-gray-700"}`}>
              {stats.byClass[c.name] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className={`transition-all duration-700 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {tab === 'timeline' && (
          <div className="space-y-6">
            {/* Date Selector */}
            <div className="bg-gradient-to-r from-white to-gray-50 rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CalendarDays size={20} className="text-red-600" />
                  <h3 className="font-semibold text-gray-900">Chọn ngày xem timeline</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCurrentWeek(w => w - 1)}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={18} className="text-gray-700" />
                  </button>
                  <span className="text-sm text-gray-700">
                    {weekDaysForSelector[0]?.month || ''}
                  </span>
                  <button 
                    onClick={() => setCurrentWeek(w => w + 1)}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <ChevronRight size={18} className="text-gray-700" />
                  </button>
                  <button
                    onClick={() => setCurrentWeek(0)}
                    className="ml-2 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 transition-colors cursor-pointer text-gray-700 text-sm font-medium"
                  >
                    Tuần này
                  </button>
                  <GoToDateButton onSelect={(date) => {
                    const newWeekStart = startOfWeek(date);
                    const now = new Date();
                    const offset = Math.round((newWeekStart.getTime() - startOfWeek(now).getTime()) / (7 * 24 * 60 * 60 * 1000));
                    setCurrentWeek(offset);
                  }} />
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {weekDaysForSelector.map(day => (
                  <button
                    key={day.date}
                    onClick={() => setSelectedDate(day.date)}
                    className={`w-full rounded-lg p-2 transition-all duration-300 cursor-pointer ${selectedDate === day.date ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg' : 'bg-white border border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="text-center">
                      <div className={`text-xs ${selectedDate === day.date ? 'text-white/90' : 'text-gray-500'}`}>
                        {day.dow === 'Chủ nhật' ? 'CN' : day.dow.replace('Th ', 'Thứ ')}
                      </div>
                      <div className={`text-lg font-bold mt-0.5 ${selectedDate === day.date ? 'text-white' : 'text-gray-900'}`}>{day.day}</div>
                      <div className={`text-[10px] mt-0.5 ${selectedDate === day.date ? 'text-white/80' : 'text-gray-600'}`}>{day.month}</div>
                      {day.lessons.length > 0 && (
                        <div className={`text-[10px] mt-1 px-1.5 py-0.5 rounded-full ${selectedDate === day.date ? 'bg-white/20' : 'bg-red-100 text-red-600'}`}>
                          {day.lessons.length} buổi
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Day Timeline */}
            {selectedDay && <DayTimeline data={selectedDay} />}
          </div>
        )}

        {tab === 'week' && (
          <WeekCalendarView
            weekData={filteredWeekData}
            weekOffset={currentWeek}
            onPrevWeek={() => setCurrentWeek((w) => w - 1)}
            onNextWeek={() => setCurrentWeek((w) => w + 1)}
            onGoThisWeek={() => setCurrentWeek(0)}
            onSetWeek={setCurrentWeek}
          />
        )}
      </div>

      {/* Legend */}
      <div className={`mt-8 pt-6 border-t border-gray-200 transition-all duration-700 delay-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 flex items-center gap-4">
            <span className="font-semibold">Chú thích:</span>
            <div className="flex items-center gap-2">
              <div className="h-3 w-6 rounded bg-gradient-to-r from-red-600 to-red-700"></div>
              <span className="text-sm">Lớp học</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-6 rounded bg-gradient-to-r from-gray-600 to-gray-700"></div>
              <span className="text-sm">Buổi bù</span>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Đang xem: {tab === 'timeline' ? 'Timeline' : 'Tuần'}
          </div>
        </div>
      </div>
    </div>
  );
}