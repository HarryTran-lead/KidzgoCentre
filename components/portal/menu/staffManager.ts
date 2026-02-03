// components/portal/menu/staffManager.ts
import {
  LayoutDashboard,
  UserCog,
  Users,
  CalendarRange,
  RefreshCw,
  FileText,
  NotebookText,
  MessageSquare,
  Megaphone,
  BookOpenCheck,
  Image,
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

  const RAWS: RawItem[] = [
    [t.dashboard, LayoutDashboard, ""],
    [t.accounts, UserCog, "/accounts"],
    [t.crm, Users, "/leads"],
    [t.placementTests, Users, "/placement-tests"],
    [t.allocation, CalendarRange, "/schedule"],
    [t.makeup, RefreshCw, "/makeup"],
    [t.lessonPlans, BookOpenCheck, "/lesson-plans"],
    [t.monthlyReport, FileText, "/monthly-report"],
    [t.tickets, MessageSquare, "/tickets"],
    [t.notifications, Megaphone, "/notifications"],
    [t.media, Image, "/media"],
    [t.studentProfiles, NotebookText, "/students"],
    [t.templates, FileText, "/templates"],
  ];

  return makeMenu(root, RAWS);
}
