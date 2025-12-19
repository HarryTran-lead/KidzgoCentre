"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  motion,
  type Variants,
  type Transition,
  cubicBezier,
} from "framer-motion";
import { Mail, Phone, MapPin, Facebook, Sparkles } from "lucide-react";
import { LOGO } from "@/lib/theme/theme";
import { pickLocaleFromPath, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import { getMessages } from "@/lib/dict";
import FbFrame from "./fbframe";

/* ===== Facebook Page Plugin (iframe only) ===== */
const fbSrc = (pageUrl: string, w: number, h: number) =>
  `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(
    pageUrl
  )}&tabs=timeline&width=${w}&height=${h}&adapt_container_width=true&hide_cover=false&show_facepile=false`;

/* ===== Motion ===== */
const easeOut = cubicBezier(0.22, 1, 0.36, 1);
const tFast: Transition = { duration: 0.5, ease: easeOut };
const tMed: Transition = { duration: 0.6, ease: easeOut };
const container: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: tMed },
};
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.12 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: tFast },
};

/* ===== Icon palettes ===== */
const BADGE_STYLES = {
  rose: {
    grad: "group-hover:bg-linear-to-br group-hover:from-pink-500 group-hover:to-rose-600 group-hover/contact:bg-linear-to-br group-hover/contact:from-pink-500 group-hover/contact:to-rose-600",
    ring: "group-hover:ring-rose-300 group-hover/contact:ring-rose-300",
  },
  amber: {
    grad: "group-hover:bg-linear-to-br group-hover:from-amber-400 group-hover:to-orange-500 group-hover/contact:bg-linear-to-br group-hover/contact:from-amber-400 group-hover/contact:to-orange-500",
    ring: "group-hover:ring-amber-300 group-hover/contact:ring-amber-300",
  },
  sky: {
    grad: "group-hover:bg-linear-to-br group-hover:from-sky-400 group-hover:to-blue-600 group-hover/contact:bg-linear-to-br group-hover/contact:from-sky-400 group-hover/contact:to-blue-600",
    ring: "group-hover:ring-sky-300 group-hover/contact:ring-sky-300",
  },
  violet: {
    grad: "group-hover:bg-linear-to-br group-hover:from-violet-500 group-hover:to-fuchsia-600 group-hover/contact:bg-linear-to-br group-hover/contact:from-violet-500 group-hover/contact:to-fuchsia-600",
    ring: "group-hover:ring-violet-300 group-hover/contact:ring-violet-300",
  },
  emerald: {
    grad: "group-hover:bg-linear-to-br group-hover:from-emerald-400 group-hover:to-teal-600 group-hover/contact:bg-linear-to-br group-hover/contact:from-emerald-400 group-hover/contact:to-teal-600",
    ring: "group-hover:ring-emerald-300 group-hover/contact:ring-emerald-300",
  },
  red: {
    grad: "group-hover:bg-linear-to-br group-hover:from-red-500 group-hover:to-rose-600 group-hover/contact:bg-linear-to-br group-hover/contact:from-red-500 group-hover/contact:to-rose-600",
    ring: "group-hover:ring-red-300 group-hover/contact:ring-red-300",
  },
  blue: {
    grad: "group-hover:bg-linear-to-br group-hover:from-blue-500 group-hover:to-indigo-600 group-hover/contact:bg-linear-to-br group-hover/contact:from-blue-500 group-hover/contact:to-indigo-600",
    ring: "group-hover:ring-blue-300 group-hover/contact:ring-blue-300",
  },
} as const;

const TEXT_COLOR = {
  rose: "hover:text-rose-700 group-hover/contact:text-rose-700",
  amber: "hover:text-orange-600 group-hover/contact:text-orange-600",
  sky: "hover:text-blue-600 group-hover/contact:text-blue-600",
  violet: "hover:text-fuchsia-600 group-hover/contact:text-fuchsia-600",
  emerald: "hover:text-teal-600 group-hover/contact:text-teal-600",
  red: "hover:text-rose-600 group-hover/contact:text-rose-600",
  blue: "hover:text-indigo-600 group-hover/contact:text-indigo-600",
} as const;

type Palette = keyof typeof BADGE_STYLES;

