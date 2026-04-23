export function getDomainErrorMessage(title?: string): string {
  const map: Record<string, string> = {
    "FaqCategory.HasFaqItems": "Không thể xóa danh mục vì vẫn còn câu hỏi chưa bị xóa.",
    "FaqCategory.NameAlreadyExists": "Tên danh mục đã tồn tại.",
    "FaqCategory.NotFound": "Danh mục không tồn tại.",
    "FaqCategory.AlreadyDeleted": "Danh mục đã bị xóa trước đó.",
    "FaqItem.NotFound": "Câu hỏi không tồn tại.",
    "FaqItem.AlreadyDeleted": "Câu hỏi đã bị xóa trước đó.",
    "Validation.General": "Dữ liệu không hợp lệ.",
  };

  return title ? (map[title] ?? title) : "Đã xảy ra lỗi không xác định.";
}

export function extractApiError(err: unknown): string {
  const e = err as any;
  const data = e?.response?.data ?? e?.data ?? e;

  if (data?.title) return getDomainErrorMessage(data.title);
  if (data?.message) return data.message;
  if (data?.detail) return data.detail;
  if (typeof data === "string") return data;

  return "Đã xảy ra lỗi không xác định.";
}
