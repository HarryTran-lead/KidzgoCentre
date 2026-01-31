/**
 * Admin Classes API Helpers
 * Fetch class list and create classes for admin portal
 */

import { getAccessToken } from "@/lib/store/authToken";
import { ADMIN_ENDPOINTS, USER_ENDPOINTS } from "@/constants/apiURL";
import type { ClassRow, CreateClassRequest, Class, ClassDetail, Track } from "@/types/admin/classes";

function mapApiClassToRow(item: any): ClassRow {
  // Use UUID as id for API calls, code for display
  const id = String(item?.id ?? item?.classId ?? "");
  const code = String(item?.code ?? item?.classCode ?? "");
  const name = item?.title ?? item?.classTitle ?? "Lớp học";
  const sub = item?.programName ?? "";
  const teacher = item?.mainTeacherName ?? "Chưa phân công";
  const branch = String(item?.branchName ?? item?.branch?.name ?? "").trim() || "Chưa có chi nhánh";
  const current = item?.currentEnrollmentCount ?? 0;
  const capacity = item?.capacity ?? 0;
  const schedulePattern = (item?.schedulePattern as string | undefined) ?? "";
  const schedule = schedulePattern.trim() || "Chưa có lịch";
  
  const rawStatus: string = (item?.status as string | undefined) ?? "";
  let status: ClassRow["status"] = "Sắp khai giảng";
  const normalized = rawStatus.toLowerCase();
  if (normalized === "active") status = "Đang học";
  else if (normalized === "closed") status = "Đã kết thúc";

  return {
    id,
    code,
    name,
    sub,
    teacher,
    branch,
    current,
    capacity,
    schedule,
    status,
  };
}

export async function fetchAdminClasses(): Promise<ClassRow[]> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại để xem danh sách lớp.");
  }

  const params = new URLSearchParams({
    pageNumber: "1",
    pageSize: "100",
  });

  const res = await fetch(`${ADMIN_ENDPOINTS.CLASSES}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  console.log({res});
  

  if (!res.ok) {
    const text = await res.text();
    console.error("Fetch admin classes error:", res.status, text);
    throw new Error("Không thể tải danh sách lớp học từ máy chủ.");
  }

  const json: any = await res.json();

  let items: any[] = [];
  if (Array.isArray(json?.data?.classes?.items)) {
    items = json.data.classes.items;
  } else if (Array.isArray(json?.data?.items)) {
    items = json.data.items;
  } else if (Array.isArray(json?.data)) {
    items = json.data;
  } else if (Array.isArray(json)) {
    items = json;
  }

  // Map classes first
  const mappedClasses = items.map(mapApiClassToRow).filter((c: ClassRow) => c.id);

  // Create a map from class ID to item for easier lookup
  const classIdToItemMap = new Map<string, any>();
  items.forEach((item: any) => {
    const classId = String(item?.id ?? item?.classId ?? "");
    if (classId) {
      classIdToItemMap.set(classId, item);
    }
  });

  // Collect teacher IDs that need to be fetched (where mainTeacherName is missing)
  const teacherIdsToFetch = new Set<string>();
  items.forEach((item: any) => {
    const mainTeacherId = item?.mainTeacherId;
    const mainTeacherName = item?.mainTeacherName;
    if (mainTeacherId && !mainTeacherName) {
      teacherIdsToFetch.add(String(mainTeacherId));
    }
  });

  // Fetch teacher names if needed
  if (teacherIdsToFetch.size > 0) {
    try {
      const teacherNameMap = await fetchAdminUsersByIds(Array.from(teacherIdsToFetch));
      
      // Update teacher names in mapped classes using class ID to match
      mappedClasses.forEach((mappedClass) => {
        const item = classIdToItemMap.get(mappedClass.id);
        if (item) {
          const mainTeacherId = item?.mainTeacherId;
          const mainTeacherName = item?.mainTeacherName;
          if (mainTeacherId && !mainTeacherName) {
            const teacherName = teacherNameMap.get(String(mainTeacherId));
            if (teacherName) {
              mappedClass.teacher = teacherName;
            }
          }
        }
      });
    } catch (err) {
      console.error("Failed to fetch teacher names:", err);
      // Continue without teacher names, don't fail the whole request
    }
  }

  return mappedClasses;
}

export async function createAdminClass(
  payload: CreateClassRequest
): Promise<Class> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại để tạo lớp học.");
  }

  const res = await fetch(ADMIN_ENDPOINTS.CLASSES, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const detail = json?.detail || json?.message || json?.error;
    const title = json?.title;
    
    let msg = "Không thể tạo lớp học từ máy chủ.";
    if (detail) {
      msg = detail;
    } else if (title) {
      msg = title;
    } else if (typeof text === "string" && text.trim()) {
      msg = text;
    }
    
    if (json?.title === "Class.ProgramNotFound" || detail?.includes("Program not found")) {
      msg = "Chương trình không tồn tại, đã bị xóa hoặc không hoạt động. Vui lòng chọn chương trình khác.";
    }
    
    throw new Error(msg);
  }

  const data = json?.data ?? json?.class ?? json;
  const classData: Class = {
    id: String(data?.id ?? data?.code ?? ""),
    code: data?.code ?? payload.code ?? null,
    title: data?.title ?? payload.title ?? null,
    programId: data?.programId ?? payload.programId ?? null,
    branchId: data?.branchId ?? payload.branchId ?? null,
    mainTeacherId: data?.mainTeacherId ?? payload.mainTeacherId ?? null,
    assistantTeacherId: data?.assistantTeacherId ?? payload.assistantTeacherId ?? null,
    startDate: data?.startDate ?? payload.startDate ?? null,
    endDate: data?.endDate ?? payload.endDate ?? null,
    capacity: typeof data?.capacity === "number" ? data.capacity : payload.capacity ?? null,
    schedulePattern: data?.schedulePattern ?? payload.schedulePattern ?? null,
    status: data?.status ?? null,
  };

  if (!classData.id) {
    classData.id = `CLASS-${Date.now()}`;
  }

  return classData;
}

export async function fetchAdminClassDetail(
  classId: string
): Promise<any> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại để xem chi tiết lớp học.");
  }

  const res = await fetch(`${ADMIN_ENDPOINTS.CLASSES}/${classId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    let errorMessage = "Không thể tải chi tiết lớp học từ máy chủ.";
    
    try {
      const errorJson = JSON.parse(text);
      errorMessage = errorJson?.detail || errorJson?.message || errorMessage;
    } catch {
      // If parsing fails, use default message
    }
    
    console.error("Fetch admin class detail error:", res.status, text);
    throw new Error(errorMessage);
  }

  const json: any = await res.json();
  
  // Handle response structure: { isSuccess: true, data: {...} } or { data: {...} }
  if (json?.isSuccess && json?.data) {
    return json.data;
  }
  
  return json?.data ?? json?.class ?? json;
}

