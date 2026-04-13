"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface LeadPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  itemLabel?: string;
  showPageSizeSelector?: boolean;
}

export default function LeadPagination({
  currentPage,
  totalPages,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  itemLabel = "khách tiềm năng",
  showPageSizeSelector = false,
}: LeadPaginationProps) {
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalCount);
  const safeStart = totalCount > 0 ? startIndex : 0;
  const safeEnd = totalCount > 0 ? endIndex : 0;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="border-t border-red-200 bg-linear-to-r from-red-500/5 to-red-700/5 px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              Hiển thị <span className="font-semibold text-gray-900">
                {safeStart}-{safeEnd}
              </span> trong tổng số{" "}
              <span className="font-semibold text-gray-900">{totalCount}</span> {itemLabel}
            </div>

            <div className="flex items-center gap-2">
              {showPageSizeSelector && (
                <select
                  value={pageSize}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  className="h-9 rounded-lg border border-red-200 bg-white px-2.5 text-sm text-gray-700 outline-none transition-colors focus:border-red-300 focus:ring-2 focus:ring-red-100"
                >
                  {[5, 10, 20, 50].map((size) => (
                    <option key={size} value={size}>
                      {size} / trang
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                aria-label="Trang trước"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="flex items-center gap-1">
                {getPageNumbers().map((page, idx) => (
                  <button
                    key={idx}
                    onClick={() => typeof page === "number" && onPageChange(page)}
                    disabled={page === "..."}
                    className={`min-w-9 h-9 px-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                      page === currentPage
                        ? "bg-linear-to-r from-red-600 to-red-700 text-white shadow-md"
                        : page === "..."
                        ? "cursor-default text-gray-400"
                        : "border border-red-200 hover:bg-red-50 text-gray-700"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                aria-label="Trang sau"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
  
  );
}
