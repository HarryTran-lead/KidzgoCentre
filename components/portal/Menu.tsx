// components/portal/menu.tsx
import type { Role } from "@/lib/roles";
import {
  LayoutDashboard,
  Users,
  Receipt,
  CreditCard,
  FileText,
  BookOpen,
  CalendarClock,
  ClipboardCheck,
  Building2,
  Settings,
} from "lucide-react";
import { ROLES } from "@/lib/roles";

export type MenuItem = {
  label: string;
  icon: React.ComponentType<any>;
  href: string;          // đã là path tuyệt đối
};

export function buildMenu(role: Role): MenuItem[] {
  const root = ROLES[role];

  if (role === "ADMIN")
    return [
      { label: "Dashboard", icon: LayoutDashboard, href: `${root}` },
      { label: "Users", icon: Users, href: `${root}/users` },
      { label: "Reports", icon: FileText, href: `${root}/reports` },
      { label: "Settings", icon: Settings, href: `${root}/settings` },
    ];

  if (role === "STAFF_ACCOUNTING")
    return [
      { label: "Dashboard", icon: LayoutDashboard, href: `${root}` },
      { label: "Fees", icon: Receipt, href: `${root}/fees` },
      { label: "Invoices", icon: FileText, href: `${root}/invoices` },
      { label: "Payments", icon: CreditCard, href: `${root}/payments` },
      { label: "Reports", icon: FileText, href: `${root}/reports` },
    ];

  if (role === "STAFF_MANAGER")
    return [
      { label: "Dashboard", icon: LayoutDashboard, href: `${root}` },
      { label: "Classes", icon: BookOpen, href: `${root}/classes` },
      { label: "Rooms", icon: Building2, href: `${root}/rooms` },
      { label: "Schedule", icon: CalendarClock, href: `${root}/schedule` },
      { label: "Reports", icon: FileText, href: `${root}/reports` },
    ];

  // TEACHER
  return [
    { label: "Dashboard", icon: LayoutDashboard, href: `${root}` },
    { label: "My Classes", icon: BookOpen, href: `${root}/classes` },
    { label: "Schedule", icon: CalendarClock, href: `${root}/schedule` },
    { label: "Assignments", icon: ClipboardCheck, href: `${root}/assignments` },
  ];
}
