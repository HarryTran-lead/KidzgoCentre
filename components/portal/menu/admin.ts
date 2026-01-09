// components/portal/menu/admin.ts
import {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  Building2,
  CalendarRange,
  CalendarClock,
  ClipboardCheck,
  CreditCard,
  Inbox,
  Settings,
  Wallet,
  Banknote,
  Building,
  BarChart3,
} from "lucide-react";
import { makeMenu, makeGroup, type RawItem } from "./utils";
import type { MenuItem } from "./types";
import { getMessages } from "@/lib/dict";
import type { Locale } from "@/lib/i18n";

export function adminMenu(root: string, locale: Locale = "vi"): MenuItem[] {
  const t = getMessages(locale).menuAdmin;

  const QUICK: RawItem[] = [
    [t.quick.businessOverview, LayoutDashboard, ""],
    [t.quick.centerOverview, Building, "/center"],
  ];

  const LEADS: RawItem[] = [
    [t.groups.leads.manageLeads, Inbox, "/leads"],
  ];

  const LEARNING: RawItem[] = [
    [t.groups.learning.courses.list, GraduationCap, "/courses"],
    [t.groups.learning.classes.list, BookOpen, "/classes"],
    [t.groups.learning.students.list, Users, "/students"],
  ];

  const OPS: RawItem[] = [
    [t.groups.ops.rooms, Building2, "/rooms"],
    [t.groups.ops.schedule, CalendarRange, "/schedule"],
    [t.groups.ops.fees, CreditCard, "/fees"],
    [t.groups.ops.feedback, ClipboardCheck, "/feedback"],
    [t.groups.ops.extracurricular, CalendarClock, "/extracurricular"],
  ];

  const FINANCE: RawItem[] = [
    [t.groups.finance.cashbook, Wallet, "/cashbook"],
    [t.groups.finance.payroll, Banknote, "/payroll"],
  ];

  const SYSTEM: RawItem[] = [
    [t.groups.system.accounts, Settings, "/accounts"],
    [t.groups.system.teachers, Users, "/teachers"],
    [t.groups.system.branches, Building2, "/branches"],
    [t.groups.system.reports, BarChart3, "/reports"],
    [t.groups.system.settings, Settings, "/settings"],
  ];

  return [
    ...makeMenu(root, QUICK),
    makeGroup(root, t.groups.leads.title, Inbox, LEADS),
    makeGroup(root, t.groups.learning.title, GraduationCap, LEARNING),
    makeGroup(root, t.groups.ops.title, Building2, OPS),
    makeGroup(root, t.groups.finance.title, CreditCard, FINANCE),
    makeGroup(root, t.groups.system.title, Settings, SYSTEM),
  ];
}
