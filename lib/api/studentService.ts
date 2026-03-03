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
 const endpoint =
    typeof STUDENT_ENDPOINTS.GET_CLASSES === "function"
      ? STUDENT_ENDPOINTS.GET_CLASSES()
      : "/api/students/classes";

  return get<StudentClassesResponse>(endpoint, {
    params: params ?? {},
  });
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
function mapApiStatusToUiStatus(apiStatus?: number): AssignmentListItem["status"] {
  switch (apiStatus) {
    case 1:
      return "PENDING";
    case 2:
      return "SUBMITTED";
    case 3:
      return "MISSING";
    default:
      return "PENDING";
  }
}

// Map API response to AssignmentListItem
function mapToAssignmentListItem(item: any): AssignmentListItem {
  return {
    id: item.id || item.homeworkId || "",
    title: item.title || item.homeworkTitle || "",
    subject: item.subjectName || item.subject || "",
    className: item.className || item.classTitle || "",
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
    status: mapApiStatusToUiStatus(item.status),
    type: item.type as AssignmentListItem["type"] || "FILE_UPLOAD",
    score: item.score,
    maxScore: item.maxScore || item.totalScore || 10,
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
        pageNumber: responseData?.data?.homeworkAssignments?.pageNumber || params?.pageNumber || 1,
        pageSize: responseData?.data?.homeworkAssignments?.pageSize || params?.pageSize || 10,
        totalCount: responseData?.data?.homeworkAssignments?.totalCount || items.length,
        totalPages: responseData?.data?.homeworkAssignments?.totalPages || 1,
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
    const assignment: AssignmentDetail = {
      id: item.id || item.homeworkStudentId || "",
      title: item.title || item.homeworkTitle || item.assignmentTitle || "",
      className: item.className || item.classTitle || "",
      subject: item.subjectName || item.subject || "",
      teacher: item.teacherName || item.teacher || "",
      assignedDate: item.assignedDate
        ? new Date(item.assignedDate).toLocaleDateString("vi-VN")
        : "",
      dueDate: item.dueDate
        ? new Date(item.dueDate).toLocaleDateString("vi-VN")
        : "",
      status: mapApiStatusToUiStatus(item.status) as AssignmentDetail["status"],
      description: item.description || "",
      requirements: item.requirements || [],
      rubric: item.rubric || [],
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
        teacherComment: item.grading.teacherComment,
        aiSuggestions: item.grading.aiSuggestions,
        gradedFiles: item.grading.gradedFiles,
        rubricScores: item.grading.rubricScores,
      } : undefined,
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