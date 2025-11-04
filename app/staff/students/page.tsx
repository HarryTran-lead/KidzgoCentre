"use client";
import { Search } from "lucide-react";

const MOCK = [
  { id: "ST001", name: "Nguyễn Minh Quân", phone: "0901 234 567", status: "Đang học", course: "IELTS A1" },
  { id: "ST002", name: "Trần Gia Bảo", phone: "0902 888 999", status: "Nợ học phí", course: "N5" },
  { id: "ST003", name: "Lê Phương Nhi", phone: "0909 777 111", status: "Mới", course: "TOEIC" },
];

export default function StaffStudents() {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Quản lý học viên</h1>
          <p className="text-slate-500 text-sm">Tìm kiếm & cập nhật thông tin học viên</p>
        </div>
        <button className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm">Thêm học viên</button>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input className="w-full pl-9 pr-3 py-2 rounded-xl border bg-slate-50" placeholder="Tìm theo tên, SĐT, mã..." />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="py-2">Mã</th>
                <th>Tên</th>
                <th>SĐT</th>
                <th>Khoá</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="align-top text-slate-900">
              {MOCK.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="py-2">{s.id}</td>
                  <td>{s.name}</td>
                  <td>{s.phone}</td>
                  <td>{s.course}</td>
                  <td>
                    <span className="px-2 py-1 rounded-lg text-xs bg-slate-100">{s.status}</span>
                  </td>
                  <td className="text-right">
                    <button className="px-2 py-1 text-sm rounded-lg border mr-2">Sửa</button>
                    <button className="px-2 py-1 text-sm rounded-lg border">Xem hồ sơ</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
