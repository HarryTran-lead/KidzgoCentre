import { get, patch, post, put } from "@/lib/axios";
import { REGISTRATION_ENDPOINTS } from "@/constants/apiURL";
import { getAccessToken } from "@/lib/store/authToken";
import type {
  AssignClassRequest,
  CanonicalEntryType,
  EnrollmentPdfFormTypeResolved,
  EnrollmentPdfPreviewResponse,
  PdfHistoryItem,
  RegistrationImportActiveRequest,
  RegistrationFirstStudySession,
  Registration,
  RegistrationActionResponse,
  RegistrationFilterParams,
  RegistrationPaginatedResponse,
  RegistrationRequest,
  RegistrationTrackType,
  RegistrationStudySchedule,
  RegistrationStatus,
  SuggestedClass,
  SuggestedClassBucket,
  UpdateRegistrationRequest,
  WeeklyPatternEntry,
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

const VALID_DAY_CODES = new Set(["MO", "TU", "WE", "TH", "FR", "SA", "SU"]);

function normalizeTrackValue(track?: string | null): RegistrationTrackType {
  return String(track || "").trim().toLowerCase() === "secondary" ? "secondary" : "primary";
}

function normalizeEntryTypeValue(entryType?: string | null): CanonicalEntryType {
  const normalized = String(entryType || "").trim().toLowerCase();
  switch (normalized) {
    case "wait":
    case "waiting":
      return "wait";
    case "retake":
    case "makeup":
      return "retake";
    case "immediate":
    default:
      return "immediate";
  }
}

function normalizeStartTime(value?: string | null): string | null {
  const raw = String(value || "").trim();
  const matched = raw.match(/^(\d{1,2}):(\d{1,2})/);
  if (!matched) return null;

  const hour = Number(matched[1]);
  const minute = Number(matched[2]);
  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function normalizeWeeklyPattern(
  weeklyPattern?: WeeklyPatternEntry[] | null,
): WeeklyPatternEntry[] | undefined {
  if (!Array.isArray(weeklyPattern) || weeklyPattern.length === 0) return undefined;

  const normalized = weeklyPattern
    .map((entry) => {
      const dayOfWeeks = Array.isArray(entry?.dayOfWeeks)
        ? entry.dayOfWeeks
            .map((day) => String(day || "").trim().toUpperCase())
            .filter((day) => VALID_DAY_CODES.has(day))
        : [];
      const startTime = normalizeStartTime(entry?.startTime);
      const durationRaw = Number(entry?.durationMinutes);
      const durationMinutes =
        Number.isFinite(durationRaw) && durationRaw > 0
          ? Math.floor(durationRaw)
          : 90;

      if (dayOfWeeks.length === 0 || !startTime) return null;

      return {
        dayOfWeeks,
        startTime,
        durationMinutes,
      } as WeeklyPatternEntry;
    })
    .filter((entry): entry is WeeklyPatternEntry => Boolean(entry));

  return normalized.length > 0 ? normalized : undefined;
}

function parseWeeklyPatternFromSessionSelectionPattern(
  sessionSelectionPattern?: string | null,
): WeeklyPatternEntry[] | undefined {
  const raw = String(sessionSelectionPattern || "").trim();
  if (!raw) return undefined;

  const normalized = raw.replace(/^RRULE:/i, "");
  const tokens = normalized.split(";").map((token) => token.trim());
  const map = new Map<string, string>();

  tokens.forEach((token) => {
    const [k, v] = token.split("=");
    if (!k || !v) return;
    map.set(k.toUpperCase(), v);
  });

  const byDay = (map.get("BYDAY") || "")
    .split(",")
    .map((day) => String(day || "").trim().toUpperCase())
    .filter((day) => VALID_DAY_CODES.has(day));

  const byHour = Number(map.get("BYHOUR"));
  const byMinute = Number(map.get("BYMINUTE") || "0");
  if (byDay.length === 0 || Number.isNaN(byHour) || Number.isNaN(byMinute)) {
    return undefined;
  }

  const startTime = normalizeStartTime(`${byHour}:${byMinute}`);
  if (!startTime) return undefined;

  const durationRaw = Number(map.get("DURATION") || "90");
  const durationMinutes =
    Number.isFinite(durationRaw) && durationRaw > 0 ? Math.floor(durationRaw) : 90;

  return [
    {
      dayOfWeeks: byDay,
      startTime,
      durationMinutes,
    },
  ];
}

export type EnrollmentConfirmationPdfResponse = EnrollmentPdfPreviewResponse;

type PdfRequestFormType = "auto" | EnrollmentPdfFormTypeResolved;

type EnrollmentPdfRequestOptions = {
  track?: RegistrationTrackType;
  formType?: PdfRequestFormType;
  regenerate?: boolean;
};

type EnrollmentPdfHistoryOptions = {
  track?: RegistrationTrackType;
  formType?: PdfRequestFormType;
  pageNumber?: number;
  pageSize?: number;
};

function buildPdfQuery(options?: EnrollmentPdfRequestOptions) {
  const params = new URLSearchParams();
  params.set("track", options?.track || "primary");
  params.set("formType", options?.formType || "auto");
  if (typeof options?.regenerate === "boolean") {
    params.set("regenerate", String(options.regenerate));
  }
  return params.toString();
}

function buildPdfHistoryQuery(options?: EnrollmentPdfHistoryOptions) {
  const params = new URLSearchParams();

  if (options?.track) params.set("track", options.track);
  if (options?.formType) params.set("formType", options.formType);
  if (typeof options?.pageNumber === "number" && options.pageNumber > 0) {
    params.set("pageNumber", String(options.pageNumber));
  }
  if (typeof options?.pageSize === "number" && options.pageSize > 0) {
    params.set("pageSize", String(options.pageSize));
  }

  return params.toString();
}

function mapFormTypeResolved(value?: string | null): EnrollmentPdfFormTypeResolved {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "continuingstudent" || normalized === "continue" || normalized === "continuing") {
    return "continuingStudent";
  }
  return "newStudent";
}

function mapPdfPreviewResponse(
  id: string,
  payload: any,
  fallbackTrack: RegistrationTrackType,
): EnrollmentPdfPreviewResponse {
  const data = payload?.data || payload || {};
  const preview = (data?.preview && typeof data.preview === "object") ? data.preview : {};

  const activePdf =
    data?.activePdf && typeof data.activePdf === "object"
      ? {
          pdfUrl: String(data.activePdf.pdfUrl || ""),
          generatedAt: String(data.activePdf.generatedAt || data.activePdf.pdfGeneratedAt || ""),
          generatedByName: String(data.activePdf.generatedByName || data.activePdf.generatedBy || ""),
        }
      : data?.pdfUrl
        ? {
            pdfUrl: String(data.pdfUrl),
            generatedAt: String(data.pdfGeneratedAt || ""),
            generatedByName: String(data.generatedByName || ""),
          }
        : undefined;

  return {
    registrationId: String(data.registrationId || id),
    trackResolved:
      String(data.trackResolved || data.track || fallbackTrack).toLowerCase() === "secondary"
        ? "secondary"
        : "primary",
    formTypeResolved: mapFormTypeResolved(data.formTypeResolved || data.formType),
    warnings: Array.isArray(data.warnings)
      ? data.warnings.map((warning: any) => String(warning || "").trim()).filter(Boolean)
      : [],
    activePdf:
      activePdf && activePdf.pdfUrl
        ? activePdf
        : undefined,
    preview: {
      ...preview,
      studentName: String(preview.studentName || data.studentName || ""),
      totalPayment: Number(preview.totalPayment ?? data.tuitionAmount ?? 0),
      paymentQrUrl: String(preview.paymentQrUrl || preview.qrUrl || data.paymentQrUrl || ""),
    },
  };
}

async function requestEnrollmentConfirmationPdf(
  id: string,
  method: "GET" | "POST",
  options?: EnrollmentPdfRequestOptions,
): Promise<EnrollmentPdfPreviewResponse> {
  const accessToken = getAccessToken();
  const track = options?.track || "primary";
  const url = `${REGISTRATION_ENDPOINTS.ENROLLMENT_CONFIRMATION_PDF(id)}?${buildPdfQuery(options)}`;

  const response = await fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  if (!response.ok) {
    let message = "Không thể tải phiếu xác nhận ghi danh.";
    try {
      const errorPayload = await response.json();
      const detail = String(errorPayload?.detail || errorPayload?.message || "").trim();
      const title = String(errorPayload?.title || "").trim();
      if (detail) {
        message = translatePdfError(detail);
      } else if (title) {
        message = translatePdfError(title);
      }
    } catch {
      // Keep fallback message when payload is not JSON.
    }
    throw new Error(message);
  }

  const payload = await response.json();
  return mapPdfPreviewResponse(id, payload, track);
}

const PDF_ERROR_MESSAGES: Record<string, string> = {
  "No active enrollment was found": "Không tìm thấy đăng ký học đang hoạt động cho học viên này.",
  "Registration not found": "Không tìm thấy đăng ký.",
  "PDF generation failed": "Không thể tạo file PDF. Vui lòng thử lại.",
  "Unauthorized": "Bạn chưa đăng nhập hoặc phiên đã hết hạn.",
  "Forbidden": "Bạn không có quyền thực hiện thao tác này.",
};

function translatePdfError(message: string): string {
  for (const [key, viMessage] of Object.entries(PDF_ERROR_MESSAGES)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return viMessage;
    }
  }
  return message;
}

