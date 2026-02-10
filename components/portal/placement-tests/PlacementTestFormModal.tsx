"use client";

import { useState } from "react";
import { X, Calendar, MapPin, User, FileText } from "lucide-react";
import { Button } from "@/components/lightswind/button";
import { Input } from "@/components/lightswind/input";
import { Label } from "@/components/lightswind/label";
import { Textarea } from "@/components/lightswind/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/lightswind/select";
import type { PlacementTest, CreatePlacementTestRequest, UpdatePlacementTestRequest } from "@/types/placement-test";

interface PlacementTestFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  test?: PlacementTest | null;
  onSubmit?: (data: CreatePlacementTestRequest | UpdatePlacementTestRequest) => Promise<void>;
  leads?: Array<{ id: string; contactName: string; children?: Array<{ id: string; name: string }> }>;
  branches?: Array<{ id: string; name: string }>;
  teachers?: Array<{ id: string; name: string }>;
}

export default function PlacementTestFormModal({
  isOpen,
  onClose,
  onSuccess,
  test,
  onSubmit,
  leads = [],
  branches = [],
  teachers = [],
}: PlacementTestFormModalProps) {
  const [formData, setFormData] = useState({
    leadId: test?.leadId || "",
    childId: test?.leadChildId || "",
    scheduledAt: test?.scheduledAt ? new Date(test.scheduledAt).toISOString().slice(0, 16) : "",
    testLocation: (test as any)?.testLocation || test?.room || "",
    branchId: (test as any)?.branchId || "",
    assignedTeacherId: test?.invigilatorUserId || "",
    notes: test?.notes || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLead, setSelectedLead] = useState(test?.leadId || "");
  const [children, setChildren] = useState<Array<{ id: string; name: string }>>([]);

  const handleLeadChange = (leadId: string) => {
    setSelectedLead(leadId);
    const lead = leads.find(l => l.id === leadId);
    setChildren(lead?.children || []);
    setFormData(prev => ({ ...prev, leadId, childId: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation for create mode
    if (!test && (!formData.leadId || !formData.childId)) {
      alert("Vui lòng chọn phụ huynh và trẻ");
      return;
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
            testLocation: formData.testLocation,
            branchId: formData.branchId,
            assignedTeacherId: formData.assignedTeacherId,
            notes: formData.notes,
          }
        : {
            leadId: formData.leadId,
            childId: formData.childId,
            scheduledAt: new Date(formData.scheduledAt).toISOString(),
            testLocation: formData.testLocation,
            branchId: formData.branchId,
            assignedTeacherId: formData.assignedTeacherId,
            notes: formData.notes,
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-t-2xl flex justify-between items-center">
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
                <Label htmlFor="leadId" className="flex items-center gap-2">
                  <User size={16} />
                  Phụ huynh *
                </Label>
                <Select
                  value={formData.leadId}
                  onValueChange={handleLeadChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn phụ huynh" />
                  </SelectTrigger>
                  <SelectContent>
                    {leads.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.contactName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="childId" className="flex items-center gap-2">
                  <User size={16} />
                  Trẻ *
                </Label>
                <Select
                  value={formData.childId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, childId: value }))}
                  disabled={!selectedLead || children.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trẻ" />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map((child) => (
                      <SelectItem key={child.id} value={child.id}>
                        {child.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Scheduled Time */}
          <div className="space-y-2">
            <Label htmlFor="scheduledAt" className="flex items-center gap-2">
              <Calendar size={16} />
              Thời gian test *
            </Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={formData.scheduledAt}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
              required
            />
          </div>

          {/* Branch */}
          <div className="space-y-2">
            <Label htmlFor="branchId" className="flex items-center gap-2">
              <MapPin size={16} />
              Chi nhánh
            </Label>
            <Select
              value={formData.branchId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, branchId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn chi nhánh" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Test Location */}
          <div className="space-y-2">
            <Label htmlFor="testLocation" className="flex items-center gap-2">
              <MapPin size={16} />
              Địa điểm test
            </Label>
            <Input
              id="testLocation"
              value={formData.testLocation}
              onChange={(e) => setFormData(prev => ({ ...prev, testLocation: e.target.value }))}
              placeholder="Nhập địa điểm test"
            />
          </div>

          {/* Assigned Teacher */}
          <div className="space-y-2">
            <Label htmlFor="assignedTeacherId" className="flex items-center gap-2">
              <User size={16} />
              Giáo viên phụ trách
            </Label>
            <Select
              value={formData.assignedTeacherId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, assignedTeacherId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn giáo viên" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2">
              <FileText size={16} />
              Ghi chú
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Nhập ghi chú"
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-linear-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700"
            >
              {isSubmitting ? "Đang xử lý..." : test ? "Cập nhật" : "Tạo mới"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
