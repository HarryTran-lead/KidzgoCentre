"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardPen,
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
  Search,
  ShieldCheck,
  Upload,
  Users,
  X,
} from "lucide-react";

import { BASE_URL } from "@/constants/apiURL";
import { toast } from "@/hooks/use-toast";
import { getAllClasses } from "@/lib/api/classService";
import {
  ClassLessonPlanSyllabus,
  ClassLessonPlanSyllabusSession,
  createLessonPlan,
  createLessonPlanTemplate,
  getAllLessonPlanTemplates,
  getClassLessonPlanSyllabus,
  getLessonPlanById,
  getLessonPlanTemplateById,
  importLessonPlanTemplates,
  LessonPlan,
  LessonPlanTemplate,
  updateLessonPlan,
  updateLessonPlanTemplate,
  uploadLessonPlanFile,
} from "@/lib/api/lessonPlanService";
import { getAllProgramsForDropdown } from "@/lib/api/programService";
import { getTeacherClasses } from "@/lib/api/teacherService";

type WorkspaceScope = "teacher" | "staff-management" | "admin";
type ActiveTab = "templates" | "plans";
type TemplateStatusFilter = "all" | "active" | "inactive" | "withAttachment";
type PlanStatusFilter = "all" | "editable" | "hasPlan" | "missingPlan" | "withTemplate" | "reported" | "notReported";

type Option = {
  id: string;
  label: string;
  hint?: string;
};

type TemplateModalState =
  | { mode: "create" }
  | { mode: "edit"; item: LessonPlanTemplate }
  | null;

type PlanModalState =
  | { mode: "create"; session: ClassLessonPlanSyllabusSession }
  | { mode: "edit"; session: ClassLessonPlanSyllabusSession; plan: LessonPlan }
  | null;

type DetailState =
  | { type: "template"; loading: boolean; item: LessonPlanTemplate | null; error?: string }
  | { type: "plan"; loading: boolean; item: LessonPlan | null; error?: string }
  | null;

type DetailModalState = Exclude<DetailState, null>;



const COPY: Record<
  WorkspaceScope,
  {
    title: string;
    subtitle: string;
    planSubtitle: string;
  }
> = {
  teacher: {
    title: "Giáo án theo lớp",
    subtitle: "Theo dõi syllabus của lớp, tạo lesson plan theo từng buổi và cập nhật nội dung dạy thực tế.",
    planSubtitle: "Syllabus theo lớp của bạn",
  },
  "staff-management": {
    title: "Lesson Plan Workspace",
    subtitle: "Quản lý syllabus chuẩn, import template và rà soát lesson plan theo từng lớp.",
    planSubtitle: "Syllabus theo lớp toàn trung tâm",
  },
  admin: {
    title: "Lesson Plan Workspace",
    subtitle: "Quản trị template giáo án và đồng bộ luồng lesson plan theo contract backend mới.",
    planSubtitle: "Syllabus theo lớp toàn hệ thống",
  },
};

const BACKEND_ROOT_URL = BASE_URL.replace(/\/api\/?$/, "");

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function normalizeDateValue(value?: string | null) {
  if (!value) return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^0001-01-01([t\s].*)?$/i.test(trimmed)) return undefined;
  if (trimmed.toLowerCase() === "null") return undefined;

  const date = new Date(trimmed);
  if (!Number.isNaN(date.getTime()) && date.getUTCFullYear() <= 1) {
    return undefined;
  }

  return trimmed;
}

function formatDate(value?: string | null, withTime = false, fallback = "Chưa cập nhật") {
  const normalized = normalizeDateValue(value);
  if (!normalized) return fallback;

  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return normalized;

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
    ...(withTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
        }
      : {}),
  });
}

function resolveAttachmentUrl(url?: string | null) {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return `${BACKEND_ROOT_URL}${url}`;
  return `${BACKEND_ROOT_URL}/${url}`;
}

function buildClassOption(item: any): Option {
  const label =
    item?.title || item?.name || item?.classTitle || item?.code || item?.classCode || "Lớp học";
  const hint = [item?.code || item?.classCode, item?.programName, item?.level]
    .filter(Boolean)
    .join(" • ") || undefined;

  return {
    id: String(item?.id || ""),
    label,
    hint,
  };
}

function getTemplateStatus(item: LessonPlanTemplate) {
  return item.isActive === false ? "inactive" : "active";
}

function getPlanSummaryStatus(session: ClassLessonPlanSyllabusSession): PlanStatusFilter | "readonly" {
  if (!session.lessonPlanId) return "missingPlan";
  if (session.canEdit) return "editable";
  return "readonly";
}

function extractMessage(result: { message?: string; detail?: string; title?: string } | null | undefined, fallback: string) {
  return result?.message || result?.detail || result?.title || fallback;
}