export async function getRegistrationEnrollmentConfirmationPdf(
  id: string,
  options?: EnrollmentPdfRequestOptions,
): Promise<EnrollmentConfirmationPdfResponse> {
  try {
    return await requestEnrollmentConfirmationPdf(id, "GET", options);
  } catch {
    // Backward compatibility when backend/proxy only supports POST.
    return requestEnrollmentConfirmationPdf(id, "POST", options);
  }
}

export async function generateRegistrationEnrollmentConfirmationPdf(
  id: string,
  options?: Omit<EnrollmentPdfRequestOptions, "regenerate">,
): Promise<EnrollmentConfirmationPdfResponse> {
  return requestEnrollmentConfirmationPdf(id, "POST", {
    ...options,
    regenerate: true,
  });
}

export async function getRegistrationEnrollmentConfirmationPdfHistory(
  id: string,
  options?: EnrollmentPdfHistoryOptions,
): Promise<PdfHistoryItem[]> {
  const accessToken = getAccessToken();
  const queryString = buildPdfHistoryQuery(options);
  const url = queryString
    ? `${REGISTRATION_ENDPOINTS.ENROLLMENT_CONFIRMATION_PDF_HISTORY(id)}?${queryString}`
    : REGISTRATION_ENDPOINTS.ENROLLMENT_CONFIRMATION_PDF_HISTORY(id);
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return [];
    }
    throw new Error("Không thể tải lịch sử phiếu PDF.");
  }

  const payload = await response.json();
  const data = payload?.data || payload || {};
  const historyContainer =
    data?.pdfs && typeof data.pdfs === "object"
      ? data.pdfs
      : data;

  const items = Array.isArray(historyContainer?.items)
    ? historyContainer.items
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data)
        ? data
        : [];

  return items
    .map((item: any) => ({
      pdfRecordId: String(item?.pdfRecordId || item?.id || ""),
      pdfUrl: String(item?.pdfUrl || ""),
      generatedAt: String(item?.generatedAt || item?.pdfGeneratedAt || ""),
      generatedByName: String(item?.generatedByName || item?.generatedBy || ""),
      isActive: Boolean(item?.isActive),
      classCode: String(item?.classCode || ""),
    }))
    .filter((item: PdfHistoryItem) => Boolean(item.pdfRecordId && item.pdfUrl));
}

