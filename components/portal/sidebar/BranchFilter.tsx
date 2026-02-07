"use client";

import { useState, useEffect } from "react";
import { MapPin, ChevronDown, Building2 } from "lucide-react";
import type { Branch } from "@/types/branch";

interface BranchFilterProps {
  branches: Branch[];
  collapsed?: boolean;
  onBranchChange?: (branchId: string | null) => void;
}

const ALL_BRANCHES_VALUE = "all";
const STORAGE_KEY = "kidzgo_selected_branch_id";

export default function BranchFilter({
  branches,
  collapsed = false,
  onBranchChange,
}: BranchFilterProps) {
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const storedBranchId = localStorage.getItem(STORAGE_KEY);
    
    if (storedBranchId && storedBranchId !== ALL_BRANCHES_VALUE) {
      // Verify the stored branch still exists
      const branchExists = branches.some((b) => b.id === storedBranchId);
      if (branchExists) {
        setSelectedBranchId(storedBranchId);
      } else {
        // If stored branch doesn't exist, clear it
        localStorage.removeItem(STORAGE_KEY);
        setSelectedBranchId(null);
      }
    } else if (storedBranchId === ALL_BRANCHES_VALUE) {
      setSelectedBranchId(null);
    }
  }, [branches]);

  // Save to localStorage and notify parent when selection changes
  useEffect(() => {
    if (!mounted) return;
    
    if (selectedBranchId) {
      localStorage.setItem(STORAGE_KEY, selectedBranchId);
      onBranchChange?.(selectedBranchId);
    } else {
      localStorage.setItem(STORAGE_KEY, ALL_BRANCHES_VALUE);
      onBranchChange?.(null);
    }

    // Dispatch custom event for same-tab updates
    window.dispatchEvent(
      new CustomEvent("localStorageChange", {
        detail: { 
          key: STORAGE_KEY, 
          newValue: selectedBranchId || ALL_BRANCHES_VALUE 
        },
      })
    );
  }, [selectedBranchId, mounted, onBranchChange]);

  const selectedBranch = branches.find((b) => b.id === selectedBranchId);
  const displayText = selectedBranch ? selectedBranch.name : "Tất cả chi nhánh";

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  if (collapsed) {
    return null;
  }

  return (
    <div className="px-3 py-3">
      <div className="relative">
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="w-full inline-flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-transparent hover:border-red-300 hover:shadow-sm transition-all duration-300 ease-out group cursor-pointer"
          type="button"
          aria-expanded={isOpen}
          aria-label="Chọn chi nhánh"
        >
          <span className="inline-flex items-center gap-2 min-w-0">
            <MapPin
              size={16}
              className="text-red-600 shrink-0 group-hover:scale-110 transition-all duration-300 ease-out"
              strokeWidth={2.5}
            />
            <span className="truncate font-medium">{displayText}</span>
          </span>
          <ChevronDown
            size={16}
            className={`text-slate-400 group-hover:text-red-600 shrink-0 transition-all duration-500 ease-out ${
              isOpen ? "rotate-180" : "rotate-0"
            }`}
            strokeWidth={2}
          />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10 animate-in fade-in duration-200"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="max-h-64 overflow-y-auto custom-scrollbar">
                {/* Option: All Branches */}
                <button
                  onClick={() => {
                    setSelectedBranchId(null);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-all duration-200 ease-out border-b border-slate-100 ${
                    !selectedBranchId
                      ? "bg-gradient-to-r from-red-50 via-red-50/80 to-transparent text-red-700"
                      : "text-slate-700 hover:bg-gradient-to-r hover:from-slate-50 hover:to-transparent hover:text-slate-900"
                  }`}
                  type="button"
                >
                  <span className="flex items-center gap-2.5">
                    <Building2
                      size={16}
                      className={`shrink-0 ${
                        !selectedBranchId ? "text-red-600" : "text-slate-400"
                      }`}
                    />
                    <span>Tất cả chi nhánh</span>
                    {!selectedBranchId && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-red-600" />
                    )}
                  </span>
                </button>

                {/* Individual Branches */}
                {branches.map((branch, idx) => (
                  <button
                    key={branch.id}
                    onClick={() => {
                      setSelectedBranchId(branch.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-all duration-200 ease-out ${
                      branch.id === selectedBranchId
                        ? "bg-gradient-to-r from-red-50 via-red-50/80 to-transparent text-red-700"
                        : "text-slate-700 hover:bg-gradient-to-r hover:from-slate-50 hover:to-transparent hover:text-slate-900"
                    } ${
                      idx !== branches.length - 1
                        ? "border-b border-slate-100"
                        : ""
                    }`}
                    type="button"
                    disabled={!branch.isActive}
                  >
                    <span className="flex items-center gap-2.5">
                      <MapPin
                        size={16}
                        className={`shrink-0 ${
                          branch.id === selectedBranchId
                            ? "text-red-600"
                            : branch.isActive
                              ? "text-slate-400"
                              : "text-slate-300"
                        }`}
                      />
                      <span
                        className={
                          branch.isActive ? "" : "text-slate-400 italic"
                        }
                      >
                        {branch.name}
                        {!branch.isActive && " (Không hoạt động)"}
                      </span>
                      {branch.id === selectedBranchId && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-red-600" />
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
