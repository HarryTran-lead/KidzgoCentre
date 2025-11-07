"use client";
import { useState } from "react";
import { FilePlus2, ReceiptText } from "lucide-react";

const MOCK = [
  { id: "INV-10542", student: "Nguyễn Văn A", course: "IELTS A1", amount: 2500000, period: "10/2025", status: "Đã phát hành" },
  { id: "INV-10543", student: "Trần Thị B", course: "TOEIC", amount: 1800000, period: "10/2025", status: "Chờ phát hành" },
];

export default function Page(){
  const [list, setList] = useState(MOCK);
  const fmt = (n:number)=> n.toLocaleString("vi-VN") + " đ";

  const issue = (id:string)=> setList(prev => prev.map(x => x.id===id ? {...x, status: "Đã phát hành"} : x));
  const exportReceipt = (id:string)=>{
    const blob = new Blob([`BIEN LAI: ${id}`], {type:"application/pdf"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `receipt-${id}.pdf`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Hóa đơn & phiếu thu</h1>
          <p className="text-slate-600 text-sm">Lập — phát hành — xuất biên lai PDF</p>
        </div>
        <button className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm inline-flex items-center gap-2">
          <FilePlus2 size={16}/> Hóa đơn mới
        </button>
      </div>

      <div className="rounded-2xl border bg-white p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr><th className="py-2">Mã</th><th>Học viên</th><th>Khoá</th><th>Kỳ</th><th>Số tiền</th><th>Trạng thái</th><th></th></tr>
          </thead>
          <tbody className="align-top text-slate-900">
            {list.map(r=> (
              <tr key={r.id} className="border-t">
                <td className="py-2">{r.id}</td>
                <td>{r.student}</td>
                <td>{r.course}</td>
                <td>{r.period}</td>
                <td>{fmt(r.amount)}</td>
                <td><span className={`px-2 py-1 rounded-lg text-xs ${r.status==="Đã phát hành"?"bg-green-100 text-green-700":"bg-amber-100 text-amber-700"}`}>{r.status}</span></td>
                <td className="text-right space-x-2">
                  {r.status!=="Đã phát hành" && <button onClick={()=>issue(r.id)} className="px-2 py-1 text-sm rounded-lg border">Phát hành</button>}
                  <button onClick={()=>exportReceipt(r.id)} className="px-2 py-1 text-sm rounded-lg border inline-flex items-center gap-1">
                    <ReceiptText size={14}/> Biên lai
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
