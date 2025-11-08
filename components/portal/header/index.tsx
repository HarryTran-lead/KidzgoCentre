// components/portal/PortalHeader.tsx
"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  Bell,
  Search,
  Menu,
  Moon,
  Sun,
  HelpCircle,
  MessageSquare,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import UserMenu from "./userMenu"; // đảm bảo file tên đúng "userMenu.tsx" (hạ chữ thường) hoặc đổi import cho khớp

export type PortalRole =
  | "ADMIN"
  | "STAFF_ACCOUNTANT"
  | "STAFF_MANAGER"
  | "TEACHER"
  | "STUDENT";

type Notification = {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "info" | "warning" | "success";
};

type Props = {
  role?: PortalRole;
  userName?: string;
  avatarUrl?: string;
  unreadCount?: number;
  notifications?: Notification[];
  onMenuToggle?: () => void;
  pageTitle?: string;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
  onLogout?: () => void;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  onNotificationClick?: (id: string) => void;
  darkMode?: boolean;
  onThemeToggle?: () => void;
};

const ROLE_LABEL: Record<PortalRole, string> = {
  ADMIN: "Quản trị viên",
  STAFF_ACCOUNTANT: "Kế toán",
  STAFF_MANAGER: "Quản lý",
  TEACHER: "Giáo viên",
  STUDENT: "Học viên",
};

function useRoleFromUrl(fallback?: PortalRole): PortalRole {
  const pathname = usePathname() || "/";
  const parts = pathname.split("/").filter(Boolean);
  const idx = parts[0] === "vi" || parts[0] === "en" ? 1 : 0;
  const seg1 = parts[idx];
  const seg2 = parts[idx + 1];
  const seg3 = parts[idx + 2];

  if (seg1 === "portal") {
    if (seg2 === "admin") return "ADMIN";
    if (seg2 === "teacher") return "TEACHER";
    if (seg2 === "student") return "STUDENT";
    if (seg2 === "staff") {
      if (seg3 === "accounting") return "STAFF_ACCOUNTANT";
      if (seg3 === "management") return "STAFF_MANAGER";
    }
    // dạng gạch nối cũ
    if (seg2 === "staff-accountant") return "STAFF_ACCOUNTANT";
    if (seg2 === "staff-management") return "STAFF_MANAGER";
  }
  return fallback ?? "STUDENT";
}

