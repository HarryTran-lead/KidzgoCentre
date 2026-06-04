import { REPORTS_V3_ENDPOINTS } from "@/constants/apiURL";
import { buildQueryString, type QueryParams } from "@/lib/api/queryString";
import { del, get, post, put } from "@/lib/axios";
import type {
  BranchDashboardResponse,
  ClassAcademicDashboardResponse,
  GenerateReportRequest,
  GenerateReportResponse,
  PagedResult,
  ParentReportViewResponse,
  PublishReportToParentResponse,
  RecommendationDto,
  ReportPeriodDto,
  ReportShareLogDto,
  ReportTemplateDto,
  RiskAlertDto,
  RiskRuleConfigDto,
  ShareCallbackRequest,
  ShareReportRequest,
  StudentReportDetailDto,
  StudentReportListItemDto,
} from "@/types/reports-v3";

type EnvelopeLike<T> = {
  data?: T | { data?: T } | { items?: T[] } | Record<string, unknown>;
  isSuccess?: boolean;
  success?: boolean;
};

type ListFilterParams = QueryParams;

const RECOMMENDATION_ROLE_BY_CODE: Record<string, string> = {
  "1": "teacher",
  "2": "academic_manager",
  "3": "cs",
  "4": "admin",
};

function unwrapData<T>(payload: unknown): T {
  const direct = payload as EnvelopeLike<T> | undefined;
  const level1 = direct?.data as unknown;
  const level2 = level1 && typeof level1 === "object" && !Array.isArray(level1)
    ? (level1 as { data?: T }).data
    : undefined;

  return (level2 ?? level1 ?? payload) as T;
}

function pickPagedResult<T>(payload: unknown): PagedResult<T> {
  const raw = unwrapData<Record<string, unknown> | T[] | undefined>(payload);

  if (Array.isArray(raw)) {
    return {
      items: raw as T[],
      total: raw.length,
      page: 1,
      pageSize: raw.length,
      hasNext: false,
    };
  }

  const record = (raw ?? {}) as Record<string, unknown>;
  const items = Array.isArray(record.items)
    ? (record.items as T[])
    : Array.isArray(record.data)
      ? (record.data as T[])
      : [];

  const page = Number(record.page ?? record.pageNumber ?? 1);
  const pageSize = Number((record.pageSize ?? record.limit ?? items.length) || 20);
  const total = Number(record.total ?? record.totalCount ?? items.length);
  const hasNext = typeof record.hasNext === "boolean"
    ? record.hasNext
    : page * pageSize < total;

  return {
    items,
    total,
    page,
    pageSize,
    hasNext,
  };
}

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function pickOptionalString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    if (typeof value === "boolean") continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return undefined;
}

function pickNullableString(...values: unknown[]): string | null | undefined {
  let hasNull = false;
  for (const value of values) {
    if (value === null) {
      hasNull = true;
      continue;
    }
    if (value === undefined) continue;
    if (typeof value === "boolean") continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return hasNull ? null : undefined;
}

function pickOptionalBoolean(...values: unknown[]): boolean | undefined {
  for (const value of values) {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") {
      const key = value.trim().toLowerCase();
      if (key === "true" || key === "1") return true;
      if (key === "false" || key === "0") return false;
    }
  }
  return undefined;
}

function pickOptionalNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value.trim());
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function normalizeRecommendationRole(value: unknown): string {
  const raw = pickOptionalString(value)?.toLowerCase() ?? "";
  if (!raw) return "teacher";
  return RECOMMENDATION_ROLE_BY_CODE[raw] || raw;
}

function normalizeRiskAlert(item: unknown): RiskAlertDto {
  const row = toRecord(item);
  const student = toRecord(row.student ?? row.studentProfile ?? row.profile);
  return {
    id: pickOptionalString(row.id, row.riskAlertId, row.alertId, row.key) || "",
    studentId: pickNullableString(row.studentId, row.studentProfileId),
    studentName: pickOptionalString(
      row.studentName,
      row.fullName,
      row.studentDisplayName,
      student.studentName,
      student.fullName,
      student.displayName,
      student.name,
    ),
    classId: pickNullableString(row.classId),
    className: pickOptionalString(row.className),
    branchId: pickNullableString(row.branchId),
    branchName: pickOptionalString(row.branchName),
    reportPeriodId: pickNullableString(row.reportPeriodId, row.periodId),
    riskType: pickOptionalString(row.riskType, row.type, row.recommendationType) || "UnknownRisk",
    severity: pickOptionalString(row.severity, row.priority, row.level) || "Low",
    reason: pickOptionalString(row.reason, row.content, row.message, row.description) || "Không có mô tả rủi ro.",
    source: pickNullableString(row.source, row.sourceType),
    status: pickOptionalString(row.status, row.state) || "Open",
    createdAt: pickOptionalString(row.createdAt),
    resolvedAt: pickNullableString(row.resolvedAt, row.completedAt, row.completed),
  };
}

