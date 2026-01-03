"use client";

import { useState } from "react";
import {
  BookOpen,
  Target,
  FileText,
  CheckCircle,
  Clock,
  Award,
  TrendingUp,
  Calendar,
  BarChart3,
  Users,
  Star,
  Play,
  Volume2,
  Home,
} from "lucide-react";

// Tab Types
type ReportTab = "lesson" | "progress" | "monthly";

// Lesson Report Types
interface LessonReport {
  id: string;
  lessonTitle: string;
  unit: string;
  date: string;
  time: string;
  teacher: string;
  status: "Lớp học trực tiếp" | "Bài học online";
  progress: number;
  learningObjectives: {
    en: string[];
    vn: string[];
  };
  audio: Array<{ title: string; url: string }>;
  teacherComments: Array<{
    teacher: string;
    content: string;
    translation?: string;
  }>;
  vocabulary: {
    title: string;
    words: string[];
  };
  skills: Array<{ skill: string; pages: string }>;
  homeActivities: {
    activeHomeLearning: boolean;
    workbookPages: string;
    digitalHomeLearning: string;
  };
}

// Progress Report Types  
interface ProgressReport {
  currentUnit: string;
  overallProgress: number;
  skills: Array<{
    name: string;
    level: number;
    progress: number;
  }>;
  recentScores: Array<{
    subject: string;
    score: number;
    date: string;
  }>;
  strengths: string[];
  improvements: string[];
}

// Monthly Summary Types
interface MonthlySummary {
  month: string;
  year: number;
  grade: string;
  attendance: number;
  avgScore: number;
  lessonsCompleted: number;
  totalLessons: number;
}

// Sample Data
const SAMPLE_LESSON_REPORTS: LessonReport[] = [
  {
    id: "1",
    lessonTitle: "Primary Starter - Lesson 22 report",
    unit: "Unit 6: I Like Food - Unit Opener & Vocabulary",
    date: "31 Thg 08 2025",
    time: "17:00 - 19:00",
    teacher: "Jack",
    status: "Lớp học trực tiếp",
    progress: 14,
    learningObjectives: {
      en: [
        "I can identify and name the food vocabulary: bananas, biscuits, bread, chicken, milk, noodles, orange juice, rice, water.",
        "I can recognise and write the vocabulary related to food.",
        "I can apply my critical thinking skills to a range of tasks.",
      ],
      vn: [
        "Con có thể nhận biết và nêu tên các từ vựng về thức ăn: bananas, biscuits, bread, chicken, milk, noodles, orange juice, rice, water.",
        "Con có thể nhận biết và viết các từ liên quan đến thức ăn.",
        "Con có thể áp dụng kỹ năng tư duy phản biện trong các bài tập khác nhau.",
      ],
    },
    audio: [
      { title: "PRESTA - TR: 6.11", url: "#" },
      { title: "PRESTA - WB - TR: 6.1", url: "#" },
    ],
    teacherComments: [
      {
        teacher: "Dela Cruz Melissa",
        content:
          "I can identify and name the food vocabulary: bananas, biscuits, bread, chicken, milk, noodles, orange juice, rice, water independently.",
        translation:
          "Con có thể tự nhận biết và gọi tên các từ vựng về đồ ăn: chuối, bánh quy, bánh mì, thịt gà, sữa, mì, nước cam, nước.",
      },
    ],
    vocabulary: {
      title: "Food & drink",
      words: ["bananas", "biscuits", "bread", "chicken", "milk", "noodles", "orange", "juice", "rice", "water"],
    },
    skills: [{ skill: "Speaking", pages: "52-55" }],
    homeActivities: {
      activeHomeLearning: true,
      workbookPages: "27",
      digitalHomeLearning: "OLP: Unit 6, Vocabulary",
    },
  },
];

const SAMPLE_PROGRESS: ProgressReport = {
  currentUnit: "Unit 6: I Like Food",
  overallProgress: 67,
  skills: [
    { name: "Nghe", level: 8, progress: 80 },
    { name: "Nói", level: 7, progress: 70 },
    { name: "Đọc", level: 9, progress: 90 },
    { name: "Viết", level: 7, progress: 65 },
  ],
  recentScores: [
    { subject: "Vocabulary Test", score: 9.0, date: "20/12/2024" },
    { subject: "Speaking Test", score: 8.5, date: "15/12/2024" },
    { subject: "Writing Test", score: 7.5, date: "10/12/2024" },
  ],
  strengths: ["Phát âm chuẩn", "Từ vựng phong phú", "Tích cực trong lớp"],
  improvements: ["Cần luyện viết nhiều hơn", "Cải thiện ngữ pháp"],
};

