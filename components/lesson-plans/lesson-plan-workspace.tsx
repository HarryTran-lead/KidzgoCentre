"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  FilePlus2,
  FileText,
  Filter,
  FolderOpen,
  GraduationCap,
  Loader2,
  Paperclip,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";

import { ADMIN_ENDPOINTS } from "@/constants/apiURL";
import { toast } from "@/hooks/use-toast";
import { get } from "@/lib/axios";
import { getAllClasses } from "@/lib/api/classService";
import {
  createLessonPlan,
  createLessonPlanTemplate,
  deleteLessonPlan,
  deleteLessonPlanTemplate,
  getAllLessonPlans,
  getAllLessonPlanTemplates,
  LessonPlan,
  LessonPlanTemplate,
  updateLessonPlan,
  updateLessonPlanTemplate,
  uploadLessonPlanFile,
} from "@/lib/api/lessonPlanService";
import { getAllProgramsForDropdown } from "@/lib/api/programService";
import { getTeacherClasses, getTeacherTimetable } from "@/lib/api/teacherService";

type WorkspaceScope = "teacher" | "staff-management" | "admin";
type ActiveTab = "templates" | "plans";
type TemplateStatusFilter = "all" | "active" | "inactive" | "withAttachment";
type PlanStatusFilter = "all" | "submitted" | "draft" | "withTemplate";

type Option = {
  id: string;
  label: string;
  hint?: string;
};

type DeleteState =
  | { type: "template"; item: LessonPlanTemplate }
  | { type: "plan"; item: LessonPlan }
  | null;

type DetailState =
  | { type: "template"; item: LessonPlanTemplate }
  | { type: "plan"; item: LessonPlan }
  | null;

type DetailModalState = Exclude<DetailState, null>;

const COPY: Record<
  WorkspaceScope,
  {
    title: string;
    subtitle: string;
    statsSuffix: string;
  }
> = {
  teacher: {
    title: "Giáo án & tài liệu",
    subtitle: "Quản lý kho mẫu giáo án và giáo án thực tế cho các buổi dạy của bạn.",
    statsSuffix: "của bạn",
  },
  "staff-management": {
    title: "Giáo án & chất lượng",
    subtitle: "Theo dõi kho mẫu giáo án và giáo án theo buổi để rà soát chất lượng triển khai.",
    statsSuffix: "toàn trung tâm",
  },
  admin: {
    title: "Giáo án & học liệu",
    subtitle: "Quản trị mẫu giáo án, theo dõi việc nộp giáo án và giữ logic vận hành đồng nhất.",
    statsSuffix: "hệ thống",
  },
};

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function formatDate(value?: string, withTime = false) {
  if (!value) return "Chưa cập nhật";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(withTime
      ? {
        hour: "2-digit",
        minute: "2-digit",
      }
      : {}),
  });
}

function truncateText(value?: string, fallback = "Chưa có nội dung") {
  if (!value?.trim()) return fallback;
  return value.length > 120 ? `${value.slice(0, 120)}...` : value;
}

function getTemplateStatus(template: LessonPlanTemplate) {
  return template.isActive === false ? "inactive" : "active";
}

function getPlanStatus(plan: LessonPlan) {
  return plan.submittedAt ? "submitted" : "draft";
}

function buildTemplateLabel(item: LessonPlanTemplate) {
  const parts = [item.title];
  if (item.programName) parts.push(item.programName);
  if (item.level) parts.push(`Level ${item.level}`);
  if (item.sessionIndex) parts.push(`Buổi ${item.sessionIndex}`);
  return parts.join(" • ");
}

function buildClassOption(item: any): Option {
  const label =
    item?.code || item?.classCode || item?.title || item?.name || item?.classTitle || "Lớp học";
  const hint = [item?.programName, item?.level].filter(Boolean).join(" • ") || undefined;

  return {
    id: String(item?.id || ""),
    label,
    hint,
  };
}

function buildSessionOption(item: any): Option {
  const dateSource = item?.plannedDatetime || item?.plannedDateTime || item?.sessionDate || item?.actualDatetime;
  const classLabel = item?.classCode || item?.classTitle || item?.className || "";
  const dateLabel = dateSource ? formatDate(dateSource, true) : "";
  const label = [item?.sessionTitle, classLabel, dateLabel].filter(Boolean).join(" • ") || item?.id || "Buổi học";

  return {
    id: String(item?.id || ""),
    label,
    hint: classLabel || undefined,
  };
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer",
        active
          ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
          : "text-gray-700 hover:bg-red-50"
      )}
    >
      {label}
    </button>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: any;
  color: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className={cn("absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl", color)} />
      <div className="relative flex items-center justify-between gap-3">
        <div className={cn("p-2.5 rounded-xl bg-gradient-to-r text-white shadow-sm flex-shrink-0", color)}>
          <Icon size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium text-gray-600 truncate">{title}</div>
          <div className="text-xl font-bold text-gray-900 leading-tight">{value}</div>
          <div className="text-[11px] text-gray-500 truncate">{subtitle}</div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({
  kind,
}: {
  kind:
  | "template-active"
  | "template-inactive"
  | "plan-submitted"
  | "plan-draft"
  | "with-attachment"
  | "with-template";
}) {
  const config: Record<string, { label: string; className: string; icon: any }> = {
    "template-active": {
      label: "Đang hoạt động",
      className: "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200",
      icon: CheckCircle2,
    },
    "template-inactive": {
      label: "Tạm ẩn",
      className: "bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border border-gray-200",
      icon: ShieldCheck,
    },
    "plan-submitted": {
      label: "Đã nộp",
      className: "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200",
      icon: CheckCircle2,
    },
    "plan-draft": {
      label: "Chưa nộp",
      className: "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200",
      icon: Clock3,
    },
    "with-attachment": {
      label: "Có file",
      className: "bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border border-blue-200",
      icon: Paperclip,
    },
    "with-template": {
      label: "Gắn mẫu",
      className: "bg-gradient-to-r from-purple-50 to-fuchsia-50 text-purple-700 border border-purple-200",
      icon: FolderOpen,
    },
  };

  const item = config[kind];
  const Icon = item.icon;

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", item.className)}>
      <Icon size={12} />
      <span>{item.label}</span>
    </span>
  );
}

