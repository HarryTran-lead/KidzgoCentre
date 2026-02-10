"use client";

import { useMemo, useState, useEffect } from "react";
import { 
  Search, PhoneCall, CalendarDays, Mail, MessageCircle, 
  Clock, Filter, MoreVertical, Plus, Eye, User, 
  BookOpen, TrendingUp, ChevronRight, Phone, Mail as MailIcon,
  Calendar, UserCheck, CheckCircle, AlertCircle, ArrowUpDown,
  ArrowUp, ArrowDown, UserPlus, ChevronLeft
} from "lucide-react";

type Status = "NEW" | "CONTACTED" | "ENROLLED" | "LOST";

type Lead = {
  id: string;
  parentName: string;
  studentName: string;
  course: string;
  createdAt: string;
  status: Status;
  note?: string;
  email?: string;
  phone?: string;
  source?: string;
};

const LEADS: Lead[] = [
  {
    id: "LD001",
    parentName: "Nguyễn Thị Thu",
    studentName: "Nguyễn Gia Hân",
    course: "Tiếng Anh thiếu nhi",
    createdAt: "05/12/2024 09:15",
    status: "NEW",
    email: "thu.nguyen@gmail.com",
    phone: "0912 345 678",
    source: "Website",
  },
  {
    id: "LD002",
    parentName: "Trần Văn Long",
    studentName: "Trần Gia Bảo",
    course: "STEAM cuối tuần",
    createdAt: "04/12/2024 14:20",
    status: "CONTACTED",
    note: "Đã gọi, hẹn tư vấn tại trung tâm",
    email: "long.tran@gmail.com",
    phone: "0913 456 789",
    source: "Facebook",
  },
  {
    id: "LD003",
    parentName: "Phạm Hồng Ngọc",
    studentName: "Phạm Quỳnh Mai",
    course: "Trại hè 2025",
    createdAt: "01/12/2024 16:00",
    status: "ENROLLED",
    note: "Đã đóng cọc 2.000.000đ",
    email: "ngoc.pham@gmail.com",
    phone: "0914 567 890",
    source: "Website",
  },
  {
    id: "LD004",
    parentName: "Lê Minh Tuấn",
    studentName: "Lê Minh Anh",
    course: "IELTS Junior",
    createdAt: "30/11/2024 11:30",
    status: "CONTACTED",
    email: "tuan.le@gmail.com",
    phone: "0915 678 901",
    source: "Zalo",
  },
  {
    id: "LD005",
    parentName: "Vũ Thị Lan",
    studentName: "Vũ Đức An",
    course: "Tiếng Anh giao tiếp",
    createdAt: "28/11/2024 15:45",
    status: "LOST",
    note: "Đã chọn trung tâm khác",
    email: "lan.vu@gmail.com",
    phone: "0916 789 012",
    source: "Website",
  },
  {
    id: "LD006",
    parentName: "Hoàng Văn Đức",
    studentName: "Hoàng Minh Khôi",
    course: "Toán tư duy",
    createdAt: "25/11/2024 10:20",
    status: "ENROLLED",
    email: "duc.hoang@gmail.com",
    phone: "0917 890 123",
    source: "Tư vấn trực tiếp",
  },
];

const STATUS_CONFIG: Record<Status, {
  text: string;
  color: string;
  bgColor: string;
  icon: any;
}> = {
  NEW: {
    text: "Mới",
    color: "text-amber-600",
    bgColor: "bg-amber-50 border border-amber-200",
    icon: AlertCircle
  },
  CONTACTED: {
    text: "Đã liên hệ",
    color: "text-blue-600",
    bgColor: "bg-blue-50 border border-blue-200",
    icon: Phone
  },
  ENROLLED: {
    text: "Đăng ký",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 border border-emerald-200",
    icon: CheckCircle
  },
  LOST: {
    text: "Không tham gia",
    color: "text-rose-600",
    bgColor: "bg-rose-50 border border-rose-200",
    icon: AlertCircle
  },
};

