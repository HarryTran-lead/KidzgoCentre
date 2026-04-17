"use client";

import { motion, useAnimation } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  Facebook,
  HelpCircle,
  Home,
  Instagram,
  KeyRound,
  Phone,
  ShieldCheck,
  Target,
  Twitter,
  Youtube,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import type { AxiosError } from "axios";
import { LOGO } from "@/lib/theme/theme";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import LoadingSpinner from "@/components/ui/loadingSpinner";
import { resetPin } from "@/lib/api/authService";
import { toast } from "@/hooks/use-toast";

type Props = {
  token: string;
  locale?: Locale;
};

const PIN_MIN_LENGTH = 4;
const PIN_MAX_LENGTH = 9;

const pinRules = [
  {
    label: `Từ ${PIN_MIN_LENGTH} đến ${PIN_MAX_LENGTH} chữ số`,
    test: (pin: string) => pin.length >= PIN_MIN_LENGTH && pin.length <= PIN_MAX_LENGTH,
  },
  {
    label: "Chỉ gồm số (0-9)",
    test: (pin: string) => /^\d+$/.test(pin),
  },
];

const sanitizePin = (value: string) => value.replace(/\D/g, "").slice(0, PIN_MAX_LENGTH);

const toViPinResetError = (raw?: string, fallback = "Không thể kết nối đến máy chủ. Vui lòng thử lại.") => {
  const normalized = (raw || "").trim().toLowerCase();
  if (!normalized) return fallback;

  if (
    normalized.includes("token") &&
    (normalized.includes("invalid") ||
      normalized.includes("expired") ||
      normalized.includes("not valid") ||
      normalized.includes("invalid or has expired"))
  ) {
    return "Liên kết đặt lại PIN đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu gửi lại liên kết mới.";
  }

  if (normalized.includes("pin reset token")) {
    return "Liên kết đặt lại PIN đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu gửi lại liên kết mới.";
  }

  return raw as string;
};

const extractApiErrorMessage = (error: unknown) => {
  const axiosError = error as AxiosError<{ message?: string; detail?: string; title?: string }>;
  const data = axiosError?.response?.data;
  return (
    data?.detail ||
    data?.message ||
    data?.title ||
    axiosError?.message ||
    ""
  );
};

