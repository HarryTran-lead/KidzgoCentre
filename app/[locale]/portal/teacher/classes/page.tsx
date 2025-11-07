// app/teacher/classes/page.tsx
"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Users,
  CalendarClock,
  MapPin,
  Eye,
} from "lucide-react";

/* ----------------------------- Mock data ----------------------------- */
type Track = "IELTS" | "TOEIC" | "Business";

type ClassItem = {
  id: string;
  name: string;
  code: string;
  track: Track;
  students: number;
  schedule: string; // e.g. "T2, T4, T6: 08:00–10:00"
  room: string; // e.g. "Phòng 301"
};

const CLASSES: ClassItem[] = [
  {
    id: "CLS001",
    name: "IELTS Foundation - A1",
    code: "CLS001",
    track: "IELTS",
    students: 18,
    schedule: "T2, T4, T6: 08:00–10:00",
    room: "Phòng 301",
  },
  {
    id: "CLS002",
    name: "TOEIC Intermediate",
    code: "CLS002",
    track: "TOEIC",
    students: 15,
    schedule: "T3, T5: 14:00–16:00",
    room: "Phòng 205",
  },
  {
    id: "CLS003",
    name: "Business English",
    code: "CLS003",
    track: "Business",
    students: 12,
    schedule: "T6, T7: 09:00–11:00",
    room: "Phòng 102",
  },
];

/* ----------------------------- UI pieces ----------------------------- */
function TrackBadge({ track }: { track: Track }) {
  const color =
    track === "IELTS"
      ? "bg-slate-900 text-white"
      : track === "TOEIC"
      ? "bg-slate-900 text-white"
      : "bg-slate-900 text-white";
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full ${color}`}>{track}</span>
  );
}

function FilterChip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-3 py-2 rounded-xl text-sm font-medium transition",
        active
          ? "bg-slate-900 text-white"
          : "bg-slate-50 hover:bg-slate-100 text-gray-900",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function ClassCard({ item }: { item: ClassItem }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-gray-900 font-semibold text-lg">{item.name}</h3>
          <div className="text-sm text-slate-500 mt-1">Mã: {item.code}</div>
        </div>
        <TrackBadge track={item.track} />
      </div>

      <div className="mt-5 space-y-3 text-sm">
        <div className="flex items-center gap-2 text-gray-900">
          <Users size={16} />
          <span className="text-gray-900">{item.students} học viên</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <CalendarClock size={16} />
          <span>{item.schedule}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <MapPin size={16} />
          <span>{item.room}</span>
        </div>
      </div>

      <button className="mt-5 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-medium inline-flex items-center justify-center gap-2 hover:bg-slate-50">
        <Eye size={16} />
        Xem chi tiết
      </button>
    </div>
  );
}

/* ----------------------------- Page ----------------------------- */
export default function Page() {
  const [q, setQ] = useState("");
  const [track, setTrack] = useState<Track | "ALL">("ALL");

  const filtered = useMemo(() => {
    return CLASSES.filter((c) => {
      const okTrack = track === "ALL" || c.track === track;
      const okQuery = q.trim()
        ? (c.name + c.code).toLowerCase().includes(q.toLowerCase())
        : true;
      return okTrack && okQuery;
    });
  }, [q, track]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Lớp học của tôi</h1>
        <p className="text-sm text-slate-500">
          Quản lý các lớp được phân công
        </p>
      </div>

      {/* Search + filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm kiếm lớp học..."
            className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-10 pr-3 py-2 text-sm text-gray-900 outline-none focus:bg-white focus:border-slate-300"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={track === "ALL"} onClick={() => setTrack("ALL")}>
            Tất cả
          </FilterChip>
          <FilterChip
            active={track === "IELTS"}
            onClick={() => setTrack("IELTS")}
          >
            IELTS
          </FilterChip>
          <FilterChip
            active={track === "TOEIC"}
            onClick={() => setTrack("TOEIC")}
          >
            TOEIC
          </FilterChip>
          <FilterChip
            active={track === "Business"}
            onClick={() => setTrack("Business")}
          >
            Business
          </FilterChip>
        </div>
      </div>

      {/* Cards */}
      <div className="grid xl:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5">
        {filtered.map((c) => (
          <ClassCard key={c.id} item={c} />
        ))}
      </div>
    </div>
  );
}
