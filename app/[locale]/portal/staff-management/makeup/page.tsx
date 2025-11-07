"use client";

const REQUESTS = [
  { id:"MK-1001", student:"Nguyễn Văn A", course:"IELTS A1", credit:1, note:"Bận thi" },
  { id:"MK-1002", student:"Trần Thị B", course:"TOEIC", credit:0, note:"Ốm" },
];

export default function Page(){
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Bù (make-up)</h1>
          <p className="text-slate-600 text-sm">Nhận credit bù, xếp lịch; vượt quota → tạo phiếu phí bù</p>
        </div>
        <button className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm">Tạo lịch bù</button>
      </div>

      <div className="rounded-2xl border bg-white p-4 space-y-2">
        {REQUESTS.map(r => (
          <div key={r.id} className="p-3 rounded-xl border flex items-center justify-between">
            <div className="text-slate-900">
              <div className="font-medium">{r.student} • {r.course}</div>
              <div className="text-xs text-slate-500">Credit còn: {r.credit} • Lý do: {r.note}</div>
            </div>
            <div className="space-x-2">
              <button className="px-2 py-1 text-sm rounded-lg border">Xếp lớp tương đương</button>
              <button className="px-2 py-1 text-sm rounded-lg border">Tạo phiếu phí bù</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
