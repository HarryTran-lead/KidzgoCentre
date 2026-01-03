"use client";

import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Award,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Medal,
  Users,
  CheckCircle,
  XCircle,
  Minus,
  BookOpen,
  Lightbulb,
  MessageSquare,
  FileText,
  PieChart,
  AlertCircle,
} from "lucide-react";
import type {
  TestDetail,
  TestStatus,
  SkillType,
} from "@/types/student/test";

// Status Badge
function StatusBadge({ status }: { status: TestStatus }) {
  const config = {
    COMPLETED: { text: "Hoàn thành", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    SCHEDULED: { text: "Sắp thi", color: "bg-blue-100 text-blue-700 border-blue-200" },
    MISSED: { text: "Vắng mặt", color: "bg-rose-100 text-rose-700 border-rose-200" },
    IN_PROGRESS: { text: "Đang làm", color: "bg-amber-100 text-amber-700 border-amber-200" },
  };
  const { text, color } = config[status];
  return (
    <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${color}`}>
      {text}
    </span>
  );
}

// Skill Icon
function SkillIcon({ skill }: { skill: SkillType }) {
  const icons = {
    LISTENING: <Target size={18} />,
    SPEAKING: <MessageSquare size={18} />,
    READING: <BookOpen size={18} />,
    WRITING: <FileText size={18} />,
    GRAMMAR: <Lightbulb size={18} />,
    VOCABULARY: <Award size={18} />,
  };
  return icons[skill] || <Target size={18} />;
}

// Sample Data
const SAMPLE_DATA: TestDetail = {
  id: "1",
  title: "Kiểm tra giữa kỳ - Unit 1-5",
  type: "MIDTERM",
  subject: "Tiếng Anh",
  className: "Lớp A1",
  teacher: "Cô Nguyễn Thị Mai",
  testDate: "15/12/2024",
  duration: 90,
  status: "COMPLETED",
  score: 8.5,
  maxScore: 10,
  percentage: 85,
  classStats: {
    average: 7.2,
    highest: 9.5,
    lowest: 5.0,
    median: 7.5,
    totalStudents: 25,
  },
  ranking: {
    rank: 3,
    totalStudents: 25,
    percentile: 88,
  },
  skillScores: [
    {
      skill: "LISTENING",
      score: 18,
      maxScore: 20,
      percentage: 90,
      classAverage: 15.5,
    },
    {
      skill: "READING",
      score: 22,
      maxScore: 25,
      percentage: 88,
      classAverage: 18.2,
    },
    {
      skill: "WRITING",
      score: 16,
      maxScore: 20,
      percentage: 80,
      classAverage: 14.8,
    },
    {
      skill: "GRAMMAR",
      score: 13,
      maxScore: 15,
      percentage: 87,
      classAverage: 11.5,
    },
    {
      skill: "VOCABULARY",
      score: 16,
      maxScore: 20,
      percentage: 80,
      classAverage: 14.0,
    },
  ],
  sections: [
    {
      id: "1",
      name: "Part 1: Listening",
      questionCount: 20,
      score: 18,
      maxScore: 20,
      percentage: 90,
      timeSpent: 25,
    },
    {
      id: "2",
      name: "Part 2: Reading",
      questionCount: 25,
      score: 22,
      maxScore: 25,
      percentage: 88,
      timeSpent: 30,
    },
    {
      id: "3",
      name: "Part 3: Writing",
      questionCount: 4,
      score: 16,
      maxScore: 20,
      percentage: 80,
      timeSpent: 20,
    },
    {
      id: "4",
      name: "Part 4: Grammar",
      questionCount: 15,
      score: 13,
      maxScore: 15,
      percentage: 87,
      timeSpent: 15,
    },
  ],
  feedback: {
    strengths: [
      "Kỹ năng nghe rất tốt, phát âm chuẩn xác",
      "Hiểu nghĩa từ vựng và sử dụng đúng ngữ cảnh",
      "Cấu trúc câu logic, mạch lạc",
    ],
    weaknesses: [
      "Phần Writing còn một số lỗi ngữ pháp",
      "Cần cải thiện tốc độ đọc hiểu",
    ],
    recommendations: [
      "Luyện viết nhiều hơn, chú ý thì của động từ",
      "Đọc thêm các bài báo tiếng Anh ngắn mỗi ngày",
      "Xem lại cách sử dụng mạo từ a/an/the",
    ],
    generalComment: "Em đã có sự tiến bộ rõ rệt so với bài kiểm tra trước. Tiếp tục phát huy và khắc phục những điểm yếu để đạt kết quả cao hơn!",
  },
  answerSheet: {
    totalQuestions: 64,
    correctAnswers: 56,
    wrongAnswers: 6,
    skippedAnswers: 2,
  },
  improvement: {
    previousScore: 7.5,
    scoreDifference: 1.0,
    percentageChange: 13.3,
  },
};

export default function TestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const testId = params.id as string;

  const test = SAMPLE_DATA;

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (percentage >= 80) return "text-blue-600 bg-blue-50 border-blue-200";
    if (percentage >= 70) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-rose-600 bg-rose-50 border-rose-200";
  };

  const getSkillLabel = (skill: SkillType) => {
    const labels = {
      LISTENING: "Nghe",
      SPEAKING: "Nói",
      READING: "Đọc",
      WRITING: "Viết",
      GRAMMAR: "Ngữ pháp",
      VOCABULARY: "Từ vựng",
    };
    return labels[skill];
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium"
      >
        <ArrowLeft size={20} />
        Quay lại danh sách
      </button>

      {/* Header Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              {test.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
              <span className="flex items-center gap-1">
                <BookOpen size={16} />
                {test.className}
              </span>
              <span>•</span>
              <span>{test.subject}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <User size={16} />
                {test.teacher}
              </span>
            </div>
          </div>
          <StatusBadge status={test.status} />
        </div>

        {/* Test Info */}
        <div className="grid md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
          <div>
            <div className="text-sm text-slate-500 mb-1">Ngày thi</div>
            <div className="font-medium text-slate-900 flex items-center gap-2">
              <Calendar size={16} />
              {test.testDate}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-500 mb-1">Thời gian</div>
            <div className="font-medium text-slate-900 flex items-center gap-2">
              <Clock size={16} />
              {test.duration} phút
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-500 mb-1">Tổng số câu</div>
            <div className="font-medium text-slate-900 flex items-center gap-2">
              <FileText size={16} />
              {test.answerSheet?.totalQuestions} câu hỏi
            </div>
          </div>
        </div>
      </div>

      {/* Score Card - Main Highlight */}
      <div className={`rounded-xl border-2 p-8 text-center shadow-lg ${getScoreColor(test.percentage!)}`}>
        <div className="text-7xl font-bold mb-2">
          {test.score}/{test.maxScore}
        </div>
        <div className="text-2xl font-semibold mb-1">
          {test.percentage}%
        </div>
        <div className="text-sm opacity-80">
          Điểm số của bạn
        </div>
        
        {test.improvement && (
          <div className="mt-4 pt-4 border-t border-current/20">
            <div className="flex items-center justify-center gap-2 text-sm">
              {test.improvement.scoreDifference > 0 ? (
                <>
                  <TrendingUp size={18} />
                  <span className="font-semibold">
                    Tiến bộ +{test.improvement.percentageChange.toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <TrendingDown size={18} />
                  <span className="font-semibold">
                    {test.improvement.percentageChange.toFixed(1)}%
                  </span>
                </>
              )}
              <span className="opacity-70">so với lần trước ({test.improvement.previousScore})</span>
            </div>
          </div>
        )}
      </div>

      {/* Ranking & Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Ranking */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 grid place-items-center">
              <Medal size={20} />
            </div>
            <div>
              <div className="text-sm text-slate-500">Xếp hạng</div>
              <div className="text-2xl font-bold text-slate-900">
                #{test.ranking?.rank}
              </div>
            </div>
          </div>
          <div className="text-sm text-slate-600">
            Top {test.ranking?.percentile}% / {test.ranking?.totalStudents} học sinh
          </div>
        </div>

        {/* Class Average */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 grid place-items-center">
              <Users size={20} />
            </div>
            <div>
              <div className="text-sm text-slate-500">Điểm TB lớp</div>
              <div className="text-2xl font-bold text-slate-900">
                {test.classStats?.average}
              </div>
            </div>
          </div>
          <div className="text-sm text-slate-600">
            Cao hơn {(test.score! - test.classStats!.average).toFixed(1)} điểm
          </div>
        </div>

        {/* Answer Stats */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 grid place-items-center">
              <Target size={20} />
            </div>
            <div>
              <div className="text-sm text-slate-500">Tỷ lệ đúng</div>
              <div className="text-2xl font-bold text-slate-900">
                {test.answerSheet && ((test.answerSheet.correctAnswers / test.answerSheet.totalQuestions) * 100).toFixed(0)}%
              </div>
            </div>
          </div>
          <div className="text-sm text-slate-600">
            {test.answerSheet?.correctAnswers}/{test.answerSheet?.totalQuestions} câu đúng
          </div>
        </div>
      </div>

      {/* Class Stats Distribution */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <BarChart3 size={20} />
          Phân bổ điểm lớp
        </h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="text-sm text-emerald-700 mb-1">Cao nhất</div>
            <div className="text-2xl font-bold text-emerald-600">{test.classStats?.highest}</div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-700 mb-1">Trung vị</div>
            <div className="text-2xl font-bold text-blue-600">{test.classStats?.median}</div>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="text-sm text-amber-700 mb-1">Trung bình</div>
            <div className="text-2xl font-bold text-amber-600">{test.classStats?.average}</div>
          </div>
          <div className="p-4 bg-rose-50 rounded-lg border border-rose-200">
            <div className="text-sm text-rose-700 mb-1">Thấp nhất</div>
            <div className="text-2xl font-bold text-rose-600">{test.classStats?.lowest}</div>
          </div>
        </div>
      </div>

      {/* Skill Breakdown */}
      {test.skillScores && test.skillScores.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <PieChart size={20} />
            Điểm theo kỹ năng
          </h2>
          <div className="space-y-4">
            {test.skillScores.map((skill) => (
              <div key={skill.skill} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 grid place-items-center">
                      <SkillIcon skill={skill.skill} />
                    </div>
                    <span className="font-medium text-slate-900">
                      {getSkillLabel(skill.skill)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-bold ${
                      skill.percentage >= 90 ? "text-emerald-600" :
                      skill.percentage >= 80 ? "text-blue-600" :
                      skill.percentage >= 70 ? "text-amber-600" : "text-rose-600"
                    }`}>
                      {skill.score}/{skill.maxScore}
                    </span>
                    <span className="text-sm text-slate-500 ml-2">
                      ({skill.percentage}%)
                    </span>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        skill.percentage >= 90 ? "bg-emerald-500" :
                        skill.percentage >= 80 ? "bg-blue-500" :
                        skill.percentage >= 70 ? "bg-amber-500" : "bg-rose-500"
                      }`}
                      style={{ width: `${skill.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 w-24 text-right">
                    ĐTB: {skill.classAverage}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section Scores */}
      {test.sections && test.sections.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <FileText size={20} />
            Điểm theo phần thi
          </h2>
          <div className="space-y-3">
            {test.sections.map((section) => (
              <div
                key={section.id}
                className="p-4 bg-slate-50 rounded-lg border border-slate-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">{section.name}</div>
                    <div className="text-sm text-slate-600">
                      {section.questionCount} câu hỏi • {section.timeSpent} phút
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-bold ${
                      section.percentage >= 90 ? "text-emerald-600" :
                      section.percentage >= 80 ? "text-blue-600" :
                      section.percentage >= 70 ? "text-amber-600" : "text-rose-600"
                    }`}>
                      {section.score}/{section.maxScore}
                    </div>
                    <div className="text-sm text-slate-500">
                      {section.percentage}%
                    </div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      section.percentage >= 90 ? "bg-emerald-500" :
                      section.percentage >= 80 ? "bg-blue-500" :
                      section.percentage >= 70 ? "bg-amber-500" : "bg-rose-500"
                    }`}
                    style={{ width: `${section.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Answer Sheet Summary */}
      {test.answerSheet && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Target size={20} />
            Tổng quan bài làm
          </h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {test.answerSheet.totalQuestions}
              </div>
              <div className="text-sm text-slate-600">Tổng câu hỏi</div>
            </div>
            <div className="p-4 bg-emerald-50 rounded-lg text-center border border-emerald-200">
              <div className="text-3xl font-bold text-emerald-600 mb-1 flex items-center justify-center gap-2">
                <CheckCircle size={24} />
                {test.answerSheet.correctAnswers}
              </div>
              <div className="text-sm text-emerald-700">Trả lời đúng</div>
            </div>
            <div className="p-4 bg-rose-50 rounded-lg text-center border border-rose-200">
              <div className="text-3xl font-bold text-rose-600 mb-1 flex items-center justify-center gap-2">
                <XCircle size={24} />
                {test.answerSheet.wrongAnswers}
              </div>
              <div className="text-sm text-rose-700">Trả lời sai</div>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg text-center border border-amber-200">
              <div className="text-3xl font-bold text-amber-600 mb-1 flex items-center justify-center gap-2">
                <Minus size={24} />
                {test.answerSheet.skippedAnswers}
              </div>
              <div className="text-sm text-amber-700">Bỏ qua</div>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Feedback */}
      {test.feedback && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <MessageSquare size={20} />
            Nhận xét của giáo viên
          </h2>
          
          {test.feedback.generalComment && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-6">
              <p className="text-slate-700 leading-relaxed">
                {test.feedback.generalComment}
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div>
              <h3 className="font-semibold text-emerald-600 mb-3 flex items-center gap-2">
                <CheckCircle size={18} />
                Điểm mạnh
              </h3>
              <ul className="space-y-2">
                {test.feedback.strengths.map((strength, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-700">
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div>
              <h3 className="font-semibold text-amber-600 mb-3 flex items-center gap-2">
                <AlertCircle size={18} />
                Cần cải thiện
              </h3>
              <ul className="space-y-2">
                {test.feedback.weaknesses.map((weakness, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-700">
                    <span className="text-amber-500 mt-1">→</span>
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recommendations */}
          {test.feedback.recommendations.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h3 className="font-semibold text-blue-600 mb-3 flex items-center gap-2">
                <Lightbulb size={18} />
                Gợi ý học tập
              </h3>
              <ul className="space-y-2">
                {test.feedback.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-700">
                    <span className="text-blue-500 mt-1">💡</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
