import {
  Award,
  Bell,
  BookOpen,
  Building2,
  CalendarClock,
  ClipboardCheck,
  CreditCard,
  FileText,
  GraduationCap,
  HelpCircle,
  MessageCircle,
  Smartphone,
  UserPlus,
  Users,
  Wrench,
} from "lucide-react";

export const FAQ_ICON_OPTIONS = [
  { name: "HelpCircle", component: HelpCircle, label: "Trợ giúp" },
  { name: "CreditCard", component: CreditCard, label: "Học phí" },
  { name: "CalendarClock", component: CalendarClock, label: "Lịch học" },
  { name: "ClipboardCheck", component: ClipboardCheck, label: "Điểm danh" },
  { name: "Smartphone", component: Smartphone, label: "Ứng dụng" },
  { name: "BookOpen", component: BookOpen, label: "Học tập" },
  { name: "UserPlus", component: UserPlus, label: "Tuyển sinh" },
  { name: "GraduationCap", component: GraduationCap, label: "Học vụ" },
  { name: "MessageCircle", component: MessageCircle, label: "Liên lạc" },
  { name: "Users", component: Users, label: "Học viên" },
  { name: "Award", component: Award, label: "Thành tích" },
  { name: "FileText", component: FileText, label: "Tài liệu" },
  { name: "Bell", component: Bell, label: "Thông báo" },
  { name: "Wrench", component: Wrench, label: "Kỹ thuật" },
  { name: "Building2", component: Building2, label: "Trung tâm" },
] as const;

const FAQ_ICON_MAP = Object.fromEntries(FAQ_ICON_OPTIONS.map((opt) => [opt.name, opt.component])) as Record<
  string,
  React.ComponentType<{ className?: string; size?: number }>
>;

type CategoryIconProps = {
  name?: string | null;
  size?: number;
  className?: string;
};

export function CategoryIcon({ name, size = 16, className = "" }: CategoryIconProps) {
  const IconComponent = name ? FAQ_ICON_MAP[name] : null;
  return IconComponent ? (
    <IconComponent size={size} className={className} />
  ) : (
    <HelpCircle size={size} className={className} />
  );
}
