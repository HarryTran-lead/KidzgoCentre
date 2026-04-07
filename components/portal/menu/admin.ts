import {
  BarChart3,
  Bell,
  BookOpen,
  Building,
  Building2,
  CalendarClock,
  CalendarRange,
  ClipboardCheck,
  FileText,
  Folder,
  GraduationCap,
  HelpCircle,
  Inbox,
  LayoutDashboard,
  Send,
  Settings,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react";
import { makeGroup, makeMenu, type RawItem } from "./utils";
import type { MenuItem } from "./types";
import { getMessages } from "@/lib/dict";
import type { Locale } from "@/lib/i18n";

export function adminMenu(root: string, locale: Locale = "vi"): MenuItem[] {
  const t = getMessages(locale).menuAdmin;

  const quick: RawItem[] = [
    [t.quick.businessOverview, LayoutDashboard, ""],
    [t.quick.centerOverview, Building, "/center"],
  ];
  const leads: RawItem[] = [[t.groups.leads.manageLeads, Inbox, "/leads"]];
  const learning: RawItem[] = [
    [t.groups.learning.courses.list, GraduationCap, "/courses"],
    [t.groups.learning.tuitionPlans.list, GraduationCap, "/tuition-plans"],
    [t.groups.learning.registrations.list, UserCheck, "/registrations"],
    [t.groups.learning.classes.list, BookOpen, "/classes"],
    [t.groups.learning.students.list, Users, "/students"],
  ];
  const ops: RawItem[] = [
    [t.groups.ops.rooms, Building2, "/rooms"],
    [t.groups.ops.schedule, CalendarRange, "/schedule"],
    [t.groups.ops.pauseEnrollments, CalendarClock, "/pause-enrollments"],
    [t.groups.ops.feedback, ClipboardCheck, "/feedback"],
    [t.groups.ops.extracurricular, CalendarClock, "/extracurricular"],
    [t.groups.ops.documents, FileText, "/documents"],
    [t.groups.ops.teachingMaterials, Folder, "/materials"],
    [t.groups.ops.reportRequests, Send, "/report-requests"],
  ];
  const system: RawItem[] = [
    [t.groups.system.accounts, Settings, "/accounts"],
    [t.groups.system.teachers, Users, "/teachers"],
    [t.groups.system.branches, Building2, "/branches"],
    [t.groups.system.blogs, FileText, "/blogs"],
    [t.groups.system.questionBank, HelpCircle, "/question-bank"],
    [t.groups.system.reports, BarChart3, "/reports"],
    [t.groups.system.gamification, Sparkles, "/gamification"],
    [t.groups.system.notifications, Bell, "/notifications"],
    [t.groups.system.settings, Settings, "/settings"],
  ];

  return [
    ...makeMenu(root, quick),
    makeGroup(root, t.groups.leads.title, Inbox, leads),
    makeGroup(root, t.groups.learning.title, GraduationCap, learning),
    makeGroup(root, t.groups.ops.title, Building2, ops),
    makeGroup(root, t.groups.system.title, Settings, system),
  ];
}
