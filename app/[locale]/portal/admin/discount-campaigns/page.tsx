"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Pencil,
  Percent,
  Plus,
  Power,
  PowerOff,
  Search,
  Tag,
  X,
} from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";
import { useToast } from "@/hooks/use-toast";
import { useBranchFilter } from "@/hooks/useBranchFilter";
import {
  createDiscountCampaign,
  getDiscountCampaignById,
  getDiscountCampaigns,
  toggleDiscountCampaignStatus,
  updateDiscountCampaign,
} from "@/lib/api/discountCampaignService";
import { getTuitionPlans } from "@/lib/api/tuitionPlanService";
import { getAllProgramsForDropdown } from "@/lib/api/programService";
import type { DiscountCampaign, CreateDiscountCampaignRequest, DiscountType } from "@/types/admin/discountCampaign";
import type { TuitionPlan } from "@/types/admin/tuition_plan";
import type { Program } from "@/types/admin/programs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/lightswind/select";
import { getDomainErrorMessage } from "@/lib/api/domainErrorMessage";

function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

// ─── Types ────────────────────────────────────────────────────────────────────

type SortField = "name" | "discountValue" | "priority" | "startDate" | "endDate" | "status";
type SortDirection = "asc" | "desc" | null;

interface CampaignFormData {
  name: string;
  code: string;
  description: string;
  branchId: string;
  programId: string;
  tuitionPlanId: string;
  discountType: DiscountType;
  discountValue: string;
  priority: string;
  startDate: string;
  endDate: string;
  applyForInitialRegistration: boolean;
  applyForRenewal: boolean;
  applyForUpgrade: boolean;
}

interface FormErrors {
  name?: string;
  discountValue?: string;
  priority?: string;
  startDate?: string;
  endDate?: string;
  applicability?: string;
}

const DEFAULT_FORM: CampaignFormData = {
  name: "",
  code: "",
  description: "",
  branchId: "",
  programId: "",
  tuitionPlanId: "",
  discountType: "Percentage",
  discountValue: "",
  priority: "100",
  startDate: "",
  endDate: "",
  applyForInitialRegistration: true,
  applyForRenewal: true,
  applyForUpgrade: false,
};

const PAGE_SIZE = 10;

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={cn(
        "px-2.5 py-1 rounded-full text-xs font-semibold border",
        isActive
          ? "bg-green-100 text-green-700 border-green-200"
          : "bg-gray-100 text-gray-600 border-gray-200"
      )}
    >
      {isActive ? "Đang bật" : "Đã tắt"}
    </span>
  );
}

function ApplicableBadge({ isCurrentlyApplicable }: { isCurrentlyApplicable: boolean }) {
  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded-full text-[11px] font-semibold border",
        isCurrentlyApplicable
          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
          : "bg-amber-100 text-amber-700 border-amber-200"
      )}
    >
      {isCurrentlyApplicable ? "Đang áp dụng" : "Chưa/Hết hạn"}
    </span>
  );
}

function DiscountTypeBadge({ type, value }: { type: DiscountType; value: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-gray-800">
      {type === "Percentage" ? (
        <>
          <Percent size={13} className="text-blue-500" />
          {value}%
        </>
      ) : (
        <>
          <Tag size={13} className="text-purple-500" />
          {value.toLocaleString("vi-VN")}đ
        </>
      )}
    </span>
  );
}

function SortableHeader({
  field,
  currentField,
  direction,
  onSort,
  children,
}: {
  field: SortField;
  currentField: SortField | null;
  direction: SortDirection;
  onSort: (f: SortField) => void;
  children: React.ReactNode;
}) {
  const isActive = currentField === field;
  const icon = isActive ? (
    direction === "asc" ? (
      <ArrowUp size={14} className="text-red-600" />
    ) : (
      <ArrowDown size={14} className="text-red-600" />
    )
  ) : (
    <ArrowUpDown size={14} className="text-gray-400" />
  );
  return (
    <th
      onClick={() => onSort(field)}
      className="py-3 px-4 text-left text-sm font-semibold tracking-wide text-gray-700 whitespace-nowrap cursor-pointer select-none hover:bg-red-50 transition-colors"
    >
      <span className="inline-flex items-center gap-1.5">
        {children}
        {icon}
      </span>
    </th>
  );
}

