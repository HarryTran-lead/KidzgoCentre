export const WEEKDAY_CODES = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"] as const;

export type WeekdayCode = (typeof WEEKDAY_CODES)[number];

export type BuildWeeklyRRuleInput = {
  days: WeekdayCode[];
  startTime?: string;
  durationMinutes?: number;
  includePrefix?: boolean;
};

export type ValidateFutureStretchInput = {
  effectiveFrom: string;
  days: WeekdayCode[];
  currentSessionsPerWeek?: number;
  schedulePattern?: string;
  today?: string;
};

const WEEKDAY_SET = new Set<string>(WEEKDAY_CODES as readonly string[]);

function normalizeDays(days: WeekdayCode[]): WeekdayCode[] {
  const unique = new Set<WeekdayCode>();
  for (const day of days) {
    if (WEEKDAY_SET.has(day)) unique.add(day);
  }
  return WEEKDAY_CODES.filter((day) => unique.has(day));
}

function normalizeTime(time?: string): { hour?: string; minute?: string } {
  if (!time) return {};
  const match = /^(\d{1,2}):(\d{1,2})$/.exec(time.trim());
  if (!match) return {};

  const rawHour = Number(match[1]);
  const rawMinute = Number(match[2]);
  if (!Number.isInteger(rawHour) || !Number.isInteger(rawMinute)) return {};
  if (rawHour < 0 || rawHour > 23 || rawMinute < 0 || rawMinute > 59) return {};

  return {
    hour: String(rawHour),
    minute: String(rawMinute),
  };
}

export function buildWeeklyRRule(input: BuildWeeklyRRuleInput): string {
  const days = normalizeDays(input.days);
  if (days.length === 0) {
    throw new Error("At least one weekday is required to build schedulePattern");
  }

  const tokens: string[] = ["FREQ=WEEKLY", `BYDAY=${days.join(",")}`];
  const time = normalizeTime(input.startTime);

  if (time.hour !== undefined) tokens.push(`BYHOUR=${time.hour}`);
  if (time.minute !== undefined) tokens.push(`BYMINUTE=${time.minute}`);

  if (
    typeof input.durationMinutes === "number" &&
    Number.isInteger(input.durationMinutes) &&
    input.durationMinutes > 0
  ) {
    tokens.push(`DURATION=${input.durationMinutes}`);
  }

  const base = tokens.join(";");
  return input.includePrefix ? `RRULE:${base}` : base;
}

export function countWeeklySessionsFromRRule(schedulePattern?: string): number | null {
  if (!schedulePattern) return null;

  const normalized = schedulePattern.replace(/^RRULE:/i, "");
  const byDayToken = normalized
    .split(";")
    .map((token) => token.trim())
    .find((token) => token.toUpperCase().startsWith("BYDAY="));

  if (!byDayToken) return null;

  const value = byDayToken.split("=")[1] || "";
  const days = value
    .split(",")
    .map((day) => day.trim().toUpperCase())
    .filter((day) => WEEKDAY_SET.has(day));

  const unique = new Set(days);
  return unique.size;
}

export function validateFutureStretchInput(input: ValidateFutureStretchInput): string[] {
  const errors: string[] = [];
  const today = input.today || new Date().toISOString().slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.effectiveFrom)) {
    errors.push("effectiveFrom must be in yyyy-MM-dd format");
  } else if (input.effectiveFrom <= today) {
    errors.push("effectiveFrom must be a future date");
  }

  const normalizedDays = normalizeDays(input.days);
  if (normalizedDays.length === 0) {
    errors.push("at least one weekday is required");
  }

  if (
    typeof input.currentSessionsPerWeek === "number" &&
    normalizedDays.length <= input.currentSessionsPerWeek
  ) {
    errors.push("new sessionsPerWeek must be greater than current sessionsPerWeek");
  }

  if (input.schedulePattern) {
    const expectedCount = normalizedDays.length;
    const patternCount = countWeeklySessionsFromRRule(input.schedulePattern);
    if (patternCount !== null && patternCount !== expectedCount) {
      errors.push("schedulePattern BYDAY does not match selected weekdays");
    }
  }

  return errors;
}