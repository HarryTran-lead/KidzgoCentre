/**
 * Admin Sessions API Helpers
 * Create & fetch teaching sessions from admin portal
 */

import { getAccessToken } from "@/lib/store/authToken";
import { ADMIN_ENDPOINTS } from "@/constants/apiURL";
import type {
  ChangeTeacherRole,
  CreateSessionRequest,
  Session,
  SessionChangeResult,
  SessionChangeRoomRequest,
  SessionChangeTeacherRequest,
  SessionChangeSectionTypeRequest,
  UpdateSessionsByClassRequest,
  UpdateSessionsByClassResult,
} from "@/types/admin/sessions";

function extractApiErrorMessage(json: any, text: string, fallback: string, status?: number): string {
  // errors as array: [{code, description, message}]
  if (Array.isArray(json?.errors) && json.errors.length > 0) {
    const messages = json.errors
      .map((entry: any) => entry?.description || entry?.message || entry?.code)
      .filter(Boolean);
    if (messages.length > 0) return messages.join("; ");
  }

  // errors as object: {field: ["msg1", "msg2"]}
  if (json?.errors && typeof json.errors === "object" && !Array.isArray(json.errors)) {
    const messages: string[] = [];
    for (const key of Object.keys(json.errors)) {
      const val = json.errors[key];
      if (Array.isArray(val)) messages.push(...val.filter(Boolean));
      else if (typeof val === "string" && val) messages.push(val);
    }
    if (messages.length > 0) return messages.join("; ");
  }

  const msg = json?.detail || json?.message || json?.error || json?.title;
  if (msg) return msg;

  // Don't show raw HTML responses
  const trimmed = typeof text === "string" ? text.trim() : "";
  if (trimmed && !trimmed.startsWith("<")) return trimmed;

  if (status === 404) return `${fallback} (Endpoint chưa tồn tại trên máy chủ — mã 404)`;
  if (status != null && status >= 500) return `${fallback} (Lỗi máy chủ — mã ${status})`;

  return fallback;
}

function pickFirstString(...values: any[]): string | undefined {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }
  return undefined;
}

function pickPositiveNumber(...values: any[]): number | undefined {
  for (const value of values) {
    const num = Number(value);
    if (Number.isFinite(num) && num > 0) return num;
  }
  return undefined;
}

/**
 * Generate sessions from class schedule pattern
 */
export async function generateSessionsFromPattern(
  payload: {
    classId: string;
    roomId?: string;
    onlyFutureSessions?: boolean;
  }
): Promise<{ isSuccess: boolean; data?: any; message?: string }> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại để tạo lịch học.");
  }

  const res = await fetch(ADMIN_ENDPOINTS.SESSIONS_GENERATE_FROM_PATTERN, {
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
    const msg =
      json?.message ||
      json?.error ||
      (typeof text === "string" && text.trim() ? text : null) ||
      "Không thể tạo lịch học tự động từ máy chủ.";
    throw new Error(msg);
  }

  return {
    isSuccess: json?.isSuccess ?? true,
    data: json?.data ?? json,
    message: json?.message,
  };
}