export default function PortalHeader({
  role,
  userName,
  unreadCount = 0,
  notifications = [],
  onMenuToggle,
  pageTitle,
  showSearch,
  onSearch,
  onNotificationClick,
  darkMode = false,
  onThemeToggle,
}: Props) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const currentRole = useRoleFromUrl(role);

  const showSearchFinal = useMemo(() => {
    if (typeof showSearch === "boolean") return showSearch;
    return (
      currentRole === "ADMIN" ||
      currentRole === "STAFF_ACCOUNTANT" ||
      currentRole === "STAFF_MANAGER"
    );
  }, [currentRole, showSearch]);

  const title = useMemo(() => {
    if (pageTitle) return pageTitle;
    if (currentRole === "TEACHER" && userName)
      return `Chào mừng trở lại, ${userName}!`;
    if (currentRole === "STUDENT") return "Cổng học viên";
    if (currentRole === "ADMIN") return "Bảng điều khiển";
    return `Cổng ${ROLE_LABEL[currentRole]}`;
  }, [currentRole, userName, pageTitle]);

  useEffect(() => {
    if (showSearchModal && searchInputRef.current)
      searchInputRef.current.focus();
  }, [showSearchModal]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (
        showNotifications &&
        notificationRef.current &&
        !notificationRef.current.contains(e.target as Node)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [showNotifications]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowSearchModal(true);
      }
      if (e.key === "Escape") setShowSearchModal(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleMenuClick = () => {
    if (onMenuToggle) return onMenuToggle();
    window.dispatchEvent(new CustomEvent("portal:sidebar-open"));
  };

  return (
    <>
      {/* Header sticky mọi kích thước */}
      <header className="sticky bg-white top-0 z-40 white border-b border-slate-50/50 shadow-sm">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3">
          {/* Menu Button (Mobile) */}
          <button
            onClick={handleMenuClick}
            className="lg:hidden shrink-0 p-2 ml-1 rounded-xl hover:bg-slate-100 active:scale-95 transition-all"
            aria-label="Mở menu"
          >
            <Menu className="w-5 h-5 text-slate-700" />
          </button>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <h1 className="hidden xl:flex items-center gap-2 font-semibold text-lg text-slate-900 truncate">
              {title}
            </h1>
          </div>

          {/* Search (Desktop) */}
          {showSearchFinal && (
            <button
              onClick={() => setShowSearchModal(true)}
              className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-sm text-slate-600 min-w-[280px]"
            >
              <Search className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">Tìm kiếm...</span>
              <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 bg-slate-100 rounded">
                <span>⌘</span>K
              </kbd>
            </button>
          )}

          {/* Search (Mobile) */}
          {showSearchFinal && (
            <button
              onClick={() => setShowSearchModal(true)}
              className="md:hidden p-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all"
              aria-label="Tìm kiếm"
            >
              <Search className="w-5 h-5 text-slate-700" />
            </button>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              className="hidden lg:grid place-items-center w-9 h-9 rounded-xl text-slate-700 hover:bg-slate-100 active:scale-95 transition-all"
              aria-label="Tin nhắn"
            >
              <MessageSquare className="w-5 h-5" />
            </button>

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications((v) => !v)}
                className="relative grid place-items-center w-9 h-9 rounded-xl text-slate-700 hover:bg-slate-100 active:scale-95 transition-all"
                aria-label="Thông báo"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-[10px] leading-[18px] rounded-full bg-rose-500 text-white font-bold grid place-items-center shadow-lg">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <>
                  {/* overlay bấm ra ngoài để đóng */}
                  <div
                    className="fixed inset-0 z-40 bg-black/0"
                    onClick={() => setShowNotifications(false)}
                  />

                  {/* Panel: mobile= fixed giữa viewport, desktop= absolute căn giữa dưới chuông */}
                  <div
                    className="
        fixed md:absolute z-50
        left-1/2 -translate-x-1/2
        top-18 md:top-14                
        w-[min(92vw,24rem)] md:w-96      
        bg-white rounded-2xl shadow-2xl border border-slate-200
        overflow-hidden animate-in fade-in slide-in-from-top-2
      "
                    role="dialog"
                    aria-label="Thông báo"
                  >
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900">
                        Thông báo
                      </h3>
                    </div>

                    <div className="max-h-[70vh] overflow-y-auto">
                      {notifications.length ? (
                        notifications.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => onNotificationClick?.(n.id)}
                            className={`w-full p-4 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 ${
                              !n.read ? "bg-blue-50/50" : ""
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                                  n.type === "success"
                                    ? "bg-green-500"
                                    : n.type === "warning"
                                    ? "bg-orange-500"
                                    : "bg-blue-500"
                                }`}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-slate-900 mb-1">
                                  {n.title}
                                </p>
                                <p className="text-xs text-slate-600 line-clamp-2">
                                  {n.message}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-1">
                                  {n.time}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-8 text-center text-slate-500">
                          <Bell className="w-12 h-12 mx-auto mb-2 opacity-20" />
                          <p className="text-sm">Không có thông báo mới</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <UserMenu />
          </div>
        </div>
      </header>

      {/* Search Modal */}
      {showSearchModal && (
        <div
          className="fixed inset-0 z-120 bg-black/50 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowSearchModal(false)}
        >
          <div className="min-h-screen px-4 flex items-start justify-center pt-20">
            <div
              className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-4"
              onClick={(e) => e.stopPropagation()}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery.trim() && onSearch) {
                    onSearch(searchQuery);
                    setShowSearchModal(false);
                    setSearchQuery("");
                  }
                }}
                className="relative"
              >
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm trong hệ thống..."
                  className="w-full pl-14 pr-12 py-5 text-base border-b border-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowSearchModal(false)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </form>
              <div className="p-4 text-sm text-slate-500">
                Nhấn{" "}
                <kbd className="px-2 py-1 bg-slate-100 rounded text-xs font-semibold">
                  Enter
                </kbd>{" "}
                để tìm kiếm
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
