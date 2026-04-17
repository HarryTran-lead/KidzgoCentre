/**
 * Placement Test Service
 * Handles all API calls related to placement tests
 */

import { get, post, put } from "@/lib/axios";
import { PLACEMENT_TEST_ENDPOINTS } from "@/constants/apiURL";
import axios from "axios";
import { getDomainErrorMessage } from "@/lib/api/domainErrorMessage";
import type {
  PlacementTest,
  CreatePlacementTestRequest,
  UpdatePlacementTestRequest,
  PlacementTestAvailabilityRequest,
  PlacementTestAvailabilityResponse,
  PlacementTestAvailabilityConflict,
  PlacementTestResult,
  PlacementTestNote,
  PlacementTestRetakeRequest,
  PlacementTestRetakeResponse,
} from "@/types/placement-test";
import type { ApiResponse } from "@/types/apiResponse";

// Paginated response type
interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

type ProblemPayload = {
  code?: string;
  status?: number;
  title?: string;
  detail?: string;
  message?: string;
  errors?: unknown;
};

type ProblemErrorItem = {
  code?: string;
  description?: string;
  message?: string;
  type?: string;
  field?: string;
};

export class PlacementTestApiError extends Error {
  code?: string;
  status?: number;
  title?: string;
  detail?: string;
  validationMessages?: string[];
  raw?: unknown;

  constructor(
    message: string,
    options?: {
      code?: string;
      status?: number;
      title?: string;
      detail?: string;
      validationMessages?: string[];
      raw?: unknown;
    }
  ) {
    super(message);
    this.name = "PlacementTestApiError";
    this.code = options?.code;
    this.status = options?.status;
    this.title = options?.title;
    this.detail = options?.detail;
    this.validationMessages = options?.validationMessages;
    this.raw = options?.raw;
  }
}

const STATUS_CODE_LABEL: Record<number, string> = {
  400: "Yêu cầu không hợp lệ",
  401: "Chưa đăng nhập hoặc token không hợp lệ",
  403: "Không có quyền truy cập",
  404: "Không tìm thấy dữ liệu",
  409: "Xung đột dữ liệu",
  500: "Lỗi hệ thống",
};

function extractPayload(response: any): any {
  return response?.data ?? response ?? {};
}

function extractData<T>(response: any): T {
  const payload = extractPayload(response);
  if (payload?.data !== undefined) return payload.data as T;
  return payload as T;
}

function normalizeAvailabilityConflicts(value: unknown): PlacementTestAvailabilityConflict[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((conflict) => {
      if (!conflict || typeof conflict !== "object") return null;
      const casted = conflict as Record<string, unknown>;
      return {
        type: casted.type ? String(casted.type) : undefined,
        title: casted.title ? String(casted.title) : undefined,
        startAt: casted.startAt ? String(casted.startAt) : undefined,
        endAt: casted.endAt ? String(casted.endAt) : undefined,
      };
    })
    .filter(Boolean) as PlacementTestAvailabilityConflict[];
}

function normalizeAvailabilityResponse(response: any): PlacementTestAvailabilityResponse {
  const payload = extractPayload(response);
  const data = payload?.data ?? payload ?? {};

  const rawItems = Array.isArray(data?.items) ? data.items : [];
  const rawRooms = Array.isArray(data?.rooms) ? data.rooms : [];

  const items = rawItems
    .map((item: any, index: number) => {
      const id = String(
        item?.id ?? item?.userId ?? item?.invigilatorUserId ?? item?.teacherId ?? `invigilator-${index}`
      );

      return {
        id,
        fullName: item?.fullName ? String(item.fullName) : item?.name ? String(item.name) : undefined,
        role: item?.role ? String(item.role) : undefined,
        branchId: item?.branchId
          ? String(item.branchId)
          : item?.branch?.id
          ? String(item.branch.id)
          : undefined,
        isAvailable: item?.isAvailable !== false,
        conflicts: normalizeAvailabilityConflicts(item?.conflicts),
      };
    })
    .filter((item: any) => item.id);

  const rooms = rawRooms
    .map((room: any, index: number) => {
      const id = String(room?.id ?? room?.roomId ?? room?.classroomId ?? `room-${index}`);

      return {
        id,
        roomName: room?.roomName
          ? String(room.roomName)
          : room?.name
          ? String(room.name)
          : room?.room
          ? String(room.room)
          : undefined,
        name: room?.name ? String(room.name) : undefined,
        branchId: room?.branchId
          ? String(room.branchId)
          : room?.branch?.id
          ? String(room.branch.id)
          : undefined,
        isAvailable: room?.isAvailable !== false,
        conflicts: normalizeAvailabilityConflicts(room?.conflicts),
      };
    })
    .filter((room: any) => room.id);

  return {
    items,
    rooms,
  };
}

