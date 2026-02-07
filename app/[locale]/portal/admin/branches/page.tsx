'use client';

import { useMemo, useState, useEffect } from 'react';
import { 
  MapPin,
  Users,
  PencilLine,
  Plus,
  Building2,
  Sparkles,
  MoreVertical,
  Search,
  Filter,
  ChevronRight,
  Globe,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Trash2,
  RefreshCw,
  EyeIcon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { 
  getAllBranches, 
  getBranchById,
  createBranch, 
  updateBranch, 
  updateBranchStatus 
} from '@/lib/api/branchService';
import type { Branch, CreateBranchRequest, UpdateBranchRequest } from '@/types/branch';
import { toast } from '@/hooks/use-toast';
import BranchFormModal from '@/components/portal/branches/BranchFormModal';
import BranchDetailModal from '@/components/admin/branches/BranchDetailModal';
import ConfirmModal from '@/components/ConfirmModal';

function Badge({
  color = "gray",
  children
}: {
  color?: "gray" | "blue" | "red" | "green" | "purple" | "yellow" | "pink" | "orange";
  children: React.ReactNode;
}) {
  const colorClasses = {
    gray: "bg-gray-100 text-gray-700 border border-gray-200",
    blue: "bg-blue-50 text-blue-700 border border-blue-200",
    red: "bg-red-50 text-red-700 border border-red-200",
    green: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    purple: "bg-purple-50 text-purple-700 border border-purple-200",
    yellow: "bg-amber-50 text-amber-700 border border-amber-200",
    pink: "bg-red-50 text-red-700 border border-red-200",
    orange: "bg-orange-50 text-orange-700 border border-orange-200"
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colorClasses[color]}`}>
      {children}
    </span>
  );
}

function StatusIndicator({ isActive }: { isActive: boolean }) {
  const config = isActive 
    ? {
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-100',
        text: 'Đang hoạt động',
        icon: CheckCircle
      }
    : {
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
        text: 'Không hoạt động',
        icon: AlertCircle
      };

  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${config.bgColor} ${config.color} text-xs font-medium`}>
      <Icon size={12} />
      {config.text}
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  change, 
  icon,
  color = "from-red-600 to-red-700"
}: { 
  label: string; 
  value: string | number; 
  change?: number; 
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className={`absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl bg-gradient-to-r ${color}`}></div>
      <div className="relative flex items-center justify-between gap-3">
        <div className={`p-2 rounded-xl bg-gradient-to-r ${color} text-white shadow-sm flex-shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-medium text-gray-600 truncate">{label}</div>
            {change !== undefined && (
              <span className={`flex-shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                change > 0 
                  ? 'text-emerald-600 bg-emerald-50' 
                  : change < 0 
                    ? 'text-red-600 bg-red-50'
                    : 'text-gray-600 bg-gray-50'
              }`}>
                {change > 0 ? '+' : ''}{change}%
              </span>
            )}
          </div>
          <div className="text-xl font-bold text-gray-900 leading-tight">{value}</div>
        </div>
      </div>
    </div>
  );
}

type BranchSortField = 'code' | 'name' | 'address' | 'totalStudents' | 'totalClasses' | 'totalTeachers';
type BranchSortDirection = 'asc' | 'desc' | null;

function SortableHeader({
  field,
  currentField,
  direction,
  onSort,
  children,
  align = 'left',
}: {
  field: BranchSortField;
  currentField: BranchSortField | null;
  direction: BranchSortDirection;
  onSort: (f: BranchSortField) => void;
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
}) {
  const isActive = currentField === field;
  const icon = isActive ? (
    direction === 'asc' ? <ArrowUp size={14} className="text-red-600" /> : <ArrowDown size={14} className="text-red-600" />
  ) : (
    <ArrowUpDown size={14} className="text-gray-400" />
  );
  const alignClass =
    align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';

  return (
    <th
      onClick={() => onSort(field)}
      className={`py-3 px-6 ${alignClass} text-sm font-semibold text-gray-700 whitespace-nowrap cursor-pointer select-none hover:bg-red-50 transition-colors`}
    >
      <span className="inline-flex items-center gap-2">
        {children}
        {icon}
      </span>
    </th>
  );
}

export default function BranchesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortField, setSortField] = useState<BranchSortField | null>(null);
  const [sortDirection, setSortDirection] = useState<BranchSortDirection>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  // Fetch branches from API
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setIsLoading(true);
        const params = {
          page: currentPage,
          limit: 20,
          search: searchQuery || undefined,
          // Remove isActive filter to get all branches
          sortBy: 'createdAt' as const,
          sortOrder: 'desc' as const,
        };

        const response = await getAllBranches(params);
        
        // Check if response structure has nested data
        const responseData = response.data;
        
        if ((response.success || response.isSuccess) && responseData) {
          setBranches(responseData.branches || []);
          setTotalPages(responseData.pagination?.totalPages || 1);
        } else {
          toast({
            title: "Lỗi",
            description: response.message || "Không thể tải danh sách chi nhánh",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error fetching branches:', error);
        toast({
          title: "Lỗi",
          description: "Có lỗi xảy ra khi tải danh sách chi nhánh",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBranches();
  }, [currentPage, searchQuery, filterStatus]);

  // Handler: View Details
  const handleViewDetail = async (branchId: string) => {
    try {
      console.log('Fetching branch details for ID:', branchId);
      const response = await getBranchById(branchId);
      console.log('Branch detail response:', response);
      
      if ((response.success || response.isSuccess) && response.data) {
        // API returns: { isSuccess: true, data: { id, code, name, ... } }
        const branchData = response.data.branch || response.data;
        console.log('Branch data to display:', branchData);
        setSelectedBranch(branchData);
        setShowDetailModal(true);
      } else {
        const errorMsg = response.message || "Không thể tải chi tiết chi nhánh";
        console.error('Failed to load branch details:', response);
        toast({
          title: "Lỗi",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error fetching branch details:', error);
      const errorMsg = error?.response?.data?.message || error?.message || "Có lỗi xảy ra khi tải chi tiết";
      toast({
        title: "Lỗi",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  // Handler: Add Branch
  const handleAddBranch = async (data: CreateBranchRequest) => {
    try {
      setIsSubmitting(true);
      console.log('Creating branch with data:', data);
      const response = await createBranch(data);
      console.log('Create branch response:', response);
      
      if ((response.success || response.isSuccess)) {
        toast({
          title: "Thành công",
          description: "Thêm chi nhánh mới thành công",
          variant: "success",
        });
        setShowAddModal(false);
        // Refresh list
        const params = {
          page: currentPage,
          limit: 20,
          search: searchQuery || undefined,
          sortBy: 'createdAt' as const,
          sortOrder: 'desc' as const,
        };
        const refreshResponse = await getAllBranches(params);
        const responseData = refreshResponse.data;
        if (responseData) {
          setBranches(responseData.branches || []);
        }
      } else {
        const errorMsg = response.message || response.data?.message || "Không thể thêm chi nhánh";
        toast({
          title: "Lỗi",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error creating branch:', error);
      const errorMsg = error?.response?.data?.message || error?.message || "Có lỗi xảy ra khi thêm chi nhánh";
      toast({
        title: "Lỗi",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Edit Branch
  const handleEditBranch = async (id: string, data: UpdateBranchRequest) => {
    try {
      setIsSubmitting(true);
      console.log('Updating branch with ID:', id, 'Data:', data);
      const response = await updateBranch(id, data);
      console.log('Update branch response:', response);
      
      if ((response.success || response.isSuccess)) {
        toast({
          title: "Thành công",
          description: "Cập nhật chi nhánh thành công",
          variant: "success",
        });
        setShowEditModal(false);
        setSelectedBranch(null);
        // Refresh list
        const params = {
          page: currentPage,
          limit: 20,
          search: searchQuery || undefined,
          sortBy: 'createdAt' as const,
          sortOrder: 'desc' as const,
        };
        const refreshResponse = await getAllBranches(params);
        const responseData = refreshResponse.data;
        if (responseData) {
          setBranches(responseData.branches || []);
        }
      } else {
        const errorMsg = response.message || response.data?.message || "Không thể cập nhật chi nhánh";
        toast({
          title: "Lỗi",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error updating branch:', error);
      const errorMsg = error?.response?.data?.message || error?.message || "Có lỗi xảy ra khi cập nhật chi nhánh";
      toast({
        title: "Lỗi",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Open Confirm Modal for Deactivate
  const handleOpenConfirmDeactivate = (branch: Branch) => {
    // Close detail modal if it's open
    setShowDetailModal(false);
    setSelectedBranch(branch);
    setShowConfirmModal(true);
  };

  // Handler: Soft Delete (Deactivate)
  const handleDeactivateBranch = async () => {
    if (!selectedBranch) return;
    
    try {
      setIsSubmitting(true);
      const response = await updateBranchStatus(selectedBranch.id, { isActive: false });
      
      if ((response.success || response.isSuccess)) {
        toast({
          title: "Thành công",
          description: "Đã vô hiệu hóa chi nhánh",
          variant: "success",
        });
        setShowConfirmModal(false);
        setSelectedBranch(null);
        // Update local state
        setBranches(prev => prev.map(b => 
          b.id === selectedBranch.id ? { ...b, isActive: false } : b
        ));
      } else {
        toast({
          title: "Lỗi",
          description: response.message || "Không thể vô hiệu hóa chi nhánh",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deactivating branch:', error);
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi vô hiệu hóa chi nhánh",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Activate Branch
  const handleOpenActivateModal = (branch: Branch) => {
    setSelectedBranch(branch);
    setShowActivateModal(true);
  };

  const handleActivateBranch = async () => {
    if (!selectedBranch) return;
    try {
      setIsSubmitting(true);
      const response = await updateBranchStatus(selectedBranch.id, { isActive: true });
      
      if ((response.success || response.isSuccess)) {
        toast({
          title: "Thành công",
          description: "Đã kích hoạt chi nhánh",
          variant: "success",
        });
        setShowActivateModal(false);
        setSelectedBranch(null);
        // Update local state
        setBranches(prev => prev.map(b => 
          b.id === selectedBranch.id ? { ...b, isActive: true } : b
        ));
      } else {
        toast({
          title: "Lỗi",
          description: response.message || "Không thể kích hoạt chi nhánh",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error activating branch:', error);
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi kích hoạt chi nhánh",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Open Edit Modal
  const handleOpenEditModal = (branch: Branch) => {
    setSelectedBranch(branch);
    setShowEditModal(true);
  };

  const filteredBranches = useMemo(() => {
    let result = branches;
    
    // Apply status filter
    if (filterStatus === 'active') {
      result = result.filter(b => b.isActive);
    } else if (filterStatus === 'inactive') {
      result = result.filter(b => !b.isActive);
    }
    
    return result;
  }, [branches, filterStatus]);
  const sortedBranches = useMemo(() => {
    let result = [...filteredBranches];

    if (sortField && sortDirection) {
      result.sort((a, b) => {
        const getVal = (branch: Branch) => {
          switch (sortField) {
            case 'code':
              return branch.code ?? '';
            case 'name':
              return branch.name ?? '';
            case 'address':
              return branch.address ?? '';
            case 'totalStudents':
              return branch.totalStudents ?? 0;
            case 'totalClasses':
              return branch.totalClasses ?? 0;
            case 'totalTeachers':
              return branch.totalTeachers ?? 0;
          }
        };

        const av = getVal(a);
        const bv = getVal(b);

        if (typeof av === 'number' && typeof bv === 'number') {
          return sortDirection === 'asc' ? av - bv : bv - av;
        }

        const aStr = (av ?? '').toString();
        const bStr = (bv ?? '').toString();

        return sortDirection === 'asc'
          ? aStr.localeCompare(bStr, undefined, { numeric: true, sensitivity: 'base' })
          : bStr.localeCompare(aStr, undefined, { numeric: true, sensitivity: 'base' });
      });
    }

    return result;
  }, [filteredBranches, sortField, sortDirection]);

  const handleSort = (field: BranchSortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      } else setSortDirection('asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const stats = useMemo(() => {
    const total = branches.length;
    const active = branches.filter(b => b.isActive).length;
    const totalStudents = branches.reduce((sum, b) => sum + (b.totalStudents || 0), 0);
    const totalClasses = branches.reduce((sum, b) => sum + (b.totalClasses || 0), 0);
    
    return {
      total,
      active,
      totalStudents,
      totalClasses,
    };
  }, [branches]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6 space-y-6">
      {/* Header */}
      <div className={`flex flex-wrap items-center justify-between gap-4 transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
            <Building2 size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
              Quản lý chi nhánh
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Theo dõi và quản lý toàn bộ chi nhánh của hệ thống KidzGo
            </p>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={16} />
          Thêm chi nhánh mới
        </button>
      </div>

      {/* Stats Overview */}
      <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <StatCard 
          label="Tổng chi nhánh" 
          value={stats.total} 
          icon={<Building2 size={20} />}
          color="from-red-600 to-red-700"
        />
        <StatCard 
          label="Đang hoạt động" 
          value={stats.active} 
          icon={<CheckCircle size={20} />}
          color="from-emerald-500 to-teal-500"
        />
        <StatCard 
          label="Tổng học viên" 
          value={stats.totalStudents} 
          change={12.5}
          icon={<Users size={20} />}
          color="from-blue-500 to-cyan-500"
        />
        <StatCard 
          label="Lớp học" 
          value={stats.totalClasses} 
          change={8.3}
          icon={<Globe size={20} />}
          color="from-purple-500 to-violet-500"
        />
      </div>

      {/* Filters and Search */}
      <div className={`rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-4 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-600" size={16} />
            <input
              type="text"
              placeholder="Tìm kiếm chi nhánh theo tên, địa chỉ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-red-200 bg-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 border border-red-200 rounded-xl bg-white">
              <Filter size={16} className="text-red-600" />
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                className="text-sm bg-transparent outline-none text-gray-700"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Không hoạt động</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className={`flex items-center justify-center py-20 transition-all duration-700 delay-200 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        </div>
      )}

      {/* Branches Table */}
      {!isLoading && (
        <div className={`rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 shadow-sm overflow-hidden transition-all duration-700 delay-200 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Table Header */}
          <div className="bg-gradient-to-r from-red-500/10 to-red-700/10 border-b border-red-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Danh sách chi nhánh</h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">{filteredBranches.length} chi nhánh</span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-red-500/5 to-red-700/5 border-b border-red-200">
                <tr>
                  <SortableHeader
                    field="code"
                    currentField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                  >
                    Mã chi nhánh
                  </SortableHeader>
                  <SortableHeader
                    field="name"
                    currentField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                  >
                    Tên chi nhánh
                  </SortableHeader>
                  <SortableHeader
                    field="address"
                    currentField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                  >
                    Địa chỉ
                  </SortableHeader>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Liên hệ</th>
                  <SortableHeader
                    field="totalStudents"
                    currentField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                    align="center"
                  >
                    Học viên
                  </SortableHeader>
                  <SortableHeader
                    field="totalClasses"
                    currentField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                    align="center"
                  >
                    Lớp học
                  </SortableHeader>
                  <SortableHeader
                    field="totalTeachers"
                    currentField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                    align="center"
                  >
                    Giáo viên
                  </SortableHeader>
                  <th className="py-3 px-6 text-center text-sm font-semibold text-gray-700">Trạng thái</th>
                  <th className="py-3 px-6 text-right text-sm font-semibold text-gray-700">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {sortedBranches.length > 0 ? (
                  sortedBranches.map((branch) => (
                    <tr
                      key={branch.id}
                      className="group hover:bg-red-50/50 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-full border border-red-200">
                          {branch.code}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className=" text-gray-900">{branch.name}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-start gap-2 text-sm text-gray-600 max-w-xs">
                          <MapPin size={14} className="mt-0.5 text-red-600 flex-shrink-0" />
                          <span className="line-clamp-2">{branch.address}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-1 text-sm text-gray-600">
                          {branch.contactPhone && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs">{branch.contactPhone}</span>
                            </div>
                          )}
                          {branch.contactEmail && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs truncate max-w-[200px]">{branch.contactEmail}</span>
                            </div>
                          )}
                          {!branch.contactPhone && !branch.contactEmail && (
                            <span className="text-xs text-gray-400">Chưa có</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-lg text-gray-900">{branch.totalStudents || 0}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-lg text-gray-900">{branch.totalClasses || 0}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-lg text-gray-900">{branch.totalTeachers || 0}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <StatusIndicator isActive={branch.isActive} />
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewDetail(branch.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <EyeIcon size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(branch);
                            }}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Chỉnh sửa"
                          >
                            <PencilLine size={16} />
                          </button>
                          {branch.isActive ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenConfirmDeactivate(branch);
                              }}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Vô hiệu hóa"
                            >
                              <Trash2 size={16} />
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenActivateModal(branch);
                              }}
                              className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Kích hoạt"
                            >
                              <RefreshCw size={16} />
                            </button>
                          )}
                        </div> 
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center">
                      <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-red-100 to-red-200 flex items-center justify-center">
                        <Building2 size={24} className="text-red-400" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Không tìm thấy chi nhánh</h3>
                      <p className="text-sm text-gray-600">
                        Không có chi nhánh nào phù hợp với tiêu chí tìm kiếm của bạn
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-red-200 bg-gradient-to-r from-red-500/5 to-red-700/5 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Trang <span className="font-semibold text-gray-900">{currentPage}</span> / <span className="font-semibold text-gray-900">{totalPages}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Trước
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Sau
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}


      {/* Modal: View Detail */}
      <BranchDetailModal 
        isOpen={showDetailModal && !!selectedBranch}
        branch={selectedBranch} 
        onClose={() => {
          setShowDetailModal(false);
          setSelectedBranch(null);
        }} 
      />

      {/* Modal: Add/Edit Branch - Using unified component */}
      <BranchFormModal
        mode={showAddModal ? 'add' : 'edit'}
        branch={selectedBranch || undefined}
        isOpen={showAddModal || showEditModal}
        onClose={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          setSelectedBranch(null);
        }}
        onSubmit={(data) => {
          if (showAddModal) {
            handleAddBranch(data as CreateBranchRequest);
          } else if (showEditModal && selectedBranch) {
            handleEditBranch(selectedBranch.id, data as UpdateBranchRequest);
          }
        }}
        isSubmitting={isSubmitting}
      />

      {/* Confirm Deactivate Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setSelectedBranch(null);
        }}
        onConfirm={handleDeactivateBranch}
        title="Xác nhận xóa chi nhánh"
        message={`Bạn có chắc chắn muốn xóa chi nhánh "${selectedBranch?.name}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
        isLoading={isSubmitting}
      />

      {/* Confirm Activate Modal */}
      <ConfirmModal
        isOpen={showActivateModal}
        onClose={() => {
          setShowActivateModal(false);
          setSelectedBranch(null);
        }}
        onConfirm={handleActivateBranch}
        title="Xác nhận kích hoạt chi nhánh"
        message={`Bạn có chắc chắn muốn kích hoạt lại chi nhánh "${selectedBranch?.name}"?`}
        confirmText="Kích hoạt"
        cancelText="Hủy"
        variant="success"
        isLoading={isSubmitting}
      />
    </div>
  );
}

/* ==================== Modal Components ==================== */
