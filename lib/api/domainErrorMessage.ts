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
  // Leave Request
  "LeaveRequest.NotFound": "Không tìm thấy đơn xin nghỉ.",
  "LeaveRequest.AlreadyCancelled": "Đơn xin nghỉ đã được hủy trước đó.",
  "LeaveRequest.CannotCancel": "Không thể hủy đơn xin nghỉ ở trạng thái hiện tại.",
  "LeaveRequest.CannotCancelPastDate": "Không thể hủy đơn xin nghỉ khi buổi học đã qua.",
  "LeaveRequest.CannotCancelApproved": "Không thể hủy đơn xin nghỉ đã được xử lý.",
  "LeaveRequest.InvalidDateRange": "Khoảng ngày nghỉ không hợp lệ.",
  "LeaveRequest.ExceededMonthlyLeaveLimit": "Học viên đã vượt quá giới hạn số buổi nghỉ trong tháng.",

  // Pause Enrollment Request
  "PauseEnrollmentRequest.NotFound": "Không tìm thấy yêu cầu bảo lưu.",
  "PauseEnrollmentRequest.NoEnrollmentsInRange": "Học viên không có ghi danh đang hoạt động trong khoảng ngày bảo lưu.",
  "PauseEnrollmentRequest.InvalidDateRange": "Khoảng ngày bảo lưu không hợp lệ.",
  "PauseEnrollmentRequest.CannotCancel": "Không thể hủy yêu cầu bảo lưu ở trạng thái hiện tại.",
  "PauseEnrollmentRequest.DuplicateActiveRequest": "Đã tồn tại yêu cầu bảo lưu pending/approved trong khoảng ngày đã chọn.",
  "PauseEnrollmentRequest.AlreadyApproved": "Yêu cầu bảo lưu đã được duyệt trước đó.",
  "PauseEnrollmentRequest.AlreadyRejected": "Yêu cầu bảo lưu đã bị từ chối trước đó.",
  "PauseEnrollmentRequest.AlreadyCancelled": "Yêu cầu bảo lưu đã được hủy trước đó.",
  "PauseEnrollmentRequest.CancelWindowExpired": "Đã quá thời gian cho phép hủy yêu cầu bảo lưu.",
  "PauseEnrollmentRequest.OutcomeOnlyForApproved": "Chỉ có thể cập nhật outcome cho yêu cầu đã duyệt.",
  "PauseEnrollmentRequest.OutcomeNotAllowed": "Outcome chỉ được cập nhật khi yêu cầu đã duyệt.",
  "PauseEnrollmentRequest.OutcomeAlreadyCompleted": "Outcome này đã hoàn tất, không thể cập nhật lại.",
  "PauseEnrollmentRequest.OutcomeMustBeReassignEquivalentClass": "Cần chọn outcome Chuyển lớp tương đương trước khi thực hiện thao tác này.",
  "PauseEnrollmentRequest.NoPausedEnrollmentToReassign": "Không tìm thấy enrollment đang Paused để chuyển lớp.",
  "PauseEnrollmentRequest.EffectiveDateBeforePauseEnd": "Ngày hiệu lực phải sau ngày kết thúc bảo lưu.",
  "PauseEnrollmentRequest.RegistrationStudentMismatch": "Registration không thuộc học sinh của yêu cầu bảo lưu.",

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
  "PlacementTest.RoomUnavailable": "Phòng đã bị chiếm dụng, vui lòng chọn phòng khác",
  "PlacementTest.InvigilatorUnavailable": "Người giám sát đang bận, vui lòng chọn người khác",

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
  "Lead.PhoneAlreadyExists": "Số điện thoại đã tồn tại trong hệ thống lead.",
  "Lead.EmailAlreadyExists": "Email đã tồn tại trong hệ thống lead.",
  "Lead.ZaloAlreadyExists": "Zalo đã tồn tại trong hệ thống lead.",

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
  "Enrollment.NotFound": "Không tìm thấy ghi danh.",
  "Enrollment.ClassNotFound": "Không tìm thấy lớp học cho ghi danh.",
  "Enrollment.StudentNotFound": "Không tìm thấy hồ sơ học viên cho ghi danh.",
  "Enrollment.InvalidStatusTransition": "Không thể chuyển trạng thái ghi danh theo yêu cầu.",
  "Enrollment.CannotPause": "Không thể bảo lưu ghi danh ở trạng thái hiện tại.",
  "Enrollment.CannotDrop": "Không thể cho nghỉ ghi danh ở trạng thái hiện tại.",
  "Enrollment.CannotReactivate": "Không thể kích hoạt lại ghi danh ở trạng thái hiện tại.",
};

function normalizeCode(value?: string): string {
  return String(value || "").trim();
}

function normalizeMessage(value?: string): string {
  return String(value || "").trim();
}

