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
    return "Buoi hoc bu moi phai nam trong cung chuong trinh hoc bu voi lich hien tai.";
  }

  if (
    code === "MakeupCredit.TargetSessionFull" ||
    code === "MakeupCredit.SessionFull"
  ) {
    return "Buoi hoc bu ban chon da het slot. Vui long chon buoi khac.";
  }

  if (code === "MakeupCredit.NotAvailable") {
    return mode === "change"
      ? "Credit nay hien khong con du dieu kien de doi lich. Vui long tai lai danh sach va thu lai."
      : "Makeup credit nay hien khong con kha dung de xep lich.";
  }

  return extractMakeupCreditErrorMessage(
    error,
    mode === "change"
      ? "Khong the thay doi lich hoc bu."
      : "Khong the tao lich hoc bu."
  );
}
