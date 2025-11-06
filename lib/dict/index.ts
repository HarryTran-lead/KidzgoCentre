// lib/dict/index.ts
import { nav } from "./nav";
import { auth } from "./auth";
import { brand } from "./brand";
import { footer } from "./footer";
import { heroBanner } from "./heroBanner";
import type { Locale } from "../i18n";

export const dict = {
  vi: {
    nav: nav.vi,
    auth: auth.vi,
    brand: brand.vi,
    footer: footer.vi,
    hero: heroBanner.vi,
  },
  en: {
    nav: nav.en,
    auth: auth.en,
    brand: brand.en,
    footer: footer.en,
    hero: heroBanner.en,
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

// CHÚ Ý: cho phép truyền string bất kỳ (en-US/vi-VN) và chuẩn hóa bên trong
export function useMsg(locale?: string) {
  const norm = normalizeLocale(locale);
  return dict[norm] ?? dict.en;
}

export { heroBanner };
