/**
 * Admin Sessions API Helpers
 * Create & fetch teaching sessions from admin portal
 */

import { getAccessToken } from "@/lib/store/authToken";
import { ADMIN_ENDPOINTS } from "@/constants/apiURL";
import type { CreateSessionRequest, Session } from "@/types/admin/sessions";

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
  };

  if (!session.id) {
    session.id = `S-${Date.now()}`;
  }

  return session;
}

function mapApiSession(item: any): Session {
  const session: Session = {
    id: String(item?.id ?? item?.sessionId ?? ""),
    classTitle: item?.classTitle ?? item?.className ?? null,
    className: item?.className ?? null,
    plannedDatetime: String(item?.plannedDatetime ?? item?.startTime ?? ""),
    durationMinutes:
      typeof item?.durationMinutes === "number" && item.durationMinutes > 0
        ? item.durationMinutes
        : 60,
    plannedRoomName: item?.plannedRoomName ?? null,
    roomName: item?.roomName ?? null,
    plannedTeacherName: item?.plannedTeacherName ?? null,
    teacherName: item?.teacherName ?? null,
    participationType: item?.participationType ?? null,
  };

  if (!session.id) {
    session.id = `S-${Date.now()}`;
  }

  return session;
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

