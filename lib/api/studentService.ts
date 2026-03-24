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
import { get, post } from "@/lib/axios";
import type { StudentClassesResponse } from "@/types/student/class";
import type { StudentsResponse } from "@/types/student/student";
import type { AssignmentListItem, HomeworkStats, AssignmentDetail } from "@/types/student/homework";

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
  status?: number; // 1=Pending, 2=Success, 3=Failed
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
    book: item.book || null,
    pages: item.pages || null,
    skills: item.skills || null,
    submissionType: item.submissionType || "File",
    maxScore: item.maxScore || 10,
    status: mapApiStatusToUiStatus(item.status),
    submittedAt: item.submittedAt || null,
    gradedAt: item.gradedAt || null,
    score: item.score ?? null,
    isLate: item.isLate || false,
    isOverdue: item.isOverdue || false,
    // Legacy fields for compatibility
    title: item.assignmentTitle || item.title || "",
    subject: item.subjectName || item.subject || "",
    className: item.classTitle || item.className || "",
    assignedDate: item.createdAt 
      ? new Date(item.createdAt).toLocaleDateString("vi-VN")
      : "",
    dueDate: item.dueAt 
      ? new Date(item.dueAt).toLocaleDateString("vi-VN")
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

  // Handle response format
  const responseData = response?.data || response;

  // Map items if present
  let items: AssignmentListItem[] = [];
  
  // Handle multiple possible response formats
  // Format 1: response.data.homeworks.items (API mới)
  // Format 2: response.data.homeworkAssignments.items (API cũ)
  // Format 3: response.homeworks.items
  // Format 4: Array directly in data
  if (responseData?.data?.homeworks?.items) {
    items = responseData.data.homeworks.items.map(mapToAssignmentListItem);
  } else if (responseData?.data?.homeworkAssignments?.items) {
    items = responseData.data.homeworkAssignments.items.map(mapToAssignmentListItem);
  } else if (responseData?.homeworks?.items) {
    items = responseData.homeworks.items.map(mapToAssignmentListItem);
  } else if (responseData?.homeworkAssignments?.items) {
    items = responseData.homeworkAssignments.items.map(mapToAssignmentListItem);
  } else if (Array.isArray(responseData?.data)) {
    items = responseData.data.map(mapToAssignmentListItem);
  } else if (Array.isArray(responseData)) {
    items = responseData.map(mapToAssignmentListItem);
  }

  // Calculate stats from items
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
        pageNumber:
          responseData?.data?.homeworkAssignments?.pageNumber ||
          responseData?.data?.homeworks?.pageNumber ||
          params?.pageNumber ||
          1,
        pageSize:
          responseData?.data?.homeworkAssignments?.pageSize ||
          responseData?.data?.homeworks?.pageSize ||
          params?.pageSize ||
          10,
        totalCount:
          responseData?.data?.homeworkAssignments?.totalCount ||
          responseData?.data?.homeworks?.totalCount ||
          items.length,
        totalPages:
          responseData?.data?.homeworkAssignments?.totalPages ||
          responseData?.data?.homeworks?.totalPages ||
          1,
      },
    },
    isSuccess: responseData?.isSuccess ?? true,
    message: responseData?.message,
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

    // Debug log
    console.log("Homework detail response:", responseData);

    // Handle different response formats
    let item = responseData?.data;
    
    // If data is nested differently
    if (!item && responseData) {
      // Maybe responseData itself is the data
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
    const answerResultsRaw = reviewSource.answerResults || item.answerResults || [];

    const assignment: AssignmentDetail = {
      id: item.id || item.homeworkStudentId || "",
      title: item.title || item.homeworkTitle || item.assignmentTitle || "",
      className: item.className || item.classTitle || "",
      subject: item.subjectName || item.subject || "",
      teacher: item.teacherName || item.teacher || "",
      assignedDate: item.assignedDate
        ? new Date(item.assignedDate).toLocaleDateString("vi-VN")
        : item.createdAt
        ? new Date(item.createdAt).toLocaleDateString("vi-VN")
        : "",
      dueDate: item.dueDate
        ? new Date(item.dueDate).toLocaleDateString("vi-VN")
        : item.dueAt
        ? new Date(item.dueAt).toLocaleDateString("vi-VN")
        : "",
      status: mapApiStatusToUiStatus(item.status) as AssignmentDetail["status"],
      submissionType:
        typeof submissionTypeRaw === "string"
          ? (submissionTypeRaw.toUpperCase() as AssignmentDetail["submissionType"])
          : undefined,
      timeLimitMinutes: item.timeLimitMinutes ?? item.examTimeMinutes ?? undefined,
      description: item.description || item.assignmentDescription || "",
      instructions: item.instructions || "",
      requirements: item.requirements || [],
      rubric: item.rubric || [],
      questions: Array.isArray(item.questions)
        ? item.questions.map((question: any, index: number) => ({
            id: question.id || question.questionId || `question-${index}`,
            questionText: question.questionText || question.text || "",
            questionType: question.questionType,
            options: Array.isArray(question.options)
              ? question.options.map((option: any, optionIndex: number) => ({
                  id:
                    option.id ||
                    option.optionId ||
                    `${question.id || question.questionId || `question-${index}`}-option-${optionIndex}`,
                  text: typeof option === "string" ? option : option.text || option.content || "",
                }))
              : [],
            explanation: question.explanation,
            points: question.points,
          }))
        : [],
      teacherAttachments: item.teacherAttachments || item.attachments || [],
      allowResubmit: item.allowResubmit ?? true,
      maxResubmissions: item.maxResubmissions,
      editCount: item.editCount || 0,
      submission: item.submission ? {
        id: item.submission.id,
        submittedAt: item.submission.submittedAt
          ? new Date(item.submission.submittedAt).toLocaleString("vi-VN")
          : "",
        status: item.submission.status === 1 ? "ON_TIME" : "LATE",
        content: item.submission.content,
        version: item.submission.version || 1,
      } : undefined,
      submissionHistory: item.submissionHistory?.map((sub: any) => ({
        id: sub.id,
        submittedAt: sub.submittedAt
          ? new Date(sub.submittedAt).toLocaleString("vi-VN")
          : "",
        status: sub.status === 1 ? "ON_TIME" : "LATE",
        content: sub.content,
        version: sub.version || 1,
      })),
      grading: item.grading ? {
        score: item.grading.score || 0,
        maxScore: item.grading.maxScore || item.grading.totalScore || 10,
        percentage: item.grading.percentage || 0,
        correctCount: item.grading.correctCount,
        wrongCount: item.grading.wrongCount,
        skippedCount: item.grading.skippedCount,
        totalPoints: item.grading.totalPoints,
        earnedPoints: item.grading.earnedPoints,
        teacherComment: item.grading.teacherComment,
        aiSuggestions: item.grading.aiSuggestions,
        gradedFiles: item.grading.gradedFiles,
        rubricScores: item.grading.rubricScores,
      } : undefined,
      review:
        Array.isArray(answerResultsRaw) && answerResultsRaw.length > 0
          ? {
              showReview: Boolean(reviewSource.showReview ?? item.showReview ?? true),
              showCorrectAnswer: reviewSource.showCorrectAnswer ?? item.showCorrectAnswer,
              showExplanation: reviewSource.showExplanation ?? item.showExplanation,
              primaryActionLabel: reviewSource.primaryActionLabel ?? item.primaryActionLabel,
              answerResults: answerResultsRaw.map((result: any) => ({
                questionId: result.questionId || "",
                questionText: result.questionText,
                selectedOptionId: result.selectedOptionId,
                selectedOptionText:
                  result.selectedOptionText || result.studentAnswer || result.selectedAnswer,
                correctOptionId: result.correctOptionId,
                correctOptionText:
                  result.correctOptionText || result.correctAnswer,
                isCorrect: Boolean(result.isCorrect),
                earnedPoints: result.earnedPoints ?? result.points,
                maxPoints: result.maxPoints ?? result.points,
                explanation: result.explanation,
              })),
            }
          : undefined,
      submittedAt: item.submittedAt
        ? new Date(item.submittedAt).toLocaleString("vi-VN")
        : undefined,
      gradedAt: item.gradedAt
        ? new Date(item.gradedAt).toLocaleString("vi-VN")
        : undefined,
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
    const response = await post<any>(endpoint, payload);
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
        "Loi khi nop bai trac nghiem",
    };
  }
}
