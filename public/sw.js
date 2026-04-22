// Minimal service worker so the PWA is installable.
// We're not caching anything yet — that comes in a later session.
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Pass-through: let the network handle everything for now.
});
