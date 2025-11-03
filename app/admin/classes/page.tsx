"use client";

import { useMemo, useState } from "react";
import {
  Plus, Search, MapPin, Users, Clock, Eye, Pencil
} from "lucide-react";
import clsx from "clsx";

/* ----------------------------- MOCKED DATA ----------------------------- */
type ClassRow = {
  id: string;
  name: string;
  sub: string;
  teacher: string;
  room: string;
  current: number;
  capacity: number;
  schedule: string;
  status: "Đang học" | "Sắp khai giảng" | "Đã kết thúc";
};

const CLASSES: ClassRow[] = [
  {
    id: "LH001",
    name: "English B1-01",
    sub: "General English B1",
    teacher: "Ms. Sarah Johnson",
    room: "P101",
    current: 25,
    capacity: 30,
    schedule: "Thứ 2, 4, 6 - 08:00-10:00",
    status: "Đang học",
  },
  {
    id: "LH002",
    name: "IELTS Prep-02",
    sub: "IELTS Preparation",
    teacher: "Mr. John Smith",
    room: "P102",
    current: 20,
    capacity: 25,
    schedule: "Thứ 3, 5, 7 - 14:00-16:00",
    status: "Đang học",
  },
  {
    id: "LH003",
    name: "Business English",
    sub: "Business English",
    teacher: "Ms. Emily Davis",
    room: "P201",
    current: 18,
    capacity: 20,
    schedule: "Thứ 2, 4 - 19:00-21:00",
    status: "Đang học",
  },
  {
    id: "LH004",
    name: "TOEIC Advanced",
    sub: "TOEIC Preparation",
    teacher: "Mr. David Wilson",
    room: "P103",
    current: 22,
    capacity: 25,
    schedule: "Thứ 7, CN - 08:00-10:00",
    status: "Đang học",
  },
  {
    id: "LH005",
    name: "English A2-03",
    sub: "General English A2",
    teacher: "Ms. Lisa Anderson",
    room: "P104",
    current: 0,
    capacity: 25,
    schedule: "Thứ 2, 4, 6 - 10:30-12:30",
    status: "Sắp khai giảng",
  },
  {
    id: "LH006",
    name: "English B2-01",
    sub: "General English B2",
    teacher: "Ms. Sarah Johnson",
    room: "P105",
    current: 28,
    capacity: 30,
    schedule: "Thứ 3, 5 - 18:30-20:30",
    status: "Đã kết thúc",
  },
];

/* ----------------------------- UI HELPERS ------------------------------ */
function StatusBadge({ value }: { value: ClassRow["status"] }) {
  const map: Record<ClassRow["status"], string> = {
    "Đang học": "bg-emerald-100 text-emerald-700",
    "Sắp khai giảng": "bg-amber-100 text-amber-700",
    "Đã kết thúc": "bg-sky-100 text-sky-700",
  };
  return (
    <span className={clsx("px-2.5 py-1 rounded-full text-xs font-semibold", map[value])}>
      {value}
    </span>
  );
}

function occupancyTint(curr: number, cap: number) {
  if (curr === 0) return "text-emerald-600";
  const r = curr / cap;
  if (r >= 0.9) return "text-rose-600";
  if (r >= 0.75) return "text-amber-600";
  return "text-emerald-600";
}

/* -------------------------------- PAGE --------------------------------- */
export default function Page() {
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return CLASSES;
    return CLASSES.filter((c) =>
      [c.id, c.name, c.sub, c.teacher, c.room].some((x) =>
        x.toLowerCase().includes(kw)
      )
    );
  }, [q]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Quản lý lớp học</h1>
          <p className="text-sm text-gray-600">Quản lý thông tin lớp học và học viên</p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-pink-500 hover:bg-pink-600 text-white font-semibold shadow-sm"
          type="button"
        >
          <Plus size={18} /> Tạo lớp học mới
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center justify-end">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm kiếm lớp học..."
            className="w-full pl-10 pr-3 py-2.5 rounded-xl border bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-200"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-gray-700">
            <tr>
              <th className="px-4 py-3 text-left">Mã lớp</th>
              <th className="px-4 py-3 text-left">Tên lớp</th>
              <th className="px-4 py-3 text-left">Giáo viên</th>
              <th className="px-4 py-3 text-left">Phòng học</th>
              <th className="px-4 py-3 text-left">Sĩ số</th>
              <th className="px-4 py-3 text-left">Lịch học</th>
              <th className="px-4 py-3 text-left">Trạng thái</th>
              <th className="px-4 py-3 text-left">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-gray-900">{c.id}</td>

                <td className="px-4 py-3">
                  <div className="font-semibold text-gray-900">{c.name}</div>
                  <div className="text-xs text-gray-500">{c.sub}</div>
                </td>

                <td className="px-4 py-3">
                  <div className="inline-flex items-center gap-2 text-gray-900">
                    <span className="inline-block w-5 h-5 rounded-full bg-slate-100 grid place-items-center">
                      <Users size={13} />
                    </span>
                    {c.teacher}
                  </div>
                </td>

                <td className="px-4 py-3">
                  <div className="inline-flex items-center gap-2 text-gray-900">
                    <MapPin size={16} />
                    {c.room}
                  </div>
                </td>

                <td className="px-4 py-3">
                  <div className="inline-flex items-center gap-2">
                    <Users size={16} className="text-gray-700" />
                    <span className={clsx("font-semibold", occupancyTint(c.current, c.capacity))}>
                      {c.current}
                    </span>
                    <span className="text-gray-500">/ {c.capacity}</span>
                  </div>
                </td>

                <td className="px-4 py-3">
                  <div className="inline-flex items-center gap-2 text-gray-900">
                    <Clock size={16} />
                    {c.schedule}
                  </div>
                </td>

                <td className="px-4 py-3">
                  <StatusBadge value={c.status} />
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg border hover:bg-slate-100" title="Xem">
                      <Eye size={16} />
                    </button>
                    <button className="p-2 rounded-lg border hover:bg-slate-100" title="Sửa">
                      <Pencil size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                  Không tìm thấy lớp học phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
