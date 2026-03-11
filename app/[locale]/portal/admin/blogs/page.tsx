"use client";

import { useMemo, useState, useEffect } from "react";
import { 
  getAllBlogs, 
  getBlogById, 
  createBlog, 
  updateBlog, 
  deleteBlog, 
  publishBlog, 
  unpublishBlog 
} from "@/lib/api/blogService";
import type { Blog, CreateBlogRequest, UpdateBlogRequest } from "@/types/admin/blog";
import { toast } from "@/hooks/use-toast";
import BlogFormModal from "@/components/portal/admin/blogs/BlogFormModal";
import BlogDetailModal from "@/components/portal/admin/blogs/BlogDetailModal";
import ConfirmModal from "@/components/portal/admin/blogs/ConfirmModal";

import {
  Search,
  FileText,
  Eye,
  Edit,
  Trash2,
  Plus,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
  Send,
  Archive,
  Calendar,
  User,
  Tag,
} from "lucide-react";

type SortDirection = "asc" | "desc";

type SortState<T> = {
  key: keyof T | null;
  direction: SortDirection;
};

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

// Helper components
function StatCard({
  title,
  value,
  icon,
  color,
  subtitle,
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

function StatusBadge({ isPublished }: { isPublished: boolean }) {
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
      isPublished
        ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200'
        : 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200'
    }`}>
      {isPublished ? <CheckCircle size={10} /> : <Archive size={10} />}
      <span>{isPublished ? 'Đã xuất bản' : 'Bản nháp'}</span>
    </div>
  );
}

// Helper to format date from API
const formatDate = (dateString?: string): string => {
  if (!dateString) return "Chưa có";
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatDateTime = (dateString?: string): string => {
  if (!dateString) return "Chưa có";
  const date = new Date(dateString);
  return date.toLocaleString('vi-VN', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function BlogManagementPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  // Filter & Search
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null); // null = all, true = published, false = draft

  // Sorting & Pagination
  const [sort, setSort] = useState<SortState<Blog>>({ key: "createdAt", direction: "desc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Selection
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // Modals
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);

  // Statistics
  const [fixedCounts, setFixedCounts] = useState({
    total: 0,
    published: 0,
    draft: 0,
    thisMonth: 0,
  });

  // Toggle Sort
  const toggleSort = (key: keyof Blog) => {
    setSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Fetch blogs function (can be called multiple times)
  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await getAllBlogs({ page: 1, limit: 1000 });
        if (response.success || response.isSuccess) {
          // Backend returns: response.data.blogs.items
          const blogsData = response.data?.blogs?.items || [];
          setBlogs(blogsData);

          // Calculate statistics
          const now = new Date();
          const thisMonth = blogsData.filter((b: Blog) => {
            if (!b.createdAt) return false;
            const createdDate = new Date(b.createdAt);
            return createdDate.getMonth() === now.getMonth() && 
                   createdDate.getFullYear() === now.getFullYear();
          }).length;

          setFixedCounts({
            total: blogsData.length,
            published: blogsData.filter((b: Blog) => b.isPublished).length,
            draft: blogsData.filter((b: Blog) => !b.isPublished).length,
            thisMonth,
          });
        } else {
          setError(response.message || 'Không thể tải danh sách bài viết');
        }
      } catch (err) {
        console.error('Error fetching blogs:', err);
        setError('Đã xảy ra lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
      setIsPageLoaded(true);
    }
  };

  // Fetch blogs on mount
  useEffect(() => {
    fetchBlogs();
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // Handlers
  const handleViewDetail = (blog: Blog) => {
    setSelectedBlog(blog);
    setDetailModalOpen(true);
  };

  const handleOpenCreateModal = () => {
    setSelectedBlog(null);
    setFormMode('create');
    setFormModalOpen(true);
  };

  const handleOpenEditModal = (blog: Blog) => {
    setSelectedBlog(blog);
    setFormMode('edit');
    setFormModalOpen(true);
  };

  const handleOpenDeleteModal = (blog: Blog) => {
    setSelectedBlog(blog);
    setDeleteModalOpen(true);
  };

  const handleOpenPublishModal = (blog: Blog) => {
    setSelectedBlog(blog);
    setPublishModalOpen(true);
  };

  const handlePublishToggle = async () => {
    if (!selectedBlog) return;
    
    try {
      const response = selectedBlog.isPublished 
        ? await unpublishBlog(selectedBlog.id)
        : await publishBlog(selectedBlog.id);

      if (response.success || response.isSuccess) {
        toast({
          title: "Thành công",
          description: selectedBlog.isPublished 
            ? "Đã gỡ xuất bản bài viết" 
            : "Đã xuất bản bài viết",
          variant: "success",
        });
        setPublishModalOpen(false);
        
        // Reload data from server to get updated publishedAt date
        await fetchBlogs();
      } else {
        toast({
          title: "Lỗi",
          description: response.message || 'Không thể cập nhật trạng thái xuất bản',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error toggling publish status:', error);
      toast({
        title: "Lỗi",
        description: 'Đã xảy ra lỗi khi cập nhật trạng thái',
        variant: "destructive",
      });
    }
  };

  const handleDeleteBlog = async () => {
    if (!selectedBlog) return;
    
    try {
      const response = await deleteBlog(selectedBlog.id);
      
      if (response.success || response.isSuccess) {
        toast({
          title: "Thành công",
          description: "Đã xóa bài viết",
          variant: "success",
        });
        setDeleteModalOpen(false);
        
        // Remove from local state
        setBlogs(prev => prev.filter(b => b.id !== selectedBlog.id));
      } else {
        toast({
          title: "Lỗi",
          description: response.message || 'Không thể xóa bài viết',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting blog:', error);
      toast({
        title: "Lỗi",
        description: 'Đã xảy ra lỗi khi xóa bài viết',
        variant: "destructive",
      });
    }
  };

  // Filter and sort
  const list = useMemo(() => {
    let result = blogs;

    // Status filter
    if (statusFilter !== null) {
      result = result.filter(blog => blog.isPublished === statusFilter);
    }

    // Search filter
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      result = result.filter(blog =>
        blog.title.toLowerCase().includes(searchLower) ||
        blog.summary?.toLowerCase().includes(searchLower) ||
        blog.createdByName?.toLowerCase().includes(searchLower)
      );
    }

    // Sorting
    if (sort.key) {
      result = quickSort([...result], buildComparator(sort.key, sort.direction));
    }

    return result;
  }, [blogs, statusFilter, debouncedSearch, sort.key, sort.direction]);

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

  const SortHeader = ({
    label,
    sortKey,
    className,
  }: {
    label: string;
    sortKey: keyof Blog;
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

  const stats = [
    {
      title: 'Tổng bài viết',
      value: `${fixedCounts.total}`,
      icon: <FileText size={20} />,
      color: 'from-red-600 to-red-700',
      subtitle: 'Toàn hệ thống'
    },
    {
      title: 'Đã xuất bản',
      value: `${fixedCounts.published}`,
      icon: <Send size={20} />,
      color: 'from-emerald-500 to-teal-500',
      subtitle: 'Hiển thị công khai'
    },
    {
      title: 'Bản nháp',
      value: `${fixedCounts.draft}`,
      icon: <Archive size={20} />,
      color: 'from-amber-500 to-orange-500',
      subtitle: 'Đang soạn thảo'
    },
    {
      title: 'Bài viết mới',
      value: `+${fixedCounts.thisMonth}`,
      icon: <Plus size={20} />,
      color: 'from-blue-500 to-cyan-500',
      subtitle: 'Tháng này'
    }
  ];

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
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
              Quản lý Bản tin
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Tạo, chỉnh sửa và xuất bản bài viết cho hệ thống
            </p>
          </div>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer"
        >
          <Plus size={18} /> Tạo bài viết mới
        </button>
      </div>

      {/* Statistics */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Filters */}
      <div className={`rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-4 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tiêu đề, nội dung, tác giả..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter(null)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                statusFilter === null
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md'
                  : 'bg-white border border-red-200 text-gray-700 hover:bg-red-50'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setStatusFilter(true)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                statusFilter === true
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                  : 'bg-white border border-red-200 text-gray-700 hover:bg-red-50'
              }`}
            >
              Đã xuất bản
            </button>
            <button
              onClick={() => setStatusFilter(false)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                statusFilter === false
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                  : 'bg-white border border-red-200 text-gray-700 hover:bg-red-50'
              }`}
            >
              Bản nháp
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={`rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-all duration-700 delay-300 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Table Header */}
        <div className="bg-gradient-to-r from-red-500/10 to-red-700/10 border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Danh sách bài viết</h2>
              {selectedRows.length > 0 && (
                <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                  {selectedRows.length} đã chọn
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">{list.length} bài viết</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-red-500/5 to-red-700/5 border-b border-gray-200">
              <tr>
                <th className="py-3 px-4 text-center">
                  <input
                    type="checkbox"
                    checked={currentRows.length > 0 && selectedRows.length === currentRows.length}
                    onChange={toggleSelectAll}
                    className="w-5 h-5 text-red-600 border-red-300 rounded focus:ring-red-200 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-6 text-left">
                  <SortHeader label="Tiêu đề" sortKey="title" />
                </th>
                <th className="py-3 px-6 text-left">
                  <SortHeader label="Tác giả" sortKey="createdByName" />
                </th>
                <th className="py-3 px-6 text-left">
                  <SortHeader label="Trạng thái" sortKey="isPublished" />
                </th>
                <th className="py-3 px-6 text-left">
                  <SortHeader label="Ngày tạo" sortKey="createdAt" />
                </th>
                <th className="py-3 px-6 text-left">
                  <SortHeader label="Ngày xuất bản" sortKey="publishedAt" />
                </th>
                <th className="py-3 px-6 text-left">
                  <span className="text-sm font-semibold text-gray-700">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentRows.length > 0 ? (
                currentRows.map((blog) => (
                  <tr
                    key={blog.id}
                    className="group hover:bg-gradient-to-r hover:from-red-50/50 hover:to-white transition-all duration-200"
                  >
                    <td className="py-4 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(blog.id)}
                        onChange={() => toggleSelectRow(blog.id)}
                        className="w-5 h-5 text-red-600 border-red-300 rounded focus:ring-red-200 cursor-pointer"
                      />
                    </td>
                    <td className="py-4 px-6">
                      <div className="max-w-md">
                        <div className="font-medium text-gray-900 line-clamp-2">{blog.title}</div>
                        {blog.summary && (
                          <div className="text-xs text-gray-500 mt-1 line-clamp-1">{blog.summary}</div>
                        )}
                        {blog.tags && blog.tags.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {blog.tags.slice(0, 3).map((tag, i) => (
                              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-700 border border-red-200">
                                <Tag size={8} />
                                {tag}
                              </span>
                            ))}
                            {blog.tags.length > 3 && (
                              <span className="text-xs text-gray-500">+{blog.tags.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-700">{blog.createdByName || 'Không có'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge isPublished={blog.isPublished} />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Calendar size={12} className="text-gray-400" />
                        {formatDate(blog.createdAt)}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-700">
                        {blog.publishedAt ? formatDateTime(blog.publishedAt) : '—'}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleViewDetail(blog)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600 cursor-pointer"
                          title="Xem chi tiết"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(blog)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors text-gray-400 hover:text-blue-600 cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenPublishModal(blog)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            blog.isPublished
                              ? 'hover:bg-amber-50 text-gray-400 hover:text-amber-600'
                              : 'hover:bg-emerald-50 text-gray-400 hover:text-emerald-600'
                          }`}
                          title={blog.isPublished ? 'Gỡ xuất bản' : 'Xuất bản'}
                        >
                          {blog.isPublished ? <Archive size={14} /> : <Send size={14} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDeleteModal(blog)}
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
                      <Search size={24} className="text-red-400" />
                    </div>
                    <div className="text-gray-600 font-medium">Không tìm thấy bài viết</div>
                    <div className="text-sm text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc tạo bài viết mới</div>
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
                <span className="font-semibold text-gray-900">{list.length}</span> bài viết
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
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          currentPage === pageNum
                            ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md'
                            : 'text-gray-700 hover:bg-red-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
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
        )}        </div>

      {/* Modals */}
      <BlogFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSuccess={(blog) => {
          if (formMode === "create") {
            setBlogs((prev) => [blog, ...prev]);
            setFixedCounts((prev) => ({
              ...prev,
              total: prev.total + 1,
              draft: prev.draft + 1,
            }));
          } else {
            setBlogs((prev) => prev.map((b) => (b.id === blog.id ? blog : b)));
          }
        }}
        blog={selectedBlog}
        mode={formMode}
      />

      <BlogDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        blog={selectedBlog}
      />

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteBlog}
        title="Xóa bài viết"
        message={`Bạn có chắc chắn muốn xóa bài viết "${selectedBlog?.title || ""}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
      />

      <ConfirmModal
        isOpen={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        onConfirm={handlePublishToggle}
        title={selectedBlog?.isPublished ? "Gỡ xuất bản" : "Xuất bản bài viết"}
        message={
          selectedBlog?.isPublished
            ? `Bạn có chắc chắn muốn gỡ xuất bản bài viết "${selectedBlog?.title || ""}"? Bài viết sẽ không còn hiển thị công khai.`
            : `Bạn có chắc chắn muốn xuất bản bài viết "${selectedBlog?.title || ""}"? Bài viết sẽ hiển thị công khai cho mọi người xem.`
        }
        confirmText={selectedBlog?.isPublished ? "Gỡ xuất bản" : "Xuất bản"}
        cancelText="Hủy"
        variant={selectedBlog?.isPublished ? "warning" : "info"}
      />
    </div>
  );
}
