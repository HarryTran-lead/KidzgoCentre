/**
 * Admin Class Form Data API Helpers
 * Fetch dropdown options for class creation form
 */

import { getAccessToken } from "@/lib/store/authToken";
import { ADMIN_ENDPOINTS } from "@/constants/apiURL";
import { getAllBranches } from "@/lib/api/branchService";
import type { ClassFormSelectData, SelectOption } from "@/types/admin/classFormData";

async function fetchTeachersByBranch(branchId: string): Promise<SelectOption[]> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
  }

  const authHeaders = { Authorization: `Bearer ${token}` };
  const url = `/api/admin/users?pageNumber=1&pageSize=200&role=Teacher&branchId=${encodeURIComponent(
    branchId
  )}`;

  const res = await fetch(url, { headers: authHeaders });
  const json = res.ok ? await res.json() : null;

  const items: any[] =
    (json?.data?.items as any[]) ??
    (json?.data?.users as any[]) ??
    (json?.data as any[]) ??
    (Array.isArray(json) ? json : []);

  return items
    .map((t: any) => ({
      id: String(t?.id ?? ""),
      name: String(t?.name ?? t?.fullName ?? t?.username ?? "Giáo viên"),
    }))
    .filter((t: SelectOption) => t.id);
}

export async function fetchTeacherOptionsByBranch(
  branchId: string
): Promise<SelectOption[]> {
  return fetchTeachersByBranch(branchId);
}

async function fetchProgramsByBranch(branchId: string): Promise<SelectOption[]> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
  }

  const authHeaders = { Authorization: `Bearer ${token}` };
  const url = `${ADMIN_ENDPOINTS.PROGRAMS}?pageNumber=1&pageSize=200&branchId=${encodeURIComponent(
    branchId
  )}`;

  const res = await fetch(url, { headers: authHeaders });
  const json = res.ok ? await res.json() : null;

  const items: any[] =
    (json?.data?.programs?.items as any[]) ??
    (json?.data?.items as any[]) ??
    (json?.data as any[]) ??
    (Array.isArray(json) ? json : []);

  return items
    .map((p: any) => ({
      id: String(p?.id ?? p?.code ?? ""),
      name: String(p?.name ?? p?.title ?? "Chương trình"),
    }))
    .filter((p: SelectOption) => p.id);
}

export async function fetchProgramOptionsByBranch(
  branchId: string
): Promise<SelectOption[]> {
  return fetchProgramsByBranch(branchId);
}

/**
 * Fetch all dropdown options for class creation form
 */
export async function fetchClassFormSelectData(): Promise<ClassFormSelectData> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
  }

  const authHeaders = { Authorization: `Bearer ${token}` };

  try {
    // 并行获取所有数据
    const [programsRes, branchesRes, roomsRes] = await Promise.all([
      fetch(`${ADMIN_ENDPOINTS.PROGRAMS}?pageNumber=1&pageSize=200`, { headers: authHeaders }),
      getAllBranches({ page: 1, limit: 100 }),
      fetch(`${ADMIN_ENDPOINTS.CLASSROOMS}?pageNumber=1&pageSize=200`, { headers: authHeaders }),
    ]);

    const [programsJson, branchesData, roomsJson] = await Promise.all([
      programsRes.ok ? programsRes.json() : Promise.resolve(null),
      branchesRes,
      roomsRes.ok ? roomsRes.json() : Promise.resolve(null),
    ]);

    // 处理 programs
    const programsItems: any[] =
      (programsJson?.data?.programs?.items as any[]) ??
      (programsJson?.data?.items as any[]) ??
      (programsJson?.data as any[]) ??
      (Array.isArray(programsJson) ? programsJson : []);

    const programs: SelectOption[] = programsItems
      .map((p) => ({
        id: String(p?.id ?? p?.code ?? ""),
        name: String(p?.name ?? p?.title ?? "Chương trình"),
      }))
      .filter((p) => p.id);

    // 处理 branches - 修复获取逻辑
    const branchesItems: any[] = branchesData?.data?.branches ?? branchesData?.data ?? [];
    const branches: SelectOption[] = branchesItems
      .map((b: any) => ({
        id: String(b?.id ?? ""),
        name: String(b?.name ?? b?.code ?? "Chi nhánh"),
      }))
      .filter((b) => b.id);

    // Teachers sẽ được load theo chi nhánh sau khi chọn branchId
    const teachers: SelectOption[] = [];

    // 处理 classrooms
    const roomsItems: any[] =
      (roomsJson?.data?.classrooms?.items as any[]) ??
      (roomsJson?.data?.items as any[]) ??
      (roomsJson?.data as any[]) ??
      (Array.isArray(roomsJson) ? roomsJson : []);

    const classrooms: SelectOption[] = roomsItems
      .map((r) => ({
        id: String(r?.id ?? r?.roomId ?? ""),
        name: String(r?.name ?? r?.roomName ?? "Phòng"),
      }))
      .filter((r) => r.id);

    return {
      programs,
      branches,
      teachers,
      classrooms,
    };
  } catch (error) {
    console.error("Failed to fetch class form select data:", error);
    throw error;
  }
}
