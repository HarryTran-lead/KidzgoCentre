"use client";

import { useState, useEffect, useRef } from "react";
import { X, User as UserIcon, Loader2, AlertCircle, Mail, CheckCircle, Info } from "lucide-react";
import type { CreateStudentProfileRequest } from "@/types/profile";
import { getAllUsers } from "@/lib/api/userService";
import type { User } from "@/types/admin/user";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/lightswind/select";
import clsx from "clsx";

interface CreateStudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (profileData: CreateStudentProfileRequest) => Promise<void>;
}

export default function CreateStudentProfileModal({ 
  isOpen, 
  onClose, 
  onSubmit 
}: CreateStudentProfileModalProps) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [errors, setErrors] = useState<{ userId?: string; displayName?: string }>({});
  const [formData, setFormData] = useState({
    userId: '',
    displayName: '',
  });

  // Fetch Parent users when modal opens
  useEffect(() => {
    if (!isOpen) return;
    
    // Reset form when modal opens
    setFormData({
      userId: '',
      displayName: '',
    });
    setSelectedUser(null);
    setErrors({});

    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const response = await getAllUsers({ role: 'Parent', isActive: true, pageSize: 100 });
        if (response?.data?.items) {
          setUsers(response.data.items);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, [isOpen]);

  // Close modal on click outside
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

  const handleSelectUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setFormData({ ...formData, userId: user.id });
      if (errors.userId) {
        setErrors(prev => ({ ...prev, userId: undefined }));
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!formData.userId) {
      newErrors.userId = "Vui lòng chọn email của Parent";
    }
    
    if (!formData.displayName.trim()) {
      newErrors.displayName = "Tên học sinh là bắt buộc";
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
      const profileData: CreateStudentProfileRequest = {
        userId: formData.userId,
        profileType: 'Student',
        displayName: formData.displayName,
      };

      await onSubmit(profileData);
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
                  Tạo Profile Student
                </h2>
                <p className="text-sm text-red-100">
                  Tạo hồ sơ học sinh cho tài khoản Parent đã tồn tại
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Info Alert - Lưu ý */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <Info size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <strong className="font-semibold">Lưu ý:</strong> Student profile được tạo dựa trên tài khoản Parent đã chọn. 
                Student không cần mã PIN để đăng nhập.
              </div>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 text-sm font-medium text-gray-500 bg-white">Thông tin Profile</span>
              </div>
            </div>

            {/* User Email Selection (Parent's account) */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Mail size={16} className="text-red-600" />
                Email Account của Parent <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.userId}
                onValueChange={handleSelectUser}
                disabled={loadingUsers}
              >
                <SelectTrigger className={clsx(
                  "w-full px-4 py-3 rounded-xl border bg-white text-gray-900",
                  "focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
                  errors.userId ? "border-red-500" : "border-gray-200"
                )}>
                  <SelectValue placeholder={loadingUsers ? "Đang tải danh sách..." : "Tìm kiếm hoặc chọn email Parent..."} />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.email}</span>
                        <span className="text-xs text-gray-500">
                          {user.name} {user.branchName ? `• ${user.branchName}` : ''}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedUser ? (
                <div className="flex items-center gap-2 mt-2 p-2 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle size={16} className="text-green-600" />
                  <p className="text-sm text-green-700">
                    Đã chọn: <span className="font-semibold">{selectedUser.email}</span> ({selectedUser.name})
                  </p>
                </div>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  Chọn email tài khoản Parent dùng để đăng nhập hệ thống
                </p>
              )}
              {errors.userId && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.userId}</p>}
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <UserIcon size={16} className="text-red-600" />
                Tên học sinh <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => handleChange("displayName", e.target.value)}
                  className={clsx(
                    "w-full px-4 py-3 rounded-xl border bg-white text-gray-900",
                    "focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
                    errors.displayName ? "border-red-500" : "border-gray-200"
                  )}
                  placeholder="Nguyễn Văn Bé"
                />
                {errors.displayName && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <AlertCircle size={18} className="text-red-500" />
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Tên này sẽ hiển thị trong profile của Student
              </p>
              {errors.displayName && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.displayName}</p>}
            </div>

            {/* Info Alert - Thông báo */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                💡 Student profile sẽ được tạo và quản lý theo cùng tài khoản Parent.
              </p>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
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
              {loading ? 'Đang tạo...' : 'Tạo Profile'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}