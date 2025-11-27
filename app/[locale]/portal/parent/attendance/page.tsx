import { CalendarCheck, MessageSquare } from "lucide-react";

export default function ParentAttendancePage() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center">
          <CalendarCheck size={20} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Điểm danh & vắng mặt</h1>
          <p className="text-sm text-slate-600">Xác nhận vắng mặt, nhận thông báo chậm trễ và ghi chú từ giáo viên.</p>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/60">
        <div className="font-semibold text-slate-900">Hôm nay</div>
        <div className="text-sm text-slate-600">Học viên đã điểm danh lúc 18:55. Không có ghi chú bất thường.</div>
      </div>
      <div className="rounded-xl border border-slate-200 p-4 bg-white flex items-start gap-3">
        <MessageSquare className="text-amber-600 mt-1" size={18} />
        <div className="flex-1 text-sm text-slate-700">
          Nếu học viên vắng, hệ thống sẽ gửi tin nhắn cho phụ huynh để xác nhận lý do và hỗ trợ bù buổi.
        </div>
      </div>
    </div>
  );
}