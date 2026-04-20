"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
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
  Sparkles,
  MessageSquare,
  GraduationCap,
  Clock3,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

import HomeworkAiWorkspace from "@/app/[locale]/portal/student/homework/[id]/components/HomeworkAiWorkspace";
import {
  getStudentHomework,
  getStudentHomeworkById,
  getStudentSubmittedHomework,
} from "@/lib/api/studentService";
import type { AssignmentDetail, AssignmentListItem } from "@/types/student/homework";

const PAGE_SIZE = 100;

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

function getStatusIcon(status?: string) {
  const normalized = String(status || "").trim().toUpperCase();

  if (normalized === "SUBMITTED" || normalized === "GRADED") {
    return <CheckCircle2 size={12} className="text-emerald-400" />;
  }
  if (normalized === "LATE") {
    return <AlertCircle size={12} className="text-amber-400" />;
  }
  if (normalized === "MISSING") {
    return <AlertCircle size={12} className="text-rose-400" />;
  }
  return <Clock3 size={12} className="text-cyan-400" />;
}

function getStatusClass(status?: string) {
  const normalized = String(status || "").trim().toUpperCase();

  if (normalized === "SUBMITTED" || normalized === "GRADED") {
    return "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";
  }

  if (normalized === "LATE") {
    return "border-amber-400/30 bg-amber-500/15 text-amber-100";
  }

  if (normalized === "MISSING") {
    return "border-rose-400/30 bg-rose-500/15 text-rose-100";
  }

  return "border-cyan-400/30 bg-cyan-500/15 text-cyan-100";
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

function buildAiSpeakingHref(locale: string, homeworkId?: string | null) {
  if (!homeworkId) {
    return `/${locale}/portal/student/ai-speaking`;
  }

  return `/${locale}/portal/student/ai-speaking?homeworkId=${encodeURIComponent(
    homeworkId
  )}`;
}

export default function StudentAiTutorWorkspace() {
  const router = useRouter();
  const params = useParams();
  const locale = String(params.locale || "vi");

  const [items, setItems] = useState<AssignmentListItem[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedHomeworkId, setSelectedHomeworkId] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentDetail | null>(
    null
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  const deferredSearch = useDeferredValue(searchTerm);

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadHomeworkItems = async () => {
      setListLoading(true);
      setListError(null);

      try {
        const [homeworkResponse, submittedResponse] = await Promise.all([
          getStudentHomework({ pageNumber: 1, pageSize: PAGE_SIZE }),
          getStudentSubmittedHomework({ pageNumber: 1, pageSize: PAGE_SIZE }),
        ]);

        if (cancelled) return;

        const currentItems = homeworkResponse?.data?.homeworkAssignments?.items || [];
        const submittedItems =
          submittedResponse?.data?.homeworkAssignments?.items || [];

        setItems(mergeHomeworkItems(currentItems, submittedItems));
      } catch (error) {
        console.error("Load AI tutor homework list error:", error);

        if (!cancelled) {
          setListError("Không thể tải danh sách bài tập để AI hỗ trợ.");
        }
      } finally {
        if (!cancelled) {
          setListLoading(false);
        }
      }
    };

    void loadHomeworkItems();

    return () => {
      cancelled = true;
    };
  }, []);

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

    return labels;
  }, [selectedAssignment]);

  const selectedHasHomeworkAi = Boolean(
    selectedAssignment?.aiHintEnabled || selectedAssignment?.aiRecommendEnabled
  );

  const aiSpeakingHref = buildAiSpeakingHref(locale, selectedHomeworkId);

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header Section */}
      <div className={`shrink-0 px-6 pt-6 pb-4 transition-all duration-700 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
        
        {/* Hero Header */}
        <div className="mb-8 relative">
          <div className="text-center pt-4">
            <div className="inline-block relative">
              {/* Glowing background effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500 via-pink-500 to-violet-500 opacity-30 blur-2xl"></div>

              {/* Main frame */}
              <div
                className="relative rounded-3xl px-8 md:px-16 py-8 md:py-10 bg-gradient-to-br from-purple-500/20 via-pink-500/15 to-violet-500/20 backdrop-blur-xl border border-transparent flex flex-col items-center justify-center"
                style={{
                  backgroundImage: "linear-gradient(135deg, rgba(168,85,247,0.3), rgba(236,72,153,0.3), rgba(217,70,239,0.3)), linear-gradient(to right, rgba(168,85,247,0.1), rgba(236,72,153,0.1))",
                  boxShadow: "0 0 60px rgba(168,85,247,0.3), 0 0 30px rgba(236,72,153,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
                }}
              >
                <div
                  className="absolute inset-0 rounded-3xl p-[2px] pointer-events-none"
                  style={{
                    background: "linear-gradient(135deg, #a855f7, #ec4899, #d946ef, #a855f7)",
                    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                    padding: "4px",
                  }}
                ></div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Bot className="w-8 h-8 text-purple-400 animate-pulse" />
                    <h1 className="text-5xl md:text-6xl lg:text-5xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-fuchsia-300 bg-clip-text text-transparent drop-shadow-lg">
                      AI TUTOR
                    </h1>
                    <Sparkles className="w-8 h-8 text-pink-400 animate-pulse" />
                  </div>
                  <p className="text-base md:text-lg font-medium text-purple-200/80">
                    AI hỗ trợ homework cho con - Gợi ý và luyện thêm thông minh
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Speaking Button Bar */}
        <div className="flex justify-end mb-6">
          <button
            type="button"
            onClick={() => router.push(aiSpeakingHref)}
            className="group inline-flex items-center gap-2 rounded-2xl border border-cyan-400/30 bg-gradient-to-r from-cyan-500/15 to-teal-500/15 px-5 py-3 text-sm font-bold text-cyan-100 transition-all duration-300 hover:bg-cyan-500/25 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20 cursor-pointer"
          >
            <Mic size={16} className="group-hover:animate-pulse" />
            Mở AI Speaking
            <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all duration-300" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 px-6 pb-6 overflow-y-auto custom-scrollbar transition-all duration-700 delay-100 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        
        {/* Main Grid */}
        <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          {/* Left Panel - Homework List */}
          <div className="space-y-4 rounded-[28px] border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-slate-900/80 p-5 shadow-xl shadow-purple-500/10 backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30">
                <BookOpen size={20} className="text-purple-300" />
              </div>
              <div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                  Bước 1: Chọn bài tập
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-purple-300/60">
                  Con hãy bấm vào một bài để AI biết con đang làm homework nào.
                </p>
              </div>
            </div>

            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-purple-400"
              />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Tìm tên bài tập..."
                className="w-full rounded-2xl border border-purple-500/30 bg-slate-900/80 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-purple-400/50 focus:border-purple-400/60 focus:ring-1 focus:ring-purple-400/30 transition-all duration-200"
              />
            </div>

            <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-3 text-xs text-purple-300/70 flex items-start gap-2">
              <Sparkles size={14} className="text-purple-400 shrink-0 mt-0.5" />
              <span>
                Mẹo nhỏ: mục này chỉ dành cho hỗ trợ homework. Nếu con muốn bấm mic để
                nói trực tiếp, hãy qua AI Speaking.
              </span>
            </div>

            {/* Homework List */}
            <div className="max-h-[760px] space-y-3 overflow-y-auto pr-1 custom-scrollbar">
              {listLoading ? (
                <div className="flex items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-500/10 px-4 py-10 text-sm text-purple-300">
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  Đang tải danh sách bài tập...
                </div>
              ) : null}

              {!listLoading && listError ? (
                <div className="rounded-2xl border border-rose-400/30 bg-rose-500/15 p-4 text-sm text-rose-200">
                  {listError}
                </div>
              ) : null}

              {!listLoading && !listError && filteredItems.length === 0 ? (
                <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-5 text-sm text-purple-300/70 text-center">
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
                      className={`w-full rounded-[24px] border p-4 text-left transition-all duration-300 cursor-pointer ${
                        active
                          ? "border-purple-400/60 bg-gradient-to-r from-purple-500/20 to-pink-500/20 shadow-lg shadow-purple-500/20 scale-[1.02]"
                          : "border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/15 hover:border-purple-400/50 hover:scale-[1.01]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="line-clamp-2 text-sm font-bold text-white">
                            {item.assignmentTitle || "Bài tập"}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-[11px] font-semibold text-purple-300">
                              {item.classCode || item.className || "Lớp học"}
                            </span>
                            <span
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold flex items-center gap-1 ${getStatusClass(item.status)}`}
                            >
                              {getStatusIcon(item.status)}
                              {getStatusLabel(item.status)}
                            </span>
                          </div>
                        </div>
                        <ChevronRight
                          size={16}
                          className={`transition-all duration-300 ${
                            active ? "text-purple-300 translate-x-0.5" : "text-purple-500/50"
                          }`}
                        />
                      </div>
                      <div className="mt-3 text-xs text-purple-400/60 flex items-center gap-1">
                        <Clock3 size={10} />
                        Hạn: {formatDateLabel(item.dueAt || item.assignedDate)}
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Right Panel - AI Workspace */}
          <div className="space-y-6">
            {/* Step 2 Header */}
            <div className="rounded-[28px] border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-slate-900/80 p-5 shadow-xl shadow-purple-500/10 backdrop-blur-xl">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.24em] text-purple-400">
                    Bước 2
                  </div>
                  <h2 className="mt-2 text-xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                    {selectedAssignment?.title || "Chọn bài tập để AI bắt đầu giúp"}
                  </h2>
                  {selectedAssignment ? (
                    <p className="mt-2 text-sm leading-relaxed text-purple-300/70">
                      <GraduationCap size={14} className="inline mr-1" />
                      {selectedAssignment.className || "Lớp học"} - Hạn nộp{" "}
                      {formatDateLabel(selectedAssignment.dueDate)}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm leading-relaxed text-purple-400/60">
                      Sau khi chọn bài, AI Tutor sẽ hiện ra các nút hỗ trợ homework phù
                      hợp.
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  {selectedHomeworkId ? (
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/${locale}/portal/student/homework/${selectedHomeworkId}`)
                      }
                      className="group inline-flex items-center gap-2 rounded-2xl border border-purple-500/30 bg-purple-500/10 px-4 py-2.5 text-sm font-semibold text-purple-200 transition-all duration-300 hover:bg-purple-500/20 hover:scale-105 cursor-pointer"
                    >
                      <FileText size={16} />
                      Mở bài tập gốc
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => router.push(aiSpeakingHref)}
                    className="group inline-flex items-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-500/15 px-4 py-2.5 text-sm font-semibold text-cyan-200 transition-all duration-300 hover:bg-cyan-500/25 hover:scale-105 cursor-pointer"
                  >
                    <Mic size={16} className="group-hover:animate-pulse" />
                    Sang AI Speaking
                  </button>
                </div>
              </div>

              {selectedSummary.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedSummary.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-purple-400/30 bg-purple-500/15 px-3 py-1 text-xs font-semibold text-purple-200"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Loading State */}
            {detailLoading ? (
              <div className="flex min-h-[260px] items-center justify-center rounded-[28px] border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-slate-900/80 p-6 text-purple-300 backdrop-blur-xl">
                <Loader2 size={18} className="mr-2 animate-spin" />
                Đang mở bài tập...
              </div>
            ) : null}

            {/* Error State */}
            {!detailLoading && detailError ? (
              <div className="rounded-[28px] border border-rose-400/30 bg-rose-500/15 p-5 text-sm text-rose-200 backdrop-blur-xl">
                {detailError}
              </div>
            ) : null}

            {/* AI Workspace - When AI features are enabled */}
            {!detailLoading && !detailError && selectedAssignment && selectedHasHomeworkAi ? (
              <>
                <div className="rounded-[28px] border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-slate-900/80 p-5 text-sm leading-relaxed text-purple-300/80 flex items-start gap-3 backdrop-blur-xl">
                  <Lightbulb size={18} className="text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Con hãy bấm vào nút con cần. AI Tutor sẽ hỗ trợ homework tốt hơn,
                    nhưng con vẫn là người tự làm bài.
                  </span>
                </div>
                <HomeworkAiWorkspace
                  homeworkStudentId={selectedHomeworkId || selectedAssignment.id}
                  assignment={selectedAssignment}
                />
              </>
            ) : null}

            {/* No AI Features Message */}
            {!detailLoading &&
            !detailError &&
            selectedAssignment &&
            !selectedHasHomeworkAi ? (
              <div className="rounded-[28px] border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-slate-900/80 p-6 backdrop-blur-xl">
                <div className="flex items-start gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl border border-amber-400/30 bg-amber-500/15">
                    <Lightbulb size={20} className="text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Bài tập này chưa mở AI Tutor riêng
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-purple-300/70">
                      {selectedAssignment.speakingMode
                        ? "Bài này chưa có gợi ý homework từ AI. Phần luyện nói đã được tách sang AI Speaking để con bấm mic nói trực tiếp."
                        : "Bài này chưa bật các nút hỗ trợ homework từ AI."}
                    </p>
                    {selectedAssignment.speakingMode ? (
                      <button
                        type="button"
                        onClick={() => router.push(aiSpeakingHref)}
                        className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-500/15 px-4 py-2.5 text-sm font-semibold text-cyan-200 transition-all duration-300 hover:bg-cyan-500/25 hover:scale-105 cursor-pointer"
                      >
                        <Mic size={16} />
                        Mở AI Speaking
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            {/* No Assignment Selected */}
            {!detailLoading && !detailError && !selectedAssignment ? (
              <div className="rounded-[28px] border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-slate-900/80 p-6 backdrop-blur-xl">
                <div className="flex items-start gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30">
                    <Bot size={20} className="text-purple-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                      Hãy chọn một bài tập trước nha
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-purple-300/70">
                      Sau khi chọn bài, AI Tutor sẽ hiện ra những nút giúp hợp với
                      homework đó.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(139, 92, 246, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.4);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.6);
        }
      `}</style>
    </div>
  );
}