"use client";

import { motion, useAnimation } from "framer-motion";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Home,
  DollarSign,
  HelpCircle,
  Phone,
  Target,
  Facebook,
  Instagram,
  Youtube,
  Twitter,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { LOGO } from "@/lib/theme/theme";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import LoadingSpinner from "@/components/ui/loadingSpinner";
import { resetPassword } from "@/lib/api/authService";
import { toast } from "@/hooks/use-toast";

type Props = {
  token: string;
  locale?: Locale;
};

const passwordRules = [
  { label: "Ít nhất 8 ký tự", test: (p: string) => p.length >= 8 },
  { label: "Có chữ hoa (A-Z)", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Có chữ thường (a-z)", test: (p: string) => /[a-z]/.test(p) },
  { label: "Có chữ số (0-9)", test: (p: string) => /\d/.test(p) },
];

export default function ResetPasswordCard({ token, locale }: Props) {
  const controls = useAnimation();
  const resolvedLocale = useMemo(
    () => (locale ?? DEFAULT_LOCALE) as Locale,
    [locale],
  );

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const passwordsMatch = newPassword === confirmPassword;
  const allRulesPassed = passwordRules.every((r) => r.test(newPassword));
  const canSubmit =
    allRulesPassed && passwordsMatch && confirmPassword.length > 0;

  const FEATURES = useMemo(
    () => [
      {
        icon: KeyRound,
        title: "Tạo mật khẩu mới",
        description: "Đặt mật khẩu mạnh để bảo vệ tài khoản của bạn",
      },
      {
        icon: ShieldCheck,
        title: "An toàn tuyệt đối",
        description: "Mật khẩu được mã hóa, không ai có thể đọc được",
      },
      {
        icon: CheckCircle2,
        title: "Truy cập ngay",
        description: "Đăng nhập lại ngay sau khi hoàn tất đặt lại mật khẩu",
      },
    ],
    [],
  );

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
    }),
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    if (!token) {
      const msg = "Token không hợp lệ. Vui lòng yêu cầu đặt lại mật khẩu lại.";
      setApiError(msg);
      toast({
        title: "Token không hợp lệ",
        description: msg,
        duration: 5000,
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    setApiError(null);
    try {
      const response = await resetPassword({ token, newPassword });
      const isSuccess = response.isSuccess ?? response.success ?? false;
      if (isSuccess) {
        toast({
          title: "Đặt lại mật khẩu thành công!",
          description: "Bạn có thể đăng nhập với mật khẩu mới",
          variant: "success",
          duration: 3000,
        });
        setIsSuccess(true);
        setTimeout(() => {
          window.location.href = `/${resolvedLocale}/auth/login`;
        }, 3000);
      } else {
        const msg = response.message || "Token không hợp lệ hoặc đã hết hạn";
        setApiError(msg);
        toast({
          title: "Đặt lại mật khẩu thất bại",
          description: msg,
          duration: 5000,
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      const msg = "Không thể kết nối đến máy chủ. Vui lòng thử lại.";
      setApiError(msg);
      toast({
        title: "Lỗi kết nối",
        description: msg,
        duration: 5000,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden w-full">
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
        className="relative mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-6xl items-center justify-center px-4 py-8"
      >
        <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white/60 shadow-xl backdrop-blur">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* LEFT */}
            <div className="relative overflow-hidden bg-linear-to-br from-red-600 to-red-700 p-6 lg:p-10 text-white">
              <div className="mb-6 flex items-center gap-2">
                <a
                  href={`/${resolvedLocale}/auth/login`}
                  className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium hover:bg-white/15"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Quay lại
                </a>
              </div>

              <div className="space-y-5">
                <h1 className="text-2xl font-bold leading-tight">
                  Đặt lại mật khẩu
                </h1>
                <p className="text-sm text-white/90">
                  Tạo mật khẩu mới mạnh để bảo vệ tài khoản của bạn.
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
                        <div className="text-xs text-white/85">
                          {f.description}
                        </div>
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
                    {isSuccess ? "Đặt lại thành công!" : "Tạo mật khẩu mới"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {isSuccess
                      ? "Bạn sẽ được chuyển về trang đăng nhập trong giây lát..."
                      : "Nhập mật khẩu mới để hoàn tất khôi phục tài khoản."}
                  </p>
                </div>

                {isSuccess ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-3 bg-green-50 border border-green-200 rounded-xl p-5">
                      <CheckCircle2 className="h-8 w-8 text-green-500 shrink-0" />
                      <p className="text-sm text-green-700 font-medium">
                        Mật khẩu đã được cập nhật thành công!
                      </p>
                    </div>
                    <a
                      href={`/${resolvedLocale}/auth/login`}
                      className="flex items-center justify-center w-full py-3 rounded-lg bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      Đăng nhập ngay
                    </a>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSubmit}
                    noValidate
                    className="space-y-4"
                  >
                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Mật khẩu mới
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type={showNew ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          onBlur={() => setTouched(true)}
                          className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-300 bg-white hover:border-red-600 focus:border-red-600 focus:ring-1 focus:ring-red-600/20 text-sm text-gray-800 outline-none transition-colors duration-200"
                          placeholder="Nhập mật khẩu mới"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNew((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          tabIndex={-1}
                        >
                          {showNew ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      {/* Password Rules */}
                      {newPassword.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {passwordRules.map((rule) => {
                            const passed = rule.test(newPassword);
                            return (
                              <li
                                key={rule.label}
                                className={`flex items-center gap-1.5 text-xs ${
                                  passed ? "text-green-600" : "text-gray-400"
                                }`}
                              >
                                <span
                                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${passed ? "bg-green-100" : "bg-gray-100"}`}
                                >
                                  {passed ? "✓" : "·"}
                                </span>
                                {rule.label}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Xác nhận mật khẩu
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type={showConfirm ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={`w-full pl-10 pr-10 py-2.5 rounded-lg border bg-white text-sm text-gray-800 outline-none transition-colors duration-200 ${
                            touched &&
                            confirmPassword.length > 0 &&
                            !passwordsMatch
                              ? "border-red-400 focus:border-red-500 hover:border-red-400"
                              : "border-gray-300 hover:border-red-600 focus:border-red-600 focus:ring-1 focus:ring-red-600/20"
                          }`}
                          placeholder="Nhập lại mật khẩu"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          tabIndex={-1}
                        >
                          {showConfirm ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {touched &&
                        confirmPassword.length > 0 &&
                        !passwordsMatch && (
                          <p className="mt-1 text-xs text-red-500">
                            Mật khẩu không khớp
                          </p>
                        )}
                    </div>

                    {/* API Error */}
                    {apiError && (
                      <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        {apiError}
                      </div>
                    )}

                    <motion.button
                      type="submit"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, duration: 0.4 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isLoading || (touched && !canSubmit)}
                      className="w-full bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
                    >
                      {isLoading ? (
                        <span className="inline-flex items-center gap-2 justify-center">
                          <LoadingSpinner color="white" size="5" inline />
                          Đang xử lý...
                        </span>
                      ) : (
                        "Xác nhận đặt lại mật khẩu"
                      )}
                    </motion.button>
                  </form>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
