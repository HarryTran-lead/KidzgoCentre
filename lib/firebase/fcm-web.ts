"use client";

import { NOTIFICATION_ENDPOINTS } from "@/constants/apiURL";
import { toast } from "@/hooks/use-toast";
import { pushNotificationToRole } from "@/lib/notifications";
import { getAccessToken } from "@/lib/store/authToken";
import type { Role } from "@/lib/role";
import type { NotificationKind, NotificationPriority } from "@/types/notification";

type FirebaseCompatApp = {
  apps: unknown[];
  initializeApp: (config: Record<string, string>) => unknown;
  messaging: () => FirebaseMessagingCompat;
};

type FirebaseMessagingCompat = {
  getToken: (options?: Record<string, unknown>) => Promise<string>;
  onMessage: (next: (payload: FcmPayload) => void) => void;
};

type FcmPayload = {
  notification?: {
    title?: string;
    body?: string;
  };
  data?: Record<string, string | undefined>;
};

declare global {
  interface Window {
    firebase?: FirebaseCompatApp;
  }
}

type FcmUserContext = {
  role: Role;
  userId?: string;
  userName?: string;
};

const APP_SCRIPT_ID = "kidzgo-firebase-app-script";
const MESSAGING_SCRIPT_ID = "kidzgo-firebase-messaging-script";
const SW_PATH = "/firebase-messaging-sw.js";
const TOKEN_CACHE_KEY = "kidzgo.fcm.token";
const SCRIPT_VERSION = "10.13.2";

let messagingPromise: Promise<FirebaseMessagingCompat | null> | null = null;
let foregroundListenerAttached = false;

function getFirebaseConfig() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  };

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? "";
  const isReady = Object.values(config).every(Boolean) && Boolean(vapidKey);

  return {
    config,
    vapidKey,
    isReady,
  };
}

function loadScript(id: string, src: string) {
  return new Promise<void>((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Cannot load script: ${src}`));
    document.head.appendChild(script);
  });
}

async function ensureFirebaseCompatLoaded() {
  await loadScript(
    APP_SCRIPT_ID,
    `https://www.gstatic.com/firebasejs/${SCRIPT_VERSION}/firebase-app-compat.js`
  );
  await loadScript(
    MESSAGING_SCRIPT_ID,
    `https://www.gstatic.com/firebasejs/${SCRIPT_VERSION}/firebase-messaging-compat.js`
  );
}

async function getFirebaseMessaging() {
  if (messagingPromise) {
    return messagingPromise;
  }

  messagingPromise = (async () => {
    if (typeof window === "undefined") {
      return null;
    }

    const { config, isReady } = getFirebaseConfig();
    if (!isReady) {
      return null;
    }

    await ensureFirebaseCompatLoaded();

    const firebase = window.firebase;
    if (!firebase) {
      return null;
    }

    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    }

    return firebase.messaging();
  })();

  return messagingPromise;
}

function buildServiceWorkerUrl() {
  const { config, isReady } = getFirebaseConfig();
  if (!isReady) {
    return SW_PATH;
  }

  const query = new URLSearchParams(config);
  return `${SW_PATH}?${query.toString()}`;
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return null;
  }

  return navigator.serviceWorker.register(buildServiceWorkerUrl(), {
    scope: "/",
  });
}

export function isFcmReadyInBrowser() {
  if (typeof window === "undefined") {
    return false;
  }

  const { isReady } = getFirebaseConfig();
  return (
    isReady &&
    "Notification" in window &&
    "serviceWorker" in navigator
  );
}

async function syncFcmTokenToApi(token: string, context: FcmUserContext) {
  const authToken = getAccessToken();

  await fetch(NOTIFICATION_ENDPOINTS.DEVICE_TOKEN, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify({
      token,
      role: context.role,
      userId: context.userId ?? null,
      userName: context.userName ?? null,
      platform: "web",
    }),
  });
}

export async function ensureFcmToken(context: FcmUserContext) {
  if (!isFcmReadyInBrowser() || Notification.permission !== "granted") {
    return null;
  }

  const messaging = await getFirebaseMessaging();
  if (!messaging) {
    return null;
  }

  const { vapidKey } = getFirebaseConfig();
  const registration = await registerServiceWorker();

  const token = await messaging.getToken({
    vapidKey,
    serviceWorkerRegistration: registration ?? undefined,
  });

  if (!token) {
    return null;
  }

  const lastToken =
    typeof window !== "undefined" ? window.localStorage.getItem(TOKEN_CACHE_KEY) : null;

  if (typeof window !== "undefined" && lastToken !== token) {
    window.localStorage.setItem(TOKEN_CACHE_KEY, token);
  }

  if (lastToken !== token) {
    await syncFcmTokenToApi(token, context);
  }

  return token;
}

export async function requestFcmPermissionAndToken(context: FcmUserContext) {
  if (!isFcmReadyInBrowser()) {
    return { permission: "unsupported" as const, token: null };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { permission, token: null };
  }

  const token = await ensureFcmToken(context);
  return { permission, token };
}

function inferKind(data?: Record<string, string | undefined>): NotificationKind {
  const value = data?.kind;
  if (
    value === "system" ||
    value === "schedule" ||
    value === "report" ||
    value === "payment" ||
    value === "homework" ||
    value === "feedback" ||
    value === "event"
  ) {
    return value;
  }
  return "system";
}

function inferPriority(data?: Record<string, string | undefined>): NotificationPriority {
  const value = data?.priority;
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }
  return "medium";
}

export async function startFcmForegroundListener(context: FcmUserContext) {
  if (!isFcmReadyInBrowser() || Notification.permission !== "granted") {
    return;
  }

  const messaging = await getFirebaseMessaging();
  if (!messaging || foregroundListenerAttached) {
    return;
  }

  foregroundListenerAttached = true;
  await ensureFcmToken(context);

  messaging.onMessage((payload) => {
    const title = payload.notification?.title || payload.data?.title || "Thông báo mới";
    const message =
      payload.notification?.body || payload.data?.body || "Bạn vừa nhận được một thông báo mới.";
    const targetRole = (payload.data?.targetRole as Role | undefined) ?? context.role;

    pushNotificationToRole({
      role: targetRole,
      title,
      message,
      kind: inferKind(payload.data),
      priority: inferPriority(payload.data),
      senderRole: ((payload.data?.senderRole as Role | undefined) ?? "Admin"),
      senderName: payload.data?.senderName ?? "Firebase Cloud Messaging",
      link: payload.data?.link,
    });

    toast.info({
      title,
      description: message,
      duration: 5000,
    });
  });
}
