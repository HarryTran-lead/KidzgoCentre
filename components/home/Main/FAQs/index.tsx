"use client";

import React, { useState, Fragment, useEffect, useCallback } from "react";
import {
  ChevronDown,
  Search,
  Check,
  Loader2,
  HelpCircle,
  CreditCard,
  CalendarClock,
  ClipboardCheck,
  Smartphone,
  BookOpen,
  UserPlus,
  ShieldCheck,
  Wrench,
  GraduationCap,
  MessageCircle,
  Bell,
  Users,
  Award,
  FileText,
  Building2,
} from "lucide-react";
import Image from "next/image";
import { Listbox, Transition } from "@headlessui/react";
import { categories as staticCategories } from "./data";
import { DEFAULT_LOCALE, pickLocaleFromPath } from "@/lib/i18n";
import Pagination from "@/components/ui/Pagination";
import { getMessagesFromPath } from "@/lib/dict";
import { usePathname } from "next/navigation";
import { getPublicFaqCategories, getPublicFaqItems } from "@/lib/api/faqService";
import type { FaqCategory, FaqItem } from "@/types/faq";

const PAGE_SIZE = 8;

// ── Icon map: string name → component ────────────────────────────────────────
const ICON_MAP = {
  HelpCircle, CreditCard, CalendarClock, ClipboardCheck, Smartphone,
  BookOpen, UserPlus, ShieldCheck, Wrench, GraduationCap,
  MessageCircle, Bell, Users, Award, FileText, Building2,
} as Record<string, React.ComponentType<{ className?: string; size?: number }>>;

function resolveIcon(iconName?: string | null) {
  if (!iconName) return <HelpCircle className="w-5 h-5 text-sky-500" />;
  const Comp = ICON_MAP[iconName];
  return Comp ? <Comp className="w-5 h-5 text-sky-500" /> : <HelpCircle className="w-5 h-5 text-sky-500" />;
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border-l-4 border-transparent p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 rounded-xl bg-gray-100 shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-100 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}

