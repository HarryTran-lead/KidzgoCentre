import { mapApiErrorToMessage } from "@/lib/api/errorMapper";

type ErrorLike = {
  message?: string;
  status?: number;
  data?: unknown;
  response?: {
    status?: number;
    data?: unknown;
  };
};

export function extractApiError(error: unknown, fallback = "Đã có lỗi xảy ra. Vui lòng thử lại."): string {
  const payload = error as ErrorLike;
  const data = payload?.response?.data ?? payload?.data;
  const status = Number(payload?.response?.status ?? payload?.status ?? 0) || undefined;
  const rawText = typeof data === "string" ? data : payload?.message;

  return mapApiErrorToMessage(data, status, fallback, rawText);
}
