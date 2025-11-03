'use client';

import { Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

type ClassItem = { title: string; time: string; room: string };
type DayItem = { dow: string; date: number; classes: ClassItem[] };

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

export default function Page() {
  const todayIndex = 0; // giả định hôm nay là Thứ 2 (ô đầu)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between">
        <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
          <ChevronLeft size={16} /> Tuần trước
        </button>

        <div className="text-xl font-bold text-gray-900">Tuần này</div>

        <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
          Tuần sau <ChevronRight size={16} />
        </button>
      </div>

      {/* Grid days */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-7 gap-4">
          {WEEK.map((day, idx) => {
            const isToday = idx === todayIndex;

            return (
              <div
                key={day.dow}
                className={`rounded-2xl p-3 border ${isToday ? 'border-slate-900' : 'border-slate-200'}`}
              >
                {/* Day header */}
                <div className="text-center">
                  <div className="text-sm font-semibold text-gray-900">{day.dow}</div>
                  <div className="mt-1 flex items-center justify-center">
                    <div
                      className={`h-8 w-8 rounded-full grid place-items-center text-sm font-semibold ${
                        isToday ? 'bg-slate-900 text-white' : 'bg-slate-100 text-gray-900'
                      }`}
                    >
                      {day.date}
                    </div>
                  </div>
                </div>

                {/* Classes */}
                <div className="mt-3 space-y-2">
                  {day.classes.length === 0 ? (
                    <div className="text-center text-sm text-slate-500 py-6">Không có lớp</div>
                  ) : (
                    day.classes.map((c, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-gray-900"
                      >
                        <div className="font-medium text-gray-900">{c.title}</div>
                        <div className="mt-1 flex items-center gap-3 text-sm text-slate-700">
                          <span className="inline-flex items-center gap-1">
                            <Clock size={16} /> {c.time}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={16} /> {c.room}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 rounded-2xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <label className="inline-flex items-center gap-2">
              <span className="h-4 w-4 rounded text-gray-black border border-slate-400 inline-block" />
              Lớp học thường
            </label>
            <label className="inline-flex items-center gap-2">
              <span className="h-4 w-4 rounded-full bg-slate-900 inline-block" />
              Ngày hôm nay
            </label>
            <label className="inline-flex items-center gap-2">
              <span className="h-4 w-4 rounded border border-dashed border-slate-400 inline-block" />
              Click để xem chi tiết
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
