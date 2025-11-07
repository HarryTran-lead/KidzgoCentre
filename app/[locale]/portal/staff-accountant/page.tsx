"use client";
import { FileText, QrCode, AlertTriangle } from "lucide-react";

function Stat({ icon: Icon, label, value, hint }:{icon:any;label:string;value:string;hint?:string}){
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
        <h1 className="text-2xl font-extrabold text-slate-900">Tổng quan tài chính</h1>
        <p className="text-slate-600 text-sm">Theo dõi nhanh hoá đơn, PayOS, công nợ</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Stat icon={FileText} label="Hóa đơn phát hành (tháng)" value="182" hint="+14 so với tháng trước"/>
        <Stat icon={QrCode} label="Giao dịch PayOS (tháng)" value="126" hint="Tỉ lệ khớp: 98.4%"/>
        <Stat icon={AlertTriangle} label="Công nợ hiện tại" value="37.200.000 đ" hint="Tuổi nợ trung bình: 21 ngày"/>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <h3 className="font-semibold mb-2 text-slate-900">Nhật ký gần đây</h3>
        <ul className="text-sm text-slate-900 list-disc pl-5 space-y-1">
          <li>Xuất hoá đơn #INV-10542 cho lớp IELTS A1 (2.500.000 đ)</li>
          <li>Ghi nhận biên lai PayOS #TX-2941 (QR động)</li>
          <li>Khóa sổ kỳ 10/2025</li>
        </ul>
      </div>
    </div>
  );
}
