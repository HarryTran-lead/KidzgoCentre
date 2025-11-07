"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { LayoutDashboard, UserCog, Users, CalendarRange, RefreshCw, FileText, NotebookText } from "lucide-react";

const NAV = [
  { href: "/management", label: "Dashboard", icon: LayoutDashboard },
  { href: "/management/accounts", label: "Quản lý tài khoản", icon: UserCog },
  { href: "/management/leads", label: "Lead / CRM", icon: Users },
  { href: "/management/schedule", label: "Điều phối lịch/lớp/phòng", icon: CalendarRange },
  { href: "/management/makeup", label: "Bù (make-up)", icon: RefreshCw },
  { href: "/management/monthly-report", label: "Báo cáo tháng", icon: FileText },
  { href: "/management/students", label: "Hồ sơ học sinh", icon: NotebookText },
  { href: "/management/templates", label: "Mẫu thông báo", icon: FileText },
];

export default function ManagementSidebar(){
  const pathname = usePathname();
  return (
    <aside className="h-screen sticky top-0 w-[280px] shrink-0 border-r border-slate-200 bg-white">
      <div className="h-16 flex items-center gap-3 px-5 border-b">
        <div className="w-10 h-10 rounded-xl bg-white shadow grid place-items-center overflow-hidden">
          <Image src="/image/LogoKidzgo.jpg" alt="KidzGo" width={40} height={40} />
        </div>
        <div>
          <div className="font-extrabold text-slate-900 leading-4">KidzGo</div>
          <div className="text-[11px] text-slate-500">Vận hành</div>
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
                ${active ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200" : "hover:bg-slate-50 text-slate-600"}`}
            >
              <Icon size={18} className={active ? "text-amber-600" : "text-slate-400"} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto p-4 text-xs text-slate-400">Management • v1.0.0</div>
    </aside>
  );
}
