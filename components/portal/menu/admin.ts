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
import { getMessages } from "@/lib/dict";
import type { Locale } from "@/lib/i18n";

export function adminMenu(root: string, locale: Locale = "vi"): MenuItem[] {
  const t = getMessages(locale).menuAdmin;

  const QUICK: RawItem[] = [
    [t.quick.businessOverview, BarChart3, ""],
    [t.quick.centerOverview, LayoutDashboard, "/center"],
  ];

  const LEADS: RawItem[] = [
    [t.groups.leads.manageLeads, Inbox, "/leads"],
    [t.groups.leads.admissions, Users, "/admissions"],
  ];

  const CAMPAIGN: RawItem[] = [
    [t.groups.campaign.createCampaign, Megaphone, "/campaigns/create"],
    [t.groups.campaign.manageCampaigns, Megaphone, "/campaigns"],
    [t.groups.campaign.promoPrograms, BadgePercent, "/promotions/programs"],
    [t.groups.campaign.promotions, Gift, "/promotions"],
  ];

  const LEARNING: RawItem[] = [
    [t.groups.learning.courses.create, GraduationCap, "/courses/create"],
    [t.groups.learning.courses.list, GraduationCap, "/courses"],
    [
      t.groups.learning.courses.registrations,
      GraduationCap,
      "/courses/registrations",
    ],
    [
      t.groups.learning.courses.registrationsHistory,
      GraduationCap,
      "/courses/registrations/history",
    ],
    [t.groups.learning.classes.create, BookOpen, "/classes/create"],
    [t.groups.learning.classes.list, BookOpen, "/classes"],
    [t.groups.learning.classes.transfer, BookOpen, "/classes/transfer"],
    [t.groups.learning.classes.roomCheck, BookOpen, "/classes/room-check"],
    [t.groups.learning.students.list, Users, "/students"],
    [t.groups.learning.students.transfer, Users, "/students/transfer"],
    [t.groups.learning.students.defer, Users, "/students/defer"],
  ];

  const OPS: RawItem[] = [
    [t.groups.ops.rooms, Building2, "/rooms"],
    [t.groups.ops.schedule, CalendarRange, "/schedule"],
    [t.groups.ops.fees, CreditCard, "/fees"],
    [t.groups.ops.feedback, ClipboardCheck, "/feedback"],
    [t.groups.ops.extracurricular, CalendarClock, "/extracurricular"],
  ];

  const SYSTEM: RawItem[] = [
    [t.groups.system.accounts, Settings, "/accounts"],
    [t.groups.system.teachers, Users, "/teachers"],
    [t.groups.system.reports, BarChart3, "/reports"],
    [t.groups.system.settings, Settings, "/settings"],
  ];

  return [
    ...makeMenu(root, QUICK),
    makeGroup(root, t.groups.leads.title, Inbox, LEADS),
    makeGroup(root, t.groups.campaign.title, Megaphone, CAMPAIGN),
    makeGroup(root, t.groups.learning.title, GraduationCap, LEARNING),
    makeGroup(root, t.groups.ops.title, Building2, OPS),
    makeGroup(root, t.groups.system.title, Settings, SYSTEM),
  ];
}
