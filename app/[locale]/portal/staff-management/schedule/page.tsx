"use client";

const EVENTS = [
  {
    id: "EVT-01",
    title: "IELTS A1",
    when: "T2 08:00-09:30",
    room: "P301",
    teacher: "Minh",
    branch: "Quận 1",
    conflict: false,
    note: "Lớp chính",
  },
  {
    id: "EVT-02",
    title: "TOEIC",
    when: "T3 14:00-15:30",
    room: "P205",
    teacher: "Hoa",
    branch: "Quận 7",
    conflict: true,
    note: "Trùng phòng",
  },
];

export default function Page() {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Điều phối lịch, lớp, phòng
          </h1>
          <p className="text-slate-600 text-sm">
            Tạo/đổi ca, gán giáo viên, xử lý xung đột lịch và gửi thông báo
          </p>
        </div>
        <button className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm">
          Tạo ca
        </button>
      </div>

      <div className="rounded-2xl border bg-white p-4 space-y-2">
        {EVENTS.map((e) => (
          <div
            key={e.id}
            className={`p-3 rounded-xl border flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 ${
              e.conflict ? "bg-amber-50" : ""
            }`}
          >
            <div className="text-slate-900">
              <div className="font-medium">
                {e.title} — {e.when}
              </div>
              <div className="text-xs text-slate-500">
                {e.room} • GV: {e.teacher} • {e.branch}
              </div>
              <div className="text-xs text-slate-500">{e.note}</div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {e.conflict && (
                <span className="px-2 py-1 rounded-lg text-xs bg-amber-100 text-amber-700">
                  Xung đột
                </span>
              )}
              <button className="px-2 py-1 text-sm rounded-lg border">
                Đổi phòng
              </button>
              <button className="px-2 py-1 text-sm rounded-lg border">
                Đổi GV
              </button>
              <button className="px-2 py-1 text-sm rounded-lg border">
                Gửi Zalo
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
