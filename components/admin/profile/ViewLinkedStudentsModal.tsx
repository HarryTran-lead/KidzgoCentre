"use client";

import { useState, useEffect } from "react";
import { X, Users, Trash2, Loader2, UserCircle, AlertCircle, Mail, Eye } from "lucide-react";
import { getAllStudents, unlinkStudentFromParent } from "@/lib/api/profileService";
import { toast } from "@/hooks/use-toast";
import ConfirmModal from "@/components/ConfirmModal";

interface ViewLinkedStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  parentName: string | null;
  onRefresh?: () => void;
  onViewStudentDetail?: (studentId: string) => void;
}

interface StudentItem {
  id: string;
  displayName: string;
  userId: string;
  userEmail: string;
  isActive: boolean;
  createdAt: string;
}

export default function ViewLinkedStudentsModal({ 
  isOpen, 
  onClose,
  userId,
  parentName,
  onRefresh,
  onViewStudentDetail
}: ViewLinkedStudentsModalProps) {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; name: string } | null>(null);

  // Load students linked to this parent
  useEffect(() => {
    if (!isOpen || !userId) return;

    loadLinkedStudents();
  }, [isOpen, userId]);

  const loadLinkedStudents = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await getAllStudents({
        userId: userId, // Filter by parent's userId
        profileType: 'Student',
        pageSize: 100,
      });
      
      if (response.data?.items) {
        setStudents(response.data.items as StudentItem[]);
      }
    } catch (error) {
      console.error('Failed to load linked students:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách học sinh",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async (studentId: string, studentName: string) => {
    setSelectedStudent({ id: studentId, name: studentName });
    setShowConfirmModal(true);
  };

  const confirmUnlink = async () => {
    if (!userId || !selectedStudent) return;

    setUnlinkingId(selectedStudent.id);
    try {
      await unlinkStudentFromParent({
        parentProfileId: userId,
        studentProfileId: selectedStudent.id,
      });

      toast({
        title: "Thành công",
        description: `Đã hủy liên kết học sinh "${selectedStudent.name}"`,
        variant: "default",
      });

      // Refresh the list
      await loadLinkedStudents();
      
      // Notify parent to refresh main list
      if (onRefresh) {
        onRefresh();
      }
    } catch (error: any) {
      console.error('Failed to unlink student:', error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể hủy liên kết học sinh",
        variant: "destructive",
      });
    } finally {
      setUnlinkingId(null);
      setShowConfirmModal(false);
      setSelectedStudent(null);
    }
  };

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl m-4">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users size={24} />
              Học sinh đã liên kết
            </h2>
            {parentName && (
              <p className="text-emerald-100 text-sm mt-1">
                Parent: {parentName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            disabled={loading || !!unlinkingId}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            <X size={24} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mb-6">
            <p className="text-sm text-blue-800">
              <strong>Thông tin:</strong> Danh sách các học sinh đã được liên kết với tài khoản Parent này. 
              Học sinh sử dụng cùng User ID với Parent để truy cập hệ thống.
            </p>
          </div>

          {/* Students List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12">
              <UserCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Chưa có học sinh nào</p>
              <p className="text-sm text-gray-400 mt-2">
                Các Student profile với cùng User ID sẽ hiển thị ở đây
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold shadow-sm">
                      {student.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {student.displayName}
                        </h3>
                        {student.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                            Đang hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                            Không hoạt động
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <Mail size={14} />
                        {student.userEmail || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        ID: {student.id.substring(0, 8)}... • Tạo ngày: {formatDate(student.createdAt)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {/* View Detail Button */}
                    {onViewStudentDetail && (
                      <button
                        onClick={() => onViewStudentDetail(student.id)}
                        className="flex-shrink-0 p-2.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition-all group"
                        title="Xem chi tiết"
                      >
                        <Eye size={18} className="group-hover:scale-110 transition-transform" />
                      </button>
                    )}
                    
                    {/* Unlink Button */}
                    <button
                      onClick={() => handleUnlink(student.id, student.displayName)}
                      disabled={unlinkingId === student.id}
                      className="flex-shrink-0 p-2.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                      title="Hủy liên kết"
                    >
                      {unlinkingId === student.id ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {students.length > 0 && (
            <div className="mt-6 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg">
              <div className="flex items-start gap-2">
                <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  <strong>Lưu ý:</strong> Hủy liên kết sẽ ngừng quyền truy cập của học sinh qua tài khoản Parent này. 
                  Student profile vẫn tồn tại và có thể được liên kết lại bằng cách tạo mới với cùng User ID.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t mt-6">
            <button
              onClick={onClose}
              disabled={loading || !!unlinkingId}
              className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Unlink Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setSelectedStudent(null);
        }}
        onConfirm={confirmUnlink}
        title="Xác nhận hủy liên kết"
        message={
          selectedStudent
            ? `Bạn có chắc muốn hủy liên kết học sinh "${selectedStudent.name}" khỏi tài khoản "${parentName}"?\n\nHọc sinh sẽ không thể truy cập hệ thống qua tài khoản Parent này nữa.`
            : ""
        }
        confirmText="Hủy liên kết"
        cancelText="Hủy"
        variant="danger"
      />
    </div>
  );
}