export default function ResetPinCard({ token, locale }: Props) {
  const controls = useAnimation();
  const resolvedLocale = useMemo(
    () => (locale ?? DEFAULT_LOCALE) as Locale,
    [locale],
  );

  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const pinsMatch = newPin === confirmPin;
  const allRulesPassed = pinRules.every((rule) => rule.test(newPin));
  const canSubmit = allRulesPassed && pinsMatch && confirmPin.length > 0;

  const FEATURES = useMemo(
    () => [
      {
        icon: KeyRound,
        title: "Tạo mã PIN mới",
        description: "Đặt PIN mới để bảo vệ thao tác của hồ sơ phụ huynh",
      },
      {
        icon: ShieldCheck,
        title: "Bảo mật an toàn",
        description: "Liên kết xác thực chỉ dùng được một lần",
      },
      {
        icon: Clock3,
        title: "Hiệu lực trong 1 giờ",
        description: "Vui lòng hoàn tất sớm để tránh link hết hạn",
      },
    ],
    [],
  );

  const NAV_ITEMS = [
    { label: "Trang chủ", icon: Home },
    { label: "Features", icon: Target },
    { label: "Câu hỏi thường gặp", icon: HelpCircle },
    { label: "Liên hệ", icon: Phone },
  ];

  useEffect(() => {
    controls.start((i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
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
        0% { transform: translate(0px, 0px); opacity: 0.5; }
        50% { transform: translate(-10px, 12px); opacity: 0.8; }
        100% { transform: translate(0px, 0px); opacity: 0.5; }
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

    if (!canSubmit) {
      return;
    }

    if (!token) {
      const message = "Liên kết đặt lại PIN không hợp lệ. Vui lòng yêu cầu lại từ hồ sơ phụ huynh.";
      setApiError(message);
      toast({
        title: "Token không hợp lệ",
        description: message,
        duration: 5000,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setApiError(null);

    try {
      const response = await resetPin({ token, newPin });
      const success = response.isSuccess ?? response.success ?? false;

      if (success) {
        toast({
          title: "Đặt lại PIN thành công",
          description: "Bạn có thể quay lại đăng nhập để tiếp tục.",
          variant: "success",
          duration: 3000,
        });
        setIsSuccess(true);
        setTimeout(() => {
          window.location.href = `/${resolvedLocale}/auth/login`;
        }, 3000);
      } else {
        const message = toViPinResetError(
          response.message,
          "Liên kết đặt lại PIN đã hết hạn hoặc không hợp lệ."
        );
        setApiError(message);
        toast({
          title: "Đặt lại PIN thất bại",
          description: message,
          duration: 5000,
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      const rawMessage = extractApiErrorMessage(error);
      const message = toViPinResetError(rawMessage);
      setApiError(message);
      toast({
        title: "Đặt lại PIN thất bại",
        description: message,
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
      <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-amber-200/40 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-orange-200/40 blur-3xl" />

      <div className="pointer-events-none absolute inset-0">
        {particleStyle.current.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-orange-300/20 blur-xl"
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
        <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white/65 shadow-xl backdrop-blur">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="relative overflow-hidden bg-linear-to-br from-orange-500 to-orange-600 p-6 lg:p-10 text-white">
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
                <h1 className="text-2xl font-bold leading-tight">Đặt lại PIN phụ huynh</h1>
                <p className="text-sm text-white/90">
                  Chúng tôi đã nhận yêu cầu đặt lại PIN cho hồ sơ phụ huynh. Vui lòng tạo mã PIN mới để tiếp tục.
                </p>
              </div>

              <div className="mt-8 space-y-4">
                {FEATURES.map((feature, i) => (
                  <motion.div
                    key={feature.title}
                    custom={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={controls}
                    className="rounded-xl bg-white/10 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-white/15 p-2">
                        <feature.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{feature.title}</div>
                        <div className="text-xs text-white/85">{feature.description}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 border-t border-white/15 pt-6">
                <div className="grid grid-cols-2 gap-2 text-xs text-white/85">
                  {NAV_ITEMS.map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
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

            <div className="bg-white/96 backdrop-blur-sm p-6 lg:p-8 flex flex-col justify-center">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5 }}
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
                    {isSuccess ? "Cập nhật thành công!" : "Tạo mã PIN mới"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {isSuccess
                      ? "Bạn sẽ được chuyển về trang đăng nhập trong giây lát..."
                      : `PIN cần từ ${PIN_MIN_LENGTH} đến ${PIN_MAX_LENGTH} chữ số.`}
                  </p>
                </div>

                {isSuccess ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-3 rounded-xl border border-green-200 bg-green-50 p-5">
                      <CheckCircle2 className="h-8 w-8 shrink-0 text-green-500" />
                      <p className="text-sm font-medium text-green-700">Mã PIN đã được cập nhật an toàn.</p>
                    </div>
                    <a
                      href={`/${resolvedLocale}/auth/login`}
                      className="flex w-full items-center justify-center rounded-lg bg-linear-to-r from-orange-500 to-orange-600 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:from-orange-600 hover:to-orange-700 hover:shadow-lg"
                    >
                      Đăng nhập ngay
                    </a>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} noValidate className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">PIN mới</label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          type={showNew ? "text" : "password"}
                          value={newPin}
                          onChange={(e) => setNewPin(sanitizePin(e.target.value))}
                          onBlur={() => setTouched(true)}
                          inputMode="numeric"
                          autoComplete="off"
                          className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-800 outline-none transition-colors duration-200 hover:border-orange-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20"
                          placeholder="Nhập PIN mới"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNew((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          tabIndex={-1}
                        >
                          {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>

                      {newPin.length > 0 ? (
                        <ul className="mt-2 space-y-1">
                          {pinRules.map((rule) => {
                            const passed = rule.test(newPin);
                            return (
                              <li
                                key={rule.label}
                                className={`flex items-center gap-1.5 text-xs ${
                                  passed ? "text-green-600" : "text-gray-400"
                                }`}
                              >
                                <span
                                  className={`flex h-3.5 w-3.5 items-center justify-center rounded-full text-[10px] ${
                                    passed ? "bg-green-100" : "bg-gray-100"
                                  }`}
                                >
                                  {passed ? "✓" : "·"}
                                </span>
                                {rule.label}
                              </li>
                            );
                          })}
                        </ul>
                      ) : null}
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">Xác nhận PIN</label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          type={showConfirm ? "text" : "password"}
                          value={confirmPin}
                          onChange={(e) => setConfirmPin(sanitizePin(e.target.value))}
                          inputMode="numeric"
                          autoComplete="off"
                          className={`w-full rounded-lg border bg-white py-2.5 pl-10 pr-10 text-sm text-gray-800 outline-none transition-colors duration-200 ${
                            touched && confirmPin.length > 0 && !pinsMatch
                              ? "border-red-400 hover:border-red-400 focus:border-red-500"
                              : "border-gray-300 hover:border-orange-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20"
                          }`}
                          placeholder="Nhập lại PIN"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          tabIndex={-1}
                        >
                          {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {touched && confirmPin.length > 0 && !pinsMatch ? (
                        <p className="mt-1 text-xs text-red-500">PIN xác nhận không khớp</p>
                      ) : null}
                    </div>

                    {apiError ? (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                        {apiError}
                      </div>
                    ) : null}

                    <motion.button
                      type="submit"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, duration: 0.4 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isLoading || (touched && !canSubmit)}
                      className="w-full cursor-pointer rounded-lg bg-linear-to-r from-orange-500 to-orange-600 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:from-orange-600 hover:to-orange-700 hover:shadow-lg disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500"
                    >
                      {isLoading ? (
                        <span className="inline-flex items-center justify-center gap-2">
                          <LoadingSpinner color="white" size="5" inline />
                          Đang cập nhật...
                        </span>
                      ) : (
                        "Xác nhận đặt lại PIN"
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
