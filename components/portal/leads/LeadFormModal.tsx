"use client";

import { useState, useEffect } from "react";
import { X, User, Mail, Phone, MessageSquare, Building, Tag } from "lucide-react";
import { createLead, updateLead } from "@/lib/api/leadService";
import { getAllBranchesPublic } from "@/lib/api/branchService";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@/types/lead";
import type { Branch } from "@/types/branch";

type StatusType = 'New' | 'Contacted' | 'BookedTest' | 'TestDone' | 'Enrolled' | 'Lost';

interface LeadFormModalProps {
  isOpen: boolean;
  lead?: Lead | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LeadFormModal({ isOpen, lead, onClose, onSuccess }: LeadFormModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [formData, setFormData] = useState({
    contactName: "",
    email: "",
    phone: "",
    zaloId: "",
    source: "",
    campaign: "",
    company: "",
    subject: "",
    branchPreference: "",
    programInterest: "",
    notes: "",
  });

  useEffect(() => {
    // Fetch branches using public API (accessible by all roles)
    const fetchBranches = async () => {
      try {
        const response = await getAllBranchesPublic({ isActive: true });
        console.log("Branches API response:", response);
        if (response.isSuccess && response.data?.branches) {
          console.log("Branches loaded:", response.data.branches);
          setBranches(response.data.branches);
        } else {
          console.log("No branches found in response");
        }
      } catch (error) {
        console.error("Error fetching branches:", error);
      }
    };
    
    fetchBranches();
  }, []);

  useEffect(() => {
    if (lead) {
      setFormData({
        contactName: lead.contactName || "",
        email: lead.email || "",
        phone: lead.phone || "",
        zaloId: lead.zaloId || "",
        source: lead.source || "",
        campaign: lead.campaign || "",
        company: lead.company || "",
        subject: lead.subject || "",
        branchPreference: lead.branchPreference || "",
        programInterest: lead.programInterest || "",
        notes: lead.notes || "",
      });
    } else {
      // Reset form for new lead
      setFormData({
        contactName: "",
        email: "",
        phone: "",
        zaloId: "",
        source: "",
        campaign: "",
        company: "",
        subject: "",
        branchPreference: "",
        programInterest: "",
        notes: "",
      });
    }
  }, [lead, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.contactName || !formData.phone) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc (Họ tên, Số điện thoại)",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (lead?.id) {
        // Update existing lead
        await updateLead(lead.id, formData);
        toast({
          title: "Thành công",
          description: "Đã cập nhật lead thành công",
          variant: "success"
        });
      } else {
        // Create new lead
        await createLead(formData);
        toast({
          title: "Thành công",
          description: "Đã tạo lead mới thành công",
          variant: "success"
        });
      }
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error saving lead:", error);
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể lưu thông tin lead",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 p-4">
      <style jsx>{`
        .hide-scrollbar {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }
      `}</style>
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl hide-scrollbar">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {lead ? "Chỉnh sửa Lead" : "Tạo Lead mới"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <User size={16} />
              Thông tin cơ bản
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none"
                  placeholder="Nguyễn Văn A"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none"
                  placeholder="0987654321"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zalo ID
                </label>
                <input
                  type="text"
                  value={formData.zaloId}
                  onChange={(e) => setFormData({ ...formData, zaloId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none"
                  placeholder="Zalo ID"
                />
              </div>
            </div>
          </div>

          {/* Lead Source */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Tag size={16} />
              Nguồn lead
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nguồn
                </label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none"
                  placeholder="Website, Facebook, Zalo..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign
                </label>
                <input
                  type="text"
                  value={formData.campaign}
                  onChange={(e) => setFormData({ ...formData, campaign: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none"
                  placeholder="Tên chiến dịch"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Công ty
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none"
                  placeholder="Tên công ty"
                />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Building size={16} />
              Sở thích & Ghi chú
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chi nhánh mong muốn
                </label>
                <select
                  value={formData.branchPreference}
                  onChange={(e) => setFormData({ ...formData, branchPreference: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none"
                >
                  <option value="">Chọn chi nhánh</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chương trình quan tâm
                </label>
                <input
                  type="text"
                  value={formData.programInterest}
                  onChange={(e) => setFormData({ ...formData, programInterest: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none"
                  placeholder="Chương trình học"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chủ đề
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none"
                placeholder="Chủ đề liên hệ"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ghi chú
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none resize-none"
                placeholder="Ghi chú thêm..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Đang lưu..." : (lead ? "Cập nhật" : "Tạo mới")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
