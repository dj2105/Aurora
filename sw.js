const CACHE_VERSION = "v4";
const APP_CACHE = `aurora-app-${CACHE_VERSION}`;
const RUNTIME_CACHE = `aurora-runtime-${CACHE_VERSION}`;
const BASE_PATH = new URL(self.registration.scope).pathname.replace(/\/?$/, "/");

const APP_SHELL = [
  BASE_PATH,
  `${BASE_PATH}index.html`,
  `${BASE_PATH}offline.html`,
  `${BASE_PATH}styles.css`,
  `${BASE_PATH}print.css`,
  `${BASE_PATH}firebase-config.js`,
  `${BASE_PATH}app.js`,
  `${BASE_PATH}manifest.json`,
  `${BASE_PATH}assets/css/aurora-dashboard.css`,
  `${BASE_PATH}assets/js/aurora-dashboard.js`,
  `${BASE_PATH}assets/js/firebase.js`,
  `${BASE_PATH}assets/js/sync.js`,
  `${BASE_PATH}assets/js/trip-hud.js`,
  `${BASE_PATH}assets/js/pwa.js`,
  `${BASE_PATH}assets/js/data-utils.js`,
  `${BASE_PATH}assets/data/trip-data.js`,
  `${BASE_PATH}assets/icons/icon-192.png`,
  `${BASE_PATH}assets/icons/icon-512.png`,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(APP_CACHE)
      .then((cache) => cache.addAll(APP_SHELL.map((url) => new Request(url, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => ![APP_CACHE, RUNTIME_CACHE].includes(key)).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function isApiRequest(url) {
  return (
    url.origin === "https://api.open-meteo.com" ||
    url.origin === "https://geocoding-api.open-meteo.com" ||
    url.origin === "https://services.swpc.noaa.gov"
  );
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    return cached || caches.match(`${BASE_PATH}offline.html`);
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
});
