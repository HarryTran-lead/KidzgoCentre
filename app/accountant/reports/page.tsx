"use client";

type Row = { period: string; revenue: number; byCash: number; byBank: number; dues: number };
const DATA: Row[] = [
  { period: "08/2025", revenue: 182000000, byCash: 42000000, byBank: 140000000, dues: 12000000 },
  { period: "09/2025", revenue: 205000000, byCash: 39000000, byBank: 166000000, dues: 9500000 },
  { period: "10/2025", revenue: 219500000, byCash: 36000000, byBank: 183500000, dues: 7200000 },
];

export default function Page(){
  const fmt = (n:number)=> n.toLocaleString("vi-VN");
  const exportCSV = ()=>{
    const header = "Kỳ,Doanh thu,Tiền mặt,Chuyển khoản,Công nợ\n";
    const body = DATA.map(r=>[r.period, r.revenue, r.byCash, r.byBank, r.dues].join(",")).join("\n");
    const blob = new Blob([header+body], {type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "baocao-taichinh.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Báo cáo tài chính</h1>
          <p className="text-slate-600 text-sm">Doanh thu theo kỳ / phương thức thu / tuổi nợ</p>
        </div>
        <button onClick={exportCSV} className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm">Export CSV</button>
      </div>

      <div className="rounded-2xl border bg-white p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr><th className="py-2">Kỳ</th><th>Doanh thu</th><th>Tiền mặt</th><th>Chuyển khoản</th><th>Công nợ</th></tr>
          </thead>
          <tbody className="align-top text-slate-900">
            {DATA.map(r=> (
              <tr key={r.period} className="border-t">
                <td className="py-2">{r.period}</td>
                <td>{fmt(r.revenue)} đ</td>
                <td>{fmt(r.byCash)} đ</td>
                <td>{fmt(r.byBank)} đ</td>
                <td>{fmt(r.dues)} đ</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
