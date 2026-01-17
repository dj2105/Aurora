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

      const hour = time.split(":")[0];