function StatusBadge({ status }: { status: Status }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${config.bgColor} ${config.color}`}>
      <Icon size={14} />
      {config.text}
    </div>
  );
}

type SortField = 'parentName' | 'studentName' | 'course' | 'createdAt' | 'status';
type SortDirection = 'asc' | 'desc' | null;

function SortableHeader({ 
  field, 
  currentField, 
  direction, 
  onSort, 
  children 
}: { 
  field: SortField; 
  currentField: SortField | null; 
  direction: SortDirection; 
  onSort: (field: SortField) => void; 
  children: React.ReactNode;
}) {
  const isActive = currentField === field;
  
  return (
    <th 
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-red-50/50 transition-colors"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-2">
        <span>{children}</span>
        {isActive ? (
          direction === 'asc' ? (
            <ArrowUp size={14} className="text-red-600" />
          ) : (
            <ArrowDown size={14} className="text-red-600" />
          )
        ) : (
          <ArrowUpDown size={14} className="text-gray-400" />
        )}
      </div>
    </th>
  );
}

export default function LeadsPage() {
  const [status, setStatus] = useState<Status | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredLeads = useMemo(() => {
    let filtered = LEADS;
    
    if (status !== "ALL") {
      filtered = filtered.filter((lead) => lead.status === status);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((lead) => 
        lead.parentName.toLowerCase().includes(query) ||
        lead.studentName.toLowerCase().includes(query) ||
        lead.course.toLowerCase().includes(query) ||
        lead.email?.toLowerCase().includes(query) ||
        lead.phone?.includes(query)
      );
    }

    // Sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: string | number = '';
        let bValue: string | number = '';
        
        switch (sortField) {
          case 'parentName':
            aValue = a.parentName;
            bValue = b.parentName;
            break;
          case 'studentName':
            aValue = a.studentName;
            bValue = b.studentName;
            break;
          case 'course':
            aValue = a.course;
            bValue = b.course;
            break;
          case 'createdAt':
            aValue = a.createdAt;
            bValue = b.createdAt;
            break;
          case 'status':
            aValue = a.status;
            bValue = b.status;
            break;
        }
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        return 0;
      });
    }
    
    return filtered;
  }, [status, searchQuery, sortField, sortDirection]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLeads = filteredLeads.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [status, searchQuery]);

  const stats = {
    total: LEADS.length,
    new: LEADS.filter(l => l.status === "NEW").length,
    contacted: LEADS.filter(l => l.status === "CONTACTED").length,
    enrolled: LEADS.filter(l => l.status === "ENROLLED").length,
    conversionRate: Math.round((LEADS.filter(l => l.status === "ENROLLED").length / LEADS.length) * 100)
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
              <UserPlus size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Quản lý khách hàng tiềm năng
              </h1>
              <p className="text-gray-600">
                Theo dõi và quản lý quá trình chuyển đổi từ khách hàng tiềm năng
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 border border-red-200 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors cursor-pointer">
              <Filter size={16} />
              Bộ lọc nâng cao
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-medium hover:shadow-lg transition-all cursor-pointer">
              <Plus size={16} />
              Thêm lead mới
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="bg-gradient-to-br from-white to-red-50 rounded-2xl border border-red-200 p-5 transition-all hover:shadow-md cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Tổng leads</div>
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-sky-500 text-white shadow-lg">
                <User size={20} />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-red-50 rounded-2xl border border-red-200 p-5 transition-all hover:shadow-md cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Leads mới</div>
                <div className="text-2xl font-bold text-amber-600">{stats.new}</div>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg">
                <AlertCircle size={20} />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-red-50 rounded-2xl border border-red-200 p-5 transition-all hover:shadow-md cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Đã liên hệ</div>
                <div className="text-2xl font-bold text-blue-600">{stats.contacted}</div>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-sky-500 text-white shadow-lg">
                <PhoneCall size={20} />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-red-50 rounded-2xl border border-red-200 p-5 transition-all hover:shadow-md cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Đăng ký thành công</div>
                <div className="text-2xl font-bold text-emerald-600">{stats.enrolled}</div>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg">
                <UserCheck size={20} />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-red-50 rounded-2xl border border-red-200 p-5 transition-all hover:shadow-md cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Tỷ lệ chuyển đổi</div>
                <div className="text-2xl font-bold text-red-600">{stats.conversionRate}%</div>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg">
                <TrendingUp size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className={`bg-gradient-to-br from-white to-red-50 rounded-2xl border border-red-200 p-4 mb-6 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Status Filter */}
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setStatus("ALL")}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  status === "ALL" 
                    ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md" 
                    : "bg-white border border-red-200 text-gray-700 hover:bg-red-50"
                }`}
              >
                Tất cả ({stats.total})
              </button>
              {(Object.keys(STATUS_CONFIG) as Status[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    status === s 
                      ? `${STATUS_CONFIG[s].bgColor} ${STATUS_CONFIG[s].color}` 
                      : "bg-white border border-red-200 text-gray-700 hover:bg-red-50"
                  }`}
                >
                  {STATUS_CONFIG[s].text}
                </button>
              ))}
            </div>

            {/* Search and Items Per Page */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Tìm kiếm phụ huynh, học viên, khóa học..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2.5 border border-red-200 rounded-xl text-sm w-full md:w-80 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
              >
                <option value={5}>5 / trang</option>
                <option value={10}>10 / trang</option>
                <option value={20}>20 / trang</option>
                <option value={50}>50 / trang</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className={`bg-gradient-to-br from-white to-red-50 rounded-2xl border border-red-200 overflow-hidden mb-6 shadow-sm transition-all duration-700 delay-200 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="p-6 border-b border-red-200 bg-gradient-to-r from-red-500/10 to-red-700/10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <UserPlus size={20} className="text-red-600" />
              Danh sách khách hàng tiềm năng
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock size={16} />
              Cập nhật cuối: 10 phút trước
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <colgroup>
              <col className="w-[25%]" />
              <col className="w-[25%]" />
              <col className="w-[15%]" />
              <col className="w-[20%]" />
              <col className="w-[15%]" />
            </colgroup>
            <thead className="bg-gradient-to-r from-red-500/10 to-red-700/10">
              <tr className="border-b border-red-200">
                <SortableHeader 
                  field="parentName" 
                  currentField={sortField} 
                  direction={sortDirection} 
                  onSort={handleSort}
                >
                  Thông tin khách hàng
                </SortableHeader>
                <SortableHeader 
                  field="studentName" 
                  currentField={sortField} 
                  direction={sortDirection} 
                  onSort={handleSort}
                >
                  Học viên & Khóa học
                </SortableHeader>
                <SortableHeader 
                  field="createdAt" 
                  currentField={sortField} 
                  direction={sortDirection} 
                  onSort={handleSort}
                >
                  Thời gian
                </SortableHeader>
                <SortableHeader 
                  field="status" 
                  currentField={sortField} 
                  direction={sortDirection} 
                  onSort={handleSort}
                >
                  Trạng thái
                </SortableHeader>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-red-100">
              {currentLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-red-50/50 transition-colors">
                  <td className="px-6 py-4 align-top">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold text-sm flex-shrink-0">
                        {lead.parentName.split(' ').slice(-1)[0][0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 truncate">{lead.parentName}</div>
                        <div className="flex items-center gap-1 mt-2 text-sm text-gray-600">
                          <MailIcon size={12} className="flex-shrink-0" />
                          <span className="truncate">{lead.email}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 truncate">{lead.studentName}</div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <BookOpen size={14} className="flex-shrink-0" />
                        <span className="truncate">{lead.course}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top whitespace-nowrap">
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      <Calendar size={14} className="text-red-600 flex-shrink-0" />
                      <span>{lead.createdAt}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="space-y-2">
                      <StatusBadge status={lead.status} />
                      {lead.note && (
                        <div className="text-xs text-gray-500 truncate max-w-full" title={lead.note}>
                          {lead.note}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top whitespace-nowrap">
                    <div className="flex items-center gap-2 justify-start">
                      <button className="p-2 hover:bg-red-100 rounded-lg transition-colors cursor-pointer" title="Nhắn tin">
                        <MessageCircle size={18} className="text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-red-100 rounded-lg transition-colors cursor-pointer" title="Xem chi tiết">
                        <Eye size={18} className="text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-red-100 rounded-lg transition-colors cursor-pointer">
                        <MoreVertical size={18} className="text-gray-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {currentLeads.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Không tìm thấy khách hàng tiềm năng nào
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {filteredLeads.length > 0 && (
          <div className="border-t border-red-200 bg-gradient-to-r from-red-500/5 to-red-700/5 px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Left: Info */}
              <div className="text-sm text-gray-600">
                Hiển thị <span className="font-semibold text-gray-900">{startIndex + 1}-{Math.min(endIndex, filteredLeads.length)}</span> trong tổng số{" "}
                <span className="font-semibold text-gray-900">{filteredLeads.length}</span> lead
              </div>

              {/* Right: Pagination Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

                    return pages.map((page, idx) => (
                      <button
                        key={idx}
                        onClick={() => typeof page === "number" && setCurrentPage(page)}
                        disabled={page === "..."}
                        className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-all ${
                          page === currentPage
                            ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
                            : page === "..."
                            ? "cursor-default text-gray-400"
                            : "border border-red-200 hover:bg-red-50 text-gray-700"
                        }`}
                      >
                        {page}
                      </button>
                    ));
                  })()}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className={`grid md:grid-cols-3 gap-4 mb-6 transition-all duration-700 delay-300 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="bg-gradient-to-br from-white to-red-50 rounded-2xl border border-red-200 p-5 hover:shadow-md transition-all cursor-pointer">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-sky-500 text-white rounded-xl shadow-lg">
              <PhoneCall size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Liên hệ điện thoại</h3>
              <p className="text-sm text-gray-600">Gọi lại khách hàng</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="text-sm text-gray-500">
              5 cuộc gọi cần thực hiện hôm nay
            </div>
            <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-sky-500 text-white py-2.5 rounded-xl font-medium hover:shadow-md transition-all cursor-pointer">
              <PhoneCall size={16} />
              Bắt đầu gọi
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-red-50 rounded-2xl border border-red-200 p-5 hover:shadow-md transition-all cursor-pointer">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl shadow-lg">
              <CalendarDays size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Lịch hẹn tư vấn</h3>
              <p className="text-sm text-gray-600">Sắp xếp lịch hẹn</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="text-sm text-gray-500">
              3 cuộc hẹn trong tuần này
            </div>
            <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-2.5 rounded-xl font-medium hover:shadow-md transition-all cursor-pointer">
              <CalendarDays size={16} />
              Xem lịch hẹn
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-red-50 rounded-2xl border border-red-200 p-5 hover:shadow-md transition-all cursor-pointer">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl shadow-lg">
              <Mail size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Email marketing</h3>
              <p className="text-sm text-gray-600">Gửi email tự động</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="text-sm text-gray-500">
              12 email nhắc học phí đang chờ
            </div>
            <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-2.5 rounded-xl font-medium hover:shadow-md transition-all cursor-pointer">
              <Mail size={16} />
              Gửi email
            </button>
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className={`bg-gradient-to-br from-white to-red-50 rounded-2xl border border-red-200 p-4 transition-all duration-700 delay-300 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <ChevronRight size={16} className="text-red-600" />
            <span>Hiển thị {filteredLeads.length}/{LEADS.length} khách hàng tiềm năng • 
              Tỷ lệ chuyển đổi: {stats.conversionRate}% • 
              Cập nhật thời gian thực</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span>Đăng ký thành công</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span>Đã liên hệ</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span>Cần liên hệ</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}