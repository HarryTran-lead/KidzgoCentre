import { ShieldCheck, FileText, CheckCircle2 } from "lucide-react";

const approvals = [
  { title: "Xác nhận học phí kỳ 1", desc: "500.000 ₫ còn lại • Hạn 15/01/2025" },
  { title: "Duyệt báo cáo tuần 12", desc: "Xác nhận đã xem phản hồi của giáo viên" },
];

export default function ParentApprovalsPage() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 grid place-items-center">
          <ShieldCheck size={20} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Phê duyệt & xác nhận</h1>
          <p className="text-sm text-slate-600">Quản lý các yêu cầu cần phụ huynh xác nhận để bảo vệ thông tin học viên.</p>
        </div>
      </div>
      <div className="space-y-3">
        {approvals.map((item, idx) => (
          <div key={idx} className="rounded-xl border border-slate-200 p-4 bg-slate-50/60 flex items-start gap-3">
            <FileText className="text-amber-600 mt-1" size={18} />
            <div className="flex-1">
              <div className="font-semibold text-slate-900">{item.title}</div>
              <div className="text-sm text-slate-600">{item.desc}</div>
              <button className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-amber-700">
                Xác nhận <CheckCircle2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}