// components/portal/PortalHeader.tsx
"use client";

import { useMemo } from "react";
import { Bell, Search, Menu } from "lucide-react";
import Image from "next/image";

export type PortalRole =
  | "ADMIN"
  | "STAFF_ACCOUNTING"
  | "STAFF_MANAGER"
  | "TEACHER"
  | "STUDENT";

type Props = {
  role: PortalRole;
  userName?: string; // "Nguyễn Thị An"
  avatarUrl?: string; // /image/avatar.jpg (nếu không có sẽ dùng initials)
  unreadCount?: number; // số thông báo chưa đọc
  onMenuToggle?: () => void; // toggle sidebar (mobile)
  pageTitle?: string; // override tiêu đề nếu muốn
  showSearch?: boolean; // ép hiển thị/ẩn ô search
};

const ROLE_LABEL: Record<PortalRole, string> = {
  ADMIN: "Quản trị",
  STAFF_ACCOUNTING: "Kế toán",
  STAFF_MANAGER: "Quản lý",
  TEACHER: "Giáo viên",
  STUDENT: "Học viên",
};

export default function PortalHeader({
  role,
  userName,
  avatarUrl,
  unreadCount = 0,
  onMenuToggle,
  pageTitle,
  showSearch,
}: Props) {
  // Mặc định: ADMIN/STAFF có search, TEACHER/STUDENT không
  const showSearchFinal = useMemo(() => {
    if (typeof showSearch === "boolean") return showSearch;
    return (
      role === "ADMIN" ||
      role === "STAFF_ACCOUNTING" ||
      role === "STAFF_MANAGER"
    );
  }, [role, showSearch]);

  const title = useMemo(() => {
    if (pageTitle) return pageTitle;
    if (role === "TEACHER" && userName)
      return `Chào mừng trở lại, ${userName}!`;
    if (role === "STUDENT") return "Cổng học viên";
    if (role === "ADMIN") return "Bảng điều khiển";
    return `Cổng ${ROLE_LABEL[role]}`;
  }, [role, userName, pageTitle]);

  const initials = useMemo(() => {
    if (!userName) return ROLE_LABEL[role].slice(0, 2).toUpperCase();
    const parts = userName.trim().split(/\s+/);
    const last = parts[parts.length - 1] || "";
    const first = parts[0] || "";
    return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
  }, [userName, role]);

  return (
    <header className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b border-slate-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
        {/* Menu (mobile) */}
        <button
          onClick={onMenuToggle}
          className="shrink-0 p-2 rounded-lg hover:bg-slate-100 md:hidden"
          aria-label="Mở menu"
        >
          <Menu className="w-5 h-5 text-slate-700" />
        </button>

        {/* Tiêu đề / Search */}
        <div className="flex-1 min-w-0 flex items-center gap-4">
          <div className="font-semibold text-gray-900 truncate">{title}</div>

          {showSearchFinal && (
            <div className="hidden md:block flex-1">
              <div className="relative w-full max-w-md">
                <input
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-pink-200"
                  placeholder="Tìm kiếm nhanh…"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            className="relative grid place-items-center w-9 h-9 rounded-full text-gray-900 border hover:bg-slate-50"
            aria-label="Thông báo"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 text-[10px] leading-4
                               rounded-full bg-rose-600 text-white grid place-items-center"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* Avatar */}
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="avatar"
              width={32}
              height={32}
              className="rounded-full object-cover w-8 h-8"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white grid place-items-center text-xs font-semibold">
              {initials}
            </div>
          )}

          {/* Nhãn role nhỏ */}
          <div className="hidden sm:flex flex-col leading-4">
            <span className="text-xs font-medium text-slate-900 truncate">
              {userName ?? ROLE_LABEL[role]}
            </span>
            <span className="text-[10px] text-slate-500">
              {ROLE_LABEL[role]}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
