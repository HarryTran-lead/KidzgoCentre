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
                  <td colSpan={6} className="py-12 text-center">
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

      {/* Detail Modal */}
      {showDetailModal && selectedDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDetailModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-red-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Chi tiết tài liệu</h3>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-r from-red-100 to-red-200">
                  <FileText size={32} className="text-red-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-semibold text-gray-900">{selectedDocument.programName || 'N/A'}</h4>
                  <p className="text-sm text-gray-500 mt-1">Chương trình học</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Level</label>
                  <div className="mt-1 text-sm text-gray-900">{selectedDocument.level || 'N/A'}</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Session</label>
                  <div className="mt-1 text-sm text-gray-900">Session {selectedDocument.sessionIndex ?? '-'}</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">File đính kèm</label>
                  <div className="mt-1 text-sm text-gray-900">{selectedDocument.attachment && selectedDocument.attachment !== 'string' ? selectedDocument.attachment : 'Chưa có file'}</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Trạng thái</label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedDocument.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedDocument.isActive ? 'Hoạt động' : 'Không hoạt động'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Người tạo</label>
                  <div className="mt-1 text-sm text-gray-900">{selectedDocument.createdByName || 'N/A'}</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Ngày tạo</label>
                  <div className="mt-1 text-sm text-gray-900">{formatDate(selectedDocument.createdAt)}</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Lần sử dụng</label>
                  <div className="mt-1 text-sm text-gray-900">{selectedDocument.usedCount ?? 0}</div>
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-2 border-t border-red-200">
              <button 
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Đóng
              </button>
              <button 
                onClick={() => {
                  setShowDetailModal(false);
                  handleEdit(selectedDocument);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 rounded-xl hover:shadow-lg cursor-pointer"
              >
                Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-6 text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <Trash2 size={32} className="text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Xác nhận xóa tài liệu</h3>
              <p className="text-gray-600">
                Bạn có chắc chắn muốn xóa tài liệu "{selectedDocument.programId || 'N/A'}"? Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="flex gap-2 px-6 pb-6">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 cursor-pointer"
              >
                Hủy
              </button>
              <button 
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 cursor-pointer"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
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

// Document Form Modal Component
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (document) {
        // Update mode - use UpdateDocumentRequest
        await onSubmit(formData as UpdateDocumentRequest);
      } else {
        // Create mode - need programId from select
        const programSelect = (e.target as HTMLFormElement).elements.namedItem('programId') as HTMLSelectElement;
        const programId = programSelect?.value;
        if (!programId) {
          toast({
            title: "Lỗi",
            description: "Vui lòng chọn chương trình học",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        await onSubmit({
          programId,
          ...formData,
        } as CreateDocumentRequest);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-red-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {document ? 'Chỉnh sửa tài liệu' : 'Tạo tài liệu mới'}
          </h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {/* Program selection - only show in create mode */}
            {!document && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chương trình học *</label>
                <select 
                  name="programId"
                  className="w-full px-4 py-2.5 rounded-xl border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-200 bg-white"
                  required
                  disabled={loadingPrograms}
                >
                  <option value="">Chọn chương trình học</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name} - {program.level}
                    </option>
                  ))}
                </select>
                {loadingPrograms && (
                  <p className="text-xs text-gray-500 mt-1">Đang tải dữ liệu chương trình...</p>
                )}
              </div>
            )}

            {/* Display program name in edit mode */}
            {document && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chương trình học</label>
                <div className="px-4 py-2.5 rounded-xl border border-red-100 bg-red-50 text-gray-700">
                  {document.programName || 'N/A'}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Level *</label>
              <input 
                type="text" 
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-200"
                placeholder="Nhập level (VD: Beginner, Intermediate)"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Index *</label>
              <input 
                type="number" 
                min="0"
                value={formData.sessionIndex}
                onChange={(e) => setFormData({ ...formData, sessionIndex: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 rounded-xl border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-200"
                placeholder="Nhập số thứ tự session"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="isActive"
                    checked={formData.isActive === true}
                    onChange={() => setFormData({ ...formData, isActive: true })}
                    className="h-4 w-4 text-red-600 border-red-300 focus:ring-red-200"
                  />
                  <span className="text-sm text-gray-700">Hoạt động</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="isActive"
                    checked={formData.isActive === false}
                    onChange={() => setFormData({ ...formData, isActive: false })}
                    className="h-4 w-4 text-red-600 border-red-300 focus:ring-red-200"
                  />
                  <span className="text-sm text-gray-700">Không hoạt động</span>
                </label>
              </div>
            </div>

            {!document && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File tài liệu *</label>
                <div className="border-2 border-dashed border-red-200 rounded-xl p-8 text-center hover:bg-red-50 transition-colors cursor-pointer">
                  <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Kéo thả file hoặc click để chọn</p>
                  <p className="text-xs text-gray-400 mt-1">Hỗ trợ PDF, DOCX, PPTX, XLSX</p>
                </div>
              </div>
            )}
          </div>
          <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-2 border-t border-red-200">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl cursor-pointer"
            >
              Hủy
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 rounded-xl hover:shadow-lg cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Đang lưu...' : (document ? 'Lưu thay đổi' : 'Tạo tài liệu')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
