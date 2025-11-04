import { FileText, Eye, Pencil } from "lucide-react";
import Badge from "@components/teacher/Badge";

export default function Page() {
  const courses = [
    {
      code: "KH001",
      name: "General English A1",
      level: "A1",
      dur: "12 tuần (72h)",
      fee: "2.000.000 VND",
      classes: "2 lớp",
      status: "Đang hoạt động",
    },
    {
      code: "KH002",
      name: "General English A2",
      level: "A2",
      dur: "12 tuần (72h)",
      fee: "2.200.000 VND",
      classes: "1 lớp",
      status: "Đang hoạt động",
    },
    {
      code: "KH003",
      name: "General English B1",
      level: "B1",
      dur: "16 tuần (96h)",
      fee: "2.500.000 VND",
      classes: "3 lớp",
      status: "Đang hoạt động",
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Môn học & Tài liệu</h1>

      <div className="rounded-2xl border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left p-3">Mã khóa</th>
              <th className="text-left p-3">Tên khóa học</th>
              <th className="text-left p-3">Trình độ</th>
              <th className="text-left p-3">Thời lượng</th>
              <th className="text-left p-3">Học phí</th>
              <th className="text-left p-3">Lớp học</th>
              <th className="text-left p-3">Trạng thái</th>
              <th className="text-right p-3">Tài liệu</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((r) => (
              <tr key={r.code} className="border-t">
                <td className="p-3">{r.code}</td>
                <td className="p-3 font-medium">{r.name}</td>
                <td className="p-3">
                  <Badge color="yellow">{r.level}</Badge>
                </td>
                <td className="p-3">{r.dur}</td>
                <td className="p-3">{r.fee}</td>
                <td className="p-3">{r.classes}</td>
                <td className="p-3">
                  <Badge color="green">{r.status}</Badge>
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    <button
                      className="p-2 rounded-lg border hover:bg-slate-50"
                      title="Xem"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className="p-2 rounded-lg border hover:bg-slate-50"
                      title="Tải đề cương"
                    >
                      <FileText size={16} />
                    </button>
                    <button
                      className="p-2 rounded-lg border hover:bg-slate-50"
                      title="Sửa"
                    >
                      <Pencil size={16} />
                    </button>
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