function extractErrorPayload(error: unknown): ProblemPayload {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ProblemPayload | undefined;
    return {
      code: data?.code,
      status: error.response?.status,
      title: data?.title,
      detail: data?.detail,
      message: data?.message,
      errors: data?.errors,
    };
  }

  if (error instanceof PlacementTestApiError) {
    return {
      code: error.code,
      status: error.status,
      title: error.title,
      detail: error.detail,
      message: error.message,
      errors: (error as any).raw?.errors,
    };
  }

  return {};
}

function normalizeValidationMessages(errors: unknown): string[] {
  if (!errors) return [];

  if (Array.isArray(errors)) {
    return errors
      .map((item) => {
        if (typeof item === "string") return item;
        if (!item || typeof item !== "object") return "";
        const casted = item as ProblemErrorItem;
        return String(casted.description || casted.message || casted.code || "").trim();
      })
      .filter(Boolean);
  }

  if (typeof errors === "object") {
    const messages: string[] = [];
    Object.values(errors as Record<string, unknown>).forEach((value) => {
      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (typeof item === "string" && item.trim()) messages.push(item.trim());
        });
      } else if (typeof value === "string" && value.trim()) {
        messages.push(value.trim());
      }
    });
    return messages;
  }

  return [];
}

function translatePlacementTestValidationMessage(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("scheduledat") && normalized.includes("cannot be in the past")) {
    return "Thời gian test không được ở quá khứ. Vui lòng chọn thời gian hiện tại hoặc tương lai.";
  }

  if (normalized.includes("scheduledat") && normalized.includes("required")) {
    return "Vui lòng chọn thời gian test.";
  }

  if (normalized.includes("invigilator") && normalized.includes("required")) {
    return "Vui lòng chọn người giám sát.";
  }

  if (normalized.includes("leadchild") && normalized.includes("required")) {
    return "Vui lòng chọn tên bé.";
  }

  if (normalized.includes("lead") && normalized.includes("required")) {
    return "Vui lòng chọn lead.";
  }

  return message;
}

function translatePlacementTestMessage(message?: string): string {
  if (!message) return "";
  const normalized = message.toLowerCase();

  if (normalized.includes("one or more validation errors occurred")) {
    return "Dữ liệu gửi lên chưa hợp lệ. Vui lòng kiểm tra lại các trường bắt buộc.";
  }

  if (normalized.includes("validation.general")) {
    return "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin đã nhập.";
  }

  return message;
}

function toPlacementTestApiError(error: unknown, fallbackMessage: string): PlacementTestApiError {
  if (error instanceof PlacementTestApiError) return error;

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = (error.response?.data || {}) as ProblemPayload;
    const validationMessages = normalizeValidationMessages(data?.errors).map(
      translatePlacementTestValidationMessage
    );
    const firstValidationMessage = validationMessages[0];
    const translatedMessage = translatePlacementTestMessage(
      data?.message || data?.detail || data?.title
    );
    const message =
      firstValidationMessage ||
      translatedMessage ||
      error.message ||
      fallbackMessage;

    return new PlacementTestApiError(message, {
      code: data?.code,
      status,
      title: data?.title,
      detail: data?.detail,
      validationMessages,
      raw: error.response?.data,
    });
  }

  return new PlacementTestApiError(
    error instanceof Error ? error.message : fallbackMessage,
    { raw: error }
  );
}

export function mapPlacementTestStatusCode(status?: number): string {
  if (!status) return "Lỗi không xác định";
  return STATUS_CODE_LABEL[status] || `Loi HTTP ${status}`;
}

export function getPlacementTestErrorMessage(error: unknown, fallbackMessage = "Không thể xử lý placement test"): string {
  const details = extractErrorPayload(error);
  const mapped = getDomainErrorMessage(error, fallbackMessage);
  if (mapped && mapped !== fallbackMessage) return mapped;

  const validationMessages = normalizeValidationMessages(details.errors).map(
    translatePlacementTestValidationMessage
  );
  if (validationMessages.length > 0) return validationMessages[0];

  if (error instanceof PlacementTestApiError && error.validationMessages?.length) {
    return error.validationMessages[0];
  }

  const translated =
    translatePlacementTestMessage(details.detail) ||
    translatePlacementTestMessage(details.message) ||
    translatePlacementTestMessage(details.title);

  return translated || details.detail || details.message || details.title || fallbackMessage;
}

