"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Edit2,
  Filter,
  FolderOpen,
  HelpCircle,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  deleteFaqCategory,
  deleteFaqItem,
  getAdminFaqCategories,
  getAdminFaqItems,
} from "@/lib/api/faqService";
import type { FaqCategory, FaqItem } from "@/types/faq";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/lightswind/select";
import { CategoryModal } from "@/components/admin/faqs/CategoryModal";
import { ConfirmDeleteModal } from "@/components/admin/faqs/ConfirmDeleteModal";
import { FaqItemModal } from "@/components/admin/faqs/FaqItemModal";
import { CategoryIcon } from "@/components/admin/faqs/icon-map";
import { CategoryStatusBadge, FaqItemStatusBadge } from "@/components/admin/faqs/StatusBadges";
import { extractApiError } from "@/components/admin/faqs/errors";

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ title, value, icon, color, subtitle }: {
  title: string; value: string; icon: React.ReactNode; color: string; subtitle?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-linear-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className={`absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl ${color}`} />
      <div className="relative flex items-center gap-3">
        <div className={`p-2 rounded-xl bg-linear-to-r ${color} text-white shadow-sm shrink-0`}>{icon}</div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium text-gray-600 truncate">{title}</div>
          <div className="text-xl font-bold text-gray-900 leading-tight">{value}</div>
          {subtitle && <div className="text-[11px] text-gray-500 truncate">{subtitle}</div>}
        </div>
      </div>
    </div>
  );
}


// ─── Main Page ────────────────────────────────────────────────────────────────

type ActiveTab = "categories" | "items";

