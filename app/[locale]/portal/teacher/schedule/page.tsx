'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CalendarDays, Calendar as CalendarIcon, MapPin, Users, Download, ChevronLeft, ChevronRight, Sparkles, BookOpen, Palette, CheckCircle } from 'lucide-react';
import { fetchTeacherTimetable, getVietnameseDow, formatDateISO } from '@/app/api/teacher/schedule';
import type { Lesson, DaySchedule } from '@/types/teacher/schedule';

// Utility functions are imported from @/app/api/teacher/schedule

/** Tính ngày đầu tuần (Thứ 2) và cuối tuần (Thứ 7) chứa today */
function getCurrentWeekRange(today: Date): { start: Date; end: Date } {
  const day = today.getDay(); // 0-6
  // Chuyển về Thứ 2
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(today);
  start.setDate(today.getDate() + diffToMonday);
  const end = new Date(start);
  end.setDate(start.getDate() + 6); // đến Chủ nhật
  return { start, end };
}

/** Lấy tuần theo offset (0 = tuần hiện tại, -1 = tuần trước, 1 = tuần sau, ...) */
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

// mapApiLessonToLesson is now in @/app/api/teacher/schedule

/** Format yyyy-mm-dd -> dd/mm/yyyy */
function formatVNDate(d: string) {
  const [y, m, day] = d.split('-').map(Number);
  return `${String(day).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

/** Kiểm tra xem 2 khoảng thời gian có trùng nhau không */
function isTimeOverlap(time1: string, time2: string): boolean {
  const parseTime = (timeStr: string) => {
    const [start, end] = timeStr.split(' - ');
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    return {
      start: startHour * 60 + startMin, // Tổng số phút từ 00:00
      end: endHour * 60 + endMin
    };
  };

  const t1 = parseTime(time1);
  const t2 = parseTime(time2);

  // Kiểm tra overlap: không trùng nếu một kết thúc trước khi một bắt đầu
  return !(t1.end <= t2.start || t2.end <= t1.start);
}

/** Kiểm tra xem có buổi học nào trùng giờ trong cùng ngày không */
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

/** Loại bỏ các buổi học trùng giờ - chỉ giữ lại buổi học đầu tiên trong mỗi nhóm trùng giờ */
function removeOverlappingLessons(lessons: Lesson[]): Lesson[] {
  const validLessons: Lesson[] = [];
  const processed = new Set<string>();

  // Sắp xếp theo thời gian bắt đầu để ưu tiên buổi học sớm hơn
  const sortedLessons = [...lessons].sort((a, b) => {
    const [aStart] = a.time.split(' - ');
    const [bStart] = b.time.split(' - ');
    const [aHour, aMin] = aStart.split(':').map(Number);
    const [bHour, bMin] = bStart.split(':').map(Number);
    return (aHour * 60 + aMin) - (bHour * 60 + bMin);
  });

  for (const lesson of sortedLessons) {
    if (processed.has(lesson.id)) continue;

    // Kiểm tra xem buổi học này có trùng với bất kỳ buổi học nào đã được chấp nhận không
    const overlapsWithValid = validLessons.some(validLesson => isTimeOverlap(validLesson.time, lesson.time));

    if (!overlapsWithValid) {
      // Không trùng giờ, thêm vào danh sách hợp lệ
      validLessons.push(lesson);
      processed.add(lesson.id);
    } else {
      // Trùng giờ, bỏ qua buổi học này (giáo viên không thể dạy 2 lớp cùng lúc)
      processed.add(lesson.id);
    }
  }

  return validLessons;
}

/** Nhóm các buổi học trùng giờ với nhau (để hiển thị cảnh báo) */
function groupOverlappingLessons(lessons: Lesson[]): Map<string, { groupIndex: number; positionInGroup: number; totalInGroup: number }> {
  const result = new Map<string, { groupIndex: number; positionInGroup: number; totalInGroup: number }>();
  const processed = new Set<string>();
  let groupIndex = 0;

  for (let i = 0; i < lessons.length; i++) {
    if (processed.has(lessons[i].id)) continue;

    // Tìm tất cả các buổi học trùng giờ với buổi học hiện tại
    const overlappingGroup: Lesson[] = [lessons[i]];
    processed.add(lessons[i].id);

    for (let j = i + 1; j < lessons.length; j++) {
      if (processed.has(lessons[j].id)) continue;

      // Kiểm tra xem có trùng với bất kỳ buổi học nào trong group không
      const overlapsWithGroup = overlappingGroup.some(l => isTimeOverlap(l.time, lessons[j].time));
      if (overlapsWithGroup) {
        overlappingGroup.push(lessons[j]);
        processed.add(lessons[j].id);
      }
    }

    // Nếu có nhiều hơn 1 buổi học trong group, gán vị trí cho từng buổi
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

/** Tag nhỏ */
function Pill({ children, color = 'from-red-600 to-red-700' }: { children: React.ReactNode; color?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full bg-gradient-to-r ${color} text-white text-xs px-3 py-1.5 font-medium shadow-sm`}>
      {children}
    </span>
  );
}

