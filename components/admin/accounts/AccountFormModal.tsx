"use client";

import { useState, useEffect } from "react";
import { X, Mail, User as UserIcon, Lock, Shield, Building, Loader2 } from "lucide-react";
import type { User, UserRole, CreateUserRequest, UpdateUserRequest } from "@/types/admin/user";

interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserRequest | UpdateUserRequest) => Promise<void>;
  account?: User | null; // If provided, it's edit mode
  mode: 'create' | 'edit';
}

export default function AccountFormModal({ isOpen, onClose, onSubmit, account, mode }: AccountFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    userName: '',
    password: '',
    role: 'Parent' as UserRole,
    branchId: '',
  });

  useEffect(() => {
    // Only load data when modal opens
    if (!isOpen) return;
    
    if (mode === 'edit' && account) {
      setFormData({
        email: account.email,
        name: account.name || account.userName,
        userName: account.userName,
        password: '',
        role: account.role,
        branchId: account.branchId || '',
      });
    } else if (mode === 'create') {
      // Reset to empty form for create mode
      setFormData({
        email: '',
        name: '',
        userName: '',
        password: '',
        role: 'Parent',
        branchId: '',
      });
    }
  }, [mode, account, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'create') {
        await onSubmit({
          email: formData.email,
          name: formData.name,
          password: formData.password,
          role: formData.role,
          branchId: formData.branchId || undefined,
        } as CreateUserRequest);
      } else {
        const updateData: UpdateUserRequest = {
          email: formData.email,
          userName: formData.userName,
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl m-4">
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

          {/* Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <UserIcon size={16} className="text-pink-600" />
              Tên hiển thị <span className="text-red-500">*</span>
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

          {/* Username (edit mode only) */}
          {mode === 'edit' && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <UserIcon size={16} className="text-pink-600" />
                Username
              </label>
              <input
                type="text"
                value={formData.userName}
                onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-200"
                placeholder="username"
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
              <option value="Teacher">Giáo viên</option>
              <option value="Parent">Phụ huynh</option>
              <option value="Staff">Nhân viên</option>
            </select>
          </div>

          {/* Branch ID (optional) */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Building size={16} className="text-pink-600" />
              ID Chi nhánh (tùy chọn)
            </label>
            <input
              type="text"
              value={formData.branchId}
              onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-200"
              placeholder="Nhập ID chi nhánh"
            />
          </div>

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
              disabled={loading}
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