export async function createAdminSession(
  payload: CreateSessionRequest
): Promise<Session> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại để tạo lịch học.");
  }

  const res = await fetch(ADMIN_ENDPOINTS.SESSIONS, {
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
    const msg =
      json?.message ||
      json?.error ||
      (typeof text === "string" && text.trim() ? text : null) ||
      "Không thể tạo lịch học từ máy chủ.";
    throw new Error(msg);
  }

  const responseData = json?.data ?? json;
  const data =
    responseData && typeof responseData === "object" && !Array.isArray(responseData) && "session" in responseData
      ? responseData.session
      : responseData;
  const session: Session = {
    id: String(data?.id ?? data?.sessionId ?? ""),
    classId: data?.classId ? String(data.classId) : (payload.classId ?? null),
    classTitle: data?.classTitle ?? data?.className ?? null,
    className: data?.className ?? null,
    plannedDatetime: String(data?.plannedDatetime ?? payload.plannedDatetime),
    durationMinutes:
      typeof data?.durationMinutes === "number" && data.durationMinutes > 0
        ? data.durationMinutes
        : payload.durationMinutes,
    plannedRoomId: data?.plannedRoomId ? String(data.plannedRoomId) : (payload.plannedRoomId ?? null),
    plannedRoomName: data?.plannedRoomName ?? null,
    roomName: data?.roomName ?? null,
    plannedTeacherId: data?.plannedTeacherId ? String(data.plannedTeacherId) : (payload.plannedTeacherId ?? null),
    plannedTeacherName: data?.plannedTeacherName ?? null,
    teacherName: data?.teacherName ?? null,
    plannedAssistantId:
      data?.plannedAssistantId != null
        ? String(data.plannedAssistantId)
        : (payload.plannedAssistantId ?? null),
    plannedAssistantName: data?.plannedAssistantName ?? null,
    assistantName: data?.assistantName ?? null,
    participationType: data?.participationType ?? null,
    sectionType: data?.sectionType ?? payload.sectionType ?? null,
    slotTypeId: data?.slotTypeId != null ? String(data.slotTypeId) : (payload.slotTypeId ?? null),
    slotTypeCode: data?.slotTypeCode ?? data?.slotType?.code ?? null,
    slotTypeName: data?.slotTypeName ?? data?.slotType?.name ?? null,
    color: data?.color ?? data?.Color ?? null,
  };

  if (!session.id) {
    session.id = `S-${Date.now()}`;
  }

  return session;
}

function mapApiSession(item: any): Session {
  const session: Session = {
    id: String(item?.id ?? item?.sessionId ?? ""),
    classId: item?.classId ? String(item.classId) : null,
    classTitle: item?.classTitle ?? item?.className ?? null,
    className: item?.className ?? null,
    branchId: item?.branchId ? String(item.branchId) : null,
    branchName: item?.branchName ?? null,
    plannedDatetime: String(item?.plannedDatetime ?? item?.startTime ?? ""),
    actualDatetime: item?.actualDatetime ?? null,
    durationMinutes:
      typeof item?.durationMinutes === "number" && item.durationMinutes > 0
        ? item.durationMinutes
        : 60,
    plannedRoomId: item?.plannedRoomId ? String(item.plannedRoomId) : null,
    plannedRoomName: item?.plannedRoomName ?? null,
    actualRoomId: item?.actualRoomId ? String(item.actualRoomId) : null,
    actualRoomName: item?.actualRoomName ?? null,
    roomName: item?.roomName ?? null,
    plannedTeacherId: item?.plannedTeacherId ? String(item.plannedTeacherId) : null,
    plannedTeacherName: item?.plannedTeacherName ?? null,
    actualTeacherId: item?.actualTeacherId ? String(item.actualTeacherId) : null,
    actualTeacherName: item?.actualTeacherName ?? null,
    teacherName: item?.teacherName ?? null,
    plannedAssistantId: item?.plannedAssistantId ? String(item.plannedAssistantId) : null,
    plannedAssistantName: item?.plannedAssistantName ?? null,
    actualAssistantId: item?.actualAssistantId ? String(item.actualAssistantId) : null,
    actualAssistantName: item?.actualAssistantName ?? null,
    assistantName: item?.assistantName ?? null,
    participationType: item?.participationType ?? null,
    sectionType: item?.sectionType ?? null,
    status: item?.status ?? null,
    color: item?.color ?? item?.Color ?? null,
    slotTypeId: item?.slotTypeId != null ? String(item.slotTypeId) : (item?.slotType?.id != null ? String(item.slotType.id) : null),
    slotTypeCode: item?.slotTypeCode ?? item?.slotType?.code ?? null,
    slotTypeName: item?.slotTypeName ?? item?.slotType?.name ?? null,
  };

  if (!session.id) {
    session.id = `S-${Date.now()}`;
  }

  return session;
}

/**
 * Update session color via PUT /api/sessions/{id}
 * First fetches the full session, then updates with merged color to avoid overwriting other fields
 */
