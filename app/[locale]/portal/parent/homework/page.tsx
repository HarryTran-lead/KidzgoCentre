"use client";

import { useState } from "react";
import { Clock, CheckCircle2, AlertCircle, Calendar, Upload, FileText, BookOpen, TrendingUp, CheckSquare, XCircle, Filter, Search, ChevronRight, MoreVertical, Eye, Download } from "lucide-react";

type TabType = "all" | "pending" | "submitted" | "late";

type Assignment = {
  id: string;
  subject: string;
  title: string;
  description: string;
  deadline: string;
  status: "PENDING" | "SUBMITTED" | "LATE";
  submittedAt?: string;
  score?: number;
  feedback?: string;
  priority?: "high" | "medium" | "low";
  attachmentCount?: number;
};

const MOCK_ASSIGNMENTS: Assignment[] = [
  {
    id: "1",
    subject: "Tiếng Anh",
    title: "Viết đoạn văn về gia đình",
    description: "Hoàn thành đoạn văn 200 từ giới thiệu về gia đình bằng tiếng Anh. Cần sử dụng đúng cấu trúc và từ vựng đã học.",
    deadline: "30/12/2024 21:00",
    status: "PENDING",
    priority: "high",
    attachmentCount: 2,
  },
  {
    id: "2",
    subject: "Tiếng Anh",
    title: "Bài tập ngữ pháp Unit 5",
    description: "Làm trọn bộ bài tập Unit 5 trong giáo trình Present Perfect Tense, bao gồm 30 câu bài tập.",
    deadline: "28/12/2024 20:00",
    status: "SUBMITTED",
    submittedAt: "27/12/2024 19:10",
    score: 9,
    feedback: "Làm tốt! Cần chú ý thêm về thì hiện tại hoàn thành trong trường hợp diễn tả hành động đã xảy ra nhưng không rõ thời gian.",
    priority: "medium",
    attachmentCount: 1,
  },
  {
    id: "3",
    subject: "Tiếng Anh",
    title: "Speaking Practice - Video",
    description: "Quay video giới thiệu bản thân 3-5 phút với đầy đủ các phần: Greeting, Personal Information, Hobbies và Future Plans.",
    deadline: "25/12/2024 23:59",
    status: "LATE",
    priority: "high",
  },
  {
    id: "4",
    subject: "Tiếng Anh",
    title: "Reading Comprehension",
    description: "Đọc bài đọc về Climate Change và trả lời 10 câu hỏi trắc nghiệm.",
    deadline: "01/01/2025 18:00",
    status: "PENDING",
    priority: "medium",
    attachmentCount: 1,
  },
  {
    id: "5",
    subject: "Tiếng Anh",
    title: "Vocabulary Test",
    description: "Học thuộc 50 từ vựng mới về chủ đề Technology và làm bài kiểm tra.",
    deadline: "29/12/2024 16:00",
    status: "SUBMITTED",
    submittedAt: "28/12/2024 15:30",
    score: 8.5,
    feedback: "Cố gắng hơn với phần phát âm và sử dụng từ trong ngữ cảnh.",
    priority: "low",
  },
];

