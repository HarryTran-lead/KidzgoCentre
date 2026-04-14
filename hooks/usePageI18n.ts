// hooks/usePageI18n.ts
"use client";

import { usePathname } from "next/navigation";
import { pickLocaleFromPath, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import { getMessages } from "@/lib/dict";

export function usePageI18n() {
  const pathname = usePathname();
  const locale = (pickLocaleFromPath(pathname) ?? DEFAULT_LOCALE) as Locale;
  const messages = getMessages(locale);
  
  return { locale, messages };
}
