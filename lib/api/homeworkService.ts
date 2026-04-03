/**
 * Teacher Homework API Helper Functions
 *
 * All functions call Next.js API Routes (not backend directly).
 * Token is automatically injected via axios interceptors.
 */

import { getAccessToken } from "@/lib/store/authToken";
import { TEACHER_ENDPOINTS } from "@/constants/apiURL";
import { get, post, del, put } from "@/lib/axios";
import {
  FetchHomeworkParams,
  FetchHomeworkSubmissionsParams,
  HomeworkSubmission,
  HomeworkSubmissionItem,
  FetchHomeworkResult,
  FetchHomeworkSubmissionsResult,
  CreateHomeworkPayload,
  CreateHomeworkFromBankPayload,
  CreateHomeworkResult,
  DeleteHomeworkResult,
  HomeworkAttachment,
  ClassOption,
  SessionOption,
  MultipleChoiceQuestion,
  FetchQuestionBankParams,
  FetchQuestionBankResult,
  QuestionBankItem,
} from "@/types/teacher/homework";

/**
 * Fetch classes for dropdown - uses teacher enrollments API
 */
export async function fetchClasses(): Promise<ClassOption[]> {
  const token = getAccessToken();
  if (!token) {
    console.error("No access token found");
    return [];
  }

  try {
    const pageSize = 100;
    const res = await fetch(`${TEACHER_ENDPOINTS.ENROLLMENTS}?pageNumber=1&pageSize=${pageSize}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      console.error("Failed to fetch classes:", res.status);
      return [];
    }

    const json = await res.json();
    
    // Process enrollment data to get unique classes
    let rawItems: any[] = [];
    if (json?.data?.enrollments?.items) {
      rawItems = json.data.enrollments.items;
    } else if (json?.data?.items) {
      rawItems = json.data.items;
    } else if (Array.isArray(json?.data)) {
      rawItems = json.data;
    }

    // Aggregate by classId
    const classMap = new Map<string, ClassOption>();
    for (const item of rawItems) {
      const classId = String(item.classId || item.id || "");
      if (!classId) continue;
      
      if (!classMap.has(classId)) {
        classMap.set(classId, {
          id: classId,
          name: item.classTitle || item.className || item.classCode || "Lớp học",
          code: item.classCode || "",
        });
      }
    }

    return Array.from(classMap.values());
  } catch (error) {
    console.error("Error fetching classes:", error);
    return [];
  }
}

/**
 * Fetch sessions for a specific class
 * Uses teacher timetable API to get sessions for a class
 * 
 * @param classId - The class ID to fetch sessions for
 * @returns Array of session options
 */
export async function fetchSessions(classId: string): Promise<SessionOption[]> {
  const token = getAccessToken();
  if (!token) {
    console.error("No access token found");
    return [];
  }

  if (!classId) {
    return [];
  }

  try {
    // Get current date range (last 3 months to next 1 month)
    const today = new Date();
    const fromDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);
    const toDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    
    const from = fromDate.toISOString().split('T')[0];
    const to = toDate.toISOString().split('T')[0];

    // Fetch all sessions in date range
    const res = await fetch(`${TEACHER_ENDPOINTS.TIMETABLE}?from=${from}&to=${to}&pageNumber=1&pageSize=200`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      console.error("Failed to fetch sessions:", res.status);
      return [];
    }

    const json = await res.json();
    
    // Process session data from timetable API
    let rawItems: any[] = [];
    if (json?.data?.sessions) {
      rawItems = json.data.sessions;
    } else if (json?.data?.items) {
      rawItems = json.data.items;
    } else if (Array.isArray(json?.data)) {
      rawItems = json.data;
    } else if (Array.isArray(json?.sessions)) {
      rawItems = json.sessions;
    }

    // Filter by classId on client side
    const filteredItems = rawItems.filter((item: any) => {
      const itemClassId = String(item.classId || "");
      return itemClassId === classId;
    });

    // Map to session options
    return filteredItems.map((item: any) => ({
      id: item.id || item.sessionId || item.timetableId || "",
      name: item.classTitle || item.className || item.courseName || item.sessionName || `Buổi học`,
      date: item.plannedDatetime || item.actualDatetime || item.date || "",
      plannedDateTime: item.plannedDatetime || item.plannedDateTime || item.date || "",
    }));
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return [];
  }
}

function extractQuestionBankItems(payload: any): any[] {
  const candidates = [
    payload?.data?.items?.items,
    payload?.data?.questionBankItems?.items,
    payload?.data?.questionBankItems,
    payload?.data?.items,
    payload?.items?.items,
    payload?.questionBankItems?.items,
    payload?.questionBankItems,
    payload?.items,
    payload?.data,
    payload,
  ];

  const raw = candidates.find((item) => Array.isArray(item));
  return Array.isArray(raw) ? raw : [];
}

function normalizeQuestionType(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "MultipleChoice";
  const compact = raw.replace(/[\s_-]+/g, "").toLowerCase();

  if (["multiplechoice", "multiplechoices", "mcq"].includes(compact)) {
    return "MultipleChoice";
  }

  if (["textinput", "text"].includes(compact)) {
    return "TextInput";
  }

  if (["truefalse", "boolean"].includes(compact)) {
    return "TrueFalse";
  }

  if (["fillinblank", "fillblank"].includes(compact)) {
    return "FillInBlank";
  }

  if (compact === "essay") {
    return "Essay";
  }

  if (raw === "0") return "MultipleChoice";
  if (raw === "1") return "TextInput";
  if (raw === "2") return "TrueFalse";
  if (raw === "3") return "Essay";
  if (raw === "4") return "FillInBlank";

  return raw;
}

function normalizeQuestionBankItem(item: any): QuestionBankItem | null {
  const questionId = item?.id || item?.questionId;
  const questionText = item?.questionText || item?.text || item?.content;
  if (!questionId || !questionText) {
    return null;
  }

  const rawOptions = Array.isArray(item?.options)
    ? item.options
    : Array.isArray(item?.optionTexts)
      ? item.optionTexts
      : Array.isArray(item?.answers)
        ? item.answers
      : [];

  const options = rawOptions
    .map((option: any) => {
      if (typeof option === "string") {
        return option.trim();
      }
      return String(option?.text || option?.optionText || option?.content || "").trim();
    })
    .filter(Boolean);

  const rawLevel = item?.level;
  const normalizedLevel: QuestionBankItem["level"] =
    rawLevel === 0 || rawLevel === "0" || String(rawLevel).toLowerCase() === "easy"
      ? "Easy"
      : rawLevel === 2 || rawLevel === "2" || String(rawLevel).toLowerCase() === "hard"
        ? "Hard"
        : rawLevel === 1 || rawLevel === "1" || String(rawLevel).toLowerCase() === "medium"
          ? "Medium"
          : undefined;

  return {
    id: String(questionId),
    questionText: String(questionText),
    questionType: normalizeQuestionType(item?.questionType ?? item?.type),
    options,
    correctAnswer: String(
      item?.correctAnswer ??
      item?.correctOptionId ??
      item?.correctAnswerId ??
      item?.correctAnswerIndex ??
      item?.answer ??
      ""
    ),
    points: Number(item?.points ?? item?.score ?? 1),
    explanation: item?.explanation ?? null,
    level: normalizedLevel,
    programId: item?.programId,
    programName:
      item?.programName ??
      item?.courseName ??
      item?.course ??
      item?.program?.name ??
      null,
  };
}

export async function fetchQuestionBankItems(
  params: FetchQuestionBankParams
): Promise<FetchQuestionBankResult> {
  try {
    const searchParams = new URLSearchParams();
    if (params.programId) {
      searchParams.set("programId", params.programId);
    }
    if (params.level) {
      searchParams.set("level", params.level);
    }
    searchParams.set("pageNumber", String(params.pageNumber ?? 1));
    searchParams.set("pageSize", String(params.pageSize ?? 100));

    const response = await get<any>(`/api/question-bank?${searchParams.toString()}`);
    const items = extractQuestionBankItems(response)
      .map(normalizeQuestionBankItem)
      .filter((item): item is QuestionBankItem => Boolean(item));

    return {
      ok: true,
      data: items,
    };
  } catch (error) {
    console.error("Error fetching question bank:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to fetch question bank",
    };
  }
}

/**
 * Fetch homework submissions for teacher view
 * 
 * @param params - Query parameters including branchId, classId, date range, pagination
 * @returns Homework submissions with pagination metadata
 */
export async function fetchHomework(
  params: FetchHomeworkParams = {}
): Promise<FetchHomeworkResult> {
  try {
    // Build query string
    const searchParams = new URLSearchParams();
    
    if (params.branchId) {
      searchParams.append("branchId", params.branchId);
    }
    if (params.classId) {
      searchParams.append("classId", params.classId);
    }
    if (params.fromDate) {
      searchParams.append("fromDate", params.fromDate);
    }
    if (params.toDate) {
      searchParams.append("toDate", params.toDate);
    }
    if (params.pageNumber) {
      searchParams.append("pageNumber", String(params.pageNumber));
    }
    if (params.pageSize) {
      searchParams.append("pageSize", String(params.pageSize));
    }

    const queryString = searchParams.toString();
    const endpoint = queryString 
      ? `${TEACHER_ENDPOINTS.HOMEWORK}?${queryString}` 
      : TEACHER_ENDPOINTS.HOMEWORK;
    
    const response = await get<any>(endpoint);
    
    // Handle multiple response formats from backend
    let homeworkData: HomeworkSubmission[] = [];
    let meta = { pageNumber: 1, pageSize: 10, totalItems: 0, totalPages: 1 };
    
    // Try to extract homework data from various response formats
    const responseData = response?.data || response;
    
    // Format 1: homeworkAssignments with pagination (new format)
    if (responseData?.homeworkAssignments) {
      const assignments = responseData.homeworkAssignments;
      homeworkData = assignments.items || [];
      meta = {
        pageNumber: assignments.pageNumber || 1,
        pageSize: assignments.pageSize || 10,
        totalItems: assignments.totalCount || 0,
        totalPages: assignments.totalPages || 1,
      };
    }
    // Format 2: data is array
    else if (Array.isArray(responseData)) {
      homeworkData = responseData;
      meta = { pageNumber: 1, pageSize: homeworkData.length, totalItems: homeworkData.length, totalPages: 1 };
    }
    // Format 3: data.data is array
    else if (Array.isArray(responseData?.data)) {
      homeworkData = responseData.data;
      meta = { 
        pageNumber: responseData.pageNumber || 1, 
        pageSize: responseData.pageSize || homeworkData.length, 
        totalItems: responseData.totalCount || homeworkData.length, 
        totalPages: responseData.totalPages || 1 
      };
    }
    // Format 4: items array
    else if (Array.isArray(responseData?.items)) {
      homeworkData = responseData.items;
      meta = { 
        pageNumber: responseData.pageNumber || 1, 
        pageSize: responseData.pageSize || homeworkData.length, 
        totalItems: responseData.totalCount || homeworkData.length, 
        totalPages: responseData.totalPages || 1 
      };
    }
    // Format 5: Success response with data property
    else if (responseData?.isSuccess && responseData?.data) {
      if (Array.isArray(responseData.data)) {
        homeworkData = responseData.data;
      } else if (responseData.data.homeworkAssignments) {
        const assignments = responseData.data.homeworkAssignments;
        homeworkData = assignments.items || [];
        meta = {
          pageNumber: assignments.pageNumber || 1,
          pageSize: assignments.pageSize || 10,
          totalItems: assignments.totalCount || 0,
          totalPages: assignments.totalPages || 1,
        };
      }
    }
    
    return {
      ok: true,
      data: {
        data: homeworkData,
        meta: meta,
      },
    };
  } catch (error) {
    console.error("Error fetching homework:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to fetch homework submissions",
    };
  }
}

/**
 * Create a new homework assignment
 * 
 * @param payload - Homework data to create
 * @returns Created homework or error
 */
export async function createHomework(
  payload: CreateHomeworkPayload
): Promise<CreateHomeworkResult> {
  try {
    const response = await post<HomeworkSubmission>(
      TEACHER_ENDPOINTS.HOMEWORK,
      payload
    );

    return {
      ok: true,
      data: response,
    };
  } catch (error) {
    console.error("Error creating homework:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create homework",
    };
  }
}

/**
 * Create a new multiple choice homework assignment
 * 
 * @param payload - Multiple choice homeswork data to create
 * @returns Created homework or error
 */
export async function createMultipleChoiceHomework(
  payload: {
    classId: string;
    sessionId?: string;
    title: string;
    description?: string;
    dueAt: string;
    rewardStars?: number;
    missionId?: string;
    timeLimitMinutes?: number;
    allowResubmit?: boolean;
    instructions?: string;
    questions: MultipleChoiceQuestion[];
  }
): Promise<CreateHomeworkResult> {
  try {
    console.log("📤 [API] Sending payload:", JSON.stringify(payload, null, 2));
    
    const response = await post<HomeworkSubmission>(
      `${TEACHER_ENDPOINTS.HOMEWORK}/multiple-choice`, 
      payload
    );

    return {
      ok: true,
      data: response,
    };
  } catch (error: any) {
    console.error("❌ [API] Error response:", error.response?.data);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create multiple choice homework",
    };
  }
}

export async function createMultipleChoiceHomeworkFromBank(
  payload: CreateHomeworkFromBankPayload
): Promise<CreateHomeworkResult> {
  try {
    const response = await post<HomeworkSubmission>(
      `${TEACHER_ENDPOINTS.HOMEWORK}/multiple-choice/from-bank`,
      payload
    );

    return {
      ok: true,
      data: response,
    };
  } catch (error) {
    console.error("Error creating question-bank homework:", error);
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create multiple choice homework from bank",
    };
  }
}

/**
 * Delete a homework assignment
 *
 * @param id - Homework ID to delete
 * @returns Success or error
 */
export async function deleteHomework(
  id: string
): Promise<DeleteHomeworkResult> {
  try {
    await del<{ isSuccess: boolean; message?: string }>(
      `${TEACHER_ENDPOINTS.HOMEWORK}/${id}`
    );

    return {
      ok: true,
      message: "Homework deleted successfully",
    };
  }catch (error) {
    console.error("Error deleting homework:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to delete homework",
    };
  }
}

/**
 * Update a homework assignment
 *
 * @param id - Homework ID to update
 * @param payload - Homework data to update
 * @returns Updated homework or error
 */
export async function updateHomework(
  id: string,
  payload: Partial<CreateHomeworkPayload>
): Promise<CreateHomeworkResult> {
  try {
    const response = await put<HomeworkSubmission>(
      `${TEACHER_ENDPOINTS.HOMEWORK}/${id}`,
      payload
    );

    return {
      ok: true,
      data: response,
    };
  } catch (error) {
    console.error("Error updating homework:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to update homework",
    };
  }
}

/**
 * Fetch homework submissions for a specific homework assignment
 * Uses GET /api/homework/submissions?classId=...&pageNumber=...&pageSize=...
 *
 * @param params - Query parameters including classId, status, pagination
 * @returns Submissions for the specified homework/class
 */
export async function fetchHomeworkSubmissions(
  params: FetchHomeworkSubmissionsParams = {}
): Promise<FetchHomeworkSubmissionsResult> {
  try {
    // Build query string
    const searchParams = new URLSearchParams();

    if (params.classId) {
      searchParams.append("classId", params.classId);
    }
    if (params.status !== undefined) {
      searchParams.append("status", String(params.status));
    }
    if (params.pageNumber !== undefined) {
      searchParams.append("pageNumber", String(params.pageNumber));
    } else {
      searchParams.append("pageNumber", "1");
    }
    if (params.pageSize !== undefined) {
      searchParams.append("pageSize", String(params.pageSize));
    } else {
      searchParams.append("pageSize", "100");
    }

    const queryString = searchParams.toString();
    const endpoint = `${TEACHER_ENDPOINTS.HOMEWORK_SUBMISSIONS}?${queryString}`;

    const response = await get<any>(endpoint);

    // Handle response - extract submissions items from various formats
    const responseData = response?.data || response;

    let submissions: HomeworkSubmissionItem[] = [];

    // Format 1: submissions.items (pagination format)
    if (responseData?.submissions?.items) {
      submissions = responseData.submissions.items;
    }
    // Format 2: items array directly
    else if (Array.isArray(responseData?.items)) {
      submissions = responseData.items;
    }
    // Format 3: isSuccess response
    else if (responseData?.isSuccess && responseData?.data) {
      if (responseData.data?.submissions?.items) {
        submissions = responseData.data.submissions.items;
      } else if (Array.isArray(responseData.data)) {
        submissions = responseData.data;
      }
    }
    // Format 4: data.data is array
    else if (Array.isArray(responseData?.data)) {
      submissions = responseData.data;
    }

    return {
      ok: true,
      data: submissions,
    };
  } catch (error) {
    console.error("Error fetching homework submissions:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to fetch homework submissions",
    };
  }
}

/**
 * Fetch homework detail by ID
 *
 * @param id - Homework ID to fetch
 * @returns Homework detail or error
 */
export async function fetchHomeworkDetail(
  id: string
): Promise<{ ok: boolean; data?: HomeworkSubmission; error?: string }> {
  try {
    const response = await get<any>(`${TEACHER_ENDPOINTS.HOMEWORK}/${id}`);
    
    // Handle various response formats
    let homeworkData: HomeworkSubmission | null = null;
    const responseData = response?.data || response;
    
    // Format 1: Direct homework object
    if (responseData && responseData.id) {
      homeworkData = responseData;
    }
    // Format 2: Success response with data property
    else if (responseData?.isSuccess && responseData?.data) {
      homeworkData = responseData.data;
    }
    // Format 3: items array (pagination)
    else if (Array.isArray(responseData?.items)) {
      homeworkData = responseData.items[0] || null;
    }
    
    if (homeworkData) {
      return {
        ok: true,
        data: homeworkData,
      };
    }
    
    return {
      ok: false,
      error: "Không tìm thấy bài tập",
    };
  } catch (error) {
    console.error("Error fetching homework detail:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to fetch homework detail",
    };
  }
}

/**
 * Map API submission to UI model
 */
export function mapSubmissionToUi(submission: HomeworkSubmission) {
  // Determine color based on status
  const colorMap: Record<string, string> = {
    PENDING: "from-amber-500 to-orange-500",
    SUBMITTED: "from-sky-500 to-blue-500",
    REVIEWED: "from-emerald-500 to-teal-500",
    OVERDUE: "from-gray-600 to-gray-700",
  };

  // Format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  // Parse file type from attachment
  const getFileType = (attachment?: HomeworkAttachment): string => {
    if (!attachment) return "FILE";
    const ext = attachment.name.split(".").pop()?.toUpperCase() || "";
    const typeMap: Record<string, string> = {
      PDF: "PDF",
      DOC: "DOC",
      DOCX: "DOCX",
      MP3: "MP3",
      MP4: "VIDEO",
      ZIP: "ZIP",
    };
    return typeMap[ext] || "FILE";
  };

  // Format date with explicit timezone handling for Vietnam (+07:00)
  const formatDueDate = (dateStr?: string): string => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      // Parse ISO string to extract UTC+7 components manually
      // Backend stores as "YYYY-MM-DDTHH:mm:ss" (treated as UTC)
      // Vietnam is UTC+7, so we interpret the string as Vietnam time
      const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
      if (match) {
        const [, year, month, day, hours, minutes] = match;
        // Create Date treating values as Vietnam time (UTC+7)
        // Subtract 7 hours so that when displayed in any timezone,
        // it shows the correct Vietnam time
        const vnMs = Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours) - 7, parseInt(minutes));
        const vnDate = new Date(vnMs);
        return vnDate.toLocaleString("vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });
      }
      // Fallback: use toLocaleString with explicit timezone
      return date.toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    } catch {
      return dateStr;
    }
  };

  // Format plannedDateTime (session date) - shows just the date
  const formatSessionDate = (dateTime?: string): string => {
    if (!dateTime) return "-";
    try {
      const date = new Date(dateTime);
      // Check if it's a valid date
      if (isNaN(date.getTime())) return dateTime;
      
      return date.toLocaleDateString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateTime;
    }
  };

  // Format session time (shows time only)
  const formatSessionTime = (dateTime?: string): string => {
    if (!dateTime) return "";
    try {
      const date = new Date(dateTime);
      if (isNaN(date.getTime())) return "";
      
      return date.toLocaleTimeString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch {
      return "";
    }
  };

  const primaryAttachment = submission.attachments?.[0];

  // Build session display - show session name with date
  const sessionDisplay = (() => {
    const sessionDate = formatSessionDate(submission.plannedDateTime);
    const sessionTime = formatSessionTime(submission.plannedDateTime);
    
    if (submission.sessionName) {
      // If has session name and date, show: "Buổi X - DD/MM/YYYY"
      if (sessionDate !== "-") {
        return `${submission.sessionName} - ${sessionDate}${sessionTime ? ` (${sessionTime})` : ""}`;
      }
      return submission.sessionName;
    }
    
    // If no sessionName but has plannedDateTime, show the date
    if (submission.plannedDateTime) {
      return `${sessionDate}${sessionTime ? ` (${sessionTime})` : ""}`;
    }
    
    return "-";
  })();

  return {
    id: submission.id,
    student: submission.studentName,
    studentId: submission.studentCode || submission.studentId,
    className: submission.classTitle,
    file: primaryAttachment?.name || "No file",
    fileSize: primaryAttachment?.size || formatFileSize(primaryAttachment?.sizeInBytes),
    fileType: getFileType(primaryAttachment),
    assignmentTitle: submission.title,
    dueDate: formatDueDate(submission.dueAt),
    skills: submission.skills,
    description: submission.description,
    note: submission.feedback,
    score: submission.score,
    color: colorMap[submission.status] || "from-gray-500 to-gray-600",
    submissionType: submission.submissionType,

    // Session/Buổi học mapping - explicitly show session info
    sessionId: submission.sessionId,
    session: sessionDisplay,
  };
}

/**
 * Calculate stats from submissions
 */
export function calculateHomeworkStats(submissions: HomeworkSubmission[]) {
  const total = submissions.length;
  const pending = submissions.filter(s => s.status === "PENDING").length;
  const submitted = submissions.filter(s => s.status === "SUBMITTED").length;
  const reviewed = submissions.filter(s => s.status === "REVIEWED").length;
  const overdue = submissions.filter(s => s.status === "OVERDUE").length;
  
  const scoredSubmissions = submissions.filter(s => s.score !== undefined && s.score !== null);
  const averageScore = scoredSubmissions.length > 0
    ? scoredSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / scoredSubmissions.length
    : undefined;

  return {
    total,
    pending,
    submitted,
    reviewed,
    overdue,
    averageScore: averageScore ? Math.round(averageScore * 10) / 10 : undefined,
  };
}
