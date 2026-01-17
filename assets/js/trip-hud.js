import {
  TIME_ZONE,
  buildWeatherUrl,
  cacheKey,
  fetchWithCache,
  formatMetric,
  formatTimeWithZone,
  formatDateInZone,
  isOffline,
  parseKpObserved,
} from "./data-utils.js";

(() => {
  const hud = document.getElementById("trip-hud");
  if (!hud) return;

  const WEATHER_CACHE_KEY = "aurora-hud-weather";
  const KP_OBS_CACHE_KEY = "aurora-hud-kp-observed";
  const KP_FORECAST_CACHE_KEY = "aurora-hud-kp-forecast";
  const WEATHER_TTL = 10 * 60 * 1000;
  const KP_TTL = 5 * 60 * 1000;

  const elements = {
    timeFi: hud.querySelector("[data-role='time-fi']"),
    timeIe: hud.querySelector("[data-role='time-ie']"),
    tonightTemp: hud.querySelector("[data-role='tonight-temp']"),
    tonightTempMeta: hud.querySelector("[data-role='tonight-temp-meta']"),
    tonightCloud: hud.querySelector("[data-role='tonight-cloud']"),
    tonightCloudMeta: hud.querySelector("[data-role='tonight-cloud-meta']"),
    tonightKp: hud.querySelector("[data-role='tonight-kp']"),
    tonightKpMeta: hud.querySelector("[data-role='tonight-kp-meta']"),
    status: hud.querySelector("[data-role='hud-status']"),
  };

  const location = {
    lat: Number.parseFloat(hud.dataset.lat ?? "65.845"),
    lon: Number.parseFloat(hud.dataset.lon ?? "24.187"),
  };

  function updateTimes() {
    const fi = formatTimeWithZone(new Date(), TIME_ZONE).time;
    const ie = formatTimeWithZone(new Date(), "Europe/Dublin").time;
    if (elements.timeFi) elements.timeFi.textContent = fi;
    if (elements.timeIe) elements.timeIe.textContent = ie;
  }

  function setupInteractions() {
    return;
  }

  function setStatus(message, isWarning = false) {
    if (!elements.status) return;
    elements.status.textContent = message;
    elements.status.style.color = isWarning ? "#b45309" : "";
  }

  function getTonightHours(hourly) {
    if (!hourly?.time) return [];
    const today = formatDateInZone(new Date(), TIME_ZONE);
    const tomorrow = formatDateInZone(new Date(Date.now() + 24 * 60 * 60 * 1000), TIME_ZONE);
    const timeIndexMap = new Map();
    hourly.time.forEach((time, index) => {
      timeIndexMap.set(time, index);
    });
    const hours = [20, 21, 22, 23, 0, 1, 2];
    return hours.map((hour) => {
      const date = hour >= 20 ? today : tomorrow;
      const key = `${date}T${String(hour).padStart(2, "0")}:00`;
      const index = timeIndexMap.get(key);
      return {
        time: key,
        hour,
        cloud: index === undefined ? null : hourly.cloud_cover?.[index],
        temp: index === undefined ? null : hourly.temperature_2m?.[index],
      };
    });
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

  function computeKpForecastMaxForTonight(data) {
    if (!Array.isArray(data) || data.length < 2) return { max: null, hour: null };
    const today = formatDateInZone(new Date(), TIME_ZONE);
    const tomorrow = formatDateInZone(new Date(Date.now() + 24 * 60 * 60 * 1000), TIME_ZONE);
    let max = null;
    let maxHour = null;
    data.slice(1).forEach((row) => {
      const timestamp = row[0];
      const kp = Number.parseFloat(row[1]);
      if (!timestamp || Number.isNaN(kp)) return;
      const time = new Date(timestamp);
      if (Number.isNaN(time.getTime())) return;
      const parts = getDateHourParts(time, TIME_ZONE);
      if (!parts) return;
      const isTonight = parts.date === today && parts.hour >= 20 && parts.hour <= 23;
      const isTomorrow = parts.date === tomorrow && parts.hour >= 0 && parts.hour <= 2;
      if (!isTonight && !isTomorrow) return;
      if (max === null || kp > max) {
        max = kp;
        maxHour = parts.hour;
      }
    });
    return { max, hour: maxHour };
  }

  function formatHourLabel(hour) {
    if (hour === null || hour === undefined || Number.isNaN(hour)) return "";
    return `${String(hour).padStart(2, "0")}:00`;
  }

  async function refreshHud({ force = false } = {}) {
    setStatus("");
    try {
      const weatherPromise = fetchWithCache({
        key: cacheKey(WEATHER_CACHE_KEY, location),
        url: buildWeatherUrl(location),
        ttl: WEATHER_TTL,
        force,
      });
      const kpObservedPromise = fetchWithCache({
        key: KP_OBS_CACHE_KEY,
        url: "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json",
        ttl: KP_TTL,
        force,
      });
      const kpForecastPromise = fetchWithCache({
        key: KP_FORECAST_CACHE_KEY,
        url: "https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json",
        ttl: KP_TTL,
        force,
      });

      const [weatherResult, kpObservedResult, kpForecastResult] = await Promise.all([
        weatherPromise,
        kpObservedPromise,
        kpForecastPromise,
      ]);

      const hourly = weatherResult.data?.hourly ?? {};
      const tonightHours = getTonightHours(hourly);
      const cloudValues = tonightHours.map((hour) => hour.cloud).filter((value) => value !== null);
      const tempValues = tonightHours.map((hour) => hour.temp).filter((value) => value !== null);

      const cloudAvg =
        cloudValues.length > 0 ? cloudValues.reduce((sum, value) => sum + value, 0) / cloudValues.length : null;
      let bestCloudHour = null;
      let bestCloudValue = null;
      tonightHours.forEach((hour) => {
        if (hour.cloud === null) return;
        if (bestCloudValue === null || hour.cloud < bestCloudValue) {
          bestCloudValue = hour.cloud;
          bestCloudHour = hour.hour;
        }
      });
      const bestCloudLabel = bestCloudHour !== null ? formatHourLabel(bestCloudHour) : "";

      const minTemp = tempValues.length ? Math.min(...tempValues) : null;
      const maxTemp = tempValues.length ? Math.max(...tempValues) : null;
      const minTempHour = tonightHours.find((hour) => hour.temp === minTemp)?.hour ?? null;
      const maxTempHour = tonightHours.find((hour) => hour.temp === maxTemp)?.hour ?? null;

      if (elements.tonightTemp) {
        if (minTemp !== null && maxTemp !== null) {
          elements.tonightTemp.textContent = `${formatMetric(minTemp, "\u00B0")} → ${formatMetric(maxTemp, "\u00B0")}`;
        } else {
          elements.tonightTemp.textContent = "\u2014";
        }
      }
      if (elements.tonightTempMeta) {
        const parts = [];
        if (minTempHour !== null) parts.push(`low ~${formatHourLabel(minTempHour)}`);
        if (maxTempHour !== null) parts.push(`high ~${formatHourLabel(maxTempHour)}`);
        elements.tonightTempMeta.textContent = parts.join(" \u00B7 ");
      }

      if (elements.tonightCloud) {
        elements.tonightCloud.textContent = `Avg ${formatMetric(cloudAvg, "%")}`;
      }
      if (elements.tonightCloudMeta) {
        elements.tonightCloudMeta.textContent = bestCloudLabel ? `best ~${bestCloudLabel}` : "";
      }

      const kpObserved = parseKpObserved(kpObservedResult.data);
      const kpForecast = computeKpForecastMaxForTonight(kpForecastResult.data);
      const kpNow = kpObserved?.kp ?? null;
      const kpNowLabel = kpNow === null ? "\u2014" : kpNow.toFixed(1);
      const kpMaxLabel = kpForecast.max === null ? "\u2014" : kpForecast.max.toFixed(1);

      if (elements.tonightKp) {
        elements.tonightKp.textContent = `Now ${kpNowLabel} \u00B7 max ${kpMaxLabel}`;
      }
      if (elements.tonightKpMeta) {
        elements.tonightKpMeta.textContent = kpForecast.hour !== null ? `max ~${formatHourLabel(kpForecast.hour)}` : "";
      }

      const stale = weatherResult.stale || kpObservedResult.stale || kpForecastResult.stale;
      if (stale) {
        const message = isOffline()
          ? "Offline \u2014 showing cached data"
          : "Using cached data \u2014 check connection";
        setStatus(message, true);
      }
    } catch (error) {
      const message = isOffline()
        ? "Offline \u2014 unable to refresh live data"
        : "Unable to load live data.";
      setStatus(message, true);
    }
  }

  function initHud() {
    updateTimes();
    setupInteractions();
    refreshHud();
    setInterval(updateTimes, 60000);
    setInterval(() => refreshHud(), 5 * 60 * 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHud);
  } else {
    initHud();
  }
})();
