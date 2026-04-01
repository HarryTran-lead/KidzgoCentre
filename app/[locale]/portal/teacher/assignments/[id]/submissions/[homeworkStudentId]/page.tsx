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

import { get, post, put } from "@/lib/axios";
import { toast } from "@/hooks/use-toast";

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
  explanation?: string;
};

type MultipleChoiceAnswerItem = {
  questionId?: string;
  questionText?: string;
  selectedOptionId?: string | null;
  selectedOptionText?: string;
  selectedAnswer?: string;
  correctOptionId?: string;
  correctOptionText?: string;
  isCorrect?: boolean;
  points?: number;
  maxPoints?: number;
  earnedPoints?: number;
  explanation?: string;
  options?: MCQuestionOption[];
};

type MultipleChoiceReview = {
  showReview?: boolean;
  showCorrectAnswer?: boolean;
  showExplanation?: boolean;
  answerResults?: any[];
};

type SubmissionDetail = {
  id: string;
  assignmentId?: string;
  homeworkAssignmentId?: string;
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
  attachmentUrls?: string | string[] | null;
  textAnswer?: string | null;
  linkUrl?: string | null;
  isLate?: boolean;
  isOverdue?: boolean;
  createdAt?: string;
  updatedAt?: string;
  questions?: any[];
  review?: MultipleChoiceReview | null;
  answers?: any[];
  answerResults?: any[];
  questionAnswers?: any[];
  multipleChoiceAnswers?: any[];
  submissionAnswers?: any[];
  [key: string]: unknown;
};

function normalizeComparable(value?: string | null) {
  return String(value || "")
    .trim()
    .replace(/^[A-Z][\.\)]\s*/i, "")
    .toLowerCase();
}

function isUuidLike(value?: string | null) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "").trim()
  );
}

function hasReadableQuestionText(value?: string | null) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return false;
  if (trimmed.includes("Ã") || trimmed.includes("Æ")) return false;
  if (/^question\s*\([0-9a-f]{6,}/i.test(trimmed)) return false;
  if (isUuidLike(trimmed)) return false;
  return true;
}

function hasReadableOptionText(value?: string | null) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return false;
  if (trimmed.includes("Ã") || trimmed.includes("Æ")) return false;
  if (trimmed.toLowerCase() === "chua chon") return false;
  if (isUuidLike(trimmed)) return false;
  return true;
}

function optionLabelFromIndex(index: number) {
  return String.fromCharCode(65 + index);
}

function isMatchingOption(
  optionId: string,
  optionText: string,
  index: number,
  correctAnswer?: string,
  correctOptionId?: string
) {
  const normalizedOptionId = normalizeComparable(optionId);
  const normalizedOptionText = normalizeComparable(optionText);
  const normalizedCorrectAnswer = normalizeComparable(correctAnswer);
  const normalizedCorrectOptionId = normalizeComparable(correctOptionId);
  const optionLabel = normalizeComparable(optionLabelFromIndex(index));

  if (normalizedCorrectOptionId && normalizedOptionId === normalizedCorrectOptionId) {
    return true;
  }

  if (!normalizedCorrectAnswer) {
    return false;
  }

  return [
    normalizedOptionId,
    normalizedOptionText,
    optionLabel,
    normalizeComparable(`${optionLabelFromIndex(index)}. ${optionText}`),
    normalizeComparable(`${optionLabelFromIndex(index)}) ${optionText}`),
  ].includes(normalizedCorrectAnswer);
}

function normalizeQuestionOptions(
  rawOptions: unknown,
  correctAnswer?: string,
  correctOptionId?: string
): MCQuestionOption[] {
  if (!Array.isArray(rawOptions)) {
    return [];
  }

  return rawOptions.map((option: any, index) => {
    const optionId = String(option?.optionId || option?.id || `option-${index}`);
    const optionText =
      typeof option === "string"
        ? option
        : String(option?.text || option?.optionText || option?.content || option?.label || "");

    return {
      id: optionId,
      optionId,
      text: optionText,
      optionText,
      isCorrect:
        option?.isCorrect === true ||
        isMatchingOption(optionId, optionText, index, correctAnswer, correctOptionId),
    };
  });
}

