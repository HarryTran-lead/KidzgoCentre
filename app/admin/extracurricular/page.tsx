"use client";

import { useMemo, useState } from "react";
import {
  Tent,
  Users,
  CalendarDays,
  MapPin,
  DollarSign,
  UploadCloud,
  Download,
  Sparkles,
} from "lucide-react";

type ProgramType = "CAMP" | "WORKSHOP" | "CLUB";

type Program = {
  id: string;
  name: string;
  type: ProgramType;
  date: string;
  capacity: number;
  registered: number;
  fee: number;
  location: string;
};

const PROGRAMS: Program[] = [
  {
    id: "PR001",
    name: "Trại hè sáng tạo 2025",
    type: "CAMP",
    date: "15-20/06/2025",
    capacity: 60,
    registered: 45,
    fee: 5200000,
    location: "KidzGo Resort",
  },
  {
    id: "PR002",
    name: "Workshop Robotics",
    type: "WORKSHOP",
    date: "12/01/2025",
    capacity: 25,
    registered: 20,
    fee: 890000,
    location: "Phòng Lab 402",
  },
  {
    id: "PR003",
    name: "Câu lạc bộ Kỹ năng sống",
    type: "CLUB",
    date: "Mỗi thứ 7",
    capacity: 30,
    registered: 28,
    fee: 450000,
    location: "Phòng Kĩ năng",
  },
];

const TYPE_INFO: Record<ProgramType, { text: string; cls: string }> = {
  CAMP: { text: "Trại hè", cls: "bg-emerald-50 text-emerald-700" },
  WORKSHOP: { text: "Workshop", cls: "bg-indigo-50 text-indigo-700" },
  CLUB: { text: "Câu lạc bộ", cls: "bg-amber-50 text-amber-700" },
};

function ProgramCard({ program }: { program: Program }) {
  const info = TYPE_INFO[program.type];
  const fill = Math.round((program.registered / program.capacity) * 100);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${info.cls}`}>
            <Tent size={14} /> {info.text}
          </div>
          <h3 className="mt-2 text-lg font-semibold text-gray-900">{program.name}</h3>
        </div>
        <div className="text-sm text-slate-500">{program.id}</div>
      </div>

      <div className="grid md:grid-cols-2 gap-3 text-sm text-slate-600">
        <div className="inline-flex items-center gap-2">
          <CalendarDays size={16} /> {program.date}
        </div>
        <div className="inline-flex items-center gap-2">
          <MapPin size={16} /> {program.location}
        </div>
        <div className="inline-flex items-center gap-2">
          <Users size={16} /> {program.registered}/{program.capacity} học viên
        </div>
        <div className="inline-flex items-center gap-2">
          <DollarSign size={16} /> {program.fee.toLocaleString("vi-VN")}đ
        </div>
      </div>

      <div>
        <div className="h-2.5 rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-slate-900" style={{ width: `${fill}%` }} />
        </div>
        <div className="mt-1 text-xs text-slate-500">{fill}% số chỗ đã được đăng ký</div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
          <UploadCloud size={16} /> Cập nhật hình ảnh
        </button>
        <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
          <Download size={16} /> Xuất danh sách
        </button>
      </div>
    </div>
  );
}

export default function ExtracurricularPage() {
  const [filter, setFilter] = useState<ProgramType | "ALL">("ALL");

  const list = useMemo(() => {
    if (filter === "ALL") return PROGRAMS;
    return PROGRAMS.filter((p) => p.type === filter);
  }, [filter]);

  return (
    <div className="space-y-6 text-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Ngoại khóa • Trại hè • Kỹ năng</h1>
          <p className="text-sm text-slate-500">
            Quản lý các chương trình ngoại khóa, theo dõi số lượng đăng ký và doanh thu dự kiến.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          <Sparkles size={16} /> 3 chương trình đang mở
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-wrap gap-2">
        {["ALL", "CAMP", "WORKSHOP", "CLUB"].map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item as typeof filter)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              filter === item
                ? "bg-slate-900 text-white"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            {item === "ALL" ? "Tất cả" : TYPE_INFO[item as ProgramType].text}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((program) => (
          <ProgramCard key={program.id} program={program} />
        ))}
      </div>
    </div>
  );
}