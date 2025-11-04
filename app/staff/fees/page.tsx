"use client";
import { Check, X } from "lucide-react";

const DUES = [
  { id: "INV1001", student: "Trần Gia Bảo", course: "N5", amount: 2500000, due: "15/10/2025" },
  { id: "INV1002", student: "Phạm Thuỳ Linh", course: "IELTS A1", amount: 1500000, due: "18/10/2025" },
];

const PAID = [
  { id: "RCPT889", student: "Hoàng Hữu Tín", course: "TOEIC", amount: 1000000, method: "Chuyển khoản" },
];

export default function StaffFees() {
  const fmt = (n: number) => n.toLocaleString("vi-VN") + " đ";
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Học phí & đối soát</h1>
        <p className="text-slate-500 text-sm">Quản lý công nợ, ghi nhận thanh toán</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border bg-white p-4">
          <h3 className="font-semibold mb-2">Khoản nợ</h3>
          <div className="space-y-2">
            {DUES.map((i) => (
              <div key={i.id} className="p-3 rounded-xl border flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-900">{i.student} • {i.course}</div>
                  <div className="text-xs text-slate-500">Hạn: {i.due}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-slate-900">{fmt(i.amount)}</div>
                  <button className="px-2 py-1 rounded-lg border text-green-700 inline-flex items-center gap-1">
                    <Check size={14} /> Ghi nhận
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <h3 className="font-semibold mb-2">Thanh toán gần đây</h3>
          <div className="space-y-2">
            {PAID.map((r) => (
              <div key={r.id} className="p-3 rounded-xl border flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-900">{r.student} • {r.course}</div>
                  <div className="text-xs text-slate-500">{r.method}</div>
                </div>
                <div className="font-semibold text-slate-900">{fmt(r.amount)}</div>
              </div>
            ))}
          </div>
          <button className="mt-3 px-3 py-2 rounded-xl bg-slate-900 text-white text-sm">Xuất phiếu đối soát</button>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <h3 className="font-semibold mb-2">Hoàn tiền / Điều chỉnh</h3>
        <div className="flex gap-2">
          <input className="border rounded-xl px-3 py-2 bg-slate-50" placeholder="Mã hoá đơn / biên lai" />
          <input className="border rounded-xl px-3 py-2 bg-slate-50" placeholder="Số tiền hoàn/điều chỉnh" />
          <button className="px-3 py-2 rounded-xl border text-red-600 inline-flex items-center gap-1">
            <X size={14}/> Thực hiện
          </button>
        </div>
      </div>
    </div>
  );
}
