import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { CheckCircle2, FileText, Loader2, Plus, Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/lightswind/select";
import type { ReportTemplateDto, ReportTemplateType } from "@/types/reports-v3";
import type { TemplateDraft } from "@/components/reports-v3/tabs/types";
import { EmptyState, SectionCard, cn, localizeUiText } from "@/components/reports-v3/tabs/shared";

type TemplatesTabProps = {
  templates: ReportTemplateDto[];
  templateDraft: TemplateDraft;
  setTemplateDraft: Dispatch<SetStateAction<TemplateDraft>>;
  templateTypeOptions: ReportTemplateType[];
  formatTemplateType: (value?: string | null) => string;
  onSaveTemplate: () => void;
  onDeleteTemplate: (templateId: string) => void;
  onResetTemplateDraft: () => void;
  savingTemplate: boolean;
  canEditTemplates: boolean;
  defaultTemplateSchema: string;
};

type SchemaSectionMap = Record<string, string>;
type TemplateSchemaMap = Record<string, SchemaSectionMap>;

const SECTION_LABELS: Record<string, string> = {
  strengths: "Điểm mạnh",
  weaknesses: "Điểm cần cải thiện",
  risk_reasons: "Lý do rủi ro",
  internal_notes: "Ghi chú nội bộ",
  parent_messages: "Thông điệp phụ huynh",
  recommendations: "Đề xuất hành động",
};

const SECTION_HINTS: Record<string, string> = {
  strengths: "Các câu mô tả điểm tích cực của học viên trong kỳ.",
  weaknesses: "Các câu mô tả điểm cần hỗ trợ thêm hoặc đang chậm tiến độ.",
  risk_reasons: "Câu giải thích lý do bật từng cảnh báo rủi ro.",
  internal_notes: "Ghi chú kỹ thuật/nội bộ chỉ dùng trong hệ thống.",
  parent_messages: "Thông điệp gửi phụ huynh theo tình huống chính.",
  recommendations: "Đề xuất hành động theo từng loại rủi ro.",
};

const FIELD_LABELS: Record<string, string> = {
  good_attendance: "Đi học đều",
  strong_progress: "Tiến độ học tốt",
  confident_speaking: "Tự tin giao tiếp",
  learning_delay: "Chậm tiến độ học",
  assessment_fail: "Đánh giá chưa đạt",
  weak_communication: "Giao tiếp còn yếu",
  insight_generated: "Ghi chú sinh nhận định",
  snapshot_immutable: "Ghi chú snapshot bất biến",
  default: "Mặc định",
  academic_fail: "Học thuật chưa đạt",
  low_attendance: "Điểm danh thấp",
  package_expiring: "Sắp hết gói học",
  high_review_ratio: "Tỷ lệ ôn tập cao",
  learningdelay: "Chậm tiến độ học",
  lowattendance: "Điểm danh thấp",
  weakcommunication: "Giao tiếp yếu",
  attendancediscipline: "Kỷ luật điểm danh",
  classcurriculumdelay: "Chậm giáo trình lớp",
};

const SECTION_ORDER = ["strengths", "weaknesses", "risk_reasons", "internal_notes", "parent_messages", "recommendations"] as const;

function parseTemplateSchema(raw: string): TemplateSchemaMap | null {
  try {
    const parsed = JSON.parse(raw || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;

    const result: TemplateSchemaMap = {};
    for (const [sectionKey, sectionValue] of Object.entries(parsed as Record<string, unknown>)) {
      if (!sectionValue || typeof sectionValue !== "object" || Array.isArray(sectionValue)) continue;
      const sectionRecord: SchemaSectionMap = {};
      for (const [itemKey, itemValue] of Object.entries(sectionValue as Record<string, unknown>)) {
        sectionRecord[itemKey] = String(itemValue ?? "");
      }
      result[sectionKey] = sectionRecord;
    }
    return result;
  } catch {
    return null;
  }
}

function labelizeKey(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeTemplateKey(value?: string | null) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "";
  return normalized
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .replace(/__/g, "_")
    .toLowerCase();
}

function formatFieldLabel(key: string) {
  const normalized = normalizeTemplateKey(key).replace(/_/g, "");
  return FIELD_LABELS[normalized] || FIELD_LABELS[normalizeTemplateKey(key)] || labelizeKey(key);
}

function cloneSchemaMap(schema: TemplateSchemaMap): TemplateSchemaMap {
  return Object.fromEntries(Object.entries(schema).map(([section, entries]) => [section, { ...entries }]));
}

export default function TemplatesTab({
  templates,
  templateDraft,
  setTemplateDraft,
  templateTypeOptions,
  formatTemplateType,
  onSaveTemplate,
  onDeleteTemplate,
  onResetTemplateDraft,
  savingTemplate,
  canEditTemplates,
  defaultTemplateSchema,
}: TemplatesTabProps) {
  const [selectedSectionKey, setSelectedSectionKey] = useState("");

  const defaultSchema = useMemo(() => parseTemplateSchema(defaultTemplateSchema) || {}, [defaultTemplateSchema]);
  const currentSchema = useMemo(() => parseTemplateSchema(templateDraft.contentSchema), [templateDraft.contentSchema]);

  const effectiveSchema = useMemo(() => {
    const merged: TemplateSchemaMap = cloneSchemaMap(defaultSchema);

    if (currentSchema) {
      for (const [sectionKey, sectionValues] of Object.entries(currentSchema)) {
        if (!merged[sectionKey]) {
          merged[sectionKey] = {};
        }
        for (const [itemKey, itemValue] of Object.entries(sectionValues)) {
          merged[sectionKey][itemKey] = itemValue;
        }
      }
    }

    return merged;
  }, [currentSchema, defaultSchema]);

  const orderedSections = useMemo(() => {
    const keys = Object.keys(effectiveSchema);
    const ordered = [...SECTION_ORDER.filter((key) => keys.includes(key)), ...keys.filter((key) => !SECTION_ORDER.includes(key as typeof SECTION_ORDER[number]))];
    return ordered.map((sectionKey) => ({
      sectionKey,
      sectionLabel: SECTION_LABELS[sectionKey] || labelizeKey(sectionKey),
      entries: Object.entries(effectiveSchema[sectionKey] || {}),
    }));
  }, [effectiveSchema]);

  const activeSectionKey = orderedSections.some((item) => item.sectionKey === selectedSectionKey)
    ? selectedSectionKey
    : (orderedSections[0]?.sectionKey ?? "");

  const activeSection = orderedSections.find((item) => item.sectionKey === activeSectionKey) || null;

  const updateSchemaValue = (sectionKey: string, itemKey: string, value: string) => {
    const nextSchema = cloneSchemaMap(effectiveSchema);
    if (!nextSchema[sectionKey]) {
      nextSchema[sectionKey] = {};
    }
    nextSchema[sectionKey][itemKey] = value;
    setTemplateDraft((current) => ({
      ...current,
      contentSchema: JSON.stringify(nextSchema, null, 2),
    }));
  };

  return (
    <div className="grid gap-6 [grid-template-columns:minmax(0,7fr)_minmax(0,3fr)] max-[1400px]:grid-cols-1">
      <SectionCard
        title={canEditTemplates ? (templateDraft.id ? "Chỉnh sửa mẫu báo cáo" : "Tạo mẫu báo cáo") : "Chi tiết mẫu báo cáo"}
        subtitle={canEditTemplates ? "Cấu hình theo nhóm nội dung để chỉnh nhanh, giảm cuộn dài và không cần sửa JSON thô." : "Chế độ chỉ đọc cho quản lý để rà soát template."}
        icon={<Sparkles size={18} />}
        className="flex h-[calc(100dvh-15rem)] min-h-0 flex-col max-[1400px]:h-auto"
        contentClassName="min-h-0 flex-1"
      >
        <div className="flex h-full min-h-0 flex-col gap-3">
          <div className="grid gap-2 md:grid-cols-2">
            <input
              value={templateDraft.code}
              onChange={(event) => setTemplateDraft((current) => ({ ...current, code: event.target.value }))}
              placeholder="Mã mẫu báo cáo"
              disabled={!canEditTemplates}
              className="h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm text-gray-700 outline-none disabled:bg-gray-50 focus:border-red-300"
            />
            <input
              value={templateDraft.name}
              onChange={(event) => setTemplateDraft((current) => ({ ...current, name: event.target.value }))}
              placeholder="Tên mẫu báo cáo"
              disabled={!canEditTemplates}
              className="h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm text-gray-700 outline-none disabled:bg-gray-50 focus:border-red-300"
            />
            <Select
              value={templateDraft.type}
              onValueChange={(value) => setTemplateDraft((current) => ({ ...current, type: value as ReportTemplateType }))}
              disabled={!canEditTemplates}
            >
              <SelectTrigger className="h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm text-gray-700 disabled:bg-gray-50">
                <SelectValue placeholder="Loại mẫu báo cáo" />
              </SelectTrigger>
              <SelectContent>
                {templateTypeOptions.map((item) => <SelectItem key={item} value={item}>{formatTemplateType(item)}</SelectItem>)}
              </SelectContent>
            </Select>
            <label className="flex h-11 items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={templateDraft.isActive}
                onChange={(event) => setTemplateDraft((current) => ({ ...current, isActive: event.target.checked }))}
                disabled={!canEditTemplates}
              />
              Kích hoạt mẫu báo cáo
            </label>
          </div>

          {currentSchema ? (
            <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-gray-200 bg-gray-50">
              <div className="border-b border-gray-200 px-3 py-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Nhóm nội dung</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {orderedSections.map((section) => (
                    <button
                      key={section.sectionKey}
                      type="button"
                      onClick={() => setSelectedSectionKey(section.sectionKey)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                        activeSectionKey === section.sectionKey
                          ? "border-red-300 bg-red-50 text-red-700"
                          : "border-gray-200 bg-white text-gray-600 hover:border-red-200 hover:bg-red-50/40",
                      )}
                    >
                      {section.sectionLabel}
                    </button>
                  ))}
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                {activeSection ? (
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-gray-200 bg-white px-3 py-2">
                      <div className="text-sm font-semibold text-gray-900">{activeSection.sectionLabel}</div>
                      <div className="mt-1 text-xs text-gray-600">
                        {SECTION_HINTS[activeSection.sectionKey] || "Nội dung cố định cho nhóm này."}
                      </div>
                    </div>
                    {activeSection.entries.length ? (
                      <div className="grid gap-2 xl:grid-cols-2">
                        {activeSection.entries.map(([itemKey, itemValue]) => (
                          <div key={`${activeSection.sectionKey}-${itemKey}`} className="rounded-xl border border-gray-200 bg-white p-2.5">
                            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{formatFieldLabel(itemKey)}</div>
                            <textarea
                              value={itemValue}
                              onChange={(event) => updateSchemaValue(activeSection.sectionKey, itemKey, event.target.value)}
                              disabled={!canEditTemplates}
                              rows={2}
                              className="mt-1 w-full resize-y rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2 text-sm text-gray-700 outline-none disabled:bg-gray-100 focus:border-red-300"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-gray-200 bg-white px-3 py-4 text-sm text-gray-500">
                        Nhóm này chưa có nội dung.
                      </div>
                    )}
                  </div>
                ) : (
                  <EmptyState title="Chưa có nhóm nội dung" description="Schema hiện tại chưa có dữ liệu để hiển thị." />
                )}
              </div>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-amber-200 bg-amber-50 p-3">
              <div className="text-sm font-semibold text-amber-800">Schema hiện tại không theo cấu trúc cố định</div>
              <div className="mt-1 text-sm text-amber-700">Bạn vẫn có thể chỉnh JSON thô bên dưới, sau đó lưu để chuẩn hóa dữ liệu.</div>
              <textarea
                value={templateDraft.contentSchema}
                onChange={(event) => setTemplateDraft((current) => ({ ...current, contentSchema: event.target.value }))}
                disabled={!canEditTemplates}
                rows={12}
                className="mt-2 w-full rounded-2xl border border-amber-200 bg-white px-3 py-3 text-sm text-gray-700 outline-none disabled:bg-gray-100 focus:border-red-300"
              />
            </div>
          )}

          {canEditTemplates ? (
            <div className="flex flex-wrap gap-2 border-t border-gray-200 pt-3">
              <button
                type="button"
                onClick={onSaveTemplate}
                disabled={savingTemplate}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {savingTemplate ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Lưu mẫu báo cáo
              </button>
              <button
                type="button"
                onClick={onResetTemplateDraft}
                className="rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Đặt lại
              </button>
            </div>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard
        title="Danh mục mẫu báo cáo"
        subtitle="Danh sách mẫu hiện có. Chọn mẫu để nạp nhanh vào form cấu hình bên trái."
        icon={<FileText size={18} />}
        className="flex h-[calc(100dvh-15rem)] min-h-0 flex-col max-[1400px]:h-auto"
        contentClassName="min-h-0 flex-1"
        action={canEditTemplates ? (
          <button
            type="button"
            onClick={onResetTemplateDraft}
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Plus size={14} />
            Tạo mẫu mới
          </button>
        ) : null}
      >
        {templates.length ? (
          <div className="h-full overflow-y-auto pr-1">
            <div className="mb-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
              Tổng cộng <span className="font-semibold text-gray-800">{templates.length}</span> mẫu.
            </div>
            {templates.map((item) => (
              <div key={item.id} className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-gray-900">{localizeUiText(item.name) || item.name}</div>
                    <div className="mt-1 text-sm text-gray-500">{item.code} • {formatTemplateType(item.type)} • {item.isActive ? "Đang dùng" : "Ngừng dùng"}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTemplateDraft({
                        id: item.id,
                        code: item.code,
                        name: localizeUiText(item.name) || item.name,
                        type: item.type as ReportTemplateType,
                        contentSchema: item.contentSchema || defaultTemplateSchema,
                        isActive: item.isActive,
                      })}
                      className="rounded-2xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Xem
                    </button>
                    {canEditTemplates ? (
                      <button
                        type="button"
                        onClick={() => onDeleteTemplate(item.id)}
                        className="rounded-2xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                      >
                        Xóa
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Chưa có mẫu báo cáo" description="Tạo mẫu đầu tiên hoặc chọn loại template khác để bắt đầu cấu hình." />
        )}
      </SectionCard>
    </div>
  );
}
