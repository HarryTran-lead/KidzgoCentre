"use client";

import { useState, useEffect } from "react";
import { X, Mail, User as UserIcon, Lock, Shield, Loader2, Phone } from "lucide-react";
import type { User, UserRole, CreateUserRequest, UpdateUserRequest } from "@/types/admin/user";
import { getAllBranchesPublic } from "@/lib/api/branchService";
import type { Branch } from "@/types/branch";
import AdminBranchSelectField from "@/components/admin/common/AdminBranchSelectField";

interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserRequest | UpdateUserRequest) => Promise<void>;
  account?: User | null; // If provided, it's edit mode
  mode: 'create' | 'edit';
}

export default function AccountFormModal({ isOpen, onClose, onSubmit, account, mode }: AccountFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [errors, setErrors] = useState<{ branchId?: string }>({});
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    username: '',
    password: '',
    role: 'Parent' as UserRole,
    branchId: '',
    phoneNumber: '',
  });

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
        branchId: '',
        phoneNumber: '',
      });
    }
    setErrors({});
  }, [mode, account, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'create' && !formData.branchId) {
      setErrors({ branchId: 'Chi nhánh là bắt buộc' });
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
        console.log("update", updateData);
        await onSubmit(updateData);
      }
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
 
  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[100vh] overflow-y-auto bg-white rounded-2xl shadow-2xl m-4">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {mode === 'create' ? 'Tạo tài khoản mới' : 'Cập nhật tài khoản'}
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            <X size={24} className="text-white" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Email */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Mail size={16} className="text-pink-600" />
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-200"
              placeholder="example@gmail.com"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Phone size={16} className="text-pink-600" />
              Số điện thoại
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-200"
              placeholder="0123456789"
              pattern="[0-9]*"
            />
          </div>

          {/* Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <UserIcon size={16} className="text-pink-600" />
              Tên hiển thị <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-200"
              placeholder="Nguyễn Văn A"
            />
          </div>

          {/* Username */}
          {mode === 'create' && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <UserIcon size={16} className="text-pink-600" />
                Họ tên đầy đủ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-200"
                placeholder="Nguyễn Văn A"
              />
            </div>
          )}

          {/* Username (edit mode only) */}
          {mode === 'edit' && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <UserIcon size={16} className="text-pink-600" />
                Họ tên đầy đủ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-200"
                placeholder="Nguyễn Văn A"
              />
            </div>
          )}

          {/* Password (create mode only) */}
          {mode === 'create' && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Lock size={16} className="text-pink-600" />
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-200"
                placeholder="Tối thiểu 6 ký tự"
                minLength={6}
              />
            </div>
          )}

          {/* Role */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Shield size={16} className="text-pink-600" />
              Vai trò <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="w-full px-4 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-200"
            >
              <option value="Admin">Quản trị</option>
              <option value="ManagementStaff">Nhân viên quản lý</option>
              <option value="Teacher">Giáo viên</option>
              <option value="Parent">Phụ huynh</option>
            </select>
          </div>

          <AdminBranchSelectField
            isOpen={isOpen}
            mode={mode}
            value={formData.branchId}
            options={branches.map((branch) => ({ id: branch.id, label: branch.name }))}
            onValueChange={(value) => {
              setFormData((prev) => ({ ...prev, branchId: value }));
              if (errors.branchId) {
                setErrors({});
              }
            }}
            error={errors.branchId}
            required={mode === 'create'}
            placeholder="Vui lòng chọn chi nhánh"
            dataField="branchId"
          />

          {/* Footer */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || (mode === 'create' && !formData.branchId)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {mode === 'create' ? 'Tạo tài khoản' : 'Cập nhật'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
