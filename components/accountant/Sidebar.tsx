"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { LayoutDashboard, FileText, QrCode, AlertCircle, Undo2, BarChart3, ClipboardList } from "lucide-react";

const NAV = [
  { href: "/accountant", label: "Dashboard", icon: LayoutDashboard },
  { href: "/accountant/invoices", label: "Hóa đơn & phiếu thu", icon: FileText },
  { href: "/accountant/payos", label: "Thanh toán PayOS", icon: QrCode },
  { href: "/accountant/dues", label: "Công nợ", icon: AlertCircle },
  { href: "/accountant/adjustments", label: "Điều chỉnh / Hoàn tiền", icon: Undo2 },
  { href: "/accountant/reports", label: "Báo cáo tài chính", icon: BarChart3 },
  { href: "/accountant/audit-log", label: "Audit Log", icon: ClipboardList },
];

export default function AccountantSidebar() {
  const pathname = usePathname();
  return (
    <aside className="h-screen sticky top-0 w-[280px] shrink-0 border-r border-slate-200 bg-white">
      <div className="h-16 flex items-center gap-3 px-5 border-b">
        <div className="w-10 h-10 rounded-xl bg-white shadow grid place-items-center overflow-hidden">
          <Image src="/image/LogoKidzgo.jpg" alt="KidzGo" width={40} height={40} />
        </div>
        <div>
          <div className="font-extrabold text-slate-900 leading-4">KidzGo</div>
          <div className="text-[11px] text-slate-500">Kế toán</div>
        </div>
      </div>
      <nav className="p-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm transition
                ${active ? "bg-pink-50 text-pink-700 ring-1 ring-pink-200" : "hover:bg-slate-50 text-slate-600"}`}
            >
              <Icon size={18} className={active ? "text-pink-600" : "text-slate-400"} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto p-4 text-xs text-slate-400">Accountant • v1.0.0</div>
    </aside>
  );
}
