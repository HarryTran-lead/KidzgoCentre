import { CheckCircle2, FileBarChart, FileText, Loader2, RefreshCw, Send, Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/lightswind/select";
import type { ReportShareChannel, StudentReportDetailDto, StudentReportListItemDto } from "@/types/reports-v3";
import { EmptyState, SectionCard, SnapshotSummary, cn, localizeUiText } from "@/components/reports-v3/tabs/shared";

type ReportsTabProps = {
  reportSearch: string;
  setReportSearch: (value: string) => void;
  reportTypeFilter: string;
  setReportTypeFilter: (value: string) => void;
  reportStatusFilter: string;
  setReportStatusFilter: (value: string) => void;
  loadingReports: boolean;
  filteredReports: StudentReportListItemDto[];
  selectedReportId: string;
  setSelectedReportId: (value: string) => void;
  loadingDetail: boolean;
  reportDetail: StudentReportDetailDto | null;
  canPublishToParent: boolean;
  publishingParent: boolean;
  sharingReport: boolean;
  shareRecipientName: string;
  setShareRecipientName: (value: string) => void;
  shareRecipientContact: string;
  setShareRecipientContact: (value: string) => void;
  shareChannel: ReportShareChannel;
  setShareChannel: (value: ReportShareChannel) => void;
  onRefresh: () => void;
  onOpenGenerate: () => void;
  onPublishToParent: () => void;
  onShare: () => void;
  formatReportType: (value?: string | null) => string;
  normalizeStatusLabel: (value?: string | null) => string;
  statusTone: (value?: string | null) => string;
  formatDate: (value?: string | null) => string;
  formatDateTime: (value?: string | null) => string;
  formatInsightType: (value?: string | null) => string;
  formatRiskType: (value?: string | null) => string;
  formatRiskSeverity: (value?: string | null) => string;
  formatRecommendationRole: (value?: string | null) => string;
  formatShareChannel: (value?: string | null) => string;
  reportTypeTone: (value?: string | null) => string;
  normalizeText: (value?: string | null) => string;
};

export default function ReportsTab({
  reportSearch,
  setReportSearch,
  reportTypeFilter,
  setReportTypeFilter,
  reportStatusFilter,
  setReportStatusFilter,
  loadingReports,
  filteredReports,
  selectedReportId,
  setSelectedReportId,
  loadingDetail,
  reportDetail,
  canPublishToParent,
  publishingParent,
  sharingReport,
  shareRecipientName,
  setShareRecipientName,
  shareRecipientContact,
  setShareRecipientContact,
  shareChannel,
  setShareChannel,
  onRefresh,
  onOpenGenerate,
  onPublishToParent,
  onShare,
  formatReportType,
  normalizeStatusLabel,
  statusTone,
  formatDate,
  formatDateTime,
  formatInsightType,
  formatRiskType,
  formatRiskSeverity,
  formatRecommendationRole,
  formatShareChannel,
  reportTypeTone,
  normalizeText,
}: ReportsTabProps) {
  return (
    <div className="grid gap-6 [grid-template-columns:minmax(0,7fr)_minmax(0,3fr)] max-[1400px]:grid-cols-1">
      <SectionCard
        title="Chi tiết báo cáo"        
        icon={<FileText size={18} />}
        className="flex h-[calc(100dvh-15rem)] min-h-0 flex-col max-[1400px]:h-auto"
        contentClassName="min-h-0 flex-1"
        action={(
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenGenerate}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 px-3 py-2 text-sm font-semibold text-white"
            >
              <Sparkles size={14} />
              Tạo báo cáo
            </button>
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw size={14} /> Làm mới
            </button>
          </div>
        )}
      >
        <div className="h-full overflow-y-auto pr-1">
          {loadingDetail ? (
          <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-600">
            <Loader2 size={16} className="animate-spin" /> Đang tải chi tiết báo cáo...
          </div>
        ) : reportDetail ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div>
                <div className="text-lg font-semibold text-gray-900">{reportDetail.studentName || "Báo cáo học viên"}</div>
                <div className="mt-1 text-sm text-gray-500">{reportDetail.className || "Chưa có lớp"} • {formatReportType(reportDetail.reportType)}</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold", statusTone(reportDetail.status))}>
                  {normalizeStatusLabel(reportDetail.status)}
                </span>
                {reportDetail.isParentPublished ? (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Đã công bố phụ huynh</span>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-12">
              <div className="rounded-2xl border border-gray-200 bg-white p-4 lg:col-span-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Kỳ báo cáo</div>
                <div className="mt-2 text-sm text-gray-700">{reportDetail.reportPeriodName || "—"}</div>
                <div className="mt-1 text-xs text-gray-500">{formatDate(reportDetail.reportPeriodFrom)} - {formatDate(reportDetail.reportPeriodTo)}</div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-4 lg:col-span-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Thời gian tạo</div>
                <div className="mt-2 text-sm text-gray-700">{formatDateTime(reportDetail.createdAt)}</div>
                <div className="mt-1 text-xs text-gray-500">Công bố phụ huynh lúc: {formatDateTime(reportDetail.parentPublishedAt)}</div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-4 lg:col-span-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tóm tắt</div>
                <div className="mt-2 text-sm leading-6 text-gray-700">{localizeUiText(reportDetail.summaryText) || "Chưa có phần tóm tắt."}</div>
              </div>
            </div>

            <SnapshotSummary snapshot={reportDetail.snapshot} />

            <div className="grid gap-4 xl:grid-cols-12">
              <div className="rounded-2xl border border-gray-200 bg-white p-4 xl:col-span-4">
                <div className="text-sm font-semibold text-gray-900">Nhận định</div>
                <div className="mt-3 space-y-2">
                  {reportDetail.insights?.length ? reportDetail.insights.map((item) => (
                    <div key={item.id} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                      <div className="font-medium text-gray-900">{formatInsightType(item.insightType)}</div>
                      <div className="mt-1">{localizeUiText(item.content)}</div>
                    </div>
                  )) : <div className="text-sm text-gray-500">Chưa có nhận định.</div>}
                </div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-4 xl:col-span-4">
                <div className="text-sm font-semibold text-gray-900">Rủi ro</div>
                <div className="mt-3 space-y-2">
                  {reportDetail.risks?.length ? reportDetail.risks.map((item) => (
                    <div key={item.id} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium text-gray-900">{formatRiskType(item.riskType)}</div>
                        <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold", statusTone(item.severity))}>{formatRiskSeverity(item.severity)}</span>
                      </div>
                      <div className="mt-1">{localizeUiText(item.reason)}</div>
                    </div>
                  )) : <div className="text-sm text-gray-500">Chưa có cảnh báo rủi ro trong chi tiết.</div>}
                </div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-4 xl:col-span-4">
                <div className="text-sm font-semibold text-gray-900">Đề xuất</div>
                <div className="mt-3 space-y-2">
                  {reportDetail.recommendations?.length ? reportDetail.recommendations.map((item) => (
                    <div key={item.id} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                      <div className="font-medium text-gray-900">{formatRecommendationRole(item.assignedRole)}</div>
                      <div className="mt-1">{localizeUiText(item.content)}</div>
                    </div>
                  )) : <div className="text-sm text-gray-500">Chưa có đề xuất trong chi tiết.</div>}
                </div>
              </div>
            </div>

          </div>
        ) : (
          <EmptyState title="Chưa chọn báo cáo" description="Chọn một báo cáo ở cột trái để xem snapshot, rủi ro và đề xuất." />
        )}
        </div>
      </SectionCard>

      <div className="grid h-[calc(100dvh-15rem)] min-h-0 gap-4 [grid-template-rows:minmax(0,1.2fr)_minmax(0,0.8fr)] max-[1400px]:h-auto max-[1400px]:grid-rows-1">
        <SectionCard
          title="Lịch sử báo cáo"
          subtitle="Danh sách dọc theo học viên đang chọn, tách riêng khỏi báo cáo tháng/buổi cũ."
          icon={<FileBarChart size={18} />}
          className="flex min-h-0 flex-col"
          contentClassName="min-h-0 flex-1"
        >
          <div className="flex h-full min-h-0 flex-col gap-3">
            <div className="space-y-2">
              <input
                value={reportSearch}
                onChange={(event) => setReportSearch(event.target.value)}
                placeholder="Tìm theo tên, lớp, loại"
                className="h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm text-gray-700 outline-none focus:border-red-300"
              />
              <Select value={reportTypeFilter} onValueChange={setReportTypeFilter}>
                <SelectTrigger className="h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm text-gray-700">
                  <SelectValue placeholder="Tất cả loại báo cáo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tất cả loại báo cáo</SelectItem>
                  <SelectItem value="parent">{formatReportType("parent")}</SelectItem>
                  <SelectItem value="academic">{formatReportType("academic")}</SelectItem>
                  <SelectItem value="internal">{formatReportType("internal")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={reportStatusFilter} onValueChange={setReportStatusFilter}>
                <SelectTrigger className="h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm text-gray-700">
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tất cả trạng thái</SelectItem>
                  <SelectItem value="completed">{normalizeStatusLabel("completed")}</SelectItem>
                  <SelectItem value="processing">{normalizeStatusLabel("processing")}</SelectItem>
                  <SelectItem value="pending">{normalizeStatusLabel("pending")}</SelectItem>
                  <SelectItem value="failed">{normalizeStatusLabel("failed")}</SelectItem>
                  <SelectItem value="superseded">{normalizeStatusLabel("superseded")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              {loadingReports ? (
                <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-600">
                  <Loader2 size={16} className="animate-spin" />
                  Đang tải lịch sử báo cáo...
                </div>
              ) : filteredReports.length ? (
                <div className="space-y-2">
                  {filteredReports.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedReportId(item.id)}
                      className={cn(
                        "w-full rounded-2xl border px-3 py-3 text-left transition-colors",
                        selectedReportId === item.id
                          ? "border-red-300 bg-red-50/70 shadow-sm"
                          : "border-gray-200 bg-white hover:bg-gray-50",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold text-gray-900">{item.studentName || "Báo cáo học viên"}</div>
                          <div className="mt-1 text-xs text-gray-500">{item.className || "Chưa có lớp"}</div>
                        </div>
                        <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold", statusTone(item.status))}>
                          {normalizeStatusLabel(item.status)}
                        </span>
                      </div>
                      <div className={cn("mt-2 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold", reportTypeTone(item.reportType))}>
                        {formatReportType(item.reportType)}
                      </div>
                      <div className="mt-2 space-y-0.5 text-[11px] text-gray-500">
                        <div>Ngày tạo: {formatDateTime(item.createdAt)}</div>
                        <div>Công bố PH: {item.isParentPublished ? "Có" : "Không"}</div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState title="Chưa có lịch sử báo cáo" description="Tạo báo cáo đầu tiên hoặc chọn học viên khác để xem lịch sử." />
              )}
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Công bố và chia sẻ"
          subtitle="Đặt cùng cột với lịch sử để thao tác nhanh trên báo cáo đang chọn."
          icon={<Send size={18} />}
          className="flex min-h-0 flex-col"
          contentClassName="min-h-0 flex-1"
        >
          <div className="h-full overflow-y-auto pr-1">
            {reportDetail ? (
              <div className="space-y-3">
                {canPublishToParent && normalizeText(reportDetail.reportType) === "parent" && normalizeText(reportDetail.status) === "completed" && !reportDetail.isParentPublished ? (
                  <button
                    type="button"
                    onClick={onPublishToParent}
                    disabled={publishingParent}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {publishingParent ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    Công bố cho phụ huynh
                  </button>
                ) : (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                    Báo cáo đã công bố hoặc chưa đủ điều kiện công bố.
                  </div>
                )}

                <div className="space-y-2">
                  <input
                    value={shareRecipientName}
                    onChange={(event) => setShareRecipientName(event.target.value)}
                    placeholder="Tên người nhận"
                    className="h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm text-gray-700 outline-none focus:border-red-300"
                  />
                  <input
                    value={shareRecipientContact}
                    onChange={(event) => setShareRecipientContact(event.target.value)}
                    placeholder="Thông tin liên hệ người nhận"
                    className="h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm text-gray-700 outline-none focus:border-red-300"
                  />
                  <Select value={shareChannel} onValueChange={(value) => setShareChannel(value as ReportShareChannel)}>
                    <SelectTrigger className="h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm text-gray-700">
                      <SelectValue placeholder="Kênh chia sẻ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="app">{formatShareChannel("app")}</SelectItem>
                      <SelectItem value="email">{formatShareChannel("email")}</SelectItem>
                      <SelectItem value="zalo">{formatShareChannel("zalo")}</SelectItem>
                      <SelectItem value="sms">{formatShareChannel("sms")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <button
                  type="button"
                  onClick={onShare}
                  disabled={sharingReport || normalizeText(reportDetail.reportType) !== "parent"}
                  className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sharingReport ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Tạo nhật ký chia sẻ
                </button>

                <div className="max-h-36 space-y-2 overflow-y-auto pr-1">
                  {reportDetail.shareLogs?.length ? reportDetail.shareLogs.map((item) => (
                    <div key={item.id} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="font-medium text-gray-900">{item.recipientName} • {formatShareChannel(item.channel)}</div>
                        <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold", statusTone(item.status))}>{normalizeStatusLabel(item.status)}</span>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">Gửi lúc {formatDateTime(item.sentAt)} • Xem lúc {formatDateTime(item.viewedAt)}</div>
                    </div>
                  )) : <div className="text-sm text-gray-500">Chưa có nhật ký chia sẻ.</div>}
                </div>
              </div>
            ) : (
              <EmptyState title="Chưa có báo cáo để chia sẻ" description="Chọn một báo cáo trong lịch sử trước khi công bố hoặc tạo nhật ký chia sẻ." />
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
