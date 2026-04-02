"use client";

import { useMemo, useState } from "react";
import {
  Brain,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react";

import { post } from "@/lib/axios";
import { toast } from "@/hooks/use-toast";

export type HomeworkQuickGradeResult = {
  id?: string;
  assignmentId?: string;
  isSpeakingAnalysis?: boolean;
  aiUsed: boolean;
  persisted?: boolean;
  status?: string;
  score?: number | null;
  rawAiScore?: number | null;
  rawAiMaxScore?: number | null;
  summary?: string;
  strengths: string[];
  issues: string[];
  suggestions: string[];
  warnings: string[];
  gradedAt?: string | null;
  stars?: number | null;
  pronunciationScore?: number | null;
  fluencyScore?: number | null;
  accuracyScore?: number | null;
  mispronouncedWords: string[];
  extractedStudentAnswer?: string | null;
  practicePlan: string[];
};

type Props = {
  homeworkStudentId: string;
  onApplied?: (result: HomeworkQuickGradeResult) => void;
};

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
}

function normalizeQuickGradeResult(payload: any): HomeworkQuickGradeResult {
  return {
    id: payload?.id,
    assignmentId: payload?.assignmentId,
    isSpeakingAnalysis: Boolean(payload?.isSpeakingAnalysis),
    aiUsed: Boolean(payload?.aiUsed),
    persisted: payload?.persisted,
    status: payload?.status,
    score: payload?.score !== undefined ? Number(payload.score) : null,
    rawAiScore:
      payload?.rawAiScore !== undefined ? Number(payload.rawAiScore) : null,
    rawAiMaxScore:
      payload?.rawAiMaxScore !== undefined ? Number(payload.rawAiMaxScore) : null,
    summary: payload?.summary,
    strengths: toStringArray(payload?.strengths),
    issues: toStringArray(payload?.issues),
    suggestions: toStringArray(payload?.suggestions),
    warnings: toStringArray(payload?.warnings),
    gradedAt: payload?.gradedAt ?? null,
    stars: payload?.stars !== undefined ? Number(payload.stars) : null,
    pronunciationScore:
      payload?.pronunciationScore !== undefined
        ? Number(payload.pronunciationScore)
        : null,
    fluencyScore:
      payload?.fluencyScore !== undefined ? Number(payload.fluencyScore) : null,
    accuracyScore:
      payload?.accuracyScore !== undefined ? Number(payload.accuracyScore) : null,
    mispronouncedWords: toStringArray(payload?.mispronouncedWords),
    extractedStudentAnswer: payload?.extractedStudentAnswer ?? null,
    practicePlan: toStringArray(payload?.practicePlan),
  };
}

function normalizeStatusLabel(status?: string | null) {
  switch (String(status || "").toLowerCase()) {
    case "assigned":
      return "Đã giao";
    case "submitted":
      return "Đã nộp";
    case "graded":
      return "Đã chấm";
    case "late":
      return "Nộp trễ";
    case "missing":
      return "Thiếu bài";
    default:
      return status || "-";
  }
}

