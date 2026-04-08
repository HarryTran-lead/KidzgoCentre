/**
 * Student API Helper Functions
 *
 * All functions call Next.js API Routes (not backend directly).
 * Token is automatically injected via axios interceptors.
 */

import {

  CLASS_ENDPOINTS,
  STUDENT_CLASS_ENDPOINTS,
  STUDENT_ENDPOINTS,
  STUDENT_HOMEWORK_ENDPOINTS,
} from "@/constants/apiURL";
import { get, post, request } from "@/lib/axios";
import type { StudentClassesResponse } from "@/types/student/class";
import type { StudentsResponse } from "@/types/student/student";
import type {
  AssignmentListItem,
  HomeworkStats,
  AssignmentDetail,
  Attachment,
  HomeworkQuestion,
  HomeworkAiHintResult,
  HomeworkAiRecommendationResult,
  HomeworkSpeakingAnalysisResult,
  QuizReviewAnswer,
} from "@/types/student/homework";

type StudentClassesParams = {
  pageNumber?: number;
  pageSize?: number;
  studentId?: string;
  studentProfileId?: string;
};

type StudentListParams = {
  searchTerm?: string;
  userId?: string;
  profileType?: string;
  isActive?: boolean;
  branchId?: string;
  pageNumber?: number;
  pageSize?: number;
};

export async function getStudentClassesByToken(
  params?: Omit<StudentClassesParams, "studentId">
): Promise<StudentClassesResponse> {
  const endpoint = STUDENT_CLASS_ENDPOINTS.GET_BY_TOKEN ?? "/api/students/classes";

  return get<StudentClassesResponse>(endpoint, {
    params: params ?? {},
  });
}

export async function getAllStudents(
  params?: StudentListParams
): Promise<StudentsResponse> {
  const endpoint = STUDENT_ENDPOINTS.GET_ALL ?? "/api/profiles";

  return get<StudentsResponse>(endpoint, {
    params: params ?? {},
  });
}
export async function getStudentClasses(
  params?: StudentClassesParams
): Promise<StudentClassesResponse> {
  const safeParams = params ?? {};
  const fallbackEndpoint =
    typeof STUDENT_ENDPOINTS.GET_CLASSES === "function"
      ? STUDENT_ENDPOINTS.GET_CLASSES()
      : "/api/students/classes";
  const classEndpoint = CLASS_ENDPOINTS.GET_ALL ?? "/api/classes";

  const studentParam =
    safeParams.studentId ?? safeParams.studentProfileId ?? undefined;

  try {
    return await get<StudentClassesResponse>(classEndpoint, {
      params: {
        ...safeParams,
        ...(studentParam ? { studentId: studentParam } : {}),
      },
    });
  } catch (error) {
    return get<StudentClassesResponse>(fallbackEndpoint, {
      params: safeParams,
    });
  }
}

// Student Homework Types
export type StudentHomeworkParams = {
  status?: number | string;
  classId?: string;
  pageNumber?: number;
  pageSize?: number;
};

export type StudentHomeworkResponse = {
  data: {
    homeworkAssignments: {
      items: AssignmentListItem[];
      pageNumber: number;
      pageSize: number;
      totalCount: number;
      totalPages: number;
    };
  };
  isSuccess: boolean;
  message?: string;
};

// Map API status to UI status
function mapApiStatusToUiStatus(
  apiStatus?: number | string
): AssignmentListItem["status"] {
  const normalized =
    typeof apiStatus === "string" ? apiStatus.trim().toUpperCase() : apiStatus;

  if (normalized === "ASSIGNED" || normalized === 0 || normalized === 1) {
    return "PENDING";
  }
  if (normalized === "SUBMITTED" || normalized === 2) {
    return "SUBMITTED";
  }
  if (normalized === "GRADED" || normalized === "REVIEWED") {
    return "SUBMITTED";
  }
  if (normalized === "LATE" || normalized === 3) {
    return "LATE";
  }
  if (normalized === "MISSING" || normalized === 4) {
    return "MISSING";
  }

  return "PENDING";
}

function toAbsoluteStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") {
          return item.trim();
        }
        if (item && typeof item === "object") {
          return String(
            (item as any).url ||
            (item as any).attachmentUrl ||
            (item as any).linkUrl ||
            ""
          ).trim();
        }
        return "";
      })
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function inferAttachmentType(source?: string): "PDF" | "DOC" | "DOCX" | "LINK" | "VIDEO" | "IMAGE" {
  const normalized = String(source || "").toLowerCase();
  if (/\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/.test(normalized)) return "IMAGE";
  if (/\.(mp4|mov|avi|webm|mkv)(\?|$)/.test(normalized)) return "VIDEO";
  if (/\.pdf(\?|$)/.test(normalized)) return "PDF";
  if (/\.docx(\?|$)/.test(normalized)) return "DOCX";
  if (/\.doc(\?|$)/.test(normalized)) return "DOC";
  return "LINK";
}

