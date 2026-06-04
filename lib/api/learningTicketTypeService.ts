import type {
  CreateLearningTicketTypeRequest,
  LearningTicketType,
  LearningTicketTypeQueryParams,
  LearningTicketTypesResponse,
  UpdateLearningTicketTypeRequest,
} from "@/types/learning-ticket-type";

type ApiEnvelope<T> = {
  isSuccess?: boolean;
  data?: T;
  detail?: string;
  title?: string;
  errors?: Array<{ description?: string; code?: string }>;
};

const BASE_URL = "/api/learning-ticket-types";

function cleanToken(token: string) {
  const normalized = token.replace(/^Bearer\s+/i, "").trim();
  if (!normalized || normalized === "null" || normalized === "undefined" || normalized.length < 10) {
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

  const tokenKeys = ["accessToken", "access_token", "authToken", "token", "jwt", "idToken"];
  for (const key of tokenKeys) {
    const token = readStoredToken(window.localStorage, key) ?? readStoredToken(window.sessionStorage, key);
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

function buildHeaders(initHeaders?: HeadersInit) {
  const headers = new Headers(initHeaders);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const token = getClientAccessToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: "include",
    headers: buildHeaders(init?.headers),
  });

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok) {
    const validationMessage = payload?.errors?.find((error) => error.description)?.description;
    throw new Error(validationMessage ?? payload?.detail ?? payload?.title ?? "Request failed");
  }

  return ((payload?.data ?? payload) as T) ?? ({} as T);
}

function buildQuery(params?: LearningTicketTypeQueryParams) {
  const searchParams = new URLSearchParams();
  if (params?.searchTerm) searchParams.set("searchTerm", params.searchTerm);
  if (typeof params?.isActive === "boolean") searchParams.set("isActive", String(params.isActive));

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function stringOrUndefined(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? (value.filter(Boolean) as string[]) : [];
}

export function normalizeLearningTicketType(value: unknown): LearningTicketType {
  const record = (value ?? {}) as Record<string, unknown>;

  return {
    id: stringOrUndefined(record.id) ?? "",
    code: stringOrUndefined(record.code) ?? "",
    name: stringOrUndefined(record.name) ?? "",
    description: typeof record.description === "string" ? record.description : null,
    compatibilityMode:
      record.compatibilityMode === "AllowAll" || record.compatibilityMode === "RuleBased" || record.compatibilityMode === "None"
        ? record.compatibilityMode
        : "None",
    allowedDayGroups: stringArray(record.allowedDayGroups) as LearningTicketType["allowedDayGroups"],
    allowedTimeBands: stringArray(record.allowedTimeBands) as LearningTicketType["allowedTimeBands"],
    allowedTeacherTypes: stringArray(record.allowedTeacherTypes) as LearningTicketType["allowedTeacherTypes"],
    allowedUsageTypes: stringArray(record.allowedUsageTypes) as LearningTicketType["allowedUsageTypes"],
    isActive: Boolean(record.isActive ?? true),
    createdAt: stringOrUndefined(record.createdAt),
    updatedAt: stringOrUndefined(record.updatedAt),
  };
}

function normalizeList(payload: unknown): LearningTicketTypesResponse {
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { items?: unknown[] } | null)?.items)
      ? ((payload as { items: unknown[] }).items)
      : [];

  return {
    items: items.map(normalizeLearningTicketType),
  };
}

export async function getLearningTicketTypesResponse(params?: LearningTicketTypeQueryParams) {
  const payload = await requestJson<unknown>(`${BASE_URL}${buildQuery(params)}`);
  return normalizeList(payload);
}

export async function getLearningTicketTypes(params?: LearningTicketTypeQueryParams) {
  const response = await getLearningTicketTypesResponse(params);
  return response.items;
}

export async function getLearningTicketType(id: string) {
  const payload = await requestJson<unknown>(`${BASE_URL}/${id}`);
  return normalizeLearningTicketType(payload);
}

export const getLearningTicketTypeById = getLearningTicketType;

export async function createLearningTicketType(payload: CreateLearningTicketTypeRequest) {
  const response = await requestJson<unknown>(BASE_URL, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return normalizeLearningTicketType(response);
}

export async function updateLearningTicketType(id: string, payload: UpdateLearningTicketTypeRequest) {
  const response = await requestJson<unknown>(`${BASE_URL}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return normalizeLearningTicketType(response);
}

export async function deleteLearningTicketType(id: string) {
  await requestJson<unknown>(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });
}

export const learningTicketTypeService = {
  getAll: getLearningTicketTypes,
  list: getLearningTicketTypes,
  getLearningTicketTypes,
  getLearningTicketTypesResponse,
  getById: getLearningTicketType,
  getLearningTicketType,
  getLearningTicketTypeById,
  create: createLearningTicketType,
  createLearningTicketType,
  update: updateLearningTicketType,
  updateLearningTicketType,
  delete: deleteLearningTicketType,
  remove: deleteLearningTicketType,
  deleteLearningTicketType,
};

export default learningTicketTypeService;
