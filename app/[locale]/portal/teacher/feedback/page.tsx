"use client";

import { useMemo, useState, useEffect } from "react";
import {
  UserRound,
  Sparkles,
  Download,
  Send,
  FileAudio,
  Stars,
  Wand2,
  BookOpenCheck,
  ChevronDown,
  Filter,
  Search,
  MessageSquare,
  TrendingUp,
  Target,
  Zap,
  Crown,
  Award,
  Clock,
  CheckCircle,
  Eye,
  Share2,
  BarChart3,
  UserPlus,
  PieChart,
  MoreVertical,
} from "lucide-react";

type Feedback = {
  studentId: string;
  studentName: string;
  avatar?: string;
  month: string;
  achievements: string[];
  improvement: string[];
  homeworkRate: number;
  attendanceRate: number;
  participation: number;
  progress: number;
  teacherComment?: string;
  class: string;
  color: string;
};

const FEEDBACKS: Feedback[] = [
  {
    studentId: "HV001",
    studentName: "Nguyễn Văn An",
    month: "12/2024",
    achievements: [
      "Hoàn thành 100% bài tập tuần",
      "Chủ động phát biểu trong 3/4 buổi học",
      "Tiến bộ 25% điểm Speaking",
      "Nhận xét tốt từ giáo viên đối tác",
    ],
    improvement: [
      "Luyện phát âm âm /th/",
      "Tăng phản xạ nghe - trả lời",
      "Mở rộng vốn từ vựng học thuật",
    ],
    homeworkRate: 100,
    attendanceRate: 95,
    participation: 88,
    progress: 92,
    teacherComment: "Học sinh chăm chỉ, có tinh thần học tập rất tốt. Cần tập trung vào phát âm để hoàn thiện kỹ năng nói.",
    class: "IELTS Foundation - A1",
    color: "from-pink-500 to-rose-500",
  },
  {
    studentId: "HV002",
    studentName: "Trần Thị Bình",
    month: "12/2024",
    achievements: [
      "Hoàn thành bài thuyết trình nhóm xuất sắc",
      "Tiến bộ rõ rệt về từ vựng chủ đề du lịch",
      "Đạt điểm cao bài kiểm tra giữa kỳ",
      "Tích cực giúp đỡ bạn trong lớp",
    ],
    improvement: [
      "Duy trì thời gian nộp bài đúng hạn",
      "Trau dồi kỹ năng viết đoạn văn",
      "Tăng cường luyện nghe với tốc độ cao",
    ],
    homeworkRate: 90,
    attendanceRate: 88,
    participation: 92,
    progress: 85,
    teacherComment: "Học sinh có tiềm năng lớn, sáng tạo trong cách tiếp cận vấn đề. Cần chú ý hơn đến deadline.",
    class: "TOEIC Intermediate",
    color: "from-fuchsia-500 to-purple-500",
  },
  {
    studentId: "HV003",
    studentName: "Lê Văn Cường",
    month: "12/2024",
    achievements: [
      "Hoàn thành tất cả bài tập nâng cao",
      "Tham gia tích cực hoạt động nhóm",
      "Cải thiện điểm Writing 30%",
      "Được chọn làm nhóm trưởng",
    ],
    improvement: [
      "Cần tự tin hơn khi phát biểu",
      "Luyện kỹ năng nghe chi tiết",
      "Quản lý thời gian hiệu quả hơn",
    ],
    homeworkRate: 95,
    attendanceRate: 100,
    participation: 85,
    progress: 78,
    teacherComment: "Học sinh có nền tảng vững, cần phát huy sự tự tin trong giao tiếp.",
    class: "Business English",
    color: "from-amber-500 to-orange-500",
  },
  {
    studentId: "HV004",
    studentName: "Phạm Thị Dung",
    month: "12/2024",
    achievements: [
      "Điểm số ổn định tất cả bài kiểm tra",
      "Tham gia đầy đủ các buổi học bổ trợ",
      "Hoàn thành bài tập đúng hạn 100%",
      "Được nhận học bổng khuyến khích",
    ],
    improvement: [
      "Phát triển kỹ năng thuyết trình",
      "Mở rộng kiến thức văn hóa",
      "Luyện phản xạ trong hội thoại",
    ],
    homeworkRate: 98,
    attendanceRate: 96,
    participation: 90,
    progress: 88,
    teacherComment: "Học sinh chăm chỉ và có trách nhiệm cao, là tấm gương cho các bạn trong lớp.",
    class: "IELTS Foundation - A1",
    color: "from-emerald-500 to-teal-500",
  },
];

