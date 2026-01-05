'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Clock, MapPin, Users, BookOpen } from 'lucide-react';

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
  students?: number;
  description?: string;
};

// Sample data
const SCHEDULE_DATA: { [key: string]: ClassEvent[] } = {
  '2024-12-02': [
    { id: '1', title: 'PRE-IELTS 11', time: '18:30', timeEnd: '20:00', room: 'Phòng 101', type: 'class', color: 'blue', teacher: 'Cô Hương', students: 15 }
  ],
  '2024-12-03': [
    { id: '2', title: 'IELTS Speaking Club', time: '20:15', timeEnd: '21:15', room: 'Hội trường', type: 'event', color: 'orange', teacher: 'Mr. John', students: 30 }
  ],
  '2024-12-04': [
    { id: '3', title: 'TOEFL Junior A', time: '17:30', timeEnd: '19:00', room: 'Phòng 202', type: 'class', color: 'blue', teacher: 'Cô Linh', students: 12 }
  ],
  '2024-12-05': [
    { id: '4', title: 'IELTS Foundation - A1', time: '19:00', timeEnd: '21:00', room: 'Phòng 301', type: 'class', color: 'blue', teacher: 'Thầy Nam', students: 18 }
  ],
  '2024-12-06': [
    { id: '5', title: 'TOEIC Intermediate', time: '16:00', timeEnd: '18:00', room: 'Phòng 205', type: 'class', color: 'pink', teacher: 'Cô Mai', students: 20 },
    { id: '6', title: 'Kids English F1', time: '18:30', timeEnd: '20:00', room: 'Phòng 102', type: 'class', color: 'blue', teacher: 'Ms. Sarah', students: 10 }
  ],
  '2024-12-07': [
    { id: '7', title: 'Hợp phụ huynh tháng 12', time: '09:00', timeEnd: '11:00', room: 'Hội trường', type: 'event', color: 'yellow', students: 50 }
  ],
  '2024-12-08': [
    { id: '8', title: 'Mock Test IELTS', time: '08:00', timeEnd: '11:30', room: 'Phòng 201', type: 'event', color: 'yellow', teacher: 'Ban giám khảo', students: 25 }
  ]
};

const TABS = [
  { id: 'all' as TabType, label: 'Tất cả' },
  { id: 'class' as TabType, label: 'Lớp học' },
  { id: 'makeup' as TabType, label: 'Buổi bù' },
  { id: 'event' as TabType, label: 'Sự kiện' }
];

const TIME_SLOTS = ['Sáng', 'Chiều', 'Tối'];

const WEEK_DAYS = [
  { short: 'Th 2', full: 'Thứ 2', date: 2 },
  { short: 'Th 3', full: 'Thứ 3', date: 3 },
  { short: 'Th 4', full: 'Thứ 4', date: 4 },
  { short: 'Th 5', full: 'Thứ 5', date: 5 },
  { short: 'Th 6', full: 'Thứ 6', date: 6 },
  { short: 'Th 7', full: 'Thứ 7', date: 7 },
  { short: 'CN', full: 'Chủ nhật', date: 8 }
];

