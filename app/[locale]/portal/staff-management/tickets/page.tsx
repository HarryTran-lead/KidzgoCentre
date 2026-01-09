"use client";

const tickets = [
  {
    id: "TK-1001",
    title: "Đổi lịch học tạm thời",
    requester: "PH: Trần Thị B",
    category: "Operations",
    status: "Mới",
    updated: "10/10 09:20",
  },
  {
    id: "TK-1002",
    title: "Thắc mắc hóa đơn tháng 10",
    requester: "PH: Nguyễn Văn A",
    category: "Accountant",
    status: "Đang xử lý",
    updated: "10/10 08:40",
  },
  {
    id: "TK-1003",
    title: "Xin nhận xét thêm bài tập",
    requester: "HS: Lê Gia Hân",
    category: "Teacher",
    status: "Đã phản hồi",
    updated: "09/10 17:05",
  },
];

const stats = [
  { label: "Ticket mới", value: "8" },
  { label: "Đang xử lý", value: "5" },
  { label: "Đã đóng", value: "21" },
];

export default function Page() {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Ticket hỗ trợ
          </h1>
          <p className="text-slate-600 text-sm">
            Quản lý phản hồi phụ huynh/học viên, phân tuyến cho giáo viên và staff
          </p>
        </div>
        <button className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm">
          Tạo ticket
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        {stats.map((item) => (
          <div key={item.label} className="rounded-2xl border bg-white p-4">
            <div className="text-sm text-slate-500">{item.label}</div>
            <div className="text-2xl font-extrabold text-slate-900">
              {item.value}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-white p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-2">Mã</th>
              <th>Tiêu đề</th>
              <th>Người gửi</th>
              <th>Nhóm xử lý</th>
              <th>Trạng thái</th>
              <th>Cập nhật</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="align-top text-slate-900">
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="border-t">
                <td className="py-2">{ticket.id}</td>
                <td className="font-medium">{ticket.title}</td>
                <td>{ticket.requester}</td>
                <td>{ticket.category}</td>
                <td>
                  <span
                    className={`px-2 py-1 rounded-lg text-xs ${
                      ticket.status === "Mới"
                        ? "bg-amber-100 text-amber-700"
                        : ticket.status === "Đang xử lý"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                    }`}
                  >
                    {ticket.status}
                  </span>
                </td>
                <td>{ticket.updated}</td>
                <td className="text-right space-x-2">
                  <button className="px-2 py-1 text-sm rounded-lg border">
                    Xem
                  </button>
                  <button className="px-2 py-1 text-sm rounded-lg border">
                    Phân tuyến
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