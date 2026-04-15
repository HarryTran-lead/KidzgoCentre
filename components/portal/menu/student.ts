// components/portal/menu/student.ts
import {
  House,
  CalendarCheck,
  History,
  ClipboardList,
  Bot,
  Mic,
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
  Crown,
  MessageCircle,
} from "lucide-react";
import { makeMenu, makeGroup, type RawItem } from "./utils";
import type { MenuItem } from "./types";
import type { Locale } from "@/lib/i18n";
import { getMessages } from "@/lib/dict";

export function studentMenu(root: string, locale: Locale = "vi"): MenuItem[] {
  const t = getMessages(locale).menuStudent;

  // 👑 Tất cả (All)
  const allItem: MenuItem = {
    label: t.items.all,
    icon: Crown,
    href: root,
  };

  // 🗓️ Lịch học (TKB)
  const scheduleItem: MenuItem = {
    label: t.items.schedule,
    icon: Calendar,
    href: `${root}/schedule`,
    badge: 2,
  };

  // ✅ Điểm danh
  const attendanceItem: MenuItem = {
    label: t.items.attendance,
    icon: CalendarCheck,
    href: `${root}/attendance`,
    badge: 1,
  };

  // 📚 Bài tập
  const homeworkItem: MenuItem = {
    label: t.items.homework,
    icon: ClipboardList,
    href: `${root}/homework`,
  };

  const aiTutorItem: MenuItem = {
    label: t.items.aiTutor,
    icon: Bot,
    href: `${root}/ai-tutor`,
  };

  const aiSpeakingItem: MenuItem = {
    label: t.items.aiSpeaking,
    icon: Mic,
    href: `${root}/ai-speaking`,
  };

  // 📊 Báo cáo & Kiểm tra
  const reportsTestsGroup = makeGroup(
    root,
    t.groups.reportsTests,
    FileText,
    [
      [t.items.monthlyReports, FileText, "/reports"],
      [t.items.testResults, FileCheck, "/tests"],
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
      [t.items.classMedia, Image, "/media?tab=class"],
      [t.items.personalMedia, User, "/media?tab=personal"],
    ],
    false
  );

  // 💬 Applications
  const applicationsGroup = makeGroup(
    root,
    t.groups.applications,
    MessageCircle,
    [
      [t.items.messages, MessageSquare, "/messages"],
      [t.items.notifications, Bell, "/notifications"],
    ],
    false
  );

  return [
    allItem,
    scheduleItem,
    attendanceItem,
    homeworkItem,
    aiTutorItem,
    aiSpeakingItem,
    reportsTestsGroup,
    gamificationGroup,
    mediaGroup,
    applicationsGroup,
  ];
}
