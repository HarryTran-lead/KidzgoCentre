'use client';

import { useMemo } from 'react';
import { ArrowDownRight, ArrowUpRight, CalendarDays, Download, Plus } from 'lucide-react';

type CashRow = {
  id: string;
  type: 'IN' | 'OUT';
  title: string;
  amount: number;
  date: string;
  method: string;
  note: string;
};

const ROWS: CashRow[] = [
  {
    id: 'THU-0920',
    type: 'IN',
    title: 'Thu học phí - IELTS Prep',
    amount: 3200000,
    date: '20/09/2025',
    method: 'PayOS',
    note: 'HV002 - Trần Thị Bình',
  },
  {
    id: 'CHI-0919',
    type: 'OUT',
    title: 'Chi lương giáo viên',
    amount: 18500000,
    date: '19/09/2025',
    method: 'Chuyển khoản',
    note: 'Đợt lương tháng 09',
  },
  {
    id: 'CHI-0918',
    type: 'OUT',
    title: 'Mua giáo cụ',
    amount: 2400000,
    date: '18/09/2025',
    method: 'Tiền mặt',
    note: 'Giáo cụ lớp Starters',
  },
];

const formatVND = (n: number) =>
  n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }).replace('₫', 'VND');

export default function CashbookPage() {
  const rows = useMemo(() => ROWS, []);
  const totalIn = rows.filter((r) => r.type === 'IN').reduce((s, r) => s + r.amount, 0);
  const totalOut = rows.filter((r) => r.type === 'OUT').reduce((s, r) => s + r.amount, 0);
  const balance = totalIn - totalOut;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Sổ quỹ</h1>
          <p className="text-sm text-gray-600">Theo dõi dòng tiền thu chi theo chi nhánh.</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <Download className="h-4 w-4" /> Xuất dữ liệu
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl bg-pink-600 px-3 py-2 text-sm font-semibold text-white hover:bg-pink-700">
            <Plus className="h-4 w-4" /> Ghi thu/chi
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
          <div className="flex items-center gap-2 text-sm text-emerald-700">
            <ArrowUpRight className="h-4 w-4" /> Tổng thu tháng
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-700">{formatVND(totalIn)}</div>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4">
          <div className="flex items-center gap-2 text-sm text-rose-700">
            <ArrowDownRight className="h-4 w-4" /> Tổng chi tháng
          </div>
          <div className="mt-2 text-2xl font-extrabold text-rose-700">{formatVND(totalOut)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <CalendarDays className="h-4 w-4" /> Số dư hiện tại
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">{formatVND(balance)}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4 text-sm font-semibold text-slate-700">
          Nhật ký thu chi gần nhất
        </div>
        <div className="divide-y">
          {rows.map((row) => (
            <div key={row.id} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs text-slate-400">{row.id}</div>
                <div className="text-base font-semibold text-slate-900">{row.title}</div>
                <div className="mt-1 text-sm text-slate-500">{row.note}</div>
              </div>
              <div className="text-sm text-slate-500">{row.method}</div>
              <div className="text-sm text-slate-500">{row.date}</div>
              <div
                className={`text-base font-semibold ${
                  row.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {row.type === 'IN' ? '+' : '-'} {formatVND(row.amount)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}