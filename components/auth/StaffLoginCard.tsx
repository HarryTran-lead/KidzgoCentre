"use client";

import { motion, useAnimation } from "framer-motion";
import {
  Mail,
  Lock,
  Building2,
  TrendingUp,
  Bell,
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
  MapPin,
  ArrowLeft,
} from "lucide-react";
import { useEffect, useMemo, useState, useRef } from "react";
import { CustomTextInput, CustomPasswordInput } from "./FormInput";
import { LOGO } from "@/lib/theme/theme";
import Image from "next/image";
import Link from "next/link";
import { DEFAULT_LOCALE, localizePath, type Locale } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { useLazyGetCurrentUserQuery, useLoginMutation } from "@/lib/store/authApi";
import { setAccessToken, setRefreshToken } from "@/lib/store/authToken";
import { normalizeRole, ROLES } from "@/lib/role";

type Props = {
  returnTo?: string;
  locale?: Locale;
  errorMessage?: string;
};

// Danh sách chi nhánh trung tâm
const BRANCHES = [
  { id: "branch1", name: "Chi nhánh Quận 1", address: "123 Nguyễn Huệ, Q1, TP.HCM" },
  { id: "branch2", name: "Chi nhánh Quận 7", address: "456 Nguyễn Thị Thập, Q7, TP.HCM" },
  { id: "branch3", name: "Chi nhánh Quận 3", address: "789 Võ Văn Tần, Q3, TP.HCM" },
  { id: "branch4", name: "Chi nhánh Bình Thạnh", address: "321 Xô Viết Nghệ Tĩnh, Bình Thạnh, TP.HCM" },
];

export default function StaffLoginCard({
  returnTo = "",
  locale,
  errorMessage,
}: Props) {
const controls = useAnimation();

useEffect(() => {
  controls.start((i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }));
}, [controls]);
  const [remember, setRemember] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [loginError, setLoginError] = useState(errorMessage ?? "");

  const [login, { isLoading }] = useLoginMutation();
  const [getCurrentUser] = useLazyGetCurrentUserQuery();
  const router = useRouter();

  const resolvedLocale = useMemo(
    () => (locale ?? DEFAULT_LOCALE) as Locale,
    [locale]
  );

  // Features cho nhân viên
  const FEATURES = useMemo(
    () => [
      {
        icon: BookOpen,
        title: "Quản lý học viên",
        description: "Theo dõi và quản lý thông tin học viên",
      },
      {
        icon: Users,
        title: "Quản lý giáo viên",
        description: "Phân công và quản lý đội ngũ giáo viên",
      },
      {
        icon: TrendingUp,
        title: "Báo cáo & Thống kê",
        description: "Xem báo cáo và thống kê chi tiết",
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

  const setCookie = (name: string, value: string) => {
    // If you want “remember me” persistence, you can add max-age/expires here based on `remember`.
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/`;
  };

  const handleSubmit = async () => {
    const email =
      (document.querySelector('input[name="email"]') as HTMLInputElement)?.value || "";
    const password =
      (document.querySelector('input[name="password"]') as HTMLInputElement)?.value || "";

    if (!selectedBranch) {
      setLoginError("Vui lòng chọn chi nhánh trung tâm.");
      return;
    }

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

      setCookie("role", normalizedRole);
      setCookie(
        "user-name",
        currentUser.data.fullName || currentUser.data.userName || "KidzGo User"
      );
      setCookie("user-avatar", "");
      setCookie("user-branch", selectedBranch);

      const destination =
        returnTo || localizePath(ROLES[normalizedRole] ?? "/portal", resolvedLocale);

      router.push(destination);
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
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-linear-to-br from-pink-50 via-white to-rose-50" />

      {/* Decorative blobs */}
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
            {/* LEFT Section */}
            <div className="relative overflow-hidden bg-linear-to-br from-pink-600 to-rose-600 p-6 lg:p-10 text-white">
              <div className="mb-6 flex items-center gap-2">
                <Link
                  href={`/${resolvedLocale}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium hover:bg-white/15"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Quay lại
                </Link>
              </div>

              <div className="space-y-5">
                <h1 className="text-2xl font-bold leading-tight">
                  Cổng đăng nhập nhân sự KidzGo
                </h1>
                <p className="text-sm text-white/90">
                  Dành cho giáo viên, nhân viên và admin để quản lý trung tâm & học viên.
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

            {/* RIGHT Section - Login Form */}
            <div className="bg-white/96 backdrop-blur-sm p-6 lg:p-8 flex flex-col justify-center overflow-y-auto max-h-[600px]">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="w-full max-w-sm mx-auto space-y-6"
              >
                {/* Form Header */}
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
                    Đăng nhập cho giáo viên, nhân viên và admin
                  </h2>
                  <p className="text-sm text-gray-600">Quản lý trung tâm và học viên</p>
                </div>

                {/* Error Message */}
                {loginError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                    {loginError}
                  </div>
                )}

                {/* Login Form */}
                <div className="space-y-5">
                  {/* Branch Selection */}
                  <div className="space-y-2">
                    <label htmlFor="branch" className="block text-sm font-medium text-gray-700">
                      Chi nhánh trung tâm
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-gray-400 group-focus-within:text-pink-600 transition-colors" />
                      </div>
                      <select
                        id="branch"
                        name="branch"
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        required
                        className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 bg-white hover:border-pink-500 focus:border-pink-500 focus:ring-1 focus:ring-pink-500/20 text-sm text-gray-800 transition-colors duration-200 appearance-none cursor-pointer"
                      >
                        <option value="">Chọn chi nhánh</option>
                        {BRANCHES.map((branch) => (
                          <option key={branch.id} value={branch.id}>
                            {branch.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedBranch && (
                      <p className="text-xs text-gray-500">
                        {
                          BRANCHES.find((b) => b.id === selectedBranch)?.address
                        }
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <CustomTextInput
                    label="Email"
                    name="email"
                    placeholder="nhanvien@kidzgo.edu.vn"
                    icon={Mail}
                    required
                    inputProps={{
                      className:
                        "w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 bg-white hover:border-pink-500 focus:border-pink-500 focus:ring-1 focus:ring-pink-500/20 text-sm text-gray-800 transition-colors duration-200",
                    }}
                  />

                  {/* Password */}
                  <CustomPasswordInput
                    label="Mật khẩu"
                    name="password"
                    placeholder="••••••••"
                    icon={Lock}
                    required
                    inputProps={{
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
                    disabled={!selectedBranch || isLoading}
                    className="w-full bg-linear-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    {isLoading ? "Đang đăng nhập..." : "Đăng nhập ngay"}
                  </motion.button>

                  {/* Footer Text */}
                  <div className="pt-3 border-t border-gray-200 text-center">
                    <p className="text-xs text-gray-600">
                      Bạn là phụ huynh?{" "}
                      <Link
                        href={`/${resolvedLocale}/auth/login/parent`}
                        className="text-pink-600 hover:text-pink-700 font-medium"
                      >
                        Đăng nhập phụ huynh
                      </Link>
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
