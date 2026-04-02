"use client";

import { useState } from "react";
import { Brain, Loader2, Sparkles, Wand2 } from "lucide-react";

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

export default function AiQuickGradeCard({
  homeworkStudentId,
  onApplied,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [language, setLanguage] = useState("vi");
  const [instructions, setInstructions] = useState("");
  const [rubric, setRubric] = useState("");
  const [expectedAnswerText, setExpectedAnswerText] = useState("");
  const [result, setResult] = useState<HomeworkQuickGradeResult | null>(null);

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
      onApplied?.(normalized);

      if (!normalized.aiUsed) {
        toast({
          title: "AI chua cham duoc",
          description:
            normalized.warnings[0] ||
            "He thong da thu cham nhanh nhung chua tra ve ket qua kha dung.",
          type: "warning",
        });
      } else if (normalized.persisted) {
        toast({
          title: "AI cham nhanh thanh cong",
          description: "Diem va feedback AI da duoc cap nhat vao bai nop.",
          type: "success",
        });
      } else {
        toast({
          title: "AI da phan tich",
          description: "Da co ket qua AI, nhung backend chua persist vao bai nop.",
          type: "warning",
        });
      }
    } catch (error: any) {
      toast({
        title: "Khong the AI cham nhanh",
        description:
          error?.response?.data?.message ||
          error?.response?.data?.detail ||
          error?.message ||
          "Vui long thu lai sau.",
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
            <h3 className="text-base font-semibold">AI cham nhanh</h3>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600">
            Backend se tu chon luong A3 hoac A8 tuy theo assignment, sau do tra ve diem,
            summary, strengths, issues va speaking metrics neu co.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAdvanced((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
          >
            <Wand2 size={14} />
            {showAdvanced ? "An tuy chinh" : "Mo tuy chinh"}
          </button>
          <button
            onClick={handleQuickGrade}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            AI cham nhanh
          </button>
        </div>
      </div>

      {showAdvanced && (
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Ngon ngu</label>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-300"
            >
              <option value="vi">Tieng Viet</option>
              <option value="en">English</option>
            </select>
          </div>
          <div className="space-y-2 lg:col-span-2">
            <label className="text-sm font-medium text-gray-700">Expected answer / text</label>
            <textarea
              value={expectedAnswerText}
              onChange={(event) => setExpectedAnswerText(event.target.value)}
              rows={2}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-300"
              placeholder="Override dap an mau neu muon AI cham sat rubric hon."
            />
          </div>
          <div className="space-y-2 lg:col-span-3">
            <label className="text-sm font-medium text-gray-700">Instructions</label>
            <textarea
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              rows={2}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-300"
              placeholder="Vi du: uu tien grammar va kha nang dien dat."
            />
          </div>
          <div className="space-y-2 lg:col-span-3">
            <label className="text-sm font-medium text-gray-700">Rubric</label>
            <textarea
              value={rubric}
              onChange={(event) => setRubric(event.target.value)}
              rows={3}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-300"
              placeholder="Neu can, ban co the gui rubric rieng cho AI."
            />
          </div>
        </div>
      )}

      {result && (
        <div className="mt-5 space-y-4 rounded-2xl border border-indigo-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-gray-900">Ket qua AI</div>
              {result.summary ? (
                <p className="mt-1 text-sm leading-relaxed text-gray-600">
                  {result.summary}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                {result.isSpeakingAnalysis ? "Speaking" : "Text grading"}
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                {result.aiUsed ? "aiUsed = true" : "aiUsed = false"}
              </span>
              {result.persisted !== undefined ? (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                  {result.persisted ? "Persisted" : "Preview only"}
                </span>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">Score</div>
              <div className="mt-2 text-2xl font-bold text-gray-900">
                {result.score ?? "—"}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">Raw AI</div>
              <div className="mt-2 text-2xl font-bold text-gray-900">
                {result.rawAiScore ?? "—"}
                {result.rawAiMaxScore !== null && result.rawAiMaxScore !== undefined
                  ? ` / ${result.rawAiMaxScore}`
                  : ""}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">Status</div>
              <div className="mt-2 text-base font-semibold text-gray-900">
                {result.status || "—"}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">Stars</div>
              <div className="mt-2 text-2xl font-bold text-gray-900">
                {result.stars ?? "—"}
              </div>
            </div>
          </div>

          {(result.pronunciationScore !== null ||
            result.fluencyScore !== null ||
            result.accuracyScore !== null) && (
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4">
                <div className="text-xs uppercase tracking-wide text-cyan-700">
                  Pronunciation
                </div>
                <div className="mt-2 text-xl font-bold text-cyan-900">
                  {result.pronunciationScore ?? "—"}
                </div>
              </div>
              <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4">
                <div className="text-xs uppercase tracking-wide text-cyan-700">
                  Fluency
                </div>
                <div className="mt-2 text-xl font-bold text-cyan-900">
                  {result.fluencyScore ?? "—"}
                </div>
              </div>
              <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4">
                <div className="text-xs uppercase tracking-wide text-cyan-700">
                  Accuracy
                </div>
                <div className="mt-2 text-xl font-bold text-cyan-900">
                  {result.accuracyScore ?? "—"}
                </div>
              </div>
            </div>
          )}

          {result.extractedStudentAnswer ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">
                Extracted student answer
              </div>
              <div className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                {result.extractedStudentAnswer}
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <PillList title="Strengths" items={result.strengths} tone="emerald" />
            <PillList title="Issues" items={result.issues} tone="rose" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <PillList title="Suggestions" items={result.suggestions} tone="blue" />
            <PillList
              title="Mispronounced words"
              items={result.mispronouncedWords}
              tone="amber"
            />
          </div>
          <PillList title="Practice plan" items={result.practicePlan} tone="blue" />

          {result.warnings.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="mb-2 text-sm font-semibold text-amber-800">
                Warnings
              </div>
              <ul className="space-y-1 text-sm text-amber-700">
                {result.warnings.map((warning, index) => (
                  <li key={`warning-${index}`}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
