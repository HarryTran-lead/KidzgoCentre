// components/portal/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  useLayoutEffect,
  useState,
  useEffect,
  useRef,
  useMemo,
  type ReactNode,
} from "react";
import {
  ChevronDown,
  MapPin,
  X,
  ChevronLeft,
  Star,
  CalendarDays,
  CheckSquare,
  UserRound,
  FileText,
  BellRing,
  BookOpen,
} from "lucide-react";
import { buildMenu } from "../menu/index";
import type { Role } from "@/lib/role";
import { pickLocaleFromPath, DEFAULT_LOCALE, localizePath } from "@/lib/i18n";
import type { LucideIcon } from "lucide-react";
import { LOGO, LOGO_ONLY } from "@/lib/theme/theme";
import Tooltip from "@mui/material/Tooltip";
import { createPortal } from "react-dom";
import ChildSelector from "../parent/ChildSelector";

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
const isGroup = (x: AnyItem): x is GroupItem =>
  Array.isArray((x as any)?.items);

/* ============ Student helpers ============ */
function flattenStudentItems(items: AnyItem[]): FlatItem[] {
  const result: FlatItem[] = [];
  for (const it of items) {
    if (isGroup(it)) result.push(...it.items);
    else result.push(it);
  }
  return result;
}

function StudentIconButton({
  label,
  active,
  Icon,
  badge,
  collapsed,
}: {
  label: string;
  active?: boolean;
  Icon: LucideIcon;
  badge?: string | number;
  collapsed?: boolean;
}) {
  const core = (
    <div
      className={`relative flex items-center rounded-2xl px-3 py-2 transition-all duration-300 ${
        collapsed ? "justify-center" : "gap-3"
      } ${
        active
          ? "bg-white/20 shadow-[0_12px_30px_rgba(93,63,211,0.35)]"
          : "bg-white/10 hover:bg-white/15"
      }`}
    >
      <div
        className={`relative grid h-12 w-12 place-items-center rounded-2xl text-white shadow-lg transition-transform ${
          active ? "scale-105" : ""
        } bg-gradient-to-br from-[#5c4fe0] via-[#6c5bf5] to-[#9f6bff]`}
      >
        <Icon size={22} strokeWidth={2.4} />
        {badge ? (
          <span className="absolute -top-1 -right-1 min-w-[20px] rounded-full bg-rose-500 px-1 text-center text-[11px] font-bold leading-5 shadow-md">
            {badge}
          </span>
        ) : null}
      </div>

      {!collapsed && (
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white drop-shadow-sm truncate">
            {label}
          </div>
          <div className="text-[11px] text-white/70">Mở nhanh</div>
        </div>
      )}
    </div>
  );

  return collapsed ? (
    <Tooltip title={label} placement="right" arrow enterDelay={150}>
      <span className="block">{core}</span>
    </Tooltip>
  ) : (
    core
  );
}

