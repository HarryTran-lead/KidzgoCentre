"use client";

import { useState, useEffect } from "react";
import { X, User as UserIcon, Lock, Loader2 } from "lucide-react";
import type { CreateParentProfileRequest } from "@/types/profile";

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
  const [formData, setFormData] = useState({
    userId: '',
    displayName: '',
    pinHash: '',
  });

  useEffect(() => {
    if (!isOpen) return;
    
    // Reset form when modal opens
    setFormData({
      userId: '',
      displayName: '',
      pinHash: '',
    });
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate userId
    if (!formData.userId) {
      alert('Vui lòng nhập User ID');
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
            {/* User ID */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <UserIcon size={16} />
                User ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="3fa85f64-5717-4562-b3fc-2c963f66afa6"
              />
              <p className="text-xs text-gray-500 mt-1">
                ID của user (Parent) đã tồn tại trong hệ thống
              </p>
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
