import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { AlertCircle, CheckCircle2, ShieldAlert, SlidersHorizontal } from "lucide-react";
import type { RiskRuleConfigDto } from "@/types/reports-v3";
import { EmptyState, SectionCard, cn } from "@/components/reports-v3/tabs/shared";

type RiskRuleDraft = { isActive: boolean; score: string; parametersJson: string };

type RiskRulesTabProps = {
  riskRules: RiskRuleConfigDto[];
  riskRuleDrafts: Record<string, RiskRuleDraft>;
  setRiskRuleDrafts: Dispatch<SetStateAction<Record<string, RiskRuleDraft>>>;
  formatRiskType: (value?: string | null) => string;
  onSaveRiskRule: (riskType: string) => void;
};

type RuleFieldConfig = {
  key: string;
  label: string;
  helper: string;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
};

type RuleMeta = {
  title: string;
  summary: string;
  impact: string;
  fields: RuleFieldConfig[];
};

const RULE_ORDER = [
  "low_attendance",
  "attendance_discipline",
  "learning_delay",
  "academic_fail",
  "weak_communication",
  "package_expiring",
  "class_curriculum_delay",
  "high_review_ratio",
] as const;

const RULE_LIBRARY: Record<string, RuleMeta> = {
  low_attendance: {
    title: "Điểm danh thấp",
    summary: "Cảnh báo khi tỷ lệ chuyên cần của học viên xuống dưới ngưỡng.",
    impact: "Ảnh hưởng trực tiếp tới cảnh báo đi học và đề xuất liên hệ phụ huynh.",
    fields: [
      {
        key: "attendanceRateBelow",
        label: "Ngưỡng chuyên cần tối thiểu",
        helper: "Nếu chuyên cần thấp hơn ngưỡng này, hệ thống bật cảnh báo.",
        min: 0,
        max: 100,
        suffix: "%",
      },
      {
        key: "forceHighAttendanceBelow",
        label: "Ngưỡng ép mức cảnh báo cao",
        helper: "Nếu thấp hơn ngưỡng này, cảnh báo ưu tiên cao sẽ được kích hoạt.",
        min: 0,
        max: 100,
        suffix: "%",
      },
    ],
  },
  attendance_discipline: {
    title: "Kỷ luật điểm danh",
    summary: "Cảnh báo khi số lần vắng không báo vượt mức cho phép.",
    impact: "Dùng để nhắc nhở quy định lớp và xác minh lịch học với phụ huynh.",
    fields: [
      {
        key: "absentWithoutNoticeAtLeast",
        label: "Số lần vắng không báo tối thiểu",
        helper: "Từ số lần này trở lên sẽ phát sinh cảnh báo.",
        min: 0,
        max: 20,
      },
    ],
  },
  learning_delay: {
    title: "Chậm tiến độ học tập",
    summary: "Đánh dấu khi học viên đi chậm hơn kỳ vọng chuẩn.",
    impact: "Tạo đề xuất bù kiến thức để kéo lại tiến độ học tập.",
    fields: [
      {
        key: "delayBufferPercent",
        label: "Biên độ chấp nhận trễ",
        helper: "Cho phép trễ trong phạm vi này trước khi báo rủi ro.",
        min: 0,
        max: 100,
        suffix: "%",
      },
    ],
  },
  academic_fail: {
    title: "Kết quả học thuật chưa đạt",
    summary: "Kích hoạt khi kết quả đánh giá mới nhất ở mức không đạt.",
    impact: "Tạo ưu tiên can thiệp học thuật cho lớp/học viên.",
    fields: [],
  },
  weak_communication: {
    title: "Giao tiếp yếu",
    summary: "Phát hiện sớm nhóm học viên thiếu tự tin hoặc ít nói.",
    impact: "Kéo theo đề xuất tăng hoạt động giao tiếp và kèm cặp.",
    fields: [
      {
        key: "speakingAtMost",
        label: "Ngưỡng điểm nói tối đa",
        helper: "Nếu điểm nói thấp hơn hoặc bằng ngưỡng này sẽ cảnh báo.",
        min: 0,
        max: 10,
      },
      {
        key: "confidenceAtMost",
        label: "Ngưỡng tự tin tối đa",
        helper: "Nếu mức tự tin thấp hơn hoặc bằng ngưỡng này sẽ cảnh báo.",
        min: 0,
        max: 10,
      },
    ],
  },
  package_expiring: {
    title: "Sắp hết gói học",
    summary: "Nhắc hệ thống khi số buổi còn lại sắp chạm ngưỡng thấp.",
    impact: "Tạo đề xuất tư vấn gia hạn gói học kịp thời.",
    fields: [
      {
        key: "remainingTicketsAtMost",
        label: "Số buổi còn lại tối đa",
        helper: "Khi số buổi còn lại nhỏ hơn hoặc bằng ngưỡng này sẽ cảnh báo.",
        min: 0,
        max: 50,
      },
    ],
  },
  class_curriculum_delay: {
    title: "Chậm giáo trình lớp",
    summary: "Theo dõi độ lệch giữa tiến độ thực tế và tiến độ kỳ vọng của lớp.",
    impact: "Giúp quản lý chủ động cân chỉnh tiến độ và kế hoạch giảng dạy.",
    fields: [
      {
        key: "progressLagTolerancePercent",
        label: "Biên độ lệch tiến độ cho phép",
        helper: "Nếu chậm vượt ngưỡng này sẽ bật cảnh báo.",
        min: 0,
        max: 100,
        suffix: "%",
      },
    ],
  },
  high_review_ratio: {
    title: "Tỷ lệ ôn tập quá cao",
    summary: "Cảnh báo khi lớp dành quá nhiều thời lượng cho ôn tập.",
    impact: "Hỗ trợ cân bằng giữa ôn tập và nội dung mới trong giáo trình.",
    fields: [
      {
        key: "reviewRatioAtLeast",
        label: "Ngưỡng tỷ lệ ôn tập tối thiểu",
        helper: "Nếu tỷ lệ ôn tập cao hơn hoặc bằng ngưỡng này sẽ cảnh báo.",
        min: 0,
        max: 100,
        suffix: "%",
      },
    ],
  },
};

