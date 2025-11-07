"use client";

const LEADS = [
  { id:"L-001", name:"Phạm Gia Huy", phone:"0903 111 222", source:"Web form", owner:"NV. Lan", status:"Mới", next:"Hẹn gọi 10/10 14:00" },
  { id:"L-002", name:"Ngô Khánh An", phone:"0907 333 444", source:"Fanpage", owner:"NV. Hoa", status:"Đang tư vấn", next:"Demo buổi 12/10" },
];

export default function Page(){
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Lead / CRM nhẹ</h1>
          <p className="text-slate-600 text-sm">Nhận form, phân công, cập nhật trạng thái, convert → đăng ký/lớp</p>
        </div>
        <button className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm">Nhập lead</button>
      </div>

      <div className="rounded-2xl border bg-white p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr><th className="py-2">Mã</th><th>Họ tên</th><th>SĐT</th><th>Nguồn</th><th>Phụ trách</th><th>Trạng thái</th><th>Tiếp theo</th><th></th></tr>
          </thead>
          <tbody className="align-top text-slate-900">
            {LEADS.map(r=> (
              <tr key={r.id} className="border-t">
                <td className="py-2">{r.id}</td>
                <td>{r.name}</td>
                <td>{r.phone}</td>
                <td>{r.source}</td>
                <td>{r.owner}</td>
                <td><span className={`px-2 py-1 rounded-lg text-xs ${r.status==="Mới"?"bg-amber-100 text-amber-700":"bg-blue-100 text-blue-700"}`}>{r.status}</span></td>
                <td>{r.next}</td>
                <td className="text-right space-x-2">
                  <button className="px-2 py-1 text-sm rounded-lg border">Phân công</button>
                  <button className="px-2 py-1 text-sm rounded-lg border">Convert</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
