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
    IELTS: "from-red-600 to-red-700",
    TOEIC: "from-gray-600 to-gray-700",
    Business: "from-gray-800 to-gray-900",
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
        "px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm cursor-pointer",
        active
          ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
          : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function ProgressBar({ progress, isPageLoaded = true }: { progress: number; isPageLoaded?: boolean }) {
  return (
    <div className="mt-4">
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>Tiến độ khóa học</span>
        <span className="font-semibold">{progress}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-red-600 to-red-700 rounded-full transition-all duration-1000 ease-out"
          style={{ width: isPageLoaded ? `${progress}%` : '0%' }}
        />
      </div>
    </div>
  );
}

function ClassCard({ item, index, isPageLoaded = true }: { item: ClassItem; index: number; isPageLoaded?: boolean }) {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const handleViewDetail = () => {
    router.push(`/${locale}/portal/teacher/classes/${item.id}`);
  };

  return (
    <div
      className="rounded-2xl bg-white border border-gray-200 p-6 flex flex-col justify-between transition-all duration-500 hover:shadow-xl hover:shadow-gray-100/50 hover:-translate-y-1"
      style={{ animationDelay: `${index * 100}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-red-50 rounded-lg">
              <BookOpen size={16} className="text-red-600" />
            </div>
            <span className="text-xs font-medium text-red-600">Mã lớp: {item.code}</span>
          </div>
          <h3 className="text-gray-900 font-bold text-xl mb-2">{item.name}</h3>
        </div>
        <TrackBadge track={item.track} />
      </div>

      <div className="my-6 space-y-4 text-sm">
        <div className="flex items-center gap-3 text-gray-700">
          <div className="p-2 bg-gray-50 rounded-lg">
            <Users size={16} className="text-gray-600" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">{item.students} học viên</div>
            <div className="text-xs text-gray-500">Đã đăng ký</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 text-gray-700">
          <div className="p-2 bg-gray-50 rounded-lg">
            <CalendarClock size={16} className="text-gray-600" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">{item.schedule.split(":")[0]}</div>
            <div className="text-xs text-gray-500">{item.schedule.split(":")[1]}</div>
          </div>
        </div>
      </div>

      {item.progress && <ProgressBar progress={item.progress} isPageLoaded={isPageLoaded} />}

      <button 
        onClick={handleViewDetail}
        className={`mt-6 w-full rounded-xl cursor-pointer py-3 text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all duration-300 ${isHovered ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md' : 'bg-white text-gray-900 border border-gray-200 hover:border-red-300'}`}
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
    <div className="bg-white rounded-2xl border border-gray-200 p-5 transition-all duration-500 hover:shadow-lg hover:shadow-gray-100/30 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600">{title}</div>
          <div className="text-2xl font-bold mt-2 text-gray-900">{value}</div>
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={24} className="text-red-600" />
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Page ----------------------------- */
export default function Page() {
  const [q, setQ] = useState("");
  const [track, setTrack] = useState<Track | "ALL">("ALL");
  const [isPageLoaded, setIsPageLoaded] = useState(false);
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
        setIsPageLoaded(true);
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
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header với animation */}
      <div className={`mb-8 transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
            <BookOpen size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Lớp học của tôi
            </h1>
            <p className="text-gray-600 mt-1 flex items-center gap-2">
              Quản lý và theo dõi các lớp được phân công
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2 text-sm text-red-600 font-medium">
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
            color="bg-red-50"
          />
          <StatsCard
            title="Tổng học viên"
            value={totalStudents.toString()}
            icon={Users}
            color="bg-gray-100"
          />
          <StatsCard
            title="Tiến độ trung bình"
            value={`${averageProgress}%`}
            icon={CalendarClock}
            color="bg-gray-100"
          />
        </div>
      </div>

      {/* Search + filters */}
      <div className={`mb-8 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="rounded-2xl bg-white border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Filter size={20} className="text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">Lọc và tìm kiếm</h2>
          </div>
          
          <div className="relative mb-5">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm kiếm theo tên lớp, mã lớp hoặc giáo viên..."
              className="w-full rounded-xl bg-white border border-gray-200 pl-12 pr-4 py-3.5 text-gray-900 outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent transition-all"
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
      <div className={`mb-4 transition-all duration-700 delay-200 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Danh sách lớp học
            <span className="text-red-600 ml-2">({filtered.length})</span>
          </h2>
          <div className="text-sm text-gray-500">
            {filtered.length > 0 ? "Đang hiển thị" : "Không tìm thấy"} lớp học
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="text-center py-16">
          <div className="inline-flex p-4 bg-red-50 rounded-2xl mb-4 animate-pulse">
            <BookOpen size={32} className="text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Đang tải danh sách lớp học...
          </h3>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="text-center py-16">
          <div className="inline-flex p-4 bg-red-50 rounded-2xl mb-4">
            <BookOpen size={32} className="text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {error}
          </h3>
          <button
            onClick={() => {
              setPageNumber(1);
              setError(null);
            }}
            className="mt-6 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-300 cursor-pointer"
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
              className={`transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <ClassCard item={c} index={index} isPageLoaded={isPageLoaded} />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <div className={`text-center py-16 transition-all duration-700 ${isPageLoaded ? 'opacity-100' : 'opacity-0'}`}>
          <div className="inline-flex p-4 bg-gray-50 rounded-2xl mb-4">
            <Search size={32} className="text-gray-600" />
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
            className="mt-6 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-300 cursor-pointer"
          >
            Xóa bộ lọc
          </button>
        </div>
      )}
    </div>
  );
}