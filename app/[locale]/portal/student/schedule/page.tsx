'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, Clock, MapPin, Users, BookOpen, Star, Rocket, Calendar, Filter, Sparkles } from 'lucide-react';
import { FilterTabs, TabOption } from '@/components/portal/student/FilterTabs';

type TabType = 'all' | 'class' | 'makeup' | 'event';

type ClassEvent = {
  id: string;
  title: string;
  time: string;
  timeEnd?: string;
  room: string;
  type: 'class' | 'makeup' | 'event';
  color: 'blue' | 'orange' | 'pink' | 'yellow';
  teacher?: string;
  description?: string;
};

const SCHEDULE_DATA: { [key: string]: ClassEvent[] } = {
  '2024-12-02': [{ id: '1', title: 'PRE-IELTS 11', time: '18:30', timeEnd: '20:00', room: 'Phòng 101', type: 'class', color: 'blue', teacher: 'Cô Hương', description: 'Luyện kỹ năng Nghe & Nói' }],
  '2024-12-03': [{ id: '2', title: 'IELTS Speaking Club', time: '20:15', timeEnd: '21:15', room: 'Hội trường', type: 'event', color: 'orange', teacher: 'Mr. John', description: 'Thảo luận chủ đề Technology' }],
  '2024-12-04': [{ id: '3', title: 'TOEFL Junior A', time: '17:30', timeEnd: '19:00', room: 'Phòng 202', type: 'class', color: 'blue', teacher: 'Cô Linh', description: 'Grammar Focus: Present Perfect' }],
  '2024-12-05': [{ id: '4', title: 'IELTS Foundation - A1', time: '19:00', timeEnd: '21:00', room: 'Phòng 301', type: 'class', color: 'blue', teacher: 'Thầy Nam', description: 'Writing Task 1 - Line Graph' }],
  '2024-12-06': [
    { id: '5', title: 'TOEIC Intermediate', time: '16:00', timeEnd: '18:00', room: 'Phòng 205', type: 'class', color: 'pink', teacher: 'Cô Mai', description: 'Listening Part 3 & 4' },
    { id: '6', title: 'Kids English F1', time: '18:30', timeEnd: '20:00', room: 'Phòng 102', type: 'class', color: 'blue', teacher: 'Ms. Sarah', description: 'Colors & Animals Vocabulary' }
  ],
  '2024-12-07': [{ id: '7', title: 'Họp phụ huynh tháng 12', time: '09:00', timeEnd: '11:00', room: 'Hội trường', type: 'event', color: 'yellow', description: 'Tổng kết học kỳ 1' }],
  '2024-12-08': [{ id: '8', title: 'Mock Test IELTS', time: '08:00', timeEnd: '11:30', room: 'Phòng 201', type: 'event', color: 'yellow', description: 'Full 4 kỹ năng - Có chữa bài' }]
};

const WEEK_DAYS = [
  { short: 'Thứ 2', full: 'Thứ Hai', date: 2 },
  { short: 'Thứ 3', full: 'Thứ Ba', date: 3 },
  { short: 'Thứ 4', full: 'Thứ Tư', date: 4 },
  { short: 'Thứ 5', full: 'Thứ Năm', date: 5 },
  { short: 'Thứ 6', full: 'Thứ Sáu', date: 6 },
  { short: 'Thứ 7', full: 'Thứ Bảy', date: 7 },
  { short: 'Chủ Nhật', full: 'Chủ Nhật', date: 8 }
];

const TIME_SLOTS = [
  { name: 'Buổi sáng', icon: '🌅', hours: [6, 7, 8, 9, 10, 11], range: '06:00 - 11:59' },
  { name: 'Buổi chiều', icon: '☀️', hours: [12, 13, 14, 15, 16, 17], range: '12:00 - 17:59' },
  { name: 'Buổi tối', icon: '🌙', hours: [18, 19, 20, 21, 22, 23], range: '18:00 - 23:59' }
];

