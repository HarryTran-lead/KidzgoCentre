"use client";

import { useMemo, useState } from "react";
import { Search, CheckCircle2, Download, Send, MessageSquare } from "lucide-react";

type Status = "PENDING" | "APPROVED" | "REJECTED";

type FeedbackReport = {
  id: string;
  className: string;
  month: string;
  teacher: string;
  totalStudents: number;
  status: Status;
  updatedAt: string;
};

const REPORTS: FeedbackReport[] = [
  {
    id: "FB001",
    className: "IELTS Foundation - A1",
    month: "12/2024",
    teacher: "Cô Phương",
    totalStudents: 18,
    status: "PENDING",
    updatedAt: "05/12/2024 09:00",
  },
  {
    id: "FB002",
    className: "TOEIC Intermediate",
    month: "12/2024",
    teacher: "Thầy Minh",
    totalStudents: 15,
    status: "APPROVED",
    updatedAt: "04/12/2024 21:30",
  },
  {
    id: "FB003",
    className: "Kỹ năng sống cuối tuần",
    month: "11/2024",
    teacher: "Cô Lan",
    totalStudents: 12,
    status: "APPROVED",
    updatedAt: "28/11/2024 16:20",
  },
];

const STATUS_INFO: Record<Status, { text: string; cls: string }> = {
  PENDING: { text: "Chờ duyệt", cls: "bg-amber-50 text-amber-700" },
  APPROVED: { text: "Đã duyệt", cls: "bg-emerald-50 text-emerald-700" },
  REJECTED: { text: "Yêu cầu bổ sung", cls: "bg-rose-50 text-rose-700" },
};

function StatusBadge({ status }: { status: Status }) {
  const { text, cls } = STATUS_INFO[status];
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>{text}</span>;
}

export default function AdminFeedbackPage() {
  const [status, setStatus] = useState<Status | "ALL">("ALL");

  const list = useMemo(() => {
    if (status === "ALL") return REPORTS;
    return REPORTS.filter((item) => item.status === status);
  }, [status]);

  return (
    <div className="space-y-6 text-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Feedback lớp học</h1>
          <p className="text-sm text-slate-500">
            Duyệt báo cáo từng lớp trước khi gửi phụ huynh, đồng bộ file qua Zalo sau khi hoàn tất.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
          <MessageSquare size={16} className="text-slate-500" /> 35 phản hồi chờ xử lý
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
          {["ALL", "PENDING", "APPROVED", "REJECTED"].map((item) => (
            <button
              key={item}
              onClick={() => setStatus(item as typeof status)}
              className={`px-3 py-1.5 text-sm font-semibold rounded-lg ${
                status === item ? "bg-slate-900 text-white" : "text-slate-600"
              }`}
            >
              {item === "ALL" ? "Tất cả" : STATUS_INFO[item as Status].text}
            </button>
          ))}
        </div>
        <div className="relative">
          <input
            placeholder="Tìm theo lớp hoặc giáo viên"
            className="h-10 w-72 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm placeholder-slate-400 focus:outline-none"
          />
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="grid grid-cols-[1.3fr,1fr,1fr,1fr,160px] gap-4 border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <div>Lớp học</div>
          <div>Tháng</div>
          <div>Giáo viên</div>
          <div>Học viên</div>
          <div className="text-right">Trạng thái</div>
        </div>
        {list.map((item) => (
          <div key={item.id} className="grid grid-cols-[1.3fr,1fr,1fr,1fr,160px] items-center gap-4 border-b border-slate-100 px-5 py-4">
            <div>
              <div className="font-semibold">{item.className}</div>
              <div className="text-xs text-slate-500">{item.id}</div>
            </div>
            <div className="text-sm text-slate-600">{item.month}</div>
            <div className="text-sm text-slate-600">{item.teacher}</div>
            <div className="text-sm text-slate-600">{item.totalStudents}</div>
            <div className="flex items-center justify-end gap-2">
              <StatusBadge status={item.status} />
              <button className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 hover:bg-slate-50">
                <CheckCircle2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="font-semibold text-gray-900">Tải file tổng hợp</div>
          <p className="text-sm text-slate-600">
            Xuất báo cáo cho từng học viên để gửi phụ huynh qua Zalo, hệ thống tự động đóng dấu trung tâm.
          </p>
          <button className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
            <Download size={16} /> Xuất Excel
          </button>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="font-semibold text-gray-900">Thông báo sau khi duyệt</div>
          <p className="text-sm text-slate-600">
            Gửi thông báo đến phụ huynh qua app và Zalo ngay khi báo cáo được phê duyệt.
          </p>
          <button className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            <Send size={16} /> Gửi thông báo
          </button>
        </div>
      </div>
    </div>
  );
}