import { NextResponse, type NextRequest } from "next/server";
import { ALL_ROLES, ACCESS_MAP } from "@/lib/role";
import { LOCALES, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

const LOCALES_ARR = LOCALES as readonly string[];
const ONE_YEAR = 60 * 60 * 24 * 365;

/** Auto-login:
 * - Local dev: NEXT_PUBLIC_DEV_AUTO_LOGIN=1
 * - Vercel Preview: AUTO_LOGIN_PREVIEW=1
 * Production: luôn tắt
 */
const isDevBypass = () => {
  const allowLocal =
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN === "1";
  const allowPreview =
    process.env.VERCEL_ENV === "preview" &&
    process.env.AUTO_LOGIN_PREVIEW === "1";
  return allowLocal || allowPreview;
};

const pickBypassRole = () =>
  process.env.AUTO_LOGIN_ROLE || process.env.NEXT_PUBLIC_DEV_ROLE || "ADMIN";

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
function roleFromPathNoLocale(
  pathNoLocale: string
):
  | "ADMIN"
  | "STAFF_ACCOUNTANT"
  | "STAFF_MANAGER"
  | "TEACHER"
  | "STUDENT"
  | null {
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

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Locale trên URL (nếu có) và trong cookie
  const segLocale = pickLocale(pathname);
  const cookieLocale = req.cookies.get("locale")?.value as Locale | undefined;

  // Locale dùng khi cần tự quyết định (portal không prefix, v.v.)
  const effectiveLocale: Locale = segLocale ?? cookieLocale ?? DEFAULT_LOCALE;
  const baseFromSeg = segLocale ? `/${segLocale}` : "";
  const baseFromEffective = `/${effectiveLocale}`;

  // === DEV BYPASS: xử lý ngay cho /auth/login?returnTo=... ===
  if (isDevBypass()) {
    const isLogin =
      pathname === "/auth/login" ||
      pathname === "/vi/auth/login" ||
      pathname === "/en/auth/login";

    if (isLogin) {
      const returnTo = req.nextUrl.searchParams.get("returnTo") || "/portal";
      const roleParam =
        (req.nextUrl.searchParams.get("role") as string) || pickBypassRole();
      const res = NextResponse.redirect(new URL(returnTo, req.url));
      res.cookies.set("role", roleParam, {
        path: "/",
        httpOnly: false,
        maxAge: ONE_YEAR,
      });
      return segLocale ? setLocaleCookie(res, segLocale) : res;
    }
  }

  // Portal?
  const isPortal = segLocale
    ? pathname.startsWith(`/${segLocale}/portal`)
    : pathname.startsWith("/portal");

  // ==== PUBLIC AREA: chỉ đồng bộ cookie theo segment rồi cho qua ====
  if (!isPortal) {
    if (segLocale) {
      return setLocaleCookie(NextResponse.next(), segLocale);
    }
    return NextResponse.next();
  }

  // ==== PORTAL HUB: cho qua để trang hub tự redirect theo role ====
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

  // ==== DEV BYPASS: tự set cookie role theo URL và reload 1 lần ====
  if (isDevBypass()) {
    const pathNoLocale = stripLocale(pathname);
    const wanted = roleFromPathNoLocale(pathNoLocale);
    if (wanted) {
      const current = req.cookies.get("role")?.value;
      if (current !== wanted) {
        const res = NextResponse.redirect(req.nextUrl);
        res.cookies.set("role", wanted, {
          path: "/",
          httpOnly: false,
          maxAge: ONE_YEAR,
        });
        return segLocale ? setLocaleCookie(res, segLocale) : res;
      }
    }
  }

  // ==== AUTHZ CHO PORTAL (prod / hoặc sau khi đã set cookie) ====
  const roleCookie = req.cookies.get("role")?.value ?? "";
  const role = (ALL_ROLES as readonly string[]).includes(roleCookie)
    ? (roleCookie as keyof typeof ACCESS_MAP)
    : undefined;

  // Chưa đăng nhập → ép về trang login theo effectiveLocale
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

  // Kiểm tra quyền theo prefix đã khai báo trong ACCESS_MAP
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

// Matcher: thêm cả /auth/login để dev-bypass redirect theo returnTo
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
