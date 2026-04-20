"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Edit3,
  Eye,
  FileImage,
  Plus,
  Megaphone,
  ShieldQuestion,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/lightswind/select";
import { buildFileUrl } from "@/constants/apiURL";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useToast } from "@/hooks/use-toast";
import { getAllClasses } from "@/lib/api/classService";
import {
  approveMediaRecord,
  createMediaRecord,
  deleteMediaRecord,
  deleteStorageFile,
  getMediaList,
  publishMediaRecord,
  rejectMediaRecord,
  resubmitMediaRecord,
  updateMediaRecord,
  uploadMediaFile,
} from "@/lib/api/mediaService";
import { normalizeRole } from "@/lib/role";
import { getTeacherClasses, getTeacherClassStudents } from "@/lib/api/teacherService";
import {
  ApprovalStatus,
  MediaContentType,
  MediaOwnershipScope,
  MediaType,
  Visibility,
  type CreateMediaRequest,
  type UpdateMediaRequest,
} from "@/types/media";

type WorkspaceMode = "management" | "teacher";

type SelectOption = {
  id: string;
  label: string;
};

type MediaRow = {
  id: string;
  caption: string;
  type: MediaType;
  contentType: MediaContentType;
  visibility: Visibility;
  approvalStatus: ApprovalStatus;
  isPublished: boolean;
  url: string;
  previewUrl?: string;
  branchId?: string;
  classId?: string;
  className?: string;
  studentProfileId?: string;
  studentName?: string;
  monthTag?: string;
  uploaderName?: string;
  uploaderId?: string;
  createdAt?: string;
  rejectReason?: string;
};

type ModerationAction = "approve" | "reject" | "publish";

const NHAN_MEDIA_TYPE: Record<MediaType, string> = {
  [MediaType.Photo]: "Ảnh",
  [MediaType.Video]: "Video",
  [MediaType.Document]: "Tài liệu",
};

const NHAN_CONTENT_TYPE: Record<MediaContentType, string> = {
  [MediaContentType.Homework]: "Bài tập",
  [MediaContentType.Report]: "Báo cáo",
  [MediaContentType.Test]: "Bài kiểm tra",
  [MediaContentType.Album]: "Bộ sưu tập",
  [MediaContentType.ClassPhoto]: "Ảnh lớp học",
};

const NHAN_VISIBILITY: Record<Visibility, string> = {
  [Visibility.ClassOnly]: "Chỉ lớp học",
  [Visibility.Personal]: "Cá nhân",
  [Visibility.PublicParent]: "Phụ huynh có thể xem",
};

const NHAN_STATUS: Record<ApprovalStatus, string> = {
  [ApprovalStatus.Pending]: "Chờ duyệt",
  [ApprovalStatus.Approved]: "Đã duyệt",
  [ApprovalStatus.Rejected]: "Đã từ chối",
};

type LightSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

const THANG_OPTIONS: LightSelectOption[] = Array.from({ length: 12 }, (_, index) => {
  const month = String(index + 1).padStart(2, "0");
  return {
    value: month,
    label: `Tháng ${month}`,
  };
});

const NAM_HIEN_TAI = new Date().getFullYear();
const NAM_OPTIONS: LightSelectOption[] = Array.from({ length: 5 }, (_, index) => {
  const year = String(NAM_HIEN_TAI - 1 + index);
  return {
    value: year,
    label: `Năm ${year}`,
  };
});

