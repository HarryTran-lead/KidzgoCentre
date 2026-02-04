"use client";

import { useState, useEffect } from "react";
import { X, User as UserIcon, Lock, Loader2 } from "lucide-react";
import type { CreateStudentProfileRequest } from "@/types/profile";

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
  const [formData, setFormData] = useState({
    displayName: '',
    pinHash: '',
  });

  useEffect(() => {
    if (!isOpen) return;
    
    // Reset form when modal opens
    setFormData({
      displayName: '',
      pinHash: '',
    });
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate PIN (must be 4 digits)
    if (!/^\d{4}$/.test(formData.pinHash)) {
      alert('Mã PIN phải là 4 chữ số');
      return;
    }
    
    setLoading(true);
    try {
      // Prepare profile data (Student has no user account)
      const profileData: CreateStudentProfileRequest = {
        userId: '00000000-0000-0000-0000-000000000000', // Empty GUID for students
        profileType: 'Student',
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
              <strong>Lưu ý:</strong> Student chỉ có Profile, không có tài khoản đăng nhập. 
              Student cần được link với Parent để sử dụng hệ thống.
            </p>
          </div>

          {/* Profile Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
              Thông tin Profile
            </h3>

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
                placeholder="Nguyễn Văn B"
              />
              <p className="text-xs text-gray-500 mt-1">
                Tên này sẽ hiển thị trong profile của Student
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
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="1234"
              />
              <p className="text-xs text-gray-500 mt-1">
                Mã PIN để học sinh truy cập nhanh vào profile của mình
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
            <p className="text-sm text-blue-800">
              💡 Sau khi tạo profile, bạn cần link Student này với Parent trong bước tiếp theo.
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
