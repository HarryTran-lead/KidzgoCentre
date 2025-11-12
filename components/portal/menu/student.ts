// components/portal/menu/student.ts
import {
  House,
  CalendarCheck,
  CheckSquare,
  User,
  CreditCard,
  ClipboardList,
  BookOpen,
  BarChart3,
  MessageSquareMore,
  Bell,
} from "lucide-react";
import { makeMenu, type RawItem } from "./utils";
import type { MenuItem } from "./types";
import type { Locale } from "@/lib/i18n";
import { getMessages } from "@/lib/dict";

export function studentMenu(root: string, locale: Locale = "vi"): MenuItem[] {
  const t = getMessages(locale).menuStudent.items;

  const RAWS: RawItem[] = [
    [t.home, House, ""],
    [t.schedule, CalendarCheck, "/schedule"],
    [t.attendance, CheckSquare, "/attendance"],
    [t.profile, User, "/profile"],
    [t.tuition, CreditCard, "/tuition"],
    [t.assignments, ClipboardList, "/assignments"],
    [t.materials, BookOpen, "/materials"],
    [t.reports, BarChart3, "/reports"],
    [t.feedback, MessageSquareMore, "/feedback"],
    [t.notifications, Bell, "/notifications"],
  ];

  return makeMenu(root, RAWS);
}
