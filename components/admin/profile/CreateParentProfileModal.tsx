"use client";

import { useState, useEffect, useRef } from "react";
import { X, User as UserIcon, Lock, Loader2, Search, ChevronDown } from "lucide-react";
import type { CreateParentProfileRequest } from "@/types/profile";
import { getAllUsers } from "@/lib/api/userService";
import type { User } from "@/types/admin/user";

interface CreateParentAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (profileData: CreateParentProfileRequest) => Promise<void>;
}

export default function CreateParentAccountModal({ 
  isOpen, 
  onClose, 
  onSubmit 
}: CreateParentAccountModalProps) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    userId: '',
    displayName: '',
    pinHash: '',
  });

  // Fetch users when modal opens
  useEffect(() => {
    if (!isOpen) return;
    
    // Reset form when modal opens
    setFormData({
      userId: '',
      displayName: '',
      pinHash: '',
    });
    setSelectedUser(null);
    setSearchTerm('');
    setShowDropdown(false);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setFormData({ ...formData, userId: user.id });
    setSearchTerm(user.email);
    setShowDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate userId
    if (!formData.userId) {
      alert('Vui lòng chọn User Email');
      return;
    }
    
    // Validate PIN (must be 4 digits)
    if (!/^\d{4}$/.test(formData.pinHash)) {
      alert('Mã PIN phải là 4 chữ số');
      return;
    }
    
    setLoading(true);
    try {
      // Prepare profile data
      const profileData: CreateParentProfileRequest = {
        userId: formData.userId,
        profileType: 'Parent',
        displayName: formData.displayName,
        pinHash: formData.pinHash,
      };

      await onSubmit(profileData);
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
        <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            Tạo profile Parent
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Profile Section */}
          <div className="space-y-4">
            {/* User Email Selection */}
            <div ref={dropdownRef} className="relative">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <UserIcon size={16} />
                User Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowDropdown(true);
                    if (selectedUser && e.target.value !== selectedUser.email) {
                      setSelectedUser(null);
                      setFormData({ ...formData, userId: '' });
                    }
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder={loadingUsers ? 'Đang tải danh sách...' : 'Tìm kiếm email user...'}
                  disabled={loadingUsers}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {loadingUsers ? (
                    <Loader2 size={16} className="animate-spin text-gray-400" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400" />
                  )}
                </div>
              </div>
              {/* Dropdown list */}
              {showDropdown && !loadingUsers && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleSelectUser(user)}
                        className={`w-full text-left px-4 py-2.5 hover:bg-purple-50 transition-colors flex flex-col ${
                          selectedUser?.id === user.id ? 'bg-purple-50 border-l-2 border-purple-500' : ''
                        }`}
                      >
                        <span className="text-sm font-medium text-gray-800">{user.email}</span>
                        <span className="text-xs text-gray-500">{user.name} {user.branchName ? `• ${user.branchName}` : ''}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      Không tìm thấy user nào
                    </div>
                  )}
                </div>
              )}
              {selectedUser ? (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Đã chọn: {selectedUser.email} ({selectedUser.name})
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  Chọn email của user (Parent) đã tồn tại trong hệ thống
                </p>
              )}
            </div>

            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
              Thông tin Profile
            </h3>

            {/* Display Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <UserIcon size={16} />
                Tên hiển thị <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Harry Style"
              />
              <p className="text-xs text-gray-500 mt-1">
                Tên này sẽ hiển thị trong profile của Parent
              </p>
            </div>

            {/* PIN */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Lock size={16} />
                Mã PIN (4 chữ số) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                pattern="\d{4}"
                maxLength={4}
                value={formData.pinHash}
                onChange={(e) => setFormData({ ...formData, pinHash: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="1234"
              />
              <p className="text-xs text-gray-500 mt-1">
                Mã PIN để truy cập nhanh vào profile
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:transform-none flex items-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
