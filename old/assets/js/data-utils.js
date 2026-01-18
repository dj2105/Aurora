const TIME_ZONE = "Europe/Helsinki";

function isOffline() {
  return typeof navigator !== "undefined" && navigator && !navigator.onLine;
}

function safeLocalStorageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function safeLocalStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn("Unable to access localStorage", error);
  }
}

function buildWeatherUrl(location) {
  const params = new URLSearchParams({
    latitude: location.lat,
    longitude: location.lon,
    current: "temperature_2m,wind_speed_10m,cloud_cover",
    hourly: "temperature_2m,cloud_cover,precipitation_probability,wind_speed_10m,wind_gusts_10m",
    timezone: TIME_ZONE,
    forecast_days: 7,
  });
  return `https://api.open-meteo.com/v1/forecast?${params}`;
}

function buildGeocodingUrl(query) {
  const params = new URLSearchParams({
    name: query,
    count: 1,
    language: "en",
    format: "json",
  });
  return `https://geocoding-api.open-meteo.com/v1/search?${params}`;
}

function cacheKey(baseKey, location) {
  return `${baseKey}-${location.lat.toFixed(3)}-${location.lon.toFixed(3)}`;
}

function readCache(key) {
  const stored = safeLocalStorageGet(key);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch (error) {
    return null;
  }
}

function writeCache(key, data) {
  safeLocalStorageSet(
    key,
    JSON.stringify({
      timestamp: Date.now(),
      data,
    })
  );
}

async function fetchWithCache({ key, url, ttl, force = false }) {
  const cached = readCache(key);
  const cacheFresh = cached && Date.now() - cached.timestamp < ttl;

  if (cacheFresh && !force) {
    return { data: cached.data, stale: false, fromCache: true };
  }

  if (cached && isOffline()) {
    return { data: cached.data, stale: true, fromCache: true, offline: true };
  }

  if (isOffline()) {
    throw new Error("Offline");
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    const data = await response.json();
    writeCache(key, data);
    return { data, stale: false, fromCache: false };
  } catch (error) {
    if (cached) {
      return { data: cached.data, stale: true, fromCache: true, error };
    }
    throw error;
  }
}

function formatTimeWithZone(date, timeZone = TIME_ZONE) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZoneName: "short",
  });
  const parts = formatter.formatToParts(date);
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  const zone = parts.find((part) => part.type === "timeZoneName")?.value ?? "";
  return { time: `${hour}:${minute}`, zone };
}

function formatDateInZone(date, timeZone = TIME_ZONE) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function parseKpObserved(data) {
  if (!Array.isArray(data) || data.length < 2) return null;
  const rows = data.slice(1).reverse();
  for (const row of rows) {
    const kp = Number.parseFloat(row[1]);
    if (!Number.isNaN(kp)) {
      return { kp, time: row[0] };
    }
  }
  return null;
}

function parseKpForecastMax(data, hoursAhead = 12) {
  if (!Array.isArray(data) || data.length < 2) return null;
  const now = Date.now();
  const limit = now + hoursAhead * 60 * 60 * 1000;
  let max = null;
  data.slice(1).forEach((row) => {
    const time = new Date(row[0]).getTime();
    const kp = Number.parseFloat(row[1]);
    if (Number.isNaN(time) || Number.isNaN(kp)) return;
    if (time >= now && time <= limit) {
      max = max === null ? kp : Math.max(max, kp);
    }
  });
  return max;
}

function computeTonightCloudAverage(hourly, timeZone = TIME_ZONE) {
  if (!hourly?.time || !hourly?.cloud_cover) return null;
  const today = formatDateInZone(new Date(), timeZone);
  const tomorrow = formatDateInZone(new Date(Date.now() + 24 * 60 * 60 * 1000), timeZone);
  const values = [];

  hourly.time.forEach((time, index) => {
    const [date, hourPart] = time.split("T");
    const hour = Number.parseInt(hourPart?.slice(0, 2), 10);
    if (date === today && hour >= 20) {
      values.push(hourly.cloud_cover[index]);
    }
    if (date === tomorrow && hour <= 2) {
      values.push(hourly.cloud_cover[index]);
    }
  });

  if (!values.length) return null;
  const sum = values.reduce((total, value) => total + value, 0);
  return sum / values.length;
}

