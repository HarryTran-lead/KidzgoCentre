// components/portal/PortalHeader.tsx
"use client";

import { useState, useMemo, useRef, useEffect, type ReactNode } from "react";
import {
  Bell,
  Search,
  Menu,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import UserMenu from "./userMenu";
import LanguageToggle from "@/components/ui/button/LanguageToggle";
import GlobalSearchModal from "./GlobalSearchModal";

import { pickLocaleFromPath, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import { ACCESS_MAP, ROLES, ROLE_LABEL, type Role } from "@/lib/role";
import { useNotifications } from "@/hooks/useNotifications";
import { useCurrentUser } from "@/hooks/useCurrentUser";


/* ================= Types ================= */
export type PortalRole = Role;

type Notification = {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "info" | "warning" | "success";
  link?: string;
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
  return fallback ?? "Admin";
}

/** I18n đơn giản cho Header (không phụ thuộc dict) */
function useHeaderI18n(locale: Locale) {
  // Student uses separate StudentHeader, not this PortalHeader
  const ROLE_LABEL_EN: Partial<Record<Role, string>> = {
    Admin: "Administrator",
    Staff_Accountant: "Accountant",
    Staff_Manager: "Manager",
    Teacher: "Teacher",
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
    titleFor(role: Role, userName?: string, pageTitle?: string, pathname?: string) {
      if (pageTitle) return pageTitle;

      if (role === "Teacher" && userName) {
        return locale === "en"
          ? `Welcome back, ${userName}!`
          : `Chào mừng trở lại, ${userName}!`;
      }

      if (role === "Parent") {
        return locale === "en" ? "Parent Portal" : "Cổng phụ huynh";
      }

      // Admin pages - detect from pathname
      if (role === "Admin" && pathname) {
        const pathMap: Record<string, { vi: string; en: string }> = {
          "/blogs": { vi: "Quản lý bản tin", en: "Blog Management" },
          "/accounts": { vi: "Quản lý tài khoản", en: "Account Management" },
          "/branches": { vi: "Quản lý chi nhánh", en: "Branch Management" },
          "/courses": { vi: "Quản lý khóa học", en: "Course Management" },
          "/classes": { vi: "Quản lý lớp học", en: "Class Management" },
          "/rooms": { vi: "Quản lý phòng học", en: "Room Management" },
          "/schedule": { vi: "Lịch học & Điểm danh", en: "Schedule & Attendance" },
          "/feedback": { vi: "Quản lý feedback", en: "Feedback Management" },
          "/leads": { vi: "Quản lý tuyển sinh", en: "Lead Management" },
          "/reports": { vi: "Báo cáo & Thống kê", en: "Reports & Analytics" },
          "/settings": { vi: "Cài đặt & Chính sách", en: "Settings & Policies" },
        };

        // Strip locale prefix
        const cleanPath = stripLocalePrefix(pathname);
        
        // Find matching admin route
        for (const [route, titles] of Object.entries(pathMap)) {
          if (cleanPath.includes(`/portal/admin${route}`)) {
            return locale === "en" ? titles.en : titles.vi;
          }
        }
      }

      if (role === "Admin") {
        return locale === "en" ? "Dashboard" : "Bảng điều khiển";
      }

      const label = this.roleLabel(role);
      return locale === "en" ? `Portal — ${label}` : `Cổng ${label}`;
    },
  };
}

function normalizeNotificationLink(input: string | undefined, locale: Locale, role: Role, fallback: string): string {
  const raw = String(input ?? "").trim();
  if (!raw) return fallback;

  const roleBase = ROLES[role];
  const roleReportRequestPath =
    role === "Teacher" || role === "Admin"
      ? `/${locale}${roleBase}/report-requests`
      : null;

  let path = raw;
  if (/^https?:\/\//i.test(raw)) {
    try {
      path = new URL(raw).pathname;
    } catch {
      return fallback;
    }
  }

  if (!path.startsWith("/")) path = `/${path}`;

  const legacyReportRequestMatch = path.match(/^\/(?:(?:vi|en)\/)?report-requests\/([0-9a-fA-F-]{36})$/);
  if (legacyReportRequestMatch && roleReportRequestPath) {
    const requestId = legacyReportRequestMatch[1];
    return `${roleReportRequestPath}?requestId=${requestId}`;
  }

  const localePrefix = `/${locale}`;
  if (!path.startsWith(localePrefix)) {
    return `${localePrefix}${path}`;
  }

  return path;
}

/* ================= Component ================= */
export default function PortalHeader({
  role,
  userName,
  avatarUrl,
  unreadCount = 0,
  notifications = [],
  onMenuToggle,
  pageTitle,
  showSearch,
  onSearch,
  onNotificationClick,
}: Props) {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const { user: currentUser } = useCurrentUser();
  const locale = useMemo<Locale>(
    () => pickLocaleFromPath(pathname) ?? DEFAULT_LOCALE,
    [pathname]
  );

  const i18n = useHeaderI18n(locale);
  const currentRole = useRoleFromPath(role);
  const headerUserName = currentUser?.fullName ?? userName;
  const headerAvatarUrl = useMemo(
    () => currentUser?.avatarUrl ?? avatarUrl,
    [currentUser?.avatarUrl, avatarUrl]
  );
  const notificationCenter = useNotifications(currentRole);
  const liveNotifications =
    notifications.length > 0
      ? notifications
      : notificationCenter.notifications.slice(0, 6).map((item) => ({
          id: item.id,
          title: item.title,
          message: item.message,
          time: new Intl.DateTimeFormat(locale === "en" ? "en-US" : "vi-VN", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(item.createdAt)),
          read: item.read,
          type:
            item.priority === "high"
              ? "warning"
              : item.kind === "report" || item.kind === "feedback"
              ? "success"
              : "info",
          link: item.link,
        }));
  const liveUnreadCount =
    notifications.length > 0 ? unreadCount : notificationCenter.unreadCount;

  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);

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
    () => i18n.titleFor(currentRole, headerUserName, pageTitle, pathname),
    [i18n, currentRole, headerUserName, pageTitle, pathname]
  );

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
                {(liveUnreadCount ?? 0) > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-[10px] leading-[18px] rounded-full bg-rose-500 text-white font-bold grid place-items-center shadow-lg">
                    {liveUnreadCount > 99 ? "99+" : liveUnreadCount}
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
                      {liveNotifications.length ? (
                        liveNotifications.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => {
                              notificationCenter.markAsRead(n.id);
                              setShowNotifications(false);
                              if (onNotificationClick) {
                                onNotificationClick(n.id);
                                return;
                              }
                              const destination = normalizeNotificationLink(
                                n.link,
                                locale,
                                currentRole,
                                notificationCenter.notificationsRoute,
                              );
                              router.push(destination);
                            }}
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
                    <div className="border-t border-slate-100 p-3">
                      <Link
                        href={notificationCenter.notificationsRoute}
                        onClick={() => setShowNotifications(false)}
                        className="flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                      >
                        Xem tất cả thông báo
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>

            <UserMenu
              mockUser={
                headerUserName
                  ? {
                      fullname: headerUserName,
                      email: currentUser?.email ?? "",
                      role: currentRole,
                      avatarUrl: headerAvatarUrl,
                    }
                  : undefined
              }
            />
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      {showSearchModal && (
        <GlobalSearchModal
          role={currentRole}
          locale={locale}
          onClose={() => setShowSearchModal(false)}
        />
      )}
    </>
  );
}
