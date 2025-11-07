"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  User,
  NotebookText,
  CalendarClock,
  BookOpenText,
  ClipboardCheck,
  CheckSquare,
  MessageCircle,
  Clock4,
  Bell,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type NavItem = { href: string; icon: LucideIcon; label: string };

const items: NavItem[] = [
  { href: "/teacher", icon: LayoutDashboard, label: "Tổng quan" },
  { href: "/teacher/profile", icon: User, label: "Hồ sơ cá nhân" },
  { href: "/teacher/classes", icon: NotebookText, label: "Lớp học của tôi" },
  { href: "/teacher/schedule", icon: CalendarClock, label: "Lịch giảng dạy" },
  { href: "/teacher/subjects", icon: BookOpenText, label: "Môn học & Tài liệu" },
  { href: "/teacher/assignments", icon: ClipboardCheck, label: "Bài tập & Nộp bài" },
  { href: "/teacher/attendance", icon: CheckSquare, label: "Điểm danh" },
  { href: "/teacher/feedback", icon: MessageCircle, label: "Báo cáo & Feedback" },
  { href: "/teacher/timesheet", icon: Clock4, label: "Công giờ & Thu nhập" },
  { href: "/teacher/notifications", icon: Bell, label: "Thông báo" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 shrink-0 border-r bg-white/70 backdrop-blur min-h-screen flex flex-col">
      <div className="px-5 py-4 border-b">
        <div className="font-extrabold text-gray-900 text-xl">EduCenter</div>
        <div className="text-xs text-slate-500">Giảng viên</div>
      </div>

      <nav className="p-3 space-y-1">
        {items.map((it) => {
          const Icon = it.icon;
          const active =
            pathname === it.href || pathname?.startsWith(it.href + "/");
          return (
            <Link
              key={it.href}
              href={it.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-xl transition",
                active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={18} />
              <span className="text-sm">{it.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4 text-xs text-slate-400">Phiên bản 1.0.0</div>
    </aside>
  );
}
