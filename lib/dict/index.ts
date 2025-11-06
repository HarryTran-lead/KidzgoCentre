// lib/dict/index.ts
import { nav } from "./nav";
import { auth } from "./auth";
import { brand } from "./brand";
import { footer } from "./footer";
import { heroBanner } from "./heroBanner";
import { loginCard } from "./loginCard";
import type { Locale } from "../i18n";

export const dict = {
  vi: {
    nav: nav.vi,
    auth: auth.vi,
    brand: brand.vi,
    footer: footer.vi,
    hero: heroBanner.vi,
    loginCard: loginCard.vi,
  },
  en: {
    nav: nav.en,
    auth: auth.en,
    brand: brand.en,
    footer: footer.en,
    hero: heroBanner.en,
    loginCard: loginCard.en,
  },
} as const;

type AppLocale = "vi" | "en";
const LOCALE_MAP: Record<string, AppLocale> = {
  vi: "vi",
  "vi-VN": "vi",
  vn: "vi",
  en: "en",
  "en-US": "en",
  "en-GB": "en",
};

export function normalizeLocale(input?: string): AppLocale {
  if (!input) return "vi";
  const key = input.trim();
  return LOCALE_MAP[key] ?? "en";
}

export type Messages = (typeof dict)[Locale];

/** Client hook: nếu không truyền locale → đọc từ <html lang>, cookie `locale`, hoặc segment URL */
export function useMsg(locale?: string) {
  // 1) Nếu có locale truyền vào -> dùng luôn, KHÔNG fallback
  if (locale) {
    const norm = normalizeLocale(locale);
    return dict[norm];
  }

  // 2) Không có prop -> đọc lang, cookie, URL như cũ
  let src: string | undefined;

  if (typeof window !== "undefined") {
    src = document.documentElement.getAttribute("lang") || undefined;

    if (!src) {
      const m = document.cookie.match(/(?:^|; )locale=([^;]+)/);
      src = m?.[1];
    }

    if (!src) {
      const seg1 = window.location.pathname.split("/")[1];
      src = seg1;
    }
  }

  const norm = normalizeLocale(src);
  return dict[norm];
}

export { heroBanner };
