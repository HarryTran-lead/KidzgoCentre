import { useState, useEffect } from 'react';
import { X, Loader2, Plus, PencilLine } from 'lucide-react';
import type { Branch, CreateBranchRequest, UpdateBranchRequest } from '@/types/branch';

type BranchFormModalProps = {
  mode: 'add' | 'edit';
  branch?: Branch;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBranchRequest | UpdateBranchRequest) => void;
  isSubmitting: boolean;
};

export default function BranchFormModal({
  mode,
  branch,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: BranchFormModalProps) {
  const [formData, setFormData] = useState<CreateBranchRequest>({
    code: '',
    name: '',
    address: '',
    contactPhone: '',
    contactEmail: '',
    description: '',
    isActive: true,
  });

  // Pre-fill form data for edit mode
  useEffect(() => {
    if (mode === 'edit' && branch) {
      setFormData({
        code: branch.code,
        name: branch.name,
        address: branch.address,
        contactPhone: branch.contactPhone,
        contactEmail: branch.contactEmail,
        description: branch.description || '',
        isActive: branch.isActive,
      });
    } else {
      // Reset form for add mode
      setFormData({
        code: '',
        name: '',
        address: '',
        contactPhone: '',
        contactEmail: '',
        description: '',
        isActive: true,
      });
    }
  }, [mode, branch, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof CreateBranchRequest, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-pink-500 to-rose-500 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {mode === 'add' ? (
              <Plus className="w-6 h-6 text-white" />
            ) : (
              <PencilLine className="w-6 h-6 text-white" />
            )}
            <h2 className="text-xl font-bold text-white">
              {mode === 'add' ? 'Thêm chi nhánh mới' : 'Chỉnh sửa chi nhánh'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mã chi nhánh <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200"
              placeholder="VD: CN001"
              disabled={mode === 'edit'} // Code không thể sửa
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên chi nhánh <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200"
              placeholder="VD: KidzGo Quận 1"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Địa chỉ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200"
              placeholder="Nhập địa chỉ đầy đủ"
            />
          </div>

          {/* Contact Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số điện thoại liên hệ <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={formData.contactPhone}
              onChange={(e) => handleChange('contactPhone', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200"
              placeholder="VD: 0909123456"
            />
          </div>

          {/* Contact Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email liên hệ <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.contactEmail}
              onChange={(e) => handleChange('contactEmail', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200"
              placeholder="email@example.com"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200"
              placeholder="Mô tả chi nhánh (tùy chọn)"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
              className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              {mode === 'add' ? 'Kích hoạt ngay' : 'Chi nhánh đang hoạt động'}
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {mode === 'add' ? 'Đang thêm...' : 'Đang lưu...'}
                </>
              ) : (
                mode === 'add' ? 'Thêm chi nhánh' : 'Lưu thay đổi'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
