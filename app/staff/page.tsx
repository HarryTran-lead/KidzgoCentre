"use client";
import { Users, DollarSign, ClipboardList } from "lucide-react";

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: any;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-slate-100 grid place-items-center">
          <Icon size={18} className="text-slate-700" />
        </div>
        <div className="text-sm text-slate-500">{label}</div>
      </div>
      <div className="mt-2 text-2xl font-extrabold text-slate-900">{value}</div>
      {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
    </div>
  );
}

export default function StaffDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Tổng quan</h1>
        <p className="text-slate-500 text-sm">Tình hình vận hành tháng này</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Stat icon={Users} label="Học viên đang hoạt động" value="312" hint="+8 so với tháng trước" />
        <Stat icon={DollarSign} label="Thu học phí tháng này" value="245.200.000 đ" hint="+12%" />
        <Stat icon={ClipboardList} label="Đăng ký chờ duyệt" value="14" />
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <h3 className="font-semibold mb-2">Nhật ký gần đây</h3>
        <ul className="text-sm text-slate-900 list-disc pl-5 space-y-1">
          <li>Ghi nhận thanh toán 2,500,000 đ cho lớp Tiếng Nhật N5 (HS: Trần Gia Bảo)</li>
          <li>Phê duyệt đăng ký lớp IELTS A1 (HS: Lê Phương Nhi)</li>
          <li>Gửi thông báo thay đổi lịch học TOEIC Intermediate</li>
        </ul>
      </div>
    </div>
  );
}
