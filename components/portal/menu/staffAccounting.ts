// components/portal/menu/staffAccounting.ts
import {
  LayoutDashboard,
  FileText,
  QrCode,
  AlertCircle,
  Undo2,
  BarChart3,
  ClipboardList,
} from "lucide-react";
import { makeMenu, type RawItem } from "./utils";
import type { MenuItem } from "./types";
import type { Locale } from "@/lib/i18n";
import { getMessages } from "@/lib/dict";

export function staffAccountingMenu(
  root: string,
  locale: Locale = "vi"
): MenuItem[] {
  const t = getMessages(locale).menuStaffAccounting.items;

  const RAWS: RawItem[] = [
    [t.dashboard, LayoutDashboard, ""],
    [t.invoices, FileText, "/invoices"],
    [t.payos, QrCode, "/payos"],
    [t.dues, AlertCircle, "/dues"],
    [t.adjustments, Undo2, "/adjustments"],
    [t.financeReports, BarChart3, "/reports"],
    [t.auditLog, ClipboardList, "/audit-log"],
  ];

  return makeMenu(root, RAWS);
}
