"use client";
import { useState } from "react";
import { QrCode, Link2, RefreshCcw } from "lucide-react";

const TX = [
  { id: "TX-2941", student: "Nguyễn Văn A", amount: 2500000, status: "Khớp", method: "PayOS-QR" },
  { id: "TX-2942", student: "Trần Thị B", amount: 1800000, status: "Sai lệch", method: "PayOS-QR" },
];

export default function Page(){
  const [amount, setAmount] = useState(2500000);
  const fmt = (n:number)=> n.toLocaleString("vi-VN") + " đ";

  const copyLink = () => {
    navigator.clipboard.writeText(`payos://dynamic-qr?amount=${amount}`);
    alert("Đã copy liên kết QR động (giả lập)!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Thanh toán PayOS</h1>
        <p className="text-slate-600 text-sm">Tạo QR động, nhận webhook, đối soát giao dịch</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border bg-white p-4">
          <h3 className="font-semibold mb-2 text-slate-900">Tạo QR động</h3>
          <div className="flex items-center gap-2">
            <input value={amount} onChange={e=>setAmount(Number(e.target.value)||0)} className="border rounded-xl px-3 py-2 bg-slate-50 w-48" />
            <button onClick={copyLink} className="px-3 py-2 rounded-xl border inline-flex items-center gap-2"><Link2 size={16}/> Copy link</button>
          </div>
          <div className="mt-4 rounded-xl border bg-slate-50 p-6 text-center">
            <QrCode className="mx-auto mb-2" />
            <div className="text-sm text-slate-600">QR Xem trước (giả lập) — số tiền: <b className="text-slate-900">{fmt(amount)}</b></div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-slate-900">Webhook & đối soát</h3>
            <button className="px-3 py-2 rounded-xl border inline-flex items-center gap-2"><RefreshCcw size={16}/> Đồng bộ</button>
          </div>
          <div className="space-y-2">
            {TX.map(t => (
              <div key={t.id} className="p-3 rounded-xl border flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-900">{t.id} • {t.student}</div>
                  <div className="text-xs text-slate-500">{t.method}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-semibold text-slate-900">{fmt(t.amount)}</div>
                  <span className={`px-2 py-1 rounded-lg text-xs ${t.status==="Khớp"?"bg-green-100 text-green-700":"bg-amber-100 text-amber-700"}`}>{t.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