function normalizeAttachment(item: any, index: number): Attachment | null {
  if (typeof item === "string") {
    const url = item.trim();
    return {
      id: `attachment-${index}`,
      name: url.split("/").pop() || `Tep ${index + 1}`,
      type: inferAttachmentType(url),
      url,
    };
  }

  const url = String(
    item?.url ||
    item?.attachmentUrl ||
    item?.fileUrl ||
    item?.downloadUrl ||
    ""
  ).trim();

  if (!url) {
    return null;
  }

  return {
    id: String(item?.id || item?.attachmentId || `attachment-${index}`),
    name:
      item?.name ||
      item?.fileName ||
      url.split("/").pop() ||
      `Tep ${index + 1}`,
    type: item?.type || item?.fileType || inferAttachmentType(url),
    url,
    size: item?.size,
    uploadedAt: item?.uploadedAt,
  };
}

function normalizeAttachments(value: unknown): Attachment[] {
  const rawItems = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

  return rawItems
    .map((item, index) => normalizeAttachment(item, index))
    .filter((item): item is Attachment => Boolean(item));
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item ?? "").trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function extractStudentHomeworkItems(responseData: any): AssignmentListItem[] {
  if (responseData?.data?.homeworks?.items) {
    return responseData.data.homeworks.items.map(mapToAssignmentListItem);
  }
  if (responseData?.data?.feedbacks?.items) {
    return responseData.data.feedbacks.items.map(mapToAssignmentListItem);
  }
  if (responseData?.data?.homeworkAssignments?.items) {
    return responseData.data.homeworkAssignments.items.map(mapToAssignmentListItem);
  }
  if (responseData?.homeworks?.items) {
    return responseData.homeworks.items.map(mapToAssignmentListItem);
  }
  if (responseData?.feedbacks?.items) {
    return responseData.feedbacks.items.map(mapToAssignmentListItem);
  }
  if (responseData?.homeworkAssignments?.items) {
    return responseData.homeworkAssignments.items.map(mapToAssignmentListItem);
  }
  if (Array.isArray(responseData?.data)) {
    return responseData.data.map(mapToAssignmentListItem);
  }
  if (Array.isArray(responseData)) {
    return responseData.map(mapToAssignmentListItem);
  }

  return [];
}

function buildListPagination(responseData: any, params?: StudentHomeworkParams) {
  return {
    pageNumber:
      responseData?.data?.homeworkAssignments?.pageNumber ||
      responseData?.data?.homeworks?.pageNumber ||
      responseData?.data?.feedbacks?.pageNumber ||
      params?.pageNumber ||
      1,
    pageSize:
      responseData?.data?.homeworkAssignments?.pageSize ||
      responseData?.data?.homeworks?.pageSize ||
      responseData?.data?.feedbacks?.pageSize ||
      params?.pageSize ||
      10,
    totalCount:
      responseData?.data?.homeworkAssignments?.totalCount ||
      responseData?.data?.homeworks?.totalCount ||
      responseData?.data?.feedbacks?.totalCount,
  };
}

// Map API response to AssignmentListItem
function mapToAssignmentListItem(item: any): AssignmentListItem {
  return {
    // New API fields
    id: item.id || item.homeworkStudentId || item.assignmentId || "",
    assignmentId: item.assignmentId || item.id || "",
    assignmentTitle: item.assignmentTitle || item.title || "",
    assignmentDescription: item.assignmentDescription || "",
    classId: item.classId || "",
    classCode: item.classCode || "",
    classTitle: item.classTitle || item.className || "",
    dueAt: item.dueAt || item.dueDate || "",
    isOverdue: item.isOverdue || false,
    book: item.book || null,
    pages: item.pages || null,
    skills: item.skills || null,
    submissionType: item.submissionType || "File",
    maxScore: item.maxScore || 10,
    status: mapApiStatusToUiStatus(item.status),
    submittedAt: item.submittedAt || null,
    gradedAt: item.gradedAt || null,
    score: item.score ?? null,
    teacherFeedback: item.teacherFeedback ?? null,
    aiFeedback: item.aiFeedback ?? null,
    isLate: item.isLate || false,
    // Legacy fields for compatibility
    title: item.assignmentTitle || item.title || "",
    subject: item.subjectName || item.subject || "",
    className: item.classTitle || item.className || "",
    assignedDate: item.createdAt 
      ? new Date(item.createdAt).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })
      : "",
    dueDate: item.dueAt 
      ? new Date(item.dueAt).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })
      : "",
    type: "FILE_UPLOAD" as const,
    submissionCount: item.submissionCount || (item.isSubmitted ? 1 : 0),
    hasAttachments: item.hasAttachments || (item.attachments && item.attachments.length > 0),
    attachmentTypes: item.attachmentTypes,
  };
}

/**
 * Get student homework list
 */
export async function getStudentHomework(
  params?: StudentHomeworkParams
): Promise<StudentHomeworkResponse> {
  const endpoint = STUDENT_HOMEWORK_ENDPOINTS.GET_MY_HOMEWORK ?? "/api/students/homework/my";

  const response = await get<any>(endpoint, {
    params: params ?? {},
  });

  const responseData = response?.data || response;
  const items = extractStudentHomeworkItems(responseData);
  const pagination = buildListPagination(responseData, params);

  const stats: HomeworkStats = {
    total: items.length,
    submitted: items.filter(i => i.status === "SUBMITTED").length,
    pending: items.filter(i => i.status === "PENDING").length,
    missing: items.filter(i => i.status === "MISSING").length,
    late: items.filter(i => i.status === "LATE").length,
  };

  return {
    data: {
      homeworkAssignments: {
        items,
        pageNumber: pagination.pageNumber,
        pageSize: pagination.pageSize,
        totalCount: pagination.totalCount || items.length,
        totalPages:
          responseData?.data?.homeworkAssignments?.totalPages ||
          responseData?.data?.homeworks?.totalPages ||
          responseData?.data?.feedbacks?.totalPages ||
          1,
      },
    },
    isSuccess: responseData?.isSuccess ?? true,
    message: responseData?.message,
  };
}

