"use client";

import { useState, useEffect, useRef } from "react";
import { 
  BookOpen, 
  CalendarClock, 
  Users, 
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  Star,
  Sparkles,
  Zap,
  ChevronRight,
  BarChart3,
  Target,
  Award,
  Download,
  Bell,
  Calendar,
  MapPin,
  UserRound,
  MessageSquare,
  FileText,
  Eye,
  ArrowUpRight,
  CalendarDays,
  MoreVertical,
  Video,
  Mic,
  CheckSquare,
  PlayCircle,
  ExternalLink,
  BellRing
} from "lucide-react";

// Custom Components
function StatCard({
  icon,
  label,
  value,
  hint,
  trend = "up",
  color = "pink",
  delay = 0
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  trend?: "up" | "down" | "stable";
  color?: "pink" | "green" | "yellow" | "blue" | "purple";
  delay?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const colorClasses = {
    pink: "from-pink-500 to-rose-500",
    green: "from-emerald-500 to-teal-500",
    yellow: "from-amber-500 to-orange-500",
    blue: "from-blue-500 to-sky-500",
    purple: "from-purple-500 to-indigo-500"
  };

  const trendColors = {
    up: "text-emerald-600",
    down: "text-rose-600",
    stable: "text-amber-600"
  };

  return (
    <div
      className={`bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-5 transition-all duration-700 transform ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600">{label}</div>
          <div className="text-2xl font-bold mt-2 text-gray-900">{value}</div>
          <div className={`text-xs flex items-center gap-1 mt-1 ${trendColors[trend]}`}>
            {trend === "up" && <TrendingUp size={12} />}
            {trend === "down" && <TrendingUp size={12} className="rotate-180" />}
            {trend === "stable" && <span>→</span>}
            {hint}
          </div>
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-r ${colorClasses[color]} text-white shadow-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function Badge({
  color = "gray",
  children
}: {
  color?: "gray" | "blue" | "red" | "green" | "purple" | "yellow" | "pink";
  children: React.ReactNode;
}) {
  const colorClasses = {
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-blue-100 text-blue-700",
    red: "bg-rose-100 text-rose-700",
    green: "bg-emerald-100 text-emerald-700",
    purple: "bg-purple-100 text-purple-700",
    yellow: "bg-amber-100 text-amber-700",
    pink: "bg-pink-100 text-pink-700"
  };

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${colorClasses[color]}`}>
      {children}
    </span>
  );
}

function ClassCard({
  cls,
  index
}: {
  cls: any;
  index: number
}) {
  const [isHovered, setIsHovered] = useState(false);

  // Tính toán thời gian còn lại
  const getTimeRemaining = () => {
    const now = new Date();
    const classTimes = cls.time.split(' - ');
    const startTime = classTimes[0];

    // Tạo thời gian bắt đầu (giả định là hôm nay)
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const classStart = new Date();
    classStart.setHours(startHour, startMinute, 0, 0);

    // Tính khoảng cách thời gian
    const diffMs = classStart.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffMs < 0) return "Đã bắt đầu";
    if (diffHours > 0) return `${diffHours}h ${diffMinutes}p`;
    return `${diffMinutes} phút`;
  };

  const timeRemaining = getTimeRemaining();
  const isUpcomingSoon = timeRemaining.includes("phút") || timeRemaining.includes("h");

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-xl ${
        isUpcomingSoon
          ? 'border-amber-200 bg-gradient-to-br from-amber-50/50 to-white'
          : 'border-pink-200 bg-gradient-to-br from-white to-pink-50'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background gradient effect on hover */}
      <div
        className={`absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
          isUpcomingSoon ? 'from-amber-500/5 to-amber-600/5' : 'from-pink-500/5 to-rose-500/5'
        }`}
      />

      <div className="relative p-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          {/* Left - time & day card */}
          <div className="flex flex-col gap-3 lg:w-56">
            <div
              className={`w-full rounded-2xl border px-4 py-3 bg-white/80 shadow-sm flex items-center justify-between gap-3 ${
                isUpcomingSoon ? 'border-amber-200' : 'border-pink-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-semibold bg-gradient-to-r ${cls.color}`}
                >
                  <Clock size={16} className="text-white" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500">Khung giờ</div>
                  <div className="text-sm font-semibold text-gray-900">{cls.time}</div>
                </div>
              </div>
              {isUpcomingSoon && (
                <div className="hidden md:flex flex-col items-end text-[11px] text-amber-700 font-semibold">
                  <span className="inline-flex items-center gap-1">
                    <BellRing size={12} />
                    Bắt đầu sau
                  </span>
                  <span>{timeRemaining}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <div className="flex-1 rounded-xl bg-pink-50 border border-pink-100 px-3 py-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-pink-700">{cls.day}</span>
                <span className="text-[11px] text-gray-500">Lịch dạy</span>
              </div>
            </div>
          </div>

          {/* Middle - Class Details */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-1">{cls.name}</h4>
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600">
                  {/* Mode badge */}
                  {cls.type === "online" && (
                    <Badge color="green">
                      <Video size={12} />
                      Online · Google Meet
                    </Badge>
                  )}
                  {cls.type === "offline" && (
                    <Badge color="gray">
                      <MapPin size={12} />
                      Offline · {cls.room}
                    </Badge>
                  )}
                  {cls.type === "hybrid" && (
                    <Badge color="purple">
                      <Video size={12} />
                      Hybrid · Phòng {cls.room}
                    </Badge>
                  )}

                  {/* Room or Meet link */}
                  {cls.type !== "online" && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-50 border border-gray-100">
                      <MapPin size={12} />
                      <span className="text-xs sm:text-[13px] text-gray-700">{cls.room}</span>
                    </span>
                  )}
                  {cls.type !== "offline" && cls.meetUrl && (
                    <a
                      href={cls.meetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-xs sm:text-[13px] text-emerald-700 hover:bg-emerald-100 transition-colors"
                    >
                      <ExternalLink size={12} />
                      <span className="truncate max-w-[140px] sm:max-w-[200px]">
                        {cls.meetUrl.replace('https://', '')}
                      </span>
                    </a>
                  )}

                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-50 border border-gray-100">
                    <UserRound size={12} />
                    <span className="text-xs sm:text-[13px] text-gray-700">{cls.students} học viên</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <button className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors">
                <PlayCircle size={14} />
                Vào lớp
              </button>
              <button className="flex items-center gap-2 px-3 py-2 bg-pink-50 text-pink-700 hover:bg-pink-100 rounded-lg text-sm font-medium transition-colors">
                <CheckSquare size={14} />
                Điểm danh
              </button>
              <button className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors">
                <ExternalLink size={14} />
                Chi tiết
              </button>
            </div>
          </div>

          {/* Right - progress pie chart */}
          <div className="mt-6 lg:mt-0 lg:w-44 flex items-center justify-center">
            <div className="bg-white/80 border border-pink-100 rounded-2xl px-4 py-3 shadow-sm flex flex-col items-center gap-2">
              <span className="text-xs font-semibold text-gray-600">Tiến độ công việc</span>
              <PieChart
                value={cls.progress ?? 0}
                size={72}
                color="pink"
                label={`${cls.progress ?? 0}%`}
              />
              <span className="text-[11px] text-gray-500">Hoàn thành chương trình</span>
            </div>
          </div>
        </div>

        {/* Materials Preview */}
        <div className="mt-6 pt-5 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-900">Tài liệu buổi học</span>
            <span className="text-xs text-pink-600 hover:text-pink-700 cursor-pointer flex items-center gap-1">
              Xem tất cả <ChevronRight size={12} />
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">
              <FileText size={14} />
              <span>Bài giảng PDF</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm">
              <Mic size={14} />
              <span>Audio bài học</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm">
              <Video size={14} />
              <span>Video mẫu</span>
            </div>
          </div>
        </div>
      </div>

      {/* Corner accent */}
      <div className={`absolute top-0 right-0 w-16 h-16 overflow-hidden ${isUpcomingSoon ? 'text-amber-200' : 'text-pink-200'
        }`}>
        <div className={`absolute -top-4 -right-4 w-12 h-12 transform rotate-45 ${isUpcomingSoon ? 'bg-amber-100' : 'bg-pink-100'
          }`} />
      </div>
    </div>
  );
}

function PieChart({
  value,
  size = 80,
  color = "pink",
  label = "",
  animate = true
}: {
  value: number;
  size?: number;
  color?: "pink" | "green" | "blue" | "yellow";
  label?: string;
  animate?: boolean;
}) {
  const [progress, setProgress] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!animate || hasAnimated.current) return;

    const timer = setTimeout(() => {
      hasAnimated.current = true;
      let start = 0;
      const end = value;
      const duration = 1000;
      const incrementTime = 10;

      const step = () => {
        start += (end / (duration / incrementTime));
        if (start > end) start = end;
        setProgress(start);

        if (start < end) {
          setTimeout(step, incrementTime);
        }
      };

      step();
    }, 300);

    return () => clearTimeout(timer);
  }, [value, animate]);

  const displayValue = animate ? Math.round(progress) : value;
  const colorClasses = {
    pink: { fill: "#ec4899", stroke: "#fce7f3", bg: "bg-pink-100" },
    green: { fill: "#10b981", stroke: "#d1fae5", bg: "bg-emerald-100" },
    blue: { fill: "#3b82f6", stroke: "#dbeafe", bg: "bg-blue-100" },
    yellow: { fill: "#f59e0b", stroke: "#fef3c7", bg: "bg-amber-100" }
  };

  const radius = size / 2 - 4;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayValue / 100) * circumference;
  const colors = colorClasses[color];

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth="8"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colors.fill}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-gray-900">{displayValue}%</span>
        </div>
      </div>
      {label && (
        <div className="text-xs text-gray-600 mt-2 text-center">{label}</div>
      )}
    </div>
  );
}

