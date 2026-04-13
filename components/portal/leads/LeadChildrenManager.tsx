/**
 * LeadChildrenManager Component
 * Manages children for a specific lead
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { Plus, Edit, Trash2, User, Calendar, Book, Activity, Clock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import ConfirmModal from "@/components/ConfirmModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/lightswind/select";
import {
  getLeadChildren,
  createLeadChild,
  updateLeadChild,
  deleteLeadChild,
} from "@/lib/api/leadService";
import { getProgramsForBranchDropdown } from "@/lib/api/programService";
import type { LeadChild, CreateLeadChildRequest } from "@/types/lead";
import type { Program } from "@/types/admin/programs";

interface LeadChildrenManagerProps {
  leadId: string;
  isEditable?: boolean;
  onChildrenChanged?: () => void;
}

export default function LeadChildrenManager({
  leadId,
  isEditable = true,
  onChildrenChanged,
}: LeadChildrenManagerProps) {
  const { toast } = useToast();
  const { user: currentUser } = useCurrentUser();
  const [children, setChildren] = useState<LeadChild[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<LeadChild | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{isOpen: boolean, childId: string | null}>({ isOpen: false, childId: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isProgramsLoading, setIsProgramsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateLeadChildRequest>({
    childName: "",
    dob: "",
    gender: undefined,
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

  const resolveCurrentUserBranchId = useCallback((): string => {
    const user = currentUser as any;
    return String(
      user?.branchId ||
      user?.branch?.id ||
      user?.branch?.branchId ||
      user?.selectedProfile?.branchId ||
      user?.profiles?.[0]?.branchId ||
      ""
    );
  }, [currentUser]);

  const fetchPrograms = useCallback(async () => {
    const branchId = resolveCurrentUserBranchId();
    if (!branchId) {
      setPrograms([]);
      return;
    }

    try {
      setIsProgramsLoading(true);
      const programItems = await getProgramsForBranchDropdown(branchId);
      const activePrograms = programItems.filter((program) => program.isActive !== false);
      setPrograms(activePrograms);
    } catch (error) {
      console.error("Error fetching programs for branch:", error);
      setPrograms([]);
    } finally {
      setIsProgramsLoading(false);
    }
  }, [resolveCurrentUserBranchId]);

  const selectedProgramName = (formData.programInterest || "").trim();

  const programOptions = useMemo(() => {
    const mapped = programs
      .filter((program) => Boolean(program.name))
      .map((program) => ({
        value: program.name,
        label: program.name,
      }));

    if (selectedProgramName && !mapped.some((program) => program.value === selectedProgramName)) {
      mapped.unshift({
        value: selectedProgramName,
        label: `${selectedProgramName} (đã chọn)`,
      });
    }

    return mapped;
  }, [programs, selectedProgramName]);

  const getChildStatusLabel = (status?: string) => {
    if (!status) return "";
    const normalized = status.toLowerCase();
    if (normalized === "new") return "Mới";
    if (normalized === "contacted") return "Đang tư vấn";
    if (normalized === "bookedtest") return "Đã đặt lịch test";
    if (normalized === "testdone") return "Đã test";
    if (normalized === "enrolled") return "Đã ghi danh";
    if (normalized === "lost") return "Đã hủy";
    return status;
  };

  useEffect(() => {
    if (leadId) {
      fetchChildren();
    }
  }, [leadId, fetchChildren]);

  useEffect(() => {
    if (isFormOpen) {
      fetchPrograms();
    }
  }, [isFormOpen, fetchPrograms]);

  const getAgeFromDob = (dob: string): number => {
    const birthDate = new Date(dob);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const hasNotHadBirthdayYet = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate());

    if (hasNotHadBirthdayYet) {
      age -= 1;
    }

    return age;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.dob) {
      const age = getAgeFromDob(formData.dob);
      if (age <= 3 || age >= 99) {
        toast({
          title: "Ngày sinh không hợp lệ",
          description: "Tuổi của bé phải lớn hơn 3 và nhỏ hơn 99.",
          variant: "destructive",
        });
        return;
      }
    }

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
          await fetchChildren();
          onChildrenChanged?.();
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
          await fetchChildren();
          onChildrenChanged?.();
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
      gender: child.gender || undefined,
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
        await fetchChildren();
        onChildrenChanged?.();
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
      gender: undefined,
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
    return (
      <div className="p-6 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-pink-500 border-r-transparent"></div>
        <p className="mt-2 text-sm text-gray-500">Đang tải...</p>
      </div>
    );
  }

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
            className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
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
        <div className="max-h-100 overflow-y-auto space-y-3 pr-2">
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
                        <Image
                          src={child.gender === 'Male' ? "/icons/male.png" : "/icons/female.png"}
                          alt={child.gender === 'Male' ? 'Nam' : 'Nữ'}
                          width={20}
                          height={20}
                          className="w-4 h-4"
                        />
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

                  {/* Status Badge */}
                  {(child as any).status && (
                    <div className="flex items-center gap-2 text-sm">
                      <Activity size={14} className="text-blue-500" />
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getChildStatusLabel((child as any).status)}
                      </span>
                    </div>
                  )}

                  {/* Converted Student Profile */}
                  {/* {(child as any).convertedStudentProfileId && (
                    <div className="flex items-center gap-2 text-sm text-emerald-600">
                      <CheckCircle size={14} />
                      <span>Đã chuyển đổi • ID: {(child as any).convertedStudentProfileId}</span>
                    </div>
                  )} */}

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-3 text-xs text-gray-400 pt-2 border-t border-gray-100">
                    {child.createdAt && (
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>Tạo: {formatDate(child.createdAt)}</span>
                      </div>
                    )}
                    {child.updatedAt && (
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>Cập nhật: {formatDate(child.updatedAt)}</span>
                      </div>
                    )}
                  </div>
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
                <Select
                  value={formData.gender || ""}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      gender: (value as "Male" | "Female") || undefined,
                    })
                  }
                >
                  <SelectTrigger className="h-10.5 rounded-lg border border-gray-300 px-3 py-2 text-left focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20">
                    <SelectValue placeholder="-- Chọn giới tính --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">-- Chọn giới tính --</SelectItem>
                    <SelectItem value="Male">Nam</SelectItem>
                    <SelectItem value="Female">Nữ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chương trình quan tâm
                </label>
                <Select
                  value={formData.programInterest || ""}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      programInterest: value,
                    })
                  }
                  disabled={isProgramsLoading || programOptions.length === 0}
                >
                  <SelectTrigger className="h-10.5 rounded-lg border border-gray-300 px-3 py-2 text-left focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20">
                    <SelectValue
                      placeholder={
                        isProgramsLoading
                          ? "Đang tải chương trình..."
                          : programOptions.length > 0
                            ? "Tìm và chọn chương trình"
                            : "Không có chương trình theo chi nhánh"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Không chọn chương trình</SelectItem>
                    {programOptions.map((program) => (
                      <SelectItem key={program.value} value={program.value}>
                        {program.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-gray-500">
                  Gõ vào ô chọn để tìm nhanh chương trình theo chi nhánh tài khoản.
                </p>
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
                  className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
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
