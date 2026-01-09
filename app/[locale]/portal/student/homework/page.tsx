"use client";

import { useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Search,
  Calendar,
  Clock,
  Paperclip,
  FileText,
  Upload,
  CheckCircle,
  BookOpen,
  Award,
} from "lucide-react";
import { Card } from "@/components/lightswind/card";
import { Badge } from "@/components/lightswind/badge";
import { Button } from "@/components/lightswind/button";
import type {
  AssignmentListItem,
  AssignmentStatus,
  AssignmentType,
  SortOption,
} from "@/types/student/homework";

// --- Components con ---

function StatusBadge({ 
  status, 
  score, 
  maxScore 
}: { 
  status: AssignmentStatus; 
  score?: number; 
  maxScore?: number;
}) {
  // Config màu sắc giống hình
  const config = {
    SUBMITTED: {
      label: score !== undefined ? `Đã nộp - ${score}/${maxScore}` : "Đã nộp",
      className: "bg-emerald-100 text-emerald-700",
    },
    PENDING: { // Đang chấm hoặc đã nộp chờ chấm
      label: "Đã nộp",
      className: "bg-emerald-100 text-emerald-700", 
    },
    LATE: {
      label: "Nộp trễ",
      className: "bg-yellow-100 text-yellow-700",
    },
    MISSING: {
      label: "Quá hạn", // Hoặc hiển thị ngày quá hạn như hình
      className: "bg-rose-100 text-rose-700",
    },
    NOT_SUBMITTED: { // Thêm trạng thái chưa nộp
      label: "Chưa nộp",
      className: "bg-amber-100 text-amber-700",
    }
  };

  // Map status to config key (xử lý logic fallback)
  const statusKey = status === 'PENDING' ? 'SUBMITTED' : (status === 'LATE' && score) ? 'SUBMITTED' : status;
  // Fallback tạm thời nếu status không khớp key nào
  const currentConfig = config[statusKey as keyof typeof config] || config.NOT_SUBMITTED;

  return (
    <span className={`px-3 py-1 rounded-lg text-[11px] font-bold ${currentConfig.className}`}>
      {currentConfig.label}
    </span>
  );
}

// Sample Data (Giữ nguyên hoặc mock thêm để test)
const SAMPLE_ASSIGNMENTS: AssignmentListItem[] = [
  {
    id: "1",
    title: "Thuyết trình nhóm: Daily Routines",
    subject: "Tiếng Anh",
    className: "Lớp A1",
    assignedDate: "05/12/2024",
    dueDate: "12/12/2024",
    status: "MISSING",
    type: "PRESENTATION",
    submissionCount: 0,
    hasAttachments: true,
  },
  {
    id: "2",
    title: "Quiz Grammar - Present Simple",
    subject: "Tiếng Anh",
    className: "Lớp A1",
    assignedDate: "10/12/2024",
    dueDate: "17/12/2024",
    status: "LATE",
    type: "QUIZ",
    score: 7,
    maxScore: 10,
    submissionCount: 1,
    hasAttachments: false,
  },
  {
    id: "3",
    title: "Worksheet Unit 5",
    subject: "Tiếng Anh",
    className: "Lớp A1",
    assignedDate: "18/12/2024",
    dueDate: "21/12/2024",
    status: "SUBMITTED",
    type: "FILE_UPLOAD",
    score: 9.5,
    maxScore: 10,
    submissionCount: 1,
    hasAttachments: false,
  },
  {
    id: "4",
    title: "Bài viết: Giáng Sinh",
    subject: "Tiếng Anh",
    className: "Lớp A1",
    assignedDate: "15/12/2024",
    dueDate: "22/12/2024",
    status: "PENDING", // Giả lập trạng thái chưa nộp trong hình
    type: "ESSAY",
    submissionCount: 0,
    hasAttachments: true,
  },
];

