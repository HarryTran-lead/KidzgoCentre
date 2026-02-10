"use client";

import { useState } from "react";
import { Filter, X, Calendar } from "lucide-react";
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
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Filter size={16} />
        Bộ lọc nâng cao
      </button>
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
            className="p-1 rounded-lg hover:bg-white/10 transition-colors text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Status */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
            <select
              value={localFilters.status}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none"
            >
              <option value="">Tất cả</option>
              <option value="Scheduled">Đã lên lịch</option>
              <option value="Completed">Đã hoàn thành</option>
              <option value="Cancelled">Đã hủy</option>
              <option value="NoShow">Không đến</option>
            </select>
          </div>

          {/* Branch */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Chi nhánh</label>
            <select
              value={localFilters.branchId}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, branchId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none"
            >
              <option value="">Tất cả chi nhánh</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          {/* Teacher */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Giáo viên</label>
            <select
              value={localFilters.assignedTeacherId}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, assignedTeacherId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none"
            >
              <option value="">Tất cả giáo viên</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Calendar size={14} />
                Từ ngày
              </label>
              <input
                type="date"
                value={localFilters.fromDate}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Calendar size={14} />
                Đến ngày
              </label>
              <input
                type="date"
                value={localFilters.toDate}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, toDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Đặt lại
            </button>
            <button
              onClick={handleApply}
              className="flex-1 px-6 py-2 rounded-lg bg-linear-to-r from-pink-500 to-rose-500 text-white font-semibold hover:shadow-lg transition-all"
            >
              Áp dụng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