export default function HomeworkPage() {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAssignments = MOCK_ASSIGNMENTS.filter((assignment) => {
    const matchesTab = 
      activeTab === "all" ? true :
      activeTab === "pending" ? assignment.status === "PENDING" :
      activeTab === "submitted" ? assignment.status === "SUBMITTED" :
      assignment.status === "LATE";
    
    const matchesSearch = 
      assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.subject.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesTab && matchesSearch;
  });

  const stats = {
    total: MOCK_ASSIGNMENTS.length,
    pending: MOCK_ASSIGNMENTS.filter((a) => a.status === "PENDING").length,
    submitted: MOCK_ASSIGNMENTS.filter((a) => a.status === "SUBMITTED").length,
    late: MOCK_ASSIGNMENTS.filter((a) => a.status === "LATE").length,
  };

  const getStatusColor = (status: Assignment["status"]) => {
    switch (status) {
      case "SUBMITTED": return "from-emerald-500 to-teal-500";
      case "LATE": return "from-rose-500 to-pink-500";
      case "PENDING": return "from-amber-500 to-orange-500";
      default: return "from-blue-500 to-sky-500";
    }
  };

  const getPriorityColor = (priority?: Assignment["priority"]) => {
    switch (priority) {
      case "high": return "bg-gradient-to-r from-rose-500 to-pink-500";
      case "medium": return "bg-gradient-to-r from-amber-500 to-orange-500";
      case "low": return "bg-gradient-to-r from-emerald-500 to-teal-500";
      default: return "bg-gradient-to-r from-gray-400 to-slate-500";
    }
  };

  const getStatusIcon = (status: Assignment["status"]) => {
    switch (status) {
      case "SUBMITTED": return <CheckCircle2 className="w-4 h-4" />;
      case "LATE": return <AlertCircle className="w-4 h-4" />;
      case "PENDING": return <Clock className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const formatTimeRemaining = (deadline: string) => {
    const [date, time] = deadline.split(" ");
    const [day, month, year] = date.split("/").map(Number);
    const [hour, minute] = time.split(":").map(Number);
    const deadlineDate = new Date(year, month - 1, day, hour, minute);
    const now = new Date();
    const diffMs = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Đã quá hạn";
    if (diffDays === 0) return "Hôm nay";
    if (diffDays === 1) return "1 ngày nữa";
    return `${diffDays} ngày nữa`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
            <BookOpen className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Bài tập & Nộp bài
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Theo dõi các bài tập được giao và tiến độ nộp bài
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-pink-50 transition-colors cursor-pointer">
            <Filter size={16} /> Lọc nâng cao
          </button>
        </div>
      </div>

      {/* Stats Cards - Modern Design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600 mt-1">Tổng bài tập</div>
            </div>
            <div className="p-3 bg-gradient-to-r from-blue-500/10 to-sky-500/10 rounded-xl">
              <BookOpen className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-sky-500" style={{ width: '100%' }} />
          </div>
        </div>

        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-amber-600">{stats.pending}</div>
              <div className="text-sm text-gray-600 mt-1">Chưa nộp</div>
            </div>
            <div className="p-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl">
              <Clock className="w-6 h-6 text-amber-500" />
            </div>
          </div>
          <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: `${(stats.pending / stats.total) * 100}%` }} />
          </div>
        </div>

        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-emerald-600">{stats.submitted}</div>
              <div className="text-sm text-gray-600 mt-1">Đã nộp</div>
            </div>
            <div className="p-3 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl">
              <CheckSquare className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
          <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${(stats.submitted / stats.total) * 100}%` }} />
          </div>
        </div>

        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-rose-600">{stats.late}</div>
              <div className="text-sm text-gray-600 mt-1">Quá hạn</div>
            </div>
            <div className="p-3 bg-gradient-to-r from-rose-500/10 to-pink-500/10 rounded-xl">
              <XCircle className="w-6 h-6 text-rose-500" />
            </div>
          </div>
          <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-rose-500 to-pink-500" style={{ width: `${(stats.late / stats.total) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Search and Tabs */}
      <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm bài tập theo tiêu đề, mô tả hoặc môn học..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-pink-200 bg-white focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 flex-wrap lg:flex-nowrap">
            {[
              { key: "all" as TabType, label: "Tất cả", count: stats.total },
              { key: "pending" as TabType, label: "Chưa nộp", count: stats.pending },
              { key: "submitted" as TabType, label: "Đã nộp", count: stats.submitted },
              { key: "late" as TabType, label: "Quá hạn", count: stats.late },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === tab.key
                    ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md"
                    : "bg-white border border-pink-200 text-gray-600 hover:bg-pink-50"
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? "bg-white/20" : "bg-gray-100"
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {filteredAssignments.map((assignment) => (
          <div
            key={assignment.id}
            className={`rounded-2xl border border-pink-200 overflow-hidden hover:shadow-lg transition-all duration-300 ${
              assignment.status === "LATE" ? "border-rose-200 bg-gradient-to-br from-white to-rose-50/30" :
              assignment.status === "SUBMITTED" ? "border-emerald-200 bg-gradient-to-br from-white to-emerald-50/30" :
              "bg-gradient-to-br from-white to-pink-50"
            }`}
          >
            <div className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                {/* Status Indicator */}
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getStatusColor(assignment.status)} text-white shadow-md`}>
                    {getStatusIcon(assignment.status)}
                  </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-500/10 to-sky-500/10 text-blue-600 text-xs font-semibold">
                          {assignment.subject}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getPriorityColor(assignment.priority)} text-white`}>
                          {assignment.priority === "high" ? "Ưu tiên cao" : 
                           assignment.priority === "medium" ? "Ưu tiên trung" : "Ưu tiên thấp"}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          assignment.status === "SUBMITTED" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                          assignment.status === "LATE" ? "bg-rose-100 text-rose-700 border border-rose-200" :
                          "bg-amber-100 text-amber-700 border border-amber-200"
                        }`}>
                          {assignment.status === "SUBMITTED" ? "Đã nộp" : 
                           assignment.status === "LATE" ? "Quá hạn" : "Chưa nộp"}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{assignment.title}</h3>
                      <p className="text-sm text-gray-600 mb-4">{assignment.description}</p>
                    </div>

                    <button className="p-2 rounded-lg border border-pink-200 hover:bg-pink-50 transition-colors cursor-pointer self-start">
                      <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-pink-500/10 to-rose-500/10 rounded-lg">
                        <Calendar className="w-4 h-4 text-pink-500" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Hạn nộp</div>
                        <div className="text-sm font-medium text-gray-900">{assignment.deadline}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg">
                        <Clock className="w-4 h-4 text-amber-500" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Thời gian còn lại</div>
                        <div className={`text-sm font-medium ${
                          assignment.status === "LATE" ? "text-rose-600" :
                          assignment.status === "PENDING" ? "text-amber-600" :
                          "text-emerald-600"
                        }`}>
                          {formatTimeRemaining(assignment.deadline)}
                        </div>
                      </div>
                    </div>

                    {assignment.score !== undefined && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-lg">
                          <TrendingUp className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Điểm số</div>
                          <div className="text-sm font-bold text-emerald-600">{assignment.score}/10</div>
                        </div>
                      </div>
                    )}

                    {assignment.attachmentCount && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-blue-500/10 to-sky-500/10 rounded-lg">
                          <FileText className="w-4 h-4 text-blue-500" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Tệp đính kèm</div>
                          <div className="text-sm font-medium text-gray-900">{assignment.attachmentCount} tệp</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Feedback Section */}
                  {assignment.feedback && (
                    <div className="mt-4 p-4 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50/50 to-teal-50/50">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-lg">
                          <FileText className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-emerald-700 mb-1">
                            Nhận xét của giáo viên:
                          </div>
                          <div className="text-sm text-gray-700">{assignment.feedback}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-6 flex flex-wrap gap-3">
                    {assignment.status === "PENDING" && (
                      <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-md transition-all cursor-pointer">
                        <Upload className="w-4 h-4" />
                        Nộp bài ngay
                      </button>
                    )}
                    
                    <button className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-pink-50 transition-colors cursor-pointer">
                      <Eye className="w-4 h-4" />
                      Xem chi tiết
                    </button>
                    
                    {assignment.submittedAt && (
                      <button className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-pink-50 transition-colors cursor-pointer">
                        <Download className="w-4 h-4" />
                        Tải bài nộp
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredAssignments.length === 0 && (
          <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-pink-500/10 to-rose-500/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-pink-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy bài tập</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {searchQuery ? `Không có bài tập nào phù hợp với "${searchQuery}"` : "Chưa có bài tập nào trong danh sách này"}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-pink-50 transition-colors cursor-pointer"
              >
                Xoá tìm kiếm
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tips Section */}
      <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-5">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gradient-to-r from-pink-500/10 to-rose-500/10 rounded-lg">
            <AlertCircle className="w-5 h-5 text-pink-500" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900 mb-2">Mẹo quản lý bài tập</div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                <span>Nộp bài trước hạn để được xét duyệt và nhận phản hồi sớm</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                <span>Kiểm tra lại bài làm trước khi nộp để tránh sai sót</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                <span>Đọc kỹ nhận xét của giáo viên để cải thiện trong các bài sau</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}