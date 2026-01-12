'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CalendarDays, Calendar as CalendarIcon, Clock, MapPin, Users, Eye, Download, ChevronLeft, ChevronRight, Sparkles, BookOpen, Bell, Palette } from 'lucide-react';

/** --------- DATA MẪU (có thể thay bằng dữ liệu thật) --------- */
type Lesson = {
  id: string;
  course: string;
  time: string;
  room: string;
  students: number;
  track: 'IELTS' | 'TOEIC' | 'Business';
  color: string;
  duration: number; // minutes
  teacher?: string;
};

type DaySchedule = {
  date: string; // yyyy-mm-dd
  dow: string;  // Thứ 2, Thứ 3, ...
  day: number;
  month: string;
  lessons: Lesson[];
};

// Tạo dữ liệu mẫu phong phú hơn
const WEEK_DATA: DaySchedule[] = [
  {
    date: '2025-10-06',
    dow: 'Thứ 2',
    day: 6,
    month: 'Tháng 10',
    lessons: [
      { id: 'L1', course: 'IELTS Foundation - A1', time: '08:00 - 10:00', room: 'Phòng 301', students: 18, track: 'IELTS', color: 'bg-gradient-to-r from-pink-500 to-rose-500', duration: 120, teacher: 'Nguyễn Văn A' },
      { id: 'L2', course: 'Business Communication', time: '14:00 - 16:00', room: 'Phòng 205', students: 12, track: 'Business', color: 'bg-gradient-to-r from-fuchsia-500 to-purple-500', duration: 120, teacher: 'Trần Thị B' },
    ],
  },
  {
    date: '2025-10-07',
    dow: 'Thứ 3',
    day: 7,
    month: 'Tháng 10',
    lessons: [
      { id: 'L3', course: 'TOEIC Intermediate', time: '09:00 - 11:30', room: 'Phòng 102', students: 15, track: 'TOEIC', color: 'bg-gradient-to-r from-rose-500 to-pink-600', duration: 150, teacher: 'Lê Văn C' },
      { id: 'L4', course: 'IELTS Speaking', time: '14:00 - 16:00', room: 'Phòng 305', students: 10, track: 'IELTS', color: 'bg-gradient-to-r from-pink-500 to-rose-500', duration: 120, teacher: 'Nguyễn Thị D' },
    ],
  },
  {
    date: '2025-10-08',
    dow: 'Thứ 4',
    day: 8,
    month: 'Tháng 10',
    lessons: [
      { id: 'L5', course: 'Business Writing', time: '10:00 - 12:00', room: 'Phòng 208', students: 14, track: 'Business', color: 'bg-gradient-to-r from-fuchsia-500 to-purple-500', duration: 120, teacher: 'Phạm Văn E' },
    ],
  },
  {
    date: '2025-10-09',
    dow: 'Thứ 5',
    day: 9,
    month: 'Tháng 10',
    lessons: [
      { id: 'L6', course: 'TOEIC Listening', time: '08:30 - 10:30', room: 'Phòng 401', students: 20, track: 'TOEIC', color: 'bg-gradient-to-r from-rose-500 to-pink-600', duration: 120, teacher: 'Hoàng Thị F' },
      { id: 'L7', course: 'IELTS Writing', time: '13:00 - 15:00', room: 'Phòng 301', students: 16, track: 'IELTS', color: 'bg-gradient-to-r from-pink-500 to-rose-500', duration: 120, teacher: 'Nguyễn Văn A' },
    ],
  },
  {
    date: '2025-10-10',
    dow: 'Thứ 6',
    day: 10,
    month: 'Tháng 10',
    lessons: [
      { id: 'L8', course: 'IELTS Foundation - A1', time: '08:00 - 10:00', room: 'Phòng 301', students: 18, track: 'IELTS', color: 'bg-gradient-to-r from-pink-500 to-rose-500', duration: 120, teacher: 'Nguyễn Văn A' },
      { id: 'L9', course: 'Business English', time: '09:00 - 11:00', room: 'Phòng 102', students: 12, track: 'Business', color: 'bg-gradient-to-r from-fuchsia-500 to-purple-500', duration: 120, teacher: 'Trần Thị B' },
      { id: 'L10', course: 'TOEIC Reading', time: '15:00 - 17:00', room: 'Phòng 205', students: 22, track: 'TOEIC', color: 'bg-gradient-to-r from-rose-500 to-pink-600', duration: 120, teacher: 'Lê Văn C' },
    ],
  },
  {
    date: '2025-10-11',
    dow: 'Thứ 7',
    day: 11,
    month: 'Tháng 10',
    lessons: [
      { id: 'L11', course: 'Business English', time: '09:00 - 11:00', room: 'Phòng 102', students: 12, track: 'Business', color: 'bg-gradient-to-r from-fuchsia-500 to-purple-500', duration: 120, teacher: 'Trần Thị B' },
      { id: 'L12', course: 'IELTS Mock Test', time: '13:00 - 16:00', room: 'Phòng 305', students: 25, track: 'IELTS', color: 'bg-gradient-to-r from-pink-500 to-rose-500', duration: 180, teacher: 'Nguyễn Thị D' },
    ],
  },
];

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
function Pill({ children, color = 'from-pink-500 to-rose-500' }: { children: React.ReactNode; color?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full bg-gradient-to-r ${color} text-white text-xs px-3 py-1.5 font-medium shadow-sm`}>
      {children}
    </span>
  );
}

// Color options
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

/** Timeline Item */
function TimelineLesson({ lesson, compact = false, onColorChange, hasConflict = false, layoutInfo }: { lesson: Lesson; compact?: boolean; onColorChange?: (lessonId: string, color: string) => void; hasConflict?: boolean; layoutInfo?: { groupIndex: number; positionInGroup: number; totalInGroup: number } }) {
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
    .replace('from-pink-500 to-rose-500', 'from-pink-100 to-rose-100')
    .replace('from-rose-500 to-pink-600', 'from-rose-100 to-pink-100')
    .replace('from-fuchsia-500 to-purple-500', 'from-fuchsia-100 to-purple-100')
    .replace('from-blue-500 to-sky-500', 'from-blue-100 to-sky-100')
    .replace('from-emerald-500 to-teal-500', 'from-emerald-100 to-teal-100')
    .replace('from-amber-500 to-orange-500', 'from-amber-100 to-orange-100')
    .replace('from-purple-500 to-indigo-500', 'from-purple-100 to-indigo-100');

  return (
    <div 
      className={`absolute rounded-xl shadow-lg transition-all duration-300 border border-pink-200 ${isHovered ? 'shadow-pink-200 -translate-y-0.5 z-10' : 'shadow-pink-100'} ${lightColor} p-4 text-gray-900 ${hasConflict ? 'ring-2 ring-red-500 ring-offset-2' : ''}`}
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
                    className="text-xs bg-white/80 hover:bg-white backdrop-blur-sm rounded-lg px-2 py-1 transition-colors cursor-pointer flex items-center gap-1 border border-pink-200"
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
                            className={`w-6 h-6 rounded-md ${color.value} border-2 ${lesson.color === color.value ? 'border-white ring-1 ring-pink-500' : 'border-transparent'} hover:scale-110 transition-all cursor-pointer`}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={() => router.push(`/${locale}/portal/teacher/schedule/${lesson.id}`)}
                className="text-xs bg-white/80 hover:bg-white backdrop-blur-sm rounded-lg px-2 py-1 transition-colors cursor-pointer border border-pink-200 text-gray-700"
              >
              Chi tiết
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
    <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className={`bg-gradient-to-r from-pink-500/10 to-rose-500/10 border-b border-pink-200 p-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`relative p-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg`}>
              <CalendarDays size={24} />
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center">
                <span className="text-xs font-bold text-pink-600">{data.day}</span>
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{data.dow}</div>
              <div className="text-gray-600">{data.month} - {formatVNDate(data.date)}</div>
              {isToday && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="text-xs font-semibold text-pink-600 bg-pink-100 px-2 py-0.5 rounded-full">
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
              className="absolute left-0 right-0 border-t border-pink-100"
              style={{ top: `${(hour - 7) * 60}px` }}
            />
          ))}
          
          {/* Current time indicator - realtime */}
          {currentTimePos !== null && (
            <div 
              className="absolute left-0 right-0 z-30"
              style={{ top: `${currentTimePos}px` }}
            >
              <div className="absolute left-0 h-0.5 w-full bg-gradient-to-r from-pink-500 to-rose-500"></div>
              <div className="absolute -left-2 -top-1.5 w-3 h-3 rounded-full bg-rose-500 shadow-lg"></div>
              <div className="absolute right-0 -top-2.5 bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold shadow-md">
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
  layoutInfo
}: { 
  lesson: Lesson; 
  top: number; 
  height: number; 
  locale: string; 
  router: any; 
  onColorChange?: (lessonId: string, color: string) => void;
  hasConflict?: boolean;
  layoutInfo?: { groupIndex: number; positionInGroup: number; totalInGroup: number };
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
        onClick={() => router.push(`/${locale}/portal/teacher/schedule/${lesson.id}`)}
        className={`w-full h-full rounded-lg ${lesson.color} p-2 text-white shadow-md hover:shadow-lg transition-all text-left cursor-pointer ${hasConflict ? 'ring-2 ring-red-500 ring-offset-1' : ''}`}
        title={hasConflict ? '⚠️ Cảnh báo: Buổi học này trùng giờ với buổi học khác trong ngày' : ''}
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
        <div className="absolute top-1 right-1">
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
                    className={`w-6 h-6 rounded-md ${color.value} border-2 ${lesson.color === color.value ? 'border-white ring-1 ring-pink-500' : 'border-transparent'} hover:scale-110 transition-all cursor-pointer`}
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
  onColorChange 
}: { 
  lesson: Lesson; 
  lightColor: string; 
  locale: string; 
  router: any; 
  onColorChange?: (lessonId: string, color: string) => void;
}) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  return (
    <div className="relative group">
      <div
        onClick={() => router.push(`/${locale}/portal/teacher/schedule/${lesson.id}`)}
        className={`rounded-lg ${lightColor} p-3 text-gray-900 cursor-pointer hover:shadow-md transition-all border border-pink-200`}
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
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                    className={`w-6 h-6 rounded-md ${color.value} border-2 ${lesson.color === color.value ? 'border-white ring-1 ring-pink-500' : 'border-transparent'} hover:scale-110 transition-all cursor-pointer`}
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
function WeekCalendarView({ weekData, onColorChange }: { weekData: DaySchedule[]; onColorChange?: (lessonId: string, color: string) => void }) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  
  // Chia thành 3 ca: Sáng (7-12h), Chiều (12-17h), Tối (17-22h)
  const timeShifts = [
    { label: 'Sáng', start: 7, end: 12 },
    { label: 'Chiều', start: 12, end: 17 },
    { label: 'Tối', start: 17, end: 22 },
  ];

  // Tạo mảng 6 ngày (bỏ Chủ nhật)
  const daysOfWeek = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const calendarDays = daysOfWeek.map((dow, index) => {
    return weekData.find(day => day.dow === dow) || {
      date: '',
      dow,
      day: 0,
      month: '',
      lessons: []
    };
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
    <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500/10 to-rose-500/10 border-b border-pink-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarDays size={20} className="text-pink-500" />
            <h3 className="font-bold text-gray-900">Lịch tuần</h3>
            <span className="text-sm text-gray-600">({weekData[0]?.month || 'Tháng 10'})</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg border border-pink-200 hover:bg-pink-50 cursor-pointer">
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm text-gray-700 px-3">Tuần này</span>
            <button className="p-2 rounded-lg border border-pink-200 hover:bg-pink-50 cursor-pointer">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid - 3 ca x 6 ngày */}
      <div className="relative overflow-x-auto">
        <div className="min-w-[900px]">
          <table className="w-full border-collapse table-fixed">
            {/* Header row */}
            <thead>
              <tr className="bg-gradient-to-r from-pink-500/10 to-rose-500/10 border-b-2 border-pink-300">
                <th className="w-24 px-4 py-3 text-left text-sm font-bold text-gray-900 border-r border-pink-200">
                  Ca / Ngày
                </th>
                {calendarDays.map((day, index) => (
                  <th key={index} className="w-[calc((100%-96px)/6)] px-4 py-3 text-center border-r border-pink-200 last:border-r-0 whitespace-nowrap">
                    <div className="text-xs text-gray-600 mb-1 whitespace-nowrap">{day.dow.replace('Thứ ', 'Th ')}</div>
                    <div className={`text-lg font-bold whitespace-nowrap ${day.day ? 'text-gray-900' : 'text-gray-400'}`}>
                      {day.day || ''}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            
            {/* Body - 3 ca */}
            <tbody>
              {timeShifts.map((shift, shiftIndex) => (
                <tr key={shift.label} className="border-b border-pink-200 last:border-b-0">
                  {/* Shift label column */}
                  <td className="w-24 px-4 py-6 text-center bg-pink-50/50 border-r border-pink-200 align-top whitespace-nowrap">
                    <div className="font-bold text-gray-900 text-sm whitespace-nowrap">{shift.label}</div>
                    <div className="text-xs text-gray-600 mt-1 whitespace-nowrap">{shift.start}:00 - {shift.end}:00</div>
                  </td>
                  
                  {/* Day columns */}
                  {calendarDays.map((day, dayIndex) => {
                    const lessons = getLessonsForShift(day, shift.label);
                    return (
                      <td key={dayIndex} className="w-[calc((100%-96px)/6)] px-3 py-4 border-r border-pink-200 last:border-r-0 align-top min-h-[200px] bg-white">
                        {lessons.length === 0 ? (
                          <div className="text-center text-gray-400 text-sm py-8 whitespace-nowrap">Trống</div>
                        ) : (
                          <div className="space-y-2">
                            {lessons.map((lesson) => {
                              // Chuyển màu gradient thành màu nhạt
                              const lightColor = lesson.color
                                .replace('from-pink-500 to-rose-500', 'from-pink-100 to-rose-100')
                                .replace('from-rose-500 to-pink-600', 'from-rose-100 to-pink-100')
                                .replace('from-fuchsia-500 to-purple-500', 'from-fuchsia-100 to-purple-100')
                                .replace('from-blue-500 to-sky-500', 'from-blue-100 to-sky-100')
                                .replace('from-emerald-500 to-teal-500', 'from-emerald-100 to-teal-100')
                                .replace('from-amber-500 to-orange-500', 'from-amber-100 to-orange-100')
                                .replace('from-purple-500 to-indigo-500', 'from-purple-100 to-indigo-100');
                              
                              return (
                                <GridLessonCard
                                  key={lesson.id}
                                  lesson={lesson}
                                  lightColor={lightColor}
                                  locale={locale}
                                  router={router}
                                  onColorChange={onColorChange}
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
    <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 overflow-hidden transition-all duration-500 hover:shadow-lg hover:shadow-pink-100/50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500/5 to-rose-500/5 border-b border-pink-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 text-white`}>
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
  onColorChange
}: {
  lesson: Lesson;
  locale: string;
  router: any;
  onColorChange?: (lessonId: string, color: string) => void;
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
                          className={`w-6 h-6 rounded-md ${color.value} border-2 ${lesson.color === color.value ? 'border-white ring-1 ring-pink-500' : 'border-transparent'} hover:scale-110 transition-all cursor-pointer`}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => router.push(`/${locale}/portal/teacher/schedule/${lesson.id}`)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5 cursor-pointer"
            >
              Chi tiết
            </button>
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
  const [selectedDate, setSelectedDate] = useState<string | null>(WEEK_DATA[0].date);
  const [weekData, setWeekData] = useState<DaySchedule[]>(WEEK_DATA);

  const current = useMemo(() => new Date(WEEK_DATA[0].date), []);
  const monthTitle = useMemo(
    () => `Tháng ${current.getMonth() + 1}/${current.getFullYear()}`,
    [current]
  );

  // Lấy tuần hiện tại với offset
  const displayedWeek = useMemo(() => {
    return weekData;
  }, [weekData, currentWeek]);

  const selectedDay = useMemo(() => {
    return weekData.find(day => day.date === selectedDate) || weekData[0];
  }, [selectedDate, weekData]);

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
    return WEEK_DATA.reduce((sum, day) => sum + day.lessons.length, 0);
  }, []);

  // Tổng số học viên
  const totalStudents = useMemo(() => {
    return WEEK_DATA.reduce((sum, day) => 
      sum + day.lessons.reduce((daySum, lesson) => daySum + lesson.students, 0), 0);
  }, []);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-6">
      {/* Header */}
      <div className={`mb-8 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
              <CalendarDays size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                Lịch giảng dạy
              </h1>
              <p className="text-gray-600 mt-1">Quản lý và theo dõi lịch dạy theo timeline</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white border border-pink-200 rounded-xl p-1 flex">
              
              <button
                className={`px-4 py-2.5 text-sm rounded-lg flex items-center gap-2 transition-all cursor-pointer ${tab === 'week' ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md' : 'text-gray-700 hover:bg-pink-50'}`}
                onClick={() => setTab('week')}
              >
                <CalendarDays size={16} />
                Tuần
              </button>
              <button
                className={`px-4 py-2.5 text-sm rounded-lg flex items-center gap-2 transition-all cursor-pointer ${tab === 'month' ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md' : 'text-gray-700 hover:bg-pink-50'}`}
                onClick={() => setTab('month')}
              >
                <CalendarIcon size={16} />
                Tháng
              </button>
              <button
                className={`px-4 py-2.5 text-sm rounded-lg flex items-center gap-2 transition-all cursor-pointer ${tab === 'timeline' ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md' : 'text-gray-700 hover:bg-pink-50'}`}
                onClick={() => setTab('timeline')}
              >
                <Sparkles size={16} />
                Timeline
              </button>
            </div>

            <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2.5 text-sm font-medium hover:shadow-lg transition-all cursor-pointer">
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
            <div className="bg-gradient-to-r from-white to-pink-50 rounded-2xl border border-pink-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CalendarDays size={20} className="text-pink-500" />
                  <h3 className="font-semibold text-gray-900">Chọn ngày xem timeline</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg border border-pink-200 hover:bg-pink-50 cursor-pointer">
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-sm text-gray-700">Tuần 1, Tháng 10</span>
                  <button className="p-2 rounded-lg border border-pink-200 hover:bg-pink-50 cursor-pointer">
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-6 gap-2">
                {weekData.map(day => (
                  <button
                    key={day.date}
                    onClick={() => setSelectedDate(day.date)}
                    className={`w-full rounded-lg p-2 transition-all duration-300 cursor-pointer ${selectedDate === day.date ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg' : 'bg-white border border-pink-200 hover:border-pink-300'}`}
                  >
                    <div className="text-center">
                      <div className={`text-xs ${selectedDate === day.date ? 'text-white/90' : 'text-gray-500'}`}>{day.dow.replace('Thứ ', 'Th ')}</div>
                      <div className={`text-lg font-bold mt-0.5 ${selectedDate === day.date ? 'text-white' : 'text-gray-900'}`}>{day.day}</div>
                      <div className={`text-[10px] mt-0.5 ${selectedDate === day.date ? 'text-white/80' : 'text-gray-600'}`}>{day.month}</div>
                      {day.lessons.length > 0 && (
                        <div className={`text-[10px] mt-1 px-1.5 py-0.5 rounded-full ${selectedDate === day.date ? 'bg-white/20' : 'bg-pink-100 text-pink-600'}`}>
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
          <WeekCalendarView weekData={displayedWeek} onColorChange={handleColorChange} />
        )}

        {tab === 'month' && (
          <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 overflow-hidden">
            <div className="bg-gradient-to-r from-pink-500/5 to-rose-500/5 border-b border-pink-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 font-bold text-gray-900">
                  <CalendarIcon size={20} className="text-pink-500" /> {monthTitle}
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg border border-pink-200 hover:bg-pink-50 cursor-pointer">
                    <ChevronLeft size={18} />
                  </button>
                  <button className="p-2 rounded-lg border border-pink-200 hover:bg-pink-50 cursor-pointer">
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
                {Array.from({ length: 35 }, (_, i) => {
                  const day = i + 1;
                  const hasLessons = weekData.some(d => d.day === day);
                  const dayData = weekData.find(d => d.day === day);
                  
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        if (dayData) {
                          setSelectedDate(dayData.date);
                          setTab('timeline');
                        }
                      }}
                      className={`h-32 rounded-xl p-3 text-left transition-all duration-300 cursor-pointer ${dayData ? 'bg-white border border-pink-200 hover:border-pink-300 hover:shadow-lg hover:shadow-pink-100/30' : 'bg-pink-50/50 border border-dashed border-pink-100'} ${selectedDate === dayData?.date ? 'ring-2 ring-pink-500 ring-offset-2' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-lg font-bold ${dayData ? 'text-gray-900' : 'text-gray-400'}`}>
                          {dayData ? day : ''}
                        </span>
                        {hasLessons && (
                          <div className="h-2 w-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500"></div>
                        )}
                      </div>
                      
                      {dayData && (
                        <div className="mt-2 space-y-1">
                          {dayData.lessons.slice(0, 2).map((lesson, idx) => {
                            // Chuyển màu gradient thành màu nhạt
                            const lightColor = lesson.color
                              .replace('from-pink-500 to-rose-500', 'from-pink-100 to-rose-100')
                              .replace('from-rose-500 to-pink-600', 'from-rose-100 to-pink-100')
                              .replace('from-fuchsia-500 to-purple-500', 'from-fuchsia-100 to-purple-100')
                              .replace('from-blue-500 to-sky-500', 'from-blue-100 to-sky-100')
                              .replace('from-emerald-500 to-teal-500', 'from-emerald-100 to-teal-100')
                              .replace('from-amber-500 to-orange-500', 'from-amber-100 to-orange-100')
                              .replace('from-purple-500 to-indigo-500', 'from-purple-100 to-indigo-100');
                            return (
                              <div 
                                key={idx} 
                                className={`text-xs p-1.5 rounded-lg text-gray-900 border border-pink-200 ${lightColor}`}
                              >
                                {lesson.time.split(' - ')[0]}
                              </div>
                            );
                          })}
                          {dayData.lessons.length > 2 && (
                            <div className="text-xs text-pink-600 font-medium text-center">
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
      <div className={`mt-8 pt-6 border-t border-pink-200 transition-all duration-700 delay-200 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 flex items-center gap-4">
            <span className="font-semibold">Chú thích:</span>
            <div className="flex items-center gap-2">
              <div className="h-3 w-6 rounded bg-gradient-to-r from-pink-500 to-rose-500"></div>
              <span className="text-sm">IELTS</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-6 rounded bg-gradient-to-r from-rose-500 to-pink-600"></div>
              <span className="text-sm">TOEIC</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-6 rounded bg-gradient-to-r from-fuchsia-500 to-purple-500"></div>
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