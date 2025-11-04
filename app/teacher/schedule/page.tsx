'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, Calendar as CalendarIcon, Clock, MapPin, Users, Eye, Download } from 'lucide-react';

/** --------- DATA MẪU (có thể thay bằng dữ liệu thật) --------- */
type Lesson = {
  course: string;
  time: string;
  room: string;
  students: number;
};

type DaySchedule = {
  date: string; // yyyy-mm-dd
  dow: string;  // Thứ 2, Thứ 3, ...
  lessons: Lesson[];
};

const WEEK_DATA: DaySchedule[] = [
  {
    date: '2025-10-06',
    dow: 'Thứ 2',
    lessons: [
      { course: 'IELTS Foundation - A1', time: '08:00 - 10:00', room: 'Phòng 301', students: 18 },
    ],
  },
  {
    date: '2025-10-07',
    dow: 'Thứ 3',
    lessons: [
      { course: 'TOEIC Intermediate', time: '14:00 - 16:00', room: 'Phòng 205', students: 15 },
    ],
  },
  {
    date: '2025-10-10',
    dow: 'Thứ 6',
    lessons: [
      { course: 'IELTS Foundation - A1', time: '08:00 - 10:00', room: 'Phòng 301', students: 18 },
      { course: 'Business English', time: '09:00 - 11:00', room: 'Phòng 102', students: 12 },
    ],
  },
  {
    date: '2025-10-11',
    dow: 'Thứ 7',
    lessons: [
      { course: 'Business English', time: '09:00 - 11:00', room: 'Phòng 102', students: 12 },
    ],
  },
];

/** Format yyyy-mm-dd -> dd/mm/yyyy */
function formatVNDate(d: string) {
  const [y, m, day] = d.split('-').map(Number);
  return `${String(day).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

/** Tính lịch tháng (hiển thị grid 7 cột) */
function buildMonthGrid(year: number, monthIndex0: number) {
  const first = new Date(year, monthIndex0, 1);
  const last = new Date(year, monthIndex0 + 1, 0);
  const startWeekday = (first.getDay() + 6) % 7; // đổi về Mon=0..Sun=6
  const daysInMonth = last.getDate();
  const cells: Array<{ day?: number; iso?: string }> = [];

  // đệm trước
  for (let i = 0; i < startWeekday; i++) cells.push({});

  for (let d = 1; d <= daysInMonth; d++) {
    const iso = new Date(year, monthIndex0, d).toISOString().slice(0, 10);
    cells.push({ day: d, iso });
  }
  // đệm sau để đủ bội số 7
  while (cells.length % 7 !== 0) cells.push({});

  return cells;
}

/** Tag nhỏ */
function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-900 text-white text-xs px-2 py-1">
      {children}
    </span>
  );
}

/** Một dòng buổi học */
function LessonRow({ lesson }: { lesson: Lesson }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <div className="font-medium text-gray-900">{lesson.course}</div>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
          <span className="inline-flex items-center gap-1"><Clock size={16}/> {lesson.time}</span>
          <span className="inline-flex items-center gap-1"><MapPin size={16}/> {lesson.room}</span>
          <span className="inline-flex items-center gap-1"><Users size={16}/> {lesson.students} học viên</span>
        </div>
      </div>
      <button className="mt-2 md:mt-0 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-slate-50">
        <Eye size={16}/> Chi tiết
      </button>
    </div>
  );
}

/** Một ngày trong tuần */
function DayBlock({ data }: { data: DaySchedule }) {
  return (
    <div className="rounded-2xl border bg-white">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <CalendarDays className="text-slate-500" size={18}/>
          <div className="font-semibold text-gray-900">
            {data.dow} - {formatVNDate(data.date)}
          </div>
        </div>
        <Pill>{data.lessons.length} buổi học</Pill>
      </div>

      <div className="space-y-3 p-4">
        {data.lessons.map((ls, i) => (<LessonRow key={i} lesson={ls}/>))}
      </div>
    </div>
  );
}

export default function Page() {
  const [tab, setTab] = useState<'week' | 'month'>('week');

  // Tháng đang xét (lấy từ dữ liệu tuần mẫu)
  const current = useMemo(() => new Date(WEEK_DATA[0].date), []);
  const monthTitle = useMemo(
    () => `Tháng ${current.getMonth() + 1}/${current.getFullYear()}`,
    [current]
  );
  const monthCells = useMemo(
    () => buildMonthGrid(current.getFullYear(), current.getMonth()),
    [current]
  );
  const lessonsByIso = useMemo(() => {
    const map = new Map<string, Lesson[]>();
    WEEK_DATA.forEach(d =>
      d.lessons.forEach(ls => {
        const arr = map.get(d.date) ?? [];
        arr.push(ls);
        map.set(d.date, arr);
      })
    );
    return map;
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Lịch giảng dạy</h1>
          <p className="text-sm text-slate-500">Quản lý lịch dạy của bạn theo tuần hoặc tháng</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Segmented control */}
          <div className="inline-flex rounded-xl border p-1">
            <button
              className={`px-4 py-2 text-sm rounded-lg ${tab === 'week' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'}`}
              onClick={() => setTab('week')}
            >
              Tuần
            </button>
            <button
              className={`px-4 py-2 text-sm rounded-lg ${tab === 'month' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'}`}
              onClick={() => setTab('month')}
            >
              Tháng
            </button>
          </div>

          <button className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-slate-50">
            <Download size={16}/> Xuất lịch
          </button>
        </div>
      </div>

      {/* CONTENT */}
      {tab === 'week' ? (
        <div className="space-y-6">
          {WEEK_DATA.map((d) => (<DayBlock key={d.date} data={d}/>))}
        </div>
      ) : (
        <div className="rounded-2xl border bg-white">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="inline-flex items-center gap-2 font-semibold text-gray-900">
              <CalendarIcon size={18}/> {monthTitle}
            </div>
            <span className="text-xs text-slate-500">Click vào ngày để xem buổi học</span>
          </div>

          {/* Calendar Grid */}
          <div className="p-4">
            <div className="grid grid-cols-7 text-xs text-slate-500 mb-2">
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
                <div key={d} className="px-2 py-1">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {monthCells.map((c, idx) => {
                const has = c.iso && lessonsByIso.get(c.iso);
                return (
                  <button
                    key={idx}
                    disabled={!c.day}
                    className={`h-24 rounded-xl border text-left p-2 transition
                      ${c.day ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/60 border-dashed text-transparent cursor-default'}
                    `}
                    onClick={() => {
                      if (!c.iso) return;
                      const el = document.getElementById(`day-${c.iso}`);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      setTab('week'); // nhảy về tuần để xem chi tiết
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{c.day ?? ''}</span>
                      {has && <span className="h-2 w-2 rounded-full bg-slate-900" />}
                    </div>
                    {has && (
                      <div className="mt-2 text-xs text-slate-600 line-clamp-3 space-y-0.5">
                        {lessonsByIso.get(c.iso!)!.slice(0, 2).map((ls, i) => (
                          <div key={i}>• {ls.course}</div>
                        ))}
                        {lessonsByIso.get(c.iso!)!.length > 2 && <div>+ còn nữa…</div>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* anchors cho view tuần (để scroll từ view tháng) */}
      <div className="hidden">
        {WEEK_DATA.map(d => (
          <div id={`day-${d.date}`} key={d.date} />
        ))}
      </div>
    </div>
  );
}
