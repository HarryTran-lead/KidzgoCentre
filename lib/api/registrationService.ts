import { get, patch, post, put } from "@/lib/axios";
import { REGISTRATION_ENDPOINTS } from "@/constants/apiURL";
import type {
  AssignClassRequest,
  Registration,
  RegistrationActionResponse,
  RegistrationFilterParams,
  RegistrationPaginatedResponse,
  RegistrationRequest,
  RegistrationStatus,
  SuggestedClass,
  UpdateRegistrationRequest,
} from "@/types/registration";

function pickItems(payload: any): any[] {
  if (Array.isArray(payload?.data?.page?.items)) return payload.data.page.items;
  if (Array.isArray(payload?.data?.registrations?.items)) return payload.data.registrations.items;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data?.registrations)) return payload.data.registrations;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

function pickSuggestedClasses(payload: any): any[] {
  if (Array.isArray(payload?.data?.suggestedClasses)) return payload.data.suggestedClasses;
  if (Array.isArray(payload?.data?.data?.suggestedClasses)) return payload.data.data.suggestedClasses;
  if (Array.isArray(payload?.suggestedClasses)) return payload.suggestedClasses;
  if (Array.isArray(payload?.data?.classes)) return payload.data.classes;
  if (Array.isArray(payload?.classes)) return payload.classes;
  return pickItems(payload);
}

function normalizeRegistrationStatus(value: any): RegistrationStatus {
  const raw = String(value ?? "").trim();
  const normalized = raw.toLowerCase();

  switch (normalized) {
    case "new":
      return "New";
    case "waitingforclass":
    case "waiting_for_class":
    case "waiting-for-class":
      return "WaitingForClass";
    case "studying":
      return "Studying";
    case "paused":
      return "Paused";
    case "completed":
      return "Completed";
    case "cancelled":
    case "canceled":
      return "Cancelled";
    default:
      return "New";
  }
}

function pickDetail(payload: any): any {
  if (payload?.data?.registration) return payload.data.registration;
  if (payload?.data) return payload.data;
  if (payload?.registration) return payload.registration;
  return payload;
}

function mapToRegistration(item: any): Registration {
  return {
    id: String(item?.id ?? ""),
    studentProfileId: String(item?.studentProfileId ?? ""),
    studentName: item?.studentName ?? null,
    branchId: String(item?.branchId ?? ""),
    branchName: String(item?.branchName ?? ""),
    programId: String(item?.programId ?? ""),
    programName: String(item?.programName ?? ""),
    tuitionPlanId: String(item?.tuitionPlanId ?? ""),
    tuitionPlanName: String(item?.tuitionPlanName ?? ""),
    registrationDate: String(item?.registrationDate ?? ""),
    expectedStartDate: String(item?.expectedStartDate ?? ""),
    actualStartDate: String(item?.actualStartDate ?? ""),
    preferredSchedule: String(item?.preferredSchedule ?? ""),
    note: String(item?.note ?? ""),
    status: normalizeRegistrationStatus(item?.status),
    classId: String(item?.classId ?? ""),
    className: String(item?.className ?? ""),
    totalSessions: Number(item?.totalSessions ?? 0),
    usedSessions: Number(item?.usedSessions ?? 0),
    remainingSessions: Number(item?.remainingSessions ?? 0),
    expiryDate: item?.expiryDate ?? null,
    createdAt: String(item?.createdAt ?? ""),
    updatedAt: String(item?.updatedAt ?? ""),
  };
}

