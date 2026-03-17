/* eslint-disable no-undef */

function getConfigFromQuery() {
  const url = new URL(self.location.href);
  return {
    apiKey: url.searchParams.get("apiKey") || "",
    authDomain: url.searchParams.get("authDomain") || "",
    projectId: url.searchParams.get("projectId") || "",
    storageBucket: url.searchParams.get("storageBucket") || "",
    messagingSenderId: url.searchParams.get("messagingSenderId") || "",
    appId: url.searchParams.get("appId") || "",
  };
}

const config = getConfigFromQuery();

if (config.apiKey && config.messagingSenderId) {
  importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
  importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

  firebase.initializeApp(config);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage(function (payload) {
    const title =
      payload.notification?.title ||
      payload.data?.title ||
      "KidzGo Notification";
    const options = {
      body:
        payload.notification?.body ||
        payload.data?.body ||
        "Bạn có một thông báo mới từ hệ thống.",
      icon: "/favicon.ico",
      data: {
        link: payload.data?.link || "/",
      },
    };

    self.registration.showNotification(title, options);
  });
}

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const link = event.notification?.data?.link || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(link);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(link);
      }
      return undefined;
    })
  );
});