function translateBackendMessageToVietnamese(message?: string): string | undefined {
  const normalized = normalizeMessage(message);
  if (!normalized) return undefined;

  const lower = normalized.toLowerCase();

  const messageMatchers: Array<{ test: RegExp; vi: string }> = [
    {
      test: /failed\s+to\s+create\s+lead/i,
      vi: "Không thể tạo lead. Vui lòng kiểm tra dữ liệu nhập hoặc dữ liệu bị trùng.",
    },
    {
      test: /failed\s+to\s+update\s+lead/i,
      vi: "Không thể cập nhật lead. Vui lòng kiểm tra lại dữ liệu.",
    },
    {
      test: /duplicate\s+lead|lead\s+already\s+exists|duplicate.*(phone|email|zalo)/i,
      vi: "Lead đã tồn tại (trùng SĐT/email/Zalo).",
    },
    {
      test: /failed\s+to\s+create\s+placement\s*test/i,
      vi: "Không thể tạo bài test đầu vào. Vui lòng kiểm tra lại dữ liệu.",
    },
    {
      test: /failed\s+to\s+create\s+registration/i,
      vi: "Không thể tạo đăng ký. Vui lòng kiểm tra lại dữ liệu.",
    },
    {
      test: /failed\s+to\s+create\s+enroll/i,
      vi: "Không thể tạo ghi danh. Vui lòng kiểm tra lại dữ liệu.",
    },
    {
      test: /contact\s*name.*required|name.*required/i,
      vi: "Vui lòng nhập họ và tên người liên hệ.",
    },
    {
      test: /phone.*required|invalid\s+phone/i,
      vi: "Số điện thoại chưa hợp lệ hoặc còn thiếu.",
    },
    {
      test: /email.*invalid|invalid\s+email/i,
      vi: "Email chưa đúng định dạng.",
    },
    {
      test: /student\s+already\s+has\s+an\s+active\s+registration/i,
      vi: "Học viên đã có đăng ký đang hoạt động cho chương trình này.",
    },
    {
      test: /secondary\s+program\s+.*duplicat|secondary\s+program\s+.*same\s+as\s+primary/i,
      vi: "Chương trình secondary không được trùng chương trình chính.",
    },
    {
      test: /tuition\s*plan\s+.*not\s+found|tuition\s*plan\s+.*invalid/i,
      vi: "Gói học không hợp lệ. Vui lòng chọn lại gói học.",
    },
    {
      test: /program\s+.*not\s+found|invalid\s+program/i,
      vi: "Chương trình không tồn tại. Vui lòng tải lại danh sách.",
    },
    {
      test: /branch\s+.*not\s+found|invalid\s+branch/i,
      vi: "Chi nhánh không tồn tại. Vui lòng tải lại danh sách.",
    },
    {
      test: /student\s+.*not\s+found|student\s+profile\s+.*not\s+found/i,
      vi: "Không tìm thấy học viên hoặc hồ sơ không hợp lệ.",
    },
    {
      test: /class\s+.*not\s+found/i,
      vi: "Không tìm thấy lớp. Vui lòng tải lại danh sách lớp.",
    },
    {
      test: /class\s+.*full|no\s+slot|no\s+vacancy/i,
      vi: "Lớp đã hết chỗ.",
    },
    {
      test: /class\s+.*not\s+matching\s+program|different\s+program/i,
      vi: "Lớp không thuộc đúng chương trình của đăng ký.",
    },
    {
      test: /class\s+.*already\s+assigned|track\s+.*already\s+assigned/i,
      vi: "Track này đã được xếp lớp.",
    },
    {
      test: /cannot\s+transfer\s+to\s+same\s+class/i,
      vi: "Không thể chuyển sang chính lớp hiện tại.",
    },
    {
      test: /no\s+active\s+registration\s+for\s+upgrade/i,
      vi: "Đăng ký hiện tại không ở trạng thái cho phép nâng cấp.",
    },
    {
      test: /session\s*selection\s*pattern\s*invalid/i,
      vi: "Mẫu chọn buổi học không hợp lệ.",
    },
    {
      test: /session\s*selection\s*pattern\s*empty/i,
      vi: "Mẫu chọn buổi học đang rỗng.",
    },
    {
      test: /session\s*selection\s*pattern\s*mismatch/i,
      vi: "Mẫu chọn buổi học không khớp lịch lớp.",
    },
    {
      test: /class\s*schedule\s*pattern\s*invalid/i,
      vi: "Lịch lớp không hợp lệ. Vui lòng tải lại dữ liệu lớp.",
    },
    {
      test: /already\s+enrolled/i,
      vi: "Học viên đã được ghi danh.",
    },
    {
      test: /cannot\s+perform\s+action\s+'assign-class'.*cannot\s+change\s+track\s+'primary'\s+back\s+to\s+'wait'/i,
      vi: "Không thể xếp lớp vì đăng ký này đã tạo ghi danh và không thể chuyển chương trình chính về trạng thái chờ.",
    },
    {
      test: /cannot\s+perform\s+action\s+'assign-class'/i,
      vi: "Không thể xếp lớp cho đăng ký ở trạng thái hiện tại.",
    },
    {
      test: /not\s+authorized|forbidden|permission/i,
      vi: "Bạn không có quyền thao tác này.",
    },
    {
      test: /unauthorized|token\s+expired|session\s+expired/i,
      vi: "Phiên đăng nhập đã hết hạn hoặc bạn không có quyền thao tác",
    },
    {
      test: /not\s+found/i,
      vi: "Không tìm thấy dữ liệu.",
    },
    {
      test: /validation\s+failed|one\s+or\s+more\s+validation\s+errors\s+occurred/i,
      vi: "Dữ liệu gửi lên chưa hợp lệ. Vui lòng kiểm tra lại các trường bắt buộc.",
    },
    {
      test: /leave\s*request\s*.*not\s*found/i,
      vi: "Không tìm thấy đơn xin nghỉ.",
    },
    {
      test: /pause\s*enrollment\s*request\s*.*not\s*found/i,
      vi: "Không tìm thấy yêu cầu bảo lưu.",
    },
    {
      test: /already\s+cancelled|already\s+canceled/i,
      vi: "Đơn đã được hủy trước đó.",
    },
    {
      test: /cannot\s+cancel.*(past|passed|started|expired)/i,
      vi: "Không thể hủy khi buổi học đã qua hoặc yêu cầu đã bắt đầu hiệu lực.",
    },
    {
      test: /cannot\s+cancel.*(approved|processed|finalized)/i,
      vi: "Không thể hủy đơn đã được xử lý.",
    },
    {
      test: /invalid\s+date\s+range|date\s+range\s+is\s+invalid/i,
      vi: "Khoảng ngày không hợp lệ.",
    },
    {
      test: /outcome\s+.*only\s+.*approved/i,
      vi: "Chỉ có thể cập nhật kết quả cho yêu cầu đã duyệt.",
    },
    {
      test: /no\s+active\s+enrollments?\s+with\s+sessions?\s+in\s+the\s+pause\s+range/i,
      vi: "Học viên không có ghi danh đang hoạt động trong khoảng ngày bảo lưu.",
    },
    {
      test: /request\s+failed\s+with\s+status\s+code\s+409/i,
      vi: "Yêu cầu bị từ chối do dữ liệu đang xung đột. Vui lòng kiểm tra lại thông tin và thử lại.",
    },
  ];

  for (const matcher of messageMatchers) {
    if (matcher.test.test(lower)) {
      return matcher.vi;
    }
  }

  return undefined;
}

