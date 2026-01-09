"use client";

const campaigns = [
  {
    id: "NT-01",
    title: "Nhắc đóng học phí tháng 10",
    channel: "Zalo OA",
    audience: "Phụ huynh",
    status: "Scheduled",
    sendAt: "12/10 09:00",
  },
  {
    id: "NT-02",
    title: "Thông báo lịch workshop",
    channel: "Zalo OA + Email",
    audience: "Phụ huynh + Học viên",
    status: "Draft",
    sendAt: "",
  },
  {
    id: "NT-03",
    title: "Báo cáo tháng đã sẵn sàng",
    channel: "Zalo OA",
    audience: "Phụ huynh",
    status: "Sent",
    sendAt: "05/10 19:00",
  },
];

const queues = [
  { label: "Đang chờ gửi", value: "5" },
  { label: "Đã gửi hôm nay", value: "42" },
  { label: "Tỉ lệ mở", value: "78%" },
];

export default function Page() {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Trung tâm thông báo
          </h1>
          <p className="text-slate-600 text-sm">
            Gửi broadcast qua Zalo OA/Email, theo dõi lịch gửi và kết quả
          </p>
        </div>
        <button className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm">
          Tạo thông báo
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        {queues.map((item) => (
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
              <th>Kênh</th>
              <th>Đối tượng</th>
              <th>Trạng thái</th>
              <th>Lịch gửi</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="align-top text-slate-900">
            {campaigns.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="py-2">{item.id}</td>
                <td className="font-medium">{item.title}</td>
                <td>{item.channel}</td>
                <td>{item.audience}</td>
                <td>
                  <span
                    className={`px-2 py-1 rounded-lg text-xs ${
                      item.status === "Sent"
                        ? "bg-green-100 text-green-700"
                        : item.status === "Scheduled"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
                <td>{item.sendAt || "—"}</td>
                <td className="text-right space-x-2">
                  <button className="px-2 py-1 text-sm rounded-lg border">
                    Xem
                  </button>
                  <button className="px-2 py-1 text-sm rounded-lg border">
                    Gửi thử
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