'use client';

import { useMemo } from 'react';
import { MapPin, Phone, Users, PencilLine, Plus } from 'lucide-react';

const BRANCHES = [
  {
    code: 'CN01',
    name: 'KidzGo Nguyễn Văn Trỗi',
    address: '120 Nguyễn Văn Trỗi, Q. Phú Nhuận',
    phone: '0909 111 222',
    students: 240,
    classes: 14,
    status: 'Hoạt động',
  },
  {
    code: 'CN02',
    name: 'KidzGo Phạm Văn Đồng',
    address: '15 Phạm Văn Đồng, Q. Gò Vấp',
    phone: '0909 333 444',
    students: 190,
    classes: 10,
    status: 'Hoạt động',
  },
  {
    code: 'CN03',
    name: 'KidzGo Thủ Đức',
    address: '46 Võ Văn Ngân, TP. Thủ Đức',
    phone: '0909 555 666',
    students: 120,
    classes: 6,
    status: 'Chuẩn bị mở',
  },
];

export default function BranchesPage() {
  const data = useMemo(() => BRANCHES, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Quản lý chi nhánh</h1>
          <p className="text-sm text-gray-600">Cập nhật thông tin vận hành và quy mô học viên.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700">
          <Plus className="h-4 w-4" /> Thêm chi nhánh
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {data.map((branch) => (
          <div key={branch.code} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-500">{branch.code}</div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                {branch.status}
              </span>
            </div>
            <div className="mt-3 text-lg font-semibold text-slate-900">{branch.name}</div>
            <div className="mt-2 flex items-start gap-2 text-sm text-slate-600">
              <MapPin className="mt-0.5 h-4 w-4" />
              <span>{branch.address}</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
              <Phone className="h-4 w-4" /> {branch.phone}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-xs text-slate-400">Học viên</div>
                <div className="text-lg font-semibold text-slate-900">{branch.students}</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-xs text-slate-400">Lớp học</div>
                <div className="text-lg font-semibold text-slate-900">{branch.classes}</div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end">
              <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                <PencilLine className="h-4 w-4" /> Cập nhật
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}