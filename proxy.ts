// proxy.ts
import { NextResponse, type NextRequest } from "next/server";
import { ALL_ROLES, ACCESS_MAP } from "@/lib/role";
import { LOCALES, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

const LOCALES_ARR = LOCALES as readonly string[];
const ONE_YEAR = 60 * 60 * 24 * 365;

// Preview (Vercel) & local dev: cho auto-login
// Vercel tự set VERCEL_ENV = "development" | "preview" | "production"
const isPreviewOrDev = process.env.VERCEL_ENV !== "production";

function pickLocale(pathname: string): Locale | null {
  const seg1 = pathname.split("/")[1];
  return LOCALES_ARR.includes(seg1 as any) ? (seg1 as Locale) : null;
}

function setLocaleCookie(res: NextResponse, locale: Locale) {
  res.cookies.set("locale", locale, {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
  });
  return res;
}

function stripLocale(pathname: string): string {
  const seg1 = pathname.split("/")[1];
  if (LOCALES_ARR.includes(seg1 as any))
    return pathname.slice(("/" + seg1).length) || "/";
  return pathname;
}

type Role =
  | "ADMIN"
  | "STAFF_ACCOUNTANT"
  | "STAFF_MANAGER"
  | "TEACHER"
  | "STUDENT";
function roleFromPathNoLocale(pathNoLocale: string): Role | null {
  const p = pathNoLocale.toLowerCase();
  if (p.startsWith("/portal/admin")) return "ADMIN";
  if (p.startsWith("/portal/staff-accountant")) return "STAFF_ACCOUNTANT";
  if (p.startsWith("/portal/staff-management")) return "STAFF_MANAGER";
  if (p.startsWith("/portal/teacher") || p.startsWith("/teacher"))
    return "TEACHER";
  if (p.startsWith("/portal/student") || p.startsWith("/student"))
    return "STUDENT";
  return null;
}

export default function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const segLocale = pickLocale(pathname);
  const cookieLocale = req.cookies.get("locale")?.value as Locale | undefined;
  const effectiveLocale: Locale = segLocale ?? cookieLocale ?? DEFAULT_LOCALE;
  const baseFromSeg = segLocale ? `/${segLocale}` : "";
  const baseFromEffective = `/${effectiveLocale}`;

  // ===================== PUBLIC =====================
  const isPortal = segLocale
    ? pathname.startsWith(`/${segLocale}/portal`)
    : pathname.startsWith("/portal");

  if (!isPortal) {
    if (segLocale) return setLocaleCookie(NextResponse.next(), segLocale);
    return NextResponse.next();
  }

  // ===================== PORTAL ROOT =====================
  const isPortalRoot =
    pathname === "/portal" ||
    pathname === "/portal/" ||
    (!!segLocale &&
      (pathname === `/${segLocale}/portal` ||
        pathname === `/${segLocale}/portal/`));

  if (isPortalRoot) {
    const res = NextResponse.next();
    return segLocale ? setLocaleCookie(res, segLocale) : res;
  }

  // ========== AUTO-LOGIN CHO PREVIEW/DEV (KHÔNG CẦN TOKEN/.ENV) ==========
  if (isPreviewOrDev) {
    const pathNoLocale = stripLocale(pathname);
    const wanted = (roleFromPathNoLocale(pathNoLocale) ?? "ADMIN") as Role;
    const current = req.cookies.get("role")?.value;

    // Nếu chưa có cookie hoặc sai role → set lại role và reload (dọn query nếu có)
    if (current !== wanted) {
      const cleanUrl = new URL(req.url);
      cleanUrl.searchParams.delete("role");
      cleanUrl.searchParams.delete("dev");

      const res = NextResponse.redirect(cleanUrl);
      res.cookies.set("role", wanted, {
        path: "/",
        httpOnly: false,
        sameSite: "lax",
        maxAge: ONE_YEAR,
      });
      return segLocale ? setLocaleCookie(res, segLocale) : res;
    }
  }

  // ===================== AUTHZ (PRODUCTION) =====================
  const roleCookie = req.cookies.get("role")?.value ?? "";
  const role = (ALL_ROLES as readonly string[]).includes(roleCookie)
    ? (roleCookie as keyof typeof ACCESS_MAP)
    : undefined;

  if (!role) {
    const returnTo = pathname + search;
    const loginUrl = new URL(
      `${baseFromEffective}/auth/login?returnTo=${encodeURIComponent(
        returnTo
      )}`,
      req.url
    );
    return setLocaleCookie(NextResponse.redirect(loginUrl), effectiveLocale);
  }

  const allowPrefixes = (ACCESS_MAP as Record<string, string[]>)[role] ?? [];
  const allowed = allowPrefixes.some((p) =>
    pathname.startsWith(segLocale ? `/${segLocale}${p}` : p)
  );

  if (!allowed) {
    const url403 = new URL(
      `${segLocale ? baseFromSeg : baseFromEffective}/403`,
      req.url
    );
    return setLocaleCookie(NextResponse.redirect(url403), effectiveLocale);
  }

  const res = NextResponse.next();
  return segLocale ? setLocaleCookie(res, segLocale) : res;
}

export const config = {
  matcher: [
    "/",
    "/(vi|en)/:path*",
    "/auth/login",
    "/(vi|en)/auth/login",
    "/portal/:path*",
    "/(vi|en)/portal/:path*",
    "/accountant/:path*",
    "/management/:path*",
    "/teacher/:path*",
    "/student/:path*",
  ],
};
