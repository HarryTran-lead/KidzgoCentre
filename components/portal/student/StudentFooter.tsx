"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function StudentFooter() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Show footer when mouse is within 150px from bottom
      const distanceFromBottom = window.innerHeight - e.clientY;
      if (distanceFromBottom < 150) {
        setIsVisible(true);
      } else if (distanceFromBottom > 200) {
        setIsVisible(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const footerItems = [
    {
      href: "/portal/student/profile",
      icon: "/icons/user.png",
      label: "Hồ sơ",
      badge: null,
    },
    {
      href: "/portal/student/rewards",
      icon: "/icons/gift.png",
      label: "Đổi thưởng",
      badge: null,
    },
    {
      href: "/portal/student/resources",
      icon: "/icons/folder.png",
      label: "Tài Liệu",
      badge: null,
    },
    // {
    //   href: "/portal/student/report",
    //   icon: "/icons/chart.png",
    //   label: "Báo cáo",
    //   badge: null,
    // },
    {
      href: "/portal/student/test",
      icon: "/icons/test.png",
      label: "Kiểm tra",
      badge: null,
    },
  ];

  return (
    <>
      {/* Home Button - Fixed ở góc dưới trái */}
      <Link href="/">
        <div
          className={`fixed bottom-4 left-13 z-[100] flex flex-col items-center gap-2 transition-all duration-300 ${
            isActive("/") && !pathname.includes("/")
              ? "scale-110"
              : "hover:scale-110"
          }`}
        >
          <div
            className={`relative flex flex-col items-center justify-center w-15 h-15 rounded-t-3xl transition-all duration-300 ${
              isActive("/") && !pathname.includes("/")
                ? ""
                : ""
            } `}
          >
            <div className="relative">
              <Image
                src="/icons/house.png"
                alt="Home"
                width={40}
                height={40}
                className="w-10 h-10 drop-shadow-lg"
              />
            </div>
          </div>
          <span className="text-xs font-bold text-white drop-shadow-md">Home</span>
        </div>
      </Link>

      {/* Footer Navigation */}
      <div
        className={`fixed bottom-0 left-32 z-[90] transition-transform duration-500 ease-out ${
          isVisible ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ width: "auto" }}
      >
        <div className="flex flex-row gap-3 px-2 pb-0">
          {footerItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className={`relative flex flex-col items-center gap-1.5 px-4 pt-4 pb-6 rounded-t-3xl transition-all duration-300 ${
                  isActive(item.href)
                    ? "bg-gradient-to-b from-purple-500/90 to-purple-600/95 shadow-[0_-4px_20px_rgba(168,85,247,0.6)] scale-105 -translate-y-1"
                    : "bg-gradient-to-b from-purple-600/80 to-purple-700/85 hover:from-purple-500/85 hover:to-purple-600/90 hover:scale-105 hover:-translate-y-1 hover:shadow-[0_-4px_16px_rgba(168,85,247,0.5)]"
                } backdrop-blur-md border-t-2 border-x-2 border-white/20`}
              >
                <div className="relative">
                  <div className={`relative animate-pulse`}>
                    <Image
                      src={item.icon}
                      alt={item.label}
                      width={40}
                      height={40}
                      className="w-10 h-10 drop-shadow-lg"
                    />
                  </div>
                  {item.badge ? (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] flex items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-1.5 text-[10px] font-bold text-white border-2 border-white shadow-lg animate-pulse">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
                
                <span className="text-[11px] font-bold text-white drop-shadow-md truncate max-w-full">
                  {item.label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
