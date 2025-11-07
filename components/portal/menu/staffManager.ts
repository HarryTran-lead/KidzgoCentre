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

const RAWS: RawItem[] = [
  ["Dashboard", LayoutDashboard, ""],
  ["Quản lý tài khoản", UserCog, "/accounts"],
  ["Lead / CRM", Users, "/leads"],
  ["Điều phối lịch/lớp/phòng", CalendarRange, "/schedule"],
  ["Bù (make-up)", RefreshCw, "/makeup"],
  ["Báo cáo tháng", FileText, "/monthly-report"],
  ["Hồ sơ học sinh", NotebookText, "/students"],
  ["Mẫu thông báo", FileText, "/templates"],
];

export function staffManagerMenu(root: string): MenuItem[] {
  return makeMenu(root, RAWS);
}
