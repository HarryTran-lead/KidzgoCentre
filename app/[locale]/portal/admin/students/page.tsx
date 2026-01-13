"use client";

import { Mail, Phone, Eye, Pencil, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Users, Search, Plus, GraduationCap, DollarSign } from "lucide-react";
import Badge from "@/components/admin/Badge";
import { useMemo, useState } from "react";

const rows = [
  {id:"HV001", name:"Nguyễn Văn An", phone:"0901234567", email:"van.an@email.com", cls:"English B1-01", level:"B1", state:"Đang học", fee:"2.500.000 / 2.500.000 VND", feeTag:"Đã đóng"},
  {id:"HV002", name:"Trần Thị Bình", phone:"0907654321", email:"thi.binh@email.com", cls:"IELTS Prep-02", level:"IELTS", state:"Đang học", fee:"1.600.000 / 3.200.000 VND", feeTag:"Chờ đóng"},
  {id:"HV003", name:"Lê Văn Cường", phone:"0912345678", email:"van.cuong@email.com", cls:"TOEIC Advanced", level:"TOEIC", state:"Đang học", fee:"1.400.000 / 2.800.000 VND", feeTag:"Quá hạn"},
  {id:"HV004", name:"Phạm Thị Dung", phone:"0923456789", email:"thi.dung@email.com", cls:"English A2-03", level:"A2", state:"Đang học", fee:"2.200.000 / 2.200.000 VND", feeTag:"Đã đóng"},
];

type SortField = "id" | "name" | "cls" | "level" | "state" | "feeTag";
type SortDirection = "asc" | "desc" | null;
const PAGE_SIZE = 5;

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
    direction === "asc" ? <ArrowUp size={14} className="text-pink-500" /> : <ArrowDown size={14} className="text-pink-500" />
  ) : <ArrowUpDown size={14} className="text-gray-400" />;
  const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
  return (
    <th
      onClick={() => onSort(field)}
      className={`py-3 px-6 ${alignClass} text-sm font-semibold text-gray-700 whitespace-nowrap cursor-pointer select-none hover:bg-pink-50 transition-colors`}
    >
      <span className="inline-flex items-center gap-2">{children}{icon}</span>
    </th>
  );
}

