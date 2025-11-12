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
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
};

export default function LoginCard({ action, returnTo = "", locale }: Props) {
  const controls = useAnimation();
  const [remember, setRemember] = useState(false);
    const resolvedLocale = useMemo(
   () => (locale ?? DEFAULT_LOCALE) as Locale,
    [locale]
  );
  const msg = useMemo(() => getMessages(resolvedLocale), [resolvedLocale]);

  // map features từ dict + icon
  const FEATURES = useMemo(
    () => [
      {
        icon: TrendingUp,
        title: msg.loginCard.features.progressTitle,
        description: msg.loginCard.features.progressDesc,
      },
      {
        icon: Bell,
        title: msg.loginCard.features.realtimeTitle,
        description: msg.loginCard.features.realtimeDesc,
      },
      {
        icon: Award,
        title: msg.loginCard.features.dealsTitle,
        description: msg.loginCard.features.dealsDesc,
      },
    ],
    [msg]
  );

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

  //  Wrapper width “co giãn” theo breakpoint
  const WRAP =
    "w-full mx-auto w-full " +
    "max-w-sm sm:max-w-md md:max-w-md lg:max-w-7xl xl:max-w-6xl 2xl:max-w-6xl";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={WRAP}
    >
      {/* Mobile: block | Desktop(≥lg): 2 cột */}
      <div className="block lg:grid lg:grid-cols-[1.4fr_1fr] gap-0 rounded-3xl border border-white/60 bg-white/80 backdrop-blur-2xl shadow-2xl shadow-slate-900/10 overflow-hidden">
        {/* LEFT (Hero) — ẩn dưới lg */}
        <aside className="relative hidden lg:block px-8 lg:px-12 py-6 lg:py-6 bg-linear-to-br from-slate-50/50 to-white/30">
          <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-br from-sky-400/10 to-pink-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-linear-to-tr from-amber-400/10 to-sky-400/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-sky-500/10 to-pink-500/10 backdrop-blur-sm px-4 py-2 text-sm font-medium text-slate-700 border border-sky-200/50"
            >
              <Sparkles className="h-4 w-4 text-sky-600" />
              {msg.loginCard.badge}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-3xl lg:text-5xl font-bold leading-tight mt-3 text-slate-900"
            >
              {msg.loginCard.hero.welcome}{" "}
              <span className="bg-linear-to-r from-pink-600 via-amber-500 to-sky-600 bg-clip-text text-transparent">
                {msg.loginCard.hero.back}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="mt-4 text-lg text-slate-600 leading-relaxed"
            >
              {msg.loginCard.hero.subtitle}
            </motion.p>

            <div className="mt-6 space-y-4">
              {FEATURES.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  custom={i}
                  initial={{ opacity: 0, x: -30 }}
                  animate={controls}
                  whileHover={{ x: 4, transition: { duration: 0.2 } }}
                  className="group flex items-start gap-4 rounded-2xl bg-white/60 backdrop-blur-sm p-4 border border-slate-200/50 hover:border-sky-300/50 hover:shadow-md transition-all"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-sky-500 to-pink-500 text-white shadow-lg shadow-sky-500/20 group-hover:shadow-xl group-hover:shadow-sky-500/30 transition-all">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="font-semibold text-slate-900">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-600 mt-0.5">
                      {feature.description}
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="mt-10 grid grid-cols-3 gap-4"
            >
              {[
                { value: "5000+", label: msg.loginCard.stats.students },
                { value: "200+", label: msg.loginCard.stats.teachers },
                { value: "98%", label: msg.loginCard.stats.satisfaction },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-bold bg-linear-to-r from-pink-600 to-sky-600 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </aside>

        {/* RIGHT (Form) — full width khi < lg */}
        <section className="bg-white/90 backdrop-blur-xl px-5 sm:px-8 md:px-10 lg:px-12 py-6 md:py-8 lg:py-4 flex">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="w-full max-w-md mx-auto"
          >
            <div className="mb-7 flex flex-col items-center text-center">
              <div className="mb-4">
                <Image
                  src={LOGO}
                  alt="KidzGo"
                  width={200}
                  height={200}
                  priority
                  sizes="(max-width: 640px) 120px, (max-width: 1024px) 180px, 200px"
                  className="rounded-md w-auto h-[60px] sm:h-[72px] md:h-20"
                />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">
                {msg.loginCard.form.title}
              </h3>
              <p className="text-slate-600 mt-2">
                {msg.loginCard.form.subtitle}
              </p>
            </div>

            <div className="space-y-5">
              <CustomTextInput
                label={msg.loginCard.form.emailLabel}
                name="email"
                icon={Mail}
                type="email"
                autoComplete="email"
                inputProps={{
                  placeholder: msg.loginCard.form.emailPlaceholder,
                }}
              />

              <CustomPasswordInput
                label={msg.loginCard.form.passwordLabel}
                name="password"
                icon={Lock}
                autoComplete="current-password"
                inputProps={{
                  placeholder: msg.loginCard.form.passwordPlaceholder,
                }}
              />

              <div className="flex items-center justify-between px-0.5 text-sm pt-4">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={() => setRemember(!remember)}
                    className="h-4 w-4 rounded text-sky-500 focus:ring-sky-500 cursor-pointer"
                  />
                  <span className="text-slate-600 hover:brightness-90 transition-colors">
                    {msg.loginCard.form.remember}
                  </span>
                </label>

                <button
                  type="button"
                  className="text-sky-600 hover:brightness-75 hover:underline transition-colors"
                >
                  {msg.loginCard.form.forgot}
                </button>
              </div>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleSubmit()}
                className={`relative w-full overflow-hidden rounded-xl px-8 py-4 font-semibold text-white shadow-md transition-all duration-200 ${CTA_GRAD} hover:brightness-90 hover:shadow-lg active:scale-95`}
              >
                <span className="relative z-10">
                  {msg.loginCard.form.submit}
                </span>
              </motion.button>

              <div className="pt-4 border-t border-slate-200">
                <p className="text-center text-xs text-slate-500 leading-relaxed">
                  {msg.loginCard.form.consentPrefix}{" "}
                  <button
                    type="button"
                    className="text-sky-600 hover:underline"
                  >
                    {msg.loginCard.form.terms}
                  </button>{" "}
                  {msg.loginCard.form.and}{" "}
                  <button
                    type="button"
                    className="text-sky-600 hover:underline"
                  >
                    {msg.loginCard.form.privacy}
                  </button>{" "}
                  {msg.loginCard.form.consentSuffix}
                </p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="text-right pt-4"
              >
                <Link
                  href={`/${resolvedLocale}`}
                  className="group inline-flex items-center text-sm text-slate-500"
                >
                  <span className="relative flex items-center gap-1 transition-transform duration-300 group-hover:translate-x-1">
                    <span className="transition-all group-hover:bg-linear-to-r group-hover:from-amber-600 group-hover:via-pink-600 group-hover:to-rose-500 group-hover:text-transparent group-hover:bg-clip-text">
                      {msg.loginCard.form.backHome}
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-600 transition-colors duration-300 group-hover:text-rose-500" />
                    <span className="pointer-events-none absolute left-0 right-0.5 -bottom-0.5 h-px bg-linear-to-r from-amber-400 via-pink-500 to-rose-500 scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100" />
                  </span>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </section>
      </div>

      {/* Footer badges */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="mt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-green-600" />
          <span>Bảo mật SSL 256-bit</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-blue-600" />
          <span>Đã được chứng nhận</span>
        </div>
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-amber-600" />
          <span>Top 10 EdTech 2024</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
