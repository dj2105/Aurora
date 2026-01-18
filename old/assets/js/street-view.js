const streetViewFrame = document.getElementById("street-view-frame");
const streetViewFallback = document.getElementById("street-view-fallback");
const streetViewMeta = document.getElementById("street-view-meta");
const streetViewShuffle = document.getElementById("street-view-shuffle");

const STREET_VIEW_LOCATIONS = [
  { name: "Tornio — Riverside", lat: 65.8464, lng: 24.1872, heading: 210, pitch: 0, zoom: 1 },
  { name: "Tornio — City Center", lat: 65.8499, lng: 24.1467, heading: 120, pitch: 0, zoom: 1 },
  { name: "Tornio — River Walk", lat: 65.8481, lng: 24.1753, heading: 310, pitch: 0, zoom: 1 },
  { name: "Rovaniemi — Ounasvaara", lat: 66.5048, lng: 25.7329, heading: 140, pitch: 0, zoom: 1 },
  { name: "Rovaniemi — City Bridge", lat: 66.5032, lng: 25.7245, heading: 45, pitch: 0, zoom: 1 },
  { name: "Rovaniemi — Riverside", lat: 66.5011, lng: 25.7222, heading: 310, pitch: 0, zoom: 1 },
  { name: "Kemi — Harbor", lat: 65.7367, lng: 24.5641, heading: 210, pitch: 0, zoom: 1 },
  { name: "Kemi — Snow Castle", lat: 65.7354, lng: 24.5604, heading: 20, pitch: 0, zoom: 1 },
  { name: "Kemi — Market Square", lat: 65.7368, lng: 24.5632, heading: 320, pitch: 0, zoom: 1 },
  { name: "Birmingham — Gas Street", lat: 52.4775, lng: -1.9082, heading: 120, pitch: 0, zoom: 1 },
  { name: "Birmingham — Victoria Square", lat: 52.4796, lng: -1.9039, heading: 20, pitch: 0, zoom: 1 },
  { name: "Birmingham — Digbeth", lat: 52.4742, lng: -1.8792, heading: 250, pitch: 0, zoom: 1 },
];

const MAX_PANO_TRIES = 6;
let panorama = null;
let streetViewService = null;
let currentLocation = null;

function getMapsKey() {
  const metaKey = document.querySelector("meta[name='google-maps-key']")?.content?.trim();
  if (metaKey) return metaKey;
  if (window.AURORA_MAPS_KEY) return String(window.AURORA_MAPS_KEY);
  if (window.AURORA_CONFIG?.googleMapsKey) return String(window.AURORA_CONFIG.googleMapsKey);
  return "";
}

function showFallback(message) {
  if (streetViewFallback) {
    const text = streetViewFallback.querySelector("p");
    if (text) {
      text.textContent = message;
    }
    streetViewFallback.hidden = false;
  }
  if (streetViewMeta) {
    streetViewMeta.textContent = "";
  }
}

function hideFallback() {
  if (streetViewFallback) {
    streetViewFallback.hidden = true;
  }
}

function loadGoogleMaps(key) {
  if (window.google?.maps?.StreetViewPanorama) {
    return Promise.resolve(window.google.maps);
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = () => reject(new Error("Google Maps failed to load."));
    document.head.appendChild(script);
  });
}

function pickRandomLocation() {
  const options = STREET_VIEW_LOCATIONS.filter((location) => location !== currentLocation);
  const pool = options.length ? options : STREET_VIEW_LOCATIONS;
  return pool[Math.floor(Math.random() * pool.length)];
}

function setMeta(location) {
  if (!streetViewMeta) return;
  streetViewMeta.textContent = location ? `Location: ${location.name}` : "";
}

function loadRandomPanorama(attempt = 0) {
  if (!panorama || !streetViewService) return;
  if (attempt >= MAX_PANO_TRIES) {
    showFallback("No Street View available here. Try shuffle.");
    return;
  }
  const location = pickRandomLocation();
  const request = {
    location: { lat: location.lat, lng: location.lng },
    radius: 150,
    source: "outdoor",
  };

  streetViewService.getPanorama(request, (data, status) => {
    if (status === window.google.maps.StreetViewStatus.OK && data?.location?.pano) {
      panorama.setPano(data.location.pano);
      panorama.setPov({
        heading: location.heading ?? 0,
        pitch: location.pitch ?? 0,
      });
      panorama.setZoom(location.zoom ?? 1);
      currentLocation = location;
      setMeta(location);
      hideFallback();
    } else {
      loadRandomPanorama(attempt + 1);
    }
  });
}

function initPanorama() {
  if (!streetViewFrame) return;
  panorama = new window.google.maps.StreetViewPanorama(streetViewFrame, {
    addressControl: false,
    fullscreenControl: false,
    motionTracking: false,
    panControl: true,
    zoomControl: true,
    clickToGo: true,
  });
  streetViewService = new window.google.maps.StreetViewService();
  loadRandomPanorama();
}

function setupStreetView() {
  if (!streetViewFrame) return;
  const key = getMapsKey();
  if (!key) {
    showFallback("Add a Google Maps key to enable Street View.");
    return;
  }

  loadGoogleMaps(key)
    .then(() => {
      initPanorama();
      if (streetViewShuffle) {
        streetViewShuffle.addEventListener("click", () => {
          loadRandomPanorama();
        });
      }
    })
    .catch(() => {
      showFallback("Street View failed to load.");
    });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupStreetView);
} else {
  setupStreetView();
}
