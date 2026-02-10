"use client";

import { useState, useEffect } from "react";
import { X, Calendar, MapPin, User, FileText } from "lucide-react";
import type { PlacementTest, CreatePlacementTestRequest, UpdatePlacementTestRequest } from "@/types/placement-test";

interface PlacementTestFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  test?: PlacementTest | null;
  onSubmit?: (data: CreatePlacementTestRequest | UpdatePlacementTestRequest) => Promise<void>;
  leads?: Array<{ id: string; contactName: string; children?: Array<{ id: string; name: string }> }>;
  studentProfiles?: Array<{ id: string; fullName: string }>;
  classes?: Array<{ id: string; className: string }>;
  invigilators?: Array<{ id: string; fullName: string; role: string }>; // Admin + ManagementStaff
}

export default function PlacementTestFormModal({
  isOpen,
  onClose,
  onSuccess,
  test,
  onSubmit,
  leads = [],
  studentProfiles = [],
  classes = [],
  invigilators = [],
}: PlacementTestFormModalProps) {
  const [formData, setFormData] = useState({
    leadId: test?.leadId || "",
    leadChildId: test?.leadChildId || "",
    studentProfileId: test?.studentProfileId || "",
    classId: test?.classId || "",
    scheduledAt: test?.scheduledAt ? new Date(test.scheduledAt).toISOString().slice(0, 16) : "",
    room: test?.room || "",
    invigilatorUserId: test?.invigilatorUserId || "",
    notes: test?.notes || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLead, setSelectedLead] = useState(test?.leadId || "");
  const [children, setChildren] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    if (isOpen) {
      
      // Summary
      const dataStatus = {
        leads: leads.length > 0,
        students: studentProfiles.length > 0,
        classes: classes.length > 0,
        invigilators: invigilators.length > 0
      };
      
      if (!dataStatus.leads) {
        console.warn("⚠️ [PLACEMENT MODAL] NO LEADS DATA - Modal opened but no leads available!");
      }
    }
  }, [isOpen, leads, studentProfiles, classes, invigilators]);

  const handleLeadChange = (leadId: string) => {
    setSelectedLead(leadId);
    const lead = leads.find(l => l.id === leadId);
    setChildren(lead?.children || []);
    setFormData(prev => ({ ...prev, leadId, leadChildId: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation for create mode
    if (!test) {
      if (!formData.leadId || !formData.leadChildId) {
        alert("Vui lòng chọn phụ huynh và trẻ");
        return;
      }
      if (!formData.invigilatorUserId) {
        alert("Vui lòng chọn người giám sát");
        return;
      }
    }
    
    if (!formData.scheduledAt) {
      alert("Vui lòng chọn thời gian test");
      return;
    }
    
    setIsSubmitting(true);

    try {
      const submitData = test
        ? {
            scheduledAt: new Date(formData.scheduledAt).toISOString(),
            room: formData.room,
            invigilatorUserId: formData.invigilatorUserId,
            notes: formData.notes,
          }
        : {
            leadId: formData.leadId,
            leadChildId: formData.leadChildId,
            studentProfileId: formData.studentProfileId || "",
            classId: formData.classId || "",
            scheduledAt: new Date(formData.scheduledAt).toISOString(),
            room: formData.room,
            invigilatorUserId: formData.invigilatorUserId,
          };

      if (onSubmit) {
        await onSubmit(submitData);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-9999 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-linear-to-r from-pink-500 to-rose-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {test ? "Chỉnh sửa Placement Test" : "Tạo Placement Test mới"}
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Lead Selection (only for create) */}
          {!test && (
            <>
              <div className="space-y-2">
                <label htmlFor="leadId" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <User size={16} />
                  Lead id
                </label>
                <select
                  id="leadId"
                  value={formData.leadId}
                  onChange={(e) => handleLeadChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none"
                >
                  <option value="">Chọn lead</option>
                  {leads.length === 0 ? (
                    <option disabled>Không có lead nào</option>
                  ) : (
                    leads.map((lead) => (
                      <option key={lead.id} value={lead.id}>
                        {lead.contactName} ({lead.children?.length || 0} bé)
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="leadChildId" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <User size={16} />
                  Tên bé *
                </label>
                <select
                  id="leadChildId"
                  value={formData.leadChildId}
                  onChange={(e) => setFormData(prev => ({ ...prev, leadChildId: e.target.value }))}
                  disabled={!selectedLead || children.length === 0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none disabled:opacity-50 disabled:bg-gray-50"
                >
                  <option value="">
                    {!selectedLead ? "Vui lòng chọn lead trước" : children.length === 0 ? "Lead này chưa có thông tin bé" : "Chọn bé"}
                  </option>
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="studentProfileId" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <User size={16} />
                  Hồ sơ học viên (nếu có)
                </label>
                <select
                  id="studentProfileId"
                  value={formData.studentProfileId}
                  onChange={(e) => setFormData(prev => ({ ...prev, studentProfileId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none"
                >
                  <option value="">Chọn hồ sơ học viên</option>
                  {studentProfiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="classId" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <User size={16} />
                  Lớp học (nếu có)
                </label>
                <select
                  id="classId"
                  value={formData.classId}
                  onChange={(e) => setFormData(prev => ({ ...prev, classId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none"
                >
                  <option value="">Chọn lớp học</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.className}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Scheduled Time */}
          <div className="space-y-2">
            <label htmlFor="scheduledAt" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Calendar size={16} />
              Thời gian test *
            </label>
            <input
              id="scheduledAt"
              type="datetime-local"
              value={formData.scheduledAt}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none"
            />
          </div>

          {/* Room */}
          <div className="space-y-2">
            <label htmlFor="room" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <MapPin size={16} />
              Phòng test
            </label>
            <input
              id="room"
              type="text"
              value={formData.room}
              onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
              placeholder="Nhập phòng test (vd: A101, B205)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none"
            />
          </div>

          {/* Invigilator */}
          <div className="space-y-2">
            <label htmlFor="invigilatorUserId" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <User size={16} />
              Người giám sát *
            </label>
            <select
              id="invigilatorUserId"
              value={formData.invigilatorUserId}
              onChange={(e) => setFormData(prev => ({ ...prev, invigilatorUserId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none"
            >
              <option value="">Chọn người giám sát</option>
              {invigilators.map((invigilator) => (
                <option key={invigilator.id} value={invigilator.id}>
                  {invigilator.fullName} ({invigilator.role === 'Admin' ? 'Quản trị viên' : 'Nhân viên quản lý'})
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-2 rounded-lg bg-linear-to-r from-pink-500 to-rose-500 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Đang xử lý..." : test ? "Cập nhật" : "Tạo mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
