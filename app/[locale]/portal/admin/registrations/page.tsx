"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  ClipboardList,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  Users,
  UserPlus,
  Sparkles,
  Wallet,
  Check,
  CheckCircle2,
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { useBranchFilter } from "@/hooks/useBranchFilter";
import {
  getRegistrationById,
  getRegistrations,
} from "@/lib/api/registrationService";
import RegistrationCompletionPdfModal from "@/components/portal/registrations/modals/RegistrationCompletionPdfModal";
import RegistrationDetailModal from "@/components/portal/registrations/modals/RegistrationDetailModal";
import type { Registration, RegistrationStatus } from "@/types/registration";

function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

function getStudentInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type SortField =
  | "studentName"
  | "programName"
  | "tuitionPlanName"
  | "expectedStartDate"
  | "className"
  | "status"
  | "createdAt";

type SortDirection = "asc" | "desc" | null;

type RegistrationRow = {
  id: string;
  studentName: string;
  programName: string;
  secondaryProgramName?: string | null;
  tuitionPlanName: string;
  expectedStartDate: string;
  className: string;
  secondaryClassName?: string | null;
  status: RegistrationStatus;
  createdAt: string;
};

const PAGE_SIZE = 10;

function toDateOrFallback(value: string): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("vi-VN");
}

function toRow(item: Registration): RegistrationRow {
  return {
    id: item.id,
    studentName: item.studentName || "-",
    programName: item.programName || "-",
    secondaryProgramName: item.secondaryProgramName || null,
    tuitionPlanName: item.tuitionPlanName || "-",
    expectedStartDate: toDateOrFallback(item.expectedStartDate),
    className: item.className || "Chưa xếp lớp",
    secondaryClassName: item.secondaryClassName || null,
    status: item.status,
    createdAt: toDateOrFallback(item.createdAt),
  };
}

function StatusBadge({ value }: { value: RegistrationStatus }) {
  const styleMap: Record<RegistrationStatus, string> = {
    New: "bg-blue-100 text-blue-700 border border-blue-200",
    WaitingForClass: "bg-amber-100 text-amber-700 border border-amber-200",
    ClassAssigned: "bg-cyan-100 text-cyan-700 border border-cyan-200",
    Studying: "bg-green-100 text-green-700 border border-green-200",
    Paused: "bg-gray-100 text-gray-700 border border-gray-200",
    Completed: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    Cancelled: "bg-red-100 text-red-700 border border-red-200",
  };

  const labelMap: Record<RegistrationStatus, string> = {
    New: "Mới",
    WaitingForClass: "Chờ xếp lớp",
    ClassAssigned: "Đã xếp lớp",
    Studying: "Đang học",
    Paused: "Tạm dừng",
    Completed: "Hoàn thành",
    Cancelled: "Đã hủy",
  };

  return (
    <span
      className={cn(
        "px-2.5 py-1 rounded-full text-xs font-semibold",
        styleMap[value],
      )}
    >
      <CheckCircle size={12} className="inline-block mr-1 text-current" />
      {labelMap[value]}
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
    direction === "asc" ? (
      <ArrowUp size={14} className="text-red-600" />
    ) : (
      <ArrowDown size={14} className="text-red-600" />
    )
  ) : (
    <ArrowUpDown size={14} className="text-gray-400" />
  );

  const alignClass =
    align === "center"
      ? "text-center"
      : align === "right"
        ? "text-right"
        : "text-left";

  return (
    <th
      onClick={() => onSort(field)}
      className={`py-3 px-4 ${alignClass} text-sm font-semibold tracking-wide text-gray-700 whitespace-nowrap cursor-pointer select-none hover:bg-red-50 transition-colors`}
    >
      <span className="inline-flex items-center gap-2">
        {children}
        {icon}
      </span>
    </th>
  );
}