// Color options
const COLOR_OPTIONS = [
  { name: 'Đỏ đậm', value: 'bg-gradient-to-r from-red-400 to-red-500' },
  { name: 'Đỏ nhạt', value: 'bg-gradient-to-r from-red-300 to-red-400' },
  { name: 'Đỏ tươi', value: 'bg-gradient-to-r from-red-500 to-red-600' },
  { name: 'Xám đậm', value: 'bg-gradient-to-r from-gray-400 to-gray-500' },
  { name: 'Xám nhạt', value: 'bg-gradient-to-r from-gray-300 to-gray-400' },
  { name: 'Đen', value: 'bg-gradient-to-r from-gray-500 to-gray-600' },
  { name: 'Trắng-xám', value: 'bg-gradient-to-r from-gray-200 to-gray-300' },
  { name: 'Đỏ xám', value: 'bg-gradient-to-r from-red-400 to-gray-400' },
];

/** Timeline Item */
function TimelineLesson({ lesson, compact = false, onColorChange, hasConflict = false, layoutInfo, data }: { lesson: Lesson; compact?: boolean; onColorChange?: (lessonId: string, color: string) => void; hasConflict?: boolean; layoutInfo?: { groupIndex: number; positionInGroup: number; totalInGroup: number }; data?: DaySchedule }) {
  const [isHovered, setIsHovered] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  // Tính toán vị trí chính xác dựa trên thời gian thực tế
  const [startHour, startMin] = lesson.time.split(' - ')[0].split(':').map(Number);
  const startPosition = ((startHour - 7) * 60 + startMin); // 7am là 0px, mỗi phút = 1px

  // Tính toán vị trí và kích thước nếu có trùng giờ
  const baseLeft = 20;

  let left: string | number = baseLeft;
  let width = 'calc(100% - 40px)';

  if (layoutInfo && layoutInfo.totalInGroup > 1) {
    // Chia đều chiều rộng cho các buổi học trùng giờ
    const gap = 4; // Khoảng cách giữa các buổi học (px)
    const totalGaps = gap * (layoutInfo.totalInGroup - 1);
    const itemWidthPercent = 100 / layoutInfo.totalInGroup;

    // Tính toán left position dựa trên percentage
    const leftPercent = (layoutInfo.positionInGroup * itemWidthPercent);
    left = `calc(${baseLeft}px + ${leftPercent}% + ${layoutInfo.positionInGroup * gap}px)`;
    width = `calc(${itemWidthPercent}% - ${(totalGaps / layoutInfo.totalInGroup) + (baseLeft * 2 / layoutInfo.totalInGroup)}px)`;
  }

  // Chuyển màu gradient thành màu nhạt
  const lightColor = lesson.color
    .replace('bg-gradient-to-r', 'bg-gradient-to-br')
    .replace('from-red-400 to-red-500', 'from-white to-red-50')
    .replace('from-red-300 to-red-400', 'from-white to-red-50')
    .replace('from-gray-400 to-gray-500', 'from-gray-50 to-gray-100')
    .replace('from-gray-300 to-gray-400', 'from-gray-50 to-gray-100')
    .replace('from-gray-500 to-gray-600', 'from-gray-50 to-gray-100')
    .replace('from-gray-200 to-gray-300', 'from-gray-50 to-gray-100')
    .replace('from-red-400 to-gray-400', 'from-white to-gray-50')
    .replace('from-red-600 to-red-700', 'from-white to-red-50')
    .replace('from-red-500 to-red-600', 'from-white to-red-50')
    .replace('from-gray-600 to-gray-700', 'from-gray-50 to-gray-100')
    .replace('from-gray-700 to-gray-800', 'from-gray-50 to-gray-100')
    .replace('from-red-600 to-gray-600', 'from-white to-gray-50');

  return (
    <div
      className={`absolute rounded-xl shadow-lg transition-all duration-300 border border-gray-200 ${isHovered ? 'shadow-gray-200 -translate-y-0.5 z-10' : 'shadow-gray-100'} ${lightColor} p-4 text-gray-900 ${hasConflict ? 'ring-2 ring-red-500 ring-offset-2' : ''}`}
      style={{
        left: typeof left === 'number' ? `${left}px` : left,
        top: `${startPosition}px`,
        width: width,
        height: `${lesson.duration}px`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={hasConflict ? '⚠️ Cảnh báo: Buổi học này trùng giờ với buổi học khác trong ngày' : ''}
    >
      <div className="h-full flex flex-col justify-between">
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
              {onColorChange && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowColorPicker(!showColorPicker);
                    }}
                    className="text-xs bg-white/80 hover:bg-white backdrop-blur-sm rounded-lg px-2 py-1 transition-colors cursor-pointer flex items-center gap-1 border border-gray-200"
                  >
                    <Palette size={12} className="text-gray-700" />
                  </button>
                  {showColorPicker && (
                    <div className="absolute right-0 bottom-full mb-2 bg-white rounded-xl shadow-lg border border-gray-200 p-1.5 z-50 overflow-hidden w-[140px]">
                      <div className="text-[10px] font-semibold text-gray-700 mb-1.5 px-1">Chọn màu</div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {COLOR_OPTIONS.map((color) => (
                          <button
                            key={color.value}
                            onClick={(e) => {
                              e.stopPropagation();
                              onColorChange(lesson.id, color.value);
                              setShowColorPicker(false);
                            }}
                            className={`w-6 h-6 rounded-md ${color.value} border-2 ${lesson.color === color.value ? 'border-white ring-1 ring-red-500' : 'border-transparent'} hover:scale-110 transition-all cursor-pointer`}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {/* <button
                onClick={() => router.push(`/${locale}/portal/teacher/schedule/${lesson.id}`)}
                className="text-xs bg-white/80 hover:bg-white backdrop-blur-sm rounded-lg px-2 py-1 transition-colors cursor-pointer border border-gray-200 text-gray-700"
              >
                Chi tiết
              </button> */}
              <button
                onClick={() => {
                  const [startTime] = lesson.time.split(' - ');
                  const [hour, minute] = startTime.split(':');
                  const lessonDate = data?.date || new Date().toISOString().split('T')[0];
                  router.push(`/${locale}/portal/teacher/attendance?date=${lessonDate}&time=${hour}:${minute}&class=${encodeURIComponent(lesson.course)}`);
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

/** Day Timeline View */
function DayTimeline({ data, hours = 12, onColorChange }: { data: DaySchedule; hours?: number; onColorChange?: (lessonId: string, color: string) => void }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  // Hiển thị theo giờ từ 7am đến 7pm (không chia 3 ca)
  const timeSlots = Array.from({ length: hours }, (_, i) => i + 7); // 7am to 7pm

  // Loại bỏ các buổi học trùng giờ - chỉ giữ lại buổi học hợp lệ (không trùng giờ)
  const validLessons = useMemo(() => removeOverlappingLessons(data.lessons), [data.lessons]);

  // Kiểm tra xung đột thời gian (trước khi loại bỏ) để hiển thị cảnh báo
  const conflictCheck = useMemo(() => checkTimeConflicts(data.lessons), [data.lessons]);
  const removedLessons = useMemo(() => {
    const validIds = new Set(validLessons.map(l => l.id));
    return data.lessons.filter(l => !validIds.has(l.id));
  }, [data.lessons, validLessons]);

  // Tính toán layout cho các buổi học (sau khi đã loại bỏ trùng giờ)
  const lessonLayouts = useMemo(() => groupOverlappingLessons(validLessons), [validLessons]);

  // Cập nhật thời gian realtime mỗi giây
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Kiểm tra xem có phải ngày hôm nay không
  const today = new Date();
  const isToday = data.date === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Tính toán vị trí của thời gian hiện tại
  const getCurrentTimePosition = () => {
    if (!isToday) return null;
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    // Chỉ hiển thị nếu trong khoảng 7am - 7pm
    if (currentHour < 7 || currentHour >= 19) return null;
    return ((currentHour - 7) * 60 + currentMinute);
  };

  const currentTimePos = getCurrentTimePosition();
  const timeDisplay = `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}:${String(currentTime.getSeconds()).padStart(2, '0')}`;

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className={`bg-gradient-to-r from-red-50 to-gray-100 border-b border-gray-200 p-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`relative p-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg`}>
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
                    <span>Đã loại bỏ {removedLessons.length} buổi học trùng giờ (giáo viên không thể dạy 2 lớp cùng lúc)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <Pill>{validLessons.length} buổi học {removedLessons.length > 0 && `(${removedLessons.length} đã loại bỏ do trùng giờ)`}</Pill>
        </div>
      </div>

      {/* Timeline Container */}
      <div className="relative p-4 h-[720px] overflow-y-auto">
        {/* Time labels - theo giờ */}
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

        {/* Timeline grid lines */}
        <div className="ml-16 h-full relative" style={{ minHeight: '720px' }}>
          {timeSlots.map(hour => (
            <div
              key={`line-${hour}`}
              className="absolute left-0 right-0 border-t border-gray-100"
              style={{ top: `${(hour - 7) * 60}px` }}
            />
          ))}

          {/* Current time indicator - realtime */}
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

          {/* Lessons - chỉ hiển thị các buổi học không trùng giờ */}
          {validLessons.map(lesson => {
            const layoutInfo = lessonLayouts.get(lesson.id);
            return (
              <TimelineLesson
                key={lesson.id}
                lesson={lesson}
                onColorChange={onColorChange}
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

/** Week Lesson Button Component */
function WeekLessonButton({
  lesson,
  top,
  height,
  locale,
  router,
  onColorChange,
  hasConflict = false,
  layoutInfo,
  date
}: {
  lesson: Lesson;
  top: number;
  height: number;
  locale: string;
  router: any;
  onColorChange?: (lessonId: string, color: string) => void;
  hasConflict?: boolean;
  layoutInfo?: { groupIndex: number; positionInGroup: number; totalInGroup: number };
  date?: string;
}) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Tính toán vị trí và kích thước nếu có trùng giờ
  const baseLeft = 4; // left-1 = 4px

  let left: string | number = baseLeft;
  let width = 'calc(100% - 8px)';
  let right: string | undefined = '4px';

  if (layoutInfo && layoutInfo.totalInGroup > 1) {
    // Chia đều chiều rộng cho các buổi học trùng giờ
    const gap = 2; // Khoảng cách giữa các buổi học (px)
    const itemWidthPercent = 100 / layoutInfo.totalInGroup;

    // Tính toán left position dựa trên percentage
    const leftPercent = (layoutInfo.positionInGroup * itemWidthPercent);
    left = `calc(${baseLeft}px + ${leftPercent}% + ${layoutInfo.positionInGroup * gap}px)`;
    width = `calc(${itemWidthPercent}% - ${(gap * (layoutInfo.totalInGroup - 1) / layoutInfo.totalInGroup) + (8 / layoutInfo.totalInGroup)}px)`;
    right = 'auto';
  }

  return (
    <div
      className="absolute z-10"
      style={{
        left: typeof left === 'number' ? `${left}px` : left,
        right: right,
        top: `${top}px`,
        height: `${height}px`,
        minHeight: '40px',
        width: width
      }}
    >
      <button
        onClick={() => {
          const lessonDate = date || new Date().toISOString().split('T')[0];
          router.push(`/${locale}/portal/teacher/attendance?sessionId=${lesson.id}&date=${lessonDate}`);
        }}
        className={`w-full h-full rounded-lg ${lesson.color} p-2 text-white shadow-md hover:shadow-lg transition-all text-left cursor-pointer ${hasConflict ? 'ring-2 ring-red-500 ring-offset-1' : ''}`}
        title={hasConflict ? '⚠️ Cảnh báo: Buổi học này trùng giờ với buổi học khác trong ngày' : 'Bấm để điểm danh'}
      >
        <div className="h-full flex flex-col justify-between">
          <div>
            <div className="font-semibold text-xs leading-tight">{lesson.course}</div>
            <div className="text-xs opacity-90 mt-0.5">{lesson.time}</div>
          </div>
          <div className="flex items-center justify-between mt-1 text-xs">
            <div className="flex items-center gap-1">
              <MapPin size={10} />
              <span>{lesson.room}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users size={10} />
              <span>{lesson.students}</span>
            </div>
          </div>
        </div>
      </button>
      {onColorChange && (
        <div className="absolute top-1 right-1 flex items-center gap-1">
          {/* <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/${locale}/portal/teacher/schedule/${lesson.id}`);
            }}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-1 transition-colors cursor-pointer"
            title="Chi tiết"
          >
            <CheckCircle size={10}/>
          </button> */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowColorPicker(!showColorPicker);
            }}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-1 transition-colors cursor-pointer"
          >
            <Palette size={10} />
          </button>
          {showColorPicker && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 p-1.5 z-50 overflow-hidden w-[140px]">
              <div className="text-[10px] font-semibold text-gray-700 mb-1.5 px-1">Chọn màu</div>
              <div className="grid grid-cols-4 gap-1.5">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      onColorChange(lesson.id, color.value);
                      setShowColorPicker(false);
                    }}
                    className={`w-6 h-6 rounded-md ${color.value} border-2 ${lesson.color === color.value ? 'border-white ring-1 ring-red-500' : 'border-transparent'} hover:scale-110 transition-all cursor-pointer`}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Grid Lesson Card Component */
function GridLessonCard({
  lesson,
  lightColor,
  locale,
  router,
  onColorChange,
  date
}: {
  lesson: Lesson;
  lightColor: string;
  locale: string;
  router: any;
  onColorChange?: (lessonId: string, color: string) => void;
  date?: string;
}) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  return (
    <div className="relative group">
      <div
        onClick={() => {
          router.push(`/${locale}/portal/teacher/attendance?sessionId=${lesson.id}&date=${date}`);
        }}
        className={`rounded-lg ${lightColor} p-3 text-gray-900 cursor-pointer hover:shadow-md transition-all border border-gray-200`}
      >
        <div className="font-semibold text-sm whitespace-nowrap overflow-hidden text-ellipsis">{lesson.time}</div>
        <div className="font-medium text-xs mt-1 overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
          {lesson.course}
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
          <MapPin size={12} className="flex-shrink-0" />
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">{lesson.room}</span>
        </div>
      </div>
      {onColorChange && (
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          {/* <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/${locale}/portal/teacher/schedule/${lesson.id}`);
            }}
            className="bg-white/80 hover:bg-white backdrop-blur-sm rounded-lg p-1.5 transition-colors cursor-pointer shadow-sm"
            title="Chi tiết"
          >
            <CheckCircle size={12} className="text-red-600" />
          </button> */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowColorPicker(!showColorPicker);
            }}
            className="bg-white/80 hover:bg-white backdrop-blur-sm rounded-lg p-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Palette size={12} className="text-gray-700" />
          </button>
          {showColorPicker && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 p-1.5 z-50 overflow-hidden w-[140px]">
              <div className="text-[10px] font-semibold text-gray-700 mb-1.5 px-1">Chọn màu</div>
              <div className="grid grid-cols-4 gap-1.5">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      onColorChange(lesson.id, color.value);
                      setShowColorPicker(false);
                    }}
                    className={`w-6 h-6 rounded-md ${color.value} border-2 ${lesson.color === color.value ? 'border-white ring-1 ring-red-500' : 'border-transparent'} hover:scale-110 transition-all cursor-pointer`}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Week Calendar View - Grid format với 3 ca */
function WeekCalendarView({
  weekData,
  onColorChange,
  weekOffset,
  onPrevWeek,
  onNextWeek,
  onGoThisWeek,
}: {
  weekData: DaySchedule[];
  onColorChange?: (lessonId: string, color: string) => void;
  weekOffset: number;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onGoThisWeek: () => void;
}) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentHour = now.getHours() + now.getMinutes() / 60;

  // Chia thành 3 ca: Sáng (7-12h), Chiều (12-17h), Tối (17-22h)
  const timeShifts = [
    { label: 'Sáng', start: 7, end: 12 },
    { label: 'Chiều', start: 12, end: 17 },
    { label: 'Tối', start: 17, end: 22 },
  ];

  const isCurrentShift = (shift: { start: number; end: number }) => {
    return currentHour >= shift.start && currentHour < shift.end;
  };

  // Dựng đủ 7 ngày của tuần đang xem (Thứ 2 -> Chủ nhật), dù có/không có buổi học
  const { start: weekStart, end: weekEnd } = getWeekRangeByOffset(now, weekOffset);

  // Tính năm từ tuần đang xem
  const year = weekStart.getFullYear();
  const monthLabel =
    weekData.find((d) => d.date)?.month ?? `Tháng ${now.getMonth() + 1}`;
  const monthLabelWithYear = `${monthLabel}/${year}`;
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

  // Hàm kiểm tra buổi học thuộc ca nào
  const getShiftForLesson = (lesson: Lesson): string | null => {
    const [startTime] = lesson.time.split(' - ');
    const [hour] = startTime.split(':').map(Number);

    if (hour >= 7 && hour < 12) return 'Sáng';
    if (hour >= 12 && hour < 17) return 'Chiều';
    if (hour >= 17 && hour < 22) return 'Tối';
    return null;
  };

  // Lọc buổi học theo ca và ngày
  const getLessonsForShift = (day: DaySchedule, shiftLabel: string): Lesson[] => {
    return day.lessons.filter(lesson => getShiftForLesson(lesson) === shiftLabel);
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-50 to-gray-100 border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarDays size={20} className="text-red-600" />
            <h3 className="font-bold text-gray-900">Lịch tuần</h3>
            <span className="text-sm text-gray-600">({monthLabelWithYear})</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onPrevWeek}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
              aria-label="Tuần trước"
              title="Tuần trước"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm text-gray-700 px-3 whitespace-nowrap">
              {formatVNShortWithYear(weekStart)} - {formatVNShortWithYear(weekEnd)}
            </span>
            <button
              onClick={onNextWeek}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
              aria-label="Tuần sau"
              title="Tuần sau"
            >
              <ChevronRight size={18} />
            </button>
            <button
              onClick={onGoThisWeek}
              className="ml-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm text-gray-700 cursor-pointer whitespace-nowrap"
            >
              Tuần này
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid - 3 ca x 7 ngày */}
      <div className="relative overflow-x-auto">
        <div className="min-w-[1050px]">
          <table className="w-full border-collapse table-fixed">
            {/* Header row */}
            <thead>
              <tr className="bg-gradient-to-r from-red-50 to-gray-100 border-b-2 border-gray-200">
                <th className="w-24 px-4 py-3 text-left text-sm font-bold text-gray-900 border-r border-gray-200">
                  Ca / Ngày
                </th>
                {calendarDays.map((day, index) => {
                  const isToday = day.date === todayStr;
                  return (
                    <th key={index} className="w-[calc((100%-96px)/7)] px-4 py-3 text-center border-r border-gray-200 last:border-r-0 whitespace-nowrap">
                      <div className="text-xs text-gray-600 mb-1 whitespace-nowrap flex items-center justify-center gap-1">
                        <span>{day.dow === 'Chủ nhật' ? 'CN' : day.dow.replace('Thứ ', 'Th ')}</span>

                      </div>
                      <div className="text-[10px] text-gray-500 -mt-1">{day.month}</div>
                      <div className={`text-lg font-bold whitespace-nowrap ${day.day ? 'text-gray-900' : 'text-gray-400'} ${isToday ? 'bg-gradient-to-r from-red-600 to-red-700 text-white inline-flex px-3 py-1 rounded-lg shadow-sm' : ''}`}>
                        {day.day || ''}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Body - 3 ca */}
            <tbody>
              {timeShifts.map((shift, shiftIndex) => (
                <tr key={shift.label} className="border-b border-gray-200 last:border-b-0">
                  {/* Shift label column */}
                  <td className="w-24 px-4 py-6 text-center bg-red-50/50 border-r border-gray-200 align-top whitespace-nowrap">
                    <div className="font-bold text-gray-900 text-sm whitespace-nowrap">{shift.label}</div>
                    <div className="text-xs text-gray-600 mt-1 whitespace-nowrap">{shift.start}:00 - {shift.end}:00</div>
                    {isCurrentShift(shift) && (
                      <div className="text-[10px] mt-2 text-red-600 bg-red-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                        Đang diễn ra
                      </div>
                    )}
                  </td>

                  {/* Day columns */}
                  {calendarDays.map((day, dayIndex) => {
                    const lessons = getLessonsForShift(day, shift.label);
                    const isToday = day.date === todayStr;
                    const isNow = isToday && isCurrentShift(shift);
                    return (
                      <td
                        key={dayIndex}
                        className={`w-[calc((100%-96px)/7)] px-3 py-4 border-r border-gray-200 last:border-r-0 align-top min-h-[200px] bg-white relative ${isNow ? 'ring-2 ring-red-400 ring-offset-1' : ''}`}
                      >
                        {lessons.length === 0 ? (
                          <div className="text-center text-gray-400 text-sm py-8 whitespace-nowrap">Trống</div>
                        ) : (
                          <div className="space-y-2">
                            {lessons.map((lesson) => {
                              // Chuyển màu gradient thành màu nhạt
                              const lightColor = lesson.color
                                .replace('bg-gradient-to-r', 'bg-gradient-to-br')
                                .replace('from-red-400 to-red-500', 'from-white to-red-50')
                                .replace('from-red-300 to-red-400', 'from-white to-red-50')
                                .replace('from-gray-400 to-gray-500', 'from-gray-50 to-gray-100')
                                .replace('from-gray-300 to-gray-400', 'from-gray-50 to-gray-100')
                                .replace('from-gray-500 to-gray-600', 'from-gray-50 to-gray-100')
                                .replace('from-gray-200 to-gray-300', 'from-gray-50 to-gray-100')
                                .replace('from-red-400 to-gray-400', 'from-white to-gray-50')
                                .replace('from-red-600 to-red-700', 'from-white to-red-50')
                                .replace('from-red-500 to-red-600', 'from-white to-red-50')
                                .replace('from-gray-600 to-gray-700', 'from-gray-50 to-gray-100')
                                .replace('from-gray-700 to-gray-800', 'from-gray-50 to-gray-100')
                                .replace('from-red-600 to-gray-600', 'from-white to-gray-50');

                              return (
                                <GridLessonCard
                                  key={lesson.id}
                                  lesson={lesson}
                                  lightColor={lightColor}
                                  locale={locale}
                                  router={router}
                                  onColorChange={onColorChange}
                                  date={day.date}
                                />
                              );
                            })}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/** Day Card View (List) */
function DayCard({ data, onColorChange }: { data: DaySchedule; onColorChange?: (lessonId: string, color: string) => void }) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 overflow-hidden transition-all duration-500 hover:shadow-lg hover:shadow-gray-100/50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-50 to-gray-100 border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white`}>
              <CalendarDays size={18} />
            </div>
            <div>
              <div className="font-bold text-gray-900">{data.dow}</div>
              <div className="text-sm text-gray-600">{formatVNDate(data.date)}</div>
            </div>
          </div>
          <Pill>{data.lessons.length} buổi</Pill>
        </div>
      </div>

      {/* Lessons List */}
      <div className="p-4 space-y-3">
        {data.lessons.map(lesson => (
          <DayLessonCard
            key={lesson.id}
            lesson={lesson}
            locale={locale}
            router={router}
            onColorChange={onColorChange}
          />
        ))}
      </div>
    </div>
  );
}

/** Day Lesson Card Component */
function DayLessonCard({
  lesson,
  locale,
  router,
  onColorChange,
  date
}: {
  lesson: Lesson;
  locale: string;
  router: any;
  onColorChange?: (lessonId: string, color: string) => void;
  date?: string;
}) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  return (
    <div className="group cursor-pointer">
      <div className={`rounded-xl ${lesson.color} p-4 text-white transition-all duration-300 hover:shadow-lg relative`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">{lesson.course}</div>
            <div className="text-sm opacity-90 mt-1">{lesson.time}</div>
          </div>
          <div className="flex items-center gap-1">
            {onColorChange && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowColorPicker(!showColorPicker);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-white/20 hover:bg-white/30 rounded-lg px-2 py-1.5 cursor-pointer"
                >
                  <Palette size={14} />
                </button>
                {showColorPicker && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 p-1.5 z-50 overflow-hidden w-[140px]">
                    <div className="text-[10px] font-semibold text-gray-700 mb-1.5 px-1">Chọn màu</div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {COLOR_OPTIONS.map((color) => (
                        <button
                          key={color.value}
                          onClick={(e) => {
                            e.stopPropagation();
                            onColorChange(lesson.id, color.value);
                            setShowColorPicker(false);
                          }}
                          className={`w-6 h-6 rounded-md ${color.value} border-2 ${lesson.color === color.value ? 'border-white ring-1 ring-red-500' : 'border-transparent'} hover:scale-110 transition-all cursor-pointer`}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => {
                router.push(`/${locale}/portal/teacher/attendance?sessionId=${lesson.id}&date=${date}`);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5 cursor-pointer"
            >
              Điểm danh
            </button>
            {/* <button
              onClick={() => router.push(`/${locale}/portal/teacher/schedule/${lesson.id}`)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5 cursor-pointer"
            >
              Chi tiết
            </button> */}
          </div>
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs">
          <div className="flex items-center gap-1.5">
            <MapPin size={12} />
            <span>{lesson.room}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users size={12} />
            <span>{lesson.students} học viên</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BookOpen size={12} />
            <span>{lesson.track}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const [tab, setTab] = useState<'week' | 'month' | 'timeline'>('week');
  const [currentWeek, setCurrentWeek] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [weekData, setWeekData] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const today = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const current = useMemo(
    () => (weekData[0] ? new Date(weekData[0].date) : new Date()),
    [weekData]
  );
  const weekMonthLabel = useMemo(() => {
    const now = new Date();
    const { start } = getWeekRangeByOffset(now, currentWeek);
    return `Tháng ${start.getMonth() + 1}`;
  }, [currentWeek]);

  const monthBaseDate = useMemo(() => {
    const now = new Date();
    const { start } = getWeekRangeByOffset(now, currentWeek);
    return start; // dùng ngày đầu tuần của tuần đang xem làm mốc tháng
  }, [currentWeek]);

  const monthTitle = useMemo(
    () => `Tháng ${monthBaseDate.getMonth() + 1}/${monthBaseDate.getFullYear()}`,
    [monthBaseDate]
  );

  const monthCells = useMemo(() => {
    const y = monthBaseDate.getFullYear();
    const m = monthBaseDate.getMonth(); // 0-11
    const first = new Date(y, m, 1);
    const daysInMonth = new Date(y, m + 1, 0).getDate();

    // Convert JS getDay() (0=CN..6=T7) -> Monday index (0=T2..6=CN)
    const firstDowMonIdx = (first.getDay() + 6) % 7;
    const totalCells = 42; // 6 rows x 7 cols

    return Array.from({ length: totalCells }, (_, idx) => {
      const dayNum = idx - firstDowMonIdx + 1;
      if (dayNum < 1 || dayNum > daysInMonth) {
        return null;
      }
      const d = new Date(y, m, dayNum);
      return {
        dayNum,
        date: formatDateISO(d),
      };
    });
  }, [monthBaseDate]);

  // Dựng đủ 7 ngày của tuần đang xem (Thứ 2 -> Chủ nhật) cho timeline selector
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

  // Lấy tuần hiện tại với offset
  const displayedWeek = useMemo(() => {
    return weekData;
  }, [weekData, currentWeek]);

  const selectedDay = useMemo(() => {
    return (
      weekDaysForSelector.find((day) => day.date === selectedDate) ??
      weekDaysForSelector[0]
    );
  }, [selectedDate, weekDaysForSelector]);

  // Handle color change - đổi màu cho tất cả lesson cùng course
  const handleColorChange = (lessonId: string, newColor: string) => {
    setWeekData((prev) => {
      // Tìm lesson được chọn để lấy course name
      let selectedLesson: Lesson | null = null;
      for (const day of prev) {
        const lesson = day.lessons.find(l => l.id === lessonId);
        if (lesson) {
          selectedLesson = lesson;
          break;
        }
      }

      if (!selectedLesson) return prev;

      // Đổi màu cho tất cả lesson cùng course
      return prev.map(day => ({
        ...day,
        lessons: day.lessons.map(lesson =>
          lesson.course === selectedLesson!.course
            ? { ...lesson, color: newColor }
            : lesson
        )
      }));
    });
  };

  // Tổng số buổi học
  const totalLessons = useMemo(() => {
    return weekData.reduce((sum, day) => sum + day.lessons.length, 0);
  }, [weekData]);

  // Tổng số học viên
  const totalStudents = useMemo(() => {
    return weekData.reduce(
      (sum, day) =>
        sum +
        day.lessons.reduce((daySum, lesson) => daySum + lesson.students, 0),
      0
    );
  }, [weekData]);

  useEffect(() => {
    async function fetchWeekData() {
      try {
        setLoading(true);
        setError(null);

        const now = new Date();
        const { start, end } = getWeekRangeByOffset(now, currentWeek);
        const fromDate = formatDateISO(start);
        const toDate = formatDateISO(end);

        // Backend expects date-time (Swagger: string($date-time))
        // Use full-day range in UTC to avoid timezone edge cases
        const from = `${fromDate}T00:00:00.000Z`;
        const to = `${toDate}T23:59:59.999Z`;

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
    // ưu tiên chọn ngày hôm nay nếu có trong dữ liệu, nếu không chọn ngày đầu
    const hasToday = weekData.find((d) => d.date === today);
    setSelectedDate(hasToday ? hasToday.date : weekData[0]?.date ?? null);
  }, [weekData, today]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 p-6">
      {/* Header */}
      <div className={`mb-8 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
              <CalendarDays size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Lịch giảng dạy
              </h1>
              <p className="text-gray-600 mt-1">Quản lý và theo dõi lịch dạy theo timeline</p>
            </div>
          </div>

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
                className={`px-4 py-2.5 text-sm rounded-lg flex items-center gap-2 transition-all cursor-pointer ${tab === 'month' ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md' : 'text-gray-700 hover:bg-gray-50'}`}
                onClick={() => setTab('month')}
              >
                <CalendarIcon size={16} />
                Tháng
              </button>
              <button
                className={`px-4 py-2.5 text-sm rounded-lg flex items-center gap-2 transition-all cursor-pointer ${tab === 'timeline' ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md' : 'text-gray-700 hover:bg-gray-50'}`}
                onClick={() => setTab('timeline')}
              >
                <Sparkles size={16} />
                Timeline
              </button>
            </div>

            <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2.5 text-sm font-medium hover:shadow-lg transition-all cursor-pointer">
              <Download size={16} /> Xuất lịch
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className={`transition-all duration-700 delay-100 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

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
                  <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-sm text-gray-700">{weekMonthLabel}</span>
                  <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                    <ChevronRight size={18} />
                  </button>
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
                        {day.dow === 'Chủ nhật' ? 'CN' : day.dow.replace('Thứ ', 'Th ')}
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
            <DayTimeline data={selectedDay} onColorChange={handleColorChange} />
          </div>
        )}

        {tab === 'week' && (
          <WeekCalendarView
            weekData={displayedWeek}
            onColorChange={handleColorChange}
            weekOffset={currentWeek}
            onPrevWeek={() => setCurrentWeek((w) => w - 1)}
            onNextWeek={() => setCurrentWeek((w) => w + 1)}
            onGoThisWeek={() => setCurrentWeek(0)}
          />
        )}

        {tab === 'month' && (
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-red-50 to-gray-100 border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 font-bold text-gray-900">
                  <CalendarIcon size={20} className="text-red-600" /> {monthTitle}
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                    <ChevronLeft size={18} />
                  </button>
                  <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-7 text-sm text-gray-600 mb-4">
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d, i) => (
                  <div key={d} className="text-center font-semibold py-2">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {monthCells.map((cell, i) => {
                  if (!cell) {
                    return (
                      <div
                        key={`empty-${i}`}
                        className="h-32 rounded-xl bg-gray-50/30 border border-dashed border-gray-100"
                      />
                    );
                  }

                  const dayData = weekData.find((d) => d.date === cell.date);
                  const hasLessons = Boolean(dayData && dayData.lessons.length > 0);
                  const isToday = cell.date === today;

                  return (
                    <button
                      key={cell.date}
                      onClick={() => {
                        if (dayData) {
                          setSelectedDate(dayData.date);
                          setTab('timeline');
                        }
                      }}
                      className={`h-32 rounded-xl p-3 text-left transition-all duration-300 cursor-pointer bg-white border border-gray-200 hover:border-gray-300 hover:shadow-lg hover:shadow-gray-100/30 ${selectedDate === cell.date ? 'ring-2 ring-red-500 ring-offset-2' : ''
                        } ${isToday ? 'ring-1 ring-red-300' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-lg font-bold ${isToday ? 'text-red-600' : 'text-gray-900'}`}>
                          {cell.dayNum}
                        </span>
                        {hasLessons && (
                          <div className="h-2 w-2 rounded-full bg-gradient-to-r from-red-600 to-red-700" />
                        )}
                      </div>

                      {dayData && (
                        <div className="mt-2 space-y-1">
                          {dayData.lessons.slice(0, 2).map((lesson, idx) => {
                            // Chuyển màu gradient thành màu nhạt
                            const lightColor = lesson.color
                              .replace('bg-gradient-to-r', 'bg-gradient-to-br')
                              .replace('from-red-600 to-red-700', 'from-white to-red-50')
                              .replace('from-red-500 to-red-600', 'from-white to-red-50')
                              .replace('from-gray-600 to-gray-700', 'from-gray-50 to-gray-100')
                              .replace('from-gray-500 to-gray-600', 'from-gray-50 to-gray-100')
                              .replace('from-gray-700 to-gray-800', 'from-gray-50 to-gray-100')
                              .replace('from-gray-200 to-gray-300', 'from-gray-50 to-gray-100')
                              .replace('from-red-600 to-gray-600', 'from-white to-gray-50');
                            return (
                              <div
                                key={idx}
                                className={`text-xs p-1.5 rounded-lg text-gray-900 border border-gray-200 ${lightColor}`}
                              >
                                {lesson.time.split(' - ')[0]}
                              </div>
                            );
                          })}
                          {dayData.lessons.length > 2 && (
                            <div className="text-xs text-red-600 font-medium text-center">
                              +{dayData.lessons.length - 2} buổi
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className={`mt-8 pt-6 border-t border-gray-200 transition-all duration-700 delay-200 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 flex items-center gap-4">
            <span className="font-semibold">Chú thích:</span>
            <div className="flex items-center gap-2">
              <div className="h-3 w-6 rounded bg-gradient-to-r from-red-600 to-red-700"></div>
              <span className="text-sm">IELTS</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-6 rounded bg-gradient-to-r from-red-500 to-red-600"></div>
              <span className="text-sm">TOEIC</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-6 rounded bg-gradient-to-r from-gray-600 to-gray-700"></div>
              <span className="text-sm">Business</span>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Đang xem: {tab === 'timeline' ? 'Timeline' : tab === 'week' ? 'Tuần' : 'Tháng'}
          </div>
        </div>
      </div>
    </div>
  );
}  