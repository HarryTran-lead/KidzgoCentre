// components/portal/menu/staffManager.ts
import {
  LayoutDashboard,
  UserCog,
  Users,
  CalendarRange,
  RefreshCw,
  FileText,
  NotebookText,
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
    [t.allocation, CalendarRange, "/schedule"],
    [t.makeup, RefreshCw, "/makeup"],
    [t.monthlyReport, FileText, "/monthly-report"],
    [t.studentProfiles, NotebookText, "/students"],
    [t.templates, FileText, "/templates"],
  ];

  return makeMenu(root, RAWS);
}
