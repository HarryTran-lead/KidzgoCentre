"use client";

const students = [
  {
    id: "ST001",
    name: "Nguyễn Văn A",
    cls: "IELTS A1",
    attendance: "92%",
    makeup: 2,
    notes: "PH thích liên hệ Zalo",
  },
  {
    id: "ST002",
    name: "Trần Thị B",
    cls: "TOEIC",
    attendance: "85%",
    makeup: 0,
    notes: "Cần nhắc bài tối T5",
  },
];

export default function Page() {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Hồ sơ học viên
          </h1>
          <p className="text-slate-600 text-sm">
            Tổng hợp thông tin lớp, attendance, MakeUpCredit và ghi chú quan
            trọng
          </p>
        </div>
        <button className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm">
          Thêm ghi chú
        </button>
      </div>

      <div className="rounded-2xl border bg-white p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-2">Mã</th>
              <th>Họ tên</th>
              <th>Lớp</th>
              <th>Attendance</th>
              <th>MakeUpCredit</th>
              <th>Ghi chú</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="align-top text-slate-900">
            {students.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="py-2">{r.id}</td>
                <td>{r.name}</td>
                <td>{r.cls}</td>
                <td>{r.attendance}</td>
                <td>{r.makeup}</td>
                <td className="text-slate-600">{r.notes}</td>
                <td className="text-right space-x-2">
                  <button className="px-2 py-1 text-sm rounded-lg border">
                    Xem hồ sơ
                  </button>
                  <button className="px-2 py-1 text-sm rounded-lg border">
                    Cập nhật
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
