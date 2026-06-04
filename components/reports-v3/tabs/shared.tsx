import type { ReactNode } from "react";
import type { ReportsV3Snapshot } from "@/types/reports-v3";

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function formatPercent(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `${Math.round(value)}%`;
}

const SCALAR_TEXT_MAP: Record<string, string> = {
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  completed: "Hoàn thành",
  notstarted: "Chưa bắt đầu",
  not_started: "Chưa bắt đầu",
  inprogress: "Đang học",
  in_progress: "Đang học",
  pass: "Đạt",
  fail: "Không đạt",
  yes: "Có",
  no: "Không",
};

const EXACT_TEXT_MAP: Record<string, string> = {
  "Good attendance consistency.": "Điểm danh ổn định và đều đặn.",
  "Strong learning progress in current module.": "Tiến độ học tốt trong mô-đun hiện tại.",
  "Confident speaking participation.": "Tích cực phát biểu và giao tiếp tự tin.",
  "Learning progress is behind expected module pacing.": "Tiến độ học tập đang chậm hơn kế hoạch mô-đun.",
  "Latest assessment result requires remediation.": "Kết quả đánh giá gần nhất cần được kèm bổ sung.",
  "Communication confidence needs additional support.": "Mức tự tin khi giao tiếp cần được hỗ trợ thêm.",
  "Latest assessment result is FAIL.": "Kết quả đánh giá gần nhất là KHÔNG ĐẠT.",
  "Rule-based insight generation executed successfully.": "Đã chạy thành công cơ chế sinh nhận định theo luật.",
  "Parent report snapshot was generated from read-only sources.": "Snapshot báo cáo phụ huynh được tạo từ nguồn chỉ đọc.",
  "Student is maintaining stable learning momentum and can continue with the next module goals.": "Học viên đang duy trì nhịp học ổn định và có thể tiếp tục mục tiêu của mô-đun tiếp theo.",
  "Student needs more time to strengthen speaking confidence before the next learning milestone.": "Học viên cần thêm thời gian để củng cố sự tự tin khi nói trước mốc học tập tiếp theo.",
  "Please support attendance consistency so learning progress can improve steadily.": "Phụ huynh vui lòng hỗ trợ duy trì đi học đều để tiến độ học được cải thiện ổn định.",
  "Remaining sessions are low ({remainingTickets}). Please review package renewal options.": "Số buổi còn lại đang thấp ({remainingTickets}). Vui lòng xem phương án gia hạn gói học.",
  "Follow up with student and parent for corrective action.": "Theo dõi thêm với học viên và phụ huynh để có hành động điều chỉnh.",
  "Create remedial recommendation before reassessment.": "Tạo đề xuất phụ đạo trước lần đánh giá lại.",
  "Add focused review support for delayed lessons.": "Bổ sung hỗ trợ ôn tập tập trung cho các bài học đang chậm.",
  "Contact parent to verify attendance schedule and absence reasons.": "Liên hệ phụ huynh để xác minh lịch đi học và lý do vắng.",
  "Review teaching plan to balance review and new content.": "Rà soát kế hoạch giảng dạy để cân bằng giữa ôn tập và nội dung mới.",
  "Advise parent on package renewal options.": "Tư vấn phụ huynh về các phương án gia hạn gói học.",
  "Increase speaking-focused activities in class.": "Tăng cường các hoạt động tập trung vào kỹ năng nói trong lớp.",
  "Confirm attendance policy with parent and student.": "Xác nhận lại quy định điểm danh với phụ huynh và học viên.",
  "Review class pacing and teaching plan.": "Rà soát nhịp độ lớp học và kế hoạch giảng dạy.",
  "Default Academic Template": "Mẫu học thuật mặc định",
  "Default Parent Template": "Mẫu phụ huynh mặc định",
};

const REGEX_TEXT_MAP: Array<{ pattern: RegExp; replace: string }> = [
  {
    pattern: /Completion \(([^)]+)\) is below expected \(([^)]+)\) with ([^\.]+) buffer\./g,
    replace: "Mức hoàn thành ($1) thấp hơn kỳ vọng ($2) với biên độ $3.",
  },
  {
    pattern: /Attendance rate \(([^)]+)\) is below ([^\.]+)\./g,
    replace: "Tỷ lệ điểm danh ($1) thấp hơn ngưỡng $2.",
  },
  {
    pattern: /Review section ratio \(([^)]+)\) is at least ([^\.]+)\./g,
    replace: "Tỷ lệ ôn tập ($1) đang từ mức $2 trở lên.",
  },
  {
    pattern: /Remaining learning tickets \(([^)]+)\) are at or below ([^\.]+)\./g,
    replace: "Số buổi học còn lại ($1) đang ở mức bằng hoặc thấp hơn $2.",
  },
  {
    pattern: /Speaking \(([^)]+)\) or confidence \(([^)]+)\) is at or below configured threshold\./g,
    replace: "Điểm nói ($1) hoặc mức tự tin ($2) đang ở mức bằng hoặc thấp hơn ngưỡng cấu hình.",
  },
  {
    pattern: /Absence without notice occurred ([^ ]+) times \(threshold: ([^)]+)\)\./g,
    replace: "Đã phát sinh $1 lần vắng không báo (ngưỡng: $2).",
  },
  {
    pattern: /Class progress \(([^)]+)\) is behind expected progress \(([^)]+)\)\./g,
    replace: "Tiến độ lớp ($1) đang chậm hơn tiến độ kỳ vọng ($2).",
  },
  {
    pattern: /Attendance\s+([\d.]+)%\s*,\s*completion\s+([\d.]+)%\./gi,
    replace: "Điểm danh $1%, hoàn thành $2%.",
  },
  {
    pattern: /Strengths:/gi,
    replace: "Điểm mạnh:",
  },
  {
    pattern: /Weaknesses:/gi,
    replace: "Điểm cần hỗ trợ:",
  },
  {
    pattern: /Recommendations?:/gi,
    replace: "Đề xuất:",
  },
];

