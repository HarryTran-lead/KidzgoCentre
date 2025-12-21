import {
  House,
  Users,
  Calendar,
  History,
  FileText,
  ShieldCheck,
  ClipboardList,
  GraduationCap,
  MessageSquare,
  FileCheck,
  BarChart3,
  Receipt,
  CreditCard,
  Wallet,
  DollarSign,
  Target,
  Flame,
  Star,
  TrendingUp,
  Award,
  Image,
  User,
  Bell,
  Ticket,
} from "lucide-react";
import { makeMenu, makeGroup, type RawItem } from "./utils";
import type { MenuItem } from "./types";
import type { Locale } from "@/lib/i18n";
import { getMessages } from "@/lib/dict";

export function parentMenu(root: string, locale: Locale = "vi"): MenuItem[] {
  const t = getMessages(locale).menuParent;

  // Home (flat item)
  const homeItem: MenuItem = {
    label: t.items.home,
    icon: House,
    href: root,
  };

  // 👶 Quản lý con
  const childManagementGroup = makeGroup(
    root,
    t.groups.childManagement,
    Users,
    [[t.items.manageChildren, Users, "/children"]],
    false
  );

  // 🗓️ Thời khóa biểu & Điểm danh
  const scheduleAttendanceGroup = makeGroup(
    root,
    t.groups.scheduleAttendance,
    Calendar,
    [
      [t.items.childSchedule, Calendar, "/schedule"],
      [t.items.childAttendance, History, "/attendance"],
      [t.items.leaveRequest, FileText, "/leave-request"],
      [t.items.makeupCredits, ShieldCheck, "/makeup-credits"],
    ],
    false
  );

  // 📚 Bài tập
  const homeworkGroup = makeGroup(
    root,
    t.groups.homework,
    ClipboardList,
    [
      [t.items.homeworkStatus, ClipboardList, "/homework"],
      [t.items.homeworkScores, GraduationCap, "/homework/scores"],
      [t.items.teacherComments, MessageSquare, "/homework/comments"],
    ],
    false
  );

  // 📝 Kiểm tra & Báo cáo
  const testsReportsGroup = makeGroup(
    root,
    t.groups.testsReports,
    FileCheck,
    [
      [t.items.placementTest, FileCheck, "/placement-test"],
      [t.items.testResults, BarChart3, "/tests"],
      [t.items.monthlyReports, FileText, "/reports"],
      [t.items.reportHistory, History, "/reports/history"],
    ],
    false
  );

  // 💳 Thanh toán
  const paymentGroup = makeGroup(
    root,
    t.groups.payment,
    CreditCard,
    [
      [t.items.invoices, Receipt, "/invoices"],
      [t.items.paymentStatus, DollarSign, "/payment/status"],
      [t.items.makePayment, Wallet, "/payment"],
      [t.items.paymentHistory, History, "/payment/history"],
    ],
    false
  );

  // 🎮 Gamification
  const gamificationGroup = makeGroup(
    root,
    t.groups.gamification,
    Target,
    [
      [t.items.childMissions, Target, "/missions"],
      [t.items.childStreak, Flame, "/streak"],
      [t.items.childStars, Star, "/stars"],
      [t.items.childXp, TrendingUp, "/xp"],
      [t.items.childLevel, Award, "/level"],
    ],
    false
  );

  // 🖼️ Media
  const mediaGroup = makeGroup(
    root,
    t.groups.media,
    Image,
    [
      [t.items.childMedia, User, "/media/child"],
      [t.items.classMedia, Image, "/media/class"],
    ],
    false
  );

  // 🔔 Thông báo & Hỗ trợ
  const notificationsSupportGroup = makeGroup(
    root,
    t.groups.notificationsSupport,
    Bell,
    [
      [t.items.importantNotifications, Bell, "/notifications"],
      [t.items.supportTicket, Ticket, "/support"],
    ],
    false
  );

  return [
    homeItem,
    childManagementGroup,
    scheduleAttendanceGroup,
    homeworkGroup,
    testsReportsGroup,
    paymentGroup,
    gamificationGroup,
    mediaGroup,
    notificationsSupportGroup,
  ];
}
