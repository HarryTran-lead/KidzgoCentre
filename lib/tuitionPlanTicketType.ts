import type { SuggestedClassBucket } from "@/types/registration";

export type LearningTicketTypeLike = {
  learningTicketTypeCode?: string | null;
  learningTicketTypeName?: string | null;
};

export type SlotTypeLike = {
  slotTypeId?: string | null;
  slotTypeCode?: string | null;
  slotTypeName?: string | null;
  slotType?: {
    id?: string | null;
    code?: string | null;
    name?: string | null;
  } | null;
};

export const STANDARD_LEARNING_TICKET_TYPE_CODE = "STANDARD";
const NATIVE_LEARNING_TICKET_TYPE_CODE = "NATIVE";

function normalizeIdentity(...values: Array<string | null | undefined>) {
  return values
    .map((value) =>
      String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toUpperCase(),
    )
    .filter(Boolean)
    .join(" ");
}

export function getLearningTicketTypeLabel(item?: LearningTicketTypeLike | null) {
  return (
    String(item?.learningTicketTypeCode || item?.learningTicketTypeName || "").trim() ||
    STANDARD_LEARNING_TICKET_TYPE_CODE
  );
}

export function isKnownNonStandardLearningTicketType(
  item?: LearningTicketTypeLike | null,
) {
  const codeIdentity = normalizeIdentity(item?.learningTicketTypeCode);
  const nameIdentity = normalizeIdentity(item?.learningTicketTypeName);
  const identity = codeIdentity || nameIdentity;
  if (!identity) return false;
  if (codeIdentity.includes(NATIVE_LEARNING_TICKET_TYPE_CODE)) return true;
  if (codeIdentity.includes(STANDARD_LEARNING_TICKET_TYPE_CODE)) return false;
  if (identity.includes(NATIVE_LEARNING_TICKET_TYPE_CODE)) return true;
  if (identity.includes(STANDARD_LEARNING_TICKET_TYPE_CODE)) return false;
  return true;
}

export function supportsParallelLevels(item?: LearningTicketTypeLike | null) {
  return !isKnownNonStandardLearningTicketType(item);
}

function getLearningTicketTypeKind(item?: LearningTicketTypeLike | null) {
  const codeIdentity = normalizeIdentity(item?.learningTicketTypeCode);
  const nameIdentity = normalizeIdentity(item?.learningTicketTypeName);
  const identity = codeIdentity || nameIdentity;
  if (codeIdentity.includes(NATIVE_LEARNING_TICKET_TYPE_CODE)) {
    return NATIVE_LEARNING_TICKET_TYPE_CODE;
  }
  if (codeIdentity.includes(STANDARD_LEARNING_TICKET_TYPE_CODE)) {
    return STANDARD_LEARNING_TICKET_TYPE_CODE;
  }
  if (identity.includes(NATIVE_LEARNING_TICKET_TYPE_CODE)) {
    return NATIVE_LEARNING_TICKET_TYPE_CODE;
  }
  if (identity.includes(STANDARD_LEARNING_TICKET_TYPE_CODE)) {
    return STANDARD_LEARNING_TICKET_TYPE_CODE;
  }
  return "";
}

function getSlotTypeKind(item?: SlotTypeLike | null) {
  const codeIdentity = normalizeIdentity(
    item?.slotTypeCode,
    item?.slotType?.code,
  );
  const nameIdentity = normalizeIdentity(
    item?.slotTypeName,
    item?.slotType?.name,
  );
  const identity = codeIdentity || nameIdentity;
  if (codeIdentity.includes(NATIVE_LEARNING_TICKET_TYPE_CODE)) {
    return NATIVE_LEARNING_TICKET_TYPE_CODE;
  }
  if (codeIdentity.includes(STANDARD_LEARNING_TICKET_TYPE_CODE)) {
    return STANDARD_LEARNING_TICKET_TYPE_CODE;
  }
  if (identity.includes(NATIVE_LEARNING_TICKET_TYPE_CODE)) {
    return NATIVE_LEARNING_TICKET_TYPE_CODE;
  }
  if (identity.includes(STANDARD_LEARNING_TICKET_TYPE_CODE)) {
    return STANDARD_LEARNING_TICKET_TYPE_CODE;
  }
  return "";
}

export function getClassSlotTypeLabel(item?: SlotTypeLike | null) {
  return String(
    item?.slotTypeCode ||
      item?.slotTypeName ||
      item?.slotType?.code ||
      item?.slotType?.name ||
      "",
  ).trim();
}

export function isClassCompatibleWithLearningTicketType(
  cls?: SlotTypeLike | null,
  learningTicketType?: LearningTicketTypeLike | null,
) {
  const ticketKind = getLearningTicketTypeKind(learningTicketType);
  if (!ticketKind) return true;
  return getSlotTypeKind(cls) === ticketKind;
}

export function filterClassesByLearningTicketType<T extends SlotTypeLike>(
  classes: T[],
  learningTicketType?: LearningTicketTypeLike | null,
) {
  return classes.filter((cls) =>
    isClassCompatibleWithLearningTicketType(cls, learningTicketType),
  );
}

export function filterSuggestedClassBucketByLearningTicketType(
  bucket: SuggestedClassBucket,
  learningTicketType?: LearningTicketTypeLike | null,
): SuggestedClassBucket {
  const suggestedClasses = filterClassesByLearningTicketType(
    bucket.suggestedClasses || [],
    learningTicketType,
  );
  const alternativeClasses = filterClassesByLearningTicketType(
    bucket.alternativeClasses || [],
    learningTicketType,
  );
  const secondarySuggestedClasses = filterClassesByLearningTicketType(
    bucket.secondarySuggestedClasses || [],
    learningTicketType,
  );
  const secondaryAlternativeClasses = filterClassesByLearningTicketType(
    bucket.secondaryAlternativeClasses || [],
    learningTicketType,
  );

  return {
    ...bucket,
    length:
      suggestedClasses.length +
      alternativeClasses.length +
      secondarySuggestedClasses.length +
      secondaryAlternativeClasses.length,
    suggestedClasses,
    alternativeClasses,
    secondarySuggestedClasses,
    secondaryAlternativeClasses,
  };
}
