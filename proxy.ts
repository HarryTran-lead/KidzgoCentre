// proxy.ts
import { NextResponse, type NextRequest } from "next/server";
import { ALL_ROLES, ACCESS_MAP } from "@/lib/roles";
import { LOCALES, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

const LOCALES_ARR = LOCALES as readonly string[];

function pickLocale(pathname: string): Locale | null {
  const seg1 = pathname.split("/")[1];
  return LOCALES_ARR.includes(seg1 as any) ? (seg1 as Locale) : null;
}

const oneYear = 60 * 60 * 24 * 365;
function setLocaleCookie(res: NextResponse, locale: Locale) {
  res.cookies.set("locale", locale, {
    path: "/",
    maxAge: oneYear,
    sameSite: "lax",
  });
  return res;
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
    // vẫn sync cookie nếu có segment
    const res = NextResponse.next();
    return segLocale ? setLocaleCookie(res, segLocale) : res;
  }

  // ==== AUTHZ CHO PORTAL ====
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

// 👇 Cho middleware chạy trên toàn site có prefix locale + root,
//    đồng thời vẫn giữ các route /portal có/không prefix.
export const config = {
  matcher: [
    "/", // root (để đồng bộ cookie khi / redirect)
    "/(vi|en)/:path*", // toàn bộ public có prefix locale
    "/portal/:path*", // portal không prefix
    "/(vi|en)/portal/:path*", // portal có prefix
  ],
};
