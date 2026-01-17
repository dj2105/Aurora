(() => {
  const DASHBOARD_SELECTOR = ".live-dashboard";
  const TIME_ZONE = "Europe/Helsinki";
  const LOCATION_STORAGE_KEY = "aurora-dashboard-location";
  const WEATHER_CACHE_KEY = "aurora-dashboard-weather";
  const KP_OBS_CACHE_KEY = "aurora-dashboard-kp-observed";
  const KP_FORECAST_CACHE_KEY = "aurora-dashboard-kp-forecast";
  const WEATHER_TTL = 10 * 60 * 1000;
  const KP_TTL = 5 * 60 * 1000;

  const DEFAULT_LOCATION = {
    type: "accommodation",
    label: "Tornio (Riverside Restplace)",
    lat: 65.845,
    lon: 24.187,
  };

  const state = {
    location: loadStoredLocation(),
    instances: [],
    loading: false,
  };

  function loadStoredLocation() {
    const stored = safeLocalStorageGet(LOCATION_STORAGE_KEY);
    if (!stored) return { ...DEFAULT_LOCATION };
    try {
      const parsed = JSON.parse(stored);
      if (typeof parsed.lat !== "number" || typeof parsed.lon !== "number") {
        return { ...DEFAULT_LOCATION };
      }
      return parsed;
    } catch (error) {
      return { ...DEFAULT_LOCATION };
    }
  }

  function saveStoredLocation(location) {
    safeLocalStorageSet(LOCATION_STORAGE_KEY, JSON.stringify(location));
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
      forecast_days: 2,
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
    safeLocalStorageSet(key, JSON.stringify({
      timestamp: Date.now(),
      data,
    }));
  }

  async function fetchWithCache({ key, url, ttl, force = false }) {
    const cached = readCache(key);
    const cacheFresh = cached && Date.now() - cached.timestamp < ttl;

    if (cacheFresh && !force) {
      return { data: cached.data, stale: false, fromCache: true };
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

  function formatTimeWithZone(date, timeZone) {
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

  function formatDateInZone(date, timeZone) {
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

  function computeTonightCloudAverage(hourly, timeZone) {
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

  function getNextHours(hourly, timeZone, count = 12) {
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
    if (value === null || value === undefined || Number.isNaN(value)) return "—";
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

  function buildDashboardMarkup(instanceId) {
    return `
      <div class="live-dashboard__card is-loading" role="region" aria-label="Live weather and aurora">
        <header class="live-dashboard__header">
          <div>
            <p class="live-dashboard__eyebrow">Live conditions</p>
            <h4 class="live-dashboard__title" data-role="title">Live conditions — ${state.location.label}</h4>
            <p class="live-dashboard__sub" data-role="local-time">Local time: --:--</p>
          </div>
          <button class="live-dashboard__refresh" type="button" data-role="refresh">Refresh</button>
        </header>
        <div class="live-dashboard__settings" role="group" aria-label="Location settings">
          <label>
            <input type="radio" name="location-${instanceId}" value="accommodation" />
            Use accommodation location
          </label>
          <label>
            <input type="radio" name="location-${instanceId}" value="current" />
            Use my current location
          </label>
          <label>
            <input type="radio" name="location-${instanceId}" value="custom" />
            Custom location
          </label>
          <div class="live-dashboard__custom" aria-label="Custom location">
            <input type="text" data-role="custom-input" placeholder="Place name or lat, lon" />
            <button type="button" data-role="custom-submit">Set</button>
            <p class="live-dashboard__hint">Example: 65.84, 24.18 or “Tornio”.</p>
          </div>
        </div>
        <div class="live-dashboard__grid">
          <div class="live-dashboard__panel">
            <h5>Weather now</h5>
            <div class="live-dashboard__metric">
              <span class="live-dashboard__temp" data-role="temp">--°</span>
              <span class="live-dashboard__summary" data-role="summary">Cloud --%</span>
            </div>
            <dl class="live-dashboard__list">
              <div>
                <dt>Wind</dt>
                <dd data-role="wind">--</dd>
              </div>
              <div>
                <dt>Cloud now</dt>
                <dd data-role="cloud-now">--%</dd>
              </div>
              <div>
                <dt>Tonight cloud avg</dt>
                <dd data-role="cloud-tonight">--%</dd>
              </div>
            </dl>
            <div class="live-dashboard__timeline" aria-label="Next 12 hours cloud cover">
              <div class="live-dashboard__timeline-track" data-role="timeline"></div>
            </div>
          </div>
          <div class="live-dashboard__panel">
            <h5>Aurora now</h5>
            <dl class="live-dashboard__list">
              <div>
                <dt>Kp now</dt>
                <dd data-role="kp-now">--</dd>
              </div>
              <div>
                <dt>Next 12h max Kp</dt>
                <dd data-role="kp-max">--</dd>
              </div>
            </dl>
            <div class="live-dashboard__score">
              <span class="live-dashboard__pill" data-role="score-pill">Aurora Score</span>
              <p class="live-dashboard__score-detail" data-role="score-detail">Cloud --% · Kp --</p>
            </div>
            <p class="live-dashboard__tip">Cloud is the main limiter — clear skies matter most.</p>
          </div>
        </div>
        <div class="live-dashboard__footer">
          <span data-role="coords">Coords: --</span>
          <span data-role="updated">Last updated: --</span>
          <span class="live-dashboard__status" data-role="status" aria-live="polite"></span>
        </div>
      </div>
    `;
  }

  function mountDashboard(element, index) {
    element.innerHTML = buildDashboardMarkup(index);
    const card = element.querySelector(".live-dashboard__card");
    const instance = {
      root: element,
      card,
      title: element.querySelector("[data-role='title']"),
      localTime: element.querySelector("[data-role='local-time']"),
      temp: element.querySelector("[data-role='temp']"),
      summary: element.querySelector("[data-role='summary']"),
      wind: element.querySelector("[data-role='wind']"),
      cloudNow: element.querySelector("[data-role='cloud-now']"),
      cloudTonight: element.querySelector("[data-role='cloud-tonight']"),
      timeline: element.querySelector("[data-role='timeline']"),
      kpNow: element.querySelector("[data-role='kp-now']"),
      kpMax: element.querySelector("[data-role='kp-max']"),
      scorePill: element.querySelector("[data-role='score-pill']"),
      scoreDetail: element.querySelector("[data-role='score-detail']"),
      coords: element.querySelector("[data-role='coords']"),
      updated: element.querySelector("[data-role='updated']"),
      status: element.querySelector("[data-role='status']"),
      refresh: element.querySelector("[data-role='refresh']"),
      customInput: element.querySelector("[data-role='custom-input']"),
      customSubmit: element.querySelector("[data-role='custom-submit']"),
      locationInputs: element.querySelectorAll("input[type='radio']"),
    };

    instance.refresh.addEventListener("click", () => refreshData({ force: true }));
    instance.customSubmit.addEventListener("click", () => handleCustomLocation(instance));
    instance.customInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleCustomLocation(instance);
      }
    });

    instance.locationInputs.forEach((input) => {
      input.addEventListener("change", () => handleLocationChange(input.value, instance));
    });

    state.instances.push(instance);
    syncLocationInputs();
    updateLocalTime();
    updateCoords();
  }

  function syncLocationInputs() {
    state.instances.forEach((instance) => {
      instance.locationInputs.forEach((input) => {
        input.checked = input.value === state.location.type;
      });
    });
  }

  function updateLocalTime() {
    const { time, zone } = formatTimeWithZone(new Date(), TIME_ZONE);
    state.instances.forEach((instance) => {
      instance.localTime.textContent = `Local time: ${time} (${zone})`;
    });
  }

  function updateCoords() {
    state.instances.forEach((instance) => {
      instance.title.textContent = `Live conditions — ${state.location.label}`;
      instance.coords.textContent = `Coords: ${state.location.lat.toFixed(3)}, ${state.location.lon.toFixed(3)}`;
    });
  }

  async function handleLocationChange(value, instance) {
    if (value === "accommodation") {
      state.location = { ...DEFAULT_LOCATION };
      saveStoredLocation(state.location);
      syncLocationInputs();
      updateCoords();
      refreshData({ force: true });
      return;
    }

    if (value === "current") {
      setStatus("Fetching current location…", false);
      if (!navigator.geolocation) {
        setStatus("Geolocation not supported on this device.", true);
        syncLocationInputs();
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          state.location = {
            type: "current",
            label: "Current location",
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          saveStoredLocation(state.location);
          syncLocationInputs();
          updateCoords();
          refreshData({ force: true });
          setStatus("", false);
        },
        () => {
          setStatus("Location permission denied.", true);
          syncLocationInputs();
        }
      );
      return;
    }

    if (value === "custom") {
      state.instances.forEach((item) => item.customInput.focus());
    }

    syncLocationInputs();
  }

  async function handleCustomLocation(instance) {
    const value = instance.customInput.value.trim();
    if (!value) return;

    const latLonMatch = value.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
    if (latLonMatch) {
      state.location = {
        type: "custom",
        label: `Custom (${latLonMatch[1]}, ${latLonMatch[2]})`,
        lat: Number.parseFloat(latLonMatch[1]),
        lon: Number.parseFloat(latLonMatch[2]),
      };
      saveStoredLocation(state.location);
      syncLocationInputs();
      updateCoords();
      refreshData({ force: true });
      return;
    }

    setStatus("Searching location…", false);
    try {
      const response = await fetch(buildGeocodingUrl(value));
      if (!response.ok) throw new Error("Geocoding failed");
      const data = await response.json();
      const first = data?.results?.[0];
      if (!first) {
        setStatus("No matches found. Try a nearby town.", true);
        return;
      }
      state.location = {
        type: "custom",
        label: `${first.name}${first.country ? `, ${first.country}` : ""}`,
        lat: first.latitude,
        lon: first.longitude,
      };
      saveStoredLocation(state.location);
      syncLocationInputs();
      updateCoords();
      refreshData({ force: true });
      setStatus("", false);
    } catch (error) {
      setStatus("Could not resolve location.", true);
    }
  }

  function setStatus(message, isWarning) {
    state.instances.forEach((instance) => {
      instance.status.textContent = message;
      instance.status.style.color = isWarning ? "#b45309" : "";
    });
  }

  function updateTimeline(instance, data) {
    instance.timeline.innerHTML = "";
    data.forEach((entry) => {
      const hourLabel = entry.time.split("T")[1]?.slice(0, 2) ?? "--";
      const bar = document.createElement("div");
      bar.className = "live-dashboard__hour";
      const cloud = Math.min(100, Math.max(0, entry.cloud ?? 0));
      bar.innerHTML = `
        <span>${hourLabel}</span>
        <span class="live-dashboard__bar" style="--cloud: ${cloud}"></span>
      `;
      instance.timeline.appendChild(bar);
    });
  }

  function updateDashboardContent({ weather, kpObserved, kpMax, stale }) {
    const current = weather?.current ?? {};
    const hourly = weather?.hourly ?? {};
    const currentTemp = current.temperature_2m;
    const cloudNow = current.cloud_cover;
    const windSpeed = current.wind_speed_10m;

    const tonightCloud = computeTonightCloudAverage(hourly, TIME_ZONE);
    const hourlyWindow = getNextHours(hourly, TIME_ZONE, 12);

    const gusts = (() => {
      if (!hourly?.time || !hourly?.wind_gusts_10m) return null;
      const { time } = formatTimeWithZone(new Date(), TIME_ZONE);
      const hour = time.split(\":\")[0];
      const currentTimeKey = hourly.time.find((value) => value.includes(`T${hour}:00`));
      const idx = hourly.time.indexOf(currentTimeKey);
      return idx >= 0 ? hourly.wind_gusts_10m[idx] : null;
    })();

    const kpNow = kpObserved?.kp ?? null;
    const kpNowLabel = kpNow === null ? "—" : kpNow.toFixed(1);
    const score = Math.round(
      100 * (1 - (cloudNow ?? 100) / 100) * Math.min(1, Math.max(0, (kpNow ?? 0) / 6))
    );
    const label = scoreLabel(score);

    state.instances.forEach((instance) => {
      instance.card.classList.remove("is-loading");
      instance.temp.textContent = `${formatMetric(currentTemp, "°")}`;
      instance.summary.textContent = `Cloud ${formatMetric(cloudNow, "%")}`;
      const windText = windSpeed !== null && windSpeed !== undefined
        ? `Wind ${formatMetric(windSpeed, " m/s")}${gusts ? ` · Gusts ${formatMetric(gusts, " m/s")}` : ""}`
        : "—";
      instance.wind.textContent = windText;
      instance.cloudNow.textContent = formatMetric(cloudNow, "%");
      instance.cloudTonight.textContent = formatMetric(tonightCloud, "%");
      updateTimeline(instance, hourlyWindow);

      instance.kpNow.textContent = kpNowLabel;
      instance.kpMax.textContent = kpMax === null ? "—" : kpMax.toFixed(1);
      instance.scorePill.textContent = `Aurora Score ${score} · ${label}`;
      instance.scorePill.dataset.score = scoreTier(score);
      instance.scoreDetail.textContent = `Cloud ${formatMetric(cloudNow, "%")} · Kp ${kpNowLabel}`;

      const { time } = formatTimeWithZone(new Date(), TIME_ZONE);
      instance.updated.textContent = `Last updated: ${time}`;
      instance.status.textContent = stale ? "Using cached data — update failed" : "";
    });
  }

  async function refreshData({ force = false } = {}) {
    if (state.loading) return;
    state.loading = true;
    setStatus("", false);
    const location = state.location;

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

      const kpObserved = parseKpObserved(kpObservedResult.data);
      const kpMax = parseKpForecastMax(kpForecastResult.data, 12);
      const stale = weatherResult.stale || kpObservedResult.stale || kpForecastResult.stale;

      updateDashboardContent({
        weather: weatherResult.data,
        kpObserved,
        kpMax,
        stale,
      });
    } catch (error) {
      setStatus("Unable to load live data.", true);
    } finally {
      state.loading = false;
    }
  }

  function initDashboards() {
    const placeholders = document.querySelectorAll(DASHBOARD_SELECTOR);
    if (!placeholders.length) return;
    placeholders.forEach((element, index) => mountDashboard(element, index));
    updateLocalTime();
    updateCoords();
    refreshData();
    setInterval(updateLocalTime, 60000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDashboards);
  } else {
    initDashboards();
  }
})();