async function getStudentHomeworkCollection(
  endpoint: string,
  params?: StudentHomeworkParams
): Promise<StudentHomeworkResponse> {
  const response = await get<any>(endpoint, {
    params: params ?? {},
  });

  const responseData = response?.data || response;
  const items = extractStudentHomeworkItems(responseData);
  const pagination = buildListPagination(responseData, params);

  return {
    data: {
      homeworkAssignments: {
        items,
        pageNumber: pagination.pageNumber,
        pageSize: pagination.pageSize,
        totalCount: pagination.totalCount || items.length,
        totalPages:
          responseData?.data?.homeworks?.totalPages ||
          responseData?.data?.feedbacks?.totalPages ||
          responseData?.data?.homeworkAssignments?.totalPages ||
          1,
      },
    },
    isSuccess: responseData?.isSuccess ?? true,
    message: responseData?.message,
  };
}

export async function getStudentSubmittedHomework(
  params?: Omit<StudentHomeworkParams, "status">
): Promise<StudentHomeworkResponse> {
  const endpoint =
    STUDENT_HOMEWORK_ENDPOINTS.GET_SUBMITTED ?? "/api/students/homework/submitted";
  return getStudentHomeworkCollection(endpoint, params);
}

export async function getStudentHomeworkFeedback(
  params?: Omit<StudentHomeworkParams, "status">
): Promise<StudentHomeworkResponse> {
  const endpoint =
    STUDENT_HOMEWORK_ENDPOINTS.GET_FEEDBACK_MY ?? "/api/students/homework/feedback/my";
  return getStudentHomeworkCollection(endpoint, params);
}

function formatToViDateTime(value?: string | null) {
  if (!value) return undefined;
  try {
    return new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
  } catch {
    return value;
  }
}

function buildSubmissionFromDetail(item: any): AssignmentDetail["submission"] {
  const nestedSubmission = item?.submission;
  const fallbackFiles = [
    ...normalizeAttachments(item?.attachmentUrls),
    ...normalizeAttachments(item?.submission?.content?.files),
  ];
  const fallbackLinks = [
    ...toAbsoluteStringArray(item?.submission?.content?.links),
    ...toAbsoluteStringArray(item?.linkUrl),
  ];
  const textContent =
    nestedSubmission?.content?.text ||
    item?.textAnswer ||
    undefined;

  if (
    !nestedSubmission &&
    !item?.submittedAt &&
    fallbackFiles.length === 0 &&
    fallbackLinks.length === 0 &&
    !textContent
  ) {
    return undefined;
  }

  return {
    id: nestedSubmission?.id || item?.id || item?.homeworkStudentId || "submission",
    submittedAt: nestedSubmission?.submittedAt || item?.submittedAt || "",
    status:
      mapApiStatusToUiStatus(nestedSubmission?.status || item?.status) === "LATE"
        ? "LATE"
        : "ON_TIME",
    content: {
      text: textContent,
      files: fallbackFiles.length > 0 ? fallbackFiles : undefined,
      links: fallbackLinks.length > 0 ? fallbackLinks : undefined,
    },
    version: nestedSubmission?.version || 1,
  };
}

function buildGradingFromDetail(item: any): AssignmentDetail["grading"] {
  const gradingSource = item?.grading || {};
  const maxScore = Number(item?.maxScore || item?.max_score || gradingSource?.maxScore || gradingSource?.totalScore || 10);
  const scoreValue =
    gradingSource?.score ??
    item?.score ??
    item?.earnedPoints;
  const teacherComment =
    gradingSource?.teacherComment ??
    gradingSource?.teacherFeedback ??
    item?.teacherFeedback ??
    undefined;
  const aiFeedback = item?.aiFeedback ?? gradingSource?.aiFeedback ?? undefined;

  if (
    scoreValue === undefined &&
    scoreValue !== 0 &&
    !teacherComment &&
    !aiFeedback &&
    !item?.gradedAt &&
    !gradingSource?.gradedAt
  ) {
    return undefined;
  }

  const numericScore = Number(scoreValue ?? 0);
  const safeMaxScore = maxScore > 0 ? maxScore : 10;
  const percentage =
    gradingSource?.percentage ??
    Math.round((numericScore / safeMaxScore) * 100);

  return {
    score: numericScore,
    maxScore: safeMaxScore,
    percentage,
    correctCount: gradingSource?.correctCount ?? item?.correctCount,
    wrongCount: gradingSource?.wrongCount ?? item?.wrongCount,
    skippedCount: gradingSource?.skippedCount ?? item?.skippedCount,
    totalPoints: gradingSource?.totalPoints ?? item?.totalPoints,
    earnedPoints: gradingSource?.earnedPoints ?? item?.earnedPoints,
    teacherComment,
    aiSuggestions: Array.isArray(gradingSource?.aiSuggestions)
      ? gradingSource.aiSuggestions
      : undefined,
    gradedFiles: normalizeAttachments(gradingSource?.gradedFiles),
    aiFeedback,
    rubricScores: gradingSource?.rubricScores,
  };
}

