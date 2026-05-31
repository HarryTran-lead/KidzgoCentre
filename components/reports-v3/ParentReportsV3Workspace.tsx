"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  FileText,
  Loader2,
  MessageSquare,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import ChildSelector from "@/components/portal/parent/ChildSelector";
import { toast } from "@/hooks/use-toast";
import { useSelectedStudentProfile } from "@/hooks/useSelectedStudentProfile";
import { extractApiError } from "@/lib/api/extractApiError";
import {
  getParentReport,
  getStudentReportById,
  getStudentReports,
  markReportViewed,
} from "@/lib/api/reportsV3Service";
import type {
  ParentReportViewResponse,
  ReportsV3Snapshot,
  StudentReportDetailDto,
  StudentReportListItemDto,
} from "@/types/reports-v3";

const REPORT_TYPE_LABELS: Record<string, string> = {
  parent: "Báo cáo phụ huynh",
  academic: "Báo cáo học thuật",
  internal: "Báo cáo nội bộ",
};

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function getErrMsg(error: unknown, fallback: string) {
  return extractApiError(error, fallback);
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN");
}

function formatPercent(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `${Math.round(value)}%`;
}

function formatScalar(value?: string | number | boolean | null) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Có" : "Không";
  return String(value);
}

function normalizeText(value?: string | null) {
  return String(value ?? "").trim().toLowerCase();
}

function formatReportType(value?: string | null) {
  const key = normalizeText(value);
  return REPORT_TYPE_LABELS[key] || (value || "Báo cáo");
}

function isPublishedParentReport(report?: { reportType?: string; isParentPublished?: boolean }): boolean {
  if (!report) return false;
  const isParentType = !report.reportType || normalizeText(report.reportType) === "parent";
  return isParentType && report.isParentPublished === true;
}

function ParentStatCard({
  title,
  value,
  hint,
  icon,
  tone,
}: {
  title: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  tone: "red" | "blue" | "green" | "amber";
}) {
  const toneMap = {
    red: "from-red-600 to-red-700",
    blue: "from-blue-600 to-cyan-600",
    green: "from-emerald-600 to-teal-600",
    amber: "from-amber-600 to-orange-600",
  } as const;

  return (
    <div className="rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-gray-600">{title}</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{value}</div>
          <div className="mt-1 text-xs text-gray-500">{hint}</div>
        </div>
        <div className={cn("rounded-xl bg-gradient-to-r p-2 text-white shadow-sm", toneMap[tone])}>{icon}</div>
      </div>
    </div>
  );
}

function ParentSnapshotCard({ snapshot }: { snapshot?: ReportsV3Snapshot | null }) {
  if (!snapshot) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
        Chưa có snapshot phụ huynh để hiển thị.
      </div>
    );
  }

  const attendance = snapshot.attendance_summary;
  const progress = snapshot.learning_progress;
  const assessment = snapshot.assessment_summary;
  const evaluation = snapshot.teacher_evaluation;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Điểm danh</div>
        <div className="mt-2 text-sm text-gray-700">Tỷ lệ tham gia: <span className="font-semibold">{formatPercent(attendance?.attendance_rate)}</span></div>
        <div className="mt-1 text-sm text-gray-700">Đi học đúng lịch: {formatScalar(attendance?.present)}</div>
        <div className="mt-1 text-sm text-gray-700">Vắng không báo: {formatScalar(attendance?.absent_without_notice)}</div>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tiến độ học</div>
        <div className="mt-2 text-sm text-gray-700">Hoàn thành: <span className="font-semibold">{formatPercent(progress?.completion_percent)}</span></div>
        <div className="mt-1 text-sm text-gray-700">Bài học hiện tại: {formatScalar(progress?.current_lesson)}</div>
        <div className="mt-1 text-sm text-gray-700">Trạng thái học tập: {formatScalar(progress?.current_status)}</div>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Đánh giá gần nhất</div>
        <div className="mt-2 text-sm text-gray-700">Kết quả: <span className="font-semibold">{formatScalar(assessment?.latest_result)}</span></div>
        <div className="mt-1 text-sm text-gray-700">Điểm: {formatScalar(assessment?.latest_score)}</div>
        <div className="mt-1 text-sm text-gray-700">Nhận xét GV: {formatScalar(assessment?.teacher_comment)}</div>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Kỹ năng</div>
        <div className="mt-2 text-sm text-gray-700">Nói: {formatScalar(evaluation?.speaking)}</div>
        <div className="mt-1 text-sm text-gray-700">Tự tin: {formatScalar(evaluation?.confidence)}</div>
        <div className="mt-1 text-sm text-gray-700">Tham gia: {formatScalar(evaluation?.participation)}</div>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 md:col-span-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Thông điệp gửi phụ huynh</div>
        <div className="mt-2 text-sm text-gray-700">{snapshot.parent_message || "Giáo viên chưa để lại thông điệp riêng cho phụ huynh."}</div>
      </div>
    </div>
  );
}

