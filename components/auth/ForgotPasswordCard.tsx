"use client";

import { motion, useAnimation } from "framer-motion";
import {
  Mail,
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
  RefreshCw,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { LOGO } from "@/lib/theme/theme";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import LoadingSpinner from "@/components/ui/loadingSpinner";
import { forgetPassword } from "@/lib/api/authService";
import { toast } from "@/hooks/use-toast";

type Props = {
  locale?: Locale;
};

export default function ForgotPasswordCard({ locale }: Props) {
  const controls = useAnimation();
  const resolvedLocale = useMemo(
    () => (locale ?? DEFAULT_LOCALE) as Locale,
    [locale],
  );

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [step, setStep] = useState<"input" | "sent">("input");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const FEATURES = useMemo(
    () => [
      {
        icon: Mail,
        title: "Nhập email của bạn",
        description: "Nhận liên kết đặt lại qua hộp thư đến",
      },
      {
        icon: ShieldCheck,
        title: "Bảo mật cao",
        description: "Link chỉ có hiệu lực 1 giờ vì lý do bảo mật",
      },
      {
        icon: RefreshCw,
        title: "Nhanh chóng & đơn giản",
        description: "Khôi phục quyền truy cập chỉ trong vài bước",
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

  const startCountdown = () => {
    setCanResend(false);
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = async () => {
    if (!email) {
      setApiError("Email không được bỏ trống");
      return;
    }
    setIsLoading(true);
    setApiError(null);
    try {
      const response = await forgetPassword({ email });
      const isSuccess = response.isSuccess ?? response.success ?? false;
      if (isSuccess) {
        toast({
          title: "Email đã được gửi!",
          description: "Vui lòng kiểm tra hộp thư để đặt lại mật khẩu",
          variant: "success",
          duration: 5000,
        });
        setStep("sent");
        startCountdown();
      } else {
        const msg = response.message || "Email không tồn tại trong hệ thống";
        setApiError(msg);
        toast({
          title: "Gửi email thất bại",
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

  const handleResend = async () => {
    if (!canResend) return;
    setIsLoading(true);
    setApiError(null);
    try {
      const response = await forgetPassword({ email });
      const isSuccess = response.isSuccess ?? response.success ?? false;
      if (isSuccess) {
        toast({
          title: "Email đã được gửi lại!",
          description: "Vui lòng kiểm tra hộp thư của bạn",
          variant: "success",
          duration: 5000,
        });
        startCountdown();
      } else {
        const msg = response.message || "Không thể gửi lại email";
        toast({
          title: "Gửi email thất bại",
          description: msg,
          duration: 5000,
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      const msg = "Không thể kết nối đến máy chủ. Vui lòng thử lại.";
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
    <div className="relative overflow-hidden">
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
                  Khôi phục mật khẩu
                </h1>
                <p className="text-sm text-white/90">
                  Nhập email để nhận hướng dẫn đặt lại mật khẩu của bạn.
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
                    {step === "input" ? "Quên mật khẩu?" : "Email đã được gửi!"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {step === "input"
                      ? "Nhập email để nhận hướng dẫn khôi phục mật khẩu."
                      : `Chúng tôi đã gửi link đến ${email}`}
                  </p>
                </div>

                {/* Step: input */}
                {step === "input" && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Email của bạn
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                          className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 bg-white hover:border-red-600 focus:border-red-600 focus:ring-1 focus:ring-red-600/20 text-sm text-gray-800 outline-none transition-colors duration-200"
                          placeholder="Nhập email của bạn"
                          autoComplete="email"
                        />
                      </div>
                      {apiError && (
                        <p className="mt-1.5 text-xs text-red-600">
                          {apiError}
                        </p>
                      )}
                    </div>

                    <motion.button
                      type="button"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, duration: 0.4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="w-full bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
                    >
                      {isLoading ? (
                        <span className="inline-flex items-center gap-2 justify-center">
                          <LoadingSpinner color="white" size="5" inline />
                          Đang gửi...
                        </span>
                      ) : (
                        "Gửi email khôi phục"
                      )}
                    </motion.button>

                    <p className="text-center text-xs text-gray-500">
                      Bạn nhớ mật khẩu?{" "}
                      <a
                        href={`/${resolvedLocale}/auth/login`}
                        className="text-red-600 hover:text-red-700 font-medium"
                      >
                        Đăng nhập ngay
                      </a>
                    </p>
                  </div>
                )}

                {/* Step: sent */}
                {step === "sent" && (
                  <div className="space-y-5">
                    <div className="bg-red-50 border border-red-100 rounded-xl p-5 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-full bg-red-100 p-1.5 shrink-0">
                          <ShieldCheck className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            Kiểm tra hộp thư
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Click vào link trong email để thiết lập mật khẩu mới
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-full bg-red-100 p-1.5 shrink-0">
                          <Clock className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            Thời gian hiệu lực
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Link sẽ hết hạn sau 1 giờ vì lý do bảo mật
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="text-center text-sm text-gray-600">
                      Không nhận được email?{" "}
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={!canResend || isLoading}
                        className={`font-medium transition-colors duration-200 ${
                          canResend && !isLoading
                            ? "text-red-600 hover:text-red-700 hover:underline"
                            : "text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        {isLoading ? (
                          <span className="inline-flex items-center gap-1">
                            <LoadingSpinner color="gray" size="4" inline />
                            Đang gửi...
                          </span>
                        ) : canResend ? (
                          "Gửi lại"
                        ) : (
                          `Gửi lại sau ${countdown}s`
                        )}
                      </button>
                    </p>

                    <a
                      href={`/${resolvedLocale}/auth/login`}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Quay lại đăng nhập
                    </a>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
