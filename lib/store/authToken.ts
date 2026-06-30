const ACCESS_TOKEN_KEY = "kidzgo.accessToken";
const REFRESH_TOKEN_KEY = "kidzgo.refreshToken";

function normalizeToken(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (
    !trimmed ||
    trimmed === "undefined" ||
    trimmed === "null" ||
    trimmed === "[object Object]"
  ) {
    return null;
  }

  return trimmed.startsWith("Bearer ") ? trimmed.slice(7).trim() : trimmed;
}

/**
 * Set cookie (client-side)
 */
function setCookie(name: string, value: string, days: number = 7) {
  if (typeof window === "undefined") return;
  
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

/**
 * Get cookie (client-side)
 */
function getCookie(name: string): string | null {
  if (typeof window === "undefined") return null;
  
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

/**
 * Delete cookie (client-side)
 */
function deleteCookie(name: string) {
  if (typeof window === "undefined") return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

export function getAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }
  // Try cookie first (for middleware), then localStorage (fallback)
  return (
    normalizeToken(getCookie(ACCESS_TOKEN_KEY)) ||
    normalizeToken(window.localStorage.getItem(ACCESS_TOKEN_KEY))
  );
}

export function setAccessToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }
  const normalizedToken = normalizeToken(token);
  if (!normalizedToken) {
    clearAccessToken();
    return;
  }
  // Store in both cookie (for middleware) and localStorage (for client)
  setCookie(ACCESS_TOKEN_KEY, normalizedToken, 7);
  window.localStorage.setItem(ACCESS_TOKEN_KEY, normalizedToken);
}

export function getRefreshToken() {
  if (typeof window === "undefined") {
    return null;
  }
  // Try cookie first, then localStorage
  return (
    normalizeToken(getCookie(REFRESH_TOKEN_KEY)) ||
    normalizeToken(window.localStorage.getItem(REFRESH_TOKEN_KEY))
  );
}

export function setRefreshToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }
  const normalizedToken = normalizeToken(token);
  if (!normalizedToken) {
    clearRefreshToken();
    return;
  }
  // Store in both cookie and localStorage
  setCookie(REFRESH_TOKEN_KEY, normalizedToken, 30); // Refresh token lasts longer
  window.localStorage.setItem(REFRESH_TOKEN_KEY, normalizedToken);
}

export function clearAccessToken() {
  if (typeof window === "undefined") {
    return;
  }
  deleteCookie(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function clearRefreshToken() {
  if (typeof window === "undefined") {
    return;
  }
  deleteCookie(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}