export async function getRegistrations(
  params?: RegistrationFilterParams
): Promise<RegistrationPaginatedResponse> {
  const queryParams = new URLSearchParams();

  if (params?.studentProfileId) queryParams.append("studentProfileId", params.studentProfileId);
  if (params?.branchId) queryParams.append("branchId", params.branchId);
  if (params?.programId) queryParams.append("programId", params.programId);
  if (params?.status) queryParams.append("status", params.status);
  if (params?.classId) queryParams.append("classId", params.classId);
  if (params?.pageNumber) queryParams.append("pageNumber", params.pageNumber.toString());
  if (params?.pageSize) queryParams.append("pageSize", params.pageSize.toString());

  const response = await get<any>(
    `${REGISTRATION_ENDPOINTS.GET_ALL}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
  );

  const items = pickItems(response).map(mapToRegistration).filter((x) => x.id);
  const data = response?.data ?? {};
  const container = data?.page ?? data?.registrations ?? data;
  const totalCount = Number(container?.totalCount ?? data?.totalCount ?? items.length);
  const pageNumber = Number(container?.pageNumber ?? data?.pageNumber ?? params?.pageNumber ?? 1);
  const pageSize = Number(container?.pageSize ?? data?.pageSize ?? params?.pageSize ?? 10);

  return {
    items,
    totalCount,
    pageNumber,
    pageSize,
    totalPages: Math.max(1, Math.ceil(totalCount / Math.max(1, pageSize))),
  };
}

export async function getRegistrationById(id: string): Promise<Registration> {
  const response = await get<any>(REGISTRATION_ENDPOINTS.GET_BY_ID(id));
  return mapToRegistration(pickDetail(response));
}

export async function createRegistration(payload: RegistrationRequest): Promise<RegistrationActionResponse> {
  return await post<RegistrationActionResponse>(REGISTRATION_ENDPOINTS.CREATE, payload);
}

export async function updateRegistration(
  id: string,
  payload: UpdateRegistrationRequest
): Promise<RegistrationActionResponse> {
  return await put<RegistrationActionResponse>(REGISTRATION_ENDPOINTS.UPDATE(id), payload);
}

export async function cancelRegistration(
  id: string,
  reason?: string
): Promise<RegistrationActionResponse> {
  const url = reason
    ? `${REGISTRATION_ENDPOINTS.CANCEL(id)}?reason=${encodeURIComponent(reason)}`
    : REGISTRATION_ENDPOINTS.CANCEL(id);
  return await patch<RegistrationActionResponse>(url);
}

export async function suggestClassesForRegistration(id: string): Promise<SuggestedClass[]> {
  const response = await get<any>(REGISTRATION_ENDPOINTS.SUGGEST_CLASSES(id));
  const items = pickSuggestedClasses(response);
  return items.map((item) => ({
    id: String(item?.id ?? ""),
    code: item?.code,
    title: item?.title,
    status: item?.status,
    capacity: item?.capacity,
    currentEnrollment: item?.currentEnrollment,
    remainingSlots: item?.remainingSlots,
    startDate: item?.startDate,
    endDate: item?.endDate,
    schedulePattern: item?.schedulePattern,
    mainTeacherName: item?.mainTeacherName,
    classroomName: item?.classroomName,
    isClassStarted: item?.isClassStarted,
  })).filter((x) => x.id);
}

export async function assignClassToRegistration(
  id: string,
  payload: AssignClassRequest
): Promise<RegistrationActionResponse> {
  return await post<RegistrationActionResponse>(REGISTRATION_ENDPOINTS.ASSIGN_CLASS(id), payload);
}

export async function getWaitingListRegistrations(params?: {
  branchId?: string;
  programId?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<RegistrationPaginatedResponse> {
  const queryParams = new URLSearchParams();

  if (params?.branchId) queryParams.append("branchId", params.branchId);
  if (params?.programId) queryParams.append("programId", params.programId);
  if (params?.pageNumber) queryParams.append("pageNumber", params.pageNumber.toString());
  if (params?.pageSize) queryParams.append("pageSize", params.pageSize.toString());

  const response = await get<any>(
    `${REGISTRATION_ENDPOINTS.WAITING_LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
  );

  const items = pickItems(response).map(mapToRegistration).filter((x) => x.id);
  const data = response?.data ?? {};
  const container = data?.page ?? data?.registrations ?? data;
  const totalCount = Number(container?.totalCount ?? data?.totalCount ?? items.length);
  const pageNumber = Number(container?.pageNumber ?? data?.pageNumber ?? params?.pageNumber ?? 1);
  const pageSize = Number(container?.pageSize ?? data?.pageSize ?? params?.pageSize ?? 10);

  return {
    items,
    totalCount,
    pageNumber,
    pageSize,
    totalPages: Math.max(1, Math.ceil(totalCount / Math.max(1, pageSize))),
  };
}

export async function transferRegistrationClass(
  id: string,
  newClassId: string,
  effectiveDate?: string
): Promise<RegistrationActionResponse> {
  const queryParams = new URLSearchParams({ newClassId });
  if (effectiveDate) queryParams.append("effectiveDate", effectiveDate);

  return await post<RegistrationActionResponse>(
    `${REGISTRATION_ENDPOINTS.TRANSFER_CLASS(id)}?${queryParams.toString()}`
  );
}

export async function upgradeRegistration(
  id: string,
  newTuitionPlanId: string
): Promise<RegistrationActionResponse> {
  return await post<RegistrationActionResponse>(
    `${REGISTRATION_ENDPOINTS.UPGRADE(id)}?newTuitionPlanId=${encodeURIComponent(newTuitionPlanId)}`
  );
}

export function extractRegistrationIdFromAction(response: RegistrationActionResponse | any): string {
  return String(
    response?.data?.registrationId ||
      response?.data?.id ||
      response?.data?.registration?.id ||
      response?.registrationId ||
      response?.id ||
      ""
  );
}

export async function createRegistrationFromPlacementTest(payload: {
  placementTestId: string;
  studentProfileId: string;
  branchId: string;
  programId: string;
  tuitionPlanId: string;
  expectedStartDate?: string;
  preferredSchedule?: string;
  note?: string;
}): Promise<{ registrationId: string; raw: RegistrationActionResponse }> {
  const noteSegments = [
    payload.note?.trim(),
    payload.placementTestId ? `Started from PlacementTest:${payload.placementTestId}` : "",
  ].filter(Boolean);

  const raw = await createRegistration({
    studentProfileId: payload.studentProfileId,
    branchId: payload.branchId,
    programId: payload.programId,
    tuitionPlanId: payload.tuitionPlanId,
    expectedStartDate: payload.expectedStartDate,
    preferredSchedule: payload.preferredSchedule,
    note: noteSegments.length > 0 ? noteSegments.join(" | ") : undefined,
  });

  const registrationId = extractRegistrationIdFromAction(raw);
  if (!registrationId) {
    throw new Error("Tạo đăng ký thành công nhưng không nhận được registrationId.");
  }

  return { registrationId, raw };
}
