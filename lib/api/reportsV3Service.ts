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

export async function generateReport(payload: GenerateReportRequest): Promise<GenerateReportResponse> {
  return unwrapData<GenerateReportResponse>(await post(REPORTS_V3_ENDPOINTS.GENERATE, payload));
}

export async function getStudentReportById(reportId: string): Promise<StudentReportDetailDto> {
  return unwrapData<StudentReportDetailDto>(await get(REPORTS_V3_ENDPOINTS.BY_ID(reportId)));
}

export async function getStudentReports(
  studentId: string,
  params?: ListFilterParams,
): Promise<PagedResult<StudentReportListItemDto>> {
  return pickPagedResult<StudentReportListItemDto>(
    await get(`${REPORTS_V3_ENDPOINTS.STUDENT_REPORTS(studentId)}${buildQueryString(params)}`),
  );
}

export async function getLatestStudentReport(
  studentId: string,
  params?: Pick<ListFilterParams, "reportType">,
): Promise<StudentReportDetailDto> {
  return unwrapData<StudentReportDetailDto>(
    await get(`${REPORTS_V3_ENDPOINTS.STUDENT_REPORTS_LATEST(studentId)}${buildQueryString(params)}`),
  );
}

export async function getParentReport(studentId: string): Promise<ParentReportViewResponse> {
  return unwrapData<ParentReportViewResponse>(await get(REPORTS_V3_ENDPOINTS.STUDENT_PARENT_REPORT(studentId)));
}

export async function getStudentRecommendations(
  studentId: string,
  params?: ListFilterParams,
): Promise<PagedResult<RecommendationDto>> {
  return pickPagedResult<RecommendationDto>(
    await get(`${REPORTS_V3_ENDPOINTS.STUDENT_RECOMMENDATIONS(studentId)}${buildQueryString(params)}`),
  );
}

export async function getClassAcademicDashboard(
  classId: string,
  params?: Pick<ListFilterParams, "periodId">,
): Promise<ClassAcademicDashboardResponse> {
  return unwrapData<ClassAcademicDashboardResponse>(
    await get(`${REPORTS_V3_ENDPOINTS.CLASS_ACADEMIC_DASHBOARD(classId)}${buildQueryString(params)}`),
  );
}

export async function getClassRiskAlerts(
  classId: string,
  params?: ListFilterParams,
): Promise<PagedResult<RiskAlertDto>> {
  return pickPagedResult<RiskAlertDto>(
    await get(`${REPORTS_V3_ENDPOINTS.CLASS_RISK_ALERTS(classId)}${buildQueryString(params)}`),
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
