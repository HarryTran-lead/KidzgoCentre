
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, Users, UserCog, BookOpen, Building2, DollarSign, BarChart3, LayoutDashboard } from "lucide-react";
import Image from "next/image";
import { brand } from "./ui/theme";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/students", label: "Quản lý học viên", icon: Users },
  { href: "/admin/teachers", label: "Quản lý giáo viên", icon: UserCog },
  { href: "/admin/classes", label: "Quản lý lớp học", icon: BookOpen },
  { href: "/admin/courses", label: "Quản lý môn học", icon: GraduationCap },
  { href: "/admin/rooms", label: "Quản lý phòng học", icon: Building2 },
  { href: "/admin/fees", label: "Học phí & Công nợ", icon: DollarSign },
  { href: "/admin/reports", label: "Báo cáo", icon: BarChart3 },
];

export default function Sidebar(){
  const pathname = usePathname();
  return (
    <aside className="h-screen sticky top-0 w-[280px] shrink-0 border-r border-slate-200 bg-white/80 backdrop-blur">
      <div className="h-16 flex items-center gap-3 px-5 border-b">
        <div className="w-10 h-10 rounded-xl bg-white shadow grid place-items-center">
          <Image src="/image/LogoKidzgo.jpg" alt="KidzGo" width={40} height={40} className="rounded-lg object-cover"/>
        </div>
        <div>
          <div className="font-extrabold text-slate-800 leading-4">KidzGo</div>
          <div className="text-[11px] text-slate-500">Learning Through Play</div>
        </div>
      </div>
      <nav className="p-3">
        {nav.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm transition
              ${active ? "bg-pink-50 text-pink-700 ring-1 ring-pink-200" : "hover:bg-slate-50 text-slate-600"}`}>
              <Icon size={18} className={active ? "text-pink-600" : "text-slate-400"} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto p-4 text-xs text-slate-400">Hệ thống KidzGo • v1.0.0</div>
    </aside>
  );
}