function ParentReportDetail({ report }: { report?: StudentReportDetailDto | null }) {
  if (!report) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
        Chọn một báo cáo trong lịch sử để xem chi tiết.
      </div>
    );
  }

  const strengths = report.snapshot?.strengths ?? report.insights?.filter((item) => String(item.insightType).toLowerCase() === "strength").map((item) => item.content) ?? [];
  const weaknesses = report.snapshot?.weaknesses ?? report.insights?.filter((item) => String(item.insightType).toLowerCase() === "weakness").map((item) => item.content) ?? [];
  const recommendations = report.recommendations?.map((item) => item.content) ?? report.snapshot?.recommendations ?? [];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
        <div className="text-lg font-semibold text-gray-900">{report.studentName || "Báo cáo phụ huynh"}</div>
        <div className="mt-1 text-sm text-gray-500">{report.className || "Không có lớp"} • {formatDateTime(report.createdAt)}</div>
      </div>

      <ParentSnapshotCard snapshot={report.snapshot} />

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="text-sm font-semibold text-gray-900">Điểm mạnh</div>
          <div className="mt-3 space-y-2 text-sm text-gray-700">
            {strengths.length ? strengths.map((item, index) => (
              <div key={`${item}-${index}`} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">{item}</div>
            )) : <div className="text-gray-500">Chưa có nội dung điểm mạnh.</div>}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="text-sm font-semibold text-gray-900">Cần hỗ trợ thêm</div>
          <div className="mt-3 space-y-2 text-sm text-gray-700">
            {weaknesses.length ? weaknesses.map((item, index) => (
              <div key={`${item}-${index}`} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">{item}</div>
            )) : <div className="text-gray-500">Chưa có nội dung hỗ trợ thêm.</div>}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="text-sm font-semibold text-gray-900">Đề xuất tiếp theo</div>
          <div className="mt-3 space-y-2 text-sm text-gray-700">
            {recommendations.length ? recommendations.map((item, index) => (
              <div key={`${item}-${index}`} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">{item}</div>
            )) : <div className="text-gray-500">Chưa có đề xuất tiếp theo.</div>}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="text-sm font-semibold text-gray-900">Tóm tắt</div>
        <div className="mt-2 text-sm text-gray-700">{report.summaryText || report.snapshot?.parent_message || "Chưa có phần tóm tắt cho báo cáo này."}</div>
      </div>
    </div>
  );
}

