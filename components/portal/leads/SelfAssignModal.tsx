"use client";

import { useState } from "react";
import { X, UserCheck, Loader2, AlertCircle } from "lucide-react";
import type { Lead } from "@/types/lead";
import { selfAssignLead } from "@/lib/api/leadService";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface SelfAssignModalProps {
  isOpen: boolean;
  lead: Lead | null;
  onClose: () => void;
  onAssigned: () => void;
}

export default function SelfAssignModal({
  isOpen,
  lead,
  onClose,
  onAssigned,
}: SelfAssignModalProps) {
  const { toast } = useToast();
  const { user: currentUser } = useCurrentUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  const handleSelfAssign = async () => {
    if (!lead) {
      setError("Không tìm thấy thông tin lead");
      return;
    }

    // Check if lead already has an owner
    if (lead.ownerStaffId) {
      setError("Lead này đã được phân công cho nhân viên khác");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await selfAssignLead(lead.id);

      if (response.isSuccess) {
        toast({
          title: "Thành công",
          description: "Bạn đã nhận lead này thành công",
          variant: "success",
        });
        onAssigned(); // Reload table data
        onClose(); // Close modal
      } else {
        setError(response.message || "Không thể nhận lead");
      }
    } catch (err: any) {
      console.error("Error self-assigning lead:", err);
      const errorMessage = err.response?.data?.message || err.message || "Đã xảy ra lỗi khi nhận lead";
      setError(errorMessage);
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !lead) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <UserCheck size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Nhận lead
                </h2>
                <p className="text-sm text-white/80 mt-1">
                  Xác nhận nhận lead này
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors text-white"
              disabled={isSubmitting}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Lead Info */}
          <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Thông tin lead:
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-pink-400 to-rose-400 flex items-center justify-center text-white text-sm font-semibold">
                  {lead.contactName ? lead.contactName.split(" ").map(word => word[0]).join("").toUpperCase().slice(0, 2) : "??"}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {lead.contactName || "Không có tên"}
                  </p>
                  <p className="text-xs text-gray-500">{lead.phone}</p>
                </div>
              </div>
              {lead.email && (
                <p className="text-sm text-gray-600 pl-13">
                  Email: {lead.email}
                </p>
              )}
            </div>
          </div>

          {/* Current Staff Info */}
          {currentUser && (
            <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-white p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Bạn sẽ là người phụ trách:
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center justify-center text-white text-sm font-semibold">
                  {currentUser.fullName?.split(" ").pop()?.[0] || "N"}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {currentUser.fullName}
                  </p>
                  <p className="text-xs text-gray-500">{currentUser.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Confirmation Text */}
          <div className="rounded-xl border border-pink-200 bg-gradient-to-br from-pink-50 to-white p-4">
            <p className="text-sm text-gray-700 text-center">
              Bạn có chắc chắn muốn nhận lead này không?<br />
              <span className="text-pink-600 font-medium">
                Bạn sẽ chịu trách nhiệm tư vấn và chăm sóc lead này.
              </span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-pink-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              onClick={handleSelfAssign}
              disabled={isSubmitting || !!lead.ownerStaffId}
              className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <UserCheck size={16} />
                  Xác nhận nhận lead
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