function normalizeQuestion(rawQuestion: any, index: number): MCQuestion {
  const questionId = rawQuestion?.questionId || rawQuestion?.id || `question-${index}`;
  const correctAnswer = rawQuestion?.correctAnswer || rawQuestion?.correctOptionText || rawQuestion?.answer;
  const correctOptionId = rawQuestion?.correctOptionId || rawQuestion?.correctAnswerId;
  const rawOptions = Array.isArray(rawQuestion?.options)
    ? rawQuestion.options
    : Array.isArray(rawQuestion?.optionsText)
      ? rawQuestion.optionsText
      : Array.isArray(rawQuestion?.optionTexts)
        ? rawQuestion.optionTexts
        : [];

  const options = normalizeQuestionOptions(rawOptions, correctAnswer, correctOptionId);

  return {
    id: questionId,
    questionId,
    questionText: rawQuestion?.questionText || rawQuestion?.text || rawQuestion?.content,
    questionType: rawQuestion?.questionType,
    points: rawQuestion?.points ?? rawQuestion?.maxPoints,
    options,
    optionsText: options,
    explanation: rawQuestion?.explanation,
  };
}

function extractMultipleChoiceQuestions(source: any): MCQuestion[] {
  const payload =
    source?.data?.data ??
    source?.data ??
    source;

  const candidates = [
    payload?.questions,
    payload?.review?.questions,
    payload?.data?.questions,
    payload?.data?.review?.questions,
    Array.isArray(payload?.review?.answerResults)
      ? payload.review.answerResults
      : undefined,
    Array.isArray(payload?.data?.review?.answerResults)
      ? payload.data.review.answerResults
      : undefined,
  ];

  const rawQuestions = candidates.find((item) => Array.isArray(item));
  if (!Array.isArray(rawQuestions)) {
    return [];
  }

  return rawQuestions.map((question, index) => normalizeQuestion(question, index));
}

function parseTextAnswerAsMC(textAnswer?: string | null): MultipleChoiceAnswerItem[] {
  if (!textAnswer) return [];
  try {
    const parsed = JSON.parse(textAnswer);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item: any) => ({
      questionId: item?.QuestionId || item?.questionId,
      questionText: item?.QuestionText || item?.questionText,
      selectedOptionId: item?.SelectedOptionId || item?.selectedOptionId,
      selectedOptionText: item?.SelectedOptionText || item?.selectedOptionText,
      selectedAnswer: item?.selectedAnswer,
      correctOptionId: item?.CorrectOptionId || item?.correctOptionId,
      correctOptionText: item?.CorrectOptionText || item?.correctOptionText,
      isCorrect: item?.isCorrect,
      points: item?.points ?? item?.maxPoints,
      maxPoints: item?.maxPoints ?? item?.points,
      earnedPoints: item?.earnedPoints,
      explanation: item?.explanation,
      options: normalizeQuestionOptions(item?.options, item?.correctOptionText, item?.correctOptionId),
    }));
  } catch {
    return [];
  }
}

function extractDetailPayload(source: any) {
  return source?.data?.data ?? source?.data ?? source ?? null;
}

function mergeSubmissionDetail(
  prev: SubmissionDetail | null | undefined,
  next: SubmissionDetail | null | undefined
) {
  if (!next) return prev ?? null;
  if (!prev) return next;

  const merged: SubmissionDetail = { ...prev };

  (Object.entries(next) as [keyof SubmissionDetail, SubmissionDetail[keyof SubmissionDetail]][]).forEach(
    ([key, value]) => {
      if (value !== undefined) {
        (merged as SubmissionDetail)[key] = value;
      }
    }
  );

  return merged;
}

