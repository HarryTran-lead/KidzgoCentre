"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  BookOpen,
  GraduationCap,
  Users,
  DollarSign,
  Eye,
  Pencil,
  Clock,
} from "lucide-react";

/* -------------------------- helpers -------------------------- */
function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

/* Tag nhỏ hiển thị trình độ (A1, A2, B1,...) */
function LevelBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    A1: "bg-blue-100 text-blue-700",
    A2: "bg-emerald-100 text-emerald-700",
    B1: "bg-amber-100 text-amber-700",
    B2: "bg-violet-100 text-violet-700",
    C1: "bg-rose-100 text-rose-700",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", map[level] || "bg-slate-100 text-slate-700")}>
      {level}
    </span>
  );
}

/* Trạng thái khoá học */
function StatusBadge({ value }: { value: "Đang hoạt động" | "Tạm dừng" | "Đã kết thúc" }) {
  const map: Record<string, string> = {
    "Đang hoạt động": "bg-emerald-100 text-emerald-700",
    "Tạm dừng": "bg-amber-100 text-amber-700",
    "Đã kết thúc": "bg-sky-100 text-sky-700",
  };
  return (
    <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", map[value])}>
      {value}
    </span>
  );
}

/* -------------------------- mock data ------------------------ */
type CourseRow = {
  id: string;
  name: string;
  desc: string;
  level: "A1" | "A2" | "B1" | "B2" | "C1";
  duration: string;
  fee: string;
  classes: string; // "2 lớp"
  students: string; // "45 học viên"
  status: "Đang hoạt động" | "Tạm dừng" | "Đã kết thúc";
};

const COURSES: CourseRow[] = [
  {
    id: "KH001",
    name: "General English A1",
    desc: "Khóa học tiếng Anh cơ bản dành cho người mới bắt đầu",
    level: "A1",
    duration: "12 tuần (72h)",
    fee: "2.000.000 VND",
    classes: "2 lớp",
    students: "45 học viên",
    status: "Đang hoạt động",
  },
  {
    id: "KH002",
    name: "General English A2",
    desc: "Khóa học tiếng Anh sơ cấp, phát triển từ A1",
    level: "A2",
    duration: "12 tuần (72h)",
    fee: "2.200.000 VND",
    classes: "1 lớp",
    students: "25 học viên",
    status: "Đang hoạt động",
  },
  {
    id: "KH003",
    name: "General English B1",
    desc: "Khóa học tiếng Anh trung cấp",
    level: "B1",
    duration: "16 tuần (96h)",
    fee: "2.500.000 VND",
    classes: "3 lớp",
    students: "72 học viên",
    status: "Đang hoạt động",
  },
  {
    id: "KH004",
    name: "General English B2",
    desc: "Khóa học tiếng Anh tiền cao cấp",
    level: "B2",
    duration: "16 tuần (96h)",
    fee: "2.800.000 VND",
    classes: "1 lớp",
    students: "28 học viên",
    status: "Tạm dừng",
  },
  {
    id: "KH005",
    name: "IELTS Preparation",
    desc: "Luyện thi IELTS tổng quát 5.0–6.5",
    level: "B1",
    duration: "12 tuần (72h)",
    fee: "3.200.000 VND",
    classes: "2 lớp",
    students: "38 học viên",
    status: "Đang hoạt động",
  },
  {
    id: "KH006",
    name: "TOEIC Advanced",
    desc: "Luyện thi TOEIC 750+",
    level: "B1",
    duration: "10 tuần (60h)",
    fee: "2.600.000 VND",
    classes: "1 lớp",
    students: "22 học viên",
    status: "Đã kết thúc",
  },
];

/* ------------------------------ page ------------------------------- */
export default function Page() {
  const [q, setQ] = useState("");

  const stats = {
    total: 8,
    active: 7,
    students: 248,
    revenue: "125M",
  };

  const rows = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return COURSES;
    return COURSES.filter((c) =>
      [c.id, c.name, c.desc, c.level, c.fee].some((x) => x.toLowerCase().includes(kw))
    );
  }, [q]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Quản lý môn học</h1>
        <p className="text-sm text-gray-600">Quản lý chương trình học và khóa học</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl border bg-white p-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-pink-50 grid place-items-center">
              <BookOpen className="text-pink-600" size={18} />
            </span>
            <div>
              <div className="text-sm text-gray-600">Tổng khóa học</div>
              <div className="text-2xl font-extrabold text-gray-900">{stats.total}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-emerald-50 grid place-items-center">
              <GraduationCap className="text-emerald-600" size={18} />
            </span>
            <div>
              <div className="text-sm text-gray-600">Đang hoạt động</div>
              <div className="text-2xl font-extrabold text-gray-900">{stats.active}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-amber-50 grid place-items-center">
              <Users className="text-amber-600" size={18} />
            </span>
            <div>
              <div className="text-sm text-gray-600">Tổng học viên</div>
              <div className="text-2xl font-extrabold text-gray-900">{stats.students}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-sky-50 grid place-items-center">
              <DollarSign className="text-sky-600" size={18} />
            </span>
            <div>
              <div className="text-sm text-gray-600">Doanh thu/tháng</div>
              <div className="text-2xl font-extrabold text-gray-900">{stats.revenue}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top bar: search + create */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm kiếm khóa học..."
            className="w-full pl-10 pr-3 py-2.5 rounded-xl border bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-200"
          />
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-pink-500 hover:bg-pink-600 text-white font-semibold shadow-sm"
        >
          <Plus size={18} /> Tạo khóa học mới
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-gray-700">
            <tr>
              <th className="px-4 py-3 text-left">Mã khóa</th>
              <th className="px-4 py-3 text-left">Tên khóa học</th>
              <th className="px-4 py-3 text-left">Trình độ</th>
              <th className="px-4 py-3 text-left">Thời lượng</th>
              <th className="px-4 py-3 text-left">Học phí</th>
              <th className="px-4 py-3 text-left">Lớp học</th>
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
                <div className="text-xs text-gray-500">{c.desc}</div>
              </td>

              <td className="px-4 py-3">
                <LevelBadge level={c.level} />
              </td>

              <td className="px-4 py-3">
                <div className="inline-flex items-center gap-2 text-gray-900">
                  <Clock size={16} />
                  {c.duration}
                </div>
              </td>

              <td className="px-4 py-3 text-gray-900 font-semibold">{c.fee}</td>

              <td className="px-4 py-3">
                <div className="text-gray-900 font-medium">{c.classes}</div>
                <div className="text-xs text-gray-500">{c.students}</div>
              </td>

              <td className="px-4 py-3">
                <StatusBadge value={c.status} />
              </td>

              <td className="px-4 py-3">
                <div className="flex items-center text-gray-700 gap-2">
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
                Không tìm thấy khóa học phù hợp.
              </td>
            </tr>
          )}
        </tbody>
        </table>
      </div>
    </div>
  );
}
