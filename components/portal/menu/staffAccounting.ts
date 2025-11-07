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

const RAWS: RawItem[] = [
  ["Dashboard",             LayoutDashboard, ""],
  ["Hóa đơn & phiếu thu",   FileText,       "/invoices"],
  ["Thanh toán PayOS",      QrCode,         "/payos"],
  ["Công nợ",               AlertCircle,    "/dues"],
  ["Điều chỉnh / Hoàn tiền",Undo2,          "/adjustments"],
  ["Báo cáo tài chính",     BarChart3,      "/reports"],
  ["Audit Log",             ClipboardList,  "/audit-log"],
];

export function staffAccountingMenu(root: string): MenuItem[] {
  return makeMenu(root, RAWS);
}
