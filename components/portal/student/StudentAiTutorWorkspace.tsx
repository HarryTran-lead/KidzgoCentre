"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Bot,
  BookOpen,
  ChevronRight,
  FileText,
  Lightbulb,
  Loader2,
  Mic,
  Search,
  UploadCloud,
  WandSparkles,
} from "lucide-react";

import { toast } from "@/hooks/use-toast";
import HomeworkAiWorkspace from "@/app/[locale]/portal/student/homework/[id]/components/HomeworkAiWorkspace";
import {
  analyzeStudentSpeakingPractice,
  getStudentHomework,
  getStudentHomeworkById,
  getStudentSubmittedHomework,
} from "@/lib/api/studentService";
import type {
  AssignmentDetail,
  AssignmentListItem,
  HomeworkSpeakingAnalysisResult,
} from "@/types/student/homework";

const PAGE_SIZE = 100;

type SpeakingLabProps = {
  selectedAssignment: AssignmentDetail | null;
  selectedHomeworkId: string | null;
};

type TutorMode = "homework" | "speaking";

function formatDateLabel(value?: string | null) {
  if (!value) return "Chưa có hạn";
  try {
    return new Date(value).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Asia/Ho_Chi_Minh",
    });
  } catch {
    return value;
  }
}

function getStatusLabel(status?: string) {
  const normalized = String(status || "").trim().toUpperCase();
  if (normalized === "SUBMITTED") return "Đã nộp";
  if (normalized === "GRADED") return "Đã chấm";
  if (normalized === "LATE") return "Nộp trễ";
  if (normalized === "MISSING") return "Quá hạn";
  if (normalized === "ASSIGNED") return "Đã giao";
  if (normalized === "PENDING") return "Chờ làm";
  return "Bài tập";
}

function getStatusClass(status?: string) {
  const normalized = String(status || "").trim().toUpperCase();
  if (normalized === "SUBMITTED" || normalized === "GRADED") {
    return "border-emerald-400/25 bg-emerald-500/10 text-emerald-100";
  }
  if (normalized === "LATE") {
    return "border-amber-400/25 bg-amber-500/10 text-amber-100";
  }
  if (normalized === "MISSING") {
    return "border-rose-400/25 bg-rose-500/10 text-rose-100";
  }
  return "border-cyan-400/25 bg-cyan-500/10 text-cyan-100";
}