export default function Footer() {
  const pathname = usePathname();
  const locale = useMemo(
    () => (pickLocaleFromPath(pathname) ?? DEFAULT_LOCALE) as Locale,
    [pathname]
  );
  const msg = getMessages(locale);
  const rights =
    locale === "vi" ? "Bảo lưu mọi quyền." : "All rights reserved.";

  // Fallbacks nếu dict chưa đủ khóa
  const ft: any = msg.footer ?? {};
  const facebookUrl: string =
    ft.facebookUrl ?? "https://www.facebook.com/kidzgoEnglish";
  const address1: string =
    ft.address1 ??
    "Địa chỉ 1: Tổ 3, Ấp Ông Lang, Cửa Dương, Phú Quốc, Kiên Giang";
  const address2: string =
    ft.address2 ??
    "Địa chỉ 2: Hẻm 68 Đoàn Thị Điểm, Khu Phố 11, Dương Đông, Phú Quốc, Kiên Giang";
  const address3: string =
    ft.address3 ?? "Địa chỉ 3: S302.2118, Vinhomes Grand Park, Quận 9, TPHCM";
  const hotlineText: string =
    ft.hotlineText ??
    "Hotline: 0357.800.889 (Sài Gòn) / 0356.616.019 (Phú Quốc)";
  const emailAddress: string = ft.emailAddress ?? "Kidzgo.edu@gmail.com";
  const emailText: string = ft.emailText ?? `Email: ${emailAddress}`;
  const facebookText: string =
    ft.facebookText ?? "https://www.facebook.com/kidzgoEnglish";

  const ADDRESS_PALETTES: Palette[] = ["violet", "emerald", "amber"];
  const PHONE_PALETTE: Palette = "blue";
  const MAIL_PALETTE: Palette = "rose";

  return (
    <footer className="relative overflow-hidden bg-white">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-4 md:px-4 lg:px-4 xl:px-0 pt-8 pb-4">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          className="grid gap-8 sm:gap-10 lg:gap-20 grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.15fr_0.5fr_1.35fr] items-start"
        >
          {/* Cột 1 — Logo + Facebook embed */}
          <motion.div variants={item} className="space-y-2 self-stretch">
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src={LOGO}
                alt="KidzGo logo"
                width={900}
                height={900}
                priority
                className="h-12 lg:h-16 xl:h-20 mb-0.5 w-auto"
              />
            </Link>
            <p className="text-sm leading-6 text-slate-700">
              {locale === "vi"
                ? "Đồng hành cùng con trên hành trình chinh phục tiếng Anh."
                : "We accompany your kids on their English learning journey."}
            </p>

            <div className="pt-2 flex flex-col">
              <FbFrame
                url={facebookUrl}
                height={260}
                showFacepile={false}
                hideCover={false}
              />
              <div className="mt-2 text-xs text-slate-500">
                <Link
                  href={facebookUrl}
                  target="_blank"
                  className="inline-flex items-center gap-1 hover:text-blue-600"
                >
                  <Facebook className="w-3.5 h-3.5" />
                  /kidzgoEnglish
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Cột 2 — Về chúng tôi + Chương trình */}
          <motion.div
            variants={stagger}
            className="space-y-3 mt-0 sm:mt-8 self-stretch flex flex-col justify-around"
          >
            <div className="space-y-3">
              <motion.h4
                variants={item}
                className="font-semibold text-slate-900"
              >
                {msg.footer.company}
              </motion.h4>
              <motion.ul variants={stagger} className="space-y-2 list-none">
                {[
                  msg.footer.about,
                  msg.footer.teachers,
                  msg.footer.stories,
                  msg.footer.careers,
                ].map((text, i) => (
                  <motion.li key={i} variants={item}>
                    <FooterLink href="#">{text}</FooterLink>
                  </motion.li>
                ))}
              </motion.ul>
            </div>

            <div className="space-y-3">
              <motion.h4
                variants={item}
                className="font-semibold text-slate-900"
              >
                {msg.footer.programs}
              </motion.h4>
              <motion.ul variants={stagger} className="space-y-2 list-none">
                {[
                  msg.footer.general,
                  msg.footer.kids,
                  msg.footer.ielts,
                  msg.footer.business,
                ].map((text, i) => (
                  <motion.li key={i} variants={item}>
                    <FooterLink href="#">{text}</FooterLink>
                  </motion.li>
                ))}
              </motion.ul>
            </div>
          </motion.div>

          {/* Cột 3 — Địa chỉ + Liên hệ */}
          <motion.div
            variants={stagger}
            className="space-y-3 mt-0 sm:mt-8 self-stretch flex flex-col justify-around"
          >
            <div className="space-y-3">
              <motion.h4
                variants={item}
                className="font-semibold text-slate-900"
              >
                {msg.footer.address}
              </motion.h4>
              <motion.ul
                variants={stagger}
                className="space-y-3 list-none text-sm leading-6"
              >
                {[address1, address2, address3].map((txt, i) => (
                  <motion.li key={i} variants={item}>
                    <ContactLink
                      href="#"
                      palette={ADDRESS_PALETTES[i] as Palette}
                    >
                      <MapPin className="w-5 h-5 shrink-0 mr-1" />
                      <span>{txt}</span>
                    </ContactLink>
                  </motion.li>
                ))}
              </motion.ul>
            </div>

            <div className="space-y-3">
              <motion.h4
                variants={item}
                className="font-semibold text-slate-900"
              >
                {msg.footer.contact}
              </motion.h4>
              <motion.ul
                variants={stagger}
                className="space-y-3 text-sm list-none leading-6"
              >
                <motion.li variants={item}>
                  <ContactLink href="tel:+84357800889" palette={PHONE_PALETTE}>
                    <IconBadge palette={PHONE_PALETTE}>
                      <Phone className="w-4 h-4" />
                    </IconBadge>
                    <span>{hotlineText}</span>
                  </ContactLink>
                </motion.li>
                <motion.li variants={item}>
                  <ContactLink
                    href={`mailto:${emailAddress}`}
                    palette={MAIL_PALETTE}
                  >
                    <IconBadge palette={MAIL_PALETTE}>
                      <Mail className="w-4 h-4" />
                    </IconBadge>
                    <span>{emailText}</span>
                  </ContactLink>
                </motion.li>
                <motion.li variants={item}>
                  <ContactLink href={facebookUrl} palette="sky">
                    <IconBadge palette="sky">
                      <Facebook className="w-4 h-4" />
                    </IconBadge>
                    <span>{facebookText}</span>
                  </ContactLink>
                </motion.li>
              </motion.ul>
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom line */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="mt-10 border-t border-rose-200/70 pt-6"
        >
          <motion.div
            variants={item}
            className="flex items-center justify-center gap-2 text-center text-slate-700 text-sm"
          >
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="text-yellow-500"
            >
              <Sparkles className="w-4 h-4" />
            </motion.span>
            © {new Date().getFullYear()} {msg.brand.name}. {rights}
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.1, 1] }}
              transition={{
                duration: 2,
                delay: 1,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="text-yellow-500"
            >
              <Sparkles className="w-4 h-4" />
            </motion.span>
          </motion.div>
        </motion.div>
      </div>
    </footer>
  );
}

