"use client";

const HS = [
  { id:"ST001", name:"Nguyễn Văn A", cls:"IELTS A1", makeup:2, notes:"PH thích liên hệ Zalo" },
  { id:"ST002", name:"Trần Thị B", cls:"TOEIC", makeup:0, notes:"Cần nhắc bài tối T5" },
];

export default function Page(){
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Hồ sơ học sinh</h1>
        <p className="text-slate-600 text-sm">Lớp, lịch sử bù, ghi chú liên hệ</p>
      </div>

      <div className="rounded-2xl border bg-white p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr><th className="py-2">Mã</th><th>Họ tên</th><th>Lớp</th><th>Make-up đã dùng</th><th>Ghi chú</th><th></th></tr>
          </thead>
          <tbody className="align-top text-slate-900">
            {HS.map(r=> (
              <tr key={r.id} className="border-t">
                <td className="py-2">{r.id}</td>
                <td>{r.name}</td>
                <td>{r.cls}</td>
                <td>{r.makeup}</td>
                <td>{r.notes}</td>
                <td className="text-right"><button className="px-2 py-1 text-sm rounded-lg border">Cập nhật</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
