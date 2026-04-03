import {
  Bell,
  CalendarClock,
  CheckSquare,
  ClipboardCheck,
  Clock4,
  FileText,
  Folder,
  LayoutDashboard,
  MessageCircle,
  NotebookText,
  Sparkles,
  User,
  BookOpenText,
} from "lucide-react";
import { makeMenu, type RawItem } from "./utils";
import type { MenuItem } from "./types";
import type { Locale } from "@/lib/i18n";
import { getMessages } from "@/lib/dict";

export function teacherMenu(root: string, locale: Locale = "vi"): MenuItem[] {
  const t = getMessages(locale).menuTeacher.items;

  const raws: RawItem[] = [
    [t.dashboard, LayoutDashboard, ""],
    [t.profile, User, "/profile"],
    [t.myClasses, NotebookText, "/classes"],
    [t.schedule, CalendarClock, "/schedule"],
    [t.subjects, BookOpenText, "/subjects"],
    [t.materials, Folder, "/materials"],
    [t.assignments, ClipboardCheck, "/assignments"],
    [t.gamification, Sparkles, "/gamification"],
    [t.attendance, CheckSquare, "/attendance"],
    [t.applications, MessageCircle, "/applications"],
    [t.feedback, FileText, "/feedback"],
    [t.timesheet, Clock4, "/timesheet"],
    [t.notifications, Bell, "/notifications"],
  ];

  return makeMenu(root, raws);
}
