import { SYLLABUS_ENDPOINTS } from "@/constants/apiURL";
import { getAccessToken } from "@/lib/store/authToken";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SyllabusListItem {
  id: string;
  programId: string;
  programName?: string | null;
  levelId: string;
  levelName?: string | null;
  code: string;
  version: string;
  title: string;
  isActive: boolean;
  unitCount?: number | null;
  sessionTemplateCount?: number | null;
  createdAt?: string | null;
}

export interface SyllabusDetail extends SyllabusListItem {
  edition?: string | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  pacingSchemeJson?: string | null;
  overview?: string | null;
  overallObjectives?: string | null;
  specificObjectives?: string | null;
  ethicsAndAttitudes?: string | null;
  bookOverview?: string | null;
  totalPeriods?: number | null;
  minutesPerPeriod?: number | null;
  totalLessons?: number | null;
  sourceFileName?: string | null;
  attachmentUrl?: string | null;
  rawContentJson?: string | null;
  units?: unknown[];
  lessons?: unknown[];
  resources?: unknown[];
  sessionTemplates?: unknown[];
}

export interface CreateSyllabusRequest {
  programId: string;
  levelId: string;
  code: string;
  version: string;
  title: string;
  edition?: string | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  pacingSchemeJson?: string | null;
  overview?: string | null;
  overallObjectives?: string | null;
  specificObjectives?: string | null;
  ethicsAndAttitudes?: string | null;
  bookOverview?: string | null;
  totalPeriods?: number | null;
  minutesPerPeriod?: number | null;
  totalLessons?: number | null;
  sourceFileName?: string | null;
  attachmentUrl?: string | null;
  rawContentJson?: string | null;
  isActive?: boolean;
}

export interface UpdateSyllabusRequest {
  code?: string | null;
  version?: string | null;
  title?: string | null;
  edition?: string | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  pacingSchemeJson?: string | null;
  overview?: string | null;
  overallObjectives?: string | null;
  specificObjectives?: string | null;
  ethicsAndAttitudes?: string | null;
  bookOverview?: string | null;
  totalPeriods?: number | null;
  minutesPerPeriod?: number | null;
  totalLessons?: number | null;
  sourceFileName?: string | null;
  attachmentUrl?: string | null;
  rawContentJson?: string | null;
  isActive?: boolean;
}