function ModalFrame({
  title,
  subtitle,
  icon: Icon,
  children,
  onClose,
  widthClass = "max-w-3xl",
}: {
  title: string;
  subtitle: string;
  icon: any;
  children: React.ReactNode;
  onClose: () => void;
  widthClass?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn("relative w-full max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl", widthClass)}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 rounded-t-2xl bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/15 p-2">
              <Icon size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold">{title}</h2>
              <p className="text-sm text-red-100">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 transition-colors hover:bg-white/15 cursor-pointer"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="py-14 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-red-100 to-red-200">
        <Search size={24} className="text-red-400" />
      </div>
      <div className="font-medium text-gray-700">{title}</div>
      <div className="mt-1 text-sm text-gray-500">{subtitle}</div>
    </div>
  );
}

export function LessonPlanWorkspace({ scope }: { scope: WorkspaceScope }) {
  const [activeTab, setActiveTab] = useState<ActiveTab>(scope === "teacher" ? "plans" : "templates");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const [templates, setTemplates] = useState<LessonPlanTemplate[]>([]);
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [programOptions, setProgramOptions] = useState<Option[]>([]);
  const [classOptions, setClassOptions] = useState<Option[]>([]);
  const [sessionsByClass, setSessionsByClass] = useState<Record<string, Option[]>>({});

  const [searchQuery, setSearchQuery] = useState("");
  const [templateStatusFilter, setTemplateStatusFilter] = useState<TemplateStatusFilter>("all");
  const [planStatusFilter, setPlanStatusFilter] = useState<PlanStatusFilter>("all");
  const [selectedProgramId, setSelectedProgramId] = useState("all");
  const [selectedClassId, setSelectedClassId] = useState("all");

  const [templateModal, setTemplateModal] = useState<LessonPlanTemplate | null | "create">(null);
  const [planModal, setPlanModal] = useState<LessonPlan | null | "create">(null);
  const [detailState, setDetailState] = useState<DetailState>(null);
  const [deleteState, setDeleteState] = useState<DeleteState>(null);

  const scopeCopy = COPY[scope];

  const templateMap = useMemo(() => {
    return new Map(templates.map((item) => [item.id, item]));
  }, [templates]);

  const loadPrograms = async () => {
    const items = await getAllProgramsForDropdown();
    setProgramOptions(
      items
        .filter((item) => item.id && item.name)
        .map((item) => ({
          id: item.id,
          label: item.name,
          hint: item.code || undefined,
        }))
    );
  };

  const loadClasses = async () => {
    if (scope === "teacher") {
      const response = await getTeacherClasses({ pageNumber: 1, pageSize: 100 });
      const source = Array.isArray(response?.data?.classes?.items)
        ? response.data.classes.items
        : Array.isArray((response as any)?.data?.classes)
          ? (response as any).data.classes
          : [];

      setClassOptions(source.map(buildClassOption).filter((item: Option) => item.id));
      return;
    }

    const response = await getAllClasses({ pageNumber: 1, pageSize: 100 });
    const source = Array.isArray(response?.data?.classes?.items)
      ? response.data.classes.items
      : Array.isArray(response?.data?.items)
        ? response.data.items
        : Array.isArray(response?.data?.classes)
          ? response.data.classes
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response)
              ? response
              : [];

    setClassOptions(source.map(buildClassOption).filter((item: Option) => item.id));
  };

  const loadTemplates = async () => {
    const response = await getAllLessonPlanTemplates({ pageNumber: 1, pageSize: 100 });
    if (response.isSuccess) {
      setTemplates(response.data.templates.items);
      return;
    }

    throw new Error(response.message || "Không thể tải danh sách mẫu giáo án.");
  };

  const loadPlans = async () => {
    const response = await getAllLessonPlans({ pageNumber: 1, pageSize: 100 });
    if (response.isSuccess) {
      setPlans(response.data.lessonPlans.items);
      return;
    }

    throw new Error(response.message || "Không thể tải danh sách giáo án theo buổi.");
  };

  const loadSessionsForClass = async (classId: string) => {
    if (!classId || sessionsByClass[classId]) {
      return;
    }

    if (scope === "teacher") {
      const now = new Date();
      const from = new Date(now);
      const to = new Date(now);
      from.setMonth(from.getMonth() - 6);
      to.setMonth(to.getMonth() + 6);

      const response = await getTeacherTimetable({
        from: from.toISOString(),
        to: to.toISOString(),
        pageSize: 200,
      });

      const source = Array.isArray(response?.data?.sessions?.items)
        ? response.data.sessions.items
        : Array.isArray((response as any)?.data?.sessions)
          ? (response as any).data.sessions
          : [];

      const mapped = source
        .filter((item: any) => !classId || item.classId === classId)
        .map(buildSessionOption)
        .filter((item: Option) => item.id);

      setSessionsByClass((prev) => ({ ...prev, [classId]: mapped }));
      return;
    }

    const response = await get<any>(`${ADMIN_ENDPOINTS.SESSIONS}?classId=${encodeURIComponent(classId)}&pageNumber=1&pageSize=100`);
    const source = Array.isArray(response?.data?.sessions?.items)
      ? response.data.sessions.items
      : Array.isArray(response?.data?.items)
        ? response.data.items
        : Array.isArray(response?.data?.sessions)
          ? response.data.sessions
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response)
              ? response
              : [];

    setSessionsByClass((prev) => ({
      ...prev,
      [classId]: source.map(buildSessionOption).filter((item: Option) => item.id),
    }));
  };

  const refreshWorkspace = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    const results = await Promise.allSettled([loadTemplates(), loadPlans(), loadPrograms(), loadClasses()]);
    const rejected = results.find((result) => result.status === "rejected") as PromiseRejectedResult | undefined;

    if (rejected) {
      toast({
        title: "Không thể tải dữ liệu",
        description: rejected.reason?.message || "Đã xảy ra lỗi khi đồng bộ lesson plan.",
        variant: "destructive",
      });
    }

    setLoading(false);
    setRefreshing(false);
    setIsLoaded(true);
  };

  useEffect(() => {
    refreshWorkspace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  const filteredTemplates = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    return templates
      .filter((item) => {
        if (selectedProgramId !== "all" && item.programId !== selectedProgramId) {
          return false;
        }

        if (templateStatusFilter === "active" && getTemplateStatus(item) !== "active") {
          return false;
        }

        if (templateStatusFilter === "inactive" && getTemplateStatus(item) !== "inactive") {
          return false;
        }

        if (templateStatusFilter === "withAttachment" && !item.attachment) {
          return false;
        }

        if (!keyword) return true;

        return [item.title, item.programName, item.level, item.sessionIndex?.toString(), item.createdByName]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });
  }, [searchQuery, selectedProgramId, templateStatusFilter, templates]);

  const filteredPlans = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    return plans
      .filter((item) => {
        if (selectedClassId !== "all" && item.classId !== selectedClassId) {
          return false;
        }

        if (planStatusFilter === "submitted" && getPlanStatus(item) !== "submitted") {
          return false;
        }

        if (planStatusFilter === "draft" && getPlanStatus(item) !== "draft") {
          return false;
        }

        if (planStatusFilter === "withTemplate" && !item.templateId) {
          return false;
        }

        if (!keyword) return true;

        return [
          item.classCode,
          item.classTitle,
          item.sessionTitle,
          item.templateLevel,
          item.templateSessionIndex?.toString(),
          item.submittedByName,
          item.plannedContent,
          item.actualContent,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
      })
      .sort((a, b) => {
        const primaryA = new Date(a.sessionDate || a.updatedAt || a.createdAt || 0).getTime();
        const primaryB = new Date(b.sessionDate || b.updatedAt || b.createdAt || 0).getTime();
        return primaryB - primaryA;
      });
  }, [planStatusFilter, plans, searchQuery, selectedClassId]);

  const stats = useMemo(() => {
    if (activeTab === "templates") {
      return [
        {
          title: "Tổng mẫu",
          value: String(templates.length),
          subtitle: `Kho giáo án ${scopeCopy.statsSuffix}`,
          icon: FolderOpen,
          color: "from-red-600 to-red-700",
        },
        {
          title: "Đang hoạt động",
          value: String(templates.filter((item) => getTemplateStatus(item) === "active").length),
          subtitle: "Sẵn sàng sử dụng",
          icon: CheckCircle2,
          color: "from-emerald-500 to-teal-500",
        },
        {
          title: "Có file đính kèm",
          value: String(templates.filter((item) => item.attachment).length),
          subtitle: "Tài liệu đã tải lên",
          icon: Paperclip,
          color: "from-blue-500 to-cyan-500",
        },
        {
          title: "Lượt áp dụng",
          value: String(templates.reduce((sum, item) => sum + (item.usedCount || 0), 0)),
          subtitle: "Số lần gắn vào lesson plan",
          icon: ShieldCheck,
          color: "from-amber-500 to-orange-500",
        },
      ];
    }

    return [
      {
        title: "Tổng lesson plan",
        value: String(plans.length),
        subtitle: `Theo buổi học ${scopeCopy.statsSuffix}`,
        icon: FileText,
        color: "from-red-600 to-red-700",
      },
      {
        title: "Đã nộp",
        value: String(plans.filter((item) => getPlanStatus(item) === "submitted").length),
        subtitle: "Đã có thời điểm nộp",
        icon: CheckCircle2,
        color: "from-emerald-500 to-teal-500",
      },
      {
        title: "Chưa nộp",
        value: String(plans.filter((item) => getPlanStatus(item) === "draft").length),
        subtitle: "Cần cập nhật tiếp",
        icon: Clock3,
        color: "from-amber-500 to-orange-500",
      },
      {
        title: "Gắn theo mẫu",
        value: String(plans.filter((item) => item.templateId).length),
        subtitle: "Đã liên kết với template",
        icon: BookOpenCheck,
        color: "from-purple-500 to-fuchsia-500",
      },
    ];
  }, [activeTab, plans, scopeCopy.statsSuffix, templates]);

  const openAttachment = (url?: string | null) => {
    if (!url || typeof window === "undefined") return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDelete = async () => {
    if (!deleteState) return;

    const deletingTemplate = deleteState.type === "template";
    const response = deletingTemplate
      ? await deleteLessonPlanTemplate(deleteState.item.id)
      : await deleteLessonPlan(deleteState.item.id);

    if (!response.isSuccess) {
      toast({
        title: "Không thể xóa",
        description: response.message || "Vui lòng thử lại sau.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: deletingTemplate ? "Đã xóa mẫu giáo án" : "Đã xóa lesson plan",
      description: "Dữ liệu đã được cập nhật.",
      variant: "success",
    });

    setDeleteState(null);
    await refreshWorkspace(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6 space-y-6">
      <div className={cn("flex flex-col gap-4 transition-all duration-700", isLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4")}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 p-3 shadow-lg">
              <BookOpenCheck size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{scopeCopy.title}</h1>
              <p className="mt-1 text-sm text-gray-600">{scopeCopy.subtitle}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => refreshWorkspace(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-red-50 cursor-pointer"
            >
              <RefreshCw size={16} className={cn(refreshing && "animate-spin")} />
              Làm mới
            </button>
            <button
              type="button"
              onClick={() => (activeTab === "templates" ? setTemplateModal("create") : setPlanModal("create"))}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg cursor-pointer"
            >
              <Plus size={16} />
              {activeTab === "templates" ? "Tạo mẫu giáo án" : "Tạo lesson plan"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-red-200 bg-gradient-to-r from-white to-red-50 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-900">Flow đề xuất</div>
              <div className="mt-1 text-sm text-gray-600">
                1. Upload file mẫu giáo án. 2. Tạo template theo program + level + session. 3. Gắn vào buổi học. 4. Cập nhật nội dung thực tế và ghi chú.
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-medium">
              <span className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-gray-700">Upload attachment</span>
              <span className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-gray-700">Template library</span>
              <span className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-gray-700">Lesson plan theo buổi</span>
              <span className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-gray-700">Theo dõi chất lượng</span>
            </div>
          </div>
        </div>
      </div>

      <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4 transition-all duration-700 delay-100", isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
        {stats.map((item) => (
          <StatCard key={item.title} {...item} />
        ))}
      </div>

      <div className={cn("rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-5 transition-all duration-700 delay-150", isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={activeTab === "templates" ? "Tìm theo tên mẫu, program, level..." : "Tìm theo lớp, buổi học, người nộp..."}
              className="w-full rounded-xl border border-red-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-2xl border border-red-200 bg-white/70 p-1">
              <TabButton active={activeTab === "templates"} label="Mẫu giáo án" onClick={() => setActiveTab("templates")} />
              <TabButton active={activeTab === "plans"} label="Giáo án theo buổi" onClick={() => setActiveTab("plans")} />
            </div>

            <div className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm text-gray-700">
              <Filter size={16} className="text-gray-500" />
              {activeTab === "templates" ? (
                <>
                  <select
                    value={templateStatusFilter}
                    onChange={(event) => setTemplateStatusFilter(event.target.value as TemplateStatusFilter)}
                    className="bg-transparent text-sm focus:outline-none"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="active">Đang hoạt động</option>
                    <option value="inactive">Tạm ẩn</option>
                    <option value="withAttachment">Có file</option>
                  </select>
                  <select
                    value={selectedProgramId}
                    onChange={(event) => setSelectedProgramId(event.target.value)}
                    className="border-l border-red-100 bg-transparent pl-2 text-sm focus:outline-none"
                  >
                    <option value="all">Tất cả program</option>
                    {programOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <select
                    value={planStatusFilter}
                    onChange={(event) => setPlanStatusFilter(event.target.value as PlanStatusFilter)}
                    className="bg-transparent text-sm focus:outline-none"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="submitted">Đã nộp</option>
                    <option value="draft">Chưa nộp</option>
                    <option value="withTemplate">Gắn theo mẫu</option>
                  </select>
                  <select
                    value={selectedClassId}
                    onChange={(event) => setSelectedClassId(event.target.value)}
                    className="border-l border-red-100 bg-transparent pl-2 text-sm focus:outline-none"
                  >
                    <option value="all">Tất cả lớp</option>
                    {classOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={cn("overflow-hidden rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 shadow-sm transition-all duration-700 delay-200", isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
        <div className="border-b border-red-200 bg-gradient-to-r from-red-500/10 to-red-700/10 px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              {activeTab === "templates" ? "Thư viện mẫu giáo án" : "Danh sách lesson plan theo buổi"}
            </h2>
            <div className="text-sm font-medium text-gray-600">
              {activeTab === "templates" ? `${filteredTemplates.length} mẫu` : `${filteredPlans.length} lesson plan`}
            </div>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3 text-gray-600">
              <Loader2 className="animate-spin text-red-600" size={20} />
              Đang đồng bộ lesson plan...
            </div>
          </div>
        ) : activeTab === "templates" ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-red-200 bg-gradient-to-r from-red-500/5 to-red-700/5">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Program & tiêu đề</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Level / Buổi</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Attachment</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Cập nhật</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {filteredTemplates.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState title="Chưa có mẫu giáo án phù hợp" subtitle="Thử thay đổi bộ lọc, từ khóa hoặc tạo mẫu mới." />
                    </td>
                  </tr>
                ) : (
                  filteredTemplates.map((item) => (
                    <tr key={item.id} className="transition-all duration-200 hover:bg-gradient-to-r hover:from-red-50/40 hover:to-white">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 p-2 text-white shadow-sm">
                            <FolderOpen size={16} />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{item.title}</div>
                            <div className="mt-1 text-sm text-gray-500">
                              {item.programName || "Chưa gắn program"}
                            </div>
                            <div className="mt-1 text-xs text-gray-400">{item.createdByName || "Không rõ người tạo"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">Level {item.level || "-"}</div>
                        <div className="mt-1 text-sm text-gray-500">Buổi {item.sessionIndex || "-"}</div>
                      </td>
                      
                      <td className="px-6 py-4">
                        {item.attachment ? (
                          <button
                            type="button"
                            onClick={() => openAttachment(item.attachment)}
                            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 cursor-pointer"
                          >
                            <Paperclip size={12} />
                            Mở file
                          </button>
                        ) : (
                          <span className="text-sm text-gray-400">Chưa có file</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge kind={getTemplateStatus(item) === "active" ? "template-active" : "template-inactive"} />
                          {item.attachment ? <StatusBadge kind="with-attachment" /> : null}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700">{formatDate(item.updatedAt || item.createdAt, true)}</div>
                        <div className="mt-1 text-xs text-gray-500">Sử dụng: {item.usedCount || 0} lần</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setDetailState({ type: "template", item })}
                            className="rounded-lg border border-red-200 bg-white p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setTemplateModal(item)}
                            className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-700 transition-colors hover:bg-amber-100 cursor-pointer"
                            title="Chỉnh sửa"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteState({ type: "template", item })}
                            className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-700 transition-colors hover:bg-red-100 cursor-pointer"
                            title="Xóa"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-red-200 bg-gradient-to-r from-red-500/5 to-red-700/5">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Lớp / Buổi học</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Template</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nội dung</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Cập nhật</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {filteredPlans.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState title="Chưa có lesson plan phù hợp" subtitle="Thử đổi bộ lọc, từ khóa hoặc tạo lesson plan mới." />
                    </td>
                  </tr>
                ) : (
                  filteredPlans.map((item) => {
                    const linkedTemplate = item.templateId ? templateMap.get(item.templateId) : undefined;

                    return (
                      <tr key={item.id} className="transition-all duration-200 hover:bg-gradient-to-r hover:from-red-50/40 hover:to-white">
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 p-2 text-white shadow-sm">
                              <CalendarDays size={16} />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{item.classCode || item.classTitle || "Chưa có lớp"}</div>
                              <div className="mt-1 text-sm text-gray-500">{item.sessionTitle || "Chưa có buổi học"}</div>
                              <div className="mt-1 text-xs text-gray-400">{formatDate(item.sessionDate || item.createdAt, true)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {item.templateId ? (
                            <div className="space-y-2">
                              <div className="text-sm font-medium text-gray-900">
                                {linkedTemplate?.title || item.templateTitle || "Template đã gắn"}
                              </div>
                              <div className="text-xs text-gray-500">
                                {item.templateLevel ? `Level ${item.templateLevel}` : linkedTemplate?.level ? `Level ${linkedTemplate.level}` : ""}
                                {item.templateSessionIndex || linkedTemplate?.sessionIndex
                                  ? ` • Buổi ${item.templateSessionIndex || linkedTemplate?.sessionIndex}`
                                  : ""}
                              </div>
                              {linkedTemplate?.attachment ? (
                                <button
                                  type="button"
                                  onClick={() => openAttachment(linkedTemplate.attachment)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 cursor-pointer"
                                >
                                  <Paperclip size={11} />
                                  File mẫu
                                </button>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Không gắn template</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-xl text-sm text-gray-700">{truncateText(item.actualContent || item.plannedContent)}</div>
                          {item.actualHomework ? <div className="mt-1 text-xs text-amber-700">Homework: {truncateText(item.actualHomework, "")}</div> : null}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            <StatusBadge kind={getPlanStatus(item) === "submitted" ? "plan-submitted" : "plan-draft"} />
                            {item.templateId ? <StatusBadge kind="with-template" /> : null}
                          </div>
                          <div className="mt-2 text-xs text-gray-500">{item.submittedByName || "Chưa có người nộp"}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700">{formatDate(item.updatedAt || item.submittedAt || item.createdAt, true)}</div>
                          <div className="mt-1 text-xs text-gray-500">
                            {item.submittedAt ? `Nộp lúc ${formatDate(item.submittedAt, true)}` : "Chưa có submittedAt"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setDetailState({ type: "plan", item })}
                              className="rounded-lg border border-red-200 bg-white p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 cursor-pointer"
                              title="Xem chi tiết"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPlanModal(item)}
                              className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-700 transition-colors hover:bg-amber-100 cursor-pointer"
                              title="Chỉnh sửa"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteState({ type: "plan", item })}
                              className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-700 transition-colors hover:bg-red-100 cursor-pointer"
                              title="Xóa"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {templateModal ? (
        <TemplateFormModal
          initialValue={templateModal === "create" ? null : templateModal}
          programOptions={programOptions}
          onClose={() => setTemplateModal(null)}
          onSubmit={async (payload, file) => {
            let attachment = payload.attachment;

            if (file) {
              const uploaded = await uploadLessonPlanFile("template", file);
              attachment = uploaded.url;
            }

            const response =
              templateModal === "create"
                ? await createLessonPlanTemplate({
                  programId: payload.programId,
                  level: payload.level,
                  title: payload.title,
                  sessionIndex: payload.sessionIndex,
                  attachment,
                })
                : await updateLessonPlanTemplate(templateModal.id, {
                  level: payload.level,
                  title: payload.title,
                  sessionIndex: payload.sessionIndex,
                  attachment,
                  isActive: payload.isActive,
                });

            if (!response.isSuccess) {
              throw new Error(response.message || "Không thể lưu mẫu giáo án.");
            }

            toast({
              title: templateModal === "create" ? "Đã tạo mẫu giáo án" : "Đã cập nhật mẫu giáo án",
              description: "Dữ liệu đã được đồng bộ thành công.",
              variant: "success",
            });

            setTemplateModal(null);
            await refreshWorkspace(true);
          }}
        />
      ) : null}

      {planModal ? (
        <PlanFormModal
          initialValue={planModal === "create" ? null : planModal}
          classOptions={classOptions}
          templateOptions={templates.map((item) => ({
            id: item.id,
            label: buildTemplateLabel(item),
          }))}
          sessionsByClass={sessionsByClass}
          onLoadSessions={loadSessionsForClass}
          onClose={() => setPlanModal(null)}
          onSubmit={async (payload) => {
            const response =
              planModal === "create"
                ? await createLessonPlan(payload)
                : await updateLessonPlan(planModal.id, {
                  templateId: payload.templateId,
                  plannedContent: payload.plannedContent,
                  actualContent: payload.actualContent,
                  actualHomework: payload.actualHomework,
                  teacherNotes: payload.teacherNotes,
                });

            if (!response.isSuccess) {
              throw new Error(response.message || "Không thể lưu lesson plan.");
            }

            toast({
              title: planModal === "create" ? "Đã tạo lesson plan" : "Đã cập nhật lesson plan",
              description: "Thông tin buổi học đã được cập nhật.",
              variant: "success",
            });

            setPlanModal(null);
            await refreshWorkspace(true);
          }}
        />
      ) : null}

      {detailState ? (
        <DetailModal
          state={detailState}
          linkedTemplate={detailState.type === "plan" && detailState.item.templateId ? templateMap.get(detailState.item.templateId) : undefined}
          onClose={() => setDetailState(null)}
          onOpenAttachment={openAttachment}
        />
      ) : null}

      {deleteState ? (
        <DeleteModal
          title={deleteState.type === "template" ? "Xóa mẫu giáo án" : "Xóa lesson plan"}
          name={deleteState.type === "template" ? deleteState.item.title : deleteState.item.sessionTitle || deleteState.item.id}
          onClose={() => setDeleteState(null)}
          onConfirm={handleDelete}
        />
      ) : null}
    </div>
  );
}

function TemplateFormModal({
  initialValue,
  programOptions,
  onClose,
  onSubmit,
}: {
  initialValue: LessonPlanTemplate | null;
  programOptions: Option[];
  onClose: () => void;
  onSubmit: (
    payload: {
      programId: string;
      level: string;
      title: string;
      sessionIndex: number;
      attachment?: string | null;
      isActive?: boolean;
    },
    file: File | null
  ) => Promise<void>;
}) {
  const [programId, setProgramId] = useState(initialValue?.programId || "");
  const [level, setLevel] = useState(initialValue?.level || "");
  const [title, setTitle] = useState(initialValue?.title || "");
  const [sessionIndex, setSessionIndex] = useState(initialValue?.sessionIndex || 1);
  const [attachment, setAttachment] = useState(initialValue?.attachment || "");
  const [isActive, setIsActive] = useState(initialValue?.isActive ?? true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(initialValue);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!programId.trim()) {
      setError("Vui lòng chọn program.");
      return;
    }

    if (!level.trim()) {
      setError("Vui lòng nhập level.");
      return;
    }

    if (!title.trim()) {
      setError("Vui lòng nhập tiêu đề mẫu giáo án.");
      return;
    }

    if (sessionIndex <= 0) {
      setError("Session index phải lớn hơn 0.");
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit(
        {
          programId,
          level,
          title,
          sessionIndex,
          attachment: attachment.trim() || null,
          isActive,
        },
        selectedFile
      );
    } catch (submitError: any) {
      setError(submitError?.message || "Không thể lưu mẫu giáo án.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalFrame
      title={isEdit ? "Cập nhật mẫu giáo án" : "Tạo mẫu giáo án"}
      subtitle={isEdit ? "Chỉnh sửa thông tin template hiện có." : "Tạo kho template theo program + level + session index."}
      icon={FolderOpen}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-5 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Program</label>
            <select
              value={programId}
              onChange={(event) => setProgramId(event.target.value)}
              disabled={isEdit}
              className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-100 disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="">Chọn program</option>
              {programOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Level</label>
            <input
              value={level}
              onChange={(event) => setLevel(event.target.value)}
              className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-100"
              placeholder="Ví dụ: 1, Beginner, A1"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Tiêu đề</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-100"
              placeholder="Lesson Plan Template 1"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Session index</label>
            <input
              type="number"
              min={1}
              value={sessionIndex}
              onChange={(event) => setSessionIndex(Number(event.target.value) || 1)}
              className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-100"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Attachment URL</label>
            <input
              value={attachment}
              onChange={(event) => setAttachment(event.target.value)}
              className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-100"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Tải file mẫu</label>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-red-200 bg-red-50/50 px-4 py-3 text-sm text-gray-600 transition-colors hover:bg-red-50">
              <Upload size={16} className="text-red-600" />
              <span>{selectedFile ? selectedFile.name : "Chọn file để upload vào attachment"}</span>
              <input
                type="file"
                className="hidden"
                onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
              />
            </label>
          </div>
        </div>

        {isEdit ? (
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Trạng thái</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsActive(true)}
                className={cn(
                  "rounded-xl border px-4 py-3 text-sm font-semibold transition-colors cursor-pointer",
                  isActive ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-red-200 bg-white text-gray-700"
                )}
              >
                Đang hoạt động
              </button>
              <button
                type="button"
                onClick={() => setIsActive(false)}
                className={cn(
                  "rounded-xl border px-4 py-3 text-sm font-semibold transition-colors cursor-pointer",
                  !isActive ? "border-gray-300 bg-gray-50 text-gray-700" : "border-red-200 bg-white text-gray-700"
                )}
              >
                Tạm ẩn
              </button>
            </div>
          </div>
        ) : null}

        {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div> : null}

        <div className="flex items-center justify-end gap-3 border-t border-red-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-red-50 cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isEdit ? "Lưu thay đổi" : "Tạo mẫu giáo án"}
          </button>
        </div>
      </form>
    </ModalFrame>
  );
}

function PlanFormModal({
  initialValue,
  classOptions,
  templateOptions,
  sessionsByClass,
  onLoadSessions,
  onClose,
  onSubmit,
}: {
  initialValue: LessonPlan | null;
  classOptions: Option[];
  templateOptions: Option[];
  sessionsByClass: Record<string, Option[]>;
  onLoadSessions: (classId: string) => Promise<void>;
  onClose: () => void;
  onSubmit: (payload: {
    classId: string;
    sessionId: string;
    templateId?: string | null;
    plannedContent: string;
    actualContent?: string;
    actualHomework?: string;
    teacherNotes?: string;
  }) => Promise<void>;
}) {
  const [classId, setClassId] = useState(initialValue?.classId || "");
  const [sessionId, setSessionId] = useState(initialValue?.sessionId || "");
  const [templateId, setTemplateId] = useState(initialValue?.templateId || "");
  const [plannedContent, setPlannedContent] = useState(initialValue?.plannedContent || "");
  const [actualContent, setActualContent] = useState(initialValue?.actualContent || "");
  const [actualHomework, setActualHomework] = useState(initialValue?.actualHomework || "");
  const [teacherNotes, setTeacherNotes] = useState(initialValue?.teacherNotes || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(initialValue);
  const sessionOptions = classId ? sessionsByClass[classId] || [] : [];

  useEffect(() => {
    if (classId) {
      onLoadSessions(classId).catch((sessionError: any) => {
        setError(sessionError?.message || "Không thể tải danh sách buổi học.");
      });
    }
  }, [classId, onLoadSessions]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!classId) {
      setError("Vui lòng chọn lớp học.");
      return;
    }

    if (!sessionId) {
      setError("Vui lòng chọn buổi học.");
      return;
    }

    if (!plannedContent.trim()) {
      setError("Vui lòng nhập nội dung dự kiến.");
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit({
        classId,
        sessionId,
        templateId: templateId || null,
        plannedContent: plannedContent.trim(),
        actualContent: actualContent.trim() || undefined,
        actualHomework: actualHomework.trim() || undefined,
        teacherNotes: teacherNotes.trim() || undefined,
      });
    } catch (submitError: any) {
      setError(submitError?.message || "Không thể lưu lesson plan.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalFrame
      title={isEdit ? "Cập nhật lesson plan" : "Tạo lesson plan theo buổi"}
      subtitle={isEdit ? "Cập nhật nội dung dự kiến, thực tế và ghi chú giáo viên." : "Gắn lesson plan vào lớp học và buổi học cụ thể."}
      icon={FilePlus2}
      onClose={onClose}
      widthClass="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Lớp học</label>
            <select
              value={classId}
              onChange={(event) => {
                setClassId(event.target.value);
                if (!isEdit) {
                  setSessionId("");
                }
              }}
              disabled={isEdit}
              className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-100 disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="">Chọn lớp học</option>
              {classOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Buổi học</label>
            <select
              value={sessionId}
              onChange={(event) => setSessionId(event.target.value)}
              disabled={!classId || isEdit}
              className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-100 disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="">{classId ? "Chọn buổi học" : "Chọn lớp trước"}</option>
              {sessionOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">Template (tùy chọn)</label>
          <select
            value={templateId}
            onChange={(event) => setTemplateId(event.target.value)}
            className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-100"
          >
            <option value="">Không gắn template</option>
            {templateOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">Nội dung dự kiến</label>
          <textarea
            value={plannedContent}
            onChange={(event) => setPlannedContent(event.target.value)}
            rows={4}
            className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-100"
            placeholder="Nhập planned content..."
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Nội dung thực tế</label>
            <textarea
              value={actualContent}
              onChange={(event) => setActualContent(event.target.value)}
              rows={4}
              className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-100"
              placeholder="Nhập actual content..."
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Homework</label>
            <textarea
              value={actualHomework}
              onChange={(event) => setActualHomework(event.target.value)}
              rows={4}
              className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-100"
              placeholder="Nhập bài tập về nhà..."
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">Ghi chú giáo viên</label>
          <textarea
            value={teacherNotes}
            onChange={(event) => setTeacherNotes(event.target.value)}
            rows={3}
            className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-100"
            placeholder="Nhập teacher notes..."
          />
        </div>

        {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div> : null}

        <div className="flex items-center justify-end gap-3 border-t border-red-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-red-50 cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isEdit ? "Lưu lesson plan" : "Tạo lesson plan"}
          </button>
        </div>
      </form>
    </ModalFrame>
  );
}

function DetailModal({
  state,
  linkedTemplate,
  onClose,
  onOpenAttachment,
}: {
  state: DetailModalState;
  linkedTemplate?: LessonPlanTemplate;
  onClose: () => void;
  onOpenAttachment: (url?: string | null) => void;
}) {
  if (state.type === "template") {
    const item = state.item;

    return (
      <ModalFrame
        title="Chi tiết mẫu giáo án"
        subtitle="Thông tin template đang được lưu trong thư viện."
        icon={FolderOpen}
        onClose={onClose}
      >
        <div className="space-y-5 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <InfoCard icon={BookOpenCheck} label="Program" value={item.programName || item.programId || "-"} />
            <InfoCard icon={GraduationCap} label="Level / Buổi" value={`Level ${item.level || "-"} • Buổi ${item.sessionIndex || "-"}`} />
            <InfoCard icon={Users} label="Người tạo" value={item.createdByName || "-"} />
            <InfoCard icon={CalendarDays} label="Cập nhật" value={formatDate(item.updatedAt || item.createdAt, true)} />
          </div>

          <div className="rounded-2xl border border-red-100 bg-white p-5">
            <div className="mb-2 text-sm font-semibold text-red-600">Tiêu đề</div>
            <div className="text-gray-900">{item.title}</div>
          </div>

          <div className="rounded-2xl border border-red-100 bg-white p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-red-600">Attachment</div>
              {item.attachment ? (
                <button
                  type="button"
                  onClick={() => onOpenAttachment(item.attachment)}
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 cursor-pointer"
                >
                  <Paperclip size={12} />
                  Mở file
                </button>
              ) : null}
            </div>
            <div className="text-sm text-gray-700">{item.attachment || "Chưa có file đính kèm"}</div>
          </div>

          <div className="flex items-center justify-end border-t border-red-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 px-5 py-2.5 text-sm font-semibold text-white hover:shadow-lg cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </ModalFrame>
    );
  }

  const item = state.item;

  return (
    <ModalFrame
      title="Chi tiết lesson plan"
      subtitle="Tổng hợp nội dung dự kiến, thực tế và liên kết template."
      icon={FileText}
      onClose={onClose}
      widthClass="max-w-4xl"
    >
      <div className="space-y-5 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard icon={Users} label="Lớp học" value={item.classCode || item.classTitle || "-"} />
          <InfoCard icon={CalendarDays} label="Buổi học" value={item.sessionTitle || "-"} />
          <InfoCard icon={ShieldCheck} label="Người nộp" value={item.submittedByName || "-"} />
          <InfoCard icon={Clock3} label="Thời gian" value={formatDate(item.submittedAt || item.updatedAt || item.createdAt, true)} />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <ContentCard title="Nội dung dự kiến" content={item.plannedContent} accent="text-red-600" />
          <ContentCard title="Nội dung thực tế" content={item.actualContent} accent="text-emerald-600" />
          <ContentCard title="Homework" content={item.actualHomework} accent="text-amber-600" />
          <ContentCard title="Ghi chú giáo viên" content={item.teacherNotes} accent="text-gray-600" />
        </div>
        <div className="rounded-2xl border border-red-100 bg-white p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-red-600">Template liên kết</div>
            {linkedTemplate?.attachment ? (
              <button
                type="button"
                onClick={() => onOpenAttachment(linkedTemplate.attachment)}
                className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 cursor-pointer"
              >
                <Paperclip size={12} />
                Mở file mẫu
              </button>
            ) : null}
          </div>
          {item.templateId ? (
            <div className="space-y-1 text-sm text-gray-700">
              <div>{linkedTemplate?.title || item.templateTitle || "Template đã gắn"}</div>
              <div className="text-gray-500">
                {item.templateLevel ? `Level ${item.templateLevel}` : linkedTemplate?.level ? `Level ${linkedTemplate.level}` : "Không có level"}
                {item.templateSessionIndex || linkedTemplate?.sessionIndex
                  ? ` • Buổi ${item.templateSessionIndex || linkedTemplate?.sessionIndex}`
                  : ""}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">Lesson plan này chưa gắn template.</div>
          )}
        </div>

        <div className="flex items-center justify-end border-t border-red-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 px-5 py-2.5 text-sm font-semibold text-white hover:shadow-lg cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </ModalFrame>
  );
}

function DeleteModal({
  title,
  name,
  onClose,
  onConfirm,
}: {
  title: string;
  name: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);

    try {
      await onConfirm();
    } catch (confirmError: any) {
      setError(confirmError?.message || "Không thể xóa dữ liệu.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalFrame
      title={title}
      subtitle="Hành động này không thể hoàn tác."
      icon={AlertTriangle}
      onClose={onClose}
      widthClass="max-w-md"
    >
      <div className="space-y-5 p-6">
        <div className="rounded-2xl border border-red-100 bg-red-50/60 p-4 text-sm text-gray-700">
          Bạn đang xóa: <span className="font-semibold text-gray-900">{name}</span>
        </div>

        {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div> : null}

        <div className="flex items-center justify-end gap-3 border-t border-red-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-red-50 cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            Xóa
          </button>
        </div>
      </div>
    </ModalFrame>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-red-100 bg-red-50/50 p-4">
      <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-red-600">
        <Icon size={14} />
        {label}
      </div>
      <div className="text-sm font-medium text-gray-900">{value}</div>
    </div>
  );
}

function ContentCard({
  title,
  content,
  accent,
}: {
  title: string;
  content?: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-red-100 bg-white p-5">
      <div className={cn("mb-2 text-sm font-semibold", accent)}>{title}</div>
      <div className="whitespace-pre-wrap text-sm leading-6 text-gray-700">{content || "Chưa có nội dung."}</div>
    </div>
  );
}

export default LessonPlanWorkspace;