function isValueDefined<T>(value: T | null | undefined): value is T {
  return value !== undefined && value !== null;
}

function pickFirstDefined<T>(...values: Array<T | null | undefined>): T | undefined {
  return values.find(isValueDefined);
}

function normalizeComparableText(value?: string | number | null) {
  return String(value ?? "")
    .trim()
    .replace(/^[A-Z][\.\)]\s*/i, "")
    .toLowerCase();
}

function optionLabelFromIndex(index: number) {
  return String.fromCharCode(65 + index);
}

function isMatchingQuestionOption(
  optionId: string,
  optionText: string,
  index: number,
  correctAnswer?: string | number | null,
  correctOptionId?: string | number | null
) {
  const normalizedOptionId = normalizeComparableText(optionId);
  const normalizedOptionText = normalizeComparableText(optionText);
  const normalizedCorrectAnswer = normalizeComparableText(correctAnswer);
  const normalizedCorrectOptionId = normalizeComparableText(correctOptionId);

  if (normalizedCorrectOptionId && normalizedOptionId === normalizedCorrectOptionId) {
    return true;
  }

  if (!normalizedCorrectAnswer) {
    return false;
  }

  const zeroBasedIndex = String(index);
  const optionLabel = normalizeComparableText(optionLabelFromIndex(index));

  return [
    normalizedOptionId,
    normalizedOptionText,
    normalizeComparableText(zeroBasedIndex),
    optionLabel,
    normalizeComparableText(`${optionLabelFromIndex(index)}. ${optionText}`),
    normalizeComparableText(`${optionLabelFromIndex(index)}) ${optionText}`),
  ].includes(normalizedCorrectAnswer);
}

function normalizeHomeworkQuestion(
  question: any,
  index: number
): HomeworkQuestion {
  const questionId = String(
    pickFirstDefined(question?.id, question?.questionId, `question-${index}`)
  );
  const correctAnswer = pickFirstDefined(
    question?.correctAnswer,
    question?.correctOptionText,
    question?.answer,
    question?.correctAnswerIndex
  );
  const correctOptionId = pickFirstDefined(
    question?.correctOptionId,
    question?.correctAnswerId
  );
  const rawOptions = Array.isArray(question?.options)
    ? question.options
    : Array.isArray(question?.optionTexts)
      ? question.optionTexts
      : Array.isArray(question?.optionsText)
        ? question.optionsText
        : [];

  const options = rawOptions
    .map((option: any, optionIndex: number) => {
      const optionText = String(
        typeof option === "string"
          ? option
          : pickFirstDefined(
              option?.text,
              option?.optionText,
              option?.content,
              option?.label,
              ""
            )
      ).trim();

      if (!optionText) {
        return null;
      }

      const optionId = String(
        pickFirstDefined(
          option?.id,
          option?.optionId,
          option?.answerId,
          optionIndex
        )
      );

      return {
        id: optionId,
        text: optionText,
        isCorrect:
          option?.isCorrect === true ||
          isMatchingQuestionOption(
            optionId,
            optionText,
            optionIndex,
            correctAnswer,
            correctOptionId
          ),
      };
    })
    .filter(
      (option: HomeworkQuestion["options"][number] | null): option is HomeworkQuestion["options"][number] =>
        option !== null
    );

  return {
    id: questionId,
    questionText: String(
      pickFirstDefined(question?.questionText, question?.text, question?.content, "")
    ),
    questionType: question?.questionType,
    options,
    explanation: question?.explanation,
    points: question?.points,
  };
}

function parseMultipleChoiceAnswersFromText(value?: string | null) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeAnswerResultFlag(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1 ? true : value === 0 ? false : undefined;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return undefined;
    if (["true", "1", "correct", "yes"].includes(normalized)) return true;
    if (["false", "0", "wrong", "incorrect", "no"].includes(normalized)) return false;
  }

  return undefined;
}

function extractHomeworkAnswerResults(item: any, reviewSource: any) {
  const candidates = [
    reviewSource?.answerResults,
    item?.answerResults,
    item?.answers,
    item?.questionAnswers,
    item?.multipleChoiceAnswers,
    item?.submissionAnswers,
    parseMultipleChoiceAnswersFromText(item?.textAnswer),
  ];

  const rawResults = candidates.find((candidate) => Array.isArray(candidate));
  if (!Array.isArray(rawResults)) {
    return [];
  }

  return rawResults.map((result: any) => ({
    questionId: String(
      pickFirstDefined(result?.questionId, result?.QuestionId, result?.id, "")
    ),
    questionText: String(
      pickFirstDefined(result?.questionText, result?.QuestionText, "")
    ).trim() || undefined,
    selectedOptionId: pickFirstDefined(
      result?.selectedOptionId,
      result?.SelectedOptionId,
      result?.answerId
    ),
    selectedOptionText: String(
      pickFirstDefined(
        result?.selectedOptionText,
        result?.SelectedOptionText,
        result?.studentAnswer,
        result?.selectedAnswer,
        ""
      )
    ).trim() || undefined,
    correctOptionId: pickFirstDefined(
      result?.correctOptionId,
      result?.CorrectOptionId,
      result?.correctAnswerId
    ),
    correctOptionText: String(
      pickFirstDefined(
        result?.correctOptionText,
        result?.CorrectOptionText,
        result?.correctAnswer,
        ""
      )
    ).trim() || undefined,
    isCorrect: normalizeAnswerResultFlag(result?.isCorrect),
    earnedPoints:
      result?.earnedPoints ?? result?.score ?? result?.points ?? undefined,
    maxPoints: result?.maxPoints ?? result?.points ?? undefined,
    explanation: String(result?.explanation ?? "").trim() || undefined,
  }));
}

