"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { nowISOVN } from "@/lib/datetime";
import AiQuickGradeCard, {
  type HomeworkQuickGradeResult,
} from "./components/AiQuickGradeCard";

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

function isValueDefined<T>(value: T | null | undefined): value is T {
  return value !== undefined && value !== null;
}

function pickFirstDefined<T>(...values: Array<T | null | undefined>): T | undefined {
  for (const value of values) {
    if (isValueDefined(value)) {
      return value;
    }
  }

  return undefined;
}

function normalizeComparable(value?: string | number | null) {
  return String(value ?? "")
    .trim()
    .replace(/^[A-Z][\.\)]\s*/i, "")
    .toLowerCase();
}

function isUuidLike(value?: string | number | null) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value ?? "").trim()
  );
}

function hasReadableQuestionText(value?: string | number | null) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return false;
  if (trimmed.includes("Ã") || trimmed.includes("Æ")) return false;
  if (/^question\s*\([0-9a-f]{6,}/i.test(trimmed)) return false;
  if (isUuidLike(trimmed)) return false;
  return true;
}

function hasReadableOptionText(value?: string | number | null) {
  const trimmed = String(value ?? "").trim();
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
  correctAnswer?: string | number | null,
  correctOptionId?: string | number | null
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
    normalizeComparable(String(index)),
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
    const optionId = String(
      pickFirstDefined(option?.optionId, option?.id, index) ?? `option-${index}`
    );
    const optionText =
      typeof option === "string"
        ? option
        : String(
            pickFirstDefined(
              option?.text,
              option?.optionText,
              option?.content,
              option?.label,
              ""
            ) ?? ""
          );

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
  const questionId = String(
    pickFirstDefined(rawQuestion?.questionId, rawQuestion?.id, `question-${index}`)
  );
  const correctAnswer = pickFirstDefined(
    rawQuestion?.correctAnswer,
    rawQuestion?.correctOptionText,
    rawQuestion?.answer,
    rawQuestion?.correctAnswerIndex
  );
  const correctOptionId = pickFirstDefined(
    rawQuestion?.correctOptionId,
    rawQuestion?.correctAnswerId
  );
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
      questionId: pickFirstDefined(item?.QuestionId, item?.questionId)?.toString(),
      questionText: pickFirstDefined(item?.QuestionText, item?.questionText),
      selectedOptionId: pickFirstDefined(
        item?.SelectedOptionId,
        item?.selectedOptionId
      )?.toString(),
      selectedOptionText: pickFirstDefined(
        item?.SelectedOptionText,
        item?.selectedOptionText
      ),
      selectedAnswer: item?.selectedAnswer,
      correctOptionId: pickFirstDefined(
        item?.CorrectOptionId,
        item?.correctOptionId
      )?.toString(),
      correctOptionText: pickFirstDefined(
        item?.CorrectOptionText,
        item?.correctOptionText
      ),
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

  // 1. Ưu tiên các field array có grading info (isCorrect, earnedPoints)
  const candidates = [
    detail.review?.answerResults,
    detail.answers,
    detail.answerResults,
    detail.questionAnswers,
    detail.multipleChoiceAnswers,
    detail.submissionAnswers,
  ];

  const raw = candidates.find((item) => Array.isArray(item));

  // 2. Nếu không tìm thấy, fallback sang parse textAnswer
  if (!raw) {
    const fromTextAnswer = parseTextAnswerAsMC(detail.textAnswer);
    if (fromTextAnswer.length > 0) return fromTextAnswer;
    return [];
  }

  return raw.map((item: any) => ({
    questionId: pickFirstDefined(item?.questionId, item?.QuestionId)?.toString(),
    questionText: pickFirstDefined(item?.questionText, item?.QuestionText),
    selectedOptionId: pickFirstDefined(
      item?.selectedOptionId,
      item?.SelectedOptionId
    )?.toString(),
    selectedOptionText: pickFirstDefined(
      item?.selectedOptionText,
      item?.SelectedOptionText,
      item?.studentAnswer,
      item?.selectedAnswer
    ),
    selectedAnswer: item?.selectedAnswer || item?.studentAnswer,
    correctOptionId: pickFirstDefined(
      item?.correctOptionId,
      item?.CorrectOptionId
    )?.toString(),
    correctOptionText: pickFirstDefined(
      item?.correctOptionText,
      item?.CorrectOptionText,
      item?.correctAnswer
    ),
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
    // Backend sends ISO 8601 with offset, parse directly
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) return input;
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

type ParsedAiFeedback = {
  summary?: string;
  strengths: string[];
  issues: string[];
  suggestions: string[];
  warnings: string[];
};

function toArrayOfStrings(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
}

function parseAiFeedbackValue(value: unknown): ParsedAiFeedback | null {
  if (!value) {
    return null;
  }

  let payload: any = value;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    try {
      payload = JSON.parse(trimmed);
    } catch {
      return null;
    }
  }

  const resolved = payload?.result ?? payload?.data ?? payload;
  const summary = String(resolved?.summary ?? "").trim();
  const strengths = toArrayOfStrings(resolved?.strengths);
  const issues = toArrayOfStrings(resolved?.issues);
  const suggestions = toArrayOfStrings(resolved?.suggestions);
  const warnings = toArrayOfStrings(payload?.warnings ?? resolved?.warnings);

  if (!summary && strengths.length === 0 && issues.length === 0 && suggestions.length === 0 && warnings.length === 0) {
    return null;
  }

  return {
    summary: summary || undefined,
    strengths,
    issues,
    suggestions,
    warnings,
  };
}

function formatAiFeedbackText(value?: string | null) {
  const parsed = parseAiFeedbackValue(value);
  if (!parsed) {
    return value || "";
  }

  const sections: string[] = [];
  if (parsed.summary) {
    sections.push(parsed.summary);
  }
  if (parsed.strengths.length > 0) {
    sections.push(`Điểm mạnh:\n${parsed.strengths.map((item) => `- ${item}`).join("\n")}`);
  }
  if (parsed.issues.length > 0) {
    sections.push(`Cần cải thiện:\n${parsed.issues.map((item) => `- ${item}`).join("\n")}`);
  }
  if (parsed.suggestions.length > 0) {
    sections.push(`Gợi ý:\n${parsed.suggestions.map((item) => `- ${item}`).join("\n")}`);
  }
  if (parsed.warnings.length > 0) {
    sections.push(`Lưu ý:\n${parsed.warnings.map((item) => `- ${item}`).join("\n")}`);
  }

  return sections.join("\n\n").trim();
}

function buildQuickGradeFeedback(result: HomeworkQuickGradeResult): string {
  const sections: string[] = [];

  if (result.summary) {
    sections.push(result.summary.trim());
  }

  if (result.strengths.length > 0) {
    sections.push(
      `Diem manh:\n${result.strengths.map((item) => `- ${item}`).join("\n")}`
    );
  }

  if (result.issues.length > 0) {
    sections.push(
      `Can cai thien:\n${result.issues.map((item) => `- ${item}`).join("\n")}`
    );
  }

  if (result.suggestions.length > 0) {
    sections.push(
      `Goi y:\n${result.suggestions.map((item) => `- ${item}`).join("\n")}`
    );
  }

  return sections.filter(Boolean).join("\n\n").trim();
}

function formatReadableAiFeedbackText(value?: string | null) {
  const parsed = parseAiFeedbackValue(value);
  if (!parsed) {
    return value || "";
  }

  const sections: string[] = [];
  if (parsed.summary) {
    sections.push(parsed.summary);
  }
  if (parsed.strengths.length > 0) {
    sections.push(`Điểm mạnh:\n${parsed.strengths.map((item) => `- ${item}`).join("\n")}`);
  }
  if (parsed.issues.length > 0) {
    sections.push(`Cần cải thiện:\n${parsed.issues.map((item) => `- ${item}`).join("\n")}`);
  }
  if (parsed.suggestions.length > 0) {
    sections.push(`Gợi ý:\n${parsed.suggestions.map((item) => `- ${item}`).join("\n")}`);
  }
  if (parsed.warnings.length > 0) {
    sections.push(`Lưu ý:\n${parsed.warnings.map((item) => `- ${item}`).join("\n")}`);
  }

  return sections.join("\n\n").trim();
}

function buildReadableQuickGradeFeedback(result: HomeworkQuickGradeResult): string {
  const sections: string[] = [];

  if (result.summary) {
    sections.push(result.summary.trim());
  }

  if (result.strengths.length > 0) {
    sections.push(
      `Điểm mạnh:\n${result.strengths.map((item) => `- ${item}`).join("\n")}`
    );
  }

  if (result.issues.length > 0) {
    sections.push(
      `Cần cải thiện:\n${result.issues.map((item) => `- ${item}`).join("\n")}`
    );
  }

  if (result.suggestions.length > 0) {
    sections.push(
      `Gợi ý:\n${result.suggestions.map((item) => `- ${item}`).join("\n")}`
    );
  }

  if (result.warnings.length > 0) {
    sections.push(
      `Lưu ý:\n${result.warnings.map((item) => `- ${item}`).join("\n")}`
    );
  }

  return sections.filter(Boolean).join("\n\n").trim();
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
  const gradingPanelRef = useRef<HTMLDivElement | null>(null);

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
  const matchesChoiceOption = useCallback(
    (
      option: MCQuestionOption | undefined,
      optionIndex: number,
      answerValue?: string | null,
      answerOptionId?: string | null
    ) => {
      if (!option) {
        return false;
      }

      return isMatchingOption(
        String(pickFirstDefined(option.optionId, option.id) ?? optionIndex),
        String(pickFirstDefined(option.optionText, option.text, "") ?? ""),
        optionIndex,
        answerValue,
        answerOptionId ?? undefined
      );
    },
    []
  );

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

    return assignmentQuestions.map((question, questionIndex) => {
      const questionId = question.questionId || question.id || "";
      const answer =
        multipleChoiceAnswers.find(
          (a) => (a.questionId || "").toLowerCase() === questionId.toLowerCase()
        ) ?? multipleChoiceAnswers[questionIndex];

      const allOptions = [...(question.options || []), ...(question.optionsText || [])];
      const selectedOption =
        allOptions.find((option, optionIndex) =>
          matchesChoiceOption(
            option,
            optionIndex,
            answer?.selectedOptionId ?? answer?.selectedOptionText ?? answer?.selectedAnswer,
            answer?.selectedOptionId ?? undefined
          )
        ) ?? null;
      const correctOption =
        allOptions.find((o) => o.isCorrect === true) ||
        allOptions.find((option, optionIndex) =>
          matchesChoiceOption(
            option,
            optionIndex,
            answer?.correctOptionText ?? answer?.correctOptionId,
            answer?.correctOptionId ?? undefined
          )
        ) ||
        null;

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
  }, [assignmentQuestions, matchesChoiceOption, multipleChoiceAnswers]);

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

    return assignmentQuestions.map((question, questionIndex) => {
      const questionId = question.questionId || question.id || "";
      const answer =
        multipleChoiceAnswers.find(
          (item) => (item.questionId || "").toLowerCase() === questionId.toLowerCase()
        ) ?? multipleChoiceAnswers[questionIndex];
      const normalizedOptions =
        question.options && question.options.length > 0
          ? question.options
          : question.optionsText && question.optionsText.length > 0
            ? question.optionsText
            : answer?.options || [];
      const selectedOption =
        normalizedOptions.find((option, optionIndex) =>
          matchesChoiceOption(
            option,
            optionIndex,
            answer?.selectedOptionId ?? answer?.selectedOptionText ?? answer?.selectedAnswer,
            answer?.selectedOptionId ?? undefined
          )
        ) ?? null;
      const correctOption =
        normalizedOptions.find((option) => option.isCorrect === true) ||
        normalizedOptions.find((option, optionIndex) =>
          matchesChoiceOption(
            option,
            optionIndex,
            answer?.correctOptionText ?? answer?.correctOptionId,
            answer?.correctOptionId ?? undefined
          )
        ) ||
        null;

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
  }, [assignmentQuestions, matchesChoiceOption, multipleChoiceAnswers]);

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
  const parsedAiFeedback = useMemo(() => parseAiFeedbackValue(data?.aiFeedback), [data?.aiFeedback]);
  const formattedAiFeedback = useMemo(
    () => formatReadableAiFeedbackText(data?.aiFeedback),
    [data?.aiFeedback]
  );

  // Fill editing fields when data loads
  useEffect(() => {
    if (data) {
      setEditingScore(data.score !== null && data.score !== undefined ? String(data.score) : "");
      setEditingFeedback(data.teacherFeedback || formattedAiFeedback || "");
    }
  }, [data, formattedAiFeedback]);

  const handleSaveGrade = useCallback(async () => {
    if (!homeworkStudentId) return;

    // Kiểm tra nếu bài nộp quá hạn → tự động điểm 0 và nhận xét "Quá hạn nộp bài"
    const isOverdueSubmission = data?.isOverdue === true;
    const overdueFeedback = "Quá hạn nộp bài";

    const finalScore = isOverdueSubmission ? 0 : (editingScore !== "" ? parseFloat(editingScore) : null);
    const finalFeedback = isOverdueSubmission ? overdueFeedback : editingFeedback;

    // For multiple choice, send calculated quiz score so BE doesn't reset to 0
    const payload = isMultipleChoiceSubmission
      ? {
          homeworkStudentId,
          score: teacherQuizSummary.earnedPoints,
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
          // Preserve enriched quiz data from original fetch (grade response is raw/unenriched)
          questions: prev?.questions ?? merged.questions,
          review: prev?.review ?? merged.review,
          answerResults: prev?.answerResults ?? merged.answerResults,
          multipleChoiceAnswers: prev?.multipleChoiceAnswers ?? merged.multipleChoiceAnswers,
          textAnswer: prev?.textAnswer ?? merged.textAnswer,
          status: updated?.status ?? merged.status ?? "Graded",
          score:
            isMultipleChoiceSubmission
              ? teacherQuizSummary.earnedPoints
              : updated?.score !== undefined
                ? updated.score
                : (finalScore as number | null),
          teacherFeedback:
            updated?.teacherFeedback !== undefined
              ? updated.teacherFeedback
              : finalFeedback,
          gradedAt: updated?.gradedAt ?? merged.gradedAt ?? nowISOVN(),
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
  }, [homeworkStudentId, editingScore, editingFeedback, isMultipleChoiceSubmission, data, teacherQuizSummary]);

  const handleGenerateAIFeedback = useCallback(async () => {
    if (!homeworkStudentId) return;
    setAiLoading(true);
    try {
      const response = await post<any>(`/api/homework/submissions/${homeworkStudentId}/ai-feedback`, {});
      const body = response?.data || response;
      const aiText: string = body?.aiFeedback || body?.data?.aiFeedback || "";
      const formattedText = formatReadableAiFeedbackText(aiText);
      if (formattedText) {
        setEditingFeedback((prev) => (prev ? `${prev}\n\n${formattedText}` : formattedText));
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

  const handleApplyQuickGrade = useCallback((result: HomeworkQuickGradeResult) => {
    if (!result.aiUsed) {
      return;
    }

    const generatedFeedback = buildReadableQuickGradeFeedback(result);

    setData((prev) =>
      prev
        ? {
            ...prev,
            status: result.status ?? prev.status ?? "Graded",
            score:
              result.score !== null && result.score !== undefined
                ? result.score
                : prev.score,
            gradedAt: result.gradedAt ?? prev.gradedAt ?? nowISOVN(),
            aiFeedback: generatedFeedback || result.summary || prev.aiFeedback,
          }
        : prev
    );

    if (result.score !== null && result.score !== undefined) {
      setEditingScore(String(result.score));
    }
    if (generatedFeedback) {
      setEditingFeedback(generatedFeedback);
    }
    setShowGradingForm(true);

    setTimeout(() => {
      gradingPanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }, []);

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
                  ? prev.gradedAt || nowISOVN()
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
      <div className="min-h-screen bg-gradient-to-b from-red-50 via-white to-white p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="p-4 rounded-full bg-red-100 inline-flex mb-4">
            <Loader2 size={48} className="animate-spin text-red-600" />
          </div>
          <p className="text-gray-600 font-medium">Đang tải chi tiết bài nộp...</p>
          <p className="text-sm text-gray-400 mt-2">Vui lòng đợi trong giây lát</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 via-white to-white p-6 flex items-center justify-center">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
            <AlertCircle size={40} className="text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Không thể tải dữ liệu</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">{error || "Bài nộp không tồn tại hoặc đã bị xóa"}</p>
          <button
            onClick={() => router.push(`/${locale}/portal/teacher/assignments/${assignmentId}`)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-6 py-3 text-sm font-semibold text-white hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            <ArrowLeft size={16} /> Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-white to-white p-6 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/${locale}/portal/teacher/assignments/${assignmentId}`)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 cursor-pointer"
          >
            <ArrowLeft size={16} /> Quay lại
          </button>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Chi tiết bài nộp</h1>
            <p className="text-sm text-gray-500 mt-1">Xem chi tiết và chấm điểm bài làm</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-red-200/50 bg-gradient-to-br from-white via-red-50/30 to-white shadow-lg p-8 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
        <div className="flex items-start gap-4 mb-8">
          <div className="p-4 rounded-xl bg-gradient-to-br from-red-600 to-red-700 text-white shadow-lg flex-shrink-0">
            <BookOpen size={28} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-extrabold text-gray-900 truncate">{data.assignmentTitle || "-"}</h2>
            <p className="text-sm text-gray-500 mt-2">ID: <span className="font-mono text-gray-600">{data.id.slice(0, 8)}...</span></p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-gray-200/50 bg-gradient-to-br from-blue-50/50 to-cyan-50/50 p-5 hover:border-blue-300/50 transition-all duration-200">
            <div className="flex items-center gap-2 text-gray-600 mb-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <School size={16} className="text-blue-600" />
              </div>
              <span className="text-xs font-semibold text-gray-600">LỚP HỌC</span>
            </div>
            <div className="font-bold text-gray-900 text-lg">{data.classTitle || "-"}</div>
            <div className="text-xs text-gray-500 mt-1">Mã: {data.classCode || "-"}</div>
          </div>

          <div className="rounded-xl border border-gray-200/50 bg-gradient-to-br from-amber-50/50 to-orange-50/50 p-5 hover:border-amber-300/50 transition-all duration-200">
            <div className="flex items-center gap-2 text-gray-600 mb-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Calendar size={16} className="text-amber-600" />
              </div>
              <span className="text-xs font-semibold text-gray-600">HẠN NỘP</span>
            </div>
            <div className="font-bold text-gray-900 text-lg">{formatDateTime(data.dueAt)}</div>
            <div className={`text-xs mt-1 font-medium ${data.isOverdue ? 'text-red-600' : 'text-emerald-600'}`}>
              {data.isOverdue ? '⚠️ Quá hạn' : '✓ Còn hạn'}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200/50 bg-gradient-to-br from-violet-50/50 to-purple-50/50 p-5 hover:border-violet-300/50 transition-all duration-200">
            <div className="flex items-center gap-2 text-gray-600 mb-3">
              <div className="p-2 rounded-lg bg-violet-100">
                <Clock size={16} className="text-violet-600" />
              </div>
              <span className="text-xs font-semibold text-gray-600">NGÀY NỘP</span>
            </div>
            <div className="font-bold text-gray-900 text-lg">{formatDateTime(data.submittedAt)}</div>
            <div className={`text-xs mt-1 font-medium ${data.isLate ? 'text-amber-600' : 'text-emerald-600'}`}>
              {data.isLate ? '🕐 Nộp trễ' : '✓ Đúng hạn'}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200/50 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 p-5 hover:border-emerald-300/50 transition-all duration-200">
            <div className="flex items-center gap-2 text-gray-600 mb-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <FileText size={16} className="text-emerald-600" />
              </div>
              <span className="text-xs font-semibold text-gray-600">ĐIỂM</span>
            </div>
            <div className="font-bold text-emerald-700 text-2xl">
              {isMultipleChoiceSubmission && teacherQuizSummary.totalPoints > 0
                ? teacherQuizSummary.earnedPoints
                : data.score !== null && data.score !== undefined ? data.score : (data.isOverdue ? 0 : "—")}
            </div>
            <div className="text-xs text-gray-500 mt-1">Tối đa: {isMultipleChoiceSubmission && teacherQuizSummary.totalPoints > 0 ? teacherQuizSummary.totalPoints : (data.maxScore ?? "—")}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="rounded-2xl border border-red-200/50 bg-white shadow-lg p-8 space-y-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
            <div className="p-2.5 rounded-lg bg-red-100">
              <BookOpen size={20} className="text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Nội dung bài làm</h3>
          </div>

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
                    <div className="rounded-xl border border-emerald-200/50 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 hover:border-emerald-300 transition-all duration-200">
                      <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-2">Câu đúng</div>
                      <div className="text-3xl font-extrabold text-emerald-800">
                        {teacherQuizSummary.correct}
                      </div>
                    </div>
                    <div className="rounded-xl border border-red-200/50 bg-gradient-to-br from-red-50 to-rose-50 p-4 hover:border-red-300 transition-all duration-200">
                      <div className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-2">Câu sai</div>
                      <div className="text-3xl font-extrabold text-red-800">
                        {teacherQuizSummary.wrong}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200/50 bg-gradient-to-br from-slate-50 to-gray-50 p-4 hover:border-slate-300 transition-all duration-200">
                      <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Chưa trả lời</div>
                      <div className="text-3xl font-extrabold text-slate-800">
                        {teacherQuizSummary.skipped}
                      </div>
                    </div>
                    <div className="rounded-xl border border-blue-200/50 bg-gradient-to-br from-blue-50 to-cyan-50 p-4 hover:border-blue-300 transition-all duration-200">
                      <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">Điểm</div>
                      <div className="text-3xl font-extrabold text-blue-800">
                        {teacherQuizSummary.earnedPoints}
                        {teacherQuizSummary.totalPoints > 0
                          ? `/${teacherQuizSummary.totalPoints}`
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

                              const isSelectedAndCorrectFromAnswer = isSelected && item.isCorrect === true;

                              let optStyle = "border-gray-200";
                              let bgStyle = "";
                              if (isCorrectOpt || isCorrectAnswer) {
                                optStyle = "border-emerald-500 bg-emerald-100";
                              }
                              if (isSelected && !isCorrectOpt && !isSelectedAndCorrectFromAnswer) {
                                optStyle = "border-red-500 bg-red-100";
                              }
                              if (isSelected && (isCorrectOpt || isCorrectAnswer || isSelectedAndCorrectFromAnswer)) {
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
                                  {isCorrectOpt || isCorrectAnswer || isSelectedAndCorrectFromAnswer ? (
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
            <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-blue-50/30 p-6 text-sm text-gray-700 font-medium leading-relaxed max-h-96 overflow-y-auto break-words whitespace-pre-wrap">
              {data.textAnswer}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 p-6 text-sm text-gray-500 text-center">
              Không có câu trả lời dạng text.
            </div>
          )}

          {/* Only show attachments section for non-multiple choice submissions */}
          {!isMultipleChoiceSubmission && (
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <FileText size={16} className="text-red-600" />
                Tệp/Link nộp bài
              </h4>
              {links.length > 0 ? (
                <div className="space-y-2">
                  {links.map((link, idx) => (
                    <div key={`${link}-${idx}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50/30 px-4 py-3 hover:border-blue-300 transition-all duration-200">
                      <div className="min-w-0 flex items-center gap-3 text-sm text-gray-700">
                        <LinkIcon size={16} className="text-blue-600 shrink-0" />
                        <span className="truncate font-medium">{link}</span>
                      </div>
                      <a
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-all duration-200 shrink-0 cursor-pointer"
                      >
                        <Download size={14} /> Tải
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-500 text-center">
                  <FileText size={24} className="mx-auto mb-2 text-gray-400" />
                  Không có file/link đính kèm.
                </div>
              )}
            </div>
          )}
        </div>

        <div
          ref={gradingPanelRef}
          className="rounded-2xl border border-red-200/50 bg-white shadow-lg p-8 hover:shadow-xl transition-all duration-300"
        >
          <div className="mb-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200 mb-4">
              <div className="p-2.5 rounded-lg bg-amber-100">
                <Sparkles size={20} className="text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Chấm điểm nhanh với AI</h3>
            </div>
            <AiQuickGradeCard
              homeworkStudentId={homeworkStudentId}
              onApplied={handleApplyQuickGrade}
            />
          </div>

          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <Edit3 size={18} className="text-red-600" />
              </div>
              {isMultipleChoiceSubmission ? "Nhận xét" : "Chấm điểm & Nhận xét"}
            </h3>
            {!showGradingForm && (
              <div className="flex flex-wrap items-center justify-end gap-2">
                {canMarkLate && (
                  <button
                    onClick={() => handleMarkStatus("Late")}
                    disabled={isMarkingStatus}
                    className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 px-4 py-2.5 text-sm font-semibold text-amber-800 hover:border-amber-400 hover:shadow-md transition-all duration-200 disabled:opacity-50 cursor-pointer"
                  >
                    {isMarkingStatus ? <Loader2 size={14} className="animate-spin" /> : <Clock size={14} />}
                    Đánh dấu trễ
                  </button>
                )}
                {canMarkMissing && (
                  <button
                    onClick={() => handleMarkStatus("Missing")}
                    disabled={isMarkingStatus}
                    className="inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-gradient-to-br from-rose-50 to-red-50 px-4 py-2.5 text-sm font-semibold text-rose-800 hover:border-rose-400 hover:shadow-md transition-all duration-200 disabled:opacity-50 cursor-pointer"
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
                    setEditingScore((prev) => prev || (data?.score !== null && data?.score !== undefined ? String(data.score) : ""));
                    setEditingFeedback((prev) => prev || data?.teacherFeedback || formattedAiFeedback || "");
                  }
                  setShowGradingForm(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer"
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
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 whitespace-pre-wrap text-sm text-gray-700 max-h-64 overflow-y-auto break-words">
                      {data.assignmentDescription || "Không có mô tả."}
                    </div>
                  </div>
                </>
              )}

              <div>
                <div className="text-gray-500 mb-2 font-medium">Nhận xét của giáo viên</div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 whitespace-pre-wrap text-sm text-gray-700 max-h-64 overflow-y-auto break-words">
                  {data.isOverdue ? "Quá hạn nộp bài" : (data.teacherFeedback || <span className="italic text-gray-400">Chưa có nhận xét</span>)}
                </div>
              </div>

              <div>
                <div className="text-gray-500 mb-2 font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
                  <Sparkles size={16} className="text-amber-600" />
                  Phản hồi từ AI
                </div>
                <div className="rounded-xl border border-amber-200/50 bg-gradient-to-br from-amber-50 to-yellow-50/30 p-5 text-sm text-amber-900 hover:border-amber-300 transition-all duration-200 max-h-96 overflow-y-auto break-words">
                  {parsedAiFeedback ? (
                    <div className="space-y-4">
                      {parsedAiFeedback.summary ? (
                        <p className="whitespace-pre-wrap leading-relaxed font-medium">
                          {parsedAiFeedback.summary}
                        </p>
                      ) : null}
                      {parsedAiFeedback.strengths.length > 0 ? (
                        <div>
                          <div className="mb-2 font-bold text-amber-950 flex items-center gap-2">
                            <span>✓</span> Điểm mạnh
                          </div>
                          <ul className="space-y-1 ml-6">
                            {parsedAiFeedback.strengths.map((item, index) => (
                              <li key={`ai-strength-${index}`} className="leading-relaxed list-disc text-amber-800">
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {parsedAiFeedback.issues.length > 0 ? (
                        <div>
                          <div className="mb-2 font-bold text-amber-950 flex items-center gap-2">
                            <span>⚠</span> Cần cải thiện
                          </div>
                          <ul className="space-y-1 ml-6">
                            {parsedAiFeedback.issues.map((item, index) => (
                              <li key={`ai-issue-${index}`} className="leading-relaxed list-disc text-amber-800">
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {parsedAiFeedback.suggestions.length > 0 ? (
                        <div>
                          <div className="mb-2 font-bold text-amber-950 flex items-center gap-2">
                            <span>💡</span> Gợi ý
                          </div>
                          <ul className="space-y-1 ml-6">
                            {parsedAiFeedback.suggestions.map((item, index) => (
                              <li key={`ai-suggestion-${index}`} className="leading-relaxed list-disc text-amber-800">
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {parsedAiFeedback.warnings.length > 0 ? (
                        <div>
                          <div className="mb-2 font-bold text-amber-950 flex items-center gap-2">
                            <span>🔔</span> Lưu ý
                          </div>
                          <ul className="space-y-1 ml-6">
                            {parsedAiFeedback.warnings.map((item, index) => (
                              <li key={`ai-warning-${index}`} className="leading-relaxed list-disc text-amber-800">
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  ) : formattedAiFeedback ? (
                    <div className="whitespace-pre-wrap leading-relaxed">{formattedAiFeedback}</div>
                  ) : (
                    <span className="italic text-amber-500">Chưa có phản hồi AI</span>
                  )}
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
                </div>
              )}

              {/* For multiple choice, only show AI feedback button */}
              {isMultipleChoiceSubmission && (
                <div className="flex justify-end">
                  <button
                    onClick={handleGenerateAIFeedback}
                    disabled={aiLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">
                  Nhận xét của giáo viên
                </label>
                <textarea
                  value={editingFeedback}
                  onChange={(e) => setEditingFeedback(e.target.value)}
                  rows={7}
                  className="w-full rounded-xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent resize-none font-medium placeholder-gray-400 transition-all duration-200"
                  placeholder="Nhập nhận xét cho học viên..."
                />
                <div className="text-xs text-gray-400 mt-2 text-right flex items-center justify-between">
                  <span>Nhấn Enter để xuống dòng</span>
                  <span>{editingFeedback.length} ký tự</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowGradingForm(false);
                    if (data) {
                      setEditingScore(data.score !== null && data.score !== undefined ? String(data.score) : "");
                      setEditingFeedback(data.teacherFeedback || formattedAiFeedback || "");
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 cursor-pointer"
                >
                  <X size={16} /> Hủy
                </button>
                <button
                  onClick={handleSaveGrade}
                  disabled={isGrading}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isGrading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Check size={16} /> Lưu
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
