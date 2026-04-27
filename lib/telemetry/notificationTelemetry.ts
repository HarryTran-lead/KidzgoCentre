export type NotificationTelemetryEvent =
  | "notification_mark_read"
  | "notification_mark_all_read"
  | "notification_retry"
  | "notification_delete"
  | "notification_broadcast_send"
  | "notification_broadcast_export"
  | "notification_template_apply"
  | "notification_template_create"
  | "notification_template_delete";

export type NotificationTelemetryPayload = Record<string, unknown>;

type TelemetryEnvelope = {
  event: NotificationTelemetryEvent;
  at: string;
  source: "notification-module";
  payload: NotificationTelemetryPayload;
};

export const NOTIFICATION_TELEMETRY_EVENT_NAME = "kidzgo:notification-telemetry";

export function trackNotificationTelemetry(
  event: NotificationTelemetryEvent,
  payload: NotificationTelemetryPayload = {},
) {
  const envelope: TelemetryEnvelope = {
    event,
    at: new Date().toISOString(),
    source: "notification-module",
    payload,
  };

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(NOTIFICATION_TELEMETRY_EVENT_NAME, { detail: envelope }),
    );
  }

  if (typeof console !== "undefined" && typeof console.debug === "function") {
    console.debug("[notification-telemetry]", envelope);
  }

  return envelope;
}
