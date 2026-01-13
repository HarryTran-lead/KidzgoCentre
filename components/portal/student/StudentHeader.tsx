// components/portal/student/StudentHeader.tsx
"use client";

import { ChevronDown, User, LogOut, Star, Sparkles } from "lucide-react";
import Image from "next/image";
import { LOGO } from "@/lib/theme/theme";
import { useState, useMemo, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type StudentHeaderProps = {
  userName?: string;
  avatarUrl?: string;
};

export default function StudentHeader({
  userName,
  avatarUrl,
}: StudentHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  // Extract locale from pathname
  const locale = useMemo(() => {
    const parts = pathname.split('/');
    return parts[1] || 'vi'; // Default to 'vi' if no locale found
  }, [pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!isDropdownOpen) return;
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !popRef.current?.contains(t)) {
        setIsDropdownOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsDropdownOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [isDropdownOpen]);

  // Close when route changes
  useEffect(() => setIsDropdownOpen(false), [pathname]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsDropdownOpen(false);
    setIsLoggingOut(true);
    await new Promise((r) => setTimeout(r, 700));
    window.location.replace("/");
  };

  return (
    <div className="relative z-10 px-4 sm:px-6 pt-2 pb-2">
      <div className="flex justify-between items-center">
        {/* Logo section */}
        <div className="flex items-center">
          <Image
            src={LOGO}
            alt="KidzGo Logo"
            width={130}
            height={90}
            className="drop-shadow-[0_4px_12px_rgba(255,255,255,0.3)]"
            priority
          />
        </div>

        {/* User info section */}
        <div className="flex items-center">
          {/* Header hoa quyen - 1 thanh dai chung border */}
          <div className="flex items-center rounded-full">
            {/* Stats badges section */}
            <div className="flex items-center gap-4 bg-transparent px-5 py-3">
              {/* Stars */}
              <Star className="w-8 h-8 text-yellow-400" fill="currentColor" />
              <div className="text-lg font-black text-white drop-shadow-md">
                  3,636
                </div>

              {/* Chuoi ngay */}
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center">
                  <Image
                    src="/icons/fire.png"
                    alt="Fire"
                    width={30}
                    height={30}
                  />
                </div>
                <div className="text-lg font-black text-white drop-shadow-md">
                  36 ngày
                </div>
              </div>
            </div>

            {/* Profile section - noi lien */}
            <div className="relative">
              <button
                ref={btnRef}
                onClick={() => !isLoggingOut && setIsDropdownOpen(!isDropdownOpen)}
                className={`group relative flex items-center gap-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 transition-all duration-300 ${
                  isLoggingOut ? "cursor-wait opacity-90" : "hover:bg-white/20 hover:shadow-lg"
                }`}
                aria-haspopup="menu"
                aria-expanded={isDropdownOpen}
                disabled={isLoggingOut}
              >
                {/* Avatar với effect */}
                <div className="relative">
                  <div className="relative rounded-full p-[2px] bg-gradient-to-br from-cyan-400 via-blue-400 to-purple-400 shadow-lg">
                    <div className="relative h-[52px] w-[52px] rounded-full overflow-hidden bg-indigo-900">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt={userName ?? "Student"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xl font-black text-white">
                          {(userName ?? "N")[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Status indicator hoặc loading spinner */}
                  {!isLoggingOut && (
                    <span className="absolute -bottom-0.5 right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
                  )}
                  {isLoggingOut && (
                    <span className="pointer-events-none absolute inset-[-3px] rounded-full border-2 border-transparent border-t-yellow-400 animate-spin" />
                  )}
                  
                  {/* Sparkle effect khi mở dropdown */}
                  {!isLoggingOut && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={
                        isDropdownOpen
                          ? { scale: 1, rotate: 0 }
                          : { scale: 0, rotate: -180 }
                      }
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      className="absolute -top-1 -right-1"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-yellow-400 fill-yellow-300" />
                    </motion.div>
                  )}
                </div>

                {/* Name & Level - thu gọn trong 1 khối */}
                <div className="flex flex-col items-start gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-white drop-shadow-md truncate max-w-[140px]">
                      {isLoggingOut ? "Đang đăng xuất..." : userName ?? "Nguyen Van An"}
                    </span>
                    {!isLoggingOut && (
                      <motion.div
                        animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <ChevronDown
                          size={16}
                          className="text-white/80 transition-transform"
                        />
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Experience bar thu gọn */}
                  <div className="w-full">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-bold text-yellow-300">Level 12</span>
                    </div>
                    <div className="relative h-1.5 w-[140px] bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                        style={{ width: '85%' }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                        850 / 1000
                      </span>
                    </div>
                  </div>
                </div>
              </button>

              {/* Dropdown Menu với Framer Motion */}
              <AnimatePresence>
                {isDropdownOpen && !isLoggingOut && (
                  <>
                    {/* Backdrop */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-40 bg-black/20"
                      onClick={() => setIsDropdownOpen(false)}
                    />

                    {/* Menu */}
                    <motion.div
                      ref={popRef}
                      role="menu"
                      initial={{
                        opacity: 0,
                        scale: 0.95,
                        y: -10,
                      }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{
                        opacity: 0,
                        scale: 0.95,
                        y: -10,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                        mass: 0.8,
                      }}
                      className="absolute -right-2 mt-4 w-[280px] rounded-4xl border border-gray-200 bg-white shadow-xl z-50 overflow-hidden"
                    >
                      {/* Header */}
                      <div className="relative px-6 py-4 bg-linear-to-br from-purple-500 via-blue-500 to-purple-600 border-b border-gray-100">
                        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
                        <div className="relative">
                          <p className="text-base font-bold text-white mb-1">
                            {userName ?? "Nguyễn Văn An"}
                          </p>
                          <p className="text-xs text-white/80 truncate mb-2">
                            {userName?.toLowerCase().replace(/\s+/g, '.')}@example.com
                          </p>
                          <motion.span
                            initial={{ scale: 0, x: -20 }}
                            animate={{ scale: 1, x: 0 }}
                            transition={{
                              delay: 0.1,
                              type: "spring",
                              stiffness: 300,
                            }}
                            className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-[10px] px-2.5 py-1 shadow-sm uppercase tracking-wide text-white font-bold"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            Học sinh
                          </motion.span>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <nav className="py-2 px-2">
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            delay: 0.05,
                            type: "spring",
                            stiffness: 300,
                          }}
                        >
                          <Link href={`/${locale}/portal/student/profile`}>
                            <button className="group w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-xl transition-all duration-200">
                              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-50 group-hover:bg-purple-100 transition-colors duration-200">
                                <User size={16} />
                              </div>
                              <span>Hồ sơ cá nhân</span>
                              <motion.div
                                initial={{ x: -5, opacity: 0 }}
                                whileHover={{ x: 0, opacity: 1 }}
                                className="ml-auto"
                              >
                                <ChevronDown className="w-4 h-4 -rotate-90" />
                              </motion.div>
                            </button>
                          </Link>
                        </motion.div>
                      </nav>

                      <div className="mx-4 border-t border-gray-100" />

                      {/* Logout Button */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="px-2 py-2"
                      >
                        <motion.button
                          onClick={handleLogout}
                          initial="rest"
                          whileHover="hover"
                          className="group w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 group-hover:bg-red-100 transition-colors duration-200">
                            <LogOut size={16} />
                          </div>
                          <span>Đăng xuất</span>
                          <motion.div
                            className="ml-auto"
                            variants={{
                              rest: { x: 0, opacity: 0.7 },
                              hover: { x: 4, opacity: 1 },
                            }}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 24,
                            }}
                          >
                            <ChevronDown className="w-4 h-4 -rotate-90" />
                          </motion.div>
                        </motion.button>
                      </motion.div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* CSS cho grid pattern */}
      <style>{`
        .bg-grid-pattern {
          background-image:
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
    </div>
  );
}
