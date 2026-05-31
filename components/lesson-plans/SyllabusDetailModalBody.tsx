"use client";

import { useState } from "react";
import { BookOpen, CheckCircle, Info, Loader2, Pencil, X, XCircle } from "lucide-react";

import type { SyllabusDetail } from "@/lib/api/syllabusService";

type StructuredSection = {
  sectionId: string;
  type: string;
  title: string;
  content: string;
  table: {
    columns: Array<{ key: string; label: string }>;
    rows: Array<Array<string>>;
  } | null;
};

type CurriculumTableRow = {
  periods: string;
  topics: string;
  lessons: string;
  contents: string;
  structures: string;
  studentsBook: string;
  teachersBook: string;
};

type CurriculumLessonFilterOption = {
  value: string;
  label: string;
  tokens: string[];
};

function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

function normalizeLessonFilterToken(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function extractLessonFilterTokens(value: string): string[] {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];

  const tokens = new Set<string>();
  const normalized = normalizeLessonFilterToken(cleaned);
  if (normalized) tokens.add(normalized);

  const numericTokens = cleaned.match(/\d+/g) ?? [];
  numericTokens.forEach((token) => tokens.add(token));

  const lessonLabel = cleaned.match(/^lesson\s*(.+)$/i);
  if (lessonLabel?.[1]) {
    const normalizedLesson = normalizeLessonFilterToken(lessonLabel[1]);
    if (normalizedLesson) tokens.add(normalizedLesson);
  }

  return Array.from(tokens).filter(Boolean);
}

function formatLessonFilterLabel(value: string): string {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  if (/^lesson\b/i.test(cleaned)) return cleaned;
  if (/^\d+(?:\s*[-/]\s*\d+)?$/.test(cleaned)) return `Lesson ${cleaned}`;
  return cleaned;
}

function normalizeTopicFilterValue(value: string): string {
  return value
    .toLowerCase()
    .replace(/[_|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTopicFilterCandidates(value: string): string[] {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];

  const segments = cleaned
    .split(/[:|]|\s+-\s+|\s+\/\s+/)
    .map((segment) => normalizeTopicFilterValue(segment))
    .filter((segment) => segment.length >= 3);

  const normalizedFull = normalizeTopicFilterValue(cleaned);
  return Array.from(new Set([normalizedFull, ...segments])).filter(Boolean);
}

function extractTopicBlockKeys(value: string): string[] {
  const normalized = normalizeTopicFilterValue(value);
  if (!normalized) return [];

  const keys = new Set<string>();

  const unitMatch = normalized.match(/\bunit\s*(\d+)\b/i);
  if (unitMatch?.[1]) {
    keys.add(`unit ${unitMatch[1]}`);
  }

  const starterMatch = normalized.match(/\bstarter(?:\s*(\d+))?\b/i);
  if (starterMatch) {
    keys.add(starterMatch[1] ? `starter ${starterMatch[1]}` : "starter");
  }

  const revisionMatch = normalized.match(/\b(?:revision|review)\s*(\d+)?\b/i);
  if (revisionMatch) {
    keys.add(revisionMatch[1] ? `revision ${revisionMatch[1]}` : "revision");
  }

  return Array.from(keys);
}

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
      <CheckCircle size={12} /> Đang hoạt động
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
      <XCircle size={12} /> Tạm ẩn
    </span>
  );
}

