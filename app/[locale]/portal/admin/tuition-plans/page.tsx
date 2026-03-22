"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BookOpen,
  Building2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Search,
  Wallet,
} from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";
import TuitionPlanModal, { type TuitionPlanFormData } from "@/components/admin/tuition-plans/TuitionPlanModal";
import TuitionPlanDetailModal from "@/components/admin/tuition-plans/TuitionPlanDetailModal";
import { useToast } from "@/hooks/use-toast";
import { useBranchFilter } from "@/hooks/useBranchFilter";
import {
  createTuitionPlan,
  getTuitionPlanDetail,
  getTuitionPlans,
  toggleTuitionPlanStatus,
  updateTuitionPlan,
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

type TuitionPlanRow = {
  id: string;
  name: string;
  programName: string;
  totalSessions: string;
  tuitionAmount: string;
  branchName: string;
  status: "Đang hoạt động" | "Tạm dừng";
};

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

const PAGE_SIZE = 10;

function toRow(plan: TuitionPlan): TuitionPlanRow {
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

  const [plans, setPlans] = useState<TuitionPlanRow[]>([]);
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
  const [selectedRow, setSelectedRow] = useState<TuitionPlanRow | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detail, setDetail] = useState<TuitionPlan | null>(null);

  const hasAnyModalOpen = isCreateModalOpen || isEditModalOpen || showDetailModal || showToggleStatusModal;

  useEffect(() => {
    if (hasAnyModalOpen) {
      document.body.classList.add("tp-modal-open");
    } else {
      document.body.classList.remove("tp-modal-open");
    }

    return () => {
      document.body.classList.remove("tp-modal-open");
    };
  }, [hasAnyModalOpen]);

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

  const handleOpenEdit = async (row: TuitionPlanRow) => {
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

  const handleViewDetail = async (row: TuitionPlanRow) => {
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

  const handleToggle = (row: TuitionPlanRow) => {
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
                      <td className="py-3 px-6"><div className="text-sm text-gray-900 truncate">{r.name}</div></td>
                      <td className="py-3 px-6"><div className="text-sm text-gray-900 truncate">{r.programName || "Chưa có"}</div></td>
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
                      <td className="py-3 px-6 text-center whitespace-nowrap"><StatusBadge value={r.status} /></td>
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

      <TuitionPlanDetailModal
        open={showDetailModal}
        loading={loadingDetail}
        detail={detail}
        onClose={() => {
          setShowDetailModal(false);
          setDetail(null);
        }}
      />

      <style jsx global>{`
        body.tp-modal-open aside.sidebar-container {
          filter: brightness(0.5) saturate(0.9);
          transition: filter 0.2s ease;
        }
      `}</style>
    </>
  );
}
 