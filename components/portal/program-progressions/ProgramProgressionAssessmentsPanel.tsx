"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  BarChart3,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  Edit,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LeadPagination from "@/components/portal/leads/LeadPagination";
import ConfirmModal from "@/components/ConfirmModal";
import {
  approveProgramProgressionAssessment,
  bulkApproveProgramProgressionAssessments,
  createProgramProgressionAssessment,
  getProgramProgressionAssessments,
  getProgramProgressionAssessmentSourceOptions,
  updateProgramProgressionAssessment,
  type ProgramProgressionLookupOption,
} from "@/lib/api/programProgressionService";
import { isUploadSuccess, uploadFile } from "@/lib/api/fileService";
import { getUserById } from "@/lib/api/userService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/lightswind/select";
import type {
  ProgramProgressionAssessment,
  ProgramProgressionAssessmentStatus,
  ProgramProgressionAssessmentUpsertPayload,
  ProgramProgressionMethod,
} from "@/types/program-progression";

type ProgramProgressionAssessmentsPanelProps = {
  canManageAssessments: boolean;
  canApproveAssessments: boolean;
  canBulkApproveAssessments: boolean;
  isStudentView?: boolean;
};

type AssessmentFormState = {
  sourceRegistrationId: string;
  scheduleParticipantId: string;
  assessmentDate: string;
  passedInClass: "" | "true" | "false";
  listeningScore: string;
  speakingScore: string;
  readingWritingScore: string;
  readingScore: string;
  writingScore: string;
  comment: string;
  attachmentUrls: string[];
};

const SOURCE_REGISTRATION_NONE = "__no_source_registration__";
const SCHEDULE_PARTICIPANT_NONE = "__no_schedule_participant__";

const DEFAULT_FORM: AssessmentFormState = {
  sourceRegistrationId: "",
  scheduleParticipantId: "",
  assessmentDate: "",
  passedInClass: "",
  listeningScore: "",
  speakingScore: "",
  readingWritingScore: "",
  readingScore: "",
  writingScore: "",
  comment: "",
  attachmentUrls: [],
};

function parseOptionalNumber(value: string): number | null {
  const cleaned = value.trim();
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  if (Number.isNaN(parsed)) return null;
  return parsed;
}

function toLocalInputDateTime(iso?: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  const local = new Date(date.getTime() - offset);
  return local.toISOString().slice(0, 16);
}

function toUtcIso(localDateTime: string): string | undefined {
  if (!localDateTime) return undefined;
  return new Date(localDateTime).toISOString();
}

function scoreSummary(item: ProgramProgressionAssessment): string {
  if (item.method === "PassFail") {
    if (item.passedInClass === true) return "Đạt";
    if (item.passedInClass === false) return "Chưa đạt";
    return "--";
  }

  if (item.method === "Shields") {
    return item.isEligible ? "Đủ điều kiện" : "Chưa đủ điều kiện";
  }

  return `Điểm tổng: ${item.overallScore ?? "--"}`;
}

function statusClass(status: ProgramProgressionAssessmentStatus): string {
  if (status === "Approved") return "bg-green-100 text-green-700 border-green-200";
  return "bg-amber-100 text-amber-700 border-amber-200";
}

function methodLabel(method?: ProgramProgressionMethod): string {
  if (!method) return "--";
  if (method === "PassFail") return "Đạt / Chưa đạt";
  if (method === "Shields") return "Khiên";
  return "Thang Cambridge";
}

function assessmentStatusLabel(status: ProgramProgressionAssessmentStatus): string {
  if (status === "Recorded") return "Đã ghi nhận";
  return "Đã duyệt";
}

function resolveAssessmentErrorMessage(error: unknown): string {
  const fallback = "Vui lòng kiểm tra dữ liệu và thử lại.";
  const err = (error || {}) as {
    message?: string;
    response?: {
      data?: {
        title?: string;
        code?: string;
        message?: string;
        detail?: string;
      };
    };
  };

  const combined = [
    err.response?.data?.title,
    err.response?.data?.code,
    err.response?.data?.message,
    err.response?.data?.detail,
    err.message,
  ]
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .join(" | ")
    .toLowerCase();

  if (combined.includes("shield-based progression") && combined.includes("speakingscore")) {
    return "Điểm nói phải nằm trong khoảng 0 đến 5 theo quy tắc Khiên.";
  }

  if (combined.includes("shield-based progression") && combined.includes("listeningscore")) {
    return "Điểm nghe phải nằm trong khoảng 0 đến 5 theo quy tắc Khiên.";
  }

  if (combined.includes("shield-based progression") && combined.includes("readingscore")) {
    return "Điểm đọc phải nằm trong khoảng 0 đến 5 theo quy tắc Khiên.";
  }

  if (combined.includes("shield-based progression") && combined.includes("writingscore")) {
    return "Điểm viết phải nằm trong khoảng 0 đến 5 theo quy tắc Khiên.";
  }

  if (combined.includes("cambridge") && combined.includes("overall")) {
    return "Điểm tổng chưa hợp lệ theo quy tắc Thang Cambridge.";
  }

  if (combined.includes("one or more validation errors occurred") || combined.includes("validation")) {
    return "Dữ liệu đánh giá chưa hợp lệ. Vui lòng kiểm tra lại các trường điểm và nguồn dữ liệu.";
  }

  return fallback;
}

