const CACHE_NAME = "sell-model-dashboard-public-v18";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js?v=20260512-v3-quantile-ui-backfill",
  "./manifest.webmanifest",
  "./favicon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (requestUrl.pathname.includes("/portfolio/")) {
    event.respondWith(networkFirst(event.request));
    return;
  }
  if (
    event.request.mode === "navigate"
    || requestUrl.pathname.endsWith("/")
    || requestUrl.pathname.endsWith("/index.html")
    || requestUrl.pathname.endsWith("/styles.css")
    || requestUrl.pathname.endsWith("/app.js")
  ) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  if (
    requestUrl.pathname.endsWith("/data/public-sell-model.js")
    || requestUrl.pathname.endsWith("/data/public-sell-model.json")
    || requestUrl.pathname.endsWith("/data/public-ab-daily.js")
    || requestUrl.pathname.endsWith("/data/public-ab-daily.json")
    || requestUrl.pathname.endsWith("/hub/assets/portal.css")
    || requestUrl.pathname.endsWith("/hub/assets/portal.js")
    || requestUrl.pathname.endsWith("/hub/data/portal-manifest.js")
    || requestUrl.pathname.endsWith("/hub/data/portal-manifest.json")
    || requestUrl.pathname.endsWith("/hub/sell-model-embed/data/public-ab-daily.js")
    || requestUrl.pathname.endsWith("/hub/sell-model-embed/data/public-ab-daily.json")
    || requestUrl.pathname.endsWith("/latest-date.txt")
  ) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        const cloned = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        return networkResponse;
      });
    })
  );
});

function networkFirst(request) {
  return fetch(request)
    .then((networkResponse) => {
      const cloned = networkResponse.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
      return networkResponse;
    })
    .catch(() => caches.match(request).then((cachedResponse) => cachedResponse || caches.match("./index.html")));
}
