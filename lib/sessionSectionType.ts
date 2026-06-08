export const SESSION_SECTION_TYPES = [
  "Normal",
  "Review",
  "Makeup",
  "Remedial",
  "Assessment",
] as const;

export type SessionSectionType = (typeof SESSION_SECTION_TYPES)[number];

const SECTION_TYPE_BY_KEY = new Map<string, SessionSectionType>(
  SESSION_SECTION_TYPES.map((type) => [type.toLowerCase(), type])
);

function normalizeKnownSectionType(value: unknown): SessionSectionType | null {
  if (typeof value !== "string") return null;
  const key = value.trim().toLowerCase();
  return SECTION_TYPE_BY_KEY.get(key) ?? null;
}

function isLegacyMakeupValue(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return normalized.includes("makeup") || normalized.includes("make-up") || normalized.includes("bù");
}

export function normalizeSessionSectionType(
  sectionType: unknown,
  fallback?: {
    isMakeup?: boolean | null;
    participationType?: unknown;
    track?: unknown;
  }
): SessionSectionType {
  const normalizedSectionType = normalizeKnownSectionType(sectionType);
  if (normalizedSectionType) return normalizedSectionType;

  const legacyParticipationType = normalizeKnownSectionType(fallback?.participationType);
  if (legacyParticipationType) return legacyParticipationType;

  const legacyTrack = normalizeKnownSectionType(fallback?.track);
  if (legacyTrack) return legacyTrack;

  if (
    fallback?.isMakeup ||
    isLegacyMakeupValue(fallback?.participationType) ||
    isLegacyMakeupValue(fallback?.track)
  ) {
    return "Makeup";
  }

  return "Normal";
}
