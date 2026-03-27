import {
  LayoutDashboard,
  UserCog,
  Users,
  CalendarRange,
  Clock3,
  RefreshCw,
  FileText,
  NotebookText,
  MessageSquare,
  Megaphone,
  BookOpenCheck,
  BookOpen,
  Image,
  Sparkles,
} from "lucide-react";
import { makeMenu, type RawItem } from "./utils";
import type { MenuItem } from "./types";
import type { Locale } from "@/lib/i18n";
import { getMessages } from "@/lib/dict";

export function staffManagerMenu(
  root: string,
  locale: Locale = "vi"
): MenuItem[] {
  const t = getMessages(locale).menuStaffManager.items;

  const raws: RawItem[] = [
    [t.dashboard, LayoutDashboard, ""],
    [t.accounts, UserCog, "/accounts"],
    [t.crm, Users, "/leads"],
    [t.allocation, CalendarRange, "/schedule"],
    [t.makeup, RefreshCw, "/makeup"],
    [t.pauseEnrollments, Clock3, "/pause-enrollments"],
    [t.lessonPlans, BookOpenCheck, "/lesson-plans"],
    [t.gamification, Sparkles, "/gamification"],
    [t.monthlyReport, FileText, "/monthly-report"],
    [t.tickets, MessageSquare, "/tickets"],
    [t.notifications, Megaphone, "/notifications"],
    [t.media, Image, "/media"],
    [t.studentProfiles, NotebookText, "/students"],
    [t.enrollments, BookOpen, "/enrollments"],
    [t.templates, FileText, "/templates"],
  ];

  return makeMenu(root, raws);
}