export default function Page(){
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<"ALL" | string>("ALL");
  const [stateFilter, setStateFilter] = useState<"ALL" | string>("ALL");

  const stats = useMemo(() => {
    const total = rows.length;
    const active = rows.filter(r => r.state === "Đang học").length;
    const paid = rows.filter(r => r.feeTag === "Đã đóng").length;
    const paidRate = total > 0 ? `${Math.round((paid / total) * 100)}%` : "0%";

    return {
      total,
      active,
      paid,
      paidRate,
    };
  }, []);

  const sorted = useMemo(() => {
    let data = [...rows];
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      data = data.filter((r) =>
        r.id.toLowerCase().includes(searchLower) ||
        r.name.toLowerCase().includes(searchLower) ||
        r.email.toLowerCase().includes(searchLower) ||
        r.phone.toLowerCase().includes(searchLower) ||
        r.cls.toLowerCase().includes(searchLower)
      );
    }

    if (levelFilter !== "ALL") {
      data = data.filter((r) => r.level === levelFilter);
    }

    if (stateFilter !== "ALL") {
      data = data.filter((r) => r.state === stateFilter);
    }
    
    // Sort
    if (sortField && sortDirection) {
      data.sort((a, b) => {
        const getVal = (r: (typeof rows)[number]) => {
          switch (sortField) {
            case "id": return r.id;
            case "name": return r.name;
            case "cls": return r.cls;
            case "level": return r.level;
            case "state": return r.state;
            case "feeTag": return r.feeTag;
          }
        };
        const av = getVal(a);
        const bv = getVal(b);
        return sortDirection === "asc"
          ? av.localeCompare(bv, undefined, { numeric: true })
          : bv.localeCompare(av, undefined, { numeric: true });
      });
    }
    return data;
  }, [sortField, sortDirection, search]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
            <Users size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Quản lý học viên
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Quản lý thông tin và hồ sơ học viên
            </p>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer">
          <Plus size={16} />
          Thêm học viên mới
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-4 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-pink-100 grid place-items-center">
              <Users className="text-pink-600" size={18} />
            </span>
            <div>
              <div className="text-sm text-gray-600">Tổng học viên</div>
              <div className="text-2xl font-extrabold text-gray-900">{stats.total}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-4 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-emerald-100 grid place-items-center">
              <GraduationCap className="text-emerald-600" size={18} />
            </span>
            <div>
              <div className="text-sm text-gray-600">Đang học</div>
              <div className="text-2xl font-extrabold text-gray-900">{stats.active}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-4 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-amber-100 grid place-items-center">
              <DollarSign className="text-amber-600" size={18} />
            </span>
            <div>
              <div className="text-sm text-gray-600">Đã đóng</div>
              <div className="text-2xl font-extrabold text-gray-900">{stats.paid}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-4 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-sky-100 grid place-items-center">
              <DollarSign className="text-sky-600" size={18} />
            </span>
            <div>
              <div className="text-sm text-gray-600">Tỉ lệ đã đóng</div>
              <div className="text-2xl font-extrabold text-gray-900">{stats.paidRate}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 max-w-3xl min-w-[280px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-500" size={16} />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Tìm kiếm học viên theo tên, mã, email, số điện thoại..."
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-pink-200 bg-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-200"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <select
              value={levelFilter}
              onChange={(e) => { setLevelFilter(e.target.value as typeof levelFilter); setPage(1); }}
              className="h-10 rounded-xl border border-pink-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-200"
            >
              <option value="ALL">Tất cả trình độ</option>
              {[...new Set(rows.map(r => r.level))].map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
            <select
              value={stateFilter}
              onChange={(e) => { setStateFilter(e.target.value as typeof stateFilter); setPage(1); }}
              className="h-10 rounded-xl border border-pink-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-200"
            >
              <option value="ALL">Tất cả trạng thái</option>
              {[...new Set(rows.map(r => r.state))].map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="bg-gradient-to-r from-pink-500/10 to-rose-500/10 border-b border-pink-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Danh sách học viên</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">{sorted.length} học viên</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-pink-500/5 to-rose-500/5 border-b border-pink-200">
              <tr>
                <SortableHeader field="id" currentField={sortField} direction={sortDirection} onSort={handleSort}>Mã HV</SortableHeader>
                <SortableHeader field="name" currentField={sortField} direction={sortDirection} onSort={handleSort}>Họ tên</SortableHeader>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 whitespace-nowrap">Liên hệ</th>
                <SortableHeader field="cls" currentField={sortField} direction={sortDirection} onSort={handleSort}>Lớp học</SortableHeader>
                <SortableHeader field="level" currentField={sortField} direction={sortDirection} onSort={handleSort} align="center">Trình độ</SortableHeader>
                <SortableHeader field="state" currentField={sortField} direction={sortDirection} onSort={handleSort} align="center">Trạng thái</SortableHeader>
                <SortableHeader field="feeTag" currentField={sortField} direction={sortDirection} onSort={handleSort}>Học phí</SortableHeader>
                <th className="py-3 px-6 text-right text-xs font-medium text-gray-700 whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-100">
              {paged.length > 0 ? (
                paged.map((r) => (
                  <tr
                    key={r.id}
                    className="group hover:bg-gradient-to-r hover:from-pink-50/50 hover:to-white transition-all duration-200"
                  >
                    <td className="py-4 px-6 text-sm text-gray-900 whitespace-nowrap">{r.id}</td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-900 truncate">{r.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Ngày nhập học: 15/1/2025</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Phone size={12} className="text-gray-400" />
                          <span>{r.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Mail size={12} className="text-gray-400" />
                          <span className="truncate">{r.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-900 whitespace-nowrap">{r.cls}</td>
                    <td className="py-4 px-6 text-center whitespace-nowrap">
                      <Badge color="blue">{r.level}</Badge>
                    </td>
                    <td className="py-4 px-6 text-center whitespace-nowrap">
                      <Badge color="green">{r.state}</Badge>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="mb-1">
                        <Badge color={r.feeTag==='Đã đóng'?'green':r.feeTag==='Chờ đóng'?'yellow':'red'}>{r.feeTag}</Badge>
                      </div>
                      <div className="text-xs text-gray-500 truncate max-w-[180px]">{r.fee}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end text-gray-700 gap-1 transition-opacity duration-200">
                        <button className="p-1.5 rounded-lg hover:bg-pink-50 transition-colors text-gray-400 hover:text-pink-600 cursor-pointer" title="Xem chi tiết">
                          <Eye size={14} />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors text-gray-400 hover:text-blue-600 cursor-pointer" title="Chỉnh sửa">
                          <Pencil size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-pink-100 to-rose-100 flex items-center justify-center">
                      <Search size={24} className="text-pink-400" />
                    </div>
                    <div className="text-gray-600 font-medium">Không tìm thấy học viên</div>
                    <div className="text-sm text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc thêm học viên mới</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer - Pagination */}
        {sorted.length > 0 && (
          <div className="border-t border-pink-200 bg-gradient-to-r from-pink-500/5 to-rose-500/5 px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Hiển thị <span className="font-semibold text-gray-900">{(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, sorted.length)}</span>
                {' '}trong tổng số <span className="font-semibold text-gray-900">{sorted.length}</span> học viên
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="p-1.5 rounded-lg border border-pink-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-50 transition-colors"
                  onClick={() => goPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="Trang trước"
                >
                  <ChevronLeft size={16} className="text-gray-600" />
                </button>
                <div className="text-sm font-semibold text-gray-900 px-3">
                  {currentPage} / {totalPages}
                </div>
                <button
                  className="p-1.5 rounded-lg border border-pink-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-50 transition-colors"
                  onClick={() => goPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  aria-label="Trang sau"
                >
                  <ChevronRight size={16} className="text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
