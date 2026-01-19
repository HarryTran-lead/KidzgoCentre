// components/portal/PortalHeader.tsx
"use client";

import { useState, useMemo, useRef, useEffect, type ReactNode } from "react";
import {
  Bell,
  Search,
  Menu,
  X,
  Coins,
  Gem,
  Flame,
  UserCircle2,
  ChevronDown,
  Sparkles,
  Shield,
} from "lucide-react";
import { usePathname } from "next/navigation";
import UserMenu from "./userMenu";
import LanguageToggle from "@/components/ui/button/LanguageToggle";

import { pickLocaleFromPath, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import { ACCESS_MAP, ROLES, ROLE_LABEL, type Role } from "@/lib/role";

/* ================= Types ================= */
export type PortalRole = Role;

type Notification = {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "info" | "warning" | "success";
};

type Props = {
  role?: PortalRole; // optional override
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

/* ============== Student Header ============== */
function StudentStat({
  icon,
  label,
  value,
  gradient,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  gradient: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-white backdrop-blur shadow-[0_10px_40px_rgba(59,130,246,0.35)]">
      <span
        className={`grid h-8 w-8 place-items-center rounded-full bg-linear-to-br ${gradient} text-white shadow-lg`}
      >
        {icon}
      </span>
      <div className="leading-tight">
        <div className="text-[11px] uppercase tracking-wide text-indigo-50/80">
          {label}
        </div>
        <div className="text-base font-extrabold">{value}</div>
      </div>
    </div>
  );
}

function StudentHeaderBar({
  onMenuClick,
  userName,
}: {
  onMenuClick: () => void;
  userName?: string;
}) {
  const stats = [
    {
      label: "KidzGo Coins",
      value: "1,357",
      icon: <Coins size={18} />,
      gradient: "from-amber-400 to-orange-500",
    },
    {
      label: "Kim cương",
      value: "6",
      icon: <Gem size={18} />,
      gradient: "from-sky-400 to-indigo-500",
    },
    {
      label: "Chuỗi ngày",
      value: "6 ngày",
      icon: <Flame size={18} />,
      gradient: "from-rose-400 to-amber-500",
    },
  ];

  return (
    <header className="sticky top-0 z-50">
      <div className="relative overflow-hidden border-b border-white/10 bg-linear-to-r from-[#27117a] via-[#361288] to-[#4a1ea4] text-white shadow-[0_10px_30px_rgba(59,130,246,0.35)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.2),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(129,140,248,0.18),transparent_35%),radial-gradient(circle_at_50%_80%,rgba(236,72,153,0.2),transparent_45%)]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22 viewBox=%220 0 40 40%22%3E%3Ccircle cx=%222%22 cy=%222%22 r=%222%22 fill=%22%23ffffff%22 opacity=%220.15%22/%3E%3C/svg%3E')]" />

        <div className="relative mx-auto flex h-16 items-center gap-3 px-3 sm:px-4 lg:px-6">
          <button
            onClick={onMenuClick}
            className="lg:hidden shrink-0 rounded-xl bg-white/10 p-2 text-white backdrop-blur hover:bg-white/15 active:scale-95 transition-all"
            aria-label="Mở menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 text-white shadow-inner">
              <Shield size={22} />
            </span>
            <div className="leading-tight">
              <div className="text-xs font-semibold uppercase tracking-wide text-indigo-100">
                KidzGo Portal
              </div>
              <div className="text-lg font-black drop-shadow-sm">
                Học viên {userName ?? "Nguyễn Văn An"}
              </div>
            </div>
          </div>

          <div className="ml-auto hidden items-center gap-2 md:flex lg:gap-3">
            {stats.map((s) => (
              <StudentStat
                key={s.label}
                icon={s.icon}
                label={s.label}
                value={s.value}
                gradient={s.gradient}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-semibold backdrop-blur sm:px-4">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-white/20 shadow-inner">
              <UserCircle2 size={22} />
            </div>
            <div className="leading-tight">
              <div className="text-xs text-indigo-100/90">Xin chào</div>
              <div className="text-sm font-bold">
                {userName ?? "Nguyễn Văn An"}
              </div>
            </div>
            <ChevronDown size={16} className="text-white/80" />
          </div>
        </div>
      </div>
    </header>
  );
}

/* ============== Helpers: Path & Role & I18n ============== */

/** Bỏ prefix locale (/vi|/en) khỏi pathname để so khớp ACCESS_MAP */
function stripLocalePrefix(pathname: string): string {
  return pathname.replace(/^\/(vi|en)(?=\/|$)/, "");
}

/** So khớp chuẩn (trùng nguyên cụm hoặc prefix có /) */
function matchPrefix(path: string, prefix: string): boolean {
  const p = prefix.replace(/\/+$/, ""); // bỏ / cuối
  return path === p || path.startsWith(p + "/");
}

/** Lấy role từ URL sử dụng ACCESS_MAP/ROLES */
function useRoleFromPath(fallback?: PortalRole): PortalRole {
  const pathname = usePathname() || "/";
  const noLocale = stripLocalePrefix(pathname) || "/";

  // Duyệt qua các role và allowed prefixes (ACCESS_MAP)
  for (const roleKey of Object.keys(ACCESS_MAP) as Role[]) {
    const prefixes = ACCESS_MAP[roleKey] || [];
    for (const pref of prefixes) {
      if (matchPrefix(noLocale, pref)) {
        return roleKey;
      }
    }
  }

  // Nếu không match: fallback
  return fallback ?? "Student";
}

/** I18n đơn giản cho Header (không phụ thuộc dict) */
function useHeaderI18n(locale: Locale) {
  const ROLE_LABEL_EN: Record<Role, string> = {
    Admin: "Administrator",
    Staff_Accountant: "Accountant",
    Staff_Manager: "Manager",
    Teacher: "Teacher",
    Student: "Student",
    Parent: "Parent",
  };

  return {
    labels: {
      searchPlaceholder: locale === "en" ? "Search..." : "Tìm kiếm...",
      searchBoxPlaceholder:
        locale === "en"
          ? "Search in the system..."
          : "Tìm kiếm trong hệ thống...",
      pressEnter: locale === "en" ? "Press" : "Nhấn",
      toSearch: locale === "en" ? "to search" : "để tìm kiếm",
      notifications: locale === "en" ? "Notifications" : "Thông báo",
      noNewNotifications:
        locale === "en" ? "No new notifications" : "Không có thông báo mới",
      openMenuAria: locale === "en" ? "Open menu" : "Mở menu",
      searchAria: locale === "en" ? "Search" : "Tìm kiếm",
    },
    roleLabel(role: Role) {
      return locale === "en" ? ROLE_LABEL_EN[role] : ROLE_LABEL[role];
    },
    titleFor(role: Role, userName?: string, pageTitle?: string) {
      if (pageTitle) return pageTitle;

      if (role === "Teacher" && userName) {
        return locale === "en"
          ? `Welcome back, ${userName}!`
          : `Chào mừng trở lại, ${userName}!`;
      }

      if (role === "Student") {
        return locale === "en" ? "Student Portal" : "Cổng học viên";
      }

      if (role === "Parent") {
        return locale === "en" ? "Parent Portal" : "Cổng phụ huynh";
      }

      if (role === "Admin") {
        return locale === "en" ? "Dashboard" : "Bảng điều khiển";
      }

      const label = this.roleLabel(role);
      return locale === "en" ? `Portal — ${label}` : `Cổng ${label}`;
    },
  };
}

/* ================= Component ================= */
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
}: Props) {
  const pathname = usePathname() || "/";
  const locale = useMemo<Locale>(
    () => pickLocaleFromPath(pathname) ?? DEFAULT_LOCALE,
    [pathname]
  );

  const i18n = useHeaderI18n(locale);
  const currentRole = useRoleFromPath(role);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const notificationRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const showSearchFinal = useMemo(() => {
    if (typeof showSearch === "boolean") return showSearch;
    // Các role tác nghiệp thường cần search header
    return (
      currentRole === "Admin" ||
      currentRole === "Staff_Accountant" ||
      currentRole === "Staff_Manager"
    );
  }, [currentRole, showSearch]);

  const title = useMemo(
    () => i18n.titleFor(currentRole, userName, pageTitle),
    [i18n, currentRole, userName, pageTitle]
  );

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

  // ✅ Student uses special header
  if (currentRole === "Student") {
    return (
      <StudentHeaderBar onMenuClick={handleMenuClick} userName={userName} />
    );
  }

  return (
    <>
      {/* Header sticky */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm">
        <div className="mx-auto px-3 sm:px-4 lg:px-6 h-14 md:h-16 flex items-center gap-3 md:gap-4 lg:gap-6">
          {/* Menu Button (Mobile) */}
          <button
            onClick={handleMenuClick}
            className="lg:hidden shrink-0 p-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all"
            aria-label={i18n.labels.openMenuAria}
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
              className="hidden md:flex items-center gap-2 md:gap-2.5
                         px-3 py-2 rounded-xl border border-slate-200
                         hover:border-slate-300 hover:bg-slate-50 transition-all
                         text-sm text-slate-600 md:min-w-[220px] lg:min-w-[300px]"
              aria-label={i18n.labels.searchAria}
            >
              <Search className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">
                {i18n.labels.searchPlaceholder}
              </span>
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
              aria-label={i18n.labels.searchAria}
            >
              <Search className="w-5 h-5 text-slate-700" />
            </button>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-2 lg:gap-2 shrink-0">
            <LanguageToggle />

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications((v) => !v)}
                className="relative grid place-items-center
                           w-9 h-9 md:w-10 md:h-10
                           rounded-full text-slate-700 hover:bg-slate-100
                           active:scale-95 transition-all"
                aria-label={i18n.labels.notifications}
              >
                <Bell className="w-5 h-5" />
                {(unreadCount ?? 0) > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-[10px] leading-[18px] rounded-full bg-rose-500 text-white font-bold grid place-items-center shadow-lg">
                    {unreadCount! > 99 ? "99+" : unreadCount}
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

                  {/* Panel: mobile fixed, desktop absolute dưới chuông */}
                  <div
                    className="
                      fixed md:absolute z-50
                      left-1/2 -translate-x-1/2
                      top-14 md:top-16
                      w-[min(92vw,24rem)] md:w-96
                      bg-white rounded-2xl shadow-2xl border border-slate-200
                      overflow-hidden animate-in fade-in slide-in-from-top-2
                    "
                    role="dialog"
                    aria-label={i18n.labels.notifications}
                  >
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900">
                        {i18n.labels.notifications}
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
                          <p className="text-sm">
                            {i18n.labels.noNewNotifications}
                          </p>
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
          className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm animate-in fade-in"
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
                  placeholder={i18n.labels.searchBoxPlaceholder}
                  className="w-full pl-14 pr-12 py-5 text-base border-b border-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowSearchModal(false)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </form>
              <div className="p-4 text-sm text-slate-500">
                {i18n.labels.pressEnter}{" "}
                <kbd className="px-2 py-1 bg-slate-100 rounded text-xs font-semibold">
                  Enter
                </kbd>{" "}
                {i18n.labels.toSearch}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
