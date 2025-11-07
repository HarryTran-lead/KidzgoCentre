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

const RAWS: RawItem[] = [
  ["Trang chủ", House, ""],
  ["Lịch học", CalendarCheck, "/schedule"],
  ["Điểm danh", CheckSquare, "/attendance"],
  ["Hồ sơ", User, "/profile"],
  ["Học phí", CreditCard, "/tuition"], // nếu app dùng /payments, đổi path này
  ["Bài tập", ClipboardList, "/assignments"],
  ["Tài liệu", BookOpen, "/materials"],
  ["Báo cáo", BarChart3, "/reports"],
  ["Phản hồi", MessageSquareMore, "/feedback"],
  ["Thông báo", Bell, "/notifications"],
];

export function studentMenu(root: string): MenuItem[] {
  return makeMenu(root, RAWS);
}
