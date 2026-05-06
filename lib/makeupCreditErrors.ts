type MakeupCreditActionMode = "create" | "change";

const asText = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : "";

const getErrorPayload = (error: unknown) => {
  if (!error || typeof error !== "object") return null;
  return (error as any)?.response?.data ?? (error as any)?.data ?? null;
};

export function extractMakeupCreditErrorCode(error: unknown) {
  const payload = getErrorPayload(error);
  return (
    asText(payload?.code) ||
    asText(payload?.title) ||
    asText(payload?.errorCode) ||
    asText(payload?.data?.code) ||
    asText(payload?.data?.title) ||
    asText(payload?.data?.errorCode)
  );
}

export function extractMakeupCreditErrorMessage(error: unknown, fallback: string) {
  const payload = getErrorPayload(error);

  return (
    asText(payload?.description) ||
    asText(payload?.detail) ||
    asText(payload?.message) ||
    asText(payload?.error?.message) ||
    asText(payload?.data?.description) ||
    asText(payload?.data?.detail) ||
    asText(payload?.data?.message) ||
    asText((error as any)?.message) ||
    fallback
  );
}

export function resolveMakeupCreditActionError(
  error: unknown,
  mode: MakeupCreditActionMode
) {
  const code = extractMakeupCreditErrorCode(error);

  if (code === "MakeupCredit.MustStayInCurrentMakeupProgram") {
    return "The new make-up session must stay in the same make-up program as the current schedule.";
  }

  if (
    code === "MakeupCredit.TargetSessionFull" ||
    code === "MakeupCredit.SessionFull"
  ) {
    return "The selected make-up session is full. Please choose another session.";
  }

  if (code === "MakeupCredit.NotAvailable") {
    return mode === "change"
      ? "This make-up credit is no longer eligible for rescheduling. Please refresh and try again."
      : "This make-up credit is no longer available for scheduling.";
  }

  if (code === "MakeupCredit.TargetClassMustBeMakeupProgram") {
    return "The selected session must belong to a make-up program class.";
  }

  if (code === "MakeupCredit.CannotChangeAllocatedPastSession") {
    return "Cannot reschedule because the current make-up session is today or already in the past.";
  }

  if (code === "MakeupCredit.ParentMustProvideStudentProfileId") {
    return "Please select a student before scheduling this make-up session.";
  }

  if (code === "MakeupCredit.TargetSessionConflict") {
    return "The selected make-up session conflicts with another assigned session.";
  }

  return extractMakeupCreditErrorMessage(
    error,
    mode === "change"
      ? "Unable to reschedule this make-up session."
      : "Unable to create this make-up session."
  );
}
