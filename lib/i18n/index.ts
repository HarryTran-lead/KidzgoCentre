// lib/i18n.ts
export const LOCALES = ["vi", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "vi";

export function pickLocaleFromPath(pathname: string): Locale | null {
  const seg1 = pathname.split("/")[1];
  return (LOCALES as readonly string[]).includes(seg1 as any)
    ? (seg1 as Locale)
    : null;
}

export function localizePath(pathname: string, target: Locale): string {
  const segs = pathname.split("/");
  const seg1 = segs[1];

  if ((LOCALES as readonly string[]).includes(seg1 as any)) {
    // /vi/xxx -> /en/xxx
    return `/${target}${pathname.slice(("/" + seg1).length) || "/"}`;
  }
  // /xxx -> /en/xxx  (giữ / nếu đang ở '/')
  return `/${target}${pathname === "/" ? "" : pathname}`;
}
