import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckSquare,
  ClipboardCheck,
  FileText,
  Folder,
  GraduationCap,
  LayoutDashboard,
  MessageCircle,
  NotebookText,
  Route,
  Send,
  Sparkles,
  User,
  BookOpenText,
  CalendarRange,
  Image,
} from "lucide-react";
import { makeMenu, type RawItem, type MixedRawItem } from "./utils";
import type { MenuItem } from "./types";
import type { Locale } from "@/lib/i18n";
import { getMessages } from "@/lib/dict";

export function teacherMenu(root: string, locale: Locale = "vi"): MenuItem[] {
  const t = getMessages(locale).menuTeacher.items;

  const raws: MixedRawItem[] = [
    [t.dashboard, LayoutDashboard, ""],
    [t.profile, User, "/profile"],
    [t.myClasses, NotebookText, "/classes"],
    [t.schedule, CalendarClock, "/schedule"],
    ["Tiến trình chuyển chương trình", Route, "/program-progressions"],
    ["Tiến trình học thuật", GraduationCap, "/academic-progression"],
    [t.subjects, BookOpenText, "/subjects"],
    [t.materials, Folder, "/materials"],
    [t.media, Image, "/media"],
    [t.assignments, ClipboardCheck, "/assignments"],
    [t.gamification, Sparkles, "/gamification"],
    [t.attendance, CheckSquare, "/attendance"],
    [t.applications, MessageCircle, "/applications"],
    {
      group: t.feedbackGroup,
      icon: FileText,
      defaultOpen: false,
      items: [
        [t.feedbackMonthly, FileText, "/feedback/monthly-report"],
        [t.feedbackSession, CalendarRange, "/feedback/session-report"],
      ] as RawItem[],
    },
    [t.reportRequests, Send, "/report-requests"],
    [t.incidentReports, AlertTriangle, "/incident-reports"],
    [t.notifications, Bell, "/notifications"],
  ];

  return makeMenu(root, raws);
}