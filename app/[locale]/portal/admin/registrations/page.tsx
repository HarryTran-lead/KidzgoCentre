"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  Loader2,
  RefreshCw,
  Search,
  UserPlus,
  X,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/lightswind/select";
import { useToast } from "@/hooks/use-toast";
import { useBranchFilter } from "@/hooks/useBranchFilter";
import { getRegistrationById, getRegistrations } from "@/lib/api/registrationService";
import type { Registration, RegistrationStatus } from "@/types/registration";

function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
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
    <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", styleMap[value])}>
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
    direction === "asc" ? <ArrowUp size={14} className="text-red-600" /> : <ArrowDown size={14} className="text-red-600" />
  ) : (
    <ArrowUpDown size={14} className="text-gray-400" />
  );

  const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";

  return (
    <th
      onClick={() => onSort(field)}
      className={`py-3 px-4 ${alignClass} text-sm font-semibold tracking-wide text-gray-700 whitespace-nowrap cursor-pointer select-none hover:bg-red-50 transition-colors`}
    >
      <span className="inline-flex items-center gap-2">{children}{icon}</span>
    </th>
  );
}

export default function AdminRegistrationsPage() {
  const { toast } = useToast();
  const { selectedBranchId, isLoaded } = useBranchFilter();

  const [rows, setRows] = useState<RegistrationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | RegistrationStatus>("ALL");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [page, setPage] = useState(1);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<Registration | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

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

      const matchedStatus = statusFilter === "ALL" || row.status === statusFilter;

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
  const pagedRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
    <div className="space-y-6 bg-gray-50 p-4 md:p-6 rounded-3xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-linear-to-r from-red-600 to-red-700 shadow-lg">
            <ClipboardList className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Quản lý đăng ký lớp</h1>
            <p className="text-sm text-gray-600 mt-1">Theo dõi học viên đã đăng ký chương trình học</p>
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
        <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-linear-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="text-sm text-gray-500">Tổng đăng ký</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{rows.length}</div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-linear-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="text-sm text-gray-500">Đã xếp lớp</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{rows.filter((x) => x.className !== "Chưa xếp lớp").length}</div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-linear-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="text-sm text-gray-500">Chưa xếp lớp</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{rows.filter((x) => x.className === "Chưa xếp lớp").length}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-red-200 bg-linear-to-br from-white to-red-50 p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo học viên, chương trình, gói học, lớp hoặc trạng thái"
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:flex-nowrap">
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value as "ALL" | RegistrationStatus);
              setPage(1);
            }}>
              <SelectTrigger className="w-full sm:w-auto h-10 px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 transition-all hover:border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-200 data-[state=open]:border-red-400 data-[state=open]:ring-2 data-[state=open]:ring-red-200 [&>span]:text-gray-500 [&>span]:line-clamp-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {statusLabel(status as "ALL" | RegistrationStatus)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-linear-to-r from-red-500/10 to-red-700/10 border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Danh sách đăng ký lớp</h2>
            <div className="text-sm text-gray-600">
              <span className="font-medium">{filteredRows.length} đăng ký</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-linear-to-r from-red-500/5 to-red-700/5 border-b border-gray-200">
              <tr>
                <SortableHeader field="studentName" currentField={sortField} direction={sortDirection} onSort={handleSort}>
                  Học viên
                </SortableHeader>
                <SortableHeader field="programName" currentField={sortField} direction={sortDirection} onSort={handleSort}>
                  Chương trình
                </SortableHeader>
                <SortableHeader field="tuitionPlanName" currentField={sortField} direction={sortDirection} onSort={handleSort}>
                  Gói học
                </SortableHeader>
                <SortableHeader field="expectedStartDate" currentField={sortField} direction={sortDirection} onSort={handleSort}>
                  Ngày dự kiến
                </SortableHeader>
                <SortableHeader field="className" currentField={sortField} direction={sortDirection} onSort={handleSort}>
                  Lớp
                </SortableHeader>
                <SortableHeader field="status" currentField={sortField} direction={sortDirection} onSort={handleSort}>
                  Trạng thái
                </SortableHeader>
                <SortableHeader field="createdAt" currentField={sortField} direction={sortDirection} onSort={handleSort}>
                  Tạo lúc
                </SortableHeader>
                <th className="py-3 px-6 text-right text-xs font-medium tracking-wide text-gray-700 whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="inline-flex items-center gap-2 text-gray-600">
                      <Loader2 size={18} className="animate-spin" /> Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              )}

              {!loading && pagedRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <UserPlus size={30} className="text-gray-300" />
                      <div>Không có đăng ký phù hợp bộ lọc hiện tại.</div>
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                pagedRows.map((row) => (
                  <tr key={row.id} className="group hover:bg-linear-to-r hover:from-red-50/50 hover:to-white transition-all duration-200">
                    <td className="py-3 px-6 text-sm font-medium text-gray-800">{row.studentName}</td>
                    <td className="py-3 px-6 text-sm text-gray-700">
                      {row.secondaryProgramName
                        ? `${row.programName} • ${row.secondaryProgramName}`
                        : row.programName}
                    </td>
                    <td className="py-3 px-6 text-sm text-gray-700">{row.tuitionPlanName}</td>
                    <td className="py-3 px-6 text-sm text-gray-700">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar size={14} className="text-gray-400" /> {row.expectedStartDate}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-sm text-gray-700">
                      {row.secondaryClassName
                        ? `${row.className} • ${row.secondaryClassName}`
                        : row.className}
                    </td>
                    <td className="py-3 px-6 text-sm text-gray-700">
                      <StatusBadge value={row.status} />
                    </td>
                    <td className="py-3 px-6 text-sm text-gray-700">{row.createdAt}</td>
                    <td className="py-3 px-6">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openDetail(row.id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700 cursor-pointer"
                          title="Xem chi tiết"
                        >
                          <Eye size={14} />
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
            Hiển thị <span className="font-semibold text-gray-900">{filteredRows.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filteredRows.length)}</span>
            {" "}trong tổng số <span className="font-semibold text-gray-900">{filteredRows.length}</span> đăng ký
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-red-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-50"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="text-sm text-gray-700 px-2 min-w-16 text-center">
              Trang {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-red-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>

    {isDetailOpen && (
      <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden">
          <div className="bg-linear-to-r from-red-600 to-red-700 px-6 py-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Chi tiết đăng ký lớp</h3>
            <button
              onClick={() => {
                setIsDetailOpen(false);
                setSelectedDetail(null);
              }}
              className="text-white/90 hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {detailLoading ? (
            <div className="py-10 text-center text-gray-600 inline-flex items-center justify-center gap-2 w-full">
              <Loader2 size={18} className="animate-spin" /> Đang tải chi tiết...
            </div>
          ) : selectedDetail ? (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500">Học viên</div>
                <div className="text-sm font-semibold text-gray-900">{selectedDetail.studentName}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Trạng thái</div>
                <div className="mt-1"><StatusBadge value={selectedDetail.status} /></div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Chi nhánh</div>
                <div className="text-sm text-gray-900 inline-flex items-center gap-1.5">
                  <Building2 size={14} className="text-gray-400" /> {selectedDetail.branchName || "-"}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Chương trình</div>
                <div className="text-sm text-gray-900">
                  {selectedDetail.secondaryProgramName
                    ? `${selectedDetail.programName || "-"} • ${selectedDetail.secondaryProgramName}`
                    : selectedDetail.programName || "-"}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Gói học</div>
                <div className="text-sm text-gray-900">{selectedDetail.tuitionPlanName || "-"}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Lớp</div>
                <div className="text-sm text-gray-900">
                  {selectedDetail.secondaryClassName
                    ? `${selectedDetail.className || "Chưa xếp lớp"} • ${selectedDetail.secondaryClassName}`
                    : selectedDetail.className || "Chưa xếp lớp"}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Chú trọng kĩ năng</div>
                <div className="text-sm text-gray-900">
                  {selectedDetail.secondaryProgramSkillFocus || selectedDetail.secondaryEntryType || "Không có"}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Ngày dự kiến</div>
                <div className="text-sm text-gray-900">{toDateOrFallback(selectedDetail.expectedStartDate)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Ngày đăng ký</div>
                <div className="text-sm text-gray-900">{toDateOrFallback(selectedDetail.registrationDate)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Buổi học đã dùng / còn lại</div>
                <div className="text-sm text-gray-900">{selectedDetail.usedSessions} / {selectedDetail.remainingSessions}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Lịch mong muốn</div>
                <div className="text-sm text-gray-900">{selectedDetail.preferredSchedule || "-"}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-xs text-gray-500">Ghi chú</div>
                <div className="text-sm text-gray-900 whitespace-pre-wrap">{selectedDetail.note || "-"}</div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    )}
    </>
  );
}
