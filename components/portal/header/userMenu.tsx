// components/portal/userMenu.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  LogOut,
  User as UserIcon,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AvatarUserImage from "@/components/ui/Avatar_User_Image";
import type { Role } from "@/lib/role";
import { ROLE_LABEL, ROLES } from "@/lib/role";

type Placement = "down" | "up";

interface UserMenuProps {
  placement?: Placement;
  className?: string;
  showNameOnMobile?: boolean;

  /** Chọn nhanh role mock nếu muốn ép (nếu không truyền sẽ tự đọc từ URL) */
  mockRole?: Role;

  /** override thông tin user mock */
  mockUser?: {
    fullname: string;
    email: string;
    avatarUrl?: string;
    role?: Role;
  };

  /** trang quay về sau logout (mock) */
  homeHref?: string;
}

/* ===== Helpers ===== */
const roleBadge = (role: Role) => {
  switch (role) {
    case "Admin":
      return { label: ROLE_LABEL.Admin, grad: "from-rose-500 to-red-600" };
    case "Staff_Accountant":
      return {
        label: ROLE_LABEL.Staff_Accountant,
        grad: "from-fuchsia-500 to-pink-600",
      };
    case "Staff_Manager":
      return {
        label: ROLE_LABEL.Staff_Manager,
        grad: "from-amber-500 to-orange-600",
      };
    case "Teacher":
      return { label: ROLE_LABEL.Teacher, grad: "from-indigo-500 to-sky-600" };
    case "Parent":
      return { label: ROLE_LABEL.Parent, grad: "from-emerald-500 to-teal-600" };
    default:
      // Fallback for any unmapped role (Student uses separate header)
      return {
        label: ROLE_LABEL.Admin,
        grad: "from-rose-500 to-red-600",
      };
  }
};

const shortenName = (fullName: string) => {
  if (!fullName) return "";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const last = parts.pop();
  const initials = parts.map((p) => p[0].toUpperCase() + ".").join(" ");
  return `${last} ${initials}`.trim();
};

/** Lấy role theo URL: /vi|en/portal/<segment> */
function useRoleFromUrl(fallback?: Role): Role {
  const pathname = usePathname() || "/";
  const segs = pathname.split("/").filter(Boolean);
  const i = segs[0] === "vi" || segs[0] === "en" ? 1 : 0; // bỏ locale
  const segPortal = segs[i];
  const segRole = segs[i + 1];

  if (segPortal === "portal") {
    // Student uses separate StudentHeader, not UserMenu
    const map: Record<string, Role> = {
      admin: "Admin",
      "staff-accountant": "Staff_Accountant",
      "staff-management": "Staff_Manager",
      teacher: "Teacher",
      parent: "Parent",
    };
    if (map[segRole]) return map[segRole];
  }
  return fallback ?? "Admin";
}

/** Giữ nguyên prefix locale hiện tại cho mọi Link */
function useLocalePrefix() {
  const pathname = usePathname() || "/";
  const segs = pathname.split("/").filter(Boolean);
  const hasLocale = segs[0] === "vi" || segs[0] === "en";
  return hasLocale ? `/${segs[0]}` : "";
}

// Student uses separate StudentHeader, so not all Role keys are needed here
const DEFAULT_BY_ROLE: Partial<Record<
  Role,
  { fullname: string; email: string; role: Role; avatarUrl?: string }
>> = {
  Admin: {
    fullname: "Nguyễn Minh Quân",
    email: "quan.admin@example.com",
    role: "Admin",
  },
  Staff_Accountant: {
    fullname: "Phạm Thu Hà",
    email: "ha.accounting@example.com",
    role: "Staff_Accountant",
  },
  Staff_Manager: {
    fullname: "Trần Bảo Anh",
    email: "anh.manager@example.com",
    role: "Staff_Manager",
  },
  Teacher: {
    fullname: "Lê Quốc Huy",
    email: "huy.teacher@example.com",
    role: "Teacher",
  },
  Parent: {
    fullname: "Bố Khương",
    email: "phuhuynh.khuong@example.com",
    role: "Parent",
  },
};

