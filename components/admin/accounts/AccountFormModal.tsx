"use client";

import { useState, useEffect, useRef } from "react";
import { X, Mail, User as UserIcon, Lock, Shield, Loader2, Phone, AlertCircle, Building2 } from "lucide-react";
import type { User, UserRole, CreateUserRequest, UpdateUserRequest } from "@/types/admin/user";
import { getAllBranchesPublic } from "@/lib/api/branchService";
import type { Branch } from "@/types/branch";
import AdminBranchSelectField from "@/components/admin/common/AdminBranchSelectField";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/lightswind/select";
import clsx from "clsx";

interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserRequest | UpdateUserRequest) => Promise<void>;
  account?: User | null; // If provided, it's edit mode
  mode: 'create' | 'edit';
}

export default function AccountFormModal({ isOpen, onClose, onSubmit, account, mode }: AccountFormModalProps) {
  const pathname = usePathname() || "";
  const isStaffAccountsPage = pathname.includes("/portal/staff-management/accounts");
  const { user: currentUser } = useCurrentUser();
  const fixedStaffBranchId = isStaffAccountsPage ? (currentUser?.branchId || "") : "";

  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [errors, setErrors] = useState<{ branchId?: string; email?: string; username?: string; name?: string; password?: string }>({});
  const modalRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    username: '',
    password: '',
    role: 'Parent' as UserRole,
    branchId: '',
    phoneNumber: '',
  });

  const roleOptions: Array<{ value: UserRole; label: string }> = isStaffAccountsPage
    ? [
        { value: "Teacher", label: "Giáo viên" },
        { value: "Parent", label: "Phụ huynh" },
      ]
    : [
        { value: "Admin", label: "Quản trị" },
        { value: "ManagementStaff", label: "Nhân viên quản lý" },
        { value: "Teacher", label: "Giáo viên" },
        { value: "Parent", label: "Phụ huynh" },
      ];

  const branchOptions =
    isStaffAccountsPage && fixedStaffBranchId
      ? branches.filter((branch) => branch.id === fixedStaffBranchId)
      : branches;

  // Fetch branches on component mount
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await getAllBranchesPublic({ isActive: true });
        if (response.isSuccess && response.data?.branches) {
          setBranches(response.data.branches);
        }
      } catch (error) {
        console.error("Error fetching branches:", error);
      }
    };
    
    fetchBranches();
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    // Only load data when modal opens
    if (!isOpen) return;
    
    if (mode === 'edit' && account) {
      setFormData({
        email: account.email,
        name: account.name,
        username: account.username,
        password: '',
        role: account.role,
        branchId: account.branchId || '',
        phoneNumber: account.phoneNumber || '',
      });
    } else if (mode === 'create') {
      // Reset to completely empty form for create mode
      setFormData({
        email: '',
        name: '',
        username: '',
        password: '',
        role: 'Parent',
        branchId: isStaffAccountsPage ? fixedStaffBranchId : '',
        phoneNumber: '',
      });
    }
    setErrors({});
  }, [mode, account, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = "Email là bắt buộc";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }
    
    if (!formData.username.trim()) {
      newErrors.username = "Tên hiển thị là bắt buộc";
    }
    
    if (!formData.name.trim()) {
      newErrors.name = "Họ tên đầy đủ là bắt buộc";
    }
    
    if (mode === 'create' && !formData.password.trim()) {
      newErrors.password = "Mật khẩu là bắt buộc";
    } else if (mode === 'create' && formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }
    
    if (mode === 'create' && !formData.branchId) {
      newErrors.branchId = "Chi nhánh là bắt buộc";
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
      if (mode === 'create') {
        await onSubmit({
          username: formData.username,
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          branchId: formData.branchId || undefined,
          phoneNumber: formData.phoneNumber || undefined,
        } as CreateUserRequest);
      } else {
        const updateData: UpdateUserRequest = {
          email: formData.email,
          name: formData.name,
          role: formData.role,
          branchId: formData.branchId || undefined,
        };
        await onSubmit(updateData);
      }
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) return null;
 
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div 
        ref={modalRef}
        className="relative w-full max-w-2xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Modal Header - Giống style modal class */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <UserIcon size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {mode === 'create' ? 'Tạo tài khoản mới' : 'Cập nhật tài khoản'}
                </h2>
                <p className="text-sm text-red-100">
                  {mode === 'create' 
                    ? 'Nhập thông tin chi tiết về tài khoản mới' 
                    : 'Chỉnh sửa thông tin tài khoản'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer disabled:opacity-50"
              aria-label="Đóng"
            >
              <X size={24} className="text-white" />
            </button>
          </div>
        </div>

        {/* Form Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Mail size={16} className="text-red-600" />
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={clsx(
                    "w-full px-4 py-3 rounded-xl border bg-white text-gray-900",
                    "focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
                    errors.email ? "border-red-500" : "border-gray-200"
                  )}
                  placeholder="example@gmail.com"
                />
                {errors.email && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <AlertCircle size={18} className="text-red-500" />
                  </div>
                )}
              </div>
              {errors.email && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.email}</p>}
            </div>

            {/* Số điện thoại */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Phone size={16} className="text-red-600" />
                Số điện thoại
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => handleChange("phoneNumber", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all"
                placeholder="0123456789"
              />
            </div>

            {/* Tên hiển thị */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <UserIcon size={16} className="text-red-600" />
                Tên hiển thị <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleChange("username", e.target.value)}
                  className={clsx(
                    "w-full px-4 py-3 rounded-xl border bg-white text-gray-900",
                    "focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
                    errors.username ? "border-red-500" : "border-gray-200"
                  )}
                  placeholder="Nguyễn Văn A"
                />
                {errors.username && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <AlertCircle size={18} className="text-red-500" />
                  </div>
                )}
              </div>
              {errors.username && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.username}</p>}
            </div>

            {/* Họ tên đầy đủ */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <UserIcon size={16} className="text-red-600" />
                Họ tên đầy đủ <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className={clsx(
                    "w-full px-4 py-3 rounded-xl border bg-white text-gray-900",
                    "focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
                    errors.name ? "border-red-500" : "border-gray-200"
                  )}
                  placeholder="Nguyễn Văn A"
                />
                {errors.name && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <AlertCircle size={18} className="text-red-500" />
                  </div>
                )}
              </div>
              {errors.name && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.name}</p>}
            </div>

            {/* Mật khẩu (chỉ hiển thị khi tạo mới) */}
            {mode === 'create' && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Lock size={16} className="text-red-600" />
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    className={clsx(
                      "w-full px-4 py-3 rounded-xl border bg-white text-gray-900",
                      "focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
                      errors.password ? "border-red-500" : "border-gray-200"
                    )}
                    placeholder="Tối thiểu 6 ký tự"
                  />
                  {errors.password && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle size={18} className="text-red-500" />
                    </div>
                  )}
                </div>
                {errors.password && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.password}</p>}
              </div>
            )}

            {/* Vai trò */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Shield size={16} className="text-red-600" />
                Vai trò <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleChange("role", value as UserRole)}
              >
                <SelectTrigger className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all">
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Quản trị</SelectItem>
                  <SelectItem value="ManagementStaff">Nhân viên quản lý</SelectItem>
                  <SelectItem value="Teacher">Giáo viên</SelectItem>
                  <SelectItem value="Parent">Phụ huynh</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Chi nhánh */}
            <div className="space-y-2">

              <AdminBranchSelectField
                isOpen={isOpen}
                mode={mode}
                value={formData.branchId}
                options={branches.map((branch) => ({ id: branch.id, label: branch.name }))}
                onValueChange={(value) => handleChange("branchId", value)}
                error={errors.branchId}
                required={mode === 'create'}
                placeholder={branches.length === 0 ? "Đang tải chi nhánh..." : "Vui lòng chọn chi nhánh"}
                dataField="branchId"
              />
              {errors.branchId && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.branchId}</p>}
            </div>
          </form>
        </div>

        {/* Modal Footer - Giống style modal class */}
        <div className="border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 p-6">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              onClick={handleSubmit}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[140px]"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {mode === 'create' ? 'Tạo tài khoản' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}