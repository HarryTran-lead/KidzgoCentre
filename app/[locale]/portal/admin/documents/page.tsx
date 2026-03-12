"use client";

import { useMemo, useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

// API
import { getAllDocuments, createDocument, updateDocument, deleteDocument } from "@/lib/api/documentService";
import { getAllProgramsForDropdown } from "@/lib/api/programService";
import type { 
  LessonPlanTemplate, 
  CreateDocumentRequest,
  UpdateDocumentRequest
} from "@/types/admin/document";
import type { Program } from "@/types/admin/programs";

// Icons
import {
  Search,
  FileText,
  File,
  Upload,
  Trash2,
  Eye,
  Edit,
  Plus,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  X,
  RefreshCw,
  BookOpen,
  Clock,
  GraduationCap,
  Power,
  PowerOff,
  Tag
} from "lucide-react";

type SortDirection = "asc" | "desc";

type SortState<T> = {
  key: keyof T | null;
  direction: SortDirection;
};

// Helper functions
function quickSort<T>(
  items: T[],
  compare: (a: T, b: T) => number
): T[] {
  if (items.length <= 1) return items;

  const pivot = items[items.length - 1];
  const left: T[] = [];
  const right: T[] = [];

  for (let i = 0; i < items.length - 1; i++) {
    const c = compare(items[i], pivot);
    if (c <= 0) left.push(items[i]);
    else right.push(items[i]);
  }

  return [...quickSort(left, compare), pivot, ...quickSort(right, compare)];
}

function toSortableValue(v: unknown): string | number {
  if (v == null) return "";
  if (typeof v === "number") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  return String(v).toLowerCase();
}

function buildComparator<T>(
  key: keyof T,
  direction: SortDirection
): (a: T, b: T) => number {
  const dir = direction === "asc" ? 1 : -1;
  return (a, b) => {
    const av = toSortableValue((a as any)[key]);
    const bv = toSortableValue((b as any)[key]);
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  };
}

const formatDate = (dateString?: string): string => {
  if (!dateString) return "Chưa có";
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Components
function StatCard({
  title,
  value,
  icon,
  color,
  subtitle
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className={`absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl ${color}`}></div>
      <div className="relative flex items-center justify-between gap-3">
        <div className={`p-2 rounded-xl bg-gradient-to-r ${color} text-white shadow-sm flex-shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium text-gray-600 truncate">{title}</div>
          <div className="text-xl font-bold text-gray-900 leading-tight">{value}</div>
          {subtitle && <div className="text-[11px] text-gray-500 truncate">{subtitle}</div>}
        </div>
      </div>
    </div>
  );
}

/* -------------------------- helpers -------------------------- */
function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

export default function DocumentsPage() {
  // Filter states
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [sort, setSort] = useState<SortState<LessonPlanTemplate>>({ key: null, direction: "asc" });

  // Data state
  const [documents, setDocuments] = useState<LessonPlanTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  // Fixed counts
  const [fixedCounts, setFixedCounts] = useState({
    total: 0,
    hasAttachment: 0,
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<LessonPlanTemplate | null>(null);

  // Fetch data
  useEffect(() => {
    async function fetchDocuments() {
      try {
        setLoading(true);
        setError(null);

        const response = await getAllDocuments({
          pageNumber: 1,
          pageSize: 100,
        });

        const isSuccessful = response.success || response.isSuccess;
        
        if (isSuccessful && response.data) {
          const items = response.data.templates?.items || [];
          setDocuments(items);

          // Calculate fixed counts
          const counts = {
            total: items.length,
            hasAttachment: items.filter(d => d.attachment).length,
          };
          setFixedCounts(counts);
        } else {
          setError(response.message || 'Không thể tải danh sách tài liệu');
        }
      } catch (err) {
        console.error('Error fetching documents:', err);
        setError('Đã xảy ra lỗi khi tải dữ liệu');
      } finally {
        setLoading(false);
        setIsPageLoaded(true);
      }
    }

    fetchDocuments();
  }, []);

  const toggleSort = (key: keyof LessonPlanTemplate) => {
    setSort(prev => {
      if (prev.key !== key) return { key, direction: "asc" };
      return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
    });
  };

  const SortHeader = ({
    label,
    sortKey,
    className,
  }: {
    label: string;
    sortKey: keyof LessonPlanTemplate;
    className?: string;
  }) => {
    const active = sort.key === sortKey;
    return (
      <button
        type="button"
        onClick={() => toggleSort(sortKey)}
        className={`inline-flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-gray-900 cursor-pointer ${className ?? ""}`}
      >
        <span>{label}</span>
        {active ? (
          sort.direction === "asc" ? (
            <span aria-hidden>↑</span>
          ) : (
            <span aria-hidden>↓</span>
          )
        ) : (
          <span aria-hidden className="text-gray-300">↕</span>
        )}
      </button>
    );
  };

  // Stats
  const stats = [
    {
      title: 'Tổng tài liệu',
      value: `${fixedCounts.total}`,
      icon: <FileText size={20} />,
      color: 'from-red-600 to-red-700',
      subtitle: 'Tài liệu dạy học'
    },
    {
      title: 'Có file đính kèm',
      value: `${fixedCounts.hasAttachment}`,
      icon: <Upload size={20} />,
      color: 'from-emerald-500 to-teal-500',
      subtitle: 'Đã tải lên'
    },
  ];

  // Filtered and sorted list
  const list = useMemo(() => {
    let result = documents;

    if (sort.key) {
      result = quickSort([...result], buildComparator(sort.key, sort.direction));
    }

    return result;
  }, [documents, sort.key, sort.direction]);

  // Pagination
  const totalPages = Math.ceil(list.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRows = list.slice(startIndex, endIndex);

  const toggleSelectRow = (id: string) => {
    setSelectedRows(prev =>
      prev.includes(id)
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === currentRows.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(currentRows.map(row => row.id));
    }
  };

  // Handlers
  const handleViewDetail = (doc: LessonPlanTemplate) => {
    setSelectedDocument(doc);
    setShowDetailModal(true);
  };

  const handleEdit = (doc: LessonPlanTemplate) => {
    setSelectedDocument(doc);
    setShowCreateModal(true);
  };

  const handleDelete = (doc: LessonPlanTemplate) => {
    setSelectedDocument(doc);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedDocument) return;
    
    try {
      const response = await deleteDocument(selectedDocument.id);
      const isSuccessful = response.success || response.isSuccess;
      
      if (isSuccessful) {
        toast({
          title: "Thành công",
          description: "Xóa tài liệu thành công",
          variant: "success",
        });
        
        setShowDeleteModal(false);
        setSelectedDocument(null);
        
        // Refresh list
        setDocuments(prev => prev.filter(d => d.id !== selectedDocument.id));
        setFixedCounts(prev => ({ ...prev, total: prev.total - 1 }));
      } else {
        toast({
          title: "Lỗi",
          description: response.message || 'Không thể xóa tài liệu',
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Đã xảy ra lỗi khi xóa tài liệu",
        variant: "destructive",
      });
    }
  };

  const handleSubmitDocument = async (data: CreateDocumentRequest | UpdateDocumentRequest) => {
    try {
      let response;
      
      if (selectedDocument) {
        response = await updateDocument(selectedDocument.id, data);
      } else {
        response = await createDocument(data as CreateDocumentRequest);
      }
      
      const isSuccessful = response.success || response.isSuccess;
      
      if (isSuccessful) {
        toast({
          title: "Thành công",
          description: selectedDocument ? "Cập nhật tài liệu thành công" : "Tạo tài liệu thành công",
          variant: "success",
        });
        
        setShowCreateModal(false);
        setSelectedDocument(null);
        
        // Refresh list
        window.location.reload();
      } else {
        toast({
          title: "Lỗi",
          description: response.message || 'Không thể lưu tài liệu',
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Đã xảy ra lỗi khi lưu tài liệu",
        variant: "destructive",
      });
    }
  };

  // Loading state
  if (loading && !isPageLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !isPageLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-red-100 to-red-200 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Không thể tải dữ liệu</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer"
          >
            <RefreshCw size={16} /> Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6 space-y-6">
      {/* Header */}
      <div className={`flex flex-wrap items-center justify-between gap-4 transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
            <FileText size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
              Quản lý Tài liệu Dạy học
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Quản lý tài liệu giảng dạy theo chương trình và session
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => {
              setSelectedDocument(null);
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus size={16} /> Tạo tài liệu mới
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className={`grid gap-4 md:grid-cols-2 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {stats.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      {/* Filter Bar */}
      <div className={`rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-4 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Search and Items Per Page */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm tài liệu..."
                className="h-10 w-72 rounded-xl border border-red-200 bg-white pl-10 pr-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200"
              />
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
            >
              <option value={5}>5 / trang</option>
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className={`rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 shadow-sm overflow-hidden transition-all duration-700 delay-200 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Table Header */}
        <div className="bg-gradient-to-r from-red-500/10 to-red-700/10 border-b border-red-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Danh sách tài liệu</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">{list.length} tài liệu</span>
              {selectedRows.length > 0 && (
                <>
                  <span className="mx-2">•</span>
                  <span className="text-red-600 font-medium">
                    Đã chọn {selectedRows.length} tài liệu
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-red-500/5 to-red-700/5 border-b border-red-200">
              <tr>
                <th className="py-3 px-6 text-left">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedRows.length === currentRows.length && currentRows.length > 0}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-200 cursor-pointer"
                    />
                    <SortHeader label="Chương trình" sortKey="programName" />
                  </div>
                </th>
                <th className="py-3 px-6 text-left">
                  <SortHeader label="Level" sortKey="level" />
                </th>
                <th className="py-3 px-6 text-left">
                  <SortHeader label="Session" sortKey="sessionIndex" />
                </th>
                <th className="py-3 px-6 text-left">
                  <SortHeader label="File đính kèm" sortKey="attachment" />
                </th>
                <th className="py-3 px-6 text-left">
                  <SortHeader label="Ngày tạo" sortKey="createdAt" />
                </th>
                <th className="py-3 px-6 text-left">
                  <span className="text-sm font-semibold text-gray-700">Trạng thái</span>
                </th>
                <th className="py-3 px-6 text-left">
                  <span className="text-sm font-semibold text-gray-700">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-red-100">
              {currentRows.length > 0 ? (
                currentRows.map((doc) => (
                  <tr
                    key={doc.id}
                    className="group hover:bg-gradient-to-r hover:from-red-50/50 hover:to-white transition-all duration-200"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(doc.id)}
                          onChange={() => toggleSelectRow(doc.id)}
                          className="h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-200 cursor-pointer"
                        />
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gradient-to-r from-red-100 to-red-200">
                            <FileText size={18} className="text-red-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{doc.programName || 'N/A'}</div>
                            {doc.programId && (
                              <div className="text-xs text-gray-500">{doc.programId}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-700 font-medium">{doc.level || 'N/A'}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-700"> {doc.sessionIndex ?? '-'}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        {doc.attachment && doc.attachment !== 'string' ? (
                          <div className="text-sm text-gray-700 flex items-center gap-2">
                            <File size={12} className="text-gray-400" />
                            <span className="truncate max-w-[200px]">{doc.attachment}</span>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400 italic">Chưa có file</div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-600">
                        {formatDate(doc.createdAt)}
                      </div>

                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        doc.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {doc.isActive ? 'Hoạt động' : 'Không hoạt động'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1 transition-opacity duration-200">
                        <button
                          type="button"
                          onClick={() => handleViewDetail(doc)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors text-gray-400 hover:text-blue-600 cursor-pointer"
                          title="Xem chi tiết"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(doc)}
                          className="p-1.5 rounded-lg hover:bg-emerald-50 transition-colors text-gray-400 hover:text-emerald-600 cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(doc)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600 cursor-pointer"
                          title="Xóa"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-red-100 to-red-200 flex items-center justify-center">
                      <FileText size={24} className="text-red-400" />
                    </div>
                    <div className="text-gray-600 font-medium">Không tìm thấy tài liệu</div>
                    <div className="text-sm text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc tạo tài liệu mới</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {list.length > 0 && (
          <div className="border-t border-red-200 bg-gradient-to-r from-red-500/5 to-red-700/5 px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Hiển thị <span className="font-semibold text-gray-900">{startIndex + 1}-{Math.min(endIndex, list.length)}</span> trong tổng số{" "}
                <span className="font-semibold text-gray-900">{list.length}</span> tài liệu
                {selectedRows.length > 0 && (
                  <span className="ml-3 text-red-600 font-medium">
                    • Đã chọn {selectedRows.length}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
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

                    return pages.map((page, idx) => (
                      <button
                        key={idx}
                        onClick={() => typeof page === "number" && setCurrentPage(page)}
                        disabled={page === "..."}
                        className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${
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

      {/* Detail Modal - Updated style to match course modal */}
      {showDetailModal && selectedDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
            {/* Modal Header - Gradient from course modal */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                    <FileText size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Chi tiết tài liệu</h2>
                    <p className="text-sm text-red-100">Thông tin chi tiết về tài liệu giáo án</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
                  aria-label="Đóng"
                >
                  <X size={24} className="text-white" />
                </button>
              </div>
            </div>

            {/* Modal Body - Updated styling */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-6">
                {/* Program Info */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <BookOpen size={16} className="text-red-600" />
                    Chương trình học
                  </label>
                  <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900">
                    {selectedDocument.programName || 'N/A'}
                  </div>
                </div>

                {/* Grid: Level, Session, Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <GraduationCap size={16} className="text-red-600" />
                      Level
                    </label>
                    <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900">
                      {selectedDocument.level || 'N/A'}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Clock size={16} className="text-red-600" />
                      Session
                    </label>
                    <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900">
                      Session {selectedDocument.sessionIndex ?? '-'}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Tag size={16} className="text-red-600" />
                      Trạng thái
                    </label>
                    <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedDocument.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedDocument.isActive ? 'Hoạt động' : 'Không hoạt động'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* File Attachment */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Upload size={16} className="text-red-600" />
                    File đính kèm
                  </label>
                  <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900">
                    {selectedDocument.attachment && selectedDocument.attachment !== 'string' ? (
                      <div className="flex items-center gap-2">
                        <File size={16} className="text-gray-400" />
                        <span>{selectedDocument.attachment}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Chưa có file</span>
                    )}
                  </div>
                </div>

                {/* Grid: Created By, Created At, Used Count */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      Người tạo
                    </label>
                    <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900">
                      {selectedDocument.createdByName || 'N/A'}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      Ngày tạo
                    </label>
                    <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900">
                      {formatDate(selectedDocument.createdAt)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      Lần sử dụng
                    </label>
                    <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900">
                      {selectedDocument.usedCount ?? 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer - Updated to match course modal */}
            <div className="border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 p-6">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowDetailModal(false)}
                  className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDetailModal(false);
                    handleEdit(selectedDocument);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all cursor-pointer"
                >
                  Chỉnh sửa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - Updated to match course modal style */}
      {showDeleteModal && selectedDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
            {/* Modal Header - Gradient from course modal */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                    <Trash2 size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Xóa tài liệu</h2>
                    <p className="text-sm text-red-100">Xác nhận xóa tài liệu giáo án</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
                  aria-label="Đóng"
                >
                  <X size={24} className="text-white" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <Trash2 size={32} className="text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Xác nhận xóa tài liệu</h3>
              <p className="text-gray-600">
                Bạn có chắc chắn muốn xóa tài liệu "{selectedDocument.programName || selectedDocument.programId || "N/A"}"? Hành động này không thể hoàn tác.
              </p>
            </div>

            {/* Modal Footer - Updated to match course modal */}
            <div className="border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 p-6">
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleConfirmDelete}
                  className="flex-1 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 rounded-xl hover:shadow-lg cursor-pointer"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal - Updated to match course modal style */}
      {showCreateModal && (
        <DocumentFormModal
          document={selectedDocument}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedDocument(null);
          }}
          onSubmit={handleSubmitDocument}
        />
      )}
    </div>
  );
}

// Document Form Modal Component - Redesigned to match course modal style
function DocumentFormModal({
  document,
  onClose,
  onSubmit,
}: {
  document: LessonPlanTemplate | null;
  onClose: () => void;
  onSubmit: (data: CreateDocumentRequest | UpdateDocumentRequest) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    level: document?.level || '',
    sessionIndex: document?.sessionIndex ?? 0,
    attachment: document?.attachment || '',
    isActive: document?.isActive ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  // Fetch programs on mount (only for create mode)
  useEffect(() => {
    async function fetchPrograms() {
      setLoadingPrograms(true);
      try {
        const data = await getAllProgramsForDropdown();
        console.log('Programs fetched in modal:', data);
        setPrograms(data);
      } catch (error) {
        console.error('Error fetching programs:', error);
      } finally {
        setLoadingPrograms(false);
      }
    }
    // Only fetch programs in create mode
    if (!document) {
      fetchPrograms();
    }
  }, [document]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!document && !selectedProgramId) {
      newErrors.programId = "Vui lòng chọn chương trình học";
    }
    if (!formData.level.trim()) {
      newErrors.level = "Vui lòng nhập level";
    }
    if (formData.sessionIndex < 0) {
      newErrors.sessionIndex = "Session index phải lớn hơn hoặc bằng 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (document) {
        // Update mode - use UpdateDocumentRequest
        await onSubmit(formData as UpdateDocumentRequest);
      } else {
        // Create mode - need programId
        if (!selectedProgramId) {
          toast({
            title: "Lỗi",
            description: "Vui lòng chọn chương trình học",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        await onSubmit({
          programId: selectedProgramId,
          ...formData,
        } as CreateDocumentRequest);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
        {/* Modal Header - Gradient from course modal */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <FileText size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {document ? "Chỉnh sửa tài liệu" : "Tạo tài liệu mới"}
                </h2>
                <p className="text-sm text-red-100">
                  {document ? "Chỉnh sửa thông tin tài liệu giáo án" : "Nhập thông tin chi tiết về tài liệu mới"}
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

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Program selection - only show in create mode */}
            {!document ? (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <BookOpen size={16} className="text-red-600" />
                  Chương trình học *
                </label>
                <div className="relative">
                  <select
                    value={selectedProgramId}
                    onChange={(e) => {
                      setSelectedProgramId(e.target.value);
                      if (errors.programId) {
                        setErrors(prev => ({ ...prev, programId: undefined }));
                      }
                    }}
                    disabled={loadingPrograms}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl border bg-white text-gray-900",
                      "focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
                      errors.programId ? "border-red-500" : "border-gray-200",
                      loadingPrograms ? "opacity-50 cursor-not-allowed" : ""
                    )}
                  >
                    <option value="">Chọn chương trình học</option>
                    {programs.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.name} - {program.level}
                      </option>
                    ))}
                  </select>
                  {errors.programId && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle size={18} className="text-red-500" />
                    </div>
                  )}
                </div>
                {errors.programId && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.programId}
                  </p>
                )}
                {loadingPrograms && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Loader2 size={12} className="animate-spin" /> Đang tải dữ liệu chương trình...
                  </p>
                )}
              </div>
            ) : (
              /* Display program name in edit mode */
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <BookOpen size={16} className="text-red-600" />
                  Chương trình học
                </label>
                <div className="px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-700">
                  {document.programName || 'N/A'}
                </div>
              </div>
            )}

            {/* Level input */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <GraduationCap size={16} className="text-red-600" />
                Level *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.level}
                  onChange={(e) => {
                    setFormData({ ...formData, level: e.target.value });
                    if (errors.level) {
                      setErrors(prev => ({ ...prev, level: undefined }));
                    }
                  }}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border bg-white text-gray-900",
                    "focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
                    errors.level ? "border-red-500" : "border-gray-200"
                  )}
                  placeholder="VD: Beginner, Intermediate, Advanced"
                />
                {errors.level && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <AlertCircle size={18} className="text-red-500" />
                  </div>
                )}
              </div>
              {errors.level && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle size={14} /> {errors.level}
                </p>
              )}
            </div>

            {/* Session Index input */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Clock size={16} className="text-red-600" />
                Session Index *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={formData.sessionIndex}
                  onChange={(e) => {
                    setFormData({ ...formData, sessionIndex: parseInt(e.target.value) || 0 });
                    if (errors.sessionIndex) {
                      setErrors(prev => ({ ...prev, sessionIndex: undefined }));
                    }
                  }}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border bg-white text-gray-900",
                    "focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
                    errors.sessionIndex ? "border-red-500" : "border-gray-200"
                  )}
                  placeholder="Nhập số thứ tự session"
                />
                {errors.sessionIndex && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <AlertCircle size={18} className="text-red-500" />
                  </div>
                )}
              </div>
              {errors.sessionIndex && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle size={14} /> {errors.sessionIndex}
                </p>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Tag size={16} className="text-red-600" />
                Trạng thái
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: true, label: "Hoạt động", icon: <Power size={16} /> },
                  { value: false, label: "Không hoạt động", icon: <PowerOff size={16} /> }
                ].map((status) => (
                  <button
                    key={status.label}
                    type="button"
                    onClick={() => setFormData({ ...formData, isActive: status.value })}
                    className={cn(
                      "px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2",
                      formData.isActive === status.value
                        ? status.value
                          ? "bg-green-100 border-green-300 text-green-700"
                          : "bg-gray-100 border-gray-300 text-gray-700"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {status.icon}
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            {/* File upload section - only in create mode */}
            {!document && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Upload size={16} className="text-red-600" />
                  File tài liệu *
                </label>
                <div className="border-2 border-dashed border-red-200 rounded-xl p-8 text-center hover:bg-red-50 transition-colors cursor-pointer">
                  <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Kéo thả file hoặc click để chọn</p>
                  <p className="text-xs text-gray-400 mt-1">Hỗ trợ PDF, DOCX, PPTX, XLSX</p>
                </div>
              </div>
            )}

            {/* Attachment info in edit mode */}
            {document && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Upload size={16} className="text-red-600" />
                  File đính kèm
                </label>
                <div className="px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-700">
                  {document.attachment && document.attachment !== 'string' ? (
                    <div className="flex items-center gap-2">
                      <File size={16} className="text-gray-400" />
                      <span>{document.attachment}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400 italic">Chưa có file</span>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Modal Footer - Updated to match course modal */}
        <div className="border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 p-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (document) {
                    setFormData({
                      level: document.level || '',
                      sessionIndex: document.sessionIndex ?? 0,
                      attachment: document.attachment || '',
                      isActive: document.isActive ?? true,
                    });
                  } else {
                    setFormData({
                      level: '',
                      sessionIndex: 0,
                      attachment: '',
                      isActive: true,
                    });
                    setSelectedProgramId('');
                  }
                  setErrors({});
                }}
                className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {document ? "Khôi phục" : "Đặt lại"}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Đang lưu...
                  </div>
                ) : (
                  document ? "Lưu thay đổi" : "Tạo tài liệu"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}