export function validateRegistrationImportActiveSessions(input: {
  usedSessions: number;
  remainingSessions: number;
  totalSessions: number;
}) {
  const usedSessions = Number(input.usedSessions || 0);
  const remainingSessions = Number(input.remainingSessions || 0);
  const totalSessions = Number(input.totalSessions || 0);

  const isValid = usedSessions + remainingSessions === totalSessions;
  return {
    isValid,
    usedSessions,
    remainingSessions,
    totalSessions,
  };
}

export async function importActiveRegistration(
  payload: RegistrationImportActiveRequest,
): Promise<RegistrationActionResponse> {
  const response = await post<RegistrationActionResponse>(
    REGISTRATION_ENDPOINTS.IMPORT_ACTIVE,
    payload,
  );
  return ensureRegistrationActionSuccess(
    response,
    "Không thể import dữ liệu học viên đang học.",
  );
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
        classEnrollmentId: firstStudySessionRaw?.classEnrollmentId
          ? String(firstStudySessionRaw.classEnrollmentId)
          : firstStudySessionRaw?.enrollmentId
            ? String(firstStudySessionRaw.enrollmentId)
            : null,
        className:
          typeof firstStudySessionRaw?.className === "string"
            ? firstStudySessionRaw.className
            : null,
        sessionId: firstStudySessionRaw?.sessionId
          ? String(firstStudySessionRaw.sessionId)
          : firstStudySessionRaw?.classSessionId
            ? String(firstStudySessionRaw.classSessionId)
            : null,
        plannedDatetime:
          typeof firstStudySessionRaw?.plannedDatetime === "string"
            ? firstStudySessionRaw.plannedDatetime
            : typeof firstStudySessionRaw?.plannedDateTime === "string"
              ? firstStudySessionRaw.plannedDateTime
              : typeof firstStudySessionRaw?.sessionDate === "string"
                ? firstStudySessionRaw.sessionDate
                : null,
        studyDate:
          typeof firstStudySessionRaw?.studyDate === "string"
            ? firstStudySessionRaw.studyDate
            : typeof firstStudySessionRaw?.sessionDate === "string"
            ? firstStudySessionRaw.sessionDate
            : typeof firstStudySessionRaw?.firstStudyDate === "string"
              ? firstStudySessionRaw.firstStudyDate
              : typeof firstStudySessionRaw?.date === "string"
                ? firstStudySessionRaw.date
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
      classWeeklyScheduleSlots: Array.isArray(schedule?.classWeeklyScheduleSlots)
        ? schedule.classWeeklyScheduleSlots.map((slot: any) => ({
            dayOfWeek:
              typeof slot?.dayOfWeek === "string"
                ? slot.dayOfWeek
                : typeof slot?.dayCode === "string"
                  ? slot.dayCode
                  : undefined,
            dayCode: typeof slot?.dayCode === "string" ? slot.dayCode : undefined,
            startTime:
              typeof slot?.startTime === "string"
                ? slot.startTime
                : typeof slot?.startAt === "string"
                  ? slot.startAt
                  : undefined,
            durationMinutes:
              typeof slot?.durationMinutes === "number"
                ? slot.durationMinutes
                : typeof slot?.duration === "number"
                  ? slot.duration
                  : undefined,
          }))
        : [],
      weeklyPattern: Array.isArray(schedule?.weeklyPattern)
        ? schedule.weeklyPattern
            .map((entry: any) => {
              const dayOfWeeks = Array.isArray(entry?.dayOfWeeks)
                ? entry.dayOfWeeks
                    .map((day: any) => String(day || "").trim().toUpperCase())
                    .filter((day: string) => VALID_DAY_CODES.has(day))
                : [];
              const startTime = normalizeStartTime(entry?.startTime);
              const durationMinutes = Number(entry?.durationMinutes);
              if (!dayOfWeeks.length || !startTime) return null;
              return {
                dayOfWeeks,
                startTime,
                durationMinutes:
                  Number.isFinite(durationMinutes) && durationMinutes > 0
                    ? Math.floor(durationMinutes)
                    : 90,
              } as WeeklyPatternEntry;
            })
            .filter((entry: WeeklyPatternEntry | null): entry is WeeklyPatternEntry => Boolean(entry))
        : null,
      effectiveWeeklyPattern: Array.isArray(schedule?.effectiveWeeklyPattern)
        ? schedule.effectiveWeeklyPattern
            .map((entry: any) => {
              const dayOfWeeks = Array.isArray(entry?.dayOfWeeks)
                ? entry.dayOfWeeks
                    .map((day: any) => String(day || "").trim().toUpperCase())
                    .filter((day: string) => VALID_DAY_CODES.has(day))
                : [];
              const startTime = normalizeStartTime(entry?.startTime);
              const durationMinutes = Number(entry?.durationMinutes);
              if (!dayOfWeeks.length || !startTime) return null;
              return {
                dayOfWeeks,
                startTime,
                durationMinutes:
                  Number.isFinite(durationMinutes) && durationMinutes > 0
                    ? Math.floor(durationMinutes)
                    : 90,
              } as WeeklyPatternEntry;
            })
            .filter((entry: WeeklyPatternEntry | null): entry is WeeklyPatternEntry => Boolean(entry))
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
    schedulePattern: item?.schedulePattern ?? item?.classSchedulePattern ?? null,
    classSchedulePattern: item?.classSchedulePattern ?? null,
    effectiveSchedulePattern: item?.effectiveSchedulePattern ?? null,
    scheduleText: item?.scheduleText ?? item?.description ?? null,
    weeklyScheduleSlots: Array.isArray(item?.weeklyScheduleSlots)
      ? item.weeklyScheduleSlots.map((slot: any) => ({
          dayOfWeek:
            typeof slot?.dayOfWeek === "string"
              ? slot.dayOfWeek
              : typeof slot?.dayCode === "string"
                ? slot.dayCode
                : undefined,
          dayCode: typeof slot?.dayCode === "string" ? slot.dayCode : undefined,
          startTime:
            typeof slot?.startTime === "string"
              ? slot.startTime
              : typeof slot?.startAt === "string"
                ? slot.startAt
                : undefined,
          durationMinutes:
            typeof slot?.durationMinutes === "number"
              ? slot.durationMinutes
              : typeof slot?.duration === "number"
                ? slot.duration
                : undefined,
        }))
      : [],
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

export async function exportRegistrationEnrollmentConfirmationPdf(
  id: string,
): Promise<string> {
  const previewData = await generateRegistrationEnrollmentConfirmationPdf(id);
  const pdfUrl = previewData.activePdf?.pdfUrl || "";
  const studentName = previewData.preview?.studentName || "";
  if (!pdfUrl) {
    throw new Error("Không tìm thấy đường dẫn file PDF từ hệ thống.");
  }
  const { buildFileUrl } = await import("@/constants/apiURL");
  const downloadUrl = buildFileUrl(pdfUrl);
  const fileName = pdfUrl.split("/").pop() || `phieu-dang-ky-${studentName || id}.pdf`;

  if (typeof window !== "undefined") {
    const response = await fetch(downloadUrl);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  }

  return fileName;
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
  const normalizedTrack = normalizeTrackValue(payload?.track);
  const normalizedEntryType = normalizeEntryTypeValue(payload?.entryType);
  const hasExplicitWeeklyPatternNull =
    payload != null &&
    Object.prototype.hasOwnProperty.call(payload, "weeklyPattern") &&
    payload.weeklyPattern === null;
  const weeklyPattern =
    normalizeWeeklyPattern(payload?.weeklyPattern) ||
    parseWeeklyPatternFromSessionSelectionPattern(payload?.sessionSelectionPattern);

  const requestBody: Record<string, unknown> = {
    ...payload,
    track: normalizedTrack,
    entryType: normalizedEntryType,
  };

  if (hasExplicitWeeklyPatternNull) {
    requestBody.weeklyPattern = null;
  } else if (weeklyPattern && weeklyPattern.length > 0) {
    requestBody.weeklyPattern = weeklyPattern;
  }

  const response = await post<RegistrationActionResponse>(
    REGISTRATION_ENDPOINTS.ASSIGN_CLASS(id),
    requestBody,
  );
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
    weeklyPattern?: WeeklyPatternEntry[] | null;
  }
): Promise<RegistrationActionResponse> {
  const queryParams = new URLSearchParams({ newClassId });
  const normalizedTrack = options?.track ? normalizeTrackValue(options.track) : undefined;
  const normalizedSessionSelectionPattern = options?.sessionSelectionPattern?.trim() || undefined;
  const weeklyPattern =
    normalizeWeeklyPattern(options?.weeklyPattern) ||
    parseWeeklyPatternFromSessionSelectionPattern(normalizedSessionSelectionPattern);

  if (effectiveDate) queryParams.append("effectiveDate", effectiveDate);
  if (normalizedTrack) queryParams.append("track", normalizedTrack);
  if (normalizedSessionSelectionPattern) {
    queryParams.append("sessionSelectionPattern", normalizedSessionSelectionPattern);
  }

  const requestBody: Record<string, unknown> = {
    newClassId,
  };

  if (effectiveDate) requestBody.effectiveDate = effectiveDate;
  if (normalizedTrack) requestBody.track = normalizedTrack;
  if (normalizedSessionSelectionPattern) {
    requestBody.sessionSelectionPattern = normalizedSessionSelectionPattern;
  }
  if (weeklyPattern && weeklyPattern.length > 0) {
    requestBody.weeklyPattern = weeklyPattern;
  }

  const response = await post<RegistrationActionResponse>(
    `${REGISTRATION_ENDPOINTS.TRANSFER_CLASS(id)}?${queryParams.toString()}`,
    requestBody,
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
