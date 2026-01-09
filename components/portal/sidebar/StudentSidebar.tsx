// components/portal/sidebar/StudentSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { MenuItem } from "../menu/types";
import { pickLocaleFromPath, DEFAULT_LOCALE, localizePath } from "@/lib/i18n";
import { LOGO, LOGO_ONLY } from "@/lib/theme/theme";

/* ===== Types ===== */
type FlatItem = {
  label: string;
  icon: any;
  href: string;
};

type GroupItem = {
  group: string;
  icon?: any;
  defaultOpen?: boolean;
  items: FlatItem[];
};

type AnyItem = FlatItem | GroupItem;

const isGroup = (x: AnyItem): x is GroupItem =>
  Array.isArray((x as any)?.items);

/* ===== Helper Functions ===== */
function flattenStudentItems(items: AnyItem[]): FlatItem[] {
  const result: FlatItem[] = [];
  for (const it of items) {
    if (isGroup(it)) result.push(...it.items);
    else result.push(it);
  }
  return result;
}

/* ===== Student Icon Button Component ===== */
function StudentIconButton({
  label,
  active,
  iconSrc,
  badge,
}: {
  label: string;
  active?: boolean;
  iconSrc: string;
  badge?: string | number;
}) {
  return (
    <div className="group relative flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:-translate-y-1">
      {/* Icon Container với 3D effect */}
      <div
        className={`relative grid place-items-center h-16 w-16 rounded-[18px] transition-all duration-300 shadow-lg ${
          active
            ? "bg-gradient-to-br from-[#7c3aed] via-[#a855f7] to-[#c084fc] scale-110 shadow-purple-500/50 animate-pulse"
            : "bg-gradient-to-br from-[#6d28d9] via-[#7c3aed] to-[#a855f7] group-hover:scale-110 group-hover:shadow-purple-400/60 group-hover:rotate-3"
        }`}
      >
        <Image
          src={iconSrc}
          alt={label}
          width={34}
          height={34}
          className="relative z-10 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12"
        />
        
        {/* Badge */}
        {badge ? (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400 px-1 text-center text-[10px] font-bold text-white shadow-lg border-2 border-white/50 animate-pulse">
            {badge}
          </span>
        ) : null}
      </div>

      {/* Label bên dưới */}
      <div className="text-center w-full px-0.5">
        <div
          className={`text-xs font-bold text-white drop-shadow-md truncate transition-all leading-tight ${
            active ? "scale-105" : "group-hover:scale-110"
          }`}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

/* ===== Main Student Sidebar Component ===== */
export default function StudentSidebar({
  items,
  roleRoot,
  version = "v1.0.0",
}: {
  items: MenuItem[];
  roleRoot: string;
  version?: string;
}) {
  const pathname = usePathname();
  const locale = (pickLocaleFromPath(pathname) ?? DEFAULT_LOCALE) as "vi" | "en";
  const withLocale = (p: string) => localizePath(p, locale);

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

  const [mobileOpen, setMobileOpen] = useState(false);

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

  // Flatten and prepare navigation items
  const flattened = flattenStudentItems(items as any);

  const allLink = flattened[0]; // Tất cả
  const scheduleLink = flattened[1]; // Lịch học
  const homeworkLink = flattened[3]; // Bài tập
  
  const gamificationLink = flattened.find((it) => it.href.includes("/missions") || it.href.includes("/streak"));
  const mediaLink = flattened.find((it) => it.href.includes("/media"));
  const communicationsLink = flattened.find((it) => it.href.includes("/messages") || it.href.includes("/notifications"));

  const mainNav = [
    { 
      label: "Tất cả", 
      href: allLink?.href ?? roleRoot, 
      iconSrc: "/icons/crown.png",
    },
    {
      label: "Lịch học",
      href: scheduleLink?.href ?? roleRoot,
      iconSrc: "/icons/schedule.png",
      badge: 2,
    },
    { 
      label: "Bài tập", 
      href: homeworkLink?.href ?? roleRoot, 
      iconSrc: "/icons/homework.png",
      badge: 2,
    },
    { 
      label: "Gamification", 
      href: gamificationLink?.href ?? roleRoot, 
      iconSrc: "/icons/mushroom.png",
    },
    { 
      label: "Media", 
      href: mediaLink?.href ?? roleRoot, 
      iconSrc: "/icons/gallery.png",
    },
    { 
      label: "Giao tiếp", 
      href: communicationsLink?.href ?? roleRoot, 
      iconSrc: "/icons/comunication.png",
    },
  ];

  return (
    <>
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-70 animate-in fade-in duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`relative h-full w-[130px] shrink-0 overflow-hidden text-white transition-all duration-500 lg:sticky lg:top-0 fixed top-0 left-0 z-80 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >

        {/* Close button (mobile) */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden absolute top-2 left-2 z-[90] rounded-xl bg-white/10 p-2 text-white backdrop-blur hover:bg-white/20 active:scale-95 transition-all border border-white/20"
          aria-label="Đóng menu"
          type="button"
        >
          <X size={18} />
        </button>

        {/* Content */}
        <div className="relative flex flex-col h-full gap-3 px-2 pb-4 pt-4">
          {/* Navigation Items */}
          <div className="flex-1 flex flex-col justify-center space-y-4 overflow-y-auto scrollbar-hide">
            {mainNav.map((nav, index) => (
              <Link key={nav.label} href={withLocale(nav.href)}>
                <div 
                  className="animate-in fade-in slide-in-from-left duration-700"
                  style={{ 
                    animationDelay: `${index * 80}ms`,
                    animationFillMode: 'both'
                  }}
                >
                  <StudentIconButton
                    iconSrc={nav.iconSrc}
                    label={nav.label}
                    active={isActive(nav.href)}
                    badge={(nav as any).badge}
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </aside>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideInFromLeft {
          from {
            transform: translateX(-20px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-in {
          animation-fill-mode: both;
        }
        .fade-in {
          animation-name: fadeIn;
        }
        .slide-in-from-left {
          animation-name: slideInFromLeft;
        }
      `}</style>
    </>
  );
}
