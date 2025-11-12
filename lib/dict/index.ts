// lib/dict/index.ts
import { nav } from "./home/nav";
import { auth } from "./home/auth";
import { brand } from "./home/brand";
import { footer } from "./home/footer";
import { heroBanner } from "./home/heroBanner";
import { loginCard } from "./home/loginCard";
import { menuAdmin } from "./menu/menuAdmin";
import { menuStaffAccounting } from "./menu/menuStaffAccounting";
import { menuStaffManager } from "./menu/menuStaffManager";
import { menuTeacher } from "./menu/menuTeacher";
import { menuStudent } from "./menu/menuStudent";

import { DEFAULT_LOCALE, pickLocaleFromPath, type Locale } from "../i18n";

export const dict = {
  vi: {
    nav: nav.vi,
    auth: auth.vi,
    brand: brand.vi,
    footer: footer.vi,
    hero: heroBanner.vi,
    loginCard: loginCard.vi,
    menuAdmin: menuAdmin.vi,
    menuStaffAccounting: menuStaffAccounting.vi,
    menuStaffManager: menuStaffManager.vi,
    menuTeacher: menuTeacher.vi,
    menuStudent: menuStudent.vi,
  },
  en: {
    nav: nav.en,
    auth: auth.en,
    brand: brand.en,
    footer: footer.en,
    hero: heroBanner.en,
    loginCard: loginCard.en,
    menuAdmin: menuAdmin.en,
    menuStaffAccounting: menuStaffAccounting.en,
    menuStaffManager: menuStaffManager.en,
    menuTeacher: menuTeacher.en,
    menuStudent: menuStudent.en,
  },
} as const;

export type Messages = (typeof dict)[Locale];

export function getMessages(locale: Locale): Messages {
  return dict[locale];
}

export function getMessagesFromPath(pathname?: string): Messages {
  const loc = pathname
    ? pickLocaleFromPath(pathname)
    : typeof window !== "undefined"
    ? pickLocaleFromPath(window.location.pathname)
    : null;
  return dict[loc ?? DEFAULT_LOCALE];
}

export { heroBanner, menuAdmin };
