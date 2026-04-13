"use client";

import { useState, useEffect } from "react";
import { X, User, Mail, Phone, MessageSquare, Building, Tag, AlertCircle } from "lucide-react";
import { createLead, updateLead } from "@/lib/api/leadService";
import { getAllBranchesPublic } from "@/lib/api/branchService";
import { getAllProgramsForDropdown } from "@/lib/api/programService";
import { getDomainErrorMessage } from "@/lib/api/domainErrorMessage";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/lightswind/select";
import type { Lead } from "@/types/lead";
import type { Branch } from "@/types/branch";
import type { Program } from "@/types/admin/programs";

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
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isProgramsLoading, setIsProgramsLoading] = useState(false);
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
        if (response.isSuccess && response.data?.branches) {
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
    if (!isOpen) return;

    const fetchPrograms = async () => {
      try {
        setIsProgramsLoading(true);
        const response = await getAllProgramsForDropdown(formData.branchPreference || undefined);
        setPrograms(response.filter((program) => program.isActive !== false));
      } catch (error) {
        console.error("Error fetching programs:", error);
        setPrograms([]);
      } finally {
        setIsProgramsLoading(false);
      }
    };

    fetchPrograms();
  }, [isOpen, formData.branchPreference]);

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
        const response = await updateLead(lead.id, formData);
        const isSuccess =
          typeof (response as any)?.success === "boolean"
            ? (response as any).success
            : typeof (response as any)?.isSuccess === "boolean"
              ? (response as any).isSuccess
              : true;

        if (!isSuccess) {
          throw {
            response: {
              status: (response as any)?.status,
              data: response,
            },
            message: (response as any)?.message || "Không thể cập nhật khách tiềm năng",
          };
        }

        toast({
          title: "Thành công",
          description: "Đã cập nhật khách tiềm năng thành công",
          variant: "success"
        });
      } else {
        // Create new lead
        const response = await createLead(formData);
        const isSuccess =
          typeof (response as any)?.success === "boolean"
            ? (response as any).success
            : typeof (response as any)?.isSuccess === "boolean"
              ? (response as any).isSuccess
              : true;

        if (!isSuccess) {
          throw {
            response: {
              status: (response as any)?.status,
              data: response,
            },
            message: (response as any)?.message || "Không thể tạo khách tiềm năng",
          };
        }

        toast({
          title: "Thành công",
          description: "Đã tạo khách tiềm năng mới thành công",
          variant: "success"
        });
      }
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error saving lead:", error);
      toast({
        title: "Lỗi",
        description: getDomainErrorMessage(error, "Không thể lưu thông tin khách tiềm năng"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
        {/* Header - Gradient đỏ như modal mẫu */}
        <div className="bg-linear-to-r from-red-600 to-red-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <User size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {lead ? "Chỉnh sửa khách tiềm năng" : "Tạo khách tiềm năng mới"}
                </h2>
                <p className="text-sm text-red-100">
                  {lead ? "Chỉnh sửa thông tin khách tiềm năng" : "Nhập thông tin chi tiết về khách tiềm năng mới"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Đóng"
            >
              <X size={24} className="text-white" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-100">
                  <User size={16} className="text-red-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Thông tin cơ bản</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all"
                    placeholder="Nguyễn Văn A"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all"
                    placeholder="0987654321"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Mail size={16} className="text-gray-400" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all"
                    placeholder="email@example.com"
                  />
                </div>

                {/* <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    Zalo ID
                  </label>
                  <input
                    type="text"
                    value={formData.zaloId}
                    onChange={(e) => setFormData({ ...formData, zaloId: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all"
                    placeholder="Zalo ID"
                  />
                </div> */}
              </div>
            </div>

            {/* Lead Source Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-100">
                  <Tag size={16} className="text-red-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Nguồn khách tiềm năng</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    Nguồn
                  </label>
                  <input
                    type="text"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all"
                    placeholder="Website, Facebook, Zalo..."
                  />
                </div>

                {/* <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    Chiến dịch
                  </label>
                  <input
                    type="text"
                    value={formData.campaign}
                    onChange={(e) => setFormData({ ...formData, campaign: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all"
                    placeholder="Tên chiến dịch"
                  />
                </div> */}
              </div>
            </div>

            {/* Preferences Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-100">
                  <Building size={16} className="text-red-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Sở thích & Ghi chú</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    Chi nhánh mong muốn
                  </label>
                  <Select
                    value={formData.branchPreference || ""}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        branchPreference: value,
                        programInterest: "",
                      })
                    }
                  >
                    <SelectTrigger className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all">
                      <SelectValue placeholder="Chọn chi nhánh" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Chọn chi nhánh</SelectItem>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
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
                    disabled={isProgramsLoading || programs.length === 0}
                  >
                    <SelectTrigger className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all">
                      <SelectValue
                        placeholder={
                          isProgramsLoading
                            ? "Đang tải chương trình..."
                            : programs.length > 0
                              ? "Tìm và chọn chương trình"
                              : "Không có chương trình"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Không chọn chương trình</SelectItem>
                      {programs.map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          {program.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  Ghi chú
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all resize-none"
                  placeholder="Ghi chú thêm..."
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-linear-to-r from-red-500/5 to-red-700/5 p-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              Hủy bỏ
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
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
                }}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              >
                {lead ? "Khôi phục" : "Đặt lại"}
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-linear-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Đang lưu..." : (lead ? "Cập nhật" : "Tạo mới")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}