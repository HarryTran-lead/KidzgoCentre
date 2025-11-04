import Badge from "@components/teacher/Badge";

export default function Page() {
  const day = "11/02/2025";
  const slots = [
    {
      time: "08:00-10:00",
      room: "P101",
      cls: "English B1-01",
      teacher: "Ms. Sarah",
      students: 25,
      state: "Đang diễn ra",
    },
    {
      time: "10:30-12:30",
      room: "P102",
      cls: "English A2-01",
      teacher: "Ms. Lisa",
      students: 20,
      state: "Sắp diễn ra",
    },
    {
      time: "14:00-16:00",
      room: "P103",
      cls: "TOEIC Prep",
      teacher: "Mr. David",
      students: 22,
      state: "Sắp diễn ra",
    },
  ];
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Lịch giảng dạy</h1>

      <div className="rounded-2xl border bg-white p-4">
        <div className="text-sm text-slate-500 mb-3">Lịch hôm nay — {day}</div>
        <div className="space-y-3">
          {slots.map((s, i) => (
            <div
              key={i}
              className="p-3 rounded-xl border bg-white flex items-center justify-between"
            >
              <div>
                <div className="font-medium">{s.time}</div>
                <div className="text-xs text-slate-500">
                  {s.room} • {s.cls} • {s.teacher} • {s.students} học viên
                </div>
              </div>
              <Badge color={i === 0 ? "blue" : "yellow"}>{s.state}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
