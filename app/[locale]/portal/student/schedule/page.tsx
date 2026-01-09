'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Clock, MapPin, Users, BookOpen, Star, Rocket } from 'lucide-react';

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
};

const SCHEDULE_DATA: { [key: string]: ClassEvent[] } = {
  '2024-12-02': [{ id: '1', title: 'PRE-IELTS 11', time: '18:30', timeEnd: '20:00', room: 'Phòng 101', type: 'class', color: 'blue', teacher: 'Cô Hương' }],
  '2024-12-03': [{ id: '2', title: 'IELTS Speaking Club', time: '20:15', timeEnd: '21:15', room: 'Hội trường', type: 'event', color: 'orange', teacher: 'Mr. John' }],
  '2024-12-04': [{ id: '3', title: 'TOEFL Junior A', time: '17:30', timeEnd: '19:00', room: 'Phòng 202', type: 'class', color: 'blue', teacher: 'Cô Linh' }],
  '2024-12-05': [{ id: '4', title: 'IELTS Foundation - A1', time: '19:00', timeEnd: '21:00', room: 'Phòng 301', type: 'class', color: 'blue', teacher: 'Thầy Nam' }],
  '2024-12-06': [
    { id: '5', title: 'TOEIC Intermediate', time: '16:00', timeEnd: '18:00', room: 'Phòng 205', type: 'class', color: 'pink', teacher: 'Cô Mai' },
    { id: '6', title: 'Kids English F1', time: '18:30', timeEnd: '20:00', room: 'Phòng 102', type: 'class', color: 'blue', teacher: 'Ms. Sarah' }
  ],
  '2024-12-07': [{ id: '7', title: 'Họp phụ huynh tháng 12', time: '09:00', timeEnd: '11:00', room: 'Hội trường', type: 'event', color: 'yellow' }],
  '2024-12-08': [{ id: '8', title: 'Mock Test IELTS', time: '08:00', timeEnd: '11:30', room: 'Phòng 201', type: 'event', color: 'yellow' }]
};

const WEEK_DAYS = [
  { short: 'Th 2', date: 2 }, { short: 'Th 3', date: 3 }, { short: 'Th 4', date: 4 },
  { short: 'Th 5', date: 5 }, { short: 'Th 6', date: 6 }, { short: 'Th 7', date: 7 }, { short: 'CN', date: 8 }
];

