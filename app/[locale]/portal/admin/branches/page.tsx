'use client';

import { useMemo, useState, useEffect } from 'react';
import { 
  MapPin, Users, PencilLine, Plus, Building2, 
  Sparkles, MoreVertical, Search, Filter,
  ChevronRight, Globe, CheckCircle,
  AlertCircle, Loader2, X, Trash2
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
    red: "bg-rose-50 text-rose-700 border border-rose-200",
    green: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    purple: "bg-purple-50 text-purple-700 border border-purple-200",
    yellow: "bg-amber-50 text-amber-700 border border-amber-200",
    pink: "bg-pink-50 text-pink-700 border border-pink-200",
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
  color = "from-pink-500 to-rose-500"
}: { 
  label: string; 
  value: string | number; 
  change?: number; 
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-pink-100 bg-gradient-to-br from-white to-pink-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md">
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
                    ? 'text-rose-600 bg-rose-50'
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

export default function BranchesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        // Try to extract branch data from different possible structures
        const branchData = response.data.branch || response.data;
        console.log('Branch data to display:', branchData);
        setSelectedBranch(branchData);
        setShowDetailModal(true);
      } else {
        console.error('Failed to load branch details:', response);
        toast({
          title: "Lỗi",
          description: "Không thể tải chi tiết chi nhánh",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching branch details:', error);
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi tải chi tiết",
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
      const response = await updateBranch(id, data);
      
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
        toast({
          title: "Lỗi",
          description: response.message || "Không thể cập nhật chi nhánh",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating branch:', error);
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi cập nhật chi nhánh",
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

  // Handler: Open Edit Modal
  const handleOpenEditModal = (branch: Branch) => {
    setSelectedBranch(branch);
    setShowEditModal(true);
  };

  const filteredBranches = useMemo(() => {
    return branches;
  }, [branches]);

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
    <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
            <Building2 size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Quản lý chi nhánh
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Theo dõi và quản lý toàn bộ chi nhánh của hệ thống KidzGo
            </p>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={16} />
          Thêm chi nhánh mới
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          label="Tổng chi nhánh" 
          value={stats.total} 
          icon={<Building2 size={20} />}
          color="from-pink-500 to-rose-500"
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
      <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-500" size={16} />
            <input
              type="text"
              placeholder="Tìm kiếm chi nhánh theo tên, địa chỉ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-pink-200 bg-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-200"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 border border-pink-200 rounded-xl bg-white">
              <Filter size={16} className="text-pink-500" />
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
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      )}

      {/* Branches Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBranches.map((branch) => (
          <div 
            key={branch.id}
            className="group rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-pink-100/50"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-1 bg-pink-50 text-pink-700 text-xs font-medium rounded-full border border-pink-200">
                    {branch.code}
                  </span>
                  <StatusIndicator isActive={branch.isActive} />
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2 group-hover:text-pink-600 transition-colors">
                  {branch.name}
                </h3>
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin size={14} className="mt-0.5 text-pink-500 flex-shrink-0" />
                  <span className="line-clamp-2">{branch.address}</span>
                </div>
                {branch.contactPhone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <span className="text-xs">📱 {branch.contactPhone}</span>
                  </div>
                )}
                {branch.contactEmail && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <span className="text-xs">📧 {branch.contactEmail}</span>
                  </div>
                )}
              </div>
              <button className="p-2 rounded-lg hover:bg-pink-50 transition-colors opacity-0 group-hover:opacity-100">
                <MoreVertical size={16} className="text-gray-400" />
              </button>
            </div>

            {/* Stats */}
            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-3 border border-pink-100">
                  <div className="text-xs text-gray-500 mb-1">Học viên</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-gray-900">{branch.totalStudents || 0}</span>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-3 border border-pink-100">
                  <div className="text-xs text-gray-500 mb-1">Lớp học</div>
                  <div className="text-lg font-bold text-gray-900">{branch.totalClasses || 0}</div>
                  <div className="text-xs text-gray-500 mt-1">{branch.totalTeachers || 0} giáo viên</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-pink-100">
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEditModal(branch);
                  }}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                >
                  <PencilLine size={14} />
                  Chỉnh sửa
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenConfirmDeactivate(branch);
                  }}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                  disabled={!branch.isActive}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <button 
                onClick={() => handleViewDetail(branch.id)}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-pink-700 hover:text-pink-800 hover:bg-pink-50 rounded-lg transition-colors"
              >
                Xem chi tiết
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredBranches.length === 0 && (
        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 p-12 text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-pink-100 to-rose-100 flex items-center justify-center">
            <Building2 size={24} className="text-pink-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Không tìm thấy chi nhánh</h3>
          <p className="text-sm text-gray-600 max-w-md mx-auto">
            Không có chi nhánh nào phù hợp với tiêu chí tìm kiếm của bạn
          </p>
        </div>
      )}

      {/* Footer */}
      {!isLoading && (
        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Sparkles size={16} className="text-pink-500" />
              <span>Hiển thị {filteredBranches.length} chi nhánh</span>
            </div>
            <div className="flex items-center gap-4 text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span>Đang hoạt động</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                <span>Không hoạt động</span>
              </div>
            </div>
          </div>
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
    </div>
  );
}

/* ==================== Modal Components ==================== */
