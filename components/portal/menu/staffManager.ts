import {
  BookOpen,
  BookOpenCheck,
  CalendarRange,
  Clock3,
  FileText,
  Folder,
  Image,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  NotebookText,
  RefreshCw,
  Sparkles,
  UserCog,
  Users,
  UserCircle,
} from "lucide-react";
import { makeMenu, type MixedRawItem } from "./utils";
import type { MenuItem } from "./types";
import type { Locale } from "@/lib/i18n";
import { getMessages } from "@/lib/dict";

export function staffManagerMenu(root: string, locale: Locale = "vi"): MenuItem[] {
  const t = getMessages(locale).menuStaffManager.items;

  const raws: MixedRawItem[] = [
    [t.dashboard, LayoutDashboard, ""],
    [t.accounts, UserCog, "/accounts"],
    [t.crm, Users, "/leads"],
    [t.allocation, CalendarRange, "/schedule"],
    [t.makeup, RefreshCw, "/makeup"],
    [t.pauseEnrollments, Clock3, "/pause-enrollments"],
    [t.lessonPlans, BookOpenCheck, "/lesson-plans"],
    [t.materials, Folder, "/materials"],
    [t.gamification, Sparkles, "/gamification"],
    {
      group: t.reports,
      icon: FileText,
      defaultOpen: true,
      items: [
        [t.monthlyReport, FileText, "/monthly-report"],
        [t.sessionReport, CalendarRange, "/session-report"],
      ],
    },
    [t.tickets, MessageSquare, "/tickets"],
    [t.notifications, Megaphone, "/notifications"],
    [t.media, Image, "/media"],
    [t.studentProfiles, NotebookText, "/students"],
    [t.enrollments, BookOpen, "/enrollments"],
    [t.templates, FileText, "/templates"],
    [t.profile, UserCircle, "/profile"],
  ];

  return makeMenu(root, raws);
}