function ResultPills({
  title,
  items,
  tone = "cyan",
}: {
  title: string;
  items?: string[];
  tone?: "purple" | "blue" | "amber" | "emerald" | "rose" | "cyan";
}) {
  if (!items || items.length === 0) {
    return null;
  }

  const toneClass =
    tone === "blue"
      ? "border-blue-400/20 bg-blue-500/10 text-blue-100"
      : tone === "amber"
        ? "border-amber-400/20 bg-amber-500/10 text-amber-100"
        : tone === "emerald"
          ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
          : tone === "rose"
            ? "border-rose-400/20 bg-rose-500/10 text-rose-100"
            : tone === "purple"
              ? "border-purple-400/20 bg-purple-500/10 text-purple-100"
              : "border-cyan-400/20 bg-cyan-500/10 text-cyan-100";

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        {title}
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span
            key={`${title}-${index}-${item}`}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${toneClass}`}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function WarningsBlock({ warnings }: { warnings?: string[] }) {
  if (!warnings || warnings.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
      <div className="mb-2 text-sm font-semibold text-amber-200">Lưu ý từ AI</div>
      <ul className="space-y-1 text-sm text-amber-50/85">
        {warnings.map((warning, index) => (
          <li key={`speaking-warning-${index}`} className="leading-relaxed">
            • {warning}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SpeakingResultCard({
  title,
  result,
}: {
  title: string;
  result: HomeworkSpeakingAnalysisResult;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-cyan-500/20 bg-slate-900/70 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">{title}</div>
          {result.summary ? (
            <p className="mt-1 text-sm leading-relaxed text-slate-300">
              {result.summary}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {result.stars !== undefined ? (
            <span className="rounded-full border border-yellow-400/20 bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-100">
              {result.stars} sao
            </span>
          ) : null}
          {result.overallScore !== undefined ? (
            <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-100">
              Tổng điểm {result.overallScore}
            </span>
          ) : null}
        </div>
      </div>

      {(result.pronunciationScore !== undefined ||
        result.fluencyScore !== undefined ||
        result.accuracyScore !== undefined) && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-400">
              Phát âm
            </div>
            <div className="mt-2 text-xl font-bold text-cyan-200">
              {result.pronunciationScore ?? "—"}
            </div>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-400">
              Trôi chảy
            </div>
            <div className="mt-2 text-xl font-bold text-cyan-200">
              {result.fluencyScore ?? "—"}
            </div>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-400">
              Chính xác
            </div>
            <div className="mt-2 text-xl font-bold text-cyan-200">
              {result.accuracyScore ?? "—"}
            </div>
          </div>
        </div>
      )}

      {result.transcript ? (
        <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4">
          <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">
            AI nghe được
          </div>
          <div className="text-sm leading-relaxed text-slate-200">
            {result.transcript}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <ResultPills title="Điểm mạnh" items={result.strengths} tone="emerald" />
        <ResultPills title="Cần cải thiện" items={result.issues} tone="rose" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ResultPills
          title="Từ cần luyện"
          items={result.mispronouncedWords}
          tone="amber"
        />
        <ResultPills title="Kế hoạch luyện tập" items={result.practicePlan} tone="blue" />
      </div>

      <ResultPills title="Gợi ý tiếp theo" items={result.suggestions} tone="purple" />

      {result.wordFeedback.length > 0 ? (
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Phản hồi theo từ
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {result.wordFeedback.map((item, index) => (
              <div
                key={`${item.word}-${index}`}
                className="rounded-xl border border-slate-700 bg-slate-950/60 p-4"
              >
                <div className="font-semibold text-white">{item.word}</div>
                {item.heardAs ? (
                  <div className="mt-1 text-xs text-slate-400">
                    AI nghe được: {item.heardAs}
                  </div>
                ) : null}
                <div className="mt-2 text-sm text-rose-200">{item.issue}</div>
                <div className="mt-2 text-sm text-cyan-100">{item.tip}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <WarningsBlock warnings={result.warnings} />
    </div>
  );
}

function mergeHomeworkItems(...groups: AssignmentListItem[][]) {
  const mapped = new Map<string, AssignmentListItem>();

  groups.flat().forEach((item) => {
    const key = String(item.id || item.assignmentId || "").trim();
    if (!key) return;
    if (!mapped.has(key)) {
      mapped.set(key, item);
    }
  });

  return Array.from(mapped.values()).sort((left, right) => {
    const rightDate = new Date(right.dueAt || right.assignedDate || 0).getTime();
    const leftDate = new Date(left.dueAt || left.assignedDate || 0).getTime();
    return rightDate - leftDate;
  });
}

function SpeakingLab({ selectedAssignment, selectedHomeworkId }: SpeakingLabProps) {
  const [language, setLanguage] = useState("vi");
  const [mode, setMode] = useState("speaking");
  const [expectedText, setExpectedText] = useState("");
  const [targetWords, setTargetWords] = useState("");
  const [instructions, setInstructions] = useState("");
  const [practiceFile, setPracticeFile] = useState<File | null>(null);
  const [useSelectedContext, setUseSelectedContext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HomeworkSpeakingAnalysisResult | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const applySelectedContext = useCallback(() => {
    if (!selectedAssignment) {
      toast({
        title: "Chưa chọn bài tập",
        description: "Hãy chọn một bài tập nếu con muốn AI biết bài con đang học.",
        type: "warning",
      });
      return;
    }

    setMode(selectedAssignment.speakingMode || "speaking");
    setExpectedText(selectedAssignment.speakingExpectedText || "");
    setTargetWords((selectedAssignment.targetWords || []).join(", "));
    setUseSelectedContext(true);
    toast({
      title: "Đã lấy thông tin bài tập",
      description: "AI sẽ hiểu rõ hơn bài luyện nói của con.",
      type: "success",
    });
  }, [selectedAssignment]);

  const handleAnalyze = useCallback(async () => {
    if (!practiceFile) {
      toast({
        title: "Chưa có file",
        description: "Con hãy chọn file audio/video trước nha.",
        type: "warning",
      });
      return;
    }

    setLoading(true);
    const response = await analyzeStudentSpeakingPractice({
      file: practiceFile,
      language,
      mode,
      expectedText: expectedText.trim() || undefined,
      targetWords: targetWords.trim() || undefined,
      instructions: instructions.trim() || undefined,
      homeworkStudentId:
        useSelectedContext && selectedHomeworkId ? selectedHomeworkId : undefined,
    });
    setLoading(false);

    if (!response.isSuccess || !response.data) {
      toast({
        title: "AI chưa nghe được",
        description: response.message || "Con thử lại thêm một lần nữa nha.",
        type: "destructive",
      });
      return;
    }

    setResult(response.data);
  }, [
    expectedText,
    instructions,
    language,
    mode,
    practiceFile,
    selectedHomeworkId,
    targetWords,
    useSelectedContext,
  ]);

  return (
    <section className="rounded-[30px] border border-cyan-400/15 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-950/10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
            <Mic size={14} />
            Luyện nói
          </div>
          <h2 className="mt-3 text-2xl font-bold text-white">
            Thu âm hoặc tải file để AI nghe con nói
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
            Con chỉ cần chọn file, rồi bấm một nút. Nếu muốn, con có thể lấy thêm
            thông tin từ bài tập đang chọn.
          </p>
        </div>

        <button
          type="button"
          onClick={applySelectedContext}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-100 transition hover:bg-white/10"
        >
          <WandSparkles size={16} className="text-cyan-300" />
          Lấy thông tin từ bài đang chọn
        </button>
      </div>

      {selectedAssignment ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
          Đang gắn với bài: <span className="font-semibold text-white">{selectedAssignment.title}</span>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
          Con vẫn có thể luyện nói tự do, không cần chọn bài tập trước.
        </div>
      )}

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold text-white">Bước 1</div>
            <div className="mt-1 text-sm text-slate-300">
              Chọn file ghi âm hoặc video của con.
            </div>
          </div>

          <label className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-cyan-400/25 bg-slate-900/60 px-5 py-6 text-center transition hover:border-cyan-300/40 hover:bg-slate-900/80">
            <UploadCloud size={28} className="text-cyan-300" />
            <div className="mt-3 text-lg font-semibold text-white">
              Bấm để chọn file audio/video
            </div>
            <div className="mt-2 max-w-sm text-sm leading-relaxed text-slate-400">
              Ví dụ: file đọc bài, kể chuyện, hay video tập nói.
            </div>
            <input
              type="file"
              accept="audio/*,video/*"
              className="hidden"
              onChange={(event) => setPracticeFile(event.target.files?.[0] || null)}
            />
            {practiceFile ? (
              <div className="mt-4 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-1.5 text-xs font-medium text-cyan-100">
                {practiceFile.name}
              </div>
            ) : null}
          </label>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold text-white">Bước 2</div>
            <div className="mt-1 text-sm text-slate-300">
              Bấm nút để AI nghe và góp ý cho con.
            </div>
          </div>

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-4 text-base font-semibold text-white shadow-lg shadow-cyan-900/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Mic size={18} />}
            Phân tích với AI
          </button>

          <button
            type="button"
            onClick={() => setShowAdvanced((prev) => !prev)}
            className="inline-flex items-center gap-2 text-sm font-medium text-cyan-200 transition hover:text-white"
          >
            <WandSparkles size={15} />
            {showAdvanced ? "Ẩn tùy chọn thêm" : "Mở tùy chọn thêm"}
          </button>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-relaxed text-slate-300">
            Mẹo nhỏ: nếu con chỉ muốn tập đọc nhanh, chỉ cần tải file và bấm nút.
            Phần tùy chọn thêm chỉ dùng khi con muốn AI nghe sát hơn theo bài mẫu.
          </div>
        </div>
      </div>

      {showAdvanced ? (
        <div className="mt-5 grid gap-4 rounded-[24px] border border-white/10 bg-slate-900/50 p-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-200">Ngôn ngữ</span>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/40"
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-200">Kiểu bài nói</span>
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/40"
            >
              <option value="speaking">Speaking</option>
              <option value="phonics">Phonics</option>
            </select>
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-200">Đoạn mẫu</span>
            <textarea
              value={expectedText}
              onChange={(event) => setExpectedText(event.target.value)}
              rows={3}
              placeholder="Dán đoạn văn mẫu nếu muốn AI đối chiếu theo nội dung mong đợi."
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-200">Từ muốn luyện</span>
            <input
              value={targetWords}
              onChange={(event) => setTargetWords(event.target.value)}
              placeholder="hello, family, teacher"
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
            />
          </label>

          <label className="flex items-end gap-3 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3">
            <input
              type="checkbox"
              checked={useSelectedContext}
              onChange={(event) => setUseSelectedContext(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-cyan-400"
            />
            <span className="text-sm text-slate-200">
              Nếu đang chọn bài tập, gửi kèm bài đó cho AI
            </span>
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-200">Ghi chú thêm</span>
            <textarea
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              rows={3}
              placeholder="Ví dụ: nhờ AI nghe kỹ ending sound và nhấn trọng âm."
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
            />
          </label>
        </div>
      ) : null}

      {result ? (
        <div className="mt-6">
          <SpeakingResultCard title="Ket qua luyen noi" result={result} />
        </div>
      ) : null}
    </section>
  );
}

function ModeButton({
  active,
  icon: Icon,
  title,
  description,
  onClick,
  tone,
}: {
  active: boolean;
  icon: typeof BookOpen;
  title: string;
  description: string;
  onClick: () => void;
  tone: "fuchsia" | "cyan";
}) {
  const activeClass =
    tone === "cyan"
      ? "border-cyan-400/40 bg-cyan-500/15 shadow-cyan-950/20"
      : "border-fuchsia-400/40 bg-fuchsia-500/15 shadow-fuchsia-950/20";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[28px] border p-5 text-left shadow-lg transition ${
        active
          ? activeClass
          : "border-white/10 bg-white/5 hover:bg-white/10"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-black/10">
          <Icon size={22} className="text-white" />
        </div>
        <div>
          <div className="text-lg font-semibold text-white">{title}</div>
          <div className="mt-1 text-sm leading-relaxed text-slate-300">
            {description}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function StudentAiTutorWorkspace() {
  const router = useRouter();
  const params = useParams();
  const locale = String(params.locale || "vi");

  const [activeMode, setActiveMode] = useState<TutorMode>("homework");
  const [items, setItems] = useState<AssignmentListItem[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedHomeworkId, setSelectedHomeworkId] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const deferredSearch = useDeferredValue(searchTerm);

  const loadHomeworkItems = useCallback(async () => {
    setListLoading(true);
    setListError(null);

    try {
      const [homeworkResponse, submittedResponse] = await Promise.all([
        getStudentHomework({ pageNumber: 1, pageSize: PAGE_SIZE }),
        getStudentSubmittedHomework({ pageNumber: 1, pageSize: PAGE_SIZE }),
      ]);

      const currentItems = homeworkResponse?.data?.homeworkAssignments?.items || [];
      const submittedItems =
        submittedResponse?.data?.homeworkAssignments?.items || [];
      const merged = mergeHomeworkItems(currentItems, submittedItems);

      setItems(merged);
    } catch (error) {
      console.error("Load AI tutor homework list error:", error);
      setListError("Không thể tải danh sách bài tập để AI hỗ trợ.");
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHomeworkItems();
  }, [loadHomeworkItems]);

  useEffect(() => {
    if (!selectedHomeworkId && items.length > 0) {
      setSelectedHomeworkId(items[0].id);
    }
  }, [items, selectedHomeworkId]);

  useEffect(() => {
    if (!selectedHomeworkId) {
      setSelectedAssignment(null);
      setDetailError(null);
      return;
    }

    let cancelled = false;

    const loadHomeworkDetail = async () => {
      setDetailLoading(true);
      setDetailError(null);

      const response = await getStudentHomeworkById(selectedHomeworkId);

      if (cancelled) return;

      if (!response.isSuccess || !response.data) {
        setSelectedAssignment(null);
        setDetailError(response.message || "Không thể tải chi tiết bài tập.");
        setDetailLoading(false);
        return;
      }

      setSelectedAssignment(response.data);
      setDetailLoading(false);
    };

    void loadHomeworkDetail();

    return () => {
      cancelled = true;
    };
  }, [selectedHomeworkId]);

  const filteredItems = useMemo(() => {
    const keyword = deferredSearch.trim().toLowerCase();
    if (!keyword) {
      return items;
    }

    return items.filter((item) => {
      const title = String(item.assignmentTitle || "").toLowerCase();
      const className = String(item.className || "").toLowerCase();
      const classCode = String(item.classCode || "").toLowerCase();
      return (
        title.includes(keyword) ||
        className.includes(keyword) ||
        classCode.includes(keyword)
      );
    });
  }, [deferredSearch, items]);

  const selectedSummary = useMemo(() => {
    if (!selectedAssignment) return [];
    const labels: string[] = [];
    if (selectedAssignment.aiHintEnabled) labels.push("Xin gợi ý");
    if (selectedAssignment.aiRecommendEnabled) labels.push("Luyện thêm");
    if (selectedAssignment.speakingMode) labels.push("Nghe bài nói");
    return labels;
  }, [selectedAssignment]);

  const selectedHasAi = Boolean(
    selectedAssignment?.aiHintEnabled ||
      selectedAssignment?.aiRecommendEnabled ||
      selectedAssignment?.speakingMode
  );

  return (
    <div className="relative h-full overflow-y-auto pb-8">
      <div className="mx-auto w-full max-w-[1320px] px-4 py-5 sm:px-6 lg:px-8">
        <section className="rounded-[34px] border border-white/10 bg-gradient-to-br from-[#0f172a] via-[#1d123c] to-[#111827] p-6 shadow-2xl shadow-fuchsia-950/20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-fuchsia-100">
              <Bot size={14} />
              Trợ lý AI
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white lg:text-4xl">
              Hôm nay con muốn AI giúp gì?
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 lg:text-base">
              Con có thể xin AI gợi ý cho bài tập, lấy bài luyện thêm, hoặc tải
              file để AI nghe và giúp con luyện nói.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <ModeButton
              active={activeMode === "homework"}
              icon={BookOpen}
              title="Giúp bài tập"
              description="Chọn bài tập để xin gợi ý, luyện thêm hoặc xem bài nói."
              onClick={() => setActiveMode("homework")}
              tone="fuchsia"
            />
            <ModeButton
              active={activeMode === "speaking"}
              icon={Mic}
              title="Luyện nói"
              description="Tải file audio/video để AI nghe và chỉ cho con cần sửa gì."
              onClick={() => setActiveMode("speaking")}
              tone="cyan"
            />
          </div>
        </section>

        {activeMode === "homework" ? (
          <section className="mt-6 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-4 rounded-[28px] border border-white/10 bg-slate-950/70 p-5 shadow-xl shadow-slate-950/10">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/10">
                <BookOpen size={20} className="text-fuchsia-200" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Bước 1: Chọn bài tập</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">
                  Con hãy bấm vào một bài để AI biết con đang học gì.
                </p>
              </div>
            </div>

            <label className="relative block">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Tìm tên bài tập..."
                className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-fuchsia-400/40"
              />
            </label>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-slate-400">
              Mẹo nhỏ: bài viết sẽ hợp với xin gợi ý. Bài nói sẽ hợp với
              nghe transcript và luyện nói.
            </div>

            <div className="max-h-[760px] space-y-3 overflow-y-auto pr-1">
              {listLoading ? (
                <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-10 text-sm text-slate-300">
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  Đang tải danh sách bài tập...
                </div>
              ) : null}

              {!listLoading && listError ? (
                <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-100">
                  {listError}
                </div>
              ) : null}

              {!listLoading && !listError && filteredItems.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
                  Không tìm thấy bài tập phù hợp.
                </div>
              ) : null}

              {!listLoading &&
                !listError &&
                filteredItems.map((item) => {
                  const active = selectedHomeworkId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedHomeworkId(item.id)}
                      className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
                        active
                          ? "border-fuchsia-400/30 bg-fuchsia-500/10 shadow-lg shadow-fuchsia-900/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="line-clamp-2 text-sm font-semibold text-white">
                            {item.assignmentTitle || "Bài tập"}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-slate-300">
                              {item.classCode || item.className || "Lớp học"}
                            </span>
                            <span
                              className={`rounded-full border px-2.5 py-1 text-[11px] ${getStatusClass(item.status)}`}
                            >
                              {getStatusLabel(item.status)}
                            </span>
                          </div>
                        </div>
                        <ChevronRight
                          size={16}
                          className={active ? "text-fuchsia-200" : "text-slate-500"}
                        />
                      </div>
                      <div className="mt-3 text-xs text-slate-400">
                        Hạn: {formatDateLabel(item.dueAt || item.assignedDate)}
                      </div>
                    </button>
                  );
                })}
            </div>
          </aside>

          <div className="space-y-6">
            <section className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5 shadow-xl shadow-slate-950/10">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Bước 2
                  </div>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    {selectedAssignment?.title || "Chọn bài tập để AI bắt đầu giúp"}
                  </h2>
                  {selectedAssignment ? (
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">
                      {selectedAssignment.className || "Lớp học"} - Hạn nộp{" "}
                      {formatDateLabel(selectedAssignment.dueDate)}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">
                      Sau khi chọn bài, AI sẽ hiện các nút phù hợp để con bấm.
                    </p>
                  )}
                </div>

                {selectedHomeworkId ? (
                  <button
                    type="button"
                    onClick={() => router.push(`/${locale}/portal/student/homework/${selectedHomeworkId}`)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
                  >
                    <FileText size={16} />
                    Mở bài tập gốc
                  </button>
                ) : null}
              </div>

              {selectedSummary.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedSummary.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-100"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : null}
            </section>

            {detailLoading ? (
              <div className="flex min-h-[260px] items-center justify-center rounded-[28px] border border-white/10 bg-slate-950/60 p-6 text-slate-300">
                <Loader2 size={18} className="mr-2 animate-spin" />
                Đang mở bài tập...
              </div>
            ) : null}

            {!detailLoading && detailError ? (
              <div className="rounded-[28px] border border-rose-400/20 bg-rose-500/10 p-5 text-sm text-rose-100">
                {detailError}
              </div>
            ) : null}

            {!detailLoading && !detailError && selectedAssignment && selectedHasAi ? (
              <>
                <div className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5 text-sm leading-relaxed text-slate-300">
                  Con hãy bấm vào nút con cần. AI sẽ giúp con học tốt hơn, nhưng
                  con vẫn là người tự làm bài.
                </div>
                <HomeworkAiWorkspace
                  homeworkStudentId={selectedHomeworkId || selectedAssignment.id}
                  assignment={selectedAssignment}
                />
              </>
            ) : null}

            {!detailLoading &&
            !detailError &&
            selectedAssignment &&
            !selectedHasAi ? (
              <div className="rounded-[28px] border border-white/10 bg-slate-950/60 p-6">
                <div className="flex items-start gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl border border-amber-400/20 bg-amber-500/10">
                    <Lightbulb size={20} className="text-amber-200" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Bài tập này chưa mở nút AI riêng
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">
                      Không sao nha. Con vẫn có thể qua mục Luyện nói để tập đọc và
                      nhận gợi ý từ AI.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveMode("speaking")}
                      className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2.5 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/20"
                    >
                      <Mic size={16} />
                      Chuyển sang Luyện nói
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {!detailLoading && !detailError && !selectedAssignment ? (
              <div className="rounded-[28px] border border-white/10 bg-slate-950/60 p-6">
                <div className="flex items-start gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/10">
                    <Bot size={20} className="text-fuchsia-200" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Hãy chọn một bài tập trước nha
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">
                      Sau khi chọn bài, AI sẽ hiện ra những nút giúp hợp với bài đó.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>
        ) : (
          <section className="mt-6 space-y-5">
            <div className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5 text-sm leading-relaxed text-slate-300">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
                Đơn giản cho con
              </div>
              <p className="mt-3">
                Mục này chỉ cần 2 việc: chọn file, rồi bấm{" "}
                <span className="font-semibold text-white">Phân tích với AI</span>.
                Các tùy chọn thêm đã được ẩn bớt để con dễ dùng hơn.
              </p>
            </div>

            <SpeakingLab
              selectedAssignment={selectedAssignment}
              selectedHomeworkId={selectedHomeworkId}
            />
          </section>
        )}
      </div>
    </div>
  );
}
