// proxy.ts
import { NextResponse, type NextRequest } from "next/server";
import { ALL_ROLES, ACCESS_MAP } from "@/lib/roles";
import { LOCALES, type Locale } from "@/lib/i18n";

const LOCALES_ARR = LOCALES as readonly string[];

function pickLocale(pathname: string): Locale | null {
  const seg1 = pathname.split("/")[1];
  return LOCALES_ARR.includes(seg1 as any) ? (seg1 as Locale) : null;
}

const withLocaleCookie = (res: NextResponse, locale: Locale | null) => {
  if (locale) {
    res.cookies.set("locale", locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
  return res;
};

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const locale = pickLocale(pathname);
  const base = locale ? `/${locale}` : "";

  const isPortal = locale
    ? pathname.startsWith(`/${locale}/portal`)
    : pathname.startsWith("/portal");

  // Ngoài vùng portal → set cookie locale rồi cho qua
  if (!isPortal) return withLocaleCookie(NextResponse.next(), locale);

  // Cho phép /portal hoặc /vi/portal đi qua (trang hub tự redirect theo role)
  const isPortalRoot =
    pathname === `${base}/portal` || pathname === `${base}/portal/`;
  if (isPortalRoot) return withLocaleCookie(NextResponse.next(), locale);

  // Lấy role
  const roleCookie = req.cookies.get("role")?.value ?? "";
  const role = (ALL_ROLES as readonly string[]).includes(roleCookie)
    ? (roleCookie as keyof typeof ACCESS_MAP)
    : undefined;

  if (!role) {
    const returnTo = pathname + search;
    const loginUrl = new URL(
      `${base}/auth/login?returnTo=${encodeURIComponent(returnTo)}`,
      req.url
    );
    return withLocaleCookie(NextResponse.redirect(loginUrl), locale);
  }

  // Check quyền theo prefix
  const allowPrefixes = (ACCESS_MAP as Record<string, string[]>)[role] ?? [];
  const allowed = allowPrefixes.some((p) =>
    pathname.startsWith(locale ? `/${locale}${p}` : p)
  );

  if (!allowed) {
    return withLocaleCookie(
      NextResponse.redirect(new URL(`${base}/403`, req.url)),
      locale
    );
  }

  return withLocaleCookie(NextResponse.next(), locale);
}

export const config = {
  matcher: ["/portal/:path*", "/(vi|en)/portal/:path*"],
};
