import { REGISTRATION_ENDPOINTS } from "@/constants/apiURL";
import { get, put } from "@/lib/axios";
import type {
  EnrollmentPaymentSetting,
  UpsertPaymentSettingRequest,
} from "@/types/registration";

type AnyRecord = Record<string, unknown>;

const DEFAULT_SETTING: EnrollmentPaymentSetting = {
  id: null,
  branchId: null,
  paymentMethod: "BankTransfer",
  accountName: null,
  accountNumber: null,
  bankName: null,
  bankCode: null,
  bankBin: null,
  vietQrTemplate: "compact2",
  logoUrl: null,
  qrPreviewUrl: null,
  isActive: true,
};

function toNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toRequiredString(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

function unwrapPayload(raw: unknown): AnyRecord {
  const topLevel = raw as AnyRecord;

  if (topLevel && typeof topLevel === "object") {
    const data = topLevel.data as AnyRecord | undefined;
    if (data && typeof data === "object") {
      if (data.data && typeof data.data === "object") {
        return data.data as AnyRecord;
      }
      return data;
    }
  }

  return (raw ?? {}) as AnyRecord;
}

function normalizeSetting(raw: unknown): EnrollmentPaymentSetting {
  const payload = unwrapPayload(raw);
  const candidate =
    payload.setting && typeof payload.setting === "object"
      ? (payload.setting as AnyRecord)
      : payload;

  return {
    id: toNullableString(candidate.id),
    branchId: toNullableString(candidate.branchId),
    isFallbackToGlobal:
      typeof candidate.isFallbackToGlobal === "boolean"
        ? candidate.isFallbackToGlobal
        : undefined,
    paymentMethod: toRequiredString(
      candidate.paymentMethod,
      DEFAULT_SETTING.paymentMethod
    ),
    accountName: toNullableString(candidate.accountName),
    accountNumber: toNullableString(candidate.accountNumber),
    bankName: toNullableString(candidate.bankName),
    bankCode: toNullableString(candidate.bankCode),
    bankBin: toNullableString(candidate.bankBin),
    vietQrTemplate: toRequiredString(
      candidate.vietQrTemplate,
      DEFAULT_SETTING.vietQrTemplate
    ),
    logoUrl: toNullableString(candidate.logoUrl),
    qrPreviewUrl: toNullableString(candidate.qrPreviewUrl),
    isActive:
      typeof candidate.isActive === "boolean"
        ? candidate.isActive
        : DEFAULT_SETTING.isActive,
    createdAt: toNullableString(candidate.createdAt),
    updatedAt: toNullableString(candidate.updatedAt),
    updatedBy: toNullableString(candidate.updatedBy),
  };
}

export async function getEnrollmentPaymentSetting(
  branchId?: string | null
): Promise<EnrollmentPaymentSetting> {
  const queryParams = new URLSearchParams();

  if (branchId) {
    queryParams.append("branchId", branchId);
  }

  const endpoint =
    queryParams.toString().length > 0
      ? `${REGISTRATION_ENDPOINTS.ENROLLMENT_CONFIRMATION_PAYMENT_SETTING}?${queryParams.toString()}`
      : REGISTRATION_ENDPOINTS.ENROLLMENT_CONFIRMATION_PAYMENT_SETTING;

  const response = await get<any>(endpoint);
  return normalizeSetting(response);
}

export async function upsertEnrollmentPaymentSetting(
  payload: UpsertPaymentSettingRequest
): Promise<EnrollmentPaymentSetting> {
  const response = await put<any>(
    REGISTRATION_ENDPOINTS.ENROLLMENT_CONFIRMATION_PAYMENT_SETTING,
    payload
  );

  return normalizeSetting(response);
}
