'use client';

import React, { useMemo, useState } from 'react';
import {
  Clock,
  DollarSign,
  TrendingUp,
  Download,
  ChevronDown,
} from 'lucide-react';

/* ---------- helpers ---------- */
function vnd(n: number) {
  return n.toLocaleString('vi-VN') + ' đ';
}
function cx(...cls: (string | false | undefined)[]) {
  return cls.filter(Boolean).join(' ');
}

/* ---------- tiny stat card ---------- */
function StatCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-slate-50 grid place-items-center">{icon}</div>
      <div>
        <div className="text-xs text-slate-500">{title}</div>
        <div className="text-xl font-extrabold text-gray-900">{value}</div>
      </div>
    </div>
  );
}

/* ---------- page ---------- */
export default function Page() {
  // Dữ liệu mẫu khớp ảnh chụp màn hình của bạn
  const months = [
    { label: 'T6/2025', hours: 68, income: 20400000, paid: true },
    { label: 'T5/2025', hours: 70, income: 21000000, paid: true },
    { label: 'T4/2025', hours: 60, income: 18000000, paid: true },
    { label: 'T3/2025', hours: 72, income: 21600000, paid: true },
    { label: 'T2/2025', hours: 68, income: 20400000, paid: true },
    { label: 'T1/2025', hours: 64, income: 19200000, paid: true },
  ];

  const [tab, setTab] = useState<'overview' | 'detail'>('overview');
  const [year] = useState(2025);

  const thisMonth = months[0]; // T6/2025
  const avgRate = useMemo(() => Math.round(thisMonth.income / thisMonth.hours), [thisMonth]);

  const maxH = Math.max(...months.map((m) => m.hours));

  const exportCSV = () => {
    const header = ['Tháng', 'Công giờ', 'Thu nhập (đ)', 'Trạng thái'].join(',');
    const rows = months.map((m) =>
      [m.label, m.hours, m.income, m.paid ? 'Đã thanh toán' : 'Chưa thanh toán'].join(','),
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cong-gio-thu-nhap-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Công giờ & Thu nhập</h1>
          <p className="text-slate-500 text-sm">
            Theo dõi công giờ và thu nhập giảng dạy
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            disabled
          >
            Năm {year} <ChevronDown size={16} className="text-slate-400" />
          </button>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white px-3 py-2 text-sm hover:opacity-90"
          >
            <Download size={16} /> Xuất báo cáo
          </button>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <StatCard
          icon={<Clock size={18} className="text-slate-900" />}
          title="Công giờ tháng này"
          value={`${thisMonth.hours} giờ`}
        />
        <StatCard
          icon={<DollarSign size={18} className="text-emerald-600" />}
          title="Thu nhập tháng này"
          value={vnd(thisMonth.income)}
        />
        <StatCard
          icon={<TrendingUp size={18} className="text-pink-600" />}
          title="Đơn giá trung bình"
          value={`${vnd(avgRate)}/h`}
        />
      </div>

      {/* Tabs */}
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="px-4 pt-4">
          <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1 text-sm">
            <button
              onClick={() => setTab('overview')}
              className={cx(
                'px-4 py-1.5 rounded-full',
                tab === 'overview' && 'bg-white text-gray-900 shadow-sm',
                tab !== 'overview' && 'text-slate-600',
              )}
            >
              Tổng quan
            </button>
            <button
              onClick={() => setTab('detail')}
              className={cx(
                'px-4 py-1.5 rounded-full',
                tab === 'detail' && 'bg-white text-gray-900 shadow-sm',
                tab !== 'detail' && 'text-slate-600',
              )}
            >
              Chi tiết
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {tab === 'overview' ? (
            <>
              {/* Bar chart */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Biểu đồ công giờ 6 tháng gần nhất
                </h3>
                <div className="h-56 grid grid-cols-6 gap-4 items-end">
                  {months
                    .slice() // copy
                    .reverse() // như ảnh: T1 -> T6 bên phải
                    .map((m) => {
                      const h = Math.max(12, Math.round((m.hours / maxH) * 100));
                      return (
                        <div key={m.label} className="flex flex-col items-center gap-2">
                          <div className="w-full bg-slate-100 rounded-lg h-48 overflow-hidden flex items-end">
                            <div
                              className="w-full bg-slate-900 rounded-t-lg"
                              style={{ height: `${h}%` }}
                              title={`${m.hours} giờ`}
                            />
                          </div>
                          <div className="text-xs text-slate-500">{m.label.replace('/2025', '')}</div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Summary table */}
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Tổng hợp theo tháng</h3>
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-sm">
                    <thead className="text-left bg-slate-50">
                      <tr className="text-slate-600">
                        <th className="px-4 py-3 font-medium">Tháng</th>
                        <th className="px-4 py-3 font-medium">Công giờ</th>
                        <th className="px-4 py-3 font-medium">Thu nhập</th>
                        <th className="px-4 py-3 font-medium">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {months.map((m) => (
                        <tr key={m.label} className="border-t">
                          <td className="px-4 py-3 text-gray-900">{m.label}</td>
                          <td className="px-4 py-3">{m.hours} giờ</td>
                          <td className="px-4 py-3">{vnd(m.income)}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center rounded-full bg-slate-900 text-white text-xs px-3 py-1">
                              Đã thanh toán
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            /* Tab "Chi tiết": ví dụ chia theo lớp trong tháng hiện tại */
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Chi tiết tháng {thisMonth.label}</h3>
              <div className="rounded-xl border border-slate-200 overflow-x-auto">
                <table className="w-full text-sm bg-white">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Lớp</th>
                      <th className="px-4 py-3 text-left font-medium">Buổi</th>
                      <th className="px-4 py-3 text-left font-medium">Giờ</th>
                      <th className="px-4 py-3 text-left font-medium">Đơn giá</th>
                      <th className="px-4 py-3 text-left font-medium">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { cls: 'IELTS Foundation - A1', sessions: 8, hours: 16, rate: 300000 },
                      { cls: 'TOEIC Intermediate', sessions: 6, hours: 12, rate: 300000 },
                      { cls: 'Business English', sessions: 10, hours: 20, rate: 300000 },
                      { cls: 'Khác', sessions: 10, hours: 20, rate: 300000 },
                    ].map((r) => (
                      <tr key={r.cls} className="border-t">
                        <td className="px-4 py-3 text-gray-900">{r.cls}</td>
                        <td className="px-4 py-3">{r.sessions}</td>
                        <td className="px-4 py-3">{r.hours}</td>
                        <td className="px-4 py-3">{vnd(r.rate)}/h</td>
                        <td className="px-4 py-3">{vnd(r.rate * r.hours)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-sm text-slate-600">
                Tổng cộng: <b className="text-gray-900">{thisMonth.hours}</b> giờ •{' '}
                <b className="text-gray-900">{vnd(thisMonth.income)}</b>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
