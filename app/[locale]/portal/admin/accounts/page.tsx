"use client";

import { useMemo, useState, useEffect } from "react";
import { getAllUsers, updateUserStatus, createUser, updateUser, deleteUser, getUserById } from "@/lib/api/userService";
import type { User, UserRole, CreateUserRequest, UpdateUserRequest } from "@/types/admin/user";
import AccountDetailModal from "@/components/admin/accounts/AccountDetailModal";
import AccountFormModal from "@/components/admin/accounts/AccountFormModal";
import ConfirmModal from "@/components/ConfirmModal";
import { toast } from "@/hooks/use-toast";

// Import Profile Management Components
import {  
  getAllStudents, 
  createParentAccount, 
  createStudentProfile,
  deleteProfile
} from "@/lib/api/profileService";
import type { CreateParentAccountRequest, CreateStudentProfileRequest } from "@/types/profile";
import CreateParentAccountModal from "@/components/admin/profile/CreateParentAccountModal";
import CreateStudentProfileModal from "@/components/admin/profile/CreateStudentProfileModal";
import ViewLinkedStudentsModal from "@/components/admin/profile/ViewLinkedStudentsModal";
import ProfileDetailModal from "@/components/admin/profile/ProfileDetailModal";

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

import {
  Search,
  ShieldCheck,
  UserPlus,
  Lock,
  Mail,
  Phone,
  Filter,
  Users,
  Key,
  Bell,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Calendar,
  Loader2,
  User as UserIcon,
  UserCircle,
  Shield,
  Trash2,
} from "lucide-react";

// Map UserRole from API to local Role type
type Role = "Admin" | "Teacher" | "Parent" | "ManagementStaff";

type Account = User & {
  name: string;
  phone?: string;
  lastLoginAt?: string;
  avatarColor: string;
  twoFactor: boolean;
  department?: string;
};

// Helper function to map API role to display role
const mapRoleToDisplay = (apiRole: UserRole): Role => {
  const roleMap: Record<UserRole, Role> = {
    'Admin': 'Admin',
    'Teacher': 'Teacher',
    'Parent': 'Parent',
    'ManagementStaff': 'ManagementStaff'
  };
  return roleMap[apiRole];
};

// Helper to generate random avatar color
const getAvatarColor = (id: string): string => {
  const colors = [
    "from-pink-400 to-rose-500",
    "from-blue-400 to-cyan-500",
    "from-emerald-400 to-teal-500",
    "from-violet-400 to-purple-500",
    "from-amber-400 to-orange-500",
    "from-indigo-400 to-blue-500",
    "from-rose-400 to-pink-500",
  ];
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

// Helper to get department based on role
const getDepartment = (role: UserRole): string => {
  const departments: Record<UserRole, string> = {
    'Admin': 'Administration',
    'Teacher': 'Academic',
    'Parent': 'Parents',
    'ManagementStaff': 'Management'
  };
  return departments[role];
};


const ROLE_INFO: Record<Role, {
  label: string;
  cls: string;
  bg: string;
  icon: React.ReactNode;
}> = {
  Admin: {
    label: "Quản trị",
    cls: "bg-gradient-to-r from-pink-50 to-rose-50 text-pink-700 border border-pink-200",
    bg: "from-pink-400 to-rose-500",
    icon: <ShieldCheck size={12} />
  },
  Teacher: {
    label: "Giáo viên",
    cls: "bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border border-blue-200",
    bg: "from-blue-400 to-cyan-500",
    icon: <UserIcon size={12} />
  },
  Parent: {
    label: "Phụ huynh",
    cls: "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200",
    bg: "from-emerald-400 to-teal-500",
    icon: <Users size={12} />
  },
  ManagementStaff: {
    label: "Nhân viên quản lý",
    cls: "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200",
    bg: "from-amber-400 to-orange-500",
    icon: <UserIcon size={12} />
  },
};

const STATUS_INFO = {
  active: {
    label: "Đang hoạt động",
    cls: "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200",
    icon: <CheckCircle size={12} />
  },
  inactive: {
    label: "Tạm khóa",
    cls: "bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 border border-rose-200",
    icon: <XCircle size={12} />
  },
} as const;

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
    <div className="relative overflow-hidden rounded-2xl border border-pink-100 bg-gradient-to-br from-white to-pink-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md">
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

function Avatar({ name, color }: { name: string; color: string }) {
  const safeName = name || 'User';
  const initials = safeName
    .split(' ')
    .map(word => word[0])
    .filter(char => char)
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white font-semibold text-xs bg-gradient-to-r from-pink-500 to-rose-500 shadow-sm">
      {initials}
    </div>
  );
}

function RoleBadge({ role }: { role: Role }) {
  const roleInfo = ROLE_INFO[role];
  
  // Safety check: if role is not found, use a default
  if (!roleInfo) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
        <UserIcon size={12} />
        <span>{role || 'Unknown'}</span>
      </div>
    );
  }
  
  const { label, cls, icon } = roleInfo;
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>
      {icon}
      <span>{label}</span>
    </div>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  const { label, cls, icon } = isActive ? STATUS_INFO.active : STATUS_INFO.inactive;
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>
      {icon}
      <span>{label}</span>
    </div>
  );
}

