"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  BookOpen,
  GraduationCap,
  Users,
  DollarSign,
  Eye,
  Pencil,
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  FileText,
  Building2,
  Power,
  PowerOff
} from "lucide-react";
import {
  fetchAdminPrograms,
  createAdminProgram,
  fetchAdminProgramDetail,
  updateAdminProgram,
  toggleProgramStatus,
  normalizeIsActive,
  updateAdminProgramMonthlyLeaveLimit,
  extractProgramMonthlyLeaveLimit,
} from "@/app/api/admin/programs";
import type { CourseRow, CreateProgramRequest, ProgramDetail } from "@/types/admin/programs";
import { getAllBranches } from "@/lib/api/branchService";
import ConfirmModal from "@/components/ConfirmModal";
import { useToast } from "@/hooks/use-toast";
import { useBranchFilter } from "@/hooks/useBranchFilter";
import { usePageI18n } from "@/hooks/usePageI18n";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/lightswind/select";
import AdminBranchSelectField from "@/components/admin/common/AdminBranchSelectField";

/* -------------------------- helpers -------------------------- */
function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

function parseMonthlyLeaveLimitValue(value: string): number | null {
  const normalizedValue = value.trim();
  if (!normalizedValue) return null;

  const parsedValue = Number(normalizedValue);
  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
}

function buildProgramCode(name: string, fallback = "PROGRAM"): string {
  const normalizedName = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  const baseCode = normalizedName || fallback;
  return baseCode.slice(0, 10);
}

function getProgramTypeLabel(value: { isMakeup?: boolean | null; isSupplementary?: boolean | null }) {
  if (value.isMakeup) return "Bù";
  if (value.isSupplementary) return "Phụ trợ";
  return "Chính";
}

function getProgramTypeDetailLabel(value: { isMakeup?: boolean | null; isSupplementary?: boolean | null }) {
  if (value.isMakeup) return "Chương trình bù";
  if (value.isSupplementary) return "Chương trình phụ trợ";
  return "Chương trình chính";
}

function getProgramTypeBadgeClass(value: { isMakeup?: boolean | null; isSupplementary?: boolean | null }) {
  if (value.isMakeup) return "bg-blue-100 text-blue-700 border border-blue-200";
  if (value.isSupplementary) return "bg-violet-100 text-violet-700 border border-violet-200";
  return "bg-gray-100 text-gray-600 border border-gray-200";
}

function StatusBadge({ value }: { value: string }) {
  const map: Record<string, string> = {
    "Đang hoạt động": "bg-green-100 text-green-700 border border-green-200",
    "Tạm dừng": "bg-gray-100 text-gray-700 border border-gray-200",
  };
  return (
    <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", map[value])}>
      {value}
    </span>
  );
}

type SortField = "id" | "name" | "duration" | "fee" | "status" | "branch";
type SortDirection = "asc" | "desc" | null;
const PAGE_SIZE = 10;

/* --------------------------- API helpers --------------------------- */

function SortableHeader({
  field,
  currentField,
  direction,
  onSort,
  children,
  align = "left",
}: {
  field: SortField;
  currentField: SortField | null;
  direction: SortDirection;
  onSort: (f: SortField) => void;
  children: React.ReactNode;
  align?: "left" | "center" | "right";
}) {
  const isActive = currentField === field;
  const icon = isActive ? (
    direction === "asc" ? <ArrowUp size={14} className="text-red-600" /> : <ArrowDown size={14} className="text-red-600" />
  ) : (
    <ArrowUpDown size={14} className="text-gray-400" />
  );
  const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
  return (
    <th
      onClick={() => onSort(field)}
      className={`py-3 px-6 ${alignClass} text-sm font-semibold tracking-wide text-gray-700 whitespace-nowrap cursor-pointer select-none hover:bg-red-50 transition-colors`}
    >
      <span className="inline-flex items-center gap-2">{children}{icon}</span>
    </th>
  );
}

/* ----------------------------- CREATE / EDIT COURSE MODAL ------------------------------ */
interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CourseFormData) => Promise<boolean> | boolean;
  mode?: "create" | "edit";
  initialData?: CourseFormData | null;
  t: ReturnType<typeof usePageI18n>["messages"]["adminPages"]["courses"];
}

interface CourseFormData {
  code?: string;
  name: string;
  status: string;
  isMakeup: boolean;
  isSupplementary: boolean;
  branchId: string;
  maxLeavesPerMonth?: number | null;
}

const initialFormData: CourseFormData = {
  code: "",
  name: "",
  status: "Đang hoạt động",
  isMakeup: false,
  isSupplementary: false,
  branchId: "",
  maxLeavesPerMonth: null,
};

