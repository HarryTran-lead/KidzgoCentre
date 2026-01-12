"use client";

import { motion, useAnimation } from "framer-motion";
import {
  Mail,
  Lock,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Bell,
  Award,
  ArrowRight,
  ArrowLeft,
  Home,
  DollarSign,
  HelpCircle,
  Phone,
  BookOpen,
  Users,
  Target,
  Facebook,
  Instagram,
  Youtube,
  Twitter,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { CustomPasswordInput, CustomTextInput } from "./FormInput";
import { LOGO } from "@/lib/theme/theme";
import { DEFAULT_LOCALE, localizePath, type Locale } from "@/lib/i18n";
import { useLazyGetCurrentUserQuery, useLoginMutation } from "@/lib/store/authApi";
import { setAccessToken, setRefreshToken } from "@/lib/store/authToken";
import { normalizeRole, ROLES } from "@/lib/role";

type Props = {
  returnTo?: string;
  locale?: Locale;
  errorMessage?: string;
};

export default function LoginCard({ returnTo = "", locale, errorMessage }: Props) {
  const controls = useAnimation();
  const [remember, setRemember] = useState(false);
  const [loginError, setLoginError] = useState(errorMessage ?? "");

  const [login, { isLoading }] = useLoginMutation();
  const [getCurrentUser] = useLazyGetCurrentUserQuery();

  const resolvedLocale = useMemo(
    () => (locale ?? DEFAULT_LOCALE) as Locale,
    [locale]
  );

  // Features theo thiết kế
  const FEATURES = useMemo(
    () => [
      {
        icon: BookOpen,
        title: "Quản lý học tập",
        description: "Theo dõi lộ trình học tập của con bạn",
      },
      {
        icon: Users,
        title: "Kết nối giáo viên",
        description: "Giao tiếp trực tiếp với giáo viên",
      },
      {
        icon: TrendingUp,
        title: "Theo dõi phát triển",
        description: "Cập nhật thời gian thực về tiến độ",
      },
    ],
    []
  );

  // Navigation items
  const NAV_ITEMS = [
    { label: "Trang chủ", icon: Home },
    { label: "Features", icon: Target },
    { label: "Pricing", icon: DollarSign },
    { label: "Câu hỏi thường gặp", icon: HelpCircle },
    { label: "Liên hệ", icon: Phone },
  ];

  useEffect(() => {
    controls.start((i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    }));
  }, [controls]);

  const setServerSession = async (payload: { role: string; name: string; avatar: string }) => {
    await fetch("/api/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  };

  const handleSubmit = async () => {
    const email =
      (document.querySelector('input[name="email"]') as HTMLInputElement)?.value || "";
    const password =
      (document.querySelector('input[name="password"]') as HTMLInputElement)?.value || "";

    if (!email || !password) {
      setLoginError("Vui lòng nhập email và mật khẩu.");
      return;
    }

    try {
      setLoginError("");

      const response = await login({ email, password }).unwrap();
      setAccessToken(response.data.accessToken);
      setRefreshToken(response.data.refreshToken);

      const currentUser = await getCurrentUser().unwrap();
      const normalizedRole = normalizeRole(currentUser.data.role);

      await setServerSession({
        role: normalizedRole,
        name: currentUser.data.fullName || currentUser.data.userName || "KidzGo User",
        avatar: "",
      });

      const roleBasePath =
        ["PARENT", "STUDENT"].includes(normalizedRole) ? "/portal" : (ROLES[normalizedRole] ?? "/portal");

      const destination = returnTo || localizePath(roleBasePath, resolvedLocale);

      window.location.assign(destination);
    } catch (error) {
      setLoginError("Email hoặc mật khẩu không chính xác. Vui lòng thử lại.");
    }
  };

  // Deterministic particles
  const particleStyle = useRef(
    Array.from({ length: 6 }).map((_, i) => {
      const base = i + 1;
      const width = 30 + ((base * 37) % 50);
      const height = 30 + ((base * 53) % 50);
      const top = ((base * 29) % 90) + (i % 2 === 0 ? 6 : 2);
      const left = (base * 41) % 100;
      const duration = 12 + ((base * 7) % 10);
      const delay = ((base * 3.1) % 5).toFixed(2);
      return {
        width: `${width}px`,
        height: `${height}px`,
        top: `${top}%`,
        left: `${left}%`,
        animation: `float ${duration}s infinite ease-in-out ${delay}s`,
      };
    })
  );

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes float {
        0% { transform: translate(0px, 0px); opacity: 0.55; }
        50% { transform: translate(-10px, 14px); opacity: 0.85; }
        100% { transform: translate(0px, 0px); opacity: 0.55; }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-pink-50 via-white to-rose-50" />
      <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-pink-200/40 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-rose-200/40 blur-3xl" />

      {/* Particles */}
      <div className="pointer-events-none absolute inset-0">
        {particleStyle.current.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-pink-300/25 blur-xl"
            style={s as React.CSSProperties}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-6xl items-center justify-center px-4 py-8"
      >
        <div className="w-full overflow-hidden rounded-2xl border border-white/60 bg-white/60 shadow-xl backdrop-blur">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* LEFT */}
            <div className="relative overflow-hidden bg-linear-to-br from-pink-600 to-rose-600 p-6 lg:p-10 text-white">
              <div className="mb-6 flex items-center gap-2">
                <a
                  href={`/${resolvedLocale}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium hover:bg-white/15"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Quay lại
                </a>
              </div>

              <div className="space-y-5">
                <h1 className="text-2xl font-bold leading-tight">Đăng nhập KidzGo</h1>
                <p className="text-sm text-white/90">
                  Dành cho học sinh và phụ huynh để theo dõi học tập & kết nối giáo viên.
                </p>
              </div>

              <div className="mt-8 space-y-4">
                {FEATURES.map((f, i) => (
                  <motion.div
                    key={f.title}
                    custom={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={controls}
                    className="rounded-xl bg-white/10 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-white/15 p-2">
                        <f.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{f.title}</div>
                        <div className="text-xs text-white/85">{f.description}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 border-t border-white/15 pt-6">
                <div className="grid grid-cols-2 gap-2 text-xs text-white/85">
                  {NAV_ITEMS.map((n) => (
                    <div key={n.label} className="flex items-center gap-2">
                      <n.icon className="h-4 w-4" />
                      <span>{n.label}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center gap-3 text-white/80">
                  <Facebook className="h-4 w-4" />
                  <Instagram className="h-4 w-4" />
                  <Youtube className="h-4 w-4" />
                  <Twitter className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="bg-white/96 backdrop-blur-sm p-6 lg:p-8 flex flex-col justify-center">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="w-full max-w-sm mx-auto space-y-6"
              >
                <div className="text-center">
                  <div className="mb-3 flex justify-center">
                    <Image
                      src={LOGO}
                      alt="KidzGo"
                      width={100}
                      height={100}
                      priority
                      className="rounded-md w-auto h-16"
                    />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    Đăng nhập cho học sinh và phụ huynh
                  </h2>
                </div>

                {loginError && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                    {loginError}
                  </div>
                )}

                <div className="space-y-5">
                  <CustomTextInput
                    label="Email của bạn"
                    name="email"
                    icon={Mail}
                    type="email"
                    autoComplete="email"
                    inputProps={{
                      placeholder: "Nhập email của bạn",
                      className:
                        "w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 bg-white hover:border-pink-500 focus:border-pink-500 focus:ring-1 focus:ring-pink-500/20 text-sm text-gray-800 transition-colors duration-200",
                    }}
                  />

                  <CustomPasswordInput
                    label="Mật khẩu"
                    name="password"
                    icon={Lock}
                    autoComplete="current-password"
                    inputProps={{
                      placeholder: "Nhập mật khẩu của bạn",
                      className:
                        "w-full pl-10 pr-9 py-2.5 rounded-lg border border-gray-300 bg-white hover:border-pink-500 focus:border-pink-500 focus:ring-1 focus:ring-pink-500/20 text-sm text-gray-800 transition-colors duration-200",
                    }}
                  />

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={() => setRemember(!remember)}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-pink-600 focus:ring-pink-600"
                      />
                      <span className="text-xs text-gray-700">Ghi nhớ đăng nhập</span>
                    </label>
                    <button
                      type="button"
                      className="text-xs text-pink-600 hover:text-pink-700 font-medium"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>

                  <motion.button
                    type="button"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="w-full bg-linear-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    {isLoading ? "Đang đăng nhập..." : "Đăng nhập ngay"}
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
