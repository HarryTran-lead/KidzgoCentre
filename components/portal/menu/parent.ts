import { House, BarChart3, CreditCard, Bell, CalendarCheck, Shield } from "lucide-react";
import { makeMenu, type RawItem } from "./utils";
import type { MenuItem } from "./types";
import type { Locale } from "@/lib/i18n";
import { getMessages } from "@/lib/dict";

export function parentMenu(root: string, locale: Locale = "vi"): MenuItem[] {
  const t = getMessages(locale).menuParent.items;

  const RAWS: RawItem[] = [
    [t.home, House, ""],
    [t.progress, BarChart3, "/progress"],
    [t.attendance, CalendarCheck, "/attendance"],
    [t.tuition, CreditCard, "/tuition"],
    [t.notifications, Bell, "/notifications"],
    [t.security, Shield, "/approvals"],
  ];

  return makeMenu(root, RAWS);
}
