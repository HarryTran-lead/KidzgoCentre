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
import { get } from "@/lib/axios";
import type { StudentClassesResponse } from "@/types/student/class";
import type { StudentsResponse } from "@/types/student/student";
import type { AssignmentListItem, HomeworkStats } from "@/types/student/homework";

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
  if (responseData?.data?.homeworkAssignments?.items) {
    items = responseData.data.homeworkAssignments.items.map(mapToAssignmentListItem);
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
