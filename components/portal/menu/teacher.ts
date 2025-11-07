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

const RAWS: RawItem[] = [
  ["Tổng quan", LayoutDashboard, ""],
  ["Hồ sơ cá nhân", User, "/profile"],
  ["Lớp học của tôi", NotebookText, "/classes"],
  ["Lịch giảng dạy", CalendarClock, "/schedule"],
  ["Môn học & Tài liệu", BookOpenText, "/subjects"],
  ["Bài tập & Nộp bài", ClipboardCheck, "/assignments"],
  ["Điểm danh", CheckSquare, "/attendance"],
  ["Báo cáo & Feedback", MessageCircle, "/feedback"],
  ["Công giờ & Thu nhập", Clock4, "/timesheet"],
  ["Thông báo", Bell, "/notifications"],
];

export function teacherMenu(root: string): MenuItem[] {
  return makeMenu(root, RAWS);
}
