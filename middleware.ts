import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ALL_ROLES, ACCESS_MAP } from "./lib/roles";
import { LOCALES, type Locale } from "./lib/i18n/i18n";

const LOCALES_ARR = LOCALES as readonly string[];
type LocaleStr = (typeof LOCALES_ARR)[number];

function pickLocale(pathname: string): Locale | null {
  const seg1 = pathname.split("/")[1];
  return LOCALES_ARR.includes(seg1 as any) ? (seg1 as Locale) : null;
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const locale = pickLocale(pathname);

  // ⬇️ tạo resp để có thể set cookie
  let res = NextResponse.next();

  if (locale) {
    res.cookies.set("locale", locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  // ------ phần portal như bạn đã có ------
  const isPortal = locale
    ? pathname.startsWith(`/${locale}/portal`)
    : pathname.startsWith("/portal");

  if (!isPortal) return res;

  const roleCookie = req.cookies.get("role")?.value ?? "";
  const role = (ALL_ROLES as readonly string[]).includes(roleCookie)
    ? (roleCookie as keyof typeof ACCESS_MAP)
    : undefined;

  const base = locale ? `/${locale}` : "";

  if (!role) {
    const returnTo = pathname + search;
    const loginUrl = new URL(
      `${base}/auth/login?returnTo=${encodeURIComponent(returnTo)}`,
      req.url
    );
    return NextResponse.redirect(loginUrl);
  }

  const allowPrefixes = (ACCESS_MAP as Record<string, string[]>)[role] ?? [];
  const allowed = allowPrefixes.some((p) =>
    pathname.startsWith(locale ? `/${locale}${p}` : p)
  );
  if (!allowed) {
    return NextResponse.redirect(new URL(`${base}/403`, req.url));
  }

  return res;
}

export const config = {
  matcher: ["/portal/:path*", "/(vi|en)/portal/:path*"],
};
