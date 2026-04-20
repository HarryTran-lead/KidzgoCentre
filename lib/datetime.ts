/**
 * Centralized DateTime utilities for the KidzGo frontend.
 *
 * Backend contract (ISO 8601 with offset):
 * - Response: "2026-04-09T08:00:00+07:00"
 * - Request:  "2026-04-09T08:00:00+07:00" or "2026-04-09T01:00:00Z"
 * - DateOnly: "2026-04-09"
 *
 * Rules:
 * 1. Always send DateTime with offset (+07:00 or Z).
 * 2. Parse response DateTime via `new Date(isoString)` — offset is embedded.
 * 3. Never manually add/subtract 7 hours.
 * 4. Use these helpers instead of inline date formatting.
 */

const VN_TZ = "Asia/Ho_Chi_Minh";

const pad2 = (n: number) => String(n).padStart(2, "0");

// ─── Format helpers (display) ───────────────────────────────────────

/** Format an ISO DateTime string to "dd/MM/yyyy, HH:mm" in Vietnam time. */
export function formatDateTimeVN(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("vi-VN", {
    timeZone: VN_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Format an ISO DateTime string to "dd/MM/yyyy" in Vietnam time. */
export function formatDateVN(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("vi-VN", {
    timeZone: VN_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Format an ISO DateTime string to "HH:mm" in Vietnam time. */
export function formatTimeVN(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("vi-VN", {
    timeZone: VN_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// ─── Date-only helpers ──────────────────────────────────────────────

/**
 * Get today's date as "yyyy-MM-dd" in Vietnam time.
 * Safe replacement for `new Date().toISOString().split("T")[0]`.
 */
export function todayDateOnly(): string {
  return dateOnlyVN(new Date());
}

/**
 * Convert a Date to "yyyy-MM-dd" in Vietnam time.
 * Safe replacement for `date.toISOString().split("T")[0]`.
 */
export function dateOnlyVN(date: Date): string {
  const parts = new Intl.DateTimeFormat("sv-SE", { timeZone: VN_TZ }).format(date);
  return parts; // "sv-SE" locale produces "yyyy-MM-dd"
}

// ─── ISO 8601 with offset (for API requests) ───────────────────────

/**
 * Build an ISO 8601 string with +07:00 offset for start-of-day.
 * Input: "yyyy-MM-dd" or Date. Output: "yyyy-MM-ddT00:00:00+07:00".
 */
export function toISOStartOfDayVN(input?: string | Date): string {
  const dateStr = typeof input === "string" ? input : input ? dateOnlyVN(input) : todayDateOnly();
  return `${dateStr}T00:00:00+07:00`;
}

/**
 * Build an ISO 8601 string with +07:00 offset for end-of-day.
 * Input: "yyyy-MM-dd" or Date. Output: "yyyy-MM-ddT23:59:59+07:00".
 */
export function toISOEndOfDayVN(input?: string | Date): string {
  const dateStr = typeof input === "string" ? input : input ? dateOnlyVN(input) : todayDateOnly();
  return `${dateStr}T23:59:59+07:00`;
}

/**
 * Get current timestamp as ISO 8601 with +07:00 offset.
 * Safe replacement for `new Date().toISOString()` when sending to API.
 */
export function nowISOVN(): string {
  const now = new Date();
  const vnParts = getVNParts(now);
  return `${vnParts.year}-${vnParts.month}-${vnParts.day}T${vnParts.hour}:${vnParts.minute}:${vnParts.second}+07:00`;
}

/**
 * Convert a Date + time string to ISO 8601 with +07:00 for API submission.
 * Example: toISODateTimeVN("2026-04-09", "08:00") → "2026-04-09T08:00:00+07:00"
 */
export function toISODateTimeVN(date: string, time: string): string {
  const normalizedTime = time.includes(":") ? time : `${time}:00`;
  const parts = normalizedTime.split(":");
  const hh = pad2(Number(parts[0]) || 0);
  const mm = pad2(Number(parts[1]) || 0);
  const ss = pad2(Number(parts[2]) || 0);
  return `${date}T${hh}:${mm}:${ss}+07:00`;
}

/**
 * Parse API datetime and keep wall-clock fields unchanged.
 *
 * Use this only for legacy endpoints that may serialize local time with a trailing
 * timezone suffix (for example "Z") even when the intended display time should
 * stay the same as the original hour/minute in payload.
 */
export function parseApiDateKeepWallClock(value?: string | null): Date {
  if (!value) return new Date(NaN);

  const normalized = value.trim();
  const match = normalized.match(
    /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,7})?)?(?:Z|[+-]\d{2}:?\d{2})?$/
  );

  if (!match) {
    return new Date(normalized);
  }

  const [, y, m, d, hh, mm, ss] = match;
  return new Date(
    Number(y),
    Number(m) - 1,
    Number(d),
    Number(hh),
    Number(mm),
    Number(ss ?? "0"),
    0
  );
}

// ─── Internal ───────────────────────────────────────────────────────

function getVNParts(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: VN_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((p) => [p.type, p.value])
  );
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour === "24" ? "00" : parts.hour,
    minute: parts.minute,
    second: parts.second,
  };
}