function ClassDetailModal({ event, onClose }: { event: ClassEvent; onClose: () => void }) {
  const getGradient = () => {
    switch (event.color) {
      case 'blue': return 'from-cyan-500 to-blue-600';
      case 'orange': return 'from-orange-500 to-red-600';
      case 'pink': return 'from-pink-500 to-rose-600';
      default: return 'from-yellow-500 to-amber-600';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="relative w-full max-w-md rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-purple-500/30 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div className={`relative px-6 py-8 bg-gradient-to-r ${getGradient()} opacity-90`}>
          <button 
            onClick={onClose} 
            className="absolute right-4 top-4 rounded-full bg-white/20 backdrop-blur-sm p-2 text-white hover:bg-white/30 transition-all hover:scale-110"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              {event.type === 'class' ? <BookOpen size={20} /> : <Sparkles size={20} />}
            </div>
            <span className="text-white/80 text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">
              {event.type === 'class' ? 'Lớp học' : event.type === 'event' ? 'Sự kiện' : 'Buổi bù'}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white leading-tight">{event.title}</h3>
          {event.teacher && (
            <p className="text-white/70 text-sm mt-2 flex items-center gap-1">
              <Users size={14} /> {event.teacher}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
            <Clock size={20} className="text-purple-400" />
            <div>
              <p className="text-xs text-white/40 uppercase font-bold">Thời gian</p>
              <p className="text-white font-semibold">{event.time} - {event.timeEnd}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
            <MapPin size={20} className="text-pink-400" />
            <div>
              <p className="text-xs text-white/40 uppercase font-bold">Địa điểm</p>
              <p className="text-white font-semibold">{event.room}</p>
            </div>
          </div>

          {event.description && (
            <div className="bg-purple-500/10 rounded-xl p-3 border border-purple-500/20">
              <p className="text-xs text-purple-300 uppercase font-bold mb-1">Mô tả</p>
              <p className="text-white/80 text-sm">{event.description}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 pt-0">
          <button 
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 font-bold text-white shadow-lg hover:shadow-purple-500/30 transition-all hover:scale-[1.02] active:scale-95"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SchedulePage() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [selectedEvent, setSelectedEvent] = useState<ClassEvent | null>(null);
  const [currentWeek, setCurrentWeek] = useState({ start: '2/12/2024', end: '8/12/2024' });

  const scheduleTabs: TabOption[] = [
    { id: 'all', label: 'Tất cả' },
    { id: 'class', label: 'Lớp học' },
    { id: 'makeup', label: 'Buổi bù' },
    { id: 'event', label: 'Sự kiện' },
  ];

  const getEventColorClass = (color: string, type: 'bg' | 'border' | 'shadow' | 'text') => {
    const colors = {
      blue: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/40', shadow: 'shadow-cyan-500/20', text: 'text-cyan-400' },
      orange: { bg: 'bg-orange-500/20', border: 'border-orange-500/40', shadow: 'shadow-orange-500/20', text: 'text-orange-400' },
      pink: { bg: 'bg-pink-500/20', border: 'border-pink-500/40', shadow: 'shadow-pink-500/20', text: 'text-pink-400' },
      yellow: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/40', shadow: 'shadow-yellow-500/20', text: 'text-yellow-400' }
    };
    return colors[color as keyof typeof colors]?.[type] || colors.blue[type];
  };

  return (
    <div className="h-full bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 p-4 lg:p-6 relative font-sans overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 -right-40 w-80 h-80 bg-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="max-w-[1600px] mx-auto space-y-4 relative z-10 h-full flex flex-col">
        
        {/* Header */}
        <div className="shrink-0">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400">
            Lịch học
          </h1>
          <p className="text-purple-300/80 text-lg font-medium mt-1">Quản lý thời gian biểu của bạn</p>
        </div>

        {/* Filter Tabs */}
        <FilterTabs
          tabs={scheduleTabs}
          activeTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as TabType)}
          variant="outline"
          size="md"
          className="shrink-0"
        />

        {/* Week Navigation */}
        <div className="rounded-2xl border border-purple-500/30 bg-slate-900/50 backdrop-blur-xl p-3 shadow-xl flex items-center justify-between shrink-0">
          <div className="flex gap-2">
            <button className="p-2 rounded-xl border border-purple-500/30 bg-slate-800/50 text-purple-300 hover:bg-purple-500/30 hover:text-white transition-all hover:scale-105">
              <ChevronLeft size={20} />
            </button>
            <button className="p-2 rounded-xl border border-purple-500/30 bg-slate-800/50 text-purple-300 hover:bg-purple-500/30 hover:text-white transition-all hover:scale-105">
              <ChevronRight size={20} />
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-purple-400" />
            <span className="text-white font-bold tracking-tight">
              {currentWeek.start} – {currentWeek.end}
            </span>
          </div>
          
          <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-purple-500/30 transition-all hover:scale-105">
            Tuần này
          </button>
        </div>

        {/* Schedule Table */}
        <div className="rounded-2xl border border-purple-500/30 bg-slate-900/40 backdrop-blur-xl overflow-hidden relative flex-1 min-h-0">
          <div className="overflow-auto h-full custom-scrollbar">
            <table className="w-full border-separate border-spacing-2">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="p-3 text-center text-xs font-bold text-purple-300 uppercase tracking-wider bg-slate-900/80 backdrop-blur-sm rounded-xl border border-purple-500/20">
                    <Filter size={14} className="inline mr-1" /> Buổi / Ngày
                  </th>
                  {WEEK_DAYS.map((day, idx) => (
                    <th key={idx} className="p-3 min-w-[140px] text-center bg-gradient-to-br from-purple-900/50 to-pink-900/30 rounded-xl border border-purple-500/30 backdrop-blur-sm">
                      <div className="text-purple-300 text-xs font-bold uppercase mb-1">{day.short}</div>
                      <div className="text-2xl font-bold text-white">{day.date}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((slot, slotIdx) => (
                  <tr key={slotIdx}>
                    <td className="p-3 text-center bg-purple-900/20 rounded-xl border border-purple-500/20">
                      <div className="text-2xl mb-1">{slot.icon}</div>
                      <div className="text-xs font-bold text-white uppercase">{slot.name}</div>
                      <div className="text-[10px] text-purple-300/60 mt-0.5">{slot.range}</div>
                    </td>
                    {WEEK_DAYS.map((day, dIdx) => {
                      const dateKey = `2024-12-0${day.date}`;
                      const events = (SCHEDULE_DATA[dateKey] || [])
                        .filter(e => activeTab === 'all' || e.type === activeTab)
                        .filter(e => {
                          const hour = parseInt(e.time.split(':')[0]);
                          return slot.hours.includes(hour);
                        });

                      return (
                        <td key={dIdx} className="align-top p-1">
                          {events.length > 0 ? (
                            <div className="space-y-2">
                              {events.map(event => (
                                <button
                                  key={event.id}
                                  onClick={() => setSelectedEvent(event)}
                                  className={`w-full text-left rounded-xl border p-3 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group relative overflow-hidden ${getEventColorClass(event.color, 'bg')} ${getEventColorClass(event.color, 'border')}`}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                  <div className="relative z-10">
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                      <Clock size={10} className={getEventColorClass(event.color, 'text')} />
                                      <span className={`text-[10px] font-bold ${getEventColorClass(event.color, 'text')}`}>
                                        {event.time} - {event.timeEnd}
                                      </span>
                                    </div>
                                    <div className="text-sm font-bold text-white leading-tight mb-1 group-hover:text-purple-200 transition-colors line-clamp-2">
                                      {event.title}
                                    </div>
                                    <div className="flex items-center gap-1 mt-1">
                                      <MapPin size={10} className="text-white/50" />
                                      <span className="text-[10px] text-white/60 font-medium">{event.room}</span>
                                    </div>
                                    {event.teacher && (
                                      <div className="flex items-center gap-1 mt-0.5">
                                        <Users size={10} className="text-white/50" />
                                        <span className="text-[10px] text-white/60">{event.teacher}</span>
                                      </div>
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="h-24 flex flex-col items-center justify-center opacity-30 group-hover:opacity-50 transition-opacity">
                              <Star size={16} className="text-purple-400 animate-pulse" />
                              <span className="text-[10px] text-white/40 mt-1">Trống</span>
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

      {/* Floating Rocket */}
      {/* Icon Phi thuyền bay lơ lửng thay cho Bunny */}
      <div className="fixed bottom-6 right-12 pointer-events-none z-50 hidden xl:block animate-bounce-slow">
        <div className="relative group pointer-events-auto cursor-pointer">
          <div className="absolute -top-16 -left-24 bg-white/90 backdrop-blur text-indigo-900 px-5 py-3 rounded-[1.5rem] font-black text-sm shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 border-2 border-cyan-400">
            Sẵn sàng phóng chưa? 🚀
          </div>
          {/* Đường dẫn được đổi thành /image/RocketIcon.png 
         (Giả định file nằm trong: public/image/RocketIcon.png)
      */}
          <img
            src="/image/RocketIcon.png"
            alt="KidzGo Rocket"
            className="w-48 drop-shadow-[0_20px_40px_rgba(34,211,238,0.5)] transition-transform group-hover:scale-110"
          />
        </div>
      </div>

      {selectedEvent && <ClassDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(147, 51, 234, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #a855f7, #ec489a);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #c084fc, #f472b6);
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}