"use client";

const WAITING = [
  { id: "ENR-001", name: "Lê Phương Nhi", course: "IELTS A1", time: "T2-T4-T6 • 08:00" },
  { id: "ENR-002", name: "Đỗ Hải Đăng", course: "TOEIC", time: "T3-T5 • 14:00" },
];

export default function StaffEnrollments() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">Duyệt đăng ký</h1>
        <p className="text-slate-500 text-sm">Xử lý hồ sơ ghi danh mới</p>
      </div>

      <div className="rounded-2xl border bg-white p-4 space-y-2">
        {WAITING.map((e) => (
          <div key={e.id} className="p-3 rounded-xl border flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-900">{e.name}</div>
              <div className="text-xs text-slate-500">{e.course} • {e.time}</div>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-2 rounded-xl border">Từ chối</button>
              <button className="px-3 py-2 rounded-xl bg-slate-900 text-white">Phê duyệt</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