export default function AdminRegistrationsPage() {
  const { toast } = useToast();
  const { selectedBranchId, isLoaded } = useBranchFilter();

  const [rows, setRows] = useState<RegistrationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | RegistrationStatus>(
    "ALL",
  );
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [page, setPage] = useState(1);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<Registration | null>(
    null,
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const [isCompletionPdfOpen, setIsCompletionPdfOpen] = useState(false);
  const [completionPdfRow, setCompletionPdfRow] =
    useState<RegistrationRow | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await getRegistrations({
        branchId: selectedBranchId || undefined,
        pageNumber: 1,
        pageSize: 500,
      });
      setRows(response.items.map(toRow));
    } catch (error: any) {
      setRows([]);
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể tải danh sách đăng ký lớp.",
        type: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    loadData();
    setPage(1);
  }, [isLoaded, selectedBranchId]);

  const statusOptions = useMemo(() => {
    const list = Array.from(new Set(rows.map((x) => x.status).filter(Boolean)));
    return ["ALL", ...list];
  }, [rows]);

  const statusLabel = (value: "ALL" | RegistrationStatus) => {
    if (value === "ALL") return "Tất cả trạng thái";
    const map: Record<RegistrationStatus, string> = {
      New: "Mới",
      WaitingForClass: "Chờ xếp lớp",
      ClassAssigned: "Đã xếp lớp",
      Studying: "Đang học",
      Paused: "Tạm dừng",
      Completed: "Hoàn thành",
      Cancelled: "Đã hủy",
    };
    return map[value];
  };

  const filteredRows = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    let result = rows.filter((row) => {
      const matchedKeyword =
        !keyword ||
        [
          row.studentName,
          row.programName,
          row.tuitionPlanName,
          row.className,
          row.status,
        ].some((x) => x.toLowerCase().includes(keyword));

      const matchedStatus =
        statusFilter === "ALL" || row.status === statusFilter;

      return matchedKeyword && matchedStatus;
    });

    if (sortField && sortDirection) {
      result = [...result].sort((a, b) => {
        const av = a[sortField];
        const bv = b[sortField];
        return sortDirection === "asc"
          ? av.localeCompare(bv, undefined, { numeric: true })
          : bv.localeCompare(av, undefined, { numeric: true });
      });
    }

    return result;
  }, [rows, query, statusFilter, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = filteredRows.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") setSortDirection("desc");
      else if (sortDirection === "desc") {
        setSortField(null);
        setSortDirection(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const openDetail = async (id: string) => {
    try {
      setIsDetailOpen(true);
      setDetailLoading(true);
      setSelectedDetail(null);
      const detail = await getRegistrationById(id);
      setSelectedDetail(detail);
    } catch (error: any) {
      setIsDetailOpen(false);
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể tải chi tiết đăng ký.",
        type: "destructive",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-6 bg-gray-50 p-4 md:p-2 rounded-3xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-linear-to-r from-red-600 to-red-700 shadow-lg">
              <ClipboardList className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-2xl font-extrabold text-gray-900">
                Quản lý đăng ký lớp
              </h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <Sparkles size={14} className="text-red-600" />
                Theo dõi học viên đã đăng ký chương trình học
              </p>
            </div>
          </div>

          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <RefreshCw size={16} /> Làm mới
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-102">
            <div className="absolute right-0 top-0 h-12 w-12 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl bg-gradient-to-r from-red-600 to-red-700"></div>
            <div className="relative flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 text-white grid place-items-center flex-shrink-0 shadow-sm">
                <Users size={18} />
              </span>
              <div>
                <div className="text-sm text-gray-600">Tổng đăng ký</div>
                <div className="text-2xl font-bold text-gray-900">
                  {rows.length}
                </div>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-102">
            <div className="absolute right-0 top-0 h-12 w-12 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl bg-gradient-to-r from-emerald-600 to-teal-600"></div>
            <div className="relative flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white grid place-items-center flex-shrink-0 shadow-sm">
                <CheckCircle size={18} />
              </span>
              <div>
                <div className="text-sm text-gray-600">Đã xếp lớp</div>
                <div className="text-2xl font-bold text-gray-900">
                  {rows.filter((x) => x.className !== "Chưa xếp lớp").length}
                </div>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-102">
            <div className="absolute right-0 top-0 h-12 w-12 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl bg-gradient-to-r from-blue-600 to-cyan-600"></div>
            <div className="relative flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white grid place-items-center flex-shrink-0 shadow-sm">
                <AlertCircle size={18} />
              </span>
              <div>
                <div className="text-sm text-gray-600">Chưa xếp lớp</div>
                <div className="text-2xl font-bold text-gray-900">
                  {rows.filter((x) => x.className === "Chưa xếp lớp").length}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-4">
          <div className="flex flex-wrap gap-2 pb-4 border-b border-red-200">
            {statusOptions.map((status) => {
              const count = status === "ALL" 
                ? rows.length 
                : rows.filter((r) => r.status === status as RegistrationStatus).length;
              const isActive = statusFilter === status;
              
              return (
                <button
                  key={status}
                  onClick={() => {
                    setStatusFilter(status as "ALL" | RegistrationStatus);
                    setPage(1);
                  }}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 text-sm py-2 rounded-xl border transition-all cursor-pointer  font-medium",
                    isActive
                      ? "bg-gradient-to-r from-red-600 to-red-700 text-white border-red-600 shadow-md"
                      : "bg-white border-red-200 text-gray-700 hover:bg-red-50"
                  )}
                >
                  {statusLabel(status as "ALL" | RegistrationStatus)}
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded-xl text-xs font-semibold",
                      isActive
                        ? "bg-white/30 text-white"
                        : "bg-red-50 text-red-600"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative flex-1 mt-4">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo học viên, chương trình, gói học, lớp hoặc trạng thái"
              className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-linear-to-r from-red-500/10 to-red-700/10 border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                Danh sách đăng ký lớp
              </h2>
              <div className="text-sm text-gray-600">
                <span className="font-medium">
                  {filteredRows.length} đăng ký
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-linear-to-r from-red-500/5 to-red-700/5 border-b border-gray-200">
                <tr>
                  <SortableHeader
                    field="studentName"
                    currentField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                  >
                    Học viên
                  </SortableHeader>
                  <SortableHeader
                    field="tuitionPlanName"
                    currentField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                  >
                    Gói học
                  </SortableHeader>
                  <SortableHeader
                    field="programName"
                    currentField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                  >
                    Chương trình & Lớp
                  </SortableHeader>
                  <SortableHeader
                    field="expectedStartDate"
                    currentField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                  >
                    Ngày dự kiến
                  </SortableHeader>
                  <SortableHeader
                    field="createdAt"
                    currentField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                  >
                    Tạo lúc
                  </SortableHeader>
                  <SortableHeader
                    field="status"
                    currentField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                  >
                    Trạng thái
                  </SortableHeader>
                  <th className="text-left text-sm font-medium tracking-wide text-gray-700 whitespace-nowrap">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <div className="inline-flex items-center gap-2 text-gray-600">
                        <Loader2 size={18} className="animate-spin" /> Đang tải
                        dữ liệu...
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && pagedRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-500">
                        <UserPlus size={30} className="text-gray-300" />
                        <div>Không có đăng ký phù hợp bộ lọc hiện tại.</div>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading &&
                  pagedRows.map((row) => (
                    <tr
                      key={row.id}
                      className="group hover:bg-linear-to-r hover:from-red-50/50 hover:to-white transition-all duration-200"
                    >
                      <td className="py-3 px-6 text-sm font-medium text-gray-800">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-r from-red-600 to-red-700 text-white text-[10px] font-semibold flex-shrink-0">
                            {getStudentInitials(row.studentName)}
                          </span>
                          {row.studentName}
                        </div>
                      </td>
                      <td className="py-3 px-6 text-sm text-gray-700">
                        <span className="inline-flex items-center font-medium gap-1.5">
                          <Wallet size={14} className="text-red-600 flex-shrink-0" />
                          {row.tuitionPlanName}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-sm text-gray-700">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <BookOpen size={14} className="text-red-600 flex-shrink-0" />
                            <span className="font-medium">
                              {row.secondaryProgramName
                                ? `${row.programName} • ${row.secondaryProgramName}`
                                : row.programName}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-600 font-medium">
                            <Users size={14} className="text-red-600 flex-shrink-0" />
                            <span>
                              {row.secondaryClassName
                                ? `${row.className} • ${row.secondaryClassName}`
                                : row.className}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-6 text-sm text-gray-700 font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar size={14} className="text-red-600" />{" "}
                          {row.expectedStartDate}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-sm text-gray-700 font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock size={14} className="text-red-600 flex-shrink-0" />
                          {row.createdAt}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-sm text-gray-700">
                        <StatusBadge value={row.status} />
                      </td>
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openDetail(row.id)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700 cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setCompletionPdfRow(row);
                              setIsCompletionPdfOpen(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700 cursor-pointer"
                            title="Xem/In phiếu đăng ký"
                          >
                            <FileText size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-gray-200 bg-linear-to-r from-red-500/5 to-red-700/5 px-6 py-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="text-sm text-gray-600">
                Hiển thị{" "}
                <span className="font-semibold text-gray-900">
                  {filteredRows.length === 0
                    ? 0
                    : (currentPage - 1) * PAGE_SIZE + 1}
                  -{Math.min(currentPage * PAGE_SIZE, filteredRows.length)}
                </span>{" "}
                trong tổng số{" "}
                <span className="font-semibold text-gray-900">
                  {filteredRows.length}
                </span>{" "}
                đăng ký
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="p-2 rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  aria-label="Trang trước"
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
                        onClick={() => typeof p === "number" && setPage(p)}
                        disabled={p === "..."}
                        className={cn(
                          "min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-all cursor-pointer",
                          p === currentPage
                            ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
                            : p === "..."
                              ? "cursor-default text-gray-400"
                              : "border border-red-200 hover:bg-red-50 text-gray-700"
                        )}
                      >
                        {p}
                      </button>
                    ));
                  })()}
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-2 rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  aria-label="Trang sau"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <RegistrationDetailModal
        isOpen={isDetailOpen}
        item={selectedDetail}
        isLoading={detailLoading}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedDetail(null);
        }}
      />

      <RegistrationCompletionPdfModal
        isOpen={isCompletionPdfOpen}
        registrationId={String(completionPdfRow?.id || "")}
        studentName={completionPdfRow?.studentName || ""}
        onClose={() => {
          setIsCompletionPdfOpen(false);
          setCompletionPdfRow(null);
        }}
      />
    </>
  );
}
