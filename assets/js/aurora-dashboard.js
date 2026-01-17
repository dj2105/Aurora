import {
  TIME_ZONE,
  safeLocalStorageGet,
  safeLocalStorageSet,
  buildWeatherUrl,
  buildGeocodingUrl,
  cacheKey,
  fetchWithCache,
  formatTimeWithZone,
  formatDateInZone,
  parseKpObserved,
  parseKpForecastMax,
  computeTonightCloudAverage,
  getNextHours,
  formatMetric,
  scoreLabel,
  scoreTier,
} from "./data-utils.js";

const DEFAULT_LOCATION = {
  lat: 65.845,
  lon: 24.187,
  name: "Tornio",
};

const WEATHER_TTL = 10 * 60 * 1000;
const KP_TTL = 5 * 60 * 1000;

function renderDashboard(container, data) {
  container.innerHTML = `
    <div class="dashboard-grid">
      <div class="dashboard-card">
        <h3>Temp</h3>
        <p>${formatMetric(data.temp, "°")}</p>
      </div>
      <div class="dashboard-card">
        <h3>Cloud now</h3>
        <p>${formatMetric(data.cloudNow, "%")}</p>
      </div>
      <div class="dashboard-card">
        <h3>Tonight cloud</h3>
        <p>${formatMetric(data.cloudTonight, "%")}</p>
      </div>
      <div class="dashboard-card">
        <h3>Aurora score</h3>
        <p class="dashboard-score" data-tier="${scoreTier(data.score)}">${data.score}</p>
        <p>${scoreLabel(data.score)}</p>
      </div>
    </div>
    <div class="dashboard-card">
      <h3>Next hours (cloud)</h3>
      <div class="dashboard-hours">
        ${data.nextHours
          .map((hour) => {
            const time = formatTimeWithZone(new Date(hour.time), TIME_ZONE).time;
            return `<span><strong>${time}</strong><span>${formatMetric(hour.cloud, "%")}</span></span>`;
          })
          .join("")}
      </div>
    </div>
  `;
}

async function resolveLocation(query) {
  if (!query) return DEFAULT_LOCATION;
  const cached = safeLocalStorageGet(`geo-${query}`);
  if (cached) return JSON.parse(cached);

  const response = await fetch(buildGeocodingUrl(query));
  const data = await response.json();
  const result = data?.results?.[0];
  if (!result) return DEFAULT_LOCATION;
  const location = { lat: result.latitude, lon: result.longitude, name: result.name };
  safeLocalStorageSet(`geo-${query}`, JSON.stringify(location));
  return location;
}

async function loadDashboard(container) {
  const day = container.dataset.day;
  const locationQuery = container.dataset.location;
  const location = await resolveLocation(locationQuery);

  const weather = await fetchWithCache({
    key: cacheKey(`dashboard-weather-${day ?? ""}`, location),
    url: buildWeatherUrl(location),
    ttl: WEATHER_TTL,
  });

  const kpObservedResult = await fetchWithCache({
    key: "dashboard-kp-observed",
    url: "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json",
    ttl: KP_TTL,
  });

  const kpForecastResult = await fetchWithCache({
    key: "dashboard-kp-forecast",
    url: "https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json",
    ttl: KP_TTL,
  });

  const current = weather.data?.current ?? {};
  const hourly = weather.data?.hourly ?? {};
  const cloudTonight = computeTonightCloudAverage(hourly, TIME_ZONE);
  const kpObserved = parseKpObserved(kpObservedResult.data);
  const kpMax = parseKpForecastMax(kpForecastResult.data, 12);
  const kpNow = kpObserved?.kp ?? null;

  const score = Math.round(
    100 * (1 - (current.cloud_cover ?? 100) / 100) * Math.min(1, Math.max(0, (kpNow ?? 0) / 6))
  );

  renderDashboard(container, {
    temp: current.temperature_2m,
    cloudNow: current.cloud_cover,
    cloudTonight,
    score,
    kpMax,
    nextHours: getNextHours(hourly, TIME_ZONE, 6),
  });
}

async function initDashboards() {
  const dashboards = document.querySelectorAll(".live-dashboard");
  if (!dashboards.length) return;

  for (const dashboard of dashboards) {
    try {
      dashboard.innerHTML = "<p>Loading dashboard…</p>";
      await loadDashboard(dashboard);
    } catch (error) {
      const today = formatDateInZone(new Date(), TIME_ZONE);
      dashboard.innerHTML = `
        <div class="dashboard-card">
          <h3>Aurora dashboard</h3>
          <p>Unable to load live data for ${today}. Check connection.</p>
        </div>
      `;
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDashboards);
} else {
  initDashboards();
}
