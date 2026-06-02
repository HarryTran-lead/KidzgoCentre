"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BadgePercent,
  Bell,
  BookOpen,
  ChevronRight,
  Clock3,
  Edit2,
  Loader2,
  Megaphone,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
  Building2,
  MapPin,
  CheckCircle,
  XCircle,
  Calendar,
  Tag,
  AlertCircle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { fetchBroadcastHistory, fetchNotificationTemplates } from "@/lib/api/notificationService";
import {
  getGamificationSettings,
  updateGamificationSettings,
} from "@/lib/api/gamificationService";
import type { GamificationSettingsConfig } from "@/types/gamification";
import { getAllUsers } from "@/lib/api/userService";
import {
  extractProgramMonthlyLeaveLimit,
  fetchAdminProgramDetail,
  fetchAdminPrograms,
  updateAdminProgramMonthlyLeaveLimit,
} from "@/app/api/admin/programs";
import type { CourseRow, ProgramDetail } from "@/types/admin/programs";
import type { User } from "@/types/admin/user";
import type { NotificationCampaign } from "@/types/notification";

type TemplateItem = {
  id: string;
  code?: string | null;
  title?: string | null;
  content?: string | null;
  channel?: string | null;
  isActive?: boolean | null;
};

type RoleSummary = {
  total: number;
  active: number;
  inactive: number;
  Admin: number;
  Teacher: number;
  Parent: number;
  ManagementStaff: number;
};

type Tone = "emerald" | "amber" | "blue" | "purple";

const EMPTY_ROLE_SUMMARY: RoleSummary = {
  total: 0,
  active: 0,
  inactive: 0,
  Admin: 0,
  Teacher: 0,
  Parent: 0,
  ManagementStaff: 0,
};

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function parseNonNegativeInteger(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return null;
  return parsed;
}

