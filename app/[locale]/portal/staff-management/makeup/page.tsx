"use client";

const REQUESTS = [
  {
    id: "LR-1001",
    student: "Nguyễn Văn A",
    course: "IELTS A1",
    type: "Nghỉ 1 ngày",
    requestTime: "10/10 09:00",
    sessionTime: "11/10 08:00",
    status: "Auto-approve",
    credit: 1,
    note: "Bận thi",
  },
  {
    id: "LR-1002",
    student: "Trần Thị B",
    course: "TOEIC",
    type: "Nghỉ dài ngày",
    requestTime: "08/10 18:30",
    sessionTime: "09/10 18:00",
    status: "Chờ duyệt",
    credit: 0,
    note: "Ốm",
  },
];

const makeupSessions = [
  {
    id: "MU-01",
    student: "Nguyễn Văn A",
    fromClass: "IELTS A1",
    targetClass: "IELTS A1 - lớp bù T7",
    date: "14/10",
    time: "18:00-19:30",
    status: "Chờ xác nhận",
  },
  {
    id: "MU-02",
    student: "Lê Gia Hân",
    fromClass: "Cambridge Starters",
    targetClass: "Starters B",
    date: "12/10",
    time: "15:30-17:00",
    status: "Đã xác nhận",
  },
];

export default function Page() {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Học bù & MakeUpCredit
          </h1>
          <p className="text-slate-600 text-sm">
            Duyệt đơn nghỉ, tự động cấp credit theo luật 24h và xếp buổi bù
          </p>
        </div>
        <button className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm">
          Tạo lịch bù
        </button>
      </div>

      <div className="rounded-2xl border bg-white p-4 space-y-3">
        <h3 className="font-semibold text-slate-900">Đơn xin nghỉ</h3>
        {REQUESTS.map((r) => (
          <div
            key={r.id}
            className="p-3 rounded-xl border flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"
          >
            <div className="text-slate-900">
              <div className="font-medium">
                {r.student} • {r.course}
              </div>
              <div className="text-xs text-slate-500">
                {r.type} • Tạo: {r.requestTime} • Buổi học: {r.sessionTime}
              </div>
              <div className="text-xs text-slate-500">Lý do: {r.note}</div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2 py-1 rounded-lg text-xs ${
                  r.status === "Auto-approve"
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {r.status}
              </span>

              <span className="px-2 py-1 rounded-lg text-xs bg-slate-100 text-slate-700">
                Credit còn: {r.credit}
              </span>

              <button className="px-2 py-1 text-sm rounded-lg border">
                Duyệt / Từ chối
              </button>
              <button className="px-2 py-1 text-sm rounded-lg border">
                Xếp buổi bù
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-white p-4 space-y-3">
        <h3 className="font-semibold text-slate-900">Buổi bù đã lên lịch</h3>
        {makeupSessions.map((item) => (
          <div
            key={item.id}
            className="p-3 rounded-xl border flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"
          >
            <div className="text-slate-900">
              <div className="font-medium">{item.student}</div>
              <div className="text-xs text-slate-500">
                Từ {item.fromClass} → {item.targetClass}
              </div>
              <div className="text-xs text-slate-500">
                {item.date} • {item.time}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-1 rounded-lg text-xs ${
                  item.status === "Đã xác nhận"
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {item.status}
              </span>

              <button className="px-2 py-1 text-sm rounded-lg border">
                Đổi buổi
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
