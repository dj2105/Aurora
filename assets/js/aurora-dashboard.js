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
  computeNightCloudAverageForDate,
  getNightHoursForDate,
  formatMetric,
} from "./data-utils.js";

const DEFAULT_LOCATION = {
  lat: 65.845,
  lon: 24.187,
  name: "Tornio",
};

const WEATHER_TTL = 10 * 60 * 1000;
const KP_TTL = 5 * 60 * 1000;

function formatDayLabel(dateString) {
  if (!dateString) return "";
  const date = new Date(`${dateString}T12:00:00`);
  const weekday = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    weekday: "short",
  }).format(date);
  return `${weekday} ${dateString}`;
}

function getDateHourParts(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  const hour = parts.find((part) => part.type === "hour")?.value;
  if (!year || !month || !day || !hour) return null;
  return { date: `${year}-${month}-${day}`, hour: Number.parseInt(hour, 10) };
}

function getNextDateString(dateString) {
  if (!dateString) return null;
  const [year, month, day] = dateString.split("-").map((part) => Number.parseInt(part, 10));
  if ([year, month, day].some((value) => Number.isNaN(value))) return null;
  const start = new Date(Date.UTC(year, month - 1, day));
  const next = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return formatDateInZone(next, TIME_ZONE);
}

function computeKpForecastMaxForNight(data, targetDateStr) {
  if (!Array.isArray(data) || data.length < 2 || !targetDateStr) return null;
  const nextDay = getNextDateString(targetDateStr);
  if (!nextDay) return null;
  let max = null;
  data.slice(1).forEach((row) => {
    const timestamp = row[0];
    const kp = Number.parseFloat(row[1]);
    if (!timestamp || Number.isNaN(kp)) return;
    const time = new Date(timestamp);
    if (Number.isNaN(time.getTime())) return;
    const parts = getDateHourParts(time, TIME_ZONE);
    if (!parts) return;
    const isTargetNight = parts.date === targetDateStr && parts.hour >= 20 && parts.hour <= 23;
    const isNextNight = parts.date === nextDay && parts.hour >= 0 && parts.hour <= 2;
    if (isTargetNight || isNextNight) {
      max = max === null ? kp : Math.max(max, kp);
    }
  });
  return max;
}

function renderDashboard(container, data) {
  container.innerHTML = `
    <header class="dashboard-header">
      <p class="dashboard-eyebrow">Aurora outlook</p>
      <h3 class="dashboard-title">${data.title}</h3>
      <p class="dashboard-sub">${data.localTime}</p>
    </header>
    <div class="dashboard-grid">
      <div class="dashboard-card">
        <h3>Night cloud</h3>
        <p>${formatMetric(data.cloudNight, "%")}</p>
      </div>
      <div class="dashboard-card">
        <h3>Kp observed now</h3>
        <p>${formatMetric(data.kpObserved, "")}</p>
      </div>
      <div class="dashboard-card">
        <h3>Kp forecast (night)</h3>
        <p>${formatMetric(data.kpForecastNight, "")}</p>
      </div>
    </div>
    ${
      data.nightAvailable
        ? `<div class="dashboard-card">
          <h3>Night cloud timeline</h3>
          <div class="dashboard-timeline" role="list">
            ${data.nightHours
              .map((hour) => {
                const hourLabel = hour.time.slice(11, 13);
                const cloud = Math.min(100, Math.max(0, hour.cloud ?? 0));
                return `
                  <div class="dashboard-hour" role="listitem">
                    <span class="dashboard-bar" style="--cloud: ${cloud}"></span>
                    <span class="dashboard-hour-label">${hourLabel}</span>
                  </div>
                `;
              })
              .join("")}
          </div>
        </div>`
        : ""
    }
    ${data.status ? `<p class="dashboard-status">${data.status}</p>` : ""}
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
  const dayDate = day || formatDateInZone(new Date(), TIME_ZONE);
  const dayLabel = formatDayLabel(dayDate);

  const weather = await fetchWithCache({
    key: cacheKey("dashboard-weather", location),
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

  const hourly = weather.data?.hourly ?? {};
  const cloudNight = computeNightCloudAverageForDate(hourly, dayDate, TIME_ZONE);
  const nightHours = getNightHoursForDate(hourly, dayDate, TIME_ZONE);
  const nightAvailable =
    nightHours.length > 0 && nightHours.every((hour) => hour.cloud !== null && hour.cloud !== undefined);
  const kpObserved = parseKpObserved(kpObservedResult.data);
  const kpMaxNight = computeKpForecastMaxForNight(kpForecastResult.data, dayDate);

  const stale = weather.stale || kpObservedResult.stale || kpForecastResult.stale;
  const statusParts = [];
  if (!nightAvailable) {
    statusParts.push("Forecast not available yet for this date.");
  }
  if (stale) {
    statusParts.push("Cached data in use.");
  }
  const status = statusParts.join(" ");

  renderDashboard(container, {
    title: `${location.name} \u2014 ${dayLabel}`,
    localTime: `Local time: ${formatTimeWithZone(new Date(), TIME_ZONE).time}`,
    cloudNight,
    nightHours,
    nightAvailable,
    kpObserved: kpObserved?.kp ?? null,
    kpForecastNight: kpMaxNight,
    status,
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
      const statusMessage = navigator.onLine
        ? `Unable to load live data for ${today}. Check connection.`
        : `Offline \u2014 cached data unavailable for ${today}.`;
      dashboard.innerHTML = `
        <div class="dashboard-card">
          <h3>Aurora dashboard</h3>
          <p>${statusMessage}</p>
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