// Modal Component
function ClassDetailModal({ event, onClose }: { event: ClassEvent; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="relative w-full max-w-md rounded-2xl border border-white/20 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`relative px-6 py-5 rounded-t-2xl ${
          event.color === 'blue' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
          event.color === 'orange' ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
          event.color === 'pink' ? 'bg-gradient-to-r from-pink-400 to-pink-500' :
          'bg-gradient-to-r from-yellow-400 to-yellow-500'
        }`}>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full bg-white/20 p-1.5 text-white hover:bg-white/30 transition-colors"
          >
            <X size={18} />
          </button>
          <h3 className="text-xl font-bold text-white pr-8">{event.title}</h3>
          <div className="mt-2 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
            {event.type === 'class' ? 'Lớp học' : event.type === 'makeup' ? 'Buổi bù' : 'Sự kiện'}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <Clock size={20} />
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-gray-500 uppercase">Thời gian</div>
              <div className="mt-1 text-sm font-medium text-gray-900">
                {event.time} - {event.timeEnd}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-purple-50 text-purple-600">
              <MapPin size={20} />
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-gray-500 uppercase">Địa điểm</div>
              <div className="mt-1 text-sm font-medium text-gray-900">{event.room}</div>
            </div>
          </div>

          {event.teacher && (
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-green-50 text-green-600">
                <BookOpen size={20} />
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-gray-500 uppercase">Giáo viên</div>
                <div className="mt-1 text-sm font-medium text-gray-900">{event.teacher}</div>
              </div>
            </div>
          )}

          {event.students && (
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-600">
                <Users size={20} />
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-gray-500 uppercase">Học viên</div>
                <div className="mt-1 text-sm font-medium text-gray-900">{event.students} học viên</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}


export default function Page() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [selectedEvent, setSelectedEvent] = useState<ClassEvent | null>(null);
  const [currentWeek, setCurrentWeek] = useState('2/12/2024 – 8/12/2024');

  const getEventsByDate = (dateKey: string): ClassEvent[] => {
    const events = SCHEDULE_DATA[dateKey] || [];
    if (activeTab === 'all') return events;
    return events.filter(e => e.type === activeTab);
  };

  const getEventsByTimeSlot = (dateKey: string, timeSlot: string): ClassEvent[] => {
    const events = getEventsByDate(dateKey);
    return events.filter(e => {
      const hour = parseInt(e.time.split(':')[0]);
      if (timeSlot === 'Sáng') return hour >= 6 && hour < 12;
      if (timeSlot === 'Chiều') return hour >= 12 && hour < 18;
      return hour >= 18;
    });
  };

  const handlePreviousWeek = () => {
    console.log('Previous week');
  };

  const handleNextWeek = () => {
    console.log('Next week');
  };

  const handleToday = () => {
    console.log('Go to today');
  };

  return (
    <div className="h-full flex flex-col px-4 sm:px-6 lg:px-10 py-4 lg:py-11">
      <div className="flex-1 flex flex-col space-y-4 max-w-[1600px] mx-auto w-full ">
      {/* Header with Tabs */}
      <div className="flex flex-wrap gap-3">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${
              activeTab === tab.id
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Week Navigation */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousWeek}
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 p-2 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNextWeek}
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 p-2 hover:bg-gray-50 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="text-lg font-bold text-gray-900">
            Tuần {currentWeek}
          </div>

          <button
            onClick={handleToday}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
          >
            Tuần này
          </button>
        </div>
      </div>

      {/* Schedule Table - Flex-1 để fill remaining space */}
        <div className="flex-1 rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col bg-white">
        <div className="flex-1 overflow-auto p-4 my-4">
          <table className="w-full border-collapse bg-white">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-3 py-3 text-left text-sm font-semibold text-gray-600 w-24 sticky left-0 bg-gray-50 z-20">
                  Ca / Ngày
                </th>
                {WEEK_DAYS.map((day, idx) => (
                  <th key={idx} className="px-3 py-3 text-center text-sm font-medium text-gray-900 min-w-[130px]">
                    <div className="text-gray-500 text-xs font-normal">{day.short}</div>
                    <div className="mt-1 text-gray-900 font-semibold">{day.date}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map((slot, slotIdx) => (
                <tr key={slot} className={slotIdx !== TIME_SLOTS.length - 1 ? 'border-b border-gray-200' : ''}>
                  <td className="px-3 py-3 text-sm font-medium text-gray-900 align-top bg-gray-50 sticky left-0 z-10">
                    {slot}
                  </td>
                  {WEEK_DAYS.map((day, dayIdx) => {
                    const dateKey = `2024-12-0${day.date}`;
                    const events = getEventsByTimeSlot(dateKey, slot);
                    
                    return (
                      <td key={dayIdx} className="px-2 py-2 align-top">
                        {events.length > 0 ? (
                          <div className="space-y-2">
                            {events.map(event => (
                              <button
                                key={event.id}
                                onClick={() => setSelectedEvent(event)}
                                className={`w-full text-left rounded-xl border p-2.5 transition-all hover:shadow-md hover:-translate-y-0.5 ${
                                  event.color === 'blue' ? 'border-blue-300 bg-blue-50' :
                                  event.color === 'orange' ? 'border-orange-300 bg-orange-50' :
                                  event.color === 'pink' ? 'border-pink-300 bg-pink-50' :
                                  'border-yellow-300 bg-yellow-50'
                                }`}
                              >
                                <div className="flex items-start gap-1.5 mb-1">
                                  <div className={`h-2 w-2 rounded-full mt-1 shrink-0 ${
                                    event.color === 'blue' ? 'bg-blue-500' :
                                    event.color === 'orange' ? 'bg-orange-500' :
                                    event.color === 'pink' ? 'bg-pink-500' :
                                    'bg-yellow-500'
                                  }`} />
                                  <div className="flex-1 min-w-0">
                                    <div className={`text-xs font-bold leading-tight ${
                                      event.color === 'blue' ? 'text-blue-700' :
                                      event.color === 'orange' ? 'text-orange-700' :
                                      event.color === 'pink' ? 'text-pink-700' :
                                      'text-yellow-700'
                                    }`}>
                                      {event.time} - {event.timeEnd}
                                    </div>
                                    <div className={`mt-0.5 text-[11px] font-semibold leading-snug ${
                                      event.color === 'blue' ? 'text-blue-900' :
                                      event.color === 'orange' ? 'text-orange-900' :
                                      event.color === 'pink' ? 'text-pink-900' :
                                      'text-yellow-900'
                                    }`}>
                                      {event.title}
                                    </div>
                                  </div>
                                </div>
                                <div className={`text-[10px] font-medium ${
                                  event.color === 'blue' ? 'text-blue-600' :
                                  event.color === 'orange' ? 'text-orange-600' :
                                  event.color === 'pink' ? 'text-pink-600' :
                                  'text-yellow-600'
                                }`}>
                                  {event.room}
                                </div>
                                {event.type === 'event' && (
                                  <div className={`mt-1 text-[9px] font-semibold ${
                                    event.color === 'blue' ? 'text-blue-500' :
                                    event.color === 'orange' ? 'text-orange-500' :
                                    event.color === 'pink' ? 'text-pink-500' :
                                    'text-yellow-500'
                                  }`}>
                                    {event.type === 'event' ? 'Hội trường' : ''}
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 italic text-center py-3">Trống</div>
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

      {/* Modal */}
      {selectedEvent && (
        <ClassDetailModal 
          event={selectedEvent} 
          onClose={() => setSelectedEvent(null)} 
        />
      )}
      </div>
    </div>
  );
}