const UserMenu: React.FC<UserMenuProps> = ({
  placement = "down",
  className = "",
  showNameOnMobile = false,
  mockRole,
  mockUser,
  homeHref = "/",
}) => {
  const pathname = usePathname();
  const localePrefix = useLocalePrefix();
  const role = useRoleFromUrl(mockRole);

  // user mock (không dùng redux)
  // Student uses separate header, so fallback to Admin if role not found
  const user = {
    ...(DEFAULT_BY_ROLE[role] ?? DEFAULT_BY_ROLE.Admin),
    ...(mockUser ?? {}),
    role: (mockUser?.role ?? role) as Role,
  };

  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  // menu items (giữ locale prefix)
  const BASE = `${localePrefix}/userlayout`;
  const portalHref = `${localePrefix}${ROLES[user.role]}`;

  const menuItems = [
    {
      icon: UserIcon,
      label: "Hồ sơ cá nhân",
      href: `${BASE}/profile`,
      color: "text-gray-700",
      hoverColor: "hover:bg-blue-50 hover:text-blue-600",
      iconBg: "group-hover:bg-blue-100",
    },
  
  ];

  // đóng khi click ngoài/ ESC
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!open) return;
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !popRef.current?.contains(t)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // đóng khi đổi route
  useEffect(() => setOpen(false), [pathname]);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const handleLogout = async () => {
    if (isLoggingOut) return;
    setOpen(false);
    setIsLoggingOut(true);
    
    // Clear all tokens and auth data
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      // Clear all cookies
      document.cookie.split(';').forEach(c => {
        document.cookie = c.trim().split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
      });
    }
    
    await sleep(700);
    window.location.replace(homeHref);
  };

  const { label: roleText, grad } = roleBadge(user.role);

  return (
    <div className={`relative ${className}`}>
      {/* Trigger */}
      <button
        ref={btnRef}
        onClick={() => !isLoggingOut && setOpen((o) => !o)}
        className={`group relative flex items-center gap-2.5 rounded-full bg-white px-3 py-1.5 overflow-hidden transition-all duration-300
    ${isLoggingOut ? "cursor-wait opacity-90" : "hover:shadow-md"}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-busy={isLoggingOut}
        disabled={isLoggingOut}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full border border-transparent
      opacity-0 group-hover:opacity-100 transition-opacity duration-300
      [background:linear-gradient(#fff,#fff)_padding-box,linear-gradient(90deg,#14b8a6,#10b981,#22c55e)_border-box]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-emerald-500/50
      group-hover:ring-transparent transition"
        />
        <div className="relative flex items-center gap-2">
          <div className="relative">
            <AvatarUserImage
              name={user.fullname}
              size={36}
              ringClassName="ring-2 ring-white"
            />
            {!isLoggingOut && (
              <span className="absolute -bottom-0.5 right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
            )}
            {isLoggingOut && (
              <span className="pointer-events-none absolute inset-[-3px] rounded-full border-2 border-transparent border-t-sky-500 animate-spin" />
            )}
            {!isLoggingOut && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={
                  open ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }
                }
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="absolute -top-1 -right-1"
              >
                <Sparkles className="w-3 h-3 text-yellow-500 fill-yellow-400" />
              </motion.div>
            )}
          </div>

          {/* Tên ngắn gọn */}
          <span
            className={`${
              showNameOnMobile ? "" : "hidden md:block"
            } text-[15px] font-medium max-w-[180px] truncate ${
              isLoggingOut ? "text-blue-500" : "text-gray-700"
            }`}
            title={user.fullname || "User"}
          >
            {isLoggingOut ? "Đang đăng xuất…" : shortenName(user.fullname || "User")}
          </span>

          {!isLoggingOut && (
            <motion.div
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-colors" />
            </motion.div>
          )}
        </div>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && !isLoggingOut && (
          <>
            {placement === "down" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40"
                style={{ backgroundColor: "rgba(0,0,0,0.02)" }}
              />
            )}

            <motion.div
              ref={popRef}
              role="menu"
              initial={{
                opacity: 0,
                scale: 0.95,
                y: placement === "up" ? 10 : -10,
              }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{
                opacity: 0,
                scale: 0.95,
                y: placement === "up" ? 10 : -10,
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
                mass: 0.8,
              }}
              className={`absolute right-0 ${
                placement === "up" ? "bottom-full mb-3" : "mt-3"
              } w-[248px] rounded-2xl border border-gray-200 bg-white shadow-xl z-50 overflow-hidden`}
            >
              {/* Header */}
              <div className="relative px-6 py-3 bg-linear-to-br from-sky-50 via-purple-50 to-pink-50 border-b border-gray-100">
                <div className="absolute inset-0 bg-grid-pattern opacity-5" />
                <div className="relative">
                  <p className="text-base font-semibold text-gray-900 mb-0.5">
                    {user.fullname}
                  </p>
                  <p className="text-xs text-gray-600 truncate mb-2">
                    {user.email}
                  </p>
                  <motion.span
                    initial={{ scale: 0, x: -20 }}
                    animate={{ scale: 1, x: 0 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
                    className={`inline-flex items-center gap-1.5 rounded-full bg-linear-to-r ${
                      roleBadge(user.role).grad
                    } text-white text-[10px] px-2 py-1 shadow-sm uppercase tracking-wide`}
                    title={ROLE_LABEL[user.role]}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    {roleBadge(user.role).label}
                  </motion.span>
                </div>
              </div>

              {/* Items */}
              <nav className="py-1.5 px-2">
                {menuItems.map((item, idx) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: 0.05 * idx,
                      type: "spring",
                      stiffness: 300,
                    }}
                  >
                    <Link
                      href={item.href}
                      className={`group flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${item.color} ${item.hoverColor}`}
                    >
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 ${item.iconBg} transition-colors duration-200`}
                      >
                        <item.icon className="w-4 h-4" />
                      </div>
                      <span>{item.label}</span>
                      <motion.div
                        initial={{ x: -5, opacity: 0 }}
                        whileHover={{ x: 0, opacity: 1 }}
                        className="ml-auto"
                      >
                        <ChevronDown className="w-4 h-4 -rotate-90" />
                      </motion.div>
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <div className="mx-4 border-t border-gray-100" />

              {/* Logout (mock) */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="px-2 py-1.5"
              >
                <motion.button
                  onClick={async () => {
                    if (isLoggingOut) return;
                    setOpen(false);
                    setIsLoggingOut(true);
                    await new Promise((r) => setTimeout(r, 700));
                    window.location.replace(homeHref);
                  }}
                  initial="rest"
                  whileHover="hover"
                  className="group w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-red-50 group-hover:bg-red-100 transition-colors duration-200">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <span className="font-medium">Đăng xuất</span>
                  <motion.div
                    className="ml-auto"
                    variants={{
                      rest: { x: 0, opacity: 0.7 },
                      hover: { x: 6, opacity: 1 },
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 24 }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </motion.div>
                </motion.button>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        .bg-grid-pattern {
          background-image:
            linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
    </div>
  );
};

export default UserMenu;