function BarChart({
  data,
  labels,
  colors = ["#ec4899", "#10b981", "#3b82f6", "#f59e0b"],
  height = 200,
  animate = true
}: {
  data: number[];
  labels: string[];
  colors?: string[];
  height?: number;
  animate?: boolean;
}) {
  const [animatedData, setAnimatedData] = useState(data.map(() => 0));
  const maxValue = Math.max(...data);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!animate || hasAnimated.current) return;

    const timer = setTimeout(() => {
      hasAnimated.current = true;
      let currentData = [...animatedData];
      const incrementTime = 20;
      const steps = 50;

      const step = (stepCount: number) => {
        currentData = currentData.map((val, idx) => {
          const target = data[idx];
          const increment = (target - val) / (steps - stepCount);
          return val + increment;
        });

        setAnimatedData([...currentData]);

        if (stepCount < steps) {
          setTimeout(() => step(stepCount + 1), incrementTime);
        } else {
          setAnimatedData([...data]);
        }
      };

      step(0);
    }, 400);

    return () => clearTimeout(timer);
  }, [data, animate]);

  const displayData = animate ? animatedData : data;

  return (
    <div className="w-full h-full p-4">
      <div className="flex items-end justify-between h-full" style={{ height: `${height}px` }}>
        {displayData.map((value, index) => {
          const barHeight = maxValue > 0 ? (value / maxValue) * (height - 40) : 0;
  return (
            <div key={index} className="flex flex-col items-center flex-1 mx-1">
              <div
                className="w-3/4 rounded-t-lg transition-all duration-500 ease-out"
                style={{
                  height: `${barHeight}px`,
                  backgroundColor: colors[index % colors.length],
                  animationDelay: `${index * 100}ms`
                }}
              ></div>
              <div className="text-xs text-gray-600 mt-2 text-center truncate w-full px-1">
                {labels[index]}
              </div>
              <div className="text-xs font-semibold mt-1">{value}</div>
            </div>
          );
        })}
      </div>
      </div>
  );
}

