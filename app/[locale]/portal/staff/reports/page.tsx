"use client";

type Row = { month: string; hours: number; revenue: number; dues: number };
const DATA: Row[] = [
  { month: "T1/2025", hours: 64, revenue: 19200000, dues: 3000000 },
  { month: "T2/2025", hours: 68, revenue: 20400000, dues: 2500000 },
  { month: "T3/2025", hours: 72, revenue: 21600000, dues: 1800000 },
];

export default function StaffReports() {
  const fmt = (n: number) => n.toLocaleString("vi-VN");

  const exportCSV = () => {
    const header = "Tháng,Giờ công,Doanh thu,Công nợ\n";
    const body = DATA.map(r => [r.month, r.hours, r.revenue, r.dues].join(",")).join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "baocao-staff.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Báo cáo</h1>
          <p className="text-slate-500 text-sm">Xuất dữ liệu cơ bản (CSV)</p>
        </div>
        <button onClick={exportCSV} className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm">
          Xuất CSV
        </button>
      </div>

      <div className="rounded-2xl border bg-white p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-2">Tháng</th>
              <th>Giờ công</th>
              <th>Doanh thu</th>
              <th>Công nợ</th>
            </tr>
          </thead>
          <tbody className="align-top text-slate-900">
            {DATA.map((r) => (
              <tr key={r.month} className="border-t">
                <td className="py-2">{r.month}</td>
                <td>{r.hours}</td>
                <td>{fmt(r.revenue)} đ</td>
                <td>{fmt(r.dues)} đ</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
