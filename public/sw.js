const CACHE = "palmiers-v1";
const OFFLINE_URL = "/";

const PRECACHE = [
  "/",
  "/login",
  "/manifest.webmanifest",
  "/icon.svg",
  "/icon-maskable.svg",
];

// Install : pré-cache les pages principales
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// Activate : supprime les anciens caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch : network-first avec fallback cache
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Ignore les requêtes non-GET et Supabase
  if (request.method !== "GET") return;
  if (request.url.includes("supabase.co")) return;
  if (request.url.includes("/api/")) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Met en cache la réponse fraîche
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() =>
        // Hors ligne : utilise le cache ou la page d'accueil
        caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL))
      )
  );
});