function CreateCourseModal({ isOpen, onClose, onSubmit, mode = "create", initialData, t }: CreateCourseModalProps) {
  const [formData, setFormData] = useState<CourseFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof CourseFormData, string>>>({});
  const [branchOptions, setBranchOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (submitting) return;

      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, submitting]);

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialData) {
        setFormData(initialData);
      } else {
        setFormData(initialFormData);
      }
      setErrors({});
      loadBranches();
    }
  }, [isOpen, mode, initialData]);

  const loadBranches = async () => {
    try {
      setLoadingBranches(true);
      const res = await getAllBranches({ page: 1, limit: 100 });
      const items = res?.data?.branches ?? res?.data ?? [];
      setBranchOptions(
        items.map((b: any) => ({
          id: String(b?.id ?? ""),
          name: String(b?.name ?? b?.code ?? "Chi nhánh"),
        })).filter((b: { id: string }) => b.id)
      );
    } catch (err) {
      console.error("Failed to load branches:", err);
    } finally {
      setLoadingBranches(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CourseFormData, string>> = {};

    if (!formData.name.trim()) newErrors.name = t.validation.nameRequired;
    if (!formData.branchId) newErrors.branchId = t.validation.selectBranch;
    if (formData.isMakeup && formData.isSupplementary) {
      newErrors.isSupplementary = t.validation.cannotBothTypes;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const isSuccess = await onSubmit(formData);
      if (isSuccess !== false) {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: keyof CourseFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    if ((field === "isMakeup" || field === "isSupplementary") && errors.isSupplementary) {
      setErrors(prev => ({ ...prev, isSupplementary: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="relative w-full max-w-5xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <BookOpen size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {mode === "edit" ? t.modal.updateTitle : t.modal.createTitle}
                </h2>
                <p className="text-sm text-red-100">
                  {mode === "edit" ? t.modal.updateSubtitle : t.modal.createSubtitle}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={submitting}
              className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              aria-label={t.buttons.close}
            >
              <X size={24} className="text-white" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Row 0: Chi nhánh */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Building2 size={16} className="text-red-600" />
                {t.modal.branchRequired}
              </label>
              <div className="relative">
                <Select 
                  value={formData.branchId} 
                  onValueChange={(val) => handleChange("branchId", val)}
                  disabled={loadingBranches}
                >
                  <SelectTrigger className={cn(
                    "w-full rounded-xl border bg-white text-sm text-gray-900 transition-all hover:border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-200",
                    errors.branchId ? "border-red-500" : "border-gray-200",
                    loadingBranches ? "opacity-50 cursor-not-allowed" : ""
                  )}>
                    <SelectValue placeholder={t.modal.selectBranchPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {branchOptions.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.branchId && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <AlertCircle size={18} className="text-red-500" />
                  </div>
                )}
              </div>
              {errors.branchId && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.branchId}</p>}
            </div>

            {/* Row 1: Tên khóa */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <BookOpen size={16} className="text-red-600" />
                {t.modal.courseNameRequired}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border bg-white text-gray-900",
                    "focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
                    errors.name ? "border-red-500" : "border-gray-200"
                  )}
                  placeholder={t.modal.courseNamePlaceholder}
                />
                {errors.name && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <AlertCircle size={18} className="text-red-500" />
                  </div>
                )}
              </div>
              {errors.name && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.name}</p>}
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-gray-800">{t.modal.programTypeLabel}</div>
                  <p className="text-sm text-gray-600">
                    {t.modal.programTypeDesc}
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                <label className="inline-flex items-center gap-3 rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800">
                  <input
                    type="checkbox"
                    checked={formData.isSupplementary}
                    onChange={(e) => handleChange("isSupplementary", e.target.checked)}
                    className="h-4 w-4 rounded border-violet-300 text-violet-600 focus:ring-violet-300"
                  />
                  <span>{formData.isSupplementary ? t.modal.supplementaryLabel : t.modal.supplementary}</span>
                </label>

                <label className="inline-flex items-center gap-3 rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800">
                  <input
                    type="checkbox"
                    checked={formData.isMakeup}
                    onChange={(e) => handleChange("isMakeup", e.target.checked)}
                    className="h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-300"
                  />
                  <span>{formData.isMakeup ? t.modal.makeupLabel : t.modal.makeup}</span>
                </label>
                </div>

                <div className="rounded-xl border border-dashed border-blue-200 bg-white/70 px-3 py-2 text-sm text-gray-700">
                  {t.modal.programTypeInfo}
                </div>

                <div className="text-sm text-gray-700">
                  {t.modal.programTypeSelected}{" "}
                  <span className="font-semibold text-gray-900">
                    {formData.isMakeup
                      ? t.modal.makeupLabel
                      : formData.isSupplementary
                        ? t.modal.supplementaryLabel
                        : t.modal.programMain}
                  </span>
                </div>

                {errors.isSupplementary && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.isSupplementary}
                  </p>
                )}
              </div>
            </div>

            {/* Row: Giới hạn nghỉ */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600" />
                <div>
                  <div className="text-sm font-semibold text-amber-900">{t.modal.leaveLimitTitle}</div>
                  <p className="text-xs text-amber-700 mt-0.5">
                    {t.modal.leaveLimitDesc}
                  </p>
                </div>
              </div>
              <input
                type="number"
                min="1"
                step="1"
                value={formData.maxLeavesPerMonth ?? ""}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  handleChange("maxLeavesPerMonth", v === "" ? null : Math.max(1, parseInt(v, 10) || 1));
                }}
                placeholder={t.modal.leaveLimitPlaceholder}
                className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>


          </form>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 p-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t.buttons.cancel}
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (mode === "edit" && initialData) {
                    setFormData(initialData);
                  } else {
                    setFormData(initialFormData);
                  }
                  setErrors({});
                }}
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              >
                {mode === "edit" ? t.buttons.restore : t.buttons.reset}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Đang lưu..." : mode === "edit" ? t.buttons.save : t.buttons.create}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ page ------------------------------- */