const SAMPLE_MONTHLY_SUMMARIES: MonthlySummary[] = [
  {
    month: "12",
    year: 2024,
    grade: "A",
    attendance: 95,
    avgScore: 8.5,
    lessonsCompleted: 16,
    totalLessons: 20,
  },
  {
    month: "11",
    year: 2024,
    grade: "B+",
    attendance: 92,
    avgScore: 8.0,
    lessonsCompleted: 15,
    totalLessons: 20,
  },
];

// Lesson Report Component
function LessonReportCard({ report }: { report: LessonReport }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm max-w-4xl mx-auto">
      {/* Header with avatar */}
      <div className="bg-linear-to-r from-amber-50 to-orange-50 p-6 rounded-t-xl border-b border-slate-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Báo cáo học tập</div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">{report.lessonTitle}</h2>
            <div className="text-sm text-slate-600">{report.unit}</div>
            <div className="flex items-center gap-3 mt-3 text-sm text-slate-600">
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {report.time}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {report.date}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full text-sm">
                <Users size={14} className="text-blue-600" />
                <span className="text-slate-700">{report.teacher}</span>
              </div>
              <span className="px-3 py-1 bg-amber-500 text-white rounded-full text-xs font-medium">
                {report.status}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-20 h-20 bg-amber-400 rounded-full flex items-center justify-center text-4xl">
              🐶
            </div>
            <div className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold">A</div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-6">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Learning Objectives */}
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="text-blue-600" size={18} />
              <h3 className="font-semibold text-slate-900">Learning Objectives</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <div className="font-medium text-slate-700 mb-1">EN</div>
                <ul className="space-y-1 ml-4">
                  {report.learningObjectives.en.map((obj, i) => (
                    <li key={i} className="text-slate-600 text-xs list-disc">{obj}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="font-medium text-slate-700 mb-1">VN</div>
                <ul className="space-y-1 ml-4">
                  {report.learningObjectives.vn.map((obj, i) => (
                    <li key={i} className="text-slate-600 text-xs list-disc">{obj}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Vocabulary */}
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="text-purple-600" size={18} />
              <h3 className="font-semibold text-slate-900">Nội dung bài học</h3>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-700 mb-2">{report.vocabulary.title}</div>
              <div className="grid grid-cols-2 gap-2">
                {report.vocabulary.words.map((word, i) => (
                  <div key={i} className="flex items-center gap-1 text-sm text-slate-600">
                    <span className="text-blue-500">•</span>
                    <span>{word}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="text-emerald-600" size={18} />
              <h3 className="font-semibold text-slate-900">Kỹ năng</h3>
            </div>
            {report.skills.map((skill, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="text-slate-700">{skill.skill}</span>
                <span className="text-slate-600">Sách giáo khoa trang: {skill.pages}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Audio */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <Volume2 className="text-blue-600" size={18} />
              <h3 className="font-semibold text-slate-900">Audio</h3>
            </div>
            <div className="space-y-2">
              {report.audio.map((audio, i) => (
                <button
                  key={i}
                  className="w-full flex items-center justify-between p-2 bg-white rounded-lg hover:bg-blue-50 transition text-sm"
                >
                  <span className="text-slate-700">{audio.title}</span>
                  <Play size={16} className="text-blue-600" />
                </button>
              ))}
            </div>
          </div>

          {/* Teacher Comments */}
          <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
            <div className="flex items-center gap-2 mb-3">
              <Users className="text-emerald-600" size={18} />
              <h3 className="font-semibold text-slate-900">Đánh giá của giáo viên</h3>
            </div>
            {report.teacherComments.map((comment, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white grid place-items-center text-sm font-medium shrink-0">
                    {comment.teacher.split(" ")[0][0]}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-emerald-700 mb-1">{comment.teacher}</div>
                    <p className="text-xs text-slate-700 mb-2">{comment.content}</p>
                    {comment.translation && (
                      <p className="text-xs text-slate-600 italic">{comment.translation}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Home Activities */}
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
            <div className="flex items-center gap-2 mb-3">
              <Home className="text-amber-600" size={18} />
              <h3 className="font-semibold text-slate-900">Hoạt động ở nhà</h3>
            </div>
            <div className="space-y-2 text-sm">
              {report.homeActivities.activeHomeLearning && (
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle size={16} />
                  <span className="font-medium">Active Home Learning</span>
                </div>
              )}
              <div className="text-slate-700">
                <span className="font-medium">Sách bài tập trang:</span> {report.homeActivities.workbookPages}
              </div>
              <div className="text-slate-700">
                <span className="font-medium">Digital Home Learning:</span>{" "}
                {report.homeActivities.digitalHomeLearning}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-linear-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Tiến độ bài học</span>
              <span className="text-sm font-bold text-blue-600">{report.progress}%</span>
            </div>
            <div className="w-full h-3 bg-white rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-blue-500 to-purple-500 transition-all"
                style={{ width: `${report.progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Current Progress Component
function CurrentProgressView({ progress }: { progress: ProgressReport }) {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Current Unit Card */}
      <div className="rounded-xl border border-slate-200 bg-linear-to-br from-blue-50 to-indigo-50 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-slate-600 mb-1">Đơn vị học hiện tại</div>
            <h3 className="text-2xl font-bold text-slate-900">{progress.currentUnit}</h3>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600">{progress.overallProgress}%</div>
            <div className="text-sm text-slate-600">Hoàn thành</div>
          </div>
        </div>
        <div className="w-full h-4 bg-white rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-blue-500 to-indigo-600"
            style={{ width: `${progress.overallProgress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills Progress */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Target className="text-purple-600" size={20} />
            <h3 className="text-lg font-semibold text-slate-900">Tiến độ kỹ năng</h3>
          </div>
          <div className="space-y-4">
            {progress.skills.map((skill, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">{skill.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">Level {skill.level}</span>
                    <span className="text-xs text-slate-500">({skill.progress}%)</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-purple-500 to-pink-500"
                    style={{ width: `${skill.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Scores */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="text-emerald-600" size={20} />
            <h3 className="text-lg font-semibold text-slate-900">Điểm số gần đây</h3>
          </div>
          <div className="space-y-3">
            {progress.recentScores.map((score, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <div className="font-medium text-slate-900 text-sm">{score.subject}</div>
                  <div className="text-xs text-slate-500 mt-1">{score.date}</div>
                </div>
                <div className="text-2xl font-bold text-emerald-600">{score.score}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="text-emerald-600" size={20} />
            <h3 className="text-lg font-semibold text-emerald-900">Điểm mạnh</h3>
          </div>
          <ul className="space-y-2">
            {progress.strengths.map((strength, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-emerald-800">
                <span className="text-emerald-500 mt-1">✓</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="text-amber-600" size={20} />
            <h3 className="text-lg font-semibold text-amber-900">Cần cải thiện</h3>
          </div>
          <ul className="space-y-2">
            {progress.improvements.map((improvement, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                <span className="text-amber-500 mt-1">→</span>
                <span>{improvement}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// Monthly Summary Component
function MonthlySummaryView({ summaries }: { summaries: MonthlySummary[] }) {
  const getGradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "bg-emerald-500";
    if (grade.startsWith("B")) return "bg-blue-500";
    if (grade.startsWith("C")) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {summaries.map((summary) => (
        <div
          key={`${summary.month}-${summary.year}`}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition"
        >
          <div className="flex items-center gap-6">
            {/* Grade Badge */}
            <div className={`w-20 h-20 rounded-xl ${getGradeColor(summary.grade)} text-white grid place-items-center`}>
              <div className="text-3xl font-bold">{summary.grade}</div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Tháng {summary.month}/{summary.year}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-xs text-blue-600 mb-1">Điểm TB</div>
                  <div className="text-xl font-bold text-blue-700">{summary.avgScore}</div>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3">
                  <div className="text-xs text-emerald-600 mb-1">Điểm danh</div>
                  <div className="text-xl font-bold text-emerald-700">{summary.attendance}%</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-xs text-purple-600 mb-1">Bài học</div>
                  <div className="text-xl font-bold text-purple-700">
                    {summary.lessonsCompleted}/{summary.totalLessons}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 flex items-center justify-center">
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Xem chi tiết →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Main Component
export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("lesson");

  const tabs = [
    { id: "lesson" as ReportTab, label: "Báo cáo sau buổi học", icon: FileText },
    { id: "progress" as ReportTab, label: "Tiến độ học hiện tại", icon: TrendingUp },
    { id: "monthly" as ReportTab, label: "Tổng kết theo tháng", icon: Calendar },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tiến độ học tập</h1>
        <p className="text-slate-600 mt-1">Theo dõi báo cáo và tiến độ học tập của con</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition relative ${
                activeTab === tab.id
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="py-4">
        {activeTab === "lesson" && (
          <div className="space-y-4">
            {SAMPLE_LESSON_REPORTS.map((report) => (
              <LessonReportCard key={report.id} report={report} />
            ))}
          </div>
        )}

        {activeTab === "progress" && <CurrentProgressView progress={SAMPLE_PROGRESS} />}

        {activeTab === "monthly" && <MonthlySummaryView summaries={SAMPLE_MONTHLY_SUMMARIES} />}
      </div>
    </div>
  );
}