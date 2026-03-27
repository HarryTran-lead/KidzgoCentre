"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Calendar,
  Check,
  Clock,
  Download,
  Edit3,
  FileText,
  Loader2,
  Link as LinkIcon,
  School,
  Sparkles,
  X,
} from "lucide-react";

import { get, post } from "@/lib/axios";

type MCQuestionOption = {
  id?: string;
  optionId?: string;
  text?: string;
  optionText?: string;
  isCorrect?: boolean;
};

type MCQuestion = {
  id?: string;
  questionId?: string;
  questionText?: string;
  questionType?: string;
  points?: number;
  options?: MCQuestionOption[];
  optionsText?: MCQuestionOption[];
};

type MultipleChoiceAnswerItem = {
  questionId?: string;
  selectedOptionId?: string | null;
  selectedOptionText?: string;
  selectedAnswer?: string;
  correctOptionId?: string;
  correctOptionText?: string;
  isCorrect?: boolean;
  points?: number;
  earnedPoints?: number;
};

type SubmissionDetail = {
  id: string;
  assignmentId?: string;
  assignmentTitle?: string;
  assignmentDescription?: string;
  instructions?: string | null;
  classId?: string;
  classCode?: string;
  classTitle?: string;
  dueAt?: string;
  book?: string | null;
  pages?: string | null;
  skills?: string | null;
  submissionType?: string;
  maxScore?: number | null;
  status?: string;
  submittedAt?: string | null;
  gradedAt?: string | null;
  score?: number | null;
  teacherFeedback?: string | null;
  aiFeedback?: string | null;
  attachmentUrls?: string | null;
  textAnswer?: string | null;
  linkUrl?: string | null;
  isLate?: boolean;
  isOverdue?: boolean;
  createdAt?: string;
  updatedAt?: string;
  answers?: any[];
  answerResults?: any[];
  questionAnswers?: any[];
  multipleChoiceAnswers?: any[];
  submissionAnswers?: any[];
  [key: string]: unknown;
};

function parseTextAnswerAsMC(textAnswer?: string | null): MultipleChoiceAnswerItem[] {
  if (!textAnswer) return [];
  try {
    const parsed = JSON.parse(textAnswer);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item: any) => ({
      questionId: item?.QuestionId || item?.questionId,
      selectedOptionId: item?.SelectedOptionId || item?.selectedOptionId,
      selectedOptionText: item?.SelectedOptionText || item?.selectedOptionText,
      selectedAnswer: item?.selectedAnswer,
      correctOptionId: item?.CorrectOptionId || item?.correctOptionId,
      correctOptionText: item?.CorrectOptionText || item?.correctOptionText,
      isCorrect: item?.isCorrect,
      points: item?.points,
      earnedPoints: item?.earnedPoints,
    }));
  } catch {
    return [];
  }
}

function extractMultipleChoiceAnswers(detail?: SubmissionDetail | null): MultipleChoiceAnswerItem[] {
  if (!detail) return [];

  // 1. Thử parse textAnswer như JSON array (format: [{"QuestionId":..., "SelectedOptionId":...}])
  const fromTextAnswer = parseTextAnswerAsMC(detail.textAnswer);
  if (fromTextAnswer.length > 0) return fromTextAnswer;

  // 2. Thử các field array khác
  const candidates = [
    detail.answers,
    detail.answerResults,
    detail.questionAnswers,
    detail.multipleChoiceAnswers,
    detail.submissionAnswers,
  ];

  const raw = candidates.find((item) => Array.isArray(item));
  if (!raw) return [];

  return raw.map((item: any) => ({
    questionId: item?.questionId || item?.QuestionId,
    selectedOptionId: item?.selectedOptionId || item?.SelectedOptionId || null,
    selectedOptionText: item?.selectedOptionText || item?.SelectedOptionText,
    selectedAnswer: item?.selectedAnswer,
    correctOptionId: item?.correctOptionId || item?.CorrectOptionId,
    correctOptionText: item?.correctOptionText || item?.CorrectOptionText,
    isCorrect: item?.isCorrect,
    points: item?.points,
    earnedPoints: item?.earnedPoints,
  }));
}

