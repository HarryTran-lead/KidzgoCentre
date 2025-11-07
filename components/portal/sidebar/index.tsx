// components/portal/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useLayoutEffect, useState, useEffect, useRef, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronRight,
  MapPin,
  Menu,
  X,
  ChevronLeft,
} from "lucide-react";
import { buildMenu } from "../menu/index";
import type { Role } from "@/lib/role";
import { ROLE_LABEL } from "@/lib/role";
import { pickLocaleFromPath, DEFAULT_LOCALE, localizePath } from "@/lib/i18n";
import type { LucideIcon } from "lucide-react";
import { LOGO, LOGO_ONLY } from "@/lib/theme/theme";
import Tooltip from "@mui/material/Tooltip";
import { createPortal } from "react-dom";

/* ===== Types ===== */
type FlatItem = {
  label: string;
  icon: LucideIcon;
  href: string;
};
type GroupItem = {
  group: string;
  icon?: LucideIcon;
  defaultOpen?: boolean;
  items: FlatItem[];
};
type AnyItem = FlatItem | GroupItem;
const isGroup = (x: AnyItem): x is GroupItem => (x as any).items;

/* ===== NavLink ===== */
function NavLink({
  href,
  label,
  Icon,
  active,
  depth = 0,
  collapsed,
}: {
  href: string;
  label: string;
  Icon?: LucideIcon;
  active: boolean;
  depth?: number;
  collapsed?: boolean;
}) {
  const core = (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300 ease-out
        ${
          active
            ? "bg-linear-to-r from-pink-50 via-transparent to-pink-50 text-pink-700 shadow-sm rounded-l-none"
            : "text-slate-600 hover:bg-gray-100 hover:text-slate-900"
        }`}
      style={{
        paddingLeft: collapsed ? 12 : 12 + depth * 16,
        justifyContent: collapsed ? "center" : "flex-start",
      }}
      title={!collapsed ? undefined : label}
    >
      {/* Active indicator bar */}
      <span
        className={`absolute left-0 top-1/2 -translate-y-1/2 h-full w-0.5 bg-linear-to-b from-pink-400 via-pink-500 to-red-500 transition-all duration-300 ease-out ${
          active ? "opacity-100 scale-100" : "opacity-0 scale-y-50"
        }`}
      />

      {/* Icon / Dot */}
      {Icon ? (
        <Icon
          size={18}
          className={`shrink-0 transition-all duration-300 ease-out ${
            active
              ? "text-pink-600 scale-110"
              : "text-slate-400 group-hover:text-pink-500 group-hover:scale-105"
          }`}
          strokeWidth={active ? 2.5 : 2}
        />
      ) : (
        <span
          className={`h-1.5 w-1.5 rounded-full shrink-0 transition-all duration-300 ease-out ${
            active
              ? "bg-pink-600 scale-125"
              : "bg-slate-300 group-hover:bg-pink-500 group-hover:scale-110"
          }`}
        />
      )}

      {!collapsed && (
        <span
          className={`truncate transition-all duration-300 ease-out ${
            active ? "font-semibold translate-x-0.5" : "font-medium"
          }`}
        >
          {label}
        </span>
      )}
    </Link>
  );

  // Khi thu gọn: dùng Tooltip của Material
  return collapsed ? (
    <Tooltip title={label} placement="right" arrow enterDelay={150}>
      <span className="block">{core}</span>
    </Tooltip>
  ) : (
    core
  );
}

/* ===== Flyout via Portal (tránh bị cắt) ===== */
function Flyout({
  open,
  anchorRect,
  title,
  Icon,
  items,
  makeHref,
  isActive,
  onMouseEnter,
  onMouseLeave,
}: {
  open: boolean;
  anchorRect: DOMRect | null;
  title: string;
  Icon?: LucideIcon;
  items: FlatItem[];
  makeHref: (p: string) => string;
  isActive: (p: string) => boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, arrowTop: 12 });

  useEffect(() => setMounted(true), []);

  // Tính vị trí để FLYOUT CĂN GIỮA anchor
  useLayoutEffect(() => {
    if (!open || !anchorRect) return;

    const GAP_X = 6;      // khoảng cách ngang với sidebar
    const PAD = 12;       // đệm mép viewport

    const measure = () => {
      const flyH = panelRef.current?.offsetHeight ?? 0;
      const left = anchorRect.right + GAP_X;

      // căn giữa theo tâm anchor, rồi clamp trong viewport
      let top =
        anchorRect.top + anchorRect.height / 2 - flyH / 2;

      top = Math.max(PAD, Math.min(top, window.innerHeight - PAD - flyH));

      // vị trí mũi tên (tương đối trong flyout)
      const anchorCenter = anchorRect.top + anchorRect.height / 2;
      let arrowTop = anchorCenter - top; // px trong panel
      arrowTop = Math.max(12, Math.min(arrowTop, Math.max(12, flyH - 12)));

      setPos({ top, left, arrowTop });
    };

    // đo sau khi DOM layout xong
    const raf = requestAnimationFrame(measure);
    const onResize = () => requestAnimationFrame(measure);

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open, anchorRect, items.length]);

  if (!mounted || !open || !anchorRect) return null;

  return createPortal(
    <div
      ref={panelRef}
      className="fixed z-[1200] w-64 max-h-[80vh] overflow-auto rounded-xl border border-slate-200 bg-white shadow-2xl p-2 animate-in fade-in slide-in-from-left-2"
      style={{ top: pos.top, left: pos.left }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* mũi nối với sidebar, căn theo tâm anchor */}
      <span
        className="pointer-events-none absolute left-[-6px]
                   border-y-[6px] border-y-transparent border-r-[6px] border-r-white"
        style={{ top: pos.arrowTop }}
      />

      <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
        {Icon ? <Icon size={14} className="text-slate-400" /> : null}
        {title}
      </div>

      <div className="space-y-0.5 mt-1">
        {items.map((it) => (
          <NavLink
            key={it.href}
            href={makeHref(it.href)}
            label={it.label}
            Icon={it.icon}
            active={isActive(it.href)}
          />
        ))}
      </div>
    </div>,
    document.body
  );
}


/* ===== Group (hỗ trợ flyout khi thu gọn) ===== */
function Group({
  title,
  Icon,
  children,
  defaultOpen,
  collapsed,
  hasActive = false,
  itemsForFlyout,
  onCollapsedHover,
  onCollapsedLeave,
}: {
  title: string;
  Icon?: LucideIcon;
  children: ReactNode;
  defaultOpen?: boolean;
  collapsed?: boolean;
  hasActive?: boolean;
  itemsForFlyout?: FlatItem[];
  onCollapsedHover?: (rect: DOMRect) => void;
  onCollapsedLeave?: () => void;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (collapsed) setOpen(false);
    else if (defaultOpen) setOpen(true);
  }, [collapsed, defaultOpen]);

  const accent = open || hasActive; // dùng chung để đồng bộ màu

  return (
    <div className="mb-1">
      <button
        ref={btnRef}
        type="button"
        title={title}
        onClick={() => !collapsed && setOpen((v) => !v)}
        onMouseEnter={() => {
          if (collapsed && itemsForFlyout?.length && btnRef.current) {
            onCollapsedHover?.(btnRef.current.getBoundingClientRect());
          }
        }}
        onMouseLeave={() => {
          if (collapsed) onCollapsedLeave?.();
        }}
        className={`relative w-full flex items-center justify-between px-3 py-2.5 rounded-r-lg text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 ease-out group
          ${collapsed ? "justify-center" : ""}
          ${
            open && !collapsed
              ? "bg-pink-50/50 text-pink-600"
              : hasActive && collapsed
              ? "bg-linear-to-r from-pink-50 via-transparent to-pink-50 text-pink-700 shadow-sm"
              : "text-slate-500 hover:text-pink-600 hover:bg-slate-50/80"
          }`}
      >
   

        {/* Nhãn/biểu tượng nhóm */}
        {!collapsed ? (
          <span className="inline-flex items-center gap-2.5 transition-all duration-300 ease-out">
            {Icon && (
              <Icon
                size={16}
                strokeWidth={accent ? 2.5 : 2}
                className={`transition-all duration-300 ease-out ${
                  accent
                    ? "text-pink-500 scale-110"
                    : "text-slate-400 group-hover:text-pink-500 group-hover:scale-105"
                }`}
              />
            )}
            <span className={`${accent ? "text-pink-600" : ""}`}>{title}</span>
          </span>
        ) : (
          Icon && (
            <span className="relative">
              <Icon
                size={18}
                strokeWidth={hasActive ? 2.5 : 2}
                className={`transition-all duration-300 ease-out ${
                  hasActive
                    ? "text-pink-600 scale-110"
                    : "text-slate-400 group-hover:text-pink-500 group-hover:scale-105"
                }`}
              />
            </span>
          )
        )}

        {/* caret */}
        {!collapsed && (
          <span
            className={`transition-transform duration-500 ease-out ${
              open ? "rotate-180" : ""
            }`}
          >
            <ChevronDown
              size={14}
              strokeWidth={2}
              className={`${
                accent
                  ? "text-pink-500"
                  : "text-slate-400 group-hover:text-pink-500"
              }`}
            />
          </span>
        )}
      </button>

      {/* danh sách con khi sidebar mở */}
      <div
        className={`grid transition-all duration-500 ease-in-out ${
          open && !collapsed
            ? "grid-rows-[1fr] opacity-100 mt-1"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-0.5 pb-1">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* ===== Main Sidebar ===== */
export default function Sidebar({
  role,
  version = "v1.0.0",
  branches,
  initialBranch,
}: {
  role: Role;
  version?: string;
  logoSrc?: string;
  branches?: string[];
  initialBranch?: string;
}) {
  const pathname = usePathname();
  const locale = (pickLocaleFromPath(pathname) ?? DEFAULT_LOCALE) as
    | "vi"
    | "en";
  const items = buildMenu(role) as AnyItem[];
  const withLocale = (p: string) => localizePath(p, locale);
  // Lấy path không kèm locale để suy ra root của role
  const pathNoLocale = pathname.replace(/^\/(vi|en)(?=\/)/, "");
  const segs = pathNoLocale.split("/").filter(Boolean);
  // /portal/admin | /portal/teacher | /portal/student | /portal/staff/management|accounting
  const roleRoot =
    segs[0] !== "portal"
      ? "/"
      : segs[1] === "staff"
      ? `/portal/staff/${segs[2] ?? ""}`
      : `/portal/${segs[1] ?? ""}`;

  const isActive = (href: string) => {
    // Nếu menu để rỗng ("") thì coi như href là roleRoot
    const rawHref = href && href.length > 0 ? href : roleRoot;
    const target = withLocale(rawHref);
    const isRootLink =
      rawHref === roleRoot ||
      /^\/(vi|en)\/?$/.test(target) || // phòng khi vô tình trỏ về /vi
      target.endsWith("/portal") || // phòng khi trỏ /vi/portal
      /\/portal\/(admin|teacher|student)$/.test(target) ||
      /\/portal\/staff\/(management|accounting)$/.test(target);

    // Root chỉ active khi trùng khít
    if (isRootLink) return pathname === target;
    // Các trang con active khi trùng khít hoặc là prefix depth
    return pathname === target || pathname.startsWith(target + "/");
  };

  const [branch, setBranch] = useState(
    initialBranch || branches?.[0] || "Chi nhánh Hồ Chí Minh"
  );
  const [branchOpen, setBranchOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Flyout state
  const [fly, setFly] = useState<{
    open: boolean;
    rect: DOMRect | null;
    title: string;
    icon?: LucideIcon;
    items: FlatItem[];
  }>({ open: false, rect: null, title: "", items: [] });

  const closeTimer = useRef<number | null>(null);
  const cancelClose = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(
      () => setFly((f) => ({ ...f, open: false })),
      120
    );
  };

  // Close mobile on route changes
  useEffect(() => setMobileOpen(false), [pathname]);

  // Close mobile if click outside
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (mobileOpen && !(e.target as Element).closest(".sidebar-container")) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [mobileOpen]);

  // Lock scroll when mobile open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      {/* Header with Logo + sticky edge toggle */}
      <div className="relative h-16 md:h-16 flex items-center justify-start lg:justify-center px-4 pl-5 lg:pl-0">
        {/* Full logo */}
        <div
          className={`absolute inset-0 flex items-center justify-start lg:justify-center pl-1 transition-all duration-500 ease-out ${
            collapsed
              ? "opacity-0 scale-90 pointer-events-none"
              : "opacity-100 scale-100 delay-100"
          }`}
        >
          <Image
            src={LOGO}
            alt="KidzGo"
            priority
            width={100}
            height={100}
            className="h-15 w-auto"
          />
        </div>

        {/* Icon-only */}
        <div
          className={`absolute inset-0 flex items-center justify-start lg:justify-center transition-all duration-500 ease-out ${
            collapsed
              ? "opacity-100 scale-100 -translate-x-1.5 delay-100"
              : "opacity-0 scale-90 pointer-events-none"
          }`}
        >
          <Image
            src={LOGO_ONLY}
            alt="KidzGo"
            priority
            width={48}
            height={48}
            className="h-12 w-13"
          />
        </div>

        {/* Toggle button */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10
               w-8 h-8 rounded-full items-center justify-center
               bg-white border border-slate-200 text-slate-400
               shadow-md hover:shadow-xl hover:text-blue-600 hover:border-blue-300
               hover:scale-110 active:scale-95
               transition-all duration-300 ease-out"
          type="button"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            size={14}
            strokeWidth={2.5}
            className={`transition-all duration-500 ease-out ${
              collapsed ? "rotate-180" : "rotate-0"
            }`}
          />
        </button>
      </div>

      <hr className="border-slate-100 transition-all duration-300" />

      {/* Branch picker */}
      {branches?.length && !collapsed ? (
        <div className="px-3 py-3">
          <div className="relative">
            <button
              onClick={() => setBranchOpen((v) => !v)}
              className="w-full inline-flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 hover:bg-linear-to-r hover:from-pink-50 hover:to-transparent hover:border-pink-300 hover:shadow-sm transition-all duration-300 ease-out group"
              type="button"
            >
              <span className="inline-flex items-center gap-2 min-w-0">
                <MapPin
                  size={16}
                  className="text-pink-500 shrink-0 group-hover:scale-110 transition-all duration-300 ease-out"
                  strokeWidth={2.5}
                />
                <span className="truncate font-medium">{branch}</span>
              </span>
              <ChevronDown
                size={16}
                className={`text-slate-400 group-hover:text-pink-500 shrink-0 transition-all duration-500 ease-out ${
                  branchOpen ? "rotate-180" : "rotate-0"
                }`}
                strokeWidth={2}
              />
            </button>

            {branchOpen && (
              <>
                <div
                  className="fixed inset-0 z-10 animate-in fade-in duration-200"
                  onClick={() => setBranchOpen(false)}
                />
                <div className="absolute z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="max-h-64 overflow-y-auto custom-scrollbar">
                    {branches.map((b, idx) => (
                      <button
                        key={b}
                        onClick={() => {
                          setBranch(b);
                          setBranchOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-all duration-200 ease-out ${
                          b === branch
                            ? "bg-linear-to-r from-pink-50 via-pink-50/80 to-transparent text-pink-700"
                            : "text-slate-700 hover:bg-linear-to-r hover:from-slate-50 hover:to-transparent hover:text-slate-900"
                        } ${
                          idx !== branches.length - 1
                            ? "border-b border-slate-100"
                            : ""
                        }`}
                        type="button"
                      >
                        <span className="flex items-center gap-2.5">
                          <span
                            className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ease-out ${
                              b === branch
                                ? "bg-pink-500 scale-125"
                                : "bg-transparent"
                            }`}
                          />
                          {b}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}

      {/* Menu */}
      <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-2 custom-scrollbar">
        <div className={collapsed ? "space-y-1" : "space-y-0.5"}>
          {items.map((it, idx) =>
            isGroup(it) ? (
              <Group
                key={`g-${idx}`}
                title={it.group}
                Icon={it.icon}
                defaultOpen={it.defaultOpen}
                collapsed={collapsed}
                hasActive={it.items.some((sub) => isActive(sub.href))}
                itemsForFlyout={it.items}
                onCollapsedHover={(rect) => {
                  // mở flyout
                  cancelClose();
                  setFly({
                    open: true,
                    rect,
                    title: it.group,
                    icon: it.icon,
                    items: it.items,
                  });
                }}
                onCollapsedLeave={scheduleClose}
              >
                {it.items.map((sub) => (
                  <NavLink
                    key={sub.href}
                    href={withLocale(sub.href)}
                    label={sub.label}
                    Icon={sub.icon}
                    active={isActive(sub.href)}
                    depth={1}
                    collapsed={collapsed}
                  />
                ))}
              </Group>
            ) : (
              // Flat item: thêm tooltip Material khi thu gọn
              <Tooltip
                key={(it as FlatItem).href}
                title={(it as FlatItem).label}
                placement="right"
                arrow
                enterDelay={150}
                disableHoverListener={!collapsed}
              >
                <span className="block">
                  <NavLink
                    href={withLocale((it as FlatItem).href)}
                    label={(it as FlatItem).label}
                    Icon={(it as FlatItem).icon}
                    active={isActive((it as FlatItem).href)}
                    collapsed={collapsed}
                  />
                </span>
              </Tooltip>
            )
          )}
        </div>
      </nav>

      {/* Footer */}
      <div
        className={`border-t border-slate-200 transition-all duration-500 ${
          collapsed ? "px-2 py-3" : "px-4 py-3"
        }`}
      >
        {!collapsed ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                Hệ thống KidzGo
              </span>
            </div>

            <div className="text-[10px] text-slate-400">
              Phiên bản{" "}
              <span className="font-medium text-slate-500">{version}</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[9px] text-slate-400 font-medium">
              {version}
            </span>
          </div>
        )}
      </div>

      {/* Flyout (portal) */}
      <Flyout
        open={collapsed && fly.open}
        anchorRect={fly.rect}
        title={fly.title}
        Icon={fly.icon}
        items={fly.items}
        makeHref={withLocale}
        isActive={isActive}
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
      />
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2.5 rounded-xl bg-white shadow-lg border border-slate-200 text-slate-600 hover:bg-pink-50 hover:border-pink-300 hover:text-pink-600 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 ease-out"
        type="button"
        aria-label="Mở menu"
      >
        <Menu size={24} strokeWidth={2} />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`sidebar-container h-screen sticky top-0 shrink-0 border-r border-slate-200 bg-white/98 backdrop-blur-xl flex flex-col shadow-xl lg:shadow-sm transition-all duration-500 ease-out
          ${collapsed ? "w-[72px]" : "w-[280px]"}
          lg:translate-x-0 lg:relative
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          fixed lg:sticky z-50 lg:z-auto
        `}
      >
        {/* Close button for mobile */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all duration-300 ease-out z-10"
          type="button"
          aria-label="Đóng menu"
        >
          <X size={20} strokeWidth={2} />
        </button>

        {sidebarContent}
      </aside>

      {/* Global styles for scrollbar & animations */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgb(203 213 225 / 0.4);
          border-radius: 100px;
          transition: background 0.3s ease-out;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgb(148 163 184 / 0.7);
        }

        @keyframes slide-in-from-top-2 {
          from {
            transform: translateY(-0.5rem);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes slide-in-from-left-2 {
          from {
            transform: translateX(-8px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-in {
          animation-fill-mode: both;
        }
        .fade-in {
          animation-name: fadeIn;
        }
        .slide-in-from-top-2 {
          animation-name: slide-in-from-top-2;
          animation-duration: 0.25s;
        }
        .slide-in-from-left-2 {
          animation-name: slide-in-from-left-2;
          animation-duration: 0.22s;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .sidebar-container {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>
    </>
  );
}