function parseJsonContent(value?: string | null) {
  if (!value || !value.trim()) return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function getSessionDisplay(session: Pick<ClassLessonPlanSyllabusSession, "sessionIndex" | "sessionDate">) {
  return `Buổi ${session.sessionIndex}${normalizeDateValue(session.sessionDate) ? ` • ${formatDate(session.sessionDate, true)}` : ""}`;
}

function getClassDisplay(syllabus: ClassLessonPlanSyllabus | null) {
  if (!syllabus) return "Chưa chọn lớp";
  return syllabus.classTitle || syllabus.classCode || "Lớp học";
}

function getTemplateStats(templates: LessonPlanTemplate[]) {
  return [
    {
      title: "Tổng template",
      value: String(templates.length),
      subtitle: "Syllabus chuẩn theo program",
      icon: FolderOpen,
      color: "from-red-600 to-red-700",
    },
    {
      title: "Đang hoạt động",
      value: String(templates.filter((item) => getTemplateStatus(item) === "active").length),
      subtitle: "Sẵn sàng áp dụng",
      icon: CheckCircle2,
      color: "from-emerald-500 to-teal-500",
    },
    {
      title: "Có file đính kèm",
      value: String(templates.filter((item) => item.attachment).length),
      subtitle: "Có attachment tham chiếu",
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

function getPlanStats(syllabus: ClassLessonPlanSyllabus | null) {
  const sessions = syllabus?.sessions || [];

  return [
    {
      title: "Tổng session",
      value: String(sessions.length),
      subtitle: getClassDisplay(syllabus),
      icon: CalendarDays,
      color: "from-red-600 to-red-700",
    },
    {
      title: "Đã có lesson plan",
      value: String(sessions.filter((item) => item.lessonPlanId).length),
      subtitle: "Session đã được tạo bản ghi",
      icon: FileText,
      color: "from-emerald-500 to-teal-500",
    },
    {
      title: "Có thể chỉnh sửa",
      value: String(sessions.filter((item) => item.canEdit).length),
      subtitle: "Theo quyền hiện tại",
      icon: Pencil,
      color: "from-amber-500 to-orange-500",
    },
    {
      title: "Đã báo cáo",
      value: String(sessions.filter((item) => item.actualContent).length),
      subtitle: "Giáo viên đã báo cáo nội dung dạy",
      icon: ClipboardPen,
      color: "from-violet-500 to-purple-500",
    },
  ];
}

export function LessonPlanWorkspace({ scope }: { scope: WorkspaceScope }) {
  const [activeTab, setActiveTab] = useState<ActiveTab>(scope === "teacher" ? "plans" : "templates");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const [templates, setTemplates] = useState<LessonPlanTemplate[]>([]);
  const [classSyllabus, setClassSyllabus] = useState<ClassLessonPlanSyllabus | null>(null);
  const [programOptions, setProgramOptions] = useState<Option[]>([]);
  const [classOptions, setClassOptions] = useState<Option[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [templateStatusFilter, setTemplateStatusFilter] = useState<TemplateStatusFilter>("all");
  const [planStatusFilter, setPlanStatusFilter] = useState<PlanStatusFilter>("all");
  const [selectedProgramId, setSelectedProgramId] = useState("all");
  const [selectedClassId, setSelectedClassId] = useState("");

  const [templateModal, setTemplateModal] = useState<TemplateModalState>(null);
  const [planModal, setPlanModal] = useState<PlanModalState>(null);
  const [detailState, setDetailState] = useState<DetailState>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const scopeCopy = COPY[scope];
  const isTeacher = scope === "teacher";
  const templatesAvailable = !isTeacher;

  const templateMap = useMemo(() => {
    return new Map(templates.map((item) => [item.id, item]));
  }, [templates]);

  useEffect(() => {
    setActiveTab(scope === "teacher" ? "plans" : "templates");
  }, [scope]);

  const loadPrograms = async () => {
    if (!templatesAvailable) {
      setProgramOptions([]);
      return;
    }

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
    if (isTeacher) {
      const response = await getTeacherClasses({ pageNumber: 1, pageSize: 100 });
      const source = Array.isArray(response?.data?.classes?.items)
        ? response.data.classes.items
        : Array.isArray((response as any)?.data?.classes)
          ? (response as any).data.classes
          : [];

      const options = source.map(buildClassOption).filter((item: Option) => item.id);
      setClassOptions(options);
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

    const options = source.map(buildClassOption).filter((item: Option) => item.id);
    setClassOptions(options);
  };

  const loadTemplates = async () => {
    if (!templatesAvailable) {
      setTemplates([]);
      return;
    }

    const response = await getAllLessonPlanTemplates({ pageNumber: 1, pageSize: 200 });
    if (!response.isSuccess) {
      throw new Error(extractMessage(response, "Không thể tải danh sách template."));
    }

    setTemplates(response.data.templates.items);
  };

  const loadClassSyllabus = async (classId: string) => {
    if (!classId) {
      setClassSyllabus(null);
      return;
    }

    const response = await getClassLessonPlanSyllabus(classId);
    if (!response.isSuccess) {
      throw new Error(extractMessage(response, "Không thể tải syllabus của lớp."));
    }

    setClassSyllabus(response.data);
  };

  const refreshWorkspace = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    const tasks: Promise<void>[] = [loadClasses()];
    if (templatesAvailable) {
      tasks.push(loadPrograms(), loadTemplates());
    }

    const results = await Promise.allSettled(tasks);
    const rejected = results.find((item) => item.status === "rejected") as PromiseRejectedResult | undefined;

    if (rejected) {
      toast({
        title: "Không thể tải dữ liệu",
        description: rejected.reason?.message || "Đã xảy ra lỗi khi đồng bộ dữ liệu lesson plan.",
        variant: "destructive",
      });
    }

    setLoading(false);
    setRefreshing(false);
    setIsLoaded(true);
  };

  useEffect(() => {
    refreshWorkspace();
  }, [scope]);

  useEffect(() => {
    if (!classOptions.length) {
      return;
    }

    const exists = classOptions.some((item) => item.id === selectedClassId);
    if (!selectedClassId || !exists) {
      setSelectedClassId(classOptions[0].id);
    }
  }, [classOptions, selectedClassId]);

  useEffect(() => {
    if ((isTeacher || activeTab === "plans") && selectedClassId) {
      setLoading(true);
      loadClassSyllabus(selectedClassId)
        .catch((error) => {
          setClassSyllabus(null);
          toast({
            title: "Không thể tải syllabus",
            description: error?.message || "Vui lòng thử lại sau.",
            variant: "destructive",
          });
        })
        .finally(() => {
          setLoading(false);
          setRefreshing(false);
          setIsLoaded(true);
        });
    }
  }, [activeTab, isTeacher, selectedClassId]);

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

        return [
          item.title,
          item.programName,
          item.level,
          item.sessionIndex?.toString(),
          item.createdByName,
          item.sourceFileName,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
      })
      .sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      });
  }, [searchQuery, selectedProgramId, templateStatusFilter, templates]);

  const filteredSessions = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    const sessions = classSyllabus?.sessions || [];

    return sessions.filter((item) => {
      if (planStatusFilter === "editable" && !item.canEdit) {
        return false;
      }

      if (planStatusFilter === "hasPlan" && !item.lessonPlanId) {
        return false;
      }

      if (planStatusFilter === "missingPlan" && item.lessonPlanId) {
        return false;
      }

      if (planStatusFilter === "withTemplate" && !item.templateId) {
        return false;
      }

      if (planStatusFilter === "reported" && !item.actualContent) {
        return false;
      }

      if (planStatusFilter === "notReported" && item.actualContent) {
        return false;
      }

      if (!keyword) return true;

      return [
        item.sessionIndex?.toString(),
        item.templateTitle,
        item.plannedTeacherName,
        item.actualTeacherName,
        item.actualContent,
        item.actualHomework,
        item.teacherNotes,
        item.plannedContent,
        item.templateSyllabusContent,
        formatDate(item.sessionDate, true, ""),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [classSyllabus, planStatusFilter, searchQuery]);

  const stats = useMemo(() => {
    return activeTab === "templates" && templatesAvailable
      ? getTemplateStats(templates)
      : getPlanStats(classSyllabus);
  }, [activeTab, classSyllabus, templates, templatesAvailable]);

  const openAttachment = (url?: string | null) => {
    const resolvedUrl = resolveAttachmentUrl(url);
    if (!resolvedUrl || typeof window === "undefined") return;
    window.open(resolvedUrl, "_blank", "noopener,noreferrer");
  };

  const openTemplateDetail = async (templateId: string) => {
    setDetailState({ type: "template", loading: true, item: null });

    const response = await getLessonPlanTemplateById(templateId);
    if (!response.isSuccess || !response.data) {
      setDetailState({
        type: "template",
        loading: false,
        item: null,
        error: extractMessage(response, "Không thể tải chi tiết template."),
      });
      return;
    }

    setDetailState({ type: "template", loading: false, item: response.data });
  };

  const openPlanDetail = async (lessonPlanId: string) => {
    setDetailState({ type: "plan", loading: true, item: null });

    const response = await getLessonPlanById(lessonPlanId);
    if (!response.isSuccess || !response.data) {
      setDetailState({
        type: "plan",
        loading: false,
        item: null,
        error: extractMessage(response, "Không thể tải chi tiết lesson plan."),
      });
      return;
    }

    setDetailState({ type: "plan", loading: false, item: response.data });
  };

  const openTemplateEditor = async (template: LessonPlanTemplate) => {
    const response = await getLessonPlanTemplateById(template.id);
    if (!response.isSuccess || !response.data) {
      toast({
        title: "Không thể mở template",
        description: extractMessage(response, "Vui lòng thử lại sau."),
        variant: "destructive",
      });
      return;
    }

    setTemplateModal({ mode: "edit", item: response.data });
  };

  const openPlanEditor = async (session: ClassLessonPlanSyllabusSession) => {
    if (!session.lessonPlanId) {
      setPlanModal({ mode: "create", session });
      return;
    }

    const response = await getLessonPlanById(session.lessonPlanId);
    if (!response.isSuccess || !response.data) {
      toast({
        title: "Không thể mở lesson plan",
        description: extractMessage(response, "Vui lòng thử lại sau."),
        variant: "destructive",
      });
      return;
    }

    setPlanModal({ mode: "edit", session, plan: response.data });
  };

  const handleTemplateSubmit = async (
    payload: {
      programId: string;
      level: string;
      title: string;
      sessionIndex: number;
      syllabusMetadata?: string | null;
      syllabusContent?: string | null;
      sourceFileName?: string | null;
      attachment?: string | null;
      isActive?: boolean;
    },
    file: File | null
  ) => {
    let attachment = payload.attachment || null;

    if (file) {
      const uploaded = await uploadLessonPlanFile("template", file);
      attachment = uploaded.url;
    }

    const response =
      templateModal?.mode === "edit"
        ? await updateLessonPlanTemplate(templateModal.item.id, {
            level: payload.level,
            title: payload.title,
            sessionIndex: payload.sessionIndex,
            syllabusMetadata: payload.syllabusMetadata ?? null,
            syllabusContent: payload.syllabusContent ?? null,
            sourceFileName: payload.sourceFileName ?? null,
            attachment,
            isActive: payload.isActive ?? true,
          })
        : await createLessonPlanTemplate({
            programId: payload.programId,
            level: payload.level,
            title: payload.title,
            sessionIndex: payload.sessionIndex,
            syllabusMetadata: payload.syllabusMetadata ?? null,
            syllabusContent: payload.syllabusContent ?? null,
            sourceFileName: payload.sourceFileName ?? null,
            attachment,
          });

    if (!response.isSuccess) {
      throw new Error(extractMessage(response, "Không thể lưu template."));
    }

    toast({
      title: templateModal?.mode === "edit" ? "Đã cập nhật template" : "Đã tạo template",
      description: "Dữ liệu template đã được đồng bộ thành công.",
      variant: "success",
    });

    setTemplateModal(null);
    await loadTemplates();
  };

  const handleImportSubmit = async (payload: {
    file: File;
    programId?: string;
    level?: string;
    overwriteExisting: boolean;
  }) => {
    const response = await importLessonPlanTemplates({
      file: payload.file,
      programId: payload.programId,
      level: payload.level,
      overwriteExisting: payload.overwriteExisting,
    });

    if (!response.isSuccess || !response.data) {
      throw new Error(extractMessage(response, "Không thể import syllabus."));
    }

    const importedPrograms = response.data.programs
      .map((item) => `${item.programName || item.programId}: ${item.importedSessions}`)
      .join(" • ");

    toast({
      title: "Import syllabus thành công",
      description:
        importedPrograms || `Đã import ${response.data.importedCount} session template.`,
      variant: "success",
    });

    setShowImportModal(false);
    await loadTemplates();
  };

  const handlePlanSubmit = async (payload: {
    session: ClassLessonPlanSyllabusSession;
    templateId?: string | null;
    plannedContent?: string | null;
    actualContent?: string | null;
    actualHomework?: string | null;
    teacherNotes?: string | null;
  }) => {
    if (!classSyllabus?.classId) {
      throw new Error("Chưa có thông tin lớp để lưu lesson plan.");
    }

    const response =
      planModal?.mode === "edit"
        ? await updateLessonPlan(planModal.plan.id, {
            templateId: isTeacher ? (planModal.plan.templateId ?? null) : (payload.templateId ?? null),
            plannedContent: isTeacher ? (planModal.plan.plannedContent ?? null) : (payload.plannedContent ?? null),
            actualContent: payload.actualContent ?? null,
            actualHomework: payload.actualHomework ?? null,
            teacherNotes: payload.teacherNotes ?? null,
          })
        : await createLessonPlan({
            classId: classSyllabus.classId,
            sessionId: payload.session.sessionId,
            templateId: isTeacher ? (payload.session.templateId ?? null) : (payload.templateId ?? null),
            plannedContent: isTeacher ? null : (payload.plannedContent ?? null),
            actualContent: payload.actualContent ?? null,
            actualHomework: payload.actualHomework ?? null,
            teacherNotes: payload.teacherNotes ?? null,
          });

    if (!response.isSuccess) {
      throw new Error(extractMessage(response, "Không thể lưu lesson plan."));
    }

    toast({
      title: planModal?.mode === "edit" ? "Đã cập nhật lesson plan" : "Đã tạo lesson plan",
      description: "Dữ liệu của buổi học đã được làm mới theo backend mới.",
      variant: "success",
    });

    setPlanModal(null);
    await loadClassSyllabus(classSyllabus.classId);

    if (templatesAvailable) {
      await loadTemplates();
    }
  };

  const templateOptions = useMemo(() => {
    if (!classSyllabus?.programId) {
      return templates;
    }

    return templates.filter((item) => item.programId === classSyllabus.programId);
  }, [classSyllabus?.programId, templates]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/40 to-white p-6 space-y-6">
      <div className={cn("flex flex-col gap-4 transition-all duration-500", isLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2")}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-gradient-to-r from-red-600 to-red-700 p-3 text-white shadow-lg">
              <BookOpenCheck size={28} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{scopeCopy.title}</h1>
              <p className="mt-1 max-w-3xl text-sm text-gray-600">{scopeCopy.subtitle}</p>
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

            {templatesAvailable && activeTab === "templates" ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowImportModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100 cursor-pointer"
                >
                  <Upload size={16} />
                  Import syllabus
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateModal({ mode: "create" })}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg cursor-pointer"
                >
                  <Plus size={16} />
                  Tạo template
                </button>
              </>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-red-200 bg-gradient-to-r from-white to-red-50 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-900">Flow backend mới</div>
              <div className="mt-1 text-sm text-gray-600">
                {activeTab === "templates" && templatesAvailable
                  ? "Admin/Staff import syllabus vào lesson_plan_templates, quản lý theo Program + SessionIndex và chỉnh sửa từng session template khi cần."
                  : "Teacher và các role được phép xem syllabus theo lớp, tạo lesson plan ngay trên session chưa có bản ghi, rồi cập nhật actual/homework/teacher notes bằng PUT."}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-medium">
              {templatesAvailable ? (
                <>
                  <span className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-gray-700">Import xlsx/xls/csv</span>
                  <span className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-gray-700">Template theo program</span>
                </>
              ) : null}
              <span className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-gray-700">Syllabus theo lớp</span>
              <span className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-gray-700">Create/Edit theo session</span>
            </div>
          </div>
        </div>
      </div>

      <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4 transition-all duration-500", isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3")}>
        {stats.map((item) => (
          <StatCard key={item.title} {...item} />
        ))}
      </div>

      <div className={cn("rounded-2xl border border-red-200 bg-white p-5 shadow-sm transition-all duration-500", isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3")}>
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={activeTab === "templates" ? "Tìm theo tên template, program, source file..." : "Tìm theo buổi học, giáo viên, nội dung..."}
              className="w-full rounded-xl border border-red-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {templatesAvailable ? (
              <div className="inline-flex rounded-2xl border border-red-200 bg-white/70 p-1">
                <TabButton active={activeTab === "templates"} label="Template" onClick={() => setActiveTab("templates")} />
                <TabButton active={activeTab === "plans"} label="Syllabus lớp" onClick={() => setActiveTab("plans")} />
              </div>
            ) : null}

            <div className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm text-gray-700">
              <Filter size={16} className="text-gray-500" />
              {activeTab === "templates" && templatesAvailable ? (
                <>
                  <select
                    value={templateStatusFilter}
                    onChange={(event) => setTemplateStatusFilter(event.target.value as TemplateStatusFilter)}
                    className="bg-transparent text-sm focus:outline-none"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="active">Đang hoạt động</option>
                    <option value="inactive">Tạm ẩn</option>
                    <option value="withAttachment">Có attachment</option>
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
                    <option value="all">Tất cả session</option>
                    <option value="editable">Có thể chỉnh sửa</option>
                    <option value="hasPlan">Đã có lesson plan</option>
                    <option value="missingPlan">Chưa có lesson plan</option>
                    <option value="withTemplate">Đã map template</option>
                    <option value="reported">Đã báo cáo buổi dạy</option>
                    <option value="notReported">Chưa báo cáo buổi dạy</option>
                  </select>
                  <select
                    value={selectedClassId}
                    onChange={(event) => setSelectedClassId(event.target.value)}
                    className="border-l border-red-100 bg-transparent pl-2 text-sm focus:outline-none"
                  >
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

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-600">
            <Loader2 size={20} className="mr-3 animate-spin text-red-600" />
            Đang tải dữ liệu lesson plan...
          </div>
        ) : activeTab === "templates" && templatesAvailable ? (
          <TemplateTable
            items={filteredTemplates}
            onOpenAttachment={openAttachment}
            onOpenDetail={(item) => openTemplateDetail(item.id)}
            onEdit={openTemplateEditor}
          />
        ) : (
          <SyllabusView
            scope={scope}
            syllabus={classSyllabus}
            items={filteredSessions}
            templateMap={templateMap}
            onCreate={(session) => setPlanModal({ mode: "create", session })}
            onEdit={openPlanEditor}
            onOpenPlanDetail={(lessonPlanId) => openPlanDetail(lessonPlanId)}
            onOpenTemplateDetail={templatesAvailable ? openTemplateDetail : undefined}
          />
        )}
      </div>

      {templateModal ? (
        <TemplateFormModal
          initialValue={templateModal.mode === "edit" ? templateModal.item : null}
          programOptions={programOptions}
          existingTemplates={templates}
          defaultProgramId={templateModal.mode === "create" && selectedProgramId !== "all" ? selectedProgramId : undefined}
          onClose={() => setTemplateModal(null)}
          onSubmit={handleTemplateSubmit}
        />
      ) : null}

      {showImportModal ? (
        <ImportTemplateModal
          programOptions={programOptions}
          onClose={() => setShowImportModal(false)}
          onSubmit={handleImportSubmit}
        />
      ) : null}

      {planModal ? (
        <PlanFormModal
          scope={scope}
          classSyllabus={classSyllabus}
          session={planModal.session}
          initialValue={planModal.mode === "edit" ? planModal.plan : null}
          templateOptions={templateOptions}
          onClose={() => setPlanModal(null)}
          onSubmit={handlePlanSubmit}
        />
      ) : null}

      {detailState ? (
        <DetailModal
          state={detailState}
          linkedTemplate={
            detailState.type === "plan" && detailState.item?.templateId
              ? templateMap.get(detailState.item.templateId)
              : undefined
          }
          onClose={() => setDetailState(null)}
          onOpenAttachment={openAttachment}
        />
      ) : null}
    </div>
  );
}

function TemplateTable({
  items,
  onOpenAttachment,
  onOpenDetail,
  onEdit,
}: {
  items: LessonPlanTemplate[];
  onOpenAttachment: (url?: string | null) => void;
  onOpenDetail: (item: LessonPlanTemplate) => void;
  onEdit: (item: LessonPlanTemplate) => void;
}) {
  if (!items.length) {
    return <EmptyState title="Chưa có template phù hợp" subtitle="Thử đổi bộ lọc hoặc import syllabus để tạo dữ liệu mới." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b border-red-200 bg-red-50/70">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Template</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Program</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Session</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Source</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-red-100">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-red-50/40">
              <td className="px-4 py-4">
                <div className="font-semibold text-gray-900">{item.title}</div>
                <div className="mt-1 text-sm text-gray-500">Level {item.level || "-"}</div>
               </td>
              <td className="px-4 py-4 text-sm text-gray-700">
                <div>{item.programName || item.programId}</div>
                <div className="mt-1 text-xs text-gray-500">{item.createdByName || "Không rõ người tạo"}</div>
               </td>
              <td className="px-4 py-4 text-sm text-gray-700">Buổi {item.sessionIndex || "-"}</td>
              <td className="px-4 py-4 text-sm text-gray-700">
                <div>{item.sourceFileName || "Tạo thủ công"}</div>
                {item.attachment ? (
                  <button
                    type="button"
                    onClick={() => onOpenAttachment(item.attachment)}
                    className="mt-2 inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 cursor-pointer"
                  >
                    <Paperclip size={11} />
                    Mở file
                  </button>
                ) : null}
               </td>
              <td className="px-4 py-4">
                <div className="flex flex-wrap gap-2">
                  <StatusBadge kind={getTemplateStatus(item) === "active" ? "success" : "muted"}>
                    {getTemplateStatus(item) === "active" ? "Đang hoạt động" : "Tạm ẩn"}
                  </StatusBadge>
                  {item.attachment ? <StatusBadge kind="info">Có attachment</StatusBadge> : null}
                  {(item.usedCount || 0) > 0 ? <StatusBadge kind="warning">Dùng {item.usedCount} lần</StatusBadge> : null}
                </div>
               </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  <IconButton label="Xem chi tiết" onClick={() => onOpenDetail(item)}>
                    <Eye size={15} />
                  </IconButton>
                  <IconButton label="Chỉnh sửa" variant="warning" onClick={() => onEdit(item)}>
                    <Pencil size={15} />
                  </IconButton>
                </div>
               </td>
             </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SyllabusView({
  scope,
  syllabus,
  items,
  templateMap,
  onCreate,
  onEdit,
  onOpenPlanDetail,
  onOpenTemplateDetail,
}: {
  scope: WorkspaceScope;
  syllabus: ClassLessonPlanSyllabus | null;
  items: ClassLessonPlanSyllabusSession[];
  templateMap: Map<string, LessonPlanTemplate>;
  onCreate: (session: ClassLessonPlanSyllabusSession) => void;
  onEdit: (session: ClassLessonPlanSyllabusSession) => void;
  onOpenPlanDetail: (lessonPlanId: string) => void;
  onOpenTemplateDetail?: (templateId: string) => void;
}) {
  if (!syllabus) {
    return <EmptyState title="Chưa có syllabus" subtitle="Chọn một lớp để tải read model syllabus từ backend." />;
  }

  if (!items.length) {
    return <EmptyState title="Không có session phù hợp" subtitle="Thử đổi bộ lọc hoặc kiểm tra lớp này đã có session chưa." />;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-red-100 bg-gradient-to-r from-red-50/70 to-white p-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {syllabus.classCode || "Lớp chưa có mã"} {syllabus.classTitle ? `• ${syllabus.classTitle}` : ""}
            </div>
            <div className="mt-1 text-sm text-gray-600">
              {scope === "teacher" ? "Syllabus theo lớp của bạn" : "Syllabus theo lớp"} {syllabus.programName ? `• ${syllabus.programName}` : ""}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge kind="info">{items.length} session hiển thị</StatusBadge>
            {syllabus.programName ? <StatusBadge kind="muted">{syllabus.programName}</StatusBadge> : null}
          </div>
        </div>
        {syllabus.syllabusMetadata ? (
          <div className="mt-4 rounded-xl border border-red-100 bg-white p-4">
            <div className="mb-2 text-sm font-semibold text-red-600">Metadata chung của syllabus</div>
            <StructuredContent value={syllabus.syllabusMetadata} placeholder="Chưa có metadata." />
          </div>
        ) : null}
      </div>

      <div className="grid gap-4">
        {items.map((session) => {
          const linkedTemplate = session.templateId ? templateMap.get(session.templateId) : undefined;
          const status = getPlanSummaryStatus(session);
          const hasReport = Boolean(session.actualContent);

          return (
            <div key={session.sessionId} className={cn("rounded-2xl border p-5 shadow-sm", hasReport ? "border-emerald-200 bg-emerald-50/30" : "border-red-100 bg-white")}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-lg font-semibold text-gray-900">{getSessionDisplay(session)}</div>
                    {session.canEdit ? <StatusBadge kind="success">Có thể sửa</StatusBadge> : <StatusBadge kind="muted">Chỉ xem</StatusBadge>}
                    {session.templateId ? <StatusBadge kind="info">Đã map template</StatusBadge> : <StatusBadge kind="warning">Chưa map template</StatusBadge>}
                    {status === "missingPlan" ? <StatusBadge kind="warning">Chưa có lesson plan</StatusBadge> : <StatusBadge kind="success">Đã có lesson plan</StatusBadge>}
                    {hasReport ? (
                      <StatusBadge kind="success">
                        <span className="flex items-center gap-1"><ClipboardPen size={12} /> Đã báo cáo</span>
                      </StatusBadge>
                    ) : session.lessonPlanId ? (
                      <StatusBadge kind="warning">Chưa báo cáo</StatusBadge>
                    ) : null}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-600">
                    <span>Planned teacher: {session.plannedTeacherName || "-"}</span>
                    <span>Actual teacher: {session.actualTeacherName || "-"}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {session.templateId && onOpenTemplateDetail ? (
                    <button
                      type="button"
                      onClick={() => onOpenTemplateDetail(session.templateId!)}
                      className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 cursor-pointer"
                    >
                      <FolderOpen size={15} />
                      Xem template
                    </button>
                  ) : null}
                  {session.lessonPlanId ? (
                    <button
                      type="button"
                      onClick={() => onOpenPlanDetail(session.lessonPlanId!)}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 cursor-pointer"
                    >
                      <Eye size={15} />
                      Chi tiết
                    </button>
                  ) : null}
                  {session.canEdit ? (
                    scope === "teacher" ? (
                      <button
                        type="button"
                        onClick={() => (session.lessonPlanId ? onEdit(session) : onCreate(session))}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white hover:shadow-lg cursor-pointer",
                          hasReport
                            ? "bg-gradient-to-r from-emerald-600 to-emerald-700"
                            : "bg-gradient-to-r from-red-600 to-red-700"
                        )}
                      >
                        <ClipboardPen size={15} />
                        {hasReport ? "Cập nhật giáo án" : "Điền giáo án"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => (session.lessonPlanId ? onEdit(session) : onCreate(session))}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-3 py-2 text-sm font-semibold text-white hover:shadow-lg cursor-pointer"
                      >
                        {session.lessonPlanId ? <Pencil size={15} /> : <FilePlus2 size={15} />}
                        {session.lessonPlanId ? "Sửa lesson plan" : "Tạo lesson plan"}
                      </button>
                    )
                  ) : null}
                  {!session.canEdit && (session.actualContent || session.actualHomework || session.teacherNotes) ? (
                    <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                      <CheckCircle2 size={15} />
                      Đã báo cáo
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                <ContentPanel
                  title={session.templateTitle || linkedTemplate?.title || "Template content"}
                  subtitle="Syllabus chuẩn của session"
                  value={session.templateSyllabusContent || linkedTemplate?.syllabusContent}
                  accent="text-blue-700"
                />
                <ContentPanel
                  title="Planned content"
                  subtitle="Giáo án dự kiến sẽ được tạo hoặc cập nhật"
                  value={session.plannedContent}
                  accent="text-red-700"
                />
                <ContentPanel
                  title={hasReport ? "✅ Báo cáo nội dung dạy thực tế" : "Actual content"}
                  subtitle={hasReport ? `Giáo viên: ${session.actualTeacherName || session.plannedTeacherName || "Chưa xác định"}` : "Nội dung dạy thực tế"}
                  value={session.actualContent}
                  accent={hasReport ? "text-emerald-700" : "text-emerald-700"}
                />
                <ContentPanel
                  title="Homework / Teacher notes"
                  subtitle="Ghi chú sau buổi học"
                  value={
                    [session.actualHomework ? `Homework:\n${session.actualHomework}` : "", session.teacherNotes ? `Teacher notes:\n${session.teacherNotes}` : ""]
                      .filter(Boolean)
                      .join("\n\n") || null
                  }
                  accent="text-amber-700"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type TemplateActivityDraft = {
  time: string;
  book: string;
  skills: string;
  classwork: string;
  requiredMaterials: string;
  homeworkRequiredMaterials: string;
  extra: string;
};

type TemplateActivityPresetKey =
  | "warmUp"
  | "breaktime"
  | "goodbyeSong"
  | "homeworkCorrection";

const TEMPLATE_ACTIVITY_PRESETS: Array<{
  key: TemplateActivityPresetKey;
  label: string;
}> = [
  { key: "warmUp", label: "Warm Up" },
  { key: "homeworkCorrection", label: "Homework correction" },
  { key: "breaktime", label: "Breaktime" },
  { key: "goodbyeSong", label: "Goodbye song" },
];

function createEmptyTemplateActivity(): TemplateActivityDraft {
  return {
    time: "",
    book: "",
    skills: "",
    classwork: "",
    requiredMaterials: "",
    homeworkRequiredMaterials: "",
    extra: "",
  };
}

function createPresetTemplateActivity(preset: TemplateActivityPresetKey): TemplateActivityDraft {
  switch (preset) {
    case "warmUp":
      return {
        ...createEmptyTemplateActivity(),
        time: "5 mins",
        book: "Warm Up",
      };
    case "breaktime":
      return {
        ...createEmptyTemplateActivity(),
        time: "5 mins",
        classwork: "BREAKTIME",
      };
    case "goodbyeSong":
      return {
        ...createEmptyTemplateActivity(),
        time: "5 mins",
        book: "Goodbye song",
        requiredMaterials: "Assigned by teachers",
      };
    case "homeworkCorrection":
      return {
        ...createEmptyTemplateActivity(),
        classwork: "Homework correction",
      };
    default:
      return createEmptyTemplateActivity();
  }
}

function isActivityDraftEmpty(activity: TemplateActivityDraft) {
  return Object.values(activity).every((value) => !value.trim());
}

function getSuggestedNextSessionIndex(
  templates: LessonPlanTemplate[],
  programId?: string,
  excludeTemplateId?: string
) {
  if (!programId) return 1;

  const maxSessionIndex = templates
    .filter((item) => item.programId === programId && item.id !== excludeTemplateId)
    .reduce((maxValue, item) => Math.max(maxValue, item.sessionIndex || 0), 0);

  return maxSessionIndex + 1 || 1;
}

function asObject(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, any>) : {};
}

function pickStringValue(source: Record<string, any>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return "";
}

function linesFromUnknown(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? "").trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [] as string[];
}

function linesToTextarea(value: unknown) {
  return linesFromUnknown(value).join("\n");
}

function textareaToLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function omitKnownKeys(source: Record<string, any>, keys: string[]) {
  const clone = { ...source };

  keys.forEach((key) => {
    delete clone[key];
  });

  return clone;
}

function removeEmptyDeep(value: any): any {
  if (Array.isArray(value)) {
    return value
      .map((item) => removeEmptyDeep(item))
      .filter((item) => {
        if (item === null || item === undefined) return false;
        if (typeof item === "string") return item.trim().length > 0;
        if (Array.isArray(item)) return item.length > 0;
        if (typeof item === "object") return Object.keys(item).length > 0;
        return true;
      });
  }

  if (value && typeof value === "object") {
    const result: Record<string, any> = {};

    Object.entries(value).forEach(([key, item]) => {
      const cleaned = removeEmptyDeep(item);

      if (cleaned === null || cleaned === undefined) return;
      if (typeof cleaned === "string" && !cleaned.trim()) return;
      if (Array.isArray(cleaned) && cleaned.length === 0) return;
      if (typeof cleaned === "object" && !Array.isArray(cleaned) && Object.keys(cleaned).length === 0) return;

      result[key] = cleaned;
    });

    return result;
  }

  return value;
}

function activityDraftsFromUnknown(value: unknown) {
  if (!Array.isArray(value) || !value.length) {
    return [createEmptyTemplateActivity()];
  }

  return value.map((item) => {
    const source = asObject(item);

    return {
      time: pickStringValue(source, ["time"]),
      book: pickStringValue(source, ["book"]),
      skills: pickStringValue(source, ["skills"]),
      classwork: pickStringValue(source, ["classwork"]),
      requiredMaterials: pickStringValue(source, ["requiredMaterials"]),
      homeworkRequiredMaterials: pickStringValue(source, ["homeworkRequiredMaterials"]),
      extra: pickStringValue(source, ["extra"]),
    };
  });
}

function stringifyPrettyJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function TemplateFormModal({
  initialValue,
  programOptions,
  existingTemplates,
  defaultProgramId,
  onClose,
  onSubmit,
}: {
  initialValue: LessonPlanTemplate | null;
  programOptions: Option[];
  existingTemplates: LessonPlanTemplate[];
  defaultProgramId?: string;
  onClose: () => void;
  onSubmit: (
    payload: {
      programId: string;
      level: string;
      title: string;
      sessionIndex: number;
      syllabusMetadata?: string | null;
      syllabusContent?: string | null;
      sourceFileName?: string | null;
      attachment?: string | null;
      isActive?: boolean;
    },
    file: File | null
  ) => Promise<void>;
}) {
  const metadataSeed = asObject(parseJsonContent(initialValue?.syllabusMetadata));
  const contentSeed = asObject(parseJsonContent(initialValue?.syllabusContent));
  const initialProgramId = initialValue?.programId || defaultProgramId || "";
  const isEdit = Boolean(initialValue);

  const [programId, setProgramId] = useState(initialProgramId);
  const [level, setLevel] = useState(initialValue?.level || "");
  const [title, setTitle] = useState(initialValue?.title || "");
  const [sessionIndex, setSessionIndex] = useState(
    initialValue?.sessionIndex ||
      getSuggestedNextSessionIndex(existingTemplates, initialProgramId, initialValue?.id) ||
      1
  );
  const [sessionIndexTouched, setSessionIndexTouched] = useState(Boolean(initialValue));

  // Metadata fields
  const [dayLabel, setDayLabel] = useState(pickStringValue(metadataSeed, ["day", "days", "scheduleDays"]));
  const [durationLabel, setDurationLabel] = useState(pickStringValue(metadataSeed, ["duration"]));
  const [generalInformation, setGeneralInformation] = useState(
    pickStringValue(metadataSeed, ["generalInformation", "generalInfo", "description"])
  );
  const [teachingMaterialsText, setTeachingMaterialsText] = useState(linesToTextarea(metadataSeed.teachingMaterials));
  const [sheetNote, setSheetNote] = useState(
    pickStringValue(metadataSeed, ["note"]) || linesToTextarea(metadataSeed.note)
  );

  // Content fields
  const [teacherName, setTeacherName] = useState(pickStringValue(contentSeed, ["teacherName"]));
  const [homeworkLabel, setHomeworkLabel] = useState(pickStringValue(contentSeed, ["homeworkLabel"]) || "HOMEWORK");
  const [homeworkMaterialsText, setHomeworkMaterialsText] = useState(linesToTextarea(contentSeed.homeworkMaterials));
  const [homeworkNotesText, setHomeworkNotesText] = useState(linesToTextarea(contentSeed.homeworkNotes));
  const [activities, setActivities] = useState<TemplateActivityDraft[]>(
    activityDraftsFromUnknown(contentSeed.activities)
  );

  // File/meta
  const [sourceFileName, setSourceFileName] = useState(initialValue?.sourceFileName || "");
  const [attachment, setAttachment] = useState(initialValue?.attachment || "");
  const [isActive, setIsActive] = useState(initialValue?.isActive ?? true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggestedNextSessionIndex = useMemo(
    () => getSuggestedNextSessionIndex(existingTemplates, programId, initialValue?.id),
    [existingTemplates, initialValue?.id, programId]
  );

  useEffect(() => {
    if (isEdit || sessionIndexTouched) return;
    setSessionIndex(suggestedNextSessionIndex);
  }, [isEdit, sessionIndexTouched, suggestedNextSessionIndex]);

  const generatedMetadataObject = useMemo(() => {
    return removeEmptyDeep({
      day: dayLabel.trim(),
      duration: durationLabel.trim(),
      generalInformation: generalInformation.trim(),
      teachingMaterials: textareaToLines(teachingMaterialsText),
      note: sheetNote.trim(),
    });
  }, [dayLabel, durationLabel, generalInformation, sheetNote, teachingMaterialsText]);

  const generatedContentObject = useMemo(() => {
    const cleanedActivities = activities
      .map((item) =>
        removeEmptyDeep({
          time: item.time.trim(),
          book: item.book.trim(),
          skills: item.skills.trim(),
          classwork: item.classwork.trim(),
          requiredMaterials: item.requiredMaterials.trim(),
          homeworkRequiredMaterials: item.homeworkRequiredMaterials.trim(),
          extra: item.extra.trim(),
        })
      )
      .filter((item) => Object.keys(item).length > 0);

    return removeEmptyDeep({
      sessionIndex,
      title: title.trim(),
      teacherName: teacherName.trim(),
      homeworkLabel: homeworkLabel.trim(),
      homeworkMaterials: textareaToLines(homeworkMaterialsText),
      homeworkNotes: textareaToLines(homeworkNotesText),
      activities: cleanedActivities,
    });
  }, [activities, homeworkLabel, homeworkMaterialsText, homeworkNotesText, sessionIndex, teacherName, title]);

  const updateActivity = (index: number, key: keyof TemplateActivityDraft, value: string) => {
    setActivities((current) =>
      current.map((item, i) => (i === index ? { ...item, [key]: value } : item))
    );
  };

  const addActivity = () => setActivities((current) => [...current, createEmptyTemplateActivity()]);

  const addPresetActivity = (preset: TemplateActivityPresetKey) => {
    setActivities((current) => {
      const nextActivity = createPresetTemplateActivity(preset);
      if (current.length === 1 && isActivityDraftEmpty(current[0])) return [nextActivity];
      return [...current, nextActivity];
    });
  };

  const duplicateActivity = (index: number) => {
    setActivities((current) => {
      const source = current[index];
      if (!source) return current;
      const next = [...current];
      next.splice(index + 1, 0, { ...source });
      return next;
    });
  };

  const removeActivity = (index: number) => {
    setActivities((current) =>
      current.length <= 1 ? [createEmptyTemplateActivity()] : current.filter((_, i) => i !== index)
    );
  };

  const handleReset = () => {
    setProgramId(initialProgramId);
    setLevel(initialValue?.level || "");
    setTitle(initialValue?.title || "");
    setSessionIndex(
      initialValue?.sessionIndex ||
        getSuggestedNextSessionIndex(existingTemplates, initialProgramId, initialValue?.id) ||
        1
    );
    setDayLabel(pickStringValue(metadataSeed, ["day", "days", "scheduleDays"]));
    setDurationLabel(pickStringValue(metadataSeed, ["duration"]));
    setGeneralInformation(pickStringValue(metadataSeed, ["generalInformation", "generalInfo", "description"]));
    setTeachingMaterialsText(linesToTextarea(metadataSeed.teachingMaterials));
    setSheetNote(pickStringValue(metadataSeed, ["note"]) || linesToTextarea(metadataSeed.note));
    setTeacherName(pickStringValue(contentSeed, ["teacherName"]));
    setHomeworkLabel(pickStringValue(contentSeed, ["homeworkLabel"]) || "HOMEWORK");
    setHomeworkMaterialsText(linesToTextarea(contentSeed.homeworkMaterials));
    setHomeworkNotesText(linesToTextarea(contentSeed.homeworkNotes));
    setActivities(activityDraftsFromUnknown(contentSeed.activities));
    setSourceFileName(initialValue?.sourceFileName || "");
    setAttachment(initialValue?.attachment || "");
    setIsActive(initialValue?.isActive ?? true);
    setSelectedFile(null);
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!programId.trim()) { setError("Vui lòng chọn program."); return; }
    if (!level.trim()) { setError("Vui lòng nhập level."); return; }
    if (!title.trim()) { setError("Vui lòng nhập tiêu đề."); return; }
    if (sessionIndex <= 0) { setError("Session index phải lớn hơn 0."); return; }

    const metadataPayload = stringifyPrettyJson(generatedMetadataObject);
    const contentPayload = stringifyPrettyJson(generatedContentObject);

    setSubmitting(true);
    try {
      await onSubmit(
        {
          programId,
          level: level.trim(),
          title: title.trim(),
          sessionIndex,
          syllabusMetadata: metadataPayload || null,
          syllabusContent: contentPayload || null,
          sourceFileName: sourceFileName.trim() || null,
          attachment: attachment.trim() || null,
          isActive,
        },
        selectedFile
      );
    } catch (submitError: any) {
      setError(submitError?.message || "Không thể lưu template.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalFrame
      title={isEdit ? "Cập nhật template" : "Tạo template"}
      subtitle="Nhập theo đúng bố cục Excel: thông tin chung ở trên, activities của từng session ở dưới."
      icon={FolderOpen}
      onClose={onClose}
      widthClass="max-w-6xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Program">
            <select
              value={programId}
              onChange={(event) => setProgramId(event.target.value)}
              disabled={isEdit}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:bg-gray-50"
            >
              <option value="">Chọn program</option>
              {programOptions.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Level">
            <input
              value={level}
              onChange={(event) => setLevel(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
              placeholder="Ví dụ: Starters"
            />
          </Field>

          <Field label="Tiêu đề session">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
              placeholder="Ví dụ: Warm Up"
            />
          </Field>

          <Field label="Session index">
            <input
              type="number"
              min={1}
              value={sessionIndex}
              onChange={(event) => {
                setSessionIndexTouched(true);
                setSessionIndex(Number(event.target.value) || 1);
              }}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
            />
            {!isEdit && programId ? (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span>Gợi ý tiếp theo: {suggestedNextSessionIndex}</span>
                <button
                  type="button"
                  onClick={() => { setSessionIndexTouched(true); setSessionIndex(suggestedNextSessionIndex); }}
                  className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-700 hover:bg-amber-100 cursor-pointer"
                >
                  Dùng gợi ý
                </button>
              </div>
            ) : null}
          </Field>
        </div>

        {/* Metadata chung */}
        <div className="rounded-2xl border border-gray-200 bg-red-50/40 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-red-700">Thông tin chung của Syllabus</div>
            <StatusBadge kind="info">syllabusMetadata</StatusBadge>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Day">
              <input
                value={dayLabel}
                onChange={(event) => setDayLabel(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                placeholder="Ví dụ: Monday and Saturday"
              />
            </Field>

            <Field label="Duration">
              <input
                value={durationLabel}
                onChange={(event) => setDurationLabel(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                placeholder="Ví dụ: 11/07/2022 - 2022"
              />
            </Field>
          </div>

          <Field label="General information">
            <textarea
              value={generalInformation}
              onChange={(event) => setGeneralInformation(event.target.value)}
              rows={3}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
              placeholder="Nhập mô tả chung của syllabus"
            />
          </Field>

          <Field label="Teaching materials">
            <p className="mb-2 text-xs text-gray-500">Mỗi dòng là một tài liệu, ví dụ: `Handbook for Reading: https://...`</p>
            <textarea
              value={teachingMaterialsText}
              onChange={(event) => setTeachingMaterialsText(event.target.value)}
              rows={4}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
              placeholder={"Handbook for Reading: https://...\nGrapeseed (video): https://...\nCourse book / workbook: ..."}
            />
          </Field>

          <Field label="Note">
            <textarea
              value={sheetNote}
              onChange={(event) => setSheetNote(event.target.value)}
              rows={2}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
              placeholder="Ví dụ: Course book accounts for 80% of the lesson..."
            />
          </Field>
        </div>

        {/* Nội dung session */}
        <div className="rounded-2xl border border-gray-200 bg-blue-50/30 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-blue-700">Nội dung session</div>
            <StatusBadge kind="info">syllabusContent</StatusBadge>
          </div>

          <Field label="Teacher">
            <input
              value={teacherName}
              onChange={(event) => setTeacherName(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
              placeholder="Ví dụ: Vietnamese Teacher"
            />
          </Field>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 space-y-4">
            <div className="text-sm font-semibold text-amber-800">Homework block</div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Homework label">
                <input
                  value={homeworkLabel}
                  onChange={(event) => setHomeworkLabel(event.target.value)}
                  className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-200"
                  placeholder="HOMEWORK"
                />
              </Field>

              <Field label="Required materials">
                <textarea
                  value={homeworkMaterialsText}
                  onChange={(event) => setHomeworkMaterialsText(event.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-200"
                  placeholder={"Pages 80,81,82\nVideo repeat"}
                />
              </Field>

              <Field label="Extra / Note">
                <textarea
                  value={homeworkNotesText}
                  onChange={(event) => setHomeworkNotesText(event.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-200"
                  placeholder={"1. Quay video đọc bài...\n2. Chụp phần bài làm..."}
                />
              </Field>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm font-semibold text-blue-700">Activities</div>
              <div className="flex flex-wrap items-center gap-2">
                {TEMPLATE_ACTIVITY_PRESETS.map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => addPresetActivity(preset.key)}
                    className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 hover:bg-amber-100 cursor-pointer"
                  >
                    + {preset.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={addActivity}
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 cursor-pointer"
                >
                  <Plus size={14} />
                  Thêm trống
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-300">
              <table className="min-w-[1100px] border-collapse text-sm">
                <thead>
                  <tr className="bg-amber-50 text-gray-700">
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">#</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Time</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Book</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Skills</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Classwork</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Required Materials</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Homework Materials</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Extra / Note</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity, index) => (
                    <tr key={index} className="align-top">
                      <td className="border border-gray-300 px-3 py-3 font-semibold text-gray-600">{index + 1}</td>
                      <td className="border border-gray-300 p-1.5">
                        <input
                          value={activity.time}
                          onChange={(event) => updateActivity(index, "time", event.target.value)}
                          className="w-20 rounded-lg border border-transparent bg-white px-2 py-2 text-sm focus:border-red-200 focus:outline-none focus:ring-2 focus:ring-red-100"
                          placeholder="5 mins"
                        />
                      </td>
                      <td className="border border-gray-300 p-1.5">
                        <input
                          value={activity.book}
                          onChange={(event) => updateActivity(index, "book", event.target.value)}
                          className="w-full rounded-lg border border-transparent bg-white px-2 py-2 text-sm focus:border-red-200 focus:outline-none focus:ring-2 focus:ring-red-100"
                          placeholder="B1 DESTINATION"
                        />
                      </td>
                      <td className="border border-gray-300 p-1.5">
                        <input
                          value={activity.skills}
                          onChange={(event) => updateActivity(index, "skills", event.target.value)}
                          className="w-full rounded-lg border border-transparent bg-white px-2 py-2 text-sm focus:border-red-200 focus:outline-none focus:ring-2 focus:ring-red-100"
                          placeholder="Speaking"
                        />
                      </td>
                      <td className="border border-gray-300 p-1.5">
                        <textarea
                          value={activity.classwork}
                          onChange={(event) => updateActivity(index, "classwork", event.target.value)}
                          rows={2}
                          className="w-full rounded-lg border border-transparent bg-white px-2 py-2 text-sm focus:border-red-200 focus:outline-none focus:ring-2 focus:ring-red-100"
                          placeholder={"WARM UP\nHomework Correction"}
                        />
                      </td>
                      <td className="border border-gray-300 p-1.5">
                        <textarea
                          value={activity.requiredMaterials}
                          onChange={(event) => updateActivity(index, "requiredMaterials", event.target.value)}
                          rows={2}
                          className="w-full rounded-lg border border-transparent bg-white px-2 py-2 text-sm focus:border-red-200 focus:outline-none focus:ring-2 focus:ring-red-100"
                          placeholder="page 101,102"
                        />
                      </td>
                      <td className="border border-gray-300 p-1.5">
                        <textarea
                          value={activity.homeworkRequiredMaterials}
                          onChange={(event) => updateActivity(index, "homeworkRequiredMaterials", event.target.value)}
                          rows={2}
                          className="w-full rounded-lg border border-transparent bg-white px-2 py-2 text-sm focus:border-red-200 focus:outline-none focus:ring-2 focus:ring-red-100"
                          placeholder="HOMEWORK"
                        />
                      </td>
                      <td className="border border-gray-300 p-1.5">
                        <textarea
                          value={activity.extra}
                          onChange={(event) => updateActivity(index, "extra", event.target.value)}
                          rows={2}
                          className="w-full rounded-lg border border-transparent bg-white px-2 py-2 text-sm focus:border-red-200 focus:outline-none focus:ring-2 focus:ring-red-100"
                          placeholder="Handbook 88,89"
                        />
                      </td>
                      <td className="border border-gray-300 px-2 py-2">
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => duplicateActivity(index)}
                            className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 cursor-pointer"
                          >
                            Clone
                          </button>
                          <button
                            type="button"
                            onClick={() => removeActivity(index)}
                            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 cursor-pointer"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Source file name">
            <input
              value={sourceFileName}
              onChange={(event) => setSourceFileName(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
              placeholder="syllabus_template_1_mau.xlsx"
            />
          </Field>

          <Field label="Attachment URL">
            <input
              value={attachment}
              onChange={(event) => setAttachment(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
              placeholder="https://..."
            />
          </Field>
        </div>

        <Field label="Tải file attachment">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-red-200 bg-red-50/60 px-4 py-3 text-sm text-gray-600 hover:bg-red-50">
            <Upload size={16} className="text-red-600" />
            <span>{selectedFile ? selectedFile.name : "Chọn file để upload vào attachment"}</span>
            <input
              type="file"
              className="hidden"
              onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
            />
          </label>
        </Field>

        {isEdit ? (
          <Field label="Trạng thái">
            <div className="grid grid-cols-2 gap-3">
              <ToggleButton active={isActive} onClick={() => setIsActive(true)} label="Đang hoạt động" />
              <ToggleButton active={!isActive} onClick={() => setIsActive(false)} label="Tạm ẩn" />
            </div>
          </Field>
        ) : null}

        {error ? <ErrorBox message={error} /> : null}

        <ModalActions
          onClose={onClose}
          onReset={handleReset}
          submitting={submitting}
          submitLabel={isEdit ? "Lưu template" : "Tạo template"}
          showReset={true}
        />
      </form>
    </ModalFrame>
  );
}

function ImportTemplateModal({
  programOptions,
  onClose,
  onSubmit,
}: {
  programOptions: Option[];
  onClose: () => void;
  onSubmit: (payload: {
    file: File;
    programId?: string;
    level?: string;
    overwriteExisting: boolean;
  }) => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [programId, setProgramId] = useState("");
  const [level, setLevel] = useState("");
  const [overwriteExisting, setOverwriteExisting] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!file) {
      setError("Vui lòng chọn file xlsx/xls/csv.");
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit({
        file,
        programId: programId || undefined,
        level: level.trim() || undefined,
        overwriteExisting,
      });
    } catch (submitError: any) {
      setError(submitError?.message || "Không thể import syllabus.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalFrame
      title="Import syllabus template"
      subtitle="Dùng POST /api/lesson-plan-templates/import với multipart/form-data và overwriteExisting."
      icon={Upload}
      onClose={onClose}
      widthClass="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 p-6">
        <Field label="File syllabus">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-red-200 bg-red-50/60 px-4 py-4 text-sm text-gray-700 hover:bg-red-50">
            <Upload size={16} className="text-red-600" />
            <span>{file ? file.name : "Chọn file xlsx/xls/csv để import"}</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
          </label>
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Program (bắt buộc khi import csv)">
            <select
              value={programId}
              onChange={(event) => setProgramId(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
            >
              <option value="">Để backend tự map</option>
              {programOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Level">
            <input
              value={level}
              onChange={(event) => setLevel(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
              placeholder="Ví dụ: Flyers"
            />
          </Field>
        </div>

        <Field label="Overwrite existing">
          <div className="grid grid-cols-2 gap-3">
            <ToggleButton
              active={overwriteExisting}
              onClick={() => setOverwriteExisting(true)}
              label="true - cập nhật lại"
            />
            <ToggleButton
              active={!overwriteExisting}
              onClick={() => setOverwriteExisting(false)}
              label="false - bỏ qua"
            />
          </div>
        </Field>

        {error ? <ErrorBox message={error} /> : null}

        <ModalActions
          onClose={onClose}
          submitting={submitting}
          submitLabel="Import file"
          showReset={false}
        />
      </form>
    </ModalFrame>
  );
}

function PlanFormModal({
  scope,
  classSyllabus,
  session,
  initialValue,
  templateOptions,
  onClose,
  onSubmit,
}: {
  scope: WorkspaceScope;
  classSyllabus: ClassLessonPlanSyllabus | null;
  session: ClassLessonPlanSyllabusSession;
  initialValue: LessonPlan | null;
  templateOptions: LessonPlanTemplate[];
  onClose: () => void;
  onSubmit: (payload: {
    session: ClassLessonPlanSyllabusSession;
    templateId?: string | null;
    plannedContent?: string | null;
    actualContent?: string | null;
    actualHomework?: string | null;
    teacherNotes?: string | null;
  }) => Promise<void>;
}) {
  const [templateId, setTemplateId] = useState(initialValue?.templateId || session.templateId || "");
  const [plannedContent, setPlannedContent] = useState(initialValue?.plannedContent || session.plannedContent || session.templateSyllabusContent || "");
  const [actualContent, setActualContent] = useState(initialValue?.actualContent || session.actualContent || "");
  const [actualHomework, setActualHomework] = useState(initialValue?.actualHomework || session.actualHomework || "");
  const [teacherNotes, setTeacherNotes] = useState(initialValue?.teacherNotes || session.teacherNotes || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(initialValue);
  const isTeacher = scope === "teacher";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (isTeacher && !actualContent.trim()) {
      setError("Vui lòng nhập nội dung dạy thực tế.");
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit({
        session,
        templateId: isTeacher ? session.templateId || null : templateId || null,
        plannedContent: isTeacher ? undefined : plannedContent.trim() || null,
        actualContent: actualContent.trim() || null,
        actualHomework: actualHomework.trim() || null,
        teacherNotes: teacherNotes.trim() || null,
      });
    } catch (submitError: any) {
      setError(submitError?.message || "Không thể lưu lesson plan.");
    } finally {
      setSubmitting(false);
    }
  };

  const refContent = session.templateSyllabusContent || session.plannedContent || initialValue?.plannedContent;

  return (
    <ModalFrame
      title={isTeacher ? (isEdit ? "Cập nhật giáo án" : "Điền giáo án buổi dạy") : (isEdit ? "Cập nhật lesson plan" : "Tạo lesson plan")}
      subtitle={isTeacher ? "Xem nội dung giáo án chuẩn (chỉ đọc) và điền nội dung dạy thực tế, bài tập, ghi chú." : "Session đã được khóa sẵn theo read model syllabus. Có thể để plannedContent trống để backend tự copy từ template."}
      icon={isTeacher ? ClipboardPen : FilePlus2}
      onClose={onClose}
      widthClass="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard
            icon={Users}
            label="Lớp học"
            value={classSyllabus?.classTitle || classSyllabus?.classCode || classSyllabus?.classId || "-"}
          />
          <InfoCard icon={CalendarDays} label="Session" value={getSessionDisplay(session)} />
        </div>

        {isTeacher ? (
          <>
            {refContent ? (
              <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4">
                <div className="mb-1 flex items-center gap-2">
                  <BookOpenCheck size={15} className="text-blue-600" />
                  <span className="text-sm font-semibold text-blue-700">Nội dung giáo án Admin đã soạn</span>
                  <span className="ml-auto rounded-full border border-blue-200 bg-white px-2.5 py-0.5 text-xs text-blue-600">Chỉ đọc</span>
                </div>
                <div className="mt-3 max-h-56 overflow-y-auto">
                  <StructuredContent value={refContent} placeholder="Chưa có nội dung chuẩn." />
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                Admin chưa soạn giáo án chuẩn cho buổi này.
              </div>
            )}

            <Field label="Nội dung dạy thực tế *">
              <p className="mb-2 text-xs text-gray-500">Mô tả chi tiết nội dung bạn đã dạy trong buổi học hôm nay.</p>
              <textarea
                value={actualContent}
                onChange={(event) => setActualContent(event.target.value)}
                rows={6}
                autoFocus
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                placeholder="VD: Hôm nay dạy Unit 3 - Animals, các bé học được tên các con vật, luyện phát âm..."
              />
            </Field>

            <Field label="Bài tập về nhà">
              <textarea
                value={actualHomework}
                onChange={(event) => setActualHomework(event.target.value)}
                rows={3}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                placeholder="VD: Workbook trang 15-16, học thuộc từ vựng Unit 3..."
              />
            </Field>

            <Field label="Ghi chú thêm">
              <textarea
                value={teacherNotes}
                onChange={(event) => setTeacherNotes(event.target.value)}
                rows={3}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                placeholder="VD: Bé An vắng mặt, cần gửi bài bù..."
              />
            </Field>
          </>
        ) : (
          <>
            <Field label="Template (tùy chọn)">
              <select
                value={templateId}
                onChange={(event) => setTemplateId(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
              >
                <option value="">Để backend tự resolve theo Program + SessionIndex</option>
                {templateOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title} • Level {item.level} • Buổi {item.sessionIndex}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="plannedContent">
              <p className="mb-2 text-xs text-gray-500">
                Giáo án dự kiến. Nếu để trống, backend tự copy từ template chuẩn khi tạo mới.
              </p>
              <textarea
                value={plannedContent}
                onChange={(event) => setPlannedContent(event.target.value)}
                rows={8}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-mono text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                placeholder='{"sessionIndex":1,"activities":[]}'
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="actualContent">
                <textarea
                  value={actualContent}
                  onChange={(event) => setActualContent(event.target.value)}
                  rows={5}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                  placeholder="Nội dung dạy thực tế"
                />
              </Field>
              <Field label="actualHomework">
                <textarea
                  value={actualHomework}
                  onChange={(event) => setActualHomework(event.target.value)}
                  rows={5}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                  placeholder="Bài tập về nhà"
                />
              </Field>
            </div>

            <Field label="teacherNotes">
              <textarea
                value={teacherNotes}
                onChange={(event) => setTeacherNotes(event.target.value)}
                rows={4}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                placeholder="Ghi chú giáo viên"
              />
            </Field>
          </>
        )}

        {error ? <ErrorBox message={error} /> : null}

        <ModalActions
          onClose={onClose}
          submitting={submitting}
          submitLabel={isTeacher ? "Lưu nội dung buổi dạy" : (isEdit ? "Lưu lesson plan" : "Tạo lesson plan")}
          showReset={false}
        />
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
  const title = state.type === "template" ? "Chi tiết template" : "Chi tiết lesson plan";
  const subtitle =
    state.type === "template"
      ? "Dữ liệu lấy từ GET /api/lesson-plan-templates/{id}."
      : "Dữ liệu lấy từ GET /api/lesson-plans/{id}.";

  if (state.loading) {
    return (
      <ModalFrame title={title} subtitle={subtitle} icon={state.type === "template" ? FolderOpen : FileText} onClose={onClose} widthClass="max-w-5xl">
        <div className="flex items-center justify-center py-16 text-gray-600">
          <Loader2 size={20} className="mr-3 animate-spin text-red-600" />
          Đang tải chi tiết...
        </div>
      </ModalFrame>
    );
  }

  if (state.error) {
    return (
      <ModalFrame title={title} subtitle={subtitle} icon={state.type === "template" ? FolderOpen : FileText} onClose={onClose} widthClass="max-w-5xl">
        <div className="p-6">
          <ErrorBox message={state.error} />
        </div>
      </ModalFrame>
    );
  }

  return (
    <ModalFrame title={title} subtitle={subtitle} icon={state.type === "template" ? FolderOpen : FileText} onClose={onClose} widthClass="max-w-5xl">
      <div className="space-y-5 p-6">
        {state.type === "template" && state.item ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <InfoCard icon={BookOpenCheck} label="Program" value={state.item.programName || state.item.programId || "-"} />
              <InfoCard icon={GraduationCap} label="Level / Buổi" value={`Level ${state.item.level || "-"} • Buổi ${state.item.sessionIndex || "-"}`} />
              <InfoCard icon={Users} label="Người tạo" value={state.item.createdByName || "-"} />
              <InfoCard icon={Clock3} label="Thời gian" value={formatDate(state.item.updatedAt || state.item.createdAt, true)} />
            </div>

            <ContentPanel title="Tiêu đề" value={state.item.title} accent="text-red-700" />
            <ContentPanel title="syllabusMetadata" value={state.item.syllabusMetadata} accent="text-blue-700" />
            <ContentPanel title="syllabusContent" value={state.item.syllabusContent} accent="text-emerald-700" />
            <ContentPanel title="sourceFileName" value={state.item.sourceFileName} accent="text-amber-700" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-red-600">Attachment</div>
                {state.item.attachment ? (
                  <button
                    type="button"
                    onClick={() => onOpenAttachment(state.item!.attachment)}
                    className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 cursor-pointer"
                  >
                    <Paperclip size={12} />
                    Mở file
                  </button>
                ) : null}
              </div>
              <div className="text-sm text-gray-700">{state.item.attachment || "Chưa có file đính kèm"}</div>
            </div>
          </>
        ) : state.type === "plan" && state.item ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <InfoCard icon={Users} label="Lớp học" value={state.item.classTitle || state.item.classCode || state.item.classId || "-"} />
              <InfoCard icon={CalendarDays} label="Buổi học" value={state.item.sessionTitle || formatDate(state.item.sessionDate, true)} />
              <InfoCard icon={ShieldCheck} label="Người cập nhật" value={state.item.submittedByName || "-"} />
              <InfoCard icon={Clock3} label="Thời gian" value={formatDate(state.item.updatedAt || state.item.createdAt || state.item.submittedAt, true)} />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <ContentPanel title="plannedContent" value={state.item.plannedContent} accent="text-red-700" />
              <ContentPanel title="actualContent" value={state.item.actualContent} accent="text-emerald-700" />
              <ContentPanel title="actualHomework" value={state.item.actualHomework} accent="text-amber-700" />
              <ContentPanel title="teacherNotes" value={state.item.teacherNotes} accent="text-gray-700" />
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="mb-3 text-sm font-semibold text-red-600">Template liên kết</div>
              {state.item.templateId ? (
                <div className="space-y-2 text-sm text-gray-700">
                  <div>{linkedTemplate?.title || state.item.templateTitle || "Template đã gắn"}</div>
                  <div className="text-gray-500">
                    {state.item.templateLevel || linkedTemplate?.level ? `Level ${state.item.templateLevel || linkedTemplate?.level}` : "Không có level"}
                    {state.item.templateSessionIndex || linkedTemplate?.sessionIndex
                      ? ` • Buổi ${state.item.templateSessionIndex || linkedTemplate?.sessionIndex}`
                      : ""}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">Lesson plan này chưa gắn template.</div>
              )}
            </div>
          </>
        ) : (
          <EmptyState title="Không có dữ liệu chi tiết" subtitle="Backend không trả về bản ghi phù hợp." />
        )}

        <div className="flex items-center justify-end border-t border-gray-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:shadow-lg cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </ModalFrame>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700">{label}</label>
      {children}
    </div>
  );
}

function ModalActions({
  onClose,
  onReset,
  submitting,
  submitLabel,
  showReset = false,
}: {
  onClose: () => void;
  onReset?: () => void;
  submitting: boolean;
  submitLabel: string;
  showReset?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-gray-200 pt-4">
      <button
        type="button"
        onClick={onClose}
        className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 cursor-pointer"
      >
        Hủy
      </button>
      <div className="flex gap-3">
        {showReset && onReset && (
          <button
            type="button"
            onClick={onReset}
            disabled={submitting}
            className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            Đặt lại
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border px-4 py-3 text-sm font-semibold transition-colors cursor-pointer",
        active ? "border-red-300 bg-red-50 text-red-700" : "border-gray-200 bg-white text-gray-700"
      )}
    >
      {label}
    </button>
  );
}

function ErrorBox({ message }: { message: string }) {
  return <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{message}</div>;
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
        "rounded-xl px-4 py-2 text-sm font-semibold transition-colors cursor-pointer",
        active ? "bg-gradient-to-r from-red-600 to-red-700 text-white" : "text-gray-600 hover:bg-red-50"
      )}
    >
      {label}
    </button>
  );
}

function IconButton({
  children,
  label,
  onClick,
  variant = "default",
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "warning";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={cn(
        "rounded-lg border p-2 transition-colors cursor-pointer",
        variant === "warning"
          ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
          : "border-gray-200 bg-white text-gray-600 hover:bg-red-50 hover:text-red-600"
      )}
    >
      {children}
    </button>
  );
}

function StatusBadge({
  kind,
  children,
}: {
  kind: "success" | "warning" | "muted" | "info";
  children: React.ReactNode;
}) {
  const classes =
    kind === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : kind === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : kind === "info"
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-gray-200 bg-gray-50 text-gray-700";

  return <span className={cn("inline-flex rounded-full border px-3 py-1 text-xs font-medium", classes)}>{children}</span>;
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
    <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-gray-500">{title}</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{value}</div>
          <div className="mt-2 text-sm text-gray-500">{subtitle}</div>
        </div>
        <div className={cn("rounded-2xl bg-gradient-to-r p-3 text-white shadow-lg", color)}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function ModalFrame({
  title,
  subtitle,
  icon: Icon,
  onClose,
  children,
  widthClass = "max-w-3xl",
}: {
  title: string;
  subtitle: string;
  icon: any;
  onClose: () => void;
  children: React.ReactNode;
  widthClass?: string;
}) {
  return (
    <div className="fixed inset-0 z-100 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
      <div className={cn("my-8 w-full rounded-2xl border border-gray-200 bg-white shadow-2xl", widthClass)}>
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-white/20 backdrop-blur-sm p-3 text-white shadow-lg">
                <Icon size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{title}</h2>
                <p className="mt-1 text-sm text-red-100">{subtitle}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-white transition hover:bg-white/20 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
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
    <div className="rounded-2xl border border-gray-200 bg-red-50/60 p-4">
      <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-red-600">
        <Icon size={14} />
        {label}
      </div>
      <div className="text-sm font-medium text-gray-900">{value}</div>
    </div>
  );
}

function ContentPanel({
  title,
  subtitle,
  value,
  accent,
}: {
  title: string;
  subtitle?: string;
  value?: string | null;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className={cn("text-sm font-semibold", accent)}>{title}</div>
      {subtitle ? <div className="mt-1 text-xs text-gray-500">{subtitle}</div> : null}
      <div className="mt-3">
        <StructuredContent value={value} placeholder="Chưa có nội dung." />
      </div>
    </div>
  );
}

function SpreadsheetList({ value, empty = "-" }: { value: unknown; empty?: string }) {
  const items = linesFromUnknown(value);

  if (!items.length) {
    return <div className="text-sm text-gray-400">{empty}</div>;
  }

  return (
    <div className="space-y-1">
      {items.map((item, index) => (
        <div key={`${item}-${index}`} className="whitespace-pre-wrap text-sm text-gray-700">
          {item}
        </div>
      ))}
    </div>
  );
}

function SheetCellValue({ value, empty = "-" }: { value: unknown; empty?: string }) {
  if (Array.isArray(value)) {
    return <SpreadsheetList value={value} empty={empty} />;
  }

  if (value && typeof value === "object") {
    return (
      <pre className="overflow-x-auto rounded-lg bg-gray-950 px-3 py-2 text-[11px] leading-5 text-gray-100">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  const text = typeof value === "string" ? value.trim() : String(value ?? "").trim();
  if (!text) {
    return <div className="text-sm text-gray-400">{empty}</div>;
  }

  return <div className="whitespace-pre-wrap text-sm text-gray-700">{text}</div>;
}

function isMetadataSheetObject(objectValue: Record<string, any>) {
  return ["day", "days", "scheduleDays", "duration", "generalInformation", "generalInfo", "teachingMaterials", "note"].some(
    (key) => objectValue[key] !== undefined && objectValue[key] !== null
  );
}

function isSessionSheetObject(objectValue: Record<string, any>) {
  return (
    Array.isArray(objectValue.activities) ||
    ["sessionIndex", "title", "dateLabel", "teacherName", "homeworkLabel", "homeworkMaterials", "homeworkNotes"].some(
      (key) => objectValue[key] !== undefined && objectValue[key] !== null
    )
  );
}

function MetadataSheetView({ objectValue }: { objectValue: Record<string, any> }) {
  const sheetTitle = pickStringValue(objectValue, ["title", "sheetTitle"]) || "SYLLABUS";
  const day = pickStringValue(objectValue, ["day", "days", "scheduleDays"]);
  const duration = pickStringValue(objectValue, ["duration"]);
  const generalInformation = pickStringValue(objectValue, ["generalInformation", "generalInfo", "description"]);
  const teachingMaterials = objectValue.teachingMaterials;
  const note = objectValue.note;
  const extraEntries = Object.entries(objectValue).filter(
    ([key]) =>
      !["title", "sheetTitle", "day", "days", "scheduleDays", "duration", "generalInformation", "generalInfo", "description", "teachingMaterials", "note"].includes(
        key
      )
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-sm">
      <div className="border-b border-gray-300 bg-amber-50 px-4 py-3 text-center text-sm font-bold uppercase tracking-wide text-gray-900">
        {sheetTitle}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <tbody>
            <tr>
              <th className="w-48 border border-gray-300 bg-red-50 px-3 py-2 text-left font-semibold text-gray-700">Day</th>
              <td className="border border-gray-300 px-3 py-2">
                <SheetCellValue value={day} />
              </td>
              <th className="w-48 border border-gray-300 bg-red-50 px-3 py-2 text-left font-semibold text-gray-700">Duration</th>
              <td className="border border-gray-300 px-3 py-2">
                <SheetCellValue value={duration} />
              </td>
            </tr>
            <tr>
              <th className="border border-gray-300 bg-red-50 px-3 py-2 text-left font-semibold text-gray-700">General information</th>
              <td colSpan={3} className="border border-gray-300 px-3 py-2">
                <SheetCellValue value={generalInformation} />
              </td>
            </tr>
            <tr>
              <th className="border border-gray-300 bg-red-50 px-3 py-2 text-left font-semibold text-gray-700">Teaching materials</th>
              <td colSpan={3} className="border border-gray-300 px-3 py-2">
                <SheetCellValue value={teachingMaterials} />
              </td>
            </tr>
            <tr>
              <th className="border border-gray-300 bg-red-50 px-3 py-2 text-left font-semibold text-gray-700">Note</th>
              <td colSpan={3} className="border border-gray-300 px-3 py-2">
                <SheetCellValue value={note} />
              </td>
            </tr>
            {extraEntries.map(([key, extraValue]) => (
              <tr key={key}>
                <th className="border border-gray-300 bg-red-50 px-3 py-2 text-left font-semibold uppercase tracking-wide text-gray-700">
                  {key}
                </th>
                <td colSpan={3} className="border border-gray-300 px-3 py-2">
                  <SheetCellValue value={extraValue} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SessionSheetView({ objectValue }: { objectValue: Record<string, any> }) {
  const activities = Array.isArray(objectValue.activities) ? objectValue.activities : [];
  const notes = Array.isArray(objectValue.notes) ? objectValue.notes : [];
  const extraEntries = Object.entries(objectValue).filter(
    ([key]) =>
      ![
        "sessionIndex",
        "title",
        "dateLabel",
        "teacherName",
        "notes",
        "homeworkLabel",
        "homeworkMaterials",
        "homeworkNotes",
        "activities",
      ].includes(key)
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-sm">
      <div className="border-b border-gray-300 bg-amber-50 px-4 py-3 text-sm font-bold uppercase tracking-wide text-gray-900">
        {pickStringValue(objectValue, ["title"]) || "Session sheet"}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[980px] border-collapse text-sm">
          <thead>
            <tr className="bg-red-50 text-gray-700">
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Period</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Date</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Teacher</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Time</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Book</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Skills</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Classwork</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Required materials</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Homework materials</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Extra</th>
            </tr>
          </thead>
          <tbody>
            {activities.length ? (
              activities.map((activity: Record<string, any>, index: number) => (
                <tr key={`activity-${index}`} className="align-top">
                  <td className="border border-gray-300 px-3 py-2">{index === 0 ? <SheetCellValue value={objectValue.sessionIndex} /> : null}</td>
                  <td className="border border-gray-300 px-3 py-2">{index === 0 ? <SheetCellValue value={objectValue.dateLabel} /> : null}</td>
                  <td className="border border-gray-300 px-3 py-2">{index === 0 ? <SheetCellValue value={objectValue.teacherName} /> : null}</td>
                  <td className="border border-gray-300 px-3 py-2"><SheetCellValue value={activity.time} /></td>
                  <td className="border border-gray-300 px-3 py-2"><SheetCellValue value={activity.book} /></td>
                  <td className="border border-gray-300 px-3 py-2"><SheetCellValue value={activity.skills} /></td>
                  <td className="border border-gray-300 px-3 py-2"><SheetCellValue value={activity.classwork} /></td>
                  <td className="border border-gray-300 px-3 py-2"><SheetCellValue value={activity.requiredMaterials} /></td>
                  <td className="border border-gray-300 px-3 py-2"><SheetCellValue value={activity.homeworkRequiredMaterials} /></td>
                  <td className="border border-gray-300 px-3 py-2"><SheetCellValue value={activity.extra} /></td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="border border-gray-300 px-3 py-4 text-center text-sm text-gray-400" colSpan={10}>
                  Chưa có activity.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {notes.length ? (
        <div className="border-t border-gray-300 bg-white px-4 py-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Notes</div>
          <SpreadsheetList value={notes} />
        </div>
      ) : null}

      {objectValue.homeworkLabel || linesFromUnknown(objectValue.homeworkMaterials).length || linesFromUnknown(objectValue.homeworkNotes).length ? (
        <div className="border-t border-gray-300 bg-amber-50/40 p-4">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Homework block</div>
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-xl border border-gray-300 bg-white p-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Label</div>
              <SheetCellValue value={objectValue.homeworkLabel} />
            </div>
            <div className="rounded-xl border border-gray-300 bg-white p-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Required materials</div>
              <SheetCellValue value={objectValue.homeworkMaterials} />
            </div>
            <div className="rounded-xl border border-gray-300 bg-white p-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Notes</div>
              <SheetCellValue value={objectValue.homeworkNotes} />
            </div>
          </div>
        </div>
      ) : null}

      {extraEntries.length ? (
        <div className="border-t border-gray-300 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-2">
            {extraEntries.map(([key, extraValue]) => (
              <div key={key} className="rounded-xl border border-gray-300 bg-gray-50 p-3">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">{key}</div>
                <SheetCellValue value={extraValue} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SyllabusSheetPreview({
  metadataObject,
  contentObject,
}: {
  metadataObject: Record<string, any>;
  contentObject: Record<string, any>;
}) {
  return (
    <div className="space-y-4">
      <MetadataSheetView objectValue={metadataObject} />
      <SessionSheetView objectValue={contentObject} />
    </div>
  );
}

function StructuredContent({
  value,
  placeholder,
}: {
  value?: string | null;
  placeholder: string;
}) {
  if (!value?.trim()) {
    return <div className="text-sm text-gray-500">{placeholder}</div>;
  }

  const parsed = parseJsonContent(value);

  if (!parsed) {
    return <div className="whitespace-pre-wrap text-sm leading-6 text-gray-700">{value}</div>;
  }

  if (Array.isArray(parsed)) {
    return (
      <pre className="overflow-x-auto rounded-xl bg-gray-950 px-4 py-3 text-xs leading-6 text-gray-100">
        {JSON.stringify(parsed, null, 2)}
      </pre>
    );
  }

  const objectValue = parsed as Record<string, any>;
  if (isSessionSheetObject(objectValue)) {
    return <SessionSheetView objectValue={objectValue} />;
  }

  if (isMetadataSheetObject(objectValue)) {
    return <MetadataSheetView objectValue={objectValue} />;
  }

  const activities = Array.isArray(objectValue.activities) ? objectValue.activities : [];
  const notes = Array.isArray(objectValue.notes) ? objectValue.notes : [];
  const summaryKeys = ["sessionIndex", "title", "dateLabel", "teacherName"];
  const extraEntries = Object.entries(objectValue).filter(
    ([key]) => !summaryKeys.includes(key) && key !== "activities" && key !== "notes"
  );
  const renderStructuredValue = (entry: any) => {
    if (Array.isArray(entry)) {
      return (
        <div className="space-y-1">
          {entry.map((item, index) => (
            <div key={`${String(item)}-${index}`} className="whitespace-pre-wrap text-sm text-gray-700">
              {String(item)}
            </div>
          ))}
        </div>
      );
    }

    if (entry && typeof entry === "object") {
      return (
        <pre className="overflow-x-auto rounded-xl bg-gray-950 px-4 py-3 text-xs leading-6 text-gray-100">
          {JSON.stringify(entry, null, 2)}
        </pre>
      );
    }

    return <div className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{String(entry ?? "-")}</div>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {summaryKeys.map((key) =>
          objectValue[key] !== undefined && objectValue[key] !== null && objectValue[key] !== "" ? (
            <StatusBadge key={key} kind="muted">
              {key}: {String(objectValue[key])}
            </StatusBadge>
          ) : null
        )}
      </div>

      {notes.length ? (
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Notes</div>
          <div className="flex flex-wrap gap-2">
            {notes.map((note: any, index: number) => (
              <StatusBadge key={`${String(note)}-${index}`} kind="warning">
                {String(note)}
              </StatusBadge>
            ))}
          </div>
        </div>
      ) : null}

      {activities.length ? (
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Activities</div>
          {activities.map((activity: any, index: number) => (
            <div key={index} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="grid gap-2 md:grid-cols-2">
                {Object.entries(activity || {}).map(([key, activityValue]) => (
                  <div key={key}>
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{key}</div>
                    <div className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{String(activityValue ?? "-")}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {extraEntries.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {extraEntries.map(([key, extraValue]) => (
            <div key={key} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{key}</div>
              <div className="mt-1">{renderStructuredValue(extraValue)}</div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default LessonPlanWorkspace;
