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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex-shrink-0 rounded-t-2xl sticky top-0 bg-gradient-to-r from-red-600 to-red-700 p-6 flex items-center justify-between">
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
            className="p-2 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Form */}
        <form id="branchForm" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Code */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mã chi nhánh <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                mode === 'edit'
                  ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-white border-red-200 focus:ring-red-500'
              }`}
              placeholder="VD: CN001"
              disabled={mode === 'edit'}
            />
            {mode === 'edit' && (
              <p className="text-xs text-gray-500 mt-2">Không thể chỉnh sửa mã chi nhánh</p>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tên chi nhánh <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-red-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="VD: Rex Quận 1"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Địa chỉ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-red-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Nhập địa chỉ đầy đủ"
            />
          </div>

          {/* Contact Phone */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Số điện thoại liên hệ <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={formData.contactPhone}
              onChange={(e) => handleChange('contactPhone', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-red-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="VD: 0909123456"
            />
          </div>

          {/* Contact Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email liên hệ <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.contactEmail}
              onChange={(e) => handleChange('contactEmail', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-red-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="email@example.com"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mô tả
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-red-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              placeholder="Mô tả chi nhánh (tùy chọn)"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-3 p-4 bg-red-50/50 rounded-xl border border-red-100">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
              className="w-5 h-5 text-red-600 border-red-300 rounded focus:ring-red-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              {mode === 'add' ? 'Kích hoạt ngay' : 'Chi nhánh đang hoạt động'}
            </label>
          </div>
        </form>

        {/* Footer */}
        <div className="flex-shrink-0 rounded-b-2xl sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-red-100 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl border border-red-200 text-gray-700 font-medium hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="branchForm"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
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
      </div>
    </div>
  );
}