function buildTeacherAttachmentList(item: any): Attachment[] {
  const urls = [
    ...toAbsoluteStringArray(item?.assignmentAttachmentUrl),
    ...toAbsoluteStringArray(item?.assignmentAttachmentUrls),
    ...toAbsoluteStringArray(item?.attachment),
    ...toAbsoluteStringArray(item?.attachmentUrl),
    ...toAbsoluteStringArray(item?.assignment?.attachment),
    ...toAbsoluteStringArray(item?.assignment?.attachmentUrl),
  ];

  const urlAttachments = urls.map((url, index) => ({
    id: `teacher-attachment-${index}`,
    name: url.split("/").pop() || `Tai lieu ${index + 1}`,
    type: inferAttachmentType(url),
    url,
  }));

  return [
    ...normalizeAttachments(item?.teacherAttachments),
    ...normalizeAttachments(item?.attachments),
    ...normalizeAttachments(item?.assignmentAttachments),
    ...normalizeAttachments(item?.assignment?.attachments),
    ...normalizeAttachments(item?.assignment?.teacherAttachments),
    ...urlAttachments,
  ].filter(
    (attachment, index, array) =>
      array.findIndex((candidate) => candidate.url === attachment.url) === index
  );
}

function buildQuizReviewFromDetail(
  item: any,
  reviewSource: any,
  questions: HomeworkQuestion[]
): AssignmentDetail["review"] {
  const rawAnswerResults = extractHomeworkAnswerResults(item, reviewSource);
  const normalizedStatus = String(item?.status ?? "").trim().toUpperCase();
  const hasSubmissionState =
    Boolean(item?.submittedAt) ||
    ["SUBMITTED", "GRADED", "LATE", "MISSING", "REVIEWED"].includes(normalizedStatus);

  if (questions.length === 0 || (!hasSubmissionState && rawAnswerResults.length === 0)) {
    return undefined;
  }

  const answerResults: QuizReviewAnswer[] = questions.map((question, index) => {
    const matchedResult =
      rawAnswerResults.find(
        (result) =>
          normalizeComparableText(result.questionId) ===
          normalizeComparableText(question.id)
      ) ?? rawAnswerResults[index];

    const selectedOption = question.options.find((option, optionIndex) =>
      isMatchingQuestionOption(
        option.id,
        option.text,
        optionIndex,
        matchedResult?.selectedOptionId ?? matchedResult?.selectedOptionText,
        matchedResult?.selectedOptionId
      )
    );
    const correctOption = question.options.find((option) => option.isCorrect);
    const hasSelection = Boolean(
      String(
        pickFirstDefined(
          matchedResult?.selectedOptionId,
          matchedResult?.selectedOptionText,
          ""
        )
      ).trim()
    );
    const inferredIsCorrect =
      matchedResult?.isCorrect ??
      (hasSelection && selectedOption && correctOption
        ? normalizeComparableText(selectedOption.id) ===
          normalizeComparableText(correctOption.id)
        : undefined);

    return {
      questionId: question.id,
      questionText: question.questionText,
      selectedOptionId:
        matchedResult?.selectedOptionId !== undefined &&
        matchedResult?.selectedOptionId !== null
          ? String(matchedResult.selectedOptionId)
          : selectedOption?.id,
      selectedOptionText:
        matchedResult?.selectedOptionText ?? selectedOption?.text ?? undefined,
      correctOptionId: correctOption?.id,
      correctOptionText:
        matchedResult?.correctOptionText ?? correctOption?.text ?? undefined,
      isCorrect: inferredIsCorrect,
      earnedPoints:
        matchedResult?.earnedPoints ??
        (inferredIsCorrect && question.points ? question.points : 0),
      maxPoints: matchedResult?.maxPoints ?? question.points,
      explanation: matchedResult?.explanation ?? question.explanation,
    };
  });

  return {
    showReview: Boolean(reviewSource?.showReview ?? hasSubmissionState),
    showCorrectAnswer: reviewSource?.showCorrectAnswer ?? item?.showCorrectAnswer ?? true,
    showExplanation: reviewSource?.showExplanation ?? item?.showExplanation ?? true,
    primaryActionLabel: reviewSource?.primaryActionLabel ?? item?.primaryActionLabel,
    answerResults,
  };
}

/**
 * Get student homework detail by ID
 */
