"use client";

export default function StaffAnnouncements() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">Thông báo</h1>
        <p className="text-slate-500 text-sm">Gửi thông báo cho lớp/học viên</p>
      </div>

      <div className="rounded-2xl border bg-white p-4 space-y-3">
        <select className="w-full border rounded-xl px-3 py-2 bg-slate-50">
          <option>Chọn lớp…</option>
          <option>IELTS A1</option>
          <option>TOEIC Intermediate</option>
          <option>Business English</option>
        </select>
        <input className="w-full border rounded-xl px-3 py-2 bg-slate-50" placeholder="Tiêu đề" />
        <textarea className="w-full border rounded-xl px-3 py-2 bg-slate-50" rows={6} placeholder="Nội dung…" />
        <button className="px-3 py-2 rounded-xl bg-slate-900 text-white">Gửi thông báo</button>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <h3 className="font-semibold mb-2">Lịch sử đã gửi</h3>
        <ul className="text-sm text-slate-900 list-disc pl-5 space-y-1">
          <li>Thay đổi phòng học lớp IELTS A1 – 2 giờ trước</li>
          <li>Bài tập về nhà TOEIC – 1 ngày trước</li>
          <li>Nhắc đóng học phí còn nợ – 3 ngày trước</li>
        </ul>
      </div>
    </div>
  );
}
