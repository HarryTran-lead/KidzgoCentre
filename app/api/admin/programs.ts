/**
 * Admin Programs API Helpers
 * Fetch program list for admin portal
 */

import { getAccessToken } from "@/lib/store/authToken";
import { ADMIN_ENDPOINTS } from "@/constants/apiURL";
import type { CourseRow, CreateProgramRequest, Program } from "@/types/admin/programs";

function mapApiProgramToRow(item: any): CourseRow {
  const id = String(item?.id ?? item?.code ?? "");
  const name = item?.name ?? "Chương trình";
  const desc = item?.description ?? "";

  const rawLevel = String(item?.level ?? "").toUpperCase();
  const level = rawLevel || "N/A";

  const totalSessions = item?.totalSessions ?? 0;
  const duration =
    typeof totalSessions === "number" && totalSessions > 0
      ? `${totalSessions} buổi`
      : "Đang cập nhật";

  const feeNumber =
    item?.defaultTuitionAmount ??
    item?.unitPriceSession ??
    0;
  const fee =
    typeof feeNumber === "number" && feeNumber > 0
      ? `${feeNumber.toLocaleString("vi-VN")} VND`
      : "Đang cập nhật";

  const classes = "0 lớp";
  const students = "0 học viên";

  let status: CourseRow["status"] = "Tạm dừng";
  if (item?.isActive === true) status = "Đang hoạt động";

  const branch = item?.branchName ?? item?.branch?.name ?? item?.branch ?? "";

  return {
    id,
    name,
    desc,
    level,
    duration,
    fee,
    classes,
    students,
    status,
    branch,
  };
}

export async function fetchAdminPrograms(options?: { branchId?: string }): Promise<CourseRow[]> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập để xem danh sách khóa học.");
  }

  const params = new URLSearchParams({
    pageNumber: "1",
    pageSize: "100",
  });

  // Thêm branchId vào query params nếu có
  if (options?.branchId) {
    params.append("branchId", options.branchId);
  }

  const res = await fetch(`${ADMIN_ENDPOINTS.PROGRAMS}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Fetch admin programs error:", res.status, text);
    throw new Error("Không thể tải danh sách khóa học từ máy chủ.");
  }

  const json: any = await res.json();

  let items: any[] = [];
  if (Array.isArray(json?.data?.programs?.items)) {
    items = json.data.programs.items;
  } else if (Array.isArray(json?.data?.items)) {
    items = json.data.items;
  } else if (Array.isArray(json?.data)) {
    items = json.data;
  } else if (Array.isArray(json)) {
    items = json;
  }

  return items.map(mapApiProgramToRow).filter((c: CourseRow) => c.id);
}

export async function createAdminProgram(
  payload: CreateProgramRequest
): Promise<Program> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại để tạo khóa học.");
  }

  const res = await fetch(ADMIN_ENDPOINTS.PROGRAMS, {
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
      "Không thể tạo khóa học từ máy chủ.";
    throw new Error(msg);
  }

  const data = json?.data ?? json?.program ?? json;
  const program: Program = {
    id: String(data?.id ?? data?.code ?? ""),
    code: data?.code ?? null,
    name: String(data?.name ?? payload.name),
    level: String(data?.level ?? payload.level),
    totalSessions:
      typeof data?.totalSessions === "number" && data.totalSessions > 0
        ? data.totalSessions
        : payload.totalSessions,
    defaultTuitionAmount:
      typeof data?.defaultTuitionAmount === "number" && data.defaultTuitionAmount > 0
        ? data.defaultTuitionAmount
        : payload.defaultTuitionAmount,
    unitPriceSession:
      typeof data?.unitPriceSession === "number" && data.unitPriceSession > 0
        ? data.unitPriceSession
        : payload.unitPriceSession,
    description: data?.description ?? payload.description ?? null,
    branchId: data?.branchId ?? payload.branchId ?? null,
    isActive: data?.isActive ?? true,
  };

  if (!program.id) {
    program.id = `PROG-${Date.now()}`;
  }

  return program;
}

export async function fetchAdminProgramDetail(programId: string): Promise<any> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại để xem chi tiết khóa học.");
  }

  const res = await fetch(`${ADMIN_ENDPOINTS.PROGRAMS}/${programId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    let errorMessage = "Không thể tải chi tiết khóa học từ máy chủ.";
    try {
      const errorJson = JSON.parse(text);
      errorMessage = errorJson?.detail || errorJson?.message || errorMessage;
    } catch {
      // ignore parse error
    }
    console.error("Fetch admin program detail error:", res.status, text);
    throw new Error(errorMessage);
  }

  const json: any = await res.json();
  console.log("[fetchAdminProgramDetail] Response structure:", {
    hasIsSuccess: !!json?.isSuccess,
    hasData: !!json?.data,
    hasProgram: !!json?.program,
    keys: Object.keys(json || {}),
  });
  
  // Handle different response structures
  if (json?.isSuccess && json?.data) {
    return json.data;
  }
  if (json?.data) {
    return json.data;
  }
  if (json?.program) {
    return json.program;
  }
  // If response is the program object directly
  return json;
}

export async function updateAdminProgram(
  programId: string,
  payload: CreateProgramRequest
): Promise<Program> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại để cập nhật khóa học.");
  }

  const res = await fetch(`${ADMIN_ENDPOINTS.PROGRAMS}/${programId}`, {
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
    const msg =
      json?.message ||
      json?.error ||
      (typeof text === "string" && text.trim() ? text : null) ||
      "Không thể cập nhật khóa học từ máy chủ.";
    throw new Error(msg);
  }

  const data = json?.data ?? json?.program ?? json;
  const program: Program = {
    id: String(data?.id ?? programId),
    code: data?.code ?? null,
    name: String(data?.name ?? payload.name),
    level: String(data?.level ?? payload.level),
    totalSessions:
      typeof data?.totalSessions === "number" && data.totalSessions > 0
        ? data.totalSessions
        : payload.totalSessions,
    defaultTuitionAmount:
      typeof data?.defaultTuitionAmount === "number" && data.defaultTuitionAmount > 0
        ? data.defaultTuitionAmount
        : payload.defaultTuitionAmount,
    unitPriceSession:
      typeof data?.unitPriceSession === "number" && data.unitPriceSession > 0
        ? data.unitPriceSession
        : payload.unitPriceSession,
    description: data?.description ?? payload.description ?? null,
    branchId: data?.branchId ?? payload.branchId ?? null,
    isActive: data?.isActive ?? null,
  };

  if (!program.id) {
    program.id = `PROG-${Date.now()}`;
  }

  return program;
}

export async function toggleProgramStatus(programId: string): Promise<{ isSuccess: boolean; data: { id: string; isActive: boolean } }> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại để thay đổi trạng thái khóa học.");
  }

  const res = await fetch(`${ADMIN_ENDPOINTS.PROGRAMS}/${programId}/toggle-status`, {
    method: "PATCH",
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
      "Không thể thay đổi trạng thái khóa học từ máy chủ.";
    throw new Error(msg);
  }

  return json?.data ?? json;
}
