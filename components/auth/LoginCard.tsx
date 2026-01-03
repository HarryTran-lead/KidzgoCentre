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
import { useEffect, useMemo, useState, useRef } from "react";
import { CustomTextInput, CustomPasswordInput } from "./FormInput";
import { CTA_GRAD, LOGO } from "@/lib/theme/theme";
import Image from "next/image";
import Link from "next/link";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import { getMessages } from "@/lib/dict";

type Props = {
  action: (formData: FormData) => void;
  returnTo?: string;
  locale?: Locale;
  errorMessage?: string;
};

export default function LoginCard({
  action,
  returnTo = "",
  locale,
  errorMessage,
}: Props) {
  const controls = useAnimation();
  const [remember, setRemember] = useState(false);
  const resolvedLocale = useMemo(
    () => (locale ?? DEFAULT_LOCALE) as Locale,
    [locale]
  );
  const msg = useMemo(() => getMessages(resolvedLocale), [resolvedLocale]);

  // Features theo thiết kế
  const FEATURES = useMemo(
    () => [
      {
        icon: BookOpen,
        title: "Quản lý học tập",
        description: "Theo dõi lộ trình học tập của con bạn"
      },
      {
        icon: Users,
        title: "Kết nối giáo viên",
        description: "Giao tiếp trực tiếp với giáo viên"
      },
      {
        icon: TrendingUp,
        title: "Theo dõi phát triển",
        description: "Cập nhật thời gian thực về tiến độ"
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

  const handleSubmit = () => {
    const formData = new FormData();
    formData.append("returnTo", returnTo);
    formData.append(
      "email",
      (document.querySelector('input[name="email"]') as HTMLInputElement)
        ?.value || ""
    );
    formData.append(
      "password",
      (document.querySelector('input[name="password"]') as HTMLInputElement)
        ?.value || ""
    );
    action(formData);
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
        0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.2; }
        33% { transform: translate(15px, -15px) scale(1.05); opacity: 0.3; }
        66% { transform: translate(-10px, 10px) scale(0.95); opacity: 0.25; }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* BG layer */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(236, 72, 153, 0.35) 0%, rgba(244, 114, 182, 0.28) 40%, rgba(249, 168, 212, 0.26) 100%), url('/image/Banner6.JPG')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(10px)",
          transform: "scale(1.03)",
        }}
      />

      {/* Animated particles background */}
      <div className="absolute inset-0 overflow-hidden">
        {particleStyle.current.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-pink-400/10 to-rose-500/10"
            style={{ ...p, filter: "blur(20px)" }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 min-h-screen flex items-center justify-center p-3 sm:p-4 lg:p-6"
      >
        <div className="w-full max-w-5xl">
          

          {/* Main Card - Thu nhỏ hơn */}
          <div className="bg-white/12 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl overflow-hidden mt-8">
            <div className="grid lg:grid-cols-2 min-h-[550px]">
              {/* LEFT Section - Hero Content */}
              <div className="relative p-6 lg:p-8 flex flex-col justify-between overflow-hidden">


                {/* Animated Background */}
                <motion.div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: "url('/image/Banner6.JPG')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                  animate={{
                    scale: [1, 1.1, 1],
                    x: [0, -20, 0],
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                {/* Darken layer for better text contrast */}
                <div className="absolute inset-0 bg-black/25" />

                {/* Animated Gradient Overlay */}
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(236, 72, 153, 0.65) 0%, rgba(217, 70, 239, 0.55) 55%, rgba(244, 114, 182, 0.62) 100%)",
                  }}
                  animate={{
                    background: [
                      "linear-gradient(135deg, rgba(236, 72, 153, 0.65) 0%, rgba(217, 70, 239, 0.55) 55%, rgba(244, 114, 182, 0.62) 100%)",
                      "linear-gradient(135deg, rgba(244, 114, 182, 0.65) 0%, rgba(236, 72, 153, 0.55) 55%, rgba(217, 70, 239, 0.62) 100%)",
                      "linear-gradient(135deg, rgba(236, 72, 153, 0.65) 0%, rgba(217, 70, 239, 0.55) 55%, rgba(244, 114, 182, 0.62) 100%)",
                    ],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                {/* Animated Overlay Gradient */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-tr from-rose-900/25 via-transparent to-pink-200/20"
                  animate={{
                    opacity: [0.3, 0.5, 0.3],
                    background: [
                      "linear-gradient(to top right, rgba(190, 18, 60, 0.25), transparent, rgba(251, 207, 232, 0.2))",
                      "linear-gradient(to top right, rgba(190, 18, 60, 0.35), transparent, rgba(251, 207, 232, 0.3))",
                      "linear-gradient(to top right, rgba(190, 18, 60, 0.25), transparent, rgba(251, 207, 232, 0.2))",
                    ],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                {/* Shimmer Effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  style={{
                    transform: "skewX(-20deg)",
                  }}
                  animate={{
                    x: ["-100%", "200%"],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    repeatDelay: 2,
                    ease: "easeInOut",
                  }}
                />

                {/* Features Grid - Căn giữa */}
                <div className="relative z-10 flex-1 flex items-center">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                    {FEATURES.map((feature, index) => {
                      const Icon = feature.icon;
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 30, scale: 0.9, rotateX: -15 }}
                          animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                          transition={{
                            delay: 0.3 + index * 0.15,
                            duration: 0.6,
                            ease: [0.22, 1, 0.36, 1],
                            type: "spring",
                            stiffness: 100
                          }}
                          whileHover={{
                            scale: 1.05,
                            y: -8,
                            rotateY: 5,
                            transition: { duration: 0.3, ease: "easeOut" }
                          }}
                          className="group bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/15 hover:border-pink-300/60 hover:bg-white/15 transition-all duration-300 cursor-pointer"
                          style={{
                            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                          }}
                        >
                          <motion.div
                            className="flex items-center gap-2 mb-1.5"
                            whileHover={{ x: 4 }}
                            transition={{ duration: 0.2 }}
                          >
                            <motion.div
                              className="w-8 h-8 rounded-md bg-linear-to-br from-pink-500 to-rose-600 flex items-center justify-center"
                              whileHover={{
                                rotate: [0, -10, 10, -10, 0],
                                scale: 1.1
                              }}
                              transition={{ duration: 0.5 }}
                            >
                              <motion.div
                                animate={{
                                  rotate: [0, 5, -5, 0],
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  repeatDelay: 3,
                                  delay: index * 0.3
                                }}
                              >
                                <Icon className="h-4 w-4 text-white" />
                              </motion.div>
                            </motion.div>
                            <div>
                              <motion.div
                                className="text-lg font-bold text-white"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                              >
                                60+
                              </motion.div>
                              <div className="text-xs text-white/80">Kids</div>
                            </div>
                          </motion.div>
                          <motion.h3
                            className="font-semibold text-white text-xs"
                            whileHover={{ x: 2 }}
                            transition={{ duration: 0.2 }}
                          >
                            {feature.title}
                          </motion.h3>
                          <motion.p
                            className="text-xs text-white/80 mt-0.5"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 + index * 0.1 }}
                          >
                            {feature.description}
                          </motion.p>
                          {/* Glow effect on hover */}
                          <motion.div
                            className="absolute inset-0 rounded-lg bg-linear-to-br from-pink-400/0 to-rose-500/0 group-hover:from-pink-400/20 group-hover:to-rose-500/20 pointer-events-none transition-all duration-300"
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                          />
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Social Media - Ở cuối */}
                <div className="relative z-10 pt-4 border-t border-white/15 mt-auto">
                  <p className="text-white/80 text-xs mb-2">Kết nối với chúng tôi</p>
                  <div className="flex items-center gap-1.5">
                    {[Facebook, TrendingUp, Bell, Instagram].map((Icon, index) => (
                      <motion.a
                        key={index}
                        href="#"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8 + index * 0.1, duration: 0.3 }}
                        whileHover={{ scale: 1.15, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-7 h-7 rounded-md bg-white/10 backdrop-blur-sm border border-white/25 flex items-center justify-center text-white hover:bg-white/15 transition-all duration-300"
                      >
                        <Icon className="h-3 w-3" />
                      </motion.a>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT Section - Login Form */}
              <div className="bg-white/96 backdrop-blur-sm p-6 lg:p-8 flex flex-col justify-center">
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Đăng nhập cho học sinh và phụ huynh</h2>
                  </div>

                  {/* Error Message */}
                  {errorMessage && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                      Email hoặc mật khẩu không chính xác. Vui lòng thử lại.
                    </div>
                  )}

                  {/* Login Form */}
                  <div className="space-y-5">
                    <CustomTextInput
                      label="Email của bạn"
                      name="email"
                      icon={Mail}
                      type="email"
                      autoComplete="email"
                      inputProps={{
                        placeholder: "Nhập email của bạn",
                        className: "w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 bg-white hover:border-pink-500 focus:border-pink-500 focus:ring-1 focus:ring-pink-500/20 text-sm text-gray-800 transition-colors duration-200"
                      }}
                    />

                    <CustomPasswordInput
                      label="Mật khẩu"
                      name="password"
                      icon={Lock}
                      autoComplete="current-password"
                      inputProps={{
                        placeholder: "Nhập mật khẩu của bạn",
                        className: "w-full pl-10 pr-9 py-2.5 rounded-lg border border-gray-300 bg-white hover:border-pink-500 focus:border-pink-500 focus:ring-1 focus:ring-pink-500/20 text-sm text-gray-800 transition-colors duration-200"
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
                      <button className="text-xs text-pink-600 hover:text-pink-700 font-medium">
                        Quên mật khẩu?
                      </button>
                    </div>

                    <motion.button
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, duration: 0.4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSubmit}
                      className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white text-sm font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      Đăng nhập ngay
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
