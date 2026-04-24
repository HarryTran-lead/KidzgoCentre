"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Brain,
  Loader2,
  PlusCircle,
  Sparkles,
  Upload,
  Wand2,
  X,
} from "lucide-react";

import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/lightswind/select";
import {
  createAdminQuestion,
  generateAiQuestionDrafts,
  generateAiQuestionDraftsFromFile,
  type AiGenerateQuestionResult,
  type AiGeneratedQuestionDraft,
} from "@/app/api/admin/question-bank";

type CourseOption = {
  id: string;
  name: string;
};

type QuestionType = "MultipleChoice" | "TextInput";
type DifficultyLevel = "Easy" | "Medium" | "Hard";
type TaskStyle = "standard" | "translation";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  courseOptions: CourseOption[];
  loadingCourses: boolean;
  onSaved?: (count: number) => void;
  onUseDrafts?: (
    items: AiGeneratedQuestionDraft[]
  ) => void | number | Promise<void | number>;
  useDraftsLabel?: string;
  allowedQuestionTypes?: QuestionType[];
};

type FormState = {
  programId: string;
  topic: string;
  questionType: QuestionType;
  questionCount: string;
  level: DifficultyLevel;
  skill: string;
  taskStyle: TaskStyle;
  grammarTags: string;
  vocabularyTags: string;
  instructions: string;
  language: string;
  pointsPerQuestion: string;
};

const ACCEPTED_SOURCE_FILE_TYPES = ".txt,.md,.csv,.json,.xml,.html,.htm,.docx,.pdf,.xlsx,.xls";
const MAX_SOURCE_FILE_SIZE = 20 * 1024 * 1024;
const ACCEPTED_SOURCE_FILE_EXTENSIONS = new Set(
  ACCEPTED_SOURCE_FILE_TYPES.split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
);

const DEFAULT_FORM_STATE: Omit<FormState, "questionType"> = {
  programId: "",
  topic: "",
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

const DEFAULT_QUESTION_TYPES: QuestionType[] = [
  "MultipleChoice",
  "TextInput",
];

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  MultipleChoice: "Trắc nghiệm",
  TextInput: "Nhập văn bản",
};

const LEVEL_LABELS: Record<DifficultyLevel, string> = {
  Easy: "Dễ",
  Medium: "Trung bình",
  Hard: "Khó",
};

const TASK_STYLE_LABELS: Record<TaskStyle, string> = {
  standard: "Tiêu chuẩn",
  translation: "Dịch thuật",
};

const LANGUAGE_LABELS: Record<string, string> = {
  vi: "Tiếng Việt",
  en: "Tiếng Anh",
};

function createInitialFormState(questionType: QuestionType): FormState {
  return {
    ...DEFAULT_FORM_STATE,
    questionType,
  };
}