function parsePositiveInteger(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

function getLeaveLimitScopeHint(value?: { isMakeup?: boolean | null; isSupplementary?: boolean | null } | null) {
  if (value?.isMakeup || value?.isSupplementary) {
    return "Chương trình bù/phụ trợ vẫn dùng leave limit theo khung chương trình hiện tại; FE không còn coi đây là nhóm tự miễn giới hạn.";
  }

  return "Các level như Starter, Movers... hiện vẫn kế thừa giới hạn nghỉ từ khung chương trình đang chọn.";
}

function formatRelativeTime(value?: string | null) {
  if (!value) return "Không có dữ liệu";

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "Không rõ thời gian";

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} ngày trước`;

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function pickUsers(response: { data?: any }): User[] {
  if (Array.isArray(response?.data?.items)) {
    return response.data.items as User[];
  }
  if (Array.isArray(response?.data?.users)) {
    return response.data.users as User[];
  }
  if (Array.isArray(response?.data)) {
    return response.data as User[];
  }
  return [];
}

function buildRoleSummary(users: User[], summary?: any): RoleSummary {
  const counts = users.reduce<RoleSummary>(
    (acc, user) => {
      acc.total += 1;
      if (user.isActive) acc.active += 1;
      else acc.inactive += 1;

      if (user.role === "Admin") acc.Admin += 1;
      if (user.role === "Teacher") acc.Teacher += 1;
      if (user.role === "Parent") acc.Parent += 1;
      if (user.role === "ManagementStaff") acc.ManagementStaff += 1;

      return acc;
    },
    { ...EMPTY_ROLE_SUMMARY }
  );

  if (!summary || typeof summary !== "object") {
    return counts;
  }

  const active = Number(summary.totalActive);
  const inactive = Number(summary.totalInactive);
  const total =
    Number(summary.totalAdmins) +
    Number(summary.totalTeachers) +
    Number(summary.totalParents) +
    Number(summary.totalStaff);

  return {
    total: Number.isFinite(total) && total > 0 ? total : counts.total,
    active: Number.isFinite(active) ? active : counts.active,
    inactive: Number.isFinite(inactive) ? inactive : counts.inactive,
    Admin: Number.isFinite(Number(summary.totalAdmins))
      ? Number(summary.totalAdmins)
      : counts.Admin,
    Teacher: Number.isFinite(Number(summary.totalTeachers))
      ? Number(summary.totalTeachers)
      : counts.Teacher,
    Parent: Number.isFinite(Number(summary.totalParents))
      ? Number(summary.totalParents)
      : counts.Parent,
    ManagementStaff: Number.isFinite(Number(summary.totalStaff))
      ? Number(summary.totalStaff)
      : counts.ManagementStaff,
  };
}

function normalizeTemplate(item: any, index: number): TemplateItem {
  const rawActive = item?.isActive;

  return {
    id: String(item?.id ?? item?.code ?? item?.title ?? `template-${index}`),
    code: typeof item?.code === "string" ? item.code : null,
    title: typeof item?.title === "string" ? item.title : null,
    content: typeof item?.content === "string" ? item.content : null,
    channel: typeof item?.channel === "string" ? item.channel : null,
    isActive:
      typeof rawActive === "boolean"
        ? rawActive
        : rawActive === undefined || rawActive === null
        ? null
        : Boolean(rawActive),
  };
}

function getStatusBadgeClass(tone: Tone) {
  if (tone === "emerald") {
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  }
  if (tone === "amber") {
    return "bg-amber-50 text-amber-700 border border-amber-200";
  }
  if (tone === "blue") {
    return "bg-blue-50 text-blue-700 border border-blue-200";
  }
  return "bg-purple-50 text-purple-700 border border-purple-200";
}

function getChannelLabel(channel?: string | null) {
  if (channel === "Push") return "Push";
  if (channel === "Email") return "Email";
  if (channel === "ZaloOa") return "Zalo OA";
  return "Trong ứng dụng";
}

function getAudienceLabel(audience: NotificationCampaign["audience"]) {
  if (audience === "all") return "Toàn hệ thống";
  if (audience === "family") return "Phụ huynh + Học viên";
  if (audience === "teaching") return "Giáo viên";
  if (audience === "management") return "Khối quản lý";
  return audience;
}

function getActivityVisual(kind: NotificationCampaign["kind"]) {
  if (kind === "schedule") {
    return {
      icon: <Clock3 size={14} />,
      cls: "bg-blue-50 text-blue-600",
    };
  }
  if (kind === "payment") {
    return {
      icon: <BadgePercent size={14} />,
      cls: "bg-emerald-50 text-emerald-600",
    };
  }
  if (kind === "report") {
    return {
      icon: <BookOpen size={14} />,
      cls: "bg-purple-50 text-purple-600",
    };
  }
  return {
    icon: <Megaphone size={14} />,
    cls: "bg-red-50 text-red-600",
  };
}

// Modern Stat Card Component
function ModernStatCard({
  icon,
  title,
  value,
  subtitle,
  color = "red"
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle?: string;
  color?: "red" | "gray" | "black" | "green";
}) {
  const iconBgClasses = {
    red: "from-red-600 to-red-700",
    gray: "from-gray-600 to-gray-700",
    black: "from-gray-800 to-gray-900",
    green: "from-emerald-600 to-teal-600",
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl bg-gradient-to-r from-red-600 to-red-700"></div>
      <div className="relative flex items-center gap-3">
        <span className={`w-10 h-10 rounded-xl bg-gradient-to-br ${iconBgClasses[color]} grid place-items-center`}>
          <span className="text-white">{icon}</span>
        </span>

        <div>
          <div className="text-sm text-gray-600">{title}</div>
          <div className="text-2xl font-extrabold text-gray-900">{value}</div>
          {subtitle && <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const params = useParams();
  const localeParam = params?.locale;
  const locale =
    typeof localeParam === "string"
      ? localeParam
      : Array.isArray(localeParam)
      ? localeParam[0]
      : "vi";
  const adminBase = `/${locale}/portal/admin`;

  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [gamificationLoaded, setGamificationLoaded] = useState(false);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [programsLoaded, setProgramsLoaded] = useState(false);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);
  const [broadcastsLoaded, setBroadcastsLoaded] = useState(false);

  const [gamification, setGamification] = useState<GamificationSettingsConfig | null>(null);
  const [gamificationDraft, setGamificationDraft] = useState({
    checkInRewardStars: "0",
    checkInRewardExp: "0",
  });

  const [userSummary, setUserSummary] = useState<RoleSummary>(EMPTY_ROLE_SUMMARY);
  const [programs, setPrograms] = useState<CourseRow[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [programDetail, setProgramDetail] = useState<ProgramDetail | null>(null);
  const [programDetailLoading, setProgramDetailLoading] = useState(false);
  const [programDetailError, setProgramDetailError] = useState<string | null>(null);
  const [leaveLimitDraft, setLeaveLimitDraft] = useState("2");

  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [broadcasts, setBroadcasts] = useState<NotificationCampaign[]>([]);
  const [loadErrors, setLoadErrors] = useState<string[]>([]);

  const loadSettingsData = async () => {
    setIsLoading(true);
    setLoadErrors([]);

    const errors: string[] = [];

    const [
      gamificationResult,
      usersResult,
      programsResult,
      templatesResult,
      broadcastsResult,
    ] = await Promise.allSettled([
      getGamificationSettings(),
      getAllUsers({ pageNumber: 1, pageSize: 500 }),
      fetchAdminPrograms(),
      fetchNotificationTemplates(),
      fetchBroadcastHistory("Admin"),
    ]);

    if (gamificationResult.status === "fulfilled") {
      setGamification(gamificationResult.value);
      setGamificationDraft({
        checkInRewardStars: String(gamificationResult.value.checkInRewardStars),
        checkInRewardExp: String(gamificationResult.value.checkInRewardExp),
      });
      setGamificationLoaded(true);
    } else {
      setGamificationLoaded(false);
      errors.push("Không tải được cấu hình gamification.");
    }

    if (usersResult.status === "fulfilled") {
      const response = usersResult.value;
      const success = response?.success !== false && response?.isSuccess !== false;

      if (success && response?.data) {
        setUserSummary(buildRoleSummary(pickUsers(response), response.data.summary));
        setUsersLoaded(true);
      } else {
        setUsersLoaded(false);
        errors.push(response?.message || "Không tải được thông tin tài khoản.");
      }
    } else {
      setUsersLoaded(false);
      errors.push("Không tải được thông tin tài khoản.");
    }

    if (programsResult.status === "fulfilled") {
      const nextPrograms = programsResult.value ?? [];
      setPrograms(nextPrograms);
      setSelectedProgramId((current) => {
        if (current && nextPrograms.some((item) => item.id === current)) {
          return current;
        }
        return nextPrograms[0]?.id ?? "";
      });
      setProgramsLoaded(true);
    } else {
      setProgramsLoaded(false);
      errors.push("Không tải được danh sách chương trình.");
    }

    if (templatesResult.status === "fulfilled") {
      const nextTemplates = Array.isArray(templatesResult.value)
        ? templatesResult.value.map(normalizeTemplate)
        : [];
      setTemplates(nextTemplates);
      setTemplatesLoaded(true);
    } else {
      setTemplatesLoaded(false);
      errors.push("Không tải được mẫu thông báo.");
    }

    if (broadcastsResult.status === "fulfilled") {
      const nextBroadcasts = [...broadcastsResult.value].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setBroadcasts(nextBroadcasts);
      setBroadcastsLoaded(true);
    } else {
      setBroadcastsLoaded(false);
      errors.push("Không tải được lịch sử phát tin.");
    }

    setLoadErrors(errors);
    setIsLoading(false);
  };

  useEffect(() => {
    setIsPageLoaded(true);
    void loadSettingsData();
  }, []);

  useEffect(() => {
    if (!selectedProgramId) {
      setProgramDetail(null);
      setProgramDetailError(null);
      setLeaveLimitDraft("");
      return;
    }

    let cancelled = false;

    const loadProgramDetail = async () => {
      setProgramDetailLoading(true);
      setProgramDetailError(null);

      try {
        const detail = await fetchAdminProgramDetail(selectedProgramId);
        if (cancelled) return;

        setProgramDetail(detail);
        const defaultLimit = 2;
        const resolvedLimit = extractProgramMonthlyLeaveLimit(detail) ?? defaultLimit;
        setLeaveLimitDraft(resolvedLimit !== null ? String(resolvedLimit) : "");
      } catch (error) {
        if (cancelled) return;

        setProgramDetail(null);
        setProgramDetailError(
          error instanceof Error
            ? error.message
            : "Không tải được chi tiết chương trình."
        );
        setLeaveLimitDraft("");
      } finally {
        if (!cancelled) {
          setProgramDetailLoading(false);
        }
      }
    };

    void loadProgramDetail();

    return () => {
      cancelled = true;
    };
  }, [selectedProgramId]);

  const selectedProgramItem = programs.find((item) => item.id === selectedProgramId) ?? null;
  const currentLeaveLimit = programDetail
    ? extractProgramMonthlyLeaveLimit(programDetail)
    : null;
  const resolvedLeaveLimit = currentLeaveLimit ?? 2;
  const leaveLimitScopeHint = getLeaveLimitScopeHint(programDetail ?? selectedProgramItem);
  const selectedProgramName = selectedProgramItem?.name ?? "Chưa chọn chương trình";

  const parsedStars = parseNonNegativeInteger(gamificationDraft.checkInRewardStars);
  const parsedExp = parseNonNegativeInteger(gamificationDraft.checkInRewardExp);
  const parsedLeaveLimit = parsePositiveInteger(leaveLimitDraft);

  const hasGamificationChanges =
    gamification !== null &&
    parsedStars !== null &&
    parsedExp !== null &&
    (parsedStars !== gamification.checkInRewardStars ||
      parsedExp !== gamification.checkInRewardExp);

  const hasLeaveLimitChanges =
    Boolean(selectedProgramId) &&
    parsedLeaveLimit !== null &&
    parsedLeaveLimit !== resolvedLeaveLimit;

  const hasPendingChanges = hasGamificationChanges || hasLeaveLimitChanges;

  const syncedSectionCount = [
    gamificationLoaded,
    usersLoaded,
    programsLoaded,
    templatesLoaded,
    broadcastsLoaded,
  ].filter(Boolean).length;

  const activeTemplateCount = templates.filter((item) => item.isActive !== false).length;
  const templateLabels = Array.from(
    new Set(
      templates
        .map((item) => item.code?.trim() || getChannelLabel(item.channel))
        .filter(Boolean)
    )
  ).slice(0, 3);

  const warnings = useMemo(() => {
    const items = [...loadErrors];

    if (!templates.length && templatesLoaded) {
      items.push("Chưa có mẫu thông báo nào trên hệ thống.");
    }

    if (!programs.length && programsLoaded) {
      items.push("Chưa có khung chương trình nào trên hệ thống.");
    }

    return Array.from(new Set(items));
  }, [
    currentLeaveLimit,
    loadErrors,
    programDetailError,
    programDetailLoading,
    programs.length,
    programsLoaded,
    selectedProgramId,
    selectedProgramName,
    templates.length,
    templatesLoaded,
  ]);

  const quickSettings = [
    {
      icon: <Sparkles size={16} />,
      label: "Thưởng điểm danh",
      value: gamification !== null ? `${gamification.checkInRewardStars} sao` : "Đang tải",
      active: gamification !== null,
    },
    {
      icon: <Zap size={16} />,
      label: "XP điểm danh",
      value: gamification !== null ? `${gamification.checkInRewardExp} XP` : "Đang tải",
      active: gamification !== null,
    },
    {
      icon: <Bell size={16} />,
      label: "Mẫu thông báo",
      value: `${templates.length} mẫu`,
      active: templates.length > 0,
    },
  ];

  const policyCards = [
    {
      id: "gamification",
      icon: <Sparkles className="h-5 w-5" />,
      title: "Gamification",
      desc: "Cấu hình số sao và XP thưởng khi học viên điểm danh.",
      status: gamification ? "Đang áp dụng" : "Cần đồng bộ",
      tone: (gamification ? "emerald" : "amber") as Tone,
      features: [
        `${gamification?.checkInRewardStars ?? 0} sao/lần`,
        `${gamification?.checkInRewardExp ?? 0} XP/lần`,
        "Cập nhật trực tiếp từ API",
      ],
      footer: gamification
        ? "Nguồn dữ liệu: /api/gamification/settings"
        : "Không tải được cấu hình gamification",
      href: `${adminBase}/gamification`,
    },
    {
      id: "notifications",
      icon: <Bell className="h-5 w-5" />,
      title: "Mẫu thông báo",
      desc: "Theo dõi mẫu thông báo đang hoạt động và lịch sử phát tin gần đây.",
      status: templates.length > 0 ? "Sẵn sàng" : "Cần tạo mẫu",
      tone: (templates.length > 0 ? "purple" : "amber") as Tone,
      features: [
        `${templates.length} mẫu`,
        `${activeTemplateCount} đang sử dụng`,
        ...templateLabels,
      ].slice(0, 4),
      footer:
        broadcasts.length > 0
          ? `Lần phát tin gần nhất: ${formatRelativeTime(broadcasts[0]?.createdAt)}`
          : "Chưa có lịch sử phát tin",
      href: `${adminBase}/notifications`,
    },
    {
      id: "rbac",
      icon: <ShieldCheck className="h-5 w-5" />,
      title: "Quản trị tài khoản",
      desc: "Tổng quan vai trò, tài khoản đang hoạt động và điểm vào luồng quản trị cho admin.",
      status:
        userSummary.total > 0
          ? `${userSummary.active}/${userSummary.total} đang hoạt động`
          : "Chưa có dữ liệu",
      tone: (userSummary.total > 0 ? "emerald" : "amber") as Tone,
      features: [
        `${userSummary.Admin} quản trị viên`,
        `${userSummary.ManagementStaff} quản lý`,
        `${userSummary.Teacher} giáo viên`,
        `${userSummary.Parent} phụ huynh`,
      ],
      footer: `Tài khoản tạm khóa: ${userSummary.inactive}`,
      href: `${adminBase}/accounts`,
    },
  ];

  const handleToggleEdit = () => {
    if (isEditing) {
      setIsEditing(false);
      if (gamification) {
        setGamificationDraft({
          checkInRewardStars: String(gamification.checkInRewardStars),
          checkInRewardExp: String(gamification.checkInRewardExp),
        });
      }
      setLeaveLimitDraft(String(resolvedLeaveLimit ?? ""));
      return;
    }

    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!isEditing) return;

    if (!hasPendingChanges) {
      toast.info({
        title: "Chưa có thay đổi",
        description: "Không có thay đổi nào để lưu.",
      });
      return;
    }

    if (hasGamificationChanges && (parsedStars === null || parsedExp === null)) {
      toast.destructive({
        title: "Gamification không hợp lệ",
        description: "Giá trị sao và XP phải là số nguyên >= 0.",
      });
      return;
    }

    if (hasLeaveLimitChanges && parsedLeaveLimit === null) {
      toast.destructive({
        title: "Giới hạn nghỉ không hợp lệ",
        description: "Số buổi nghỉ tối đa phải là số nguyên > 0.",
      });
      return;
    }

    setIsSaving(true);

    try {
      const updatedSections: string[] = [];

      if (hasGamificationChanges && parsedStars !== null && parsedExp !== null) {
        const updatedGamification = await updateGamificationSettings({
          checkInRewardStars: parsedStars,
          checkInRewardExp: parsedExp,
        });

        setGamification(updatedGamification);
        setGamificationDraft({
          checkInRewardStars: String(updatedGamification.checkInRewardStars),
          checkInRewardExp: String(updatedGamification.checkInRewardExp),
        });
        updatedSections.push("cấu hình gamification");
      }

      if (hasLeaveLimitChanges && parsedLeaveLimit !== null && selectedProgramId) {
        await updateAdminProgramMonthlyLeaveLimit(selectedProgramId, parsedLeaveLimit);
        const refreshedDetail = await fetchAdminProgramDetail(selectedProgramId);

        setProgramDetail(refreshedDetail);
        setLeaveLimitDraft(
          String(extractProgramMonthlyLeaveLimit(refreshedDetail) ?? parsedLeaveLimit)
        );
        setProgramDetailError(null);
        updatedSections.push("limit LeaveRequest theo tháng");
      }

      setIsEditing(false);
      toast.success({
        title: "Thành công",
        description: `Đã cập nhật ${updatedSections.join(" và ")}.`,
      });
    } catch (error) {
      toast.destructive({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Đã có lỗi xảy ra khi lưu.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-2 space-y-6">
      {/* Header */}
      <div className={`flex flex-wrap items-center justify-between gap-4 transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
            <Settings size={25} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-2xl font-extrabold text-gray-900">
              Cài đặt & Chính sách
            </h1>
            <p className="text-gray-600 mt-1 flex items-center gap-2">
              <Sparkles size={14} className="text-red-600" />
              Tổng hợp các nhóm cài đặt có API thật để admin vận hành an toàn
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleToggleEdit}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
          >
            <Edit2 size={16} />
            {isEditing ? "Hủy chỉnh sửa" : "Chế độ chỉnh sửa"}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isEditing || !hasPendingChanges || isSaving}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer",
              !isEditing || !hasPendingChanges || isSaving
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-lg"
            )}
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <ModernStatCard
          icon={<ShieldCheck size={18} />}
          title="Chính sách"
          value={`${policyCards.length}`}
          subtitle="có API thật"
          color="red"
        />
        <ModernStatCard
          icon={<Settings size={18} />}
          title="Cấu hình"
          value={`${2 + templates.length + programs.length}`}
          subtitle="cấu hình và mẫu hiện có"
          color="gray"
        />
        <ModernStatCard
          icon={<BadgePercent size={18} />}
          title="Đã đồng bộ"
          value={`${syncedSectionCount}`}
          subtitle="nguồn dữ liệu"
          color="black"
        />
        <ModernStatCard
          icon={<AlertCircle size={18} />}
          title="Cần xem xét"
          value={`${warnings.length}`}
          subtitle="mục cần theo dõi"
          color="green"
        />
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className={`rounded-2xl border border-amber-200 bg-amber-50/80 p-4 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                <AlertCircle size={16} />
                Các mục cần admin xem lại
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {warnings.slice(0, 4).map((warning) => (
                  <span
                    key={warning}
                    className="inline-flex border border-amber-200 bg-white px-3 py-1 text-xs text-amber-800 rounded-lg"
                  >
                    {warning}
                  </span>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => void loadSettingsData()}
              className="inline-flex cursor-pointer items-center gap-2 border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-amber-800 rounded-xl transition-colors hover:bg-amber-100"
            >
              <RefreshCw size={15} />
              Tải lại dữ liệu
            </button>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className={`grid lg:grid-cols-3 gap-6 transition-all duration-700 delay-200 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Left Column - Policy Cards */}
        <div className="lg:col-span-2 space-y-4">
          

          {/* Policy Cards List */}
          <div className="space-y-4">
            {policyCards.map((policy) => (
              <div
                key={policy.id}
                className="group relative overflow-hidden rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-5 transition-all hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white">
                    {policy.icon}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{policy.title}</h3>
                        <p className="mt-1 text-sm text-gray-600">{policy.desc}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                          getStatusBadgeClass(policy.tone)
                        )}
                      >
                        <div className="h-1.5 w-1.5 rounded-full bg-current" />
                        {policy.status}
                      </span>

                      <div className="flex flex-wrap gap-1.5">
                        {policy.features.map((feature) => (
                          <span
                            key={feature}
                            className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs text-red-700"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Edit Forms */}
                    {policy.id === "gamification" && isEditing && (
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-2">
                            Thưởng sao điểm danh
                          </label>
                          <input
                            type="number"
                            min={0}
                            disabled={isSaving || !gamificationLoaded}
                            value={gamificationDraft.checkInRewardStars}
                            onChange={(event) =>
                              setGamificationDraft((current) => ({
                                ...current,
                                checkInRewardStars: event.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-2">
                            Thưởng XP điểm danh
                          </label>
                          <input
                            type="number"
                            min={0}
                            disabled={isSaving || !gamificationLoaded}
                            value={gamificationDraft.checkInRewardExp}
                            onChange={(event) =>
                              setGamificationDraft((current) => ({
                                ...current,
                                checkInRewardExp: event.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                          />
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                  <div className="text-sm text-gray-500">
                    {isLoading && !syncedSectionCount ? "Đang đồng bộ dữ liệu..." : policy.footer}
                  </div>
                  <Link
                    href={policy.href}
                    className="flex items-center gap-1 text-sm font-medium text-red-600 transition-colors hover:text-red-700"
                  >
                    Chi tiết
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Quick Settings */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-gradient-to-r from-red-600 to-red-700 rounded-lg">
                <Zap size={16} className="text-white" />
              </div>
              <h3 className="font-bold text-gray-900">Cấu hình nhanh</h3>
            </div>
            <div className="space-y-3">
              {quickSettings.map((setting) => (
                <div
                  key={setting.label}
                  className="flex items-center justify-between rounded-xl border border-gray-100 p-3 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg",
                        setting.active
                          ? "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-600"
                          : "bg-gray-100 text-gray-500"
                      )}
                    >
                      {setting.icon}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{setting.label}</div>
                      <div className="text-xs text-gray-500">Giá trị hiện tại</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        setting.active ? "text-emerald-700" : "text-gray-700"
                      )}
                    >
                      {setting.value}
                    </span>
                    <div
                      className={cn(
                        "h-2 w-2 rounded-full",
                        setting.active ? "bg-emerald-500" : "bg-gray-400"
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-gradient-to-r from-red-600 to-red-700 rounded-lg">
                <Bell size={16} className="text-white" />
              </div>
              <h3 className="font-bold text-gray-900">Hoạt động gần đây</h3>
            </div>

            {broadcasts.length > 0 ? (
              <div className="space-y-3">
                {broadcasts.slice(0, 5).map((activity) => {
                  const visual = getActivityVisual(activity.kind);

                  return (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between rounded-xl border border-gray-100 p-3 transition-colors hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-lg",
                            visual.cls
                          )}
                        >
                          {visual.icon}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 line-clamp-1">
                            {activity.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {activity.senderName} | {getAudienceLabel(activity.audience)}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatRelativeTime(activity.createdAt)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="inline-flex p-3 bg-gray-100 rounded-xl mb-2">
                  <Bell size={20} className="text-gray-400" />
                </div>
                <div className="text-sm text-gray-500">Chưa có hoạt động nào</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}