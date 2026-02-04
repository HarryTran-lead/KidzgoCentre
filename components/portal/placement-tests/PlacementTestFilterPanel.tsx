"use client";

import { useState } from "react";
import { Filter, X, Calendar } from "lucide-react";
import { Button } from "@/components/lightswind/button";
import { Input } from "@/components/lightswind/input";
import { Label } from "@/components/lightswind/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/lightswind/select";
import type { PlacementTestFilters } from "@/types/placement-test";

interface FilterPanelProps {
  filters: PlacementTestFilters;
  onFiltersChange: (filters: PlacementTestFilters) => void;
  branches?: Array<{ id: string; name: string }>;
  teachers?: Array<{ id: string; name: string }>;
}

export default function PlacementTestFilterPanel({
  filters,
  onFiltersChange,
  branches = [],
  teachers = [],
}: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApply = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const handleReset = () => {
    const resetFilters = {
      status: "",
      branchId: "",
      assignedTeacherId: "",
      fromDate: "",
      toDate: "",
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="flex items-center gap-2"
      >
        <Filter size={16} />
        Bộ lọc nâng cao
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="bg-linear-to-r from-pink-500 to-rose-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Filter size={20} />
            Bộ lọc nâng cao
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Status */}
          <div className="space-y-2">
            <Label>Trạng thái</Label>
            <Select
              value={localFilters.status}
              onValueChange={(value) => setLocalFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tất cả</SelectItem>
                <SelectItem value="Scheduled">Đã lên lịch</SelectItem>
                <SelectItem value="Completed">Đã hoàn thành</SelectItem>
                <SelectItem value="Cancelled">Đã hủy</SelectItem>
                <SelectItem value="NoShow">Không đến</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Branch */}
          <div className="space-y-2">
            <Label>Chi nhánh</Label>
            <Select
              value={localFilters.branchId}
              onValueChange={(value) => setLocalFilters(prev => ({ ...prev, branchId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tất cả chi nhánh" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tất cả</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Teacher */}
          <div className="space-y-2">
            <Label>Giáo viên</Label>
            <Select
              value={localFilters.assignedTeacherId}
              onValueChange={(value) => setLocalFilters(prev => ({ ...prev, assignedTeacherId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tất cả giáo viên" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tất cả</SelectItem>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar size={14} />
                Từ ngày
              </Label>
              <Input
                type="date"
                value={localFilters.fromDate}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, fromDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar size={14} />
                Đến ngày
              </Label>
              <Input
                type="date"
                value={localFilters.toDate}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, toDate: e.target.value }))}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex-1"
            >
              Đặt lại
            </Button>
            <Button
              onClick={handleApply}
              className="flex-1 bg-linear-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700"
            >
              Áp dụng
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