function collectBackendErrorMessages(value: unknown): string[] {
  if (!value) return [];

  if (typeof value === "string") {
    const normalized = normalizeMessage(value);
    return normalized ? [normalized] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectBackendErrorMessages(item));
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = ["message", "detail", "title", "error", "description", "reason"];
    const fromKnownKeys = keys.flatMap((key) => collectBackendErrorMessages(record[key]));
    const fromValues = Object.values(record).flatMap((item) => collectBackendErrorMessages(item));
    return [...fromKnownKeys, ...fromValues];
  }

  const normalized = normalizeMessage(String(value));
  return normalized ? [normalized] : [];
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
      code.startsWith("LeaveRequest.") ||
      code.startsWith("PauseEnrollmentRequest.") ||
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

  const responseData = (error as ErrorLike)?.response?.data;

  const detailedFromErrors = collectBackendErrorMessages([
    responseData?.errors,
    (error as ErrorLike)?.raw?.errors,
  ])
    .map((message) => translateBackendMessageToVietnamese(message) || message)
    .filter(Boolean);

  if (detailedFromErrors.length > 0) {
    const uniqueMessages = Array.from(new Set(detailedFromErrors));
    return uniqueMessages.slice(0, 2).join("; ");
  }

  const beMessageCandidates = [
    normalizeMessage(responseData?.message),
    normalizeMessage(responseData?.detail),
    normalizeMessage(responseData?.title),
    normalizeMessage(responseData?.error),
    normalizeMessage((error as any)?.message),
  ].filter(Boolean);

  const translatedFromMessage = beMessageCandidates
    .map((message) => translateBackendMessageToVietnamese(message))
    .find(Boolean);

  if (translatedFromMessage) return translatedFromMessage;

  if (beMessageCandidates.length > 0) {
    // Preserve backend message content when there is no known translation pattern yet.
    return beMessageCandidates[0];
  }

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
