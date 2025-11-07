// components/portal/menu/admin.ts
import {
  LayoutDashboard,
  BarChart3,
  Users,
  BookOpen,
  GraduationCap,
  Building2,
  CalendarRange,
  CalendarClock,
  ClipboardCheck,
  CreditCard,
  Inbox,
  Megaphone,
  Gift,
  BadgePercent,
  Settings,
} from "lucide-react";
import { makeMenu, makeGroup, type RawItem } from "./utils";
import type { MenuItem } from "./types";

export function adminMenu(root: string): MenuItem[] {
  // Các link nhanh (không nằm trong group)
  const QUICK: RawItem[] = [
    ["Tổng quan kinh doanh", BarChart3, ""],
    ["Tổng quan trung tâm", LayoutDashboard, "/center"],
  ];

  // Nhóm: Tuyển sinh
  const LEADS: RawItem[] = [
    ["Quản lý leads", Inbox, "/leads"],
    ["Quản lý tuyển sinh", Users, "/admissions"],
  ];

  // Nhóm: Chiến dịch & Khuyến mãi
  const CAMPAIGN: RawItem[] = [
    ["Tạo chiến dịch", Megaphone, "/campaigns/create"],
    ["Quản lý chiến dịch", Megaphone, "/campaigns"],
    ["Quản lý CT khuyến mãi", BadgePercent, "/promotions/programs"],
    ["Quản lý khuyến mãi", Gift, "/promotions"],
  ];

  // Nhóm: Học tập (gộp khóa học, lớp học, học viên)
  const LEARNING: RawItem[] = [
    // Khóa học
    ["Tạo khóa học", GraduationCap, "/courses/create"],
    ["Danh sách khóa học", GraduationCap, "/courses"],
    ["Đăng ký học", GraduationCap, "/courses/registrations"],
    ["Lịch sử đăng ký", GraduationCap, "/courses/registrations/history"],
    // Lớp học
    ["Tạo lớp học", BookOpen, "/classes/create"],
    ["Danh sách lớp học", BookOpen, "/classes"],
    ["Chuyển lớp (lớp học)", BookOpen, "/classes/transfer"],
    ["Kiểm tra lịch phòng học", BookOpen, "/classes/room-check"],
    // Học viên
    ["Danh sách học viên", Users, "/students"],
    ["Chuyển lớp (học viên)", Users, "/students/transfer"],
    ["Bảo lưu", Users, "/students/defer"],
  ];

  // Nhóm: Vận hành
  const OPS: RawItem[] = [
    ["Quản lý phòng học", Building2, "/rooms"],
    ["Lịch & Phân bổ", CalendarRange, "/schedule"],
    ["Học phí & Công nợ", CreditCard, "/fees"],
    ["Feedback lớp học", ClipboardCheck, "/feedback"],
    ["Ngoại khóa & Trại hè", CalendarClock, "/extracurricular"],
  ];

  // Nhóm: Hệ thống
  const SYSTEM: RawItem[] = [
    ["Quản lý tài khoản", Settings, "/accounts"],
    ["Quản lý giáo viên", Users, "/teachers"],
    ["Báo cáo", BarChart3, "/reports"],
    ["Cài đặt", Settings, "/settings"],
  ];

  // Trả ra: 2 mục nhanh + 5 nhóm
  return [
    ...makeMenu(root, QUICK),
    makeGroup(root, "Quản lý tuyển sinh", Inbox, LEADS),
    makeGroup(root, "Chiến dịch & Khuyến mãi", Megaphone, CAMPAIGN),
    makeGroup(root, "Học tập", GraduationCap, LEARNING), 
    makeGroup(root, "Vận hành", Building2, OPS),
    makeGroup(root, "Hệ thống", Settings, SYSTEM),
  ];
}
