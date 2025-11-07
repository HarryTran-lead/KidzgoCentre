"use client";

const ACCS = [
  { id: "U1001", name: "Nguyễn Văn A", role: "STUDENT", phone:"0901 234 567", status:"Active" },
  { id: "U1002", name: "Trần Thị B", role: "PARENT",  phone:"0909 888 111", status:"Active" },
  { id: "U2001", name: "Lê Minh",    role: "TEACHER", phone:"0912 555 777", status:"Active" },
];

export default function Page(){
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Quản lý tài khoản</h1>
          <p className="text-slate-600 text-sm">Thêm/sửa quyền, trạng thái</p>
        </div>
        <button className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm">Tạo tài khoản</button>
      </div>

      <div className="rounded-2xl border bg-white p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr><th className="py-2">Mã</th><th>Họ tên</th><th>Vai trò</th><th>SĐT</th><th>Trạng thái</th><th></th></tr>
          </thead>
          <tbody className="align-top text-slate-900">
            {ACCS.map(r=> (
              <tr key={r.id} className="border-t">
                <td className="py-2">{r.id}</td>
                <td>{r.name}</td>
                <td>{r.role}</td>
                <td>{r.phone}</td>
                <td><span className="px-2 py-1 rounded-lg text-xs bg-green-100 text-green-700">{r.status}</span></td>
                <td className="text-right space-x-2">
                  <button className="px-2 py-1 text-sm rounded-lg border">Đổi quyền</button>
                  <button className="px-2 py-1 text-sm rounded-lg border">Khoá</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
