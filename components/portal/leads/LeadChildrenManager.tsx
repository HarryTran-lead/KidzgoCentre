/**
 * LeadChildrenManager Component
 * Manages children for a specific lead
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Plus, Edit, Trash2, User, Calendar, Book, UserRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ConfirmModal from "@/components/ConfirmModal";
import {
  getLeadChildren,
  createLeadChild,
  updateLeadChild,
  deleteLeadChild,
} from "@/lib/api/leadService";
import type { LeadChild, CreateLeadChildRequest } from "@/types/lead";

interface LeadChildrenManagerProps {
  leadId: string;
  isEditable?: boolean;
}

export default function LeadChildrenManager({
  leadId,
  isEditable = true,
}: LeadChildrenManagerProps) {
  const { toast } = useToast();
  const [children, setChildren] = useState<LeadChild[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<LeadChild | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{isOpen: boolean, childId: string | null}>({ isOpen: false, childId: null });
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateLeadChildRequest>({
    childName: "",
    dob: "",
    gender: "",
    programInterest: "",
    notes: "",
  });

  const fetchChildren = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getLeadChildren(leadId);
      
      if (response.isSuccess && response.data?.children) {  
        setChildren(response.data.children);
      } else {
        setChildren([]);
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách bé",
        variant: "destructive",
      });
      setChildren([]);
    } finally {
      setIsLoading(false);
    }
  }, [leadId, toast]);

  useEffect(() => {
    if (leadId) {
      fetchChildren();
    }
  }, [leadId, fetchChildren]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingChild) {
        // Update existing child
        const response = await updateLeadChild(leadId, editingChild.id, formData);
        
        if (response.isSuccess) {
          toast({
            title: "Thành công",
            description: "Đã cập nhật thông tin bé",
            variant: "success",
          });
          fetchChildren();
          resetForm();
        }
      } else {
        // Create new child
        const response = await createLeadChild(leadId, formData);
        
        if (response.isSuccess) {
          toast({
            title: "Thành công",
            description: "Đã thêm bé mới",
            variant: "success",
          });
          fetchChildren();
          resetForm();
        }
      }
    } catch (error: any) {
      console.error("Error saving child:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể lưu thông tin con",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (child: LeadChild) => {
    setEditingChild(child);
    setFormData({
      childName: child.childName,
      dob: child.dob || "",
      gender: child.gender || "",
      programInterest: child.programInterest || "",
      notes: child.notes || "",
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (childId: string) => {
    setDeleteConfirm({ isOpen: true, childId });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.childId) return;

    try {
      setIsDeleting(true);
      const response = await deleteLeadChild(leadId, deleteConfirm.childId);
      
      if (response.isSuccess) {
        toast({
          title: "Thành công",
          description: "Đã xóa bé",
          variant: "success",
        });
        fetchChildren();
        setDeleteConfirm({ isOpen: false, childId: null });
      }
    } catch (error: any) {
      console.error("Error deleting child:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa bé",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      childName: "",
      dob: "",
      gender: "",
      programInterest: "",
      notes: "",
    });
    setEditingChild(null);
    setIsFormOpen(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("vi-VN");
    } catch {
      return "-";
    }
  };

  if (isLoading) {
    console.log('⏳ Loading children...');
    return (
      <div className="p-6 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-pink-500 border-r-transparent"></div>
        <p className="mt-2 text-sm text-gray-500">Đang tải...</p>
      </div>
    );
  }

  console.log('🎨 Rendering children list. Count:', children.length, 'Data:', children);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Thông tin của bé ({children.length})
        </h3>
        {isEditable && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-pink-500 px-4 py-2 text-sm font-medium text-white hover:bg-pink-600 transition-colors"
          >
            <Plus size={16} />
            Thêm bé mới
          </button>
        )}
      </div>

      {/* Children List */}
      {children.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <User size={48} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600">Chưa có thông tin con</p>
          {isEditable && (
            <button
              onClick={() => setIsFormOpen(true)}
              className="mt-3 text-sm text-pink-600 hover:text-pink-700"
            >
              Thêm thông tin con
            </button>
          )}
        </div>
      ) : (
        <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
          {children.map((child) => (
            <div
              key={child.id}
              className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <User size={18} className="text-pink-500" />
                    <h4 className="font-medium text-gray-900">
                      {child.childName}
                    </h4>
                    {child.gender && (
                      <span className="inline-flex items-center gap-1 text-xs">
                        {child.gender === 'Nam' || child.gender === 'male' ? (
                          <>
                            <Image
                              src="/icons/male.png"
                              alt="Nam"
                              width={20}
                              height={20}
                              className="w-4 h-4"
                            />
                          </>
                        ) : (
                          <>
                            <Image
                              src="/icons/female.png"
                              alt="Nữ"
                              width={20}
                              height={20}
                              className="w-4 h-4"
                            />                          
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  {child.dob && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={14} />
                      <span>Ngày sinh: {formatDate(child.dob)}</span>
                    </div>
                  )}

                  {child.programInterest && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Book size={14} />
                      <span>Chương trình quan tâm: {child.programInterest}</span>
                    </div>
                  )}

                  {child.notes && (
                    <p className="text-sm text-gray-500 italic">{child.notes}</p>
                  )}
                </div>

                {isEditable && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(child)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Sửa"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(child.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {editingChild ? "Sửa thông tin bé" : "Thêm bé mới"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên con <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.childName}
                  onChange={(e) =>
                    setFormData({ ...formData, childName: e.target.value })
                  }
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                  placeholder="Nhập tên con"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày sinh
                </label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) =>
                    setFormData({ ...formData, dob: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giới tính
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                >
                  <option value="">-- Chọn giới tính --</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chương trình quan tâm
                </label>
                <input
                  type="text"
                  value={formData.programInterest}
                  onChange={(e) =>
                    setFormData({ ...formData, programInterest: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                  placeholder="Ví dụ: Tiếng Anh thiếu nhi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                  placeholder="Ghi chú thêm..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-pink-500 px-4 py-2 text-sm font-medium text-white hover:bg-pink-600 transition-colors"
                >
                  {editingChild ? "Cập nhật" : "Thêm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, childId: null })}
        onConfirm={confirmDelete}
        title="Xác nhận xóa bé"
        message="Bạn có chắc chắn muốn xóa thông tin bé này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