const THANG_MAC_DINH = `${NAM_HIEN_TAI}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

const GIA_TRI_TRONG = "__empty__";

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

function LightSelect({
  value,
  options,
  placeholder,
  onValueChange,
  disabled,
  emptyLabel,
  triggerClassName,
}: {
  value: string;
  options: LightSelectOption[];
  placeholder: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  emptyLabel?: string;
  triggerClassName?: string;
}) {
  const hasEmptyOption = Boolean(emptyLabel);
  const normalizedValue = value || (hasEmptyOption ? GIA_TRI_TRONG : "");

  return (
    <Select
      value={normalizedValue}
      onValueChange={(nextValue) => {
        if (hasEmptyOption && nextValue === GIA_TRI_TRONG) {
          onValueChange("");
          return;
        }
        onValueChange(nextValue);
      }}
      disabled={disabled}
      searchPlaceholder="Gõ để tìm..."
      emptyText="Không có dữ liệu phù hợp"
    >
      <SelectTrigger
        disabled={disabled}
        className={cn(
          "h-10 w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-left text-sm focus:ring-red-200",
          disabled && "cursor-not-allowed bg-red-50 text-gray-400",
          triggerClassName
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="z-120 border border-red-100 bg-white shadow-xl">
        {hasEmptyOption && <SelectItem value={GIA_TRI_TRONG}>{emptyLabel}</SelectItem>}
        {options.map((option) => (
          <SelectItem
            key={`${option.value}-${option.label}`}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function extractItems(payload: any): any[] {
  const candidates = [
    payload?.data?.media?.items,
    payload?.data?.data?.media?.items,
    payload?.data?.items,
    payload?.data?.data?.items,
    payload?.media?.items,
    payload?.items,
    payload?.data?.data,
    payload?.data,
    payload,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
}

function extractNestedItems(payload: any, key: string): any[] {
  const raw = payload?.data?.data?.[key]?.items ?? payload?.data?.[key]?.items ?? payload?.data?.[key] ?? payload?.[key]?.items;
  if (Array.isArray(raw)) return raw;
  return extractItems(payload);
}

function normalizeStatus(value: unknown, isPublished: boolean): ApprovalStatus {
  if (typeof value === "number") {
    if (value === 1) return ApprovalStatus.Approved;
    if (value === 2) return ApprovalStatus.Rejected;
    return ApprovalStatus.Pending;
  }

  const status = String(value ?? "").toLowerCase();
  if (status === "approved" || status === "approve") return ApprovalStatus.Approved;
  if (status === "rejected" || status === "reject") return ApprovalStatus.Rejected;
  if (status === "published" || isPublished) return ApprovalStatus.Approved;
  return ApprovalStatus.Pending;
}

function normalizeType(value: unknown): MediaType {
  if (typeof value === "number") {
    if (value === 1) return MediaType.Video;
    if (value === 2) return MediaType.Document;
    return MediaType.Photo;
  }

  const raw = String(value ?? "").toLowerCase();
  if (raw === "video") return MediaType.Video;
  if (raw === "document") return MediaType.Document;
  return MediaType.Photo;
}

function normalizeContentType(value: unknown): MediaContentType {
  if (typeof value === "number") {
    const byIndex: MediaContentType[] = [
      MediaContentType.Homework,
      MediaContentType.Report,
      MediaContentType.Test,
      MediaContentType.Album,
      MediaContentType.ClassPhoto,
    ];

    return byIndex[value] ?? MediaContentType.Album;
  }

  const raw = String(value ?? "");
  const values = Object.values(MediaContentType);
  return values.find((option) => option === raw) ?? MediaContentType.Album;
}

function normalizeVisibility(value: unknown): Visibility {
  if (typeof value === "number") {
    if (value === 1) return Visibility.Personal;
    if (value === 2) return Visibility.PublicParent;
    return Visibility.ClassOnly;
  }

  const raw = String(value ?? "");
  const values = Object.values(Visibility);
  return values.find((option) => option === raw) ?? Visibility.ClassOnly;
}

function normalizeMediaUrl(value: unknown) {
  const url = String(value ?? "").trim();
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/api/files/serve")) return url;
  return buildFileUrl(url);
}

function isVideoAssetUrl(url?: string) {
  if (!url) return false;
  return /\.(mp4|mov|webm|avi|m4v|mkv)(\?|$)/i.test(url);
}

function normalizeRows(payload: any): MediaRow[] {
  return extractItems(payload).map((item: any) => ({
    id: String(item.id ?? ""),
    caption: String(item.caption ?? item.title ?? ""),
    type: normalizeType(item.type ?? item.mediaType),
    contentType: normalizeContentType(item.contentType),
    visibility: normalizeVisibility(item.visibility),
    approvalStatus: normalizeStatus(item.approvalStatus ?? item.status, Boolean(item.isPublished)),
    isPublished: Boolean(item.isPublished),
    url: normalizeMediaUrl(item.url ?? item.fileUrl ?? item.mediaUrl),
    previewUrl: normalizeMediaUrl(item.coverUrl ?? item.thumbnail ?? item.thumbUrl ?? item.posterUrl),
    branchId: item.branchId,
    classId: item.classId,
    className: item.className ?? item.classTitle ?? item.class?.name,
    studentProfileId: item.studentProfileId,
    studentName: item.studentName,
    monthTag: item.monthTag,
    uploaderName: item.uploaderName ?? item.uploader,
    uploaderId: item.uploaderId,
    createdAt: item.createdAt,
    rejectReason:
      (typeof item.rejectReason === "string" ? item.rejectReason : undefined) ??
      (typeof item.rejectionReason === "string" ? item.rejectionReason : undefined) ??
      (typeof item.reason === "string" ? item.reason : undefined),
  }));
}

function parseMonthTag(monthTag?: string) {
  const fallback = {
    year: String(NAM_HIEN_TAI),
    month: String(new Date().getMonth() + 1).padStart(2, "0"),
  };

  if (!monthTag) return fallback;

  const matched = monthTag.match(/^(\d{4})-(\d{2})$/);
  if (!matched) return fallback;

  return {
    year: matched[1],
    month: matched[2],
  };
}

function buildMonthTag(year: string, month: string) {
  if (!year || !month) return "";
  return `${year}-${month}`;
}

const MA_MAC_DINH = "";

export default function MediaWorkspaceCore({ mode }: { mode: WorkspaceMode }) {
  const { user } = useCurrentUser();
  const { toast } = useToast();

  const role = normalizeRole(user?.role);
  const isManagementRole = role === "Admin" || role === "Staff_Manager";
  const canModerate = mode === "management" && isManagementRole;
  const canDeleteStorage = false;

  const [rows, setRows] = useState<MediaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshSeed, setRefreshSeed] = useState(0);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | ApprovalStatus>(
    mode === "management" ? ApprovalStatus.Pending : "ALL"
  );

  const [classOptions, setClassOptions] = useState<SelectOption[]>([]);
  const [studentOptions, setStudentOptions] = useState<SelectOption[]>([]);

  const [uploading, setUploading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    branchId: "",
    classId: "",
    studentProfileId: "",
    monthTag: THANG_MAC_DINH,
    type: MediaType.Photo,
    contentType: MediaContentType.Album,
    ownershipScope: MediaOwnershipScope.Class,
    visibility: Visibility.ClassOnly,
    caption: "",
  });
  const [createFile, setCreateFile] = useState<File | null>(null);

  const [editing, setEditing] = useState<MediaRow | null>(null);
  const [updateForm, setUpdateForm] = useState<UpdateMediaRequest>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [editStudentOptions, setEditStudentOptions] = useState<SelectOption[]>([]);

  const [deleteTarget, setDeleteTarget] = useState<MediaRow | null>(null);
  const [deletingRecord, setDeletingRecord] = useState(false);

  const [deleteStorageTarget, setDeleteStorageTarget] = useState<MediaRow | null>(null);
  const [deletingStorage, setDeletingStorage] = useState(false);

  const [previewTarget, setPreviewTarget] = useState<MediaRow | null>(null);
  const [moderationTarget, setModerationTarget] = useState<MediaRow | null>(null);
  const [moderationAction, setModerationAction] = useState<ModerationAction>("approve");
  const [moderationReason, setModerationReason] = useState("");
  const [moderating, setModerating] = useState(false);
  const [resubmittingId, setResubmittingId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    getMediaList()
      .then((res) => {
        if (!alive) return;
        setRows(normalizeRows(res));
      })
      .catch((error: any) => {
        if (!alive) return;
        toast.destructive({
          title: "Không thể tải danh sách tư liệu",
          description: error?.message || "Vui lòng thử lại sau.",
        });
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [refreshSeed, toast]);

  useEffect(() => {
    let alive = true;

    const loadTeacherClasses = async () => {
      if (mode !== "teacher") return;
      try {
        const res = await getTeacherClasses({ pageNumber: 1, pageSize: 200 });
        const raw = res?.data?.classes?.items ?? extractNestedItems(res, "classes");
        if (!alive) return;

        const options = (Array.isArray(raw) ? raw : [])
          .map((item: any) => {
            const id = String(item.id ?? item.classId ?? "");
            const title = String(item.name ?? item.title ?? item.classTitle ?? "Lớp học");
            const code = String(item.code ?? item.classCode ?? "");
            return {
              id,
              label: code ? `${title} (${code})` : title,
            };
          })
          .filter((item: SelectOption) => item.id);

        setClassOptions(options);
      } catch (error: any) {
        if (!alive) return;
        setClassOptions([]);
        toast.warning({
          title: "Không thể tải danh sách lớp",
          description: error?.message || "Vui lòng thử lại.",
        });
      }
    };

    loadTeacherClasses();

    return () => {
      alive = false;
    };
  }, [mode, toast]);

  useEffect(() => {
    if (mode !== "management") return;
    if (!createForm.branchId) {
      setClassOptions([]);
      return;
    }

    let alive = true;
    getAllClasses({ pageNumber: 1, pageSize: 200, branchId: createForm.branchId })
      .then((res: any) => {
        if (!alive) return;
        const raw = extractNestedItems(res, "classes");
        const options = (Array.isArray(raw) ? raw : [])
          .map((item: any) => {
            const id = String(item.id ?? item.classId ?? "");
            const title = String(item.title ?? item.classTitle ?? item.name ?? "Lớp học");
            const code = String(item.code ?? item.classCode ?? "");
            return { id, label: code ? `${title} (${code})` : title };
          })
          .filter((item: SelectOption) => item.id);

        setClassOptions(options);
      })
      .catch(() => {
        if (!alive) return;
        setClassOptions([]);
      });

    return () => {
      alive = false;
    };
  }, [mode, createForm.branchId]);

  useEffect(() => {
    if (!createForm.classId) {
      setStudentOptions([]);
      setCreateForm((prev) => ({ ...prev, studentProfileId: MA_MAC_DINH }));
      return;
    }

    if (mode !== "teacher") {
      setStudentOptions([]);
      return;
    }

    let alive = true;
    getTeacherClassStudents(createForm.classId, { pageNumber: 1, pageSize: 200 })
      .then((res: any) => {
        if (!alive) return;
        const raw = extractNestedItems(res, "students");

        const options = (Array.isArray(raw) ? raw : [])
          .map((item: any) => {
            const id = String(item.studentProfileId ?? item.id ?? "");
            const name = String(item.fullName ?? item.studentName ?? item.name ?? "Học viên");
            return { id, label: name };
          })
          .filter((item: SelectOption) => item.id);

        setStudentOptions(options);
      })
      .catch(() => {
        if (!alive) return;
        setStudentOptions([]);
      });

    return () => {
      alive = false;
    };
  }, [mode, createForm.classId]);

  useEffect(() => {
    const classId = updateForm.classId ?? editing?.classId;
    if (!editing || !classId || mode !== "teacher") {
      setEditStudentOptions([]);
      return;
    }

    let alive = true;
    getTeacherClassStudents(classId, { pageNumber: 1, pageSize: 200 })
      .then((res: any) => {
        if (!alive) return;
        const raw = extractNestedItems(res, "students");
        const options = (Array.isArray(raw) ? raw : [])
          .map((item: any) => {
            const id = String(item.studentProfileId ?? item.id ?? "");
            const name = String(item.fullName ?? item.studentName ?? item.name ?? "Học viên");
            return { id, label: name };
          })
          .filter((item: SelectOption) => item.id);

        setEditStudentOptions(options);
      })
      .catch(() => {
        if (!alive) return;
        setEditStudentOptions([]);
      });

    return () => {
      alive = false;
    };
  }, [editing, mode, updateForm.classId]);

  useEffect(() => {
    if (!createForm.branchId && user?.branchId) {
      setCreateForm((prev) => ({ ...prev, branchId: user.branchId ?? "" }));
    }
  }, [createForm.branchId, user?.branchId]);

  useEffect(() => {
    setStatusFilter(mode === "management" ? ApprovalStatus.Pending : "ALL");
  }, [mode]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchStatus = statusFilter === "ALL" || row.approvalStatus === statusFilter;
      const matchQuery =
        !query ||
        row.caption.toLowerCase().includes(query) ||
        (row.studentName ?? "").toLowerCase().includes(query) ||
        (row.uploaderName ?? "").toLowerCase().includes(query);
      return matchStatus && matchQuery;
    });
  }, [rows, search, statusFilter]);

  const canEditRow = (row: MediaRow) => {
    if (canModerate) return false;
    if (mode === "teacher") {
      if (row.approvalStatus !== ApprovalStatus.Pending && row.approvalStatus !== ApprovalStatus.Rejected) {
        return false;
      }
      if (!row.uploaderId || !user?.id) return false;
      return row.uploaderId === user.id;
    }
    if (!row.uploaderId || !user?.id) return false;
    return row.uploaderId === user.id;
  };

  const getStatusClassName = (status: ApprovalStatus) => {
    if (status === ApprovalStatus.Approved) {
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    }

    if (status === ApprovalStatus.Rejected) {
      return "bg-rose-50 text-rose-700 border border-rose-200";
    }

    return "bg-amber-50 text-amber-700 border border-amber-200";
  };

  const getVisibilityClassName = (visibility: Visibility) => {
    if (visibility === Visibility.PublicParent) {
      return "bg-blue-50 text-blue-700 border border-blue-200";
    }
    if (visibility === Visibility.Personal) {
      return "bg-violet-50 text-violet-700 border border-violet-200";
    }
    return "bg-slate-50 text-slate-700 border border-slate-200";
  };

  const stats = useMemo(() => {
    const pending = rows.filter((row) => row.approvalStatus === ApprovalStatus.Pending).length;
    const approved = rows.filter((row) => row.approvalStatus === ApprovalStatus.Approved).length;
    const rejected = rows.filter((row) => row.approvalStatus === ApprovalStatus.Rejected).length;
    const published = rows.filter((row) => row.isPublished).length;

    return {
      total: rows.length,
      pending,
      approved,
      rejected,
      published,
    };
  }, [rows]);

  const classOptionsForEdit = useMemo(() => {
    const options = classOptions.map((option) => ({ value: option.id, label: option.label }));
    const selectedClassId = updateForm.classId ?? "";
    if (selectedClassId && !options.some((option) => option.value === selectedClassId)) {
      options.push({ value: selectedClassId, label: selectedClassId });
    }
    return options;
  }, [classOptions, updateForm.classId]);

  const studentOptionsForEdit = useMemo(() => {
    const options = editStudentOptions.map((option) => ({ value: option.id, label: option.label }));
    const selectedStudentId = updateForm.studentProfileId ?? "";
    if (selectedStudentId && !options.some((option) => option.value === selectedStudentId)) {
      options.push({ value: selectedStudentId, label: selectedStudentId });
    }
    return options;
  }, [editStudentOptions, updateForm.studentProfileId]);

  const statusOptions: LightSelectOption[] = [
    { value: "ALL", label: "Tất cả trạng thái" },
    ...Object.values(ApprovalStatus).map((status) => ({
      value: status,
      label: NHAN_STATUS[status],
    })),
  ];

  const selectedCreateTime = useMemo(() => parseMonthTag(createForm.monthTag), [createForm.monthTag]);
  const selectedEditTime = useMemo(() => parseMonthTag(updateForm.monthTag), [updateForm.monthTag]);

  const resetCreateForm = () => {
    setCreateForm({
      branchId: user?.branchId ?? "",
      classId: "",
      studentProfileId: "",
      monthTag: THANG_MAC_DINH,
      type: MediaType.Photo,
      contentType: MediaContentType.Album,
      ownershipScope: MediaOwnershipScope.Class,
      visibility: Visibility.ClassOnly,
      caption: "",
    });
    setCreateFile(null);
    setStudentOptions([]);
  };

  const handleCreateRecord = async () => {
    if (!createFile) {
      toast.warning({ title: "Bạn chưa chọn tệp để tải lên" });
      return;
    }

    if (!createForm.branchId.trim()) {
      toast.warning({ title: "Bạn cần chọn chi nhánh" });
      return;
    }

    const selectedScope = createForm.ownershipScope;
    if (selectedScope === MediaOwnershipScope.Class && !createForm.classId.trim()) {
      toast.warning({ title: "Phạm vi Lớp học yêu cầu chọn lớp học" });
      return;
    }

    if (selectedScope === MediaOwnershipScope.Personal && !createForm.studentProfileId.trim()) {
      toast.warning({ title: "Phạm vi Cá nhân yêu cầu chọn học viên" });
      return;
    }

    setUploading(true);
    try {
      const uploadResult = await uploadMediaFile(createFile, {
        folder: "media",
        resourceType: createForm.type === MediaType.Video ? "video" : "auto",
      });

      const filePayload = uploadResult?.data?.data ?? uploadResult?.data ?? uploadResult;
      const payload: CreateMediaRequest = {
        branchId: createForm.branchId.trim(),
        classId: createForm.classId.trim() || undefined,
        studentProfileId: createForm.studentProfileId.trim() || undefined,
        monthTag: createForm.monthTag.trim() || undefined,
        type: createForm.type,
        contentType: createForm.contentType,
        url: String(filePayload?.url ?? ""),
        fileSize: Number(filePayload?.size ?? createFile.size ?? 0),
        ownershipScope: createForm.ownershipScope,
        visibility: createForm.visibility,
        caption: createForm.caption.trim() || undefined,
        mimeType: createFile.type || undefined,
        originalFileName: createFile.name,
      };

      if (!payload.url) {
        throw new Error("Không nhận được đường dẫn tệp sau khi tải lên");
      }

      await createMediaRecord(payload);

      toast.success({
        title: "Tạo tư liệu thành công",
        description: "Tệp đã được tải lên và tạo bản ghi tư liệu.",
      });
      resetCreateForm();
      setShowCreateModal(false);
      setRefreshSeed((seed) => seed + 1);
    } catch (error: any) {
      toast.destructive({
        title: "Tạo tư liệu thất bại",
        description: error?.message || "Vui lòng thử lại.",
      });
    } finally {
      setUploading(false);
    }
  };

  const openEdit = (row: MediaRow) => {
    setEditing(row);
    setEditStudentOptions([]);
    setUpdateForm({
      classId: row.classId,
      studentProfileId: row.studentProfileId,
      monthTag: row.monthTag,
      contentType: row.contentType,
      caption: row.caption,
      visibility: row.visibility,
    });
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    setSavingEdit(true);
    try {
      await updateMediaRecord(editing.id, updateForm);
      toast.success({ title: "Cập nhật tư liệu thành công" });
      setEditing(null);
      setRefreshSeed((seed) => seed + 1);
    } catch (error: any) {
      toast.destructive({
        title: "Cập nhật tư liệu thất bại",
        description: error?.message || "Vui lòng thử lại.",
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteRecord = async () => {
    if (!deleteTarget) return;
    setDeletingRecord(true);
    try {
      await deleteMediaRecord(deleteTarget.id);
      toast.success({ title: "Đã xóa bản ghi tư liệu" });
      setDeleteTarget(null);
      setRefreshSeed((seed) => seed + 1);
    } catch (error: any) {
      toast.destructive({
        title: "Xóa media thất bại",
        description: error?.message || "Vui lòng thử lại.",
      });
    } finally {
      setDeletingRecord(false);
    }
  };

  const handleDeleteStorage = async () => {
    if (!deleteStorageTarget) return;
    setDeletingStorage(true);
    try {
      await deleteStorageFile(deleteStorageTarget.url);
      toast.success({ title: "Đã xóa tệp khỏi kho lưu trữ" });
      setDeleteStorageTarget(null);
    } catch (error: any) {
      toast.destructive({
        title: "Xóa tệp thất bại",
        description: error?.message || "Vui lòng thử lại.",
      });
    } finally {
      setDeletingStorage(false);
    }
  };

  const runModeration = async (
    id: string,
    action: "approve" | "reject" | "publish",
    reason?: string
  ) => {
    try {
      if (action === "approve") await approveMediaRecord(id);
      if (action === "reject") await rejectMediaRecord(id, { reason: String(reason ?? "").trim() });
      if (action === "publish") await publishMediaRecord(id);

      const actionLabel = action === "approve" ? "duyệt" : action === "reject" ? "từ chối" : "công khai";
      toast.success({ title: `Đã ${actionLabel} tư liệu` });
      setRefreshSeed((seed) => seed + 1);
    } catch (error: any) {
      toast.destructive({
        title: "Thao tác kiểm duyệt thất bại",
        description: error?.message || "Vui lòng thử lại.",
      });
    }
  };

  const openModerationModal = (row: MediaRow, action: ModerationAction) => {
    setModerationTarget(row);
    setModerationAction(action);
    setModerationReason("");
  };

  const handleConfirmModeration = async () => {
    if (!moderationTarget) return;
    const trimmedReason = moderationReason.trim();
    if (moderationAction === "reject" && !trimmedReason) {
      toast.warning({ title: "Vui lòng nhập lý do từ chối" });
      return;
    }

    setModerating(true);
    try {
      await runModeration(moderationTarget.id, moderationAction, trimmedReason);
      setModerationTarget(null);
      setModerationReason("");
    } finally {
      setModerating(false);
    }
  };

  const handleResubmit = async (row: MediaRow) => {
    setResubmittingId(row.id);
    try {
      await resubmitMediaRecord(row.id);
      toast.success({
        title: "Đã nộp lại tư liệu",
        description: "Tư liệu đã được chuyển lại trạng thái chờ duyệt.",
      });
      setRefreshSeed((seed) => seed + 1);
    } catch (error: any) {
      toast.destructive({
        title: "Nộp lại tư liệu thất bại",
        description: error?.message || "Vui lòng thử lại.",
      });
    } finally {
      setResubmittingId(null);
    }
  };

  const title = mode === "management" ? "Kiểm duyệt tư liệu lớp học" : "Tư liệu giáo viên";
  const subtitle =
    mode === "management"
      ? "Quản lý/Admin rà soát media chờ duyệt, thực hiện Duyệt -> Công khai hoặc Từ chối theo quy trình chuẩn."
      : "Giáo viên tải ảnh/video hoạt động lớp. Bản ghi mới luôn ở trạng thái Chờ duyệt và chưa công khai.";

  return (
    <div className="min-h-screen space-y-6 bg-linear-to-b from-red-50/30 to-white p-6">
      {mode === "teacher" && (
        <section className="rounded-2xl border border-red-200 bg-white p-4 md:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-base font-semibold text-gray-900">
              <Sparkles size={17} className="text-red-600" />
              Tạo tư liệu mới
            </div>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-semibold text-white"
            >
              <Plus size={14} />
              Tạo mới
            </button>
          </div>
        </section>
      )}

      {mode === "management" && (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-xl border border-red-200 bg-white p-4">
            <div className="text-xs text-gray-500">Tổng tư liệu</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="rounded-xl border border-amber-200 bg-white p-4">
            <div className="text-xs text-amber-700">Chờ duyệt</div>
            <div className="mt-1 text-2xl font-bold text-amber-700">{stats.pending}</div>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-white p-4">
            <div className="text-xs text-emerald-700">Đã duyệt</div>
            <div className="mt-1 text-2xl font-bold text-emerald-700">{stats.approved}</div>
          </div>
          <div className="rounded-xl border border-blue-200 bg-white p-4">
            <div className="text-xs text-blue-700">Đã công khai</div>
            <div className="mt-1 text-2xl font-bold text-blue-700">{stats.published}</div>
          </div>
          <div className="rounded-xl border border-rose-200 bg-white p-4">
            <div className="text-xs text-rose-700">Đã từ chối</div>
            <div className="mt-1 text-2xl font-bold text-rose-700">{stats.rejected}</div>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-red-200 bg-white p-5">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tên tư liệu, học viên, người tải"
            className="h-10 min-w-65 rounded-xl border border-red-200 px-3 text-sm"
          />
          <div className="w-56">
            <LightSelect
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as "ALL" | ApprovalStatus)}
              options={statusOptions}
              placeholder="Lọc trạng thái"
            />
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-225">
            <thead>
              <tr className="border-b border-red-100 text-left text-xs uppercase text-gray-500">
                <th className="px-3 py-2">Tư liệu</th>
                <th className="px-3 py-2">Học viên</th>
                <th className="px-3 py-2">Người tải lên</th>
                <th className="px-3 py-2">Trạng thái</th>
                <th className="px-3 py-2">Hiển thị</th>
                <th className="px-3 py-2">Loại tệp</th>
                <th className="px-3 py-2">Ngày tạo</th>
                <th className="px-3 py-2">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-3 py-8 text-sm text-gray-500" colSpan={8}>
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td className="px-3 py-8 text-sm text-gray-500" colSpan={8}>
                    Không có tư liệu phù hợp.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const thumb = row.previewUrl || row.url;
                  const showVideoPreview = row.type === MediaType.Video && isVideoAssetUrl(thumb);
                  const visibilityLabel =
                    row.visibility === Visibility.ClassOnly && row.className
                      ? `Chỉ lớp học (${row.className})`
                      : NHAN_VISIBILITY[row.visibility];
                  return (
                    <tr key={row.id} className="border-b border-red-50 text-sm text-gray-700">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 overflow-hidden rounded-lg border border-red-100 bg-red-50">
                            {thumb ? (
                              showVideoPreview ? (
                                <video src={thumb} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                              ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={thumb} alt={row.caption || row.id} className="h-full w-full object-cover" />
                              )
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                {row.type === MediaType.Video ? (
                                  <Video size={16} className="text-red-500" />
                                ) : (
                                  <FileImage size={16} className="text-red-500" />
                                )}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{row.caption || "(Chưa có chú thích)"}</div>
                            {mode === "teacher" && row.approvalStatus === ApprovalStatus.Rejected && row.rejectReason && (
                              <div className="mt-1 inline-flex max-w-136 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700">
                                Lý do từ chối: {row.rejectReason}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">{row.studentName || "-"}</td>
                      <td className="px-3 py-3">{row.uploaderName || "-"}</td>
                      <td className="px-3 py-3">
                        <span className={cn("rounded-full px-2 py-1 text-xs font-medium", getStatusClassName(row.approvalStatus))}>
                          {NHAN_STATUS[row.approvalStatus]}
                          {row.isPublished ? " • Đã công khai" : ""}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={cn("rounded-full px-2 py-1 text-xs font-medium", getVisibilityClassName(row.visibility))}>
                          {visibilityLabel}
                        </span>
                      </td>
                      <td className="px-3 py-3">{NHAN_MEDIA_TYPE[row.type]}</td>
                      <td className="px-3 py-3">{row.createdAt ? new Date(row.createdAt).toLocaleDateString("vi-VN") : "-"}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewTarget(row)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-red-200 text-slate-700"
                            title="Xem"
                          >
                            <Eye size={13} />
                          </button>

                          {canEditRow(row) && (
                            <button
                              type="button"
                              onClick={() => openEdit(row)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-blue-200 text-blue-700"
                              title="Cập nhật"
                            >
                              <Edit3 size={13} />
                            </button>
                          )}

                          {canEditRow(row) && (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(row)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-rose-200 text-rose-700"
                              title="Xóa bản ghi"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}

                          {canModerate && row.approvalStatus === ApprovalStatus.Pending && (
                            <button
                              type="button"
                              onClick={() => openModerationModal(row, "approve")}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-200 text-emerald-700"
                              title="Duyệt"
                            >
                              <CheckCircle2 size={13} />
                            </button>
                          )}

                          {canModerate && row.approvalStatus === ApprovalStatus.Pending && (
                            <button
                              type="button"
                              onClick={() => openModerationModal(row, "reject")}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-rose-200 text-rose-700"
                              title="Từ chối"
                            >
                              <ShieldQuestion size={13} />
                            </button>
                          )}

                          {canModerate && row.approvalStatus === ApprovalStatus.Approved && !row.isPublished && (
                            <button
                              type="button"
                              onClick={() => openModerationModal(row, "publish")}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-blue-200 text-blue-700"
                              title="Công khai"
                            >
                              <ShieldCheck size={13} />
                            </button>
                          )}

                          {canDeleteStorage && (
                            <button
                              type="button"
                              onClick={() => setDeleteStorageTarget(row)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-rose-200 text-rose-700"
                              title="Xóa tệp"
                            >
                              <AlertCircle size={13} />
                            </button>
                          )}

                          {mode === "teacher" && canEditRow(row) && row.approvalStatus === ApprovalStatus.Rejected && (
                            <button
                              type="button"
                              onClick={() => handleResubmit(row)}
                              disabled={resubmittingId === row.id}
                              className="inline-flex h-7 items-center justify-center gap-1 rounded-lg border border-amber-200 px-2 text-[11px] font-semibold text-amber-700 disabled:opacity-60"
                              title="Nộp lại"
                            >
                              <Megaphone size={12} />
                              {resubmittingId === row.id ? "Đang gửi" : "Nộp lại"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {editing && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/30 p-4">
          <section className="max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-red-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Cập nhật tư liệu: {editing.caption || "Tư liệu chưa đặt tên"}</h3>
            <button className="text-sm text-gray-500" onClick={() => setEditing(null)}>
              Đóng
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <LightSelect
              value={updateForm.classId ?? ""}
              onValueChange={(value) =>
                setUpdateForm((prev) => ({ ...prev, classId: value, studentProfileId: "" }))
              }
              options={classOptionsForEdit}
              placeholder="Không chọn lớp học"
              emptyLabel="Không chọn lớp học"
            />
            <LightSelect
              value={updateForm.studentProfileId ?? ""}
              onValueChange={(value) => setUpdateForm((prev) => ({ ...prev, studentProfileId: value }))}
              options={studentOptionsForEdit}
              placeholder="Không chọn học viên cụ thể"
              emptyLabel="Không chọn học viên cụ thể"
              disabled={mode === "teacher" && (updateForm.classId ? editStudentOptions.length === 0 : true)}
            />
            <input
              className="rounded-xl border border-red-200 px-3 py-2 text-sm"
              placeholder="Tháng lưu trữ"
              value={updateForm.monthTag ?? ""}
              readOnly
            />
            <div className="grid grid-cols-2 gap-2">
              <LightSelect
                value={selectedEditTime.year}
                onValueChange={(year) =>
                  setUpdateForm((prev) => ({
                    ...prev,
                    monthTag: buildMonthTag(year, parseMonthTag(prev.monthTag).month),
                  }))
                }
                options={NAM_OPTIONS}
                placeholder="Năm"
              />
              <LightSelect
                value={selectedEditTime.month}
                onValueChange={(month) =>
                  setUpdateForm((prev) => ({
                    ...prev,
                    monthTag: buildMonthTag(parseMonthTag(prev.monthTag).year, month),
                  }))
                }
                options={THANG_OPTIONS}
                placeholder="Tháng"
              />
            </div>
            <LightSelect
              value={updateForm.contentType ?? MediaContentType.Album}
              onValueChange={(value) =>
                setUpdateForm((prev) => ({ ...prev, contentType: value as MediaContentType }))
              }
              options={Object.values(MediaContentType).map((option) => ({
                value: option,
                label: NHAN_CONTENT_TYPE[option],
              }))}
              placeholder="Chọn nhóm nội dung"
            />
            <LightSelect
              value={updateForm.visibility ?? Visibility.ClassOnly}
              onValueChange={(value) => setUpdateForm((prev) => ({ ...prev, visibility: value as Visibility }))}
              options={Object.values(Visibility).map((option) => ({
                value: option,
                label: NHAN_VISIBILITY[option],
              }))}
              placeholder="Chọn phạm vi hiển thị"
            />
            <input
              className="rounded-xl border border-red-200 px-3 py-2 text-sm md:col-span-2 lg:col-span-3"
              placeholder="Chú thích tư liệu"
              value={updateForm.caption ?? ""}
              onChange={(event) => setUpdateForm((prev) => ({ ...prev, caption: event.target.value }))}
            />
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={savingEdit}
              className="rounded-xl bg-linear-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {savingEdit ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-gray-700"
            >
              Hủy
            </button>
          </div>
          </section>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/30 p-4">
          <section className="max-h-[88vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-red-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Tạo tư liệu mới</h3>
              <button className="text-sm text-gray-500" onClick={() => setShowCreateModal(false)}>
                Đóng
              </button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <label className="space-y-1">
                <div className="text-xs font-medium text-gray-600">Lớp học</div>
                <LightSelect
                  value={createForm.classId}
                  onValueChange={(value) =>
                    setCreateForm((prev) => ({ ...prev, classId: value, studentProfileId: "" }))
                  }
                  options={classOptions.map((option) => ({ value: option.id, label: option.label }))}
                  placeholder="Chọn lớp học"
                />
              </label>

              <label className="space-y-1">
                <div className="text-xs font-medium text-gray-600">Học viên</div>
                <LightSelect
                  value={createForm.studentProfileId}
                  onValueChange={(value) => setCreateForm((prev) => ({ ...prev, studentProfileId: value }))}
                  options={studentOptions.map((option) => ({ value: option.id, label: option.label }))}
                  placeholder="Không chọn học viên cụ thể"
                  emptyLabel="Không chọn học viên cụ thể"
                  disabled={!createForm.classId || studentOptions.length === 0}
                />
              </label>

              <label className="space-y-1">
                <div className="text-xs font-medium text-gray-600">Thời gian lưu trữ</div>
                <div className="grid grid-cols-2 gap-2">
                  <LightSelect
                    value={selectedCreateTime.year}
                    onValueChange={(year) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        monthTag: buildMonthTag(year, parseMonthTag(prev.monthTag).month),
                      }))
                    }
                    options={NAM_OPTIONS}
                    placeholder="Năm"
                  />
                  <LightSelect
                    value={selectedCreateTime.month}
                    onValueChange={(month) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        monthTag: buildMonthTag(parseMonthTag(prev.monthTag).year, month),
                      }))
                    }
                    options={THANG_OPTIONS}
                    placeholder="Tháng"
                  />
                </div>
              </label>

              <label className="space-y-1">
                <div className="text-xs font-medium text-gray-600">Loại tệp</div>
                <LightSelect
                  value={createForm.type}
                  onValueChange={(value) => setCreateForm((prev) => ({ ...prev, type: value as MediaType }))}
                  options={Object.values(MediaType).map((option) => ({
                    value: option,
                    label: NHAN_MEDIA_TYPE[option],
                  }))}
                  placeholder="Chọn loại tệp"
                />
              </label>

              <label className="space-y-1">
                <div className="text-xs font-medium text-gray-600">Nhóm nội dung</div>
                <LightSelect
                  value={createForm.contentType}
                  onValueChange={(value) =>
                    setCreateForm((prev) => ({ ...prev, contentType: value as MediaContentType }))
                  }
                  options={Object.values(MediaContentType).map((option) => ({
                    value: option,
                    label: NHAN_CONTENT_TYPE[option],
                  }))}
                  placeholder="Chọn nhóm nội dung"
                />
              </label>

              <label className="space-y-1">
                <div className="text-xs font-medium text-gray-600">Phạm vi hiển thị</div>
                <LightSelect
                  value={createForm.visibility}
                  onValueChange={(value) => setCreateForm((prev) => ({ ...prev, visibility: value as Visibility }))}
                  options={Object.values(Visibility).map((option) => ({
                    value: option,
                    label: NHAN_VISIBILITY[option],
                  }))}
                  placeholder="Chọn phạm vi hiển thị"
                />
              </label>

              <label className="space-y-1">
                <div className="text-xs font-medium text-gray-600">Phạm vi sở hữu</div>
                <LightSelect
                  value={createForm.ownershipScope}
                  onValueChange={(value) =>
                    setCreateForm((prev) => ({ ...prev, ownershipScope: value as MediaOwnershipScope }))
                  }
                  options={[
                    { value: MediaOwnershipScope.Class, label: "Lớp học" },
                    { value: MediaOwnershipScope.Personal, label: "Cá nhân" },
                    { value: MediaOwnershipScope.Branch, label: "Chi nhánh" },
                  ]}
                  placeholder="Chọn phạm vi sở hữu"
                />
              </label>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
              <input
                className="h-10 rounded-xl border border-red-200 px-3 py-2 text-sm"
                placeholder="Chú thích tư liệu"
                value={createForm.caption}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, caption: event.target.value }))}
              />
              <input
                type="file"
                onChange={(event) => setCreateFile(event.target.files?.[0] ?? null)}
                className="h-10 rounded-xl border border-red-200 px-3 py-2 text-sm"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCreateRecord}
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                <Upload size={16} />
                {uploading ? "Đang tải lên..." : "Tải tệp và tạo tư liệu"}
              </button>
              <button
                type="button"
                onClick={resetCreateForm}
                disabled={uploading}
                className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-gray-700"
              >
                Đặt lại
              </button>
            </div>
          </section>
        </div>
      )}

      {previewTarget && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[80vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-800">{previewTarget.caption || "Xem tư liệu"}</h3>
              <button className="text-sm text-slate-500" onClick={() => setPreviewTarget(null)}>Đóng</button>
            </div>
            <div className="h-150 overflow-hidden bg-slate-50 p-4">
              {previewTarget.type === MediaType.Video ? (
                <video src={normalizeMediaUrl(previewTarget.url)} controls className="mx-auto max-h-[64vh] w-full rounded-lg" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                
                <img src={normalizeMediaUrl(previewTarget.url)} alt={previewTarget.caption || "preview"} className="mx-auto h-full rounded-lg object-contain" />
             
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteRecord}
        title="Xóa bản ghi tư liệu"
        message={`Bạn có chắc chắn muốn xóa bản ghi ${deleteTarget?.caption ?? ""}?`}
        confirmText="Xóa bản ghi"
        variant="danger"
        isLoading={deletingRecord}
      />

      <ConfirmModal
        isOpen={Boolean(deleteStorageTarget)}
        onClose={() => setDeleteStorageTarget(null)}
        onConfirm={handleDeleteStorage}
        title="Xóa tệp vật lý"
        message="Thao tác này sẽ xóa tệp khỏi kho lưu trữ. Bạn có muốn tiếp tục không?"
        confirmText="Xóa tệp"
        variant="warning"
        isLoading={deletingStorage}
      />

      <ConfirmModal
        isOpen={Boolean(moderationTarget) && moderationAction !== "reject"}
        onClose={() => {
          setModerationTarget(null);
          setModerationReason("");
        }}
        onConfirm={handleConfirmModeration}
        title={
          moderationAction === "approve"
            ? "Xác nhận duyệt tư liệu"
            : moderationAction === "publish"
              ? "Xác nhận công khai tư liệu"
              : "Xác nhận từ chối tư liệu"
        }
        message={
          moderationAction === "approve"
            ? "Bạn có chắc chắn muốn duyệt tư liệu này?"
            : moderationAction === "publish"
              ? "Bạn có chắc chắn muốn công khai tư liệu này tới phụ huynh/học viên?"
              : "Bạn có chắc chắn muốn từ chối tư liệu này?"
        }
        confirmText={
          moderationAction === "approve"
            ? "Duyệt"
            : moderationAction === "publish"
              ? "Công khai"
              : "Từ chối"
        }
        variant={moderationAction === "publish" ? "warning" : moderationAction === "approve" ? "warning" : "danger"}
        isLoading={moderating}
      />

      {Boolean(moderationTarget) && moderationAction === "reject" && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/30 p-4">
          <section className="w-full max-w-lg rounded-2xl border border-rose-200 bg-white p-5">
            <h3 className="text-base font-semibold text-gray-900">Từ chối tư liệu</h3>
            <p className="mt-1 text-sm text-gray-600">
              Nhập lý do từ chối để giáo viên có thể chỉnh sửa và nộp lại.
            </p>

            <textarea
              value={moderationReason}
              onChange={(event) => setModerationReason(event.target.value)}
              placeholder="Nhập lý do từ chối..."
              className="mt-3 h-28 w-full rounded-xl border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
            />

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setModerationTarget(null);
                  setModerationReason("");
                }}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmModeration}
                disabled={moderating || !moderationReason.trim()}
                className="rounded-xl bg-linear-to-r from-rose-600 to-rose-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {moderating ? "Đang gửi..." : "Xác nhận từ chối"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
