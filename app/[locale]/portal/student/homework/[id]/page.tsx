"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
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
import MultipleChoiceForm from "./components/MultipleChoiceForm";
import FileSubmissionForm from "./components/FileSubmissionForm";

// Status Badge
function StatusBadge({ status }: { status: AssignmentStatus }) {
  const config: Record<AssignmentStatus, { text: string; color: string }> = {
    ASSIGNED: { text: "Đã giao", color: "bg-blue-100 text-blue-700 border-blue-200" },
    SUBMITTED: { text: "Đã nộp", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    PENDING: { text: "Chưa nộp", color: "bg-amber-100 text-amber-700 border-amber-200" },
    MISSING: { text: "Quá hạn", color: "bg-rose-100 text-rose-700 border-rose-200" },
    LATE: { text: "Nộp trễ", color: "bg-sky-100 text-sky-700 border-sky-200" },
  };
  const { text, color } = config[status] || config.PENDING;
  return (
    <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${color}`}>
      {text}
    </span>
  );
}

// Attachment Icon
function AttachmentIcon({ type }: { type: AttachmentType | string }) {
  switch (type) {
    case "PDF": return <FileText size={16} className="text-rose-600" />;
    case "DOC":
    case "DOCX": return <FileText size={16} className="text-blue-600" />;
    case "LINK": return <LinkIcon size={16} className="text-indigo-600" />;
    case "VIDEO": return <Film size={16} className="text-purple-600" />;
    case "IMAGE": return <ImageIcon size={16} className="text-emerald-600" />;
    default: return <FileText size={16} className="text-slate-600" />;
  }
}

export default function AssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const homeworkId = params.id as string;

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
  const handleUnsavedChanges = (hasChanges: boolean) => {
    hasUnsavedChanges.current = hasChanges;
  };

  // Handle navigation attempt
  const handleBackClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Only show warning if:
    // 1. It's a multiple choice assignment
    // 2. There are unsaved changes
    // 3. Assignment is still pending (not submitted)
    const isPending = assignment?.status === "PENDING" || assignment?.status === "MISSING";
    
    if (isMultipleChoiceRef.current && hasUnsavedChanges.current && isPending) {
      setPendingNavigation("/student/homework");
      setShowLeaveWarning(true);
    } else {
      router.back();
    }
  };

  const handleConfirmLeave = async () => {
    setShowLeaveWarning(false);
    
    // Clear any stored quiz state to prevent restoration
    if (homeworkId) {
      const storageKey = `quiz_${homeworkId}`;
      // Don't clear completely, just mark as abandoned
      localStorage.setItem(`${storageKey}_abandoned`, "true");
    }
    
    if (pendingNavigation) {
      router.push(pendingNavigation);
    } else {
      router.back();
    }
    setPendingNavigation(null);
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

  const isPending = assignment?.status === "PENDING" || assignment?.status === "MISSING";
  const canReviewQuiz = isMultipleChoiceAssignment &&
    assignment?.review?.showReview &&
    (assignment.review.answerResults?.length ?? 0) > 0;

  // Format time function for the warning modal
  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  {assignment.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1">
                    <BookOpen size={16} />
                    {assignment.className}
                  </span>
                  <span>•</span>
                  <span>{assignment.subject}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <User size={16} />
                    {assignment.teacher}
                  </span>
                </div>
              </div>
              <StatusBadge status={assignment.status} />
            </div>

            {/* Date & Time Info */}
            <div className="grid md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
              <div>
                <div className="text-sm text-slate-500 mb-1">Ngày giao</div>
                <div className="font-medium text-slate-900 flex items-center gap-2">
                  <Calendar size={16} />
                  {assignment.assignedDate || "Chưa có"}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-1">Hạn nộp</div>
                <div className={`font-medium flex items-center gap-2 ${
                  assignment.status === "MISSING" || assignment.status === "LATE"
                    ? "text-rose-600"
                    : "text-slate-900"
                }`}>
                  <Clock size={16} />
                  {assignment.dueDate || "Chưa có"}
                </div>
              </div>
              {assignment.timeRemaining && (
                <div>
                  <div className="text-sm text-slate-500 mb-1">Thời gian còn lại</div>
                  <div className={`font-semibold flex items-center gap-2 ${
                    assignment.timeRemaining.includes("giờ")
                      ? "text-amber-600"
                      : "text-rose-600"
                  }`}>
                    <AlertCircle size={16} />
                    {assignment.timeRemaining}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description & Requirements - Only show for non-multiple-choice assignments */}
          {!isMultipleChoiceAssignment && (
            <>
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <FileText size={20} />
                  Mô tả bài tập
                </h2>
                <p className="text-slate-700 leading-relaxed mb-6">
                  {assignment.description || "Không có mô tả"}
                </p>

                {assignment.requirements && assignment.requirements.length > 0 && (
                  <>
                    <h3 className="font-semibold text-slate-900 mb-3">Yêu cầu:</h3>
                    <ul className="space-y-2">
                      {assignment.requirements.map((req, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-slate-700">
                          <CheckCircle size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              {/* Rubric - Only show for non-multiple-choice assignments */}
              {assignment.rubric && assignment.rubric.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Award size={20} />
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
                          className="flex items-start justify-between p-4 bg-slate-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-slate-900">{criteria.criteria}</div>
                            <div className="text-sm text-slate-600 mt-1">{criteria.description}</div>
                            {rubricScore?.comment && (
                              <div className="text-sm text-blue-600 mt-2 italic">
                                {rubricScore.comment}
                              </div>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <div className="font-semibold text-slate-900">
                              {rubricScore?.score !== undefined ? (
                                <span className="text-emerald-600">
                                  {rubricScore.score}/{criteria.maxPoints}
                                </span>
                              ) : (
                                <span>{criteria.maxPoints} điểm</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Teacher Attachments - Only show for non-multiple-choice assignments */}
              {assignment.teacherAttachments && assignment.teacherAttachments.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Paperclip size={20} />
                    Tài liệu đính kèm
                  </h2>
                  <div className="space-y-2">
                    {assignment.teacherAttachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition"
                      >
                        <div className="flex items-center gap-3">
                          <AttachmentIcon type={attachment.type} />
                          <div>
                            <div className="font-medium text-slate-900">{attachment.name}</div>
                            {attachment.size && (
                              <div className="text-sm text-slate-500">{attachment.size}</div>
                            )}
                          </div>
                        </div>
                        <button className="p-2 hover:bg-slate-200 rounded-lg transition">
                          <Download size={18} className="text-slate-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

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
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <FileCheck size={20} />
                Bài đã nộp
              </h2>
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-2 text-emerald-700 font-medium mb-2">
                    <CheckCircle size={18} />
                    Đã nộp {assignment.submission.status === "ON_TIME" ? "đúng hạn" : "trễ"}
                  </div>
                  <div className="text-sm text-slate-600">
                    Nộp lúc: {assignment.submission.submittedAt} • Lần nộp thứ {assignment.submission.version}
                  </div>
                </div>

                {assignment.submission.content?.files && (
                  <div>
                    <h3 className="font-medium text-slate-900 mb-2">File đã nộp:</h3>
                    <div className="space-y-2">
                      {assignment.submission.content.files.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <AttachmentIcon type={file.type} />
                            <div>
                              <div className="font-medium text-slate-900">{file.name}</div>
                              {file.size && <div className="text-sm text-slate-500">{file.size}</div>}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button className="p-2 hover:bg-slate-200 rounded-lg">
                              <Eye size={18} className="text-slate-600" />
                            </button>
                            <button className="p-2 hover:bg-slate-200 rounded-lg">
                              <Download size={18} className="text-slate-600" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {assignment.submission.content?.text && (
                  <div>
                    <h3 className="font-medium text-slate-900 mb-2">Nội dung:</h3>
                    <div className="p-4 bg-slate-50 rounded-lg text-slate-700">
                      {assignment.submission.content.text}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Grading Section */}
          {assignment.grading && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Award size={20} />
                Kết quả chấm điểm
              </h2>

              {/* Score */}
              <div className="p-6 bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl mb-6 text-center border border-emerald-200">
                <div className="text-5xl font-bold text-emerald-600 mb-2">
                  {assignment.grading.score}/{assignment.grading.maxScore}
                </div>
                <div className="text-lg text-slate-700">
                  Điểm số: {assignment.grading.percentage}%
                </div>
                {assignment.gradedAt && (
                  <div className="text-sm text-slate-500 mt-2">
                    Chấm điểm lúc: {assignment.gradedAt}
                  </div>
                )}
              </div>

              {/* Teacher Comment */}
              {assignment.grading.teacherComment && (
                <div className="mb-6">
                  <h3 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                    <MessageSquare size={18} />
                    Nhận xét của giáo viên
                  </h3>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-slate-700">
                    {assignment.grading.teacherComment}
                  </div>
                </div>
              )}

              {/* Graded Files */}
              {assignment.grading.gradedFiles && assignment.grading.gradedFiles.length > 0 && (
                <div>
                  <h3 className="font-medium text-slate-900 mb-3">Bài đã chấm:</h3>
                  <div className="space-y-2">
                    {assignment.grading.gradedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <AttachmentIcon type={file.type} />
                          <div>
                            <div className="font-medium text-slate-900">{file.name}</div>
                            {file.size && <div className="text-sm text-slate-500">{file.size}</div>}
                          </div>
                        </div>
                        <button className="p-2 hover:bg-slate-200 rounded-lg">
                          <Download size={18} className="text-slate-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quiz Review */}
          {canReviewQuiz && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Eye size={20} />
                Xem lại bài trắc nghiệm
              </h2>

              <div className="grid gap-3 md:grid-cols-3 mb-6">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <div className="text-sm text-emerald-700 font-medium">Câu đúng</div>
                  <div className="mt-1 text-2xl font-bold text-emerald-700">
                    {assignment.grading?.correctCount ?? assignment.review!.answerResults.filter((item) => item.isCorrect).length}
                  </div>
                </div>
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
                  <div className="text-sm text-rose-700 font-medium">Câu sai</div>
                  <div className="mt-1 text-2xl font-bold text-rose-700">
                    {assignment.grading?.wrongCount ?? assignment.review!.answerResults.filter((item) => !item.isCorrect).length}
                  </div>
                </div>
                <div className="rounded-lg border border-sky-200 bg-sky-50 p-4">
                  <div className="text-sm text-sky-700 font-medium">Điểm đạt được</div>
                  <div className="mt-1 text-2xl font-bold text-sky-700">
                    {assignment.grading?.earnedPoints ?? assignment.review!.answerResults.reduce((sum, item) => sum + (item.earnedPoints || 0), 0)}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {assignment.review!.answerResults.map((result, index) => (
                  <div
                    key={`${result.questionId}-${index}`}
                    className={`rounded-xl border p-4 ${
                      result.isCorrect
                        ? "border-emerald-200 bg-emerald-50/60"
                        : "border-rose-200 bg-rose-50/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {result.isCorrect ? (
                            <CircleCheck size={18} className="text-emerald-600" />
                          ) : (
                            <CircleX size={18} className="text-rose-600" />
                          )}
                          <h3 className="font-semibold text-slate-900">
                            Câu {index + 1}{result.questionText ? `: ${result.questionText}` : ""}
                          </h3>
                        </div>

                        <div className="space-y-2 text-sm text-slate-700">
                          <div>
                            <span className="font-medium">Bạn đã chọn:</span>{" "}
                            <span className={result.isCorrect ? "text-emerald-700" : "text-rose-700"}>
                              {result.selectedOptionText || "Chưa trả lời"}
                            </span>
                          </div>

                          {assignment.review?.showCorrectAnswer && (
                            <div>
                              <span className="font-medium">Đáp án đúng:</span>{" "}
                              <span className="text-emerald-700">{result.correctOptionText || "-"}</span>
                            </div>
                          )}

                          <div>
                            <span className="font-medium">Điểm:</span>{" "}
                            {result.earnedPoints ?? 0}/{result.maxPoints ?? result.earnedPoints ?? 0}
                          </div>

                          {assignment.review?.showExplanation && result.explanation && (
                            <div className="rounded-lg border border-slate-200 bg-white p-3 text-slate-600">
                              <span className="font-medium text-slate-900">Giải thích:</span> {result.explanation}
                            </div>
                          )}
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          result.isCorrect
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {result.isCorrect ? "Đúng" : "Sai"}
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
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="border-b border-gray-100 p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                <AlertTriangle className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Cảnh báo rời khỏi trang
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Bạn đang làm bài trắc nghiệm. Nếu rời khỏi, hệ thống sẽ tự động nộp bài với những câu đã trả lời.
              </p>
            </div>

            <div className="p-6 space-y-3">
              <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
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
                  <span className="font-bold text-amber-800">Những câu đã trả lời</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleStay}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50 cursor-pointer"
                >
                  Ở lại trang
                </button>
                <button
                  onClick={handleConfirmLeave}
                  className="flex-1 rounded-lg bg-amber-600 px-4 py-2.5 font-medium text-white transition hover:bg-amber-700 cursor-pointer"
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
        <div className="fixed bottom-6 right-6 z-[10000] bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-4">
          <CheckCircle size={24} />
          <div>
            <div className="font-semibold">Nộp bài thành công!</div>
            <div className="text-sm text-emerald-100">Bài tập đã được nộp cho giáo viên</div>
          </div>
          <button
            onClick={() => setSubmitSuccess(false)}
            className="ml-4 p-1 hover:bg-emerald-600 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Error Toast */}
      {submitError && (
        <div className="fixed bottom-6 right-6 z-[10000] bg-rose-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-4">
          <AlertCircle size={24} />
          <div>
            <div className="font-semibold">Lỗi nộp bài</div>
            <div className="text-sm text-rose-100">{submitError}</div>
          </div>
          <button
            onClick={() => setSubmitError(null)}
            className="ml-4 p-1 hover:bg-rose-600 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>
      )}
    </>
  );
}