function StudentAvatar({ name, color }: { name: string; color: string }) {
  const initials = name
    .split(" ")
    .map(word => word[0])
    .slice(-2)
    .join("")
    .toUpperCase();

  return (
    <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r ${color} text-white font-bold text-sm shadow-lg`}>
      {initials}
    </div>
  );
}

function ProgressRing({ value, color, size = 12 }: { value: number; color: string; size?: number }) {
  const circumference = 2 * Math.PI * (size);
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative" style={{ width: size * 2 + 4, height: size * 2 + 4 }}>
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx={size + 2}
          cy={size + 2}
          r={size}
          stroke="currentColor"
          strokeWidth="2"
          fill="transparent"
          className="text-gray-200"
        />
        <circle
          cx={size + 2}
          cy={size + 2}
          r={size}
          stroke="currentColor"
          strokeWidth="2"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={`${color} transition-all duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-gray-900">{value}%</span>
      </div>
    </div>
  );
}

function MiniPieChart({ data }: { 
  data: Array<{ value: number; color: string; label: string }> 
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const size = 60;
  const center = size / 2;
  const radius = 20;
  const innerRadius = radius - 3;
  
  let currentAngle = -90;
  const arcs = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    
    const x1 = center + innerRadius * Math.cos(startAngleRad);
    const y1 = center + innerRadius * Math.sin(startAngleRad);
    const x2 = center + innerRadius * Math.cos(endAngleRad);
    const y2 = center + innerRadius * Math.sin(endAngleRad);
    
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    const pathData = `
      M ${x1} ${y1}
      A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}
    `;
    
    currentAngle = endAngle;
    
    return {
      path: pathData,
      color: item.color,
      value: item.value,
      percentage: percentage,
      label: item.label
    };
  });

  return (
    <div className="relative w-full">
      <div className="flex justify-center mb-6">
        <svg width={size} height={size} className="overflow-visible">
          {arcs.map((arc, index) => (
            <path
              key={index}
              d={arc.path}
              fill="none"
              stroke={arc.color}
              strokeWidth="6"
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          ))}
          {/* Center text */}
          <text
            x={center}
            y={center}
            textAnchor="middle"
            dy="0.3em"
            className="text-xs font-bold fill-gray-900"
          >
            {Math.round(total / data.length)}%
          </text>
        </svg>
      </div>
      
      {/* Legend dots - Below chart */}
      <div className="flex justify-center gap-2 flex-wrap">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-1">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[10px] text-gray-600 font-medium">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeedbackCard({ data }: { data: Feedback }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-6 space-y-4 transition-all duration-500 hover:shadow-xl hover:shadow-pink-100/30">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <StudentAvatar name={data.studentName} color={data.color} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-bold text-gray-900">{data.studentName}</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                ID: {data.studentId}
              </span>
            </div>
            <p className="text-sm text-gray-600">{data.class}</p>
            {data.teacherComment && (
              <p className="text-sm text-gray-700 mt-2 line-clamp-1">"{data.teacherComment}"</p>
            )}
          </div>
        </div>
        
        {/* Month and Expand Button */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-gray-500">Tháng</div>
            <div className="font-semibold text-gray-900">{data.month}</div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-pink-100 rounded-lg transition-colors"
          >
            <ChevronDown size={18} className={`text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Quick Stats - Modern Design */}
      <div className="grid grid-cols-4 gap-3">
        <div className="group relative p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 hover:border-emerald-300 transition-all hover:shadow-md">
          <div className="flex flex-col items-center text-center">
            <div className="p-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl mb-2 group-hover:scale-110 transition-transform">
              <BookOpenCheck size={18} className="text-white" />
            </div>
            <div className="text-2xl font-bold text-emerald-600 mb-1">{data.homeworkRate}%</div>
            <div className="text-xs font-medium text-gray-700">Bài tập</div>
            {data.homeworkRate >= 90 && (
              <div className="absolute -top-1 -right-1">
                <Sparkles size={12} className="text-emerald-500" />
              </div>
            )}
          </div>
        </div>
        
        <div className="group relative p-4 bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl border border-blue-200 hover:border-blue-300 transition-all hover:shadow-md">
          <div className="flex flex-col items-center text-center">
            <div className="p-2.5 bg-gradient-to-r from-blue-500 to-sky-500 rounded-xl mb-2 group-hover:scale-110 transition-transform">
              <Clock size={18} className="text-white" />
            </div>
            <div className="text-2xl font-bold text-blue-600 mb-1">{data.attendanceRate}%</div>
            <div className="text-xs font-medium text-gray-700">Chuyên cần</div>
            {data.attendanceRate >= 90 && (
              <div className="absolute -top-1 -right-1">
                <Sparkles size={12} className="text-blue-500" />
              </div>
            )}
          </div>
        </div>
        
        <div className="group relative p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 hover:border-amber-300 transition-all hover:shadow-md">
          <div className="flex flex-col items-center text-center">
            <div className="p-2.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl mb-2 group-hover:scale-110 transition-transform">
              <MessageSquare size={18} className="text-white" />
            </div>
            <div className="text-2xl font-bold text-amber-600 mb-1">{data.participation}%</div>
            <div className="text-xs font-medium text-gray-700">Tham gia</div>
            {data.participation >= 90 && (
              <div className="absolute -top-1 -right-1">
                <Sparkles size={12} className="text-amber-500" />
              </div>
            )}
          </div>
        </div>
        
        <div className="group relative p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl border border-pink-200 hover:border-pink-300 transition-all hover:shadow-md">
          <div className="flex flex-col items-center text-center">
            <div className="p-2.5 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl mb-2 group-hover:scale-110 transition-transform">
              <TrendingUp size={18} className="text-white" />
            </div>
            <div className="text-2xl font-bold text-pink-600 mb-1">{data.progress}%</div>
            <div className="text-xs font-medium text-gray-700">Tiến bộ</div>
            {data.progress >= 90 && (
              <div className="absolute -top-1 -right-1">
                <Sparkles size={12} className="text-pink-500" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="space-y-4 pt-4 border-t border-pink-200 animate-fadeIn">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                  <Stars size={16} className="text-white" />
                </div>
                <h4 className="font-semibold text-emerald-900">Thành tích nổi bật</h4>
              </div>
              <ul className="space-y-2">
                {data.achievements.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-emerald-800">
                    <CheckCircle size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
                  <Target size={16} className="text-white" />
                </div>
                <h4 className="font-semibold text-amber-900">Mục tiêu cải thiện</h4>
              </div>
              <ul className="space-y-2">
                {data.improvement.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-amber-800">
                    <Sparkles size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Detailed Stats - Modern Cards */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-5 text-center hover:shadow-lg transition-all">
              <div className="inline-flex p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl mb-3">
                <BookOpenCheck size={20} className="text-white" />
              </div>
              <div className="text-3xl font-bold text-emerald-600 mb-1">{data.homeworkRate}%</div>
              <div className="text-sm font-medium text-gray-700">Bài tập</div>
              <div className="mt-3 flex items-center justify-center gap-1">
                {data.homeworkRate >= 90 ? (
                  <>
                    <Award size={14} className="text-emerald-500" />
                    <span className="text-xs text-emerald-600 font-medium">Xuất sắc</span>
                  </>
                ) : data.homeworkRate >= 80 ? (
                  <span className="text-xs text-emerald-600 font-medium">Tốt</span>
                ) : (
                  <span className="text-xs text-gray-500">Cần cải thiện</span>
                )}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl border border-blue-200 p-5 text-center hover:shadow-lg transition-all">
              <div className="inline-flex p-3 bg-gradient-to-r from-blue-500 to-sky-500 rounded-xl mb-3">
                <Clock size={20} className="text-white" />
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-1">{data.attendanceRate}%</div>
              <div className="text-sm font-medium text-gray-700">Chuyên cần</div>
              <div className="mt-3 flex items-center justify-center gap-1">
                {data.attendanceRate >= 90 ? (
                  <>
                    <Award size={14} className="text-blue-500" />
                    <span className="text-xs text-blue-600 font-medium">Xuất sắc</span>
                  </>
                ) : data.attendanceRate >= 80 ? (
                  <span className="text-xs text-blue-600 font-medium">Tốt</span>
                ) : (
                  <span className="text-xs text-gray-500">Cần cải thiện</span>
                )}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-5 text-center hover:shadow-lg transition-all">
              <div className="inline-flex p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl mb-3">
                <MessageSquare size={20} className="text-white" />
              </div>
              <div className="text-3xl font-bold text-amber-600 mb-1">{data.participation}%</div>
              <div className="text-sm font-medium text-gray-700">Tham gia</div>
              <div className="mt-3 flex items-center justify-center gap-1">
                {data.participation >= 90 ? (
                  <>
                    <Award size={14} className="text-amber-500" />
                    <span className="text-xs text-amber-600 font-medium">Xuất sắc</span>
                  </>
                ) : data.participation >= 80 ? (
                  <span className="text-xs text-amber-600 font-medium">Tốt</span>
                ) : (
                  <span className="text-xs text-gray-500">Cần cải thiện</span>
                )}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl border border-pink-200 p-5 text-center hover:shadow-lg transition-all">
              <div className="inline-flex p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl mb-3">
                <TrendingUp size={20} className="text-white" />
              </div>
              <div className="text-3xl font-bold text-pink-600 mb-1">{data.progress}%</div>
              <div className="text-sm font-medium text-gray-700">Tiến bộ</div>
              <div className="mt-3 flex items-center justify-center gap-1">
                {data.progress >= 90 ? (
                  <>
                    <Crown size={14} className="text-pink-500" />
                    <span className="text-xs text-pink-600 font-medium">Xuất sắc</span>
                  </>
                ) : data.progress >= 80 ? (
                  <span className="text-xs text-pink-600 font-medium">Tốt</span>
                ) : (
                  <span className="text-xs text-gray-500">Cần cải thiện</span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2.5 text-sm font-medium hover:shadow-lg transition-all">
              <Download size={16} />
              Xuất PDF
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-sky-500 text-white px-4 py-2.5 text-sm font-medium hover:shadow-lg transition-all">
              <Send size={16} />
              Gửi Zalo
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white text-gray-700 px-4 py-2.5 text-sm font-medium hover:bg-pink-50 transition-all">
              <Eye size={16} />
              Xem chi tiết
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white text-gray-700 px-4 py-2.5 text-sm font-medium hover:bg-pink-50 transition-all">
              <Share2 size={16} />
              Chia sẻ
            </button>
          </div>
        </div>
      )}

      {/* Collapsed Actions */}
      {!isExpanded && (
        <div className="flex items-center justify-between pt-2 border-t border-pink-200">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">Đánh giá:</span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                data.progress >= 90 ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white" :
                data.progress >= 80 ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white" :
                "bg-gradient-to-r from-pink-500 to-rose-500 text-white"
              }`}>
                {data.progress >= 90 ? "Xuất sắc" : data.progress >= 80 ? "Tốt" : "Khá"}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <PieChart size={10} />
              <span>Tổng: {Math.round((data.homeworkRate + data.attendanceRate + data.participation + data.progress) / 4)}%</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="text-xs text-pink-600 font-medium hover:text-pink-700 flex items-center gap-1">
              Xem đầy đủ
              <ChevronDown size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// New Component for Overall Stats Pie Chart
function OverallStatsPieChart({ stats }: { stats: any }) {
  if (!stats) return null;

  const pieData = [
    { value: stats.avgHomework, label: "Bài tập", color: "#10b981" },
    { value: stats.avgAttendance, label: "Chuyên cần", color: "#3b82f6" },
    { value: stats.avgProgress, label: "Tiến bộ", color: "#ec4899" },
  ];

  const total = pieData.reduce((sum, item) => sum + item.value, 0);
  const average = Math.round(total / pieData.length);

  return (
    <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl border border-purple-200 p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-lg">
          <PieChart size={18} className="text-white" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Thống kê trung bình</h3>
          <p className="text-xs text-gray-600">Toàn bộ học viên</p>
        </div>
      </div>
      
      <div className="flex items-center justify-center">
        <div className="relative">
          <div className="w-32 h-32">
            <svg width="100%" height="100%" viewBox="0 0 100 100">
              {(() => {
                let currentAngle = -90;
                return pieData.map((item, index) => {
                  const percentage = (item.value / total) * 100;
                  const angle = (percentage / 100) * 360;
                  const startAngle = currentAngle;
                  const endAngle = currentAngle + angle;
                  
                  const startAngleRad = (startAngle * Math.PI) / 180;
                  const endAngleRad = (endAngle * Math.PI) / 180;
                  
                  const x1 = 50 + 40 * Math.cos(startAngleRad);
                  const y1 = 50 + 40 * Math.sin(startAngleRad);
                  const x2 = 50 + 40 * Math.cos(endAngleRad);
                  const y2 = 50 + 40 * Math.sin(endAngleRad);
                  
                  const largeArcFlag = angle > 180 ? 1 : 0;
                  
                  currentAngle = endAngle;
                  
                  return (
                    <path
                      key={index}
                      d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                      fill={item.color}
                      className="transition-all duration-1000"
                    />
                  );
                });
              })()}
              <circle cx="50" cy="50" r="20" fill="white" />
            </svg>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{average}%</div>
              <div className="text-xs text-gray-500">Trung bình</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 mt-4">
        {pieData.map((item, index) => (
          <div key={index} className="text-center">
            <div className="text-lg font-bold" style={{ color: item.color }}>
              {item.value}%
            </div>
            <div className="text-xs text-gray-600">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TeacherFeedbackPage() {
  const [month, setMonth] = useState("12/2024");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>("ALL");

  const list = useMemo(() => {
    let filtered = FEEDBACKS.filter((f) => f.month === month);
    
    if (selectedClass !== "ALL") {
      filtered = filtered.filter(f => f.class.includes(selectedClass));
    }
    
    if (searchQuery) {
      filtered = filtered.filter(f => 
        f.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.class.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [month, searchQuery, selectedClass]);

  const classes = Array.from(new Set(FEEDBACKS.map(f => f.class)));

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  const overallStats = useMemo(() => {
    if (list.length === 0) return null;
    
    return {
      avgHomework: Math.round(list.reduce((sum, f) => sum + f.homeworkRate, 0) / list.length),
      avgAttendance: Math.round(list.reduce((sum, f) => sum + f.attendanceRate, 0) / list.length),
      avgProgress: Math.round(list.reduce((sum, f) => sum + f.progress, 0) / list.length),
      topStudent: list.reduce((max, f) => f.progress > max.progress ? f : max, list[0]),
    };
  }, [list]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
            <MessageSquare size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Feedback Học viên
            </h1>
            <p className="text-gray-600 mt-1">
              Tổng hợp báo cáo từng học viên, gửi phụ huynh sau khi quản lý duyệt.
            </p>
          </div>
        </div>

        {/* Stats Overview with Pie Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
          {overallStats && (
            <>
              <OverallStatsPieChart stats={overallStats} />
              
              <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Học viên đánh giá</div>
                    <div className="text-2xl font-bold mt-2 text-gray-900">{list.length}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-pink-100">
                    <UserRound size={24} className="text-pink-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-white to-emerald-50 rounded-2xl border border-emerald-200 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Tiến bộ cao nhất</div>
                    <div className="text-2xl font-bold mt-2 text-emerald-600">{overallStats.avgProgress}%</div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-100">
                    <TrendingUp size={24} className="text-emerald-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl border border-blue-200 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Tỉ lệ hoàn thành</div>
                    <div className="text-2xl font-bold mt-2 text-blue-600">
                      {list.filter(f => f.homeworkRate >= 80).length}/{list.length}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-100">
                    <CheckCircle size={24} className="text-blue-600" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Top Student Highlight */}
        {overallStats?.topStudent && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-5 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <StudentAvatar name={overallStats.topStudent.studentName} color={overallStats.topStudent.color} />
                  <div className="absolute -top-1 -right-1 p-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full">
                    <Crown size={12} className="text-white" />
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Học viên xuất sắc tháng</div>
                  <div className="text-xl font-bold text-gray-900">{overallStats.topStudent.studentName}</div>
                  <div className="text-sm text-gray-700">{overallStats.topStudent.class}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-600">{overallStats.topStudent.progress}%</div>
                  <div className="text-xs text-gray-600">Đánh giá tổng thể</div>
                </div>
                <Award size={32} className="text-amber-500" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 overflow-hidden">
        {/* Filters and Actions */}
        <div className="px-6 pt-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap items-center gap-2">
              {["12/2024", "11/2024", "10/2024", "09/2024"].map((m) => (
                <button
                  key={m}
                  onClick={() => setMonth(m)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                    m === month
                      ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md"
                      : "bg-white border border-pink-200 text-gray-700 hover:bg-pink-50"
                  }`}
                >
                  Tháng {m}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-3">
              <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2.5 text-sm font-medium hover:shadow-lg transition-all">
                <UserPlus size={16} />
                Thêm đánh giá mới
              </button>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-white border border-pink-200 pl-12 pr-4 py-3.5 text-gray-900 outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all"
                placeholder="Tìm kiếm học viên, ID hoặc lớp..."
              />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="appearance-none rounded-xl bg-white border border-pink-200 pl-4 pr-10 py-3.5 text-gray-900 outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all"
                >
                  <option value="ALL">Tất cả lớp</option>
                  {classes.map((cls) => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              
              <button className="p-3.5 rounded-xl bg-white border border-pink-200 hover:bg-pink-50 transition-colors">
                <Filter size={18} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Feedback List */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">
              Danh sách feedback
              <span className="text-pink-600 ml-2">({list.length})</span>
            </h3>
            {list.length > 0 && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-gray-600">Bài tập: {overallStats?.avgHomework}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-gray-600">Chuyên cần: {overallStats?.avgAttendance}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {list.length > 0 ? (
            <div className="space-y-4">
              {list.map((item) => (
                <FeedbackCard key={item.studentId} data={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex p-4 bg-gradient-to-r from-pink-100 to-rose-100 rounded-2xl mb-4">
                <Search size={32} className="text-pink-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Không tìm thấy feedback
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Thử thay đổi tháng hoặc từ khóa tìm kiếm để xem kết quả.
              </p>
            </div>
          )}
        </div>

        {/* AI Tools Section */}
        <div className="px-6 pb-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-white to-emerald-50 rounded-2xl border border-emerald-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl">
                  <Wand2 size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Tạo nhận xét bằng AI</h3>
                  <p className="text-sm text-gray-600">Smart suggestions powered by AI</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-700 mb-4">
                Sao chép nhận xét từ lớp học, gửi sang AI để tạo bản nháp và đồng bộ lại chỉ với một nút bấm.
              </p>
              
              <div className="space-y-3">
                <div className="p-3 bg-white border border-emerald-200 rounded-xl">
                  <div className="text-xs text-gray-600">Mẫu gợi ý từ AI</div>
                  <div className="text-sm text-gray-900 mt-1">"{list[0]?.teacherComment || "Học sinh có tiến bộ rõ rệt trong tháng này..."}"</div>
                </div>
                
                <button className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 font-medium hover:shadow-lg transition-all">
                  <Zap size={16} />
                  Đồng bộ từ AI
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl border border-blue-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-sky-500 rounded-xl">
                  <FileAudio size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Lưu trữ và chia sẻ</h3>
                  <p className="text-sm text-gray-600">Export & Share reports</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-700 mb-4">
                Sau khi quản lý duyệt, báo cáo sẽ tự động hiển thị cho phụ huynh và được xuất thành file riêng từng học viên.
              </p>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white border border-blue-200 rounded-xl text-center">
                    <div className="text-2xl font-bold text-blue-600">{list.length}</div>
                    <div className="text-xs text-gray-600">Báo cáo sẵn sàng</div>
                  </div>
                  <div className="p-3 bg-white border border-blue-200 rounded-xl text-center">
                    <div className="text-2xl font-bold text-blue-600">5</div>
                    <div className="text-xs text-gray-600">Đã gửi phụ huynh</div>
                  </div>
                </div>
                
                <button className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-sky-500 text-white py-3 font-medium hover:shadow-lg transition-all">
                  <Download size={16} />
                  Xuất file gửi quản lý
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}