export default function SyllabusDetailModalBody({
  detail,
  loading = false,
  onEdit,
  onClose,
  enableCurriculumLessonFilter = false,
  defaultCurriculumLesson = null,
  defaultCurriculumPeriodValues = [],
  defaultCurriculumTopicValues = [],
  curriculumLessonFilterLabel = "Lọc theo lesson",
  collapseSupplementaryContent = false,
  supplementaryContentToggleLabel = "Xem thông tin syllabus",
  hideCurriculumLessonSelect = false,
}: {
  detail: SyllabusDetail | null;
  loading?: boolean;
  onEdit?: () => void;
  onClose?: () => void;
  enableCurriculumLessonFilter?: boolean;
  defaultCurriculumLesson?: string | number | null;
  defaultCurriculumPeriodValues?: Array<string | number | null | undefined>;
  defaultCurriculumTopicValues?: Array<string | null | undefined>;
  curriculumLessonFilterLabel?: string;
  collapseSupplementaryContent?: boolean;
  supplementaryContentToggleLabel?: string;
  hideCurriculumLessonSelect?: boolean;
}) {
  const [showFullSyllabusTable, setShowFullSyllabusTable] = useState(false);
  const [selectedLessonFilter, setSelectedLessonFilter] = useState("");
  const [showSupplementaryContent, setShowSupplementaryContent] = useState(false);

  if (loading) {
    return (
      <>
        <div className="flex items-start justify-between rounded-t-2xl bg-gradient-to-r from-red-600 to-red-700 px-6 py-5">
          <div className="flex items-start gap-3 min-w-0">
            <div className="rounded-xl bg-white/20 p-2.5 shrink-0">
              <BookOpen size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-white leading-snug">Đang tải syllabus</h2>
              <div className="mt-1.5 text-xs text-white/85">Đang lấy dữ liệu chi tiết syllabus đầy đủ...</div>
            </div>
          </div>
          {onClose ? (
            <button type="button" onClick={onClose} className="rounded-full p-2 text-white hover:bg-white/20 cursor-pointer">
              <X size={18} />
            </button>
          ) : null}
        </div>
        <div className="flex items-center justify-center px-6 py-16 text-gray-600">
          <Loader2 size={20} className="mr-3 animate-spin text-red-600" />
          Đang tải chi tiết syllabus...
        </div>
      </>
    );
  }

  if (!detail) {
    return null;
  }

  const stats = [
    { label: "Unit", value: detail.unitCount ?? "—", color: "blue" as const },
    { label: "Session", value: detail.sessionTemplateCount ?? "—", color: "purple" as const },
    { label: "Tiết học", value: detail.totalPeriods ?? "—", color: "amber" as const },
    { label: "Bài học", value: detail.totalLessons ?? "—", color: "emerald" as const },
  ];

  const infoRows: Array<{ label: string; value: string | number | null | undefined }> = [
    { label: "Chương trình", value: detail.programName },
    { label: "Level", value: detail.levelName },
    { label: "Ấn bản", value: detail.edition },
    { label: "Phút / tiết", value: detail.minutesPerPeriod },
    { label: "File nguồn", value: detail.sourceFileName },
  ];

  const statColors = {
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    purple: "border-purple-100 bg-purple-50 text-purple-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
  };

  const narrativeSections: Array<{ title: string; value?: string | null }> = [
    { title: "Tổng quan", value: detail.overview },
    { title: "Mục tiêu tổng quát", value: detail.overallObjectives },
    { title: "Mục tiêu cụ thể", value: detail.specificObjectives },
    { title: "Phẩm chất và thái độ", value: detail.ethicsAndAttitudes },
    { title: "Giới thiệu giáo trình", value: detail.bookOverview },
  ].filter((item) => (item.value ?? "").trim().length > 0);

  const parsedRawContent = (() => {
    const raw = (detail.rawContentJson?.trim() || detail.pacingSchemeJson?.trim() || "");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  })();

  const prettyRawContent =
    parsedRawContent == null
      ? null
      : typeof parsedRawContent === "string"
        ? parsedRawContent
        : JSON.stringify(parsedRawContent, null, 2);

  const rawObject =
    parsedRawContent && typeof parsedRawContent === "object" && !Array.isArray(parsedRawContent)
      ? (parsedRawContent as Record<string, unknown>)
      : null;

  const structuredSections: StructuredSection[] = (() => {
    if (!rawObject) return [];
    const sectionsRaw =
      rawObject.sections ??
      (rawObject.document && typeof rawObject.document === "object"
        ? (rawObject.document as Record<string, unknown>).sections
        : null);
    if (!Array.isArray(sectionsRaw)) return [];

    const toText = (value: unknown): string => {
      if (value == null) return "";
      if (typeof value === "string") return value.trim();
      if (typeof value === "number" || typeof value === "boolean") return String(value);
      if (Array.isArray(value)) {
        return value
          .map((item) => toText(item))
          .filter(Boolean)
          .join("\n")
          .trim();
      }
      if (typeof value === "object") {
        const obj = value as Record<string, unknown>;
        return (
          toText(obj.value) ||
          toText(obj.text) ||
          toText(obj.content) ||
          toText(obj.label) ||
          ""
        );
      }
      return "";
    };

    return sectionsRaw
      .map((section, sectionIndex) => {
        if (!section || typeof section !== "object") return null;
        const s = section as Record<string, unknown>;
        const type = toText(s.type || s.Type).toLowerCase();
        const title = toText(s.title);
        const content = toText(s.content);

        let table: StructuredSection["table"] = null;
        const tableRaw = s.table ?? s.Table;
        if (tableRaw && typeof tableRaw === "object") {
          const tableObj = tableRaw as Record<string, unknown>;
          const columnsRaw = Array.isArray(tableObj.columns)
            ? tableObj.columns
            : Array.isArray(tableObj.Columns)
              ? tableObj.Columns
              : Array.isArray(tableObj.headers)
                ? tableObj.headers
                : Array.isArray(tableObj.Headers)
                  ? tableObj.Headers
                  : Array.isArray(tableObj.columnDefinitions)
                    ? tableObj.columnDefinitions
                    : Array.isArray(tableObj.ColumnDefinitions)
                      ? tableObj.ColumnDefinitions
                      : [];
          const rowsRaw = Array.isArray(tableObj.rows)
            ? tableObj.rows
            : Array.isArray(tableObj.Rows)
              ? tableObj.Rows
              : Array.isArray(tableObj.dataRows)
                ? tableObj.dataRows
                : Array.isArray(tableObj.DataRows)
                  ? tableObj.DataRows
                  : Array.isArray(tableObj.body)
                    ? tableObj.body
                    : Array.isArray(tableObj.Body)
                      ? tableObj.Body
                      : Array.isArray(tableObj.items)
                        ? tableObj.items
                        : Array.isArray(tableObj.Items)
                          ? tableObj.Items
                          : [];

          const columns = columnsRaw
            .map((col, colIndex) => {
              if (!col || typeof col !== "object") return null;
              const c = col as Record<string, unknown>;
              const key =
                toText(c.key) ||
                toText(c.Key) ||
                toText(c.columnKey) ||
                toText(c.ColumnKey) ||
                `col-${colIndex + 1}`;
              const label = toText(c.label) || key;
              if (!key) return null;
              return { key, label };
            })
            .filter((col): col is { key: string; label: string } => col != null);

          const rowValues = rowsRaw
            .map((row) => {
              if (!row || typeof row !== "object") return null;
              const r = row as Record<string, unknown>;
              const cellsRaw = Array.isArray(r.cells)
                ? r.cells
                : Array.isArray(r.Cells)
                  ? r.Cells
                  : Array.isArray(r.values)
                    ? r.values
                    : Array.isArray(r.Values)
                      ? r.Values
                      : [];
              const cellMap = new Map<string, string>();

              for (const cell of cellsRaw) {
                if (cell && typeof cell === "object") {
                  const cellObj = cell as Record<string, unknown>;
                  const columnKey = toText(cellObj.columnKey) || toText(cellObj.ColumnKey) || toText(cellObj.key);
                  if (!columnKey) continue;
                  cellMap.set(columnKey, toText(cellObj.value) || toText(cellObj.Value) || toText(cellObj.content));
                  continue;
                }
              }

              if (cellMap.size === 0 && columns.length > 0) {
                columns.forEach((column) => {
                  const mapped = toText(r[column.key]) || toText(r[column.key.toLowerCase()]) || toText(column.label ? r[column.label] : undefined);
                  if (mapped) cellMap.set(column.key, mapped);
                });
              }

              return columns.map((col) => cellMap.get(col.key) || "");
            })
            .filter((row): row is string[] => row != null);

          if (columns.length > 0 && rowValues.length > 0) {
            table = { columns, rows: rowValues };
          }
        }

        const effectiveType = type || (table ? "table" : "narrative");

        return {
          sectionId: toText(s.sectionId) || toText(s.SectionId) || toText(s.id) || `${effectiveType || "section"}-${sectionIndex}`,
          type: effectiveType,
          title,
          content,
          table,
        } satisfies StructuredSection;
      })
      .filter((item): item is StructuredSection => item != null);
  })();

  const structuredNarrativeSections = structuredSections
    .filter((section) => section.type !== "table" && section.content.trim().length > 0)
    .map((section) => ({ title: section.title || "Nội dung", value: section.content }));

  const structuredTableSections = structuredSections
    .filter((section) => section.type === "table" && section.table?.columns.length && section.table?.rows.length)
    .map((section) => ({
      sectionId: section.sectionId,
      title: section.title || "Bảng syllabus",
      columns: section.table!.columns,
      rows: section.table!.rows,
    }));

  const structuredTableRowCount = structuredTableSections.reduce(
    (total, section) => total + section.rows.length,
    0,
  );

  const findNestedString = (node: unknown, keys: string[]): string => {
    if (!node || typeof node !== "object") return "";
    const obj = node as Record<string, unknown>;

    for (const key of keys) {
      const direct = obj[key];
      if (typeof direct === "string" && direct.trim()) return direct.trim();
    }

    for (const value of Object.values(obj)) {
      if (!value) continue;
      if (typeof value === "string") continue;
      if (Array.isArray(value)) {
        for (const child of value) {
          const found = findNestedString(child, keys);
          if (found) return found;
        }
      } else if (typeof value === "object") {
        const found = findNestedString(value, keys);
        if (found) return found;
      }
    }

    return "";
  };

  const pickRawString = (keys: string[]): string => {
    if (!rawObject) return "";
    return findNestedString(rawObject, keys);
  };

  const rawNarrativeSections: Array<{ title: string; value: string }> = [
    {
      title: "Tổng quan",
      value: pickRawString(["overview", "Overview", "generalInformation", "GeneralInformation", "introduction", "Introduction"]),
    },
    {
      title: "Mục tiêu tổng quát",
      value: pickRawString(["overallObjectives", "OverallObjectives", "courseObjectives", "CourseObjectives"]),
    },
    {
      title: "Mục tiêu cụ thể",
      value: pickRawString(["specificObjectives", "SpecificObjectives"]),
    },
    {
      title: "Phẩm chất và thái độ",
      value: pickRawString(["ethicsAndAttitudes", "EthicsAndAttitudes", "attitudes", "Attitudes"]),
    },
    {
      title: "Giới thiệu giáo trình",
      value: pickRawString(["bookOverview", "BookOverview", "bookInformation", "BookInformation"]),
    },
  ].filter((item) => item.value.trim().length > 0);

  const tableHeaderRegex = /(\bPeriods\b\s*\|?\s*\bTopics\b\s*\|?\s*\bLessons\b)|(\|\s*Periods\s*\|\s*Topics\s*\|\s*Lessons\s*\|)|(\bPeriods\s+Topics\s+Lessons\b)/i;

  const splitNarrativeSectionsFromText = (inputText: string): Array<{ title: string; value: string }> => {
    const text = inputText.trim();
    if (!text) return [];

    const tableMatch = tableHeaderRegex.exec(text);
    const sourceText = (tableMatch && tableMatch.index > 0 ? text.slice(0, tableMatch.index) : text).trim();
    if (!sourceText) return [];

    const cleanSectionValue = (value: string): string =>
      value
        .replace(/\u0000/g, "")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

    const lineHeadingRules: Array<{ title: string; regex: RegExp }> = [
      {
        title: "Tổng quan",
        regex:
          /^\s*(?:[IVXLC]+\s*[.)-]?\s*)?(?:\d+\s*[.)-]?\s*)?(?:what is|get ready for starters|the syllabus|overview|general information|introduction)\b/i,
      },
      {
        title: "Mục tiêu tổng quát",
        regex: /^\s*(?:[IVXLC]+\s*[.)-]?\s*)?(?:\d+\s*[.)-]?\s*)?(?:course objectives?|overall objectives?)\b/i,
      },
      {
        title: "Mục tiêu cụ thể",
        regex: /^\s*(?:[IVXLC]+\s*[.)-]?\s*)?(?:\d+\s*[.)-]?\s*)?(?:specific objectives?)\b/i,
      },
      {
        title: "Phẩm chất và thái độ",
        regex:
          /^\s*(?:[IVXLC]+\s*[.)-]?\s*)?(?:\d+\s*[.)-]?\s*)?(?:ethics(?: and attitudes?)?|attitudes? for students?)\b/i,
      },
      {
        title: "Giới thiệu giáo trình",
        regex:
          /^\s*(?:[IVXLC]+\s*[.)-]?\s*)?(?:\d+\s*[.)-]?\s*)?(?:overall information about this book|text books? and references?|book overview|book information)\b/i,
      },
    ];

    const lineHits: Array<{ title: string; index: number }> = [];
    const lines = sourceText.split(/\r?\n/);
    let cursor = 0;
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        cursor += line.length + 1;
        continue;
      }

      const absoluteIndex = sourceText.indexOf(line, cursor);
      const index = absoluteIndex >= 0 ? absoluteIndex : cursor;
      cursor = index + line.length + 1;

      for (const rule of lineHeadingRules) {
        if (rule.regex.test(trimmed)) {
          lineHits.push({ title: rule.title, index });
          break;
        }
      }
    }

    const dedupeAndMergeSections = (sections: Array<{ title: string; value: string }>): Array<{ title: string; value: string }> => {
      const merged: Array<{ title: string; value: string }> = [];
      for (const section of sections) {
        const cleaned = cleanSectionValue(section.value);
        if (!cleaned) continue;

        const existed = merged.find((item) => item.title === section.title);
        if (!existed) {
          merged.push({ title: section.title, value: cleaned });
          continue;
        }

        if (!existed.value.includes(cleaned)) {
          existed.value = cleanSectionValue(`${existed.value}\n\n${cleaned}`);
        }
      }
      return merged;
    };

    if (lineHits.length >= 2) {
      const sections = lineHits
        .sort((a, b) => a.index - b.index)
        .map((hit, idx, arr) => {
          const nextIndex = arr[idx + 1]?.index ?? sourceText.length;
          const value = sourceText.slice(hit.index, nextIndex).trim();
          return { title: hit.title, value };
        })
        .filter((item) => item.value.length > 0);

      const merged = dedupeAndMergeSections(sections);
      if (merged.length > 0) return merged;
    }

    const headingRules: Array<{ title: string; regex: RegExp }> = [
      { title: "Tổng quan", regex: /\b(overview|general information|introduction|what is [^\n.]+|the syllabus)\b/gi },
      { title: "Mục tiêu tổng quát", regex: /\b(course objectives|overall objectives|objective\s*i\b|objectives\s*1\b)\b/gi },
      { title: "Mục tiêu cụ thể", regex: /\b(specific objectives|objective\s*ii\b|objectives\s*2\b)\b/gi },
      { title: "Phẩm chất và thái độ", regex: /\b(ethics|attitudes?)\b/gi },
      { title: "Giới thiệu giáo trình", regex: /\b(book overview|book information|textbook)\b/gi },
    ];

    const headingHits = headingRules
      .flatMap((rule) =>
        Array.from(sourceText.matchAll(rule.regex)).map((match) => ({
          title: rule.title,
          index: match.index ?? -1,
        })),
      )
      .filter((item) => item.index >= 0)
      .sort((a, b) => a.index - b.index);

    if (headingHits.length >= 2) {
      const sections = headingHits
        .map((hit, idx) => {
          const nextIndex = headingHits[idx + 1]?.index ?? sourceText.length;
          const value = sourceText.slice(hit.index, nextIndex).trim();
          return { title: hit.title, value };
        })
        .filter((item) => item.value.length > 0);

      const deduped = dedupeAndMergeSections(sections);
      if (deduped.length > 0) return deduped;
    }

    const lower = sourceText.toLowerCase();
    const configs: Array<{ title: string; markers: string[] }> = [
      {
        title: "Tổng quan",
        markers: ["overview", "general information", "introduction", "what is", "syllabus"],
      },
      {
        title: "Mục tiêu tổng quát",
        markers: ["overall objectives", "course objectives", "objective i", "objectives 1"],
      },
      {
        title: "Mục tiêu cụ thể",
        markers: ["specific objectives", "objective ii", "objectives 2"],
      },
      {
        title: "Phẩm chất và thái độ",
        markers: ["ethics", "attitude", "attitudes"],
      },
    ];

    const sectionsWithIndex = configs
      .map((config) => {
        let index = -1;
        for (const marker of config.markers) {
          const found = lower.indexOf(marker);
          if (found >= 0 && (index < 0 || found < index)) index = found;
        }
        return { title: config.title, index };
      })
      .filter((item) => item.index >= 0)
      .sort((a, b) => a.index - b.index);

    if (sectionsWithIndex.length === 0) {
      const looksLikeTable = /\bperiods\b.*\btopics\b.*\blessons\b/i.test(sourceText) || /\bcontents\b|\bstructures\b/i.test(sourceText);
      if (looksLikeTable) {
        const topicMatches = Array.from(sourceText.matchAll(/\b(?:starter|unit|revision)\s*[:\-]?\s*[^\n|]{1,80}/gi))
          .map((m) => (m[0] ?? "").trim())
          .filter(Boolean);
        const uniqueTopics = Array.from(new Set(topicMatches)).slice(0, 8);

        const bulletMatches = Array.from(sourceText.matchAll(/(?:^|\n)\s*[-•]\s*([^\n]{8,})/gim))
          .map((m) => (m[1] ?? "").trim())
          .filter(Boolean);
        const uniqueBullets = Array.from(new Set(bulletMatches)).slice(0, 14);

        const sections: Array<{ title: string; value: string }> = [];
        if (uniqueTopics.length > 0) {
          sections.push({
            title: "Tổng quan",
            value: `Dữ liệu chi tiết được import theo bảng syllabus. Chủ đề chính: ${uniqueTopics.join("; ")}.`,
          });
        }
        if (uniqueBullets.length > 0) {
          sections.push({
            title: "Mục tiêu cụ thể",
            value: uniqueBullets.map((line) => `- ${line}`).join("\n"),
          });
        }
        if (sections.length > 0) return sections;
      }

      return sourceText.length > 40 ? [{ title: "Tổng quan", value: cleanSectionValue(sourceText) }] : [];
    }

    if (sectionsWithIndex[0].index > 0) {
      sectionsWithIndex.unshift({ title: "Tổng quan", index: 0 });
    }

    const sections = sectionsWithIndex
      .map((section, idx) => {
        const nextIndex = sectionsWithIndex[idx + 1]?.index ?? sourceText.length;
        const value = sourceText.slice(section.index, nextIndex).trim();
        return { title: section.title, value };
      })
      .filter((item) => item.value.length > 0);

    return dedupeAndMergeSections(sections);
  };

  const rawNarrativeSectionsFromText = (() => {
    if (typeof parsedRawContent !== "string") return [] as Array<{ title: string; value: string }>;
    return splitNarrativeSectionsFromText(parsedRawContent);
  })();

  const rawNarrativeSectionsFromObjectText = (() => {
    if (!rawObject) return [] as Array<{ title: string; value: string }>;

    const blockedKeyRegex = /(periods?|topics?|lessons?|table|rows?|columns?|units?|sessions?)/i;
    const collected: string[] = [];

    const walk = (node: unknown, keyHint = "") => {
      if (!node) return;
      if (typeof node === "string") {
        const value = node.trim();
        if (value.length < 50) return;
        if (blockedKeyRegex.test(keyHint)) return;
        collected.push(value);
        return;
      }
      if (Array.isArray(node)) {
        for (const child of node) walk(child, keyHint);
        return;
      }
      if (typeof node === "object") {
        for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
          walk(value, key);
        }
      }
    };

    walk(rawObject);
    if (collected.length === 0) return [] as Array<{ title: string; value: string }>;

    const candidate =
      collected
        .filter((text) => /overview|objectives?|introduction|syllabus|course|ethics|attitudes|book/i.test(text))
        .join("\n\n") || collected.join("\n\n");
    return splitNarrativeSectionsFromText(candidate);
  })();

  const rawGeneralText = (() => {
    if (typeof parsedRawContent !== "string") return "";
    const text = parsedRawContent.trim();
    if (!text) return "";
    const match = tableHeaderRegex.exec(text);
    if (!match || match.index <= 0) return "";
    return text.slice(0, match.index).trim();
  })();

  const curriculumRows = (() => {
    const normalizeText = (value: unknown): string => {
      if (value == null) return "";
      if (typeof value === "string") return value.replace(/\u0000/g, "").trim();
      if (typeof value === "number" || typeof value === "boolean") return String(value);
      if (Array.isArray(value)) {
        const joined = value
          .map((item) => normalizeText(item))
          .filter(Boolean)
          .join("\n");
        return joined.trim();
      }
      if (typeof value === "object") {
        const obj = value as Record<string, unknown>;
        const best = ["text", "value", "name", "title", "label", "content"]
          .map((k) => normalizeText(obj[k]))
          .find(Boolean);
        if (best) return best;
      }
      return "";
    };

    const normKey = (key: string): string => key.toLowerCase().replace(/[^a-z0-9]/g, "");

    const pickByAliases = (obj: Record<string, unknown>, aliases: string[]): string => {
      const aliasSet = new Set(aliases.map(normKey));
      for (const [key, value] of Object.entries(obj)) {
        if (aliasSet.has(normKey(key))) {
          const text = normalizeText(value);
          if (text) return text;
        }
      }
      return "";
    };

    const rowFromObject = (obj: Record<string, unknown>): CurriculumTableRow | null => {
      const cells = Array.isArray(obj.cells) ? obj.cells : [];
      if (cells.length > 0) {
        const cellValueByKey: Record<string, string> = {};

        for (const cell of cells) {
          if (!cell || typeof cell !== "object") continue;
          const cellObj = cell as Record<string, unknown>;
          const columnKey = normalizeText(cellObj.columnKey || cellObj.key || "").toLowerCase();
          const value = normalizeText(cellObj.value);
          if (!columnKey) continue;
          if (!value && cellValueByKey[columnKey]) continue;
          cellValueByKey[columnKey] = value;
        }

        const rowFromCells: CurriculumTableRow = {
          periods: cellValueByKey.periods || cellValueByKey.period || "",
          topics: cellValueByKey.topics || cellValueByKey.topic || "",
          lessons: cellValueByKey.lessons || cellValueByKey.lesson || "",
          contents: cellValueByKey.contents || cellValueByKey.content || "",
          structures: cellValueByKey.structures || cellValueByKey.structure || "",
          studentsBook:
            cellValueByKey.studentsbook ||
            cellValueByKey.studentsBook ||
            cellValueByKey.studentbook ||
            cellValueByKey.studentBook ||
            "",
          teachersBook:
            cellValueByKey.teachersbook ||
            cellValueByKey.teachersBook ||
            cellValueByKey.teacherbook ||
            cellValueByKey.teacherBook ||
            "",
        };

        const nonEmptyFromCells = Object.values(rowFromCells).filter((v) => v.trim().length > 0).length;
        if (nonEmptyFromCells >= 2) return rowFromCells;
      }

      const row: CurriculumTableRow = {
        periods: pickByAliases(obj, ["periods", "period", "periodRange", "sessionRange", "week", "time"]),
        topics: pickByAliases(obj, ["topics", "topic", "unit", "unitName", "sessionTopic"]),
        lessons: pickByAliases(obj, ["lessons", "lesson", "lessonNo", "lessonNumber", "sessionNo", "sessionIndex", "sessionOrder"]),
        contents: pickByAliases(obj, ["contents", "content", "objective", "objectives", "goals", "skills", "activity"]),
        structures: pickByAliases(obj, ["structures", "structure", "languageFocus", "grammar", "pattern"]),
        studentsBook: pickByAliases(obj, ["studentsBook", "studentBook", "studentsbook", "pupils", "pupilBook", "wbPage", "wbPages"]),
        teachersBook: pickByAliases(obj, ["teachersBook", "teacherBook", "teachersbook", "tbPage", "tbPages", "teacherPage"]),
      };

      const nonEmptyCount = Object.values(row).filter((v) => v.trim().length > 0).length;
      if (nonEmptyCount < 2) return null;
      const hasSignal = Boolean(row.periods || row.topics || row.lessons || row.contents || row.structures);
      if (!hasSignal) return null;
      return row;
    };

    const fromRawObject: CurriculumTableRow[] = [];
    const visited = new WeakSet<object>();

    const walk = (node: unknown) => {
      if (!node || typeof node !== "object") return;
      if (visited.has(node as object)) return;
      visited.add(node as object);

      if (Array.isArray(node)) {
        for (const child of node) walk(child);
        return;
      }

      const obj = node as Record<string, unknown>;
      const row = rowFromObject(obj);
      if (row) fromRawObject.push(row);

      for (const value of Object.values(obj)) {
        walk(value);
      }
    };

    if (rawObject) walk(rawObject);

    const fromSessionTemplates: CurriculumTableRow[] = Array.isArray(detail.sessionTemplates)
      ? detail.sessionTemplates
          .map((item) => {
            if (!item || typeof item !== "object") return null;
            const obj = item as Record<string, unknown>;
            const raw = {
              periods:
                normalizeText(obj.sessionIndexInModule) ||
                normalizeText(obj.sessionIndex) ||
                normalizeText(obj.curriculumSessionIndex),
              topics:
                normalizeText(obj.unitName) ||
                normalizeText(obj.sessionTopic) ||
                normalizeText(obj.topic) ||
                normalizeText(obj.moduleName),
              lessons:
                normalizeText(obj.lessonNumber) ||
                normalizeText(obj.sessionOrder) ||
                normalizeText(obj.orderIndexInUnit),
              contents:
                normalizeText(obj.sessionTitle) || normalizeText(obj.title) || normalizeText(obj.content),
              structures: normalizeText(obj.structure) || normalizeText(obj.languageFocus),
              studentsBook: normalizeText(obj.studentBookPage) || normalizeText(obj.studentsBook),
              teachersBook: normalizeText(obj.teacherBookPage) || normalizeText(obj.teachersBook),
            };

            const nonEmptyCount = Object.values(raw).filter((v) => v.trim().length > 0).length;
            if (nonEmptyCount < 2) return null;

            return {
              periods: raw.periods,
              topics: raw.topics,
              lessons: raw.lessons,
              contents: raw.contents,
              structures: raw.structures,
              studentsBook: raw.studentsBook,
              teachersBook: raw.teachersBook,
            } as CurriculumTableRow;
          })
          .filter((row): row is CurriculumTableRow => row != null)
      : [];

    const source = fromRawObject.length > 0 ? fromRawObject : fromSessionTemplates;
    const seen = new Set<string>();
    const deduped = source.filter((row) => {
      const signature = [row.periods, row.topics, row.lessons, row.contents, row.structures, row.studentsBook, row.teachersBook]
        .map((v) => v.replace(/\s+/g, " ").trim())
        .join("|");
      if (!signature || seen.has(signature)) return false;
      seen.add(signature);
      return true;
    });

    return deduped.slice(0, 400);
  })();

  const curriculumLessonFilterOptions = (() => {
    const options: CurriculumLessonFilterOption[] = [];
    const seen = new Set<string>();

    for (const row of curriculumRows) {
      const lessonValue = row.lessons.replace(/\s+/g, " ").trim();
      if (!lessonValue) continue;

      const normalizedValue = normalizeLessonFilterToken(lessonValue);
      if (!normalizedValue || seen.has(normalizedValue)) continue;

      seen.add(normalizedValue);
      options.push({
        value: normalizedValue,
        label: formatLessonFilterLabel(lessonValue),
        tokens: extractLessonFilterTokens(lessonValue),
      });
    }

    return options;
  })();

  const requestedLessonFilterTokens = extractLessonFilterTokens(String(defaultCurriculumLesson ?? ""));
  const resolvedInitialLessonFilter =
    enableCurriculumLessonFilter && requestedLessonFilterTokens.length > 0
      ? curriculumLessonFilterOptions.find((option) =>
          option.tokens.some((token) => requestedLessonFilterTokens.includes(token)),
        )?.value ?? "all"
      : "all";

  const activeLessonFilter =
    enableCurriculumLessonFilter && (selectedLessonFilter || resolvedInitialLessonFilter)
      ? selectedLessonFilter || resolvedInitialLessonFilter
      : "all";

  const contextPeriodTokens = Array.from(
    new Set(
      defaultCurriculumPeriodValues
        .flatMap((value) => extractLessonFilterTokens(String(value ?? "")))
        .filter(Boolean),
    ),
  );

  const contextTopicCandidates = Array.from(
    new Set(
      defaultCurriculumTopicValues
        .flatMap((value) => extractTopicFilterCandidates(String(value ?? "")))
        .filter(Boolean),
    ),
  );

  const contextTopicBlockKeys = Array.from(
    new Set(
      defaultCurriculumTopicValues
        .flatMap((value) => extractTopicBlockKeys(String(value ?? "")))
        .filter(Boolean),
    ),
  );

  const hasContextPeriodFilter = contextPeriodTokens.length > 0;
  const hasContextTopicFilter = contextTopicCandidates.length > 0;
  const hasContextualCurriculumFilter = hasContextPeriodFilter || hasContextTopicFilter;

  const lessonFilteredCurriculumRows =
    enableCurriculumLessonFilter && activeLessonFilter !== "all"
      ? curriculumRows.filter((row) => extractLessonFilterTokens(row.lessons).includes(activeLessonFilter))
      : curriculumRows;

  const periodFilteredCurriculumRows = hasContextPeriodFilter
    ? curriculumRows.filter((row) => {
        const rowTokens = extractLessonFilterTokens(row.periods);
        return contextPeriodTokens.some((token) => rowTokens.includes(token));
      })
    : curriculumRows;

  const topicFilteredCurriculumRows = hasContextTopicFilter
    ? curriculumRows.filter((row) => {
        const rowTopic = normalizeTopicFilterValue(row.topics);
        if (!rowTopic) return false;
        const rowTopicBlockKeys = extractTopicBlockKeys(row.topics);

        if (contextTopicBlockKeys.length > 0 && rowTopicBlockKeys.length > 0) {
          return rowTopicBlockKeys.some((key) => contextTopicBlockKeys.includes(key));
        }

        return contextTopicCandidates.some((candidate) => rowTopic === candidate || rowTopic.includes(candidate));
      })
    : curriculumRows;

  const contextualCurriculumRows = (() => {
    if (!hasContextualCurriculumFilter) return lessonFilteredCurriculumRows;

    if (enableCurriculumLessonFilter && activeLessonFilter !== "all" && lessonFilteredCurriculumRows.length > 0) {
      // When a lesson filter is active, keep rows in the current unit/topic context first.
      if (hasContextTopicFilter) {
        const lessonAndTopicRows = lessonFilteredCurriculumRows.filter((row) => topicFilteredCurriculumRows.includes(row));
        if (lessonAndTopicRows.length > 0) return lessonAndTopicRows;
      }

      if (hasContextPeriodFilter) {
        const lessonAndPeriodRows = lessonFilteredCurriculumRows.filter((row) => periodFilteredCurriculumRows.includes(row));
        if (lessonAndPeriodRows.length > 0) return lessonAndPeriodRows;
      }

      return lessonFilteredCurriculumRows;
    }

    if (hasContextPeriodFilter && hasContextTopicFilter) {
      const strictRows = periodFilteredCurriculumRows.filter((row) => topicFilteredCurriculumRows.includes(row));
      if (strictRows.length > 0) return strictRows;
    }

    if (hasContextPeriodFilter && periodFilteredCurriculumRows.length > 0) {
      return periodFilteredCurriculumRows;
    }

    if (hasContextTopicFilter && topicFilteredCurriculumRows.length > 0) {
      return topicFilteredCurriculumRows;
    }

    return lessonFilteredCurriculumRows;
  })();

  const filteredCurriculumRows =
    enableCurriculumLessonFilter && !showFullSyllabusTable
      ? contextualCurriculumRows
      : curriculumRows;

  const shouldShowSupplementaryContent = !collapseSupplementaryContent || showSupplementaryContent;
  const currentCurriculumPeriodLabel = defaultCurriculumPeriodValues.find((value) => String(value ?? "").trim()) ?? null;
  const currentCurriculumTopicLabel = defaultCurriculumTopicValues.find((value) => String(value ?? "").trim()) ?? null;

  const curriculumTopicGroups = (() => {
    type TopicGroup = {
      topic: string;
      rows: CurriculumTableRow[];
    };

    const groups: TopicGroup[] = [];
    let currentTopic = "";

    for (const row of filteredCurriculumRows) {
      const nextTopic = row.topics.trim() || currentTopic || "Chưa xác định topic";
      const last = groups[groups.length - 1];

      if (!last || last.topic !== nextTopic) {
        groups.push({ topic: nextTopic, rows: [row] });
      } else {
        last.rows.push(row);
      }

      currentTopic = nextTopic;
    }

    return groups;
  })();

  const shouldPreferCurriculumFallback =
    filteredCurriculumRows.length > 0 &&
    (structuredTableSections.length === 0 || filteredCurriculumRows.length > structuredTableRowCount);

  const showCurriculumFallbackTable =
    filteredCurriculumRows.length > 0 && (showFullSyllabusTable || shouldPreferCurriculumFallback || enableCurriculumLessonFilter);
  const showStructuredTableSections =
    structuredTableSections.length > 0 && !showCurriculumFallbackTable;

  const extractBlockLabel = (text: string): string => {
    const normalized = text.replace(/\s+/g, " ").trim();
    if (!normalized) return "";

    const starterMatch = normalized.match(/\b(starter(?:\s*[:\-]\s*[^|]+)?)/i);
    if (starterMatch?.[1]) return starterMatch[1].trim();

    const unitMatch = normalized.match(/\b(unit\s*\d+\s*[:\-]?\s*[^|]*)/i);
    if (unitMatch?.[1]) return unitMatch[1].trim();

    return "";
  };

  const narrativeSectionsExpanded = (() => {
    if (narrativeSections.length !== 1) return narrativeSections;
    const only = narrativeSections[0];
    const onlyValue = (only.value ?? "").trim();
    if (!onlyValue) return narrativeSections;

    const splitFromOverview = splitNarrativeSectionsFromText(onlyValue);
    return splitFromOverview.length > 1 ? splitFromOverview : narrativeSections;
  })();

  const mergedNarrativeSections =
    structuredNarrativeSections.length > 0
      ? structuredNarrativeSections
      : narrativeSectionsExpanded.length > 0
      ? narrativeSectionsExpanded
      : rawNarrativeSections.length > 0
        ? rawNarrativeSections
        : rawNarrativeSectionsFromText.length > 0
          ? rawNarrativeSectionsFromText
          : rawNarrativeSectionsFromObjectText.length > 0
            ? rawNarrativeSectionsFromObjectText
            : rawGeneralText
              ? [{ title: "Tổng quan", value: rawGeneralText }]
              : [];

  const shouldShowRawContent =
    Boolean(prettyRawContent) &&
    mergedNarrativeSections.length === 0 &&
    curriculumRows.length === 0;

  const isUsingStructuredSections = structuredSections.length > 0;
  const isUsingStructuredTables = showStructuredTableSections;

  return (
    <>
      <div className="flex items-start justify-between rounded-t-2xl bg-gradient-to-r from-red-600 to-red-700 px-6 py-5">
        <div className="flex items-start gap-3 min-w-0">
          <div className="rounded-xl bg-white/20 p-2.5 shrink-0"><BookOpen size={20} className="text-white" /></div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-white leading-snug">{detail.title}</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-white/20 px-2 py-0.5 font-mono text-xs font-bold text-white">{detail.code}</span>
              <span className="rounded-md bg-white/15 px-2 py-0.5 text-xs text-white/90">{detail.version}</span>
              <ActiveBadge isActive={detail.isActive} />
            </div>
          </div>
        </div>
        {(onEdit || onClose) ? (
          <div className="flex items-center gap-2 ml-3 shrink-0">
            {onEdit ? (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/30 cursor-pointer transition-colors"
              >
                <Pencil size={14} /> Sửa
              </button>
            ) : null}
            {onClose ? (
              <button type="button" onClick={onClose} className="rounded-full p-2 text-white hover:bg-white/20 cursor-pointer">
                <X size={18} />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="grid grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className={cn("rounded-xl border px-3 py-3 text-center", statColors[s.color])}>
              <div className="text-2xl font-extrabold">{s.value}</div>
              <div className="mt-0.5 text-xs font-medium opacity-80">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-semibold",
              isUsingStructuredSections ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
            )}
          >
            {isUsingStructuredSections ? "Nguồn dữ liệu: Structured sections" : "Nguồn dữ liệu: Fallback text"}
          </span>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-semibold",
              isUsingStructuredTables ? "bg-sky-50 text-sky-700" : "bg-gray-100 text-gray-600",
            )}
          >
            {isUsingStructuredTables
              ? `Structured tables: ${structuredTableSections.length} bảng / ${structuredTableRowCount} dòng`
              : "Structured tables: 0"}
          </span>
          {curriculumRows.length > 0 && (
            <button
              type="button"
              onClick={() => setShowFullSyllabusTable((prev) => !prev)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-colors cursor-pointer",
                showFullSyllabusTable
                  ? "bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
                  : "bg-indigo-600 text-white hover:bg-indigo-700",
              )}
            >
              {showFullSyllabusTable
                ? "Thu gọn về lesson hiện tại"
                : `Xem full bảng phân phối (${curriculumRows.length} dòng)`}
            </button>
          )}
          {enableCurriculumLessonFilter && !hideCurriculumLessonSelect && curriculumLessonFilterOptions.length > 0 && !showFullSyllabusTable ? (
            <label className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
              <span>{curriculumLessonFilterLabel}</span>
              <select
                value={activeLessonFilter}
                onChange={(event) => setSelectedLessonFilter(event.target.value)}
                className="rounded-md border border-amber-200 bg-white px-2 py-1 text-xs font-semibold text-gray-700 outline-none"
              >
                <option value="all">Tất cả lesson</option>
                {curriculumLessonFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {enableCurriculumLessonFilter && hideCurriculumLessonSelect && !showFullSyllabusTable ? (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
              {currentCurriculumPeriodLabel ? `Tiết/buổi ${currentCurriculumPeriodLabel}` : "Đang lọc theo buổi hiện tại"}
              {currentCurriculumTopicLabel ? ` · ${String(currentCurriculumTopicLabel).trim()}` : ""}
            </span>
          ) : null}
          {collapseSupplementaryContent ? (
            <button
              type="button"
              onClick={() => setShowSupplementaryContent((prev) => !prev)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-colors cursor-pointer",
                showSupplementaryContent
                  ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  : "bg-slate-700 text-white hover:bg-slate-800",
              )}
            >
              {showSupplementaryContent ? "Ẩn thông tin syllabus" : supplementaryContentToggleLabel}
            </button>
          ) : null}
        </div>

        {shouldShowSupplementaryContent ? (
        <>
        <div className="overflow-hidden rounded-xl border border-gray-200 divide-y divide-gray-100">
          {infoRows.map(({ label, value }) => value != null && value !== "" ? (
            <div key={label} className="flex gap-4 px-4 py-2.5 text-sm hover:bg-gray-50/70">
              <dt className="w-36 shrink-0 font-medium text-gray-500">{label}</dt>
              <dd className="text-gray-800 break-all min-w-0">{String(value)}</dd>
            </div>
          ) : null)}
        </div>

        {mergedNarrativeSections.length > 0 && (
          <div className="space-y-3">
            {mergedNarrativeSections.map((section) => (
              <div key={section.title}>
                <p className="mb-2 text-sm font-semibold text-gray-700">{section.title}</p>
                <p className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {section.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {showStructuredTableSections && (
          <div className="space-y-4">
            {structuredTableSections.map((tableSection) => (
              <div key={tableSection.sectionId} className="space-y-2">
                <p className="text-sm font-semibold text-gray-700">{tableSection.title}</p>
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                  <table className="min-w-[980px] w-full border-collapse text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {tableSection.columns.map((column) => (
                          <th
                            key={column.key}
                            className="border-b border-gray-200 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600"
                          >
                            {column.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableSection.rows.map((row, rowIndex) => (
                        <tr key={`${tableSection.sectionId}-${rowIndex}`} className="odd:bg-white even:bg-gray-50/40">
                          {row.map((cell, cellIndex) => (
                            <td
                              key={`${tableSection.sectionId}-${rowIndex}-${cellIndex}`}
                              className="align-top border-b border-gray-100 px-3 py-2 text-gray-700 whitespace-pre-wrap"
                            >
                              {cell || "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {shouldShowRawContent && (
          <details className="rounded-xl border border-gray-200 bg-white">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-gray-700 select-none">
              Dữ liệu thô (fallback khi chưa parse được dữ liệu hiển thị)
            </summary>
            <div className="border-t border-gray-100 bg-gray-50 p-4">
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-gray-700">
                {prettyRawContent}
              </pre>
            </div>
          </details>
        )}
        </>
        ) : null}

        {showCurriculumFallbackTable && curriculumTopicGroups.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">Bảng phân phối syllabus</p>
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                {filteredCurriculumRows.length} dòng · {curriculumTopicGroups.length} nhóm chủ đề
              </span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="min-w-[1220px] w-full border-collapse text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="sticky top-0 left-0 z-30 w-32 min-w-32 border-b border-r border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Khối
                    </th>
                    <th className="sticky top-0 left-32 z-30 w-28 min-w-28 border-b border-r border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Tiết
                    </th>
                    <th className="sticky top-0 left-[15rem] z-30 w-56 min-w-56 border-b border-r border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Chủ đề
                    </th>
                    <th className="sticky top-0 z-10 w-20 min-w-20 border-b border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      <span className="inline-flex items-center gap-1">
                        Bài
                        <span className="group relative inline-flex items-center">
                          <Info size={12} className="text-gray-400" aria-hidden="true" />
                          <span
                            role="tooltip"
                            className="pointer-events-none invisible absolute left-1/2 top-full z-40 mt-2 w-56 -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-[11px] font-medium normal-case leading-relaxed tracking-normal text-gray-700 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100"
                          >
                            Cột này là chỉ số bài trong bảng phân phối syllabus, có thể khác với Lesson title của lesson plan đang mở.
                          </span>
                        </span>
                      </span>
                    </th>
                    <th className="sticky top-0 z-10 w-72 min-w-72 border-b border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Nội dung
                    </th>
                    <th className="sticky top-0 z-10 w-64 min-w-64 border-b border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Cấu trúc
                    </th>
                    <th className="sticky top-0 z-10 w-28 min-w-28 border-b border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Sách học sinh
                    </th>
                    <th className="sticky top-0 z-10 w-28 min-w-28 border-b border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Sách giáo viên
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {curriculumTopicGroups.map((group, groupIndex) => {
                    const blockColors = [
                      {
                        row: "bg-sky-50/35",
                        topicCell: "bg-sky-100/60 text-sky-900 border-sky-200",
                      },
                      {
                        row: "bg-emerald-50/35",
                        topicCell: "bg-emerald-100/60 text-emerald-900 border-emerald-200",
                      },
                      {
                        row: "bg-amber-50/35",
                        topicCell: "bg-amber-100/60 text-amber-900 border-amber-200",
                      },
                      {
                        row: "bg-rose-50/35",
                        topicCell: "bg-rose-100/60 text-rose-900 border-rose-200",
                      },
                    ] as const;

                    const palette = blockColors[groupIndex % blockColors.length];
                    const detectedLabel =
                      extractBlockLabel(group.topic) ||
                      group.rows.map((row) => extractBlockLabel(`${row.topics} ${row.contents}`)).find(Boolean) ||
                      "Nhóm chủ đề";

                    return group.rows.map((row, rowIndex) => (
                      <tr
                        key={`${group.topic}_${row.periods}_${row.lessons}_${groupIndex}_${rowIndex}`}
                        className={cn(
                          palette.row,
                          rowIndex === group.rows.length - 1 ? "border-b-2 border-b-gray-200" : "",
                        )}
                      >
                        {rowIndex === 0 && (
                          <td
                            rowSpan={group.rows.length}
                            className={cn(
                              "sticky left-0 z-20 align-top border-b border-r border-gray-200 px-3 py-2 text-xs font-bold uppercase tracking-wide whitespace-pre-wrap",
                              palette.topicCell,
                            )}
                          >
                            {detectedLabel}
                          </td>
                        )}
                        <td className={cn("sticky left-32 z-20 align-top border-b border-r border-gray-200 px-3 py-2 text-gray-700 whitespace-pre-wrap", palette.row)}>{row.periods || "—"}</td>
                        {rowIndex === 0 && (
                          <td
                            rowSpan={group.rows.length}
                            className={cn(
                              "sticky left-[15rem] z-20 align-top border-b border-r border-gray-200 px-3 py-2 font-semibold whitespace-pre-wrap",
                              palette.topicCell,
                            )}
                          >
                            {group.topic}
                          </td>
                        )}
                        <td className="align-top border-b border-gray-100 px-3 py-2 text-gray-700 whitespace-pre-wrap">{row.lessons || "—"}</td>
                        <td className="align-top border-b border-gray-100 px-3 py-2 text-gray-700 whitespace-pre-wrap leading-relaxed">{row.contents || "—"}</td>
                        <td className="align-top border-b border-gray-100 px-3 py-2 text-gray-700 whitespace-pre-wrap leading-relaxed">{row.structures || "—"}</td>
                        <td className="align-top border-b border-gray-100 px-3 py-2 text-gray-700 whitespace-pre-wrap">{row.studentsBook || "—"}</td>
                        <td className="align-top border-b border-gray-100 px-3 py-2 text-gray-700 whitespace-pre-wrap">{row.teachersBook || "—"}</td>
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {detail.createdAt && (
          <p className="text-right text-xs text-gray-400">
            Tạo lúc: {new Date(detail.createdAt).toLocaleString("vi-VN")}
          </p>
        )}
      </div>
    </>
  );
}