export default function HomeworkPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [searchQuery, setSearchQuery] = useState("");
  // Mặc định filter "Tất cả" là array rỗng
  const [statusFilter, setStatusFilter] = useState<string>("ALL"); 
  const [sortBy, setSortBy] = useState<SortOption>("DUE_DATE_ASC");

  // Stats calculation (simplified)
  const stats = useMemo(() => {
    return {
      total: SAMPLE_ASSIGNMENTS.length,
      notSubmitted: SAMPLE_ASSIGNMENTS.filter(a => a.status === 'PENDING').length,
      submitted: SAMPLE_ASSIGNMENTS.filter(a => a.status === 'SUBMITTED').length,
      late: SAMPLE_ASSIGNMENTS.filter(a => a.status === 'LATE').length,
      missing: SAMPLE_ASSIGNMENTS.filter(a => a.status === 'MISSING').length,
    };
  }, []);

  // Filter logic
  const filteredAssignments = useMemo(() => {
    let result = [...SAMPLE_ASSIGNMENTS];
    if (searchQuery) {
      result = result.filter(a => 
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        a.subject.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (statusFilter !== "ALL") {
      result = result.filter(a => a.status === statusFilter);
    }
    // Sort logic here...
    return result;
  }, [searchQuery, statusFilter, sortBy]);

  const getTypeIcon = (type: AssignmentType) => {
    switch (type) {
      case "ESSAY": return <FileText size={20} />;
      case "FILE_UPLOAD": return <Upload size={20} />;
      case "QUIZ": return <CheckCircle size={20} />;
      case "PROJECT": return <BookOpen size={20} />;
      case "PRESENTATION": return <Award size={20} />;
      default: return <FileText size={20} />;
    }
  };

  const getTypeLabel = (type: AssignmentType) => {
    const map = {
      ESSAY: "Bài viết",
      FILE_UPLOAD: "Upload file",
      QUIZ: "Trắc nghiệm",
      PROJECT: "Dự án",
      PRESENTATION: "Thuyết trình"
    };
    return map[type] || "Bài tập";
  };

  // Helper render nút Filter
  const FilterButton = ({ label, count, active, onClick }: any) => (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 rounded-full text-[13px] font-bold transition-all shadow-md ${
        active
          ? "bg-slate-900 text-white"
          : "bg-white text-slate-950 hover:bg-slate-50"
      }`}
    >
      {label} ({count})
    </button>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header Section */}
      <div className="shrink-0 px-6 pt-6 pb-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">Bài tập</h1>
          <p className="text-white mt-1 font-semibold text-base">Quản lý và nộp bài tập của bạn</p>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-3 mb-4">
          <FilterButton 
            label="Tất cả" 
            count={stats.total} 
            active={statusFilter === "ALL"} 
            onClick={() => setStatusFilter("ALL")} 
          />
          <FilterButton 
            label="Chưa nộp" 
            count={stats.notSubmitted} 
            active={statusFilter === "PENDING"} 
            onClick={() => setStatusFilter("PENDING")} 
          />
          <FilterButton 
            label="Đã nộp" 
            count={stats.submitted} 
            active={statusFilter === "SUBMITTED"} 
            onClick={() => setStatusFilter("SUBMITTED")} 
          />
          <FilterButton 
            label="Nộp trễ" 
            count={stats.late} 
            active={statusFilter === "LATE"} 
            onClick={() => setStatusFilter("LATE")} 
          />
          <FilterButton 
            label="Quá hạn" 
            count={stats.missing} 
            active={statusFilter === "MISSING"} 
            onClick={() => setStatusFilter("MISSING")} 
          />
        </div>

        {/* Search & Sort Bar */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm bài tập..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border-none rounded-xl text-slate-950 placeholder:text-slate-500 text-[13px] font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none shadow-sm"
            />
          </div>
          <div className="relative">
             <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none pl-4 pr-10 py-2.5 bg-white border-none rounded-xl text-slate-950 text-[13px] font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none shadow-sm cursor-pointer"
            >
              <option value="DUE_DATE_ASC">Hạn nộp: Gần nhất</option>
              <option value="DUE_DATE_DESC">Hạn nộp: Xa nhất</option>
              <option value="STATUS">Trạng thái</option>
            </select>
          </div>
        </div>
      </div>

      {/* List Content */}
      <div className="flex-1 px-6 pb-6 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredAssignments.map((assignment) => {
            const isMissing = assignment.status === 'MISSING';
            const isSubmitted = assignment.status === 'SUBMITTED' || (assignment.status === 'LATE' && assignment.score);

            return (
              <Card
                key={assignment.id}
                hoverable
                onClick={() => router.push(`/${locale}/portal/student/homework/${assignment.id}`)}
                className="bg-white/40 backdrop-blur-xl border border-white/40 rounded-2xl p-4 cursor-pointer"
              >
                <div className="flex gap-4">
                  {/* Left: Icon */}
                  <div className="shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shadow-sm">
                      {getTypeIcon(assignment.type)}
                    </div>
                  </div>

                  {/* Middle: Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <h3 className="font-bold text-slate-950 text-[15px] leading-tight mb-1.5 truncate pr-2">
                        {assignment.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-2">
                        <span className="flex items-center gap-1">
                          <BookOpen size={12} /> {assignment.className}
                        </span>
                        <span>•</span>
                        <span>{assignment.subject}</span>
                        <span>•</span>
                        <span>{getTypeLabel(assignment.type)}</span>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="flex items-center gap-3 text-xs">
                       <span className="text-slate-700 font-semibold flex items-center gap-1">
                         <Calendar size={12} /> Giao: {assignment.assignedDate}
                       </span>
                       <span className={`flex items-center gap-1 font-bold ${isMissing ? 'text-rose-600' : 'text-rose-600'}`}>
                         <Clock size={12} /> Hạn: {assignment.dueDate}
                       </span>
                       {assignment.hasAttachments && (
                         <span className="text-slate-700 font-semibold flex items-center gap-0.5">
                           <Paperclip size={12} className="rotate-45" /> Có tài liệu
                         </span>
                       )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col justify-between items-end pl-2">
                    <StatusBadge 
                      status={assignment.status} 
                      score={assignment.score} 
                      maxScore={assignment.maxScore} 
                    />
                    
                    <Button 
                      size="sm"
                      className="h-9 px-5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800"
                    >
                      {isSubmitted ? "Xem lại" : "Nộp bài"}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}