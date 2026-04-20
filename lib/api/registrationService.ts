import { get, patch, post, put } from "@/lib/axios";
import { REGISTRATION_ENDPOINTS } from "@/constants/apiURL";
import type {
  AssignClassRequest,
  RegistrationFirstStudySession,
  Registration,
  RegistrationActionResponse,
  RegistrationFilterParams,
  RegistrationPaginatedResponse,
  RegistrationRequest,
  RegistrationStudySchedule,
  RegistrationStatus,
  SuggestedClass,
  SuggestedClassBucket,
  UpdateRegistrationRequest,
} from "@/types/registration";

function ensureRegistrationActionSuccess(response: RegistrationActionResponse, fallbackMessage: string) {
  const isSuccess =
    typeof response?.isSuccess === "boolean"
      ? response.isSuccess
      : typeof response?.success === "boolean"
        ? response.success
        : true;

  if (isSuccess) return response;

  const error = new Error(response?.message || fallbackMessage) as Error & {
    response?: { status?: number; data?: unknown };
    raw?: unknown;
  };
  error.response = {
    status: (response as any)?.status,
    data: response,
  };
  error.raw = response;
  throw error;
}

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

function pickSuggestedBucket(payload: any): any {
  if (payload?.data?.data && typeof payload.data.data === "object") return payload.data.data;
  if (payload?.data && typeof payload.data === "object") return payload.data;
  return payload;
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
    case "classassigned":
    case "class_assigned":
    case "class-assigned":
      return "ClassAssigned";
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
  const toTrack = (value: unknown): "primary" | "secondary" | null => {
    const normalized = String(value || "").trim().toLowerCase();
    if (normalized === "primary" || normalized === "secondary") {
      return normalized;
    }
    return null;
  };

  const actualStudySchedulesRaw = Array.isArray(item?.actualStudySchedules)
    ? item.actualStudySchedules
    : Array.isArray(item?.ActualStudySchedules)
      ? item.ActualStudySchedules
      : [];

  const firstStudySessionRaw =
    item?.firstStudySession && typeof item.firstStudySession === "object"
      ? item.firstStudySession
      : item?.FirstStudySession && typeof item.FirstStudySession === "object"
        ? item.FirstStudySession
        : null;

  const firstStudySession: RegistrationFirstStudySession | null = firstStudySessionRaw
    ? {
        track: toTrack(firstStudySessionRaw?.track),
        classId: firstStudySessionRaw?.classId
          ? String(firstStudySessionRaw.classId)
          : null,
        className:
          typeof firstStudySessionRaw?.className === "string"
            ? firstStudySessionRaw.className
            : null,
        sessionDate:
          typeof firstStudySessionRaw?.sessionDate === "string"
            ? firstStudySessionRaw.sessionDate
            : typeof firstStudySessionRaw?.firstStudyDate === "string"
              ? firstStudySessionRaw.firstStudyDate
              : typeof firstStudySessionRaw?.date === "string"
                ? firstStudySessionRaw.date
                : null,
        startsAt:
          typeof firstStudySessionRaw?.startsAt === "string"
            ? firstStudySessionRaw.startsAt
            : typeof firstStudySessionRaw?.startAt === "string"
              ? firstStudySessionRaw.startAt
              : typeof firstStudySessionRaw?.startTime === "string"
                ? firstStudySessionRaw.startTime
                : null,
        endsAt:
          typeof firstStudySessionRaw?.endsAt === "string"
            ? firstStudySessionRaw.endsAt
            : typeof firstStudySessionRaw?.endAt === "string"
              ? firstStudySessionRaw.endAt
              : typeof firstStudySessionRaw?.endTime === "string"
                ? firstStudySessionRaw.endTime
                : null,
        studyDayCode:
          typeof firstStudySessionRaw?.studyDayCode === "string"
            ? firstStudySessionRaw.studyDayCode
            : typeof firstStudySessionRaw?.dayCode === "string"
              ? firstStudySessionRaw.dayCode
              : null,
        studyDayName:
          typeof firstStudySessionRaw?.studyDayName === "string"
            ? firstStudySessionRaw.studyDayName
            : typeof firstStudySessionRaw?.dayName === "string"
              ? firstStudySessionRaw.dayName
              : typeof firstStudySessionRaw?.dayDisplayName === "string"
                ? firstStudySessionRaw.dayDisplayName
                : null,
      }
    : null;

  const actualStudySchedules: RegistrationStudySchedule[] = actualStudySchedulesRaw
    .map((schedule: any) => ({
      track: toTrack(schedule?.track),
      classId: schedule?.classId ? String(schedule.classId) : null,
      className:
        typeof schedule?.className === "string" ? schedule.className : null,
      programId: schedule?.programId ? String(schedule.programId) : null,
      programName:
        typeof schedule?.programName === "string" ? schedule.programName : null,
      usesClassDefaultSchedule:
        typeof schedule?.usesClassDefaultSchedule === "boolean"
          ? schedule.usesClassDefaultSchedule
          : null,
      classSchedulePattern:
        typeof schedule?.classSchedulePattern === "string"
          ? schedule.classSchedulePattern
          : null,
      effectiveSchedulePattern:
        typeof schedule?.effectiveSchedulePattern === "string"
          ? schedule.effectiveSchedulePattern
          : null,
      studyDayCodes: Array.isArray(schedule?.studyDayCodes)
        ? schedule.studyDayCodes.map((code: any) => String(code))
        : Array.isArray(schedule?.dayCodes)
          ? schedule.dayCodes.map((code: any) => String(code))
        : [],
      studyDays: Array.isArray(schedule?.studyDays)
        ? schedule.studyDays.map((day: any) => String(day))
        : Array.isArray(schedule?.studyDayNames)
          ? schedule.studyDayNames.map((day: any) => String(day))
        : [],
      studyDayDisplayNames: Array.isArray(schedule?.studyDayDisplayNames)
        ? schedule.studyDayDisplayNames.map((day: any) => String(day))
        : Array.isArray(schedule?.displayStudyDays)
          ? schedule.displayStudyDays.map((day: any) => String(day))
        : [],
      studyDaysSummary:
        typeof schedule?.studyDaysSummary === "string"
          ? schedule.studyDaysSummary
          : typeof schedule?.studyDaysDisplayText === "string"
            ? schedule.studyDaysDisplayText
          : null,
    }))
    .filter(
      (schedule: RegistrationStudySchedule) =>
        Boolean(schedule.track || schedule.classId || schedule.className),
    );

  return {
    id: String(item?.id ?? ""),
    studentProfileId: String(item?.studentProfileId ?? ""),
    studentName: item?.studentName ?? null,
    branchId: String(item?.branchId ?? ""),
    branchName: String(item?.branchName ?? ""),
    programId: String(item?.programId ?? ""),
    programName: String(item?.programName ?? ""),
    secondaryProgramId: item?.secondaryProgramId ? String(item.secondaryProgramId) : null,
    secondaryProgramName:
      typeof item?.secondaryProgramName === "string" ? item.secondaryProgramName : null,
    secondaryProgramSkillFocus:
      typeof item?.secondaryProgramSkillFocus === "string" ? item.secondaryProgramSkillFocus : null,
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
    secondaryClassId: item?.secondaryClassId ? String(item.secondaryClassId) : null,
    secondaryClassName:
      typeof item?.secondaryClassName === "string" ? item.secondaryClassName : null,
    secondaryEntryType:
      typeof item?.secondaryEntryType === "string" && item.secondaryEntryType.trim()
        ? item.secondaryEntryType
        : null,
    totalSessions: Number(item?.totalSessions ?? 0),
    usedSessions: Number(item?.usedSessions ?? 0),
    remainingSessions: Number(item?.remainingSessions ?? 0),
    firstStudySession,
    actualStudySchedules,
    expiryDate: item?.expiryDate ?? null,
    createdAt: String(item?.createdAt ?? ""),
    updatedAt: String(item?.updatedAt ?? ""),
  };
}