const KidzGoFAQ: React.FC = () => {
  const pathname = usePathname() || "/";
  const locale = pickLocaleFromPath(pathname) ?? DEFAULT_LOCALE;
  const msg = getMessagesFromPath(pathname).faqs;

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  // API state
  const [apiCategories, setApiCategories] = useState<FaqCategory[]>([]);
  const [faqItems, setFaqItems] = useState<FaqItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [catLoading, setCatLoading] = useState(true);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Reset page on filter/search change
  useEffect(() => { setCurrentPage(1); }, [debouncedSearch, selectedCategoryId]);

  // Fetch categories once
  useEffect(() => {
    setCatLoading(true);
    getPublicFaqCategories()
      .then(res => { if (res?.isSuccess) setApiCategories(res.data?.categories ?? []); })
      .catch(() => {})
      .finally(() => setCatLoading(false));
  }, []);

  // Fetch FAQ items when filters/page change
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = { pageNumber: currentPage, pageSize: PAGE_SIZE };
      if (selectedCategoryId !== "all") params.categoryId = selectedCategoryId;
      if (debouncedSearch) params.searchTerm = debouncedSearch;
      const res = await getPublicFaqItems(params);
      if (res?.isSuccess) {
        const paged = res.data?.faqs;
        setFaqItems(paged?.items ?? []);
        setTotalCount(paged?.totalCount ?? 0);
      } else {
        setFaqItems([]);
        setTotalCount(0);
      }
    } catch {
      setFaqItems([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedCategoryId, debouncedSearch]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const toggleExpanded = (id: string): void => {
    const next = new Set(expandedItems);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedItems(next);
  };

  const formatUpdatedAt = (updatedAt?: string | null) => {
    const date = updatedAt ? new Date(updatedAt) : null;
    if (!date || Number.isNaN(date.getTime())) return msg.labels.recent;
    const loc = pathname.startsWith("/en") ? "en-US" : "vi-VN";
    return date.toLocaleDateString(loc, { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Build dropdown options: "all" + API categories
  type DropdownOption = { id: string; name: string; icon: React.ReactNode };
  const dropdownOptions: DropdownOption[] = [
    { id: "all", name: (msg.categories as any)["all"] ?? "Tất cả chủ đề", icon: <HelpCircle className="w-4 h-4 text-sky-500" /> },
    ...apiCategories.map(c => ({
      id: c.id,
      name: c.name,
      icon: resolveIcon(c.icon),
    })),
  ];

  const selectedOption = dropdownOptions.find(o => o.id === selectedCategoryId) ?? dropdownOptions[0];

  return (
    <div className="min-h-screen bg-sky-50 mt-30">
      <div className="relative z-20 w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 -mt-40 bg-sky-50 rounded-t-4xl shadow-2xl">

        {/* Search & Filter */}
        <div className="mb-8 sm:mb-10 flex flex-col gap-3 sm:gap-4 md:flex-row md:justify-center items-center">
          <div className="relative w-full md:max-w-xl">
            <Search className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder={msg.labels.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-2.5 rounded-lg border border-gray-200 bg-white text-sm sm:text-base hover:border-sky-500/50 focus:border-sky-400 outline-none transition-all duration-300 shadow-sm"
            />
          </div>

          {/* Category Dropdown */}
          <div className="relative w-full sm:w-1/2 md:w-1/3">
            {catLoading ? (
              <div className="w-full flex items-center px-4 py-2.5 bg-white rounded-lg border border-gray-200 gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                <span className="text-sm text-gray-400">Đang tải...</span>
              </div>
            ) : (
              <Listbox
                value={selectedCategoryId}
                onChange={(val: string) => setSelectedCategoryId(val)}
              >
                <div className="relative">
                  <Listbox.Button className="w-full flex items-center justify-between px-4 sm:px-5 py-2.5 bg-white rounded-lg shadow-sm hover:border-sky-500/50 border border-gray-200 transition text-sm sm:text-base">
                    <span className="flex items-center gap-2">
                      {selectedOption.icon}
                      {selectedOption.name}
                    </span>
                    <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                  </Listbox.Button>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-200"
                    enterFrom="opacity-0 scale-95 -translate-y-1"
                    enterTo="opacity-100 scale-100 translate-y-0"
                    leave="transition ease-in duration-150"
                    leaveFrom="opacity-100 scale-100 translate-y-0"
                    leaveTo="opacity-0 scale-95 -translate-y-1"
                  >
                    <Listbox.Options className="custom-scrollbar absolute mt-2 w-full max-h-60 overflow-auto bg-white shadow-xl rounded-xl border border-gray-200 z-40">
                      {dropdownOptions.map((opt) => (
                        <Listbox.Option
                          key={opt.id}
                          value={opt.id}
                          className={({ active, selected }) => {
                            const color = selected ? "bg-blue-50 text-blue-700" : active ? "bg-gray-100 text-gray-800" : "text-gray-700";
                            return `px-4 sm:px-5 py-2.5 cursor-pointer flex items-center justify-between text-sm sm:text-base ${color}`;
                          }}
                        >
                          {({ selected }) => (
                            <>
                              <div className="flex items-center gap-2">
                                {opt.icon}
                                {opt.name}
                              </div>
                              {selected && <Check className="w-4 h-4 text-green-500" />}
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </Listbox>
            )}
          </div>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4 sm:space-y-5 max-w-4xl mx-auto">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          ) : faqItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 sm:w-12 sm:h-12 text-sky-300" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">{msg.labels.noResultsTitle}</h3>
              <p className="text-sm sm:text-base text-gray-500">{msg.labels.noResultsSubtitle}</p>
            </div>
          ) : (
            faqItems.map((faq, index) => {
              const isExpanded = expandedItems.has(faq.id);
              const startIndex = (currentPage - 1) * PAGE_SIZE;
              return (
                <div key={faq.id} className="relative">
                  <div className="absolute -top-2 -left-2 z-10 w-7 h-7 sm:w-8 sm:h-8 bg-linear-to-br from-sky-400 via-sky-500 to-sky-600 text-white text-xs sm:text-sm font-bold rounded-full flex items-center justify-center shadow-md">
                    {String(startIndex + index + 1).padStart(2, "0")}
                  </div>
                  <div className={`bg-white rounded-2xl shadow-sm sm:shadow-md hover:shadow-md sm:hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border-l-4 ${isExpanded ? "border-sky-500 ring-1 ring-sky-100" : "border-transparent hover:border-sky-500/50"} relative overflow-hidden`}>
                    <button
                      onClick={() => toggleExpanded(faq.id)}
                      className={`relative w-full text-left flex items-start justify-between group transition-all duration-300 ${isExpanded ? "px-4 pt-4 sm:px-5 sm:pt-5 md:px-6 md:pt-6" : "px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6"}`}
                    >
                      <div className="flex items-start gap-3 sm:gap-4 flex-1">
                        <div className={`shrink-0 mt-0.5 sm:mt-1 p-1.5 sm:p-2 rounded-xl transition-all duration-300 ${isExpanded ? "bg-blue-50 scale-110" : "bg-gray-50 group-hover:bg-slate-100"}`}>
                          {resolveIcon(faq.categoryIcon)}
                        </div>
                        <div className="flex-1">
                          <h3 className={`font-semibold transition-colors duration-300 text-[15px] sm:text-[17px] ${isExpanded ? "text-gray-900" : "text-gray-700 group-hover:text-gray-900"}`}>
                            {faq.question}
                          </h3>
                          {!isExpanded && (
                            <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-1">
                              {faq.answer.substring(0, 120)}...
                            </p>
                          )}
                        </div>
                      </div>
                      <div className={`shrink-0 ml-3 sm:ml-4 p-1.5 sm:p-2 rounded-full transition-all duration-300 ${isExpanded ? "bg-sky-50 rotate-180" : "group-hover:bg-gray-100"}`}>
                        <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-300 ${isExpanded ? "text-sky-700" : "text-gray-400 group-hover:text-sky-500"}`} />
                      </div>
                    </button>

                    <div className={`transition-all duration-500 ease-in-out ${isExpanded ? "max-h-96 opacity-100 overflow-visible" : "max-h-0 opacity-0 overflow-hidden"}`}>
                      <div className="px-4 sm:px-6 pb-4 sm:pb-6 relative">
                        <div className="ml-10 sm:ml-14 pt-2 sm:pt-0">
                          <div className="h-px bg-linear-to-r from-sky-200 via-sky-100 to-transparent mb-3 sm:mb-4" />
                          <div className="p-3 sm:p-4 rounded-xl border-l-2 border-sky-200">
                            <p className="text-sm sm:text-base text-gray-800 leading-relaxed whitespace-pre-line">{faq.answer}</p>
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-5 text-xs sm:text-sm sm:items-center">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                              <span className="text-sky-700">{msg.meta.centerHint}</span>
                              <span className="hidden sm:inline text-gray-500 ml-auto">{msg.labels.updatedAtPrefix} {formatUpdatedAt(faq.updatedAt)}</span>
                              <span className="sm:hidden w-full text-gray-500">{msg.labels.updatedAtPrefix} {formatUpdatedAt(faq.updatedAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={PAGE_SIZE}
              totalItems={totalCount}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}
      </div>

      {/* Bottom Decoration SVG */}
      <div className="z-20 relative w-full overflow-hidden bg-sky-50" style={{ marginTop: 0, lineHeight: 0 }}>
        <Image
          src="/image/hero-deluxe-end.svg"
          alt=""
          width={1512}
          height={317}
          className="w-full h-auto"
          style={{ display: 'block', verticalAlign: 'bottom' }}
        />
      </div>
    </div>
  );
};

export default KidzGoFAQ;