function LineChart({
  data,
  labels,
  color = "#ec4899",
  height = 150,
  animate = true
}: {
  data: number[];
  labels: string[];
  color?: string;
  height?: number;
  animate?: boolean;
}) {
  const [animatedData, setAnimatedData] = useState(data.map(() => 0));
  const maxValue = Math.max(...data);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!animate || hasAnimated.current) return;

    const timer = setTimeout(() => {
      hasAnimated.current = true;
      let currentData = [...animatedData];
      const incrementTime = 20;
      const steps = 50;

      const step = (stepCount: number) => {
        currentData = currentData.map((val, idx) => {
          const target = data[idx];
          const increment = (target - val) / (steps - stepCount);
          return val + increment;
        });

        setAnimatedData([...currentData]);

        if (stepCount < steps) {
          setTimeout(() => step(stepCount + 1), incrementTime);
        } else {
          setAnimatedData([...data]);
        }
      };

      step(0);
    }, 500);

    return () => clearTimeout(timer);
  }, [data, animate]);

  const displayData = animate ? animatedData : data;
  const pointRadius = 4;

  const points = displayData.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - (value / maxValue) * 100;
    return `${x}% ${y}%`;
  }).join(', ');

  const pathData = `M ${points.split(', ')[0]} L ${points.split(', ').slice(1).join(' L ')}`;

  return (
    <div className="w-full h-full p-4">
      <div className="relative" style={{ height: `${height}px` }}>
        <div className="absolute inset-0 flex flex-col justify-between">
          {[0, 25, 50, 75, 100].map((percent, idx) => (
            <div
              key={idx}
              className="border-t border-gray-200"
              style={{ top: `${percent}%` }}
            ></div>
          ))}
        </div>

        <svg width="100%" height="100%" className="overflow-visible">
          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-1000 ease-out"
          />

          {displayData.map((value, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 100 - (value / maxValue) * 100;
            return (
              <circle
                key={index}
                cx={`${x}%`}
                cy={`${y}%`}
                r={pointRadius}
                fill="white"
                stroke={color}
                strokeWidth="2"
                className="transition-all duration-1000 ease-out"
              />
            );
          })}
        </svg>

        <div className="absolute bottom-0 left-0 right-0 flex justify-between mt-2">
          {labels.map((label, index) => (
            <div key={index} className="text-xs text-gray-600 -rotate-45 origin-left">
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<"today" | "upcoming">("today");

  const [upcomingClasses] = useState([
    {
      name: "IELTS Foundation - A1",
      time: "08:00 - 10:00",
      room: "Phòng 301",
      day: "Hôm nay",
      students: 18,
      color: "from-pink-500 to-rose-500",
      type: "online",
      meetUrl: "https://meet.google.com/ielts-a1",
      progress: 65,
      attendance: 92
    },
    {
      name: "TOEIC Intermediate",
      time: "14:00 - 16:00",
      room: "Phòng 205",
      day: "Hôm nay",
      students: 15,
      color: "from-amber-500 to-orange-500",
      type: "offline",
      progress: 45,
      attendance: 88
    },
    {
      name: "Business English",
      time: "09:00 - 11:00",
      room: "Phòng 102",
      day: "Thứ 6, 10/10",
      students: 12,
      color: "from-emerald-500 to-teal-500",
      type: "online",
      meetUrl: "https://meet.google.com/business-en",
      progress: 80,
      attendance: 95
    },
    {
      name: "Academic Writing",
      time: "19:00 - 21:00",
      room: "Phòng 305",
      day: "Thứ 7, 11/10",
      students: 10,
      color: "from-blue-500 to-sky-500",
      type: "hybrid",
      progress: 30,
      attendance: 85
    },
    {
      name: "Conversation Practice",
      time: "10:00 - 11:30",
      room: "Phòng 108",
      day: "Thứ 2, 14/10",
      students: 8,
      color: "from-purple-500 to-indigo-500",
      type: "online",
      progress: 55,
      attendance: 90
    }
  ]);

  const [notifications] = useState([
    {
      title: "Lịch dạy được cập nhật",
      message: "Lớp IELTS Foundation - A1 chuyển sang phòng 301 từ ngày 12/10",
      type: "info",
      time: "2 giờ trước",
      read: false,
      icon: CalendarDays
    },
    {
      title: "Nhắc nhở điểm danh",
      message: "Chưa điểm danh buổi 08/10 cho lớp TOEIC Intermediate",
      type: "warning",
      time: "1 ngày trước",
      read: false,
      icon: AlertCircle
    },
    {
      title: "Tài liệu mới đã tải lên",
      message: "Đề thi giữa kỳ môn Business English đã được tải lên hệ thống",
      type: "success",
      time: "2 ngày trước",
      read: true,
      icon: FileText
    }
  ]);

  const [classProgress] = useState([
    { name: "IELTS Foundation", progress: 65, attendance: 92, color: "pink" },
    { name: "TOEIC Intermediate", progress: 45, attendance: 88, color: "yellow" },
    { name: "Business English", progress: 80, attendance: 95, color: "green" },
    { name: "Academic Writing", progress: 30, attendance: 85, color: "blue" }
  ]);

  // Chart data
  const [weeklyPerformance] = useState({
    labels: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
    data: [78, 82, 85, 90, 88, 92, 87]
  });

  const [classSizeData] = useState({
    labels: ["IELTS", "TOEIC", "Business", "Writing"],
    data: [18, 15, 12, 10]
  });

  const [monthlyHours] = useState({
    labels: ["Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4"],
    data: [15, 18, 20, 15]
  });

  const todayClasses = upcomingClasses.filter(cls => cls.day.includes("Hôm nay"));
  const upcomingFutureClasses = upcomingClasses.filter(cls => !cls.day.includes("Hôm nay"));

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
              <BarChart3 size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                Tổng quan giảng dạy
              </h1>
              <p className="text-gray-600 mt-1">Thống kê và phân tích hiệu suất tuần này</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2.5 rounded-xl border border-pink-200 bg-white hover:bg-pink-50 transition-colors">
              <Download size={18} className="text-gray-600" />
            </button>
            <button className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-medium hover:shadow-lg transition-all">
              <Calendar size={16} className="inline mr-2" />
              Tuần này
            </button>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<BookOpen size={24} />}
            label="Lớp đang dạy"
            value="4"
            hint="Ổn định"
            trend="stable"
            color="pink"
            delay={100}
          />
          <StatCard
            icon={<CalendarClock size={24} />}
            label="Buổi/tuần"
            value="12"
            hint="+2 so với tuần trước"
            trend="up"
            color="green"
            delay={200}
          />
          <StatCard
            icon={<Users size={24} />}
            label="Tổng học viên"
            value="55"
            hint="+3 mới"
            trend="up"
            color="yellow"
            delay={300}
          />
          <StatCard
            icon={<TrendingUp size={24} />}
            label="Hiệu suất TB"
            value="89%"
            hint="+5%"
            trend="up"
            color="blue"
            delay={400}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Upcoming Classes & Progress */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Classes - Redesigned */}
          <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-pink-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <CalendarClock size={20} className="text-pink-500" />
                  <h3 className="font-bold text-gray-900">Lịch dạy sắp tới</h3>
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white text-xs">
                    {todayClasses.length + upcomingFutureClasses.length}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                      onClick={() => setActiveTab("today")}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "today"
                          ? "bg-white text-pink-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                      Hôm nay ({todayClasses.length})
                    </button>
                    <button
                      onClick={() => setActiveTab("upcoming")}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "upcoming"
                          ? "bg-white text-pink-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                      Sắp tới ({upcomingFutureClasses.length})
                    </button>
                </div>

                  <button className="text-sm text-pink-600 font-medium hover:text-pink-700 flex items-center gap-1 whitespace-nowrap">
                    Xem lịch đầy đủ
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
            </div>

            <div className="p-6">
              {activeTab === "today" ? (
                <div className="space-y-4">
                  {todayClasses.map((cls, index) => (
                    <ClassCard key={index} cls={cls} index={index} />
                  ))}

                  {todayClasses.length === 0 && (
                    <div className="text-center py-12">
                      <CalendarClock size={48} className="text-gray-300 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Không có lớp học nào hôm nay</h4>
                      <p className="text-gray-600">Hãy kiểm tra lịch dạy sắp tới hoặc tận hưởng ngày nghỉ của bạn!</p>
                      </div>
                  )}
                          </div>
              ) : (
                <div className="space-y-4">
                  {upcomingFutureClasses.map((cls, index) => (
                    <ClassCard key={index} cls={cls} index={index} />
                  ))}
                          </div>
              )}
                          </div>

            {/* Calendar Preview */}
            <div className="px-6 py-4 border-t border-pink-200 bg-pink-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-pink-200">
                    <Calendar size={18} className="text-pink-600" />
                        </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Tuần sau có 8 buổi dạy</div>
                    <div className="text-xs text-gray-600">Tổng cộng 16 giờ giảng dạy</div>
                      </div>
                    </div>
                <button className="px-4 py-2 bg-white border border-pink-200 text-pink-600 hover:bg-pink-50 rounded-lg text-sm font-medium transition-colors">
                  Xem lịch tuần
                      </button>
                    </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Performance Chart */}
          <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-6">
              <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={20} className="text-pink-500" />
                  <h3 className="font-bold text-gray-900">Hiệu suất tuần</h3>
                </div>
                <span className="text-sm text-gray-600">Điểm TB: 87%</span>
              </div>
              <div className="h-48">
                <LineChart
                  data={weeklyPerformance.data}
                  labels={weeklyPerformance.labels}
                  color="#ec4899"
                  height={150}
                  animate={isPageLoaded}
                />
              </div>
            </div>
            
            {/* Class Size Chart */}
            <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users size={20} className="text-blue-500" />
                  <h3 className="font-bold text-gray-900">Quy mô lớp học</h3>
                      </div>
                <span className="text-sm text-gray-600">Tổng: 55 học viên</span>
                      </div>
              <div className="h-48">
                <BarChart
                  data={classSizeData.data}
                  labels={classSizeData.labels}
                  colors={["#ec4899", "#f59e0b", "#10b981", "#3b82f6"]}
                  height={150}
                  animate={isPageLoaded}
                    />
                  </div>
            </div>
          </div>
        </div>

        {/* Right Column - Notifications & Quick Actions */}
        <div className="space-y-6">
          {/* Notifications */}
          <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-pink-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell size={20} className="text-pink-500" />
                  <h3 className="font-bold text-gray-900">Thông báo mới</h3>
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white text-xs">
                    {notifications.filter(n => !n.read).length}
                  </span>
                </div>
                <button className="text-sm text-pink-600 font-medium hover:text-pink-700">
                  Đánh dấu đã đọc
                </button>
              </div>
            </div>
            
            <div className="divide-y divide-pink-100">
              {notifications.map((notif, index) => {
                const Icon = notif.icon;
                const typeColors = {
                  info: "bg-blue-100 text-blue-700",
                  warning: "bg-amber-100 text-amber-700",
                  success: "bg-emerald-100 text-emerald-700"
                };

                return (
                  <div 
                    key={index}
                    className={`px-6 py-4 transition-colors ${!notif.read ? 'bg-pink-50/50' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${typeColors[notif.type as keyof typeof typeColors]}`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{notif.title}</div>
                            <div className="text-sm text-gray-600 mt-1">{notif.message}</div>
                          </div>
                          {!notif.read && (
                            <div className="h-2 w-2 rounded-full bg-rose-500"></div>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <Badge color={notif.type as any}>
                            {notif.type === "info" ? "Thông tin" : 
                             notif.type === "warning" ? "Quan trọng" : "Thành công"}
                          </Badge>
                          <div className="text-xs text-gray-500">{notif.time}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Class Progress Pie Charts */}
          <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target size={20} className="text-pink-500" />
              <h3 className="font-bold text-gray-900">Tiến độ lớp học</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {classProgress.slice(0, 4).map((cls, index) => (
                <div key={index} className="flex flex-col items-center p-3 bg-white rounded-xl border border-pink-200">
                  <div className="text-xs font-medium text-gray-900 mb-2 text-center truncate w-full">
                    {cls.name.split(' ')[0]}
                  </div>
                  <PieChart
                    value={cls.progress}
                    size={70}
                    color={cls.color as any}
                    label="Tiến độ"
                    animate={isPageLoaded}
                  />
                  </div>
              ))}
            </div>
          </div>

          {/* Performance Highlight */}
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Award size={20} />
              </div>
              <div>
                <h3 className="font-bold">Xuất sắc tuần này</h3>
                <p className="text-sm opacity-90">IELTS Foundation - A1</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm opacity-90">Tỷ lệ hoàn thành</div>
                <div className="font-bold">92%</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm opacity-90">Đánh giá học viên</div>
                <div className="font-bold">4.9/5.0</div>
              </div>
            </div>
            
            <button className="w-full mt-6 py-2.5 bg-white text-pink-600 rounded-xl font-medium hover:bg-white/90 transition-colors">
              Xem chi tiết
            </button>
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="mt-8 pt-6 border-t border-pink-200">
        <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-gray-600 gap-2">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-pink-500" />
            <span>Cập nhật lần cuối: Hôm nay, 09:30</span>
          </div>
          <div>© 2024 Education Dashboard</div>
        </div>
      </div>
    </div>
  );
}