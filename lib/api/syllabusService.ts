import {
  BACKEND_SYLLABUS_ENDPOINTS,
  BRANCH_ENDPOINTS,
  buildApiUrl,
  SYLLABUS_ENDPOINTS,
} from "@/constants/apiURL";
import { getAccessToken } from "@/lib/store/authToken";

const DEFAULT_SYLLABUS_ARCHIVE_UPLOAD_API_URL = "https://rexengswagger.duckdns.org/api";
const SYLLABUS_ARCHIVE_UPLOAD_API_URL = (
  process.env.NEXT_PUBLIC_SYLLABUS_ARCHIVE_UPLOAD_API_URL ??
  process.env.NEXT_PUBLIC_BACKEND_UPLOAD_API_URL ??
  ""
).replace(/\/$/, "");

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
  lessonPlanTemplateSummaries?: SyllabusLessonPlanTemplateSummary[];
}

export interface SyllabusLessonPlanTemplateSummary {
  moduleId?: string | null;
  moduleCode?: string | null;
  moduleName?: string | null;
  moduleOrder?: number | null;
  plannedSessionCount?: number | null;
  syllabusSessionTemplateCount?: number | null;
  importedLessonPlanTemplateCount?: number | null;
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
  branchId?: string;
  overwriteExisting?: boolean;
}

export interface ImportSyllabusWordResult {
  syllabusId: string;
  importedUnits: number;
  importedLessons: number;
  importedResources: number;
  importedSessionTemplates: number;
}

export interface ImportedEntry {
  entryName?: string | null;
  fileName?: string | null;
  sourceFolder?: string | null;
  sourceType?: string | null;
  moduleId?: string | null;
  moduleName?: string | null;
  lessonPlanTemplateId?: string | null;
  sessionTemplateId?: string | null;
  sessionIndex?: number | null;
  sessionOrder?: number | null;
  lessonCode?: string | null;
  created?: boolean;
  title?: string | null;
}

export interface ImportSkippedItem {
  entryName?: string | null;
  fileName?: string | null;
  sourceFolder?: string | null;
  sourceType?: string | null;
  reason?: string | null;
  message?: string | null;
}

export interface ImportSyllabusArchiveResult {
  syllabusId: string;
  importedLessonPlans: number;
  skippedFiles: number;
  archiveFileName?: string | null;
  archiveParserVersion?: string | null;
  selectedSyllabusEntryName?: string | null;
  selectedSyllabusNormalizedEntryName?: string | null;
  selectedSyllabusFileName?: string | null;
  selectedSyllabusSourceType?: string | null;
  selectedSyllabusParserVersion?: string | null;
  importedEntries: ImportedEntry[];
  skippedItems: ImportSkippedItem[];
  skippedEntries: string[];
}

export interface ImportLessonPlanWordsResult {
  importedLessonPlans: number;
  skippedFiles: number;
  importedEntries: ImportedEntry[];
  skippedEntries: string[];
}

export interface ImportLessonPlanWordsParams {
  programId: string;
  levelId: string;
  syllabusId: string;
  overwriteExisting?: boolean;
  moduleId?: string;
}

export interface AssignSyllabusToBranchRequest {
  syllabusId: string;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  isActive: boolean;
}

export interface BranchSyllabusAssignment {
  curriculumAssignmentId?: string | null;
  syllabusId: string;
  syllabusCode?: string | null;
  syllabusTitle?: string | null;
  syllabusVersion?: string | null;
  programId?: string | null;
  programName?: string | null;
  levelId?: string | null;
  levelName?: string | null;
  unitCount?: number | null;
  sessionTemplateCount?: number | null;
  assignedAt?: string | null;
  isActive: boolean;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
}

// ─── Import Configuration Types ───────────────────────────────────────────────

export interface ImportConfigRule {
  id?: string;
  moduleId: string;
  moduleCode?: string | null;
  moduleName?: string | null;
  moduleOrder?: number | null;
  includeStarterUnit: boolean;
  unitFrom?: number | null;
  unitTo?: number | null;
  revisionNumber?: number | null;
  orderIndex: number;
  expectedLessonPlanCount?: number | null;
}

export interface ImportConfiguration {
  id: string;
  programId: string;
  levelId: string;
  regularUnitLessonPlanCount: number;
  starterUnitLessonPlanCount: number;
  revisionLessonPlanCount: number;
  isActive: boolean;
  rules: ImportConfigRule[];
}