function extractMultipleChoiceAnswers(detail?: SubmissionDetail | null): MultipleChoiceAnswerItem[] {
  if (!detail) return [];

  // 1. Thử parse textAnswer như JSON array (format: [{"QuestionId":..., "SelectedOptionId":...}])
  const fromTextAnswer = parseTextAnswerAsMC(detail.textAnswer);
  if (fromTextAnswer.length > 0) return fromTextAnswer;

  // 2. Thử các field array khác
  const candidates = [
    detail.review?.answerResults,
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
    questionText: item?.questionText || item?.QuestionText,
    selectedOptionId: item?.selectedOptionId || item?.SelectedOptionId || null,
    selectedOptionText:
      item?.selectedOptionText ||
      item?.SelectedOptionText ||
      item?.studentAnswer ||
      item?.selectedAnswer,
    selectedAnswer: item?.selectedAnswer || item?.studentAnswer,
    correctOptionId: item?.correctOptionId || item?.CorrectOptionId,
    correctOptionText:
      item?.correctOptionText ||
      item?.CorrectOptionText ||
      item?.correctAnswer,
    isCorrect: item?.isCorrect,
    points: item?.points ?? item?.maxPoints,
    maxPoints: item?.maxPoints ?? item?.points,
    earnedPoints: item?.earnedPoints ?? item?.score,
    explanation: item?.explanation,
    options: normalizeQuestionOptions(
      item?.options,
      item?.correctOptionText || item?.correctAnswer,
      item?.correctOptionId
    ),
  }));
}

function formatDateTime(input?: string | null) {
  if (!input) return "-";
  try {
    const date = new Date(input);
    // Nếu là ISO string có timezone, dùng toLocaleString với timezone
    // Nếu là string dạng "2026-04-01T23:59:00" (không có Z), parse đúng theo giờ VN
    const match = String(input).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2})?$/);
    if (match) {
      const [, year, month, day, hours, minutes] = match;
      const vnMs = Date.UTC(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours) - 7,
        parseInt(minutes)
      );
      return new Date(vnMs).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Ho_Chi_Minh",
      });
    }
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Ho_Chi_Minh",
    });
  } catch {
    return input;
  }
}

function normalizeLinks(attachmentUrls?: string | string[] | null, linkUrl?: string | null) {
  const links: string[] = [];

  const pushIfValid = (value?: string | null) => {
    if (!value) return;
    const trimmed = value.trim();
    if (!trimmed || trimmed.toLowerCase() === "string") return;
    links.push(trimmed);
  };

  if (Array.isArray(attachmentUrls)) {
    attachmentUrls.forEach((item) => pushIfValid(item));
  } else if (attachmentUrls) {
    attachmentUrls
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((item) => pushIfValid(item));
  }

  pushIfValid(linkUrl);

  return Array.from(new Set(links));
}

