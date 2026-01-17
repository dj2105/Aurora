import {
  TIME_ZONE,
  buildWeatherUrl,
  cacheKey,
  computeTonightCloudAverage,
  fetchWithCache,
  formatDateInZone,
  formatMetric,
  formatTimeWithZone,
  parseKpForecastMax,
  parseKpObserved,
  scoreLabel,
  scoreTier,
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
    weatherNow: hud.querySelector("[data-role='weather-now']"),
    cloudTonight: hud.querySelector("[data-role='cloud-tonight']"),
    auroraNow: hud.querySelector("[data-role='aurora-now']"),
    auroraScore: hud.querySelector("[data-role='aurora-score']"),
    status: hud.querySelector("[data-role='hud-status']"),
    maps: hud.querySelector("[data-action='maps']"),
    copy: hud.querySelector("[data-action='copy']"),
    supermarket: hud.querySelector("[data-action='supermarket']"),
    bestChance: hud.querySelector("[data-action='best-chance']"),
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

  function updateActionLinks() {
    if (elements.maps) {
      elements.maps.href = hud.dataset.baseMap ?? "#";
    }
    if (elements.supermarket) {
      elements.supermarket.href = hud.dataset.supermarketMap ?? "#";
    }
    if (elements.bestChance) {
      elements.bestChance.href = hud.dataset.auroraAnchor ?? "#";
    }
  }

  async function copyAccommodation() {
    const address = hud.dataset.accommodation;
    if (!address || !elements.copy) return;
    try {
      await navigator.clipboard.writeText(address);
      elements.copy.textContent = "Copied";
      setTimeout(() => {
        elements.copy.textContent = "Accommodation";
      }, 2000);
    } catch (error) {
      elements.copy.textContent = "Copy failed";
      setTimeout(() => {
        elements.copy.textContent = "Accommodation";
      }, 2000);
    }
  }

  function scrollToTodaySection() {
    const today = formatDateInZone(new Date(), TIME_ZONE);
    const target = document.getElementById(`day-${today}-aurora`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function setupInteractions() {
    updateActionLinks();
    if (elements.copy) {
      elements.copy.addEventListener("click", copyAccommodation);
    }
    [elements.weatherNow, elements.cloudTonight, elements.auroraNow, elements.auroraScore]
      .filter(Boolean)
      .forEach((chip) => {
        chip.addEventListener("click", scrollToTodaySection);
      });
  }

  function setStatus(message, isWarning = false) {
    if (!elements.status) return;
    elements.status.textContent = message;
    elements.status.style.color = isWarning ? "#b45309" : "";
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

      const current = weatherResult.data?.current ?? {};
      const hourly = weatherResult.data?.hourly ?? {};
      const temp = current.temperature_2m;
      const cloudNow = current.cloud_cover;
      const tonightCloud = computeTonightCloudAverage(hourly, TIME_ZONE);

      if (elements.weatherNow) {
        elements.weatherNow.textContent = `Temp ${formatMetric(temp, "Â°")} Â· Cloud ${formatMetric(cloudNow, "%")}`;
      }
      if (elements.cloudTonight) {
        elements.cloudTonight.textContent = `Tonight ${formatMetric(tonightCloud, "%")} cloud`;
      }

      const kpObserved = parseKpObserved(kpObservedResult.data);
      const kpMax = parseKpForecastMax(kpForecastResult.data, 12);
      const kpNow = kpObserved?.kp ?? null;
      const kpNowLabel = kpNow === null ? "â€”" : kpNow.toFixed(1);
      const score = Math.round(
        100 * (1 - (cloudNow ?? 100) / 100) * Math.min(1, Math.max(0, (kpNow ?? 0) / 6))
      );

      if (elements.auroraNow) {
        elements.auroraNow.textContent = `Kp ${kpNowLabel} Â· 12h max ${kpMax === null ? "â€”" : kpMax.toFixed(1)}`;
      }
      if (elements.auroraScore) {
        const label = scoreLabel(score);
        elements.auroraScore.textContent = `Aurora ${score} Â· ${label}`;
        elements.auroraScore.dataset.score = scoreTier(score);
      }

      const stale = weatherResult.stale || kpObservedResult.stale || kpForecastResult.stale;
      if (stale) {
        setStatus("Using cached data â€” check connection", true);
      }
    } catch (error) {
      setStatus("Unable to load live data.", true);
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