export interface UpsertImportConfigRequest {
  regularUnitLessonPlanCount: number;
  starterUnitLessonPlanCount: number;
  revisionLessonPlanCount: number;
  isActive: boolean;
  rules: Array<{
    moduleId: string;
    includeStarterUnit: boolean;
    unitFrom?: number | null;
    unitTo?: number | null;
    revisionNumber?: number | null;
    orderIndex: number;
  }>;
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

export type SyllabusDocumentStatus = "Draft" | "Published" | "Archived";
export type SyllabusDocumentSourceType = "Manual" | "Imported" | "Hybrid";
export type SyllabusDocumentSectionType = "heading" | "narrative" | "list" | "table";

export interface SyllabusDocumentWarning {
  code: string;
  severity?: string | null;
  message?: string | null;
  sectionRef?: string | null;
  rowRef?: string | null;
  cellRef?: string | null;
}

export interface SyllabusDocumentSummary {
  totalUnits?: number | null;
  totalSessions?: number | null;
  totalLessons?: number | null;
  totalPeriods?: number | null;
  minutesPerPeriod?: number | null;
}

export interface SyllabusDocumentTableColumn {
  key: string;
  label?: string | null;
  width?: number | null;
  sticky?: boolean | null;
}

export interface SyllabusDocumentTableCell {
  columnKey: string;
  value?: string | null;
  rowSpan?: number | null;
  colSpan?: number | null;
  align?: string | null;
  bold?: boolean | null;
}

export interface SyllabusDocumentTableRowGroup {
  blockLabel?: string | null;
  topicGroupId?: string | null;
  topicRowSpan?: number | null;
}

export interface SyllabusDocumentTableRow {
  rowId: string;
  orderIndex?: number | null;
  group?: SyllabusDocumentTableRowGroup | null;
  cells: SyllabusDocumentTableCell[];
}

export interface SyllabusDocumentTable {
  columns: SyllabusDocumentTableColumn[];
  rows: SyllabusDocumentTableRow[];
}

export interface SyllabusDocumentSection {
  sectionId: string;
  type: SyllabusDocumentSectionType;
  title?: string | null;
  orderIndex?: number | null;
  editable?: boolean | null;
  content?: string | null;
  table?: SyllabusDocumentTable | null;
}

export interface SyllabusDocument {
  id: string;
  programId: string;
  levelId: string;
  code: string;
  title: string;
  edition?: string | null;
  status?: SyllabusDocumentStatus | null;
  sourceType?: SyllabusDocumentSourceType | null;
  sourceFileName?: string | null;
  attachmentUrl?: string | null;
  parserVersion?: string | null;
  version: number;
  summary?: SyllabusDocumentSummary | null;
  sections: SyllabusDocumentSection[];
  warnings: SyllabusDocumentWarning[];
}

export interface CreateManualSyllabusDocumentRequest {
  programId: string;
  levelId: string;
  code: string;
  title: string;
  edition?: string | null;
  status?: SyllabusDocumentStatus;
  sourceType?: SyllabusDocumentSourceType;
  minutesPerPeriod?: number | null;
}

export interface ImportSyllabusPreviewParams {
  programId: string;
  levelId: string;
}

export interface ImportSyllabusCommitParams {
  programId: string;
  levelId: string;
  code: string;
  title?: string | null;
  edition?: string | null;
  asDraft?: boolean;
}

export interface ImportSyllabusPreviewResult {
  document: SyllabusDocument;
  warnings: SyllabusDocumentWarning[];
}

export interface UpdateSyllabusDocumentMetadataRequest {
  expectedVersion: number;
  code?: string;
  title?: string;
  edition?: string | null;
  minutesPerPeriod?: number | null;
}

export interface CreateSyllabusSectionRequest {
  expectedVersion: number;
  section: {
    type: SyllabusDocumentSectionType;
    title?: string | null;
    orderIndex: number;
    content?: string | null;
  };
}

export interface UpdateSyllabusSectionRequest {
  expectedVersion: number;
  title?: string | null;
  content?: string | null;
}

export interface ReorderSyllabusSectionsRequest {
  expectedVersion: number;
  orders: Array<{ sectionId: string; orderIndex: number }>;
}

export interface UpdateSyllabusTableCellRequest {
  expectedVersion: number;
  value?: string | null;
  rowSpan?: number | null;
  colSpan?: number | null;
  align?: string | null;
  bold?: boolean | null;
}

export interface AddSyllabusTableRowRequest {
  expectedVersion: number;
  orderIndex: number;
  cells: Array<{ columnKey: string; value?: string | null }>;
}

export interface PublishOrArchiveSyllabusRequest {
  expectedVersion: number;
  reason?: string;
}

export interface UpdateSyllabusDocumentMetadataRequest {
  expectedVersion: number;
  code?: string;
  title?: string;
  edition?: string | null;
  minutesPerPeriod?: number | null;
}

export interface CreateSyllabusDocumentSectionRequest {
  expectedVersion: number;
  section: {
    type: SyllabusDocumentSectionType;
    title?: string | null;
    orderIndex: number;
    content?: string | null;
  };
}

export interface UpdateSyllabusDocumentSectionRequest {
  expectedVersion: number;
  title?: string | null;
  content?: string | null;
}

export interface ReorderSyllabusDocumentSectionsRequest {
  expectedVersion: number;
  orders: Array<{ sectionId: string; orderIndex: number }>;
}

export interface UpdateSyllabusDocumentCellRequest {
  expectedVersion: number;
  value?: string | null;
  rowSpan?: number | null;
  colSpan?: number | null;
  align?: string | null;
  bold?: boolean | null;
}

export interface CreateSyllabusDocumentRowRequest {
  expectedVersion: number;
  orderIndex: number;
  cells: Array<{ columnKey: string; value?: string | null }>;
}

export interface PublishSyllabusDocumentRequest {
  expectedVersion: number;
}

export interface ArchiveSyllabusDocumentRequest {
  expectedVersion: number;
  reason?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function buildArchiveUploadFallbackUrl(url: string): string {
  const isHttpsPage =
    typeof window !== "undefined" &&
    window.location.protocol === "https:";
  const uploadBase =
    isHttpsPage && /^http:\/\//i.test(SYLLABUS_ARCHIVE_UPLOAD_API_URL)
      ? DEFAULT_SYLLABUS_ARCHIVE_UPLOAD_API_URL
      : SYLLABUS_ARCHIVE_UPLOAD_API_URL || DEFAULT_SYLLABUS_ARCHIVE_UPLOAD_API_URL;
  const parsed = new URL(url);
  const pathnameWithoutApi = parsed.pathname.replace(/^\/api(?=\/|$)/i, "");
  return `${uploadBase}${pathnameWithoutApi}${parsed.search}`;
}

function buildDirectBackendUrl(endpoint: string, options?: { useArchiveUploadFallback?: boolean }): string | null {
  const url = buildApiUrl(endpoint);
  if (!/^https?:\/\//i.test(url)) return null;

  const isHttpsPage =
    typeof window !== "undefined" &&
    window.location.protocol === "https:";

  if (isHttpsPage && /^http:\/\//i.test(url)) {
    return options?.useArchiveUploadFallback ? buildArchiveUploadFallbackUrl(url) : null;
  }

  return url;
}

function strAny(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function num(v: unknown): number | null {
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function bool(v: unknown): boolean | null {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const lowered = v.trim().toLowerCase();
    if (lowered === "true") return true;
    if (lowered === "false") return false;
  }
  return null;
}

function normalizeSyllabusListItem(item: unknown): SyllabusListItem {
  const source = (item ?? {}) as Record<string, unknown>;
  return {
    id: strAny(source.id, source.syllabusId, source.Id, source.SyllabusId),
    programId: strAny(source.programId, source.ProgramId),
    programName: strAny(source.programName, source.ProgramName) || null,
    levelId: strAny(source.levelId, source.LevelId),
    levelName: strAny(source.levelName, source.LevelName) || null,
    code: strAny(source.code, source.Code),
    version: strAny(source.version, source.Version, source.edition, source.Edition),
    title: strAny(source.title, source.Title),
    isActive: typeof source.isActive === "boolean" ? source.isActive : Boolean(source.IsActive),
    unitCount: num(source.unitCount ?? source.UnitCount),
    sessionTemplateCount: num(source.sessionTemplateCount ?? source.SessionTemplateCount),
    createdAt: strAny(source.createdAt, source.CreatedAt) || null,
  };
}

function normalizeSyllabusDetail(item: unknown): SyllabusDetail {
  const source = (item ?? {}) as Record<string, unknown>;
  const summariesSource = source.lessonPlanTemplateSummaries ?? source.LessonPlanTemplateSummaries;
  return {
    ...normalizeSyllabusListItem(source),
    edition: strAny(source.edition, source.Edition) || null,
    effectiveFrom: strAny(source.effectiveFrom, source.EffectiveFrom) || null,
    effectiveTo: strAny(source.effectiveTo, source.EffectiveTo) || null,
    pacingSchemeJson: strAny(source.pacingSchemeJson, source.PacingSchemeJson) || null,
    overview: strAny(source.overview, source.Overview) || null,
    overallObjectives: strAny(source.overallObjectives, source.OverallObjectives) || null,
    specificObjectives: strAny(source.specificObjectives, source.SpecificObjectives) || null,
    ethicsAndAttitudes: strAny(source.ethicsAndAttitudes, source.EthicsAndAttitudes) || null,
    bookOverview: strAny(source.bookOverview, source.BookOverview) || null,
    totalPeriods: num(source.totalPeriods ?? source.TotalPeriods),
    minutesPerPeriod: num(source.minutesPerPeriod ?? source.MinutesPerPeriod),
    totalLessons: num(source.totalLessons ?? source.TotalLessons),
    sourceFileName: strAny(source.sourceFileName, source.SourceFileName) || null,
    attachmentUrl: strAny(source.attachmentUrl, source.AttachmentUrl) || null,
    rawContentJson: strAny(source.rawContentJson, source.RawContentJson) || null,
    units: Array.isArray(source.units) ? source.units : Array.isArray(source.Units) ? source.Units : [],
    lessons: Array.isArray(source.lessons) ? source.lessons : Array.isArray(source.Lessons) ? source.Lessons : [],
    resources: Array.isArray(source.resources) ? source.resources : Array.isArray(source.Resources) ? source.Resources : [],
    sessionTemplates: Array.isArray(source.sessionTemplates)
      ? source.sessionTemplates
      : Array.isArray(source.SessionTemplates)
        ? source.SessionTemplates
        : [],
    lessonPlanTemplateSummaries: Array.isArray(summariesSource)
      ? summariesSource.map((summary) => {
          const s = (summary ?? {}) as Record<string, unknown>;
          return {
            moduleId: strAny(s.moduleId, s.ModuleId) || null,
            moduleCode: strAny(s.moduleCode, s.ModuleCode) || null,
            moduleName: strAny(s.moduleName, s.ModuleName) || null,
            moduleOrder: num(s.moduleOrder ?? s.ModuleOrder),
            plannedSessionCount: num(s.plannedSessionCount ?? s.PlannedSessionCount),
            syllabusSessionTemplateCount: num(s.syllabusSessionTemplateCount ?? s.SyllabusSessionTemplateCount),
            importedLessonPlanTemplateCount: num(s.importedLessonPlanTemplateCount ?? s.ImportedLessonPlanTemplateCount),
          };
        })
      : [],
  };
}

function normalizeDocumentWarning(item: unknown): SyllabusDocumentWarning {
  const source = (item ?? {}) as Record<string, unknown>;
  return {
    code: strAny(source.code, source.Code),
    severity: strAny(source.severity, source.Severity) || null,
    message: strAny(source.message, source.Message) || null,
    sectionRef: strAny(source.sectionRef, source.SectionRef) || null,
    rowRef: strAny(source.rowRef, source.RowRef) || null,
    cellRef: strAny(source.cellRef, source.CellRef) || null,
  };
}

function normalizeDocumentCell(item: unknown): SyllabusDocumentTableCell {
  const source = (item ?? {}) as Record<string, unknown>;
  return {
    columnKey: strAny(source.columnKey, source.ColumnKey, source.columnId, source.ColumnId, source.key, source.Key),
    value: strAny(source.value, source.Value, source.content, source.Content, source.text, source.Text) || null,
    rowSpan: num(source.rowSpan ?? source.RowSpan),
    colSpan: num(source.colSpan ?? source.ColSpan),
    align: strAny(source.align, source.Align) || null,
    bold: bool(source.bold ?? source.Bold),
  };
}

function normalizeDocumentRow(
  item: unknown,
  columns: SyllabusDocumentTableColumn[] = [],
): SyllabusDocumentTableRow {
  const source = (item ?? {}) as Record<string, unknown>;
  const groupObj = ((source.group ?? source.Group) ?? null) as Record<string, unknown> | null;
  const valuesSource = source.values ?? source.Values;
  const cellsSource = source.cells ?? source.Cells ?? source.items ?? source.Items ?? valuesSource;

  let normalizedCells = Array.isArray(cellsSource)
    ? (cellsSource as unknown[])
        .map((cell: unknown, index) => {
          if (cell && typeof cell === "object") return normalizeDocumentCell(cell);
          const column = columns[index];
          return {
            columnKey: column?.key ?? `col-${index + 1}`,
            value: strAny(cell) || null,
            rowSpan: null,
            colSpan: null,
            align: null,
            bold: null,
          } satisfies SyllabusDocumentTableCell;
        })
        .filter((cell) => cell.columnKey || cell.value)
    : [];

  if (normalizedCells.length === 0 && columns.length > 0) {
    normalizedCells = columns.map((column) => {
      const byKey = source[column.key];
      const byLowerKey = source[column.key.toLowerCase()];
      const byLabel = column.label ? source[column.label] : undefined;
      const value = strAny(byKey, byLowerKey, byLabel);

      return {
        columnKey: column.key,
        value: value || null,
        rowSpan: null,
        colSpan: null,
        align: null,
        bold: null,
      } satisfies SyllabusDocumentTableCell;
    });
  }

  return {
    rowId: strAny(source.rowId, source.RowId),
    orderIndex: num(source.orderIndex ?? source.OrderIndex),
    group: groupObj
      ? {
          blockLabel: strAny(groupObj.blockLabel, groupObj.BlockLabel) || null,
          topicGroupId: strAny(groupObj.topicGroupId, groupObj.TopicGroupId) || null,
          topicRowSpan: num(groupObj.topicRowSpan ?? groupObj.TopicRowSpan),
        }
      : null,
    cells: normalizedCells,
  };
}

function normalizeDocumentSection(item: unknown): SyllabusDocumentSection {
  const source = (item ?? {}) as Record<string, unknown>;
  const tableObj = ((source.table ?? source.Table) ?? null) as Record<string, unknown> | null;
  const normalizedType = strAny(source.type, source.Type).toLowerCase();

  const rawColumns = tableObj
    ? (tableObj.columns ?? tableObj.Columns ?? tableObj.headers ?? tableObj.Headers ?? tableObj.columnDefinitions ?? tableObj.ColumnDefinitions)
    : null;
  const columns: SyllabusDocumentTableColumn[] = Array.isArray(rawColumns)
    ? (rawColumns as unknown[])
        .map((column, index) => {
          const col = (column ?? {}) as Record<string, unknown>;
          const key = strAny(col.key, col.Key, col.columnKey, col.ColumnKey) || `col-${index + 1}`;
          return {
            key,
            label: strAny(col.label, col.Label, col.title, col.Title, col.name, col.Name) || key,
            width: num(col.width ?? col.Width),
            sticky: bool(col.sticky ?? col.Sticky),
          };
        })
        .filter((col) => col.key)
    : [];

  const rawRows = tableObj
    ? (tableObj.rows ?? tableObj.Rows ?? tableObj.dataRows ?? tableObj.DataRows ?? tableObj.body ?? tableObj.Body ?? tableObj.items ?? tableObj.Items)
    : null;
  const rows: SyllabusDocumentTableRow[] = Array.isArray(rawRows)
    ? (rawRows as unknown[]).map((row) => normalizeDocumentRow(row, columns))
    : [];

  const hasTable = columns.length > 0 && rows.length > 0;
  const type: SyllabusDocumentSectionType =
    normalizedType === "heading" || normalizedType === "narrative" || normalizedType === "list" || normalizedType === "table"
      ? normalizedType
      : hasTable
        ? "table"
        : "narrative";

  return {
    sectionId: strAny(source.sectionId, source.SectionId),
    type,
    title: strAny(source.title, source.Title) || null,
    orderIndex: num(source.orderIndex ?? source.OrderIndex),
    editable: bool(source.editable ?? source.Editable),
    content: strAny(source.content, source.Content) || null,
    table: tableObj
      ? {
          columns,
          rows,
        }
      : null,
  };
}

function normalizeSyllabusDocument(item: unknown): SyllabusDocument | null {
  const source = (item ?? {}) as Record<string, unknown>;
  const id = strAny(source.id, source.Id);
  const code = strAny(source.code, source.Code);
  const title = strAny(source.title, source.Title);
  if (!code || !title) return null;

  const sectionsSource = source.sections ?? source.Sections;
  const warningsSource = source.warnings ?? source.Warnings;
  const summarySource = ((source.summary ?? source.Summary) ?? null) as Record<string, unknown> | null;

  return {
    id,
    programId: strAny(source.programId, source.ProgramId),
    levelId: strAny(source.levelId, source.LevelId),
    code,
    title,
    edition: strAny(source.edition, source.Edition) || null,
    status: (strAny(source.status, source.Status) || null) as SyllabusDocumentStatus | null,
    sourceType: (strAny(source.sourceType, source.SourceType) || null) as SyllabusDocumentSourceType | null,
    sourceFileName: strAny(source.sourceFileName, source.SourceFileName) || null,
    attachmentUrl: strAny(source.attachmentUrl, source.AttachmentUrl) || null,
    parserVersion: strAny(source.parserVersion, source.ParserVersion) || null,
    version: Number(source.version ?? source.Version ?? 1),
    summary: summarySource
      ? {
          totalUnits: num(summarySource.totalUnits ?? summarySource.TotalUnits),
          totalSessions: num(summarySource.totalSessions ?? summarySource.TotalSessions),
          totalLessons: num(summarySource.totalLessons ?? summarySource.TotalLessons),
          totalPeriods: num(summarySource.totalPeriods ?? summarySource.TotalPeriods),
          minutesPerPeriod: num(summarySource.minutesPerPeriod ?? summarySource.MinutesPerPeriod),
        }
      : null,
    sections: Array.isArray(sectionsSource) ? sectionsSource.map((section) => normalizeDocumentSection(section)) : [],
    warnings: Array.isArray(warningsSource) ? warningsSource.map((warning) => normalizeDocumentWarning(warning)) : [],
  };
}

function errorResponse<T>(data: T, error: unknown): ServiceResponse<T> {
  const errObj = (error ?? {}) as {
    message?: unknown;
    response?: { data?: unknown; status?: unknown };
    data?: unknown;
  };
  const payloadRaw = errObj.response?.data ?? errObj.data;
  const payload = (payloadRaw && typeof payloadRaw === "object" ? payloadRaw : {}) as Record<string, unknown>;
  const statusFromPayload = typeof payload.status === "number" ? payload.status : undefined;
  return {
    isSuccess: false,
    data,
    message: str(payload.detail) || str(payload.error) || str(payload.message) || str(payload.title) || str(errObj.message) || "Request failed",
    status:
      typeof errObj.response?.status === "number"
        ? errObj.response.status
        : typeof statusFromPayload === "number"
          ? statusFromPayload
          : undefined,
    title: str(payload.title) || undefined,
    detail: str(payload.detail) || undefined,
    errors: Array.isArray(payload.errors) ? payload.errors : undefined,
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
  const token = getAccessToken();
  if (!token) return { isSuccess: false, data: emptyPagination(), message: "Chưa đăng nhập." };

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
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
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
  const token = getAccessToken();
  if (!token) return { isSuccess: false, data: null, message: "Chưa đăng nhập." };

  try {
    const res = await fetch(SYLLABUS_ENDPOINTS.BY_ID(id), { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return errorResponse(null, json);

    const payload = json?.data ?? json;
    const item =
      payload?.syllabus ??
      payload?.Syllabus ??
      payload?.item ??
      payload?.Item ??
      payload;
    const normalized = item && (item.id || item.Id || item.syllabusId || item.SyllabusId || item.code || item.Code)
      ? normalizeSyllabusDetail(item)
      : null;
    return { isSuccess: true, data: normalized, message: normalized ? undefined : "Không tìm thấy dữ liệu." };
  } catch (error) {
    return errorResponse(null, error);
  }
}

export async function createSyllabus(
  data: CreateSyllabusRequest,
): Promise<ServiceResponse<SyllabusListItem | null>> {
  const token = getAccessToken();
  if (!token) return { isSuccess: false, data: null, message: "Chưa đăng nhập." };

  try {
    const res = await fetch(SYLLABUS_ENDPOINTS.BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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

export async function createManualSyllabusDocument(
  data: CreateManualSyllabusDocumentRequest,
): Promise<ServiceResponse<SyllabusDocument | null>> {
  const token = getAccessToken();
  if (!token) return { isSuccess: false, data: null, message: "Chưa đăng nhập." };

  try {
    const res = await fetch(SYLLABUS_ENDPOINTS.BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        ...data,
        status: data.status ?? "Draft",
        sourceType: data.sourceType ?? "Manual",
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return errorResponse(null, { response: res, data: json });

    const payload = json?.data ?? json;
    const doc = normalizeSyllabusDocument(payload);
    return { isSuccess: true, data: doc };
  } catch (error) {
    return errorResponse(null, error);
  }
}

export async function getSyllabusDocument(
  syllabusId: string,
): Promise<ServiceResponse<SyllabusDocument | null>> {
  const token = getAccessToken();
  if (!token) return { isSuccess: false, data: null, message: "Chưa đăng nhập." };

  try {
    const res = await fetch(SYLLABUS_ENDPOINTS.DOCUMENT(syllabusId), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return errorResponse(null, { response: res, data: json });
    const payload = json?.data ?? json;
    const candidates = [
      payload,
      payload?.document,
      payload?.Document,
      payload?.syllabus,
      payload?.Syllabus,
      payload?.item,
      payload?.Item,
      payload?.syllabusDocument,
      payload?.SyllabusDocument,
    ];

    const normalized = candidates
      .map((candidate) => normalizeSyllabusDocument(candidate))
      .find((doc) => doc != null) ?? null;

    return { isSuccess: true, data: normalized };
  } catch (error) {
    return errorResponse(null, error);
  }
}

export async function importSyllabusPreview(
  params: ImportSyllabusPreviewParams,
  file: File,
): Promise<ServiceResponse<ImportSyllabusPreviewResult | null>> {
  const token = getAccessToken();
  if (!token) return { isSuccess: false, data: null, message: "Chưa đăng nhập." };

  try {
    const formData = new FormData();
    formData.append("programId", params.programId);
    formData.append("levelId", params.levelId);
    formData.append("file", file);

    const res = await fetch(SYLLABUS_ENDPOINTS.IMPORT_PREVIEW, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return errorResponse(null, { response: res, data: json });

    const payload = json?.data ?? json;
    const doc = normalizeSyllabusDocument(payload?.document ?? payload?.Document);
    const warningsSource = payload?.warnings ?? payload?.Warnings;
    return {
      isSuccess: true,
      data: doc
        ? {
            document: doc,
            warnings: Array.isArray(warningsSource)
              ? (warningsSource as unknown[]).map((warning) => normalizeDocumentWarning(warning))
              : doc.warnings,
          }
        : null,
    };
  } catch (error) {
    return errorResponse(null, error);
  }
}

export async function importSyllabusCommit(
  params: ImportSyllabusCommitParams,
  file: File,
): Promise<ServiceResponse<SyllabusDocument | null>> {
  const token = getAccessToken();
  if (!token) return { isSuccess: false, data: null, message: "Chưa đăng nhập." };

  try {
    const formData = new FormData();
    formData.append("programId", params.programId);
    formData.append("levelId", params.levelId);
    formData.append("code", params.code);
    if (params.title) formData.append("title", params.title);
    if (params.edition) formData.append("edition", params.edition);
    formData.append("asDraft", String(params.asDraft ?? true));
    formData.append("file", file);

    const res = await fetch(SYLLABUS_ENDPOINTS.IMPORT_COMMIT, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return errorResponse(null, { response: res, data: json });

    const payload = json?.data ?? json;
    const candidates = [
      payload,
      payload?.document,
      payload?.Document,
      payload?.syllabus,
      payload?.Syllabus,
      payload?.item,
      payload?.Item,
      payload?.syllabusDocument,
      payload?.SyllabusDocument,
    ];

    const normalized = candidates
      .map((candidate) => normalizeSyllabusDocument(candidate))
      .find((doc) => doc != null) ?? null;

    return { isSuccess: true, data: normalized };
  } catch (error) {
    return errorResponse(null, error);
  }
}

export async function updateSyllabusDocumentMetadata(
  syllabusId: string,
  body: UpdateSyllabusDocumentMetadataRequest,
): Promise<ServiceResponse<SyllabusDocument | null>> {
  const token = getAccessToken();
  if (!token) return { isSuccess: false, data: null, message: "Chưa đăng nhập." };

  try {
    const res = await fetch(SYLLABUS_ENDPOINTS.METADATA(syllabusId), {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return errorResponse(null, { response: res, data: json });
    const payload = json?.data ?? json;
    return { isSuccess: true, data: normalizeSyllabusDocument(payload) };
  } catch (error) {
    return errorResponse(null, error);
  }
}

export async function addSyllabusSection(
  syllabusId: string,
  body: CreateSyllabusSectionRequest,
): Promise<ServiceResponse<SyllabusDocument | null>> {
  const token = getAccessToken();
  if (!token) return { isSuccess: false, data: null, message: "Chưa đăng nhập." };

  try {
    const res = await fetch(SYLLABUS_ENDPOINTS.SECTIONS(syllabusId), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return errorResponse(null, { response: res, data: json });
    const payload = json?.data ?? json;
    return { isSuccess: true, data: normalizeSyllabusDocument(payload) };
  } catch (error) {
    return errorResponse(null, error);
  }
}

export async function updateSyllabusSection(
  syllabusId: string,
  sectionId: string,
  body: UpdateSyllabusSectionRequest,
): Promise<ServiceResponse<SyllabusDocument | null>> {
  const token = getAccessToken();
  if (!token) return { isSuccess: false, data: null, message: "Chưa đăng nhập." };

  try {
    const res = await fetch(SYLLABUS_ENDPOINTS.SECTION_BY_ID(syllabusId, sectionId), {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return errorResponse(null, { response: res, data: json });
    const payload = json?.data ?? json;
    return { isSuccess: true, data: normalizeSyllabusDocument(payload) };
  } catch (error) {
    return errorResponse(null, error);
  }
}

export async function reorderSyllabusSections(
  syllabusId: string,
  body: ReorderSyllabusSectionsRequest,
): Promise<ServiceResponse<SyllabusDocument | null>> {
  const token = getAccessToken();
  if (!token) return { isSuccess: false, data: null, message: "Chưa đăng nhập." };

  try {
    const res = await fetch(SYLLABUS_ENDPOINTS.REORDER_SECTIONS(syllabusId), {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return errorResponse(null, { response: res, data: json });
    const payload = json?.data ?? json;
    return { isSuccess: true, data: normalizeSyllabusDocument(payload) };
  } catch (error) {
    return errorResponse(null, error);
  }
}

export async function updateSyllabusTableCell(
  syllabusId: string,
  sectionId: string,
  rowId: string,
  columnKey: string,
  body: UpdateSyllabusTableCellRequest,
): Promise<ServiceResponse<SyllabusDocument | null>> {
  const token = getAccessToken();
  if (!token) return { isSuccess: false, data: null, message: "Chưa đăng nhập." };

  try {
    const res = await fetch(SYLLABUS_ENDPOINTS.TABLE_CELL(syllabusId, sectionId, rowId, columnKey), {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return errorResponse(null, { response: res, data: json });
    const payload = json?.data ?? json;
    return { isSuccess: true, data: normalizeSyllabusDocument(payload) };
  } catch (error) {
    return errorResponse(null, error);
  }
}

export async function addSyllabusTableRow(
  syllabusId: string,
  sectionId: string,
  body: AddSyllabusTableRowRequest,
): Promise<ServiceResponse<SyllabusDocument | null>> {
  const token = getAccessToken();
  if (!token) return { isSuccess: false, data: null, message: "Chưa đăng nhập." };

  try {
    const res = await fetch(SYLLABUS_ENDPOINTS.TABLE_ROWS(syllabusId, sectionId), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return errorResponse(null, { response: res, data: json });
    const payload = json?.data ?? json;
    return { isSuccess: true, data: normalizeSyllabusDocument(payload) };
  } catch (error) {
    return errorResponse(null, error);
  }
}

export async function deleteSyllabusTableRow(
  syllabusId: string,
  sectionId: string,
  rowId: string,
  expectedVersion: number,
): Promise<ServiceResponse<SyllabusDocument | null>> {
  const token = getAccessToken();
  if (!token) return { isSuccess: false, data: null, message: "Chưa đăng nhập." };

  try {
    const url = `${SYLLABUS_ENDPOINTS.TABLE_ROWS(syllabusId, sectionId)}/${encodeURIComponent(rowId)}?expectedVersion=${encodeURIComponent(String(expectedVersion))}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return errorResponse(null, { response: res, data: json });
    const payload = json?.data ?? json;
    return { isSuccess: true, data: normalizeSyllabusDocument(payload) };
  } catch (error) {
    return errorResponse(null, error);
  }
}

export async function publishSyllabusDocument(
  syllabusId: string,
  body: PublishOrArchiveSyllabusRequest,
): Promise<ServiceResponse<SyllabusDocument | null>> {
  const token = getAccessToken();
  if (!token) return { isSuccess: false, data: null, message: "Chưa đăng nhập." };

  try {
    const res = await fetch(SYLLABUS_ENDPOINTS.PUBLISH(syllabusId), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return errorResponse(null, { response: res, data: json });
    const payload = json?.data ?? json;
    return { isSuccess: true, data: normalizeSyllabusDocument(payload) };
  } catch (error) {
    return errorResponse(null, error);
  }
}

export async function archiveSyllabusDocument(
  syllabusId: string,
  body: PublishOrArchiveSyllabusRequest,
): Promise<ServiceResponse<SyllabusDocument | null>> {
  const token = getAccessToken();
  if (!token) return { isSuccess: false, data: null, message: "Chưa đăng nhập." };

  try {
    const res = await fetch(SYLLABUS_ENDPOINTS.ARCHIVE(syllabusId), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return errorResponse(null, { response: res, data: json });
    const payload = json?.data ?? json;
    return { isSuccess: true, data: normalizeSyllabusDocument(payload) };
  } catch (error) {
    return errorResponse(null, error);
  }
}

export async function updateSyllabus(
  id: string,
  data: UpdateSyllabusRequest,
): Promise<ServiceResponse<SyllabusListItem | null>> {
  const token = getAccessToken();
  if (!token) return { isSuccess: false, data: null, message: "Chưa đăng nhập." };

  try {
    const res = await fetch(SYLLABUS_ENDPOINTS.BY_ID(id), {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
    if (params.branchId) query.append("branchId", params.branchId);
    if (params.overwriteExisting !== undefined) {
      query.append("overwriteExisting", String(params.overwriteExisting));
    }
    const formData = new FormData();
    formData.append("file", file);

    const directBackendUrl = buildDirectBackendUrl(
      `${BACKEND_SYLLABUS_ENDPOINTS.IMPORT_ARCHIVE}?${query}`,
      { useArchiveUploadFallback: true },
    );
    const importUrl =
      directBackendUrl ?? `${SYLLABUS_ENDPOINTS.IMPORT_ARCHIVE}?${query}`;

    const res = await fetch(importUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const tooLargeMessage =
        res.status === 413
          ? `File ZIP (${Math.ceil(file.size / 1024 / 1024)} MB) vượt quá giới hạn upload của server.`
          : "";

      return {
        isSuccess: false, data: null,
        message: str(json?.detail) || str(json?.message) || str(json?.title) || tooLargeMessage || "Import archive thất bại.",
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
        archiveFileName: str(d?.archiveFileName) || null,
        archiveParserVersion: str(d?.archiveParserVersion) || null,
        selectedSyllabusEntryName: str(d?.selectedSyllabusEntryName) || null,
        selectedSyllabusNormalizedEntryName: str(d?.selectedSyllabusNormalizedEntryName) || null,
        selectedSyllabusFileName: str(d?.selectedSyllabusFileName) || null,
        selectedSyllabusSourceType: str(d?.selectedSyllabusSourceType) || null,
        selectedSyllabusParserVersion: str(d?.selectedSyllabusParserVersion) || null,
        importedEntries: Array.isArray(d?.importedEntries) ? d.importedEntries : [],
        skippedItems: Array.isArray(d?.skippedItems) ? d.skippedItems : [],
        skippedEntries: Array.isArray(d?.skippedEntries) ? d.skippedEntries : [],
      },
    };
  } catch (error) {
    if (error instanceof TypeError && /fetch/i.test(error.message)) {
      return {
        isSuccess: false,
        data: null,
        message:
          "Không gửi được file ZIP tới backend. Nếu đang ở production HTTPS, hãy kiểm tra URL upload HTTPS/CORS của backend.",
        detail:
          "Trình duyệt đã chặn hoặc không kết nối được request upload. FE hiện ưu tiên NEXT_PUBLIC_SYLLABUS_ARCHIVE_UPLOAD_API_URL, sau đó dùng https://rexengswagger.duckdns.org/api để tránh mixed-content.",
      };
    }
    return errorResponse(null, error);
  }
}

export async function importLessonPlanWords(
  params: ImportLessonPlanWordsParams,
  files: File[],
): Promise<ServiceResponse<ImportLessonPlanWordsResult | null>> {
  const token = getAccessToken();
  if (!token) return { isSuccess: false, data: null, message: "Chưa đăng nhập." };

  try {
    const query = new URLSearchParams({
      programId: params.programId,
      levelId: params.levelId,
      syllabusId: params.syllabusId,
      overwriteExisting: String(params.overwriteExisting ?? true),
    });
    if (params.moduleId) query.append("moduleId", params.moduleId);

    const formData = new FormData();
    for (const file of files) formData.append("files", file);

    const res = await fetch(`${SYLLABUS_ENDPOINTS.IMPORT_LESSON_PLAN_WORDS}?${query}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        isSuccess: false,
        data: null,
        message: str(json?.detail) || str(json?.message) || str(json?.title) || "Import lesson plan thất bại.",
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
        importedLessonPlans: Number(d?.importedLessonPlans ?? 0),
        skippedFiles: Number(d?.skippedFiles ?? 0),
        importedEntries: Array.isArray(d?.importedEntries) ? d.importedEntries : [],
        skippedEntries: Array.isArray(d?.skippedEntries) ? d.skippedEntries : [],
      },
    };
  } catch (error) {
    return errorResponse(null, error);
  }
}

export async function assignSyllabusToBranch(
  branchId: string,
  body: AssignSyllabusToBranchRequest,
): Promise<ServiceResponse<null>> {
  const token = getAccessToken();
  if (!token) return { isSuccess: false, data: null, message: "Chưa đăng nhập." };

  try {
    const res = await fetch(BRANCH_ENDPOINTS.SYLLABUSES(branchId), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return errorResponse(null, { response: res, data: json });
    return { isSuccess: true, data: null, message: str(json?.message) || undefined, raw: json };
  } catch (error) {
    return errorResponse(null, error);
  }
}

export async function getBranchSyllabusAssignments(
  branchId: string,
): Promise<ServiceResponse<BranchSyllabusAssignment[]>> {
  const token = getAccessToken();
  if (!token) return { isSuccess: false, data: [], message: "Chưa đăng nhập." };

  try {
    const res = await fetch(BRANCH_ENDPOINTS.SYLLABUSES(branchId), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return errorResponse([], { response: res, data: json });

    const payload = json?.data ?? json;
    const rawItems = Array.isArray(payload?.syllabuses)
      ? payload.syllabuses
      : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload)
          ? payload
          : [];

    const items: BranchSyllabusAssignment[] = [];
    for (const rawItem of rawItems) {
      const source = (rawItem ?? {}) as Record<string, unknown>;
      const nestedSyllabus = ((source.syllabus ?? source.Syllabus) ?? null) as Record<string, unknown> | null;
      const syllabusSource = nestedSyllabus ?? source;
      const syllabusId = strAny(
        source.syllabusId,
        source.SyllabusId,
        nestedSyllabus?.id,
        nestedSyllabus?.Id,
        nestedSyllabus?.syllabusId,
        nestedSyllabus?.SyllabusId,
      ).trim();
      if (!syllabusId) continue;

      items.push({
        curriculumAssignmentId: strAny(source.curriculumAssignmentId, source.CurriculumAssignmentId, source.id, source.Id) || null,
        syllabusId,
        syllabusCode: strAny(syllabusSource.code, syllabusSource.Code, source.code, source.Code) || null,
        syllabusTitle: strAny(syllabusSource.title, syllabusSource.Title, source.title, source.Title) || null,
        syllabusVersion: strAny(
          syllabusSource.version,
          syllabusSource.Version,
          source.version,
          source.Version,
        ) || null,
        programId: strAny(
          syllabusSource.programId,
          syllabusSource.ProgramId,
          source.programId,
          source.ProgramId,
        ) || null,
        programName: strAny(
          syllabusSource.programName,
          syllabusSource.ProgramName,
          source.programName,
          source.ProgramName,
        ) || null,
        levelId: strAny(
          syllabusSource.levelId,
          syllabusSource.LevelId,
          source.levelId,
          source.LevelId,
        ) || null,
        levelName: strAny(
          syllabusSource.levelName,
          syllabusSource.LevelName,
          source.levelName,
          source.LevelName,
        ) || null,
        unitCount: num(syllabusSource.unitCount ?? syllabusSource.UnitCount ?? source.unitCount ?? source.UnitCount),
        sessionTemplateCount: num(
          syllabusSource.sessionTemplateCount ??
          syllabusSource.SessionTemplateCount ??
          source.sessionTemplateCount ??
          source.SessionTemplateCount,
        ),
        assignedAt: strAny(source.assignedAt, source.AssignedAt, source.createdAt, source.CreatedAt) || null,
        isActive: bool(source.isActive ?? source.IsActive) ?? true,
        effectiveFrom: strAny(source.effectiveFrom, source.EffectiveFrom) || null,
        effectiveTo: strAny(source.effectiveTo, source.EffectiveTo) || null,
      });
    }

    return { isSuccess: true, data: items, raw: json };
  } catch (error) {
    return errorResponse([], error);
  }
}

// ─── Import Configuration ──────────────────────────────────────────────────────

function normalizeRule(r: unknown): ImportConfigRule {
  const source = (r ?? {}) as Record<string, unknown>;
  return {
    id: str(source.id) || undefined,
    moduleId: str(source.moduleId),
    moduleCode: str(source.moduleCode) || null,
    moduleName: str(source.moduleName) || null,
    moduleOrder: source.moduleOrder != null ? Number(source.moduleOrder) : null,
    includeStarterUnit: Boolean(source.includeStarterUnit),
    unitFrom: source.unitFrom != null ? Number(source.unitFrom) : null,
    unitTo: source.unitTo != null ? Number(source.unitTo) : null,
    revisionNumber: source.revisionNumber != null ? Number(source.revisionNumber) : null,
    orderIndex: Number(source.orderIndex ?? 0),
    expectedLessonPlanCount: source.expectedLessonPlanCount != null ? Number(source.expectedLessonPlanCount) : null,
  };
}

function normalizeImportConfig(d: unknown): ImportConfiguration {
  const source = (d ?? {}) as Record<string, unknown>;
  return {
    id: str(source.id),
    programId: str(source.programId),
    levelId: str(source.levelId),
    regularUnitLessonPlanCount: Number(source.regularUnitLessonPlanCount ?? 0),
    starterUnitLessonPlanCount: Number(source.starterUnitLessonPlanCount ?? 0),
    revisionLessonPlanCount: Number(source.revisionLessonPlanCount ?? 0),
    isActive: Boolean(source.isActive ?? true),
    rules: Array.isArray(source.rules) ? source.rules.map(normalizeRule) : [],
  };
}

export async function getImportConfiguration(
  programId: string,
  levelId: string,
): Promise<ServiceResponse<ImportConfiguration | null>> {
  const token = getAccessToken();
  if (!token) return { isSuccess: false, data: null, message: "Chưa đăng nhập." };

  const query = new URLSearchParams({ programId, levelId });
  try {
    const res = await fetch(`${SYLLABUS_ENDPOINTS.IMPORT_CONFIGURATION}?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return errorResponse(null, { response: res, data: json });

    const d = json?.data ?? json;
    return { isSuccess: true, data: d?.id ? normalizeImportConfig(d) : null };
  } catch (error) {
    return errorResponse(null, error);
  }
}

// ─── Unit Lesson Plans ────────────────────────────────────────────────────────

export interface LessonPlanTemplateInUnit {
  lessonPlanTemplateId: string;
  moduleId?: string | null;
  moduleOrderIndex?: number | null;
  lessonPlanUnitId: string | null;
  unitId?: string | null;
  unitOrderIndex?: number | null;
  unitNumber?: string | null;
  unitTitle?: string | null;
  sessionTemplateId: string | null;
  title: string | null;
  lessonNumber: number | null;
  sessionIndex: number;
  sessionOrder: number;
  sessionIndexInModule: number | null;
  sessionTitle: string | null;
  sessionTopic: string | null;
  sourceFileName: string | null;
  orderIndexInUnit: number;
  lessonOrderIndexInUnit?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LessonPlanUnitGroup {
  unitId: string;
  unitName: string;
  orderIndex: number;
  unitOrderIndex?: number | null;
  unitNumber?: string | null;
  unitTitle?: string | null;
  lessonPlanCount: number;
  lessons: LessonPlanTemplateInUnit[];
}

export interface ModuleUnitLessonPlanGroup {
  moduleId: string;
  moduleCode: string;
  moduleName: string;
  moduleOrder: number;
  moduleOrderIndex?: number | null;
  unitCount: number;
  lessonPlanCount: number;
  units: LessonPlanUnitGroup[];
}

export interface UnitLessonPlansResult {
  syllabusId: string;
  programId: string;
  programName?: string | null;
  levelId: string;
  levelName?: string | null;
  totalModules: number;
  totalUnits: number;
  totalGroups: number;
  totalLessonPlans: number;
  groups: ModuleUnitLessonPlanGroup[];
  orphanLessons: LessonPlanTemplateInUnit[];
}

// Legacy aliases kept for backward compatibility
/** @deprecated Use ModuleUnitLessonPlanGroup */
export type UnitLessonPlanGroup = ModuleUnitLessonPlanGroup;
/** @deprecated Use LessonPlanTemplateInUnit */
export type UnitLessonPlanItem = LessonPlanTemplateInUnit;

export async function getUnitLessonPlans(
  syllabusId: string,
): Promise<ServiceResponse<UnitLessonPlansResult | null>> {
  const token = getAccessToken();
  if (!token) return { isSuccess: false, data: null, message: "Chưa đăng nhập." };

  try {
    const res = await fetch(SYLLABUS_ENDPOINTS.UNIT_LESSON_PLANS(syllabusId), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return errorResponse(null, { response: res, data: json });
    const d = json?.data ?? json;
    return { isSuccess: true, data: d as UnitLessonPlansResult };
  } catch (error) {
    return errorResponse(null, error);
  }
}

export async function upsertImportConfiguration(
  programId: string,
  levelId: string,
  body: UpsertImportConfigRequest,
): Promise<ServiceResponse<ImportConfiguration | null>> {
  const token = getAccessToken();
  if (!token) return { isSuccess: false, data: null, message: "Chưa đăng nhập." };

  const query = new URLSearchParams({ programId, levelId });
  try {
    const res = await fetch(`${SYLLABUS_ENDPOINTS.IMPORT_CONFIGURATION}?${query}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        isSuccess: false,
        data: null,
        message: str(json?.detail) || str(json?.message) || str(json?.title) || "Lưu cấu hình thất bại.",
        status: typeof json?.status === "number" ? json.status : res.status,
        title: str(json?.title) || undefined,
        detail: str(json?.detail) || undefined,
        errors: Array.isArray(json?.errors) ? json.errors : undefined,
        raw: json,
      };
    }
    const d = json?.data ?? json;
    return { isSuccess: true, data: d?.id ? normalizeImportConfig(d) : null };
  } catch (error) {
    return errorResponse(null, error);
  }
}

// ─── Syllabus Versions ────────────────────────────────────────────────────────

export interface SyllabusVersion {
  id: string;
  syllabusId: string;
  versionTag: string;
  label?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt?: string | null;
  promotedAt?: string | null;
  promotedBy?: string | null;
}

export interface CreateSyllabusVersionRequest {
  versionTag: string;
  label?: string | null;
  notes?: string | null;
}

function normalizeVersion(v: unknown): SyllabusVersion {
  const s = (v ?? {}) as Record<string, unknown>;
  return {
    id: str(s.id),
    syllabusId: str(s.syllabusId),
    versionTag: str(s.versionTag ?? s.version ?? s.tag),
    label: str(s.label) || null,
    notes: str(s.notes) || null,
    isActive: Boolean(s.isActive),
    createdAt: str(s.createdAt) || null,
    promotedAt: str(s.promotedAt) || null,
    promotedBy: str(s.promotedBy) || null,
  };
}

export async function getSyllabusVersions(
  syllabusId: string,
): Promise<ServiceResponse<SyllabusVersion[]>> {
  const token = getAccessToken();
  if (!token) return { isSuccess: false, data: [], message: "Chưa đăng nhập." };
  try {
    const res = await fetch(SYLLABUS_ENDPOINTS.VERSIONS(syllabusId), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return errorResponse([], { response: res, data: json });
    const payload = json?.data ?? json;
    const items = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload) ? payload : [];
    return { isSuccess: true, data: items.map(normalizeVersion), raw: json };
  } catch (error) {
    return errorResponse([], error);
  }
}

export async function createSyllabusVersion(
  syllabusId: string,
  body: CreateSyllabusVersionRequest,
): Promise<ServiceResponse<SyllabusVersion | null>> {
  const token = getAccessToken();
  if (!token) return { isSuccess: false, data: null, message: "Chưa đăng nhập." };
  try {
    const res = await fetch(SYLLABUS_ENDPOINTS.VERSIONS(syllabusId), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return errorResponse(null, { response: res, data: json });
    const d = json?.data ?? json;
    return { isSuccess: true, data: normalizeVersion(d), raw: json };
  } catch (error) {
    return errorResponse(null, error);
  }
}

export async function promoteSyllabusVersion(
  syllabusId: string,
  versionId: string,
): Promise<ServiceResponse<null>> {
  const token = getAccessToken();
  if (!token) return { isSuccess: false, data: null, message: "Chưa đăng nhập." };
  try {
    const res = await fetch(SYLLABUS_ENDPOINTS.VERSION_PROMOTE(syllabusId, versionId), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return errorResponse(null, { response: res, data: json });
    return { isSuccess: true, data: null, message: str(json?.message) || undefined, raw: json };
  } catch (error) {
    return errorResponse(null, error);
  }
}

export async function deleteSyllabusVersion(
  syllabusId: string,
  versionId: string,
): Promise<ServiceResponse<null>> {
  const token = getAccessToken();
  if (!token) return { isSuccess: false, data: null, message: "Chưa đăng nhập." };
  try {
    const res = await fetch(SYLLABUS_ENDPOINTS.VERSION_BY_ID(syllabusId, versionId), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return errorResponse(null, { response: res, data: json });
    return { isSuccess: true, data: null, raw: json };
  } catch (error) {
    return errorResponse(null, error);
  }
}

export async function removeSyllabusFromBranch(
  branchId: string,
  assignmentId: string,
): Promise<ServiceResponse<null>> {
  const token = getAccessToken();
  if (!token) return { isSuccess: false, data: null, message: "Chưa đăng nhập." };
  try {
    const res = await fetch(BRANCH_ENDPOINTS.SYLLABUS_ASSIGNMENT(branchId, assignmentId), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return errorResponse(null, { response: res, data: json });
    return { isSuccess: true, data: null, raw: json };
  } catch (error) {
    return errorResponse(null, error);
  }
}
