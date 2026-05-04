type BlockReasonCode =
  | "ACTIVE_CLASSES_EXIST"
  | "ACTIVE_STUDENTS_EXIST"
  | "ACTIVE_ENROLLMENTS_EXIST"
  | "FUTURE_SESSIONS_EXIST"
  | "ACTIVE_STAFF_EXIST"
  | "ACTIVE_ROOMS_EXIST";

type StatusBlockDetails = {
  entity?: string;
  entityId?: string;
  reasons?: string[];
  counts?: Record<string, number>;
};

const ENTITY_LABELS: Record<string, string> = {
  Program: "chương trình học",
  TuitionPlan: "gói học",
  Classroom: "phòng học",
  Branch: "chi nhánh",
};

const REASON_LABELS: Record<BlockReasonCode, string> = {
  ACTIVE_CLASSES_EXIST: "đang có lớp học hoạt động",
  ACTIVE_STUDENTS_EXIST: "đang có học viên hoặc ghi danh hoạt động",
  ACTIVE_ENROLLMENTS_EXIST: "đang có ghi danh hoạt động",
  FUTURE_SESSIONS_EXIST: "đang có buổi học trong tương lai",
  ACTIVE_STAFF_EXIST: "đang có nhân sự hoạt động",
  ACTIVE_ROOMS_EXIST: "đang có phòng học hoạt động",
};

const COUNT_LABELS: Record<string, string> = {
  activeClasses: "Lớp hoạt động",
  activeStudents: "Học viên/Ghi danh hoạt động",
  activeEnrollments: "Ghi danh hoạt động",
  futureSessions: "Buổi học tương lai",
  activeStaff: "Nhân sự hoạt động",
  activeRooms: "Phòng hoạt động",
};

const CODE_MESSAGES: Record<string, string> = {
  "Class.RoomNotFound": "Không tìm thấy phòng học hoặc phòng đang ngưng hoạt động.",
  "Class.RoomBranchMismatch": "Phòng học phải thuộc cùng chi nhánh với lớp học.",
  "Class.TeacherAndAssistantMustDiffer": "Giáo viên chính và giáo viên phụ không được trùng nhau.",
  "Class.HasActiveEnrollments": "Không thể thay đổi lớp khi vẫn còn ghi danh đang hoạt động hoặc tạm dừng.",
  "Class.HasFutureSessions": "Không thể thay đổi lớp khi vẫn còn buổi học trong tương lai.",
  "Class.HasOperationalDependencies": "Không thể đổi chi nhánh/chương trình khi lớp đã có ghi danh hoặc buổi học.",
  "Class.CapacityBelowActiveEnrollments": "Sĩ số không được nhỏ hơn số ghi danh đang hoạt động.",
  "Class.InvalidActiveDependencies": "Không thể kích hoạt lớp khi chi nhánh/chương trình/phòng hoặc giáo viên đang ngưng hoạt động.",
  "Class.CannotCloseWithActiveEnrollments": "Không thể đóng/tạm dừng/kết thúc/hủy lớp khi vẫn còn ghi danh đang hoạt động.",
  "Class.CannotCloseWithFutureSessions": "Không thể đóng/tạm dừng/kết thúc/hủy lớp khi vẫn còn buổi học trong tương lai.",
  "Class.RoomConflict": "Phòng học đang bị trùng lịch với lớp khác.",
  "Class.TeacherConflict": "Giáo viên đang bị trùng lịch với lớp khác.",
  "Class.AssistantConflict": "Giáo viên phụ đang bị trùng lịch với lớp khác.",
  "Session.InvalidRoom": "Phòng học không hợp lệ hoặc không thuộc chi nhánh hiện tại.",
  "Session.InvalidTeacher": "Giáo viên chính không hợp lệ hoặc không thuộc chi nhánh hiện tại.",
  "Session.InvalidAssistant": "Giáo viên phụ không hợp lệ hoặc không thuộc chi nhánh hiện tại.",
  "Session.TeacherAndAssistantMustDiffer": "Giáo viên chính và giáo viên phụ không được trùng nhau.",
  "Session.RoomOccupied": "Phòng học đã có lịch ở khung giờ này.",
  "Session.TeacherOccupied": "Giáo viên đã có lịch ở khung giờ này.",
  "Session.AssistantOccupied": "Giáo viên phụ đã có lịch ở khung giờ này.",
  "Session.AlreadyCompleted": "Buổi học đã hoàn thành nên không thể hủy.",
  "Session.HasAttendance": "Không thể hủy buổi học vì đã điểm danh.",
  "Session.HasReports": "Không thể hủy buổi học vì đã có báo cáo.",
  "Program.HasActiveClasses": "Không thể xóa chương trình khi còn lớp học hoạt động hoặc đã lên lịch.",
  "Program.HasActiveEnrollments": "Không thể xóa chương trình khi còn ghi danh hoạt động hoặc tạm dừng.",
  "Branch.HasActiveDependencies": "Không thể tạm dừng chi nhánh khi còn lớp, học viên, nhân sự hoặc phòng đang hoạt động.",
  "Enrollment.StudentNotFound": "Không tìm thấy hồ sơ học viên hợp lệ hoặc học viên đang ngưng hoạt động.",
  "Enrollment.NotFound": "Không tìm thấy ghi danh.",
  "Enrollment.ClassNotFound": "Không tìm thấy lớp học cho ghi danh.",
  "Enrollment.ClassNotAvailable": "Lớp hiện không ở trạng thái cho phép ghi danh.",
  "Enrollment.ClassFull": "Lớp đã đủ sĩ số.",
  "Enrollment.AlreadyEnrolled": "Học viên đã được ghi danh vào lớp này.",
  "Enrollment.AlreadyDropped": "Ghi danh đã ở trạng thái đã nghỉ.",
  "Enrollment.AlreadyActive": "Ghi danh hiện đã ở trạng thái đang học.",
  "Enrollment.CannotReactivateDropped": "Không thể kích hoạt lại ghi danh đã nghỉ.",
  "Enrollment.InvalidStatus": "Trạng thái ghi danh hiện tại không cho phép thao tác này.",
  "Enrollment.TuitionPlanNotFound": "Không tìm thấy gói học phí.",
  "Enrollment.TuitionPlanNotAvailable": "Gói học phí hiện không khả dụng.",
  "Enrollment.TuitionPlanBranchMismatch": "Gói học phí không cùng chi nhánh với lớp.",
  "Enrollment.TuitionPlanProgramMismatch": "Gói học phí không cùng chương trình với lớp.",
  "Enrollment.SupplementaryProgramRequired": "Chỉ ghi danh supplementary mới được thêm lịch segment.",
  "Enrollment.ScheduleSegmentInvalidEffectiveDate": "Khoảng ngày hiệu lực của segment không hợp lệ.",
  "Enrollment.ScheduleSegmentAlreadyExists": "Đã tồn tại segment có cùng ngày bắt đầu hiệu lực.",
  "Enrollment.FutureScheduleSegmentExists": "Đã có segment tương lai, không thể chèn segment mới.",
  "Enrollment.StudentScheduleConflict": "Học viên bị trùng lịch với lớp khác ở khung giờ này.",
  "Profile.HasActiveEnrollments": "Không thể tạm dừng/xóa hồ sơ vì vẫn còn ghi danh đang hoạt động.",
  "Profile.HasFutureSessions": "Không thể tạm dừng/xóa hồ sơ vì vẫn còn buổi học trong tương lai.",
  "Profile.HasActiveStudentLinks": "Không thể tạm dừng/xóa hồ sơ phụ huynh vì còn liên kết học viên đang hoạt động.",
  "Users.HasActiveAssignments": "Không thể cập nhật vai trò/trạng thái vì tài khoản còn phân công đang hoạt động.",
  "Users.BranchInactive": "Không thể gán tài khoản vào chi nhánh đang ngưng hoạt động.",
  "Users.EmailNotUnique": "Email đã tồn tại trong hệ thống.",
  "Exam.HasSubmissions": "Không thể xóa bài kiểm tra vì đã có bài nộp.",
  "Exam.HasResults": "Không thể xóa bài kiểm tra vì đã có kết quả.",
  "Homework.CannotDeleteWithStudentWork": "Không thể xóa bài tập vì đã có học viên làm hoặc nộp bài.",
};

