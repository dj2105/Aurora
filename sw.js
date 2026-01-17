const CACHE_VERSION = "v2";
const APP_CACHE = `aurora-app-${CACHE_VERSION}`;
const RUNTIME_CACHE = `aurora-runtime-${CACHE_VERSION}`;

const APP_SHELL = [
  "./",
  "./index.html",
  "./offline.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./assets/css/aurora-dashboard.css",
  "./assets/js/aurora-dashboard.js",
  "./assets/js/trip-hud.js",
  "./assets/js/pwa.js",
  "./assets/js/data-utils.js",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
    caches.open(APP_CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => ![APP_CACHE, RUNTIME_CACHE].includes(key)).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
function isApiRequest(url) {
  return (
    url.origin === "https://api.open-meteo.com" ||
    url.origin === "https://geocoding-api.open-meteo.com" ||
    url.origin === "https://services.swpc.noaa.gov"
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    return cached || caches.match("./offline.html");
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  const cache = await caches.open(APP_CACHE);
  cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, response.clone()));
      }
      return response;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (event.request.mode === "navigate") {
    event.respondWith(networkFirst(event.request));
    return;
  }

  if (isApiRequest(url)) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(event.request));
  }