export function localizeUiText(value?: string | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (EXACT_TEXT_MAP[raw]) return EXACT_TEXT_MAP[raw];

  let localized = raw;
  for (const rule of REGEX_TEXT_MAP) {
    localized = localized.replace(rule.pattern, rule.replace);
  }
  return localized;
}

export function formatScalar(value?: string | number | boolean | null) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Có" : "Không";
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (SCALAR_TEXT_MAP[normalized]) return SCALAR_TEXT_MAP[normalized];
    return localizeUiText(value);
  }
  return String(value);
}

export function SectionCard({
  title,
  subtitle,
  icon,
  children,
  action,
  className,
  contentClassName,
}: {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section className={cn("rounded-3xl border border-gray-200 bg-white p-5 shadow-sm", className)}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-red-50 p-2 text-red-700">{icon}</div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
          </div>
        </div>
        {action}
      </div>
      <div className={contentClassName}>{children}</div>
    </section>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
      <div className="text-sm font-semibold text-gray-800">{title}</div>
      <div className="mt-1 text-sm text-gray-500">{description}</div>
    </div>
  );
}

export function SnapshotSummary({ snapshot }: { snapshot?: ReportsV3Snapshot | null }) {
  if (!snapshot) {
    return <EmptyState title="Chưa có snapshot" description="Báo cáo này chưa trả về snapshot chi tiết." />;
  }

  const attendance = snapshot.attendance_summary;
  const progress = snapshot.learning_progress;
  const assessment = snapshot.assessment_summary;
  const tickets = snapshot.ticket_summary;
  const evaluation = snapshot.teacher_evaluation;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Điểm danh</div>
        <div className="mt-2 text-sm text-gray-700">Tỷ lệ: <span className="font-semibold">{formatPercent(attendance?.attendance_rate)}</span></div>
        <div className="mt-1 text-sm text-gray-700">Có mặt: {formatScalar(attendance?.present)} / {formatScalar(attendance?.total_sections)}</div>
        <div className="mt-1 text-sm text-gray-700">Vắng không báo: {formatScalar(attendance?.absent_without_notice)}</div>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tiến độ học tập</div>
        <div className="mt-2 text-sm text-gray-700">Mức hoàn thành: <span className="font-semibold">{formatPercent(progress?.completion_percent)}</span></div>
        <div className="mt-1 text-sm text-gray-700">Bài học hiện tại: {formatScalar(progress?.current_lesson)}</div>
        <div className="mt-1 text-sm text-gray-700">Trạng thái học tập: {formatScalar(progress?.current_status)}</div>
        <div className="mt-1 text-sm text-gray-700">Điều kiện lên lớp: {formatScalar(progress?.promotion_status)}</div>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Đánh giá</div>
        <div className="mt-2 text-sm text-gray-700">Kết quả: <span className="font-semibold">{formatScalar(assessment?.latest_result)}</span></div>
        <div className="mt-1 text-sm text-gray-700">Điểm gần nhất: {formatScalar(assessment?.latest_score)}</div>
        <div className="mt-1 text-sm text-gray-700">Nhận xét giáo viên: {formatScalar(assessment?.teacher_comment)}</div>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Vé học</div>
        <div className="mt-2 text-sm text-gray-700">Đã cấp: {formatScalar(tickets?.granted)}</div>
        <div className="mt-1 text-sm text-gray-700">Đã dùng: {formatScalar(tickets?.consumed)}</div>
        <div className="mt-1 text-sm text-gray-700">Còn lại: <span className="font-semibold">{formatScalar(tickets?.remaining)}</span></div>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Đánh giá giáo viên</div>
        <div className="mt-2 text-sm text-gray-700">Nói: {formatScalar(evaluation?.speaking)}</div>
        <div className="mt-1 text-sm text-gray-700">Tự tin: {formatScalar(evaluation?.confidence)}</div>
        <div className="mt-1 text-sm text-gray-700">Tham gia: {formatScalar(evaluation?.participation)}</div>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Thông điệp</div>
        <div className="mt-2 text-sm text-gray-700">Gửi phụ huynh: {formatScalar(snapshot.parent_message)}</div>
        <div className="mt-1 text-sm text-gray-700">Ghi chú nội bộ: {formatScalar(snapshot.internal_notes)}</div>
      </div>
    </div>
  );
}
