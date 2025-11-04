import Badge from "@components/teacher/Badge";

export default function Page() {
  const list = [
    {
      title: "Lịch dạy cập nhật",
      desc: "Lớp A1 chuyển sang P301 từ 12/10",
      tag: "Thông tin",
      color: "blue" as const,
      time: "2 giờ trước",
    },
    {
      title: "Nhắc điểm danh",
      desc: "Chưa điểm danh buổi 08/10 lớp TOEIC",
      tag: "Quan trọng",
      color: "red" as const,
      time: "1 ngày trước",
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Thông báo</h1>
      <div className="space-y-3">
        {list.map((n, i) => (
          <div key={i} className="p-3 rounded-xl border bg-white">
            <div className="flex items-center justify-between">
              <div className="font-medium">{n.title}</div>
              <Badge color={n.color}>{n.tag}</Badge>
            </div>
            <div className="text-xs text-slate-500">{n.desc}</div>
            <div className="text-xs text-slate-400 mt-1">{n.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
