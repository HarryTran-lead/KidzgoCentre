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

  const deferredSearch = useDeferredValue(searchTerm);

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
    <div className="relative h-full overflow-y-auto pb-8">
      <div className="mx-auto w-full max-w-[1320px] px-4 py-5 sm:px-6 lg:px-8">
        <section className="rounded-[34px] border border-white/10 bg-gradient-to-br from-[#0f172a] via-[#1d123c] to-[#111827] p-6 shadow-2xl shadow-fuchsia-950/20">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-fuchsia-100">
                <Bot size={14} />
                AI Tutor
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-white lg:text-4xl">
                AI hỗ trợ homework cho con
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 lg:text-base">
                Chọn bài tập để xin gợi ý, xem bài luyện thêm và nhận hỗ trợ đúng với
                homework con đang làm.
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push(aiSpeakingHref)}
              className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/20"
            >
              <Mic size={16} />
              Mở AI Speaking
            </button>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-4 rounded-[28px] border border-white/10 bg-slate-950/70 p-5 shadow-xl shadow-slate-950/10">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/10">
                <BookOpen size={20} className="text-fuchsia-200" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Bước 1: Chọn bài tập</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">
                  Con hãy bấm vào một bài để AI biết con đang làm homework nào.
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
              Mẹo nhỏ: mục này chỉ dành cho hỗ trợ homework. Nếu con muốn bấm mic để
              nói trực tiếp, hãy qua AI Speaking.
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
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
                    >
                      <FileText size={16} />
                      Mở bài tập gốc
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => router.push(aiSpeakingHref)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2.5 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/20"
                  >
                    <Mic size={16} />
                    Sang AI Speaking
                  </button>
                </div>
              </div>

              {selectedSummary.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedSummary.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-1 text-xs font-medium text-fuchsia-100"
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

            {!detailLoading && !detailError && selectedAssignment && selectedHasHomeworkAi ? (
              <>
                <div className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5 text-sm leading-relaxed text-slate-300">
                  Con hãy bấm vào nút con cần. AI Tutor sẽ hỗ trợ homework tốt hơn,
                  nhưng con vẫn là người tự làm bài.
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
            !selectedHasHomeworkAi ? (
              <div className="rounded-[28px] border border-white/10 bg-slate-950/60 p-6">
                <div className="flex items-start gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl border border-amber-400/20 bg-amber-500/10">
                    <Lightbulb size={20} className="text-amber-200" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Bài tập này chưa mở AI Tutor riêng
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">
                      {selectedAssignment.speakingMode
                        ? "Bài này chưa có gợi ý homework từ AI. Phần luyện nói đã được tách sang AI Speaking để con bấm mic nói trực tiếp."
                        : "Bài này chưa bật các nút hỗ trợ homework từ AI."}
                    </p>
                    {selectedAssignment.speakingMode ? (
                      <button
                        type="button"
                        onClick={() => router.push(aiSpeakingHref)}
                        className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2.5 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/20"
                      >
                        <Mic size={16} />
                        Mở AI Speaking
                      </button>
                    ) : null}
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
                      Sau khi chọn bài, AI Tutor sẽ hiện ra những nút giúp hợp với
                      homework đó.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
