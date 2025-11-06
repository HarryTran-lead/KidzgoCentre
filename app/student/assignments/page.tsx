"use client";

import { useMemo, useState } from "react";
import {
  BookOpenCheck,
  UploadCloud,
  MessageSquareMore,
  Paperclip,
  ChevronRight,
  AlarmClockCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
} from "lucide-react";

type AssignmentStatus = "PENDING" | "SUBMITTED" | "LATE";

type Assignment = {
  id: string;
  subject: string;
  title: string;
  description: string;
  deadline: string;
  status: AssignmentStatus;
  submittedAt?: string;
  attachment?: string;
};

const ASSIGNMENTS: Assignment[] = [
  {
    id: "A-2024-12-01",
    subject: "Tiếng Anh",
    title: "Viết đoạn văn về gia đình",
    description:
      "Hoàn thành đoạn văn 200 từ giới thiệu về gia đình. Chú ý sử dụng thì hiện tại đơn và quá khứ đơn.",
    deadline: "15/12/2024 21:00",
    status: "PENDING",
  },
  {
    id: "A-2024-11-30",
    subject: "Tiếng Anh",
    title: "Bài tập ngữ pháp Unit 5",
    description:
      "Làm trọn bộ bài tập Unit 5 trong giáo trình A1. Đính kèm ảnh hoặc file PDF khi nộp.",
    deadline: "05/12/2024 20:00",
    status: "SUBMITTED",
    submittedAt: "04/12/2024 19:10",
    attachment: "unit5-nguvan-an.pdf",
  },
  {
    id: "A-2024-11-20",
    subject: "Kỹ năng",
    title: "Ghi âm luyện phát âm",
    description:
      "Thu âm 5 đoạn hội thoại đã học và tải file mp3 lên để giáo viên nhận xét.",
    deadline: "28/11/2024 22:00",
    status: "LATE",
  },
];

const STATUS_LABEL: Record<AssignmentStatus, { text: string; cls: string }> = {
  PENDING: {
    text: "Chưa nộp",
    cls: "bg-amber-50 text-amber-700",
  },
  SUBMITTED: {
    text: "Đã nộp",
    cls: "bg-emerald-50 text-emerald-700",
  },
  LATE: {
    text: "Quá hạn",
    cls: "bg-rose-50 text-rose-700",
  },
};

function StatusBadge({ status }: { status: AssignmentStatus }) {
  const { text, cls } = STATUS_LABEL[status];
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>
      {text}
    </span>
  );
}

function AssignmentCard({ item }: { item: Assignment }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase text-slate-400">{item.subject}</div>
          <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
        </div>
        <StatusBadge status={item.status} />
      </div>

      <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>

      <div className="grid md:grid-cols-3 gap-3 text-sm text-slate-600">
        <div className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
          <AlarmClockCheck size={16} className="text-slate-500" />
          Hạn nộp: {item.deadline}
        </div>
        {item.status === "SUBMITTED" && item.submittedAt ? (
          <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-emerald-700">
            <CheckCircle2 size={16} /> Đã nộp: {item.submittedAt}
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
            <Clock size={16} className="text-slate-500" />
            Trạng thái: {STATUS_LABEL[item.status].text}
          </div>
        )}
        {item.attachment ? (
          <div className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
            <Paperclip size={16} className="text-slate-500" />
            {item.attachment}
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-slate-500">
            <Paperclip size={16} /> Chưa có tệp đính kèm
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50">
          <UploadCloud size={16} /> Nộp bài
        </button>
        <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50">
          <MessageSquareMore size={16} /> Trao đổi với giáo viên
        </button>
        <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50">
          <ChevronRight size={16} /> Xem hướng dẫn chi tiết
        </button>
      </div>
    </div>
  );
}

export default function AssignmentsPage() {
  const [filter, setFilter] = useState<AssignmentStatus | "ALL">("ALL");

  const list = useMemo(() => {
    if (filter === "ALL") return ASSIGNMENTS;
    return ASSIGNMENTS.filter((a) => a.status === filter);
  }, [filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Bài tập & Nộp bài</h1>
          <p className="text-sm text-slate-600">
            Theo dõi các bài tập được giao và tiến độ nộp bài của bạn.
          </p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-200 px-4 py-2 text-sm text-slate-600 inline-flex items-center gap-2">
          <BookOpenCheck size={18} className="text-slate-500" />
          3 bài tập đang theo dõi
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {["ALL", "PENDING", "SUBMITTED", "LATE"].map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key as typeof filter)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              filter === key
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {key === "ALL"
              ? "Tất cả"
              : STATUS_LABEL[key as AssignmentStatus].text}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {list.map((item) => (
          <AssignmentCard key={item.id} item={item} />
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-sky-50 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="font-semibold text-sky-900">Hỗ trợ nộp bài nhanh qua Zalo</div>
          <p className="text-sm text-sky-800">
            Nếu chưa đến lớp, hệ thống sẽ tự động gửi nhắc nhở và đường dẫn nộp bài qua Zalo cho phụ huynh.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
          <CalendarDays size={16} /> Kết nối Zalo phụ huynh
        </button>
      </div>
    </div>
  );
}