export async function getStudentHomeworkById(
  homeworkStudentId: string
): Promise<{ data: AssignmentDetail | null; isSuccess: boolean; message?: string }> {
  const endpoint = STUDENT_HOMEWORK_ENDPOINTS.GET_BY_ID(homeworkStudentId);

  try {
    const response = await get<any>(endpoint);
    const responseData = response?.data || response;
    let item = responseData?.data;

    if (!item && responseData) {
      if (responseData.id || responseData.homeworkStudentId) {
        item = responseData;
      }
    }

    if (!item) {
      return {
        data: null,
        isSuccess: false,
        message: responseData?.message || "Không có dữ liệu bài tập",
      };
    }

    // Map to AssignmentDetail
    const submissionTypeRaw =
      item.submissionType ||
      item.assignmentSubmissionType ||
      item.homeworkSubmissionType;
    const reviewSource = item.review || {};
    const questions = Array.isArray(item.questions)
      ? item.questions.map((question: any, index: number) =>
          normalizeHomeworkQuestion(question, index)
        )
      : [];
    const teacherAttachments = buildTeacherAttachmentList(item);
    const submission = buildSubmissionFromDetail(item);
    const grading = buildGradingFromDetail(item);
    const review = buildQuizReviewFromDetail(item, reviewSource, questions);

    const assignment: AssignmentDetail = {
      id: item.id || item.homeworkStudentId || "",
      title: item.title || item.homeworkTitle || item.assignmentTitle || "",
      className: item.className || item.classTitle || "",
      subject: item.subjectName || item.subject || "",
      teacher: item.teacherName || item.teacher || "",
      assignedDate: item.assignedDate || item.createdAt || "",
      dueDate: item.dueDate || item.dueAt || "",
      status: mapApiStatusToUiStatus(item.status) as AssignmentDetail["status"],
      isOverdue: item.isOverdue || item.status === "MISSING" || item.status === "OVERDUE",
      maxScore: item.maxScore || item.max_score || 10,
      submissionType:
        typeof submissionTypeRaw === "string"
          ? (submissionTypeRaw.toUpperCase() as AssignmentDetail["submissionType"])
          : undefined,
      timeLimitMinutes: item.timeLimitMinutes ?? item.examTimeMinutes ?? undefined,
      description: item.description || item.assignmentDescription || "",
      instructions: item.instructions || "",
      requirements: item.requirements || [],
      rubric: item.rubric || [],
      questions,
      teacherAttachments,
      allowResubmit: item.allowResubmit ?? true,
      maxResubmissions: item.maxResubmissions,
      editCount: item.editCount || 0,
      submission,
      submissionHistory: item.submissionHistory?.map((sub: any) => ({
        id: sub.id,
        submittedAt: sub.submittedAt || "",
        status: sub.status === 1 ? "ON_TIME" : "LATE",
        content: {
          text: sub?.content?.text,
          files: normalizeAttachments(sub?.content?.files),
          links: toAbsoluteStringArray(sub?.content?.links),
        },
        version: sub.version || 1,
      })),
      grading,
      review,
      submittedAt: formatToViDateTime(item.submittedAt),
      gradedAt: formatToViDateTime(item.gradedAt),
      aiHintEnabled: Boolean(item.aiHintEnabled ?? item.isAiHintEnabled ?? item.assignment?.aiHintEnabled),
      aiRecommendEnabled: Boolean(
        item.aiRecommendEnabled ?? item.isAiRecommendEnabled ?? item.assignment?.aiRecommendEnabled
      ),
      speakingMode:
        item.speakingMode ??
        item.assignment?.speakingMode ??
        item.mode ??
        null,
      targetWords: toStringArray(
        item.targetWords ??
          item.assignment?.targetWords ??
          item.speakingTargetWords
      ),
      speakingExpectedText:
        item.speakingExpectedText ??
        item.expectedText ??
        item.assignment?.speakingExpectedText ??
        null,
    };

    return {
      data: assignment,
      isSuccess: true,
      message: responseData?.message,
    };
  } catch (error: any) {
    console.error("Error fetching homework detail:", error);
    return {
      data: null,
      isSuccess: false,
      message: error?.message || "Lỗi khi tải bài tập",
    };
  }
}

type StudentAiActionResponse<T> = {
  data?: T;
  isSuccess: boolean;
  message?: string;
};

type HomeworkAiBasePayload = {
  language?: string;
};

export type HomeworkAiHintPayload = HomeworkAiBasePayload & {
  currentAnswerText?: string;
};

export type HomeworkAiRecommendationPayload = HomeworkAiBasePayload & {
  currentAnswerText?: string;
  maxItems?: number;
};

export type HomeworkAiSpeakingAnalysisPayload = HomeworkAiBasePayload & {
  currentTranscript?: string;
};

export type HomeworkAiSpeakingPracticePayload = HomeworkAiBasePayload & {
  file: File;
  homeworkStudentId?: string;
  mode?: string;
  expectedText?: string;
  targetWords?: string;
  instructions?: string;
};

function normalizeAiHintResult(payload: any): HomeworkAiHintResult {
  return {
    aiUsed: Boolean(payload?.aiUsed),
    summary: payload?.summary,
    hints: toStringArray(payload?.hints),
    grammarFocus: toStringArray(payload?.grammarFocus),
    vocabularyFocus: toStringArray(payload?.vocabularyFocus),
    encouragement: payload?.encouragement,
    warnings: toStringArray(payload?.warnings),
  };
}

