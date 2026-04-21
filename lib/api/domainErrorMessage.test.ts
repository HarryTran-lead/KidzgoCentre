import { describe, it, expect } from "vitest";
import {
  extractDomainErrorCode,
  getDomainErrorMessage,
  mapDomainErrorCodeToMessage,
} from "@/lib/api/domainErrorMessage";

describe("domainErrorMessage", () => {
  it("maps LeaveRequest code to Vietnamese", () => {
    const error = {
      response: {
        data: {
          code: "LeaveRequest.CannotCancel",
        },
      },
    };

    expect(extractDomainErrorCode(error)).toBe("LeaveRequest.CannotCancel");
    expect(mapDomainErrorCodeToMessage("LeaveRequest.CannotCancel")).toBe(
      "Không thể hủy đơn xin nghỉ ở trạng thái hiện tại."
    );
    expect(getDomainErrorMessage(error)).toBe(
      "Không thể hủy đơn xin nghỉ ở trạng thái hiện tại."
    );
  });

  it("maps PauseEnrollmentRequest code to Vietnamese", () => {
    const error = {
      response: {
        data: {
          code: "PauseEnrollmentRequest.NoEnrollmentsInRange",
        },
      },
    };

    expect(getDomainErrorMessage(error)).toBe(
      "Học viên không có ghi danh đang hoạt động trong khoảng ngày bảo lưu."
    );
  });

  it("translates no active enrollments detail message", () => {
    const error = {
      response: {
        data: {
          detail:
            "Student has no active enrollments with sessions in the pause range",
        },
      },
    };

    expect(getDomainErrorMessage(error)).toBe(
      "Học viên không có ghi danh đang hoạt động trong khoảng ngày bảo lưu."
    );
  });

  it("translates generic 409 transport message", () => {
    const error = {
      message: "Request failed with status code 409",
      response: {
        status: 409,
      },
    };

    expect(getDomainErrorMessage(error)).toBe(
      "Yêu cầu bị từ chối do dữ liệu đang xung đột. Vui lòng kiểm tra lại thông tin và thử lại."
    );
  });

  it("keeps backend message when no mapping exists", () => {
    const error = {
      response: {
        data: {
          message: "Custom backend message",
        },
      },
    };

    expect(getDomainErrorMessage(error)).toBe("Custom backend message");
  });

  it("maps SessionReport.SessionNotEnded code to Vietnamese", () => {
    const error = {
      response: {
        data: {
          title: "SessionReport.SessionNotEnded",
          detail:
            "Session report can only be created, edited, submitted, approved, or published after the session has ended at '2026-04-22 16:00:00' UTC.",
        },
      },
    };

    expect(getDomainErrorMessage(error)).toBe(
      "Chỉ có thể tạo, chỉnh sửa, gửi duyệt, duyệt hoặc xuất bản báo cáo sau khi buổi học đã kết thúc."
    );
  });
});
