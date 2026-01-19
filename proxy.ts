// proxy.ts
import { NextResponse, type NextRequest } from "next/server";
import { LOCALES, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import { ACCESS_MAP, normalizeRole, type Role } from "@/lib/role";
import {
  extractToken,
  decodeJWT,
  isTokenExpired,
  extractUserInfo,
} from "@/lib/middleware/utils";

const LOCALES_ARR = LOCALES as readonly string[];
const ONE_YEAR = 60 * 60 * 24 * 365;

const isDevBypass = () =>
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN === "1";

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

// Bỏ prefix locale khỏi pathname: "/vi/portal/parent" -> "/portal/parent"
function stripLocale(pathname: string): string {
  const seg1 = pathname.split("/")[1];
  if (LOCALES_ARR.includes(seg1 as any)) {
    return pathname.slice(("/" + seg1).length) || "/";
  }
  return pathname;
}

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const segLocale = pickLocale(pathname);
  const cookieLocale = req.cookies.get("locale")?.value as Locale | undefined;
  const effectiveLocale: Locale = segLocale ?? cookieLocale ?? DEFAULT_LOCALE;
  const baseFromEffective = `/${effectiveLocale}`;

  // === DEV BYPASS CHO /auth/login ===
  if (isDevBypass()) {
    const isLogin =
      pathname === "/auth/login" ||
      pathname === "/vi/auth/login" ||
      pathname === "/en/auth/login";

    if (isLogin) {
      const returnTo = req.nextUrl.searchParams.get("returnTo") || "/portal";
      const roleParam =
        req.nextUrl.searchParams.get("role") ||
        process.env.NEXT_PUBLIC_DEV_ROLE ||
        "ADMIN";

      const res = NextResponse.redirect(new URL(returnTo, req.url));
      res.cookies.set("role", roleParam, {
        path: "/",
        httpOnly: false,
        maxAge: ONE_YEAR,
      });
      return segLocale ? setLocaleCookie(res, segLocale) : res;
    }
  }

  // === Có phải /portal hay không ===
  const isPortal = segLocale
    ? pathname.startsWith(`/${segLocale}/portal`)
    : pathname.startsWith("/portal");

  // ==== PUBLIC AREA: chỉ sync locale cookie rồi cho qua ====
  if (!isPortal) {
    if (segLocale) {
      return setLocaleCookie(NextResponse.next(), segLocale);
    }
    return NextResponse.next();
  }

  // ==== /portal root: cho qua để AccountChooser tự xử lý ====
  const isPortalRoot =
    pathname === "/portal" ||
    pathname === "/portal/" ||
    (segLocale &&
      (pathname === `/${segLocale}/portal` ||
        pathname === `/${segLocale}/portal/`));

  if (isPortalRoot) {
    const res = NextResponse.next();
    return segLocale ? setLocaleCookie(res, segLocale) : res;
  }

  // ==== AUTHZ CHO CÁC ROUTE CON CỦA /portal ==== 
  
  // Try to get JWT token first
  const token = extractToken(req);
  let role: Role | undefined;
  let userId: string | undefined;
  
  if (token) {
    // Verify JWT token
    const payload = decodeJWT(token);
    
    if (payload && !isTokenExpired(payload)) {
      const userInfo = extractUserInfo(payload);
      
      if (userInfo) {
        const normalized = normalizeRole(userInfo.role);
        role = (ACCESS_MAP as Record<string, string[]>)[normalized]
          ? (normalized as Role)
          : undefined;
        userId = userInfo.userId;
      }
    }
  }
  
  // Fallback to cookie-based auth (for dev/backward compatibility)
  if (!role) {
    const rawRole = req.cookies.get("role")?.value;
    const normalized = rawRole ? normalizeRole(rawRole) : undefined;
    role = normalized && (ACCESS_MAP as Record<string, string[]>)[normalized]
      ? (normalized as Role)
      : undefined;
  }

  // Không có role → ép về login
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

  // Bỏ locale, check theo ACCESS_MAP
  const pathNoLocale = stripLocale(pathname);
  const allowPrefixes = ACCESS_MAP[role] ?? [];
  const allowed = allowPrefixes.some((p) => pathNoLocale.startsWith(p));

  if (!allowed) {
    // 403 không prefix locale -> app/403/page.tsx
    const url403 = new URL("/403", req.url);
    return setLocaleCookie(NextResponse.redirect(url403), effectiveLocale);
  }

  const res = NextResponse.next();
  
  // Add user info to headers for downstream use
  if (userId) {
    res.headers.set("x-user-id", userId);
  }
  if (role) {
    res.headers.set("x-user-role", role);
  }
  
  return segLocale ? setLocaleCookie(res, segLocale) : res;
}

// Proxy matcher - excludes static files and API routes
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - API routes that should bypass proxy
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    "/",
    "/(vi|en)/:path*",
    "/auth/:path*",
    "/(vi|en)/auth/:path*",
    "/portal/:path*",
    "/(vi|en)/portal/:path*",
    "/contact",
    "/faqs",
    "/blogs",
    "/(vi|en)/contact",
    "/(vi|en)/faqs",
    "/(vi|en)/blogs",
  ],
};
