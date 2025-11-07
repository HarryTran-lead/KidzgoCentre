"use client";

import { useMemo, useState } from "react";
import { Search, PhoneCall, CalendarDays, Mail, MessageCircle, Clock } from "lucide-react";

type Status = "NEW" | "CONTACTED" | "ENROLLED" | "LOST";

type Lead = {
  id: string;
  parentName: string;
  studentName: string;
  course: string;
  createdAt: string;
  status: Status;
  note?: string;
};

const LEADS: Lead[] = [
  {
    id: "LD001",
    parentName: "Nguyễn Thị Thu",
    studentName: "Nguyễn Gia Hân",
    course: "Tiếng Anh thiếu nhi",
    createdAt: "05/12/2024 09:15",
    status: "NEW",
  },
  {
    id: "LD002",
    parentName: "Trần Văn Long",
    studentName: "Trần Gia Bảo",
    course: "STEAM cuối tuần",
    createdAt: "04/12/2024 14:20",
    status: "CONTACTED",
    note: "Đã gọi, hẹn tư vấn tại trung tâm",
  },
  {
    id: "LD003",
    parentName: "Phạm Hồng Ngọc",
    studentName: "Phạm Quỳnh Mai",
    course: "Trại hè 2025",
    createdAt: "01/12/2024 16:00",
    status: "ENROLLED",
    note: "Đã đóng cọc 2.000.000đ",
  },
];

const STATUS_INFO: Record<Status, { text: string; cls: string }> = {
  NEW: { text: "Mới", cls: "bg-amber-50 text-amber-700" },
  CONTACTED: { text: "Đã liên hệ", cls: "bg-sky-50 text-sky-700" },
  ENROLLED: { text: "Đăng ký", cls: "bg-emerald-50 text-emerald-700" },
  LOST: { text: "Không tham gia", cls: "bg-rose-50 text-rose-700" },
};

function StatusBadge({ status }: { status: Status }) {
  const { text, cls } = STATUS_INFO[status];
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>{text}</span>;
}

export default function LeadsPage() {
  const [status, setStatus] = useState<Status | "ALL">("ALL");

  const list = useMemo(() => {
    if (status === "ALL") return LEADS;
    return LEADS.filter((lead) => lead.status === status);
  }, [status]);

  return (
    <div className="space-y-6 text-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Form đăng ký khách hàng</h1>
          <p className="text-sm text-slate-500">
            Theo dõi lịch sử liên hệ, phân công tư vấn và cập nhật kết quả chuyển đổi.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
          <Clock size={16} className="text-slate-400" /> Cập nhật cuối: 10 phút trước
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
          {["ALL", "NEW", "CONTACTED", "ENROLLED", "LOST"].map((item) => (
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
            placeholder="Tìm theo phụ huynh hoặc khóa học"
            className="h-10 w-72 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm placeholder-slate-400 focus:outline-none"
          />
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="grid grid-cols-[1.4fr,1.4fr,1fr,1fr,160px] gap-4 border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <div>Phụ huynh</div>
          <div>Học viên</div>
          <div>Khóa quan tâm</div>
          <div>Thời gian</div>
          <div className="text-right">Trạng thái</div>
        </div>
        {list.map((lead) => (
          <div key={lead.id} className="grid grid-cols-[1.4fr,1.4fr,1fr,1fr,160px] items-center gap-4 border-b border-slate-100 px-5 py-4">
            <div>
              <div className="font-semibold">{lead.parentName}</div>
              <div className="text-xs text-slate-500">{lead.id}</div>
            </div>
            <div className="text-sm text-slate-600">{lead.studentName}</div>
            <div className="text-sm text-slate-600">{lead.course}</div>
            <div className="text-sm text-slate-600">{lead.createdAt}</div>
            <div className="flex items-center justify-end gap-2">
              <StatusBadge status={lead.status} />
              <button className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 hover:bg-slate-50">
                <MessageCircle size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">Liên hệ qua điện thoại</div>
          <div className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
            <PhoneCall size={16} /> 5 cuộc gọi hôm nay
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">Lịch hẹn tư vấn</div>
          <div className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
            <CalendarDays size={16} /> 3 cuộc hẹn tuần này
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">Email tự động</div>
          <div className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
            <Mail size={16} /> 12 email nhắc học phí
          </div>
        </div>
      </div>
    </div>
  );
}