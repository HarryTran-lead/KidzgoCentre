"use client";

import { useEffect } from "react";
import { AlertCircle, Building2 } from "lucide-react";
import { useBranchFilter } from "@/hooks/useBranchFilter";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/lightswind/select";

type BranchOption = {
  id: string;
  label: string;
};

type AdminBranchSelectFieldProps = {
  isOpen: boolean;
  mode?: "create" | "edit";
  value: string;
  options: BranchOption[];
  onValueChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  dataField?: string;
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function AdminBranchSelectField({
  isOpen,
  mode = "create",
  value,
  options,
  onValueChange,
  error,
  required = true,
  disabled = false,
  placeholder = "Vui lòng chọn chi nhánh",
  dataField,
}: AdminBranchSelectFieldProps) {
  const { selectedBranchId, isLoaded } = useBranchFilter();

  useEffect(() => {
    if (!isOpen || !isLoaded || mode !== "create") {
      return;
    }

    // Only set default from sidebar when form value is still empty.
    // This avoids overriding manual branch changes by admin.
    if (value || !selectedBranchId) {
      return;
    }

    onValueChange(selectedBranchId);
  }, [isOpen, isLoaded, mode, onValueChange, selectedBranchId, value]);

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <Building2 size={16} className="text-red-600" />
        Chi nhánh {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <Select
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
        >
          <SelectTrigger
            data-field={dataField}
            className={cn(
              "w-full px-4 py-3 rounded-xl border bg-white text-gray-900",
              "focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
              error ? "border-red-500" : "border-gray-200",
              disabled ? "opacity-50 cursor-not-allowed" : ""
            )}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((branch) => (
              <SelectItem key={branch.id} value={branch.id}>
                {branch.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <AlertCircle size={18} className="text-red-500" />
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle size={14} /> {error}
        </p>
      )}
    </div>
  );
}
