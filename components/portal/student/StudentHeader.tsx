// components/portal/student/StudentHeader.tsx
"use client";

import { ChevronDown, Star, Sparkles } from "lucide-react";
import Image from "next/image";
import { LOGO } from "@/lib/theme/theme";
import { useState, useMemo, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "@/hooks/useNotifications";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  getMyStarBalance,
  getMyLevel,
  getMyAttendanceStreak,
} from "@/lib/api/gamificationService";
import { buildFileUrl } from "@/constants/apiURL";
import type { UserProfile } from "@/types/auth";
import { localizePath } from "@/lib/i18n";

type StudentHeaderProps = {
  userName?: string;
  avatarUrl?: string;
};

export default function StudentHeader({
  userName,
  avatarUrl,
}: StudentHeaderProps) {
  const { unreadCount, notificationsRoute } = useNotifications("Student");
  const { user: currentUser } = useCurrentUser();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [starBalance, setStarBalance] = useState<number | null>(null);
  const [streakDays, setStreakDays] = useState<number | null>(null);
  const [levelInfo, setLevelInfo] = useState<{
    level: number;
    xp: number;
    xpRequiredForNextLevel: number;
  } | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  // Extract locale from pathname
  const locale = useMemo(() => {
    const parts = pathname.split("/");
    return parts[1] || "vi";
  }, [pathname]);

  const handleSwitchAccount = () => {
    router.push(localizePath("/portal", locale as any));
  };

  const activeStudentProfile = useMemo<UserProfile | undefined>(() => {
    const profiles = currentUser?.profiles ?? [];

    if (currentUser?.selectedProfile?.profileType === "Student") {
      return currentUser.selectedProfile;
    }

    if (currentUser?.selectedProfileId) {
      const byId = profiles.find(
        (profile) =>
          profile.profileType === "Student" &&
          profile.id === currentUser.selectedProfileId,
      );
      if (byId) return byId;
    }

    return profiles.find((profile) => profile.profileType === "Student");
  }, [currentUser]);

  const displayUserName =
    activeStudentProfile?.displayName ??
    currentUser?.fullName ??
    userName ??
    "Nguyen Van An";

  const headerAvatarUrl = useMemo(() => {
    const rawAvatar =
      activeStudentProfile?.avatarUrl ?? currentUser?.avatarUrl ?? avatarUrl;
    return rawAvatar ? buildFileUrl(rawAvatar) : "";
  }, [activeStudentProfile?.avatarUrl, currentUser?.avatarUrl, avatarUrl]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!isDropdownOpen) return;
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !popRef.current?.contains(t)) {
        setIsDropdownOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && setIsDropdownOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [isDropdownOpen]);

  // Close when route changes
  useEffect(() => setIsDropdownOpen(false), [pathname]);

  // Load gamification data for header
  useEffect(() => {
    getMyStarBalance()
      .then((res) => setStarBalance(res.balance))
      .catch(() => {});
    getMyAttendanceStreak()
      .then((res) => setStreakDays(res.currentStreak))
      .catch(() => {});
    getMyLevel()
      .then((res) => setLevelInfo(res))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsDropdownOpen(false);
    setIsLoggingOut(true);

    // Clear all tokens and auth data
    if (typeof window !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();
      // Clear all cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie =
          c.trim().split("=")[0] +
          "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/";
      });
    }

    await new Promise((r) => setTimeout(r, 700));
    window.location.replace("/");
  };

  return (
    <div className="relative z-10 px-2 sm:px-3 pt-0.5 pb-0.5">
      <div className="flex justify-between items-center">
        {/* Logo section */}
        <div className="flex items-center">
          <Image
            src={LOGO}
            alt="KidzGo Logo"
            width={80}
            height={50}
            className="drop-shadow-[0_4px_12px_rgba(255,255,255,0.3)]"
            priority
          />
        </div>

        {/* User info section */}
        <div className="flex items-center">
          {/* Header hoa quyen - 1 thanh dai chung border */}
          <div className="flex items-center rounded-full">
            {/* Stats badges section */}
            <div className="flex items-center gap-1.5 bg-transparent px-2 py-1.5">
              {/* Stars */}
              <Star className="w-5 h-5 text-yellow-400" fill="currentColor" />
              <div className="text-sm font-black text-white drop-shadow-md">
                {starBalance != null
                  ? starBalance.toLocaleString("vi-VN")
                  : "—"}
              </div>

              {/* Chuoi ngay */}
              <div className="flex items-center gap-1.5">
                <div className="grid h-6 w-6 place-items-center">
                  <Image
                    src="/icons/fire.png"
                    alt="Fire"
                    width={20}
                    height={20}
                  />
                </div>
                <div className="text-sm font-black text-white drop-shadow-md">
                  {streakDays != null ? `${streakDays} ngày` : "— ngày"}
                </div>
              </div>
            </div>

            {/* Notification Button */}
            <Link
              href={notificationsRoute}
              className="group relative mr-1.5 inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/40 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
              aria-label="Thông báo"
            >
              <Image
                src="/image/notification-bell.png"
                alt="Notification"
                width={20}
                height={20}
              />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 min-w-[22px] rounded-full bg-rose-500 px-1.5 py-0.5 text-center text-[11px] font-bold text-white shadow-lg">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>

            {/* Switch Account Button */}
            <button
              onClick={handleSwitchAccount}
              className="group relative cursor-pointer mr-1.5 inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/40 bg-gradient-to-br from-purple-500/30 to-pink-500/30 text-white backdrop-blur-sm transition hover:from-purple-500/50 hover:to-pink-500/50 hover:shadow-lg"
              aria-label="Chuyển tài khoản"
              title="Chuyển tài khoản"
            >
              <Image src="/image/exit.png" alt="Exit" width={24} height={24} />
            </button>

            {/* Profile section */}
            <div className="relative">
              <button
                ref={btnRef}
                onClick={() =>
                  !isLoggingOut && setIsDropdownOpen(!isDropdownOpen)
                }
                className={`group relative flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-1.5 transition-all duration-300 cursor-pointer ${
                  isLoggingOut
                    ? "cursor-wait opacity-90"
                    : "hover:bg-white/20 hover:shadow-lg"
                }`}
                aria-haspopup="menu"
                aria-expanded={isDropdownOpen}
                disabled={isLoggingOut}
              >
                {/* Avatar với effect */}
                <div className="relative">
                  <div className="relative rounded-full p-[2px] bg-gradient-to-br from-cyan-400 via-blue-400 to-purple-400 shadow-lg">
                    <div className="relative h-[38px] w-[38px] rounded-full overflow-hidden bg-indigo-900">
                      {headerAvatarUrl ? (
                        <Image
                          src={headerAvatarUrl}
                          alt={displayUserName}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xl font-black text-white">
                          {(displayUserName || "N")[0].toUpperCase()}
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
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 15,
                      }}
                      className="absolute -top-1 -right-1"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-yellow-400 fill-yellow-300" />
                    </motion.div>
                  )}
                </div>

                {/* Name & Level */}
                <div className="flex flex-col items-start gap-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black text-white drop-shadow-md truncate max-w-[120px]">
                      {isLoggingOut ? "Đang đăng xuất..." : displayUserName}
                    </span>
                    {!isLoggingOut && (
                      <motion.div
                        animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <ChevronDown
                          size={14}
                          className="text-white/80 transition-transform"
                        />
                      </motion.div>
                    )}
                  </div>

                  {/* Experience bar */}
                  <div className="w-full">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="text-[11px] font-bold text-yellow-300">
                        {levelInfo ? `Level ${levelInfo.level}` : "—"}
                      </span>
                    </div>
                    <div className="relative h-1.5 w-[120px] bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                        style={{
                          width: levelInfo
                            ? `${Math.min(100, Math.round((levelInfo.xp / Math.max(1, levelInfo.xp + levelInfo.xpRequiredForNextLevel)) * 100))}%`
                            : "0%",
                        }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                        {levelInfo
                          ? `${levelInfo.xp} / ${levelInfo.xp + levelInfo.xpRequiredForNextLevel}`
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {isDropdownOpen && !isLoggingOut && (
                  <>
                    {/* Backdrop */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-40 bg-black/30"
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
                      className="absolute -right-2 mt-11 w-[280px] rounded-4xl border border-gray-200 bg-white shadow-xl z-50 overflow-hidden"
                    >
                      {/* Header */}
                      <div className="relative px-6 py-4 bg-gradient-to-br from-purple-500 via-blue-500 to-purple-600 border-b border-gray-100">
                        <div
                          className="absolute inset-0"
                          style={{
                            backgroundImage: `
                            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                          `,
                            backgroundSize: "20px 20px",
                          }}
                        />
                        <div className="relative">
                          <p className="text-base font-bold text-white mb-1">
                            {displayUserName}
                          </p>
                          <p className="text-xs text-white/80 truncate mb-2">
                            {currentUser?.email ?? ""}
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
                            <button className="group w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-xl transition-all duration-200 cursor-pointer">
                              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-50 group-hover:bg-purple-100 transition-colors duration-200">
                                <Image
                                  src="/image/man.png"
                                  alt="Profile"
                                  width={20}
                                  height={20}
                                />
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
                          className="group w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 cursor-pointer"
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 group-hover:bg-red-100 transition-colors duration-200">
                            <Image
                              src="/image/logout.png"
                              alt="Logout"
                              width={18}
                              height={18}
                            />
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
    </div>
  );
}