function parseTags(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function mapDraftToQuestionBankPayload(
  item: AiGeneratedQuestionDraft,
  fallbackLevel: DifficultyLevel
) {
  return {
    questionText: item.questionText,
    questionType: item.questionType,
    options: item.questionType === "MultipleChoice" ? item.options : [],
    correctAnswer: item.correctAnswer,
    points: item.points,
    explanation: item.explanation || undefined,
    level: item.level || fallbackLevel,
  };
}

export default function AiCreatorModal({
  isOpen,
  onClose,
  courseOptions,
  loadingCourses,
  onSaved,
  onUseDrafts,
  useDraftsLabel,
  allowedQuestionTypes,
}: Props) {
  const modalRef = useRef<HTMLDivElement>(null);
  const availableQuestionTypes = useMemo(() => {
    const normalized = (allowedQuestionTypes || DEFAULT_QUESTION_TYPES).filter(
      (value, index, items) =>
        DEFAULT_QUESTION_TYPES.includes(value) && items.indexOf(value) === index
    );

    return normalized.length > 0 ? normalized : DEFAULT_QUESTION_TYPES;
  }, [allowedQuestionTypes]);
  const defaultQuestionType = availableQuestionTypes[0] || "MultipleChoice";
  const isAssignmentMode = Boolean(onUseDrafts);

  const [form, setForm] = useState<FormState>(() =>
    createInitialFormState(defaultQuestionType)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AiGenerateQuestionResult | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSourceFileChange = (file: File | null) => {
    if (!file) {
      setSourceFile(null);
      return;
    }

    const fileName = file.name || "";
    const dotIndex = fileName.lastIndexOf(".");
    const extension = dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : "";

    if (!ACCEPTED_SOURCE_FILE_EXTENSIONS.has(extension)) {
      toast({
        title: "Định dạng file chưa hỗ trợ",
        description:
          "Vui lòng chọn file .txt, .md, .csv, .json, .xml, .html, .htm, .docx, .pdf, .xlsx hoặc .xls.",
        type: "destructive",
      });
      setSourceFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > MAX_SOURCE_FILE_SIZE) {
      toast({
        title: "File vượt quá giới hạn",
        description: "Dung lượng file nguồn không được vượt quá 20MB.",
        type: "destructive",
      });
      setSourceFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setSourceFile(file);
  };

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
    if (!isOpen) {
      return;
    }

    setForm(createInitialFormState(defaultQuestionType));
    setErrors({});
    setResult(null);
    setLoading(false);
    setSubmitting(false);
    setSourceFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [defaultQuestionType, isOpen]);

  const canSubmitDrafts = useMemo(
    () => Boolean(form.programId && result?.items && result.items.length > 0),
    [form.programId, result]
  );

  if (!isOpen) {
    return null;
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.programId) {
      nextErrors.programId = "Vui lòng chọn chương trình học.";
    }

    if (!form.topic.trim() && !sourceFile) {
      nextErrors.topic = "Vui lòng nhập chủ đề hoặc tải lên file nguồn.";
    }

    const questionCount = Number(form.questionCount);
    if (
      !Number.isFinite(questionCount) ||
      questionCount < 1 ||
      questionCount > 50
    ) {
      nextErrors.questionCount =
        "Số lượng câu hỏi phải trong khoảng từ 1 đến 50.";
    }

    const pointsPerQuestion = Number(form.pointsPerQuestion);
    if (!Number.isFinite(pointsPerQuestion) || pointsPerQuestion <= 0) {
      nextErrors.pointsPerQuestion = "Điểm mỗi câu phải lớn hơn 0.";
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
        title: "Biểu mẫu chưa hợp lệ",
        description:
          "Vui lòng kiểm tra lại chủ đề, chương trình học và số lượng câu hỏi.",
        type: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const commonParams = {
        programId: form.programId,
        topic: form.topic.trim() || undefined,
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
      };

      const response = sourceFile
        ? await generateAiQuestionDraftsFromFile({ ...commonParams, file: sourceFile })
        : await generateAiQuestionDrafts({ ...commonParams, topic: form.topic.trim() });

      setResult(response);

      toast({
        title: "Đã tạo bản nháp bằng AI",
        description:
          response.items.length > 0
            ? `AI đã tạo ${response.items.length} câu hỏi nháp.`
            : "AI chưa tạo được câu hỏi hợp lệ.",
        type: response.items.length > 0 ? "success" : "warning",
      });
    } catch (error: any) {
      toast({
        title: "Không thể tạo bản nháp bằng AI",
        description: error?.message || "Vui lòng thử lại sau.",
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

    setSubmitting(true);
    try {
      await createAdminQuestion({
        programId: form.programId,
        items: result.items.map((item) =>
          mapDraftToQuestionBankPayload(item, form.level)
        ),
      });

      toast({
        title: "Lưu bản nháp thành công",
        description: `Đã lưu ${result.items.length} câu hỏi từ AI vào ngân hàng câu hỏi.`,
        type: "success",
      });

      onSaved?.(result.items.length);
      onClose();
    } catch (error: any) {
      toast({
        title: "Không thể lưu bản nháp",
        description: error?.message || "Vui lòng thử lại sau.",
        type: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUseDrafts = async () => {
    if (!result || result.items.length === 0 || !onUseDrafts) {
      return;
    }

    setSubmitting(true);
    try {
      const appliedCount = await Promise.resolve(onUseDrafts(result.items));
      const successCount =
        typeof appliedCount === "number" && appliedCount >= 0
          ? appliedCount
          : result.items.length;
      const skippedCount = Math.max(0, result.items.length - successCount);

      toast({
        title: "Đã thêm câu hỏi vào bài tập",
        description:
          skippedCount > 0
            ? `Đã thêm ${successCount} câu hỏi hợp lệ. ${skippedCount} câu còn lại không phù hợp nên đã được bỏ qua.`
            : `Đã thêm ${successCount} câu hỏi AI vào bài tập hiện tại.`,
        type: "success",
      });

      onClose();
    } catch (error: any) {
      toast({
        title: "Không thể dùng bản nháp cho bài tập",
        description: error?.message || "Vui lòng thử lại sau.",
        type: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const headerDescription = isAssignmentMode
    ? "Tạo bản nháp câu hỏi để dùng ngay cho bài tập trắc nghiệm."
    : "Tạo bản nháp câu hỏi cho ngân hàng câu hỏi và lưu ngay trên hệ thống.";
  const emptyStateDescription = isAssignmentMode
    ? "Chọn chương trình học, nhập chủ đề rồi bấm tạo bản nháp. Sau đó bạn có thể xem lại nội dung và dùng ngay cho bài tập này."
    : "Chọn chương trình học, nhập chủ đề rồi bấm tạo bản nháp. Sau đó bạn có thể xem lại nội dung và lưu ngay vào ngân hàng câu hỏi.";
  const footerDescription = isAssignmentMode
    ? "Công cụ này tạo bản nháp để thêm nhanh vào bài trắc nghiệm hiện tại."
    : "Công cụ này chỉ tạo bản nháp. Nút bên phải sẽ lưu toàn bộ vào ngân hàng câu hỏi hiện tại.";
  const primaryActionLabel = isAssignmentMode
    ? useDraftsLabel || "Dùng cho bài tập này"
    : "Lưu tất cả vào ngân hàng câu hỏi";

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/50 px-4 py-8 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="mx-auto flex h-full max-w-4xl flex-col overflow-hidden rounded-[28px] border border-red-200 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between bg-gradient-to-r from-red-600 to-red-700 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-white/15 p-2">
              <Brain size={18} />
            </div>
            <div>
              <div className="text-base font-semibold">Tạo câu hỏi bằng AI</div>
              <div className="text-xs text-white/80">{headerDescription}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-full p-1.5 transition hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid flex-1 gap-0 overflow-hidden lg:grid-cols-[340px,1fr]">
          <div className="overflow-y-auto border-r border-red-100 bg-red-50/30 p-5">
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Chương trình học
                </label>
                <Select value={form.programId} onValueChange={(value) => handleChange("programId", value)}>
                  <SelectTrigger className="w-full rounded-lg h-9">
                    <SelectValue placeholder={loadingCourses ? "Đang tải..." : "Chọn chương trình học"} />
                  </SelectTrigger>
                  <SelectContent>
                    {courseOptions.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.programId ? (
                  <p className="mt-1 text-xs text-red-600">{errors.programId}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Chủ đề
                </label>
                <input
                  value={form.topic}
                  onChange={(event) => handleChange("topic", event.target.value)}
                  className="w-full rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-300"
                  placeholder="Ví dụ: gia đình, thì hiện tại đơn, nghề nghiệp..."
                />
                {errors.topic ? (
                  <p className="mt-1 text-xs text-red-600">{errors.topic}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  File nguồn (tuỳ chọn)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm text-gray-700 hover:bg-red-50"
                  >
                    <Upload size={14} />
                    {sourceFile ? "Đổi file" : "Tải lên"}
                  </button>
                  {sourceFile ? (
                    <span className="flex-1 truncate text-xs text-gray-600">
                      {sourceFile.name}
                    </span>
                  ) : (
                    <span className="flex-1 text-xs text-gray-400">
                      AI sẽ đọc nội dung file để sinh câu hỏi.
                    </span>
                  )}
                  {sourceFile ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSourceFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="rounded-full p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      aria-label="Xóa file"
                    >
                      <X size={14} />
                    </button>
                  ) : null}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_SOURCE_FILE_TYPES}
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    handleSourceFileChange(file);
                  }}
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  Hỗ trợ: .txt, .md, .csv, .json, .xml, .html, .htm, .docx, .pdf, .xlsx, .xls (tối đa 20MB)
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Loại câu hỏi
                  </label>
                  <Select
                    value={form.questionType}
                    onValueChange={(value) => handleChange("questionType", value as QuestionType)}
                    disabled={availableQuestionTypes.length <= 1}
                  >
                    <SelectTrigger className="w-full rounded-lg h-9 disabled:opacity-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableQuestionTypes.map((questionType) => (
                        <SelectItem key={questionType} value={questionType}>
                          {QUESTION_TYPE_LABELS[questionType]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Độ khó
                  </label>
                  <Select value={form.level} onValueChange={(value) => handleChange("level", value as FormState["level"])}>
                    <SelectTrigger className="w-full rounded-lg h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy">{LEVEL_LABELS.Easy}</SelectItem>
                      <SelectItem value="Medium">{LEVEL_LABELS.Medium}</SelectItem>
                      <SelectItem value="Hard">{LEVEL_LABELS.Hard}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Số câu hỏi
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
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
                    Điểm mỗi câu
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
                  Kỹ năng
                </label>
                <input
                  value={form.skill}
                  onChange={(event) => handleChange("skill", event.target.value)}
                  className="w-full rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-300"
                  placeholder="Ngữ pháp / Từ vựng / Đọc hiểu..."
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Kiểu bài tập
                  </label>
                  <Select value={form.taskStyle} onValueChange={(value) => handleChange("taskStyle", value as FormState["taskStyle"])}>
                    <SelectTrigger className="w-full rounded-lg h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">{TASK_STYLE_LABELS.standard}</SelectItem>
                      <SelectItem value="translation">{TASK_STYLE_LABELS.translation}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Ngôn ngữ
                  </label>
                  <Select value={form.language} onValueChange={(value) => handleChange("language", value)}>
                    <SelectTrigger className="w-full rounded-lg h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vi">{LANGUAGE_LABELS.vi}</SelectItem>
                      <SelectItem value="en">{LANGUAGE_LABELS.en}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Thẻ ngữ pháp
                </label>
                <input
                  value={form.grammarTags}
                  onChange={(event) =>
                    handleChange("grammarTags", event.target.value)
                  }
                  className="w-full rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-300"
                  placeholder="hiện tại đơn, to be, sở hữu..."
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Thẻ từ vựng
                </label>
                <input
                  value={form.vocabularyTags}
                  onChange={(event) =>
                    handleChange("vocabularyTags", event.target.value)
                  }
                  className="w-full rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-300"
                  placeholder="gia đình, nghề nghiệp, trường học..."
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Hướng dẫn thêm
                </label>
                <textarea
                  rows={4}
                  value={form.instructions}
                  onChange={(event) =>
                    handleChange("instructions", event.target.value)
                  }
                  className="w-full rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-300"
                  placeholder="Thêm hướng dẫn cho AI nếu muốn kết quả sát với định dạng của trung tâm hơn."
                />
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-3 text-sm font-semibold text-white hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                Tạo bản nháp bằng AI
              </button>
            </div>
          </div>

          <div className="overflow-y-auto p-6">
            {!result ? (
              <div className="flex min-h-[220px] items-center justify-center rounded-3xl border border-dashed border-red-200 bg-red-50/30 p-6 text-center">
                <div className="max-w-md">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                    <Wand2 size={22} />
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-gray-900">
                    AI đang chờ thông tin
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                    {emptyStateDescription}
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
                        <div className="font-semibold">Kết quả tạo câu hỏi</div>
                      </div>
                      {result.summary ? (
                        <p className="mt-2 text-sm leading-relaxed text-gray-700">
                          {result.summary}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-700">
                        {result.aiUsed ? "Có dùng AI" : "Không dùng AI"}
                      </span>
                      <span className="rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-700">
                        {result.items.length} bản nháp
                      </span>
                    </div>
                  </div>

                  {result.warnings.length > 0 ? (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <div className="mb-2 text-sm font-semibold text-amber-800">
                        Lưu ý
                      </div>
                      <ul className="space-y-1 text-sm text-amber-700">
                        {result.warnings.map((warning, index) => (
                          <li key={`warning-${index}`}>- {warning}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-3">
                  {result.items.map((item, index) => {
                    const questionTypeLabel =
                      QUESTION_TYPE_LABELS[item.questionType as QuestionType] ||
                      item.questionType;
                    const levelLabel =
                      LEVEL_LABELS[item.level as DifficultyLevel] ||
                      item.level ||
                      LEVEL_LABELS.Medium;

                    return (
                      <div
                        key={`${item.questionText}-${index}`}
                        className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              Câu {index + 1}
                            </div>
                            <div className="mt-2 text-sm leading-relaxed text-gray-700">
                              {item.questionText}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700">
                              {questionTypeLabel}
                            </span>
                            <span className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700">
                              {levelLabel}
                            </span>
                            <span className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700">
                              {item.points} điểm
                            </span>
                          </div>
                        </div>

                        {item.options.length > 0 ? (
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
                        ) : null}

                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                            <div className="text-xs uppercase tracking-wide text-gray-500">
                              Đáp án đúng
                            </div>
                            <div className="mt-2 text-sm font-medium text-gray-800">
                              {item.correctAnswer || "Chưa có"}
                            </div>
                          </div>
                          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                            <div className="text-xs uppercase tracking-wide text-gray-500">
                              Giải thích
                            </div>
                            <div className="mt-2 text-sm text-gray-700">
                              {item.explanation || "Không có"}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-red-100 bg-white px-5 py-3">
          <div className="text-xs text-gray-500">{footerDescription}</div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={isAssignmentMode ? handleUseDrafts : handleSaveAll}
              disabled={!canSubmitDrafts || submitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <PlusCircle size={14} />
              )}
              {primaryActionLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
