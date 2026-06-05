type ApiEnvelope<T> = {
  isSuccess?: boolean;
  success?: boolean;
  data?: T;
  detail?: string;
  message?: string;
  title?: string;
  errors?: Array<{ code?: string; description?: string }>;
};

export type HardDeleteLessonPlanTemplateResult = {
  id: string;
  deletedLessonPlanCount: number;
  deletedLessonPlanUnitCount: number;
};

export type HardDeleteSyllabusResult = {
  id: string;
  deletedLessonPlanCount: number;
  deletedLessonPlanTemplateCount: number;
  deletedLessonPlanUnitCount: number;
};

function cleanToken(token: string) {
  const normalized = token.replace(/^Bearer\s+/i, "").trim();
  if (
    !normalized ||
    normalized === "null" ||
    normalized === "undefined" ||
    normalized.length < 10
  ) {
    return null;
  }
  return normalized;
}

function findToken(value: unknown, depth = 0): string | null {
  if (depth > 5 || value == null) return null;
  if (typeof value === "string") return cleanToken(value);
  if (typeof value !== "object") return null;

  const entries = Object.entries(value as Record<string, unknown>);
  for (const [key, nestedValue] of entries) {
    if (/access.*token|jwt|id.*token/i.test(key) && typeof nestedValue === "string") {
      const token = cleanToken(nestedValue);
      if (token) return token;
    }
  }

  for (const [, nestedValue] of entries) {
    const token = findToken(nestedValue, depth + 1);
    if (token) return token;
  }

  return null;
}

function readStoredToken(storage: Storage, key: string) {
  const rawValue = storage.getItem(key);
  if (!rawValue) return null;

  const trimmed = rawValue.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return findToken(JSON.parse(trimmed) as unknown);
    } catch {
      return null;
    }
  }

  return cleanToken(trimmed);
}

function getClientAccessToken() {
  if (typeof window === "undefined") return null;

  const tokenKeys = [
    "accessToken",
    "access_token",
    "authToken",
    "token",
    "jwt",
    "idToken",
  ];
  for (const key of tokenKeys) {
    const token =
      readStoredToken(window.localStorage, key) ??
      readStoredToken(window.sessionStorage, key);
    if (token) return token;
  }

  for (const storage of [window.localStorage, window.sessionStorage]) {
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (!key || !/auth|token|jwt/i.test(key)) continue;

      const token = readStoredToken(storage, key);
      if (token) return token;
    }
  }

  return null;
}

function buildHeaders() {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");

  const token = getClientAccessToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

async function deleteRequest<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "DELETE",
    credentials: "include",
    headers: buildHeaders(),
  });

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (
    !response.ok ||
    payload?.isSuccess === false ||
    payload?.success === false
  ) {
    const validationMessage = payload?.errors?.find(
      (error) => error.description,
    )?.description;
    throw new Error(
      validationMessage ??
        payload?.message ??
        payload?.detail ??
        payload?.title ??
        "Không thể xóa vĩnh viễn.",
    );
  }

  return ((payload?.data ?? payload) as T) ?? ({} as T);
}

export function hardDeleteLessonPlanTemplate(id: string) {
  return deleteRequest<HardDeleteLessonPlanTemplateResult>(
    `/api/lesson-plan-templates/${encodeURIComponent(id)}/hard-delete`,
  );
}

export function hardDeleteSyllabus(id: string) {
  return deleteRequest<HardDeleteSyllabusResult>(
    `/api/syllabuses/${encodeURIComponent(id)}/hard-delete`,
  );
}
