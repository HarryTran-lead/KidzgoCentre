"use client";

export default function Page(){
  const draftAI = () => alert("Đã tạo bản nháp báo cáo (AI) — Demo");
  const publish = () => alert("Đã publish báo cáo — gửi Zalo + portal (giả lập)");

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Báo cáo tháng</h1>
          <p className="text-slate-600 text-sm">Gom dữ liệu/nhắc GV → tạo draft (AI) → duyệt → publish</p>
        </div>
        <div className="space-x-2">
          <button onClick={draftAI} className="px-3 py-2 rounded-xl border text-sm">Tạo draft (AI)</button>
          <button onClick={publish} className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm">Publish</button>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <h3 className="font-semibold mb-2 text-slate-900">Tiến độ thu thập</h3>
        <ul className="text-sm text-slate-900 list-disc pl-5 space-y-1">
          <li>Đã nhận 12/18 báo cáo lớp</li>
          <li>Còn thiếu: IELTS A1, TOEIC T3, Kids Tue</li>
          <li>Đã gửi nhắc GV (tự động)</li>
        </ul>
      </div>
    </div>
  );
}
