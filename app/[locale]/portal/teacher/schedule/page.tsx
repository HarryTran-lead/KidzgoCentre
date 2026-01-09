'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CalendarDays, Calendar as CalendarIcon, Clock, MapPin, Users, Eye, Download, ChevronLeft, ChevronRight, Sparkles, BookOpen, Bell } from 'lucide-react';

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

/** Tag nhỏ */
function Pill({ children, color = 'from-pink-500 to-rose-500' }: { children: React.ReactNode; color?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full bg-gradient-to-r ${color} text-white text-xs px-3 py-1.5 font-medium shadow-sm`}>
      {children}
    </span>
  );
}

/** Timeline Item */
function TimelineLesson({ lesson, compact = false }: { lesson: Lesson; compact?: boolean }) {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  
  const [startHour, startMin] = lesson.time.split(' - ')[0].split(':').map(Number);
  const startPosition = ((startHour - 7) * 60 + startMin) * 0.8; // 7am là 0px
  
  return (
    <div 
      className={`absolute rounded-xl shadow-lg transition-all duration-300 ${isHovered ? 'shadow-pink-200 -translate-y-0.5 z-10' : 'shadow-pink-100'} ${lesson.color} p-4 text-white`}
      style={{
        left: '20px',
        top: `${startPosition}px`,
        width: 'calc(100% - 40px)',
        height: `${lesson.duration * 0.8}px`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="h-full flex flex-col justify-between">
        <div>
          <div className="font-bold text-sm">{lesson.course}</div>
          {!compact && (
            <div className="text-xs opacity-90 mt-1">{lesson.time}</div>
          )}
        </div>
        
        {!compact && (
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1">
                <MapPin size={12} />
                <span>{lesson.room}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users size={12} />
                <span>{lesson.students}</span>
              </div>
            </div>
            <button
              onClick={() => router.push(`/${locale}/portal/teacher/schedule/${lesson.id}`)}
              className="text-xs bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg px-2 py-1 transition-colors"
            >
              Chi tiết
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Day Timeline View */
function DayTimeline({ data, hours = 12 }: { data: DaySchedule; hours?: number }) {
  const timeSlots = Array.from({ length: hours }, (_, i) => i + 7); // 7am to 7pm

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
            </div>
          </div>
          <Pill>{data.lessons.length} buổi học</Pill>
        </div>
      </div>

      {/* Timeline Container */}
      <div className="relative p-4 h-[600px] overflow-y-auto">
        {/* Time labels */}
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
        <div className="ml-16 h-full relative">
          {timeSlots.map(hour => (
            <div 
              key={`line-${hour}`} 
              className="absolute left-0 right-0 border-t border-pink-100"
              style={{ top: `${(hour - 7) * 60}px` }}
            />
          ))}
          
          {/* Current time indicator (optional) */}
          <div 
            className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-pink-500 to-rose-500 z-20"
            style={{ top: '360px' }} // Example: 1pm position
          >
            <div className="absolute -left-2 -top-1.5 w-3 h-3 rounded-full bg-rose-500"></div>
          </div>

          {/* Lessons */}
          {data.lessons.map(lesson => (
            <TimelineLesson key={lesson.id} lesson={lesson} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Week Calendar View */
function WeekCalendarView({ weekData }: { weekData: DaySchedule[] }) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const timeSlots = Array.from({ length: 13 }, (_, i) => i + 7); // 7am to 7pm
  
  // Tạo mảng 7 ngày để đảm bảo đủ cột
  const daysOfWeek = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
  const calendarDays = daysOfWeek.map((dow, index) => {
    return weekData.find(day => day.dow === dow) || {
      date: '',
      dow,
      day: 0,
      month: '',
      lessons: []
    };
  });

  const getTimePosition = (time: string) => {
    const [startTime] = time.split(' - ');
    const [hour, minute] = startTime.split(':').map(Number);
    return ((hour - 7) * 60 + minute) * 0.8; // 7am = 0px
  };

  const getDuration = (time: string) => {
    const [start, end] = time.split(' - ');
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    const startTotal = startHour * 60 + startMin;
    const endTotal = endHour * 60 + endMin;
    return (endTotal - startTotal) * 0.8;
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
            <button className="p-2 rounded-lg border border-pink-200 hover:bg-pink-50">
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm text-gray-700 px-3">Tuần này</span>
            <button className="p-2 rounded-lg border border-pink-200 hover:bg-pink-50">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="relative overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Time column + Days grid */}
          <div className="flex">
            {/* Time labels column */}
            <div className="w-20 flex-shrink-0 border-r border-pink-200 bg-pink-50/50">
              <div className="h-16 border-b border-pink-200"></div>
              {timeSlots.map(hour => (
                <div
                  key={hour}
                  className="h-[60px] border-b border-pink-100 flex items-start justify-end pr-2 pt-1"
                >
                  <span className="text-xs text-gray-600">{hour}:00</span>
                </div>
              ))}
            </div>

            {/* Days columns */}
            <div className="flex-1 grid grid-cols-7">
              {calendarDays.map((day, dayIndex) => (
                <div key={dayIndex} className="border-r border-pink-200 last:border-r-0">
                  {/* Day header */}
                  <div className={`h-16 border-b border-pink-200 p-2 text-center ${day.lessons.length > 0 ? 'bg-white' : 'bg-pink-50/30'}`}>
                    <div className="text-xs text-gray-500 mb-1">{day.dow}</div>
                    <div className={`text-lg font-bold ${day.lessons.length > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                      {day.day || ''}
                    </div>
                    {day.lessons.length > 0 && (
                      <div className="text-xs text-pink-600 mt-1">{day.lessons.length} buổi</div>
                    )}
                  </div>

                  {/* Time slots */}
                  <div className="relative" style={{ height: `${timeSlots.length * 60}px` }}>
                    {/* Grid lines */}
                    {timeSlots.map(hour => (
                      <div
                        key={hour}
                        className="absolute left-0 right-0 border-t border-pink-100"
                        style={{ top: `${(hour - 7) * 60}px` }}
                      />
                    ))}

                    {/* Lessons */}
                    {day.lessons.map((lesson, lessonIndex) => {
                      const top = getTimePosition(lesson.time);
                      const height = getDuration(lesson.time);
                      
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => router.push(`/${locale}/portal/teacher/schedule/${lesson.id}`)}
                          className={`absolute left-1 right-1 rounded-lg ${lesson.color} p-2 text-white shadow-md hover:shadow-lg transition-all z-10 text-left`}
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                            minHeight: '40px'
                          }}
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
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Day Card View (List) */
function DayCard({ data }: { data: DaySchedule }) {
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
          <div key={lesson.id} className="group">
            <div className={`rounded-xl ${lesson.color} p-4 text-white transition-all duration-300 hover:shadow-lg`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{lesson.course}</div>
                  <div className="text-sm opacity-90 mt-1">{lesson.time}</div>
                </div>
                <button
                  onClick={() => router.push(`/${locale}/portal/teacher/schedule/${lesson.id}`)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5"
                >
                  Chi tiết
                </button>
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
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  const [tab, setTab] = useState<'week' | 'month' | 'timeline'>('timeline');
  const [currentWeek, setCurrentWeek] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(WEEK_DATA[0].date);

  const current = useMemo(() => new Date(WEEK_DATA[0].date), []);
  const monthTitle = useMemo(
    () => `Tháng ${current.getMonth() + 1}/${current.getFullYear()}`,
    [current]
  );

  // Lấy tuần hiện tại với offset
  const displayedWeek = useMemo(() => {
    return WEEK_DATA;
  }, [currentWeek]);

  const selectedDay = useMemo(() => {
    return WEEK_DATA.find(day => day.date === selectedDate) || WEEK_DATA[0];
  }, [selectedDate]);

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
                className={`px-4 py-2.5 text-sm rounded-lg flex items-center gap-2 transition-all ${tab === 'timeline' ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md' : 'text-gray-700 hover:bg-pink-50'}`}
                onClick={() => setTab('timeline')}
              >
                <Sparkles size={16} />
                Timeline
              </button>
              <button
                className={`px-4 py-2.5 text-sm rounded-lg flex items-center gap-2 transition-all ${tab === 'week' ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md' : 'text-gray-700 hover:bg-pink-50'}`}
                onClick={() => setTab('week')}
              >
                <CalendarDays size={16} />
                Tuần
              </button>
              <button
                className={`px-4 py-2.5 text-sm rounded-lg flex items-center gap-2 transition-all ${tab === 'month' ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md' : 'text-gray-700 hover:bg-pink-50'}`}
                onClick={() => setTab('month')}
              >
                <CalendarIcon size={16} />
                Tháng
              </button>
            </div>

            <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2.5 text-sm font-medium hover:shadow-lg transition-all">
              <Download size={16} /> Xuất lịch
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Tổng buổi học</div>
                <div className="text-2xl font-bold mt-2 text-gray-900">{totalLessons}</div>
              </div>
              <div className="p-3 bg-pink-100 rounded-xl">
                <BookOpen size={24} className="text-pink-600" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Tổng học viên</div>
                <div className="text-2xl font-bold mt-2 text-gray-900">{totalStudents}</div>
              </div>
              <div className="p-3 bg-rose-100 rounded-xl">
                <Users size={24} className="text-rose-600" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Tuần này</div>
                <div className="text-2xl font-bold mt-2 text-gray-900">6/10</div>
              </div>
              <div className="p-3 bg-fuchsia-100 rounded-xl">
                <Bell size={24} className="text-fuchsia-600" />
              </div>
            </div>
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
                  <button className="p-2 rounded-lg border border-pink-200 hover:bg-pink-50">
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-sm text-gray-700">Tuần 1, Tháng 10</span>
                  <button className="p-2 rounded-lg border border-pink-200 hover:bg-pink-50">
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
              
              <div className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
                {WEEK_DATA.map(day => (
                  <button
                    key={day.date}
                    onClick={() => setSelectedDate(day.date)}
                    className={`w-full rounded-xl p-3 transition-all duration-300 ${selectedDate === day.date ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg' : 'bg-white border border-pink-200 hover:border-pink-300'}`}
                  >
                    <div className="text-center">
                      <div className={`text-sm ${selectedDate === day.date ? 'text-white/90' : 'text-gray-500'}`}>{day.dow}</div>
                      <div className={`text-2xl font-bold mt-1 ${selectedDate === day.date ? 'text-white' : 'text-gray-900'}`}>{day.day}</div>
                      <div className={`text-xs mt-1 ${selectedDate === day.date ? 'text-white/80' : 'text-gray-600'}`}>{day.month}</div>
                      {day.lessons.length > 0 && (
                        <div className={`text-xs mt-2 px-2 py-1 rounded-full ${selectedDate === day.date ? 'bg-white/20' : 'bg-pink-100 text-pink-600'}`}>
                          {day.lessons.length} buổi
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Day Timeline */}
            <DayTimeline data={selectedDay} />
          </div>
        )}

        {tab === 'week' && (
          <WeekCalendarView weekData={displayedWeek} />
        )}

        {tab === 'month' && (
          <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 overflow-hidden">
            <div className="bg-gradient-to-r from-pink-500/5 to-rose-500/5 border-b border-pink-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 font-bold text-gray-900">
                  <CalendarIcon size={20} className="text-pink-500" /> {monthTitle}
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg border border-pink-200 hover:bg-pink-50">
                    <ChevronLeft size={18} />
                  </button>
                  <button className="p-2 rounded-lg border border-pink-200 hover:bg-pink-50">
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
                  const hasLessons = WEEK_DATA.some(d => d.day === day);
                  const dayData = WEEK_DATA.find(d => d.day === day);
                  
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        if (dayData) {
                          setSelectedDate(dayData.date);
                          setTab('timeline');
                        }
                      }}
                      className={`h-32 rounded-xl p-3 text-left transition-all duration-300 ${dayData ? 'bg-white border border-pink-200 hover:border-pink-300 hover:shadow-lg hover:shadow-pink-100/30' : 'bg-pink-50/50 border border-dashed border-pink-100'} ${selectedDate === dayData?.date ? 'ring-2 ring-pink-500 ring-offset-2' : ''}`}
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
                          {dayData.lessons.slice(0, 2).map((lesson, idx) => (
                            <div 
                              key={idx} 
                              className={`text-xs p-1.5 rounded-lg text-white ${lesson.color}`}
                            >
                              {lesson.time.split(' - ')[0]}
                            </div>
                          ))}
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