function normalizeStatusLabel(status?: string | null) {
  switch (String(status || "").toLowerCase()) {
    case "assigned":
      return "Đã giao";
    case "submitted":
      return "Đã nộp";
    case "graded":
      return "Đã chấm";
    case "late":
      return "Nộp trễ";
    case "missing":
      return "Thiếu bài";
    default:
      return status || "-";
  }
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
  const [isMarkingStatus, setIsMarkingStatus] = useState(false);

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
        const detailQuestions = extractMultipleChoiceQuestions(detail);
        setAssignmentQuestions(detailQuestions);

        const resolvedAssignmentId = String(
          detail.assignmentId ||
            detail.homeworkAssignmentId ||
            assignmentId ||
            detail.id ||
            ""
        );

        if (detailQuestions.length === 0) {
          try {
            const studentRes = await get<any>(`/api/students/homework/${homeworkStudentId}`);
            const studentBody = studentRes?.data || studentRes;
            const studentDetail = extractDetailPayload(studentBody);
            const studentQuestions = extractMultipleChoiceQuestions(studentDetail);

            if (studentQuestions.length > 0) {
              setAssignmentQuestions(studentQuestions);
            }

            if (studentDetail) {
              setData((prev) =>
                prev
                  ? {
                      ...prev,
                      questions:
                        Array.isArray(studentDetail.questions) && studentDetail.questions.length > 0
                          ? studentDetail.questions
                          : prev.questions,
                      review: studentDetail.review || prev.review,
                      answerResults:
                        Array.isArray(studentDetail.answerResults) && studentDetail.answerResults.length > 0
                          ? studentDetail.answerResults
                          : Array.isArray(studentDetail.review?.answerResults)
                            ? studentDetail.review.answerResults
                            : prev.answerResults,
                      multipleChoiceAnswers:
                        Array.isArray(studentDetail.multipleChoiceAnswers) && studentDetail.multipleChoiceAnswers.length > 0
                          ? studentDetail.multipleChoiceAnswers
                          : prev.multipleChoiceAnswers,
                      textAnswer: prev.textAnswer || studentDetail.textAnswer,
                    }
                  : prev
              );
            }
          } catch {
            // Ignore student detail fetch failures.
          }
        }

        if (detailQuestions.length === 0 && resolvedAssignmentId) {
          try {
            const assignmentRes = await get<any>(`/api/homework/${resolvedAssignmentId}`);
            const assignmentBody = assignmentRes?.data || assignmentRes;
            const assignmentDetail = extractDetailPayload(assignmentBody);
            const questions = extractMultipleChoiceQuestions(assignmentDetail);
            if (questions.length > 0) {
              setAssignmentQuestions(questions);
            }
          } catch {
            // Ignore assignment question fetch failures.
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
  const showCorrectAnswer = data?.review?.showCorrectAnswer ?? true;
  const showExplanation = data?.review?.showExplanation ?? true;

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

  const quizQuestions = useMemo(() => {
    if (assignmentQuestions.length === 0) {
      return multipleChoiceAnswers.map((answer) => ({
        ...answer,
        questionText:
          answer.questionText ||
          (answer.questionId ? `CÃ¢u há»i (${answer.questionId.slice(0, 8)}...)` : "CÃ¢u há»i"),
        options: answer.options || ([] as MCQuestionOption[]),
        selectedOptionText:
          answer.selectedOptionText || answer.selectedOptionId || "ChÆ°a chá»n",
        correctOptionText:
          answer.correctOptionText || answer.correctOptionId || "",
      }));
    }

    return assignmentQuestions.map((question) => {
      const questionId = question.questionId || question.id || "";
      const answer = multipleChoiceAnswers.find(
        (item) => (item.questionId || "").toLowerCase() === questionId.toLowerCase()
      );
      const normalizedOptions =
        question.options && question.options.length > 0
          ? question.options
          : question.optionsText && question.optionsText.length > 0
            ? question.optionsText
            : answer?.options || [];
      const selectedOption = answer?.selectedOptionId
        ? normalizedOptions.find(
            (option) =>
              (option.optionId || option.id || "").toLowerCase() ===
              (answer.selectedOptionId || "").toLowerCase()
          )
        : null;
      const correctOption =
        normalizedOptions.find((option) => option.isCorrect === true) ||
        (answer?.correctOptionId
          ? normalizedOptions.find(
              (option) =>
                (option.optionId || option.id || "").toLowerCase() ===
                (answer.correctOptionId || "").toLowerCase()
            )
          : null);

      return {
        ...(answer || {}),
        questionId,
        questionText:
          question.questionText ||
          answer?.questionText ||
          `CÃ¢u há»i (${questionId.slice(0, 8)}...)`,
        options: normalizedOptions,
        selectedOptionText:
          selectedOption?.text ||
          selectedOption?.optionText ||
          answer?.selectedOptionText ||
          answer?.selectedOptionId ||
          "ChÆ°a chá»n",
        correctOptionText:
          correctOption?.text ||
          correctOption?.optionText ||
          answer?.correctOptionText ||
          answer?.correctOptionId ||
          "",
        isCorrect: answer?.isCorrect,
        points: question.points || answer?.points || answer?.maxPoints,
        maxPoints: answer?.maxPoints || question.points || answer?.points,
        earnedPoints: answer?.earnedPoints,
        explanation: answer?.explanation || question.explanation,
      };
    });
  }, [assignmentQuestions, multipleChoiceAnswers]);

  const multipleChoiceSummary = useMemo(() => {
    const total = quizQuestions.length;
    const correct = quizQuestions.filter((item) => item.isCorrect === true).length;
    const wrong = quizQuestions.filter(
      (item) =>
        item.isCorrect === false &&
        Boolean(item.selectedOptionId || item.selectedOptionText || item.selectedAnswer)
    ).length;
    const skipped = total - correct - wrong;
    const earnedPoints = quizQuestions.reduce(
      (sum, item) => sum + Number(item.earnedPoints ?? 0),
      0
    );
    const totalPoints = quizQuestions.reduce(
      (sum, item) => sum + Number(item.maxPoints ?? item.points ?? 0),
      0
    );

    return {
      total,
      correct,
      wrong,
      skipped,
      earnedPoints,
      totalPoints,
    };
  }, [quizQuestions]);

  const teacherQuizQuestions = useMemo(
    () =>
      quizQuestions.map((item) => ({
        ...item,
        questionText: hasReadableQuestionText(item.questionText) ? item.questionText : "",
        selectedOptionText: hasReadableOptionText(item.selectedOptionText)
          ? item.selectedOptionText
          : hasReadableOptionText(item.selectedAnswer)
            ? item.selectedAnswer
            : "",
        correctOptionText: hasReadableOptionText(item.correctOptionText) ? item.correctOptionText : "",
      })),
    [quizQuestions]
  );

  const teacherQuizSummary = useMemo(() => {
    const total = teacherQuizQuestions.length;
    const correct = teacherQuizQuestions.filter((item) => item.isCorrect === true).length;
    const wrong = teacherQuizQuestions.filter(
      (item) =>
        item.isCorrect === false &&
        Boolean(item.selectedOptionId || item.selectedOptionText || item.selectedAnswer)
    ).length;
    const skipped = total - correct - wrong;
    const earnedPoints = teacherQuizQuestions.reduce(
      (sum, item) => sum + Number(item.earnedPoints ?? 0),
      0
    );
    const totalPoints = teacherQuizQuestions.reduce(
      (sum, item) => sum + Number(item.maxPoints ?? item.points ?? 0),
      0
    );

    return {
      total,
      correct,
      wrong,
      skipped,
      earnedPoints,
      totalPoints,
    };
  }, [teacherQuizQuestions]);

  const teacherQuizMissingDetail = useMemo(
    () =>
      teacherQuizQuestions.some((item) => {
        const hasSelection =
          Boolean(item.selectedOptionId) ||
          Boolean(item.selectedOptionText) ||
          Boolean(item.selectedAnswer);

        return (
          !hasReadableQuestionText(item.questionText) ||
          (hasSelection && !hasReadableOptionText(item.selectedOptionText)) ||
          (showCorrectAnswer &&
            Boolean(item.correctOptionText) &&
            !hasReadableOptionText(item.correctOptionText))
        );
      }),
    [teacherQuizQuestions, showCorrectAnswer]
  );

  const isMultipleChoiceSubmission = useMemo(() => {
    const submissionType = String(data?.submissionType || "").toLowerCase();
    return submissionType.includes("multiple") || submissionType.includes("quiz") || multipleChoiceAnswers.length > 0;
  }, [data?.submissionType, multipleChoiceAnswers.length]);

  const hasTextAnswer = !!(data?.textAnswer && String(data.textAnswer).trim());
  const normalizedStatus = String(data?.status || "").toLowerCase();
  const canMarkLate = normalizedStatus === "assigned";
  const canMarkMissing = normalizedStatus === "assigned" || normalizedStatus === "late";

  // Fill editing fields when data loads
  useEffect(() => {
    if (data) {
      setEditingScore(data.score !== null && data.score !== undefined ? String(data.score) : "");
      setEditingFeedback(data.teacherFeedback || "");
    }
  }, [data]);

  const handleSaveGrade = useCallback(async () => {
    if (!homeworkStudentId) return;

    // Kiểm tra nếu bài nộp quá hạn → tự động điểm 0 và nhận xét "Quá hạn nộp bài"
    const isOverdueSubmission = data?.isOverdue === true;
    const overdueFeedback = "Quá hạn nộp bài";

    const finalScore = isOverdueSubmission ? 0 : (editingScore !== "" ? parseFloat(editingScore) : null);
    const finalFeedback = isOverdueSubmission ? overdueFeedback : editingFeedback;

    // For multiple choice, we only save feedback, not score
    const payload = isMultipleChoiceSubmission
      ? {
          homeworkStudentId,
          teacherFeedback: finalFeedback,
        }
      : {
          homeworkStudentId,
          score: finalScore,
          teacherFeedback: finalFeedback,
        };

    if (!isMultipleChoiceSubmission && editingScore !== "" && (isNaN(finalScore as number) || (finalScore as number) < 0)) {
      toast({ title: "Lỗi", description: "Điểm không hợp lệ", type: "destructive" });
      return;
    }

    setIsGrading(true);
    try {
      const response = await post<any>(`/api/homework/submissions/${homeworkStudentId}/grade`, payload);
      const body = response?.data || response;
      const updated: SubmissionDetail | null = body?.data || body || null;

      setData((prev) => {
        const merged = mergeSubmissionDetail(prev, updated);
        if (!merged) {
          return merged;
        }

        return {
          ...merged,
          status: updated?.status ?? merged.status ?? "Graded",
          score:
            updated?.score !== undefined
              ? updated.score
              : isMultipleChoiceSubmission
                ? merged.score
                : (finalScore as number | null),
          teacherFeedback:
            updated?.teacherFeedback !== undefined
              ? updated.teacherFeedback
              : finalFeedback,
          gradedAt: updated?.gradedAt ?? merged.gradedAt ?? new Date().toISOString(),
        };
      });

      setShowGradingForm(false);
      toast({ title: "Thành công", description: "Lưu điểm thành công!", type: "success" });
    } catch (err) {
      console.error("Error saving grade:", err);
      toast({ title: "Lỗi", description: "Không thể lưu điểm. Vui lòng thử lại.", type: "destructive" });
    } finally {
      setIsGrading(false);
    }
  }, [homeworkStudentId, editingScore, editingFeedback, isMultipleChoiceSubmission, data]);

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
        toast({ title: "Thông báo", description: "Không tạo được phản hồi AI. Vui lòng thử lại.", type: "warning" });
      }
    } catch (err) {
      console.error("Error generating AI feedback:", err);
      toast({ title: "Lỗi", description: "Không tạo được phản hồi AI. Vui lòng thử lại.", type: "destructive" });
    } finally {
      setAiLoading(false);
    }
  }, [homeworkStudentId]);

  const handleMarkStatus = useCallback(async (status: "Late" | "Missing") => {
    if (!homeworkStudentId) return;

    setIsMarkingStatus(true);
    try {
      const response = await put<any>(
        `/api/homework/submissions/${homeworkStudentId}/mark-status`,
        {
          homeworkStudentId,
          status,
        }
      );
      const body = response?.data || response;
      const updated = body?.data || body;
      const nextStatus = String(updated?.status || status);

      setData((prev) =>
        prev
          ? {
              ...prev,
              status: nextStatus,
              score:
                nextStatus.toLowerCase() === "missing"
                  ? 0
                  : prev.score,
              gradedAt:
                nextStatus.toLowerCase() === "missing"
                  ? prev.gradedAt || new Date().toISOString()
                  : prev.gradedAt,
              teacherFeedback:
                nextStatus.toLowerCase() === "missing"
                  ? prev.teacherFeedback || "Quá hạn nộp bài"
                  : prev.teacherFeedback,
              isLate: nextStatus.toLowerCase() === "late" ? true : prev.isLate,
              isOverdue:
                nextStatus.toLowerCase() === "missing" ? true : prev.isOverdue,
            }
          : prev
      );

      toast({
        title: "Thành công",
        description:
          status === "Late"
            ? "Đã đánh dấu bài nộp trễ."
            : "Đã đánh dấu bài thiếu.",
        type: "success",
      });
    } catch (err) {
      console.error("Error marking status:", err);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái bài nộp.",
        type: "destructive",
      });
    } finally {
      setIsMarkingStatus(false);
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
            <div className="font-bold text-emerald-600 text-lg">
              {data.score !== null && data.score !== undefined ? data.score : (data.isOverdue ? 0 : "Chưa chấm")}
            </div>
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

              {teacherQuizQuestions.length > 0 ? (
                <div className="space-y-3">
                  {teacherQuizMissingDetail && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      Backend chua tra day du noi dung cau hoi va dap an cho teacher. Trang nay dang an cac UUID fallback de tranh hien sai du lieu.
                    </div>
                  )}
                  <div className="grid gap-3 md:grid-cols-4">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <div className="text-sm font-medium text-emerald-700">Cau dung</div>
                      <div className="mt-1 text-2xl font-extrabold text-emerald-800">
                        {teacherQuizSummary.correct}
                      </div>
                    </div>
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                      <div className="text-sm font-medium text-rose-700">Cau sai</div>
                      <div className="mt-1 text-2xl font-extrabold text-rose-800">
                        {teacherQuizSummary.wrong}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-sm font-medium text-slate-700">Chua tra loi</div>
                      <div className="mt-1 text-2xl font-extrabold text-slate-800">
                        {teacherQuizSummary.skipped}
                      </div>
                    </div>
                    <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
                      <div className="text-sm font-medium text-sky-700">Diem</div>
                      <div className="mt-1 text-2xl font-extrabold text-sky-800">
                        {teacherQuizSummary.earnedPoints}
                        {teacherQuizSummary.totalPoints > 0
                          ? ` / ${teacherQuizSummary.totalPoints}`
                          : ""}
                      </div>
                    </div>
                  </div>

                  {teacherQuizQuestions.map((item, index) => {
                    const hasSelected =
                      Boolean(item.selectedOptionId) ||
                      Boolean(
                        item.selectedOptionText &&
                          String(item.selectedOptionText).trim().toLowerCase() !== "chua chon"
                      ) ||
                      Boolean(item.selectedAnswer);
                    const isCorrect = item.isCorrect;
                    const selectedColor = hasSelected
                      ? isCorrect === true
                        ? "border-emerald-400 bg-emerald-50/50"
                        : "border-red-400 bg-red-50/50"
                      : "border-gray-200 bg-gray-50/50";
                    const readableQuestionText = hasReadableQuestionText(item.questionText)
                      ? String(item.questionText).trim()
                      : "";
                    const questionLabel = readableQuestionText
                      ? `Cau ${index + 1}: ${readableQuestionText}`
                      : `Cau ${index + 1}`;
                    const selectedOptionLabel = hasReadableOptionText(item.selectedOptionText)
                      ? item.selectedOptionText
                      : hasSelected
                        ? "Backend chua tra chi tiet lua chon"
                        : "Chua tra loi";
                    const shouldShowCorrectAnswer = showCorrectAnswer && Boolean(item.correctOptionText || item.correctOptionId);
                    const correctOptionLabel = hasReadableOptionText(item.correctOptionText)
                      ? item.correctOptionText
                      : "Backend chua tra chi tiet dap an";

                    return (
                      <div key={index} className={`rounded-xl border-2 p-4 ${selectedColor}`}>
                        <div className="text-sm font-semibold text-gray-900 mb-3">
                          {questionLabel}
                        </div>

                        {item.options.length > 0 ? (
                          <div className="space-y-2">
                            {item.options.map((option, optIdx) => {
                              const optionId = String(option.optionId || option.id || "");
                              const rawOptionText = String(option.text || option.optionText || "");
                              const optionLabel = hasReadableOptionText(rawOptionText)
                                ? rawOptionText
                                : `Lua chon ${optionLabelFromIndex(optIdx)}`;
                              const isSelected =
                                normalizeComparable(item.selectedOptionId) === normalizeComparable(optionId) ||
                                (
                                  !item.selectedOptionId &&
                                  hasReadableOptionText(item.selectedOptionText) &&
                                  normalizeComparable(item.selectedOptionText) === normalizeComparable(rawOptionText)
                                );
                              const isCorrectOpt = option.isCorrect === true;
                              const isCorrectAnswer = isMatchingOption(
                                optionId,
                                rawOptionText,
                                optIdx,
                                item.correctOptionText,
                                item.correctOptionId
                              );

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
                                    {optionLabel}
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
                                {selectedOptionLabel}
                              </span>
                            </div>
                            {shouldShowCorrectAnswer && (
                              <div>
                                <span className="text-gray-500">Đáp án đúng: </span>
                                <span className="font-medium text-emerald-600">{correctOptionLabel}</span>
                              </div>
                            )}
                            {(item.earnedPoints !== undefined || item.points !== undefined) && (
                              <div>
                                <span className="text-gray-500">Điểm: </span>
                                <span className="font-medium text-gray-800">
                                  {item.earnedPoints ?? 0}
                                  {item.maxPoints !== undefined || item.points !== undefined
                                    ? ` / ${item.maxPoints ?? item.points}`
                                    : ""}
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

          {/* Only show attachments section for non-multiple choice submissions */}
          {!isMultipleChoiceSubmission && (
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
          )}
        </div>

        <div className="rounded-2xl border border-red-200 bg-white shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {isMultipleChoiceSubmission ? "Nhận xét" : "Chấm điểm & Nhận xét"}
            </h3>
            {!showGradingForm && (
              <div className="flex flex-wrap items-center justify-end gap-2">
                {canMarkLate && (
                  <button
                    onClick={() => handleMarkStatus("Late")}
                    disabled={isMarkingStatus}
                    className="inline-flex items-center gap-2 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm font-semibold text-yellow-800 transition hover:bg-yellow-100 disabled:opacity-50"
                  >
                    {isMarkingStatus ? <Loader2 size={14} className="animate-spin" /> : <Clock size={14} />}
                    Đánh dấu trễ
                  </button>
                )}
                {canMarkMissing && (
                  <button
                    onClick={() => handleMarkStatus("Missing")}
                    disabled={isMarkingStatus}
                    className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                  >
                    {isMarkingStatus ? <Loader2 size={14} className="animate-spin" /> : <AlertCircle size={14} />}
                    Đánh dấu thiếu
                  </button>
                )}
              <button
                onClick={() => {
                  if (data?.isOverdue) {
                    setEditingScore("0");
                    setEditingFeedback("Quá hạn nộp bài");
                  } else {
                    setEditingScore(data?.score !== null && data?.score !== undefined ? String(data.score) : "");
                    setEditingFeedback(data?.teacherFeedback || "");
                  }
                  setShowGradingForm(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-semibold text-white hover:shadow-lg transition-all"
              >
                <Edit3 size={14} /> 
                {isMultipleChoiceSubmission ? "Nhận xét" : "Chấm điểm & Nhận xét"}
              </button>
              </div>
            )}
          </div>

          {!showGradingForm ? (
            <div className="space-y-4 text-sm">
              {/* Only show score and status for non-multiple choice */}
              {!isMultipleChoiceSubmission && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-gray-200 p-4">
                      <div className="text-gray-500 mb-1">Trạng thái</div>
                      <div className="font-medium text-gray-900">{normalizeStatusLabel(data.status)}</div>
                    </div>
                    <div className="rounded-xl border border-gray-200 p-4">
                      <div className="text-gray-500 mb-1">Điểm</div>
                      <div className="font-bold text-emerald-600 text-xl">
                        {data.score !== null && data.score !== undefined ? `${data.score} / ${data.maxScore ?? 10}` : (data.isOverdue ? `0 / ${data.maxScore ?? 10}` : "Chưa chấm")}
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
                </>
              )}

              <div>
                <div className="text-gray-500 mb-2 font-medium">Nhận xét của giáo viên</div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 whitespace-pre-wrap text-sm text-gray-700">
                  {data.isOverdue ? "Quá hạn nộp bài" : (data.teacherFeedback || <span className="italic text-gray-400">Chưa có nhận xét</span>)}
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
              {/* Only show score input for non-multiple choice */}
              {!isMultipleChoiceSubmission && (
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
              )}

              {/* For multiple choice, only show AI feedback button */}
              {isMultipleChoiceSubmission && (
                <div className="flex justify-end">
                  <button
                    onClick={handleGenerateAIFeedback}
                    disabled={aiLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
              )}

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
                      <Check size={14} /> Lưu
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
