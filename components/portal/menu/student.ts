// components/portal/menu/student.ts
import {
  House,
  CalendarCheck,
  History,
  ClipboardList,
  Upload,
  GraduationCap,
  MessageSquare,
  FileCheck,
  FileText,
  Target,
  Flame,
  Star,
  TrendingUp,
  Award,
  Store,
  Image,
  User,
  Bell,
  Calendar,
} from "lucide-react";
import { makeMenu, makeGroup, type RawItem } from "./utils";
import type { MenuItem } from "./types";
import type { Locale } from "@/lib/i18n";
import { getMessages } from "@/lib/dict";

export function studentMenu(root: string, locale: Locale = "vi"): MenuItem[] {
  const t = getMessages(locale).menuStudent;

  // Home (flat item)
  const homeItem: MenuItem = {
    label: t.items.home,
    icon: House,
    href: root,
  };

  // 🗓️ Thời khóa biểu
  const scheduleItem: MenuItem = {
    label: t.items.schedule,
    icon: Calendar,
    href: `${root}/schedule`,
  };

  // ✅ Điểm danh
  const attendanceItem: MenuItem = {
    label: t.items.attendance,
    icon: History,
    href: `${root}/attendance`,
  };

  // 📚 Bài tập
  const homeworkItem: MenuItem = {
    label: t.items.homework,
    icon: ClipboardList,
    href: `${root}/homework`,
  };

  // 📝 Kiểm tra & Báo cáo
  const testsReportsGroup = makeGroup(
    root,
    t.groups.testsReports,
    FileCheck,
    [
      [t.items.testResults, FileCheck, "/tests"],
      [t.items.monthlyReports, FileText, "/reports"],
    ],
    false
  );

  // 🎮 Gamification
  const gamificationGroup = makeGroup(
    root,
    t.groups.gamification,
    Target,
    [
      [t.items.missions, Target, "/missions"],
      [t.items.streak, Flame, "/streak"],
      [t.items.stars, Star, "/stars"],
      [t.items.xp, TrendingUp, "/xp"],
      [t.items.level, Award, "/level"],
      [t.items.rewardStore, Store, "/rewards"],
    ],
    false
  );

  // 🖼️ Media
  const mediaGroup = makeGroup(
    root,
    t.groups.media,
    Image,
    [
      [t.items.classMedia, Image, "/media/class"],
      [t.items.personalMedia, User, "/media/personal"],
    ],
    false
  );

  // 🔔 Thông báo
  const notificationsGroup = makeGroup(
    root,
    t.groups.notifications,
    Bell,
    [
      [t.items.homeworkNotifications, ClipboardList, "/notifications/homework"],
      [t.items.scheduleNotifications, Calendar, "/notifications/schedule"],
    ],
    false
  );

  return [
    homeItem,
    scheduleItem,
    attendanceItem,
    homeworkItem,
    testsReportsGroup,
    gamificationGroup,
    mediaGroup,
    notificationsGroup,
  ];
}
