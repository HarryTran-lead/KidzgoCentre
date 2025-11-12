// proxy.ts
import { NextResponse, type NextRequest } from "next/server";
import { ALL_ROLES, ACCESS_MAP } from "@/lib/role"; 
import { EndPoint } from "@/lib/routes";
import { LOCALES, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

const LOCALES_ARR = LOCALES as readonly string[];
const ONE_YEAR = 60 * 60 * 24 * 365;

/** ⚠️ DEMO ONLY: mở auto-login ở mọi môi trường (prod cũng bật)
 *  Đặt về false khi không còn cần mở toang.
 */
const ALWAYS_AUTO_LOGIN = true;

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

/** Bỏ prefix locale khỏi pathname nếu có ("/vi/portal/teacher" -> "/portal/teacher") */
function stripLocale(pathname: string): string {
  const seg1 = pathname.split("/")[1];
  if (LOCALES_ARR.includes(seg1 as any)) {
    return pathname.slice(("/" + seg1).length) || "/";
  }
  return pathname;
}

/** Suy ra role từ path không có locale */
type Role =
  | "ADMIN"
  | "STAFF_ACCOUNTANT"
  | "STAFF_MANAGER"
  | "TEACHER"
  | "STUDENT";

function roleFromPathNoLocale(pathNoLocale: string): Role | null {
  const p = pathNoLocale.toLowerCase();

  // Ưu tiên so với EndPoint.*, vẫn giữ fallback non-portal (dev routes)
  if (p.startsWith(EndPoint.ADMIN)) return "ADMIN";
  if (p.startsWith(EndPoint.STAFF_ACCOUNTANT)) return "STAFF_ACCOUNTANT";
  if (p.startsWith(EndPoint.STAFF_MANAGER)) return "STAFF_MANAGER";
  if (p.startsWith(EndPoint.TEACHER) || p.startsWith("/teacher"))
    return "TEACHER";
  if (p.startsWith(EndPoint.STUDENT) || p.startsWith("/student"))
    return "STUDENT";
  return null;
}

export default function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Locale trên URL (nếu có) và trong cookie
  const segLocale = pickLocale(pathname);
  const cookieLocale = req.cookies.get("locale")?.value as Locale | undefined;

  // Locale dùng khi cần tự quyết định (portal không prefix, v.v.)
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

  // ========== AUTO-LOGIN Ở MỌI MÔI TRƯỜNG (DEMO) ==========
  if (ALWAYS_AUTO_LOGIN) {
    const pathNoLocale = stripLocale(pathname);
    const wanted = (roleFromPathNoLocale(pathNoLocale) ?? "ADMIN") as Role;
    const current = req.cookies.get("role")?.value;

    // Chưa có cookie hoặc role khác => set lại cookie role và reload URL (xoá query role/dev nếu có)
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

  // ===================== AUTHZ (nếu tắt auto-login) =====================
  const roleCookie = req.cookies.get("role")?.value ?? "";
  const role = (ALL_ROLES as readonly string[]).includes(roleCookie)
    ? (roleCookie as keyof typeof ACCESS_MAP)
    : undefined;

  if (!role) {
    const returnTo = pathname + search;
    const loginUrl = new URL(
      `${baseFromEffective}${EndPoint.LOGIN}?returnTo=${encodeURIComponent(
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

  // OK
  const res = NextResponse.next();
  return segLocale ? setLocaleCookie(res, segLocale) : res;
}

export const config = {
  // Lưu ý: matcher phải là chuỗi tĩnh để Next phân tích ở build time
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
