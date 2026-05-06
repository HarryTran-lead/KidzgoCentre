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
  UpdateSessionsByClassRequest,
  UpdateSessionsByClassResult,
} from "@/types/admin/sessions";

function extractApiErrorMessage(json: any, text: string, fallback: string): string {
  if (Array.isArray(json?.errors) && json.errors.length > 0) {
    const messages = json.errors
      .map((entry: any) => entry?.description || entry?.message || entry?.code)
      .filter(Boolean);

    if (messages.length > 0) {
      return messages.join("\n");
    }
  }

  return (
    json?.detail ||
    json?.message ||
    json?.error ||
    json?.title ||
    (typeof text === "string" && text.trim() ? text : null) ||
    fallback
  );
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

  const data = json?.data ?? json;
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
    plannedRoomName: data?.plannedRoomName ?? null,
    roomName: data?.roomName ?? null,
    plannedTeacherName: data?.plannedTeacherName ?? null,
    teacherName: data?.teacherName ?? null,
    participationType: data?.participationType ?? null,
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
    status: item?.status ?? null,
    color: item?.color ?? item?.Color ?? null,
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
    const msg = json?.message || json?.error || json?.title || "Không thể tải session hiện tại.";
    throw new Error(msg);
  }

  return json?.data ?? json;
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
    plannedAssistantId?: string;
    plannedDatetime?: string;
    durationMinutes?: number;
    participationType?: string;
  }
): Promise<{ isSuccess: boolean; data?: any; message?: string }> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập.");
  }

  const currentSession = await fetchRawSessionForUpdate(sessionId, token);

  const mergedPayload = {
    plannedDatetime: payload.plannedDatetime ?? currentSession?.plannedDatetime,
    durationMinutes:
      typeof payload.durationMinutes === "number"
        ? payload.durationMinutes
        : currentSession?.durationMinutes,
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
  };

  if (!mergedPayload.plannedDatetime) {
    throw new Error("Không thể cập nhật session vì thiếu plannedDatetime.");
  }

  if (!mergedPayload.durationMinutes || mergedPayload.durationMinutes <= 0) {
    throw new Error("Không thể cập nhật session vì thiếu durationMinutes hợp lệ.");
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
    throw new Error(extractApiErrorMessage(json, text, "Không thể đổi phòng học."));
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
    throw new Error(extractApiErrorMessage(json, text, "Không thể đổi giáo viên."));
  }

  return { isSuccess: json?.isSuccess ?? true, data: json?.data ?? json, message: json?.message };
}

