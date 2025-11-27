import { Bell, MessageSquare, Shield } from "lucide-react";

const notifications = [
  { title: "Báo cáo tuần 12", time: "2 giờ trước", summary: "Có phản hồi mới từ cô Phương." },
  { title: "Nhắc đóng học phí", time: "Hôm qua", summary: "Còn 500.000 ₫, hạn 15/01/2025." },
];

export default function ParentNotificationsPage() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 grid place-items-center">
          <Bell size={20} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Thông báo</h1>
          <p className="text-sm text-slate-600">Nhận cập nhật quan trọng về học tập và tài chính của học viên.</p>
        </div>
      </div>
      <div className="space-y-3">
        {notifications.map((item, idx) => (
          <div key={idx} className="rounded-xl border border-slate-200 p-4 bg-slate-50/60">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-slate-900">{item.title}</div>
                <div className="text-sm text-slate-600">{item.summary}</div>
              </div>
              <span className="text-xs text-slate-500">{item.time}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-slate-200 p-4 bg-white flex items-start gap-3">
        <Shield className="text-amber-600 mt-1" size={18} />
        <div className="flex-1 text-sm text-slate-700">
          Bảo mật: thông báo quan trọng chỉ hiển thị sau khi phụ huynh nhập đúng mã PIN.
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 p-4 bg-white flex items-start gap-3">
        <MessageSquare className="text-indigo-600 mt-1" size={18} />
        <div className="flex-1 text-sm text-slate-700">
          Có thể phản hồi trực tiếp để đặt lịch gặp giáo viên hoặc yêu cầu hỗ trợ thêm.
        </div>
      </div>
    </div>
  );
}