function normalizeClassAcademicDashboard(payload: ClassAcademicDashboardResponse): ClassAcademicDashboardResponse {
  const pacing = toRecord(payload.classPacing);
  const weakStudentCount = Array.isArray(payload.weakStudents) ? payload.weakStudents.length : payload.weakStudents;
  const reviewRatio = pickOptionalNumber(pacing.reviewRatio, pacing.reviewRatioPercent);
  const actualProgress = pickOptionalNumber(pacing.actualProgress, pacing.actualProgressPercent);
  const plannedProgress = pickOptionalNumber(pacing.plannedProgress, pacing.plannedProgressPercent);

  return {
    ...payload,
    totalStudents: pickOptionalNumber(payload.totalStudents) ?? payload.totalStudents,
    riskStudents: pickOptionalNumber(payload.riskStudents, weakStudentCount, payload.delayedStudents) ?? payload.riskStudents,
    delayedStudents: pickOptionalNumber(payload.delayedStudents) ?? payload.delayedStudents,
    failedAssessments: pickOptionalNumber(payload.failedAssessments) ?? payload.failedAssessments,
    remedialRequired: pickOptionalNumber(payload.remedialRequired) ?? payload.remedialRequired,
    classPacing: payload.classPacing
      ? {
          ...payload.classPacing,
          reviewRatio: reviewRatio ?? payload.classPacing.reviewRatio,
          reviewRatioPercent: pickOptionalNumber(pacing.reviewRatioPercent, reviewRatio) ?? payload.classPacing.reviewRatioPercent,
          actualProgress: actualProgress ?? payload.classPacing.actualProgress,
          actualProgressPercent: pickOptionalNumber(pacing.actualProgressPercent, actualProgress) ?? payload.classPacing.actualProgressPercent,
          plannedProgress: plannedProgress ?? payload.classPacing.plannedProgress,
          plannedProgressPercent: pickOptionalNumber(pacing.plannedProgressPercent, plannedProgress) ?? payload.classPacing.plannedProgressPercent,
          curriculumDelayRisk:
            pickOptionalBoolean(pacing.curriculumDelayRisk) ?? payload.classPacing.curriculumDelayRisk,
        }
      : payload.classPacing,
    riskAlerts: Array.isArray(payload.riskAlerts) ? payload.riskAlerts.map(normalizeRiskAlert) : payload.riskAlerts,
    recommendations: Array.isArray(payload.recommendations)
      ? payload.recommendations.map(normalizeRecommendation)
      : payload.recommendations,
  };
}

function normalizeRecommendation(item: unknown): RecommendationDto {
  const row = toRecord(item);
  const completedAt = pickNullableString(row.completedAt, row.completed, row.resolvedAt);
  return {
    id: pickOptionalString(row.id, row.recommendationId, row.key) || "",
    studentId: pickNullableString(row.studentId, row.studentProfileId),
    studentName: pickOptionalString(row.studentName, row.fullName, row.studentDisplayName),
    classId: pickNullableString(row.classId),
    className: pickOptionalString(row.className),
    recommendationType: pickNullableString(row.recommendationType, row.type, row.riskType),
    content: pickOptionalString(row.content, row.reason, row.description) || "",
    priority: pickNullableString(row.priority),
    assignedRole: normalizeRecommendationRole(row.assignedRole ?? row.role ?? row.assigneeRole),
    status: pickOptionalString(row.status, row.state) || "Pending",
    dueAt: pickNullableString(row.dueAt),
    isOverdue: pickOptionalBoolean(row.isOverdue),
    createdAt: pickOptionalString(row.createdAt),
    completed: completedAt ?? null,
    completedAt,
  };
}

