import { describe, expect, it } from "vitest";
import { extractApiError } from "@/lib/api/extractApiError";
import { mapApiErrorToMessage } from "@/lib/api/errorMapper";

describe("errorMapper", () => {
  it("maps Report.AccessDenied code even when backend responds with status 500", () => {
    const message = mapApiErrorToMessage(
      {
        errors: [{ code: "Report.AccessDenied", message: "Forbidden" }],
        title: "Internal Server Error",
      },
      500,
      "Fallback",
    );

    expect(message).toBe("Bạn không có quyền truy cập báo cáo này.");
  });

  it("parses message from string JSON payload", () => {
    const message = mapApiErrorToMessage(
      "{\"message\":\"Invalid reportType\"}",
      400,
      "Fallback",
    );

    expect(message).toBe("Invalid reportType");
  });

  it("extractApiError returns mapped report permission message", () => {
    const error = {
      response: {
        status: 500,
        data: {
          errors: [{ code: "Report.ShareDenied" }],
        },
      },
      message: "Request failed with status code 500",
    };

    expect(extractApiError(error, "Fallback")).toBe(
      "Bạn không có quyền công bố hoặc chia sẻ báo cáo này.",
    );
  });
});
