// TropiChat PWA Service Worker
// Caches the app shell for offline support and faster loads

const CACHE_NAME = "tropichat-v2";

// App shell: core pages and assets to cache on install
const PRECACHE_URLS = [
  "/",
  "/dashboard",
  "/manifest.json",
  "/tropichat-logo.png",
  "/tropichat-logo-transparent.png",
];

// Install: precache the app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch: network-first for API calls, cache-first for static assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and cross-origin requests
  if (request.method !== "GET" || url.origin !== location.origin) {
    return;
  }

  // Skip API routes — always go to network
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Cache-first strategy for static assets (images, fonts, etc.)
  if (
    url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|css|js)$/)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
      )
    );
    return;
  }

  // Network-first strategy for HTML/navigation requests
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful navigation responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(request).then(
          (cached) => cached || caches.match("/dashboard")
        );
      })
  );
});

// ==================== PWA PUSH NOTIFICATIONS ====================

// Push: handle incoming system notifications
self.addEventListener("push", (event) => {
  if (!(self.Notification && self.Notification.permission === "granted")) {
    return;
  }

  const data = event.data ? event.data.json() : {};
  const title = data.title || "New Message - TropiChat";
  const options = {
    body: data.body || "You have a new message from a customer.",
    icon: "/tropichat-logo.png",
    badge: "/tropichat-logo.png", // Small icon for top bar
    tag: data.tag || "new_message", // Consolidate multiple notifications
    data: {
      url: data.url || "/dashboard",
      conversationId: data.conversationId,
    },
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Click: handle tapping the notification
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // If a dashboard window is already open, focus it and navigate
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes("/dashboard") && "focus" in client) {
          return client.focus().then((c) => c.navigate(urlToOpen));
        }
      }
      // If no dashboard window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
