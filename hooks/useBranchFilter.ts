"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "kidzgo_selected_branch_id";
const ALL_BRANCHES_VALUE = "all";

/**
 * Custom hook to manage branch filter state
 * Syncs with localStorage and provides utilities for getting selected branch ID
 */
export function useBranchFilter() {
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const storedValue = localStorage.getItem(STORAGE_KEY);
    
    if (storedValue && storedValue !== ALL_BRANCHES_VALUE) {
      setSelectedBranchId(storedValue);
    } else {
      setSelectedBranchId(null);
    }
    
    setIsLoaded(true);
  }, []);

  // Update localStorage when selection changes
  const updateBranchId = useCallback((branchId: string | null) => {
    setSelectedBranchId(branchId);
    
    if (branchId) {
      localStorage.setItem(STORAGE_KEY, branchId);
    } else {
      localStorage.setItem(STORAGE_KEY, ALL_BRANCHES_VALUE);
    }
  }, []);

  // Clear selection (set to all branches)
  const clearSelection = useCallback(() => {
    updateBranchId(null);
  }, [updateBranchId]);

  // Get query param for API calls
  const getBranchQueryParam = useCallback(() => {
    return selectedBranchId || undefined;
  }, [selectedBranchId]);

  // Check if filtering by specific branch
  const isFilteringByBranch = selectedBranchId !== null;

  return {
    selectedBranchId,
    isLoaded,
    updateBranchId,
    clearSelection,
    getBranchQueryParam,
    isFilteringByBranch,
  };
}

/**
 * Get the currently selected branch ID from localStorage (for server-side use)
 * Note: This should only be called on the client side
 */
export function getSelectedBranchId(): string | null {
  if (typeof window === "undefined") return null;
  
  const storedValue = localStorage.getItem(STORAGE_KEY);
  
  if (storedValue && storedValue !== ALL_BRANCHES_VALUE) {
    return storedValue;
  }
  
  return null;
}

/**
 * Set the selected branch ID in localStorage
 */
export function setSelectedBranchId(branchId: string | null): void {
  if (typeof window === "undefined") return;
  
  if (branchId) {
    localStorage.setItem(STORAGE_KEY, branchId);
  } else {
    localStorage.setItem(STORAGE_KEY, ALL_BRANCHES_VALUE);
  }
}