function StudentBottomNav({
  items,
  isActive,
  makeHref,
}: {
  items: { label: string; href: string; Icon: LucideIcon; tag?: string }[];
  isActive: (href: string) => boolean;
  makeHref: (p: string) => string;
}) {
  return (
    <div className="mt-auto rounded-3xl border border-white/20 bg-white/10 p-3 shadow-[0_14px_50px_rgba(93,63,211,0.35)] backdrop-blur">
      <div className="grid grid-cols-4 gap-2">
        {items.map((it) => (
          <Link
            key={it.href}
            href={makeHref(it.href)}
            className={`group relative flex flex-col items-center gap-1 rounded-2xl bg-gradient-to-br from-[#f6f0ff] to-[#e9ddff] px-2 py-2 text-center shadow-inner transition hover:-translate-y-1 ${
              isActive(it.href) ? "ring-2 ring-white/70" : ""
            }`}
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#7cc7ff] to-[#8064ff] text-white shadow-lg">
              <it.Icon size={18} strokeWidth={2.3} />
            </div>
            <div className="text-[11px] font-semibold text-[#311f7b]">
              {it.label}
            </div>
            {it.tag ? (
              <span className="absolute -right-1 -top-1 rounded-full bg-emerald-400 px-1.5 text-[9px] font-bold text-white shadow">
                {it.tag}
              </span>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  );
}

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
      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300 ease-out ${
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
      <span
        className={`absolute left-0 top-1/2 -translate-y-1/2 h-full w-0.5 bg-linear-to-b from-pink-400 via-pink-500 to-red-500 transition-all duration-300 ease-out ${
          active ? "opacity-100 scale-100" : "opacity-0 scale-y-50"
        }`}
      />

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

  useLayoutEffect(() => {
    if (!open || !anchorRect) return;

    const GAP_X = 6;
    const PAD = 12;

    const measure = () => {
      const flyH = panelRef.current?.offsetHeight ?? 0;
      const left = anchorRect.right + GAP_X;

      let top = anchorRect.top + anchorRect.height / 2 - flyH / 2;
      top = Math.max(PAD, Math.min(top, window.innerHeight - PAD - flyH));

      const anchorCenter = anchorRect.top + anchorRect.height / 2;
      let arrowTop = anchorCenter - top;
      arrowTop = Math.max(12, Math.min(arrowTop, Math.max(12, flyH - 12)));

      setPos({ top, left, arrowTop });
    };

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
      className="fixed z-1200 w-64 max-h-[80vh] overflow-auto rounded-xl border border-slate-200 bg-white shadow-2xl p-2 animate-in fade-in slide-in-from-left-2"
      style={{ top: pos.top, left: pos.left }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <span
        className="pointer-events-none absolute -left-1.5 border-y-[6px] border-y-transparent border-r-[6px] border-r-white"
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

/* ===== Group ===== */
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

  const accent = open || hasActive;

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
        className={`relative w-full flex items-center justify-between px-3 py-2.5 rounded-r-lg text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 ease-out group ${
          collapsed ? "justify-center" : ""
        } ${
          open && !collapsed
            ? "bg-pink-50/50 text-pink-600"
            : hasActive && collapsed
              ? "bg-linear-to-r from-pink-50 via-transparent to-pink-50 text-pink-700 shadow-sm"
              : "text-slate-500 hover:text-pink-600 hover:bg-slate-50/80"
        }`}
      >
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
  const locale = (pickLocaleFromPath(pathname) ?? DEFAULT_LOCALE) as "vi" | "en";
  const items = useMemo(
    () => buildMenu(role, locale) as AnyItem[],
    [role, locale]
  );
  const withLocale = (p: string) => localizePath(p, locale);

  const pathNoLocale = pathname.replace(/^\/(vi|en)(?=\/)/, "");
  const segs = pathNoLocale.split("/").filter(Boolean);
  const roleRoot =
    segs[0] !== "portal"
      ? "/"
      : segs[1] === "staff"
        ? `/portal/staff/${segs[2] ?? ""}`
        : `/portal/${segs[1] ?? ""}`;

  const isActive = (href: string) => {
    const rawHref = href && href.length > 0 ? href : roleRoot;
    const target = withLocale(rawHref);

    const isRootLink =
      rawHref === roleRoot ||
      /^\/(vi|en)\/?$/.test(target) ||
      target.endsWith("/portal") ||
      /\/portal\/(admin|teacher|student)$/.test(target) ||
      /\/portal\/staff\/(management|accounting)$/.test(target);

    if (isRootLink) return pathname === target;
    return pathname === target || pathname.startsWith(target + "/");
  };

  const [branch, setBranch] = useState(
    initialBranch || branches?.[0] || "Chi nhánh Hồ Chí Minh"
  );
  const [branchOpen, setBranchOpen] = useState(false);

  // default mở rộng
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navRef = useRef<HTMLDivElement | null>(null);
  const [topScrolled, setTopScrolled] = useState(false);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setTopScrolled(el.scrollTop > 0);
        ticking = false;
      });
    };

    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

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

  useEffect(() => setMobileOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const open = () => setMobileOpen(true);
    window.addEventListener("portal:sidebar-open", open);
    return () => window.removeEventListener("portal:sidebar-open", open);
  }, []);

  /* ===================== STUDENT SPECIAL SIDEBAR ===================== */
  const isStudent = role === "STUDENT";

  if (isStudent) {
    const flattened = flattenStudentItems(items);

    const homeLink = flattened[0];
    const scheduleLink = flattened[1];
    const attendanceLink = flattened[2];
    const homeworkLink = flattened[3];

    const reportLink =
      flattened.find((it) => it.href.includes("/reports")) ??
      flattened.find((it) => it.href.includes("/tests"));

    const noticeLink = flattened.find((it) => it.href.includes("/notifications"));

    const topNav = [
      { label: "All", href: homeLink?.href ?? roleRoot, Icon: Star },
      {
        label: "Lịch học",
        href: scheduleLink?.href ?? roleRoot,
        Icon: CalendarDays,
        badge: 2,
      },
      {
        label: "Điểm danh",
        href: attendanceLink?.href ?? roleRoot,
        Icon: CheckSquare,
        badge: 2,
      },
      { label: "Hồ sơ", href: homeworkLink?.href ?? roleRoot, Icon: UserRound },
      { label: "Tài liệu", href: homeworkLink?.href ?? roleRoot, Icon: BookOpen },
      { label: "Báo cáo", href: reportLink?.href ?? roleRoot, Icon: FileText },
      {
        label: "Thông báo",
        href: noticeLink?.href ?? roleRoot,
        Icon: BellRing,
        badge: 2,
      },
    ];

    const bottomNav = [
      {
        label: "Lịch học",
        href: scheduleLink?.href ?? roleRoot,
        Icon: CalendarDays,
        tag: "BETA",
      },
      {
        label: "Điểm danh",
        href: attendanceLink?.href ?? roleRoot,
        Icon: CheckSquare,
      },
      { label: "Hồ sơ", href: homeworkLink?.href ?? roleRoot, Icon: UserRound },
      { label: "Bài tập", href: homeworkLink?.href ?? roleRoot, Icon: BookOpen },
    ];

    return (
      <>
        {mobileOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-70 animate-in fade-in duration-300"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <aside
          className={`relative h-screen shrink-0 overflow-hidden bg-gradient-to-b from-[#1c0f5d] via-[#2b0f6c] to-[#16093f] text-white shadow-[12px_0_40px_rgba(35,17,111,0.35)] transition-all duration-500 ${
            collapsed ? "w-[102px]" : "w-[280px]"
          } fixed top-0 left-0 z-80 lg:sticky lg:translate-x-0 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(236,72,153,0.18),transparent_40%),radial-gradient(circle_at_50%_80%,rgba(129,140,248,0.16),transparent_45%)]" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22 viewBox=%220 0 40 40%22%3E%3Ccircle cx=%222%22 cy=%222%22 r=%222%22 fill=%22%23ffffff%22 opacity=%220.12%22/%3E%3C/svg%3E')]" />

          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden absolute top-4 right-4 z-[90] rounded-xl bg-white/10 p-2 text-white backdrop-blur hover:bg-white/20 active:scale-95 transition-all"
            aria-label="Đóng menu"
            type="button"
          >
            <X size={18} />
          </button>

          <div className="relative flex flex-col h-full gap-4 px-3 py-4">
            <div className="relative flex items-center justify-center">
              <Image
                src={collapsed ? LOGO_ONLY : LOGO}
                alt="KidzGo"
                width={collapsed ? 52 : 140}
                height={60}
                className="h-12 w-auto drop-shadow-[0_10px_25px_rgba(255,255,255,0.25)]"
                priority
              />

              <button
                onClick={() => setCollapsed((v) => !v)}
                type="button"
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                className={`hidden lg:flex absolute right-2 top-1/2 -translate-y-1/2 z-[80]
                  w-8 h-8 rounded-full items-center justify-center
                  bg-white/10 border border-white/20 text-white/90
                  shadow-md hover:shadow-xl hover:bg-white/15
                  hover:scale-110 active:scale-95
                  transition-all duration-300 ease-out`}
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

            <div className="flex-1 space-y-2 overflow-y-auto pb-2 custom-scrollbar">
              {topNav.map((nav) => (
                <Link key={nav.label} href={withLocale(nav.href)}>
                  <StudentIconButton
                    Icon={nav.Icon}
                    label={nav.label}
                    active={isActive(nav.href)}
                    badge={(nav as any).badge}
                    collapsed={collapsed}
                  />
                </Link>
              ))}
            </div>

            <StudentBottomNav
              items={bottomNav}
              isActive={isActive}
              makeHref={withLocale}
            />
          </div>
        </aside>

        <style jsx global>{`
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
        `}</style>
      </>
    );
  }

  /* ===================== DEFAULT SIDEBAR (OTHER ROLES) ===================== */
  const sidebarContent = (
    <>
      <div className="relative h-16 md:h-16 flex items-center justify-start lg:justify-center px-4 pl-5 lg:pl-0">
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

        <button
          onClick={() => setCollapsed((v) => !v)}
          type="button"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-80 pointer-events-auto
            w-8 h-8 rounded-full items-center justify-center
            bg-white border border-slate-200 text-slate-400
            shadow-md hover:shadow-xl hover:text-blue-600 hover:border-blue-300
            hover:scale-110 active:scale-95
            transition-all duration-300 ease-out`}
        >
          <ChevronLeft
            size={14}
            strokeWidth={2.5}
            className={`transition-all duration-500 ease-out ${
              collapsed ? "rotate-180" : "rotate-0"
            }`}
          />
        </button>

        <hr
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 -bottom-px m-0 border-0 border-t border-slate-200 transition-opacity duration-200 ${
            topScrolled ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>

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

      {role === "PARENT" && !collapsed && (
        <div className="px-3 py-2">
          <ChildSelector />
        </div>
      )}

      <nav
        ref={navRef}
        className="flex-1 min-h-0 overflow-y-auto px-3 pt-3 custom-scrollbar"
        onScroll={(e) =>
          setTopScrolled((e.currentTarget as HTMLDivElement).scrollTop > 0)
        }
      >
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
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-70 animate-in fade-in duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`bg-white h-screen shrink-0 flex flex-col shadow-xl transition-all duration-500 ease-out border-r border-slate-200 ${
          collapsed ? "w-[72px]" : "w-[280px]"
        } fixed top-0 left-0 z-80 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:sticky lg:translate-x-0 lg:z-60`}
      >
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

      <style jsx global>{`
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
