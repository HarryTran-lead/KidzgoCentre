type ErrorLike = {
  code?: string;
  status?: number;
  response?: {
    status?: number;
    data?: {
      code?: string;
      status?: number;
      title?: string;
      detail?: string;
      message?: string;
      error?: string;
      errors?: Array<{ code?: string }>;
    };
  };
  raw?: {
    code?: string;
    status?: number;
    errors?: Array<{ code?: string }>;
  };
};

const CODE_TO_VIETNAMESE_MESSAGE: Record<string, string> = {
  // Placement Test - Not Found
  "PlacementTest.NotFound": "Không tìm thấy bài test",
  "PlacementTest.LeadNotFound": "Không tìm thấy lead",
  "PlacementTest.StudentProfileNotFound": "Không tìm thấy học viên",
  "PlacementTest.ClassNotFound": "Không tìm thấy lớp học",
  "PlacementTest.InvigilatorNotFound": "Không tìm thấy giám thị",

  // Placement Test - Validation
  "PlacementTest.InvalidStatusTransition": "Không thể chuyển trạng thái bài test",
  "PlacementTest.CannotUpdateCompletedTest": "Không thể cập nhật bài test đã hoàn thành",
  "PlacementTest.CannotCancelCompletedTest": "Không thể hủy bài test đã hoàn thành",
  "PlacementTest.CannotMarkNoShowCompletedTest": "Không thể đánh dấu vắng cho bài test đã hoàn thành",

  // Placement Test - Conflict
  "PlacementTest.LeadAlreadyEnrolled": "Lead đã được chuyển thành học viên",
  "PlacementTest.StudentProfileAlreadyAssigned": "Học viên đã được gán cho child khác",

  // Lead - Not Found
  "Lead.NotFound": "Lead không tồn tại",
  "Lead.OwnerNotFound": "Nhân viên phụ trách không tồn tại",
  "Lead.BranchNotFound": "Chi nhánh không tồn tại",

  // Lead - Validation
  "Lead.InvalidContactInfo": "Cần nhập ít nhất tên, số điện thoại hoặc email",
  "Lead.InvalidSource": "Nguồn lead không hợp lệ",
  "Lead.InvalidStatus": "Trạng thái lead không hợp lệ",
  "Lead.OwnerNotStaff": "Người phụ trách phải là nhân viên",
  "Lead.CannotUpdateConvertedLead": "Không thể cập nhật lead đã được chuyển đổi",
  "Lead.InvalidStatusTransition": "Không thể chuyển trạng thái lead",

  // Lead - Conflict
  "Lead.DuplicateLead": "Lead đã tồn tại (trùng SĐT/email/Zalo)",

  // Registration - Create/Update/Common
  "Registration.StudentNotFound": "Không tìm thấy học viên hoặc hồ sơ không hợp lệ.",
  "Registration.BranchNotFound": "Chi nhánh không tồn tại. Vui lòng tải lại danh sách.",
  "Registration.ProgramNotFound": "Chương trình không tồn tại. Vui lòng tải lại danh sách.",
  "Registration.TuitionPlanNotFound": "Gói học không hợp lệ. Vui lòng chọn lại gói học.",
  "Registration.SecondaryProgramDuplicated": "Chương trình secondary không được trùng chương trình chính.",
  "Registration.AlreadyExists": "Học viên đã có đăng ký đang hoạt động cho chương trình này.",
  "Registration.NotFound": "Không tìm thấy đăng ký.",
  "Registration.InvalidStatus": "Trạng thái đăng ký hiện tại không cho phép thao tác này.",
  "Registration.SecondaryClassAssigned": "Đã xếp lớp cho secondary, không thể gỡ secondary lúc này.",
  "Registration.SecondaryProgramMissing": "Thiếu chương trình secondary cho thao tác này.",
  "Registration.ClassAlreadyAssigned": "Track này đã được xếp lớp.",
  "DifferentProgram": "Gói học mới phải cùng chương trình với đăng ký hiện tại.",

  // Suggest/Assign/Transfer/Upgrade
  "Registration.ClassIdRequired": "Vui lòng chọn lớp trước khi xếp lớp.",
  "Registration.ClassNotFound": "Không tìm thấy lớp. Vui lòng tải lại danh sách lớp.",
  "Registration.ClassNotMatchingProgram": "Lớp không thuộc đúng chương trình của đăng ký.",
  "Registration.ClassFull": "Lớp đã hết chỗ.",
  "ClassNotAvailable": "Lớp hiện không khả dụng để xếp.",
  "AlreadyEnrolled": "Học viên đã được ghi danh.",
  "NoClassAssigned": "Chưa có lớp hiện tại để chuyển lớp.",
  "Registration.CannotTransferToSameClass": "Không thể chuyển sang chính lớp hiện tại.",
  "Registration.NoActiveRegistrationForUpgrade": "Đăng ký hiện tại không ở trạng thái cho phép nâng cấp.",

  // Enrollment pattern validation
  "Enrollment.SessionSelectionPatternInvalid": "Mẫu chọn buổi học không hợp lệ.",
  "Enrollment.SessionSelectionPatternEmpty": "Mẫu chọn buổi học đang rỗng.",
  "Enrollment.SessionSelectionPatternMismatch": "Mẫu chọn buổi học không khớp lịch lớp.",
  "Enrollment.ClassSchedulePatternInvalid": "Lịch lớp không hợp lệ. Vui lòng tải lại dữ liệu lớp.",
};

function normalizeCode(value?: string): string {
  return String(value || "").trim();
}

export function extractDomainErrorCode(error: unknown): string | undefined {
  const e = (error || {}) as ErrorLike;

  const candidates = [
    normalizeCode(e?.response?.data?.code),
    normalizeCode(e?.raw?.code),
    normalizeCode(e?.response?.data?.errors?.[0]?.code),
    normalizeCode(e?.raw?.errors?.[0]?.code),
    normalizeCode(e?.code),
  ].filter(Boolean);

  const exactCodes = new Set([
    "DifferentProgram",
    "ClassNotAvailable",
    "AlreadyEnrolled",
    "NoClassAssigned",
  ]);

  const domainCode = candidates.find(
    (code) =>
      code.startsWith("PlacementTest.") ||
      code.startsWith("Lead.") ||
      code.startsWith("Registration.") ||
      code.startsWith("Enrollment.") ||
      exactCodes.has(code),
  );

  return domainCode || undefined;
}

export function mapDomainErrorCodeToMessage(code?: string): string | undefined {
  if (!code) return undefined;
  return CODE_TO_VIETNAMESE_MESSAGE[code];
}

export function getDomainErrorMessage(
  error: unknown,
  fallback = "Đã có lỗi xảy ra. Vui lòng thử lại.",
): string {
  const code = extractDomainErrorCode(error);
  const mapped = mapDomainErrorCodeToMessage(code);
  if (mapped) return mapped;

  const status = Number(
    (error as ErrorLike)?.response?.status ||
      (error as ErrorLike)?.response?.data?.status ||
      (error as ErrorLike)?.status ||
      0,
  );

  if (status === 401 || status === 403) {
    return "Phiên đăng nhập đã hết hạn hoặc bạn không có quyền thao tác";
  }
  if (status === 404) {
    return "Không tìm thấy dữ liệu";
  }

  return fallback;
}