function shouldLookupCreatorId(value?: string | null): value is string {
  const normalized = String(value || "").trim();
  if (!normalized) return false;
  if (normalized.includes(" ")) return false;
  if (normalized.includes("@")) return false;
  return normalized.length >= 8;
}

export default function ProgramProgressionAssessmentsPanel({
  canManageAssessments,
  canApproveAssessments,
  canBulkApproveAssessments,
  isStudentView = false,
}: ProgramProgressionAssessmentsPanelProps) {
  const { toast } = useToast();

  const [items, setItems] = useState<ProgramProgressionAssessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [isLoadingSourceOptions, setIsLoadingSourceOptions] = useState(false);

  const [scheduleParticipantOptions, setScheduleParticipantOptions] = useState<
    ProgramProgressionLookupOption[]
  >([]);
  const [sourceRegistrationOptions, setSourceRegistrationOptions] = useState<
    ProgramProgressionLookupOption[]
  >([]);

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [studentProfileIdFilter, setStudentProfileIdFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ProgramProgressionAssessmentStatus>("all");
  const [methodFilter, setMethodFilter] = useState<"all" | ProgramProgressionMethod>("all");
  const [eligibilityFilter, setEligibilityFilter] = useState<"all" | "eligible" | "not-eligible">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<ProgramProgressionAssessment | null>(null);
  const [form, setForm] = useState<AssessmentFormState>(DEFAULT_FORM);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [creatorNameById, setCreatorNameById] = useState<Record<string, string>>({});
  const [assessmentPendingApprove, setAssessmentPendingApprove] =
    useState<ProgramProgressionAssessment | null>(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isApprovingAssessment, setIsApprovingAssessment] = useState(false);
  const [isBulkApproveModalOpen, setIsBulkApproveModalOpen] = useState(false);
  const [isBulkApprovingAssessments, setIsBulkApprovingAssessments] = useState(false);

  const query = useMemo(
    () => ({
      studentProfileId: studentProfileIdFilter.trim() || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
      method: methodFilter === "all" ? undefined : methodFilter,
      isEligible:
        eligibilityFilter === "all"
          ? undefined
          : eligibilityFilter === "eligible"
          ? true
          : false,
      pageNumber,
      pageSize,
    }),
    [studentProfileIdFilter, statusFilter, methodFilter, eligibilityFilter, pageNumber, pageSize]
  );

  const filteredItems = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return items;

    return items.filter((item) => {
      const searchable = [
        item.studentName,
        item.studentProfileId,
        item.sourceProgramName,
        item.sourceRegistrationId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalized);
    });
  }, [items, searchQuery]);

  const loadAssessments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getProgramProgressionAssessments(query);
      setItems(response.items);
      setTotalCount(response.totalCount);
      setTotalPages(response.totalPages);

      setSelectedIds((prev) => prev.filter((id) => response.items.some((item) => item.id === id)));
    } catch (error) {
      console.error("Failed to load program progression assessments", error);
      toast({
        variant: "destructive",
        title: "Không thể tải đánh giá",
        description: "Vui lòng thử lại sau.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [query, toast]);

  useEffect(() => {
    void loadAssessments();
  }, [loadAssessments]);

  useEffect(() => {
    setPageNumber(1);
  }, [studentProfileIdFilter, statusFilter, methodFilter, eligibilityFilter]);

  const loadAssessmentSourceOptions = useCallback(
    async (seedAssessment?: ProgramProgressionAssessment | null) => {
      setIsLoadingSourceOptions(true);
      try {
        const response = await getProgramProgressionAssessmentSourceOptions();

        const participantOptions = [...response.scheduleParticipants];
        const registrationOptions = [...response.sourceRegistrations];

        if (seedAssessment?.scheduleParticipantId) {
          const hasSeedParticipant = participantOptions.some(
            (item) => item.id === seedAssessment.scheduleParticipantId
          );

          if (!hasSeedParticipant) {
            participantOptions.unshift({
              id: seedAssessment.scheduleParticipantId,
              name: seedAssessment.studentName || "Học sinh hiện tại",
              subtitle: "Đang dùng trong bản ghi hiện tại",
            });
          }
        }

        if (seedAssessment?.sourceRegistrationId) {
          const hasSeedRegistration = registrationOptions.some(
            (item) => item.id === seedAssessment.sourceRegistrationId
          );

          if (!hasSeedRegistration) {
            registrationOptions.unshift({
              id: seedAssessment.sourceRegistrationId,
              name: seedAssessment.studentName || "Học sinh hiện tại",
              subtitle: "Đang dùng trong bản ghi hiện tại",
            });
          }
        }

        setScheduleParticipantOptions(participantOptions);
        setSourceRegistrationOptions(registrationOptions);
      } catch (error) {
        console.error("Failed to load assessment source options", error);
        toast({
          variant: "destructive",
          title: "Không thể tải danh sách nguồn",
          description: "Vui lòng thử lại sau.",
        });
      } finally {
        setIsLoadingSourceOptions(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    if (!isModalOpen) return;
    void loadAssessmentSourceOptions(editingAssessment);
  }, [isModalOpen, editingAssessment, loadAssessmentSourceOptions]);

  const openCreate = () => {
    setEditingAssessment(null);
    setForm(DEFAULT_FORM);
    setIsModalOpen(true);
  };

  const openEdit = (assessment: ProgramProgressionAssessment) => {
    setEditingAssessment(assessment);
    setForm({
      sourceRegistrationId: assessment.sourceRegistrationId || "",
      scheduleParticipantId: assessment.scheduleParticipantId || "",
      assessmentDate: toLocalInputDateTime(assessment.assessmentDate),
      passedInClass:
        assessment.passedInClass == null
          ? ""
          : assessment.passedInClass
          ? "true"
          : "false",
      listeningScore:
        assessment.listeningScore == null ? "" : String(assessment.listeningScore),
      speakingScore:
        assessment.speakingScore == null ? "" : String(assessment.speakingScore),
      readingWritingScore:
        assessment.readingWritingScore == null
          ? ""
          : String(assessment.readingWritingScore),
      readingScore:
        assessment.readingScore == null ? "" : String(assessment.readingScore),
      writingScore:
        assessment.writingScore == null ? "" : String(assessment.writingScore),
      comment: assessment.comment || "",
      attachmentUrls: assessment.attachmentUrls || [],
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setEditingAssessment(null);
    setForm(DEFAULT_FORM);
  };

  const onSubmit = async () => {
    const sourceRegistrationId = form.sourceRegistrationId.trim();
    const scheduleParticipantId = form.scheduleParticipantId.trim();

    if (!sourceRegistrationId && !scheduleParticipantId) {
      toast({
        variant: "warning",
        title: "Thiếu dữ liệu",
        description: "Cần ít nhất một nguồn: ghi danh hoặc thành viên lịch.",
      });
      return;
    }

    const payload: ProgramProgressionAssessmentUpsertPayload = {
      sourceRegistrationId: sourceRegistrationId || undefined,
      scheduleParticipantId: scheduleParticipantId || undefined,
      assessmentDate: toUtcIso(form.assessmentDate),
      passedInClass:
        form.passedInClass === "" ? null : form.passedInClass === "true",
      listeningScore: parseOptionalNumber(form.listeningScore),
      speakingScore: parseOptionalNumber(form.speakingScore),
      readingWritingScore: parseOptionalNumber(form.readingWritingScore),
      readingScore: parseOptionalNumber(form.readingScore),
      writingScore: parseOptionalNumber(form.writingScore),
      comment: form.comment.trim() || null,
      attachmentUrls: form.attachmentUrls,
    };

    setIsSubmitting(true);
    try {
      if (editingAssessment) {
        await updateProgramProgressionAssessment(editingAssessment.id, payload);
      } else {
        await createProgramProgressionAssessment(payload);
      }

      toast({
        variant: "success",
        title: editingAssessment ? "Cập nhật thành công" : "Tạo mới thành công",
        description: "Bản ghi đánh giá đã được lưu.",
      });

      closeModal();
      await loadAssessments();
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Không thể lưu đánh giá",
        description: resolveAssessmentErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadAttachments = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setIsUploadingAttachment(true);
    const uploadedUrls: string[] = [];
    let failedCount = 0;

    try {
      for (const file of files) {
        const response = await uploadFile(file, "program-progressions");
        if (isUploadSuccess(response)) {
          uploadedUrls.push(response.url);
        } else {
          failedCount += 1;
        }
      }

      if (uploadedUrls.length > 0) {
        setForm((prev) => ({
          ...prev,
          attachmentUrls: Array.from(new Set([...prev.attachmentUrls, ...uploadedUrls])),
        }));

        toast({
          variant: "success",
          title: "Thêm tệp đính kèm thành công",
          description: `Đã thêm ${uploadedUrls.length} tệp vào đánh giá.`,
        });
      }

      if (failedCount > 0) {
        toast({
          variant: "warning",
          title: "Một số tệp tải lên thất bại",
          description: `Đã tải thành công ${uploadedUrls.length}, thất bại ${failedCount}.`,
        });
      }
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Không thể tải tệp đính kèm",
        description: resolveAssessmentErrorMessage(error),
      });
    } finally {
      setIsUploadingAttachment(false);
      event.target.value = "";
    }
  };

  const removeAttachment = (url: string) => {
    setForm((prev) => ({
      ...prev,
      attachmentUrls: prev.attachmentUrls.filter((item) => item !== url),
    }));
  };

  const handleApprove = (assessment: ProgramProgressionAssessment) => {
    setAssessmentPendingApprove(assessment);
    setIsApproveModalOpen(true);
  };

  const confirmApprove = async () => {
    if (!assessmentPendingApprove) return;

    setIsApprovingAssessment(true);
    try {
      await approveProgramProgressionAssessment(assessmentPendingApprove.id, {});
      toast({
        variant: "success",
        title: "Duyệt thành công",
        description: "Bản ghi đánh giá đã được duyệt.",
      });
      setIsApproveModalOpen(false);
      setAssessmentPendingApprove(null);
      await loadAssessments();
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Không thể duyệt",
        description: resolveAssessmentErrorMessage(error),
      });
    } finally {
      setIsApprovingAssessment(false);
    }
  };

  const handleBulkApprove = () => {
    if (selectedIds.length === 0) {
      toast({
        variant: "warning",
        title: "Chưa chọn bản ghi đánh giá",
        description: "Vui lòng chọn ít nhất một bản ghi ở trạng thái Đã ghi nhận.",
      });
      return;
    }

    setIsBulkApproveModalOpen(true);
  };

  const confirmBulkApprove = async () => {
    setIsBulkApprovingAssessments(true);
    try {
      await bulkApproveProgramProgressionAssessments({
        items: selectedIds.map((assessmentId) => ({ assessmentId })),
      });

      toast({
        variant: "success",
        title: "Duyệt hàng loạt thành công",
        description: `Đã gửi duyệt cho ${selectedIds.length} bản ghi đánh giá.`,
      });

      setIsBulkApproveModalOpen(false);
      setSelectedIds([]);
      await loadAssessments();
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Duyệt hàng loạt thất bại",
        description: resolveAssessmentErrorMessage(error),
      });
    } finally {
      setIsBulkApprovingAssessments(false);
    }
  };

  const toggleSelect = (assessmentId: string) => {
    setSelectedIds((prev) =>
      prev.includes(assessmentId)
        ? prev.filter((id) => id !== assessmentId)
        : [...prev, assessmentId]
    );
  };

  useEffect(() => {
    const unresolvedCreatorIds = Array.from(
      new Set(
        items
          .filter(
            (item) =>
              !item.createdByName &&
              shouldLookupCreatorId(item.createdBy) &&
              !creatorNameById[item.createdBy.trim()]
          )
          .map((item) => item.createdBy!.trim())
      )
    );

    if (unresolvedCreatorIds.length === 0) return;

    let isCancelled = false;

    const loadCreatorNames = async () => {
      const lookups = await Promise.allSettled(
        unresolvedCreatorIds.map(async (creatorId) => {
          const response = await getUserById(creatorId);
          const user = (
            response as {
              data?: { user?: { name?: string; username?: string; email?: string } };
            }
          )?.data?.user;

          const resolvedName = String(user?.name || user?.username || user?.email || "").trim();
          if (!resolvedName) return null;

          return { creatorId, resolvedName };
        })
      );

      if (isCancelled) return;

      setCreatorNameById((prev) => {
        const next = { ...prev };
        let changed = false;

        for (const lookup of lookups) {
          if (lookup.status !== "fulfilled" || !lookup.value) continue;
          if (next[lookup.value.creatorId] === lookup.value.resolvedName) continue;

          next[lookup.value.creatorId] = lookup.value.resolvedName;
          changed = true;
        }

        return changed ? next : prev;
      });
    };

    void loadCreatorNames();

    return () => {
      isCancelled = true;
    };
  }, [items, creatorNameById]);

  const assessmentStats = useMemo(() => {
    const recordedCount = items.filter((item) => item.status === "Recorded").length;
    const approvedCount = items.filter((item) => item.status === "Approved").length;
    const eligibleCount = items.filter((item) => item.isEligible === true).length;

    return {
      totalCount: items.length,
      recordedCount,
      approvedCount,
      eligibleCount,
    };
  }, [items]);

  const isSearching = searchQuery.trim().length > 0;
  const displayTotalCount = isSearching ? filteredItems.length : totalCount || items.length;
  const displayCurrentPage = isSearching ? 1 : pageNumber;
  const displayTotalPages = isSearching ? 1 : Math.max(totalPages, 1);

  const resolveCreatorLabel = useCallback(
    (item: ProgramProgressionAssessment): string => {
      if (item.createdByName?.trim()) return item.createdByName;
      if (item.createdBy && creatorNameById[item.createdBy]) {
        return creatorNameById[item.createdBy];
      }
      return item.createdBy || "--";
    },
    [creatorNameById]
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:border-red-300 hover:shadow-md">
          <div className="absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full bg-linear-to-r from-red-600 to-red-700 opacity-5 blur-xl" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="rounded-xl bg-linear-to-r from-red-600 to-red-700 p-2 text-white shadow-sm">
              <ClipboardCheck size={18} />
            </div>
            <div className="min-w-0 flex-1 text-right">
              <div className="text-xs font-medium text-gray-600">Bản ghi trong trang</div>
              <div className="text-xl font-bold text-gray-900">{assessmentStats.totalCount}</div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:border-red-300 hover:shadow-md">
          <div className="absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full bg-linear-to-r from-amber-500 to-amber-600 opacity-5 blur-xl" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="rounded-xl bg-linear-to-r from-amber-500 to-amber-600 p-2 text-white shadow-sm">
              <BarChart3 size={18} />
            </div>
            <div className="min-w-0 flex-1 text-right">
              <div className="text-xs font-medium text-gray-600">Đã ghi nhận</div>
              <div className="text-xl font-bold text-gray-900">{assessmentStats.recordedCount}</div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:border-red-300 hover:shadow-md">
          <div className="absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full bg-linear-to-r from-green-500 to-green-600 opacity-5 blur-xl" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="rounded-xl bg-linear-to-r from-green-500 to-green-600 p-2 text-white shadow-sm">
              <CheckCircle2 size={18} />
            </div>
            <div className="min-w-0 flex-1 text-right">
              <div className="text-xs font-medium text-gray-600">Đã duyệt</div>
              <div className="text-xl font-bold text-gray-900">{assessmentStats.approvedCount}</div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:border-red-300 hover:shadow-md">
          <div className="absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full bg-linear-to-r from-blue-500 to-blue-600 opacity-5 blur-xl" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="rounded-xl bg-linear-to-r from-blue-500 to-blue-600 p-2 text-white shadow-sm">
              <Users size={18} />
            </div>
            <div className="min-w-0 flex-1 text-right">
              <div className="text-xs font-medium text-gray-600">Đủ điều kiện</div>
              <div className="text-xl font-bold text-gray-900">{assessmentStats.eligibleCount}</div>
            </div>
          </div>
        </div>
      </div>

      <div
        className={
          isStudentView
            ? "rounded-2xl border border-white/15 bg-white/5 p-4"
            : "rounded-2xl border border-red-200 bg-linear-to-br from-white to-red-50 p-4"
        }
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative lg:flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tìm theo tên, mã học sinh, chương trình..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as "all" | ProgramProgressionAssessmentStatus)
              }
              searchPlaceholder="Tìm kiếm trạng thái..."
              emptyText="Không có trạng thái phù hợp."
            >
              <SelectTrigger className="h-10 min-w-40 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-100">
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="Recorded">Đã ghi nhận</SelectItem>
                <SelectItem value="Approved">Đã duyệt</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={methodFilter}
              onValueChange={(value) =>
                setMethodFilter(value as "all" | ProgramProgressionMethod)
              }
              searchPlaceholder="Tìm kiếm phương pháp..."
              emptyText="Không có phương pháp phù hợp."
            >
              <SelectTrigger className="h-10 min-w-40 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-100">
                <SelectValue placeholder="Chọn phương pháp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="PassFail">Đạt / Chưa đạt</SelectItem>
                <SelectItem value="Shields">Khiên</SelectItem>
                <SelectItem value="CambridgeScale">Thang Cambridge</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={eligibilityFilter}
              onValueChange={(value) =>
                setEligibilityFilter(value as "all" | "eligible" | "not-eligible")
              }
              searchPlaceholder="Tìm kiếm điều kiện..."
              emptyText="Không có điều kiện phù hợp."
            >
              <SelectTrigger className="h-10 min-w-40 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-100">
                <SelectValue placeholder="Chọn điều kiện" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="eligible">Đủ điều kiện</SelectItem>
                <SelectItem value="not-eligible">Chưa đủ điều kiện</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void loadAssessments()}
            className={
              isStudentView
                ? "inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm text-white"
                : "inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700"
            }
          >
            <RefreshCw size={16} /> Làm mới
          </button>

          {canManageAssessments && (
            <button
              type="button"
              onClick={openCreate}
              className={
                isStudentView
                  ? "inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white"
                  : "inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-semibold text-white"
              }
            >
              <Plus size={16} /> Tạo đánh giá
            </button>
          )}

          {canBulkApproveAssessments && (
            <button
              type="button"
              onClick={handleBulkApprove}
              disabled={isBulkApprovingAssessments}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700"
            >
              <CheckCircle2 size={16} /> Duyệt hàng loạt ({selectedIds.length})
            </button>
          )}
        </div>
      </div>

      <div
        className={
          isStudentView
            ? "rounded-2xl border border-white/15 bg-white/5"
            : "overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm"
        }
      >
        <div
          className={
            isStudentView
              ? "border-b border-white/10 p-4"
              : "border-b border-red-100 bg-linear-to-r from-red-500/10 to-red-700/10 p-4"
          }
        >
          <div className="flex items-center justify-between">
            <h3 className={isStudentView ? "text-sm font-semibold text-white" : "text-sm font-semibold text-gray-900"}>
              Danh sách đánh giá
            </h3>
            {!isLoading && (
              <span className={isStudentView ? "text-xs text-indigo-100" : "text-xs text-gray-500"}>
                {displayTotalCount} bản ghi
              </span>
            )}
          </div>
        </div>

        <div>
          {isLoading ? (
            <div className={isStudentView ? "text-sm text-indigo-100" : "text-sm text-gray-500"}>Đang tải dữ liệu...</div>
          ) : filteredItems.length === 0 ? (
            <div className="border border-dashed border-red-200 p-6 text-center">
              <ClipboardCheck size={22} className="mx-auto mb-2 text-red-500" />
              <div className="text-sm font-semibold text-gray-900">Không có bản ghi đánh giá</div>
              <p className="mt-1 text-xs text-gray-500">Thử thay đổi bộ lọc hoặc tạo dữ liệu mới.</p>
            </div>
          ) : (
            <div className="overflow-hidden border border-red-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-red-200 bg-linear-to-r from-red-500/5 to-red-700/5">
                    <tr>
                      {canBulkApproveAssessments && (
                        <th className="w-14 px-4 py-3 text-left text-sm font-semibold text-gray-700">Chọn</th>
                      )}
                      <th className="min-w-62.5 px-6 py-3 text-left text-sm font-semibold text-gray-700">Học sinh</th>
                      <th className="min-w-55 px-6 py-3 text-left text-sm font-semibold text-gray-700">Chương trình / Phương pháp</th>
                      <th className="min-w-55 px-6 py-3 text-left text-sm font-semibold text-gray-700">Điểm / Ngày đánh giá</th>
                      <th className="min-w-47.5 px-6 py-3 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
                      <th className="min-w-47.5 px-6 py-3 text-left text-sm font-semibold text-gray-700">Người tạo</th>
                      <th className="min-w-55 px-6 py-3 text-left text-sm font-semibold text-gray-700">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-100">
                    {filteredItems.map((item) => {
                      const canSelectForBulk =
                        canBulkApproveAssessments && item.status === "Recorded";
                      const canEdit = canManageAssessments && item.status === "Recorded";
                      const canApprove = canApproveAssessments && item.status === "Recorded";

                      return (
                        <tr
                          key={item.id}
                          className="group transition-all duration-200 hover:bg-linear-to-r hover:from-red-50/50 hover:to-white"
                        >
                          {canBulkApproveAssessments && (
                            <td className="w-14 px-4 py-4 align-top">
                              {canSelectForBulk ? (
                                <input
                                  type="checkbox"
                                  checked={selectedIds.includes(item.id)}
                                  onChange={() => toggleSelect(item.id)}
                                  className="mt-1 h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-200"
                                />
                              ) : (
                                <span className="text-xs text-gray-300">--</span>
                              )}
                            </td>
                          )}

                          <td className="min-w-62.5 px-6 py-4 align-top text-sm text-gray-900">
                            <div className="font-medium">{item.studentName || item.studentProfileId}</div>
                          </td>

                          <td className="min-w-55 px-6 py-4 align-top text-sm text-gray-700">
                            <div className="font-medium text-gray-900">{item.sourceProgramName || item.sourceProgramId || "--"}</div>
                            <span className="mt-1 inline-flex rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                              {methodLabel(item.method)}
                            </span>
                          </td>

                          <td className="min-w-55 px-6 py-4 align-top text-sm text-gray-700">
                            <div>{scoreSummary(item)}</div>
                            <div className="mt-1 text-xs text-gray-500">
                              {item.assessmentDate
                                ? new Date(item.assessmentDate).toLocaleString("vi-VN")
                                : "Chưa có ngày đánh giá"}
                            </div>
                          </td>

                          <td className="min-w-47.5 px-6 py-4 align-top">
                            <div className="flex flex-wrap gap-1.5">
                              <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${statusClass(item.status)}`}>
                                {assessmentStatusLabel(item.status)}
                              </span>
                              {item.isEligible != null && (
                                <span
                                  className={`rounded-full border px-2 py-1 text-xs font-semibold ${
                                    item.isEligible
                                      ? "border-green-200 bg-green-50 text-green-700"
                                      : "border-rose-200 bg-rose-50 text-rose-700"
                                  }`}
                                >
                                  {item.isEligible ? "Đủ điều kiện" : "Chưa đủ điều kiện"}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="min-w-47.5 px-6 py-4 align-top text-sm text-gray-700">
                            <div className="font-medium text-gray-900">{resolveCreatorLabel(item)}</div>
                            <div className="mt-1 text-xs text-gray-500">
                              {item.createdAt
                                ? `Tạo lúc: ${new Date(item.createdAt).toLocaleString("vi-VN")}`
                                : "--"}
                            </div>
                          </td>

                          <td className="min-w-55 px-6 py-4 align-top">
                            <div className="flex flex-wrap items-center gap-2">
                              {canEdit && (
                                <button
                                  type="button"
                                  onClick={() => openEdit(item)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2 py-1 text-xs font-semibold text-red-700"
                                >
                                  <Edit size={12} /> Sửa
                                </button>
                              )}

                              {canApprove && (
                                <button
                                  type="button"
                                  onClick={() => handleApprove(item)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700"
                                >
                                  <BadgeCheck size={12} /> Duyệt
                                </button>
                              )}
                            </div>
                            {item.comment && (
                              <div className="mt-2 text-xs text-gray-500">Nhận xét: {item.comment}</div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <LeadPagination
                currentPage={displayCurrentPage}
                totalPages={displayTotalPages}
                pageSize={pageSize}
                totalCount={displayTotalCount}
                itemLabel="bản ghi đánh giá"
                onPageChange={(page) => {
                  if (!isSearching) {
                    setPageNumber(page);
                  }
                }}
                onPageSizeChange={() => undefined}
              />
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4" onClick={closeModal}>
          <div
            className="w-full max-w-3xl overflow-hidden rounded-2xl border border-red-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="bg-linear-to-r from-red-600 to-red-700 p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">
                    {editingAssessment ? "Cập nhật đánh giá" : "Tạo đánh giá"}
                  </h3>
                  <p className="text-xs text-red-100">Nhập kết quả theo phương pháp và lưu đánh giá</p>
                </div>

                <button type="button" onClick={closeModal} className="rounded-full p-1 hover:bg-white/20">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="max-h-[70vh] space-y-4 overflow-y-auto p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-gray-600">Nguồn từ đăng ký</label>
                  <Select
                    value={form.sourceRegistrationId || SOURCE_REGISTRATION_NONE}
                    onValueChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        sourceRegistrationId:
                          value === SOURCE_REGISTRATION_NONE ? "" : value,
                      }))
                    }
                    searchPlaceholder="Tìm theo tên học sinh..."
                    emptyText="Không tìm thấy đăng ký phù hợp."
                  >
                    <SelectTrigger className="w-full rounded-xl border border-red-200 bg-white text-sm text-gray-700 data-[state=open]:border-red-300 data-[state=open]:ring-2 data-[state=open]:ring-red-100">
                      <SelectValue
                        placeholder={
                          isLoadingSourceOptions
                            ? "Đang tải danh sách..."
                            : "Chọn đăng ký theo tên học sinh"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SOURCE_REGISTRATION_NONE}>Không chọn</SelectItem>
                      {sourceRegistrationOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          <div className="flex flex-col">
                            <span>{option.name}</span>
                            {option.subtitle && (
                              <span className="text-[11px] text-gray-500">{option.subtitle}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-gray-600">Nguồn từ lịch đánh giá</label>
                  <Select
                    value={form.scheduleParticipantId || SCHEDULE_PARTICIPANT_NONE}
                    onValueChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        scheduleParticipantId:
                          value === SCHEDULE_PARTICIPANT_NONE ? "" : value,
                      }))
                    }
                    searchPlaceholder="Tìm theo tên học sinh hoặc lịch..."
                    emptyText="Không tìm thấy thành viên phù hợp."
                  >
                    <SelectTrigger className="w-full rounded-xl border border-red-200 bg-white text-sm text-gray-700 data-[state=open]:border-red-300 data-[state=open]:ring-2 data-[state=open]:ring-red-100">
                      <SelectValue
                        placeholder={
                          isLoadingSourceOptions
                            ? "Đang tải danh sách..."
                            : "Chọn thành viên lịch theo tên học sinh"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SCHEDULE_PARTICIPANT_NONE}>Không chọn</SelectItem>
                      {scheduleParticipantOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          <div className="flex flex-col">
                            <span>{option.name}</span>
                            {option.subtitle && (
                              <span className="text-[11px] text-gray-500">{option.subtitle}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-gray-600">Thời gian đánh giá</label>
                  <input
                    type="datetime-local"
                    value={form.assessmentDate}
                    onChange={(event) => setForm((prev) => ({ ...prev, assessmentDate: event.target.value }))}
                    className="w-full rounded-xl border border-red-200 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-gray-600">Kết quả tại lớp</label>
                  <Select
                    value={form.passedInClass || "none"}
                    onValueChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        passedInClass: value === "none" ? "" : (value as "true" | "false"),
                      }))
                    }
                    searchPlaceholder="Tìm kiếm kết quả..."
                    emptyText="Không có kết quả phù hợp."
                  >
                    <SelectTrigger className="w-full rounded-xl border border-red-200 bg-white text-sm text-gray-700 data-[state=open]:border-red-300 data-[state=open]:ring-2 data-[state=open]:ring-red-100">
                      <SelectValue placeholder="Chọn kết quả" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không áp dụng</SelectItem>
                      <SelectItem value="true">Đạt</SelectItem>
                      <SelectItem value="false">Chưa đạt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-600">Điểm nghe</label>
                  <input
                    value={form.listeningScore}
                    onChange={(event) => setForm((prev) => ({ ...prev, listeningScore: event.target.value }))}
                    className="w-full rounded-xl border border-red-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-600">Điểm nói</label>
                  <input
                    value={form.speakingScore}
                    onChange={(event) => setForm((prev) => ({ ...prev, speakingScore: event.target.value }))}
                    className="w-full rounded-xl border border-red-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-600">Điểm đọc + viết</label>
                  <input
                    value={form.readingWritingScore}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, readingWritingScore: event.target.value }))
                    }
                    className="w-full rounded-xl border border-red-200 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-gray-600">Điểm đọc</label>
                  <input
                    value={form.readingScore}
                    onChange={(event) => setForm((prev) => ({ ...prev, readingScore: event.target.value }))}
                    className="w-full rounded-xl border border-red-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-600">Điểm viết</label>
                  <input
                    value={form.writingScore}
                    onChange={(event) => setForm((prev) => ({ ...prev, writingScore: event.target.value }))}
                    className="w-full rounded-xl border border-red-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-600">Nhận xét</label>
                <textarea
                  rows={3}
                  value={form.comment}
                  onChange={(event) => setForm((prev) => ({ ...prev, comment: event.target.value }))}
                  className="w-full rounded-xl border border-red-200 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-600">Tệp đính kèm</label>
                <div className="rounded-xl border border-red-200 bg-red-50/40 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:border-red-300">
                      <Upload size={13} />
                      {isUploadingAttachment ? "Đang tải..." : "Tải tệp lên"}
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        disabled={isUploadingAttachment}
                        onChange={(event) => void handleUploadAttachments(event)}
                      />
                    </label>
                    <span className="text-xs text-gray-500">
                      Chọn một hoặc nhiều tệp, hệ thống sẽ tự lấy URL.
                    </span>
                  </div>

                  {form.attachmentUrls.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {form.attachmentUrls.map((url) => (
                        <div
                          key={url}
                          className="flex items-center justify-between gap-2 rounded-lg border border-red-100 bg-white px-2 py-1.5"
                        >
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="truncate text-xs text-blue-600 hover:underline"
                            title={url}
                          >
                            {url}
                          </a>
                          <button
                            type="button"
                            onClick={() => removeAttachment(url)}
                            className="inline-flex items-center gap-1 rounded border border-rose-200 px-2 py-1 text-[11px] font-semibold text-rose-600"
                          >
                            <Trash2 size={11} /> Xóa
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-red-100 bg-red-50/40 p-4">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void onSubmit()}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
              >
                <Save size={14} /> {isSubmitting ? "Đang lưu..." : "Lưu đánh giá"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isApproveModalOpen}
        onClose={() => {
          if (isApprovingAssessment) return;
          setIsApproveModalOpen(false);
          setAssessmentPendingApprove(null);
        }}
        onConfirm={() => {
          void confirmApprove();
        }}
        title="Xác nhận duyệt đánh giá"
        message={`Bạn có chắc chắn muốn duyệt bản ghi của ${assessmentPendingApprove?.studentName || "học sinh này"}?`}
        confirmText="Duyệt"
        cancelText="Hủy"
        variant="info"
        isLoading={isApprovingAssessment}
      />

      <ConfirmModal
        isOpen={isBulkApproveModalOpen}
        onClose={() => {
          if (isBulkApprovingAssessments) return;
          setIsBulkApproveModalOpen(false);
        }}
        onConfirm={() => {
          void confirmBulkApprove();
        }}
        title="Xác nhận duyệt hàng loạt"
        message={`Bạn có chắc chắn muốn duyệt ${selectedIds.length} bản ghi đã chọn?`}
        confirmText="Duyệt tất cả"
        cancelText="Hủy"
        variant="info"
        isLoading={isBulkApprovingAssessments}
      />
    </div>
  );
}
