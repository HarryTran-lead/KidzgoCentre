'use client';

import { useMemo } from 'react';
import { Banknote, CheckCircle2, Clock3, Download } from 'lucide-react';

type PayrollRow = {
  id: string;
  name: string;
  role: string;
  unit: string;
  total: number;
  status: 'PAID' | 'PENDING';
};

const ROWS: PayrollRow[] = [
  {
    id: 'PAY-0925-01',
    name: 'Ms. Sarah Johnson',
    role: 'Giáo viên chính',
    unit: '24 buổi',
    total: 14400000,
    status: 'PENDING',
  },
  {
    id: 'PAY-0925-02',
    name: 'Mr. John Smith',
    role: 'Giáo viên chính',
    unit: '26 buổi',
    total: 15600000,
    status: 'PAID',
  },
  {
    id: 'PAY-0925-03',
    name: 'Nguyễn Thu Hà',
    role: 'Staff vận hành',
    unit: 'Full-time',
    total: 9500000,
    status: 'PENDING',
  },
];

const formatVND = (n: number) =>
  n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }).replace('₫', 'VND');

export default function PayrollPage() {
  const data = useMemo(() => ROWS, []);
  const total = data.reduce((s, r) => s + r.total, 0);
  const pending = data.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Bảng lương</h1>
          <p className="text-sm text-gray-600">Tổng hợp lương giáo viên và nhân sự theo kỳ.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
          <Download className="h-4 w-4" /> Xuất bảng lương
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Banknote className="h-4 w-4" /> Tổng chi kỳ này
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">{formatVND(total)}</div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
          <div className="flex items-center gap-2 text-sm text-amber-700">
            <Clock3 className="h-4 w-4" /> Chờ thanh toán
          </div>
          <div className="mt-2 text-2xl font-extrabold text-amber-700">{pending} hồ sơ</div>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
          <div className="flex items-center gap-2 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" /> Đã chi trả
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-700">{data.length - pending} hồ sơ</div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="text-sm font-semibold text-slate-700">Danh sách chi trả</div>
        <div className="mt-4 space-y-3">
          {data.map((row) => (
            <div key={row.id} className="flex flex-col gap-3 rounded-2xl border border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs text-slate-400">{row.id}</div>
                <div className="text-base font-semibold text-slate-900">{row.name}</div>
                <div className="text-sm text-slate-500">{row.role} • {row.unit}</div>
              </div>
              <div className="text-base font-semibold text-slate-900">{formatVND(row.total)}</div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  row.status === 'PAID'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                {row.status === 'PAID' ? 'Đã chi trả' : 'Chờ duyệt'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}