export default function AdminFaqsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<ActiveTab>("categories");

  // ── Category state ──
  const [categories, setCategories] = useState<FaqCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [includeDeletedCats, setIncludeDeletedCats] = useState(false);
  const [includeInactiveCats, setIncludeInactiveCats] = useState(true);
  const [catSearchTerm, setCatSearchTerm] = useState("");
  const [catModal, setCatModal] = useState<{ open: boolean; mode: "create" | "edit"; item?: FaqCategory | null }>({
    open: false,
    mode: "create",
  });
  const [deleteCatConfirm, setDeleteCatConfirm] = useState<{ open: boolean; item?: FaqCategory }>({ open: false });
  const [deletingCat, setDeletingCat] = useState(false);

  // ── FAQ items state ──
  const [items, setItems] = useState<FaqItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsTotalCount, setItemsTotalCount] = useState(0);
  const [itemPage, setItemPage] = useState(1);
  const [itemPageSize] = useState(10);
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [itemFilterCategory, setItemFilterCategory] = useState<string>("__all__");
  const [itemFilterPublished, setItemFilterPublished] = useState<string>("__all__");
  const [itemIncludeDeleted, setItemIncludeDeleted] = useState(false);
  const [itemModal, setItemModal] = useState<{ open: boolean; mode: "create" | "edit"; item?: FaqItem | null }>({
    open: false,
    mode: "create",
  });
  const [deleteItemConfirm, setDeleteItemConfirm] = useState<{ open: boolean; item?: FaqItem }>({ open: false });
  const [deletingItem, setDeletingItem] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const [isPageLoaded, setIsPageLoaded] = useState(false);

  // ── Fetch categories ──
  const fetchCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      const res = await getAdminFaqCategories({ includeInactive: includeInactiveCats, includeDeleted: includeDeletedCats });
      if (res?.isSuccess) setCategories(res.data?.categories ?? []);
    } catch (err) {
      toast({ title: "Thất bại", description: extractApiError(err), variant: "destructive" });
    } finally {
      setCategoriesLoading(false);
      setIsPageLoaded(true);
    }
  }, [includeDeletedCats, includeInactiveCats, toast]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  // ── Fetch items ──
  const fetchItems = useCallback(async () => {
    try {
      setItemsLoading(true);
      const params: Record<string, any> = { pageNumber: itemPage, pageSize: itemPageSize, includeDeleted: itemIncludeDeleted };
      if (itemSearchTerm) params.searchTerm = itemSearchTerm;
      if (itemFilterCategory !== "__all__") params.categoryId = itemFilterCategory;
      if (itemFilterPublished !== "__all__") params.isPublished = itemFilterPublished === "true";
      const res = await getAdminFaqItems(params);
      if (res?.isSuccess) {
        const paged = res.data?.faqs;
        setItems(paged?.items ?? []);
        setItemsTotalCount(paged?.totalCount ?? 0);
      }
    } catch (err) {
      toast({ title: "Thất bại", description: extractApiError(err), variant: "destructive" });
    } finally {
      setItemsLoading(false);
    }
  }, [itemPage, itemPageSize, itemSearchTerm, itemFilterCategory, itemFilterPublished, itemIncludeDeleted, toast]);

  useEffect(() => { if (activeTab === "items") fetchItems(); }, [activeTab, fetchItems]);
  useEffect(() => { setItemPage(1); }, [itemSearchTerm, itemFilterCategory, itemFilterPublished, itemIncludeDeleted]);

  // ── Derived stats ──
  const totalCategories = categories.length;
  const activeCategories = categories.filter(c => c.isActive && !c.isDeleted).length;
  const totalFaqs = categories.reduce((s, c) => s + (c.totalFaqCount ?? 0), 0);
  const publishedFaqs = categories.reduce((s, c) => s + (c.publishedFaqCount ?? 0), 0);

  const filteredCategories = useMemo(() => {
    if (!catSearchTerm.trim()) return categories;
    const q = catSearchTerm.toLowerCase();
    return categories.filter(c => c.name.toLowerCase().includes(q));
  }, [categories, catSearchTerm]);

  // ── Delete handlers ──
  const handleDeleteCategory = async () => {
    if (!deleteCatConfirm.item) return;
    try {
      setDeletingCat(true);
      await deleteFaqCategory(deleteCatConfirm.item.id);
      toast({ title: "Thành công", description: "Đã xóa danh mục FAQ.", variant: "success" });
      setDeleteCatConfirm({ open: false });
      fetchCategories();
    } catch (err) {
      toast({ title: "Thất bại", description: extractApiError(err), variant: "destructive" });
    } finally {
      setDeletingCat(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteItemConfirm.item) return;
    try {
      setDeletingItem(true);
      await deleteFaqItem(deleteItemConfirm.item.id);
      toast({ title: "Thành công", description: "Đã xóa câu hỏi FAQ.", variant: "success" });
      setDeleteItemConfirm({ open: false });
      // Refresh both: count on category card updates immediately
      fetchItems();
      fetchCategories();
    } catch (err) {
      toast({ title: "Thất bại", description: extractApiError(err), variant: "destructive" });
    } finally {
      setDeletingItem(false);
    }
  };

  // When item is saved (created/edited), refresh both lists
  const handleItemSaved = () => {
    fetchItems();
    fetchCategories();
  };

  const itemTotalPages = Math.ceil(itemsTotalCount / itemPageSize);

  return (
    <div className="min-h-screen bg-linear-to-b from-red-50/30 to-white p-6 space-y-6">

      {/* ── Page Header ── */}
      <div className={`flex flex-wrap items-center justify-between gap-4 transition-all duration-700 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-linear-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
            <HelpCircle size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Quản lý FAQ</h1>
            <p className="text-sm text-gray-600 mt-1">Quản lý câu hỏi thường gặp và danh mục</p>
          </div>
        </div>
        <button
          onClick={() => { fetchCategories(); if (activeTab === "items") fetchItems(); }}
          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-red-50 transition-colors cursor-pointer"
        >
          <RefreshCw size={16} /> Làm mới
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 transition-all duration-700 delay-100 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <StatCard
          title="Tổng danh mục"
          value={categoriesLoading ? "—" : String(totalCategories)}
          icon={<FolderOpen size={18} />}
          color="from-red-500 to-red-700"
        />
        <StatCard
          title="Đang hoạt động"
          value={categoriesLoading ? "—" : String(activeCategories)}
          icon={<CheckCircle size={18} />}
          color="from-green-500 to-emerald-600"
          subtitle={`${totalCategories - activeCategories} không hoạt động`}
        />
        <StatCard
          title="Tổng câu hỏi"
          value={categoriesLoading ? "—" : String(totalFaqs)}
          icon={<HelpCircle size={18} />}
          color="from-blue-500 to-blue-700"
        />
        <StatCard
          title="Đã xuất bản"
          value={categoriesLoading ? "—" : String(publishedFaqs)}
          icon={<CheckCircle size={18} />}
          color="from-purple-500 to-purple-700"
          subtitle={totalFaqs > 0 ? `${Math.round((publishedFaqs / totalFaqs) * 100)}% đã công khai` : undefined}
        />
      </div>

      {/* ── Tabs ── */}
      <div className={`flex gap-2 transition-all duration-700 delay-150 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <button
          onClick={() => setActiveTab("categories")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
            activeTab === "categories"
              ? "bg-linear-to-r from-red-600 to-red-700 text-white shadow-md"
              : "border border-red-200 bg-white text-gray-700 hover:bg-red-50"
          }`}
        >
          <FolderOpen size={16} />
          Danh mục
          <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === "categories" ? "bg-white/20" : "bg-red-100 text-red-700"}`}>
            {categories.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("items")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
            activeTab === "items"
              ? "bg-linear-to-r from-red-600 to-red-700 text-white shadow-md"
              : "border border-red-200 bg-white text-gray-700 hover:bg-red-50"
          }`}
        >
          <HelpCircle size={16} />
          Câu hỏi FAQ
          {itemsTotalCount > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === "items" ? "bg-white/20" : "bg-red-100 text-red-700"}`}>
              {itemsTotalCount}
            </span>
          )}
        </button>
      </div>

      {/* ═══════════════════ CATEGORIES TAB ════════════════════ */}
      {activeTab === "categories" && (
        <div className={`space-y-4 transition-all duration-700 delay-200 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>

          {/* Toolbar */}
          <div className="rounded-2xl border border-red-200 bg-linear-to-br from-white to-red-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Tìm kiếm danh mục..."
                    value={catSearchTerm}
                    onChange={e => setCatSearchTerm(e.target.value)}
                    className="h-10 rounded-xl border border-red-200 bg-white pl-9 pr-4 text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-200 transition-colors"
                  />
                </div>
                {/* Filters */}
                <div className="flex items-center gap-3">
                  <Filter size={16} className="text-gray-500" />
                  <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={includeInactiveCats} onChange={e => setIncludeInactiveCats(e.target.checked)} className="h-4 w-4 rounded border-gray-300 cursor-pointer" />
                    Không hoạt động
                  </label>
                  <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={includeDeletedCats} onChange={e => setIncludeDeletedCats(e.target.checked)} className="h-4 w-4 rounded border-gray-300 cursor-pointer" />
                    Đã xóa
                  </label>
                </div>
              </div>
              <button
                onClick={() => setCatModal({ open: true, mode: "create" })}
                className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-semibold text-white hover:shadow-md transition-all cursor-pointer"
              >
                <Plus size={16} /> Thêm danh mục
              </button>
            </div>
          </div>

          {/* Category Table */}
          {categoriesLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-red-600" />
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="rounded-2xl border border-red-200 bg-white py-20 text-center">
              <FolderOpen className="mx-auto mb-3 text-gray-300" size={40} />
              <p className="text-gray-500">Chưa có danh mục nào</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-red-200 bg-linear-to-br from-white to-red-50/30 shadow-sm overflow-hidden">
              {/* Table Header */}
              <div className="bg-linear-to-r from-red-500/10 to-red-700/10 border-b border-red-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-900">Danh sách danh mục</h2>
                  <span className="text-sm text-gray-600">{filteredCategories.length} danh mục</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-linear-to-r from-red-500/5 to-red-700/5 border-b border-red-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Danh mục</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Thứ tự</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">FAQ (Xuất bản / Tổng)</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Trạng thái</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-100">
                    {filteredCategories.map(cat => (
                      <tr key={cat.id} className={`hover:bg-red-50/30 transition-colors ${cat.isDeleted ? "opacity-50" : ""}`}>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-red-50 text-red-500">
                              <CategoryIcon name={cat.icon} size={16} />
                            </div>
                            <span className="font-medium text-gray-900 text-sm">{cat.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{cat.sortOrder}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="font-semibold text-green-700">{cat.publishedFaqCount ?? 0}</span>
                          <span className="text-gray-400"> / {cat.totalFaqCount ?? 0}</span>
                        </td>
                        <td className="px-4 py-3">
                          <CategoryStatusBadge category={cat} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {!cat.isDeleted && (
                              <>
                                <button
                                  onClick={() => setCatModal({ open: true, mode: "edit", item: cat })}
                                  className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
                                  title="Chỉnh sửa"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => setDeleteCatConfirm({ open: true, item: cat })}
                                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                                  title="Xóa"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════ ITEMS TAB ════════════════════ */}
      {activeTab === "items" && (
        <div className={`space-y-4 transition-all duration-700 delay-200 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>

          {/* Toolbar */}
          <div className="rounded-2xl border border-red-200 bg-linear-to-br from-white to-red-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Tìm kiếm câu hỏi..."
                    value={itemSearchTerm}
                    onChange={e => setItemSearchTerm(e.target.value)}
                    className="h-10 w-64 rounded-xl border border-red-200 bg-white pl-9 pr-4 text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-200 transition-colors"
                  />
                </div>

                {/* Category filter */}
                <Select value={itemFilterCategory} onValueChange={setItemFilterCategory}>
                  <SelectTrigger className="h-10 w-48 rounded-xl border border-red-200 bg-white px-3 text-sm text-gray-700 hover:border-red-300 focus:ring-2 focus:ring-red-200 data-[state=open]:border-red-400 data-[state=open]:ring-2 data-[state=open]:ring-red-200">
                    <SelectValue placeholder="Tất cả danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Tất cả danh mục</SelectItem>
                    {categories.filter(c => !c.isDeleted).map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="flex items-center gap-2">
                          {c.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Published filter */}
                <Select value={itemFilterPublished} onValueChange={setItemFilterPublished}>
                  <SelectTrigger className="h-10 w-44 rounded-xl border border-red-200 bg-white px-3 text-sm text-gray-700 hover:border-red-300 focus:ring-2 focus:ring-red-200 data-[state=open]:border-red-400 data-[state=open]:ring-2 data-[state=open]:ring-red-200">
                    <SelectValue placeholder="Tất cả trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Tất cả trạng thái</SelectItem>
                    <SelectItem value="true">Đã xuất bản</SelectItem>
                    <SelectItem value="false">Nháp</SelectItem>
                  </SelectContent>
                </Select>

                <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={itemIncludeDeleted} onChange={e => setItemIncludeDeleted(e.target.checked)} className="h-4 w-4 rounded border-gray-300 cursor-pointer" />
                  Đã xóa
                </label>
              </div>
              <button
                onClick={() => setItemModal({ open: true, mode: "create" })}
                className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-semibold text-white hover:shadow-md transition-all cursor-pointer"
              >
                <Plus size={16} /> Thêm câu hỏi
              </button>
            </div>
          </div>

          {/* Items Table */}
          {itemsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-red-600" />
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-red-200 bg-white py-20 text-center">
              <HelpCircle className="mx-auto mb-3 text-gray-300" size={40} />
              <p className="text-gray-500">Chưa có câu hỏi FAQ nào</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-red-200 bg-linear-to-br from-white to-red-50/30 shadow-sm overflow-hidden">
              {/* Table Header */}
              <div className="bg-linear-to-r from-red-500/10 to-red-700/10 border-b border-red-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-900">Danh sách câu hỏi</h2>
                  <span className="text-sm text-gray-600">{itemsTotalCount} câu hỏi</span>
                </div>
              </div>
              <div className="space-y-0 divide-y divide-red-100">
                {items.map(item => (
                  <div
                    key={item.id}
                    className={`transition-colors hover:bg-red-50/30 ${item.isDeleted ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-4 px-6 py-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <FaqItemStatusBadge item={item} />
                          {item.categoryName && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-linear-to-r from-blue-50 to-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                              <CategoryIcon name={item.categoryIcon} size={10} className="text-blue-500" />
                              {item.categoryName}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">#{item.sortOrder}</span>
                        </div>
                        <p className="font-medium text-gray-900 text-sm leading-snug">{item.question}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 mt-1">
                        <button
                          onClick={() => setExpandedItems(prev => {
                            const next = new Set(prev);
                            if (next.has(item.id)) next.delete(item.id); else next.add(item.id);
                            return next;
                          })}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                          title="Xem câu trả lời"
                        >
                          {expandedItems.has(item.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        {!item.isDeleted && (
                          <>
                            <button
                              onClick={() => setItemModal({ open: true, mode: "edit", item })}
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
                              title="Chỉnh sửa"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteItemConfirm({ open: true, item })}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                              title="Xóa"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {expandedItems.has(item.id) && (
                      <div className="border-t border-red-100 bg-red-50/30 px-6 py-4">
                        <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{item.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {itemTotalPages > 1 && (
                <div className="flex items-center justify-between border-t border-red-100 px-6 py-4">
                  <p className="text-sm text-gray-600">
                    Trang <span className="font-semibold">{itemPage}</span> / {itemTotalPages}
                    <span className="text-gray-400 ml-2">({itemsTotalCount} câu hỏi)</span>
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setItemPage(p => Math.max(1, p - 1))}
                      disabled={itemPage === 1}
                      className="rounded-xl border border-red-200 px-3 py-1.5 text-sm hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      Trước
                    </button>
                    <button
                      onClick={() => setItemPage(p => Math.min(itemTotalPages, p + 1))}
                      disabled={itemPage === itemTotalPages}
                      className="rounded-xl border border-red-200 px-3 py-1.5 text-sm hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── Modals ─── */}
      {catModal.open && (
        <CategoryModal
          mode={catModal.mode}
          initial={catModal.item}
          onClose={() => setCatModal({ open: false, mode: "create" })}
          onSaved={fetchCategories}
        />
      )}
      {itemModal.open && (
        <FaqItemModal
          mode={itemModal.mode}
          initial={itemModal.item}
          categories={categories}
          onClose={() => setItemModal({ open: false, mode: "create" })}
          onSaved={handleItemSaved}
        />
      )}
      {deleteCatConfirm.open && (
        <ConfirmDeleteModal
          message={`Bạn có chắc chắn muốn xóa danh mục "${deleteCatConfirm.item?.name}"? Thao tác này sẽ thất bại nếu danh mục vẫn còn câu hỏi.`}
          onConfirm={handleDeleteCategory}
          onClose={() => setDeleteCatConfirm({ open: false })}
          loading={deletingCat}
        />
      )}
      {deleteItemConfirm.open && (
        <ConfirmDeleteModal
          message="Bạn có chắc chắn muốn xóa câu hỏi này?"
          onConfirm={handleDeleteItem}
          onClose={() => setDeleteItemConfirm({ open: false })}
          loading={deletingItem}
        />
      )}
    </div>
  );
}