/**
 * Get all placement tests with optional filters
 */
export async function getAllPlacementTests(params?: {
  page?: number;
  pageSize?: number;
  status?: string;
  branchId?: string;
  teacherId?: string;
  searchTerm?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc" | "Ascending" | "Descending";
}): Promise<ApiResponse<PaginatedResponse<PlacementTest>>> {
  try {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append("pageNumber", params.page.toString());
    if (params?.pageSize) queryParams.append("pageSize", params.pageSize.toString());
    if (params?.status) queryParams.append("status", params.status);
    if (params?.branchId) queryParams.append("branchId", params.branchId);
    if (params?.teacherId) queryParams.append("assignedTeacherId", params.teacherId);
    if (params?.searchTerm) queryParams.append("searchTerm", params.searchTerm);
    if (params?.fromDate) queryParams.append("fromDate", params.fromDate);
    if (params?.toDate) queryParams.append("toDate", params.toDate);
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder);

    const response = await get<any>(
      `${PLACEMENT_TEST_ENDPOINTS.GET_ALL}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
    );

    const payload = extractPayload(response);
    const data = payload?.data ?? payload;
    const placementTests = data?.placementTests || data?.items || [];
    const totalCount = Number(data?.totalCount ?? placementTests.length ?? 0);
    const pageNumber = Number(data?.page ?? data?.pageNumber ?? 1);
    const pageSize = Number(data?.pageSize ?? params?.pageSize ?? 10);

    return {
      isSuccess: payload?.isSuccess ?? payload?.success ?? true,
      message: payload?.message,
      data: {
        items: placementTests,
        totalCount,
        pageNumber,
        pageSize,
        totalPages: Number(data?.totalPages ?? Math.max(1, Math.ceil(totalCount / Math.max(1, pageSize)))),
      },
    };
  } catch (error) {
    throw toPlacementTestApiError(error, "Khong the tai danh sach placement test");
  }
}

/**
 * Check invigilator/room availability for placement test scheduling
 */
export async function getPlacementTestAvailability(
  params: PlacementTestAvailabilityRequest
): Promise<ApiResponse<PlacementTestAvailabilityResponse>> {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append("scheduledAt", params.scheduledAt);
    queryParams.append("durationMinutes", String(params.durationMinutes));
    if (params.excludePlacementTestId) {
      queryParams.append("excludePlacementTestId", params.excludePlacementTestId);
    }

    const response = await get<any>(
      `${PLACEMENT_TEST_ENDPOINTS.AVAILABILITY}?${queryParams.toString()}`
    );
    const payload = extractPayload(response);

    return {
      isSuccess: payload?.isSuccess ?? payload?.success ?? true,
      message: payload?.message,
      data: normalizeAvailabilityResponse(response),
    };
  } catch (error) {
    throw toPlacementTestApiError(error, "Khong the kiem tra lich ranh placement test");
  }
}

/**
 * Get placement test by ID
 */
export async function getPlacementTestById(id: string): Promise<ApiResponse<PlacementTest>> {
  try {
    const response = await get<any>(PLACEMENT_TEST_ENDPOINTS.GET_BY_ID(id));
    const payload = extractPayload(response);
    return {
      isSuccess: payload?.isSuccess ?? payload?.success ?? true,
      message: payload?.message,
      data: extractData<PlacementTest>(response),
    };
  } catch (error) {
    throw toPlacementTestApiError(error, "Khong the lay chi tiet placement test");
  }
}

/**
 * Create new placement test
 */
export async function createPlacementTest(
  data: CreatePlacementTestRequest
): Promise<ApiResponse<PlacementTest>> {
  try {
    const response = await post<any>(PLACEMENT_TEST_ENDPOINTS.CREATE, data);
    const payload = extractPayload(response);
    return {
      isSuccess: payload?.isSuccess ?? payload?.success ?? true,
      message: payload?.message,
      data: extractData<PlacementTest>(response),
    };
  } catch (error) {
    throw toPlacementTestApiError(error, "Khong the tao placement test");
  }
}

/**
 * Create retake placement test
 */
export async function createPlacementTestRetake(
  originalPlacementTestId: string,
  data: PlacementTestRetakeRequest
): Promise<ApiResponse<PlacementTestRetakeResponse>> {
  try {
    const response = await post<any>(PLACEMENT_TEST_ENDPOINTS.RETAKE(originalPlacementTestId), data);
    const payload = extractPayload(response);
    return {
      isSuccess: payload?.isSuccess ?? payload?.success ?? true,
      message: payload?.message,
      data: extractData<PlacementTestRetakeResponse>(response),
    };
  } catch (error) {
    throw toPlacementTestApiError(error, "Khong the tao placement test retake");
  }
}

/**
 * Update placement test
 */
export async function updatePlacementTest(
  id: string,
  data: UpdatePlacementTestRequest
): Promise<ApiResponse<PlacementTest>> {
  try {
    const response = await put<any>(PLACEMENT_TEST_ENDPOINTS.UPDATE(id), data);
    const payload = extractPayload(response);
    return {
      isSuccess: payload?.isSuccess ?? payload?.success ?? true,
      message: payload?.message,
      data: extractData<PlacementTest>(response),
    };
  } catch (error) {
    throw toPlacementTestApiError(error, "Khong the cap nhat placement test");
  }
}

/**
 * Cancel placement test
 */
export async function cancelPlacementTest(
  id: string,
  reason?: string
): Promise<ApiResponse<void>> {
  try {
    const response = await post<any>(PLACEMENT_TEST_ENDPOINTS.CANCEL(id), { reason });
    const payload = extractPayload(response);
    return {
      isSuccess: payload?.isSuccess ?? payload?.success ?? true,
      message: payload?.message || "Cancelled successfully",
      data: undefined as any,
    };
  } catch (error) {
    throw toPlacementTestApiError(error, "Khong the huy placement test");
  }
}

/**
 * Mark placement test as no-show
 */
export async function markPlacementTestNoShow(
  id: string
): Promise<ApiResponse<void>> {
  try {
    const response = await post<any>(PLACEMENT_TEST_ENDPOINTS.NO_SHOW(id), {});
    const payload = extractPayload(response);
    return {
      isSuccess: payload?.isSuccess ?? payload?.success ?? true,
      message: payload?.message || "Marked as no-show",
      data: undefined as any,
    };
  } catch (error) {
    throw toPlacementTestApiError(error, "Khong the danh dau no-show placement test");
  }
}

/**
 * Update placement test results
 */
export async function updatePlacementTestResults(
  id: string,
  results: PlacementTestResult
): Promise<ApiResponse<void>> {
  try {
    const payload = {
      listeningScore: results.listeningScore ?? 0,
      speakingScore: results.speakingScore ?? 0,
      readingScore: results.readingScore ?? 0,
      writingScore: results.writingScore ?? 0,
      resultScore: results.resultScore ?? 0,
      programRecommendationId: results.programRecommendationId,
      secondaryProgramRecommendationId:
        results.secondaryProgramRecommendationId || null,
      secondaryProgramRecommendationName:
        results.secondaryProgramRecommendationName || null,
      secondaryProgramSkillFocus: results.secondaryProgramSkillFocus || undefined,
      attachmentUrl: results.attachmentUrl || "",
    };

    const response = await put<any>(
      PLACEMENT_TEST_ENDPOINTS.UPDATE_RESULTS(id),
      payload,
    );
    const responsePayload = extractPayload(response);
    return {
      isSuccess: responsePayload?.isSuccess ?? responsePayload?.success ?? true,
      message: responsePayload?.message || "Results updated successfully",
      data: undefined as any,
    };
  } catch (error) {
    throw toPlacementTestApiError(error, "Khong the cap nhat ket qua placement test");
  }
}

/**
 * Add note to placement test
 */
export async function addPlacementTestNote(
  id: string,
  note: Omit<PlacementTestNote, "id" | "createdAt" | "createdBy">
): Promise<ApiResponse<PlacementTestNote>> {
  try {
    const response = await post<any>(PLACEMENT_TEST_ENDPOINTS.ADD_NOTE(id), note);
    const payload = extractPayload(response);
    return {
      isSuccess: payload?.isSuccess ?? payload?.success ?? true,
      message: payload?.message,
      data: extractData<PlacementTestNote>(response),
    };
  } catch (error) {
    throw toPlacementTestApiError(error, "Khong the them ghi chu placement test");
  }
}

/**
 * Convert placement test to enrolled student
 */
export async function convertPlacementTestToEnrolled(
  id: string,
  body?: { studentProfileId?: string }
): Promise<ApiResponse<void>> {
  try {
    const response = await post<any>(
      PLACEMENT_TEST_ENDPOINTS.CONVERT_TO_ENROLLED(id),
      body ?? {}
    );
    const payload = extractPayload(response);
    return {
      isSuccess: payload?.isSuccess ?? payload?.success ?? true,
      message: payload?.message || "Converted to enrolled student successfully",
      data: undefined as any,
    };
  } catch (error) {
    throw toPlacementTestApiError(error, "Khong the chuyen placement test thanh hoc vien");
  }
}
