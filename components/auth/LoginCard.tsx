"use client";

import { motion, useAnimation } from "framer-motion";
import {
  Mail,
  Lock,
  ArrowLeft,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { CustomPasswordInput, CustomTextInput } from "./FormInput";
import { LOGO } from "@/lib/theme/theme";
import { DEFAULT_LOCALE, localizePath, type Locale } from "@/lib/i18n";
import { setAccessToken, setRefreshToken } from "@/lib/store/authToken";
import { normalizeRole, ROLES } from "@/lib/role";
import { toast } from "@/hooks/use-toast";
import * as authService from "@/lib/api/authService";
import { writeSelectedProfile } from "@/hooks/useSelectedStudentProfile";

type Props = {
  returnTo?: string;
  locale?: Locale;
  errorMessage?: string;
};

export default function LoginCard({ returnTo = "", locale, errorMessage }: Props) {
  const controls = useAnimation();
  const [remember, setRemember] = useState(false);
  const [loginError, setLoginError] = useState(errorMessage ?? "");
  const [isLoading, setIsLoading] = useState(false);

  const resolvedLocale = useMemo(
    () => (locale ?? DEFAULT_LOCALE) as Locale,
    [locale]
  );

  // Features theo thiết kế
  const FEATURES = useMemo(
    () => [
      {
        image: "/icons/book.png",
        title: "Quản lý học tập",
        description: "Theo dõi lộ trình học tập của con bạn",
      },
      {
        image: "/image/man.png",
        title: "Kết nối giáo viên",
        description: "Giao tiếp trực tiếp với giáo viên",
      },
      {
        image: "/icons/customer.png",
        title: "Theo dõi phát triển",
        description: "Cập nhật thời gian thực về tiến độ",
      },
    ],
    []
  );


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

  const pickToken = (source: unknown, keys: string[]): string | null => {
    if (!source || typeof source !== "object") return null;
    const record = source as Record<string, unknown>;

    for (const key of keys) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }

    return null;
  };

  const extractLoginTokens = (payload: unknown) => {
    const root = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
    const data = root.data && typeof root.data === "object" ? (root.data as Record<string, unknown>) : {};
    const tokenContainer =
      data.token && typeof data.token === "object"
        ? (data.token as Record<string, unknown>)
        : {};

    const accessToken =
      pickToken(data, ["accessToken", "token", "jwtToken", "access_token"]) ||
      pickToken(tokenContainer, ["accessToken", "token", "jwtToken", "access_token"]) ||
      pickToken(root, ["accessToken", "token", "jwtToken", "access_token"]);

    const refreshToken =
      pickToken(data, ["refreshToken", "refresh_token"]) ||
      pickToken(tokenContainer, ["refreshToken", "refresh_token"]) ||
      pickToken(root, ["refreshToken", "refresh_token"]);

    return { accessToken, refreshToken };
  };

  const handleSubmit = async () => {
    const email =
      (document.querySelector('input[name="email"]') as HTMLInputElement)?.value || "";
    const password =
      (document.querySelector('input[name="password"]') as HTMLInputElement)?.value || "";

    if (!email || !password) {
      const errorMsg = "Vui lòng nhập email và mật khẩu.";
      setLoginError(errorMsg);
      toast({
        title: "Thiếu thông tin!",
        description: errorMsg,
        duration: 3000,
        variant: 'default',
      });
      return;
    }

    try {
      setLoginError("");
      setIsLoading(true);

      // Use authService instead of RTK Query
      const response = await authService.login({ email, password });

      // Check for login failure from backend (success flag may be in root or nested)
      const isLoginSuccess = response.isSuccess ?? (response as unknown as { success: boolean })?.success;
      if (!isLoginSuccess) {
        const backendMsg = response.message || "Email hoặc mật khẩu không chính xác. Vui lòng thử lại.";
        setLoginError(backendMsg);
        toast({
          title: "Đăng nhập thất bại!",
          description: backendMsg,
          duration: 4000,
          variant: 'destructive',
        });
        return;
      }

      const { accessToken, refreshToken } = extractLoginTokens(response);
      if (!accessToken || !refreshToken) {
        throw new Error("Máy chủ chưa trả token đăng nhập hợp lệ.");
      }

      setAccessToken(accessToken);
      setRefreshToken(refreshToken);

      const currentUser = await authService.getUserMe();
      const userData = currentUser.data || currentUser;
      const normalizedRole = normalizeRole(userData.role);

      // Show success toast
      toast({
        title: 'Đăng nhập thành công!',
        description: `Chào mừng ${userData.fullName}`,
        duration: 2000,
        variant: 'success',
      });

      if (normalizedRole === "Parent") {
        writeSelectedProfile(null);
        await setServerSession({
          role: "Student",
          name: userData.fullName || "",
          avatar: "",
        });

        const destination = localizePath("/portal", resolvedLocale);
        setTimeout(() => {
          window.location.assign(destination);
        }, 500);
        return;
      }

      // Check if user has multiple profiles (Parent/Student accounts)
      if (["Parent", "Student"].includes(normalizedRole)) {
        // Get profiles to determine if we need AccountChooser
        const profilesResponse = await authService.getProfiles();
        const profilesData = profilesResponse.data || profilesResponse;
        const profiles = Array.isArray(profilesData) 
          ? profilesData 
          : (profilesData?.profiles ?? []);

        if (profiles.length > 1) {
          // Multiple profiles → set session with Student role first (required for middleware)
          await setServerSession({
            role: "Student", // Use Student role to allow access to /portal
            name: userData.fullName || "",
            avatar: "",
          });

          // Redirect to AccountChooser at /portal root
          const destination = localizePath("/portal", resolvedLocale);
          setTimeout(() => {
            window.location.assign(destination);
          }, 500);
          return;
        }
      }

      // Single profile or Admin → redirect directly to their portal
      await setServerSession({
        role: normalizedRole,
        name: userData.fullName || "",
        avatar: "",
      });

      const roleBasePath = ROLES[normalizedRole] ?? "/portal";
      const destination = returnTo || localizePath(roleBasePath, resolvedLocale);

      // Delay navigation to show toast
      setTimeout(() => {
        window.location.assign(destination);
      }, 500);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string; title?: string; detail?: string } }; message?: string };
      const errorMsg = "Email hoặc mật khẩu không chính xác. Vui lòng thử lại.";
      const backendMsg =
        axiosError?.response?.data?.message ||
        axiosError?.response?.data?.detail ||
        axiosError?.response?.data?.title ||
        axiosError?.message ||
        errorMsg;
      setLoginError(backendMsg);
      
      toast({
        title: "Đăng nhập thất bại!",
        description: backendMsg,
        duration: 4000,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      e.preventDefault();
      handleSubmit();
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
    <div className="relative overflow-hidden z-10" >
      <div className="absolute inset-0 bg-red" />
      <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-red-200/40 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-gray-300/40 blur-3xl" />

      {/* Particles */}
      <div className="pointer-events-none absolute inset-0">
        {particleStyle.current.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-red-300/25 blur-xl"
            style={s as React.CSSProperties}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-4xl items-center justify-center px-4 py-8"
      >
        <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white/60 shadow-xl backdrop-blur">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* LEFT */}
            <div className="relative overflow-hidden bg-gradient-to-br from-red-600 to-red-700 p-6 lg:p-10 text-white">
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
                <h1 className="text-2xl font-bold leading-tight">Đăng nhập Rex</h1>
                
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
                        <Image
                          src={f.image}
                          alt={f.title}
                          width={22}
                          height={22}
                          unoptimized
                        />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{f.title}</div>
                        <div className="text-xs text-white/85">{f.description}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
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
                    Đăng nhập
                  </h2>
                </div>

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
                        "w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 bg-white hover:border-red-600 focus:border-red-600 focus:ring-1 focus:ring-red-600/20 text-sm text-gray-800 transition-colors duration-200",
                      onKeyDown: handleKeyPress,
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
                        "w-full pl-10 pr-9 py-2.5 rounded-lg border border-gray-300 bg-white hover:border-red-600 focus:border-red-600 focus:ring-1 focus:ring-red-600/20 text-sm text-gray-800 transition-colors duration-200",
                      onKeyDown: handleKeyPress,
                    }}
                  />

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={() => setRemember(!remember)}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-red-600 focus:ring-red-600 cursor-pointer"
                      />
                      <span className="text-xs text-gray-700">Ghi nhớ đăng nhập</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => window.location.href = `/${resolvedLocale}/auth/forgotpassword`}
                      className="text-xs text-red-600 hover:text-red-700 font-medium cursor-pointer"
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
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
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
