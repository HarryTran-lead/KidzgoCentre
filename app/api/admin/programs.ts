/**
 * Admin Programs API Helpers
 * Fetch program list for admin portal
 */

import { getAccessToken } from "@/lib/store/authToken";
import { ADMIN_ENDPOINTS } from "@/constants/apiURL";
import { mapApiErrorToMessage } from "@/lib/api/errorMapper";
import type {
  CourseRow,
  CreateProgramRequest,
  Program,
  ProgramDetail,
  AssignBranchResponse,
  UpdateProgramMonthlyLeaveLimitResponse,
} from "@/types/admin/programs";

// Normalize isActive/status values from API which may be boolean/number/string (e.g. true, 1, "true", "ACTIVE")
export function normalizeIsActive(value: any): boolean | null {
  if (value === true) return true;
  if (value === false) return false;
  if (value === null || value === undefined) return null;

  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
    return null;
  }

  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (!v) return null;

    // Truthy
    if (
      v === "true" ||
      v === "1" ||
      v === "active" ||
      v === "activated" ||
      v === "enabled" ||
      v === "on" ||
      v === "yes" ||
      v === "y" ||
      v === "đang hoạt động" ||
      v === "dang hoat dong"
    ) {
      return true;
    }

    // Falsy
    if (
      v === "false" ||
      v === "0" ||
      v === "inactive" ||
      v === "disabled" ||
      v === "off" ||
      v === "no" ||
      v === "n" ||
      v === "tạm dừng" ||
      v === "tam dung"
    ) {
      return false;
    }

    return null;
  }

  return null;
}

function normalizeBooleanFlag(value: any): boolean | null {
  if (value === true) return true;
  if (value === false) return false;
  if (value === null || value === undefined) return null;

  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
    return null;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return null;

    if (["true", "1", "yes", "y", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "n", "off"].includes(normalized)) return false;
  }

  return null;
}

function extractApiErrorMessage(json: any, text: string, fallback: string): string {
  const firstError = Array.isArray(json?.errors) ? json.errors[0] : null;
  const code =
    firstError?.code ??
    json?.title ??
    json?.code ??
    json?.errorCode ??
    json?.error?.code ??
    json?.data?.code;

  const message =
    firstError?.message ??
    json?.message ??
    json?.error ??
    json?.detail ??
    json?.title ??
    (typeof text === "string" && text.trim() ? text.trim() : null);

  if (code === "Program.NotFound") {
    return message || "Không tìm thấy chương trình học cần cấu hình.";
  }

  if (code === "Program.AlreadyAssignedToBranch") {
    return "Chương trình này đã được gán cho chi nhánh đã chọn.";
  }

  if (code === "Program.BranchNotFound") {
    return "Không tìm thấy chi nhánh hoặc chi nhánh đang ngưng hoạt động.";
  }

  if (code === "ProgramLeavePolicy.InvalidMaxLeavesPerMonth") {
    return message || "Số buổi nghỉ tối đa trong tháng phải lớn hơn 0.";
  }

  return message || fallback;
}

export function extractProgramMonthlyLeaveLimit(program: any): number | null {
  const rawValue =
    program?.maxLeavesPerMonth ??
    program?.monthlyLeaveLimit ??
    program?.leavePolicy?.maxLeavesPerMonth ??
    program?.programLeavePolicy?.maxLeavesPerMonth ??
    program?.data?.maxLeavesPerMonth ??
    program?.data?.monthlyLeaveLimit ??
    program?.data?.leavePolicy?.maxLeavesPerMonth ??
    program?.data?.programLeavePolicy?.maxLeavesPerMonth;

  if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
    return rawValue;
  }

  if (typeof rawValue === "string") {
    const parsed = Number(rawValue);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

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
  const active = normalizeIsActive(item?.isActive ?? item?.status ?? item?.active);
  if (active === true) status = "Đang hoạt động";

  const assignedBranchCount =
    typeof item?.assignedBranchCount === "number" ? item.assignedBranchCount : 0;

  return {
    id,
    name,
    desc,
    duration,
    fee,
    classes,
    students,
    status,
    assignedBranchCount,
    isMakeup: normalizeBooleanFlag(item?.isMakeup),
    isSupplementary: normalizeBooleanFlag(item?.isSupplementary),
  };
}

export async function fetchAdminPrograms(options?: { branchId?: string }): Promise<CourseRow[]> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập để xem danh sách chương trình học.");
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
    throw new Error("Không thể tải danh sách chương trình học từ máy chủ.");
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
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại để tạo chương trình học.");
  }

  console.log("Creating program with payload:", payload);
  console.log("API URL:", ADMIN_ENDPOINTS.PROGRAMS);

  const res = await fetch(ADMIN_ENDPOINTS.PROGRAMS, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  
  console.log("Response status:", res.status);
  console.log("Response headers:", Object.fromEntries(res.headers.entries()));

  const text = await res.text();
  console.log("Response text:", text);
  
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
    console.log("Parsed JSON:", json);
  } catch {
    json = null;
  }

  if (!res.ok) {
    const msg =
      json?.message ||
      json?.error ||
      json?.detail ||
      (typeof text === "string" && text.trim() ? text : null) ||
      "Không thể tạo chương trình học từ máy chủ.";
    throw new Error(msg);
  }

  // Xử lý response dựa trên cấu trúc thực tế
  const data = json?.data ?? json?.program ?? json;
  
  const program: Program = {
    id: String(data?.id ?? data?.code ?? ""),
    code: data?.code ?? payload.code ?? null,
    name: String(data?.name ?? payload.name),
    isMakeup: normalizeBooleanFlag(data?.isMakeup) ?? payload.isMakeup ?? null,
    isSupplementary:
      normalizeBooleanFlag(data?.isSupplementary) ?? payload.isSupplementary ?? null,
    totalSessions:
      typeof data?.totalSessions === "number" && data.totalSessions > 0
        ? data.totalSessions
        : null,
    defaultTuitionAmount:
      typeof data?.defaultTuitionAmount === "number" && data.defaultTuitionAmount > 0
        ? data.defaultTuitionAmount
        : null,
    unitPriceSession:
      typeof data?.unitPriceSession === "number" && data.unitPriceSession > 0
        ? data.unitPriceSession
        : null,
    description: data?.description ?? null,
    branchId: data?.branchId ?? null,
    isActive: normalizeIsActive(data?.isActive ?? data?.status) ?? true,
    defaultMakeupClassId:
      (typeof data?.defaultMakeupClassId === "string" && data.defaultMakeupClassId.trim()) ||
      null,
  };

  if (!program.id) {
    program.id = `PROG-${Date.now()}`;
  }

  return program;
}

