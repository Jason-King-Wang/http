const CACHE_NAME = "sell-model-dashboard-public-v4";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
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
  if (
    requestUrl.pathname.endsWith("/data/public-sell-model.js")
    || requestUrl.pathname.endsWith("/data/public-sell-model.json")
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