export interface EnrollmentItem {
  id?: string | null;
  classId?: string | null;
  classCode?: string | null;
  classTitle?: string | null;
  studentProfileId?: string | null;
  studentName?: string | null;
  studentEmail?: string | null;
  studentPhone?: string | null;
  enrollDate?: string | null;
  status?: string | null;
  programName?: string | null;
  schedulePattern?: string | null;
  capacity?: number | null;
  mainTeacherName?: string | null;
}

export interface EnrollmentApiResponse {
  success?: boolean;
  isSuccess?: boolean;
  data: {
    enrollments?: {
      items: EnrollmentItem[];
      totalPages?: number;
      totalCount?: number;
    };
    items?: EnrollmentItem[];
    totalPages?: number;
    totalCount?: number;
  } | EnrollmentItem[];
  message?: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  attendance: number;
  progress: number;
  stars: number;
  lastActive: string;
  status: "active" | "inactive";
}

/**
 * Fetch students (enrollments) for a class
 */
export async function fetchAdminClassStudents(
  classId: string,
  options: {
    pageNumber?: number;
    pageSize?: number;
    status?: string;
  } = {}
): Promise<Student[]> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại để xem danh sách học viên.");
  }

  const { pageNumber = 1, pageSize = 100, status = "Active" } = options;
  const queryParams = new URLSearchParams({
    classId: classId,
    pageNumber: pageNumber.toString(),
    pageSize: pageSize.toString(),
  });
  
  if (status) {
    queryParams.append("status", status);
  }

  const res = await fetch(`/api/enrollments?${queryParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Fetch enrollments error:", res.status, text);
    throw new Error("Không thể tải danh sách học viên từ máy chủ.");
  }

  const json: EnrollmentApiResponse = await res.json();
  
  let rawItems: EnrollmentItem[] = [];
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

  // Map enrollment items to Student format
  const students: Student[] = rawItems.map((item, index) => {
    // Map enrollment status to student status
    const enrollmentStatus = (item.status ?? "").toLowerCase();
    const studentStatus: "active" | "inactive" = 
      enrollmentStatus === "active" ? "active" : "inactive";

    return {
      id: String(item.studentProfileId ?? `ST${index}`),
      name: item.studentName ?? "Học viên",
      email: item.studentEmail ?? "",
      phone: item.studentPhone ?? "",
      avatar: undefined,
      attendance: 100, // TODO: Calculate from attendance data if available
      progress: 0, // TODO: Calculate from progress data if available
      stars: 0, // TODO: Get from student profile if available
      lastActive: item.enrollDate ?? "",
      status: studentStatus,
    };
  });

  return students;
}

/**
 * Fetch user by ID (for getting teacher name)
 */
export async function fetchAdminUserById(userId: string): Promise<{ id: string; name: string; email?: string } | null> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
  }

  try {
    const res = await fetch(USER_ENDPOINTS.GET_BY_ID(userId), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      console.error("Fetch user error:", res.status);
      return null;
    }

    const json: any = await res.json();
    const userData = json?.data ?? json?.user ?? json;
    
    if (!userData) {
      return null;
    }

    return {
      id: String(userData?.id ?? userId),
      name: userData?.fullName ?? userData?.name ?? userData?.username ?? "Không rõ",
      email: userData?.email ?? undefined,
    };
  } catch (err) {
    console.error("Failed to fetch user:", err);
    return null;
  }
}

/**
 * Fetch multiple users by IDs (for getting teacher names)
 */
export async function fetchAdminUsersByIds(userIds: string[]): Promise<Map<string, string>> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
  }

  const nameMap = new Map<string, string>();

  if (userIds.length === 0) {
    return nameMap;
  }

  try {
    // Fetch all users and filter by IDs
    const queryParams = new URLSearchParams({
      pageNumber: "1",
      pageSize: "100",
    });

    const res = await fetch(`${USER_ENDPOINTS.GET_ALL}?${queryParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      console.error("Fetch users error:", res.status);
      return nameMap;
    }

    const json: any = await res.json();
    let items: any[] = [];

    if (Array.isArray(json?.data?.users?.items)) {
      items = json.data.users.items;
    } else if (Array.isArray(json?.data?.items)) {
      items = json.data.items;
    } else if (Array.isArray(json?.data)) {
      items = json.data;
    } else if (Array.isArray(json)) {
      items = json;
    }

    // Filter by IDs and create map
    const idSet = new Set(userIds);
    items.forEach((item: any) => {
      const id = String(item?.id ?? "");
      if (idSet.has(id)) {
        const name = item?.fullName ?? item?.name ?? item?.username ?? "Không rõ";
        nameMap.set(id, name);
      }
    });
  } catch (err) {
    console.error("Failed to fetch users:", err);
  }

  return nameMap;
}

