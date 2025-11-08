// Pagination.tsx
import React, { useState } from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Tooltip } from "@mui/material";
import { usePagination } from "@/hooks/usePagination";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({
  currentPage,
  totalPages,
  pageSize = 6,
  totalItems = 0, 
  onPageChange,
}: PaginationProps) => {
  const visiblePages = usePagination(currentPage, totalPages);
  const [inputPage, setInputPage] = useState<number | "">(currentPage);

  const handlePageChange = (page: number) => {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setInputPage("");
      return;
    }
    const num = parseInt(value);
    if (!isNaN(num)) {
      setInputPage(num);
    }
  };

  const handleGoClick = () => {
    if (typeof inputPage === "number") {
      handlePageChange(inputPage);
    }
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col items-center space-y-4 mt-8 sm:mt-10">
      {/* Main Pagination */}
      <div className="flex items-center justify-center space-x-2 flex-wrap">
        {/* Prev */}
        <Tooltip title="Trang trước" placement="left" arrow>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200/60 transition-all duration-300 ${
              currentPage === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-[#23AEB1] hover:bg-[#5FC5CB] hover:text-white shadow-md hover:shadow-lg transform hover:scale-105"
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </Tooltip>

        {/* Page Numbers */}
        <div className="flex items-center space-x-2 flex-wrap">
          {visiblePages.map((page, index) =>
            page === "..." ? (
              <div
                key={`dots-${index}`}
                className="flex items-center justify-center w-8 h-8 text-gray-400"
              >
                <MoreHorizontal className="w-4.5 h-4.5" />
              </div>
            ) : (
              <button
                key={page}
                onClick={() => handlePageChange(Number(page))}
                className={`flex items-center justify-center w-8 h-8 rounded-lg font-medium text-lg transition-all duration-300 shadow-md transform hover:scale-105 ${
                  page === currentPage
                    ? "bg-[#23AEB1] text-white shadow-lg scale-105 ring-1 ring-[#b2e2e5]"
                    : "bg-white text-[#23AEB1] hover:bg-[#5FC5CB] hover:text-white"
                }`}
              >
                {page}
              </button>
            )
          )}
        </div>

        {/* Next */}
        <Tooltip title="Trang sau" placement="right" arrow>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200/60 transition-all duration-300 ${
              currentPage === totalPages
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-[#23AEB1] hover:bg-[#5FC5CB] hover:text-white shadow-md hover:shadow-lg transform hover:scale-105"
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </Tooltip>
      </div>

      {/* Info */}
      <div className="flex items-center justify-center space-x-2 text-sm">
        <div className="bg-white px-4 py-2 rounded-2xl shadow-md text-gray-700">
          Trang{" "}
          <span className="font-medium text-[#23AEB1]">{currentPage}</span> /{" "}
          {totalPages}
        </div>

        {/* Input + GO */}
        {totalPages > 5 && (
          <div className="bg-white p-1 rounded-lg shadow-md text-gray-700">
            <div className="flex items-center space-x-2">
              <Tooltip title="Nhập số trang muốn tới" arrow>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={inputPage}
                  onChange={handleInputChange}
                  className="w-12 px-2 py-1 border rounded-md text-center text-sm outline-none border-gray-300"
                  placeholder="Page"
                />
              </Tooltip>
              <Tooltip title="Nhấn GO để chuyển tới trang" arrow>
                <button
                  onClick={handleGoClick}
                  className="px-2 py-1 rounded-lg bg-[#23AEB1] text-white text-sm font-medium hover:bg-[#5FC5CB] transition-colors"
                >
                  GO
                </button>
              </Tooltip>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pagination;
