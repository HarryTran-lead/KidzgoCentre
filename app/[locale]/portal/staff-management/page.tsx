"use client";

import {
  Bell,
  BookOpenCheck,
  CalendarRange,
  ClipboardCheck,
  ClipboardList,
  MessageSquare,
  NotebookPen,
  School,
  Users,
} from "lucide-react";

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: any;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-slate-100 grid place-items-center">
          <Icon size={18} className="text-slate-700" />
        </div>
        <div className="text-sm text-slate-500">{label}</div>
      </div>
      <div className="mt-2 text-2xl font-extrabold text-slate-900">{value}</div>
      {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
    </div>
  );
}

const workflowCards = [
  {
    icon: Users,
    title: "Lead & ghi danh",
    items: [
      "Theo dõi lead mới, phân công tư vấn",
      "Lên lịch placement test và nhập kết quả",
      "Chốt ghi danh, tạo hồ sơ học viên",
    ],
  },
  {
    icon: CalendarRange,
    title: "Xếp lớp & TKB",
    items: [
      "Tạo lớp, gán giáo viên chính/TA",
      "Kiểm tra xung đột phòng, lịch học",
      "Hỗ trợ mô hình đa lớp và lớp bổ trợ",
    ],
  },
  {
    icon: ClipboardCheck,
    title: "Học bù & MakeUpCredit",
    items: [
      "Duyệt đơn nghỉ dưới 24h và nghỉ dài",
      "Theo dõi MakeUpCredit theo từng học viên",
      "Gợi ý buổi bù phù hợp cho phụ huynh",
    ],
  },
  {
    icon: BookOpenCheck,
    title: "Giáo án & chất lượng",
    items: [
      "Quản lý thư viện giáo án khung",
      "Giám sát giáo viên nộp giáo án thực tế",
      "Kiểm soát nội dung dạy chuẩn hóa",
    ],
  },
  {
    icon: NotebookPen,
    title: "Báo cáo tháng (AI)",
    items: [
      "Theo dõi tiến độ giáo viên chỉnh sửa",
      "Bình luận/nhắc nhở ngay trên bản nháp",
      "Trình duyệt trước khi publish cho phụ huynh",
    ],
  },
  {
    icon: MessageSquare,
    title: "Hồ sơ & giao tiếp",
    items: [
      "Xem lịch sử học viên và ghi chú đặc biệt",
      "Gửi thông báo broadcast qua Zalo OA",
      "Theo dõi phản hồi phụ huynh/học viên",
    ],
  },
];

const reminders = [
  "Xử lý 6 lead mới chưa được phân công",
  "Duyệt 3 đơn nghỉ dưới 24h",
  "Hoàn tất xếp lớp bổ trợ kỹ năng Speaking",
  "Nhắc 5 giáo viên nộp báo cáo tháng",
];

const tickets = [
  {
    title: "Yêu cầu đổi lịch học",
    detail: "Phụ huynh lớp Cambridge Movers B",
  },
  {
    title: "Hỏi về MakeUpCredit",
    detail: "HS Nguyễn Minh Anh (K9)",
  },
  {
    title: "Xin tư vấn lớp phù hợp",
    detail: "Lead mới: Zalo OA",
  },
];

const quickActions = [
  "Tạo lead mới",
  "Xếp lớp học viên",
  "Duyệt đơn nghỉ",
  "Tạo giáo án khung",
  "Nhắc báo cáo tháng",
  "Duyệt ticket hỗ trợ",
  "Gửi thông báo broadcast",
  "Duyệt media lớp học",
  "Gửi thông báo Zalo",
];

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">
          Vận hành & học vụ
        </h1>
        <p className="text-slate-600 text-sm">
          Lead, xếp lớp, học bù, báo cáo tháng và giao tiếp phụ huynh
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Stat
          icon={Users}
          label="Lead mới (tuần)"
          value="37"
          hint="+9 so với tuần trước"
        />
        <Stat
          icon={CalendarRange}
          label="Lớp & ca tuần này"
          value="124"
          hint="Xung đột: 2"
        />
        <Stat
          icon={NotebookPen}
          label="Báo cáo tháng"
          value="18 bản nháp"
          hint="Còn chờ 6 giáo viên"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border bg-white p-4">
          <div className="flex items-center gap-2 text-slate-900 font-semibold mb-3">
            <School size={18} />
            Quy trình vận hành chính
          </div>
          <p className="text-sm text-slate-600">
            Tổng hợp các module cần theo dõi mỗi ngày cho staff vận hành.
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
            {quickActions.map((action) => (
              <span
                key={action}
                className="rounded-full border border-slate-200 px-3 py-1"
              >
                {action}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <div className="flex items-center gap-2 text-slate-900 font-semibold mb-3">
            <ClipboardCheck size={18} />
            Checklist hôm nay
          </div>
          <ul className="text-sm text-slate-900 list-disc pl-5 space-y-1">
            {reminders.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <div className="flex items-center gap-2 text-slate-900 font-semibold mb-3">
            <Bell size={18} />
            Ticket & hỗ trợ
          </div>
          <ul className="space-y-2 text-sm text-slate-900">
            {tickets.map((ticket) => (
              <li key={ticket.title} className="border rounded-xl p-3">
                <div className="font-semibold">{ticket.title}</div>
                <div className="text-xs text-slate-500">{ticket.detail}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="flex items-center gap-2 text-slate-900 font-semibold mb-2">
          <ClipboardList size={18} />
          Tóm tắt tiến độ
        </div>
        <div className="grid md:grid-cols-3 gap-3 text-sm">
          <div className="rounded-xl border border-slate-200 p-3">
            <div className="text-slate-500">Placement test tuần này</div>
            <div className="text-xl font-semibold text-slate-900">12 lịch</div>
            <div className="text-xs text-slate-500">Còn 3 lịch cần xác nhận</div>
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <div className="text-slate-500">Đơn nghỉ chờ duyệt</div>
            <div className="text-xl font-semibold text-slate-900">5 đơn</div>
            <div className="text-xs text-slate-500">2 đơn dưới 24h</div>
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <div className="text-slate-500">Thông báo chờ gửi</div>
            <div className="text-xl font-semibold text-slate-900">8 bản</div>
            <div className="text-xs text-slate-500">Zalo OA + Email</div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-3">
          Module cần thao tác
        </h3>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {workflowCards.map((card) => (
            <div key={card.title} className="rounded-2xl border bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 grid place-items-center">
                  <card.icon size={18} className="text-slate-700" />
                </div>
                <div className="font-semibold text-slate-900">{card.title}</div>
              </div>
              <ul className="mt-3 text-sm text-slate-700 list-disc pl-5 space-y-1">
                {card.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
