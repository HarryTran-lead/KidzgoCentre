import { AlertTriangle, BellRing, Loader2 } from "lucide-react";
import type { RecommendationDto, RiskAlertDto } from "@/types/reports-v3";
import { EmptyState, SectionCard, cn, localizeUiText } from "@/components/reports-v3/tabs/shared";

type FollowUpTabProps = {
  loadingFollowUp: boolean;
  riskAlerts: RiskAlertDto[];
  recommendations: RecommendationDto[];
  formatRiskType: (value?: string | null) => string;
  statusTone: (value?: string | null) => string;
  formatRiskSeverity: (value?: string | null) => string;
  normalizeStatusLabel: (value?: string | null) => string;
  formatRecommendationRole: (value?: string | number | null) => string;
};

function normalizeText(value?: string | null) {
  return String(value ?? "").trim().toLowerCase();
}

function formatPriority(value?: string | null) {
  const key = normalizeText(value);
  if (key === "high") return "Cao";
  if (key === "medium") return "Trung bình";
  if (key === "low") return "Thấp";
  return value || "Không xác định";
}

export default function FollowUpTab({
  loadingFollowUp,
  riskAlerts,
  recommendations,
  formatRiskType,
  statusTone,
  formatRiskSeverity,
  normalizeStatusLabel,
  formatRecommendationRole,
}: FollowUpTabProps) {
  return (
    <div className="grid gap-6 [grid-template-columns:minmax(0,7fr)_minmax(0,3fr)] max-[1400px]:grid-cols-1">
      <SectionCard title="Thông báo rủi ro" subtitle="Đọc rủi ro từ tổng quan lớp và chi tiết báo cáo, không cập nhật dữ liệu gốc." icon={<AlertTriangle size={18} />}>
        {loadingFollowUp ? (
          <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-600">
            <Loader2 size={16} className="animate-spin" /> Đang tải thông báo rủi ro...
          </div>
        ) : riskAlerts.length ? (
          <div className="space-y-2">
            {riskAlerts.map((item) => (
              <div key={item.id} className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-gray-900">{formatRiskType(item.riskType)}</div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                      {item.studentId || item.studentName ? (
                        <span>Học viên: <span className="font-semibold text-gray-700">{item.studentName || "Chưa xác định"}</span></span>
                      ) : (
                        <span>Cấp lớp</span>
                      )}
                      {item.className ? <span>Lớp: <span className="font-semibold text-gray-700">{item.className}</span></span> : null}
                    </div>
                    <div className="mt-1 text-sm text-gray-600">{localizeUiText(item.reason)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold", statusTone(item.severity))}>{formatRiskSeverity(item.severity)}</span>
                    <span className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold", statusTone(item.status))}>{normalizeStatusLabel(item.status)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Chưa có thông báo rủi ro" description="Chọn lớp có dữ liệu rủi ro hoặc tạo báo cáo để làm giàu dữ liệu theo dõi." />
        )}
      </SectionCard>

      <SectionCard title="Đề xuất hành động" subtitle="Danh sách hành động theo vai trò giáo viên / quản lý học thuật / CS / quản trị." icon={<BellRing size={18} />}>
        {recommendations.length ? (
          <div className="space-y-2">
            {recommendations.map((item) => (
              <div key={item.id} className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-gray-900">{item.studentName || "Đề xuất"}</div>
                    <div className="mt-1 text-sm text-gray-600">{localizeUiText(item.content)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.recommendationType ? (
                      <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                        {formatRiskType(item.recommendationType)}
                      </span>
                    ) : null}
                    {item.priority ? (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        Ưu tiên: {formatPriority(item.priority)}
                      </span>
                    ) : null}
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">{formatRecommendationRole(item.assignedRole)}</span>
                    <span className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold", statusTone(item.status))}>{normalizeStatusLabel(item.status)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Chưa có đề xuất" description="Chọn học viên và tạo báo cáo để lấy danh sách hành động theo vai trò." />
        )}
      </SectionCard>
    </div>
  );
}
