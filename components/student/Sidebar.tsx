"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  CalendarCheck,
  User,
  CreditCard,
  BookOpen,
  Bell,
  ClipboardList,
  BarChart3,
  MessageSquareMore,
  CheckSquare,
} from "lucide-react";

type Item = { href: string; label: string; icon: React.ReactNode };

function NavItem({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
        active ? "bg-slate-900 text-white" : "hover:bg-slate-100 text-slate-700"
      }`}
      aria-current={active ? "page" : undefined}
    >
      <span className="w-5 h-5">{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  const items: Item[] = [
    { href: "/student", label: "Trang chủ", icon: <House className="w-5 h-5" /> },
    { href: "/student/schedule", label: "Lịch học", icon: <CalendarCheck className="w-5 h-5" /> },
    { href: "/student/attendance", label: "Điểm danh", icon: <CheckSquare className="w-5 h-5" /> },
    { href: "/student/profile", label: "Hồ sơ", icon: <User className="w-5 h-5" /> },
    { href: "/student/tuition", label: "Học phí", icon: <CreditCard className="w-5 h-5" /> },
    { href: "/student/assignments", label: "Bài tập", icon: <ClipboardList className="w-5 h-5" /> },
    { href: "/student/materials", label: "Tài liệu", icon: <BookOpen className="w-5 h-5" /> },
    { href: "/student/reports", label: "Báo cáo", icon: <BarChart3 className="w-5 h-5" /> },
    { href: "/student/feedback", label: "Phản hồi", icon: <MessageSquareMore className="w-5 h-5" /> },
    { href: "/student/notifications", label: "Thông báo", icon: <Bell className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-[280px] shrink-0 border-r bg-white min-h-screen">
      <div className="p-4 sticky top-0 bg-white z-10 border-b">
        <div className="text-2xl text-gray-900 font-bold">Cổng học viên</div>
      </div>

      <nav className="p-4 space-y-2">
        {items.map((it) => (
          <NavItem
            key={it.href}
            href={it.href}
            label={it.label}
            icon={it.icon}
            active={pathname === it.href || pathname?.startsWith(it.href + "/")}
          />
        ))}
      </nav>

      <div className="mt-auto p-4 text-xs text-slate-400">Phiên bản 1.0.0</div>
    </aside>
  );
}
