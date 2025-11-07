"use client";

import { useMemo, useState } from "react";
import { ClipboardList, UploadCloud, FileText, Wand2, Send, TimerReset } from "lucide-react";

type SubmissionStatus = "PENDING" | "SUBMITTED" | "REVIEWED";

type Submission = {
  id: string;
  student: string;
  className: string;
  turnIn: string;
  file: string;
  status: SubmissionStatus;
  note?: string;
};

const SUBMISSIONS: Submission[] = [
  {
    id: "SB001",
    student: "Nguyễn Văn An",
    className: "IELTS Foundation - A1",
    turnIn: "04/12/2024 19:10",
    file: "ielts-a1-writing.docx",
    status: "PENDING",
  },
  {
    id: "SB002",
    student: "Trần Thị Bình",
    className: "IELTS Foundation - A1",
    turnIn: "04/12/2024 18:45",
    file: "ielts-speaking.mp3",
    status: "REVIEWED",
    note: "Phát âm tốt, cần bổ sung từ nối",
  },
  {
    id: "SB003",
    student: "Lê Văn Cường",
    className: "TOEIC Intermediate",
    turnIn: "03/12/2024 21:05",
    file: "toeic-grammar.pdf",
    status: "SUBMITTED",
  },
];

const STATUS: Record<SubmissionStatus, { text: string; cls: string }> = {
  PENDING: { text: "Chờ chấm", cls: "bg-amber-50 text-amber-700" },
  SUBMITTED: { text: "Đã gửi", cls: "bg-sky-50 text-sky-700" },
  REVIEWED: { text: "Đã phản hồi", cls: "bg-emerald-50 text-emerald-700" },
};

function StatusBadge({ status }: { status: SubmissionStatus }) {
  const { text, cls } = STATUS[status];
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>
      {text}
    </span>
  );
}

function SubmissionRow({ item }: { item: Submission }) {
  return (
    <div className="grid gap-4 md:grid-cols-[1.2fr,1fr,1fr,1fr,160px] items-center border-b border-slate-100 py-4">
      <div>
        <div className="font-semibold text-gray-900">{item.student}</div>
        <div className="text-xs text-slate-500">{item.className}</div>
      </div>
      <div className="text-sm text-slate-600">{item.turnIn}</div>
      <div className="text-sm text-slate-600 inline-flex items-center gap-2">
        <FileText size={16} className="text-slate-500" />
        {item.file}
      </div>
      <div className="text-sm text-slate-600">
        {item.note ? <span className="text-emerald-600">{item.note}</span> : "Chưa nhận xét"}
      </div>
      <div className="flex items-center justify-end gap-2">
        <StatusBadge status={item.status} />
        <button className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 hover:bg-slate-50">
          <UploadCloud size={18} />
        </button>
        <button className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 hover:bg-slate-50">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

export default function TeacherAssignmentsPage() {
  const [filter, setFilter] = useState<SubmissionStatus | "ALL">("PENDING");

  const filtered = useMemo(() => {
    if (filter === "ALL") return SUBMISSIONS;
    return SUBMISSIONS.filter((s) => s.status === filter);
  }, [filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Bài tập & Nộp bài</h1>
          <p className="text-sm text-slate-500">
            Quản lý bài tập đã giao, theo dõi tiến độ nộp bài và gửi nhận xét cho học viên.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          <ClipboardList size={18} /> 12 bài tập đang mở
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {["PENDING", "SUBMITTED", "REVIEWED", "ALL"].map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key as typeof filter)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              filter === key
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {key === "ALL" ? "Tất cả" : STATUS[key as SubmissionStatus].text}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="grid gap-4 md:grid-cols-[1.2fr,1fr,1fr,1fr,160px] px-5 py-3 border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <div>Học viên</div>
          <div>Thời gian nộp</div>
          <div>Tệp đính kèm</div>
          <div>Nhận xét</div>
          <div className="text-right">Trạng thái</div>
        </div>
        {filtered.map((item) => (
          <SubmissionRow key={item.id} item={item} />
        ))}
        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-slate-500">
            Không có bài nộp trong trạng thái này.
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="font-semibold text-gray-900">Giao bài tập mới</div>
          <p className="text-sm text-slate-600">
            Tạo bài tập theo lớp, đặt hạn nộp và tự động nhắc nhở qua Zalo nếu học viên chưa nộp trước giờ học.
          </p>
          <button className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
            <TimerReset size={16} /> Lên lịch nhắc nhở
          </button>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="font-semibold text-gray-900">Tạo feedback tự động</div>
          <p className="text-sm text-slate-600">
            Dùng AI để gợi ý nhận xét chi tiết dựa trên bài làm của học viên, sau đó chỉnh sửa trước khi gửi.
          </p>
          <button className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            <Wand2 size={16} /> Gợi ý từ AI
          </button>
        </div>
      </div>
    </div>
  );
}