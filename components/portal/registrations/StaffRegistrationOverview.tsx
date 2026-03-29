"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowUpDown,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Eye,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import LeadPagination from "@/components/portal/leads/LeadPagination";
import { useToast } from "@/hooks/use-toast";
import {
  getRegistrationById,
  getRegistrations,
} from "@/lib/api/registrationService";
import type { Registration, RegistrationStatus } from "@/types/registration";
import RegistrationFilters from "./RegistrationFilters";

type Props = {
  branchId?: string;
  onTotalChange?: (total: number) => void;
};

type RegistrationDetailModalProps = {
  item: Registration | null;
  isLoading: boolean;
  onClose: () => void;
};

type RegistrationSortKey =
  | "studentName"
  | "programName"
  | "tuitionPlanName"
  | "className"
  | "status"
  | "createdAt";

function statusLabel(status: RegistrationStatus) {
  const labels: Record<RegistrationStatus, string> = {
    New: "Mới",
    WaitingForClass: "Chờ xếp lớp",
    Studying: "Đang học",
    Paused: "Tạm dừng",
    Completed: "Hoàn thành",
    Cancelled: "Đã hủy",
  };
  return labels[status];
}

function statusClass(status: RegistrationStatus) {
  const classes: Record<RegistrationStatus, string> = {
    New: "border border-blue-200 bg-blue-50 text-blue-700",
    WaitingForClass: "border border-amber-200 bg-amber-50 text-amber-700",
    Studying: "border border-green-200 bg-green-50 text-green-700",
    Paused: "border border-orange-200 bg-orange-50 text-orange-700",
    Completed: "border border-emerald-200 bg-emerald-50 text-emerald-700",
    Cancelled: "border border-red-200 bg-red-50 text-red-700",
  };
  return classes[status];
}

function toDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("vi-VN");
}

function toDateTime(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("vi-VN");
}

function statusBadgeClass(status: RegistrationStatus) {
  const classes: Record<RegistrationStatus, string> = {
    New: "bg-blue-100 text-blue-700",
    WaitingForClass: "bg-amber-100 text-amber-700",
    Studying: "bg-emerald-100 text-emerald-700",
    Paused: "bg-orange-100 text-orange-700",
    Completed: "bg-emerald-100 text-emerald-700",
    Cancelled: "bg-rose-100 text-rose-700",
  };
  return classes[status];
}

