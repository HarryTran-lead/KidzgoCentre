"use client";

const AGING = [
  { bucket: "0-30 ngày", count: 12, amount: 15200000 },
  { bucket: "31-60 ngày", count: 6, amount: 11200000 },
  { bucket: "61-90 ngày", count: 3, amount: 5600000 },
  { bucket: "90+ ngày", count: 2, amount: 3800000 },
];

export default function Page(){
  const fmt = (n:number)=> n.toLocaleString("vi-VN") + " đ";
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Công nợ</h1>
        <p className="text-slate-600 text-sm">Theo dõi nợ — nhắc hạn — phân loại tuổi nợ — kế hoạch thu</p>
      </div>

      <div className="rounded-2xl border bg-white p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr><th className="py-2">Bucket</th><th>Số HS</th><th>Giá trị</th></tr>
          </thead>
          <tbody className="align-top text-slate-900">
            {AGING.map(r=> (
              <tr key={r.bucket} className="border-t">
                <td className="py-2">{r.bucket}</td>
                <td>{r.count}</td>
                <td>{fmt(r.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <h3 className="font-semibold mb-2 text-slate-900">Kế hoạch thu</h3>
        <div className="space-y-2 text-sm text-slate-900">
          <div>- Gọi nhắc 0-30 ngày mỗi thứ 4 & thứ 7</div>
          <div>- Gửi Zalo tự động trước hạn 3 ngày</div>
          <div>- 61-90+ ngày chuyển quản lý lớp phối hợp</div>
        </div>
      </div>
    </div>
  );
}
