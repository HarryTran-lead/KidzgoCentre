"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  FileText,
  CheckCircle,
  Paperclip,
  AlertCircle,
  Award,
  MessageSquare,
  Eye,
  FileCheck,
  Link as LinkIcon,
  Image as ImageIcon,
  Film,
  BookOpen,
  Sparkles,
  Loader2,
  X,
  CircleCheck,
  CircleX,
  Download,
  Timer,
  List,
  LogOut,
  AlertTriangle,
} from "lucide-react";
import type {
  AssignmentDetail,
  AssignmentStatus,
  AttachmentType,
} from "@/types/student/homework";
import { getStudentHomeworkById, submitHomework } from "@/lib/api/studentService";
import type { SubmitHomeworkPayload } from "@/lib/api/studentService";
import { buildFileUrl } from "@/constants/apiURL";
import MultipleChoiceForm from "./components/MultipleChoiceForm";
import FileSubmissionForm from "./components/FileSubmissionForm";
import HomeworkAiWorkspace from "./components/HomeworkAiWorkspace";

// Status Badge
function StatusBadge({ status, isGraded = false }: { status: AssignmentStatus; isGraded?: boolean }) {
  if (isGraded) {
    return (
      <span className="px-3 py-1.5 rounded-lg text-sm font-semibold backdrop-blur-sm bg-cyan-500/20 border border-cyan-400/30 text-cyan-200">
        Đã chấm
      </span>
    );
  }

  const config: Record<AssignmentStatus, { text: string; color: string }> = {
    ASSIGNED: { text: "Đã giao", color: "bg-blue-500/30 border border-blue-400/40 text-blue-300" },
    SUBMITTED: { text: "Đã nộp", color: "bg-green-500/30 border border-green-400/40 text-green-300" },
    PENDING: { text: "Chưa nộp", color: "bg-amber-500/30 border border-amber-400/40 text-amber-300" },
    MISSING: { text: "Quá hạn", color: "bg-rose-500/30 border border-rose-400/40 text-rose-300" },
    LATE: { text: "Nộp trễ", color: "bg-yellow-500/30 border border-yellow-400/40 text-yellow-300" },
  };
  const { text, color } = config[status] || config.PENDING;
  return (
    <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold backdrop-blur-sm ${color}`}>
      {text}
    </span>
  );
}

// Attachment Icon
function AttachmentIcon({ type }: { type: AttachmentType | string }) {
  switch (type) {
    case "PDF": return <FileText size={16} className="text-rose-400" />;
    case "DOC":
    case "DOCX": return <FileText size={16} className="text-blue-400" />;
    case "LINK": return <LinkIcon size={16} className="text-indigo-400" />;
    case "VIDEO": return <Film size={16} className="text-purple-400" />;
    case "IMAGE": return <ImageIcon size={16} className="text-emerald-400" />;
    default: return <FileText size={16} className="text-slate-400" />;
  }
}

// Format date với timezone VN chuẩn xác
const formatDueDateVn = (dateString?: string): string => {
  if (!dateString) return "Chưa có";
  try {
    // Parse date string để lấy giờ:phút
    const match = String(dateString).match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::\d{2})?(?:\.\d+)?(?:Z|([+-]\d{2}:?\d{2}))?$/);
    let hasValidTime = false;
    let date: Date;

    if (match) {
      const [, year, month, day, hours, minutes] = match;
      // Kiểm tra nếu giờ = "00" và phút = "00" → coi như không có giờ hợp lệ
      hasValidTime = !(parseInt(hours) === 0 && parseInt(minutes) === 0);
      // Tạo Date theo giờ VN (UTC+7): trừ 7h từ string để khi hiển thị với timezone VN ra đúng
      const vnMs = Date.UTC(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours) - 7,
        parseInt(minutes)
      );
      date = new Date(vnMs);
    } else {
      // Không parse được format → dùng trực tiếp
      date = new Date(dateString);
      hasValidTime = !isNaN(date.getTime()) && (date.getHours() !== 0 || date.getMinutes() !== 0);
    }

    if (hasValidTime) {
      return date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Ho_Chi_Minh",
      });
    } else {
      // Không có giờ hợp lệ (00:00) → chỉ hiển thị ngày
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Asia/Ho_Chi_Minh",
      });
    }
  } catch {
    return dateString || "Chưa có";
  }
};

// Format graded date với timezone VN chuẩn xác
const formatGradedDate = (dateString?: string): string => {
  if (!dateString) return "Chưa có";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Chưa có";
    
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Ho_Chi_Minh",
    });
  } catch {
    return dateString || "Chưa có";
  }
};

export default function AssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const homeworkId = params.id as string;
  const locale = params.locale as string || "vi";

  // API State
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Navigation warning state
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const isMultipleChoiceRef = useRef(false);
  const hasUnsavedChanges = useRef(false);

  // Fetch homework detail
  useEffect(() => {
    const fetchHomeworkDetail = async () => {
      if (!homeworkId) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await getStudentHomeworkById(homeworkId);

        if (response.isSuccess && response.data) {
          setAssignment(response.data);
        } else {
          setError(response.message || "Không thể tải thông tin bài tập");
        }
      } catch (err) {
        console.error("Error fetching homework detail:", err);
        setError("Đã xảy ra lỗi khi tải bài tập");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomeworkDetail();
  }, [homeworkId]);

  const submissionType = (assignment?.submissionType || "").toUpperCase();
  const isMultipleChoiceAssignment =
    submissionType === "MULTIPLE_CHOICE" || submissionType === "QUIZ";

  // Update refs when assignment type changes
  useEffect(() => {
    if (assignment) {
      isMultipleChoiceRef.current = isMultipleChoiceAssignment;
    }
  }, [assignment, isMultipleChoiceAssignment]);

  // Function to handle unsaved changes from MultipleChoiceForm
  const handleUnsavedChanges = useCallback((hasChanges: boolean) => {
    hasUnsavedChanges.current = hasChanges;
  }, []);

  // Handle navigation attempt
  const handleBackClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Only show warning if:
    // 1. It's a multiple choice assignment
    // 2. There are unsaved changes
    // 3. Assignment is still pending (not submitted)
    const isPending =
      assignment?.status === "PENDING" || assignment?.status === "ASSIGNED";
    
    if (isMultipleChoiceRef.current && hasUnsavedChanges.current && isPending) {
      setPendingNavigation(`/${locale}/portal/student/homework`);
      setShowLeaveWarning(true);
    } else {
      router.back();
    }
  };

  const handleConfirmLeave = async () => {
    setShowLeaveWarning(false);
    // Capture navigation target before clearing state
    const targetUrl = pendingNavigation || `/${locale}/portal/student/homework`;
    setPendingNavigation(null);

    // Clear any stored quiz state to prevent restoration
    if (homeworkId) {
      const storageKey = `quiz_${homeworkId}`;
      localStorage.setItem(`${storageKey}_abandoned`, "true");
    }

    // Chỉ redirect 1 lần duy nhất
    router.push(targetUrl);
  };

  const handleStay = () => {
    setShowLeaveWarning(false);
    setPendingNavigation(null);
  };

  const handleFileSubmit = async (payload: SubmitHomeworkPayload) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await submitHomework(payload);

      if (response.isSuccess) {
        setSubmitSuccess(true);

        const refreshResponse = await getStudentHomeworkById(homeworkId);
        if (refreshResponse.isSuccess && refreshResponse.data) {
          setAssignment(refreshResponse.data);
        }

        setTimeout(() => setSubmitSuccess(false), 5000);
      } else {
        setSubmitError(response.message || "Không thể nộp bài");
      }
    } catch (err) {
      console.error("Error submitting homework:", err);
      setSubmitError("Đã xảy ra lỗi khi nộp bài");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuizSubmitSuccess = async () => {
    setSubmitSuccess(true);
    hasUnsavedChanges.current = false; // Reset unsaved changes after successful submit

    const refreshResponse = await getStudentHomeworkById(homeworkId);
    if (refreshResponse.isSuccess && refreshResponse.data) {
      setAssignment(refreshResponse.data);
    }

    setTimeout(() => setSubmitSuccess(false), 5000);
  };

  const isPending =
    assignment?.status === "PENDING" || assignment?.status === "ASSIGNED";
  const canReviewQuiz = isMultipleChoiceAssignment &&
    assignment?.review?.showReview &&
    (assignment.review.answerResults?.length ?? 0) > 0;
  
  const reviewSummary = useMemo(() => {
    const reviewAnswerResults = assignment?.review?.answerResults ?? [];
    return {
      correct: reviewAnswerResults.filter((item) => item.isCorrect === true).length,
      wrong: reviewAnswerResults.filter((item) => item.isCorrect === false).length,
      earnedPoints: reviewAnswerResults.reduce(
        (sum, item) => sum + (item.earnedPoints || 0),
        0
      ),
    };
  }, [assignment?.review?.answerResults]);
  const hasGradingResult = Boolean(
    assignment?.grading ||
      assignment?.gradedAt ||
      assignment?.grading?.teacherComment ||
      assignment?.grading?.aiFeedback
  );

  // Format time function for the warning modal
const formatTime = (seconds: number): string => {
  if (seconds <= 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

// Format graded date - handle various date formats
const formatGradedDate = (dateString?: string): string => {
  if (!dateString) return "Chưa có";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Chưa có";
    
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Ho_Chi_Minh",
    });
  } catch {
    return dateString || "Chưa có";
  }
};

  // Get time remaining from localStorage if available
  const getTimeRemaining = () => {
    if (!homeworkId) return 0;
    const storageKey = `quiz_${homeworkId}`;
    const savedRemaining = localStorage.getItem(`${storageKey}_remaining`);
    const savedSubmitted = localStorage.getItem(`${storageKey}_submitted`);
    
    if (savedSubmitted === "true") return 0;
    if (savedRemaining) {
      return parseInt(savedRemaining, 10);
    }
    return assignment?.timeLimitMinutes ? assignment.timeLimitMinutes * 60 : 0;
  };

  const timeRemaining = getTimeRemaining();
  const totalQuestions = assignment?.questions?.length || 0;
  const answeredCount = (() => {
    if (!homeworkId) return 0;
    const storageKey = `quiz_${homeworkId}`;
    const savedAnswers = localStorage.getItem(`${storageKey}_answers`);
    if (savedAnswers) {
      try {
        const answers = JSON.parse(savedAnswers);
        return Object.keys(answers).length;
      } catch {
        return 0;
      }
    }
    return 0;
  })();

  // Loading State
  if (isLoading) {
    return (
      <div className="h-[calc(100vh-120px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
        <span className="ml-3 text-white font-semibold">Đang tải...</span>
      </div>
    );
  }

  // Error State
  if (error || !assignment) {
    return (
      <div className="h-[calc(100vh-120px)] flex flex-col items-center justify-center p-8">
        <AlertCircle className="w-16 h-16 text-rose-400 mb-4" />
        <p className="text-white font-semibold text-lg mb-2">{error || "Không tìm thấy bài tập"}</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="h-[calc(100vh-120px)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-8">
        <div className="space-y-6">
          {/* Back Button */}
          <button
            onClick={handleBackClick}
            className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-3 text-white font-semibold shadow-lg shadow-purple-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 cursor-pointer active:scale-95"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-400 to-purple-600 blur-md"></div>
            </div>
            <div className="relative flex items-center gap-2.5 text-white">
              <ArrowLeft size={20} className="transition-all duration-300 group-hover:-translate-x-1.5 group-hover:scale-110" />
              <span className="tracking-wide">Quay lại danh sách</span>
            </div>
          </button>

          {/* Header Card */}
          <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-b from-slate-900/95 to-slate-950/95 backdrop-blur-xl p-6 shadow-xl shadow-purple-900/30">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white mb-2">
                  {assignment.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-purple-300">
                  <span className="flex items-center gap-1">
                    <BookOpen size={16} />
                    {assignment.className}
                  </span>
                </div>
              </div>
              <StatusBadge status={assignment.status} isGraded={hasGradingResult} />
            </div>

            {/* Date & Time Info */}
            <div className="grid md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-800/40 border border-purple-500/20">
              <div>
                <div className="text-sm text-purple-400 mb-1">Loại nộp</div>
                <div className="font-medium text-white flex items-center gap-2">
                  <FileText size={16} className="text-purple-400" />
                  {assignment.submissionType || "File"}
                </div>
              </div>
              <div>
                <div className="text-sm text-purple-400 mb-1">Hạn nộp</div>
                <div className={`font-medium flex items-center gap-2 ${
                  assignment.status === "MISSING" || assignment.status === "LATE"
                    ? "text-rose-400"
                    : "text-green-400"
                }`}>
                  <Clock size={16} className="text-purple-400" />
                  {formatDueDateVn(assignment.dueDate)}
                </div>
              </div>
              {assignment.timeRemaining && (
                <div>
                  <div className="text-sm text-purple-400 mb-1">Thời gian còn lại</div>
                  <div className={`font-semibold flex items-center gap-2 ${
                    assignment.timeRemaining.includes("giờ")
                      ? "text-amber-400"
                      : "text-rose-400"
                  }`}>
                    <AlertCircle size={16} />
                    {assignment.timeRemaining}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Grading Section */}
          {assignment.grading && (
            <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-b from-slate-900/95 to-slate-950/95 backdrop-blur-xl p-6 shadow-xl shadow-purple-900/20">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Award size={20} className="text-purple-400" />
                {canReviewQuiz ? "Kết quả chấm điểm" : "Kết quả chấm bài & nhận xét"}
              </h2>

              {/* Score */}
              <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/30 mb-6 text-center">
                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-green-400 to-cyan-400 mb-2">
                  {assignment.grading.score}/{assignment.grading.maxScore}
                </div>
                {assignment.gradedAt && (
                  <div className="text-sm text-slate-500 mt-2">
                    Chấm điểm lúc: {formatGradedDate(assignment.gradedAt)}
                  </div>
                )}
              </div>

              {/* Teacher Comment */}
              {assignment.grading.teacherComment && (
                <div className="mb-6">
                  <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                    <MessageSquare size={18} className="text-purple-400" />
                    Nhận xét của giáo viên
                  </h3>
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-slate-300">
                    {assignment.grading.teacherComment}
                  </div>
                </div>
              )}

              {assignment.grading.aiFeedback && (
                <div className="mb-6">
                  <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                    <Sparkles size={18} className="text-amber-400" />
                    Gợi ý từ AI
                  </h3>
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-100/90">
                    {assignment.grading.aiFeedback}
                  </div>
                </div>
              )}

              {/* Graded Files */}
              {assignment.grading.gradedFiles && assignment.grading.gradedFiles.length > 0 && (
                <div>
                  <h3 className="font-medium text-white mb-3">Bài đã chấm:</h3>
                  <div className="space-y-2">
                    {assignment.grading.gradedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-purple-500/20"
                      >
                        <div className="flex items-center gap-3">
                          <AttachmentIcon type={file.type} />
                          <div>
                            <div className="font-medium text-white">{file.name}</div>
                            {file.size && <div className="text-sm text-slate-500">{file.size}</div>}
                          </div>
                        </div>
                        <button className="p-2 hover:bg-purple-500/20 rounded-lg transition">
                          <Download size={18} className="text-purple-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Description & Requirements - Only show for non-multiple-choice assignments */}
          {!isMultipleChoiceAssignment && (
            <>
              <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-b from-slate-900/95 to-slate-950/95 backdrop-blur-xl p-6 shadow-xl shadow-purple-900/20">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FileText size={20} className="text-purple-400" />
                  Mô tả bài tập
                </h2>
                <p className="text-slate-300 leading-relaxed mb-6">
                  {assignment.description || "Không có mô tả"}
                </p>

                {assignment.requirements && assignment.requirements.length > 0 && (
                  <>
                    <h3 className="font-semibold text-white mb-3">Yêu cầu:</h3>
                    <ul className="space-y-2">
                      {assignment.requirements.map((req, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-slate-300">
                          <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              {/* Rubric */}
              {assignment.rubric && assignment.rubric.length > 0 && (
                <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-b from-slate-900/95 to-slate-950/95 backdrop-blur-xl p-6 shadow-xl shadow-purple-900/20">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Award size={20} className="text-purple-400" />
                    Tiêu chí chấm điểm
                  </h2>
                  <div className="space-y-3">
                    {assignment.rubric.map((criteria) => {
                      const rubricScore = assignment.grading?.rubricScores?.find(
                        (rs) => rs.criteriaId === criteria.id
                      );
                      return (
                        <div
                          key={criteria.id}
                          className="flex items-start justify-between p-4 rounded-xl bg-slate-800/40 border border-purple-500/20"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-white">{criteria.criteria}</div>
                            <div className="text-sm text-slate-400 mt-1">{criteria.description}</div>
                            {rubricScore?.comment && (
                              <div className="text-sm text-blue-400 mt-2 italic">
                                {rubricScore.comment}
                              </div>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <div className="font-semibold">
                              {rubricScore?.score !== undefined ? (
                                <span className="text-green-400">
                                  {rubricScore.score}/{criteria.maxPoints}
                                </span>
                              ) : (
                                <span className="text-slate-300">{criteria.maxPoints} điểm</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Teacher Attachments */}
              {assignment.teacherAttachments && assignment.teacherAttachments.length > 0 && (
                <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-b from-slate-900/95 to-slate-950/95 backdrop-blur-xl p-6 shadow-xl shadow-purple-900/20">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Paperclip size={20} className="text-purple-400" />
                    Đính kèm của giáo viên
                  </h2>
                  <div className="space-y-4">
                    {assignment.teacherAttachments.map((attachment) => {
                      const isImage = attachment.type === "IMAGE" || attachment.type?.includes("image");
                      const fileUrl = buildFileUrl(attachment.url);
                      
                      if (isImage && fileUrl) {
                        return (
                          <div key={attachment.id} className="rounded-xl border border-purple-500/20 overflow-hidden hover:border-purple-400/40 transition group">
                            <div className="relative bg-slate-900/80 flex items-center justify-center min-h-[220px]">
                              <img
                                src={fileUrl}
                                alt={attachment.name}
                                className="w-full h-auto max-h-96 object-contain p-2"
                                onError={(e) => {
                                  const container = e.currentTarget.parentElement;
                                  if (container) {
                                    container.innerHTML = `
                                      <div class="flex flex-col items-center justify-center gap-3 w-full h-full p-6">
                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-slate-400">
                                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                          <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                          <polyline points="21 15 16 10 5 21"></polyline>
                                        </svg>
                                        <p class="text-slate-400">Không thể tải ảnh</p>
                                      </div>
                                    `;
                                  }
                                }}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-2.5 rounded-lg bg-purple-500/80 hover:bg-purple-600 transition"
                                  title="Xem"
                                >
                                  <Eye size={18} className="text-white" />
                                </a>
                                <a
                                  href={fileUrl}
                                  download
                                  className="p-2.5 rounded-lg bg-emerald-500/80 hover:bg-emerald-600 transition"
                                  title="Tải về"
                                >
                                  <Download size={18} className="text-white" />
                                </a>
                              </div>
                            </div>
                            <div className="p-3 bg-slate-800/50 border-t border-purple-500/20">
                              <div className="font-medium text-white text-sm truncate">{attachment.name}</div>
                              {attachment.size && (
                                <div className="text-xs text-slate-400 mt-1">{attachment.size}</div>
                              )}
                            </div>
                          </div>
                        );
                      }
                      
                      // Non-image attachment
                      return (
                        <div key={attachment.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-purple-500/20 hover:border-purple-400/40 transition">
                          <div className="flex items-center gap-3">
                            <AttachmentIcon type={attachment.type} />
                            <div>
                              <div className="font-medium text-white">{attachment.name}</div>
                              {attachment.size && (
                                <div className="text-sm text-slate-500">{attachment.size}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 hover:bg-purple-500/20 rounded-lg transition"
                              title="Xem"
                            >
                              <Eye size={18} className="text-purple-400" />
                            </a>
                            <a
                              href={fileUrl}
                              download
                              className="p-2 hover:bg-purple-500/20 rounded-lg transition"
                              title="Tải về"
                            >
                              <Download size={18} className="text-purple-400" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {assignment.status === "MISSING" && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 shadow-xl shadow-rose-900/10">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="mt-0.5 text-rose-300" />
                <div>
                  <h2 className="text-base font-semibold text-rose-200">Bài tập đã quá hạn</h2>
                  <p className="mt-1 text-sm text-rose-100/80">
                    Hệ thống đã đánh dấu bài này là quá hạn nên không thể nộp lại từ màn hình student.
                  </p>
                </div>
              </div>
            </div>
          )}

          <HomeworkAiWorkspace
            homeworkStudentId={homeworkId}
            assignment={assignment}
          />

          {/* Submission Section */}
          {isPending && (
            isMultipleChoiceAssignment ? (
              <MultipleChoiceForm
                assignment={assignment}
                homeworkId={homeworkId}
                onSubmitSuccess={handleQuizSubmitSuccess}
                onError={setSubmitError}
                onUnsavedChanges={handleUnsavedChanges}
              />
            ) : (
              <FileSubmissionForm
                assignment={assignment}
                onSubmit={handleFileSubmit}
                isSubmitting={isSubmitting}
                onError={setSubmitError}
              />
            )
          )}

          {/* Submission History */}
          {assignment.submission && (
            <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-b from-slate-900/95 to-slate-950/95 backdrop-blur-xl p-6 shadow-xl shadow-purple-900/20">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileCheck size={20} className="text-purple-400" />
                Bài đã nộp
              </h2>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                  <div className="flex items-center gap-2 text-green-400 font-medium mb-2">
                    <CheckCircle size={18} />
                    Đã nộp {assignment.submission.status === "ON_TIME" ? "đúng hạn" : "trễ"}
                  </div>
                  <div className="text-sm text-slate-400">
                    Nộp lúc: {formatDueDateVn(assignment.submission.submittedAt)} • Lần nộp thứ {assignment.submission.version}
                  </div>
                </div>

                {assignment.submission.content?.files && (
                  <div>
                    <h3 className="font-medium text-white mb-2">File đã nộp:</h3>
                    <div className="space-y-2">
                      {assignment.submission.content.files.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-purple-500/20"
                        >
                          <div className="flex items-center gap-3">
                            <AttachmentIcon type={file.type} />
                            <div>
                              <div className="font-medium text-white">{file.name}</div>
                              {file.size && <div className="text-sm text-slate-500">{file.size}</div>}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button className="p-2 hover:bg-purple-500/20 rounded-lg transition">
                              <Eye size={18} className="text-purple-400" />
                            </button>
                            <button className="p-2 hover:bg-purple-500/20 rounded-lg transition">
                              <Download size={18} className="text-purple-400" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {assignment.submission.content?.text && (
                  <div>
                    <h3 className="font-medium text-white mb-2">Nội dung:</h3>
                    <div className="p-4 rounded-xl bg-slate-800/40 border border-purple-500/20 text-slate-300">
                      {assignment.submission.content.text}
                    </div>
                  </div>
                )}

                {assignment.submission.content?.links &&
                  assignment.submission.content.links.length > 0 && (
                    <div>
                      <h3 className="font-medium text-white mb-2">Link bài làm:</h3>
                      <div className="space-y-2">
                        {assignment.submission.content.links.map((link, index) => (
                          <a
                            key={`${link}-${index}`}
                            href={link}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between gap-3 rounded-xl border border-purple-500/20 bg-slate-800/40 p-3 text-slate-300 transition hover:border-purple-400/40 hover:bg-slate-800/60"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <LinkIcon size={16} className="text-purple-400" />
                              <span className="truncate">{link}</span>
                            </div>
                            <Eye size={16} className="text-purple-400" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Quiz Review */}
          {canReviewQuiz && (
            <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-b from-slate-900/95 to-slate-950/95 backdrop-blur-xl p-6 shadow-xl shadow-purple-900/20">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Eye size={20} className="text-purple-400" />
                Xem lại bài trắc nghiệm
              </h2>

              <div className="grid gap-3 md:grid-cols-3 mb-6">
                <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4">
                  <div className="text-sm text-green-400 font-medium">Câu đúng</div>
                  <div className="mt-1 text-2xl font-black text-green-400">
                    {reviewSummary.correct}
                  </div>
                </div>
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
                  <div className="text-sm text-rose-400 font-medium">Câu sai</div>
                  <div className="mt-1 text-2xl font-black text-rose-400">
                    {reviewSummary.wrong}
                  </div>
                </div>
                <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
                  <div className="text-sm text-blue-400 font-medium">Điểm đạt được</div>
                  <div className="mt-1 text-2xl font-black text-blue-400">
                    {assignment.grading?.earnedPoints ?? reviewSummary.earnedPoints}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {assignment.review!.answerResults.map((result, index) => (
                  <div
                    key={`${result.questionId}-${index}`}
                    className={`rounded-xl border p-4 backdrop-blur-sm ${
                      result.isCorrect === true
                        ? "border-green-500/30 bg-green-500/10"
                        : result.isCorrect === false
                          ? "border-rose-500/30 bg-rose-500/10"
                          : "border-slate-500/30 bg-slate-800/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {result.isCorrect === true ? (
                            <CircleCheck size={18} className="text-green-400" />
                          ) : result.isCorrect === false ? (
                            <CircleX size={18} className="text-rose-400" />
                          ) : (
                            <Clock size={18} className="text-slate-400" />
                          )}
                          <h3 className="font-semibold text-white">
                            Câu {index + 1}{result.questionText ? `: ${result.questionText}` : ""}
                          </h3>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-slate-400">Bạn đã chọn:</span>{" "}
                            <span
                              className={
                                result.isCorrect === true
                                  ? "text-green-400"
                                  : result.isCorrect === false
                                    ? "text-rose-400"
                                    : "text-slate-300"
                              }
                            >
                              {result.selectedOptionText || "Chưa trả lời"}
                            </span>
                          </div>

                          {assignment.review?.showCorrectAnswer && (
                            <div>
                              <span className="font-medium text-slate-400">Đáp án đúng:</span>{" "}
                              <span className="text-green-400">{result.correctOptionText || "-"}</span>
                            </div>
                          )}

                          <div>
                            <span className="font-medium text-slate-400">Điểm:</span>{" "}
                            <span className="text-slate-300">{result.earnedPoints ?? 0}/{result.maxPoints ?? result.earnedPoints ?? 0}</span>
                          </div>

                          {assignment.review?.showExplanation && result.explanation && (
                            <div className="rounded-lg border border-purple-500/20 bg-slate-800/40 p-3 text-slate-400">
                              <span className="font-medium text-purple-400">Giải thích:</span> {result.explanation}
                            </div>
                          )}
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          result.isCorrect === true
                            ? "bg-green-500/30 text-green-300 border border-green-400/40"
                            : result.isCorrect === false
                              ? "bg-rose-500/30 text-rose-300 border border-rose-400/40"
                              : "bg-slate-700/60 text-slate-200 border border-slate-500/40"
                        }`}
                      >
                        {result.isCorrect === true
                          ? "Đúng"
                          : result.isCorrect === false
                            ? "Sai"
                            : "Chưa trả lời"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Leave Warning Modal */}
      {showLeaveWarning && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-purple-500/30 bg-gradient-to-b from-slate-900/95 to-slate-950/95 backdrop-blur-xl shadow-2xl shadow-purple-900/50 animate-in fade-in zoom-in duration-200">
            <div className="border-b border-purple-500/20 p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/30">
                <AlertTriangle className="h-8 w-8 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-white">
                Cảnh báo rời khỏi trang
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Bạn đang làm bài trắc nghiệm. Nếu rời khỏi, hệ thống sẽ tự động nộp bài với những câu đã trả lời.
              </p>
            </div>

            <div className="p-6 space-y-3">
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-sm text-amber-300">
                <div className="flex items-center gap-2 mb-1">
                  <Timer className="h-4 w-4" />
                  <span className="font-medium">Thời gian còn lại:</span>
                  <span className="font-bold">{formatTime(timeRemaining)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  <span className="font-medium">Đã trả lời:</span>
                  <span className="font-bold">{answeredCount}/{totalQuestions}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <LogOut className="h-4 w-4" />
                  <span className="font-medium">Sẽ tự động nộp:</span>
                  <span className="font-bold text-amber-400">Những câu đã trả lời</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleStay}
                  className="flex-1 rounded-xl border border-purple-500/30 bg-slate-800/50 px-4 py-2.5 font-medium text-purple-300 transition hover:bg-slate-700/50 hover:border-purple-400/50 cursor-pointer"
                >
                  Ở lại trang
                </button>
                <button
                  onClick={handleConfirmLeave}
                  className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 font-medium text-white transition hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/30 cursor-pointer"
                >
                  Rời khỏi & Nộp bài
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {submitSuccess && (
        <div className="fixed bottom-6 right-6 z-[10000] bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-xl shadow-xl shadow-green-500/40 flex items-center gap-3 animate-in slide-in-from-bottom-4 border border-green-400/30">
          <CheckCircle size={24} />
          <div>
            <div className="font-semibold">Nộp bài thành công!</div>
            <div className="text-sm text-green-100">Bài tập đã được nộp cho giáo viên</div>
          </div>
          <button
            onClick={() => setSubmitSuccess(false)}
            className="ml-4 p-1 hover:bg-green-600 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Error Toast */}
      {submitError && (
        <div className="fixed bottom-6 right-6 z-[10000] bg-gradient-to-r from-rose-500 to-red-500 text-white px-6 py-4 rounded-xl shadow-xl shadow-rose-500/40 flex items-center gap-3 animate-in slide-in-from-bottom-4 border border-rose-400/30">
          <AlertCircle size={24} />
          <div>
            <div className="font-semibold">Lỗi nộp bài</div>
            <div className="text-sm text-rose-100">{submitError}</div>
          </div>
          <button
            onClick={() => setSubmitError(null)}
            className="ml-4 p-1 hover:bg-rose-600 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>
      )}
    </>
  );
}
