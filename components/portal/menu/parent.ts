import {
  Settings,
  CalendarCheck2,
  CalendarRange,
  BookOpen,
  FileSpreadsheet,
  Banknote,
  ImageIcon,
  BellRing,
  HeadphonesIcon,
  Sparkles,
  UserCircle,
} from "lucide-react";
import type { MenuItem } from "./types";
import type { Locale } from "@/lib/i18n";
import { getMessages } from "@/lib/dict";

export function parentMenu(root: string, locale: Locale = "vi"): MenuItem[] {
  const t = getMessages(locale).menuParent;

  const scheduleItem: MenuItem = {
    label: t.items.schedule,
    icon: CalendarCheck2,
    href: `${root}/schedule`,
  };

  const leaveRequestItem: MenuItem = {
    label: t.items.LeaveRequest,
    icon: CalendarCheck2,
    href: `${root}/attendance`,
  };

  const pauseEnrollmentItem: MenuItem = {
    label: t.items.pauseEnrollment,
    icon: CalendarRange,
    href: `${root}/enrollment-pause`,
  };

  const homeworkItem: MenuItem = {
    label: t.items.homework,
    icon: BookOpen,
    href: `${root}/homework`,
  };

  const gamificationItem: MenuItem = {
    label: t.items.gamification,
    icon: Sparkles,
    href: `${root}/gamification`,
  };

  const testsReportsItem: MenuItem = {
    label: t.items.testsReports,
    icon: FileSpreadsheet,
    href: `${root}/tests`,
  };

  const paymentItem: MenuItem = {
    label: t.items.payment,
    icon: Banknote,
    href: `${root}/payment`,
  };

  const mediaItem: MenuItem = {
    label: t.items.media,
    icon: ImageIcon,
    href: `${root}/media`,
  };

  const notificationsItem: MenuItem = {
    label: t.items.notifications,
    icon: BellRing,
    href: `${root}/notifications`,
  };

  const supportItem: MenuItem = {
    label: t.items.support,
    icon: HeadphonesIcon,
    href: `${root}/support`,
  };

  const profileItem: MenuItem = {
    label: t.items.profile,
    icon: Settings,
    href: `${root}/profile`,
  };

  return [
    scheduleItem,
    homeworkItem,
    gamificationItem,
    testsReportsItem,
    paymentItem,
    mediaItem,
    notificationsItem,
    supportItem,
    leaveRequestItem,
    pauseEnrollmentItem,
    profileItem,
  ];
}