function normalizeAiRecommendationResult(payload: any): HomeworkAiRecommendationResult {
  const items = Array.isArray(payload?.items)
    ? payload.items.map((item: any) => ({
        questionBankItemId: String(item?.questionBankItemId ?? item?.id ?? ""),
        questionText: String(item?.questionText ?? item?.content ?? ""),
        questionType: String(item?.questionType ?? item?.type ?? ""),
        options: toStringArray(item?.options),
        topic: item?.topic ?? null,
        skill: item?.skill ?? null,
        grammarTags: toStringArray(item?.grammarTags),
        vocabularyTags: toStringArray(item?.vocabularyTags),
        level: item?.level,
        points: item?.points !== undefined ? Number(item.points) : undefined,
        reason: item?.reason,
      }))
    : [];

  return {
    aiUsed: Boolean(payload?.aiUsed),
    summary: payload?.summary,
    focusSkill: payload?.focusSkill,
    topics: toStringArray(payload?.topics),
    grammarTags: toStringArray(payload?.grammarTags),
    vocabularyTags: toStringArray(payload?.vocabularyTags),
    recommendedLevels: toStringArray(payload?.recommendedLevels),
    practiceTypes: toStringArray(payload?.practiceTypes),
    warnings: toStringArray(payload?.warnings),
    items,
  };
}

function normalizeSpeakingAnalysisResult(payload: any): HomeworkSpeakingAnalysisResult {
  const confidence =
    payload?.confidence && typeof payload.confidence === "object"
      ? Object.fromEntries(
          Object.entries(payload.confidence).map(([key, value]) => [
            key,
            value === undefined || value === null ? undefined : Number(value),
          ])
        )
      : undefined;

  return {
    aiUsed: Boolean(payload?.aiUsed),
    summary: payload?.summary,
    transcript: payload?.transcript,
    overallScore:
      payload?.overallScore !== undefined ? Number(payload.overallScore) : undefined,
    pronunciationScore:
      payload?.pronunciationScore !== undefined
        ? Number(payload.pronunciationScore)
        : undefined,
    fluencyScore:
      payload?.fluencyScore !== undefined ? Number(payload.fluencyScore) : undefined,
    accuracyScore:
      payload?.accuracyScore !== undefined ? Number(payload.accuracyScore) : undefined,
    stars: payload?.stars !== undefined ? Number(payload.stars) : undefined,
    strengths: toStringArray(payload?.strengths),
    issues: toStringArray(payload?.issues),
    mispronouncedWords: toStringArray(payload?.mispronouncedWords),
    wordFeedback: Array.isArray(payload?.wordFeedback)
      ? payload.wordFeedback.map((item: any) => ({
          word: String(item?.word ?? ""),
          heardAs: item?.heardAs ?? null,
          issue: String(item?.issue ?? ""),
          tip: String(item?.tip ?? ""),
        }))
      : [],
    suggestions: toStringArray(payload?.suggestions),
    practicePlan: toStringArray(payload?.practicePlan),
    confidence: confidence as HomeworkSpeakingAnalysisResult["confidence"],
    warnings: toStringArray(payload?.warnings),
  };
}

async function performStudentAiAction<T>(
  endpoint: string,
  body: Record<string, unknown>,
  normalizer: (payload: any) => T
): Promise<StudentAiActionResponse<T>> {
  try {
    const response = await post<any>(endpoint, body);
    const responseData = response?.data || response;
    const payload = responseData?.data ?? responseData;

    return {
      data: normalizer(payload),
      isSuccess: responseData?.isSuccess ?? true,
      message: responseData?.message,
    };
  } catch (error: any) {
    return {
      isSuccess: false,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.message ||
        "Khong the goi tro ly AI",
    };
  }
}

export async function getStudentHomeworkHint(
  homeworkStudentId: string,
  payload: HomeworkAiHintPayload = {}
): Promise<StudentAiActionResponse<HomeworkAiHintResult>> {
  return performStudentAiAction(
    STUDENT_HOMEWORK_ENDPOINTS.GET_HINT(homeworkStudentId),
    payload,
    normalizeAiHintResult
  );
}

export async function getStudentHomeworkRecommendations(
  homeworkStudentId: string,
  payload: HomeworkAiRecommendationPayload = {}
): Promise<StudentAiActionResponse<HomeworkAiRecommendationResult>> {
  return performStudentAiAction(
    STUDENT_HOMEWORK_ENDPOINTS.GET_RECOMMENDATIONS(homeworkStudentId),
    payload,
    normalizeAiRecommendationResult
  );
}

export async function getStudentHomeworkSpeakingAnalysis(
  homeworkStudentId: string,
  payload: HomeworkAiSpeakingAnalysisPayload = {}
): Promise<StudentAiActionResponse<HomeworkSpeakingAnalysisResult>> {
  return performStudentAiAction(
    STUDENT_HOMEWORK_ENDPOINTS.GET_SPEAKING_ANALYSIS(homeworkStudentId),
    payload,
    normalizeSpeakingAnalysisResult
  );
}

