"use client";
import { Users, CalendarRange, NotebookPen } from "lucide-react";

function Stat({icon:Icon,label,value,hint}:{icon:any;label:string;value:string;hint?:string}){
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

export default function Page(){
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Tổng quan vận hành</h1>
        <p className="text-slate-600 text-sm">Lead/CRM, điều phối lịch, báo cáo tháng</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Stat icon={Users} label="Lead mới (tuần)" value="37" hint="+9 so với tuần trước"/>
        <Stat icon={CalendarRange} label="Ca lớp tuần này" value="124" hint="Xung đột: 2"/>
        <Stat icon={NotebookPen} label="Báo cáo tháng (draft)" value="Đang gom" hint="Đã nhắc 5/18 GV"/>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border bg-white p-4">
          <h3 className="font-semibold mb-2 text-slate-900">Lịch thay đổi gần đây</h3>
          <ul className="text-sm text-slate-900 list-disc pl-5 space-y-1">
            <li>Chuyển TOEIC T3 14:00 → Phòng 205</li>
            <li>Gán GV Minh: IELTS Foundation A1 (T2-T4-T6)</li>
            <li>Hủy ca Make-up 12/10 vì trùng phòng</li>
          </ul>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <h3 className="font-semibold mb-2 text-slate-900">Nhắc cần làm</h3>
          <ul className="text-sm text-slate-900 list-disc pl-5 space-y-1">
            <li>Phân công người phụ trách 8 lead mới</li>
            <li>Tạo phiếu phí bù cho HS quá quota</li>
            <li>Soát draft báo cáo tháng 10</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