function RegistrationDetailModal({
  item,
  isLoading,
  onClose,
}: RegistrationDetailModalProps) {
  if (!item && !isLoading) return null;

  if (typeof window === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-9999 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-red-100 bg-linear-to-r from-red-600 to-red-700 px-5 py-3 text-white">
          <h3 className="text-lg font-semibold">Chi tiết đăng ký</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-white/15"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-gray-600">
            <Loader2 size={16} className="animate-spin" /> Đang tải chi tiết...
          </div>
        ) : item ? (
          <div className="space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50/50 p-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Học viên</div>
                <div className="text-lg font-semibold text-gray-900">{item.studentName || "-"}</div>
              </div>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusBadgeClass(item.status)}`}>
                {statusLabel(item.status)}
              </span>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Thông tin chương trình</h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Info label="Chương trình" value={item.programName || "-"} />
                <Info label="Gói học" value={item.tuitionPlanName || "-"} />
                <Info label="Lớp" value={item.className || "Chưa xếp lớp"} />
                <Info label="Buổi còn lại" value={String(item.remainingSessions ?? 0)} />
              </div>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Thông tin lịch học</h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Info label="Ngày dự kiến" value={toDate(item.expectedStartDate)} />
                <Info label="Ngày bắt đầu thực tế" value={toDate(item.actualStartDate)} />
                <Info label="Lịch học mong muốn" value={item.preferredSchedule || "-"} />
                <Info label="Ngày hết hạn" value={toDate(item.expiryDate)} />
              </div>
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50/40 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Thông tin hệ thống</h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Info label="Ngày tạo" value={toDateTime(item.createdAt)} />
                <Info label="Cập nhật lần cuối" value={toDateTime(item.updatedAt)} />
              </div>
              <Info label="Ghi chú" value={item.note || "-"} />
            </div>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-1 break-all text-sm font-semibold text-gray-900">
        {value}
      </div>
    </div>
  );
}

export default function StaffRegistrationOverview({
  branchId,
  onTotalChange,
}: Props) {
  const { toast } = useToast();
  const [rows, setRows] = useState<Registration[]>([]);
  const [summaryRows, setSummaryRows] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | RegistrationStatus>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<Registration | null>(
    null,
  );
  const [sortKey, setSortKey] = useState<RegistrationSortKey | null>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const registrationStatusCounts = useMemo(() => {
    const counts: Record<"ALL" | RegistrationStatus, number> = {
      ALL: summaryRows.length,
      New: summaryRows.filter((r) => r.status === "New").length,
      WaitingForClass: summaryRows.filter((r) => r.status === "WaitingForClass")
        .length,
      Studying: summaryRows.filter((r) => r.status === "Studying").length,
      Completed: summaryRows.filter((r) => r.status === "Completed").length,
      Paused: 0,
      Cancelled: 0,
    };
    return counts;
  }, [summaryRows]);

  const fetchSummary = useCallback(async () => {
    if (!branchId) {
      setSummaryRows([]);
      onTotalChange?.(0);
      return;
    }

    try {
      const response = await getRegistrations({
        branchId,
        pageNumber: 1,
        pageSize: 1000,
      });
      const items = response.items || [];
      const nextTotal = Math.max(
        Number(response.totalCount || 0),
        items.length,
      );
      setSummaryRows(items);
      onTotalChange?.(nextTotal);
    } catch (error: any) {
      setSummaryRows([]);
      onTotalChange?.(0);
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể tải thống kê đăng ký.",
        variant: "destructive",
      });
    }
  }, [branchId, onTotalChange, toast]);

  const fetchRows = useCallback(async () => {
    if (!branchId) {
      setRows([]);
      setTotalCount(0);
      setTotalPages(1);
      return;
    }

    try {
      setLoading(true);
      const response = await getRegistrations({
        branchId,
        status: status === "ALL" ? undefined : status,
        pageNumber: currentPage,
        pageSize,
      });
      setRows(response.items || []);
      const nextTotal = Math.max(
        Number(response.totalCount || 0),
        (response.items || []).length,
      );
      setTotalCount(nextTotal);
      setTotalPages(response.totalPages || 1);
      if (status === "ALL") {
        onTotalChange?.(nextTotal);
      }
    } catch (error: any) {
      setRows([]);
      setTotalCount(0);
      setTotalPages(1);
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể tải danh sách đăng ký.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [branchId, currentPage, pageSize, status, toast, onTotalChange]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    setCurrentPage(1);
  }, [status, query]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const qMatched =
        !q ||
        [
          r.id,
          r.studentName || "",
          r.programName || "",
          r.tuitionPlanName || "",
          r.className || "",
          r.note || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      return qMatched;
    });
  }, [rows, query, status]);

  const sortedRows = useMemo(() => {
    if (!sortKey) return filteredRows;

    const copy = [...filteredRows];
    copy.sort((a, b) => {
      if (sortKey === "createdAt") {
        const av = new Date(a.createdAt || "").getTime();
        const bv = new Date(b.createdAt || "").getTime();
        const an = Number.isNaN(av) ? 0 : av;
        const bn = Number.isNaN(bv) ? 0 : bv;
        return sortDir === "asc" ? an - bn : bn - an;
      }

      const getValue = (row: Registration) => {
        switch (sortKey) {
          case "studentName":
            return row.studentName || "";
          case "programName":
            return row.programName || "";
          case "tuitionPlanName":
            return row.tuitionPlanName || "";
          case "className":
            return row.className || "";
          case "status":
            return statusLabel(row.status);
          default:
            return "";
        }
      };

      const av = getValue(a);
      const bv = getValue(b);
      const compared = av.localeCompare(bv, "vi", {
        numeric: true,
        sensitivity: "base",
      });
      return sortDir === "asc" ? compared : -compared;
    });

    return copy;
  }, [filteredRows, sortKey, sortDir]);

  const handleSort = (key: RegistrationSortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir(key === "createdAt" ? "desc" : "asc");
      return;
    }

    if (sortDir === "asc") {
      setSortDir("desc");
      return;
    }

    setSortKey(null);
    setSortDir("asc");
  };

  const SortHeader = ({
    label,
    keyName,
  }: {
    label: string;
    keyName: RegistrationSortKey;
  }) => (
    <th className="px-4 py-3">
      <button
        type="button"
        onClick={() => handleSort(keyName)}
        className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wide font-semibold text-gray-600 hover:text-red-700 cursor-pointer"
      >
        {label}
        <ArrowUpDown
          size={12}
          className={sortKey === keyName ? "text-red-600" : "text-gray-400"}
        />
      </button>
    </th>
  );

  const statCards = useMemo(() => {
    const waiting = summaryRows.filter(
      (r) => r.status === "WaitingForClass",
    ).length;
    const studying = summaryRows.filter((r) => r.status === "Studying").length;
    const completed = summaryRows.filter(
      (r) => r.status === "Completed",
    ).length;
    return [
      {
        title: "Đăng ký mới",
        value: summaryRows.length,
        subtitle: "Tổng hồ sơ đăng ký",
        icon: Sparkles,
        color: "from-red-600 to-red-700",
      },
      {
        title: "Chờ xếp lớp",
        value: waiting,
        subtitle: "Đang chờ phân lớp",
        icon: Clock3,
        color: "from-gray-600 to-gray-700",
      },
      {
        title: "Đang học",
        value: studying,
        subtitle: "Đang theo lớp",
        icon: BookOpen,
        color: "from-gray-700 to-gray-800",
      },
      {
        title: "Hoàn thành",
        value: completed,
        subtitle: "Đã kết thúc chương trình",
        icon: CheckCircle2,
        color: "from-red-500 to-red-600",
      },
    ];
  }, [summaryRows]);

  const openDetail = async (id: string) => {
    try {
      setDetailOpen(true);
      setDetailLoading(true);
      setSelectedDetail(null);
      const detail = await getRegistrationById(id);
      setSelectedDetail(detail);
    } catch (error: any) {
      setDetailOpen(false);
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể tải chi tiết đăng ký.",
        variant: "destructive",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!branchId && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Chưa xác định được chi nhánh của staff. Không thể tải dữ liệu đăng ký.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:border-red-300 hover:shadow-md"
            >
              <div
                className={`absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-5 blur-xl bg-linear-to-r ${item.color}`}
              />
              <div className="relative flex items-center justify-between gap-3">
                <div
                  className={`rounded-xl bg-linear-to-r ${item.color} p-2 text-white shadow-sm`}
                >
                  <Icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium text-gray-600">
                    {item.title}
                  </div>
                  <div className="leading-tight text-xl font-bold text-gray-900">
                    {item.value}
                  </div>
                  <div className="truncate text-[11px] text-gray-500">
                    {item.subtitle}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <RegistrationFilters
        searchQuery={query}
        selectedStatus={status}
        pageSize={pageSize}
        statusCounts={registrationStatusCounts}
        onSearchChange={setQuery}
        onStatusChange={setStatus}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
      />

      <div className="rounded-2xl border border-red-200 bg-linear-to-br from-white to-red-50/30 shadow-sm overflow-hidden">
        <div className="bg-linear-to-r from-red-500/10 to-red-700/10 border-b border-red-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Danh sách Đăng ký
            </h3>
            <button
              type="button"
              onClick={() => {
                fetchRows();
                fetchSummary();
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 cursor-pointer"
            >
              <RefreshCw size={14} /> Làm mới
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-220">
            <thead className="bg-linear-to-r from-red-500/5 to-red-700/5 border-b border-red-200 text-left text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <SortHeader label="Học viên" keyName="studentName" />
                <SortHeader label="Chương trình" keyName="programName" />
                <SortHeader label="Gói học" keyName="tuitionPlanName" />
                <SortHeader label="Lớp" keyName="className" />
                <SortHeader label="Trạng thái" keyName="status" />
                <SortHeader label="Ngày tạo" keyName="createdAt" />
                <th className="px-4 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sm text-gray-600"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" /> Đang tải
                      danh sách đăng ký...
                    </span>
                  </td>
                </tr>
              ) : sortedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sm text-gray-500"
                  >
                    Không có đăng ký nào phù hợp bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                sortedRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-red-100 text-sm text-gray-800 hover:bg-red-50/30"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {row.studentName || "-"}
                    </td>
                    <td className="px-4 py-3">{row.programName || "-"}</td>
                    <td className="px-4 py-3">{row.tuitionPlanName || "-"}</td>
                    <td className="px-4 py-3">
                      {row.className || "Chưa xếp lớp"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(row.status)}`}
                      >
                        {statusLabel(row.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">{toDate(row.createdAt)}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => openDetail(row.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600 cursor-pointer"
                      >
                        <Eye size={12} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && rows.length > 0 && (
          <LeadPagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            itemLabel="đăng ký"
          />
        )}
      </div>

      {detailOpen && (
        <RegistrationDetailModal
          item={selectedDetail}
          isLoading={detailLoading}
          onClose={() => {
            setDetailOpen(false);
            setSelectedDetail(null);
          }}
        />
      )}
    </div>
  );
}
