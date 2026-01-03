"use client";

import { useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Filter,
  Search,
  Calendar,
  Clock,
  Award,
  TrendingUp,
  TrendingDown,
  Target,
  BookOpen,
  FileText,
  BarChart3,
  Medal,
  Users,
} from "lucide-react";
import type {
  TestListItem,
  TestStatus,
  TestType,
  TestStats,
  TestStatusConfig,
  TestSortOption,
} from "@/types/student/test";

// Status Badge
function StatusBadge({ status }: { status: TestStatus }) {
  const config: TestStatusConfig = {
    COMPLETED: {
      variant: "success",
      label: "Hoàn thành",
    },
    SCHEDULED: {
      variant: "info",
      label: "Sắp thi",
    },
    MISSED: {
      variant: "danger",
      label: "Vắng mặt",
    },
    IN_PROGRESS: {
      variant: "warning",
      label: "Đang làm",
    },
  };

  const { variant, label } = config[status];
  
  const colors = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
  };

  return (
    <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${colors[variant]}`}>
      {label}
    </span>
  );
}

// Stats Card
function StatsCard({
  icon,
  label,
  value,
  color = "indigo",
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: "indigo" | "emerald" | "amber" | "rose" | "blue";
  trend?: { value: number; isPositive: boolean };
}) {
  const colorClasses = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    blue: "bg-blue-50 text-blue-600",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg grid place-items-center shrink-0 ${colorClasses[color]}`}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-sm text-slate-500">{label}</div>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-slate-900">{value}</div>
            {trend && (
              <div className={`text-sm font-semibold flex items-center gap-1 ${
                trend.isPositive ? "text-emerald-600" : "text-rose-600"
              }`}>
                {trend.isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {Math.abs(trend.value)}%
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Sample Data
const SAMPLE_TESTS: TestListItem[] = [
  {
    id: "1",
    title: "Kiểm tra giữa kỳ - Unit 1-5",
    type: "MIDTERM",
    subject: "Tiếng Anh",
    className: "Lớp A1",
    testDate: "15/12/2024",
    duration: 90,
    status: "COMPLETED",
    score: 8.5,
    maxScore: 10,
    percentage: 85,
    averageScore: 7.2,
    rank: 3,
    totalStudents: 25,
  },
  {
    id: "2",
    title: "Quiz Vocabulary Unit 5",
    type: "QUIZ",
    subject: "Tiếng Anh",
    className: "Lớp A1",
    testDate: "20/12/2024",
    duration: 20,
    status: "COMPLETED",
    score: 9.0,
    maxScore: 10,
    percentage: 90,
    averageScore: 7.5,
    rank: 2,
    totalStudents: 25,
  },
  {
    id: "3",
    title: "Speaking Test - Unit 6",
    type: "SPEAKING",
    subject: "Tiếng Anh",
    className: "Lớp A1",
    testDate: "25/12/2024",
    duration: 15,
    status: "SCHEDULED",
    maxScore: 10,
    totalStudents: 25,
  },
  {
    id: "4",
    title: "Listening Practice Test",
    type: "LISTENING",
    subject: "Tiếng Anh",
    className: "Lớp A1",
    testDate: "18/12/2024",
    duration: 30,
    status: "COMPLETED",
    score: 7.5,
    maxScore: 10,
    percentage: 75,
    averageScore: 6.8,
    rank: 5,
    totalStudents: 25,
  },
  {
    id: "5",
    title: "Writing Test - Essay",
    type: "WRITING",
    subject: "Tiếng Anh",
    className: "Lớp A1",
    testDate: "10/12/2024",
    duration: 60,
    status: "MISSED",
    maxScore: 10,
    totalStudents: 25,
  },
];

export default function TestsPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TestStatus[]>([]);
  const [typeFilter, setTypeFilter] = useState<TestType[]>([]);
  const [sortBy, setSortBy] = useState<TestSortOption>("DATE_DESC");
  const [showFilters, setShowFilters] = useState(false);

  // Calculate stats
  const stats: TestStats = useMemo(() => {
    const total = SAMPLE_TESTS.length;
    const completed = SAMPLE_TESTS.filter(t => t.status === "COMPLETED").length;
    const scheduled = SAMPLE_TESTS.filter(t => t.status === "SCHEDULED").length;
    const missed = SAMPLE_TESTS.filter(t => t.status === "MISSED").length;
    
    const completedTests = SAMPLE_TESTS.filter(t => t.status === "COMPLETED" && t.score !== undefined);
    const averageScore = completedTests.length > 0
      ? completedTests.reduce((sum, t) => sum + (t.percentage || 0), 0) / completedTests.length
      : undefined;
    
    const highestScore = completedTests.length > 0
      ? Math.max(...completedTests.map(t => t.percentage || 0))
      : undefined;

    return { total, completed, scheduled, missed, averageScore, highestScore, improvementRate: 12 };
  }, []);

  // Filter and sort
  const filteredTests = useMemo(() => {
    let result = [...SAMPLE_TESTS];

    // Search
    if (searchQuery) {
      result = result.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter.length > 0) {
      result = result.filter(t => statusFilter.includes(t.status));
    }

    // Type filter
    if (typeFilter.length > 0) {
      result = result.filter(t => typeFilter.includes(t.type));
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "DATE_DESC":
          return new Date(b.testDate.split("/").reverse().join("-")).getTime() -
                 new Date(a.testDate.split("/").reverse().join("-")).getTime();
        case "DATE_ASC":
          return new Date(a.testDate.split("/").reverse().join("-")).getTime() -
                 new Date(b.testDate.split("/").reverse().join("-")).getTime();
        case "SCORE_DESC":
          return (b.percentage || 0) - (a.percentage || 0);
        case "SCORE_ASC":
          return (a.percentage || 0) - (b.percentage || 0);
        case "STATUS":
          const statusOrder = { SCHEDULED: 0, IN_PROGRESS: 1, COMPLETED: 2, MISSED: 3 };
          return statusOrder[a.status] - statusOrder[b.status];
        default:
          return 0;
      }
    });

    return result;
  }, [searchQuery, statusFilter, typeFilter, sortBy]);

  const getTypeLabel = (type: TestType) => {
    const labels = {
      MIDTERM: "Giữa kỳ",
      FINAL: "Cuối kỳ",
      QUIZ: "Kiểm tra nhanh",
      PRACTICE: "Luyện tập",
      SPEAKING: "Nói",
      LISTENING: "Nghe",
      WRITING: "Viết",
      READING: "Đọc",
    };
    return labels[type];
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return "text-emerald-600";
    if (percentage >= 80) return "text-blue-600";
    if (percentage >= 70) return "text-amber-600";
    return "text-rose-600";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Kết quả kiểm tra</h1>
        <p className="text-slate-600 mt-1">Xem chi tiết điểm số và thành tích của bạn</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatsCard
          icon={<FileText size={20} />}
          label="Tổng số bài thi"
          value={stats.total}
          color="indigo"
        />
        <StatsCard
          icon={<Award size={20} />}
          label="Đã hoàn thành"
          value={stats.completed}
          color="emerald"
        />
        <StatsCard
          icon={<Calendar size={20} />}
          label="Sắp thi"
          value={stats.scheduled}
          color="blue"
        />
        <StatsCard
          icon={<Target size={20} />}
          label="Điểm TB"
          value={stats.averageScore ? `${stats.averageScore.toFixed(1)}%` : "—"}
          color="amber"
          trend={stats.improvementRate ? { value: stats.improvementRate, isPositive: true } : undefined}
        />
        <StatsCard
          icon={<Medal size={20} />}
          label="Điểm cao nhất"
          value={stats.highestScore ? `${stats.highestScore}%` : "—"}
          color="emerald"
        />
      </div>

      {/* Search & Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm bài kiểm tra..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as TestSortOption)}
            className="px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="DATE_DESC">Ngày thi: Mới nhất</option>
            <option value="DATE_ASC">Ngày thi: Cũ nhất</option>
            <option value="SCORE_DESC">Điểm: Cao → Thấp</option>
            <option value="SCORE_ASC">Điểm: Thấp → Cao</option>
            <option value="STATUS">Trạng thái</option>
          </select>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center gap-2 font-medium"
          >
            <Filter size={20} />
            Lọc
            {(statusFilter.length + typeFilter.length) > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                {statusFilter.length + typeFilter.length}
              </span>
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Trạng thái
              </label>
              <div className="flex flex-wrap gap-2">
                {(["SCHEDULED", "COMPLETED", "MISSED"] as TestStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setStatusFilter(prev =>
                        prev.includes(status)
                          ? prev.filter(s => s !== status)
                          : [...prev, status]
                      );
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition ${
                      statusFilter.includes(status)
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <StatusBadge status={status} />
                  </button>
                ))}
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Loại bài thi
              </label>
              <div className="flex flex-wrap gap-2">
                {(["MIDTERM", "FINAL", "QUIZ", "SPEAKING", "LISTENING", "WRITING", "READING"] as TestType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setTypeFilter(prev =>
                        prev.includes(type)
                          ? prev.filter(t => t !== type)
                          : [...prev, type]
                      );
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition ${
                      typeFilter.includes(type)
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {getTypeLabel(type)}
                  </button>
                ))}
              </div>
            </div>
            
            {(statusFilter.length + typeFilter.length) > 0 && (
              <button
                onClick={() => {
                  setStatusFilter([]);
                  setTypeFilter([]);
                }}
                className="text-sm text-blue-600 font-medium hover:underline"
              >
                Xóa tất cả bộ lọc
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tests List */}
      <div className="space-y-3">
        {filteredTests.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <FileText size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">Không tìm thấy bài kiểm tra nào</p>
          </div>
        ) : (
          filteredTests.map((test) => (
            <div
              key={test.id}
              onClick={() => test.status === "COMPLETED" && router.push(`/${locale}/portal/student/tests/${test.id}`)}
              className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition ${
                test.status === "COMPLETED" ? "hover:shadow-md cursor-pointer" : ""
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-lg grid place-items-center shrink-0 ${
                  test.status === "COMPLETED" 
                    ? "bg-emerald-50 text-emerald-600" 
                    : test.status === "SCHEDULED"
                    ? "bg-blue-50 text-blue-600"
                    : "bg-slate-50 text-slate-400"
                }`}>
                  <FileText size={20} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 mb-1">
                        {test.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <BookOpen size={14} />
                          {test.className}
                        </span>
                        <span>•</span>
                        <span>{test.subject}</span>
                        <span>•</span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-medium">
                          {getTypeLabel(test.type)}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={test.status} />
                  </div>

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span className="text-slate-600 flex items-center gap-1">
                      <Calendar size={14} />
                      {test.testDate}
                    </span>
                    <span className="text-slate-600 flex items-center gap-1">
                      <Clock size={14} />
                      {test.duration} phút
                    </span>
                    
                    {test.score !== undefined && (
                      <>
                        <span className={`font-bold text-lg flex items-center gap-1 ${getScoreColor(test.percentage!)}`}>
                          <Award size={16} />
                          {test.score}/{test.maxScore} ({test.percentage}%)
                        </span>
                        
                        {test.rank && (
                          <span className="flex items-center gap-1 text-blue-600 font-medium">
                            <Medal size={14} />
                            #{test.rank}/{test.totalStudents}
                          </span>
                        )}
                        
                        {test.averageScore && (
                          <span className="text-slate-500 flex items-center gap-1">
                            <Users size={14} />
                            ĐTB lớp: {test.averageScore}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
