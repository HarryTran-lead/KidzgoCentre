"use client";
import { useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export default function Page(){
  const [code, setCode] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState("");

  const doAdjust = ()=> alert(`Thực hiện bút toán cho ${code} số tiền ${amount.toLocaleString("vi-VN")} đ\nGhi chú: ${note}`);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Điều chỉnh / Hoàn tiền</h1>
        <p className="text-slate-600 text-sm">Ghi giảm, hoàn tiền, bút toán điều chỉnh</p>
      </div>

      <div className="rounded-2xl border bg-white p-4 space-y-3">
        <div className="grid md:grid-cols-3 gap-3">
          <input value={code} onChange={e=>setCode(e.target.value)} className="border rounded-xl px-3 py-2 bg-slate-50" placeholder="Mã hóa đơn / biên lai"/>
          <input value={amount} onChange={e=>setAmount(Number(e.target.value)||0)} className="border rounded-xl px-3 py-2 bg-slate-50" placeholder="Số tiền (+/-)"/>
          <select className="border rounded-xl px-3 py-2 bg-slate-50">
            <option>Loại: Điều chỉnh</option>
            <option>Loại: Hoàn tiền</option>
          </select>
        </div>
        <textarea value={note} onChange={e=>setNote(e.target.value)} rows={4} className="w-full border rounded-xl px-3 py-2 bg-slate-50" placeholder="Ghi chú..." />
        <div className="flex gap-2">
          <button onClick={doAdjust} className="px-3 py-2 rounded-xl border inline-flex items-center gap-2">
            <ArrowDownRight size={16}/> Ghi giảm
          </button>
          <button onClick={doAdjust} className="px-3 py-2 rounded-xl bg-slate-900 text-white inline-flex items-center gap-2">
            <ArrowUpRight size={16}/> Hoàn tiền
          </button>
        </div>
      </div>
    </div>
  );
}
