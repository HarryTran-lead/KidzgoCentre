"use client";

import { useState } from "react";
import { 
  FileCheck, 
  BarChart3, 
  FileText, 
  Download, 
  PieChart, 
  TrendingUp, 
  Users, 
  BookOpen,
  Target,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Eye,
  Award,
  Clock,
  TrendingDown,
  Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/lightswind/card";
import { Button } from "@/components/lightswind/button";

type TabType = "placement" | "periodic" | "monthly" | "history";

const MOCK_TEST_RESULTS = [
  {
    id: "1",
    name: "Mid-term Test - December",
    date: "15/12/2024",
    score: 85,
    maxScore: 100,
    grade: "A",
    subjects: [
      { name: "Reading", score: 90, max: 100 },
      { name: "Writing", score: 80, max: 100 },
      { name: "Listening", score: 85, max: 100 },
      { name: "Speaking", score: 85, max: 100 },
    ],
  },
  {
    id: "2",
    name: "Progress Test Unit 5",
    date: "08/12/2024",
    score: 42,
    maxScore: 50,
    grade: "B+",
    subjects: [
      { name: "Grammar", score: 45, max: 50 },
      { name: "Vocabulary", score: 40, max: 50 },
    ],
  },
  {
    id: "3",
    name: "Speaking Assessment",
    date: "05/12/2024",
    score: 88,
    maxScore: 100,
    grade: "A",
    subjects: [
      { name: "Fluency", score: 90, max: 100 },
      { name: "Pronunciation", score: 85, max: 100 },
      { name: "Vocabulary", score: 88, max: 100 },
    ],
  },
  {
    id: "4",
    name: "Writing Test",
    date: "01/12/2024",
    score: 78,
    maxScore: 100,
    grade: "B",
    subjects: [
      { name: "Grammar", score: 75, max: 100 },
      { name: "Structure", score: 80, max: 100 },
      { name: "Content", score: 78, max: 100 },
    ],
  },
];

const MOCK_MONTHLY_REPORTS = [
  {
    month: "Tháng 12/2024",
    attendance: 95,
    homework: 90,
    participation: 88,
    overall: "Xuất sắc",
    comments:
      "Học viên có sự tiến bộ rõ rệt trong kỹ năng Speaking. Cần rèn luyện thêm về Writing.",
  },
  {
    month: "Tháng 11/2024",
    attendance: 90,
    homework: 85,
    participation: 85,
    overall: "Tốt",
    comments: "Học viên tham gia tích cực và hoàn thành tốt các bài tập.",
  },
  {
    month: "Tháng 10/2024",
    attendance: 88,
    homework: 82,
    participation: 80,
    overall: "Khá",
    comments: "Cần cải thiện kỹ năng Listening và Speaking.",
  },
  {
    month: "Tháng 09/2024",
    attendance: 92,
    homework: 88,
    participation: 85,
    overall: "Tốt",
    comments: "Học viên có tiến bộ trong kỹ năng Reading.",
  },
];

// Badge Component
function Badge({
  color = "gray",
  children
}: {
  color?: "gray" | "red" | "black";
  children: React.ReactNode;
}) {
  const colorClasses = {
    gray: "bg-gray-100 text-gray-700 border border-gray-200",
    red: "bg-red-50 text-red-700 border border-red-200",
    black: "bg-gray-900 text-white border border-gray-800"
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colorClasses[color]}`}>
      {children}
    </span>
  );
}

// Simple Pie Chart Component
function SimplePieChart({ value, max = 100, size = 60, color = "red" }: { value: number; max?: number; size?: number; color?: string }) {
  const percentage = (value / max) * 100;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  const colorClass = color === "red" ? "text-red-600" : "text-gray-700";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color === "red" ? "#dc2626" : "#374151"}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${colorClass}`}>
        {Math.round(percentage)}%
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  hint,
  trend = "up",
  color = "red",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  trend?: "up" | "down" | "stable";
  color?: "red" | "gray" | "black";
}) {
  const colorClasses = {
    red: "bg-gradient-to-r from-red-600 to-red-700",
    gray: "bg-gradient-to-r from-gray-600 to-gray-700",
    black: "bg-gradient-to-r from-gray-800 to-gray-900"
  };

  const trendColors = {
    up: "text-red-600",
    down: "text-gray-600",
    stable: "text-gray-800"
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-red-300 transition-all cursor-pointer">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600">{label}</div>
          <div className="text-2xl font-bold mt-2 text-gray-900">{value}</div>
          <div className={`text-xs flex items-center gap-1 mt-1 ${trendColors[trend]}`}>
            {trend === "up" && <TrendingUp size={12} />}
            {trend === "down" && <TrendingDown size={12} />}
            {trend === "stable" && <Activity size={12} />}
            {hint}
          </div>
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]} text-white shadow-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function TestsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("periodic");

  // Calculate stats
  const totalTests = MOCK_TEST_RESULTS.length;
  const averageScore = (MOCK_TEST_RESULTS.reduce((acc, test) => acc + (test.score / test.maxScore * 100), 0) / totalTests).toFixed(1);
  const bestScore = Math.max(...MOCK_TEST_RESULTS.map(test => (test.score / test.maxScore * 100)));
  const totalReports = MOCK_MONTHLY_REPORTS.length;
  const averageAttendance = (MOCK_MONTHLY_REPORTS.reduce((acc, report) => acc + report.attendance, 0) / totalReports).toFixed(1);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
          <BarChart3 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Kiểm tra & Báo cáo
          </h1>
          <p className="text-sm text-gray-600">
            Theo dõi kết quả kiểm tra và báo cáo học tập
          </p>
        </div>
      </div>

      {/* Stats Cards - 4 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<FileCheck size={20} />}
          label="Tổng bài kiểm tra"
          value={totalTests.toString()}
          hint="+2 bài trong tháng 12"
          trend="up"
          color="red"
        />
        <StatCard
          icon={<Target size={20} />}
          label="Điểm trung bình"
          value={`${averageScore}%`}
          hint="Tăng 5% so với tháng trước"
          trend="up"
          color="gray"
        />
        <StatCard
          icon={<Award size={20} />}
          label="Điểm cao nhất"
          value={`${bestScore}%`}
          hint="Bài Mid-term Test"
          trend="up"
          color="black"
        />
        <StatCard
          icon={<Users size={20} />}
          label="Báo cáo tháng"
          value={totalReports.toString()}
          hint={`Tỉ lệ điểm danh TB: ${averageAttendance}%`}
          trend="stable"
          color="red"
        />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <TabButton active={activeTab === "placement"} onClick={() => setActiveTab("placement")}>
          <FileCheck className="w-4 h-4" />
          Placement Test
        </TabButton>
        <TabButton active={activeTab === "periodic"} onClick={() => setActiveTab("periodic")}>
          <BarChart3 className="w-4 h-4" />
          Kiểm tra định kỳ
        </TabButton>
        <TabButton active={activeTab === "monthly"} onClick={() => setActiveTab("monthly")}>
          <PieChart className="w-4 h-4" />
          Báo cáo tháng
        </TabButton>
        <TabButton active={activeTab === "history"} onClick={() => setActiveTab("history")}>
          <FileText className="w-4 h-4" />
          Lịch sử báo cáo
        </TabButton>
      </div>

      {/* Content - Grid 3 columns */}
      {activeTab === "placement" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border-gray-200 shadow-sm col-span-1 md:col-span-2 lg:col-span-3">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                <FileCheck className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có Placement Test</h3>
              <p className="text-sm text-gray-600 mb-4">Liên hệ giáo viên để được hỗ trợ</p>
              <Button className="bg-gradient-to-r from-red-600 to-red-700 text-white">
                <Calendar className="w-4 h-4 mr-2" />
                Đặt lịch kiểm tra
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "periodic" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_TEST_RESULTS.map((test) => (
            <Card key={test.id} className="border-gray-200 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="p-3 border-b border-gray-200 bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 bg-white rounded-lg border border-gray-200 flex-shrink-0">
                      <BarChart3 className="w-4 h-4 text-gray-700" />
                    </div>
                    <div className="truncate">
                      <h3 className="font-semibold text-sm text-gray-900 truncate">{test.name}</h3>
                      <p className="text-xs text-gray-500">{test.date}</p>
                    </div>
                  </div>
                  <Badge color={test.grade.startsWith("A") ? "red" : "black"}>
                    {test.grade}
                  </Badge>
                </div>
              </div>

              {/* Body */}
              <CardContent className="p-3 space-y-3">
                {/* Overall Score */}
                <div className="flex items-center gap-3">
                  <SimplePieChart value={test.score} max={test.maxScore} size={60} color="red" />
                  <div>
                    <div className="text-xs text-gray-500">Tổng điểm</div>
                    <div className="text-lg font-bold text-gray-900">
                      {test.score}/{test.maxScore}
                    </div>
                  </div>
                </div>

                {/* Subjects */}
                <div className="grid grid-cols-2 gap-2">
                  {test.subjects.slice(0, 4).map((subject, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-xs text-gray-600 truncate mr-1">{subject.name}</span>
                      <span className="text-xs font-bold text-red-600 flex-shrink-0">{subject.score}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button size="sm" className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white h-8 text-xs">
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    Xem chi tiết
                  </Button>
                  <Button size="sm" variant="outline" className="border-gray-200 h-8 w-8 p-0">
                    <Download className="w-3.5 h-3.5 text-gray-600" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "monthly" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_MONTHLY_REPORTS.map((report, idx) => (
            <Card key={idx} className="border-gray-200 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="p-3 border-b border-gray-200 bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white rounded-lg border border-gray-200">
                    <PieChart className="w-4 h-4 text-gray-700" />
                  </div>
                  <h3 className="font-semibold text-sm text-gray-900">{report.month}</h3>
                </div>
              </div>

              {/* Body */}
              <CardContent className="p-3 space-y-3">
                {/* Stats with Pie Charts */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center">
                    <SimplePieChart value={report.attendance} size={50} color="gray" />
                    <div className="text-xs text-gray-500 mt-1">Điểm danh</div>
                  </div>
                  <div className="text-center">
                    <SimplePieChart value={report.homework} size={50} color="red" />
                    <div className="text-xs text-gray-500 mt-1">Bài tập</div>
                  </div>
                  <div className="text-center">
                    <SimplePieChart value={report.participation} size={50} color="gray" />
                    <div className="text-xs text-gray-500 mt-1">Tham gia</div>
                  </div>
                  <div className="text-center">
                    <div className="w-[50px] h-[50px] mx-auto bg-red-50 rounded-full flex items-center justify-center border border-red-200">
                      <span className="text-sm font-bold text-red-600">
                        {report.overall === "Xuất sắc" ? "A" : report.overall === "Tốt" ? "B" : "C"}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Đánh giá</div>
                  </div>
                </div>

                {/* Comments */}
                <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-600 line-clamp-2">{report.comments}</p>
                </div>

                {/* Action */}
                <Button size="sm" className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white h-8 text-xs">
                  <Download className="w-3.5 h-3.5 mr-1" />
                  Tải báo cáo PDF
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "history" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border-gray-200 shadow-sm col-span-1 md:col-span-2 lg:col-span-3">
            <CardHeader className="p-4 border-b border-gray-200">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <FileText className="w-5 h-5 text-gray-700" />
                Lịch sử báo cáo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <HistoryItem title="Báo cáo tháng 12/2024" date="31/12/2024" size="2.4 MB" />
              <HistoryItem title="Báo cáo tháng 11/2024" date="30/11/2024" size="2.1 MB" />
              <HistoryItem title="Báo cáo tháng 10/2024" date="31/10/2024" size="2.3 MB" />
              <HistoryItem title="Báo cáo tháng 09/2024" date="30/09/2024" size="2.0 MB" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-red-600" />
            <span>Cập nhật 09:30</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-600"></div>
              <span>A</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-gray-600"></div>
              <span>B</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-gray-900"></div>
              <span>C</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({
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
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer flex items-center gap-2 ${
        active
          ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
          : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );
}

function HistoryItem({ title, date, size }: { title: string; date: string; size: string }) {
  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
          <FileText className="w-4 h-4 text-gray-600" />
        </div>
        <div className="truncate">
          <h4 className="text-sm font-medium text-gray-900 truncate">{title}</h4>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{date}</span>
            <span>•</span>
            <span>{size}</span>
          </div>
        </div>
      </div>
      <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-gray-200 flex-shrink-0">
        <Download className="w-4 h-4 text-gray-600" />
      </Button>
    </div>
  );
}