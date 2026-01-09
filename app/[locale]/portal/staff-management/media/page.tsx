"use client";

const items = [
  {
    id: "MD-01",
    title: "Hoạt động lớp Starters",
    className: "Starters B",
    month: "10/2024",
    status: "Chờ duyệt",
  },
  {
    id: "MD-02",
    title: "Video luyện nói",
    className: "IELTS A1",
    month: "10/2024",
    status: "Đã publish",
  },
];

export default function Page() {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Media & Album
          </h1>
          <p className="text-slate-600 text-sm">
            Duyệt media giáo viên upload, publish album cho phụ huynh/học viên
          </p>
        </div>
        <button className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm">
          Upload media
        </button>
      </div>

      <div className="rounded-2xl border bg-white p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-2">Mã</th>
              <th>Tiêu đề</th>
              <th>Lớp</th>
              <th>Tháng</th>
              <th>Trạng thái</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="align-top text-slate-900">
            {items.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="py-2">{item.id}</td>
                <td className="font-medium">{item.title}</td>
                <td>{item.className}</td>
                <td>{item.month}</td>
                <td>
                  <span
                    className={`px-2 py-1 rounded-lg text-xs ${
                      item.status === "Đã publish"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="text-right space-x-2">
                  <button className="px-2 py-1 text-sm rounded-lg border">
                    Xem
                  </button>
                  <button className="px-2 py-1 text-sm rounded-lg border">
                    Duyệt
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