function PillList({
  title,
  items,
  tone = "blue",
}: {
  title: string;
  items: string[];
  tone?: "blue" | "amber" | "rose" | "emerald";
}) {
  if (items.length === 0) {
    return null;
  }

  const toneClass =
    tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : tone === "rose"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : tone === "emerald"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-sky-200 bg-sky-50 text-sky-700";

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span
            key={`${title}-${index}`}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${toneClass}`}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function ResultStatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "cyan";
}) {
  const baseClass =
    tone === "cyan"
      ? "border-cyan-200 bg-cyan-50"
      : "border-gray-200 bg-gray-50";
  const labelClass =
    tone === "cyan"
      ? "text-cyan-700"
      : "text-gray-500";
  const valueClass =
    tone === "cyan"
      ? "text-cyan-900"
      : "text-gray-900";

  return (
    <div className={`rounded-xl border p-4 ${baseClass}`}>
      <div className={`text-xs uppercase tracking-wide ${labelClass}`}>{label}</div>
      <div className={`mt-2 text-xl font-bold ${valueClass}`}>{value}</div>
    </div>
  );
}

export default function AiQuickGradeCard({
  homeworkStudentId,
  onApplied,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [language, setLanguage] = useState("vi");
  const [instructions, setInstructions] = useState("");
  const [rubric, setRubric] = useState("");
  const [expectedAnswerText, setExpectedAnswerText] = useState("");
  const [result, setResult] = useState<HomeworkQuickGradeResult | null>(null);

  const hasSpeakingMetrics = useMemo(() => {
    if (!result?.isSpeakingAnalysis) {
      return false;
    }

    return [result.pronunciationScore, result.fluencyScore, result.accuracyScore].some(
      (value) => value !== null && value !== undefined
    );
  }, [result]);

  const hasSpeakingExtras = useMemo(() => {
    if (!result?.isSpeakingAnalysis) {
      return false;
    }

    return (
      (result.stars !== null && result.stars !== undefined) ||
      hasSpeakingMetrics ||
      result.mispronouncedWords.length > 0 ||
      result.practicePlan.length > 0
    );
  }, [hasSpeakingMetrics, result]);

  const previewStrengths = result?.strengths.slice(0, 2) ?? [];
  const previewIssues = result?.issues.slice(0, 2) ?? [];
  const previewSuggestions = result?.suggestions.slice(0, 2) ?? [];

  const handleQuickGrade = async () => {
    setLoading(true);

    try {
      const response = await post<any>(
        `/api/homework/submissions/${homeworkStudentId}/quick-grade`,
        {
          language,
          instructions: instructions.trim() || undefined,
          rubric: rubric.trim() || undefined,
          expectedAnswerText: expectedAnswerText.trim() || undefined,
        }
      );

      const body = response?.data || response;
      const payload = body?.data ?? body;
      const normalized = normalizeQuickGradeResult(payload);

      setResult(normalized);
      setShowDetails(false);
      onApplied?.(normalized);

      if (!normalized.aiUsed) {
        toast({
          title: "AI chưa chấm được",
          description:
            normalized.warnings[0] ||
            "Hệ thống đã thử chấm nhanh nhưng chưa trả về kết quả khả dụng.",
          type: "warning",
        });
      } else if (normalized.persisted) {
        toast({
          title: "AI chấm nhanh thành công",
          description: "Điểm và phản hồi AI đã được cập nhật vào bài nộp.",
          type: "success",
        });
      } else {
        toast({
          title: "AI đã phân tích",
          description: "Đã có kết quả AI, nhưng backend chưa lưu vào bài nộp.",
          type: "warning",
        });
      }
    } catch (error: any) {
      toast({
        title: "Không thể chấm nhanh bằng AI",
        description:
          error?.response?.data?.message ||
          error?.response?.data?.detail ||
          error?.message ||
          "Vui lòng thử lại sau.",
        type: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-indigo-700">
            <Brain size={18} />
            <h3 className="text-base font-semibold">AI chấm nhanh</h3>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600">
            AI sẽ gợi ý điểm và nhận xét trước, rồi đổ kết quả xuống form bên dưới
            để giáo viên chỉnh lại nhanh và lưu ngay.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAdvanced((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
          >
            <Wand2 size={14} />
            {showAdvanced ? "Ẩn tùy chỉnh" : "Mở tùy chỉnh"}
          </button>
          <button
            type="button"
            onClick={handleQuickGrade}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            AI chấm nhanh
          </button>
        </div>
      </div>

      {showAdvanced ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Ngôn ngữ</label>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-300"
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </div>
          <div className="space-y-2 lg:col-span-2">
            <label className="text-sm font-medium text-gray-700">
              Đáp án mẫu / đoạn văn kỳ vọng
            </label>
            <textarea
              value={expectedAnswerText}
              onChange={(event) => setExpectedAnswerText(event.target.value)}
              rows={2}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-300"
              placeholder="Nhập đáp án mẫu nếu muốn AI chấm sát tiêu chí hơn."
            />
          </div>
          <div className="space-y-2 lg:col-span-3">
            <label className="text-sm font-medium text-gray-700">Yêu cầu thêm cho AI</label>
            <textarea
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              rows={2}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-300"
              placeholder="Ví dụ: ưu tiên ngữ pháp, mạch ý và cách diễn đạt rõ ràng."
            />
          </div>
          <div className="space-y-2 lg:col-span-3">
            <label className="text-sm font-medium text-gray-700">Tiêu chí chấm</label>
            <textarea
              value={rubric}
              onChange={(event) => setRubric(event.target.value)}
              rows={3}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-300"
              placeholder="Nếu cần, bạn có thể gửi rubric riêng cho AI."
            />
          </div>
        </div>
      ) : null}

      {result ? (
        <div className="mt-5 space-y-4 rounded-2xl border border-indigo-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-gray-900">Kết quả AI</div>
              {result.summary ? (
                <p className="mt-1 text-sm leading-relaxed text-gray-600">
                  {result.summary}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                {result.isSpeakingAnalysis ? "Bài nói" : "Bài viết"}
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                {result.aiUsed ? "AI đã dùng" : "AI chưa dùng"}
              </span>
              {result.persisted !== undefined ? (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                  {result.persisted ? "Đã lưu" : "Chỉ xem trước"}
                </span>
              ) : null}
            </div>
          </div>

          <div className={`grid gap-3 ${hasSpeakingExtras ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
            <ResultStatCard label="Điểm gợi ý" value={result.score ?? "-"} />
            <ResultStatCard
              label="Điểm AI gốc"
              value={
                result.rawAiMaxScore !== null && result.rawAiMaxScore !== undefined
                  ? `${result.rawAiScore ?? "-"} / ${result.rawAiMaxScore}`
                  : (result.rawAiScore ?? "-")
              }
            />
            <ResultStatCard
              label="Trạng thái"
              value={normalizeStatusLabel(result.status)}
            />
            {hasSpeakingExtras ? (
              <ResultStatCard label="Sao" value={result.stars ?? "-"} />
            ) : null}
          </div>

          {hasSpeakingMetrics ? (
            <div className="grid gap-3 md:grid-cols-3">
              <ResultStatCard
                label="Phát âm"
                value={result.pronunciationScore ?? "-"}
                tone="cyan"
              />
              <ResultStatCard
                label="Độ trôi chảy"
                value={result.fluencyScore ?? "-"}
                tone="cyan"
              />
              <ResultStatCard
                label="Độ chính xác"
                value={result.accuracyScore ?? "-"}
                tone="cyan"
              />
            </div>
          ) : null}

          {previewStrengths.length > 0 ||
          previewIssues.length > 0 ||
          previewSuggestions.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-3">
              <PillList title="Điểm mạnh" items={previewStrengths} tone="emerald" />
              <PillList title="Cần cải thiện" items={previewIssues} tone="rose" />
              <PillList title="Gợi ý" items={previewSuggestions} tone="blue" />
            </div>
          ) : null}

          {result.extractedStudentAnswer ||
          result.mispronouncedWords.length > 0 ||
          result.practicePlan.length > 0 ||
          result.strengths.length > 2 ||
          result.issues.length > 2 ||
          result.suggestions.length > 2 ||
          result.warnings.length > 0 ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
              <button
                type="button"
                onClick={() => setShowDetails((prev) => !prev)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-800"
              >
                {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {showDetails ? "Ẩn chi tiết AI" : "Xem thêm chi tiết AI"}
              </button>

              {showDetails ? (
                <div className="mt-4 space-y-4">
                  {result.extractedStudentAnswer ? (
                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                      <div className="text-xs uppercase tracking-wide text-gray-500">
                        Nội dung AI trích xuất
                      </div>
                      <div className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                        {result.extractedStudentAnswer}
                      </div>
                    </div>
                  ) : null}

                  <div className="grid gap-4 lg:grid-cols-2">
                    <PillList title="Điểm mạnh" items={result.strengths} tone="emerald" />
                    <PillList title="Cần cải thiện" items={result.issues} tone="rose" />
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <PillList title="Gợi ý" items={result.suggestions} tone="blue" />
                    <PillList
                      title="Từ phát âm chưa chuẩn"
                      items={result.mispronouncedWords}
                      tone="amber"
                    />
                  </div>

                  <PillList
                    title="Kế hoạch luyện tập"
                    items={result.practicePlan}
                    tone="blue"
                  />

                  {result.warnings.length > 0 ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <div className="mb-2 text-sm font-semibold text-amber-800">
                        Lưu ý
                      </div>
                      <ul className="space-y-1 text-sm text-amber-700">
                        {result.warnings.map((warning, index) => (
                          <li key={`warning-${index}`}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
