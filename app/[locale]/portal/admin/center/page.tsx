'use client';

import { Building2, MapPin, Users, BookOpen, ArrowUpRight } from 'lucide-react';

const BRANCHES = [
  {
    id: 'CN01',
    name: 'KidzGo Nguyễn Văn Trỗi',
    address: '120 Nguyễn Văn Trỗi, Q. Phú Nhuận',
    students: 240,
    classes: 14,
    teachers: 9,
    status: 'Đang hoạt động',
  },
  {
    id: 'CN02',
    name: 'KidzGo Phạm Văn Đồng',
    address: '15 Phạm Văn Đồng, Q. Gò Vấp',
    students: 190,
    classes: 10,
    teachers: 7,
    status: 'Đang hoạt động',
  },
  {
    id: 'CN03',
    name: 'KidzGo Thủ Đức',
    address: '46 Võ Văn Ngân, TP. Thủ Đức',
    students: 120,
    classes: 6,
    teachers: 5,
    status: 'Chuẩn bị khai trương',
  },
];

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-slate-700">
          {icon}
        </div>
        <div>
          <div className="text-sm text-slate-500">{label}</div>
          <div className="text-2xl font-extrabold text-slate-900">{value}</div>
          {hint ? <div className="text-xs text-emerald-600">{hint}</div> : null}
        </div>
      </div>
    </div>
  );
}

export default function CenterOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Tổng quan chi nhánh</h1>
        <p className="text-sm text-gray-600">
          Theo dõi hiệu suất và quy mô học viên theo từng chi nhánh.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={<Building2 className="h-5 w-5" />}
          label="Số chi nhánh"
          value="3"
          hint="+1 chi nhánh trong quý tới"
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Tổng học viên"
          value="550"
          hint="Tăng 8% so với tháng trước"
        />
        <StatCard
          icon={<BookOpen className="h-5 w-5" />}
          label="Lớp đang hoạt động"
          value="30"
          hint="18 lớp Cambridge, 12 lớp giao tiếp"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-slate-900">Danh sách chi nhánh</div>
            <div className="text-sm text-slate-500">Ưu tiên theo dõi chỉ số học viên và giáo viên.</div>
          </div>
          <button className="inline-flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700">
            <ArrowUpRight className="h-4 w-4" /> Xem báo cáo chi nhánh
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {BRANCHES.map((branch) => (
            <div
              key={branch.id}
              className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="space-y-1">
                <div className="text-sm text-slate-500">{branch.id}</div>
                <div className="text-base font-semibold text-slate-900">{branch.name}</div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="h-4 w-4" /> {branch.address}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-xs uppercase text-slate-400">Học viên</div>
                  <div className="text-lg font-semibold text-slate-900">{branch.students}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-slate-400">Lớp học</div>
                  <div className="text-lg font-semibold text-slate-900">{branch.classes}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-slate-400">Giáo viên</div>
                  <div className="text-lg font-semibold text-slate-900">{branch.teachers}</div>
                </div>
              </div>
              <div className="text-sm font-medium text-emerald-600">{branch.status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}