export async function updateSessionColor(
  sessionId: string,
  color: string
): Promise<{ isSuccess: boolean; message?: string; localOnly?: boolean }> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập.");
  }

  const res = await fetch(`${ADMIN_ENDPOINTS.SESSIONS}/${sessionId}/color`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ color }),
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const msg = json?.message || json?.error || json?.title || "Không thể cập nhật màu.";
    console.error("Update session color failed:", res.status, json);
    throw new Error(msg);
  }

  return { isSuccess: json?.isSuccess ?? true, message: json?.message };
}

export async function updateClassColor(
  classId: string,
  color: string
): Promise<{ isSuccess: boolean; message?: string }> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập.");
  }

  const res = await fetch(`${ADMIN_ENDPOINTS.CLASSES_COLOR(classId)}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ color }),
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const msg = json?.message || json?.error || json?.title || "Không thể cập nhật màu lớp."
    console.error("Update class color failed:", res.status, json);
    throw new Error(msg);
  }

  return { isSuccess: json?.isSuccess ?? true, message: json?.message };
}

export async function fetchAdminSessions(
  params: {
    classId?: string;
    branchId?: string;
    status?: string;
    from?: string;
    to?: string;
    pageNumber?: number;
    pageSize?: number;
  } = {}
): Promise<Session[]> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập để xem lịch dạy.");
  }

  const search = new URLSearchParams();

  if (params.classId) search.set("classId", params.classId);
  if (params.branchId) search.set("branchId", params.branchId);
  if (params.status) search.set("status", params.status);
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  if (params.pageNumber) search.set("pageNumber", String(params.pageNumber));
  if (params.pageSize) search.set("pageSize", String(params.pageSize));

  const url =
    search.toString().length > 0
      ? `${ADMIN_ENDPOINTS.SESSIONS}?${search.toString()}`
      : ADMIN_ENDPOINTS.SESSIONS;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const msg =
      json?.message ||
      json?.error ||
      (typeof text === "string" && text.trim() ? text : null) ||
      "Không thể tải lịch dạy từ máy chủ.";
    throw new Error(msg);
  }

  let items: any[] = [];
  if (Array.isArray(json?.data?.sessions?.items)) {
    items = json.data.sessions.items;
  } else if (Array.isArray(json?.data?.sessions)) {
    items = json.data.sessions;
  } else if (Array.isArray(json?.data?.items)) {
    items = json.data.items;
  } else if (Array.isArray(json?.data)) {
    items = json.data;
  } else if (Array.isArray(json)) {
    items = json;
  }

  return items.map(mapApiSession).filter((s: Session) => s.id);
}

async function fetchRawSessionForUpdate(sessionId: string, token: string): Promise<any> {
  const res = await fetch(`${ADMIN_ENDPOINTS.SESSIONS}/${sessionId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const msg = json?.message || json?.error || json?.title || "Không thể tải thông tin buổi học hiện tại.";
    throw new Error(msg);
  }

  // Unwrap: { data: { session: {...} } } | { data: {...} } | { session: {...} } | raw
  const data = json?.data ?? json;
  const unwrapped =
    data && typeof data === "object" && !Array.isArray(data) && "session" in data
      ? data.session
      : data;
  return unwrapped;
}

/**
 * Update session fields (room, teacher, assistant, datetime, etc.)
 * via PUT /api/sessions/{id}
 */
