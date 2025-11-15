"use client";

import React, { useState, Fragment } from "react";
import {
  ChevronDown,
  Search,
  MessageCircleQuestion,
  Check,
} from "lucide-react";
import { Listbox, Transition } from "@headlessui/react";
import { categories, faqsByLocale } from "./data";
import { DEFAULT_LOCALE, pickLocaleFromPath } from "@/lib/i18n";
import type { FAQCategoryName } from "./data";
import Pagination from "@/components/ui/Pagination";
import { getMessagesFromPath } from "@/lib/dict";
import { usePathname } from "next/navigation";

const PAGE_SIZE = 8;

const KidzGoFAQ: React.FC = () => {
  const pathname = usePathname() || "/";
  const locale = pickLocaleFromPath(pathname) ?? DEFAULT_LOCALE;
  const faqs = faqsByLocale(locale);
  const msg = getMessagesFromPath(pathname).faqs; // 🔹 i18n cho FAQs

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<FAQCategoryName>("all");
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  const toggleExpanded = (id: number): void => {
    const next = new Set(expandedItems);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedItems(next);
  };

  // 🔹 Lấy tên category theo dict
  const getCategoryName = (category: string): string => {
    return (msg.categories as Record<string, string>)[category] || category;
  };

  const filteredFAQs = faqs.filter((faq) => {
    const keyword = searchTerm.toLowerCase().trim();

    const matchesSearch =
      !keyword ||
      faq.question.toLowerCase().includes(keyword) ||
      faq.answer.toLowerCase().includes(keyword);

    const matchesCategory =
      selectedCategory === "all" || faq.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredFAQs.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const currentFAQs = filteredFAQs.slice(startIndex, startIndex + PAGE_SIZE);

  // 🔹 Format ngày cập nhật (fallback i18n)
  const formatUpdatedAt = (updatedAt?: string) => {
    const date = updatedAt ? new Date(updatedAt) : new Date();
    if (Number.isNaN(date.getTime())) return msg.labels.recent;
    // Sử dụng locale theo pathname (vi-VN/en-US)
    const locale = pathname.startsWith("/en") ? "en-US" : "vi-VN";
    return date.toLocaleDateString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-sky-50">
      {/* Header */}
      <header className="relative overflow-hidden bg-linear-to-br from-blue-600 via-sky-500 to-cyan-400 pb-16 sm:pb-20">
        {/* Backgrounds */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 md:px-8 pt-8">
          <div className="grid gap-8 lg:grid-cols-5 lg:items-center">
            {/* LEFT */}
            <div className="flex flex-col justify-center space-y-4 sm:space-y-6 lg:col-span-3">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 self-start">
                <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md text-white text-sm font-semibold border border-white/30 shadow-lg">
                  <MessageCircleQuestion size={18} className="animate-pulse" />
                  {msg.header.badge}
                </span>
              </div>

              {/* Title */}
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-[40px] font-black text-white leading-tight mb-3 drop-shadow-lg">
                  {msg.header.title.main}{" "}
                  <span className="text-amber-300">
                    {msg.header.title.accent}
                  </span>
                </h1>
                <div className="h-1.5 w-24 bg-yellow-300 rounded-full shadow-lg" />
              </div>

              {/* Subtitle */}
              <p className="text-sm sm:text-base md:text-[15px] text-white leading-relaxed max-w-xl font-medium">
                {msg.header.subtitle}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/20">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                    {faqs.length}+
                  </div>
                  <div className="text-xs sm:text-sm text-white font-medium">
                    {msg.stats.questions}
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/20">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                    {categories.length - 1}
                  </div>
                  <div className="text-xs sm:text-sm text-white font-medium">
                    {msg.stats.topics}
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/20">
                  <div className="text-2xl sm:text-3xl font-bold text-yellow-300 mb-1">
                    24/7
                  </div>
                  <div className="text-xs sm:text-sm text-white font-medium">
                    {msg.stats.support}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="hidden lg:flex items-center justify-end lg:col-span-2">
              <div className="relative w-full max-w-sm">
                <div className="absolute top-0 left-0 animate-bounce delay-100">
                  <div className="bg-white rounded-2xl p-4 shadow-2xl border border-white/50">
                    <Search size={26} className="text-sky-600" />
                  </div>
                </div>
                <div className="absolute top-1/4 right-0 animate-bounce delay-300">
                  <div className="bg-yellow-400 rounded-2xl p-4 shadow-2xl">
                    <MessageCircleQuestion
                      size={26}
                      className="text-yellow-900"
                    />
                  </div>
                </div>
                <div className="absolute bottom-1/4 left-1/4 animate-bounce delay-500">
                  <div className="bg-green-500 rounded-2xl p-4 shadow-2xl">
                    <Check size={26} className="text-white" />
                  </div>
                </div>

                <div className="relative mx-auto w-56 h-56 sm:w-64 sm:h-64">
                  <div className="absolute inset-0 bg-white/20 backdrop-blur-xl rounded-full border-4 border-white/30 shadow-2xl" />
                  <div className="absolute inset-7 bg-white rounded-full flex items-center justify-center shadow-xl">
                    <div className="text-center p-5">
                      <MessageCircleQuestion
                        size={52}
                        className="text-sky-600 mx-auto mb-3"
                        strokeWidth={1.5}
                      />
                      <div className="text-lg font-bold text-gray-800 mb-1">
                        {msg.hub.title}
                      </div>
                      <div className="text-xs text-gray-600 font-medium">
                        {msg.hub.subtitle}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave bottom */}
        <div className="absolute inset-x-0 bottom-0 pointer-events-none">
          <svg viewBox="0 0 1440 60" className="w-full">
            <path
              d="M0,45 C360,90 1080,10 1440,55 L1440,130 L0,130 Z"
              className="fill-sky-50"
            ></path>
          </svg>
        </div>
      </header>

      {/* Main */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Search & Filter */}
        <div className="mb-8 sm:mb-10 flex flex-col gap-3 sm:gap-4 md:flex-row md:justify-center items-center">
          {/* Search */}
          <div className="relative w-full md:max-w-xl">
            <Search className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder={msg.labels.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-2.5 rounded-lg border border-gray-200 bg-white text-sm sm:text-base hover:border-sky-500/50 focus:border-sky-400 outline-none transition-all duration-300 shadow-sm"
            />
          </div>

          {/* Dropdown Filter */}
          <div className="relative w-full sm:w-1/2 md:w-1/3">
            <Listbox
              value={selectedCategory}
              onChange={(value: FAQCategoryName) => {
                setSelectedCategory(value);
                setCurrentPage(1);
              }}
            >
              <div className="relative">
                <Listbox.Button className="w-full flex items-center justify-between px-4 sm:px-5 py-2.5 bg-white rounded-lg shadow-sm hover:border-sky-500/50 border border-gray-200 transition text-sm sm:text-base">
                  <span className="flex items-center gap-2">
                    {categories.find((c) => c.name === selectedCategory)?.icon}
                    {getCategoryName(selectedCategory)}
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
                    {categories.map((category) => (
                      <Listbox.Option
                        key={category.name}
                        value={category.name}
                        className={({ active, selected }) =>
                          `px-4 sm:px-5 py-2.5 cursor-pointer flex items-center justify-between text-sm sm:text-base ${
                            selected
                              ? "bg-blue-50 text-blue-700"
                              : active
                              ? "bg-gray-100 text-gray-800"
                              : "text-gray-700"
                          }`
                        }
                      >
                        {({ selected }) => (
                          <>
                            <div className="flex items-center gap-2">
                              {category.icon}
                              {getCategoryName(category.name)}
                            </div>
                            {selected && (
                              <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                            )}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
          </div>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4 sm:space-y-5">
          {currentFAQs.map((faq, index) => {
            const isExpanded = expandedItems.has(faq.id);
            return (
              <div key={faq.id} className="relative">
                {/* Number badge */}
                <div className="absolute -top-2 -left-2 z-10 w-7 h-7 sm:w-8 sm:h-8 bg-linear-to-br from-sky-400 via-sky-500 to-sky-600 text-white text-xs sm:text-sm font-bold rounded-full flex items-center justify-center shadow-md">
                  {String(startIndex + index + 1).padStart(2, "0")}
                </div>

                {/* Card */}
                <div
                  className={`bg-white rounded-2xl shadow-sm sm:shadow-md hover:shadow-md sm:hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border-l-4 
                  max-w-xl mx-auto md:max-w-none
                  ${
                    isExpanded
                      ? "border-sky-500 ring-1 ring-sky-100"
                      : "border-transparent hover:border-sky-500/50"
                  } relative overflow-hidden`}
                >
                  <button
                    onClick={() => toggleExpanded(faq.id)}
                    className={`relative w-full text-left flex items-start justify-between group transition-all duration-300 ${
                      isExpanded
                        ? "px-4 pt-4 sm:px-5 sm:pt-5 md:px-6 md:pt-6"
                        : "px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6"
                    }`}
                  >
                    <div className="flex items-start gap-3 sm:gap-4 flex-1">
                      <div
                        className={`shrink-0 mt-0.5 sm:mt-1 p-1.5 sm:p-2 rounded-xl transition-all duration-300 ${
                          isExpanded
                            ? "bg-blue-50 scale-110"
                            : "bg-gray-50 group-hover:bg-slate-100"
                        }`}
                      >
                        {faq.icon}
                      </div>
                      <div className="flex-1">
                        <h3
                          className={`font-semibold transition-colors duration-300 text-[15px] sm:text-[17px] ${
                            isExpanded
                              ? "text-gray-900"
                              : "text-gray-700 group-hover:text-gray-900"
                          }`}
                        >
                          {faq.question}
                        </h3>
                        {!isExpanded && (
                          <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-1">
                            {faq.answer.substring(0, 120)}...
                          </p>
                        )}
                      </div>
                    </div>
                    <div
                      className={`shrink-0 ml-3 sm:ml-4 p-1.5 sm:p-2 rounded-full transition-all duration-300 ${
                        isExpanded
                          ? "bg-sky-50 rotate-180"
                          : "group-hover:bg-gray-100"
                      }`}
                    >
                      <ChevronDown
                        className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-300 ${
                          isExpanded
                            ? "text-sky-700"
                            : "text-gray-400 group-hover:text-sky-500"
                        }`}
                      />
                    </div>
                  </button>

                  <div
                    className={`transition-all duration-500 ease-in-out ${
                      isExpanded
                        ? "max-h-96 opacity-100 overflow-visible"
                        : "max-h-0 opacity-0 overflow-hidden"
                    }`}
                  >
                    <div className="px-4 sm:px-6 pb-4 sm:pb-6 relative">
                      <div className="ml-10 sm:ml-14 pt-2 sm:pt-0">
                        <div className="h-px bg-linear-to-r from-sky-200 via-sky-100 to-transparent mb-3 sm:mb-4" />
                        <div className="p-3 sm:p-4 rounded-xl border-l-2 border-sky-200">
                          <p className="text-sm sm:text-base text-gray-800 leading-relaxed">
                            {faq.answer}
                          </p>

                          {/* Meta row */}
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-5 text-xs sm:text-sm sm:items-center">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-sky-700">
                              {msg.meta.centerHint}
                            </span>

                            {/* Desktop */}
                            <span className="hidden sm:inline text-gray-500 ml-auto">
                              {msg.labels.updatedAtPrefix}{" "}
                              {formatUpdatedAt(faq.updatedAt)}
                            </span>
                            {/* Mobile */}
                            <span className="sm:hidden w-full text-gray-500">
                              {msg.labels.updatedAtPrefix}{" "}
                              {formatUpdatedAt(faq.updatedAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {filteredFAQs.length > PAGE_SIZE && (
          <div className="flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={PAGE_SIZE}
              totalItems={filteredFAQs.length}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}

        {/* No result */}
        {filteredFAQs.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 sm:w-12 sm:h-12 text-sky-300" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">
              {msg.labels.noResultsTitle}
            </h3>
            <p className="text-sm sm:text-base text-gray-500">
              {msg.labels.noResultsSubtitle}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KidzGoFAQ;
