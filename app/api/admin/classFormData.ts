/**
 * Admin Class Form Data API Helpers
 * Fetch dropdown options for class creation form
 */

import { getAccessToken } from "@/lib/store/authToken";
import { ADMIN_ENDPOINTS, BRANCH_ENDPOINTS } from "@/constants/apiURL";
import { getAllBranches } from "@/lib/api/branchService";
import type { ClassFormSelectData, SelectOption } from "@/types/admin/classFormData";

export interface BranchSyllabusOption {
  value: string;
  label: string;
  programId: string;
  levelId: string;
  curriculumAssignmentId: string;
  syllabusId: string;
  code: string;
  version: string;
  title: string;
}

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
      totalSessions: typeof p?.totalSessions === "number" ? p.totalSessions : parseInt(p?.totalSessions ?? "0", 10) || 0,
      status: p?.status ?? p?.isActive === true ? "Đang hoạt động" : "Tạm dừng",
    }))
    .filter((p: SelectOption) => p.id);
}

export async function fetchProgramOptionsByBranch(
  branchId: string
): Promise<SelectOption[]> {
  return fetchProgramsByBranch(branchId);
}

function normalizeBranchSyllabusOption(item: any): BranchSyllabusOption | null {
  const syllabusSource = item?.syllabus ?? item?.Syllabus ?? item;
  const syllabusId = String(
    syllabusSource?.id ??
      syllabusSource?.Id ??
      syllabusSource?.syllabusId ??
      syllabusSource?.SyllabusId ??
      item?.syllabusId ??
      item?.SyllabusId ??
      "",
  ).trim();
  if (!syllabusId) {
    return null;
  }

  const code = String(
    syllabusSource?.code ?? syllabusSource?.Code ?? item?.code ?? item?.Code ?? "",
  ).trim();
  const version = String(
    syllabusSource?.version ?? syllabusSource?.Version ?? item?.version ?? item?.Version ?? "",
  ).trim();
  const title = String(
    syllabusSource?.title ?? syllabusSource?.Title ?? item?.title ?? item?.Title ?? "",
  ).trim();
  const programId = String(
    syllabusSource?.programId ??
      syllabusSource?.ProgramId ??
      item?.programId ??
      item?.ProgramId ??
      "",
  ).trim();
  const levelId = String(
    syllabusSource?.levelId ??
      syllabusSource?.LevelId ??
      item?.levelId ??
      item?.LevelId ??
      "",
  ).trim();

  return {
    value: syllabusId,
    label: [code, version, title].filter(Boolean).join(" - ") || syllabusId,
    programId,
    levelId,
    curriculumAssignmentId: String(
      item?.curriculumAssignmentId ??
        item?.CurriculumAssignmentId ??
        ((item?.syllabus ?? item?.Syllabus) ? item?.id ?? item?.Id ?? "" : ""),
    ).trim(),
    syllabusId,
    code,
    version,
    title,
  };
}

export async function fetchSyllabusOptionsByBranch(
  branchId: string,
): Promise<BranchSyllabusOption[]> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
  }

  const res = await fetch(BRANCH_ENDPOINTS.SYLLABUSES(branchId), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = res.ok ? await res.json() : null;
  const items: any[] =
    (json?.data?.syllabuses as any[]) ??
    (json?.data?.items as any[]) ??
    (json?.data as any[]) ??
    (Array.isArray(json) ? json : []);

  return items
    .map(normalizeBranchSyllabusOption)
    .filter((item): item is BranchSyllabusOption => Boolean(item));
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

    const programsItems: any[] =
      (programsJson?.data?.programs?.items as any[]) ??
      (programsJson?.data?.items as any[]) ??
      (programsJson?.data as any[]) ??
      (Array.isArray(programsJson) ? programsJson : []);

    const programs: SelectOption[] = programsItems
      .map((p) => ({
        id: String(p?.id ?? p?.code ?? ""),
        name: String(p?.name ?? p?.title ?? "Chương trình"),
        totalSessions: typeof p?.totalSessions === "number" ? p.totalSessions : parseInt(p?.totalSessions ?? "0", 10) || 0,
        status: p?.status ?? p?.isActive === true ? "Đang hoạt động" : "Tạm dừng",
      }))
      .filter((p) => p.id);

    const branchesItems: any[] = branchesData?.data?.branches ?? branchesData?.data ?? [];
    const branches: SelectOption[] = branchesItems
      .map((b: any) => ({
        id: String(b?.id ?? ""),
        name: String(b?.name ?? b?.code ?? "Chi nhánh"),
      }))
      .filter((b) => b.id);

    // Teachers sẽ được load theo chi nhánh sau khi chọn branchId
    const teachers: SelectOption[] = [];

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