export default function ParentReportsV3Workspace() {
  const { selectedProfile } = useSelectedStudentProfile();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [parentReport, setParentReport] = useState<ParentReportViewResponse | null>(null);
  const [history, setHistory] = useState<StudentReportListItemDto[]>([]);
  const [activeReportId, setActiveReportId] = useState("");
  const [activeReportDetail, setActiveReportDetail] = useState<StudentReportDetailDto | null>(null);

  const candidateIds = useMemo(
    () => Array.from(new Set([selectedProfile?.studentId, selectedProfile?.id].filter((value): value is string => Boolean(value?.trim())))),
    [selectedProfile?.id, selectedProfile?.studentId],
  );

  const loadParentData = useCallback(async () => {
    if (!candidateIds.length) {
      setParentReport(null);
      setHistory([]);
      setActiveReportId("");
      setActiveReportDetail(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let parentView: ParentReportViewResponse | null = null;
      for (const studentId of candidateIds) {
        try {
          const response = await getParentReport(studentId);
          parentView = isPublishedParentReport(response) ? response : null;
          if (parentView?.reportId || parentView?.snapshot || parentView?.summaryText) {
            break;
          }
        } catch {
          parentView = null;
        }
      }

      let historyItems: StudentReportListItemDto[] = [];
      for (const studentId of candidateIds) {
        try {
          const response = await getStudentReports(studentId, {
            page: 1,
            pageSize: 30,
            reportType: "parent",
          });
          const onlyPublishedParent = response.items
            .filter((item) => isPublishedParentReport(item))
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

          if (onlyPublishedParent.length) {
            historyItems = onlyPublishedParent;
            break;
          }
        } catch {
          historyItems = [];
        }
      }

      setParentReport(parentView);
      setHistory(historyItems);
      setActiveReportId((current) => {
        const availableIds = new Set(historyItems.map((item) => item.id));
        if (parentView?.reportId) {
          availableIds.add(parentView.reportId);
        }
        if (current && availableIds.has(current)) {
          return current;
        }
        return parentView?.reportId || historyItems[0]?.id || "";
      });

      if (parentView?.reportId && isPublishedParentReport(parentView)) {
        void markReportViewed(parentView.reportId).catch(() => undefined);
      }
    } catch (loadError) {
      setError(getErrMsg(loadError, "Không thể tải báo cáo phụ huynh."));
      setParentReport(null);
      setHistory([]);
      setActiveReportId("");
      setActiveReportDetail(null);
    } finally {
      setLoading(false);
    }
  }, [candidateIds]);

  const loadActiveDetail = useCallback(async () => {
    if (!activeReportId) {
      setActiveReportDetail(null);
      return;
    }

    try {
      const detail = await getStudentReportById(activeReportId);
      if (!isPublishedParentReport(detail)) {
        setActiveReportDetail(null);
        toast.warning({
          title: "Không khả dụng",
          description: "Báo cáo này chưa được công bố cho phụ huynh hoặc không phải bản phụ huynh.",
        });
        return;
      }

      setActiveReportDetail(detail);
      void markReportViewed(activeReportId).catch(() => undefined);
    } catch (detailError) {
      setActiveReportDetail(null);
      toast.warning({ title: "Không mở được chi tiết", description: getErrMsg(detailError, "Không thể tải chi tiết báo cáo phụ huynh.") });
    }
  }, [activeReportId]);

  useEffect(() => {
    void loadParentData();
  }, [loadParentData]);

  useEffect(() => {
    void loadActiveDetail();
  }, [loadActiveDetail]);

  const snapshot = activeReportDetail?.snapshot ?? parentReport?.snapshot;
  const recommendationCount = activeReportDetail?.recommendations?.length ?? parentReport?.recommendations?.length ?? snapshot?.recommendations?.length ?? 0;

  return (
    <div className="space-y-6 bg-gray-50 p-4 md:p-6">
      <div className="rounded-3xl border border-red-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-gradient-to-r from-red-600 to-red-700 p-3 text-white shadow-lg">
              <FileText size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Báo cáo học tập V3</h1>
              <p className="mt-1 max-w-3xl text-sm text-gray-600">
                Bản phụ huynh chỉ hiển thị báo cáo đã công bố, tập trung vào tiến bộ, hỗ trợ cần thiết và gợi ý tiếp theo.
              </p>
            </div>
          </div>
          <div className="w-full max-w-sm"><ChildSelector /></div>
        </div>

        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Báo cáo phụ huynh dùng snapshot bất biến. Nếu giáo viên chỉnh dữ liệu sau thời điểm tạo, báo cáo cũ vẫn không thay đổi.
        </div>
      </div>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      {loading ? (
        <div className="flex min-h-[280px] items-center justify-center rounded-3xl border border-gray-200 bg-white">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader2 size={16} className="animate-spin" /> Đang tải báo cáo phụ huynh...
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ParentStatCard title="Điểm danh" value={formatPercent(snapshot?.attendance_summary?.attendance_rate)} hint="Tỷ lệ tham gia trong kỳ" icon={<CheckCircle2 size={18} />} tone="red" />
            <ParentStatCard title="Tiến độ" value={formatPercent(snapshot?.learning_progress?.completion_percent)} hint="Mức độ hoàn thành hiện tại" icon={<TrendingUp size={18} />} tone="blue" />
            <ParentStatCard title="Đánh giá" value={formatScalar(snapshot?.assessment_summary?.latest_result)} hint="Kết quả gần nhất" icon={<Target size={18} />} tone="green" />
            <ParentStatCard title="Đề xuất" value={String(recommendationCount)} hint="Gợi ý hỗ trợ tiếp theo" icon={<MessageSquare size={18} />} tone="amber" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start gap-3">
                <div className="rounded-2xl bg-red-50 p-2 text-red-700"><BookOpen size={18} /></div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Tổng quan mới nhất</h2>
                  <p className="mt-1 text-sm text-gray-500">Báo cáo phụ huynh hiện tại của học viên được chọn.</p>
                </div>
              </div>

              {parentReport?.summaryText || parentReport?.snapshot ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <div className="font-semibold text-gray-900">{selectedProfile?.displayName || "Học viên"}</div>
                    <div className="mt-1 text-sm text-gray-500">Báo cáo phụ huynh mới nhất đã công bố</div>
                  </div>
                  <ParentSnapshotCard snapshot={parentReport?.snapshot} />
                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="text-sm font-semibold text-gray-900">Thông điệp tổng kết</div>
                    <div className="mt-2 text-sm text-gray-700">{parentReport?.summaryText || parentReport?.snapshot?.parent_message || "Chưa có lời nhắn tổng kết."}</div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                  Chưa có báo cáo phụ huynh nào được công bố cho học viên này.
                </div>
              )}

              <div className="mt-6">
                <div className="mb-3 text-sm font-semibold text-gray-900">Lịch sử báo cáo</div>
                {history.length ? (
                  <div className="space-y-2">
                    {history.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveReportId(item.id)}
                        className={cn(
                          "w-full rounded-2xl border px-4 py-3 text-left transition",
                          activeReportId === item.id
                            ? "border-red-300 bg-red-50"
                            : "border-gray-200 bg-white hover:bg-gray-50",
                        )}
                      >
                        <div className="font-semibold text-gray-900">{formatReportType(item.reportType)} • {formatDateTime(item.createdAt)}</div>
                        <div className="mt-1 text-sm text-gray-500">{item.className || "Không có lớp"}</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                    Chưa có lịch sử báo cáo đã công bố.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start gap-3">
                <div className="rounded-2xl bg-red-50 p-2 text-red-700"><Sparkles size={18} /></div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Chi tiết báo cáo</h2>
                  <p className="mt-1 text-sm text-gray-500">Chỉ hiển thị nội dung phù hợp cho phụ huynh, không lộ ghi chú nội bộ.</p>
                </div>
              </div>

              <ParentReportDetail report={activeReportDetail} />
            </section>
          </div>
        </>
      )}
    </div>
  );
}
