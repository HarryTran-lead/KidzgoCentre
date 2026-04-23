import { CheckCircle } from "lucide-react";
import type { FaqCategory, FaqItem } from "@/types/faq";

export function CategoryStatusBadge({ category }: { category: FaqCategory }) {
  if (category.isDeleted) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-gray-100 to-gray-200 px-2.5 py-1 text-xs font-medium text-gray-500 line-through">
        Đã xóa
      </span>
    );
  }

  if (!category.isActive) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-amber-50 to-orange-100 px-2.5 py-1 text-xs font-medium text-amber-700">
        Không hoạt động
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-green-50 to-emerald-100 px-2.5 py-1 text-xs font-medium text-green-700">
      <CheckCircle size={10} /> Hoạt động
    </span>
  );
}

export function FaqItemStatusBadge({ item }: { item: FaqItem }) {
  if (item.isDeleted) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-gray-100 to-gray-200 px-2.5 py-1 text-xs font-medium text-gray-500">
        Đã xóa
      </span>
    );
  }

  if (item.isPublished) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-green-50 to-emerald-100 px-2.5 py-1 text-xs font-medium text-green-700">
        <CheckCircle size={10} /> Đã xuất bản
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-amber-50 to-orange-100 px-2.5 py-1 text-xs font-medium text-amber-700">
      Nháp
    </span>
  );
}