// ─── Form Modal ───────────────────────────────────────────────────────────────

function CampaignFormModal({
  isOpen,
  mode,
  initialData,
  programs,
  tuitionPlans,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  mode: "create" | "edit";
  initialData: CampaignFormData | null;
  programs: Program[];
  tuitionPlans: TuitionPlan[];
  onClose: () => void;
  onSubmit: (data: CampaignFormData) => Promise<boolean>;
}) {
  const [form, setForm] = useState<CampaignFormData>(DEFAULT_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ?? DEFAULT_FORM);
      setErrors({});
    }
  }, [isOpen, initialData]);

  const filteredTuitionPlans = useMemo(() => {
    return tuitionPlans.filter((tp) => {
      if (form.programId && tp.programId !== form.programId) return false;
      if (form.branchId && tp.branchId !== form.branchId) return false;
      return true;
    });
  }, [tuitionPlans, form.programId, form.branchId]);

  function set(key: keyof CampaignFormData, value: any) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // Reset tuitionPlanId if program/branch changes
      if (key === "programId" || key === "branchId") {
        next.tuitionPlanId = "";
      }
      return next;
    });
  }

  function validate(): boolean {
    const next: FormErrors = {};
    if (!form.name.trim()) next.name = "Tên campaign không được để trống.";
    const dv = Number(form.discountValue);
    if (!form.discountValue || isNaN(dv) || dv <= 0) {
      next.discountValue = "Giá trị giảm phải lớn hơn 0.";
    } else if (form.discountType === "Percentage" && dv > 100) {
      next.discountValue = "Giảm theo % không được vượt quá 100.";
    }
    const prio = Number(form.priority);
    if (form.priority === "" || isNaN(prio) || prio < 0) {
      next.priority = "Độ ưu tiên phải >= 0.";
    }
    if (!form.startDate) next.startDate = "Chọn ngày bắt đầu.";
    if (!form.endDate) next.endDate = "Chọn ngày kết thúc.";
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      next.endDate = "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.";
    }
    if (!form.applyForInitialRegistration && !form.applyForRenewal && !form.applyForUpgrade) {
      next.applicability = "Chọn ít nhất một loại đăng ký được áp dụng.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const ok = await onSubmit(form);
      if (ok) onClose();
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-5 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold text-white">
            {mode === "create" ? "Tạo khuyến mãi đăng ký" : "Cập nhật khuyến mãi"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">
              Tên campaign <span className="text-red-500">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="VD: Khuyến mãi 30-4"
              className={cn(
                "w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200",
                errors.name ? "border-red-400" : "border-gray-200"
              )}
            />
            {errors.name && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.name}
              </p>
            )}
          </div>

          {/* Code + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Mã campaign</label>
              <input
                value={form.code}
                onChange={(e) => set("code", e.target.value.toUpperCase())}
                placeholder="VD: HOLIDAY30APR"
                maxLength={100}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">
                Độ ưu tiên <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={form.priority}
                onChange={(e) => set("priority", e.target.value)}
                placeholder="100"
                className={cn(
                  "w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200",
                  errors.priority ? "border-red-400" : "border-gray-200"
                )}
              />
              {errors.priority && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.priority}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Mô tả</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              maxLength={2000}
              rows={2}
              placeholder="Mô tả nội bộ hoặc hiển thị"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
            />
          </div>

          {/* Scope: Program + TuitionPlan */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Chương trình (scope)</label>
              <Select value={form.programId || "__all__"} onValueChange={(v) => set("programId", v === "__all__" ? "" : v)}>
                <SelectTrigger className="rounded-xl border border-gray-200 text-sm h-10">
                  <SelectValue placeholder="Tất cả chương trình" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tất cả chương trình</SelectItem>
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Gói học (scope)</label>
              <Select
                value={form.tuitionPlanId || "__all__"}
                onValueChange={(v) => set("tuitionPlanId", v === "__all__" ? "" : v)}
              >
                <SelectTrigger className="rounded-xl border border-gray-200 text-sm h-10">
                  <SelectValue placeholder="Tất cả gói học" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tất cả gói học</SelectItem>
                  {filteredTuitionPlans.map((tp) => (
                    <SelectItem key={tp.id} value={tp.id}>{tp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Discount Type + Value */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">
                Loại giảm giá <span className="text-red-500">*</span>
              </label>
              <Select value={form.discountType} onValueChange={(v) => set("discountType", v as DiscountType)}>
                <SelectTrigger className="rounded-xl border border-gray-200 text-sm h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Percentage">Phần trăm (%)</SelectItem>
                  <SelectItem value="FixedAmount">Số tiền cố định</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">
                Giá trị giảm <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0.01"
                  step={form.discountType === "Percentage" ? "0.01" : "1000"}
                  value={form.discountValue}
                  onChange={(e) => set("discountValue", e.target.value)}
                  placeholder={form.discountType === "Percentage" ? "10" : "1000000"}
                  className={cn(
                    "w-full rounded-xl border px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-red-200",
                    errors.discountValue ? "border-red-400" : "border-gray-200"
                  )}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-semibold">
                  {form.discountType === "Percentage" ? "%" : "đ"}
                </span>
              </div>
              {errors.discountValue && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.discountValue}
                </p>
              )}
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">
                Ngày bắt đầu <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
                className={cn(
                  "w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200",
                  errors.startDate ? "border-red-400" : "border-gray-200"
                )}
              />
              {errors.startDate && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.startDate}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">
                Ngày kết thúc <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.endDate}
                min={form.startDate}
                onChange={(e) => set("endDate", e.target.value)}
                className={cn(
                  "w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200",
                  errors.endDate ? "border-red-400" : "border-gray-200"
                )}
              />
              {errors.endDate && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.endDate}
                </p>
              )}
            </div>
          </div>

          {/* Applicability */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Áp dụng cho <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-4">
              {(
                [
                  { key: "applyForInitialRegistration", label: "Đăng ký lần đầu" },
                  { key: "applyForRenewal", label: "Gia hạn" },
                  { key: "applyForUpgrade", label: "Nâng cấp" },
                ] as const
              ).map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(e) => set(key, e.target.checked)}
                    className="w-4 h-4 rounded accent-red-600"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
            {errors.applicability && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.applicability}
              </p>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-3 flex-shrink-0 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={saving}
            onClick={(e) => {
              e.preventDefault();
              if (!validate()) return;
              setSaving(true);
              onSubmit(form)
                .then((ok) => { if (ok) onClose(); })
                .finally(() => setSaving(false));
            }}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-semibold hover:shadow-lg transition-all cursor-pointer disabled:opacity-60 inline-flex items-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {mode === "create" ? "Tạo campaign" : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function CampaignDetailModal({
  campaign,
  onClose,
}: {
  campaign: DiscountCampaign | null;
  onClose: () => void;
}) {
  if (!campaign) return null;

  const scopeParts: string[] = [];
  if (campaign.branchName) scopeParts.push(`Chi nhánh: ${campaign.branchName}`);
  if (campaign.programName) scopeParts.push(`Chương trình: ${campaign.programName}`);
  if (campaign.tuitionPlanName) scopeParts.push(`Gói học: ${campaign.tuitionPlanName}`);

  const applyParts: string[] = [];
  if (campaign.applyForInitialRegistration) applyParts.push("Đăng ký lần đầu");
  if (campaign.applyForRenewal) applyParts.push("Gia hạn");
  if (campaign.applyForUpgrade) applyParts.push("Nâng cấp");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Chi tiết campaign</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 transition-colors cursor-pointer">
            <X size={20} className="text-white" />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <Row label="Tên" value={campaign.name} />
          {campaign.code && <Row label="Mã" value={campaign.code} />}
          {campaign.description && <Row label="Mô tả" value={campaign.description} />}
          <Row
            label="Giảm giá"
            value={
              <DiscountTypeBadge type={campaign.discountType} value={campaign.discountValue} />
            }
          />
          <Row label="Độ ưu tiên" value={String(campaign.priority)} />
          <Row label="Thời gian" value={`${campaign.startDate} → ${campaign.endDate}`} />
          <Row label="Áp dụng cho" value={applyParts.join(", ") || "—"} />
          {scopeParts.length > 0 && <Row label="Phạm vi" value={scopeParts.join(" · ")} />}
          <Row label="Trạng thái" value={<StatusBadge isActive={campaign.isActive} />} />
          <Row label="Hiệu lực ngay" value={<ApplicableBadge isCurrentlyApplicable={campaign.isCurrentlyApplicable} />} />
        </div>
        <div className="border-t border-gray-100 px-6 py-4 flex justify-end bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-32 flex-shrink-0 text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-900 font-medium flex-1">{value}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DiscountCampaignsPage() {
  const { toast } = useToast();
  const { selectedBranchId } = useBranchFilter();

  const [campaigns, setCampaigns] = useState<DiscountCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [tuitionPlans, setTuitionPlans] = useState<TuitionPlan[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "true" | "false">("ALL");
  const [applicableFilter, setApplicableFilter] = useState<"ALL" | "true" | "false">("ALL");

  // Sort & Pagination
  const [sortField, setSortField] = useState<SortField | null>("priority");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formInitial, setFormInitial] = useState<CampaignFormData | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [detailCampaign, setDetailCampaign] = useState<DiscountCampaign | null>(null);

  const [toggleTarget, setToggleTarget] = useState<DiscountCampaign | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  // ── Load data ──────────────────────────────────────────────────────────────

  async function loadCampaigns() {
    setLoading(true);
    try {
      const result = await getDiscountCampaigns({ pageSize: 200 });
      setCampaigns(result.items);
    } catch (err: any) {
      toast({ title: "Lỗi", description: err?.message || "Không thể tải danh sách khuyến mãi.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCampaigns();
    getAllProgramsForDropdown().then(setPrograms).catch(() => setPrograms([]));
    getTuitionPlans({ pageSize: 200 }).then(setTuitionPlans).catch(() => setTuitionPlans([]));
  }, []);

  // ── Computed rows ──────────────────────────────────────────────────────────

  const rows = useMemo(() => {
    const kw = searchTerm.trim().toLowerCase();
    let filtered = campaigns.filter((c) => {
      if (kw && !c.name.toLowerCase().includes(kw) && !(c.code ?? "").toLowerCase().includes(kw)) return false;
      if (statusFilter !== "ALL" && String(c.isActive) !== statusFilter) return false;
      if (applicableFilter !== "ALL" && String(c.isCurrentlyApplicable) !== applicableFilter) return false;
      return true;
    });

    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let av: string | number = "";
        let bv: string | number = "";
        switch (sortField) {
          case "name": av = a.name; bv = b.name; break;
          case "discountValue": av = a.discountValue; bv = b.discountValue; break;
          case "priority": av = a.priority; bv = b.priority; break;
          case "startDate": av = a.startDate; bv = b.startDate; break;
          case "endDate": av = a.endDate; bv = b.endDate; break;
          case "status": av = String(a.isActive); bv = String(b.isActive); break;
        }
        if (typeof av === "number" && typeof bv === "number") {
          return sortDirection === "asc" ? av - bv : bv - av;
        }
        return sortDirection === "asc"
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av));
      });
    }
    return filtered;
  }, [campaigns, searchTerm, statusFilter, applicableFilter, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const stats = useMemo(() => ({
    total: campaigns.length,
    active: campaigns.filter((c) => c.isActive).length,
    applicable: campaigns.filter((c) => c.isCurrentlyApplicable).length,
  }), [campaigns]);

  // ── Sort handler ───────────────────────────────────────────────────────────

  function handleSort(field: SortField) {
    if (sortField === field) {
      if (sortDirection === "asc") setSortDirection("desc");
      else if (sortDirection === "desc") { setSortField(null); setSortDirection(null); }
      else setSortDirection("asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setPage(1);
  }

  // ── CRUD handlers ──────────────────────────────────────────────────────────

  function openCreate() {
    setFormMode("create");
    setFormInitial(null);
    setEditingId(null);
    setIsFormOpen(true);
  }

  async function openEdit(campaign: DiscountCampaign) {
    try {
      const detail = await getDiscountCampaignById(campaign.id);
      setFormMode("edit");
      setEditingId(detail.id);
      setFormInitial({
        name: detail.name,
        code: detail.code ?? "",
        description: detail.description ?? "",
        branchId: detail.branchId ?? "",
        programId: detail.programId ?? "",
        tuitionPlanId: detail.tuitionPlanId ?? "",
        discountType: detail.discountType,
        discountValue: String(detail.discountValue),
        priority: String(detail.priority),
        startDate: detail.startDate,
        endDate: detail.endDate,
        applyForInitialRegistration: detail.applyForInitialRegistration,
        applyForRenewal: detail.applyForRenewal,
        applyForUpgrade: detail.applyForUpgrade,
      });
      setIsFormOpen(true);
    } catch (err: any) {
      toast({ title: "Lỗi", description: err?.message || "Không thể tải chi tiết campaign.", variant: "destructive" });
    }
  }

  async function handleFormSubmit(data: CampaignFormData): Promise<boolean> {
    const payload: CreateDiscountCampaignRequest = {
      name: data.name.trim(),
      code: data.code.trim() || null,
      description: data.description.trim() || null,
      branchId: data.branchId || null,
      programId: data.programId || null,
      tuitionPlanId: data.tuitionPlanId || null,
      discountType: data.discountType,
      discountValue: Number(data.discountValue),
      priority: Number(data.priority),
      startDate: data.startDate,
      endDate: data.endDate,
      applyForInitialRegistration: data.applyForInitialRegistration,
      applyForRenewal: data.applyForRenewal,
      applyForUpgrade: data.applyForUpgrade,
    };

    try {
      if (formMode === "create") {
        await createDiscountCampaign(payload);
        toast({ title: "Tạo thành công", description: `Campaign "${data.name}" đã được tạo.`, variant: "success" });
      } else if (editingId) {
        await updateDiscountCampaign(editingId, payload);
        toast({ title: "Cập nhật thành công", description: `Campaign "${data.name}" đã được cập nhật.`, variant: "success" });
      }
      await loadCampaigns();
      return true;
    } catch (err: any) {
      const msg = getDomainErrorMessage(err) || err?.message || "Thao tác thất bại.";
      toast({ title: "Lỗi", description: msg, variant: "destructive" });
      return false;
    }
  }

  async function confirmToggle() {
    if (!toggleTarget) return;
    setIsToggling(true);
    try {
      await toggleDiscountCampaignStatus(toggleTarget.id);
      toast({
        title: "Thành công",
        description: `Campaign "${toggleTarget.name}" đã được ${toggleTarget.isActive ? "tắt" : "bật"}.`,
        variant: "success",
      });
      await loadCampaigns();
    } catch (err: any) {
      const msg = getDomainErrorMessage(err) || err?.message || "Không thể thay đổi trạng thái.";
      toast({ title: "Lỗi", description: msg, variant: "destructive" });
    } finally {
      setIsToggling(false);
      setToggleTarget(null);
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="space-y-6 bg-gray-50 p-4 md:p-6 rounded-3xl">
        {/* Title */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 shadow-lg">
              <Tag className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Khuyến mãi đăng ký</h1>
              <p className="text-sm text-gray-600">Quản lý discount campaign áp dụng cho registration</p>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:shadow-lg text-white font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={18} /> Tạo campaign
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Tổng campaign", value: stats.total, color: "bg-red-100 text-red-600" },
            { label: "Đang bật", value: stats.active, color: "bg-green-100 text-green-600" },
            { label: "Đang áp dụng", value: stats.applicable, color: "bg-emerald-100 text-emerald-700" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition">
              <div className="flex items-center gap-3">
                <span className={cn("w-10 h-10 rounded-xl grid place-items-center", color)}>
                  <Tag size={18} />
                </span>
                <div>
                  <div className="text-sm text-gray-600">{label}</div>
                  <div className="text-2xl font-extrabold text-gray-900">{value}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                placeholder="Tìm theo tên hoặc mã campaign..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as typeof statusFilter); setPage(1); }}>
              <SelectTrigger className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm min-w-[150px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                <SelectItem value="true">Đang bật</SelectItem>
                <SelectItem value="false">Đã tắt</SelectItem>
              </SelectContent>
            </Select>
            <Select value={applicableFilter} onValueChange={(v) => { setApplicableFilter(v as typeof applicableFilter); setPage(1); }}>
              <SelectTrigger className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm min-w-[160px]">
                <SelectValue placeholder="Hiệu lực" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả hiệu lực</SelectItem>
                <SelectItem value="true">Đang áp dụng</SelectItem>
                <SelectItem value="false">Chưa/Hết hạn</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200">
                <tr>
                  <SortableHeader field="name" currentField={sortField} direction={sortDirection} onSort={handleSort}>Tên</SortableHeader>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Loại / Giá trị</th>
                  <SortableHeader field="priority" currentField={sortField} direction={sortDirection} onSort={handleSort}>Ưu tiên</SortableHeader>
                  <SortableHeader field="startDate" currentField={sortField} direction={sortDirection} onSort={handleSort}>Thời gian</SortableHeader>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Phạm vi</th>
                  <SortableHeader field="status" currentField={sortField} direction={sortDirection} onSort={handleSort}>Trạng thái</SortableHeader>
                  <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <Loader2 size={28} className="animate-spin text-red-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Đang tải...</p>
                    </td>
                  </tr>
                ) : pagedRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-14 text-center">
                      <Search size={28} className="text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Không tìm thấy campaign nào.</p>
                    </td>
                  </tr>
                ) : (
                  pagedRows.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-sm text-gray-900">{c.name}</div>
                        {c.code && <div className="text-xs text-gray-400 font-mono">{c.code}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <DiscountTypeBadge type={c.discountType} value={c.discountValue} />
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 font-semibold">{c.priority}</td>
                      <td className="py-3 px-4">
                        <div className="text-xs text-gray-600">{c.startDate}</div>
                        <div className="text-xs text-gray-400">→ {c.endDate}</div>
                        <ApplicableBadge isCurrentlyApplicable={c.isCurrentlyApplicable} />
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-600 max-w-[180px]">
                        <div className="truncate">{c.programName ?? "Tất cả"}</div>
                        {c.tuitionPlanName && (
                          <div className="truncate text-gray-400">{c.tuitionPlanName}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge isActive={c.isActive} />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setDetailCampaign(c)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => openEdit(c)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-800 transition-colors cursor-pointer"
                            title="Chỉnh sửa"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setToggleTarget(c)}
                            className={cn(
                              "p-1.5 rounded-lg transition-colors cursor-pointer",
                              c.isActive
                                ? "hover:bg-gray-100 text-gray-400 hover:text-gray-800"
                                : "hover:bg-red-50 text-gray-400 hover:text-red-600"
                            )}
                            title={c.isActive ? "Tắt campaign" : "Bật campaign"}
                          >
                            {c.isActive ? <PowerOff size={14} /> : <Power size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {rows.length > 0 && (
            <div className="border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Hiển thị{" "}
                <span className="font-semibold text-gray-900">
                  {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, rows.length)}
                </span>{" "}
                / <span className="font-semibold text-gray-900">{rows.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      "min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-all cursor-pointer",
                      p === currentPage
                        ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
                        : "border border-red-200 hover:bg-red-50 text-gray-700"
                    )}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      <CampaignFormModal
        isOpen={isFormOpen}
        mode={formMode}
        initialData={formInitial}
        programs={programs}
        tuitionPlans={tuitionPlans}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      {/* Detail Modal */}
      <CampaignDetailModal
        campaign={detailCampaign}
        onClose={() => setDetailCampaign(null)}
      />

      {/* Toggle Status Confirm */}
      <ConfirmModal
        isOpen={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={confirmToggle}
        title={toggleTarget?.isActive ? "Tắt campaign" : "Bật campaign"}
        message={
          toggleTarget?.isActive
            ? `Tắt campaign "${toggleTarget?.name}"? Campaign sẽ ngừng được áp dụng.`
            : `Bật campaign "${toggleTarget?.name}"? Campaign sẽ có thể được áp dụng trong khoảng thời gian đã cấu hình.`
        }
        confirmText={toggleTarget?.isActive ? "Tắt" : "Bật"}
        cancelText="Hủy"
        variant={toggleTarget?.isActive ? "warning" : "success"}
        isLoading={isToggling}
      />
    </>
  );
}
