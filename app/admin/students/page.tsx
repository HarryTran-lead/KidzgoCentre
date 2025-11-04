import { Mail, Phone, Eye, Pencil } from "lucide-react";
import Badge from "@components/admin/Badge";

const rows = [
  {id:"HV001", name:"Nguyễn Văn An", phone:"0901234567", email:"van.an@email.com", cls:"English B1-01", level:"B1", state:"Đang học", fee:"2.500.000 / 2.500.000 VND", feeTag:"Đã đóng"},
  {id:"HV002", name:"Trần Thị Bình", phone:"0907654321", email:"thi.binh@email.com", cls:"IELTS Prep-02", level:"IELTS", state:"Đang học", fee:"1.600.000 / 3.200.000 VND", feeTag:"Chờ đóng"},
  {id:"HV003", name:"Lê Văn Cường", phone:"0912345678", email:"van.cuong@email.com", cls:"TOEIC Advanced", level:"TOEIC", state:"Đang học", fee:"1.400.000 / 2.800.000 VND", feeTag:"Quá hạn"},
  {id:"HV004", name:"Phạm Thị Dung", phone:"0923456789", email:"thi.dung@email.com", cls:"English A2-03", level:"A2", state:"Đang học", fee:"2.200.000 / 2.200.000 VND", feeTag:"Đã đóng"},
];

export default function Page(){
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-black font-extrabold">Quản lý học viên</h1>
        <p className="text-slate-500 text-sm">Quản lý thông tin và hồ sơ học viên</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-slate-500">Danh sách học viên</div>
          <button className="px-3 py-2 rounded-lg bg-pink-500 text-white text-sm font-medium hover:opacity-90">+ Thêm học viên</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-pink-50 text-slate-600">
              <tr>
                <th className="text-left p-3">Mã HV</th>
                <th className="text-left p-3">Họ tên</th>
                <th className="text-left p-3">Liên hệ</th>
                <th className="text-left p-3">Lớp học</th>
                <th className="text-left p-3">Trình độ</th>
                <th className="text-left p-3">Trạng thái</th>
                <th className="text-left p-3">Học phí</th>
                <th className="text-right p-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r,i)=>(
                <tr key={r.id} className={i%2? "bg-white":"bg-slate-50/30"}>
                  <td className="p-3 text-black font-medium">{r.id}</td>
                  <td className="p-3">
                    <div className="font-medium text-black">{r.name}</div>
                    <div className="text-xs text-slate-500">Ngày nhập học: 15/1/2025</div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3 text-slate-600">
                      <span className="inline-flex items-center gap-1"><Phone size={14}/>{r.phone}</span>
                      <span className="inline-flex items-center gap-1"><Mail size={14}/>{r.email}</span>
                    </div>
                  </td>
                  <td className="p-3 text-black">{r.cls}</td>
                  <td className="p-3"><Badge color="blue">{r.level}</Badge></td>
                  <td className="p-3"><Badge color="green">{r.state}</Badge></td>
                  <td className="p-3">
                    <div className="mb-1"><Badge color={r.feeTag==='Đã đóng'?'green':r.feeTag==='Chờ đóng'?'yellow':'red'}>{r.feeTag}</Badge></div>
                    <div className="text-xs text-slate-500">{r.fee}</div>
                  </td>
                  <td className="p-3 text-black text-right">
                    <button className="p-2 rounded-lg border hover:bg-slate-50 mr-2"><Eye size={16}/></button>
                    <button className="p-2 rounded-lg border hover:bg-slate-50"><Pencil size={16}/></button>
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