function getApiCode(payload: any): string | undefined {
  const firstError = Array.isArray(payload?.errors) ? payload.errors[0] : null;
  return (
    firstError?.code ??
    payload?.code ??
    payload?.errorCode ??
    payload?.error?.code ??
    payload?.data?.code
  );
}

function getApiMessage(payload: any): string | undefined {
  const firstError = Array.isArray(payload?.errors) ? payload.errors[0] : null;
  return (
    firstError?.message ??
    payload?.message ??
    payload?.detail ??
    payload?.error ??
    payload?.title
  );
}

function formatStatusBlocked(details?: StatusBlockDetails): string {
  const entityLabel = ENTITY_LABELS[details?.entity ?? ""] ?? "đối tượng";
  const reasons = Array.isArray(details?.reasons) ? details.reasons : [];
  const counts = details?.counts ?? {};

  const reasonLines = reasons
    .map((reason) => REASON_LABELS[reason as BlockReasonCode])
    .filter(Boolean)
    .map((label) => `- ${label}`);

  const countLines = Object.entries(counts)
    .filter(([, value]) => typeof value === "number")
    .map(([key, value]) => {
      const label = COUNT_LABELS[key] ?? key;
      return `- ${label}: ${value}`;
    });

  let message = `Không thể tạm dừng ${entityLabel} vì đang được sử dụng.`;
  if (reasonLines.length > 0) {
    message += `\nLý do:\n${reasonLines.join("\n")}`;
  }
  if (countLines.length > 0) {
    message += `\nSố liệu liên quan:\n${countLines.join("\n")}`;
  }

  return message;
}

export function mapApiErrorToMessage(
  payload: any,
  status?: number,
  fallback = "Đã xảy ra lỗi. Vui lòng thử lại.",
  rawText?: string
): string {
  const code = getApiCode(payload);
  const backendMessage = getApiMessage(payload);

  if (code === "STATUS_CHANGE_BLOCKED") {
    return formatStatusBlocked(payload?.details as StatusBlockDetails);
  }

  if (code && CODE_MESSAGES[code]) {
    return CODE_MESSAGES[code];
  }

  if (typeof backendMessage === "string" && backendMessage.trim()) {
    return backendMessage;
  }

  if (typeof rawText === "string" && rawText.trim()) {
    return rawText.trim();
  }

  if (status === 404) return "Không tìm thấy dữ liệu yêu cầu.";
  if (status === 409) return "Không thể thực hiện thao tác do ràng buộc dữ liệu hiện tại.";
  if (status === 400) return "Dữ liệu chưa hợp lệ. Vui lòng kiểm tra và thử lại.";

  return fallback;
}
