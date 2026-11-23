const CACHE_NAME = "notaris-offline-v1";
const offlineUrl = new URL("pwa/offline.html", self.registration.scope).href;
self.addEventListener("install", (event) => {
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.add(offlineUrl)));
    self.skipWaiting();
});
self.addEventListener("activate", (event) => {
    event.waitUntil(Promise.all([
        caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("notaris-offline-") && key !== CACHE_NAME).map((key) => caches.delete(key)))),
        self.clients.claim(),
    ]));
});
self.addEventListener("fetch", (event) => {
    if (event.request.mode !== "navigate" || event.request.method !== "GET") return;
    event.respondWith(fetch(event.request).catch(() => caches.match(offlineUrl)));
});
