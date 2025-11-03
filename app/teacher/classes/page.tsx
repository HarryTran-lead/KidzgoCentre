import Badge from "@/components/teacher/Badge";
import { Eye, Pencil } from "lucide-react";

export default function Page() {
  const rows = [
    { code: "LH001", name: "English B1-01", teacher: "Ms. Sarah Johnson", room: "P101", size: "25/30", schedule: "T2,4,6 • 08:00-10:00", status: "Đang học" },
    { code: "LH002", name: "IELTS Prep-02", teacher: "Mr. John Smith", room: "P102", size: "20/25", schedule: "T3,5,7 • 14:00-16:00", status: "Đang học" },
    { code: "LH004", name: "TOEIC Advanced", teacher: "Mr. David Wilson", room: "P103", size: "22/25", schedule: "T7,CN • 08:00-10:00", status: "Đang học" },
  ];
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Lớp học của tôi</h1>

      <div className="rounded-2xl border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left p-3">Mã lớp</th>
              <th className="text-left p-3">Tên lớp</th>
              <th className="text-left p-3">Giáo viên</th>
              <th className="text-left p-3">Phòng</th>
              <th className="text-left p-3">Sĩ số</th>
              <th className="text-left p-3">Lịch học</th>
              <th className="text-left p-3">Trạng thái</th>
              <th className="text-right p-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.code} className="border-t">
                <td className="p-3">{r.code}</td>
                <td className="p-3 font-medium">{r.name}</td>
                <td className="p-3">{r.teacher}</td>
                <td className="p-3">{r.room}</td>
                <td className="p-3">{r.size}</td>
                <td className="p-3">{r.schedule}</td>
                <td className="p-3"><Badge color="green">{r.status}</Badge></td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    <button className="p-2 rounded-lg border hover:bg-slate-50"><Eye size={16} /></button>
                    <button className="p-2 rounded-lg border hover:bg-slate-50"><Pencil size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