export interface GetSyllabusesParams {
  programId?: string;
  levelId?: string;
  searchTerm?: string;
  isActive?: boolean;
  includeDeleted?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export interface ImportSyllabusWordParams {
  programId: string;
  levelId: string;
  code: string;
  version: string;
  overwriteExisting?: boolean;
}

export interface ImportSyllabusArchiveParams {
  programId: string;
  levelId: string;
  code: string;
  version: string;
  overwriteExisting?: boolean;
}

export interface ImportSyllabusWordResult {
  syllabusId: string;
  importedUnits: number;
  importedLessons: number;
  importedResources: number;
  importedSessionTemplates: number;
}

export interface ImportSyllabusArchiveResult {
  syllabusId: string;
  importedLessonPlans: number;
  skippedFiles: number;
  skippedEntries: string[];
}

export interface ServiceResponse<T> {
  isSuccess: boolean;
  data: T;
  message?: string;
  status?: number;
  title?: string;
  detail?: string;
  errors?: Array<{ code: string; description: string }>;
  raw?: unknown;
}

export interface SyllabusPagination {
  items: SyllabusListItem[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function num(v: unknown): number | null {
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function normalizeSyllabusListItem(item: any): SyllabusListItem {
  return {
    id: str(item?.id),
    programId: str(item?.programId),
    programName: str(item?.programName) || null,
    levelId: str(item?.levelId),
    levelName: str(item?.levelName) || null,
    code: str(item?.code),
    version: str(item?.version),
    title: str(item?.title),
    isActive: Boolean(item?.isActive),
    unitCount: num(item?.unitCount),
    sessionTemplateCount: num(item?.sessionTemplateCount),
    createdAt: str(item?.createdAt) || null,
  };
}

function normalizeSyllabusDetail(item: any): SyllabusDetail {
  return {
    ...normalizeSyllabusListItem(item),
    edition: str(item?.edition) || null,
    effectiveFrom: str(item?.effectiveFrom) || null,
    effectiveTo: str(item?.effectiveTo) || null,
    pacingSchemeJson: str(item?.pacingSchemeJson) || null,
    overview: str(item?.overview) || null,
    overallObjectives: str(item?.overallObjectives) || null,
    specificObjectives: str(item?.specificObjectives) || null,
    ethicsAndAttitudes: str(item?.ethicsAndAttitudes) || null,
    bookOverview: str(item?.bookOverview) || null,
    totalPeriods: num(item?.totalPeriods),
    minutesPerPeriod: num(item?.minutesPerPeriod),
    totalLessons: num(item?.totalLessons),
    sourceFileName: str(item?.sourceFileName) || null,
    attachmentUrl: str(item?.attachmentUrl) || null,
    rawContentJson: str(item?.rawContentJson) || null,
    units: Array.isArray(item?.units) ? item.units : [],
    lessons: Array.isArray(item?.lessons) ? item.lessons : [],
    resources: Array.isArray(item?.resources) ? item.resources : [],
    sessionTemplates: Array.isArray(item?.sessionTemplates) ? item.sessionTemplates : [],
  };
}

function errorResponse<T>(data: T, error: unknown): ServiceResponse<T> {
  const err = error as any;
  const payload = err?.response?.data ?? err?.data ?? {};
  return {
    isSuccess: false,
    data,
    message: str(payload?.detail) || str(payload?.error) || str(payload?.message) || str(payload?.title) || str(err?.message) || "Request failed",
    status: err?.response?.status ?? payload?.status,
    title: str(payload?.title) || undefined,
    detail: str(payload?.detail) || undefined,
    errors: Array.isArray(payload?.errors) ? payload.errors : undefined,
    raw: payload,
  };
}

// ─── Service Functions ────────────────────────────────────────────────────────

function emptyPagination(): SyllabusPagination {
  return { items: [], pageNumber: 1, pageSize: 0, totalCount: 0, totalPages: 0, hasPreviousPage: false, hasNextPage: false };
}

export async function getSyllabuses(
  params?: GetSyllabusesParams,
): Promise<ServiceResponse<SyllabusPagination>> {
  const query = new URLSearchParams();
  if (params?.programId) query.append("programId", params.programId);
  if (params?.levelId) query.append("levelId", params.levelId);
  if (params?.searchTerm) query.append("searchTerm", params.searchTerm);
  if (params?.isActive !== undefined) query.append("isActive", String(params.isActive));
  if (params?.includeDeleted !== undefined) query.append("includeDeleted", String(params.includeDeleted));
  if (params?.pageNumber) query.append("pageNumber", String(params.pageNumber));
  if (params?.pageSize) query.append("pageSize", String(params.pageSize));

  const url = `${SYLLABUS_ENDPOINTS.BASE}${query.toString() ? `?${query}` : ""}`;
  try {
    const res = await fetch(url);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return errorResponse(emptyPagination(), json);

    const raw = json?.data?.syllabuses ?? json?.data ?? json;
    const items: SyllabusListItem[] = Array.isArray(raw?.items)
      ? raw.items.map(normalizeSyllabusListItem).filter((x: SyllabusListItem) => x.id)
      : [];

    return {
      isSuccess: true,
      data: {
        items,
        pageNumber: Number(raw?.pageNumber ?? 1),
        pageSize: Number(raw?.pageSize ?? items.length),
        totalCount: Number(raw?.totalCount ?? items.length),
        totalPages: Number(raw?.totalPages ?? 1),
        hasPreviousPage: Boolean(raw?.hasPreviousPage),
        hasNextPage: Boolean(raw?.hasNextPage),
      },
    };
  } catch (error) {
    return errorResponse(emptyPagination(), error);
  }
}

export async function getSyllabusById(
  id: string,
): Promise<ServiceResponse<SyllabusDetail | null>> {
  try {
    const res = await fetch(SYLLABUS_ENDPOINTS.BY_ID(id));
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return errorResponse(null, json);

    const item = json?.data ?? json;
    return { isSuccess: true, data: item?.id ? normalizeSyllabusDetail(item) : null };
  } catch (error) {
    return errorResponse(null, error);
  }
}

export async function createSyllabus(
  data: CreateSyllabusRequest,
): Promise<ServiceResponse<SyllabusListItem | null>> {
  try {
    const res = await fetch(SYLLABUS_ENDPOINTS.BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return errorResponse(null, { response: res, data: json });

    const item = json?.data ?? json;
    return { isSuccess: true, data: item?.id ? normalizeSyllabusListItem(item) : null, message: json?.message };
  } catch (error) {
    return errorResponse(null, error);
  }
}

export async function updateSyllabus(
  id: string,
  data: UpdateSyllabusRequest,
): Promise<ServiceResponse<SyllabusListItem | null>> {
  try {
    const res = await fetch(SYLLABUS_ENDPOINTS.BY_ID(id), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return errorResponse(null, { response: res, data: json });

    const item = json?.data ?? json;
    return { isSuccess: true, data: item?.id ? normalizeSyllabusListItem(item) : null, message: json?.message };
  } catch (error) {
    return errorResponse(null, error);
  }
}

export async function importSyllabusWord(
  params: ImportSyllabusWordParams,
  file: File,
): Promise<ServiceResponse<ImportSyllabusWordResult | null>> {
  const token = getAccessToken();
  if (!token) return { isSuccess: false, data: null, message: "Chưa đăng nhập." };

  try {
    const query = new URLSearchParams({
      programId: params.programId,
      levelId: params.levelId,
      code: params.code,
      version: params.version,
    });
    if (params.overwriteExisting !== undefined) {
      query.append("overwriteExisting", String(params.overwriteExisting));
    }
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${SYLLABUS_ENDPOINTS.IMPORT_WORD}?${query}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        isSuccess: false, data: null,
        message: str(json?.detail) || str(json?.message) || str(json?.title) || "Import Word thất bại.",
        status: typeof json?.status === "number" ? json.status : res.status,
        title: str(json?.title) || undefined,
        detail: str(json?.detail) || undefined,
        errors: Array.isArray(json?.errors) ? json.errors : undefined,
        raw: json,
      };
    }
    const d = json?.data ?? json;
    return {
      isSuccess: true,
      data: {
        syllabusId: str(d?.syllabusId),
        importedUnits: Number(d?.importedUnits ?? 0),
        importedLessons: Number(d?.importedLessons ?? 0),
        importedResources: Number(d?.importedResources ?? 0),
        importedSessionTemplates: Number(d?.importedSessionTemplates ?? 0),
      },
    };
  } catch (error) {
    return errorResponse(null, error);
  }
}

export async function importSyllabusArchive(
  params: ImportSyllabusArchiveParams,
  file: File,
): Promise<ServiceResponse<ImportSyllabusArchiveResult | null>> {
  const token = getAccessToken();
  if (!token) return { isSuccess: false, data: null, message: "Chưa đăng nhập." };

  try {
    const query = new URLSearchParams({
      programId: params.programId,
      levelId: params.levelId,
      code: params.code,
      version: params.version,
    });
    if (params.overwriteExisting !== undefined) {
      query.append("overwriteExisting", String(params.overwriteExisting));
    }
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${SYLLABUS_ENDPOINTS.IMPORT_ARCHIVE}?${query}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        isSuccess: false, data: null,
        message: str(json?.detail) || str(json?.message) || str(json?.title) || "Import archive thất bại.",
        status: typeof json?.status === "number" ? json.status : res.status,
        title: str(json?.title) || undefined,
        detail: str(json?.detail) || undefined,
        errors: Array.isArray(json?.errors) ? json.errors : undefined,
        raw: json,
      };
    }
    const d = json?.data ?? json;
    return {
      isSuccess: true,
      data: {
        syllabusId: str(d?.syllabusId),
        importedLessonPlans: Number(d?.importedLessonPlans ?? 0),
        skippedFiles: Number(d?.skippedFiles ?? 0),
        skippedEntries: Array.isArray(d?.skippedEntries) ? d.skippedEntries : [],
      },
    };
  } catch (error) {
    return errorResponse(null, error);
  }
}
