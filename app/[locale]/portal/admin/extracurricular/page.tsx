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
  Plus,
  Search,
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

const TYPE_INFO: Record<ProgramType, { text: string; cls: string; bg: string }> = {
  CAMP: { 
    text: "Trại hè", 
    cls: "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200",
    bg: "from-emerald-500 to-teal-500"
  },
  WORKSHOP: { 
    text: "Workshop", 
    cls: "bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border border-blue-200",
    bg: "from-blue-500 to-cyan-500"
  },
  CLUB: { 
    text: "Câu lạc bộ", 
    cls: "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200",
    bg: "from-amber-500 to-orange-500"
  },
};

function StatCard({
  title,
  value,
  icon,
  color,
  subtitle
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-pink-100 bg-gradient-to-br from-white to-pink-50/30 p-6 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className={`absolute right-0 top-0 h-20 w-20 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl bg-gradient-to-r ${color}`}></div>
      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-gradient-to-r ${color} text-white shadow-sm`}>
              {icon}
            </div>
          </div>
          <div className="text-sm font-medium text-gray-600">{title}</div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
        </div>
      </div>
    </div>
  );
}

function ProgramCard({ program }: { program: Program }) {
  const info = TYPE_INFO[program.type];
  const fill = Math.round((program.registered / program.capacity) * 100);
  return (
    <div className="group rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 p-5 space-y-4 transition-all duration-300 hover:shadow-lg hover:shadow-pink-100/50">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${info.cls}`}>
            <Tent size={14} /> {info.text}
          </div>
          <h3 className="mt-2 text-lg font-semibold text-gray-900 group-hover:text-pink-600 transition-colors">{program.name}</h3>
        </div>
        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{program.id}</div>
      </div>

      <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-600">
        <div className="inline-flex items-center gap-2">
          <CalendarDays size={16} className="text-pink-500" /> {program.date}
        </div>
        <div className="inline-flex items-center gap-2">
          <MapPin size={16} className="text-pink-500" /> {program.location}
        </div>
        <div className="inline-flex items-center gap-2">
          <Users size={16} className="text-pink-500" /> {program.registered}/{program.capacity} học viên
        </div>
        <div className="inline-flex items-center gap-2">
          <DollarSign size={16} className="text-pink-500" /> {program.fee.toLocaleString("vi-VN")}đ
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="font-medium text-gray-700">{fill}%</span>
          <span className="text-gray-500">{program.registered}/{program.capacity}</span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div 
            className={`h-full rounded-full bg-gradient-to-r ${info.bg} transition-all duration-500`}
            style={{ width: `${fill}%` }}
          />
        </div>
        <div className="mt-1 text-xs text-gray-500">Số chỗ đã được đăng ký</div>
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-pink-100">
        <button className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors">
          <UploadCloud size={16} /> Cập nhật hình ảnh
        </button>
        <button className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors">
          <Download size={16} /> Xuất danh sách
        </button>
      </div>
    </div>
  );
}

export default function ExtracurricularPage() {
  const [filter, setFilter] = useState<ProgramType | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const list = useMemo(() => {
    let result = PROGRAMS;
    
    if (filter !== "ALL") {
      result = result.filter((p) => p.type === filter);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter((p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.id.toLowerCase().includes(searchLower) ||
        p.location.toLowerCase().includes(searchLower)
      );
    }
    
    return result;
  }, [filter, search]);

  const stats = {
    total: PROGRAMS.length,
    totalRegistered: PROGRAMS.reduce((sum, p) => sum + p.registered, 0),
    totalCapacity: PROGRAMS.reduce((sum, p) => sum + p.capacity, 0),
    totalRevenue: PROGRAMS.reduce((sum, p) => sum + (p.fee * p.registered), 0),
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
            <Tent size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Ngoại khóa • Trại hè • Kỹ năng
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Quản lý các chương trình ngoại khóa, theo dõi số lượng đăng ký và doanh thu dự kiến
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 px-4 py-2.5 text-sm font-medium text-amber-700">
            <Sparkles size={16} /> {PROGRAMS.length} chương trình đang mở
          </div>
          <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all">
            <Plus size={16} />
            Tạo chương trình mới
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tổng chương trình"
          value={`${stats.total}`}
          icon={<Tent size={20} />}
          color="from-pink-500 to-rose-500"
          subtitle="Đang hoạt động"
        />
        <StatCard
          title="Đã đăng ký"
          value={`${stats.totalRegistered}`}
          icon={<Users size={20} />}
          color="from-emerald-500 to-teal-500"
          subtitle={`/${stats.totalCapacity} học viên`}
        />
        <StatCard
          title="Tỷ lệ lấp đầy"
          value={`${Math.round((stats.totalRegistered / stats.totalCapacity) * 100)}%`}
          icon={<Sparkles size={20} />}
          color="from-blue-500 to-cyan-500"
          subtitle="Trung bình"
        />
        <StatCard
          title="Doanh thu dự kiến"
          value={`${(stats.totalRevenue / 1000000).toFixed(1)}M`}
          icon={<DollarSign size={20} />}
          color="from-amber-500 to-orange-500"
          subtitle="VND"
        />
      </div>

      {/* Search and Filter */}
      <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-500" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm chương trình..."
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-pink-200 bg-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-200"
            />
          </div>
          
          <div className="inline-flex rounded-xl border border-pink-200 bg-white p-1">
            {["ALL", "CAMP", "WORKSHOP", "CLUB"].map((item) => {
              const count = item === "ALL" 
                ? PROGRAMS.length 
                : PROGRAMS.filter(p => p.type === item).length;
              
              return (
                <button
                  key={item}
                  onClick={() => setFilter(item as typeof filter)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    filter === item
                      ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm"
                      : "text-gray-700 hover:bg-pink-50"
                  }`}
                >
                  {item === "ALL" ? "Tất cả" : TYPE_INFO[item as ProgramType].text}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    filter === item ? 'bg-white/20' : 'bg-gray-100'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Programs Grid */}
      {list.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 p-12 text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-pink-100 to-rose-100 flex items-center justify-center">
            <Search size={24} className="text-pink-400" />
          </div>
          <div className="text-gray-600 font-medium">Không tìm thấy chương trình</div>
          <div className="text-sm text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc tạo chương trình mới</div>
        </div>
      )}
    </div>
  );
}