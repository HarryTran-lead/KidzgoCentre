import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createNotificationTemplate,
  fetchNotifications,
  markNotificationRead,
  retryNotification,
} from "@/lib/api/notificationService";

describe("notificationService smoke", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("retries a notification successfully", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ isSuccess: true }), { status: 200 }));

    await retryNotification("noti-001");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/notifications/noti-001/retry",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("throws vietnamese fallback when mark-as-read request fails without body", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("", { status: 500 }));

    await expect(markNotificationRead("noti-500")).rejects.toThrow(
      "Không thể đánh dấu đã đọc cho thông báo (noti-500).",
    );
  });

  it("uses backend message when create template fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "Template code already exists" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      createNotificationTemplate({
        code: "SESSION_REMINDER",
        channel: "InApp",
        title: "Nhac lich hoc",
        content: "Noi dung",
        placeholders: [],
        isActive: true,
      }),
    ).rejects.toThrow("Template code already exists");
  });

  it("throws localized error when fetch notifications fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("", { status: 503 }));

    await expect(fetchNotifications("Teacher")).rejects.toThrow(
      "Không thể tải danh sách thông báo cho vai trò Teacher.",
    );
  });
});