function getNextDateString(dateString, timeZone = TIME_ZONE) {
  if (!dateString) return null;
  const [year, month, day] = dateString.split("-").map((part) => Number.parseInt(part, 10));
  if ([year, month, day].some((value) => Number.isNaN(value))) return null;
  const start = new Date(Date.UTC(year, month - 1, day));
  const next = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return formatDateInZone(next, timeZone);
}

function computeNightCloudAverageForDate(hourly, targetDateStr, timeZone = TIME_ZONE) {
  if (!hourly?.time || !hourly?.cloud_cover || !targetDateStr) return null;
  const nextDay = getNextDateString(targetDateStr, timeZone);
  if (!nextDay) return null;
  const values = [];

  hourly.time.forEach((time, index) => {
    const [date, hourPart] = time.split("T");
    const hour = Number.parseInt(hourPart?.slice(0, 2), 10);
    if (Number.isNaN(hour)) return;
    if (date === targetDateStr && hour >= 20 && hour <= 23) {
      values.push(hourly.cloud_cover[index]);
    }
    if (date === nextDay && hour >= 0 && hour <= 2) {
      values.push(hourly.cloud_cover[index]);
    }
  });

  if (!values.length) return null;
  const sum = values.reduce((total, value) => total + value, 0);
  return sum / values.length;
}

function getNightHoursForDate(hourly, targetDateStr, timeZone = TIME_ZONE) {
  if (!targetDateStr) return [];
  const nextDay = getNextDateString(targetDateStr, timeZone);
  if (!nextDay) return [];
  const timeIndexMap = new Map();
  if (Array.isArray(hourly?.time)) {
    hourly.time.forEach((time, index) => {
      timeIndexMap.set(time, index);
    });
  }
  const hours = [20, 21, 22, 23, 0, 1, 2];
  return hours.map((hour) => {
    const date = hour >= 20 ? targetDateStr : nextDay;
    const key = `${date}T${String(hour).padStart(2, "0")}:00`;
    const index = timeIndexMap.get(key);
    return {
      time: key,
      cloud: index === undefined ? null : hourly.cloud_cover?.[index],
    };
  });
}

function getNextHours(hourly, timeZone = TIME_ZONE, count = 12) {
  if (!hourly?.time) return [];
  const now = new Date();
  const nowParts = formatTimeWithZone(now, timeZone);
  const today = formatDateInZone(now, timeZone);
  const currentHour = Number.parseInt(nowParts.time.split(":")[0], 10);
  const currentKey = `${today}T${String(currentHour).padStart(2, "0")}:00`;
  let startIndex = hourly.time.findIndex((time) => time === currentKey);
  if (startIndex === -1) {
    startIndex = hourly.time.findIndex((time) => time > currentKey);
  }
  if (startIndex === -1) return [];

  const result = [];
  for (let i = startIndex; i < Math.min(hourly.time.length, startIndex + count); i += 1) {
    result.push({
      time: hourly.time[i],
      cloud: hourly.cloud_cover?.[i],
    });
  }
  return result;
}

function formatMetric(value, suffix = "") {
  if (value === null || value === undefined || Number.isNaN(value)) return "\u2014";
  return `${Math.round(value)}${suffix}`;
}

function scoreLabel(score) {
  if (score <= 20) return "Low";
  if (score <= 50) return "Moderate";
  if (score <= 75) return "Good";
  return "Excellent";
}

function scoreTier(score) {
  if (score <= 20) return "low";
  if (score <= 50) return "moderate";
  if (score <= 75) return "good";
  return "excellent";
}

export {
  TIME_ZONE,
  isOffline,
  safeLocalStorageGet,
  safeLocalStorageSet,
  buildWeatherUrl,
  buildGeocodingUrl,
  cacheKey,
  readCache,
  writeCache,
  fetchWithCache,
  formatTimeWithZone,
  formatDateInZone,
  parseKpObserved,
  parseKpForecastMax,
  computeTonightCloudAverage,
  computeNightCloudAverageForDate,
  getNightHoursForDate,
  getNextHours,
  formatMetric,
  scoreLabel,
  scoreTier,
};
