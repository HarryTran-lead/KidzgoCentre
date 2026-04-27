import { describe, expect, it, vi } from "vitest";
import {
  NOTIFICATION_TELEMETRY_EVENT_NAME,
  trackNotificationTelemetry,
} from "@/lib/telemetry/notificationTelemetry";

describe("notificationTelemetry", () => {
  it("returns telemetry envelope with metadata", () => {
    const envelope = trackNotificationTelemetry("notification_retry", {
      notificationId: "noti-1",
    });

    expect(envelope.event).toBe("notification_retry");
    expect(envelope.source).toBe("notification-module");
    expect(envelope.payload).toEqual({ notificationId: "noti-1" });
    expect(typeof envelope.at).toBe("string");
  });

  it("dispatches browser custom event when window exists", () => {
    const dispatchEvent = vi.fn();
    vi.stubGlobal("window", { dispatchEvent } as unknown as Window);

    trackNotificationTelemetry("notification_mark_read", { notificationId: "noti-2" });

    expect(dispatchEvent).toHaveBeenCalledTimes(1);
    const customEvent = dispatchEvent.mock.calls[0][0] as CustomEvent;
    expect(customEvent.type).toBe(NOTIFICATION_TELEMETRY_EVENT_NAME);
    expect(customEvent.detail.event).toBe("notification_mark_read");

    vi.unstubAllGlobals();
  });
});
