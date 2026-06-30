import {
  clearAccessToken,
  clearRefreshToken,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from "@/lib/store/authToken";

type RefreshResult = {
  accessToken: string;
  refreshToken?: string;
};

function pickToken(source: unknown, keys: string[]): string | null {
  if (!source || typeof source !== "object") return null;

  const record = source as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function extractTokens(payload: unknown): RefreshResult | null {
  const root = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const data = root.data && typeof root.data === "object" ? (root.data as Record<string, unknown>) : {};
  const tokenContainer =
    data.token && typeof data.token === "object" ? (data.token as Record<string, unknown>) : {};

  const accessToken =
    pickToken(data, ["accessToken", "token", "jwtToken", "access_token"]) ||
    pickToken(tokenContainer, ["accessToken", "token", "jwtToken", "access_token"]) ||
    pickToken(root, ["accessToken", "token", "jwtToken", "access_token"]);

  if (!accessToken) return null;

  const refreshToken =
    pickToken(data, ["refreshToken", "refresh_token"]) ||
    pickToken(tokenContainer, ["refreshToken", "refresh_token"]) ||
    pickToken(root, ["refreshToken", "refresh_token"]) ||
    undefined;

  return { accessToken, refreshToken };
}

export async function refreshStoredAuthTokens(): Promise<RefreshResult | null> {
  if (typeof window === "undefined") return null;

  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const response = await fetch("/api/auth/refresh-token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) return null;

  const json = await response.json().catch(() => null);
  const tokens = extractTokens(json);
  if (!tokens) return null;

  setAccessToken(tokens.accessToken);
  if (tokens.refreshToken) {
    setRefreshToken(tokens.refreshToken);
  }

  return tokens;
}

export function clearStoredAuthTokens() {
  clearAccessToken();
  clearRefreshToken();
}

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const token = getAccessToken();

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  if (response.status !== 401) {
    return response;
  }

  const refreshed = await refreshStoredAuthTokens();
  if (!refreshed) {
    return response;
  }

  const retryHeaders = new Headers(init.headers);
  retryHeaders.set("Authorization", `Bearer ${refreshed.accessToken}`);

  return fetch(input, {
    ...init,
    headers: retryHeaders,
  });
}
