"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
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
import { useToast } from "@/hooks/use-toast";
import { getRegistrationById, getRegistrations } from "@/lib/api/registrationService";
import type { Registration, RegistrationStatus } from "@/types/registration";

type Props = {
  branchId?: string;
  onTotalChange?: (total: number) => void;
};

type RegistrationDetailModalProps = {
  item: Registration | null;
  isLoading: boolean;
  onClose: () => void;
};

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
    New: "border border-red-200 bg-red-50 text-red-700",
    WaitingForClass: "border border-yellow-200 bg-yellow-50 text-yellow-700",
    Studying: "border border-gray-200 bg-gray-50 text-gray-700",
    Paused: "border border-gray-200 bg-gray-50 text-gray-700",
    Completed: "border border-red-200 bg-red-50 text-red-700",
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

function RegistrationDetailModal({ item, isLoading, onClose }: RegistrationDetailModalProps) {
  if (!item && !isLoading) return null;

  if (typeof window === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-9999 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between border-b border-red-100 bg-linear-to-r from-red-600 to-red-700 px-5 py-3 text-white">
          <h3 className="text-lg font-semibold">Chi tiết đăng ký</h3>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 hover:bg-white/15" aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-gray-600">
            <Loader2 size={16} className="animate-spin" /> Đang tải chi tiết...
          </div>
        ) : item ? (
          <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2">
            <Info label="Registration ID" value={item.id} />
            <Info label="Học viên" value={item.studentName || "-"} />
            <Info label="Chương trình" value={item.programName || "-"} />
            <Info label="Gói học" value={item.tuitionPlanName || "-"} />
            <Info label="Trạng thái" value={statusLabel(item.status)} />
            <Info label="Lớp" value={item.className || "Chưa xếp lớp"} />
            <Info label="Ngày dự kiến" value={toDate(item.expectedStartDate)} />
            <Info label="Ngày tạo" value={toDate(item.createdAt)} />
            <div className="md:col-span-2">
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
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 break-all text-sm font-semibold text-gray-900">{value}</div>
    </div>
  );
}

export default function StaffRegistrationOverview({ branchId, onTotalChange }: Props) {
  const { toast } = useToast();
  const [rows, setRows] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | RegistrationStatus>("ALL");
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<Registration | null>(null);

  const fetchRows = useCallback(async () => {
    if (!branchId) {
      setRows([]);
      onTotalChange?.(0);
      return;
    }

    try {
      setLoading(true);
      const response = await getRegistrations({ branchId, pageNumber: 1, pageSize: 500 });
      setRows(response.items || []);
      onTotalChange?.(response.totalCount || response.items.length);
    } catch (error: any) {
      setRows([]);
      onTotalChange?.(0);
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể tải danh sách đăng ký.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [branchId, onTotalChange, toast]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const statusMatched = status === "ALL" || r.status === status;
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
      return statusMatched && qMatched;
    });
  }, [rows, query, status]);

  const statusOptions = useMemo(() => {
    const unique = Array.from(new Set(rows.map((x) => x.status)));
    return ["ALL", ...unique] as Array<"ALL" | RegistrationStatus>;
  }, [rows]);

  const statCards = useMemo(() => {
    const waiting = rows.filter((r) => r.status === "WaitingForClass").length;
    const studying = rows.filter((r) => r.status === "Studying").length;
    const completed = rows.filter((r) => r.status === "Completed").length;
    return [
      {
        title: "Đăng ký mới",
        value: rows.length,
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
  }, [rows]);

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
              <div className={`absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-5 blur-xl bg-linear-to-r ${item.color}`} />
              <div className="relative flex items-center justify-between gap-3">
                <div className={`rounded-xl bg-linear-to-r ${item.color} p-2 text-white shadow-sm`}>
                  <Icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium text-gray-600">{item.title}</div>
                  <div className="leading-tight text-xl font-bold text-gray-900">{item.value}</div>
                  <div className="truncate text-[11px] text-gray-500">{item.subtitle}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-red-100 p-2 text-red-700">
              <ClipboardList size={16} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Quản lý đăng ký học</h3>
              <p className="text-xs text-gray-500">Dữ liệu đăng ký theo chi nhánh hiện tại</p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchRows}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            <RefreshCw size={14} /> Làm mới
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo học viên, chương trình, gói học, ghi chú..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "ALL" | RegistrationStatus)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
          >
            {statusOptions.map((item) => (
              <option key={item} value={item}>
                {item === "ALL" ? "Tất cả trạng thái" : statusLabel(item)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-red-200 bg-linear-to-br from-white to-red-50/30 shadow-sm overflow-hidden">
        <div className="bg-linear-to-r from-red-500/10 to-red-700/10 border-b border-red-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Danh sách Đăng ký</h3>
            <div className="text-sm text-gray-600">{filteredRows.length} đăng ký</div>
          </div>
        </div>

        <div className="overflow-x-auto">
        <table className="w-full min-w-240">
          <thead className="bg-linear-to-r from-red-500/5 to-red-700/5 border-b border-red-200 text-left text-xs uppercase tracking-wide text-gray-600">
            <tr>
              <th className="px-4 py-3">Registration ID</th>
              <th className="px-4 py-3">Học viên</th>
              <th className="px-4 py-3">Chương trình</th>
              <th className="px-4 py-3">Gói học</th>
              <th className="px-4 py-3">Lớp</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Ngày tạo</th>
              <th className="px-4 py-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-600">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" /> Đang tải danh sách đăng ký...
                  </span>
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-500">
                  Không có đăng ký nào phù hợp bộ lọc hiện tại.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.id} className="border-t border-red-100 text-sm text-gray-800 hover:bg-red-50/30">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{row.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{row.studentName || "-"}</td>
                  <td className="px-4 py-3">{row.programName || "-"}</td>
                  <td className="px-4 py-3">{row.tuitionPlanName || "-"}</td>
                  <td className="px-4 py-3">{row.className || "Chưa xếp lớp"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(row.status)}`}>
                      {statusLabel(row.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">{toDate(row.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openDetail(row.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                    >
                      <Eye size={12} /> Chi tiết
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
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
