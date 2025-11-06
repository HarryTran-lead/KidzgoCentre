"use client";

import { useState } from "react";
import { CalendarRange, PieChart, TrendingUp, BellRing } from "lucide-react";

type MonthlySummary = {
  month: string;
  totalSlots: number;
  attended: number;
  excused: number;
  makeup: number;
  homeworkRate: number;
};

type DailyRecord = {
  date: string;
  className: string;
  status: "PRESENT" | "ABSENT" | "MAKEUP";
  note?: string;
};

const MONTHS: MonthlySummary[] = [
  { month: "12/2024", totalSlots: 12, attended: 10, excused: 1, makeup: 1, homeworkRate: 92 },
  { month: "11/2024", totalSlots: 12, attended: 11, excused: 0, makeup: 1, homeworkRate: 88 },
  { month: "10/2024", totalSlots: 12, attended: 9, excused: 1, makeup: 2, homeworkRate: 85 },
];

const DAILY: Record<string, DailyRecord[]> = {
  "12/2024": [
    { date: "01/12", className: "A1 - Buổi 1", status: "PRESENT" },
    { date: "03/12", className: "A1 - Buổi 2", status: "ABSENT", note: "Ốm, xin phép trước 24h" },
    { date: "05/12", className: "A1 - Buổi 3", status: "MAKEUP", note: "Bù tại lớp A1B ngày 06/12" },
    { date: "08/12", className: "A1 - Buổi 4", status: "PRESENT" },
    { date: "10/12", className: "A1 - Buổi 5", status: "PRESENT" },
  ],
};

function ratio(attended: number, total: number) {
  if (total === 0) return 0;
  return Math.round((attended / total) * 100);
}

function StatusPill({ status }: { status: DailyRecord["status"] }) {
  const map = {
    PRESENT: { text: "Có mặt", cls: "bg-emerald-50 text-emerald-700" },
    ABSENT: { text: "Vắng", cls: "bg-rose-50 text-rose-700" },
    MAKEUP: { text: "Buổi bù", cls: "bg-sky-50 text-sky-700" },
  } as const;
  const { text, cls } = map[status];
  return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cls}`}>{text}</span>;
}

export default function AttendancePage() {
  const [month, setMonth] = useState(MONTHS[0].month);
  const summary = MONTHS.find((m) => m.month === month)!;
  const records = DAILY[month] || [];
  const attendPercent = ratio(summary.attended + summary.makeup, summary.totalSlots);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Điểm danh & Buổi bù</h1>
          <p className="text-sm text-slate-600">
            Theo dõi số buổi đã học, buổi vắng có phép và lịch bù của bạn.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
          <CalendarRange size={18} className="text-slate-500" />
          Tháng {month}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-wrap gap-3">
        {MONTHS.map((m) => (
          <button
            key={m.month}
            onClick={() => setMonth(m.month)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              m.month === month ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            {m.month}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-sm text-slate-500">Số buổi đã học</div>
          <div className="mt-2 text-3xl font-extrabold text-gray-900">{summary.attended}</div>
          <div className="text-xs text-slate-400">Trong tổng {summary.totalSlots} buổi</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-sm text-slate-500">Buổi vắng có phép</div>
          <div className="mt-2 text-3xl font-extrabold text-amber-600">{summary.excused}</div>
          <div className="text-xs text-slate-400">Sẽ được sắp xếp bù</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-sm text-slate-500">Buổi bù đã hoàn thành</div>
          <div className="mt-2 text-3xl font-extrabold text-sky-600">{summary.makeup}</div>
          <div className="text-xs text-slate-400">Từ các lớp tương đương</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-sm text-slate-500">Tỷ lệ chuyên cần</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600">{attendPercent}%</span>
            <TrendingUp size={18} className="text-emerald-600" />
          </div>
          <div className="text-xs text-slate-400">Bao gồm cả buổi bù</div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Chi tiết buổi học</h2>
            <p className="text-xs text-slate-500">Nhấn vào từng dòng để xem thêm ghi chú</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <PieChart size={16} className="text-slate-500" />
            Hoàn thành bài tập: {summary.homeworkRate}%
          </div>
        </div>

        <div className="mt-4 divide-y divide-slate-100">
          {records.map((r) => (
            <div key={r.date} className="py-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-medium text-gray-900">{r.className}</div>
                <div className="text-sm text-slate-500">Ngày {r.date}</div>
                {r.note ? <div className="text-xs text-slate-400">{r.note}</div> : null}
              </div>
              <StatusPill status={r.status} />
            </div>
          ))}
          {records.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">Chưa có dữ liệu cho tháng này</div>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="font-semibold text-emerald-900">Nhắc nhở qua Zalo</div>
          <p className="text-sm text-emerald-800">
            Nếu bạn chưa điểm danh, hệ thống sẽ nhắn phụ huynh qua Zalo sau 10 phút bắt đầu buổi học.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
          <BellRing size={16} /> Cập nhật số Zalo
        </button>
      </div>
    </div>
  );
}