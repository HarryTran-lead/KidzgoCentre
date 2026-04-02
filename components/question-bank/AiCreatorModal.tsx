"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Brain,
  Loader2,
  PlusCircle,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";

import { toast } from "@/hooks/use-toast";
import {
  createAdminQuestion,
  generateAiQuestionDrafts,
  type AiGenerateQuestionResult,
} from "@/app/api/admin/question-bank";

type CourseOption = {
  id: string;
  name: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  courseOptions: CourseOption[];
  loadingCourses: boolean;
  onSaved?: (count: number) => void;
};

type FormState = {
  programId: string;
  topic: string;
  questionType: "MultipleChoice" | "TextInput";
  questionCount: string;
  level: "Easy" | "Medium" | "Hard";
  skill: string;
  taskStyle: "standard" | "translation";
  grammarTags: string;
  vocabularyTags: string;
  instructions: string;
  language: string;
  pointsPerQuestion: string;
};

const initialFormState: FormState = {
  programId: "",
  topic: "",
  questionType: "MultipleChoice",
  questionCount: "5",
  level: "Medium",
  skill: "",
  taskStyle: "standard",
  grammarTags: "",
  vocabularyTags: "",
  instructions: "",
  language: "vi",
  pointsPerQuestion: "1",
};

function parseTags(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function AiCreatorModal({
  isOpen,
  onClose,
  courseOptions,
  loadingCourses,
  onSaved,
}: Props) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<AiGenerateQuestionResult | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onMouseDown = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("mousedown", onMouseDown);
    return () => {
      document.body.style.overflow = "unset";
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setForm(initialFormState);
      setErrors({});
      setResult(null);
    }
  }, [isOpen]);

  const canSave = useMemo(
    () => Boolean(form.programId && result?.items && result.items.length > 0),
    [form.programId, result]
  );

  if (!isOpen) {
    return null;
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.programId) {
      nextErrors.programId = "Chon khoa hoc.";
    }
    if (!form.topic.trim()) {
      nextErrors.topic = "Topic la bat buoc.";
    }

    const questionCount = Number(form.questionCount);
    if (!Number.isFinite(questionCount) || questionCount < 1 || questionCount > 10) {
      nextErrors.questionCount = "So luong cau hoi phai trong khoang 1-10.";
    }

    const pointsPerQuestion = Number(form.pointsPerQuestion);
    if (!Number.isFinite(pointsPerQuestion) || pointsPerQuestion <= 0) {
      nextErrors.pointsPerQuestion = "Diem moi cau phai lon hon 0.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) {
        return prev;
      }
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleGenerate = async () => {
    if (!validate()) {
      toast({
        title: "Form chua hop le",
        description: "Kiem tra lai topic, khoa hoc va so luong cau hoi.",
        type: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await generateAiQuestionDrafts({
        programId: form.programId,
        topic: form.topic.trim(),
        questionType: form.questionType,
        questionCount: Number(form.questionCount),
        level: form.level,
        skill: form.skill.trim() || undefined,
        taskStyle: form.taskStyle,
        grammarTags: parseTags(form.grammarTags),
        vocabularyTags: parseTags(form.vocabularyTags),
        instructions: form.instructions.trim() || undefined,
        language: form.language,
        pointsPerQuestion: Number(form.pointsPerQuestion),
      });

      setResult(response);

      toast({
        title: "Da tao draft AI",
        description:
          response.items.length > 0
            ? `AI tra ve ${response.items.length} cau hoi draft.`
            : "AI chua tra ve cau hoi hop le.",
        type: response.items.length > 0 ? "success" : "warning",
      });
    } catch (error: any) {
      toast({
        title: "Khong the tao draft AI",
        description: error?.message || "Vui long thu lai sau.",
        type: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    if (!result || result.items.length === 0) {
      return;
    }

    setSaving(true);
    try {
      await createAdminQuestion({
        programId: form.programId,
        items: result.items.map((item) => ({
          questionText: item.questionText,
          questionType: item.questionType,
          options: item.questionType === "MultipleChoice" ? item.options : [],
          correctAnswer: item.correctAnswer,
          points: item.points,
          explanation: item.explanation || undefined,
          level: item.level || form.level,
        })),
      });

      toast({
        title: "Luu draft thanh cong",
        description: `Da tao ${result.items.length} cau hoi tu draft AI vao question bank.`,
        type: "success",
      });

      onSaved?.(result.items.length);
      onClose();
    } catch (error: any) {
      toast({
        title: "Khong the luu draft",
        description: error?.message || "Vui long thu lai sau.",
        type: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm px-4 py-8">
      <div
        ref={modalRef}
        className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-red-200 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between bg-gradient-to-r from-red-600 to-red-700 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white/15 p-2.5">
              <Brain size={20} />
            </div>
            <div>
              <div className="text-lg font-semibold">AI Creator</div>
              <div className="text-sm text-white/80">
                Sinh draft cau hoi cho question bank roi luu ngay trong FE.
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 transition hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid flex-1 gap-0 overflow-hidden lg:grid-cols-[360px,1fr]">
          <div className="overflow-y-auto border-r border-red-100 bg-red-50/30 p-6">
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Khoa hoc
                </label>
                <select
                  value={form.programId}
                  onChange={(event) => handleChange("programId", event.target.value)}
                  className="w-full rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-300"
                >
                  <option value="">
                    {loadingCourses ? "Dang tai..." : "Chon khoa hoc"}
                  </option>
                  {courseOptions.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
                {errors.programId ? (
                  <p className="mt-1 text-xs text-red-600">{errors.programId}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Topic
                </label>
                <input
                  value={form.topic}
                  onChange={(event) => handleChange("topic", event.target.value)}
                  className="w-full rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-300"
                  placeholder="Vi du: family, present simple, jobs..."
                />
                {errors.topic ? (
                  <p className="mt-1 text-xs text-red-600">{errors.topic}</p>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Loai cau hoi
                  </label>
                  <select
                    value={form.questionType}
                    onChange={(event) =>
                      handleChange(
                        "questionType",
                        event.target.value as FormState["questionType"]
                      )
                    }
                    className="w-full rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-300"
                  >
                    <option value="MultipleChoice">MultipleChoice</option>
                    <option value="TextInput">TextInput</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Do kho
                  </label>
                  <select
                    value={form.level}
                    onChange={(event) =>
                      handleChange("level", event.target.value as FormState["level"])
                    }
                    className="w-full rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-300"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    So cau hoi
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={form.questionCount}
                    onChange={(event) =>
                      handleChange("questionCount", event.target.value)
                    }
                    className="w-full rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-300"
                  />
                  {errors.questionCount ? (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.questionCount}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Diem / cau
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.pointsPerQuestion}
                    onChange={(event) =>
                      handleChange("pointsPerQuestion", event.target.value)
                    }
                    className="w-full rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-300"
                  />
                  {errors.pointsPerQuestion ? (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.pointsPerQuestion}
                    </p>
                  ) : null}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Skill
                </label>
                <input
                  value={form.skill}
                  onChange={(event) => handleChange("skill", event.target.value)}
                  className="w-full rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-300"
                  placeholder="Grammar / Vocabulary / Reading..."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Task style
                  </label>
                  <select
                    value={form.taskStyle}
                    onChange={(event) =>
                      handleChange(
                        "taskStyle",
                        event.target.value as FormState["taskStyle"]
                      )
                    }
                    className="w-full rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-300"
                  >
                    <option value="standard">standard</option>
                    <option value="translation">translation</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Language
                  </label>
                  <select
                    value={form.language}
                    onChange={(event) => handleChange("language", event.target.value)}
                    className="w-full rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-300"
                  >
                    <option value="vi">vi</option>
                    <option value="en">en</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Grammar tags
                </label>
                <input
                  value={form.grammarTags}
                  onChange={(event) =>
                    handleChange("grammarTags", event.target.value)
                  }
                  className="w-full rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-300"
                  placeholder="present simple, to be, possessive..."
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Vocabulary tags
                </label>
                <input
                  value={form.vocabularyTags}
                  onChange={(event) =>
                    handleChange("vocabularyTags", event.target.value)
                  }
                  className="w-full rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-300"
                  placeholder="family, jobs, school..."
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Instructions
                </label>
                <textarea
                  rows={4}
                  value={form.instructions}
                  onChange={(event) =>
                    handleChange("instructions", event.target.value)
                  }
                  className="w-full rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-300"
                  placeholder="Huong dan them cho AI neu muon ket qua sat format trung tam hon."
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-3 text-sm font-semibold text-white hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                Tao draft bang AI
              </button>
            </div>
          </div>

          <div className="overflow-y-auto p-6">
            {!result ? (
              <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-red-200 bg-red-50/30 p-10 text-center">
                <div className="max-w-md">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-red-100 text-red-600">
                    <Wand2 size={28} />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">
                    AI Creator dang cho input
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    Chon khoa hoc, nhap topic va bam tao draft. Sau do ban co the
                    review draft va luu thang vao question bank.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="rounded-2xl border border-red-100 bg-red-50/40 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-red-700">
                        <Sparkles size={18} />
                        <div className="font-semibold">Ket qua AI Creator</div>
                      </div>
                      {result.summary ? (
                        <p className="mt-2 text-sm leading-relaxed text-gray-700">
                          {result.summary}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-700">
                        aiUsed = {String(result.aiUsed)}
                      </span>
                      <span className="rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-700">
                        {result.items.length} draft
                      </span>
                    </div>
                  </div>

                  {result.warnings.length > 0 && (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
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

                <div className="space-y-3">
                  {result.items.map((item, index) => (
                    <div
                      key={`${item.questionText}-${index}`}
                      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            Cau {index + 1}
                          </div>
                          <div className="mt-2 text-sm leading-relaxed text-gray-700">
                            {item.questionText}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700">
                            {item.questionType}
                          </span>
                          <span className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700">
                            {item.level || "Medium"}
                          </span>
                          <span className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700">
                            {item.points} diem
                          </span>
                        </div>
                      </div>

                      {item.options.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {item.options.map((option, optionIndex) => (
                            <span
                              key={`${option}-${optionIndex}`}
                              className="rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs text-red-700"
                            >
                              {option}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                          <div className="text-xs uppercase tracking-wide text-gray-500">
                            Correct answer
                          </div>
                          <div className="mt-2 text-sm font-medium text-gray-800">
                            {item.correctAnswer || "—"}
                          </div>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                          <div className="text-xs uppercase tracking-wide text-gray-500">
                            Explanation
                          </div>
                          <div className="mt-2 text-sm text-gray-700">
                            {item.explanation || "Khong co"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-red-100 bg-white px-6 py-4">
          <div className="text-sm text-gray-500">
            AI Creator chi tao draft. Nut ben phai se luu draft vao question bank hien tai.
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onClose}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Dong
            </button>
            <button
              onClick={handleSaveAll}
              disabled={!canSave || saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <PlusCircle size={15} />
              )}
              Luu tat ca vao bank
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
