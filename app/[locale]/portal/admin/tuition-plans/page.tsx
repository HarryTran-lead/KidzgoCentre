"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BookOpen,
  Building2,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Eye,
  FileText,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Search,
  Wallet,
  X,
} from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";
import { useToast } from "@/hooks/use-toast";
import { useBranchFilter } from "@/hooks/useBranchFilter";
import { getAllBranches } from "@/lib/api/branchService";
import {
  createTuitionPlan,
  getProgramsForBranch,
  getTuitionPlanDetail,
  getTuitionPlans,
  toggleTuitionPlanStatus,
  updateTuitionPlan,
  type ProgramOption,
} from "@/lib/api/tuitionPlanService";
import type { TuitionPlan } from "@/types/admin/tuition_plan";

function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

type SortField =
  | "name"
  | "programName"
  | "totalSessions"
  | "tuitionAmount"
  | "branchName"
  | "status";
type SortDirection = "asc" | "desc" | null;

const PAGE_SIZE = 10;

function StatusBadge({ value }: { value: "Đang hoạt động" | "Tạm dừng" }) {
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

type TuitionPlanFormData = {
  branchId: string;
  programId: string;
  name: string;
  totalSessions: string;
  tuitionAmount: string;
  unitPriceSession: string;
  currency: string;
  status: "Đang hoạt động" | "Tạm dừng";
};

const initialFormData: TuitionPlanFormData = {
  branchId: "",
  programId: "",
  name: "",
  totalSessions: "",
  tuitionAmount: "",
  unitPriceSession: "",
  currency: "VND",
  status: "Đang hoạt động",
};

function TuitionPlanModal({
  isOpen,
  onClose,
  onSubmit,
  mode = "create",
  initialData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TuitionPlanFormData) => void;
  mode?: "create" | "edit";
  initialData?: TuitionPlanFormData | null;
}) {
  const [formData, setFormData] = useState<TuitionPlanFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof TuitionPlanFormData, string>>>({});
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    if (mode === "edit" && initialData) {
      setFormData(initialData);
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [isOpen, mode, initialData]);

  useEffect(() => {
    if (!isOpen) return;

    async function loadBranches() {
      try {
        setLoadingBranches(true);
        const res = await getAllBranches({ page: 1, limit: 100 });
        const items = res?.data?.branches ?? res?.data ?? [];
        setBranches(
          items
            .map((b: any) => ({
              id: String(b?.id ?? ""),
              name: String(b?.name ?? b?.code ?? "Chi nhánh"),
            }))
            .filter((b: { id: string }) => b.id)
        );
      } catch {
        setBranches([]);
      } finally {
        setLoadingBranches(false);
      }
    }

    loadBranches();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    async function loadPrograms() {
      try {
        setLoadingPrograms(true);
        const items = await getProgramsForBranch(formData.branchId || undefined);
        setPrograms(items.filter((x) => x.isActive !== false));
      } catch {
        setPrograms([]);
      } finally {
        setLoadingPrograms(false);
      }
    }

    loadPrograms();
  }, [isOpen, formData.branchId]);

  useEffect(() => {
    const sessions = Number(formData.totalSessions);
    const tuition = Number(formData.tuitionAmount.replace(/[^\d]/g, ""));

    if (sessions > 0 && tuition > 0 && !isNaN(sessions) && !isNaN(tuition)) {
      const pricePerSession = Math.round(tuition / sessions);
      const next = String(pricePerSession);
      setFormData((prev) => (prev.unitPriceSession === next ? prev : { ...prev, unitPriceSession: next }));
    } else if (!formData.totalSessions || !formData.tuitionAmount) {
      setFormData((prev) => (prev.unitPriceSession ? { ...prev, unitPriceSession: "" } : prev));
    }
  }, [formData.totalSessions, formData.tuitionAmount]);

  const handleChange = (field: keyof TuitionPlanFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = () => {
    const next: Partial<Record<keyof TuitionPlanFormData, string>> = {};

    if (!formData.branchId) next.branchId = "Chi nhánh là bắt buộc";
    if (!formData.programId) next.programId = "Khóa học là bắt buộc";
    if (!formData.name.trim()) next.name = "Tên gói học là bắt buộc";
    if (!formData.totalSessions || Number(formData.totalSessions) <= 0) next.totalSessions = "Số buổi học phải lớn hơn 0";
    if (!formData.tuitionAmount || Number(formData.tuitionAmount.replace(/[^\d]/g, "")) <= 0) next.tuitionAmount = "Học phí phải lớn hơn 0";
    if (!formData.unitPriceSession || Number(formData.unitPriceSession) <= 0) next.unitPriceSession = "Giá mỗi buổi không hợp lệ";
    if (!formData.currency.trim()) next.currency = "Loại tiền tệ là bắt buộc";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div ref={modalRef} className="relative w-full max-w-5xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
        <div className="bg-linear-to-r from-red-600 to-red-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <Wallet size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {mode === "edit" ? "Cập nhật gói học" : "Tạo gói học mới"}
                </h2>
                <p className="text-sm text-red-100">
                  {mode === "edit" ? "Chỉnh sửa thông tin gói học" : "Nhập thông tin chi tiết gói học"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X size={24} className="text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto">
          <form onSubmit={submit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Building2 size={16} className="text-red-600" />
                  Chi nhánh *
                </label>
                <select
                  value={formData.branchId}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData((prev) => ({ ...prev, branchId: value, programId: "" }));
                    if (errors.branchId) setErrors((prev) => ({ ...prev, branchId: undefined }));
                  }}
                  disabled={loadingBranches}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
                    errors.branchId ? "border-red-500" : "border-gray-200",
                    loadingBranches ? "opacity-50 cursor-not-allowed" : ""
                  )}
                >
                  <option value="">Chọn chi nhánh</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                {errors.branchId && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.branchId}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <BookOpen size={16} className="text-red-600" />
                  Khóa học *
                </label>
                <select
                  value={formData.programId}
                  onChange={(e) => handleChange("programId", e.target.value)}
                  disabled={loadingPrograms || !formData.branchId}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
                    errors.programId ? "border-red-500" : "border-gray-200",
                    loadingPrograms || !formData.branchId ? "opacity-50 cursor-not-allowed" : ""
                  )}
                >
                  <option value="">Chọn khóa học</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {errors.programId && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.programId}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Wallet size={16} className="text-red-600" />
                Tên gói học *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className={cn(
                  "w-full px-4 py-3 rounded-xl border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
                  errors.name ? "border-red-500" : "border-gray-200"
                )}
                placeholder="VD: Gói học 24 buổi"
              />
              {errors.name && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.name}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Clock size={16} className="text-red-600" />
                  Số buổi học *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.totalSessions}
                  onChange={(e) => handleChange("totalSessions", e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
                    errors.totalSessions ? "border-red-500" : "border-gray-200"
                  )}
                  placeholder="VD: 24"
                />
                {errors.totalSessions && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.totalSessions}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <DollarSign size={16} className="text-red-600" />
                  Học phí *
                </label>
                <input
                  type="text"
                  value={formData.tuitionAmount}
                  onChange={(e) => handleChange("tuitionAmount", e.target.value.replace(/[^\d]/g, ""))}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
                    errors.tuitionAmount ? "border-red-500" : "border-gray-200"
                  )}
                  placeholder="VD: 3200000"
                />
                {errors.tuitionAmount && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.tuitionAmount}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <DollarSign size={16} className="text-red-600" />
                  Giá mỗi buổi *
                </label>
                <input
                  type="text"
                  value={formData.unitPriceSession ? Number(formData.unitPriceSession).toLocaleString("vi-VN") : ""}
                  readOnly
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border bg-gray-50 text-gray-700 cursor-not-allowed",
                    errors.unitPriceSession ? "border-red-500" : "border-gray-200"
                  )}
                  placeholder="Tự động tính"
                />
                {errors.unitPriceSession && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.unitPriceSession}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <DollarSign size={16} className="text-red-600" />
                  Tiền tệ *
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleChange("currency", e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
                    errors.currency ? "border-red-500" : "border-gray-200"
                  )}
                >
                  <option value="VND">VND</option>
                  <option value="USD">USD</option>
                </select>
                {errors.currency && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.currency}</p>}
              </div>
            </div>
          </form>
        </div>

        <div className="border-t border-gray-200 bg-linear-to-r from-red-500/5 to-red-700/5 p-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={submit}
              className="px-6 py-2.5 rounded-xl bg-linear-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all cursor-pointer"
            >
              {mode === "edit" ? "Lưu thay đổi" : "Tạo gói học"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type Row = {
  id: string;
  name: string;
  programName: string;
  totalSessions: string;
  tuitionAmount: string;
  branchName: string;
  status: "Đang hoạt động" | "Tạm dừng";
};

function toRow(plan: TuitionPlan): Row {
  return {
    id: plan.id,
    name: plan.name,
    programName: plan.programName,
    totalSessions: `${plan.totalSessions} buổi`,
    tuitionAmount: `${plan.tuitionAmount.toLocaleString("vi-VN")} ${plan.currency || "VND"}`,
    branchName: plan.branchName,
    status: plan.isActive ? "Đang hoạt động" : "Tạm dừng",
  };
}

export default function TuitionPlansPage() {
  const { toast } = useToast();
  const { selectedBranchId, isLoaded, getBranchQueryParam } = useBranchFilter();

  const [plans, setPlans] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Đang hoạt động" | "Tạm dừng">("ALL");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editingInitialData, setEditingInitialData] = useState<TuitionPlanFormData | null>(null);
  const [originalStatus, setOriginalStatus] = useState<"Đang hoạt động" | "Tạm dừng" | null>(null);

  const [showToggleStatusModal, setShowToggleStatusModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Row | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detail, setDetail] = useState<TuitionPlan | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const branchId = getBranchQueryParam();
      const data = await getTuitionPlans({ pageNumber: 1, pageSize: 200, branchId });
      setPlans(data.map(toRow));
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err?.message || "Không thể tải danh sách gói học.",
        type: "destructive",
      });
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    loadData();
    setPage(1);
  }, [selectedBranchId, isLoaded]);

  const rows = useMemo(() => {
    const kw = q.trim().toLowerCase();
    let filtered = !kw
      ? plans
      : plans.filter((r) => [r.name, r.programName, r.branchName, r.tuitionAmount].some((x) => x.toLowerCase().includes(kw)));

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        const av = String(a[sortField]);
        const bv = String(b[sortField]);
        return sortDirection === "asc"
          ? av.localeCompare(bv, undefined, { numeric: true })
          : bv.localeCompare(av, undefined, { numeric: true });
      });
    }

    return filtered;
  }, [q, plans, statusFilter, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const stats = useMemo(() => ({
    total: plans.length,
    active: plans.filter((x) => x.status === "Đang hoạt động").length,
  }), [plans]);

  const goPage = (p: number) => setPage(Math.min(Math.max(1, p), totalPages));

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") setSortDirection("desc");
      else if (sortDirection === "desc") {
        setSortField(null);
        setSortDirection(null);
      } else setSortDirection("asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setPage(1);
  };

  const handleCreate = async (data: TuitionPlanFormData) => {
    try {
      await createTuitionPlan({
        branchId: data.branchId,
        programId: data.programId,
        name: data.name,
        totalSessions: Number(data.totalSessions),
        tuitionAmount: Number(data.tuitionAmount.replace(/[^\d]/g, "")),
        unitPriceSession: Number(data.unitPriceSession),
        currency: data.currency,
      });

      await loadData();
      toast({
        title: "Thành công",
        description: `Đã tạo gói học ${data.name} thành công!`,
        type: "success",
      });
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err?.message || "Không thể tạo gói học.",
        type: "destructive",
      });
    }
  };

  const handleOpenEdit = async (row: Row) => {
    try {
      const plan = await getTuitionPlanDetail(row.id);
      setEditingPlanId(row.id);
      setEditingInitialData({
        branchId: plan.branchId,
        programId: plan.programId,
        name: plan.name,
        totalSessions: String(plan.totalSessions),
        tuitionAmount: String(plan.tuitionAmount),
        unitPriceSession: String(plan.unitPriceSession),
        currency: plan.currency || "VND",
        status: plan.isActive ? "Đang hoạt động" : "Tạm dừng",
      });
      setOriginalStatus(plan.isActive ? "Đang hoạt động" : "Tạm dừng");
      setIsEditModalOpen(true);
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err?.message || "Không thể tải chi tiết gói học để cập nhật.",
        type: "destructive",
      });
    }
  };

  const handleUpdate = async (data: TuitionPlanFormData) => {
    if (!editingPlanId) return;

    try {
      await updateTuitionPlan(editingPlanId, {
        branchId: data.branchId,
        programId: data.programId,
        name: data.name,
        totalSessions: Number(data.totalSessions),
        tuitionAmount: Number(data.tuitionAmount.replace(/[^\d]/g, "")),
        unitPriceSession: Number(data.unitPriceSession),
        currency: data.currency,
      });

      if (originalStatus && data.status !== originalStatus) {
        await toggleTuitionPlanStatus(editingPlanId);
      }

      await loadData();
      toast({
        title: "Thành công",
        description: `Đã cập nhật gói học ${data.name} thành công!`,
        type: "success",
      });
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err?.message || "Không thể cập nhật gói học.",
        type: "destructive",
      });
    } finally {
      setEditingPlanId(null);
      setEditingInitialData(null);
      setOriginalStatus(null);
    }
  };

  const handleViewDetail = async (row: Row) => {
    try {
      setShowDetailModal(true);
      setLoadingDetail(true);
      setDetail(null);
      const data = await getTuitionPlanDetail(row.id);
      setDetail(data);
    } catch (err: any) {
      setShowDetailModal(false);
      toast({
        title: "Lỗi",
        description: err?.message || "Không thể tải chi tiết gói học.",
        type: "destructive",
      });
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleToggle = (row: Row) => {
    setSelectedRow(row);
    setShowToggleStatusModal(true);
  };

  const confirmToggleStatus = async () => {
    if (!selectedRow) return;

    const newStatus = selectedRow.status === "Đang hoạt động" ? "Tạm dừng" : "Đang hoạt động";
    const actionText = newStatus === "Đang hoạt động" ? "kích hoạt" : "tạm dừng";

    try {
      setIsTogglingStatus(true);
      await toggleTuitionPlanStatus(selectedRow.id);
      await loadData();
      toast({
        title: "Thành công",
        description: `Đã ${actionText} gói học "${selectedRow.name}" thành công!`,
        type: "success",
      });
      setShowToggleStatusModal(false);
      setSelectedRow(null);
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err?.message || "Không thể đổi trạng thái gói học.",
        type: "destructive",
      });
    } finally {
      setIsTogglingStatus(false);
    }
  };

  return (
    <>
      <div className="space-y-6 bg-gray-50 p-4 md:p-6 rounded-3xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-linear-to-r from-red-600 to-red-700 shadow-lg">
              <Wallet className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Quản lý gói học</h1>
              <p className="text-sm text-gray-600">Danh sách gói học và cấu hình học phí theo khóa học</p>
            </div>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            type="button"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-linear-to-r from-red-600 to-red-700 hover:shadow-lg text-white font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={18} /> Tạo gói học mới
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-red-100 grid place-items-center">
                <Wallet className="text-red-600" size={18} />
              </span>
              <div>
                <div className="text-sm text-gray-600">Tổng gói học</div>
                <div className="text-2xl font-extrabold text-gray-900">{stats.total}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-red-100 grid place-items-center">
                <BookOpen className="text-red-600" size={18} />
              </span>
              <div>
                <div className="text-sm text-gray-600">Đang hoạt động</div>
                <div className="text-2xl font-extrabold text-gray-900">{stats.active}</div>
              </div>
            </div>
          </div>
        </div>

        {selectedBranchId && (
          <div className="flex items-center gap-2 px-4 py-3 bg-linear-to-r from-red-50 to-red-100 border border-red-200 rounded-xl">
            <Building2 size={16} className="text-red-600" />
            <span className="text-sm text-red-700 font-medium">Đang lọc theo chi nhánh đã chọn</span>
          </div>
        )}

        <div className="rounded-2xl border border-red-200 bg-linear-to-br from-white to-red-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 max-w-3xl min-w-70">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Tìm kiếm gói học..."
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as typeof statusFilter);
                setPage(1);
              }}
              className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="Đang hoạt động">Đang hoạt động</option>
              <option value="Tạm dừng">Tạm dừng</option>
            </select>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-linear-to-r from-red-500/10 to-red-700/10 border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Danh sách gói học</h2>
              <div className="text-sm text-gray-600">
                <span className="font-medium">{rows.length} gói học</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-linear-to-r from-red-500/5 to-red-700/5 border-b border-gray-200">
                <tr>
                  <SortableHeader field="name" currentField={sortField} direction={sortDirection} onSort={handleSort}>Tên gói học</SortableHeader>
                  <SortableHeader field="programName" currentField={sortField} direction={sortDirection} onSort={handleSort}>Khóa học</SortableHeader>
                  <SortableHeader field="totalSessions" currentField={sortField} direction={sortDirection} onSort={handleSort}>Số buổi</SortableHeader>
                  <SortableHeader field="tuitionAmount" currentField={sortField} direction={sortDirection} onSort={handleSort}>Học phí</SortableHeader>
                  <SortableHeader field="branchName" currentField={sortField} direction={sortDirection} onSort={handleSort}>Chi nhánh</SortableHeader>
                  <SortableHeader field="status" currentField={sortField} direction={sortDirection} onSort={handleSort} align="center">Trạng thái</SortableHeader>
                  <th className="py-3 px-6 text-right text-xs font-medium tracking-wide text-gray-700 whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {!loading && pagedRows.length > 0 ? (
                  pagedRows.map((r) => (
                    <tr key={r.id} className="group hover:bg-linear-to-r hover:from-red-50/50 hover:to-white transition-all duration-200">
                      <td className="py-3 px-6">
                        <div className="text-sm text-gray-900 truncate">{r.name}</div>
                      </td>
                      <td className="py-3 px-6">
                        <div className="text-sm text-gray-900 truncate">{r.programName || "Chưa có"}</div>
                      </td>
                      <td className="py-3 px-6 whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 text-gray-900 text-sm">
                          <Clock size={16} className="text-gray-400" />
                          <span className="truncate">{r.totalSessions}</span>
                        </div>
                      </td>
                      <td className="py-3 px-6 text-gray-900 text-sm whitespace-nowrap">{r.tuitionAmount}</td>
                      <td className="py-3 px-6 whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 text-gray-900 text-sm">
                          <Building2 size={16} className="text-gray-400" />
                          <span className="truncate">{r.branchName || "Chưa có"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-6 text-center whitespace-nowrap">
                        <StatusBadge value={r.status} />
                      </td>
                      <td className="py-3 px-6">
                        <div className="flex items-center justify-end text-gray-700 gap-1">
                          <button
                            onClick={() => handleViewDetail(r)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(r)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-800 cursor-pointer"
                            title="Sửa"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleToggle(r)}
                            className={cn(
                              "p-1.5 rounded-lg transition-colors cursor-pointer",
                              r.status === "Đang hoạt động"
                                ? "hover:bg-gray-100 text-gray-400 hover:text-gray-800"
                                : "hover:bg-red-50 text-gray-400 hover:text-red-600"
                            )}
                            title={r.status === "Đang hoạt động" ? "Tạm dừng" : "Kích hoạt"}
                          >
                            {r.status === "Đang hoạt động" ? <PowerOff size={14} /> : <Power size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-linear-to-r from-gray-100 to-gray-200 flex items-center justify-center">
                        <Search size={24} className="text-gray-400" />
                      </div>
                      <div className="text-gray-600 font-medium">{loading ? "Đang tải dữ liệu..." : "Không tìm thấy gói học"}</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {rows.length > 0 && (
            <div className="border-t border-gray-200 bg-linear-to-r from-red-500/5 to-red-700/5 px-6 py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Hiển thị <span className="font-semibold text-gray-900">{(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, rows.length)}</span>
                  {" "}trong tổng số <span className="font-semibold text-gray-900">{rows.length}</span> gói học
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
                  <span className="min-w-9 h-9 px-3 rounded-lg text-sm font-medium bg-white border border-red-200 grid place-items-center">
                    {currentPage}/{totalPages}
                  </span>
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

      <TuitionPlanModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
        mode="create"
        initialData={null}
      />

      <TuitionPlanModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingPlanId(null);
          setEditingInitialData(null);
          setOriginalStatus(null);
        }}
        onSubmit={handleUpdate}
        mode="edit"
        initialData={editingInitialData}
      />

      <ConfirmModal
        isOpen={showToggleStatusModal}
        onClose={() => {
          setShowToggleStatusModal(false);
          setSelectedRow(null);
        }}
        onConfirm={confirmToggleStatus}
        title={selectedRow?.status === "Đang hoạt động" ? "Xác nhận tạm dừng gói học" : "Xác nhận kích hoạt gói học"}
        message={
          selectedRow?.status === "Đang hoạt động"
            ? `Bạn có chắc chắn muốn tạm dừng gói học "${selectedRow?.name}"?`
            : `Bạn có chắc chắn muốn kích hoạt gói học "${selectedRow?.name}"?`
        }
        confirmText={selectedRow?.status === "Đang hoạt động" ? "Tạm dừng" : "Kích hoạt"}
        cancelText="Hủy"
        variant={selectedRow?.status === "Đang hoạt động" ? "warning" : "success"}
        isLoading={isTogglingStatus}
      />

      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
            <div className="bg-linear-to-r from-red-600 to-red-700 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                    <Wallet size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Chi tiết gói học</h2>
                    <p className="text-sm text-red-100">Thông tin chi tiết về gói học</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setDetail(null);
                  }}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
                  aria-label="Đóng"
                >
                  <X size={24} className="text-white" />
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {loadingDetail ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
                </div>
              ) : detail ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Wallet size={16} className="text-red-600" />
                      Tên gói học
                    </label>
                    <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900">{detail.name}</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <BookOpen size={16} className="text-red-600" />
                        Khóa học
                      </label>
                      <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900">{detail.programName || "Chưa có"}</div>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Building2 size={16} className="text-red-600" />
                        Chi nhánh
                      </label>
                      <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900">{detail.branchName || "Chưa có"}</div>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <FileText size={16} className="text-red-600" />
                        Trạng thái
                      </label>
                      <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white">
                        <StatusBadge value={detail.isActive ? "Đang hoạt động" : "Tạm dừng"} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Clock size={16} className="text-red-600" />
                        Số buổi học
                      </label>
                      <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900">{detail.totalSessions} buổi</div>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <DollarSign size={16} className="text-red-600" />
                        Học phí
                      </label>
                      <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900">
                        {detail.tuitionAmount.toLocaleString("vi-VN")} {detail.currency || "VND"}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <DollarSign size={16} className="text-red-600" />
                        Giá mỗi buổi
                      </label>
                      <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900">
                        {detail.unitPriceSession.toLocaleString("vi-VN")} {detail.currency || "VND"}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">Không có dữ liệu để hiển thị</div>
              )}
            </div>

            <div className="border-t border-gray-200 bg-linear-to-r from-red-500/5 to-red-700/5 p-6">
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setDetail(null);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-linear-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