function ClassDetailModal({ event, onClose }: { event: ClassEvent; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-indigo-950/70 backdrop-blur-xl p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="relative w-full max-w-md rounded-[2.5rem] border-2 border-white/20 bg-indigo-900/90 shadow-[0_0_50px_rgba(0,0,0,0.6)] overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`px-8 py-10 ${
          event.color === 'blue' ? 'bg-cyan-500/30' : event.color === 'orange' ? 'bg-orange-500/30' :
          event.color === 'pink' ? 'bg-pink-500/30' : 'bg-yellow-500/30'
        }`}>
          <button onClick={onClose} className="absolute right-6 top-6 rounded-full bg-white/10 p-2 text-white hover:bg-white/30 transition-all">
            <X size={24} />
          </button>
          <h3 className="text-3xl font-black text-white drop-shadow-md">{event.title}</h3>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-indigo-950/50 border border-white/20 px-5 py-1.5 text-xs font-black text-cyan-300 tracking-widest">
            CHIẾN DỊCH: {event.type.toUpperCase()}
          </div>
        </div>
        <div className="p-8 space-y-6 text-white">
          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
            <Clock className="text-cyan-400" size={28} />
            <div><p className="text-[10px] font-bold text-white/40 uppercase">Thời gian</p><p className="text-lg font-black">{event.time} - {event.timeEnd}</p></div>
          </div>
          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
            <MapPin className="text-pink-400" size={28} />
            <div><p className="text-[10px] font-bold text-white/40 uppercase">Tọa độ trạm</p><p className="text-lg font-black">{event.room}</p></div>
          </div>
        </div>
        <div className="p-8 pt-0">
          <button onClick={onClose} className="w-full py-5 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 font-black text-white text-lg shadow-[0_10px_20px_rgba(34,211,238,0.3)] hover:scale-[1.02] active:scale-95 transition-all uppercase">
            Bắt đầu khám phá
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [selectedEvent, setSelectedEvent] = useState<ClassEvent | null>(null);

  return (
    <div className="h-full bg-transparent p-2 lg:p-3 relative font-sans selection:bg-cyan-500/30 overflow-hidden">
      <div className="max-w-[1600px] mx-auto space-y-3 relative z-10 h-full flex flex-col">
        
        {/* Header Tabs */}
        <div className="flex flex-wrap gap-2 shrink-0">
          {['all', 'class', 'makeup', 'event'].map((id) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as TabType)}
              className={`px-5 py-2 rounded-xl text-xs font-black transition-all border-2 tracking-widest ${
                activeTab === id
                  ? 'bg-white border-white text-indigo-900'
                  : 'bg-indigo-950/40 border-white/10 text-white hover:border-white/30 backdrop-blur-md'
              }`}
            >
              {id === 'all' ? 'TẤT CẢ' : id === 'class' ? 'LỚP HỌC' : id === 'makeup' ? 'BUỔI BÙ' : 'SỰ KIỆN'}
            </button>
          ))}
        </div>

        {/* Navigation Tuần */}
        <div className="rounded-2xl border-2 border-white/10 bg-indigo-950/40 backdrop-blur-xl p-3 shadow-2xl flex items-center justify-between shrink-0">
          <div className="flex gap-2">
            <button className="p-2 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-cyan-500/30 transition-all"><ChevronLeft size={20} /></button>
            <button className="p-2 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-cyan-500/30 transition-all"><ChevronRight size={20} /></button>
          </div>
          <div className="text-lg font-black text-white tracking-tighter flex items-center gap-3">
            <Rocket className="text-cyan-400 animate-bounce" size={20} />
            TUẦN 2/12/2024 – 8/12/2024
          </div>
          <button className="px-5 py-2 rounded-xl bg-white/10 border border-white/20 text-white font-black uppercase text-[10px] tracking-widest hover:bg-white/20 transition-all">Tuần này</button>
        </div>

        {/* BẢNG LỊCH HỌC VIỀN NEON RỰC RỠ */}
        <div className="rounded-2xl border-2 border-cyan-400/60 bg-indigo-950/50 backdrop-blur-2xl overflow-hidden relative flex-1 min-h-0">
          <div className="overflow-auto h-full p-3">
            <table className="w-full border-separate border-spacing-2">
              <thead>
                <tr>
                  <th className="p-3 text-center text-[10px] font-black text-cyan-300 uppercase tracking-[0.2em] bg-white/10 rounded-xl border border-white/10 shadow-inner">Trạm / Ngày</th>
                  {WEEK_DAYS.map((day, idx) => (
                    <th key={idx} className="p-4 min-w-[140px] text-center bg-white/10 rounded-xl border border-white/20 backdrop-blur-md">
                      <div className="text-cyan-200/60 text-xs font-black uppercase mb-1 tracking-tighter">{day.short}</div>
                      <div className="text-3xl font-black text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]">{day.date}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {['Sáng', 'Chiều', 'Tối'].map((slot) => (
                  <tr key={slot}>
                    <td className="p-4 text-center bg-white/5 rounded-xl border border-white/5 backdrop-blur-sm">
                      <div className="text-2xl mb-1">{slot === 'Sáng' ? '☀️' : slot === 'Chiều' ? '🌤️' : '🌙'}</div>
                      <div className="text-xs font-black text-white uppercase tracking-widest opacity-80">{slot}</div>
                    </td>
                    {WEEK_DAYS.map((day, dIdx) => {
                      const dateKey = `2024-12-0${day.date}`;
                      const events = (SCHEDULE_DATA[dateKey] || []).filter(e => activeTab === 'all' || e.type === activeTab)
                        .filter(e => {
                          const h = parseInt(e.time.split(':')[0]);
                          if (slot === 'Sáng') return h < 12;
                          if (slot === 'Chiều') return h >= 12 && h < 18;
                          return h >= 18;
                        });

                      return (
                        <td key={dIdx} className="align-top min-h-[120px]">
                          {events.length > 0 ? (
                            <div className="space-y-2.5">
                              {events.map(event => (
                                <button
                                  key={event.id}
                                  onClick={() => setSelectedEvent(event)}
                                  className={`w-full text-left rounded-xl border-2 p-4 transition-all hover:scale-[1.04] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] group relative overflow-hidden ${
                                    event.color === 'blue' ? 'border-cyan-400 bg-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.2)]' :
                                    event.color === 'orange' ? 'border-orange-400 bg-orange-500/20 shadow-[0_0_15px_rgba(251,146,60,0.2)]' :
                                    event.color === 'pink' ? 'border-pink-400 bg-pink-500/20 shadow-[0_0_15px_rgba(244,114,182,0.2)]' : 
                                    'border-yellow-400 bg-yellow-500/20 shadow-[0_0_15px_rgba(250,204,21,0.2)]'
                                  }`}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-40"></div>
                                  <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-1.5 font-black text-[10px] text-white/90 uppercase tracking-tighter">
                                      <span className={`h-2 w-2 rounded-full animate-pulse shadow-[0_0_10px_currentColor] ${
                                        event.color === 'blue' ? 'bg-cyan-400 text-cyan-400' :
                                        event.color === 'orange' ? 'bg-orange-400 text-orange-400' : 'bg-pink-400 text-pink-400'
                                      }`} />
                                      {event.time} - {event.timeEnd}
                                    </div>
                                    <div className="text-sm font-black text-white leading-tight mb-1.5 drop-shadow-sm group-hover:text-cyan-200 transition-colors uppercase tracking-tight">{event.title}</div>
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-cyan-100/60 uppercase"><MapPin size={11} /> {event.room}</div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="h-28 flex items-center justify-center opacity-10 group-hover:opacity-30 transition-opacity">
                              <Star size={20} className="text-white animate-spin-slow" />
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

      {/* Linh vật Mascot Bunny 3D */}
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
        .custom-scrollbar::-webkit-scrollbar { width: 10px; height: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
            background: linear-gradient(to bottom, #22d3ee, #3b82f6); 
            border-radius: 20px; 
            border: 3px solid rgba(15, 23, 42, 0.8);
        }
        .animate-spin-slow { animation: spin 8s linear infinite; }
        .animate-bounce-slow { animation: bounce 4s ease-in-out infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
      `}</style>
    </div>
  );
}