function normalizeReportListItem(item: StudentReportListItemDto): StudentReportListItemDto {
  return {
    ...item,
    studentId: String(item.studentId ?? "").trim(),
    classId: item.classId ?? undefined,
    branchId: item.branchId ?? undefined,
  };
}

function normalizeReportDetail(detail: StudentReportDetailDto): StudentReportDetailDto {
  return {
    ...detail,
    risks: Array.isArray(detail.risks) ? detail.risks.map(normalizeRiskAlert) : detail.risks,
    recommendations: Array.isArray(detail.recommendations)
      ? detail.recommendations.map(normalizeRecommendation)
      : detail.recommendations,
  };
}

function normalizeParentReport(response: ParentReportViewResponse): ParentReportViewResponse {
  return {
    ...response,
    recommendations: Array.isArray(response.recommendations)
      ? response.recommendations.map(normalizeRecommendation)
      : response.recommendations,
  };
}

function mapPagedItems<T>(result: PagedResult<T>, mapper: (item: T) => T): PagedResult<T> {
  return {
    ...result,
    items: result.items.map(mapper),
  };
}

export async function generateReport(payload: GenerateReportRequest): Promise<GenerateReportResponse> {
  return unwrapData<GenerateReportResponse>(await post(REPORTS_V3_ENDPOINTS.GENERATE, payload));
}

export async function getStudentReportById(reportId: string): Promise<StudentReportDetailDto> {
  return normalizeReportDetail(unwrapData<StudentReportDetailDto>(await get(REPORTS_V3_ENDPOINTS.BY_ID(reportId))));
}

export async function getStudentReports(
  studentId: string,
  params?: ListFilterParams,
): Promise<PagedResult<StudentReportListItemDto>> {
  return mapPagedItems(
    pickPagedResult<StudentReportListItemDto>(
      await get(`${REPORTS_V3_ENDPOINTS.STUDENT_REPORTS(studentId)}${buildQueryString(params)}`),
    ),
    normalizeReportListItem,
  );
}

export async function getLatestStudentReport(
  studentId: string,
  params?: Pick<ListFilterParams, "reportType">,
): Promise<StudentReportDetailDto> {
  return normalizeReportDetail(
    unwrapData<StudentReportDetailDto>(
      await get(`${REPORTS_V3_ENDPOINTS.STUDENT_REPORTS_LATEST(studentId)}${buildQueryString(params)}`),
    ),
  );
}

export async function getParentReport(studentId: string): Promise<ParentReportViewResponse> {
  return normalizeParentReport(
    unwrapData<ParentReportViewResponse>(await get(REPORTS_V3_ENDPOINTS.STUDENT_PARENT_REPORT(studentId))),
  );
}

export async function getStudentRecommendations(
  studentId: string,
  params?: ListFilterParams,
): Promise<PagedResult<RecommendationDto>> {
  return mapPagedItems(
    pickPagedResult<RecommendationDto>(
      await get(`${REPORTS_V3_ENDPOINTS.STUDENT_RECOMMENDATIONS(studentId)}${buildQueryString(params)}`),
    ),
    normalizeRecommendation,
  );
}

export async function getClassAcademicDashboard(
  classId: string,
  params?: Pick<ListFilterParams, "periodId">,
): Promise<ClassAcademicDashboardResponse> {
  const payload = unwrapData<ClassAcademicDashboardResponse>(
    await get(`${REPORTS_V3_ENDPOINTS.CLASS_ACADEMIC_DASHBOARD(classId)}${buildQueryString(params)}`),
  );

  return normalizeClassAcademicDashboard(payload);
}

export async function getClassRiskAlerts(
  classId: string,
  params?: ListFilterParams,
): Promise<PagedResult<RiskAlertDto>> {
  return mapPagedItems(
    pickPagedResult<RiskAlertDto>(
      await get(`${REPORTS_V3_ENDPOINTS.CLASS_RISK_ALERTS(classId)}${buildQueryString(params)}`),
    ),
    normalizeRiskAlert,
  );
}

export async function getBranchDashboard(branchId: string): Promise<BranchDashboardResponse> {
  return unwrapData<BranchDashboardResponse>(await get(REPORTS_V3_ENDPOINTS.BRANCH_DASHBOARD(branchId)));
}