function normalizeRiskType(value?: string | null) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "";
  return normalized
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toLowerCase();
}

function riskTypeRank(value?: string | null) {
  const key = normalizeRiskType(value);
  const index = RULE_ORDER.indexOf(key as typeof RULE_ORDER[number]);
  return index >= 0 ? index : Number.MAX_SAFE_INTEGER;
}

function parseParameters(parametersJson?: string | null) {
  try {
    const parsed = JSON.parse(String(parametersJson ?? "{}"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function normalizeNumber(value: unknown, fallback: number) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return fallback;
  return numeric;
}

function getDraft(item: RiskRuleConfigDto, drafts: Record<string, RiskRuleDraft>): RiskRuleDraft {
  return drafts[item.riskType] ?? {
    isActive: item.isActive,
    score: String(item.score),
    parametersJson: item.parametersJson || "{}",
  };
}

export default function RiskRulesTab({
  riskRules,
  riskRuleDrafts,
  setRiskRuleDrafts,
  formatRiskType,
  onSaveRiskRule,
}: RiskRulesTabProps) {
  const orderedRules = useMemo(
    () => [...riskRules].sort((left, right) => riskTypeRank(left.riskType) - riskTypeRank(right.riskType)),
    [riskRules],
  );

  const [selectedRiskType, setSelectedRiskType] = useState("");

  const effectiveSelectedRiskType = orderedRules.some((item) => item.riskType === selectedRiskType)
    ? selectedRiskType
    : (orderedRules[0]?.riskType ?? "");

  const selectedRule = useMemo(
    () => orderedRules.find((item) => item.riskType === effectiveSelectedRiskType) || null,
    [effectiveSelectedRiskType, orderedRules],
  );

  const selectedDraft = selectedRule ? getDraft(selectedRule, riskRuleDrafts) : null;
  const selectedMeta = selectedRule ? RULE_LIBRARY[normalizeRiskType(selectedRule.riskType)] : null;
  const selectedParameters = parseParameters(selectedDraft?.parametersJson);
  const hasInvalidParameters = Boolean(selectedDraft && selectedMeta && selectedMeta.fields.length && !selectedParameters);

  const activeRules = orderedRules.filter((item) => getDraft(item, riskRuleDrafts).isActive).length;
  const inactiveRules = orderedRules.length - activeRules;

  const updateDraft = (riskType: string, patch: Partial<RiskRuleDraft>) => {
    const source = orderedRules.find((item) => item.riskType === riskType);
    if (!source) return;

    setRiskRuleDrafts((current) => {
      const base = current[riskType] ?? {
        isActive: source.isActive,
        score: String(source.score),
        parametersJson: source.parametersJson || "{}",
      };
      return { ...current, [riskType]: { ...base, ...patch } };
    });
  };

  const updateSelectedParameter = (field: RuleFieldConfig, rawValue: string) => {
    if (!selectedRule || !selectedDraft) return;
    const parsed = parseParameters(selectedDraft.parametersJson) || {};
    const currentScore = normalizeNumber(parsed[field.key], field.min);
    const nextScore = normalizeNumber(rawValue, currentScore);
    parsed[field.key] = Math.max(field.min, Math.min(field.max, nextScore));
    updateDraft(selectedRule.riskType, { parametersJson: JSON.stringify(parsed, null, 2) });
  };

  const currentScore = normalizeNumber(selectedDraft?.score, 0);

  return (
    <div className="grid gap-6 [grid-template-columns:minmax(0,7fr)_minmax(0,3fr)] max-[1400px]:grid-cols-1">
      <SectionCard
        title="Luật rủi ro tự động (8 luật cố định)"
        subtitle="Chọn luật bên trái, chỉnh ngưỡng bằng form trực quan bên phải rồi lưu. Không cần chỉnh JSON thủ công."
        icon={<ShieldAlert size={18} />}
      >
        {orderedRules.length ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                <div className="text-xs uppercase tracking-wide text-emerald-700">Đang kích hoạt</div>
                <div className="mt-1 text-xl font-bold text-emerald-800">{activeRules}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="text-xs uppercase tracking-wide text-slate-600">Tạm tắt</div>
                <div className="mt-1 text-xl font-bold text-slate-800">{inactiveRules}</div>
              </div>
              <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2">
                <div className="text-xs uppercase tracking-wide text-red-700">Tổng số luật</div>
                <div className="mt-1 text-xl font-bold text-red-800">{orderedRules.length}</div>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
              <div className="max-h-[calc(100dvh-22rem)] space-y-2 overflow-y-auto rounded-2xl border border-gray-200 bg-gray-50 p-2">
                {orderedRules.map((item) => {
                  const draft = getDraft(item, riskRuleDrafts);
                  const normalizedType = normalizeRiskType(item.riskType);
                  const meta = RULE_LIBRARY[normalizedType];

                  return (
                    <button
                      key={item.riskType}
                      type="button"
                      onClick={() => setSelectedRiskType(item.riskType)}
                      className={cn(
                        "w-full rounded-xl border px-3 py-2 text-left transition",
                        item.riskType === effectiveSelectedRiskType
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200 bg-white hover:border-red-200 hover:bg-red-50/40",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold text-gray-900">{meta?.title || formatRiskType(item.riskType)}</div>
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                            draft.isActive
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-100 text-slate-600",
                          )}
                        >
                          {draft.isActive ? "Đang bật" : "Đang tắt"}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">{meta?.summary || "Luật rủi ro hệ thống."}</div>
                      <div className="mt-2 text-xs text-gray-600">Điểm cảnh báo: <span className="font-semibold">{draft.score || item.score}</span></div>
                    </button>
                  );
                })}
              </div>

              {selectedRule && selectedDraft ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-gray-900">{selectedMeta?.title || formatRiskType(selectedRule.riskType)}</div>
                      <div className="mt-1 text-sm text-gray-600">{selectedMeta?.summary || "Luật rủi ro hệ thống."}</div>
                      <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
                        {selectedMeta?.impact || "Luật này ảnh hưởng trực tiếp tới cảnh báo và đề xuất trong tab Báo cáo."}
                      </div>
                    </div>

                    <label className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={selectedDraft.isActive}
                        onChange={(event) => updateDraft(selectedRule.riskType, { isActive: event.target.checked })}
                      />
                      Kích hoạt luật
                    </label>
                  </div>

                  <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-3">
                    <div className="text-sm font-semibold text-gray-900">Điểm cảnh báo</div>
                    <div className="mt-1 text-xs text-gray-600">Điểm càng cao thì mức ưu tiên xử lý càng lớn.</div>
                    <div className="mt-3 grid items-center gap-3 md:grid-cols-[1fr_96px]">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={Math.max(0, Math.min(100, currentScore))}
                        onChange={(event) => updateDraft(selectedRule.riskType, { score: event.target.value })}
                        className="accent-red-600"
                      />
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={selectedDraft.score}
                        onChange={(event) => updateDraft(selectedRule.riskType, { score: event.target.value })}
                        className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-center text-sm font-semibold text-gray-700 outline-none focus:border-red-300"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-sm font-semibold text-gray-900">Ngưỡng điều kiện</div>
                    <div className="mt-1 text-xs text-gray-600">Chỉnh ngưỡng bằng số, hệ thống sẽ tự lưu lại ở định dạng chuẩn.</div>

                    {hasInvalidParameters ? (
                      <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3">
                        <div className="flex items-start gap-2 text-amber-800">
                          <AlertCircle size={16} className="mt-0.5 shrink-0" />
                          <div>
                            <div className="text-sm font-semibold">Dữ liệu tham số hiện tại không hợp lệ</div>
                            <div className="mt-1 text-xs">Nhấn nút lưu luật để hệ thống ghi lại theo định dạng mới.</div>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-3 space-y-3">
                      {selectedMeta?.fields.length ? selectedMeta.fields.map((field) => {
                        const currentValue = normalizeNumber(selectedParameters?.[field.key], field.min);
                        return (
                          <div key={field.key} className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
                            <div className="text-sm font-semibold text-gray-900">{field.label}</div>
                            <div className="mt-1 text-xs text-gray-600">{field.helper}</div>
                            <div className="mt-2 grid items-center gap-3 md:grid-cols-[1fr_120px]">
                              <input
                                type="range"
                                min={field.min}
                                max={field.max}
                                step={field.step ?? 1}
                                value={Math.max(field.min, Math.min(field.max, currentValue))}
                                onChange={(event) => updateSelectedParameter(field, event.target.value)}
                                className="accent-red-600"
                              />
                              <div className="relative">
                                <input
                                  type="number"
                                  min={field.min}
                                  max={field.max}
                                  step={field.step ?? 1}
                                  value={Math.max(field.min, Math.min(field.max, currentValue))}
                                  onChange={(event) => updateSelectedParameter(field, event.target.value)}
                                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 pr-10 text-sm font-semibold text-gray-700 outline-none focus:border-red-300"
                                />
                                {field.suffix ? (
                                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">{field.suffix}</span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      }) : (
                        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                          Luật này không cần thêm ngưỡng phụ. Chỉ cần bật/tắt và chỉnh điểm cảnh báo nếu cần.
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSaveRiskRule(selectedRule.riskType)}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    <CheckCircle2 size={14} />
                    Lưu luật đang chọn
                  </button>
                </div>
              ) : (
                <EmptyState title="Chưa chọn luật" description="Chọn một luật ở cột trái để chỉnh nhanh thông số vận hành." />
              )}
            </div>
          </div>
        ) : (
          <EmptyState title="Chưa có luật rủi ro" description="Backend chưa trả về cấu hình luật rủi ro nào cho Báo cáo V3." />
        )}
      </SectionCard>

      <SectionCard
        title="Checklist vận hành"
        subtitle="Các bước an toàn để admin thao tác nhanh, tránh cấu hình sai."
        icon={<SlidersHorizontal size={18} />}
      >
        <div className="space-y-2 text-sm text-gray-700">
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">1. Chọn luật cần chỉnh ở danh sách bên trái.</div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">2. Điều chỉnh điểm cảnh báo và ngưỡng bằng thanh kéo hoặc ô số.</div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">3. Bấm <span className="font-semibold">Lưu luật đang chọn</span> để áp dụng.</div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">4. Kiểm tra lại tab Báo cáo/Theo dõi để xác nhận cảnh báo hiển thị đúng.</div>
        </div>
      </SectionCard>
    </div>
  );
}