/**
 * Fetch and map class detail with teacher names
 */
export async function fetchAndMapAdminClassDetail(classId: string): Promise<ClassDetail> {
  const apiData = await fetchAdminClassDetail(classId);

  // Map API response to ClassDetail
  const trackHint = `${apiData?.title ?? ""} ${apiData?.code ?? ""} ${apiData?.programName ?? ""}`.toLowerCase();
  let track: Track = "IELTS";
  if (trackHint.includes("toeic")) track = "TOEIC";
  else if (trackHint.includes("business")) track = "Business";

  const schedulePattern = apiData?.schedulePattern ?? "";
  const schedule = schedulePattern.trim() || "Chưa có lịch";

  // Fetch teacher names if needed
  let teacherName = apiData?.mainTeacherName ?? "Chưa phân công";
  let assistantTeacherName = apiData?.assistantTeacherName ?? "";
  
  if (apiData?.mainTeacherId || apiData?.assistantTeacherId) {
    try {
      const teacherIds: string[] = [];
      if (apiData?.mainTeacherId && !apiData?.mainTeacherName) {
        teacherIds.push(apiData.mainTeacherId);
      }
      if (apiData?.assistantTeacherId && !apiData?.assistantTeacherName) {
        teacherIds.push(apiData.assistantTeacherId);
      }
      
      if (teacherIds.length > 0) {
        const teacherNameMap = await fetchAdminUsersByIds(teacherIds);
        
        if (apiData?.mainTeacherId && !apiData?.mainTeacherName) {
          teacherName = teacherNameMap.get(String(apiData.mainTeacherId)) ?? "Chưa phân công";
        }
        
        if (apiData?.assistantTeacherId && !apiData?.assistantTeacherName) {
          assistantTeacherName = teacherNameMap.get(String(apiData.assistantTeacherId)) ?? "";
        }
      }
    } catch (err) {
      console.error("Failed to fetch teacher names:", err);
      // Use default names
    }
  }

  const classDetail: ClassDetail = {
    id: String(apiData?.id ?? classId),
    name: apiData?.title ?? "Lớp học",
    code: apiData?.code ?? "",
    track,
    students: apiData?.currentEnrollmentCount ?? 0,
    schedule,
    room: apiData?.roomName ?? apiData?.room?.name ?? "Chưa có phòng",
    progress: 0,
    teacher: teacherName,
    assistantTeacher: assistantTeacherName,
    description: apiData?.description ?? "",
    startDate: apiData?.startDate ?? "",
    endDate: apiData?.endDate ?? "",
    totalLessons: 0,
    completedLessons: 0,
  };

  return classDetail;
}
