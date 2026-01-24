/**
 * Teacher Classes API Helper Functions
 * 
 * This file provides type-safe helper functions for teacher classes API calls.
 */

import { getAccessToken } from "@/lib/store/authToken";
import { TEACHER_ENDPOINTS } from "@/constants/apiURL";
import type {
  EnrollmentApiResponse,
  EnrollmentApiItem,
  ClassItem,
  Track,
  FetchClassesParams,
  FetchClassesResult,
  FetchClassDetailParams,
  FetchClassDetailResult,
  Student,
  ClassDetail,
} from "@/types/teacher/classes";

/**
 * Map aggregated enrollment data to ClassItem
 */
function mapApiClassToClassItem(item: any): ClassItem {
  // Extract track from programName/code/title
  const trackHint = `${item?.programName ?? ""} ${item?.classCode ?? item?.code ?? ""} ${item?.classTitle ?? item?.title ?? ""}`.toLowerCase();
  let track: Track = "IELTS";
  if (trackHint.includes("toeic")) track = "TOEIC";
  else if (trackHint.includes("business")) track = "Business";

  // Extract schedule info from schedulePattern
  const schedulePattern = item?.schedulePattern ?? "";
  const schedule = schedulePattern.trim() || "Chưa có lịch";

  // Room info không có trong response này, để mặc định
  const room = "Chưa có phòng";

  // Extract student count from currentEnrollmentCount
  const students = item?.currentEnrollmentCount ?? 0;
  const capacity = item?.capacity ?? 0;

  // Calculate progress based on enrollment vs capacity
  const progress = capacity > 0 ? Math.round((students / capacity) * 100) : undefined;

  // Extract teacher name
  const teacher = item?.mainTeacherName ?? undefined;

  return {
    id: String(item?.classId ?? item?.id ?? ""),
    name: item?.classTitle ?? item?.title ?? "Lớp học",
    code: item?.classCode ?? item?.code ?? "",
    track,
    students,
    schedule,
    room,
    progress,
    teacher,
  };
}

/**
 * Fetch classes for teacher
 * Uses enrollments API to get list of classes with student counts
 */
export async function fetchTeacherClasses(
  params: FetchClassesParams = {}
): Promise<FetchClassesResult> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại để xem lớp học.");
  }

  const { pageNumber = 1, pageSize = 100 } = params;
  const queryParams = new URLSearchParams({
    pageNumber: pageNumber.toString(),
    pageSize: pageSize.toString(),
  });

  const res = await fetch(`${TEACHER_ENDPOINTS.ENROLLMENTS}?${queryParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Fetch classes error:", res.status, text);
    throw new Error("Không thể tải danh sách lớp học từ máy chủ.");
  }

  const json: EnrollmentApiResponse = await res.json();

  // Response: json.data.enrollments.items (mỗi dòng là 1 học viên trong lớp)
  let rawItems: EnrollmentApiItem[] = [];
  if (json?.data && !Array.isArray(json.data)) {
    // data is an object, check for nested structure
    if (json.data.enrollments?.items && Array.isArray(json.data.enrollments.items)) {
      rawItems = json.data.enrollments.items;
    } else if (Array.isArray(json.data.items)) {
      rawItems = json.data.items;
    }
  } else if (Array.isArray(json?.data)) {
    rawItems = json.data;
  } else if (Array.isArray(json)) {
    rawItems = json;
  }

  // Gom theo classId để ra danh sách lớp + sĩ số
  const classMap = new Map<string, any>();
  for (const item of rawItems) {
    const classId = String(item.classId ?? "");
    if (!classId) continue;

    const existing = classMap.get(classId) ?? {
      classId,
      classCode: item.classCode ?? "",
      classTitle: item.classTitle ?? "Lớp học",
      currentEnrollmentCount: 0,
      programName: item.programName,
      schedulePattern: item.schedulePattern,
      capacity: item.capacity,
      mainTeacherName: item.mainTeacherName,
    };

    existing.currentEnrollmentCount += 1;
    classMap.set(classId, existing);
  }

  const aggregatedClasses = Array.from(classMap.values());

  // Extract pagination info safely
  const getPaginationInfo = () => {
    if (!json?.data || Array.isArray(json.data)) {
      return { totalPages: undefined, totalCount: undefined };
    }
    return {
      totalPages: json.data.enrollments?.totalPages ?? json.data.totalPages,
      totalCount: json.data.enrollments?.totalCount ?? json.data.totalCount,
    };
  };

  const paginationInfo = getPaginationInfo();

  console.log("Fetched classes from enrollments:", {
    totalClasses: aggregatedClasses.length,
    pageNumber,
    totalPages: paginationInfo.totalPages,
    sampleClass: aggregatedClasses[0],
  });

  const mappedClasses = aggregatedClasses
    .map(mapApiClassToClassItem)
    .filter((c: ClassItem) => c.id);

  return {
    classes: mappedClasses,
    totalPages: paginationInfo.totalPages,
    totalCount: paginationInfo.totalCount,
  };
}

/**
 * Fetch class detail with students
 * Uses enrollments API to get class information and student list
 */
export async function fetchClassDetail(
  params: FetchClassDetailParams,
  signal?: AbortSignal
): Promise<FetchClassDetailResult> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
  }

  const { classId, pageNumber = 1, pageSize = 100 } = params;
  const queryParams = new URLSearchParams({
    classId: classId,
    pageNumber: pageNumber.toString(),
    pageSize: pageSize.toString(),
  });

  const res = await fetch(`${TEACHER_ENDPOINTS.ENROLLMENTS}?${queryParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Fetch enrollments error", res.status, text);
    throw new Error("Không thể tải thông tin lớp học.");
  }

  const json: EnrollmentApiResponse = await res.json();
  let rawItems: EnrollmentApiItem[] = [];
  if (json?.data && !Array.isArray(json.data)) {
    // data is an object, check for nested structure
    if (json.data.enrollments?.items && Array.isArray(json.data.enrollments.items)) {
      rawItems = json.data.enrollments.items;
    } else if (Array.isArray(json.data.items)) {
      rawItems = json.data.items;
    }
  } else if (Array.isArray(json?.data)) {
    rawItems = json.data;
  } else if (Array.isArray(json)) {
    rawItems = json;
  }

  if (rawItems.length === 0) {
    throw new Error("Không tìm thấy dữ liệu cho lớp này.");
  }

  const first = rawItems[0];

  // Sử dụng thông tin từ enrollments để dựng class detail cơ bản
  const trackHint = `${first.classTitle ?? ""} ${first.classCode ?? ""}`.toLowerCase();
  let track: Track = "IELTS";
  if (trackHint.includes("toeic")) track = "TOEIC";
  else if (trackHint.includes("business")) track = "Business";

  const students: Student[] = rawItems.map((it, index) => ({
    id: String(it.studentProfileId ?? `ST${index}`),
    name: it.studentName ?? "Học viên",
    email: "",
    phone: "",
    avatar: undefined,
    attendance: 100,
    progress: 0,
    stars: 0,
    lastActive: "",
    status: "active",
  }));

  const classDetail: ClassDetail = {
    id: String(first.classId ?? classId),
    name: first.classTitle ?? "Lớp học",
    code: first.classCode ?? "",
    track,
    students: students.length,
    schedule: "Đang cập nhật",
    room: "Đang cập nhật",
    progress: 0,
    teacher: "",
    description: "",
    startDate: "",
    endDate: "",
    totalLessons: 0,
    completedLessons: 0,
  };

  return {
    classDetail,
    students,
  };
}