function mapSuggestedClass(item: any): SuggestedClass {
  const capacity = Number(item?.capacity ?? item?.maxStudents ?? 0);
  const currentEnrollment = Number(
    item?.currentEnrollment ?? item?.currentEnrollmentCount ?? item?.currentStudentCount ?? 0,
  );
  const remainingSlots = Number(
    item?.remainingSlots ?? Math.max(0, capacity - currentEnrollment),
  );

  return {
    id: String(item?.id ?? ""),
    code: item?.code ?? "",
    title: item?.title ?? item?.classTitle ?? item?.name ?? "",
    status: item?.status ?? "Planned",
    capacity,
    currentEnrollment,
    remainingSlots,
    startDate: item?.startDate ?? "",
    endDate: item?.endDate ?? "",
    schedulePattern: item?.schedulePattern ?? "",
    mainTeacherName: item?.mainTeacherName ?? item?.teacherName ?? "",
    classroomName: item?.classroomName ?? item?.roomName ?? null,
    isClassStarted: Boolean(item?.isClassStarted),
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

  const items = pickItems(response)
    .map(mapToRegistration)
    .filter((x: Registration) => Boolean(x.id));
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
  const response = await post<RegistrationActionResponse>(REGISTRATION_ENDPOINTS.CREATE, payload);
  return ensureRegistrationActionSuccess(response, "Không thể tạo đăng ký");
}

export async function updateRegistration(
  id: string,
  payload: UpdateRegistrationRequest
): Promise<RegistrationActionResponse> {
  const response = await put<RegistrationActionResponse>(REGISTRATION_ENDPOINTS.UPDATE(id), payload);
  return ensureRegistrationActionSuccess(response, "Không thể cập nhật đăng ký");
}

export async function cancelRegistration(
  id: string,
  reason?: string
): Promise<RegistrationActionResponse> {
  const url = reason
    ? `${REGISTRATION_ENDPOINTS.CANCEL(id)}?reason=${encodeURIComponent(reason)}`
    : REGISTRATION_ENDPOINTS.CANCEL(id);
  const response = await patch<RegistrationActionResponse>(url);
  return ensureRegistrationActionSuccess(response, "Không thể hủy đăng ký");
}

export async function suggestClassesForRegistration(id: string): Promise<SuggestedClassBucket> {
  const response = await get<any>(REGISTRATION_ENDPOINTS.SUGGEST_CLASSES(id));
  const bucket = pickSuggestedBucket(response);
  const legacyItems = pickSuggestedClasses(response);

  const suggestedClasses = Array.isArray(bucket?.suggestedClasses)
    ? bucket.suggestedClasses
    : legacyItems;
  const alternativeClasses = Array.isArray(bucket?.alternativeClasses)
    ? bucket.alternativeClasses
    : [];
  const secondarySuggestedClasses = Array.isArray(bucket?.secondarySuggestedClasses)
    ? bucket.secondarySuggestedClasses
    : [];
  const secondaryAlternativeClasses = Array.isArray(bucket?.secondaryAlternativeClasses)
    ? bucket.secondaryAlternativeClasses
    : [];

  return {
    registrationId: String(bucket?.registrationId ?? id),
    programName: bucket?.programName ?? null,
    length:
      suggestedClasses.length +
      alternativeClasses.length +
      secondarySuggestedClasses.length +
      secondaryAlternativeClasses.length,
    suggestedClasses: suggestedClasses
      .map(mapSuggestedClass)
      .filter((x: SuggestedClass) => Boolean(x.id)),
    alternativeClasses: alternativeClasses
      .map(mapSuggestedClass)
      .filter((x: SuggestedClass) => Boolean(x.id)),
    secondaryProgramId: bucket?.secondaryProgramId ? String(bucket.secondaryProgramId) : null,
    secondaryProgramName:
      typeof bucket?.secondaryProgramName === "string" ? bucket.secondaryProgramName : null,
    secondaryProgramSkillFocus:
      typeof bucket?.secondaryProgramSkillFocus === "string"
        ? bucket.secondaryProgramSkillFocus
        : null,
    secondarySuggestedClasses: secondarySuggestedClasses
      .map(mapSuggestedClass)
      .filter((x: SuggestedClass) => Boolean(x.id)),
    secondaryAlternativeClasses: secondaryAlternativeClasses
      .map(mapSuggestedClass)
      .filter((x: SuggestedClass) => Boolean(x.id)),
  };
}

export async function assignClassToRegistration(
  id: string,
  payload: AssignClassRequest
): Promise<RegistrationActionResponse> {
  const response = await post<RegistrationActionResponse>(REGISTRATION_ENDPOINTS.ASSIGN_CLASS(id), payload);
  return ensureRegistrationActionSuccess(response, "Không thể xếp lớp cho đăng ký");
}

export async function getWaitingListRegistrations(params?: {
  branchId?: string;
  programId?: string;
  track?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<RegistrationPaginatedResponse> {
  const queryParams = new URLSearchParams();

  if (params?.branchId) queryParams.append("branchId", params.branchId);
  if (params?.programId) queryParams.append("programId", params.programId);
  if (params?.track) queryParams.append("track", params.track);
  if (params?.pageNumber) queryParams.append("pageNumber", params.pageNumber.toString());
  if (params?.pageSize) queryParams.append("pageSize", params.pageSize.toString());

  const response = await get<any>(
    `${REGISTRATION_ENDPOINTS.WAITING_LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
  );

  const items = pickItems(response)
    .map(mapToRegistration)
    .filter((x: Registration) => Boolean(x.id));
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
  effectiveDate?: string,
  options?: {
    track?: string;
    sessionSelectionPattern?: string | null;
  }
): Promise<RegistrationActionResponse> {
  const queryParams = new URLSearchParams({ newClassId });
  if (effectiveDate) queryParams.append("effectiveDate", effectiveDate);
  if (options?.track) queryParams.append("track", options.track);
  if (options?.sessionSelectionPattern?.trim()) {
    queryParams.append("sessionSelectionPattern", options.sessionSelectionPattern.trim());
  }

  const response = await post<RegistrationActionResponse>(
    `${REGISTRATION_ENDPOINTS.TRANSFER_CLASS(id)}?${queryParams.toString()}`
  );
  return ensureRegistrationActionSuccess(response, "Không thể chuyển lớp cho đăng ký");
}

export async function upgradeRegistration(
  id: string,
  newTuitionPlanId: string
): Promise<RegistrationActionResponse> {
  const response = await post<RegistrationActionResponse>(
    `${REGISTRATION_ENDPOINTS.UPGRADE(id)}?newTuitionPlanId=${encodeURIComponent(newTuitionPlanId)}`
  );
  return ensureRegistrationActionSuccess(response, "Không thể nâng cấp đăng ký");
}

export function extractRegistrationIdFromAction(response: RegistrationActionResponse | any): string {
  return String(
    response?.data?.registrationId ||
      response?.data?.newRegistrationId ||
      response?.data?.originalRegistrationId ||
      response?.data?.id ||
      response?.data?.registration?.id ||
      response?.registrationId ||
      response?.newRegistrationId ||
      response?.originalRegistrationId ||
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
  secondaryProgramId?: string | null;
  secondaryProgramSkillFocus?: string | null;
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
    secondaryProgramId: payload.secondaryProgramId,
    secondaryProgramSkillFocus: payload.secondaryProgramSkillFocus,
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
