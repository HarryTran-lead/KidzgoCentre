'use client';

import { useMemo, useState } from 'react';
import {
  Download, Plus, Search, DollarSign, TriangleAlert,
  CheckCircle2, Eye, Send, CalendarClock
} from 'lucide-react';

/* ---------- utils ---------- */
const formatVND = (n: number) =>
  n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }).replace('₫', 'VND');

type FeeStatus = 'PAID' | 'PARTIAL' | 'OVERDUE' | 'PENDING';
type Row = {
  id: string;
  student: string;
  course: string;
  total: number;
  paid: number;
  due: string;         // dd/mm/yyyy
  status: FeeStatus;
};

/* ---------- demo data ---------- */
const ROWS: Row[] = [
  { id: 'HV001', student: 'Nguyễn Văn An',  course: 'English B1',     total: 2500000, paid: 2500000, due: '15/01/2025', status: 'PAID'    },
  { id: 'HV002', student: 'Trần Thị Bình',  course: 'IELTS Prep',     total: 3200000, paid: 1600000, due: '15/10/2025', status: 'PARTIAL' },
  { id: 'HV003', student: 'Lê Văn Cường',   course: 'TOEIC Advanced', total: 2800000, paid: 1400000, due: '30/09/2025', status: 'OVERDUE' },
  { id: 'HV004', student: 'Phạm Thị Dung',  course: 'English A2',     total: 2200000, paid: 2200000, due: '01/03/2025', status: 'PAID'    },
  { id: 'HV005', student: 'Hoàng Văn Em',   course: 'Business Eng.',  total: 3500000, paid: 0,       due: '20/10/2025', status: 'PENDING' },
];

/* ---------- small stat card ---------- */
function StatCard(props: {
  icon: React.ReactNode; label: string; value: string; hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-50">{props.icon}</div>
        <div className="min-w-0">
          <div className="text-sm text-zinc-500">{props.label}</div>
          <div className="text-2xl font-extrabold text-zinc-900">{props.value}</div>
          {props.hint ? <div className="text-xs text-emerald-600">{props.hint}</div> : null}
        </div>
      </div>
    </div>
  );
}

/* ---------- status pill ---------- */
function StatusBadge({ status }: { status: FeeStatus }) {
  const map: Record<FeeStatus, { text: string; cls: string }> = {
    PAID:    { text: 'Đã thanh toán',      cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    PARTIAL: { text: 'Thanh toán một phần', cls: 'bg-sky-50 text-sky-700 ring-sky-200' },
    OVERDUE: { text: 'Quá hạn',             cls: 'bg-rose-50 text-rose-700 ring-rose-200' },
    PENDING: { text: 'Chờ thanh toán',      cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  };
  const s = map[status];
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${s.cls}`}>{s.text}</span>
  );
}

/* ---------- action icon button ---------- */
function IconBtn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <button
      title={title}
      className="grid h-9 w-9 place-items-center rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50"
    >
      {children}
    </button>
  );
}

/* ---------- table row ---------- */
function FeeRow({ r }: { r: Row }) {
  const remain = r.total - r.paid;
  return (
    <div className="grid grid-cols-[1.1fr,1fr,1fr,1fr,1fr,1fr,120px] items-center gap-4 border-b border-zinc-100 py-4 text-zinc-900">
      <div>
        <div className="font-medium">{r.student}</div>
        <div className="text-xs text-zinc-500">{r.id}</div>
      </div>
      <div className="text-sm">{r.course}</div>
      <div className="font-semibold">{formatVND(r.total)}</div>
      <div className="font-semibold text-emerald-600">{formatVND(r.paid)}</div>
      <div className={`font-semibold ${remain > 0 ? 'text-rose-600' : 'text-zinc-500'}`}>
        {formatVND(remain)}
      </div>
      <div className="text-sm text-zinc-700">{r.due}</div>
      <div className="flex items-center justify-end gap-2">
        <StatusBadge status={r.status} />
        <IconBtn title="Xem chi tiết"><Eye size={18} /></IconBtn>
        <IconBtn title="Gửi nhắc nhở"><Send size={18} /></IconBtn>
      </div>
    </div>
  );
}

/* ---------- page ---------- */
export default function FeesPage() {
  const [tab, setTab] = useState<'ALL' | 'OVERDUE' | 'HISTORY'>('ALL');

  const filtered = useMemo(() => {
    if (tab === 'OVERDUE') return ROWS.filter(r => r.status === 'OVERDUE');
    return ROWS;
  }, [tab]);

  const revenueThisMonth = 7700000; // demo
  const debt = ROWS.reduce((s, r) => s + (r.total - r.paid), 0);
  const overdueCount = ROWS.filter(r => r.status === 'OVERDUE').length;
  const paidCount = ROWS.filter(r => r.status === 'PAID').length;

  return (
    <div className="space-y-6 text-zinc-900">
      {/* actions */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Học phí & Công nợ</h1>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50">
            <Download size={16} /> Xuất báo cáo
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl bg-pink-600 px-3 py-2 text-sm font-semibold text-white hover:bg-pink-700">
            <Plus size={16} /> Ghi nhận thanh toán
          </button>
        </div>
      </div>

      {/* stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          icon={<DollarSign className="text-emerald-600" size={20} />}
          label="Doanh thu tháng"
          value={formatVND(revenueThisMonth)}
          hint="+12% MoM"
        />
        <StatCard
          icon={<TriangleAlert className="text-amber-600" size={20} />}
          label="Công nợ"
          value={formatVND(debt)}
        />
        <StatCard
          icon={<CalendarClock className="text-rose-600" size={20} />}
          label="Hồ sơ quá hạn"
          value={`${overdueCount}`}
        />
        <StatCard
          icon={<CheckCircle2 className="text-sky-600" size={20} />}
          label="Đã thanh toán"
          value={`${paidCount}`}
        />
      </div>

      {/* tabs + search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-zinc-200 bg-white p-1">
          {[
            { k: 'ALL',      label: 'Tổng quan' },
            { k: 'OVERDUE',  label: 'Quá hạn' },
            { k: 'HISTORY',  label: 'Lịch sử' },
          ].map(t => (
            <button
              key={t.k}
              onClick={() => setTab(t.k as typeof tab)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
                tab === t.k ? 'bg-zinc-900 text-white' : 'text-zinc-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <input
            placeholder="Tìm kiếm học viên..."
            className="h-10 w-72 rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-sm placeholder-zinc-400 focus:outline-none"
          />
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        </div>
      </div>

      {/* table */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <div className="grid grid-cols-[1.1fr,1fr,1fr,1fr,1fr,1fr,120px] gap-4 border-b border-zinc-100 pb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <div>Học viên</div>
          <div>Khóa học</div>
          <div>Tổng học phí</div>
          <div>Đã thanh toán</div>
          <div>Còn lại</div>
          <div>Hạn thanh toán</div>
          <div className="text-right">Trạng thái & Thao tác</div>
        </div>

        {filtered.map((r) => (
          <FeeRow key={r.id} r={r} />
        ))}
      </div>
    </div>
  );
}
