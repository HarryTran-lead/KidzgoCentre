// components/portal/sidebar/StudentSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { MenuItem } from "../menu/types";
import { pickLocaleFromPath, DEFAULT_LOCALE, localizePath } from "@/lib/i18n";


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
  gradient = "from-[#6d28d9] via-[#7c3aed] to-[#a855f7]"
}: {
  label: string;
  active?: boolean;
  iconSrc: string;
  badge?: string | number;
  gradient?: string;
}) {
  return (
    <div className="group relative flex flex-col items-center justify-center gap-1.5 transition-all duration-300 hover:-translate-y-1">
      {/* Icon Container */}
      <div
        className={`relative grid place-items-center h-12 w-12 rounded-[12px] transition-all duration-300 shadow-lg ${
          active
            ? `bg-gradient-to-br ${gradient} scale-110 shadow-2xl shadow-purple-500/70 animate-pulse ring-2 ring-white/30`
            : `bg-gradient-to-br ${gradient} group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-purple-400/40 group-hover:rotate-3`
        }`}
        style={active ? {
          boxShadow: '0 0 16px rgba(251, 191, 36, 0.6), 0 0 32px rgba(251, 191, 36, 0.3), 0 8px 20px rgba(251, 191, 36, 0.4)'
        } : undefined}
      >
        {/* Glow effect bên trong */}
        <div className={`absolute inset-0 rounded-[12px] bg-gradient-to-t from-white/0 to-white/20 ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`} />
        
        <Image
          src={iconSrc}
          alt={label}
          width={24}
          height={24}
          className="relative z-10 transition-transform duration-300 group-hover:scale-125 drop-shadow-lg"
        />
        
        {/* Badge */}
        {badge ? (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400 px-1 text-center text-[10px] font-bold text-white shadow-lg border-2 border-white/50">
            {badge}
          </span>
        ) : null}

        {/* Sparkle effect khi active */}
        {active && (
          <>
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-white rounded-full animate-ping opacity-75" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-cyan-300 rounded-full animate-ping opacity-75" style={{ animationDelay: '0.5s' }} />
          </>
        )}
      </div>

      {/* Label */}
      <div className="text-center w-full px-0.5">
        <div
          className={`text-[10px] font-bold text-white drop-shadow-md truncate transition-all leading-tight ${
            active 
              ? "scale-105 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" 
              : "group-hover:scale-110 group-hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]"
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
  roleRoot,
  version = "v1.0.0",
}: {
  roleRoot: string;
  version?: string;
}) {
  const pathname = usePathname();
  const locale = (pickLocaleFromPath(pathname) ?? DEFAULT_LOCALE) as "vi" | "en";
  const withLocale = (p: string) => localizePath(p, locale);

  const [mobileOpen, setMobileOpen] = useState(false);

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

  // Define main navigation items
  const mainNav = [
    { 
      label: "Tất cả", 
      href: roleRoot, 
      iconSrc: "/icons/house.png",
    },
    {
      label: "Lịch học",
      href: `${roleRoot}/schedule`,
      iconSrc: "/icons/schedule.png",
      badge: 2,
    },
    { 
      label: "Bài tập", 
      href: `${roleRoot}/homework`, 
      iconSrc: "/icons/homework.png",
      badge: 2,
    },
    {
      label: "AI Tutor",
      href: `${roleRoot}/ai-tutor`,
      iconSrc: "/icons/quest.png",
    },
    {
      label: "AI Speaking",
      href: `${roleRoot}/ai-speaking`,
      iconSrc: "/icons/phone.png",
    },
    { 
      label: "Nhiệm vụ", 
      href: `${roleRoot}/gamification`,
      iconSrc: "/icons/mushroom.png",
    },
    { 
      label: "Media", 
      href: `${roleRoot}/media`,
      iconSrc: "/icons/gallery.png",
    },
    { 
      label: "Ứng dụng", 
      href: `${roleRoot}/application`,
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
        className={`relative h-full w-[90px] shrink-0 overflow-y-auto overflow-x-hidden text-white transition-all duration-500 lg:sticky lg:top-0 fixed top-0 left-0 z-80 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >

        {/* Close button (mobile) */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden absolute top-3 right-3 z-[90] rounded-xl bg-white/10 p-2 text-white backdrop-blur hover:bg-white/20 active:scale-95 transition-all border border-white/20"
          aria-label="Đóng menu"
          type="button"
        >
          <X size={18} />
        </button>

        {/* Content */}
        <div className="relative flex flex-col h-full gap-1.5 px-1 pb-2 pt-2">
          {/* Navigation Items */}
          <div className="flex-1 flex flex-col justify-start space-y-4 py-4">
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

          {/* Version info */}
          <div className="text-center py-3">
            <p className="text-[8px] text-white/40 font-mono tracking-wider">
              {version}
            </p>
          </div>
        </div>
      </aside>

      <style jsx global>{`
        /* Hide scrollbar but keep functionality */
        .overflow-y-auto {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }
        
        .overflow-y-auto::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
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