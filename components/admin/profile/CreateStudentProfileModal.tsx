"use client";

import { useState, useEffect, useRef } from "react";
import { X, User as UserIcon, Loader2, Search, ChevronDown } from "lucide-react";
import type { CreateStudentProfileRequest } from "@/types/profile";
import { getAllUsers } from "@/lib/api/userService";
import type { User } from "@/types/admin/user";

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
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
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
      alert('Vui lòng chọn Email của Parent');
      return;
    }

    setLoading(true);
    try {
      // Prepare profile data (Student uses parent's userId)
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

  if (!isOpen) return null;
 
  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl m-4">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            Tạo Profile Student
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
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
            <p className="text-sm text-yellow-800">
              <strong>Lưu ý:</strong> Student profile được tạo dựa trên tài khoản Parent đã chọn. 
              Student không cần mã PIN để đăng nhập.
            </p>
          </div>

          {/* Profile Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
              Thông tin Profile
            </h3>

            {/* User Email Selection (Parent's account) */}
            <div ref={dropdownRef} className="relative">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Search size={16} />
                Email Account của Parent <span className="text-red-500">*</span>
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
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder={loadingUsers ? 'Đang tải danh sách...' : 'Tìm kiếm email Parent...'}
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
                        className={`w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors flex flex-col ${
                          selectedUser?.id === user.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''
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
                  Chọn email tài khoản Parent dùng để đăng nhập hệ thống
                </p>
              )}
            </div>

            {/* Display Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <UserIcon size={16} />
                Tên học sinh <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Test"
              />
              <p className="text-xs text-gray-500 mt-1">
                Tên này sẽ hiển thị trong profile của Student
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
            <p className="text-sm text-blue-800">
              💡 Student profile sẽ được tạo và quản lý theo cùng tài khoản Parent.
            </p>
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
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:transform-none flex items-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Đang tạo...' : 'Tạo Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
