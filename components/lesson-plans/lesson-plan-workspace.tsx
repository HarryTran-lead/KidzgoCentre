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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/lightswind/select";
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

type TeachingReportModalState =
  | { session: ClassLessonPlanSyllabusSession; plan: LessonPlan | null; loading: boolean }
  | null;

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
  const [teachingReportModal, setTeachingReportModal] = useState<TeachingReportModalState>(null);

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
            templateId: payload.templateId ?? null,
            plannedContent: payload.plannedContent ?? null,
            actualContent: payload.actualContent ?? null,
            actualHomework: payload.actualHomework ?? null,
            teacherNotes: payload.teacherNotes ?? null,
          })
        : await createLessonPlan({
            classId: classSyllabus.classId,
            sessionId: payload.session.sessionId,
            templateId: payload.templateId ?? null,
            plannedContent: payload.plannedContent ?? null,
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

  const openTeachingReport = async (session: ClassLessonPlanSyllabusSession) => {
    if (!session.lessonPlanId) {
      if (!classSyllabus?.classId) return;
      setTeachingReportModal({ session, plan: null, loading: true });
      try {
        const createResult = await createLessonPlan({
          classId: classSyllabus.classId,
          sessionId: session.sessionId,
          templateId: session.templateId || null,
          plannedContent: null,
          actualContent: null,
          actualHomework: null,
          teacherNotes: null,
        });
        if (!createResult.isSuccess || !createResult.data) {
          toast({
            title: "Không thể tạo lesson plan",
            description: extractMessage(createResult, "Vui lòng thử lại sau."),
            variant: "destructive",
          });
          setTeachingReportModal(null);
          return;
        }
        setTeachingReportModal({ session, plan: createResult.data, loading: false });
        await loadClassSyllabus(classSyllabus.classId);
      } catch (err: any) {
        toast({
          title: "Lỗi",
          description: err?.message || "Không thể tạo lesson plan.",
          variant: "destructive",
        });
        setTeachingReportModal(null);
      }
      return;
    }

    setTeachingReportModal({ session, plan: null, loading: true });
    const response = await getLessonPlanById(session.lessonPlanId);
    if (!response.isSuccess || !response.data) {
      toast({
        title: "Không thể tải lesson plan",
        description: extractMessage(response, "Vui lòng thử lại sau."),
        variant: "destructive",
      });
      setTeachingReportModal(null);
      return;
    }
    setTeachingReportModal({ session, plan: response.data, loading: false });
  };

  const handleTeachingReportSubmit = async (payload: {
    lessonPlanId: string;
    actualContent: string | null;
    actualHomework: string | null;
    teacherNotes: string | null;
  }) => {
    const response = await updateLessonPlan(payload.lessonPlanId, {
      actualContent: payload.actualContent,
      actualHomework: payload.actualHomework,
      teacherNotes: payload.teacherNotes,
    });

    if (!response.isSuccess) {
      throw new Error(extractMessage(response, "Không thể lưu báo cáo buổi dạy."));
    }

    toast({
      title: "Đã lưu báo cáo buổi dạy",
      description: "Nội dung dạy thực tế, bài tập và ghi chú đã được cập nhật.",
      variant: "success",
    });

    setTeachingReportModal(null);

    if (classSyllabus?.classId) {
      await loadClassSyllabus(classSyllabus.classId);
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

      {templatesAvailable ? (
        <div className={cn("inline-flex rounded-2xl border border-red-200 bg-white p-1 transition-all duration-500", isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3")}>
          <TabButton active={activeTab === "templates"} label="Template" onClick={() => setActiveTab("templates")} />
          <TabButton active={activeTab === "plans"} label="Syllabus lớp" onClick={() => setActiveTab("plans")} />
        </div>
      ) : null}

      <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4 transition-all duration-500", isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3")}>
        {stats.map((item) => (
          <StatCard key={item.title} {...item} />
        ))}
      </div>

      <FilterBar
        activeTab={activeTab}
        templatesAvailable={templatesAvailable}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        templateStatusFilter={templateStatusFilter}
        onTemplateStatusFilterChange={setTemplateStatusFilter}
        planStatusFilter={planStatusFilter}
        onPlanStatusFilterChange={setPlanStatusFilter}
        selectedProgramId={selectedProgramId}
        onProgramChange={setSelectedProgramId}
        selectedClassId={selectedClassId}
        onClassChange={setSelectedClassId}
        programOptions={programOptions}
        classOptions={classOptions}
      />

      <div className={cn("rounded-2xl border border-red-200 bg-white shadow-sm transition-all duration-500", isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3")}>
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
            onOpenTeachingReport={openTeachingReport}
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

      {teachingReportModal ? (
        <TeachingReportModal
          session={teachingReportModal.session}
          plan={teachingReportModal.plan}
          loading={teachingReportModal.loading}
          classSyllabus={classSyllabus}
          onClose={() => setTeachingReportModal(null)}
          onSubmit={handleTeachingReportSubmit}
        />
      ) : null}
    </div>
  );
}

function FilterBar({
  templatesAvailable,
  searchQuery,
  onSearchChange,
  templateStatusFilter,
  onTemplateStatusFilterChange,
  planStatusFilter,
  onPlanStatusFilterChange,
  selectedProgramId,
  onProgramChange,
  selectedClassId,
  onClassChange,
  programOptions,
  classOptions,
  activeTab,
}: {
  templatesAvailable: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  templateStatusFilter: TemplateStatusFilter;
  onTemplateStatusFilterChange: (filter: TemplateStatusFilter) => void;
  planStatusFilter: PlanStatusFilter;
  onPlanStatusFilterChange: (filter: PlanStatusFilter) => void;
  selectedProgramId: string;
  onProgramChange: (id: string) => void;
  selectedClassId: string;
  onClassChange: (id: string) => void;
  programOptions: Option[];
  classOptions: Option[];
  activeTab: ActiveTab;
}) {
  return (
    <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={activeTab === "templates" ? "Tìm theo tên template, program..." : "Tìm theo buổi học, giáo viên..."}
            className="w-full rounded-xl border border-red-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === "templates" && templatesAvailable ? (
            <>
              <Select value={templateStatusFilter} onValueChange={(value) => onTemplateStatusFilterChange(value as TemplateStatusFilter)}>
                <SelectTrigger className="w-auto min-w-[150px] rounded-xl h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="active">Đang hoạt động</SelectItem>
                  <SelectItem value="inactive">Tạm ẩn</SelectItem>
                  <SelectItem value="withAttachment">Có attachment</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedProgramId} onValueChange={onProgramChange}>
                <SelectTrigger className="w-auto min-w-[150px] rounded-xl h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả program</SelectItem>
                  {programOptions.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          ) : (
            <>
              <Select value={planStatusFilter} onValueChange={(value) => onPlanStatusFilterChange(value as PlanStatusFilter)}>
                <SelectTrigger className="w-auto min-w-[170px] rounded-xl h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả session</SelectItem>
                  <SelectItem value="editable">Có thể chỉnh sửa</SelectItem>
                  <SelectItem value="hasPlan">Đã có lesson plan</SelectItem>
                  <SelectItem value="missingPlan">Chưa có lesson plan</SelectItem>
                  <SelectItem value="withTemplate">Đã map template</SelectItem>
                  <SelectItem value="reported">Đã báo cáo buổi dạy</SelectItem>
                  <SelectItem value="notReported">Chưa báo cáo buổi dạy</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedClassId} onValueChange={onClassChange}>
                <SelectTrigger className="w-auto min-w-[170px] rounded-xl h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {classOptions.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      </div>
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
    <div>
      <div className="border-b border-red-100 bg-gradient-to-r from-red-50/70 to-white px-5 py-4">
        <h3 className="text-sm font-semibold text-gray-700">Danh sách {items.length} template</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-red-200 bg-gradient-to-r from-red-50 to-red-50/50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Template</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Program</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Session</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Source</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-red-100">
            {items.map((item) => (
              <tr key={item.id} className="transition-colors hover:bg-red-50/60">
                <td className="px-6 py-4">
                  <div className="font-semibold text-gray-900">{item.title}</div>
                  <div className="mt-1 text-sm text-gray-500">Level {item.level || "-"}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  <div>{item.programName || item.programId}</div>
                  <div className="mt-1 text-xs text-gray-500">{item.createdByName || "Không rõ người tạo"}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">Buổi {item.sessionIndex || "-"}</td>
                <td className="px-6 py-4 text-sm text-gray-700">
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
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge kind={getTemplateStatus(item) === "active" ? "success" : "muted"}>
                      {getTemplateStatus(item) === "active" ? "Đang hoạt động" : "Tạm ẩn"}
                    </StatusBadge>
                    {item.attachment ? <StatusBadge kind="info">Có attachment</StatusBadge> : null}
                    {(item.usedCount || 0) > 0 ? <StatusBadge kind="warning">Dùng {item.usedCount} lần</StatusBadge> : null}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end items-center gap-2">
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
    </div>
  );
}

// Modern SyllabusView Component
function SyllabusView({
  scope,
  syllabus,
  items,
  templateMap,
  onCreate,
  onEdit,
  onOpenPlanDetail,
  onOpenTemplateDetail,
  onOpenTeachingReport,
}: {
  scope: WorkspaceScope;
  syllabus: ClassLessonPlanSyllabus | null;
  items: ClassLessonPlanSyllabusSession[];
  templateMap: Map<string, LessonPlanTemplate>;
  onCreate: (session: ClassLessonPlanSyllabusSession) => void;
  onEdit: (session: ClassLessonPlanSyllabusSession) => void;
  onOpenPlanDetail: (lessonPlanId: string) => void;
  onOpenTemplateDetail?: (templateId: string) => void;
  onOpenTeachingReport: (session: ClassLessonPlanSyllabusSession) => void;
}) {
  if (!syllabus) {
    return <EmptyState title="Chưa có syllabus" subtitle="Chọn một lớp để tải read model syllabus từ backend." />;
  }

  if (!items.length) {
    return <EmptyState title="Không có session phù hợp" subtitle="Thử đổi bộ lọc hoặc kiểm tra lớp này đã có session chưa." />;
  }

  return (
    <div className="space-y-5">
      {/* Modern Class Header Card */}
      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-red-600 to-red-700 p-6 shadow-xl transition-all duration-300 hover:shadow-2xl">
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
        
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-white/20 p-2 backdrop-blur-sm">
                <GraduationCap size={20} className="text-white" />
              </div>
              <span className="text-sm font-medium text-red-100">Syllabus lớp học</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">
                {syllabus.classCode || "Lớp chưa có mã"}
              </h3>
              {syllabus.classTitle && (
                <p className="mt-1 text-base text-red-100">{syllabus.classTitle}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {syllabus.programName && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                  <BookOpenCheck size={12} />
                  {syllabus.programName}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                <CalendarDays size={12} />
                {items.length} buổi học
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                <FileText size={12} />
                {items.filter((s) => s.lessonPlanId).length}/{items.length} có lesson plan
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <div className="rounded-xl bg-white/15 px-4 py-2 backdrop-blur-sm">
              <div className="text-xs font-medium text-red-100">Quyền truy cập</div>
              <div className="text-sm font-semibold text-white">
                {scope === "teacher" ? "Giáo viên" : "Quản lý"}
              </div>
            </div>
          </div>
        </div>

        {syllabus.syllabusMetadata ? (
          <details className="relative mt-5 group">
            <summary className="cursor-pointer rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20">
              📋 Xem thông tin chung của syllabus
            </summary>
            <div className="mt-3 rounded-xl bg-white/10 p-4 backdrop-blur-sm">
              <StructuredContent value={syllabus.syllabusMetadata} placeholder="Chưa có metadata." />
            </div>
          </details>
        ) : null}
      </div>

      {/* Session Cards Grid */}
      <div className="grid gap-5">
        {items.map((session) => {
          const linkedTemplate = session.templateId ? templateMap.get(session.templateId) : undefined;
          const hasReport = Boolean(session.actualContent);
          const isEditable = session.canEdit;
          const hasPlan = Boolean(session.lessonPlanId);

          return (
            <div
              key={session.sessionId}
              className={cn(
                "group rounded-2xl border transition-all duration-300 hover:shadow-lg",
                hasReport
                  ? "border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white"
                  : "border-red-100 bg-white hover:border-red-200"
              )}
            >
              {/* Session Header */}
              <div className="flex flex-col gap-4 border-b border-gray-100 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-md">
                    <span className="text-lg font-bold text-white">{session.sessionIndex}</span>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      Buổi {session.sessionIndex}
                    </h4>
                    {normalizeDateValue(session.sessionDate) && (
                      <p className="text-sm text-gray-500">
                        {formatDate(session.sessionDate, true)}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {isEditable && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        <Pencil size={11} />
                        Có thể sửa
                      </span>
                    )}
                    {hasPlan && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                        <FileText size={11} />
                        Có lesson plan
                      </span>
                    )}
                    {session.templateId && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700">
                        <FolderOpen size={11} />
                        Có template
                      </span>
                    )}
                    {hasReport && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        <ClipboardPen size={11} />
                        Đã báo cáo
                      </span>
                    )}
                    {!hasReport && hasPlan && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                        <Clock3 size={11} />
                        Chưa báo cáo
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {session.templateId && onOpenTemplateDetail && (
                    <button
                      type="button"
                      onClick={() => onOpenTemplateDetail(session.templateId!)}
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition-all hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700"
                    >
                      <FolderOpen size="16" />
                      Xem template
                    </button>
                  )}
                  
                  {hasPlan && (
                    <button
                      type="button"
                      onClick={() => onOpenPlanDetail(session.lessonPlanId!)}
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <Eye size="16" />
                      Chi tiết
                    </button>
                  )}
                  
                  {isEditable && (
                    <>
                      <button
                        type="button"
                        onClick={() => (hasPlan ? onEdit(session) : onCreate(session))}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:from-red-700 hover:to-red-800"
                      >
                        {hasPlan ? <Pencil size="16" /> : <FilePlus2 size="16" />}
                        {hasPlan ? "Sửa lesson plan" : "Tạo lesson plan"}
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => onOpenTeachingReport(session)}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:from-emerald-700 hover:to-emerald-800"
                      >
                        <ClipboardPen size="16" />
                        Báo cáo buổi dạy
                      </button>
                    </>
                  )}
                  
                  {!isEditable && hasReport && (
                    <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                      <CheckCircle2 size="16" />
                      Đã báo cáo
                    </div>
                  )}
                </div>
              </div>

              {/* Teacher Info */}
              <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-3">
                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-red-100 p-1">
                      <Users size="14" className="text-red-600" />
                    </div>
                    <span className="text-gray-600">Giáo viên dự kiến:</span>
                    <span className="font-medium text-gray-900">{session.plannedTeacherName || "-"}</span>
                  </div>
                  {session.actualTeacherName && (
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-emerald-100 p-1">
                        <Users size="14" className="text-emerald-600" />
                      </div>
                      <span className="text-gray-600">Giáo viên thực tế:</span>
                      <span className="font-medium text-gray-900">{session.actualTeacherName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Content Grid */}
              <div className="p-6">
                <div className="grid gap-5 lg:grid-cols-2">
                  {(session.templateTitle || linkedTemplate?.title || session.templateSyllabusContent || linkedTemplate?.syllabusContent) && (
                    <ContentCard
                      title="Syllabus chuẩn"
                      subtitle={session.templateTitle || linkedTemplate?.title || "Nội dung template"}
                      icon={<FolderOpen size="16" />}
                      gradient="from-purple-50 to-white"
                      borderColor="purple"
                    >
                      <StructuredContent 
                        value={session.templateSyllabusContent || linkedTemplate?.syllabusContent} 
                        placeholder="Chưa có nội dung template." 
                      />
                    </ContentCard>
                  )}

                  <ContentCard
                    title="Giáo án dự kiến"
                    subtitle="Lesson plan sẽ được tạo hoặc cập nhật"
                    icon={<FileText size="16" />}
                    gradient="from-red-50 to-white"
                    borderColor="red"
                  >
                    <StructuredContent 
                      value={session.plannedContent} 
                      placeholder="Chưa có nội dung dự kiến." 
                    />
                  </ContentCard>

                  <ContentCard
                    title={hasReport ? "Báo cáo buổi dạy" : "Nội dung thực tế"}
                    subtitle={
                      hasReport && session.actualTeacherName
                        ? `Giáo viên: ${session.actualTeacherName}`
                        : "Nội dung đã dạy thực tế"
                    }
                    icon={<ClipboardPen size="16" />}
                    gradient={hasReport ? "from-emerald-50 to-white" : "from-gray-50 to-white"}
                    borderColor={hasReport ? "emerald" : "gray"}
                    badge={hasReport ? { text: "Đã báo cáo", color: "emerald" } : undefined}
                  >
                    <StructuredContent 
                      value={session.actualContent} 
                      placeholder="Chưa có nội dung thực tế." 
                    />
                  </ContentCard>

                  {(session.actualHomework || session.teacherNotes) && (
                    <ContentCard
                      title="Bài tập & Ghi chú"
                      subtitle="Sau buổi học"
                      icon={<Paperclip size="16" />}
                      gradient="from-amber-50 to-white"
                      borderColor="amber"
                    >
                      <div className="space-y-3">
                        {session.actualHomework && (
                          <div>
                            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                              Bài tập về nhà
                            </div>
                            <StructuredContent value={session.actualHomework} placeholder="" />
                          </div>
                        )}
                        {session.teacherNotes && (
                          <div>
                            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                              Ghi chú giáo viên
                            </div>
                            <StructuredContent value={session.teacherNotes} placeholder="" />
                          </div>
                        )}
                      </div>
                    </ContentCard>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Content Card Component
function ContentCard({
  title,
  subtitle,
  icon,
  children,
  gradient,
  borderColor,
  badge,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  gradient: string;
  borderColor: "red" | "purple" | "emerald" | "amber" | "gray";
  badge?: { text: string; color: "emerald" | "red" | "amber" };
}) {
  const borderColors = {
    red: "border-red-100 hover:border-red-200",
    purple: "border-purple-100 hover:border-purple-200",
    emerald: "border-emerald-100 hover:border-emerald-200",
    amber: "border-amber-100 hover:border-amber-200",
    gray: "border-gray-100 hover:border-gray-200",
  };

  const badgeColors = {
    emerald: "bg-emerald-100 text-emerald-700",
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-700",
  };

  return (
    <div className={cn(
      "rounded-xl border bg-gradient-to-br p-4 transition-all duration-200 hover:shadow-md",
      borderColors[borderColor],
      gradient
    )}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            "rounded-lg p-1.5",
            borderColor === "red" && "bg-red-100 text-red-600",
            borderColor === "purple" && "bg-purple-100 text-purple-600",
            borderColor === "emerald" && "bg-emerald-100 text-emerald-600",
            borderColor === "amber" && "bg-amber-100 text-amber-600",
            borderColor === "gray" && "bg-gray-100 text-gray-600"
          )}>
            {icon}
          </div>
          <div>
            <h5 className="font-semibold text-gray-900">{title}</h5>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
        {badge && (
          <span className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            badgeColors[badge.color]
          )}>
            {badge.text}
          </span>
        )}
      </div>
      <div className="max-h-64 overflow-y-auto">
        {children}
      </div>
    </div>
  );
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
  const metadataExtras = omitKnownKeys(metadataSeed, [
    "title",
    "sheetTitle",
    "day",
    "days",
    "scheduleDays",
    "duration",
    "generalInformation",
    "generalInfo",
    "description",
    "teachingMaterials",
    "note",
  ]);
  const contentExtras = omitKnownKeys(contentSeed, [
    "sessionIndex",
    "title",
    "dateLabel",
    "teacherName",
    "notes",
    "homeworkLabel",
    "homeworkMaterials",
    "homeworkNotes",
    "activities",
  ]);
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
  const [metadataTitle, setMetadataTitle] = useState(
    pickStringValue(metadataSeed, ["title", "sheetTitle"])
  );
  const [dayLabel, setDayLabel] = useState(
    pickStringValue(metadataSeed, ["day", "days", "scheduleDays"])
  );
  const [durationLabel, setDurationLabel] = useState(pickStringValue(metadataSeed, ["duration"]));
  const [generalInformation, setGeneralInformation] = useState(
    pickStringValue(metadataSeed, ["generalInformation", "generalInfo", "description"])
  );
  const [teachingMaterialsText, setTeachingMaterialsText] = useState(
    linesToTextarea(metadataSeed.teachingMaterials)
  );
  const [sheetNote, setSheetNote] = useState(
    pickStringValue(metadataSeed, ["note"]) || linesToTextarea(metadataSeed.note)
  );
  const [sessionTitle, setSessionTitle] = useState(
    pickStringValue(contentSeed, ["title"]) || initialValue?.title || ""
  );
  const [dateLabel, setDateLabel] = useState(pickStringValue(contentSeed, ["dateLabel"]));
  const [teacherName, setTeacherName] = useState(pickStringValue(contentSeed, ["teacherName"]));
  const [notesText, setNotesText] = useState(linesToTextarea(contentSeed.notes));
  const [homeworkLabel, setHomeworkLabel] = useState(
    pickStringValue(contentSeed, ["homeworkLabel"]) || "HOMEWORK"
  );
  const [homeworkMaterialsText, setHomeworkMaterialsText] = useState(
    linesToTextarea(contentSeed.homeworkMaterials)
  );
  const [homeworkNotesText, setHomeworkNotesText] = useState(
    linesToTextarea(contentSeed.homeworkNotes)
  );
  const [activities, setActivities] = useState<TemplateActivityDraft[]>(
    activityDraftsFromUnknown(contentSeed.activities)
  );
  const [useAdvancedJson, setUseAdvancedJson] = useState(false);
  const [advancedMetadata, setAdvancedMetadata] = useState(initialValue?.syllabusMetadata || "");
  const [advancedContent, setAdvancedContent] = useState(initialValue?.syllabusContent || "");
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
  const reusableTemplates = useMemo(() => {
    return existingTemplates
      .filter((item) => item.programId === programId && item.id !== initialValue?.id)
      .sort((left, right) => (right.sessionIndex || 0) - (left.sessionIndex || 0));
  }, [existingTemplates, initialValue?.id, programId]);
  const referenceTemplate = useMemo(() => {
    if (!reusableTemplates.length) return null;

    const previousTemplate = reusableTemplates.find((item) => (item.sessionIndex || 0) < sessionIndex);
    return previousTemplate || reusableTemplates[0];
  }, [reusableTemplates, sessionIndex]);

  useEffect(() => {
    if (isEdit || sessionIndexTouched) {
      return;
    }

    setSessionIndex(suggestedNextSessionIndex);
  }, [isEdit, sessionIndexTouched, suggestedNextSessionIndex]);

  const generatedMetadataObject = useMemo(() => {
    return removeEmptyDeep({
      ...metadataExtras,
      title: metadataTitle.trim(),
      day: dayLabel.trim(),
      duration: durationLabel.trim(),
      generalInformation: generalInformation.trim(),
      teachingMaterials: textareaToLines(teachingMaterialsText),
      note: sheetNote.trim(),
    });
  }, [dayLabel, durationLabel, generalInformation, metadataExtras, metadataTitle, sheetNote, teachingMaterialsText]);

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
      ...contentExtras,
      sessionIndex,
      title: (sessionTitle || title).trim(),
      dateLabel: dateLabel.trim(),
      teacherName: teacherName.trim(),
      notes: textareaToLines(notesText),
      homeworkLabel: homeworkLabel.trim(),
      homeworkMaterials: textareaToLines(homeworkMaterialsText),
      homeworkNotes: textareaToLines(homeworkNotesText),
      activities: cleanedActivities,
    });
  }, [
    activities,
    contentExtras,
    dateLabel,
    homeworkLabel,
    homeworkMaterialsText,
    homeworkNotesText,
    notesText,
    sessionIndex,
    sessionTitle,
    teacherName,
    title,
  ]);

  const generatedMetadata = useMemo(
    () => stringifyPrettyJson(generatedMetadataObject),
    [generatedMetadataObject]
  );
  const generatedContent = useMemo(
    () => stringifyPrettyJson(generatedContentObject),
    [generatedContentObject]
  );

  const updateActivity = (index: number, key: keyof TemplateActivityDraft, value: string) => {
    setActivities((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [key]: value,
            }
          : item
      )
    );
  };

  const addActivity = () => {
    setActivities((current) => [...current, createEmptyTemplateActivity()]);
  };

  const addPresetActivity = (preset: TemplateActivityPresetKey) => {
    setActivities((current) => {
      const nextActivity = createPresetTemplateActivity(preset);

      if (current.length === 1 && isActivityDraftEmpty(current[0])) {
        return [nextActivity];
      }

      return [...current, nextActivity];
    });
  };

  const duplicateActivity = (index: number) => {
    setActivities((current) => {
      const source = current[index];
      if (!source) return current;

      const clone = { ...source };
      const next = [...current];
      next.splice(index + 1, 0, clone);
      return next;
    });
  };

  const removeActivity = (index: number) => {
    setActivities((current) =>
      current.length <= 1 ? [createEmptyTemplateActivity()] : current.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const applyMetadataFromTemplate = (template: LessonPlanTemplate) => {
    const seed = asObject(parseJsonContent(template.syllabusMetadata));

    setMetadataTitle(pickStringValue(seed, ["title", "sheetTitle"]));
    setDayLabel(pickStringValue(seed, ["day", "days", "scheduleDays"]));
    setDurationLabel(pickStringValue(seed, ["duration"]));
    setGeneralInformation(pickStringValue(seed, ["generalInformation", "generalInfo", "description"]));
    setTeachingMaterialsText(linesToTextarea(seed.teachingMaterials));
    setSheetNote(pickStringValue(seed, ["note"]) || linesToTextarea(seed.note));
    setSourceFileName(template.sourceFileName || "");
    setAttachment(template.attachment || "");

    if (!level.trim() && template.level) {
      setLevel(template.level);
    }
  };

  const applySessionPatternFromTemplate = (template: LessonPlanTemplate) => {
    const seed = asObject(parseJsonContent(template.syllabusContent));

    setNotesText(linesToTextarea(seed.notes));
    setHomeworkLabel(pickStringValue(seed, ["homeworkLabel"]) || "HOMEWORK");
    setHomeworkMaterialsText(linesToTextarea(seed.homeworkMaterials));
    setHomeworkNotesText(linesToTextarea(seed.homeworkNotes));
    setActivities(activityDraftsFromUnknown(seed.activities));
  };

  const toggleAdvancedJson = () => {
    const next = !useAdvancedJson;
    if (next) {
      setAdvancedMetadata(generatedMetadata);
      setAdvancedContent(generatedContent);
    }
    setUseAdvancedJson(next);
  };

  const handleReset = () => {
    setProgramId(initialProgramId);
    setLevel(initialValue?.level || "");
    setTitle(initialValue?.title || "");
    setSessionIndex(initialValue?.sessionIndex || getSuggestedNextSessionIndex(existingTemplates, initialProgramId, initialValue?.id) || 1);
    setMetadataTitle(pickStringValue(metadataSeed, ["title", "sheetTitle"]));
    setDayLabel(pickStringValue(metadataSeed, ["day", "days", "scheduleDays"]));
    setDurationLabel(pickStringValue(metadataSeed, ["duration"]));
    setGeneralInformation(pickStringValue(metadataSeed, ["generalInformation", "generalInfo", "description"]));
    setTeachingMaterialsText(linesToTextarea(metadataSeed.teachingMaterials));
    setSheetNote(pickStringValue(metadataSeed, ["note"]) || linesToTextarea(metadataSeed.note));
    setSessionTitle(pickStringValue(contentSeed, ["title"]) || initialValue?.title || "");
    setDateLabel(pickStringValue(contentSeed, ["dateLabel"]));
    setTeacherName(pickStringValue(contentSeed, ["teacherName"]));
    setNotesText(linesToTextarea(contentSeed.notes));
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

    if (!programId.trim()) {
      setError("Vui lòng chọn program.");
      return;
    }

    if (!level.trim()) {
      setError("Vui lòng nhập level.");
      return;
    }

    if (!title.trim()) {
      setError("Vui lòng nhập tiêu đề.");
      return;
    }

    if (sessionIndex <= 0) {
      setError("Session index phải lớn hơn 0.");
      return;
    }

    const metadataPayload = useAdvancedJson ? advancedMetadata.trim() : generatedMetadata;
    const contentPayload = useAdvancedJson ? advancedContent.trim() : generatedContent;

    if (!contentPayload) {
      setError("Vui lòng nhập ít nhất một phần syllabus content cho session.");
      return;
    }

    if (useAdvancedJson) {
      try {
        if (metadataPayload) JSON.parse(metadataPayload);
        JSON.parse(contentPayload);
      } catch {
        setError("JSON nâng cao chưa hợp lệ. Vui lòng kiểm tra lại trước khi lưu.");
        return;
      }
    }

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
      title={isEdit ? "Cập nhật template" : "Tạo template thủ công"}
      subtitle="Nhập tay theo đúng bố cục Excel: metadata chung ở trên, rồi nội dung 1 session ở dưới. Form sẽ tự build JSON cho backend."
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

          <Field label="Tiêu đề">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
              placeholder="FLYERS 1 - Session 1"
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
                <span>Gợi ý session tiếp theo: {suggestedNextSessionIndex}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSessionIndexTouched(true);
                    setSessionIndex(suggestedNextSessionIndex);
                  }}
                  className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-700 hover:bg-amber-100 cursor-pointer"
                >
                  Dùng gợi ý
                </button>
              </div>
            ) : null}
          </Field>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-red-50/40 p-5">
          <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-semibold text-red-700">Metadata chung của syllabus</div>
              <div className="mt-1 text-xs text-gray-600">
                Map phần đầu file Excel như `Day`, `General information`, `Teaching Materials`.
              </div>
            </div>
            <StatusBadge kind="info">Sẽ lưu vào `syllabusMetadata`</StatusBadge>
          </div>

          {!isEdit && referenceTemplate ? (
            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 lg:flex-row lg:items-center lg:justify-between">
              <div>
                Program này đã có {reusableTemplates.length} template. Bạn có thể tái dùng phần header chung từ session{" "}
                {referenceTemplate.sessionIndex}.
              </div>
              <button
                type="button"
                onClick={() => applyMetadataFromTemplate(referenceTemplate)}
                className="rounded-xl border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 cursor-pointer"
              >
                Lấy header từ session {referenceTemplate.sessionIndex}
              </button>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Tiêu đề syllabus">
              <input
                value={metadataTitle}
                onChange={(event) => setMetadataTitle(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                placeholder="Ví dụ: SYLLABUS - COURSE FOR PRE IELTS 1"
              />
            </Field>

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
            <p className="mb-2 text-xs text-gray-500">Mỗi dòng là một tài liệu, ví dụ `Handbook for Reading: https://...`</p>
            <textarea
              value={teachingMaterialsText}
              onChange={(event) => setTeachingMaterialsText(event.target.value)}
              rows={4}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
              placeholder={"Handbook for Reading: https://...\nB1 DESTINATION: https://..."}
            />
          </Field>

          <Field label="Note của course">
            <textarea
              value={sheetNote}
              onChange={(event) => setSheetNote(event.target.value)}
              rows={3}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
              placeholder="Ví dụ: Course book accounts for 80% of the lesson..."
            />
          </Field>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-blue-50/30 p-5">
          <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-semibold text-blue-700">Nội dung của 1 session template</div>
              <div className="mt-1 text-xs text-gray-600">
                Map phần bảng trong Excel thành `date`, `teacher`, `notes`, và danh sách `activities`.
              </div>
            </div>
            <StatusBadge kind="info">Sẽ lưu vào `syllabusContent`</StatusBadge>
          </div>

          {!isEdit && referenceTemplate ? (
            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm text-blue-900 lg:flex-row lg:items-center lg:justify-between">
              <div>
                Session gần nhất của program này là session {referenceTemplate.sessionIndex}. Có thể lấy lại notes,
                homework block và activities làm khung rồi sửa nhanh.
              </div>
              <button
                type="button"
                onClick={() => applySessionPatternFromTemplate(referenceTemplate)}
                className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 cursor-pointer"
              >
                Lấy khung từ session {referenceTemplate.sessionIndex}
              </button>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Session title">
              <input
                value={sessionTitle}
                onChange={(event) => setSessionTitle(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                placeholder="Ví dụ: PRE IELTS 1 - Session 1"
              />
            </Field>

            <Field label="Date">
              <input
                value={dateLabel}
                onChange={(event) => setDateLabel(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                placeholder="Ví dụ: 12/06"
              />
            </Field>

            <Field label="Teacher">
              <input
                value={teacherName}
                onChange={(event) => setTeacherName(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                placeholder="Ví dụ: Ms Chloe"
              />
            </Field>
          </div>

          <Field label="Notes">
            <p className="mb-2 text-xs text-gray-500">Mỗi dòng là một note. Ví dụ: `Assigned by teachers`, `Warm up`, `Good bye`.</p>
            <textarea
              value={notesText}
              onChange={(event) => setNotesText(event.target.value)}
              rows={3}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
              placeholder={"Assigned by teachers\nWarm up\nGood bye"}
            />
          </Field>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-amber-800">Homework block của cả session</div>
                <div className="mt-1 text-xs text-gray-600">
                  Dùng cho cột homework lớn ở bên phải sheet, nơi thường ghi `HOMEWORK` và danh sách bài tập.
                </div>
              </div>
              <StatusBadge kind="warning">Extra fields trong `syllabusContent`</StatusBadge>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Homework label">
                <input
                  value={homeworkLabel}
                  onChange={(event) => setHomeworkLabel(event.target.value)}
                  className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-200"
                  placeholder="HOMEWORK"
                />
              </Field>

              <Field label="Homework required materials">
                <textarea
                  value={homeworkMaterialsText}
                  onChange={(event) => setHomeworkMaterialsText(event.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-200"
                  placeholder={"Pages 80,81,82\nVideo repeat"}
                />
              </Field>

              <Field label="Homework notes">
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
              <div>
                <div className="text-sm font-semibold text-blue-700">Activities</div>
                <div className="mt-1 text-xs text-gray-500">Mỗi dòng tương ứng một block trong bảng Excel.</div>
              </div>
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
                  Thêm activity trống
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-300">
              <table className="min-w-[1200px] border-collapse text-sm">
                <thead>
                  <tr className="bg-amber-50 text-gray-700">
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">#</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Time</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Book</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Skills</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Classwork</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Required materials</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Homework materials</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Extra</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Actions</th>
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
                          className="w-full rounded-lg border border-transparent bg-white px-3 py-2 text-sm text-gray-700 focus:border-red-200 focus:outline-none focus:ring-2 focus:ring-red-100"
                          placeholder="5 mins"
                        />
                      </td>
                      <td className="border border-gray-300 p-1.5">
                        <input
                          value={activity.book}
                          onChange={(event) => updateActivity(index, "book", event.target.value)}
                          className="w-full rounded-lg border border-transparent bg-white px-3 py-2 text-sm text-gray-700 focus:border-red-200 focus:outline-none focus:ring-2 focus:ring-red-100"
                          placeholder="B1 DESTINATION"
                        />
                      </td>
                      <td className="border border-gray-300 p-1.5">
                        <input
                          value={activity.skills}
                          onChange={(event) => updateActivity(index, "skills", event.target.value)}
                          className="w-full rounded-lg border border-transparent bg-white px-3 py-2 text-sm text-gray-700 focus:border-red-200 focus:outline-none focus:ring-2 focus:ring-red-100"
                          placeholder="Speaking and Reading"
                        />
                      </td>
                      <td className="border border-gray-300 p-1.5">
                        <textarea
                          value={activity.classwork}
                          onChange={(event) => updateActivity(index, "classwork", event.target.value)}
                          rows={3}
                          className="w-full rounded-lg border border-transparent bg-white px-3 py-2 text-sm text-gray-700 focus:border-red-200 focus:outline-none focus:ring-2 focus:ring-red-100"
                          placeholder={"WARM UP\nHomework Correction"}
                        />
                      </td>
                      <td className="border border-gray-300 p-1.5">
                        <textarea
                          value={activity.requiredMaterials}
                          onChange={(event) => updateActivity(index, "requiredMaterials", event.target.value)}
                          rows={3}
                          className="w-full rounded-lg border border-transparent bg-white px-3 py-2 text-sm text-gray-700 focus:border-red-200 focus:outline-none focus:ring-2 focus:ring-red-100"
                          placeholder="page 101,102"
                        />
                      </td>
                      <td className="border border-gray-300 p-1.5">
                        <textarea
                          value={activity.homeworkRequiredMaterials}
                          onChange={(event) => updateActivity(index, "homeworkRequiredMaterials", event.target.value)}
                          rows={3}
                          className="w-full rounded-lg border border-transparent bg-white px-3 py-2 text-sm text-gray-700 focus:border-red-200 focus:outline-none focus:ring-2 focus:ring-red-100"
                          placeholder="HOMEWORK"
                        />
                      </td>
                      <td className="border border-gray-300 p-1.5">
                        <textarea
                          value={activity.extra}
                          onChange={(event) => updateActivity(index, "extra", event.target.value)}
                          rows={3}
                          className="w-full rounded-lg border border-transparent bg-white px-3 py-2 text-sm text-gray-700 focus:border-red-200 focus:outline-none focus:ring-2 focus:ring-red-100"
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
                            Delete
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

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-gray-900">JSON backend sẽ nhận</div>
              <div className="mt-1 text-xs text-gray-500">
                Bạn không cần tự viết JSON. Form bên trên sẽ tự dựng theo cấu trúc phù hợp với file Excel.
              </div>
            </div>
            <button
              type="button"
              onClick={toggleAdvancedJson}
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 cursor-pointer"
            >
              {useAdvancedJson ? "Ẩn JSON nâng cao" : "Chỉnh JSON nâng cao"}
            </button>
          </div>

          {useAdvancedJson ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <Field label="syllabusMetadata">
                <textarea
                  value={advancedMetadata}
                  onChange={(event) => setAdvancedMetadata(event.target.value)}
                  rows={10}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-mono text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                />
              </Field>

              <Field label="syllabusContent">
                <textarea
                  value={advancedContent}
                  onChange={(event) => setAdvancedContent(event.target.value)}
                  rows={10}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-mono text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                />
              </Field>
            </div>
          ) : (
            <SyllabusSheetPreview metadataObject={generatedMetadataObject} contentObject={generatedContentObject} />
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="sourceFileName">
            <input
              value={sourceFileName}
              onChange={(event) => setSourceFileName(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
              placeholder="Syllabus - XIN CHAO ENGLISH.xlsx"
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
    setSubmitting(true);

    try {
      await onSubmit({
        session,
        templateId: isTeacher ? session.templateId || null : templateId || null,
        plannedContent: plannedContent.trim() || null,
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

  return (
    <ModalFrame
      title={isEdit ? "Cập nhật lesson plan" : "Tạo lesson plan"}
      subtitle="Session đã được khóa sẵn theo read model syllabus. Có thể để plannedContent trống để backend tự copy từ template nếu cần."
      icon={FilePlus2}
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

        {!isTeacher ? (
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
        ) : (
          <Field label="Template liên kết">
            <div className="rounded-xl border border-gray-200 bg-red-50/50 px-4 py-3 text-sm text-gray-700">
              {session.templateTitle || "Teacher không tự gọi list template; backend sẽ tự resolve nếu templateId = null."}
            </div>
          </Field>
        )}

        <Field label="plannedContent">
          <p className="mb-2 text-xs text-gray-500">
            Đây là planned content của lesson plan. Nếu để trống, backend có thể tự copy từ template chuẩn khi tạo mới.
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

        {error ? <ErrorBox message={error} /> : null}

        <ModalActions
          onClose={onClose}
          submitting={submitting}
          submitLabel={isEdit ? "Lưu lesson plan" : "Tạo lesson plan"}
          showReset={false}
        />
      </form>
    </ModalFrame>
  );
}

function TeachingReportModal({
  session,
  plan,
  loading,
  classSyllabus,
  onClose,
  onSubmit,
}: {
  session: ClassLessonPlanSyllabusSession;
  plan: LessonPlan | null;
  loading: boolean;
  classSyllabus: ClassLessonPlanSyllabus | null;
  onClose: () => void;
  onSubmit: (payload: {
    lessonPlanId: string;
    actualContent: string | null;
    actualHomework: string | null;
    teacherNotes: string | null;
  }) => Promise<void>;
}) {
  const [actualContent, setActualContent] = useState(plan?.actualContent || session.actualContent || "");
  const [actualHomework, setActualHomework] = useState(plan?.actualHomework || session.actualHomework || "");
  const [teacherNotes, setTeacherNotes] = useState(plan?.teacherNotes || session.teacherNotes || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (plan) {
      setActualContent(plan.actualContent || session.actualContent || "");
      setActualHomework(plan.actualHomework || session.actualHomework || "");
      setTeacherNotes(plan.teacherNotes || session.teacherNotes || "");
    }
  }, [plan, session]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!plan?.id) return;

    const trimmedContent = actualContent.trim();
    if (!trimmedContent) {
      setError("Vui lòng nhập nội dung dạy thực tế hôm nay.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await onSubmit({
        lessonPlanId: plan.id,
        actualContent: trimmedContent || null,
        actualHomework: actualHomework.trim() || null,
        teacherNotes: teacherNotes.trim() || null,
      });
    } catch (submitError: any) {
      setError(submitError?.message || "Không thể lưu báo cáo buổi dạy.");
    } finally {
      setSubmitting(false);
    }
  };

  const sessionDateDisplay = normalizeDateValue(session.sessionDate)
    ? formatDate(session.sessionDate, true)
    : "Chưa xác định";

  return (
    <ModalFrame
      title="Báo cáo buổi dạy"
      subtitle="Cập nhật nội dung giảng dạy thực tế, bài tập về nhà và ghi chú cho buổi học hôm nay."
      icon={ClipboardPen}
      onClose={onClose}
      widthClass="max-w-3xl"
    >
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-600">
          <Loader2 size={20} className="mr-3 animate-spin text-red-600" />
          Đang chuẩn bị...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <InfoCard
              icon={Users}
              label="Lớp"
              value={classSyllabus?.classTitle || classSyllabus?.classCode || "-"}
            />
            <InfoCard
              icon={CalendarDays}
              label="Buổi học"
              value={getSessionDisplay(session)}
            />
            <InfoCard
              icon={Clock3}
              label="Ngày dạy"
              value={sessionDateDisplay}
            />
          </div>

          {session.templateSyllabusContent ? (
            <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4">
              <div className="mb-2 text-sm font-semibold text-blue-700">Nội dung syllabus chuẩn (tham khảo)</div>
              <div className="max-h-40 overflow-y-auto">
                <StructuredContent value={session.templateSyllabusContent} placeholder="" />
              </div>
            </div>
          ) : null}

          {session.plannedContent ? (
            <div className="rounded-2xl border border-red-100 bg-red-50/40 p-4">
              <div className="mb-2 text-sm font-semibold text-red-700">Giáo án dự kiến (tham khảo)</div>
              <div className="max-h-32 overflow-y-auto">
                <StructuredContent value={session.plannedContent} placeholder="" />
              </div>
            </div>
          ) : null}

          <Field label="Nội dung dạy thực tế hôm nay *">
            <p className="mb-2 text-xs text-gray-500">
              Mô tả chi tiết nội dung bạn đã dạy trong buổi học. Thông tin này sẽ được Admin/Staff xem xét.
            </p>
            <textarea
              value={actualContent}
              onChange={(event) => setActualContent(event.target.value)}
              rows={6}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              placeholder="VD: Hôm nay dạy Unit 3 - Animals, các bé học được tên các con vật, luyện phát âm và chơi game matching..."
              autoFocus
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
              placeholder="VD: Bé An vắng mặt, cần gửi bài bù. Lớp tiến bộ tốt, cần tăng tốc Unit 4..."
            />
          </Field>

          {error ? <ErrorBox message={error} /> : null}

          <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-60 cursor-pointer"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <ClipboardPen size={16} />}
              {submitting ? "Đang lưu..." : "Lưu báo cáo buổi dạy"}
            </button>
          </div>
        </form>
      )}
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

export default LessonPlanWorkspace;