function TwoFactorBadge({ enabled }: { enabled: boolean }) {
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${enabled
      ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200'
      : 'bg-gradient-to-r from-gray-50 to-slate-50 text-gray-600 border border-gray-200'
      }`}>
      {enabled ? <ShieldCheck size={10} /> : <XCircle size={10} />}
      <span>{enabled ? 'Bật 2FA' : 'Chưa bật'}</span>
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
  if (!dateString) return "Chưa đăng nhập";
  const date = new Date(dateString);
  return date.toLocaleString('vi-VN', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function AccountsPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<"accounts" | "profiles">("accounts");
  
  const [role, setRole] = useState<Role | "ALL">("ALL");
  const [status, setStatus] = useState<boolean | null>(null); // null = ALL, true = ACTIVE, false = INACTIVE
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [sort, setSort] = useState<SortState<Account>>({ key: null, direction: "asc" });
  
  // API State
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  
  // Fixed counts from initial fetch (won't change with filters)
  const [fixedCounts, setFixedCounts] = useState({
    total: 0,
    admin: 0,
    teacher: 0,
    parent: 0,
    managementStaff: 0,
    active: 0,
    inactive: 0,
  });

  // Modal states - Accounts
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activateModalOpen, setActivateModalOpen] = useState(false);
  const [toggleStatusModalOpen, setToggleStatusModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<User | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  // Profile Management States
  const [profiles, setProfiles] = useState<any[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<any[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profileSearchTerm, setProfileSearchTerm] = useState("");
  const [profileFilterType, setProfileFilterType] = useState<"all" | "Parent" | "Student">("all");
  const [profileCurrentPage, setProfileCurrentPage] = useState(1);
  const [profileItemsPerPage, setProfileItemsPerPage] = useState(10);
  
  // Profile Modal states
  const [showCreateParentModal, setShowCreateParentModal] = useState(false);
  const [showCreateStudentModal, setShowCreateStudentModal] = useState(false);
  const [showViewLinkedModal, setShowViewLinkedModal] = useState(false);
  const [showProfileDetailModal, setShowProfileDetailModal] = useState(false);
  const [showProfileDeleteModal, setShowProfileDeleteModal] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [selectedParentForView, setSelectedParentForView] = useState<{ id: string; name: string } | null>(null);
  const [selectedProfileForDelete, setSelectedProfileForDelete] = useState<{ id: string; name: string } | null>(null);

  // Fetch users from API once (no server-side filtering for smooth UX)
  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await getAllUsers({
          pageNumber: 1,
          pageSize: 1000, // Get all users for client-side filtering
        });

        // Check both success and isSuccess for compatibility
        const isSuccessful = response.success || response.isSuccess;
        
        if (isSuccessful && response.data) {
          // Transform API users to Account format
          const transformedAccounts: Account[] = response.data.items.map((user) => ({
            ...user,
            name: user.name || user.username || user.email || 'Unknown User', // Multiple fallbacks
            phone: user.branchContactPhone || '',
            lastLoginAt: user.updatedAt,
            avatarColor: getAvatarColor(user.id),
            twoFactor: false, // TODO: This should come from API
            department: getDepartment(user.role),
          }));
          
          setAccounts(transformedAccounts);
          setTotalCount(transformedAccounts.length);
          
          // Calculate fixed counts (these won't change with filters)
          const counts = {
            total: transformedAccounts.length,
            admin: transformedAccounts.filter(a => mapRoleToDisplay(a.role) === 'Admin').length,
            teacher: transformedAccounts.filter(a => mapRoleToDisplay(a.role) === 'Teacher').length,
            parent: transformedAccounts.filter(a => mapRoleToDisplay(a.role) === 'Parent').length,
            managementStaff: transformedAccounts.filter(a => mapRoleToDisplay(a.role) === 'ManagementStaff').length,
            active: transformedAccounts.filter(a => a.isActive).length,
            inactive: transformedAccounts.filter(a => !a.isActive).length,
          };
          setFixedCounts(counts);
        } else {
          setError(response.message || 'Không thể tải danh sách người dùng');
        }
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Đã xảy ra lỗi khi tải danh sách người dùng'); 
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []); // Only fetch once on mount

  // Modal handlers
  const handleViewDetail = async (userId: string) => {
    try {
      const response = await getUserById(userId);
      const isSuccessful = response.success || response.isSuccess;
      
      if (isSuccessful && response.data) {
        // Handle both response.data.user and response.data directly
        const userData = (response.data as any).user || response.data;
        setSelectedAccount(userData);
        setDetailModalOpen(true);
      } else {
        toast({
          title: "Lỗi",
          description: response.message || 'Không thể tải thông tin chi tiết',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast({
        title: "Lỗi",
        description: 'Đã xảy ra lỗi khi tải thông tin chi tiết',
        variant: "destructive",
      });
    }
  };

  const handleOpenCreateModal = () => {
    setSelectedAccount(null);
    setFormMode('create');
    setFormModalOpen(true);
  };

  const handleOpenEditModal = (account: User) => {
    setSelectedAccount(account);
    setFormMode('edit');
    setFormModalOpen(true);
  };

  const handleOpenDeleteModal = (account: User) => {
    setSelectedAccount(account);
    setDeleteModalOpen(true);
  };

  const handleOpenActivateModal = (account: User) => {
    setSelectedAccount(account);
    setActivateModalOpen(true);
  };

  const handleOpenToggleStatusModal = (account: User) => {
    setSelectedAccount(account);
    setToggleStatusModalOpen(true);
  };

  const handleCreateUser = async (data: CreateUserRequest) => {
    try {
      const response = await createUser(data);
      if (response.success || response.isSuccess) {
        toast({
          title: "Thành công",
          description: "Tạo tài khoản thành công",
          variant: "success",
        });
        setFormModalOpen(false);
        // Refresh the list
        window.location.reload();
      } else {
        toast({
          title: "Lỗi",
          description: response.message || 'Không thể tạo tài khoản',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Lỗi",
        description: 'Đã xảy ra lỗi khi tạo tài khoản',
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUpdateUser = async (data: UpdateUserRequest) => {
    if (!selectedAccount) return;
    try {
      const response = await updateUser(selectedAccount.id, data);
      if (response.success || response.isSuccess) {
        toast({
          title: "Thành công",
          description: "Cập nhật tài khoản thành công",
          variant: "success",
        });
        setFormModalOpen(false);
        // Refresh the list
        setTimeout(() => {
          window.location.reload();
        }, 3000);
        
      } else {
        toast({
          title: "Lỗi",
          description: response.message || 'Không thể cập nhật tài khoản',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Lỗi",
        description: 'Đã xảy ra lỗi khi cập nhật tài khoản',
        variant: "destructive",
      });
      throw error;
    }
  };  

  const handleDeleteUser = async () => {
    if (!selectedAccount) return;
    try {
      const response = await deleteUser(selectedAccount.id);
      if (response.success || response.isSuccess) {
        toast({
          title: "Thành công",
          description: "Xóa tài khoản thành công",
          variant: "success",
        });
        setDeleteModalOpen(false);
        // Refresh the list
        window.location.reload();
      } else {
        toast({
          title: "Lỗi",
          description: response.message || 'Không thể xóa tài khoản',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Lỗi",
        description: 'Đã xảy ra lỗi khi xóa tài khoản',
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleActivateUser = async () => {
    if (!selectedAccount) return;
    try {
      const response = await updateUserStatus(selectedAccount.id, { isActive: true });
      if (response.success || response.isSuccess) {
        toast({
          title: "Thành công",
          description: "Kích hoạt tài khoản thành công",
          variant: "success",
        });
        setActivateModalOpen(false);
        // Update local state
        setAccounts(prev => prev.map(acc => 
          acc.id === selectedAccount.id 
            ? { ...acc, isActive: true }
            : acc
        ));
      } else {
        toast({
          title: "Lỗi",
          description: response.message || 'Không thể kích hoạt tài khoản',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error activating user:', error);
      toast({
        title: "Lỗi",
        description: 'Đã xảy ra lỗi khi kích hoạt tài khoản',
        variant: "destructive",
      });
    }
  };

  // ============= PROFILE MANAGEMENT FUNCTIONS =============
  
  // Fetch all profiles
  const fetchProfiles = async () => {
    try {
      setProfilesLoading(true);
      const response = await getAllStudents({
        pageSize: 100,
      });

      if (response.data?.items) {
        setProfiles(response.data.items);
        setFilteredProfiles(response.data.items);
      }
    } catch (error) {
      console.error("Error fetching profiles:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách profiles",
        variant: "destructive",
      });
    } finally {
      setProfilesLoading(false);
    }
  };

  // Load profiles when switching to profiles tab
  useEffect(() => {
    if (activeTab === "profiles") {
      fetchProfiles();
    }
  }, [activeTab]);

  // Filter profiles
  useEffect(() => {
    let filtered = profiles;

    // Filter by type
    if (profileFilterType !== "all") {
      filtered = filtered.filter(p => p.profileType === profileFilterType);
    }

    // Filter by search term
    if (profileSearchTerm) {
      filtered = filtered.filter(p => 
        p.displayName.toLowerCase().includes(profileSearchTerm.toLowerCase()) ||
        (p.userEmail && p.userEmail.toLowerCase().includes(profileSearchTerm.toLowerCase()))
      );
    }

    setFilteredProfiles(filtered);
    setProfileCurrentPage(1); // Reset to page 1 when filters change
  }, [profiles, profileFilterType, profileSearchTerm]);

  // Handle create parent account
  const handleCreateParent = async (profileData: CreateParentAccountRequest) => {
    try {
      await createParentAccount(profileData);

      toast({
        title: "Thành công",
        description: "Tạo tài khoản Parent thành công",
        variant: "success",
      });

      fetchProfiles();
    } catch (error: any) {
      console.error("Error creating parent:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo tài khoản Parent",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Handle create student profile
  const handleCreateStudent = async (profileData: CreateStudentProfileRequest) => {
    try {
      await createStudentProfile(profileData);

      toast({
        title: "Thành công",
        description: "Tạo profile Student thành công",
        variant: "success",
      });

      fetchProfiles();
    } catch (error: any) {
      console.error("Error creating student:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo profile Student",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Handle delete profile
  const handleOpenDeleteProfileModal = (id: string, displayName: string) => {
    setSelectedProfileForDelete({ id, name: displayName });
    setShowProfileDeleteModal(true);
  };

  const handleConfirmDeleteProfile = async () => {
    if (!selectedProfileForDelete) return;

    try {
      await deleteProfile(selectedProfileForDelete.id);

      toast({
        title: "Thành công",
        description: "Xóa profile thành công",
        variant: "success",
      });

      setShowProfileDeleteModal(false);
      setSelectedProfileForDelete(null);
      fetchProfiles();
    } catch (error: any) {
      console.error("Error deleting profile:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa profile",
        variant: "destructive",
      });
    }
  };

  // Open view linked students modal
  const handleOpenViewLinkedModal = (userId: string, parentName: string) => {
    setSelectedParentForView({ id: userId, name: parentName });
    setShowViewLinkedModal(true);
  };

  // Close view linked students modal
  const handleCloseViewLinkedModal = () => {
    setShowViewLinkedModal(false);
    setSelectedParentForView(null);
  };

  // Open profile detail modal
  const handleViewProfileDetail = (profileId: string) => {
    setSelectedProfileId(profileId);
    setShowProfileDetailModal(true);
  };

  // Close profile detail modal
  const handleCloseProfileDetailModal = () => {
    setShowProfileDetailModal(false);
    setSelectedProfileId(null);
  };

  // View student detail from linked students modal
  const handleViewStudentDetail = (studentId: string) => {
    setSelectedProfileId(studentId);
    setShowProfileDetailModal(true);
  };

  // ============= END PROFILE MANAGEMENT FUNCTIONS =============

  const toggleSort = (key: keyof Account) => {
    setSort(prev => {
      if (prev.key !== key) return { key, direction: "asc" };
      return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
    });
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [role, status, search]);

  const SortHeader = ({
    label,
    sortKey,
    className,
  }: {
    label: string;
    sortKey: keyof Account;
    className?: string;
  }) => {
    const active = sort.key === sortKey;
    return (
      <button
        type="button"
        onClick={() => toggleSort(sortKey)}
        className={`inline-flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-gray-900 ${className ?? ""}`}
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
      title: 'Tổng tài khoản',
      value: `${fixedCounts.total}`,
      icon: <Users size={20} />,
      color: 'from-pink-500 to-rose-500',
      subtitle: 'Toàn hệ thống'
    },
    {
      title: 'Đang hoạt động',
      value: `${fixedCounts.active}`,
      icon: <CheckCircle size={20} />,
      color: 'from-emerald-500 to-teal-500',
      subtitle: 'Truy cập thường xuyên'
    },
    {
      title: 'Bật xác thực 2 lớp',
      value: `${accounts.filter(a => a.twoFactor).length}`,
      icon: <ShieldCheck size={20} />,
      color: 'from-blue-500 to-cyan-500',
      subtitle: 'Bảo mật cao'
    },
    {
      title: 'Tài khoản mới',
      value: `+${accounts.filter(a => {
        if (!a.createdAt) return false;
        const createdDate = new Date(a.createdAt);
        const today = new Date();
        const diffDays = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 3600 * 24));
        return diffDays <= 30;
      }).length}`,
      icon: <UserPlus size={20} />,
      color: 'from-amber-500 to-orange-500',
      subtitle: '30 ngày gần đây'
    }
  ];

  const list = useMemo(() => {
    let result = accounts;

    // Client-side filtering
    if (role !== "ALL") {
      result = result.filter(acc => mapRoleToDisplay(acc.role) === role);
    }

    if (status !== null) {
      result = result.filter(acc => acc.isActive === status);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(acc =>
        acc.name.toLowerCase().includes(searchLower) ||
        acc.email.toLowerCase().includes(searchLower) ||
        (acc.phone && acc.phone.toLowerCase().includes(searchLower)) ||
        acc.id.toLowerCase().includes(searchLower)
      );
    }

    // Client-side sorting
    if (sort.key) {
      result = quickSort([...result], buildComparator(sort.key, sort.direction));
    }

    return result;
  }, [accounts, role, status, search, sort.key, sort.direction]);

  // Client-side pagination
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

  const activeCount = accounts.filter(a => a.isActive).length;
  const inactiveCount = accounts.filter(a => !a.isActive).length;

  // Handle status toggle
  const handleToggleStatus = async () => {
    if (!selectedAccount) return;
    try {
      const newStatus = !selectedAccount.isActive;
      const response = await updateUserStatus(selectedAccount.id, { isActive: newStatus });
      
      if (response.success || response.isSuccess) {
        toast({
          title: "Thành công",
          description: `${newStatus ? 'Kích hoạt' : 'Vô hiệu hóa'} tài khoản thành công`,
          variant: "success",
        });
        setToggleStatusModalOpen(false);
        // Refresh the accounts list
        setAccounts(prev => prev.map(acc => 
          acc.id === selectedAccount.id 
            ? { ...acc, isActive: newStatus }
            : acc
        ));
      } else {
        toast({
          title: "Lỗi",
          description: response.message || 'Không thể cập nhật trạng thái',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      toast({
        title: "Lỗi",
        description: 'Đã xảy ra lỗi khi cập nhật trạng thái',
        variant: "destructive",
      });
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-pink-500 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-rose-100 to-pink-100 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-rose-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Không thể tải dữ liệu</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all"
          >
            <RefreshCw size={16} /> Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
            <Users size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Quản lý Tài khoản & Profiles
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Phân quyền truy cập, quản lý profiles và theo dõi hoạt động người dùng
            </p>
          </div>
        </div>
        {activeTab === "accounts" ? (
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-pink-50 transition-colors">
              <Key size={16} /> Đặt lại mật khẩu
            </button>
            <button 
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all"
            >
              <UserPlus size={16} /> Tạo tài khoản mới
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowCreateParentModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all"
            >
              <UserPlus size={16} /> Tạo tài khoản Parent
            </button>
            <button
              onClick={() => setShowCreateStudentModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all"
            >
              <UserCircle size={16} /> Tạo profile Student
            </button>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl border border-pink-200 p-1 inline-flex gap-1">
        <button
          onClick={() => setActiveTab("accounts")}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "accounts"
              ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md"
              : "text-gray-600 hover:bg-pink-50"
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} />
            <span>Tài khoản</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              activeTab === "accounts" ? "bg-white/20" : "bg-gray-100"
            }`}>
              {fixedCounts.total}
            </span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab("profiles")}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "profiles"
              ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md"
              : "text-gray-600 hover:bg-pink-50"
          }`}
        >
          <div className="flex items-center gap-2">
            <UserCircle size={16} />
            <span>Profiles</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              activeTab === "profiles" ? "bg-white/20" : "bg-gray-100"
            }`}>
              {profiles.length}
            </span>
          </div>
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === "accounts" ? (
        <>
          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, idx) => (
              <StatCard key={idx} {...stat} />
            ))}
          </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Role Filter */}
            <div className="inline-flex rounded-xl border border-pink-200 bg-white p-1">
              {[
                { k: 'ALL', label: 'Tất cả', count: fixedCounts.total },
                { k: 'Admin', label: 'Quản trị', count: fixedCounts.admin },
                { k: 'Teacher', label: 'Giáo viên', count: fixedCounts.teacher },
                { k: 'Parent', label: 'Phụ huynh', count: fixedCounts.parent },
                { k: 'ManagementStaff', label: 'Nhân viên', count: fixedCounts.managementStaff },
              ].map((item) => (
                <button
                  key={item.k}
                  onClick={() => setRole(item.k as typeof role)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${role === item.k
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-pink-50'
                    }`}
                >
                  {item.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${role === item.k ? 'bg-white/20' : 'bg-gray-100'
                    }`}>
                    {item.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500" />
              <select
                value={status === null ? 'ALL' : status ? 'ACTIVE' : 'INACTIVE'}
                onChange={(e) => {
                  const val = e.target.value;
                  setStatus(val === 'ALL' ? null : val === 'ACTIVE');
                }}
                className="rounded-xl border border-pink-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-200"
              >
                <option value="ALL">Tất cả trạng thái ({fixedCounts.total})</option>
                <option value="ACTIVE">Đang hoạt động ({fixedCounts.active})</option>
                <option value="INACTIVE">Không hoạt động ({fixedCounts.inactive})</option>
              </select>
            </div>
          </div>

          {/* Search and Items Per Page */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm tên, email, số điện thoại..."
                className="h-10 w-72 rounded-xl border border-pink-200 bg-white pl-10 pr-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-200"
              />
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded-xl border border-pink-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-200"
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
      <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="bg-gradient-to-r from-pink-500/10 to-rose-500/10 border-b border-pink-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Danh sách tài khoản</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">{list.length} tài khoản</span>
              {selectedRows.length > 0 && (
                <>
                  <span className="mx-2">•</span>
                  <span className="text-pink-600 font-medium">
                    Đã chọn {selectedRows.length} tài khoản
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-pink-500/5 to-rose-500/5 border-b border-pink-200">
              <tr>
                <th className="py-3 px-6 text-left">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedRows.length === currentRows.length && currentRows.length > 0}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-pink-300 text-pink-600 focus:ring-pink-200"
                    />
                    <SortHeader label="Người dùng" sortKey="name" />
                  </div>
                </th>
                <th className="py-3 px-6 text-left">
                  <SortHeader label="Thông tin liên hệ" sortKey="email" />
                </th>
                <th className="py-3 px-6 text-left">
                  <SortHeader label="Vai trò" sortKey="role" />
                </th>
                <th className="py-3 px-6 text-left">
                  <SortHeader label="Bảo mật" sortKey="twoFactor" />
                </th>
                <th className="py-3 px-6 text-left">
                  <SortHeader label="Hoạt động" sortKey="lastLoginAt" />
                </th>
                <th className="py-3 px-6 text-left">
                  <SortHeader label="Trạng thái" sortKey="isActive" />
                </th>
                <th className="py-3 px-6 text-left">
                  <span className="text-sm font-semibold text-gray-700">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-100">
              {currentRows.length > 0 ? (
                currentRows.map((acc) => (
                  <tr
                    key={acc.id}
                    className="group hover:bg-gradient-to-r hover:from-pink-50/50 hover:to-white transition-all duration-200"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(acc.id)}
                          onChange={() => toggleSelectRow(acc.id)}
                          className="h-4 w-4 rounded border-pink-300 text-pink-600 focus:ring-pink-200"
                        />
                        <div className="flex items-center gap-3">
                          <Avatar name={acc.name} color={acc.avatarColor} />
                          <div>
                            <div className="font-medium text-gray-900">{acc.name}</div>
                            <div className="text-xs text-gray-500">{acc.id}</div>
                            {acc.department && (
                              <div className="text-xs text-gray-400">{acc.department}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Mail size={12} className="text-gray-400" />
                          <span className="font-medium">{acc.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Phone size={12} className="text-gray-400" />
                          <span>{acc.phone || 'Chưa cập nhật'}</span>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar size={10} />
                          Tạo ngày: {formatDate(acc.createdAt)}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <RoleBadge role={mapRoleToDisplay(acc.role)} />
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <TwoFactorBadge enabled={acc.twoFactor} />
                        <div className="text-xs text-gray-500">
                          {!acc.lastLoginAt ? "Chưa đăng nhập" : `Đăng nhập: ${formatDateTime(acc.lastLoginAt)}`}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className={`text-xs px-2 py-1 rounded-full inline-flex items-center gap-1 ${!acc.lastLoginAt
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-blue-50 text-blue-600'
                          }`}>
                          {!acc.lastLoginAt ? (
                            <>
                              <AlertCircle size={10} />
                              Chưa kích hoạt
                            </>
                          ) : (
                            <>
                              <CheckCircle size={10} />
                              Đã đăng nhập
                            </>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {!acc.lastLoginAt
                            ? "Đang chờ kích hoạt"
                            : "Hoạt động gần nhất"
                          }
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge isActive={acc.isActive} />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1 transition-opacity duration-200">
                        <button
                          type="button"
                          onClick={() => handleViewDetail(acc.id)}
                          className="p-1.5 rounded-lg hover:bg-pink-50 transition-colors text-gray-400 hover:text-pink-600"
                          title="Xem chi tiết"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(acc)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors text-gray-400 hover:text-blue-600"
                          title="Chỉnh sửa"
                        >
                          <Edit size={14} />
                        </button>
                        {!acc.isActive ? (
                          <button
                            type="button"
                            onClick={() => handleOpenActivateModal(acc)}
                            className="p-1.5 rounded-lg hover:bg-emerald-50 transition-colors text-gray-400 hover:text-emerald-600"
                            title="Kích hoạt tài khoản"
                          >
                            <RefreshCw size={14} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteModal(acc)}
                            className="p-1.5 rounded-lg hover:bg-amber-50 transition-colors text-gray-400 hover:text-amber-600"
                            title="Xóa tài khoản"
                          >
                            <XCircle size={14} />
                          </button>
                        )}
                        {acc.isActive ? (
                          <button
                            type="button"
                            onClick={() => handleOpenToggleStatusModal(acc)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 transition-colors text-gray-400 hover:text-rose-600"
                            title="Tạm khóa"
                          >
                            <Lock size={14} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenToggleStatusModal(acc)}
                            className="p-1.5 rounded-lg hover:bg-emerald-50 transition-colors text-gray-400 hover:text-emerald-600"
                            title="Kích hoạt"
                          >
                            <CheckCircle size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-pink-100 to-rose-100 flex items-center justify-center">
                      <Search size={24} className="text-pink-400" />
                    </div>
                    <div className="text-gray-600 font-medium">Không tìm thấy tài khoản</div>
                    <div className="text-sm text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc tạo tài khoản mới</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer - Pagination */}
        {list.length > 0 && (
          <div className="border-t border-pink-200 bg-gradient-to-r from-pink-500/5 to-rose-500/5 px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Left: Info */}
              <div className="text-sm text-gray-600">
                Hiển thị <span className="font-semibold text-gray-900">{startIndex + 1}-{Math.min(endIndex, list.length)}</span> trong tổng số{" "}
                <span className="font-semibold text-gray-900">{list.length}</span> tài khoản
                {selectedRows.length > 0 && (
                  <span className="ml-3 text-pink-600 font-medium">
                    • Đã chọn {selectedRows.length}
                  </span>
                )}
              </div>

              {/* Right: Pagination Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-pink-200 hover:bg-pink-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                            ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md"
                            : page === "..."
                            ? "cursor-default text-gray-400"
                            : "border border-pink-200 hover:bg-pink-50 text-gray-700"
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
                  className="p-2 rounded-lg border border-pink-200 hover:bg-pink-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
        </>
      ) : (
        <>
          {/* Profiles Statistics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Tổng Profiles"
              value={`${profiles.length}`}
              icon={<Users size={20} />}
              color="from-pink-500 to-rose-500"
              subtitle="Toàn hệ thống"
            />
            <StatCard
              title="Parents"
              value={`${profiles.filter(p => p.profileType === "Parent").length}`}
              icon={<Shield size={20} />}
              color="from-emerald-500 to-teal-500"
              subtitle="Có tài khoản đăng nhập"
            />
            <StatCard
              title="Students"
              value={`${profiles.filter(p => p.profileType === "Student").length}`}
              icon={<UserCircle size={20} />}
              color="from-blue-500 to-cyan-500"
              subtitle="Link với Parent"
            />
            <StatCard
              title="Profiles Active"
              value={`${profiles.filter(p => p.isActive).length}`}
              icon={<CheckCircle size={20} />}
              color="from-amber-500 to-orange-500"
              subtitle="Đang hoạt động"
            />
          </div>

          {/* Filter Bar */}
          <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Type Filter */}
                <div className="inline-flex rounded-xl border border-pink-200 bg-white p-1">
                  {[
                    { k: 'all', label: 'Tất cả', count: profiles.length },
                    { k: 'Parent', label: 'Parents', count: profiles.filter(p => p.profileType === "Parent").length },
                    { k: 'Student', label: 'Students', count: profiles.filter(p => p.profileType === "Student").length },
                  ].map((item) => (
                    <button
                      key={item.k}
                      onClick={() => setProfileFilterType(item.k as typeof profileFilterType)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${
                        profileFilterType === item.k
                          ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm'
                          : 'text-gray-700 hover:bg-pink-50'
                      }`}
                    >
                      {item.label}
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        profileFilterType === item.k ? 'bg-white/20' : 'bg-gray-100'
                      }`}>
                        {item.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Search and Items Per Page */}
              <div className="flex items-center gap-2 flex-1 min-w-[300px]">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo tên, email..."
                    value={profileSearchTerm}
                    onChange={(e) => setProfileSearchTerm(e.target.value)}
                    className="w-full rounded-xl border border-pink-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-700 placeholder-gray-400 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-200"
                  />
                </div>
                <select
                  value={profileItemsPerPage}
                  onChange={(e) => {
                    setProfileItemsPerPage(Number(e.target.value));
                    setProfileCurrentPage(1);
                  }}
                  className="rounded-xl border border-pink-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-200"
                >
                  <option value={5}>5 / trang</option>
                  <option value={10}>10 / trang</option>
                  <option value={20}>20 / trang</option>
                  <option value={50}>50 / trang</option>
                </select>
              </div>
            </div>
          </div>

          {/* Profiles Table */}
          <div className="rounded-2xl border border-pink-200 bg-white overflow-hidden shadow-sm">
            {profilesLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-12 h-12 animate-spin text-pink-500" />
              </div>
            ) : filteredProfiles.length === 0 ? (
              <div className="text-center py-16">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Không có profile nào</p>
                <p className="text-sm text-gray-400 mt-2">Hãy tạo profile mới để bắt đầu</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-pink-100 to-rose-100">
                      <tr className="border-b border-pink-200">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Loại</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Tên hiển thị</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">User ID</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Ngày tạo</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-pink-100">
                      {(() => {
                        const profileTotalPages = Math.ceil(filteredProfiles.length / profileItemsPerPage);
                        const profileStartIndex = (profileCurrentPage - 1) * profileItemsPerPage;
                        const profileEndIndex = profileStartIndex + profileItemsPerPage;
                        const currentProfiles = filteredProfiles.slice(profileStartIndex, profileEndIndex);
                        
                        return currentProfiles.map((profile: any) => (
                      <tr key={profile.id} className="hover:bg-gradient-to-r hover:from-pink-50/50 hover:to-transparent transition-all duration-200">
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                            profile.profileType === "Parent"
                              ? "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200"
                              : "bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border border-blue-200"
                          }`}>
                            {profile.profileType === "Parent" ? <Shield size={12} /> : <UserCircle size={12} />}
                            {profile.profileType}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{profile.displayName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <Mail size={14} />
                            {profile.userEmail || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-gray-500 font-mono">
                            {profile.userId?.substring(0, 8)}...
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {profile.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium">
                              <CheckCircle size={12} />
                              Đang hoạt động
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 border border-rose-200 rounded-full text-xs font-medium">
                              <XCircle size={12} />
                              Tạm khóa
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar size={14} />
                            {new Date(profile.createdAt).toLocaleDateString('vi-VN')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleViewProfileDetail(profile.id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group"
                              title="Xem chi tiết"
                            >
                              <Eye size={18} className="group-hover:scale-110 transition-transform" />
                            </button>
                            {profile.profileType === "Parent" && (
                              <button
                                onClick={() => handleOpenViewLinkedModal(profile.userId, profile.displayName)}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors group"
                                title="Xem học sinh đã liên kết"
                              >
                                <Users size={18} className="group-hover:scale-110 transition-transform" />
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenDeleteProfileModal(profile.id, profile.displayName)}
                              className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors group"
                              title="Xóa"
                            >
                              <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
                            </button>
                          </div>
                        </td>
                      </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                {filteredProfiles.length > 0 && (() => {
                  const profileTotalPages = Math.ceil(filteredProfiles.length / profileItemsPerPage);
                  const profileStartIndex = (profileCurrentPage - 1) * profileItemsPerPage;
                  const profileEndIndex = profileStartIndex + profileItemsPerPage;
                  
                  return (
                    <div className="border-t border-pink-200 bg-gradient-to-r from-pink-500/5 to-rose-500/5 px-6 py-4">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        {/* Left: Info */}
                        <div className="text-sm text-gray-600">
                          Hiển thị <span className="font-semibold text-gray-900">{profileStartIndex + 1}-{Math.min(profileEndIndex, filteredProfiles.length)}</span> trong tổng số{" "}
                          <span className="font-semibold text-gray-900">{filteredProfiles.length}</span> profiles
                        </div>

                        {/* Right: Pagination Buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setProfileCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={profileCurrentPage === 1}
                            className="p-2 rounded-lg border border-pink-200 hover:bg-pink-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            aria-label="Previous page"
                          >
                            <ChevronLeft size={18} />
                          </button>

                          <div className="flex items-center gap-1">
                            {(() => {
                              const pages: (number | string)[] = [];
                              const maxVisible = 7;

                              if (profileTotalPages <= maxVisible) {
                                for (let i = 1; i <= profileTotalPages; i++) {
                                  pages.push(i);
                                }
                              } else {
                                if (profileCurrentPage <= 3) {
                                  for (let i = 1; i <= 5; i++) pages.push(i);
                                  pages.push("...");
                                  pages.push(profileTotalPages);
                                } else if (profileCurrentPage >= profileTotalPages - 2) {
                                  pages.push(1);
                                  pages.push("...");
                                  for (let i = profileTotalPages - 4; i <= profileTotalPages; i++) pages.push(i);
                                } else {
                                  pages.push(1);
                                  pages.push("...");
                                  for (let i = profileCurrentPage - 1; i <= profileCurrentPage + 1; i++) pages.push(i);
                                  pages.push("...");
                                  pages.push(profileTotalPages);
                                }
                              }

                              return pages.map((page, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => typeof page === "number" && setProfileCurrentPage(page)}
                                  disabled={page === "..."}
                                  className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-all ${
                                    page === profileCurrentPage
                                      ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md"
                                      : page === "..."
                                      ? "cursor-default text-gray-400"
                                      : "border border-pink-200 hover:bg-pink-50 text-gray-700"
                                  }`}
                                >
                                  {page}
                                </button>
                              ));
                            })()}
                          </div>

                          <button
                            onClick={() => setProfileCurrentPage(prev => Math.min(profileTotalPages, prev + 1))}
                            disabled={profileCurrentPage === profileTotalPages}
                            className="p-2 rounded-lg border border-pink-200 hover:bg-pink-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            aria-label="Next page"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </div>

          {/* Profile Modals */}
          <CreateParentAccountModal
            isOpen={showCreateParentModal}
            onClose={() => setShowCreateParentModal(false)}
            onSubmit={handleCreateParent}
          />

          <CreateStudentProfileModal
            isOpen={showCreateStudentModal}
            onClose={() => setShowCreateStudentModal(false)}
            onSubmit={handleCreateStudent}
          />

          <ViewLinkedStudentsModal
            isOpen={showViewLinkedModal}
            onClose={handleCloseViewLinkedModal}
            userId={selectedParentForView?.id || null}
            parentName={selectedParentForView?.name || null}
            onRefresh={fetchProfiles}
            onViewStudentDetail={handleViewStudentDetail}
          />

          <ProfileDetailModal
            isOpen={showProfileDetailModal}
            onClose={handleCloseProfileDetailModal}
            profileId={selectedProfileId}
          />

          <ConfirmModal
            isOpen={showProfileDeleteModal}
            onClose={() => {
              setShowProfileDeleteModal(false);
              setSelectedProfileForDelete(null);
            }}
            onConfirm={handleConfirmDeleteProfile}
            title="Xác nhận xóa profile"
            message={`Bạn có chắc chắn muốn xóa profile "${selectedProfileForDelete?.name}"? Hành động này không thể hoàn tác.`}
            confirmText="Xóa"
            cancelText="Hủy"
            variant="danger"
          />
        </>
      )}

      {activeTab === "accounts" && (
        <>
      {/* Security Configuration Panel */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Security Settings */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Cấu hình Bảo mật</h3>
                <p className="text-sm text-gray-600">Thiết lập xác thực và quyền truy cập nâng cao</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-pink-200 bg-white">
                <div>
                  <div className="font-medium text-gray-900">Xác thực hai lớp (2FA)</div>
                  <div className="text-sm text-gray-600">Yêu cầu OTP cho thao tác quan trọng</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-pink-200 bg-white">
                <div>
                  <div className="font-medium text-gray-900">Tự động khóa tài khoản</div>
                  <div className="text-sm text-gray-600">Sau 30 ngày không đăng nhập</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-pink-200 bg-white">
                <div>
                  <div className="font-medium text-gray-900">Cảnh báo đăng nhập lạ</div>
                  <div className="text-sm text-gray-600">Thông báo qua email khi có đăng nhập mới</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
                </label>
              </div>
            </div>

            <button className="mt-6 w-full rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-3 text-sm font-semibold text-white hover:shadow-lg transition-all">
              Lưu cấu hình bảo mật
            </button>
          </div>
        </div>

        {/* Quick Actions & Stats */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Thao tác nhanh</h3>
            <div className="space-y-2">
              <button className="w-full rounded-xl border border-pink-200 bg-white px-4 py-3 text-sm font-medium hover:bg-pink-50 transition-colors flex items-center gap-2">
                <Mail size={16} />
                Gửi email kích hoạt
              </button>
              <button className="w-full rounded-xl border border-pink-200 bg-white px-4 py-3 text-sm font-medium hover:bg-pink-50 transition-colors flex items-center gap-2">
                <Key size={16} />
                Đặt lại mật khẩu hàng loạt
              </button>
              <button className="w-full rounded-xl border border-pink-200 bg-white px-4 py-3 text-sm font-medium hover:bg-pink-50 transition-colors flex items-center gap-2">
                <Bell size={16} />
                Gửi thông báo bảo mật
              </button>
            </div>
          </div>

          {/* Role Distribution */}
          <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 p-5">
            <h4 className="font-semibold text-gray-900 mb-3">Phân bố vai trò</h4>
            <div className="space-y-3">
              {(['Admin', 'Teacher', 'Parent', 'ManagementStaff'] as Role[]).map(role => {
                const count = accounts.filter(a => mapRoleToDisplay(a.role) === role).length;
                const percentage = accounts.length > 0 ? Math.round((count / accounts.length) * 100) : 0;
                const info = ROLE_INFO[role];
                
                // Skip if role info is not found
                if (!info) return null;

                return (
                  <div key={role} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">{info.label}</span>
                      <span className="font-semibold text-gray-900">{count} người</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${info.bg}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 text-right">{percentage}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
        </>
      )}

      {/* Modals - Accounts */}
      {activeTab === "accounts" && (
        <>
      <AccountDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        account={selectedAccount}
      />

      <AccountFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSubmit={(data) => formMode === 'create' ? handleCreateUser(data as CreateUserRequest) : handleUpdateUser(data as UpdateUserRequest)}
        account={selectedAccount}
        mode={formMode}
      />

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteUser}
        title="Xác nhận xóa tài khoản"
        message={`Bạn có chắc chắn muốn xóa tài khoản "${selectedAccount?.name || selectedAccount?.username}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
      />

      <ConfirmModal
        isOpen={activateModalOpen}
        onClose={() => setActivateModalOpen(false)}
        onConfirm={handleActivateUser}
        title="Xác nhận kích hoạt tài khoản"
        message={`Bạn có chắc chắn muốn kích hoạt lại tài khoản "${selectedAccount?.name || selectedAccount?.username}"?`}
        confirmText="Kích hoạt"
        cancelText="Hủy"
        variant="success"
      />

      <ConfirmModal
        isOpen={toggleStatusModalOpen}
        onClose={() => setToggleStatusModalOpen(false)}
        onConfirm={handleToggleStatus}
        title={selectedAccount?.isActive ? "Xác nhận khóa tài khoản" : "Xác nhận mở khóa tài khoản"}
        message={
          selectedAccount?.isActive
            ? `Bạn có chắc chắn muốn tạm khóa tài khoản "${selectedAccount?.name || selectedAccount?.username}"? Người dùng sẽ không thể đăng nhập cho đến khi được mở khóa.`
            : `Bạn có chắc chắn muốn mở khóa tài khoản "${selectedAccount?.name || selectedAccount?.username}"? Người dùng sẽ có thể đăng nhập trở lại.`
        }
        confirmText={selectedAccount?.isActive ? "Khóa tài khoản" : "Mở khóa"}
        cancelText="Hủy"
        variant={selectedAccount?.isActive ? "danger" : "success"}
      />
        </>
      )}
    </div>
  );
}