export async function analyzeStudentSpeakingPractice(
  payload: HomeworkAiSpeakingPracticePayload
): Promise<StudentAiActionResponse<HomeworkSpeakingAnalysisResult>> {
  const formData = new FormData();
  formData.append("file", payload.file);

  if (payload.homeworkStudentId) {
    formData.append("homeworkStudentId", payload.homeworkStudentId);
  }
  if (payload.language) {
    formData.append("language", payload.language);
  }
  if (payload.mode) {
    formData.append("mode", payload.mode);
  }
  if (payload.expectedText) {
    formData.append("expectedText", payload.expectedText);
  }
  if (payload.targetWords) {
    formData.append("targetWords", payload.targetWords);
  }
  if (payload.instructions) {
    formData.append("instructions", payload.instructions);
  }

  try {
    const response = await request<any>({
      url: STUDENT_HOMEWORK_ENDPOINTS.ANALYZE_SPEAKING,
      method: "POST",
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    const responseData = response?.data || response;
    const aiPayload = responseData?.data ?? responseData;

    return {
      data: normalizeSpeakingAnalysisResult(aiPayload),
      isSuccess: responseData?.isSuccess ?? true,
      message: responseData?.message,
    };
  } catch (error: any) {
    return {
      isSuccess: false,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.message ||
        "Khong the phan tich file speaking",
    };
  }
}

export type SpeakingConversePracticePayload = {
  file: File;
  language?: string;
  topic?: string;
  conversationHistory?: string;
  instructions?: string;
  homeworkStudentId?: string;
};

export async function converseStudentSpeaking(
  payload: SpeakingConversePracticePayload
): Promise<StudentAiActionResponse<HomeworkSpeakingAnalysisResult>> {
  const formData = new FormData();
  formData.append("file", payload.file);

  if (payload.homeworkStudentId) {
    formData.append("homeworkStudentId", payload.homeworkStudentId);
  }
  if (payload.language) {
    formData.append("language", payload.language);
  }
  if (payload.topic) {
    formData.append("topic", payload.topic);
  }
  if (payload.conversationHistory) {
    formData.append("conversationHistory", payload.conversationHistory);
  }
  if (payload.instructions) {
    formData.append("instructions", payload.instructions);
  }

  try {
    const response = await request<any>({
      url: STUDENT_HOMEWORK_ENDPOINTS.ANALYZE_SPEAKING,
      method: "POST",
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    const responseData = response?.data || response;
    const aiPayload = responseData?.data ?? responseData;

    return {
      data: normalizeSpeakingAnalysisResult(aiPayload),
      isSuccess: responseData?.isSuccess ?? true,
      message: responseData?.message,
    };
  } catch (error: any) {
    return {
      isSuccess: false,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.message ||
        "Khong the goi AI conversation",
    };
  }
}

// Submit Homework Types
export type SubmitHomeworkPayload = {
  homeworkStudentId: string;
  textAnswer?: string;
  attachmentUrls?: string[];
  linkUrl?: string;
};
// Submit Homework Response
export type SubmitHomeworkResponse = {
  data?: {
    id: string;
    submittedAt: string;
    status: number;
  };
  isSuccess: boolean;
  message?: string;
};

export type SubmitMultipleChoicePayload = {
  homeworkStudentId: string;
  answers: {
    questionId: string;
    selectedOptionId: string;
  }[];
};

export type SubmitMultipleChoiceResponse = {
  data?: {
    homeworkStudentId: string;
    status: string | number;
    score?: number;
    maxScore?: number;
    rewardStars?: number;
    gradedAt?: string;
  };
  isSuccess: boolean;
  message?: string;
};

/**
 * Submit student homework
 */
export async function submitHomework(
  payload: SubmitHomeworkPayload
): Promise<SubmitHomeworkResponse> {
  const endpoint = STUDENT_HOMEWORK_ENDPOINTS.SUBMIT;

  // Build body - only include fields with values
  const body: Record<string, any> = {
    homeworkStudentId: payload.homeworkStudentId,
  };

  // Only add textAnswer if it has value
  if (payload.textAnswer && payload.textAnswer.trim()) {
    body.textAnswer = payload.textAnswer;
  }

  // Only add attachmentUrls if there are URLs
  if (payload.attachmentUrls && payload.attachmentUrls.length > 0) {
    body.attachmentUrls = payload.attachmentUrls;
  }

  // Only add linkUrl if it has value
  if (payload.linkUrl && payload.linkUrl.trim()) {
    body.linkUrl = payload.linkUrl;
  }

  try {
    const response = await post<any>(endpoint, body);
    const responseData = response?.data || response;

    return {
      data: responseData?.data,
      isSuccess: responseData?.isSuccess ?? true,
      message: responseData?.message,
    };
  } catch (error: any) {
    return {
      isSuccess: false,
      message:
        error?.response?.data?.message ||
        error?.message ||
        "Lỗi khi nộp bài tập",
    };
  }
}

export async function submitMultipleChoiceHomework(
  payload: SubmitMultipleChoicePayload
): Promise<SubmitMultipleChoiceResponse> {
  const endpoint = STUDENT_HOMEWORK_ENDPOINTS.SUBMIT_MULTIPLE_CHOICE;

  try {
    // post() đã trả về response.data rồi, không cần gọi .data lần nữa
    const responseData = await post<any>(endpoint, payload);

    return {
      data: responseData?.data,
      isSuccess: responseData?.isSuccess ?? true,
      message: responseData?.message,
    };
  } catch (error: any) {
    const errData = error?.response?.data;
    let msg = "Loi khi nop bai trac nghiem";
    if (typeof errData === "string" && errData) {
      msg = errData;
    } else if (errData?.message) {
      msg = errData.message;
    } else if (errData?.detail) {
      msg = errData.detail;
    } else if (errData?.error) {
      msg = errData.error;
    }
    return {
      isSuccess: false,
      message: msg,
    };
  }
}