export async function getReportPeriods(params?: ListFilterParams): Promise<PagedResult<ReportPeriodDto>> {
  return pickPagedResult<ReportPeriodDto>(
    await get(`${REPORTS_V3_ENDPOINTS.PERIODS}${buildQueryString(params)}`),
  );
}

export async function getReportPeriodById(periodId: string): Promise<ReportPeriodDto> {
  return unwrapData<ReportPeriodDto>(await get(REPORTS_V3_ENDPOINTS.PERIOD_BY_ID(periodId)));
}

export async function createReportPeriod(payload: Omit<ReportPeriodDto, "id">): Promise<ReportPeriodDto> {
  return unwrapData<ReportPeriodDto>(await post(REPORTS_V3_ENDPOINTS.PERIODS, payload));
}

export async function updateReportPeriod(periodId: string, payload: Omit<ReportPeriodDto, "id">): Promise<ReportPeriodDto> {
  return unwrapData<ReportPeriodDto>(await put(REPORTS_V3_ENDPOINTS.PERIOD_BY_ID(periodId), payload));
}

export async function deleteReportPeriod(periodId: string): Promise<void> {
  await del(REPORTS_V3_ENDPOINTS.PERIOD_BY_ID(periodId));
}

export async function getReportTemplates(params?: ListFilterParams): Promise<PagedResult<ReportTemplateDto>> {
  return pickPagedResult<ReportTemplateDto>(
    await get(`${REPORTS_V3_ENDPOINTS.TEMPLATES}${buildQueryString(params)}`),
  );
}

export async function getReportTemplateById(templateId: string): Promise<ReportTemplateDto> {
  return unwrapData<ReportTemplateDto>(await get(REPORTS_V3_ENDPOINTS.TEMPLATE_BY_ID(templateId)));
}

export async function createReportTemplate(payload: Omit<ReportTemplateDto, "id">): Promise<ReportTemplateDto> {
  return unwrapData<ReportTemplateDto>(await post(REPORTS_V3_ENDPOINTS.TEMPLATES, payload));
}

export async function updateReportTemplate(
  templateId: string,
  payload: Omit<ReportTemplateDto, "id">,
): Promise<ReportTemplateDto> {
  return unwrapData<ReportTemplateDto>(await put(REPORTS_V3_ENDPOINTS.TEMPLATE_BY_ID(templateId), payload));
}

export async function deleteReportTemplate(templateId: string): Promise<void> {
  await del(REPORTS_V3_ENDPOINTS.TEMPLATE_BY_ID(templateId));
}

export async function getRiskRuleConfigs(): Promise<RiskRuleConfigDto[]> {
  const payload = unwrapData<RiskRuleConfigDto[] | { items?: RiskRuleConfigDto[] }>(
    await get(REPORTS_V3_ENDPOINTS.RISK_RULES),
  );

  if (Array.isArray(payload)) {
    return payload;
  }

  return Array.isArray(payload?.items) ? payload.items : [];
}

export async function updateRiskRuleConfig(
  riskType: string,
  payload: Omit<RiskRuleConfigDto, "riskType">,
): Promise<RiskRuleConfigDto> {
  return unwrapData<RiskRuleConfigDto>(
    await put(REPORTS_V3_ENDPOINTS.RISK_RULE_BY_TYPE(riskType), payload),
  );
}

export async function publishReportToParent(reportId: string): Promise<PublishReportToParentResponse> {
  return unwrapData<PublishReportToParentResponse>(
    await post(REPORTS_V3_ENDPOINTS.PUBLISH_TO_PARENT(reportId)),
  );
}

export async function shareReport(
  reportId: string,
  payload: ShareReportRequest,
): Promise<ReportShareLogDto> {
  return unwrapData<ReportShareLogDto>(await post(REPORTS_V3_ENDPOINTS.SHARE(reportId), payload));
}

export async function shareReportCallback(payload: ShareCallbackRequest): Promise<ReportShareLogDto> {
  return unwrapData<ReportShareLogDto>(await post(REPORTS_V3_ENDPOINTS.SHARE_CALLBACK, payload));
}

export async function markReportViewed(reportId: string): Promise<ReportShareLogDto> {
  return unwrapData<ReportShareLogDto>(await post(REPORTS_V3_ENDPOINTS.MARK_VIEWED(reportId)));
}
