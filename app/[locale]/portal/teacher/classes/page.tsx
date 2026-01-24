// app/teacher/classes/page.tsx
"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Search,
  Users,
  CalendarClock,
  Eye,
  ChevronRight,
  BookOpen,
  Filter,
  Sparkles,
} from "lucide-react";
import { fetchTeacherClasses } from "@/app/api/teacher/classes";
import type { ClassItem, Track } from "@/types/teacher/classes";

/* ----------------------------- UI pieces ----------------------------- */
function TrackBadge({ track }: { track: Track }) {
  const trackColors = {
    IELTS: "from-pink-500 to-purple-600",
    TOEIC: "from-rose-500 to-pink-600",
    Business: "from-fuchsia-500 to-purple-500",
  };

  return (
    <span
      className={`text-xs px-3 py-1.5 rounded-full bg-gradient-to-r ${trackColors[track]} text-white font-medium shadow-sm`}
    >
      {track}
    </span>
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
        "px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm",
        active
          ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md"
          : "bg-white hover:bg-pink-50 text-gray-700 border border-pink-100",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="mt-4">
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>Tiến độ khóa học</span>
        <span className="font-semibold">{progress}%</span>
      </div>
      <div className="h-2 bg-pink-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-pink-400 to-rose-500 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function ClassCard({ item, index }: { item: ClassItem; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const handleViewDetail = () => {
    router.push(`/${locale}/portal/teacher/classes/${item.id}`);
  };

  return (
    <div
      className="rounded-2xl bg-gradient-to-br from-white to-pink-50 border border-pink-100 p-6 flex flex-col justify-between transition-all duration-500 hover:shadow-xl hover:shadow-pink-100/50 hover:-translate-y-1"
      style={{ animationDelay: `${index * 100}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-gradient-to-r from-pink-100 to-rose-100 rounded-lg">
              <BookOpen size={16} className="text-pink-600" />
            </div>
            <span className="text-xs font-medium text-pink-600">Mã lớp: {item.code}</span>
          </div>
          <h3 className="text-gray-900 font-bold text-xl mb-2">{item.name}</h3>
        </div>
        <TrackBadge track={item.track} />
      </div>

      <div className="my-6 space-y-4 text-sm">
        <div className="flex items-center gap-3 text-gray-700">
          <div className="p-2 bg-pink-50 rounded-lg">
            <Users size={16} className="text-pink-500" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">{item.students} học viên</div>
            <div className="text-xs text-gray-500">Đã đăng ký</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 text-gray-700">
          <div className="p-2 bg-pink-50 rounded-lg">
            <CalendarClock size={16} className="text-pink-500" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">{item.schedule.split(":")[0]}</div>
            <div className="text-xs text-gray-500">{item.schedule.split(":")[1]}</div>
          </div>
        </div>
      </div>

      {item.progress && <ProgressBar progress={item.progress} />}

      <button 
        onClick={handleViewDetail}
        className={`mt-6 w-full rounded-xl cursor-pointer py-3 text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all duration-300 ${isHovered ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md' : 'bg-white text-gray-900 border border-pink-200 hover:border-pink-300'}`}
      >
        <Eye size={16} />
        Xem chi tiết
        <ChevronRight size={16} className={`transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
      </button>
    </div>
  );
}

function StatsCard({ title, value, icon: Icon, color }: { title: string; value: string; icon: any; color: string }) {
  return (
    <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-100 p-5 transition-all duration-500 hover:shadow-lg hover:shadow-pink-100/30">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600">{title}</div>
          <div className="text-2xl font-bold mt-2 text-gray-900">{value}</div>
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={24} className="text-pink-600" />
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Page ----------------------------- */
export default function Page() {
  const [q, setQ] = useState("");
  const [track, setTrack] = useState<Track | "ALL">("ALL");
  const [isLoaded, setIsLoaded] = useState(false);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(100); // Lấy nhiều để hiển thị tất cả

  // Fetch classes from API
  useEffect(() => {
    async function fetchClasses() {
      try {
        setLoading(true);
        setError(null);

        const result = await fetchTeacherClasses({
          pageNumber,
          pageSize,
        });

        setClasses(result.classes);
      } catch (err: any) {
        console.error('Unexpected error when fetching classes:', err);
        setError(err.message || 'Đã xảy ra lỗi khi tải danh sách lớp học.');
        setClasses([]);
      } finally {
        setLoading(false);
        setIsLoaded(true);
      }
    }

    fetchClasses();
  }, [pageNumber, pageSize]);

  const filtered = useMemo(() => {
    return classes.filter((c) => {
      const okTrack = track === "ALL" || c.track === track;
      const okQuery = q.trim()
        ? (c.name + c.code + (c.teacher || '')).toLowerCase().includes(q.toLowerCase())
        : true;
      return okTrack && okQuery;
    });
  }, [q, track, classes]);

  const totalClasses = classes.length;
  const totalStudents = classes.reduce((sum, c) => sum + c.students, 0);
  const averageProgress = classes.length > 0
    ? Math.round(classes.reduce((sum, c) => sum + (c.progress || 0), 0) / classes.length)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-6">
      {/* Header với animation */}
      <div className={`mb-8 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
            <BookOpen size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Lớp học của tôi
            </h1>
            <p className="text-gray-600 mt-1">
              Quản lý và theo dõi các lớp được phân công
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2 text-sm text-pink-600 font-medium">
            <Sparkles size={16} />
            <span>Trực tuyến</span>
          </div>
        </div>

        {/* Thống kê */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatsCard
            title="Tổng số lớp"
            value={totalClasses.toString()}
            icon={BookOpen}
            color="bg-pink-100"
          />
          <StatsCard
            title="Tổng học viên"
            value={totalStudents.toString()}
            icon={Users}
            color="bg-rose-100"
          />
          <StatsCard
            title="Tiến độ trung bình"
            value={`${averageProgress}%`}
            icon={CalendarClock}
            color="bg-fuchsia-100"
          />
        </div>
      </div>

      {/* Search + filters */}
      <div className={`mb-8 transition-all duration-700 delay-100 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="rounded-2xl bg-gradient-to-r from-white to-pink-50/50 border border-pink-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Filter size={20} className="text-pink-500" />
            <h2 className="text-lg font-semibold text-gray-900">Lọc và tìm kiếm</h2>
          </div>
          
          <div className="relative mb-5">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm kiếm theo tên lớp, mã lớp hoặc giáo viên..."
              className="w-full rounded-xl bg-white border border-pink-200 pl-12 pr-4 py-3.5 text-gray-900 outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all"
            />
          </div>
          
          <div className="flex flex-wrap gap-3">
            <FilterChip active={track === "ALL"} onClick={() => setTrack("ALL")}>
              Tất cả ({classes.length})
            </FilterChip>
            <FilterChip
              active={track === "IELTS"}
              onClick={() => setTrack("IELTS")}
            >
              IELTS ({classes.filter(c => c.track === "IELTS").length})
            </FilterChip>
            <FilterChip
              active={track === "TOEIC"}
              onClick={() => setTrack("TOEIC")}
            >
              TOEIC ({classes.filter(c => c.track === "TOEIC").length})
            </FilterChip>
            <FilterChip
              active={track === "Business"}
              onClick={() => setTrack("Business")}
            >
              Business ({classes.filter(c => c.track === "Business").length})
            </FilterChip>
          </div>
        </div>
      </div>

      {/* Kết quả tìm kiếm */}
      <div className={`mb-4 transition-all duration-700 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Danh sách lớp học
            <span className="text-pink-600 ml-2">({filtered.length})</span>
          </h2>
          <div className="text-sm text-gray-500">
            {filtered.length > 0 ? "Đang hiển thị" : "Không tìm thấy"} lớp học
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="text-center py-16">
          <div className="inline-flex p-4 bg-gradient-to-r from-pink-100 to-rose-100 rounded-2xl mb-4 animate-pulse">
            <BookOpen size={32} className="text-pink-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Đang tải danh sách lớp học...
          </h3>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="text-center py-16">
          <div className="inline-flex p-4 bg-gradient-to-r from-red-100 to-pink-100 rounded-2xl mb-4">
            <BookOpen size={32} className="text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {error}
          </h3>
          <button
            onClick={() => {
              setPageNumber(1);
              setError(null);
            }}
            className="mt-6 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-300"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Cards grid với stagger animation */}
      {!loading && !error && (
        <div className="grid xl:grid-cols-3 lg:grid-cols-2 grid-cols-1 gap-6">
          {filtered.map((c, index) => (
            <div
              key={c.id}
              className={`transition-all duration-700 delay-${index * 100} ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              <ClassCard item={c} index={index} />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <div className={`text-center py-16 transition-all duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
          <div className="inline-flex p-4 bg-gradient-to-r from-pink-100 to-rose-100 rounded-2xl mb-4">
            <Search size={32} className="text-pink-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Không tìm thấy lớp học
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc khác để xem kết quả.
          </p>
          <button
            onClick={() => {
              setQ("");
              setTrack("ALL");
            }}
            className="mt-6 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-300"
          >
            Xóa bộ lọc
          </button>
        </div>
      )}
    </div>
  );
}