export default function Page() {
  const { toast } = useToast();
  const { selectedBranchId, isLoaded, getBranchQueryParam } = useBranchFilter();
  const { messages } = usePageI18n();
  const t = messages.adminPages.courses;
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [q, setQ] = useState("");
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Đang hoạt động" | "Tạm dừng">("ALL");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [editingInitialData, setEditingInitialData] = useState<CourseFormData | null>(null);
  const [originalStatus, setOriginalStatus] = useState<string | null>(null);
  const [showToggleStatusModal, setShowToggleStatusModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseRow | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCourseDetail, setSelectedCourseDetail] = useState<ProgramDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [leaveLimitDraft, setLeaveLimitDraft] = useState("");
  const [isSavingLeaveLimit, setIsSavingLeaveLimit] = useState(false);

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedCourseDetail(null);
    setLeaveLimitDraft("");
    setIsSavingLeaveLimit(false);
  };

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  // Fetch programs with branch filter
  useEffect(() => {
    // Wait for localStorage to be loaded
    if (!isLoaded) return;

    async function fetchPrograms() {
      try {
        setLoading(true);
        setError(null);

        const branchId = getBranchQueryParam();
        console.log("📚 Fetching programs for branch:", branchId || "All branches");

        const mapped = await fetchAdminPrograms({ branchId });
        setCourses(mapped);
        console.log("✅ Loaded", mapped.length, "programs");
      } catch (err) {
        console.error("Unexpected error when fetching admin programs:", err);
        setError((err as Error)?.message || "Đã xảy ra lỗi khi tải danh sách khóa học.");
        setCourses([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPrograms();

    // Reset page về 1 khi branch thay đổi
    setPage(1);
  }, [selectedBranchId, isLoaded]); // Chỉ depend vào selectedBranchId và isLoaded

  const stats = useMemo(() => {
    const total = courses.length;
    const active = courses.filter(c => c.status === "Đang hoạt động").length;
    const students = 0;
    const revenue = "0";

    return {
      total,
      active,
      students,
      revenue,
    };
  }, [courses]);

  const rows = useMemo(() => {
    const kw = q.trim().toLowerCase();
    let filtered = !kw
      ? courses
      : courses.filter((c) =>
        [c.id, c.name, c.desc, c.fee, c.branch].some((x) => x?.toLowerCase().includes(kw))
      );

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        const getVal = (c: CourseRow) => {
          switch (sortField) {
            case "id": return c.id;
            case "name": return c.name;
            case "duration": return c.duration;
            case "fee": return c.fee;
            case "status": return c.status;
            case "branch": return c.branch ?? "";
          }
        };
        const av = getVal(a);
        const bv = getVal(b);
        return sortDirection === "asc"
          ? av.localeCompare(bv, undefined, { numeric: true })
          : bv.localeCompare(av, undefined, { numeric: true });
      });
    }
    return filtered;
  }, [q, sortField, sortDirection, courses, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const currentLeaveLimit = extractProgramMonthlyLeaveLimit(selectedCourseDetail);
  const leaveLimitValue = Number(leaveLimitDraft);
  const canSaveLeaveLimit =
    leaveLimitDraft.trim() !== "" &&
    Number.isInteger(leaveLimitValue) &&
    leaveLimitValue > 0 &&
    leaveLimitValue !== currentLeaveLimit &&
    !isSavingLeaveLimit;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") setSortDirection("desc");
      else if (sortDirection === "desc") { setSortField(null); setSortDirection(null); }
      else setSortDirection("asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setPage(1);
  };

  const goPage = (p: number) => setPage(Math.min(Math.max(1, p), totalPages));

  const handleCreateCourse = async (data: CourseFormData): Promise<boolean> => {
    try {
      if (!data.branchId) {
        toast({
          title: t.validation.missingInfo,
          description: t.validation.selectBranch,
          type: "warning",
        });
        return false;
      }

      if (data.isMakeup && data.isSupplementary) {
        toast({
          title: t.messages.error,
          description: t.validation.cannotBothTypes,
          type: "warning",
        });
        return false;
      }

      const code = data.code?.trim() || buildProgramCode(data.name);
      const payload: CreateProgramRequest = {
        branchId: data.branchId,
        name: data.name,
        code,
        isMakeup: data.isMakeup,
        isSupplementary: data.isSupplementary,
      };

      const created = await createAdminProgram(payload);

      const warnings: string[] = [];

      // Cấu hình giới hạn nghỉ nếu có
      if (data.maxLeavesPerMonth && data.maxLeavesPerMonth > 0 && created?.id && !created.id.startsWith("PROG-")) {
        try {
          await updateAdminProgramMonthlyLeaveLimit(created.id, data.maxLeavesPerMonth);
        } catch (leaveLimitError: any) {
          console.warn("Failed to set leave limit after create:", leaveLimitError);
          warnings.push(leaveLimitError?.message || "chưa cấu hình được giới hạn nghỉ");
        }
      }

      try {
        const branchId = getBranchQueryParam();
        const mapped = await fetchAdminPrograms({ branchId });
        setCourses(mapped);
      } catch (refreshError) {
        console.warn("Failed to refresh programs after create:", refreshError);
        warnings.push("danh sach chuong trinh chua duoc lam moi tu dong");
      }

      toast({
        title: warnings.length > 0 ? t.messages.courseCreated : t.messages.success,
        description:
          warnings.length > 0
            ? `${t.messages.courseCreated} ${data.name}, nhung ${warnings.join("; ")}.`
            : `${t.messages.success}!`,
        type: warnings.length > 0 ? "warning" : "success",
      });

      return true;
    } catch (err: any) {
      console.error("Failed to create program:", err);
      toast({
        title: t.messages.error,
        description: err?.message || t.messages.createFailed,
        type: "destructive",
      });
      return false;
    }
  };

  const handleUpdateCourse = async (data: CourseFormData): Promise<boolean> => {
    if (!editingProgramId) return false;

    try {
      if (!data.branchId) {
        toast({
          title: t.validation.missingInfo,
          description: t.validation.selectBranch,
          type: "warning",
        });
        return false;
      }

      if (data.isMakeup && data.isSupplementary) {
        toast({
          title: t.messages.error,
          description: t.validation.cannotBothTypes,
          type: "warning",
        });
        return false;
      }

      const code = data.code?.trim() || buildProgramCode(data.name);
      const payload: CreateProgramRequest = {
        branchId: data.branchId,
        name: data.name,
        code,
        isMakeup: data.isMakeup,
        isSupplementary: data.isSupplementary,
      };

      await updateAdminProgram(editingProgramId, payload);

      const warnings: string[] = [];

      // Cập nhật giới hạn nghỉ nếu thay đổi
      if (data.maxLeavesPerMonth && data.maxLeavesPerMonth > 0) {
        try {
          await updateAdminProgramMonthlyLeaveLimit(editingProgramId, data.maxLeavesPerMonth);
        } catch (leaveLimitError: any) {
          console.warn("Failed to update leave limit:", leaveLimitError);
          warnings.push(leaveLimitError?.message || "chưa cập nhật được giới hạn nghỉ");
        }
      }

      if (originalStatus && data.status !== originalStatus) {
        try {
          await toggleProgramStatus(editingProgramId);
        } catch (toggleError: any) {
          console.error("Failed to toggle program status after update:", toggleError);
          warnings.push(toggleError?.message || "chua cap nhat duoc trang thai chuong trinh");
        }
      }

      try {
        const branchId = getBranchQueryParam();
        const mapped = await fetchAdminPrograms({ branchId });
        setCourses(mapped);
      } catch (refreshError) {
        console.warn("Failed to refresh programs after update:", refreshError);
        warnings.push("danh sach chuong trinh chua duoc lam moi tu dong");
      }

      toast({
        title: warnings.length > 0 ? t.messages.courseUpdated : t.messages.success,
        description:
          warnings.length > 0
            ? `${t.messages.courseUpdated} ${data.name}, nhung ${warnings.join("; ")}.`
            : `${t.messages.courseUpdated} ${data.name} thanh cong!`,
        type: warnings.length > 0 ? "warning" : "success",
      });

      return true;
    } catch (err: any) {
      console.error("Failed to update program:", err);
      toast({
        title: t.messages.error,
        description: err?.message || t.messages.updateFailed,
        type: "destructive",
      });
      return false;
    }
  };

  const handleToggleStatus = (row: CourseRow) => {
    setSelectedCourse(row);
    setShowToggleStatusModal(true);
  };

  const handleOpenEditCourse = async (row: CourseRow) => {
    try {
      const detail = await fetchAdminProgramDetail(row.id);
      const normalizedStatus = normalizeIsActive(detail.isActive ?? detail.status);
      const nextStatus =
        normalizedStatus === true
          ? "Dang hoat dong"
          : normalizedStatus === false
            ? "Tam dung"
            : row.status;

      const nextInitialData: CourseFormData = {
        code: String(detail.code ?? ""),
        name: String(detail.name ?? row.name),
        status: nextStatus,
        branchId: String(detail.branchId ?? detail.branch?.id ?? ""),
        isMakeup: typeof detail.isMakeup === "boolean" ? detail.isMakeup : !!row.isMakeup,
        isSupplementary:
          typeof detail.isSupplementary === "boolean"
            ? detail.isSupplementary
            : !!row.isSupplementary,
        maxLeavesPerMonth: extractProgramMonthlyLeaveLimit(detail),
      };

      setEditingProgramId(row.id);
      setEditingInitialData(nextInitialData);
      setOriginalStatus(nextInitialData.status);
      setIsEditModalOpen(true);
    } catch (err: any) {
      console.error("Failed to load program detail for edit:", err);
      toast({
        title: t.modal.updateTitle,
        description: err?.message || t.messages.notFoundDetail,
        type: "destructive",
      });
    }
  };
  const handleViewDetail = async (row: CourseRow) => {
    try {
      setLoadingDetail(true);
      setShowDetailModal(true);
      setSelectedCourseDetail(null);
      setLeaveLimitDraft("");

      const detail = await fetchAdminProgramDetail(row.id);
      setSelectedCourseDetail(detail);
      const limit = extractProgramMonthlyLeaveLimit(detail);
      setLeaveLimitDraft(limit !== null ? String(limit) : "");
    } catch (err: any) {
      console.error("Failed to load program detail:", err);
      toast({
        title: t.messages.error,
        description: err?.message || t.messages.notFoundDetail,
        type: "destructive",
      });
      closeDetailModal();
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSaveMonthlyLeaveLimit = async () => {
    if (!selectedCourseDetail?.id) return;

    const maxLeavesPerMonth = Number(leaveLimitDraft);
    if (!Number.isInteger(maxLeavesPerMonth) || maxLeavesPerMonth <= 0) {
      toast({
        title: t.validation.invalidLeaveLimit,
        description: t.validation.invalidLeaveValue,
        type: "warning",
      });
      return;
    }

    try {
      setIsSavingLeaveLimit(true);

      const updated = await updateAdminProgramMonthlyLeaveLimit(
        selectedCourseDetail.id,
        maxLeavesPerMonth
      );

      let refreshedDetail: ProgramDetail | null = null;
      try {
        refreshedDetail = await fetchAdminProgramDetail(selectedCourseDetail.id);
      } catch (refreshError) {
        console.warn("Failed to refresh program detail after leave limit update:", refreshError);
      }

      const nextLimit =
        extractProgramMonthlyLeaveLimit(refreshedDetail) ??
        updated.maxLeavesPerMonth ??
        maxLeavesPerMonth;

      const baseDetail = refreshedDetail ?? selectedCourseDetail;
      setSelectedCourseDetail({
        ...baseDetail,
        maxLeavesPerMonth: nextLimit,
        monthlyLeaveLimit: nextLimit,
        programLeavePolicy: {
          ...(baseDetail.programLeavePolicy ?? {}),
          maxLeavesPerMonth: nextLimit,
        },
      });
      setLeaveLimitDraft(String(nextLimit));

      toast({
        title: t.messages.leaveLimitUpdated,
        description: t.messages.leaveLimitUpdateNote,
        type: "success",
      });
    } catch (err: any) {
      console.error("Failed to update monthly leave limit:", err);
      toast({
        title: "Không thể cập nhật",
        description:
          err?.message ||
          "Không thể lưu số buổi nghỉ tối đa theo tháng cho chương trình này.",
        type: "destructive",
      });
    } finally {
      setIsSavingLeaveLimit(false);
    }
  };

  const confirmToggleStatus = async () => {
    if (!selectedCourse) return;

    // Xác định trạng thái mới dựa trên trạng thái hiện tại
    const currentStatus = selectedCourse.status;
    const newStatus = currentStatus === "Đang hoạt động" ? "Tạm dừng" : "Đang hoạt động";
    const actionText = newStatus === "Đang hoạt động" ? "kích hoạt" : "tạm dừng";

    try {
      setIsTogglingStatus(true);
      await toggleProgramStatus(selectedCourse.id);

      // Cập nhật danh sách với branch filter hiện tại
      const branchId = getBranchQueryParam();
      const mapped = await fetchAdminPrograms({ branchId });
      setCourses(mapped);

      toast({
        title: t.messages.success,
        description: `Đã ${actionText} khóa học "${selectedCourse.name}" thành công!`,
        type: "success",
      });

      setShowToggleStatusModal(false);
      setSelectedCourse(null);
    } catch (err: any) {
      console.error("Failed to toggle program status:", err);
      toast({
        title: t.messages.error,
        description: err?.message || t.messages.toggleFailed,
        type: "destructive",
      });
    } finally {
      setIsTogglingStatus(false);
    }
  };

  return (
    <>
      <div className="space-y-6 bg-gray-50 p-4 md:p-6 rounded-3xl">
        {/* Title */}
        <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 shadow-lg">
              <BookOpen className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                {t.header.title}
              </h1>
              <p className="text-sm text-gray-600">{t.header.subtitle}</p>
            </div>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            type="button"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:shadow-lg text-white font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={18} /> {t.buttons.create}
          </button>
        </div>

        {/* Stats cards */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-red-100 grid place-items-center">
                <BookOpen className="text-red-600" size={18} />
              </span>
              <div>
                <div className="text-sm text-gray-600">{t.stats.totalCourses}</div>
                <div className="text-2xl font-extrabold text-gray-900">{stats.total}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-red-100 grid place-items-center">
                <GraduationCap className="text-red-600" size={18} />
              </span>
              <div>
                <div className="text-sm text-gray-600">{t.stats.active}</div>
                <div className="text-2xl font-extrabold text-gray-900">{stats.active}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-gray-100 grid place-items-center">
                <Users className="text-gray-600" size={18} />
              </span>
              <div>
                <div className="text-sm text-gray-600">{t.stats.totalStudents}</div>
                <div className="text-2xl font-extrabold text-gray-900">{stats.students}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-black/10 grid place-items-center">
                <DollarSign className="text-gray-800" size={18} />
              </span>
              <div>
                <div className="text-sm text-gray-600">{t.stats.monthlyRevenue}</div>
                <div className="text-2xl font-extrabold text-gray-900">{stats.revenue}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Branch Filter Indicator */}
        {selectedBranchId && (
          <div className={`flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl transition-all duration-700 delay-150 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Building2 size={16} className="text-red-600" />
            <span className="text-sm text-red-700 font-medium">
              {t.filters.branchFiltered}
            </span>
          </div>
        )}

        {/* Search & Filters */}
        <div className={`rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-4 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
                placeholder={t.filters.search}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 sm:flex-nowrap">
              <Select 
                value={statusFilter} 
                onValueChange={(val) => { setStatusFilter(val as typeof statusFilter); setPage(1); }}
              >
                <SelectTrigger className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200">
                  <SelectValue placeholder={t.filters.statusLabel} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t.filters.allStatus}</SelectItem>
                  <SelectItem value="Đang hoạt động">{t.filters.active}</SelectItem>
                  <SelectItem value="Tạm dừng">{t.filters.paused}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className={`rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-all duration-700 delay-300 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Table Header */}
          <div className="bg-gradient-to-r from-red-500/10 to-red-700/10 border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900">{t.table.title}</h2>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">{rows.length} {t.table.count}</span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-red-500/5 to-red-700/5 border-b border-gray-200">
                <tr>
                  <SortableHeader field="name" currentField={sortField} direction={sortDirection} onSort={handleSort}>{t.table.courseName}</SortableHeader>
                  <SortableHeader field="duration" currentField={sortField} direction={sortDirection} onSort={handleSort}>{t.table.duration}</SortableHeader>
                  <SortableHeader field="fee" currentField={sortField} direction={sortDirection} onSort={handleSort}>{t.table.fee}</SortableHeader>
                  <SortableHeader field="branch" currentField={sortField} direction={sortDirection} onSort={handleSort}>{t.table.branch}</SortableHeader>
                  <SortableHeader field="status" currentField={sortField} direction={sortDirection} onSort={handleSort} align="center">{t.table.status}</SortableHeader>
                  <th className="py-3 px-6 text-right text-xs font-medium tracking-wide text-gray-700 whitespace-nowrap">{t.table.actions}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {pagedRows.length > 0 ? (
                  pagedRows.map((c) => (
                    <tr
                      key={c.id}
                      className="group hover:bg-gradient-to-r hover:from-red-50/50 hover:to-white transition-all duration-200"
                    >
                      <td className="py-3 px-6">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm text-gray-900 truncate">{c.name}</div>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                              getProgramTypeBadgeClass(c)
                            )}
                          >
                            {getProgramTypeLabel(c)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 truncate">{c.desc}</div>
                      </td>

                      <td className="py-3 px-6 whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 text-gray-900 text-sm">
                          <Clock size={16} className="text-gray-400" />
                          <span className="truncate">{c.duration}</span>
                        </div>
                      </td>

                      <td className="py-3 px-6 text-gray-900 text-sm whitespace-nowrap">{c.fee}</td>

                      <td className="py-3 px-6 whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 text-gray-900 text-sm">
                          <Building2 size={16} className="text-gray-400" />
                          <span className="truncate">{c.branch || t.details.noBranch}</span>
                        </div>
                      </td>

                      <td className="py-3 px-6 text-center whitespace-nowrap">
                        <StatusBadge value={c.status} />
                      </td>

                      <td className="py-3 px-6">
                        <div className="flex items-center justify-end text-gray-700 gap-1 transition-opacity duration-200">
                          <button
                            onClick={() => handleViewDetail(c)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 cursor-pointer"
                            title={t.buttons.view}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleOpenEditCourse(c)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-800 cursor-pointer"
                            title={t.buttons.edit}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(c)}
                            className={cn(
                              "p-1.5 rounded-lg transition-colors cursor-pointer",
                              c.status === "Đang hoạt động"
                                ? "hover:bg-gray-100 text-gray-400 hover:text-gray-800"
                                : "hover:bg-red-50 text-gray-400 hover:text-red-600"
                            )}
                            title={c.status === "Đang hoạt động" ? t.messages.pauseConfirm : t.messages.activateConfirm}
                          >
                            {c.status === "Đang hoạt động" ? <PowerOff size={14} /> : <Power size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
                        <Search size={24} className="text-gray-400" />
                      </div>
                      <div className="text-gray-600 font-medium">{t.table.notFound}</div>
                      <div className="text-sm text-gray-500 mt-1">{t.table.tryFilter}</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer - Pagination */}
          {rows.length > 0 && (
            <div className="border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 px-6 py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  {t.table.showing} <span className="font-semibold text-gray-900">{(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, rows.length)}</span>
                  {' '}{t.table.outOf} <span className="font-semibold text-gray-900">{rows.length}</span> {t.table.count}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => goPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <div className="flex items-center gap-1">
                    {(() => {
                      const pages: (number | string)[] = [];
                      const maxVisible = 7;

                      if (totalPages <= maxVisible) {
                        for (let i = 1; i <= totalPages; i++) {
                          pages.push(i);
                        }
                      } else {
                        if (currentPage <= 3) {
                          for (let i = 1; i <= 5; i++) pages.push(i);
                          pages.push("...");
                          pages.push(totalPages);
                        } else if (currentPage >= totalPages - 2) {
                          pages.push(1);
                          pages.push("...");
                          for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
                        } else {
                          pages.push(1);
                          pages.push("...");
                          for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                          pages.push("...");
                          pages.push(totalPages);
                        }
                      }

                      return pages.map((p, idx) => (
                        <button
                          key={idx}
                          onClick={() => typeof p === "number" && goPage(p)}
                          disabled={p === "..."}
                          className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${p === currentPage
                              ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
                              : p === "..."
                                ? "cursor-default text-gray-400"
                                : "border border-red-200 hover:bg-red-50 text-gray-700"
                            }`}
                        >
                          {p}
                        </button>
                      ));
                    })()}
                  </div>

                  <button
                    onClick={() => goPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    aria-label="Next page"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Course Modal */}
      <CreateCourseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateCourse}
        mode="create"
        initialData={null}
        t={t}
      />
      {/* Edit Course Modal */}
      <CreateCourseModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingProgramId(null);
          setEditingInitialData(null);
          setOriginalStatus(null);
        }}
        mode="edit"
        t={t}
        onSubmit={handleUpdateCourse}
        initialData={editingInitialData}
      />

      {/* Toggle Status Confirm Modal */}
      <ConfirmModal
        isOpen={showToggleStatusModal}
        onClose={() => {
          setShowToggleStatusModal(false);
          setSelectedCourse(null);
        }}
        onConfirm={confirmToggleStatus}
        title={selectedCourse?.status === "Đang hoạt động" ? t.messages.pauseConfirm : t.messages.activateConfirm}
        message={
          selectedCourse?.status === "Đang hoạt động"
            ? `${t.messages.pauseConfirmMsg}`.replace("{name}", selectedCourse?.name || "")
            : `${t.messages.activateConfirmMsg}`.replace("{name}", selectedCourse?.name || "")
        }
        confirmText={selectedCourse?.status === "Đang hoạt động" ? t.messages.pauseConfirm : t.messages.activateConfirm}
        cancelText={t.buttons.cancel}
        variant={selectedCourse?.status === "Đang hoạt động" ? "warning" : "success"}
        isLoading={isTogglingStatus}
      />

      {/* Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                    <BookOpen size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{t.details.title}</h2>
                    <p className="text-sm text-red-100">{t.details.subtitle}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    closeDetailModal();
                  }}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
                  aria-label={t.buttons.close}
                >
                  <X size={24} className="text-white" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {loadingDetail ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
                </div>
              ) : selectedCourseDetail ? (
                <div className="space-y-6">
                  {/* Tên khóa học */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <BookOpen size={16} className="text-red-600" />
                      {t.details.nameLabel}
                    </label>
                    <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900">
                      {selectedCourseDetail.name || t.details.noInfo}
                    </div>
                  </div>

                  {/* Mô tả */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <FileText size={16} className="text-red-600" />
                      {t.details.descLabel}
                    </label>
                    <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 min-h-[80px]">
                      {selectedCourseDetail.description || t.details.noDescription}
                    </div>
                  </div>

                  {/* Grid: Số buổi, Học phí, Giá mỗi buổi */}
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-amber-900">
                          {t.modal.leaveLimitTitle}
                        </h3>
                        <p className="text-sm text-amber-800">
                          {t.modal.leaveLimitDesc}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">
                          {t.modal.leaveCurrentLimit}
                        </label>
                        <div className="px-4 py-3 rounded-xl border border-amber-200 bg-white text-gray-900">
                          {currentLeaveLimit !== null ? `${currentLeaveLimit} buổi / tháng` : t.modal.leaveCurrentLimit}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">
                          {t.modal.leaveLimitLabel}
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={leaveLimitDraft}
                          onChange={(e) => setLeaveLimitDraft(e.target.value)}
                          placeholder={t.modal.leaveLimitPlaceholder}
                          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-200"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={handleSaveMonthlyLeaveLimit}
                          disabled={!canSaveLeaveLimit}
                          className={cn(
                            "w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all md:w-auto",
                            canSaveLeaveLimit
                              ? "bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-lg hover:shadow-red-500/25 cursor-pointer"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed"
                          )}
                        >
                          {isSavingLeaveLimit ? t.messages.saving : t.modal.saveLeaveLimit}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Clock size={16} className="text-red-600" />
                        {t.details.sessionsLabel}
                      </label>
                      <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900">
                        {selectedCourseDetail.totalSessions ? `${selectedCourseDetail.totalSessions} ${t.table.count}` : t.details.noInfo}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <DollarSign size={16} className="text-red-600" />
                        {t.details.tuitionLabel}
                      </label>
                      <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900">
                        {selectedCourseDetail.defaultTuitionAmount
                          ? `${selectedCourseDetail.defaultTuitionAmount.toLocaleString("vi-VN")} VND`
                          : t.details.noInfo}
                      </div>
                    </div>
                  </div>

                  {/* Grid: Giá mỗi buổi, Chi nhánh, Loại chương trình, Trạng thái */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <DollarSign size={16} className="text-red-600" />
                        {t.details.unitPriceLabel}
                      </label>
                      <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900">
                        {selectedCourseDetail.unitPriceSession
                          ? `${selectedCourseDetail.unitPriceSession.toLocaleString("vi-VN")} VND`
                          : t.details.noInfo}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Building2 size={16} className="text-red-600" />
                        {t.details.branchLabel}
                      </label>
                      <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900">
                        {selectedCourseDetail.branchName || selectedCourseDetail.branch?.name || t.details.noBranch}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <GraduationCap size={16} className="text-red-600" />
                        {t.details.typeLabel}
                      </label>
                      <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900">
                        {getProgramTypeDetailLabel(selectedCourseDetail)}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <BookOpen size={16} className="text-red-600" />
                        {t.details.statusLabel}
                      </label>
                      <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white">
                        <StatusBadge value={normalizeIsActive(selectedCourseDetail?.isActive ?? selectedCourseDetail?.status) === true ? t.status.active : t.status.paused} />
                      </div>
                    </div>
                  </div>

                  {selectedCourseDetail.defaultMakeupClassId ? (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                      <div className="font-semibold">{t.details.defaultMakeupClass}</div>
                      <p className="mt-1 break-all">
                        {selectedCourseDetail.defaultMakeupClassId}
                      </p>
                    </div>
                  ) : null}


                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  {t.table.notFound}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 p-6">
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    closeDetailModal();
                  }}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all cursor-pointer"
                >
                  {t.buttons.close}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}