export async function fetchAdminProgramDetail(programId: string): Promise<ProgramDetail> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại để xem chi tiết chương trình học.");
  }

  const res = await fetch(`${ADMIN_ENDPOINTS.PROGRAMS}/${programId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    let errorMessage = "Không thể tải chi tiết chương trình học từ máy chủ.";
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
  const rawDetail =
    (json?.isSuccess && json?.data) ? json.data :
    json?.data ? json.data :
    json?.program ? json.program :
    json;

  const safeDetail = rawDetail && typeof rawDetail === "object" ? rawDetail : {};

  return {
    ...safeDetail,
    isMakeup: normalizeBooleanFlag(safeDetail?.isMakeup),
    isSupplementary: normalizeBooleanFlag(safeDetail?.isSupplementary),
    defaultMakeupClassId:
      (typeof safeDetail?.defaultMakeupClassId === "string" && safeDetail.defaultMakeupClassId.trim()) ||
      null,
  };
}

export async function updateAdminProgram(
  programId: string,
  payload: CreateProgramRequest
): Promise<Program> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại để cập nhật chương trình học.");
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
      "Không thể cập nhật chương trình học từ máy chủ.";
    throw new Error(msg);
  }

  const data = json?.data ?? json?.program ?? json;
  const program: Program = {
    id: String(data?.id ?? programId),
    code: data?.code ?? null,
    name: String(data?.name ?? payload.name),
    isMakeup: normalizeBooleanFlag(data?.isMakeup) ?? payload.isMakeup ?? null,
    isSupplementary:
      normalizeBooleanFlag(data?.isSupplementary) ?? payload.isSupplementary ?? null,
    totalSessions:
      typeof data?.totalSessions === "number" && data.totalSessions > 0
        ? data.totalSessions
        : null,
    defaultTuitionAmount:
      typeof data?.defaultTuitionAmount === "number" && data.defaultTuitionAmount > 0
        ? data.defaultTuitionAmount
        : null,
    unitPriceSession:
      typeof data?.unitPriceSession === "number" && data.unitPriceSession > 0
        ? data.unitPriceSession
        : null,
    description: data?.description ?? null,
    branchId: data?.branchId ?? null,
    isActive: normalizeIsActive(data?.isActive ?? data?.status),
    defaultMakeupClassId:
      (typeof data?.defaultMakeupClassId === "string" && data.defaultMakeupClassId.trim()) ||
      null,
  };

  if (!program.id) {
    program.id = `PROG-${Date.now()}`;
  }

  return program;
}

export async function toggleProgramStatus(programId: string): Promise<{ isSuccess: boolean; data: { id: string; isActive: boolean } }> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại để thay đổi trạng thái chương trình học.");
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
    const msg = mapApiErrorToMessage(
      json,
      res.status,
      "Không thể thay đổi trạng thái chương trình học từ máy chủ.",
      text
    );
    throw new Error(msg);
  }

  return json?.data ?? json;
}

export async function updateAdminProgramMonthlyLeaveLimit(
  programId: string,
  maxLeavesPerMonth: number
): Promise<UpdateProgramMonthlyLeaveLimitResponse> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại để cấu hình giới hạn nghỉ.");
  }

  const res = await fetch(ADMIN_ENDPOINTS.PROGRAMS_MONTHLY_LEAVE_LIMIT(programId), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      maxLeavesPerMonth,
    }),
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    throw new Error(
      extractApiErrorMessage(
        json,
        text,
        "Không thể cập nhật số buổi nghỉ tối đa theo tháng."
      )
    );
  }

  const data = json?.data ?? json;
  const resolvedLimit = extractProgramMonthlyLeaveLimit(data);

  return {
    programId: String(data?.programId ?? data?.id ?? programId),
    maxLeavesPerMonth: resolvedLimit ?? maxLeavesPerMonth,
    raw: data,
  };
}

export async function assignBranchToProgram(
  programId: string,
  branchId: string
): Promise<AssignBranchResponse> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại để gán chi nhánh.");
  }

  const res = await fetch(ADMIN_ENDPOINTS.PROGRAMS_ASSIGN_BRANCH(programId, branchId), {
    method: "POST",
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
    const msg = extractApiErrorMessage(
      json,
      text,
      "Không thể gán chi nhánh vào chương trình."
    );
    throw new Error(msg);
  }

  const data = json?.data ?? json;
  return {
    id: String(data?.id ?? ""),
    programId: String(data?.programId ?? programId),
    programName: data?.programName ?? null,
    branchId: String(data?.branchId ?? branchId),
    branchName: data?.branchName ?? null,
    isActive: normalizeIsActive(data?.isActive) ?? true,
    defaultMakeupClassId:
      (typeof data?.defaultMakeupClassId === "string" && data.defaultMakeupClassId.trim()) ||
      null,
  };
}
