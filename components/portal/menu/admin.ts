import {
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  CalendarClock,
  CalendarRange,
  ClipboardCheck,
  CreditCard,
  FileText,
  Folder,
  GraduationCap,
  HelpCircle,
  Image,
  Inbox,
  LayoutDashboard,
  Send,
  Settings,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react";
import { makeGroup, makeMenu, type RawItem, type MixedRawItem } from "./utils";
import type { MenuItem } from "./types";
import type { GroupItem } from "./types";
import { getMessages } from "@/lib/dict";
import type { Locale } from "@/lib/i18n";

export function adminMenu(root: string, locale: Locale = "vi"): MenuItem[] {
  const t = getMessages(locale).menuAdmin;

  const quick: RawItem[] = [
    [t.quick.businessOverview, LayoutDashboard, ""],
  ];
  const leads: RawItem[] = [[t.groups.leads.manageLeads, Inbox, "/leads"]];
  const learning: RawItem[] = [
    [t.groups.learning.coursesSystem.list, GraduationCap, "/courses/system"],
    [t.groups.learning.coursesBranch.list, GraduationCap, "/courses/branch"],
    [t.groups.learning.tuitionPlans.list, GraduationCap, "/tuition-plans"],
    [t.groups.learning.registrations.list, UserCheck, "/registrations"],
    [t.groups.learning.classes.list, BookOpen, "/classes"],
  ];
  const opsItems: RawItem[] = [
    [t.groups.ops.rooms, Building2, "/rooms"],
    [t.groups.ops.schedule, CalendarRange, "/schedule"],
    [t.groups.ops.pauseEnrollments, CalendarClock, "/pause-enrollments"],
    [t.groups.ops.documents, FileText, "/documents"],
    [t.groups.ops.teachingMaterials, Folder, "/materials"],
    [t.groups.ops.media, Image, "/media"],
    [t.groups.ops.reportRequests, Send, "/report-requests"],
  ];
  const system: RawItem[] = [
    [t.groups.system.accounts, Settings, "/accounts"],
    [t.groups.system.branches, Building2, "/branches"],
    [t.groups.system.blogs, FileText, "/blogs"],
    [t.groups.system.questionBank, HelpCircle, "/question-bank"],
    [t.groups.system.reports, BarChart3, "/reports"],
    [t.groups.system.gamification, Sparkles, "/gamification"],
    [t.groups.system.notifications, Bell, "/notifications"],
    [t.groups.system.settings, Settings, "/settings"],
    ["Cấu hình thanh toán", CreditCard, "/payment-setting"],
  ];

  // Create feedback group item
  const feedbackGroup: GroupItem = {
    group: t.groups.ops.feedback.title,
    icon: ClipboardCheck,
    items: [
      {
        label: t.groups.ops.feedback.monthlyReport,
        icon: ClipboardCheck,
        href: root + "/feedback/monthly",
      },
      {
        label: t.groups.ops.feedback.sessionReport,
        icon: ClipboardCheck,
        href: root + "/feedback/session",
      },
    ],
  };

  return [
    ...makeMenu(root, quick),
    makeGroup(root, t.groups.leads.title, Inbox, leads),
    makeGroup(root, t.groups.learning.title, GraduationCap, learning),
    makeGroup(root, t.groups.ops.title, Building2, opsItems),
    feedbackGroup,
    makeGroup(root, t.groups.system.title, Settings, system),
  ];
}
