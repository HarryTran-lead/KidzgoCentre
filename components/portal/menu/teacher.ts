// components/portal/menu/teacher.ts
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
import { makeMenu, type RawItem } from "./utils";
import type { MenuItem } from "./types";
import type { Locale } from "@/lib/i18n";
import { getMessages } from "@/lib/dict";

export function teacherMenu(root: string, locale: Locale = "vi"): MenuItem[] {
  const t = getMessages(locale).menuTeacher.items;

  const RAWS: RawItem[] = [
    [t.dashboard, LayoutDashboard, ""],
    [t.profile, User, "/profile"],
    [t.myClasses, NotebookText, "/classes"],
    [t.schedule, CalendarClock, "/schedule"],
    [t.subjects, BookOpenText, "/subjects"],
    [t.assignments, ClipboardCheck, "/assignments"],
    [t.attendance, CheckSquare, "/attendance"],
    [t.feedback, MessageCircle, "/feedback"],
    [t.timesheet, Clock4, "/timesheet"],
    [t.notifications, Bell, "/notifications"],
  ];

  return makeMenu(root, RAWS);
}
