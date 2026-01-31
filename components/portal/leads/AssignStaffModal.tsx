"use client";

import { useState, useEffect } from "react";
import { X, UserCheck, Search, Loader2, AlertCircle } from "lucide-react";
import type { Lead } from "@/types/lead";
import type { User } from "@/types/admin/user";
import { assignLead } from "@/lib/api/leadService";
import { getManagementStaff } from "@/lib/api/userService";
import { useToast } from "@/hooks/use-toast";

interface AssignStaffModalProps {
  isOpen: boolean;
  lead: Lead | null;
  onClose: () => void;
  onAssigned: () => void;
}

export default function AssignStaffModal({
  isOpen,
  lead,
  onClose,
  onAssigned,
}: AssignStaffModalProps) {
  const { toast } = useToast();
  const [staffList, setStaffList] = useState<User[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  // Fetch ManagementStaff when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchManagementStaff();
      setSelectedStaffId(lead?.ownerStaffId || "");
      setSearchQuery("");
      setError("");
    }
  }, [isOpen, lead]);

  // Filter staff based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredStaff(staffList);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = staffList.filter(
        (staff) =>
          staff.name.toLowerCase().includes(query) ||
          staff.email.toLowerCase().includes(query)
      );
      setFilteredStaff(filtered);
    }
  }, [searchQuery, staffList]);

  const fetchManagementStaff = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await getManagementStaff();

      if (response.isSuccess && response.data && response.data.items) {
        setStaffList(response.data.items);
        setFilteredStaff(response.data.items);
      } else {
        setError("Không thể tải danh sách nhân viên");
      }
    } catch (err) {
      console.error("Error fetching management staff:", err);
      setError("Đã xảy ra lỗi khi tải danh sách nhân viên");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedStaffId) {
      setError("Vui lòng chọn nhân viên");
      return;
    }

    if (!lead) {
      setError("Không tìm thấy thông tin lead");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await assignLead(lead.id, {
        ownerStaffId: selectedStaffId,
      });

      if (response.isSuccess) {
        toast({
          title: "Thành công",
          description: "Đã phân công nhân viên thành công",
          variant: "success",
        });
        onAssigned(); // Reload table data
        onClose(); // Close modal
      } else {
        setError(response.message || "Không thể phân công nhân viên");
      }
    } catch (err: any) {
      console.error("Error assigning staff:", err);
      const errorMessage = err.response?.data?.message || err.message || "Đã xảy ra lỗi khi phân công nhân viên";
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
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <UserCheck size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Phân công nhân viên
                </h2>
                <p className="text-sm text-white/80 mt-1">
                  Lead: {lead.contactName || "N/A"} (ID: {lead.id})
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
          {/* Current Staff Info */}
          {lead.ownerStaffName && (
            <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Nhân viên hiện tại:
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center justify-center text-white text-sm font-semibold">
                  {lead.ownerStaffName.split(" ").pop()?.[0] || "N"}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {lead.ownerStaffName}
                  </p>
                  <p className="text-xs text-gray-500">Management Staff</p>
                </div>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Tìm kiếm nhân viên theo tên hoặc email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-pink-200 rounded-xl focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none"
              disabled={isLoading || isSubmitting}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Staff List */}
          <div className="border border-pink-200 rounded-xl overflow-hidden">
            <div className="bg-gradient-to-r from-pink-500/10 to-rose-500/10 px-4 py-3 border-b border-pink-200">
              <h3 className="text-sm font-semibold text-gray-700">
                Chọn nhân viên phụ trách
              </h3>
            </div>

            <div className="max-h-[300px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 size={32} className="text-pink-500 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Đang tải danh sách nhân viên...</p>
                  </div>
                </div>
              ) : filteredStaff.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
                    <UserCheck size={20} className="text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">
                    Không tìm thấy nhân viên
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {searchQuery
                      ? "Thử tìm kiếm với từ khóa khác"
                      : "Không có nhân viên nào khả dụng"}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-pink-100">
                  {filteredStaff.map((staff) => (
                    <label
                      key={staff.id}
                      className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-pink-50/50 transition-colors ${
                        selectedStaffId === staff.id ? "bg-pink-50" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="staff"
                        value={staff.id}
                        checked={selectedStaffId === staff.id}
                        onChange={(e) => setSelectedStaffId(e.target.value)}
                        className="h-4 w-4 text-pink-600 focus:ring-pink-200 cursor-pointer"
                        disabled={isSubmitting}
                      />
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-pink-400 to-rose-400 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                        {staff.name
                          .split(" ")
                          .map((word) => word[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {staff.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {staff.email}
                        </p>
                      </div>
                      {selectedStaffId === staff.id && (
                        <div className="flex-shrink-0">
                          <div className="h-6 w-6 rounded-full bg-pink-500 flex items-center justify-center">
                            <UserCheck size={14} className="text-white" />
                          </div>
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>
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
              onClick={handleAssign}
              disabled={!selectedStaffId || isSubmitting}
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
                  Phân công
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
