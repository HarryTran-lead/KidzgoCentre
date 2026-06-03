import { STUDENT_BRANCH_ENDPOINTS } from "@/constants/apiURL";
import { get, put, post } from "@/lib/axios";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StudentBranchInfo {
  branchId: string;
  branchName: string;
  branchCode?: string | null;
  address?: string | null;
  contactPhone?: string | null;
  assignedAt?: string | null;
}

export interface BranchTransferRequest {
  targetBranchId: string;
  effectiveDate: string;
  reason?: string | null;
  notes?: string | null;
  transferType?: "Permanent" | "Temporary";
}

export interface BranchTransferRecord {
  id: string;
  studentId: string;
  fromBranchId: string;
  fromBranchName: string;
  toBranchId: string;
  toBranchName: string;
  effectiveDate: string;
  transferType: string;
  reason?: string | null;
  notes?: string | null;
  status: "Pending" | "Approved" | "Completed" | "Cancelled";
  requestedAt: string;
  processedAt?: string | null;
  processedBy?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeBranchInfo(data: any): StudentBranchInfo | null {
  if (!data?.branchId && !data?.id) return null;
  return {
    branchId: String(data?.branchId ?? data?.id ?? ""),
    branchName: String(data?.branchName ?? data?.name ?? ""),
    branchCode: data?.branchCode ?? data?.code ?? null,
    address: data?.address ?? null,
    contactPhone: data?.contactPhone ?? null,
    assignedAt: data?.assignedAt ?? null,
  };
}

function normalizeTransferRecord(item: any): BranchTransferRecord {
  return {
    id: String(item?.id ?? ""),
    studentId: String(item?.studentId ?? ""),
    fromBranchId: String(item?.fromBranchId ?? ""),
    fromBranchName: String(item?.fromBranchName ?? ""),
    toBranchId: String(item?.toBranchId ?? ""),
    toBranchName: String(item?.toBranchName ?? ""),
    effectiveDate: String(item?.effectiveDate ?? ""),
    transferType: String(item?.transferType ?? "Permanent"),
    reason: item?.reason ?? null,
    notes: item?.notes ?? null,
    status: (item?.status ?? "Pending") as BranchTransferRecord["status"],
    requestedAt: String(item?.requestedAt ?? item?.createdAt ?? ""),
    processedAt: item?.processedAt ?? null,
    processedBy: item?.processedBy ?? null,
  };
}

// ─── Service Functions ────────────────────────────────────────────────────────

export async function getStudentHomeBranch(
  studentId: string,
): Promise<StudentBranchInfo | null> {
  try {
    const response = await get<any>(STUDENT_BRANCH_ENDPOINTS.HOME_BRANCH(studentId));
    const d = response?.data ?? response;
    return normalizeBranchInfo(d);
  } catch {
    return null;
  }
}

export async function setStudentHomeBranch(
  studentId: string,
  branchId: string,
): Promise<StudentBranchInfo | null> {
  const response = await put<any>(STUDENT_BRANCH_ENDPOINTS.HOME_BRANCH(studentId), { branchId });
  const d = response?.data ?? response;
  return normalizeBranchInfo(d);
}

export async function getStudentActiveBranch(
  studentId: string,
): Promise<StudentBranchInfo | null> {
  try {
    const response = await get<any>(STUDENT_BRANCH_ENDPOINTS.ACTIVE_BRANCH(studentId));
    const d = response?.data ?? response;
    return normalizeBranchInfo(d);
  } catch {
    return null;
  }
}

export async function createBranchTransfer(
  studentId: string,
  payload: BranchTransferRequest,
): Promise<BranchTransferRecord> {
  const response = await post<any>(STUDENT_BRANCH_ENDPOINTS.BRANCH_TRANSFER(studentId), payload);
  const d = response?.data ?? response;
  return normalizeTransferRecord(d);
}

export async function getBranchTransferHistory(
  studentId: string,
): Promise<BranchTransferRecord[]> {
  const response = await get<any>(STUDENT_BRANCH_ENDPOINTS.BRANCH_TRANSFER_HISTORY(studentId));
  const payload = response?.data ?? response;
  const items = Array.isArray(payload?.items) ? payload.items
    : Array.isArray(payload) ? payload
    : [];
  return items.map(normalizeTransferRecord);
}