function formatDateTime(input?: string | null) {
  if (!input) return "-";
  try {
    return new Date(input).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return input;
  }
}

function normalizeLinks(attachmentUrls?: string | null, linkUrl?: string | null) {
  const links: string[] = [];

  const pushIfValid = (value?: string | null) => {
    if (!value) return;
    const trimmed = value.trim();
    if (!trimmed || trimmed.toLowerCase() === "string") return;
    links.push(trimmed);
  };

  if (attachmentUrls) {
    attachmentUrls
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((item) => pushIfValid(item));
  }

  pushIfValid(linkUrl);

  return Array.from(new Set(links));
}

export default function TeacherSubmissionDetailPage() {
  const router = useRouter();
  const params = useParams();

  const locale = String(params.locale || "vi");
  const assignmentId = String(params.id || "");
  const homeworkStudentId = String(params.homeworkStudentId || "");

  const [data, setData] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Assignment questions for multiple choice
  const [assignmentQuestions, setAssignmentQuestions] = useState<MCQuestion[]>([]);

  // Grading state
  const [editingScore, setEditingScore] = useState("");
  const [editingFeedback, setEditingFeedback] = useState("");
  const [isGrading, setIsGrading] = useState(false);
  const [showGradingForm, setShowGradingForm] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!homeworkStudentId) {
        setError("Không tìm thấy homeworkStudentId");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await get<any>(`/api/homework/submissions/${homeworkStudentId}`);
        const body = response?.data || response;
        const detail: SubmissionDetail | null = body?.data || body || null;

        if (!detail?.id) {
          throw new Error("Không có dữ liệu bài nộp");
        }

        setData(detail);

        // Fetch questions for multiple choice — try student homework detail API first
        const assignmentId = detail.assignmentId || detail.id;
        if (homeworkStudentId) {
          try {
            // Try student homework detail API which has full questions with text
            const studentRes = await get<any>(`/api/students/homework/${homeworkStudentId}`);
            const studentBody = studentRes?.data || studentRes;

            let questions: MCQuestion[] = [];
            const candidates = [
              studentBody?.questions,
              studentBody?.data?.questions,
              studentBody?.data?.data?.questions,
              studentBody?.rubric,
            ];
            const rawQuestions = candidates.find((item) => Array.isArray(item));
            if (rawQuestions) {
              questions = rawQuestions.map((q: any) => ({
                id: q?.id || q?.questionId,
                questionId: q?.questionId || q?.id,
                questionText: q?.questionText || q?.content || q?.text,
                questionType: q?.questionType,
                points: q?.points,
                options: Array.isArray(q?.options)
                  ? q.options.map((o: any) => ({
                      id: o?.id || o?.optionId,
                      optionId: o?.optionId || o?.id,
                      text: o?.text || o?.optionText,
                      optionText: o?.optionText || o?.text,
                      isCorrect: o?.isCorrect,
                    }))
                  : [],
                optionsText: Array.isArray(q?.optionsText)
                  ? q.optionsText.map((o: any) => ({
                      id: o?.id || o?.optionId,
                      optionId: o?.optionId || o?.id,
                      text: o?.text || o?.optionText,
                      optionText: o?.optionText || o?.text,
                      isCorrect: o?.isCorrect,
                    }))
                  : [],
              }));
            }
            setAssignmentQuestions(questions);
          } catch {
            // Fallback: try assignment detail API
            if (assignmentId) {
              try {
                const assignmentRes = await get<any>(`/api/homework/${assignmentId}`);
                const assignmentBody = assignmentRes?.data || assignmentRes;

                let questions: MCQuestion[] = [];
                const candidates = [
                  assignmentBody?.questions,
                  assignmentBody?.data?.questions,
                  assignmentBody?.data?.data?.questions,
                ];
                const rawQuestions = candidates.find((item) => Array.isArray(item));
                if (rawQuestions) {
                  questions = rawQuestions.map((q: any) => ({
                    id: q?.id || q?.questionId,
                    questionId: q?.questionId || q?.id,
                    questionText: q?.questionText || q?.content,
                    questionType: q?.questionType,
                    points: q?.points,
                    options: Array.isArray(q?.options)
                      ? q.options.map((o: any) => ({
                          id: o?.id || o?.optionId,
                          optionId: o?.optionId || o?.id,
                          text: o?.text || o?.optionText,
                          optionText: o?.optionText || o?.text,
                          isCorrect: o?.isCorrect,
                        }))
                      : [],
                    optionsText: Array.isArray(q?.optionsText)
                      ? q.optionsText.map((o: any) => ({
                          id: o?.id || o?.optionId,
                          optionId: o?.optionId || o?.id,
                          text: o?.text || o?.optionText,
                          optionText: o?.optionText || o?.text,
                          isCorrect: o?.isCorrect,
                        }))
                      : [],
                  }));
                }
                setAssignmentQuestions(questions);
              } catch {
                // Ignore
              }
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tải được chi tiết bài nộp");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [homeworkStudentId]);

  const links = useMemo(() => normalizeLinks(data?.attachmentUrls, data?.linkUrl), [data]);
  const multipleChoiceAnswers = useMemo(() => extractMultipleChoiceAnswers(data), [data]);

  // Merge assignment questions with student answers
  const questionsWithAnswers = useMemo(() => {
    if (assignmentQuestions.length === 0) {
      return multipleChoiceAnswers.map((answer) => ({
        ...answer,
        questionText: answer.questionId ? `Câu hỏi (${answer.questionId.slice(0, 8)}...)` : "Câu hỏi",
        options: [] as MCQuestionOption[],
        selectedOptionText: answer.selectedOptionId || "Chưa chọn",
        correctOptionText: answer.correctOptionId || "",
      }));
    }

    return assignmentQuestions.map((question) => {
      const questionId = question.questionId || question.id || "";
      const answer = multipleChoiceAnswers.find(
        (a) => (a.questionId || "").toLowerCase() === questionId.toLowerCase()
      );

      const allOptions = [...(question.options || []), ...(question.optionsText || [])];
      const selectedOption = answer?.selectedOptionId
        ? allOptions.find((o) => (o.optionId || o.id || "").toLowerCase() === (answer.selectedOptionId || "").toLowerCase())
        : null;
      const correctOption = allOptions.find((o) => o.isCorrect === true) ||
        (answer?.correctOptionId
          ? allOptions.find((o) => (o.optionId || o.id || "").toLowerCase() === (answer.correctOptionId || "").toLowerCase())
          : null);

      return {
        ...(answer || {}),
        questionId,
        questionText: question.questionText || `Câu hỏi (${questionId.slice(0, 8)}...)`,
        options: allOptions,
        selectedOptionText: selectedOption?.text || selectedOption?.optionText || answer?.selectedOptionId || "Chưa chọn",
        correctOptionText: correctOption?.text || correctOption?.optionText || answer?.correctOptionId || "",
        isCorrect: answer?.isCorrect,
        points: question.points || answer?.points,
        earnedPoints: answer?.earnedPoints,
      };
    });
  }, [assignmentQuestions, multipleChoiceAnswers]);

  const isMultipleChoiceSubmission = useMemo(() => {
    const submissionType = String(data?.submissionType || "").toLowerCase();
    return submissionType.includes("multiple") || submissionType.includes("quiz") || multipleChoiceAnswers.length > 0;
  }, [data?.submissionType, multipleChoiceAnswers.length]);

  const hasTextAnswer = !!(data?.textAnswer && String(data.textAnswer).trim());

  // Fill editing fields when data loads
  useEffect(() => {
    if (data) {
      setEditingScore(data.score !== null && data.score !== undefined ? String(data.score) : "");
      setEditingFeedback(data.teacherFeedback || "");
    }
  }, [data]);

  const handleSaveGrade = useCallback(async () => {
    if (!homeworkStudentId) return;

    const parsedScore = editingScore !== "" ? parseFloat(editingScore) : null;
    if (editingScore !== "" && (isNaN(parsedScore as number) || (parsedScore as number) < 0)) {
      alert("Điểm không hợp lệ");
      return;
    }

    setIsGrading(true);
    try {
      const payload = {
        homeworkStudentId,
        score: parsedScore,
        teacherFeedback: editingFeedback,
      };

      const response = await post<any>(`/api/homework/submissions/${homeworkStudentId}/grade`, payload);
      const body = response?.data || response;
      const updated: SubmissionDetail | null = body?.data || body || null;

      if (updated?.id) {
        setData(updated);
      } else {
        setData((prev) =>
          prev ? { ...prev, score: parsedScore, teacherFeedback: editingFeedback } : prev
        );
      }

      setShowGradingForm(false);
    } catch (err) {
      console.error("Error saving grade:", err);
      alert("Không thể lưu điểm. Vui lòng thử lại.");
    } finally {
      setIsGrading(false);
    }
  }, [homeworkStudentId, editingScore, editingFeedback]);

  const handleGenerateAIFeedback = useCallback(async () => {
    if (!homeworkStudentId) return;
    setAiLoading(true);
    try {
      const response = await post<any>(`/api/homework/submissions/${homeworkStudentId}/ai-feedback`, {});
      const body = response?.data || response;
      const aiText: string = body?.aiFeedback || body?.data?.aiFeedback || "";
      if (aiText) {
        setEditingFeedback((prev) => (prev ? `${prev}\n\n${aiText}` : aiText));
      } else {
        alert("Không tạo được phản hồi AI. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Error generating AI feedback:", err);
      alert("Không tạo được phản hồi AI. Vui lòng thử lại.");
    } finally {
      setAiLoading(false);
    }
  }, [homeworkStudentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={46} className="animate-spin mx-auto text-red-600 mb-4" />
          <p className="text-gray-600">Đang tải chi tiết bài nộp...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6 flex items-center justify-center">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-red-100 to-red-200 flex items-center justify-center">
            <AlertCircle size={30} className="text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Không thể tải dữ liệu</h2>
          <p className="text-gray-600 mb-4">{error || "Bài nộp không tồn tại"}</p>
          <button
            onClick={() => router.push(`/${locale}/portal/teacher/assignments/${assignmentId}`)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all"
          >
            <ArrowLeft size={16} /> Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/${locale}/portal/teacher/assignments/${assignmentId}`)}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-red-50 transition-colors"
          >
            <ArrowLeft size={16} /> Quay lại
          </button>
          <h1 className="text-2xl font-extrabold text-gray-900">Chi tiết bài nộp</h1>
        </div>
      </div>

      <div className="rounded-2xl border border-red-200 bg-white shadow-sm p-6">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white">
            <BookOpen size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{data.assignmentTitle || "-"}</h2>
            <p className="text-sm text-gray-600 mt-1">Mã bài nộp: {data.id}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-6 text-sm">
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1"><School size={15} /> Lớp học</div>
            <div className="font-semibold text-gray-900">{data.classTitle || "-"}</div>
            <div className="text-xs text-gray-500">{data.classCode || "-"}</div>
          </div>

          <div className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1"><Calendar size={15} /> Hạn nộp</div>
            <div className="font-semibold text-gray-900">{formatDateTime(data.dueAt)}</div>
            <div className="text-xs text-gray-500">{data.isOverdue ? "Quá hạn" : "Còn hạn"}</div>
          </div>

          <div className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1"><Clock size={15} /> Ngày nộp</div>
            <div className="font-semibold text-gray-900">{formatDateTime(data.submittedAt)}</div>
            <div className="text-xs text-gray-500">{data.isLate ? "Nộp trễ" : "Đúng hạn"}</div>
          </div>

          <div className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1"><FileText size={15} /> Điểm</div>
            <div className="font-bold text-emerald-600 text-lg">{data.score ?? "Chưa chấm"}</div>
            <div className="text-xs text-gray-500">Tối đa: {data.maxScore ?? "-"}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-red-200 bg-white shadow-sm p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Nội dung bài làm</h3>

          {isMultipleChoiceSubmission ? (
            <>
              <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700 font-medium">
                Bài tập trắc nghiệm
              </div>

              {questionsWithAnswers.length > 0 ? (
                <div className="space-y-3">
                  {questionsWithAnswers.map((item, index) => {
                    const hasSelected = item.selectedOptionId !== null && item.selectedOptionId !== undefined;
                    const isCorrect = item.isCorrect;
                    const selectedColor = hasSelected
                      ? isCorrect === true
                        ? "border-emerald-400 bg-emerald-50/50"
                        : "border-red-400 bg-red-50/50"
                      : "border-gray-200 bg-gray-50/50";

                    return (
                      <div key={index} className={`rounded-xl border-2 p-4 ${selectedColor}`}>
                        <div className="text-sm font-semibold text-gray-900 mb-3">
                          Câu {index + 1}: {item.questionText}
                        </div>

                        {item.options.length > 0 ? (
                          <div className="space-y-2">
                            {item.options.map((option, optIdx) => {
                              const isSelected = (item.selectedOptionId || "").toLowerCase() === (option.optionId || option.id || "").toLowerCase();
                              const isCorrectOpt = option.isCorrect === true;
                              const isCorrectAnswer = (item.correctOptionText || item.correctOptionId || "").toLowerCase() === (option.optionId || option.id || "").toLowerCase();

                              let optStyle = "border-gray-200";
                              let bgStyle = "";
                              if (isCorrectOpt || isCorrectAnswer) {
                                optStyle = "border-emerald-500 bg-emerald-100";
                              }
                              if (isSelected && !isCorrectOpt) {
                                optStyle = "border-red-500 bg-red-100";
                              }
                              if (isSelected && (isCorrectOpt || isCorrectAnswer)) {
                                optStyle = "border-emerald-500 bg-emerald-100 font-semibold";
                              }

                              return (
                                <div
                                  key={optIdx}
                                  className={`rounded-lg border px-3 py-2 text-sm flex items-center gap-2 ${optStyle} ${bgStyle}`}
                                >
                                  <span className={isCorrectOpt || isCorrectAnswer ? "text-emerald-700" : "text-gray-700"}>
                                    {option.text || option.optionText || option.optionId || option.id}
                                  </span>
                                  {isCorrectOpt || isCorrectAnswer ? (
                                    <span className="ml-auto text-xs text-emerald-600 font-medium">Đáp án đúng</span>
                                  ) : isSelected ? (
                                    <span className="ml-auto text-xs text-red-600 font-medium">Đã chọn (sai)</span>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="space-y-1 text-sm">
                            <div>
                              <span className="text-gray-500">Đáp án đã chọn: </span>
                              <span className={hasSelected ? "font-medium text-gray-800" : "italic text-gray-400"}>
                                {item.selectedOptionText}
                              </span>
                            </div>
                            {item.correctOptionText && (
                              <div>
                                <span className="text-gray-500">Đáp án đúng: </span>
                                <span className="font-medium text-emerald-600">{item.correctOptionText}</span>
                              </div>
                            )}
                            {(item.earnedPoints !== undefined || item.points !== undefined) && (
                              <div>
                                <span className="text-gray-500">Điểm: </span>
                                <span className="font-medium text-gray-800">
                                  {item.earnedPoints ?? 0}{item.points !== undefined ? ` / ${item.points}` : ""}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-300 p-6 text-sm text-gray-500 text-center">
                  Chưa có dữ liệu đáp án trắc nghiệm.
                </div>
              )}
            </>
          ) : hasTextAnswer ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 whitespace-pre-wrap text-sm text-gray-700">
              {data.textAnswer}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 p-6 text-sm text-gray-500 text-center">
              Không có câu trả lời dạng text.
            </div>
          )}

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Tệp/Link nộp bài</h4>
            {links.length > 0 ? (
              <div className="space-y-2">
                {links.map((link, idx) => (
                  <div key={`${link}-${idx}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 px-4 py-3">
                    <div className="min-w-0 flex items-center gap-2 text-sm text-gray-700">
                      <LinkIcon size={14} className="text-red-600" />
                      <span className="truncate">{link}</span>
                    </div>
                    <a
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                    >
                      <Download size={14} /> Download
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500 text-center">
                Không có file/link đính kèm.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-red-200 bg-white shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Chấm điểm & Nhận xét</h3>
            {!showGradingForm && (
              <button
                onClick={() => setShowGradingForm(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-semibold text-white hover:shadow-lg transition-all"
              >
                <Edit3 size={14} /> Chấm điểm & Nhận xét
              </button>
            )}
          </div>

          {!showGradingForm ? (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="text-gray-500 mb-1">Trạng thái</div>
                  <div className="font-medium text-gray-900">{data.status || "-"}</div>
                </div>
                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="text-gray-500 mb-1">Điểm</div>
                  <div className="font-bold text-emerald-600 text-xl">
                    {data.score !== null && data.score !== undefined ? `${data.score} / ${data.maxScore ?? 10}` : "Chưa chấm"}
                  </div>
                  {data.gradedAt && (
                    <div className="text-xs text-gray-500 mt-1">
                      Chấm ngày: {formatDateTime(data.gradedAt)}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="text-gray-500 mb-2 font-medium">Mô tả bài tập</div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 whitespace-pre-wrap text-sm text-gray-700">
                  {data.assignmentDescription || "Không có mô tả."}
                </div>
              </div>

              <div>
                <div className="text-gray-500 mb-2 font-medium">Nhận xét của giáo viên</div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 whitespace-pre-wrap text-sm text-gray-700">
                  {data.teacherFeedback || <span className="italic text-gray-400">Chưa có nhận xét</span>}
                </div>
              </div>

              <div>
                <div className="text-gray-500 mb-2 font-medium">Phản hồi từ AI</div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 whitespace-pre-wrap text-sm text-amber-800">
                  {data.aiFeedback || <span className="italic text-amber-400">Chưa có phản hồi AI</span>}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Điểm <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max={data.maxScore ?? 10}
                      step="0.5"
                      value={editingScore}
                      onChange={(e) => setEditingScore(e.target.value)}
                      className="w-full rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 pr-12"
                      placeholder={`0 - ${data.maxScore ?? 10}`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                      / {data.maxScore ?? 10}
                    </span>
                  </div>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleGenerateAIFeedback}
                    disabled={aiLoading}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {aiLoading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Đang tạo phản hồi AI...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        Tạo phản hồi bằng AI
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nhận xét của giáo viên
                </label>
                <textarea
                  value={editingFeedback}
                  onChange={(e) => setEditingFeedback(e.target.value)}
                  rows={6}
                  className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
                  placeholder="Nhập nhận xét cho học viên..."
                />
                <div className="text-xs text-gray-400 mt-1 text-right">
                  {editingFeedback.length} ký tự
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowGradingForm(false);
                    if (data) {
                      setEditingScore(data.score !== null && data.score !== undefined ? String(data.score) : "");
                      setEditingFeedback(data.teacherFeedback || "");
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                >
                  <X size={14} /> Hủy
                </button>
                <button
                  onClick={handleSaveGrade}
                  disabled={isGrading}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isGrading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Check size={14} /> Lưu điểm & Nhận xét
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
