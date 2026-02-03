import {
  Settings,
  CalendarCheck2,
  BookOpen,
  FileSpreadsheet,
  Banknote,
  ImageIcon,
  BellRing,
  HeadphonesIcon,
} from "lucide-react";
import type { MenuItem } from "./types";
import type { Locale } from "@/lib/i18n";
import { getMessages } from "@/lib/dict";

export function parentMenu(root: string, locale: Locale = "vi"): MenuItem[] {
  const t = getMessages(locale).menuParent;

  // 🗓️ Lịch học & Điểm danh
  const scheduleItem: MenuItem = {
    label: t.items.schedule,
    icon: CalendarCheck2,
    href: `${root}/schedule`,
  };

  // 📚 Bài tập
  const homeworkItem: MenuItem = {
    label: t.items.homework,
    icon: BookOpen,
    href: `${root}/homework`,
  };

  // 📝 Kiểm tra & Báo cáo
  const testsReportsItem: MenuItem = {
    label: t.items.testsReports,
    icon: FileSpreadsheet,
    href: `${root}/tests`,
  };

  // 💳 Thanh toán
  const paymentItem: MenuItem = {
    label: t.items.payment,
    icon: Banknote,
    href: `${root}/payment`,
  };

  // 🖼️ Media
  const mediaItem: MenuItem = {
    label: t.items.media,
    icon: ImageIcon,
    href: `${root}/media`,
  };

  // 🔔 Thông báo
  const notificationsItem: MenuItem = {
    label: t.items.notifications,
    icon: BellRing,
    href: `${root}/notifications`,
  };

  // 🆘 Hỗ trợ
  const supportItem: MenuItem = {
    label: t.items.support,
    icon: HeadphonesIcon,
    href: `${root}/support`,
  };

  // ⚙️ Tài khoản
  const accountItem: MenuItem = {
    label: t.items.account,
    icon: Settings,
    href: `${root}/account`,
  };

  return [
    scheduleItem,
    homeworkItem,
    testsReportsItem,
    paymentItem,
    mediaItem,
    notificationsItem,
    supportItem,
    accountItem,
  ];
}