/* ===== Bits ===== */
function FooterLink({
  href,
  children,
  noUnderline = false,
}: {
  href: string;
  children: React.ReactNode;
  noUnderline?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group relative inline-flex items-center text-sm text-slate-700 hover:text-rose-700 transition-colors pb-0.5" // chừa chỗ cho gạch
    >
      {children}
      {!noUnderline && (
        <span
          aria-hidden
          className="
            pointer-events-none absolute inset-x-0 bottom-0
            h-px rounded-full
            bg-linear-to-r from-yellow-400 via-pink-400 to-purple-400
            opacity-0 scale-x-0 origin-left
            transition-transform duration-300
            group-hover:opacity-100 group-hover:scale-x-100
            will-change-transform
          "
        />
      )}
    </Link>
  );
}

export function IconBadge({
  children,
  palette,
}: {
  children: React.ReactNode;
  palette?: Palette;
}) {
  const picked = BADGE_STYLES[palette ?? "rose"];
  return (
    <span
      aria-hidden
      className={[
        "shrink-0 mr-2 inline-grid place-items-center w-8 h-8 rounded-full",
        "ring-1 ring-slate-200 bg-white text-slate-600",
        "transition-all duration-200 transform-gpu",
        picked.grad,
        picked.ring,
        "group-hover:text-white group-hover:scale-110",
        "group-hover/contact:text-white group-hover/contact:scale-110",
        "group-hover:shadow-sm group-hover:shadow-rose-200/40",
        "group-hover/contact:shadow-sm group-hover/contact:shadow-rose-200/40",
      ].join(" ")}
    >
      <span className="transition-transform duration-200">{children}</span>
    </span>
  );
}

function ContactLink({
  href,
  children,
  palette = "rose",
}: {
  href: string;
  children: React.ReactNode;
  palette?: Palette;
}) {
  return (
    <Link
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      className={[
        "group/contact inline-flex items-center gap-1 text-sm transition-colors text-slate-700",
        TEXT_COLOR[palette],
      ].join(" ")}
    >
      {children}
    </Link>
  );
}