export async function updateAdminSession(
  sessionId: string,
  payload: {
    plannedRoomId?: string;
    plannedTeacherId?: string;
    plannedAssistantId?: string | null;
    plannedDatetime?: string;
    durationMinutes?: number;
    participationType?: string;
    sectionType?: string;
    slotTypeId?: string | null;
  }
): Promise<{ isSuccess: boolean; data?: any; message?: string }> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập.");
  }

  const currentSession = await fetchRawSessionForUpdate(sessionId, token);

  const currentPlannedDatetime = pickFirstString(
    currentSession?.plannedDatetime,
    currentSession?.plannedDateTime,
    currentSession?.plannedAt,
    currentSession?.scheduledAt,
    currentSession?.startTime,
    currentSession?.dateTime,
  );

  const currentDurationMinutes = pickPositiveNumber(
    currentSession?.durationMinutes,
    currentSession?.durationInMinutes,
    currentSession?.duration,
  );

  const mergedPayload = {
    plannedDatetime: payload.plannedDatetime ?? currentPlannedDatetime,
    durationMinutes:
      typeof payload.durationMinutes === "number"
        ? payload.durationMinutes
        : currentDurationMinutes ?? 60,
    plannedRoomId:
      payload.plannedRoomId !== undefined
        ? payload.plannedRoomId
        : (currentSession?.plannedRoomId ?? null),
    plannedTeacherId:
      payload.plannedTeacherId !== undefined
        ? payload.plannedTeacherId
        : (currentSession?.plannedTeacherId ?? null),
    plannedAssistantId:
      payload.plannedAssistantId !== undefined
        ? payload.plannedAssistantId
        : (currentSession?.plannedAssistantId ?? null),
    participationType:
      payload.participationType
      ?? currentSession?.participationType
      ?? "Main",
    sectionType:
      payload.sectionType
      ?? currentSession?.sectionType
      ?? "Normal",
    slotTypeId:
      payload.slotTypeId !== undefined
        ? payload.slotTypeId
        : (currentSession?.slotTypeId ?? null),
  };

  if (!mergedPayload.plannedDatetime) {
    throw new Error("Không thể cập nhật buổi học vì không tìm thấy thời gian trong hệ thống. Vui lòng thử lại hoặc liên hệ quản trị viên.");
  }

  if (!mergedPayload.durationMinutes || mergedPayload.durationMinutes <= 0) {
    throw new Error("Không thể cập nhật buổi học vì thời lượng không hợp lệ.");
  }

  const res = await fetch(`${ADMIN_ENDPOINTS.SESSIONS}/${sessionId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(mergedPayload),
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const msg = json?.message || json?.error || json?.title || "Không thể cập nhật session.";
    throw new Error(msg);
  }

  return { isSuccess: json?.isSuccess ?? true, data: json?.data ?? json, message: json?.message };
}

export async function updateAdminSessionsByClass(
  payload: UpdateSessionsByClassRequest
): Promise<{ isSuccess: boolean; data?: UpdateSessionsByClassResult; message?: string }> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập.");
  }

  const res = await fetch(ADMIN_ENDPOINTS.SESSIONS_BY_CLASS, {
    method: "PUT",
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
    const msg = json?.message || json?.error || json?.title || "Không thể cập nhật hàng loạt session.";
    throw new Error(msg);
  }

  return { isSuccess: json?.isSuccess ?? true, data: json?.data ?? json, message: json?.message };
}

export async function changeSessionRoom(
  payload: SessionChangeRoomRequest
): Promise<{ isSuccess: boolean; data?: SessionChangeResult; message?: string }> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập.");
  }

  const res = await fetch(ADMIN_ENDPOINTS.SESSIONS_CHANGE_ROOM, {
    method: "PATCH",
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
    throw new Error(extractApiErrorMessage(json, text, "Không thể đổi phòng học.", res.status));
  }

  return { isSuccess: json?.isSuccess ?? true, data: json?.data ?? json, message: json?.message };
}

export async function changeSessionTeacher(
  payload: SessionChangeTeacherRequest
): Promise<{ isSuccess: boolean; data?: SessionChangeResult; message?: string }> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập.");
  }

  const normalizedPayload: SessionChangeTeacherRequest & { role: ChangeTeacherRole } = {
    ...payload,
    role: payload.role,
  };

  const res = await fetch(ADMIN_ENDPOINTS.SESSIONS_CHANGE_TEACHER, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(normalizedPayload),
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    throw new Error(extractApiErrorMessage(json, text, "Không thể đổi giáo viên.", res.status));
  }

  return { isSuccess: json?.isSuccess ?? true, data: json?.data ?? json, message: json?.message };
}

export async function changeSessionSectionType(
  payload: SessionChangeSectionTypeRequest
): Promise<{ isSuccess: boolean; data?: any; message?: string }> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập.");
  }

  const res = await fetch(ADMIN_ENDPOINTS.SESSIONS_CHANGE_SECTION_TYPE(payload.sessionId), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sectionType: payload.sectionType }),
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    throw new Error(extractApiErrorMessage(json, text, "Không thể đổi loại buổi học.", res.status));
  }

  return { isSuccess: json?.isSuccess ?? true, data: json?.data ?? json, message: json?.message };
}
