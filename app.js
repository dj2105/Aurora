import { bookings, checklist, days } from "./assets/data/trip-data.js";

const storageKey = "aurora-checklist";
const outingGearKey = "aurora-outing-gear-v1";
const pillsKey = "aurora-pills-v1";
const userItemsKey = "aurora-user-items-v1";
const copyPhrasesKey = "aurora-copy-phrases-v1";
const uiKey = "aurora-ui-v1";
const LAST_UPDATED_KEY = "aurora-last-updated";
const syncMetaKey = "aurora-sync-meta-v1";
let dayObserver;
let lastPillReminderDate = null;
let editingCopyPhraseId = null;
let activeCopyBookingId = null;
let appState = {
  outingGear: null,
  pills: {},
  userItems: [],
  copyPhrases: { items: [] },
  checklist: {},
  ui: { bigText: false },
  updatedAt: {
    gear: 0,
    pills: 0,
    checklist: 0,
    userItems: 0,
    copyPhrases: 0,
    ui: 0,
  },
};
const stateListeners = new Set();

const timelineEl = document.getElementById("timeline");
const carousel = document.getElementById("day-carousel");
const carouselTrack = document.getElementById("day-carousel-track");
const bookingsList = document.getElementById("bookings-list");
const thingysList = document.getElementById("thingys-list");
const thingysSummary = document.getElementById("thingys-summary");
const thingysForm = document.getElementById("thingys-add");
const thingysInput = document.getElementById("thingys-input");
const thingysCategoryInput = document.getElementById("thingys-category");
const thingysCategoryList = document.getElementById("thingys-categories");

const actionToast = document.getElementById("action-toast");
const addItemForm = document.getElementById("user-item-form");
const addItemDay = document.getElementById("user-item-day");
const addItemTime = document.getElementById("user-item-time");
const addItemTitle = document.getElementById("user-item-title");
const addItemDetail = document.getElementById("user-item-detail");
const addItemType = document.getElementById("user-item-type");
const addItemModal = document.getElementById("add-item-modal");
const addItemClose = document.getElementById("add-item-close");
const bigTextToggle = document.getElementById("big-text-toggle");
const tabButtons = Array.from(document.querySelectorAll(".bottom-nav__button"));
const tabSections = Array.from(document.querySelectorAll("[data-tab-section]"));

const eventDetailModal = document.getElementById("event-detail-modal");
const eventDetailClose = document.getElementById("event-detail-close");
const eventDetailBody = document.getElementById("event-detail-body");
const eventDetailTitle = document.getElementById("event-detail-title");

const copySheetModal = document.getElementById("copy-sheet-modal");
const copySheetClose = document.getElementById("copy-sheet-close");
const copySheetList = document.getElementById("copy-sheet-list");
const copySheetForm = document.getElementById("copy-sheet-form");
const copySheetLabel = document.getElementById("copy-sheet-label");
const copySheetText = document.getElementById("copy-sheet-text");
const copySheetSubmit = document.getElementById("copy-sheet-submit");
const copySheetCancel = document.getElementById("copy-sheet-cancel");
const copySheetSubtitle = document.getElementById("copy-sheet-subtitle");
const copySheetTitle = document.getElementById("copy-sheet-title");

const activeTabKey = "aurora-active-tab";
const bookingsById = new Map(bookings.map((booking) => [booking.id, booking]));

const defaultThingys = [
  { label: "Thermal base layers", category: "Clothes" },
  { label: "Mid layers (fleece/wool)", category: "Clothes" },
  { label: "Waterproof outer shell", category: "Clothes" },
  { label: "Wool socks", category: "Clothes" },
  { label: "Waterproof boots", category: "Clothes" },
  { label: "Gloves + hat", category: "Clothes" },
  { label: "Head torch", category: "Equipment" },
  { label: "Hand warmers", category: "Equipment" },
  { label: "Power bank + cables", category: "Equipment" },
  { label: "Thermos", category: "Equipment" },
  { label: "Camera gear", category: "Equipment" },
  { label: "Passport(s)", category: "Belongings" },
  { label: "Cash + cards", category: "Belongings" },
  { label: "Tickets + confirmations", category: "Belongings" },
  { label: "Phone", category: "Belongings" },
  { label: "Keys", category: "Belongings" },
];

const defaultCopyPhrases = [];

function safeReadStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function safeWriteStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn("Unable to store checklist", error);
  }
}

function createId(prefix) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function normalizeCopyPhrase(item) {
  if (!item || typeof item !== "object") return null;
  if (!item.id || typeof item.label !== "string" || typeof item.text !== "string") return null;
  return {
    id: item.id,
    category: item.category ?? "custom",
    label: item.label,
    text: item.text,
    url: item.url ?? "",
    bookingId: item.bookingId ?? null,
    source: item.source ?? "user",
    updatedAt: Number(item.updatedAt ?? 0),
    deleted: Boolean(item.deleted),
  };
}

function mergeCopyPhrases(primary, secondary, preferSecondaryOnTie = true) {
  const map = new Map();
  const addItem = (item, isSecondary) => {
    if (!item?.id) return;
    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
      return;
    }
    const existingUpdated = Number(existing.updatedAt ?? 0);
    const nextUpdated = Number(item.updatedAt ?? 0);
    if (nextUpdated > existingUpdated) {
      map.set(item.id, item);
    } else if (nextUpdated === existingUpdated && isSecondary && preferSecondaryOnTie) {
      map.set(item.id, item);
    }
  };
  primary.forEach((item) => addItem(item, false));
  secondary.forEach((item) => addItem(item, true));
  return Array.from(map.values());
}

function createDefaultOutingState() {
  return {
    items: defaultThingys.map((item) => ({
      id: createId("gear"),
      label: item.label,
      category: item.category,
      checks: { daniel: false, jaime: false },
      deleted: false,
    })),
  };
}

function loadOutingGear() {
  const stored = safeReadStorage(outingGearKey);
  if (!stored) {
    const initial = createDefaultOutingState();
    safeWriteStorage(outingGearKey, JSON.stringify(initial));
    return initial;
  }
  try {
    const parsed = JSON.parse(stored);
    if (!parsed?.items || !Array.isArray(parsed.items)) {
      throw new Error("Invalid outing gear data");
    }
    let changed = false;
    const items = parsed.items
      .filter((item) => typeof item?.label === "string")
      .map((item) => {
        if (!item?.id) changed = true;
        if (typeof item?.deleted !== "boolean") changed = true;
        if (!item?.category) changed = true;
        return {
          id: item?.id ?? createId("gear"),
          label: item.label,
          category: item?.category ?? "Equipment",
          checks: {
            daniel: Boolean(item?.checks?.daniel),
            jaime: Boolean(item?.checks?.jaime),
          },
          deleted: Boolean(item?.deleted),
        };
      });
    const cleaned = { items };
    if (changed) {
      safeWriteStorage(outingGearKey, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch (error) {
    const fallback = createDefaultOutingState();
    safeWriteStorage(outingGearKey, JSON.stringify(fallback));
    return fallback;
  }
}

function loadPillsState() {
  const stored = safeReadStorage(pillsKey);
  if (!stored) return {};
  try {
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") return {};
    const cleaned = {};
    Object.entries(parsed).forEach(([date, entry]) => {
      cleaned[date] = {
        daniel: Boolean(entry?.daniel),
        jaime: Boolean(entry?.jaime),
      };
    });
    return cleaned;
  } catch (error) {
    return {};
  }
}

function loadCopyPhrases() {
  const stored = safeReadStorage(copyPhrasesKey);
  if (!stored) {
    return { items: [...defaultCopyPhrases] };
  }
  try {
    const parsed = JSON.parse(stored);
    const list = Array.isArray(parsed?.items) ? parsed.items : Array.isArray(parsed) ? parsed : [];
    const cleaned = list.map(normalizeCopyPhrase).filter(Boolean);
    const merged = mergeCopyPhrases(defaultCopyPhrases, cleaned, true);
    return { items: merged };
  } catch (error) {
    return { items: [...defaultCopyPhrases] };
  }
}

function getPillsEntry(date) {
  if (!appState.pills[date]) {
    appState.pills[date] = { daniel: false, jaime: false };
  }
  return appState.pills[date];
}

function loadUserItems() {
  const stored = safeReadStorage(userItemsKey);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    let changed = false;
    const cleaned = parsed
      .filter((item) => item && typeof item.title === "string")
      .map((item) => {
        if (!item?.id) changed = true;
        if (typeof item?.deleted !== "boolean") changed = true;
        return {
          id: item?.id ?? createId("user"),
          day: item.day ?? null,
          time: item.time ?? null,
          title: item.title,
          detail: item.detail ?? "",
          type: item.type ?? "",
          createdAt: item.createdAt ?? Date.now(),
          deleted: Boolean(item?.deleted),
        };
      });
    if (changed) {
      safeWriteStorage(userItemsKey, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch (error) {
    return [];
  }
}

function loadChecklistState() {
  try {
    const stored = safeReadStorage(storageKey);
    if (!stored) return {};
    const parsed = JSON.parse(stored);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}

function loadUiState() {
  try {
    const stored = safeReadStorage(uiKey);
    if (!stored) return { bigText: false };
    const parsed = JSON.parse(stored);
    return { bigText: Boolean(parsed?.bigText) };
  } catch (error) {
    return { bigText: false };
  }
}

function loadUpdatedAt() {
  try {
    const stored = safeReadStorage(syncMetaKey);
    if (!stored) {
      return {
        gear: 0,
        pills: 0,
        checklist: 0,
        userItems: 0,
        copyPhrases: 0,
        ui: 0,
      };
    }
    const parsed = JSON.parse(stored);
    return {
      gear: Number(parsed?.gear ?? parsed?.updatedAt?.gear ?? 0),
      pills: Number(parsed?.pills ?? parsed?.updatedAt?.pills ?? 0),
      checklist: Number(parsed?.checklist ?? parsed?.updatedAt?.checklist ?? 0),
      userItems: Number(parsed?.userItems ?? parsed?.updatedAt?.userItems ?? 0),
      copyPhrases: Number(parsed?.copyPhrases ?? parsed?.updatedAt?.copyPhrases ?? 0),
      ui: Number(parsed?.ui ?? parsed?.updatedAt?.ui ?? 0),
    };
  } catch (error) {
    return {
      gear: 0,
      pills: 0,
      checklist: 0,
      userItems: 0,
      copyPhrases: 0,
      ui: 0,
    };
  }
}

function persistState() {
  safeWriteStorage(outingGearKey, JSON.stringify(appState.outingGear));
  safeWriteStorage(pillsKey, JSON.stringify(appState.pills));
  safeWriteStorage(userItemsKey, JSON.stringify(appState.userItems));
  safeWriteStorage(copyPhrasesKey, JSON.stringify(appState.copyPhrases));
  safeWriteStorage(storageKey, JSON.stringify(appState.checklist));
  safeWriteStorage(uiKey, JSON.stringify(appState.ui));
  safeWriteStorage(syncMetaKey, JSON.stringify(appState.updatedAt));
}

function emitStateChange(payload) {
  stateListeners.forEach((listener) => {
    listener(payload);
  });
}

function setState(updates, { source = "local", updatedSections = [], updatedAt = {} } = {}) {
  const nextUpdatedAt = { ...appState.updatedAt, ...updatedAt };
  if (source === "local") {
    const now = Date.now();
    updatedSections.forEach((section) => {
      nextUpdatedAt[section] = now;
    });
  }
  appState = {
    ...appState,
    ...updates,
    updatedAt: nextUpdatedAt,
  };
  persistState();
  applyStateToUI(updatedSections);
  emitStateChange({ state: appState, source, updatedSections });
}

function onStateChange(listener) {
  stateListeners.add(listener);
  return () => stateListeners.delete(listener);
}

window.AuroraState = {
  getState: () => appState,
  setState,
  onChange: onStateChange,
};

function parseTimeToMinutes(time) {
  if (!time) return null;
  const [hours, minutes] = time.split(":").map((part) => Number.parseInt(part, 10));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}
function getTimeParts(timeZone) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date());
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  return { hour: Number(hour), minute: Number(minute) };
}

function getDateString(timeZone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function parseTripDate(dateString) {
  if (typeof dateString !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function formatTripDate(dateString, timeZone) {
  const date = parseTripDate(dateString);
  if (!date) return dateString;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: timeZone ?? "UTC",
  }).format(date);
}

function toDateValue(dateString, timeString) {
  if (!dateString) return 0;
  const [year, month, day] = dateString.split("-").map((part) => Number.parseInt(part, 10));
  if (!year || !month || !day) return 0;
  const [hour = 0, minute = 0] = (timeString || "00:00").split(":").map((part) => Number.parseInt(part, 10));
  return Date.UTC(year, month - 1, day, hour || 0, minute || 0);
}

function formatEventTime(event) {
  const timeValue = event?.time?.local ?? event?.time ?? event?.departTime ?? event?.startTime ?? null;
  if (!timeValue) return "";
  return timeValue;
}

function getEventSortMinutes(event) {
  const timeValue = event?.time?.local ?? event?.time ?? event?.departTime ?? event?.startTime ?? null;
  return parseTimeToMinutes(timeValue);
}

function renderTimeline() {
  if (!timelineEl) return;
  timelineEl.innerHTML = "";

  days.forEach((day) => {
    const link = document.createElement("button");
    link.type = "button";
    link.className = "day-chip";
    link.dataset.day = day.date;
    const formatted = day.shortLabel ?? formatTripDate(day.date, day.timeZone).replace(",", "");
    link.textContent = formatted;
    timelineEl.appendChild(link);
  });
}

function getMergedEvents(day) {
  const baseEvents = (day.events ?? []).map((event, index) => ({
    ...event,
    source: "base",
    order: index,
  }));
  const userEvents = appState.userItems
    .filter((item) => !item.deleted && item.day === day.date)
    .map((item) => ({
      time: item.time || null,
      title: item.title,
      detail: item.detail,
      type: item.type,
      source: "user",
      id: item.id,
      order: item.createdAt ?? 0,
    }));

  const combined = [...baseEvents, ...userEvents];
  const scheduled = combined
    .filter((event) => getEventSortMinutes(event) !== null)
    .sort((a, b) => {
      const aMinutes = getEventSortMinutes(a);
      const bMinutes = getEventSortMinutes(b);
      if (aMinutes === null && bMinutes === null) return a.order - b.order;
      if (aMinutes === null) return 1;
      if (bMinutes === null) return -1;
      return aMinutes - bMinutes;
    });
  const unscheduled = combined
    .filter((event) => getEventSortMinutes(event) === null)
    .sort((a, b) => a.order - b.order);
  return [...scheduled, ...unscheduled];
}

function formatDayHeader(day) {
  return formatTripDate(day.date, day.timeZone);
}

function buildAuroraLink(date, time) {
  const hud = document.getElementById("trip-hud");
  const lat = Number.parseFloat(hud?.dataset?.lat ?? "65.845");
  const lon = Number.parseFloat(hud?.dataset?.lon ?? "24.187");
  const url = new URL("https://www.aurora-service.eu/aurora-forecast/");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  if (date) url.searchParams.set("date", date);
  if (time) url.searchParams.set("time", time);
  return url.toString();
}

function extractLocationCodesFromTitle(title) {
  if (!title) return [];
  const matches = [...title.matchAll(/\(([A-Z]{3})\)/g)];
  return matches.map((m) => m[1]).filter(Boolean);
}

function buildTimeRows(event) {
  const BASE_TIME_ZONE = "Europe/Helsinki";

  if (event?.timeWindow?.start || event?.timeWindow?.end) {
    const start = event.timeWindow?.start ?? "";
    const end = event.timeWindow?.end ?? "";
    return [
      {
        label: "Window",
        value: `${start}${start && end ? "–" : ""}${end}`,
        tz: "",
      },
    ];
  }

  const hasDepart = Boolean(event?.time?.local);
  const hasArrive = Boolean(event?.arrivalTime?.local);

  if (hasDepart || hasArrive) {
    const departTz = event?.time?.tz ?? "";
    const arriveTz = event?.arrivalTime?.tz ?? "";
    const crossesZones = Boolean(departTz && arriveTz && departTz !== arriveTz);

    const codes = extractLocationCodesFromTitle(event?.title ?? "");
    const departLoc = codes[0] || event?.station?.depart || "";
    const arriveLoc = codes[1] || event?.station?.arrive || "";

    const showDepartLoc = Boolean(departLoc && departTz && departTz !== BASE_TIME_ZONE);
    const showArriveLoc = Boolean(arriveLoc && arriveTz && arriveTz !== BASE_TIME_ZONE);

    const departValue = event?.time?.local
      ? showDepartLoc || crossesZones
        ? `${event.time.local} ${departLoc}`
        : event.time.local
      : "";

    const arriveValue = event?.arrivalTime?.local
      ? showArriveLoc || crossesZones
        ? `${event.arrivalTime.local} ${arriveLoc}`
        : event.arrivalTime.local
      : "";

    const rows = [];
    if (departValue) rows.push({ label: hasArrive ? "Departs" : "Time", value: departValue, tz: "" });
    if (arriveValue) rows.push({ label: "Arrives", value: arriveValue, tz: "" });
    return rows;
  }

  if (event?.time?.local) {
    const tz = event?.time?.tz ?? "";
    const codes = extractLocationCodesFromTitle(event?.title ?? "");
    const loc = codes[0] || "";
    const showLoc = Boolean(loc && tz && tz !== BASE_TIME_ZONE);
    return [
      {
        label: "Time",
        value: showLoc ? `${event.time.local} ${loc}` : event.time.local,
        tz: "",
      },
    ];
  }

  if (event?.time) {
    return [
      {
        label: "Time",
        value: event.time,
        tz: "",
      },
    ];
  }

  return [];
}

function appendSectionTitle(container, text) {
  const title = document.createElement("p");
  title.className = "event-card__section-title";
  title.textContent = text;
  container.appendChild(title);
}

function appendList(container, items) {
  const list = document.createElement("ul");
  list.className = "event-card__list";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  });
  container.appendChild(list);
}

function appendLinks(container, links) {
  const list = document.createElement("ul");
  list.className = "event-card__links";
  links.forEach((link) => {
    const li = document.createElement("li");
    const anchor = document.createElement("a");
    anchor.href = link.href;
    anchor.target = "_blank";
    anchor.rel = "noreferrer";
    anchor.textContent = link.label;
    li.appendChild(anchor);
    if (link.hint) {
      const hint = document.createElement("span");
      hint.className = "event-card__hint";
      hint.textContent = link.hint;
      li.appendChild(hint);
    }
    list.appendChild(li);
  });
  container.appendChild(list);
}

function isAuroraEvent(event) {
  const title = event?.title?.toLowerCase() ?? "";
  const type = event?.type?.toLowerCase() ?? "";
  return title.includes("aurora") || type.includes("aurora");
}

const flightStatusTemplates = {
  AY: ({ flightNumber, flightDate }) =>
    `https://www.finnair.com/fi-en/flight-status?flightNumber=${encodeURIComponent(
      flightNumber ?? ""
    )}&departureDate=${encodeURIComponent(flightDate ?? "")}`,
};

function buildFlightStatusLink(event) {
  if (!event?.flightNumber) return "";
  const airlineCode = event.airlineCode?.toUpperCase() ?? "";
  const template = flightStatusTemplates[airlineCode];
  if (template) {
    return template(event);
  }
  const query = `${event.flightNumber} flight status ${event.flightDate ?? ""}`.trim();
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function buildTransportStatusLink(event) {
  if (event?.statusLink) return event.statusLink;
  if (event?.flightNumber) return buildFlightStatusLink(event);
  if (event?.transportNumber) {
    const query = `${event.transportNumber} ${event.transportType ?? "transport"} status`.trim();
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  }
  return "";
}

function buildTransportTiming(event) {
  const depart = event?.departTime ?? event?.time ?? "";
  const arrive = event?.arriveTime ?? "";
  if (depart && arrive) return `${depart} → ${arrive}`;
  return depart || arrive;
}

function renderDayCarousel() {
  if (!carouselTrack) return;
  carouselTrack.innerHTML = "";

  days.forEach((day) => {
    const panel = document.createElement("article");
    panel.className = "day-panel";
    panel.dataset.day = day.date;

    const header = document.createElement("header");
    header.className = "day-panel__header";
    header.innerHTML = `
      <div class="day-panel__heading">
        <h3 class="day-panel__title">${day.label ?? day.weekday}</h3>
        ${day.baseLocation ? `<p class="day-panel__subtitle">${day.baseLocation}</p>` : ""}
      </div>
    `;

    const eventList = document.createElement("div");
    eventList.className = "event-list";
    const mergedEvents = day.events ?? [];
    if (!mergedEvents.length) {
      const empty = document.createElement("p");
      empty.className = "meta";
      empty.textContent = "No scheduled events yet.";
      eventList.appendChild(empty);
    } else {
      mergedEvents.forEach((event) => {
        const card = document.createElement("article");
        card.className = "event-card";

        const headerRow = document.createElement("div");
        headerRow.className = "event-card__header";

        const titleWrap = document.createElement("div");
        titleWrap.className = "event-card__heading";

        const titleEl = document.createElement("h4");
        titleEl.className = "event-card__title";
        titleEl.textContent = event.title;
        titleWrap.appendChild(titleEl);

        headerRow.appendChild(titleWrap);

        const timeRows = buildTimeRows(event);
        if (timeRows.length) {
          const timeBlock = document.createElement("div");
          timeBlock.className = "event-card__time";
          timeRows.forEach((row) => {
            const timeRow = document.createElement("div");
            timeRow.className = "event-card__time-row";
            timeRow.innerHTML = `
              <span class="event-card__time-label">${row.label}</span>
              <span class="event-card__time-value">${row.value}</span>
              ${row.tz ? `<span class="event-card__time-zone">${row.tz}</span>` : ""}
            `;
            timeBlock.appendChild(timeRow);
          });
          headerRow.appendChild(timeBlock);
        }

        card.appendChild(headerRow);

        const body = document.createElement("div");
        body.className = "event-card__body";

        if (event.flight) {
          appendSectionTitle(body, "Flight");
          const list = [];
          if (event.flight.airline) list.push(`Airline: ${event.flight.airline}`);
          if (event.flight.flightNumber) list.push(`Flight number: ${event.flight.flightNumber}`);
          if (event.flight.seatNumbers) list.push(`Seat numbers: ${event.flight.seatNumbers}`);
          if (event.flight.bookingRef) list.push(`Booking ref: ${event.flight.bookingRef}`);
          if (list.length) appendList(body, list);
        }

        if (event.seat) {
          appendSectionTitle(body, "Seat");
          const list = [];
          if (event.seat.coach) list.push(`Coach: ${event.seat.coach}`);
          if (event.seat.seats?.length) list.push(`Seats: ${event.seat.seats.join(", ")}`);
          if (list.length) appendList(body, list);
        }

        if (event.station) {
          appendSectionTitle(body, "Station");
          const list = [];
          if (event.station.depart) list.push(`Depart: ${event.station.depart}`);
          if (event.station.arrive) list.push(`Arrive: ${event.station.arrive}`);
          if (list.length) appendList(body, list);
        }

        if (event.booking) {
          appendSectionTitle(body, "Booking");
          const list = [];
          if (event.booking.provider) list.push(`Provider: ${event.booking.provider}`);
          if (event.booking.orderNumber) list.push(`Order number: ${event.booking.orderNumber}`);
          if (list.length) appendList(body, list);
          if (event.booking.ticketLinks?.length) {
            appendSectionTitle(body, "Tickets");
            appendLinks(body, event.booking.ticketLinks);
          }
        }

        if (event.place) {
          appendSectionTitle(body, "Place");
          const list = [];
          if (event.place.name) list.push(`Name: ${event.place.name}`);
          if (event.place.address) list.push(`Address: ${event.place.address}`);
          if (list.length) appendList(body, list);
          if (event.place.phone) {
            appendSectionTitle(body, "Contact");
            appendLinks(body, [event.place.phone]);
          }
          if (event.place.maps?.length) {
            appendSectionTitle(body, "Maps");
            appendLinks(body, event.place.maps);
          }
        }

        if (event.details?.length) {
          appendSectionTitle(body, "Details");
          appendList(body, event.details);
        }

        if (event.notes?.length) {
          appendSectionTitle(body, "Notes");
          appendList(body, event.notes);
        }

        if (event.links?.length) {
          appendSectionTitle(body, "Links");
          appendLinks(body, event.links);
        }

        if (event.airports?.length) {
          appendSectionTitle(body, "Airports");
          const airports = document.createElement("div");
          airports.className = "event-card__airports";
          event.airports.forEach((airport) => {
            const airportCard = document.createElement("div");
            airportCard.className = "event-card__airport";
            airportCard.innerHTML = `<p class="event-card__airport-title">${airport.code} — ${airport.name}</p>`;
            const links = [];
            if (airport.map) links.push(airport.map);
            if (airport.live) links.push(airport.live);
            if (links.length) {
              appendLinks(airportCard, links);
            }
            airports.appendChild(airportCard);
          });
          body.appendChild(airports);
        }

        card.appendChild(body);
        eventList.appendChild(card);
      });
    }

    panel.appendChild(header);
    if (day.daylight?.show) {
      const daylight = document.createElement("section");
      daylight.className = "daylight-card";
      daylight.innerHTML = `
        <p class="daylight-card__title">Daylight</p>
        ${day.daylight.note ? `<p class="daylight-card__note">${day.daylight.note}</p>` : ""}
      `;
      if (day.daylight.sources?.length) {
        const list = document.createElement("ul");
        list.className = "daylight-card__links";
        day.daylight.sources.forEach((source) => {
          const item = document.createElement("li");
          const link = document.createElement("a");
          link.href = source.href;
          link.target = "_blank";
          link.rel = "noreferrer";
          link.textContent = source.label;
          item.appendChild(link);
          list.appendChild(item);
        });
        daylight.appendChild(list);
      }
      panel.appendChild(daylight);
    }
    panel.appendChild(eventList);
    carouselTrack.appendChild(panel);
  });
}

function renderThingys() {
  if (!thingysList || !thingysSummary || !appState.outingGear) return;
  const activeItems = appState.outingGear.items.filter((item) => !item.deleted);
  const total = activeItems.length;
  const danielDone = activeItems.filter((item) => item.checks.daniel).length;
  const jaimeDone = activeItems.filter((item) => item.checks.jaime).length;

  thingysSummary.innerHTML = `
    <span>Daniel ${danielDone}/${total}</span>
    <span>Jaime ${jaimeDone}/${total}</span>
  `;

  const categories = new Map();
  activeItems.forEach((item) => {
    const category = item.category || "Equipment";
    if (!categories.has(category)) {
      categories.set(category, []);
    }
    categories.get(category).push(item);
  });

  thingysList.innerHTML = "";
  const sortedCategories = Array.from(categories.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  sortedCategories.forEach(([category, items]) => {
    const categoryEl = document.createElement("div");
    categoryEl.className = "thingys-category";

    const header = document.createElement("div");
    header.className = "thingys-category__header";
    const headerTitle = document.createElement("h3");
    headerTitle.textContent = category;
    const headerCounts = document.createElement("div");
    headerCounts.className = "thingys-category__counts";
    const categoryDaniel = items.filter((item) => item.checks.daniel).length;
    const categoryJaime = items.filter((item) => item.checks.jaime).length;
    headerCounts.innerHTML = `
      <span>Daniel ${categoryDaniel}/${items.length}</span>
      <span>Jaime ${categoryJaime}/${items.length}</span>
    `;
    header.appendChild(headerTitle);
    header.appendChild(headerCounts);

    categoryEl.appendChild(header);

    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = `thingys-row ${item.checks.daniel || item.checks.jaime ? "is-selected" : ""}`;
      row.innerHTML = `
        <span>${item.label}</span>
        <button class="thingys-toggle ${item.checks.daniel ? "is-active" : ""}" type="button" data-thingy-toggle="daniel" data-thingy-id="${item.id}" aria-pressed="${item.checks.daniel}">
          Daniel
        </button>
        <button class="thingys-toggle ${item.checks.jaime ? "is-active" : ""}" type="button" data-thingy-toggle="jaime" data-thingy-id="${item.id}" aria-pressed="${item.checks.jaime}">
          Jaime
        </button>
        <button class="thingys-remove" type="button" data-thingy-remove="${item.id}" aria-label="Remove ${item.label}">
          ×
        </button>
      `;
      categoryEl.appendChild(row);
    });

    thingysList.appendChild(categoryEl);
  });

  if (thingysCategoryList) {
    const datalist = Array.from(categories.keys());
    thingysCategoryList.innerHTML = datalist.map((category) => `<option value="${category}"></option>`).join("");
  }
}

function renderBookings() {
  if (!bookingsList) return;
  bookingsList.innerHTML = "";

  const sorted = [...bookings].sort((a, b) => {
    const aValue = toDateValue(a.startDate, a.startTime);
    const bValue = toDateValue(b.startDate, b.startTime);
    if (aValue !== bValue) return aValue - bValue;
    return (a.title || "").localeCompare(b.title || "");
  });

  sorted.forEach((booking) => {
    const card = document.createElement("div");
    card.className = "booking-card";
    card.innerHTML = `
      <h3>${booking.title}</h3>
      <p class="meta">${booking.category}</p>
      ${booking.ref ? `<p class="meta">${booking.ref}</p>` : ""}
      ${booking.times ? `<p class="meta">${booking.times}</p>` : ""}
      ${booking.address ? `<p class="meta">${booking.address}</p>` : ""}
      ${booking.contact ? `<p class="meta">${booking.contact}</p>` : ""}
      ${booking.notes ? `<p class="meta">${booking.notes}</p>` : ""}
    `;

    const actions = document.createElement("div");
    actions.className = "booking-actions";

    const startAction = booking.startMap
      ? `<a class="pill" href="${booking.startMap}" target="_blank" rel="noreferrer">Map start</a>`
      : `<button class="pill" type="button" disabled>Map start</button>`;
    const endAction = booking.endMap
      ? `<a class="pill" href="${booking.endMap}" target="_blank" rel="noreferrer">Map end</a>`
      : `<button class="pill" type="button" disabled>Map end</button>`;

    actions.innerHTML = `
      ${startAction}
      ${endAction}
      <button class="pill" type="button" data-copy-booking="${booking.id}">Copy</button>
    `;

    card.appendChild(actions);
    bookingsList.appendChild(card);
  });
}

function setupBookings() {
  if (!bookingsList) return;
  bookingsList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const bookingId = target.dataset.copyBooking;
    if (!bookingId) return;
    openCopySheet(bookingId);
  });
}

function populateDaySelect() {
  if (!addItemDay) return;
  addItemDay.innerHTML = "";
  days.forEach((day) => {
    const option = document.createElement("option");
    option.value = day.date;
    option.textContent = `${day.weekday} \u00B7 ${day.date} \u00B7 ${day.location}`;
    addItemDay.appendChild(option);
  });
  if (days[0]) {
    addItemDay.value = days[0].date;
  }
}

function setupThingys() {
  if (!thingysList || !thingysForm || !thingysInput || !thingysCategoryInput) return;
  renderThingys();

  thingysList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const togglePerson = target.dataset.thingyToggle;
    const removeId = target.dataset.thingyRemove;

    if (togglePerson) {
      const itemId = target.dataset.thingyId;
      const item = appState.outingGear.items.find((entry) => entry.id === itemId);
      if (!item) return;
      item.checks[togglePerson] = !item.checks[togglePerson];
      setState({ outingGear: { ...appState.outingGear } }, { updatedSections: ["gear"] });
      return;
    }

    if (removeId) {
      const item = appState.outingGear.items.find((entry) => entry.id === removeId);
      if (item) item.deleted = true;
      setState({ outingGear: { ...appState.outingGear } }, { updatedSections: ["gear"] });
    }
  });

  thingysForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const label = thingysInput.value.trim();
    const category = thingysCategoryInput.value.trim();
    if (!label || !category) {
      showActionToast("Add an item and category.");
      return;
    }
    appState.outingGear.items.push({
      id: createId("gear"),
      label,
      category,
      checks: { daniel: false, jaime: false },
      deleted: false,
    });
    thingysInput.value = "";
    thingysCategoryInput.value = category;
    setState({ outingGear: { ...appState.outingGear } }, { updatedSections: ["gear"] });
  });
}

function applyUiState() {
  const isBigText = Boolean(appState.ui?.bigText);
  document.documentElement.classList.toggle("big-text", isBigText);
  if (bigTextToggle) {
    bigTextToggle.checked = isBigText;
  }
}

function applyStateToUI(updatedSections = []) {
  if (!updatedSections.length) return;
  if (updatedSections.includes("gear")) {
    renderThingys();
  }
  if (updatedSections.includes("pills")) {
    renderDayCarousel();
    setupDayNav();
  }
  if (updatedSections.includes("userItems")) {
    renderDayCarousel();
    setupDayNav();
  }
  if (updatedSections.includes("copyPhrases")) {
    if (copySheetModal && !copySheetModal.hidden && activeCopyBookingId) {
      const booking = bookingsById.get(activeCopyBookingId);
      if (booking) renderCopySheet(booking);
    }
  }
  if (updatedSections.includes("ui")) {
    applyUiState();
  }
}

function setupUiToggles() {
  if (!bigTextToggle) return;
  bigTextToggle.addEventListener("change", () => {
    const nextValue = bigTextToggle.checked;
    if (appState.ui?.bigText === nextValue) return;
    setState({ ui: { ...appState.ui, bigText: nextValue } }, { updatedSections: ["ui"] });
  });
}

function setupPills() {
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const pillToggle = target.dataset.pillToggle;
    const pillDate = target.dataset.pillDate;
    const pillReset = target.dataset.pillReset;

    if (pillToggle && pillDate) {
      const entry = getPillsEntry(pillDate);
      entry[pillToggle] = !entry[pillToggle];
      appState.pills[pillDate] = entry;
      setState({ pills: { ...appState.pills } }, { updatedSections: ["pills"] });
      return;
    }

    if (pillReset) {
      const today = getDateString("Europe/Helsinki");
      if (pillReset === "today") {
        appState.pills[today] = { daniel: false, jaime: false };
      } else if (pillReset === "all") {
        appState.pills = {};
      }
      setState({ pills: { ...appState.pills } }, { updatedSections: ["pills"] });
    }
  });
}

function maybeSendPillReminder() {
  const today = getDateString("Europe/Helsinki");
  const { hour } = getTimeParts("Europe/Helsinki");
  if (hour < 13) return;
  const entry = getPillsEntry(today);
  if (entry.daniel && entry.jaime) return;
  if (lastPillReminderDate === today) return;
  lastPillReminderDate = today;
  showActionToast("Pills reminder: tick Daniel + Jaime for today.");
}

function setupAddItemForm() {
  if (!addItemForm) return;
  populateDaySelect();

  addItemForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = addItemTitle?.value.trim();
    if (!title) {
      showActionToast("Please enter a title.");
      return;
    }
    const dayValue = addItemDay?.value;
    const timeValue = addItemTime?.value || null;
    const detailValue = addItemDetail?.value.trim() || "";
    const typeValue = addItemType?.value || "";

    const newItem = {
      id: createId("user"),
      day: dayValue,
      time: timeValue,
      title,
      detail: detailValue,
      type: typeValue,
      createdAt: Date.now(),
      deleted: false,
    };

    appState.userItems.push(newItem);
    setState({ userItems: [...appState.userItems] }, { updatedSections: ["userItems"] });
    addItemForm.reset();
    showActionToast("Added to day plan.");
    if (addItemModal && !addItemModal.hidden) {
      closeAddItemModal();
    }
  });
}

function openAddItemModal(dayValue) {
  if (!addItemModal) return;
  addItemModal.hidden = false;
  document.body.classList.add("modal-open");
  if (dayValue && addItemDay) {
    addItemDay.value = dayValue;
  }
  setTimeout(() => addItemTitle?.focus(), 0);
}

function closeAddItemModal() {
  if (!addItemModal) return;
  addItemModal.hidden = true;
  document.body.classList.remove("modal-open");
}

function setupAddItemModal() {
  if (!addItemModal || !addItemClose) return;

  carouselTrack?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const dayValue = target.dataset.addDay;
    if (!dayValue) return;
    openAddItemModal(dayValue);
  });

  addItemClose.addEventListener("click", () => {
    closeAddItemModal();
  });

  addItemModal.addEventListener("click", (event) => {
    if (event.target === addItemModal) {
      closeAddItemModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !addItemModal.hidden) {
      closeAddItemModal();
    }
  });
}

function setupUserItemRemoval() {
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const removeId = target.dataset.userRemove;
    if (!removeId) return;
    const item = appState.userItems.find((entry) => entry.id === removeId);
    if (!item) return;
    item.deleted = true;
    setState({ userItems: [...appState.userItems] }, { updatedSections: ["userItems"] });
  });
}

function openEventDetail(title, detail) {
  if (!eventDetailModal || !eventDetailBody || !eventDetailTitle) return;
  eventDetailTitle.textContent = title;
  eventDetailBody.textContent = detail;
  eventDetailModal.hidden = false;
  document.body.classList.add("modal-open");
}

function closeEventDetail() {
  if (!eventDetailModal) return;
  eventDetailModal.hidden = true;
  document.body.classList.remove("modal-open");
}

function setupEventDetailModal() {
  if (!eventDetailModal || !eventDetailClose) return;
  carouselTrack?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const title = target.dataset.eventTitle;
    const detail = target.dataset.eventDetail;
    if (!title || !detail) return;
    openEventDetail(title, detail);
  });

  eventDetailClose.addEventListener("click", closeEventDetail);
  eventDetailModal.addEventListener("click", (event) => {
    if (event.target === eventDetailModal) {
      closeEventDetail();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && eventDetailModal && !eventDetailModal.hidden) {
      closeEventDetail();
    }
  });
}

async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.top = "-1000px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function resetCopySheetForm() {
  editingCopyPhraseId = null;
  if (copySheetForm) copySheetForm.reset();
  if (copySheetSubmit) copySheetSubmit.textContent = "Add phrase";
  if (copySheetCancel) copySheetCancel.hidden = true;
}

function buildBookingPhrases(booking) {
  const phrases = [];
  if (booking.title) phrases.push({ label: "Booking", text: booking.title });
  if (booking.ref) phrases.push({ label: "Reference", text: booking.ref });
  if (booking.times) phrases.push({ label: "Times", text: booking.times });
  if (booking.address) phrases.push({ label: "Address", text: booking.address });
  if (booking.contact) phrases.push({ label: "Contact", text: booking.contact });
  if (booking.startLabel) phrases.push({ label: "Start", text: booking.startLabel });
  if (booking.endLabel) phrases.push({ label: "End", text: booking.endLabel });
  if (booking.notes) phrases.push({ label: "Notes", text: booking.notes });
  return phrases;
}

function renderCopySheet(booking) {
  if (!copySheetList) return;
  copySheetList.innerHTML = "";
  if (copySheetSubtitle) {
    copySheetSubtitle.textContent = booking?.times ?? "";
  }

  const basePhrases = buildBookingPhrases(booking);
  const customItems = (appState.copyPhrases?.items ?? []).filter(
    (item) => !item.deleted && (!item.bookingId || item.bookingId === booking.id)
  );

  const allPhrases = [
    ...basePhrases.map((item) => ({ ...item, source: "booking" })),
    ...customItems.map((item) => ({
      id: item.id,
      label: item.label,
      text: item.text,
      source: "custom",
    })),
  ];

  if (!allPhrases.length) {
    const empty = document.createElement("p");
    empty.className = "meta";
    empty.textContent = "No copy phrases yet.";
    copySheetList.appendChild(empty);
    return;
  }

  allPhrases.forEach((phrase) => {
    const itemEl = document.createElement("div");
    itemEl.className = "copy-sheet__item";

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.dataset.copyText = phrase.text;
    copyButton.textContent = phrase.text;

    const meta = document.createElement("div");
    meta.className = "copy-sheet__meta";
    meta.textContent = phrase.label;

    itemEl.appendChild(copyButton);
    itemEl.appendChild(meta);

    if (phrase.source === "custom") {
      const actions = document.createElement("div");
      actions.className = "copy-sheet__actions";
      actions.innerHTML = `
        <button class="pill" type="button" data-copy-edit="${phrase.id}">Edit</button>
        <button class="pill" type="button" data-copy-remove="${phrase.id}">Remove</button>
      `;
      itemEl.appendChild(actions);
    } else {
      const actions = document.createElement("div");
      actions.className = "copy-sheet__actions";
      const editButton = document.createElement("button");
      editButton.className = "pill";
      editButton.type = "button";
      editButton.dataset.prefillLabel = phrase.label;
      editButton.dataset.prefillText = phrase.text;
      editButton.textContent = "Edit";
      actions.appendChild(editButton);
      itemEl.appendChild(actions);
    }

    copySheetList.appendChild(itemEl);
  });
}

function openCopySheet(bookingId) {
  const booking = bookingsById.get(bookingId);
  if (!copySheetModal || !booking) return;
  activeCopyBookingId = bookingId;
  resetCopySheetForm();
  if (copySheetTitle) {
    copySheetTitle.textContent = `Copy details — ${booking.title}`;
  }
  renderCopySheet(booking);
  copySheetModal.hidden = false;
  document.body.classList.add("modal-open");
}

function closeCopySheet() {
  if (!copySheetModal) return;
  copySheetModal.hidden = true;
  document.body.classList.remove("modal-open");
  activeCopyBookingId = null;
  resetCopySheetForm();
}

function setupCopySheet() {
  if (!copySheetModal || !copySheetForm || !copySheetList) return;

  copySheetForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const label = copySheetLabel?.value.trim() ?? "";
    const textValue = copySheetText?.value.trim() ?? "";
    if (!label || !textValue || !activeCopyBookingId) {
      showActionToast("Add a label and phrase.");
      return;
    }
    const items = appState.copyPhrases?.items ?? [];
    if (editingCopyPhraseId) {
      const phrase = items.find((item) => item.id === editingCopyPhraseId);
      if (!phrase) return;
      phrase.label = label;
      phrase.text = textValue;
      phrase.updatedAt = Date.now();
      setState({ copyPhrases: { items: [...items] } }, { updatedSections: ["copyPhrases"] });
      resetCopySheetForm();
      showActionToast("Phrase updated.");
      return;
    }

    items.push({
      id: createId("phrase"),
      label,
      text: textValue,
      bookingId: activeCopyBookingId,
      source: "user",
      updatedAt: Date.now(),
      deleted: false,
    });
    setState({ copyPhrases: { items: [...items] } }, { updatedSections: ["copyPhrases"] });
    resetCopySheetForm();
    showActionToast("Phrase added.");
  });

  if (copySheetCancel) {
    copySheetCancel.addEventListener("click", () => resetCopySheetForm());
  }

  copySheetList.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const copyText = target.dataset.copyText;
    const editId = target.dataset.copyEdit;
    const removeId = target.dataset.copyRemove;
    const prefillLabel = target.dataset.prefillLabel;
    const prefillText = target.dataset.prefillText;
    const items = appState.copyPhrases?.items ?? [];

    if (copyText) {
      try {
        await copyToClipboard(copyText);
        const toastText = copyText.length > 50 ? `${copyText.slice(0, 47)}…` : copyText;
        showActionToast(`${toastText} copied`);
      } catch (error) {
        showActionToast("Copy failed.");
      }
      return;
    }

    if (editId) {
      const phrase = items.find((item) => item.id === editId);
      if (!phrase) return;
      editingCopyPhraseId = editId;
      if (copySheetLabel) copySheetLabel.value = phrase.label;
      if (copySheetText) copySheetText.value = phrase.text;
      if (copySheetSubmit) copySheetSubmit.textContent = "Save changes";
      if (copySheetCancel) copySheetCancel.hidden = false;
      return;
    }

    if (prefillLabel && prefillText) {
      if (copySheetLabel) copySheetLabel.value = prefillLabel;
      if (copySheetText) copySheetText.value = prefillText;
      if (copySheetSubmit) copySheetSubmit.textContent = "Add phrase";
      if (copySheetCancel) copySheetCancel.hidden = true;
      editingCopyPhraseId = null;
      return;
    }

    if (removeId) {
      const phrase = items.find((item) => item.id === removeId);
      if (!phrase) return;
      phrase.deleted = true;
      phrase.updatedAt = Date.now();
      setState({ copyPhrases: { items: [...items] } }, { updatedSections: ["copyPhrases"] });
      if (editingCopyPhraseId === removeId) resetCopySheetForm();
      showActionToast("Phrase removed.");
    }
  });

  copySheetClose?.addEventListener("click", closeCopySheet);
  copySheetModal.addEventListener("click", (event) => {
    if (event.target === copySheetModal) {
      closeCopySheet();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !copySheetModal.hidden) {
      closeCopySheet();
    }
  });
}
function showActionToast(message, { timeout = 3000 } = {}) {
  if (!actionToast) return;
  actionToast.textContent = message;
  actionToast.hidden = false;
  if (timeout) {
    setTimeout(() => {
      actionToast.hidden = true;
    }, timeout);
  }
}

function buildChecklistExport(saved) {
  return checklist.map((section, sectionIndex) => ({
    category: section.category,
    items: section.items.map((item, itemIndex) => ({
      label: item.label,
      checked: saved?.[sectionIndex]?.[itemIndex] ?? item.checked,
    })),
  }));
}

function setActiveTab(tabId, { scroll = true } = {}) {
  if (!tabButtons.length || !tabSections.length) return;
  const availableTabs = tabSections.map((section) => section.dataset.tabSection).filter(Boolean);
  const resolvedTab = availableTabs.includes(tabId) ? tabId : availableTabs.includes("home") ? "home" : availableTabs[0];
  if (!resolvedTab) return;

  tabSections.forEach((section) => {
    section.hidden = section.dataset.tabSection !== resolvedTab;
  });

  tabButtons.forEach((button) => {
    const isActive = button.dataset.tab === resolvedTab;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-current", isActive ? "page" : "false");
  });

  document.body.dataset.activeTab = resolvedTab;
  safeWriteStorage(activeTabKey, resolvedTab);

  if (scroll) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function setupBottomNav() {
  if (!tabButtons.length || !tabSections.length) return;
  const storedTab = safeReadStorage(activeTabKey);
  const availableTabs = tabSections.map((section) => section.dataset.tabSection).filter(Boolean);
  const initialTab = storedTab && availableTabs.includes(storedTab) ? storedTab : "home";
  setActiveTab(initialTab, { scroll: false });

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setActiveTab(button.dataset.tab);
      if (window.location.hash) {
        const cleanUrl = `${window.location.pathname}${window.location.search}`;
        history.replaceState(null, "", cleanUrl);
      }
    });
  });
}

function updateStickyOffset() {
  const hud = document.getElementById("trip-hud");
  if (!hud) return;
  const offset = hud.offsetHeight + 8;
  document.documentElement.style.setProperty("--sticky-offset", `${offset}px`);
}

function setupDayNav() {
  if (dayObserver) {
    dayObserver.disconnect();
  }
  if (!carousel || !carouselTrack) return;

  const dayLinks = Array.from(document.querySelectorAll(".day-chip"));
  const dayPanels = Array.from(carouselTrack.querySelectorAll(".day-panel"));
  const linkMap = new Map(dayLinks.map((link) => [link.dataset.day, link]));

  const setActive = (date) => {
    dayLinks.forEach((link) => link.classList.remove("is-active"));
    dayPanels.forEach((panel) => panel.classList.remove("is-active"));
    const active = linkMap.get(date);
    if (active) active.classList.add("is-active");
    const panel = dayPanels.find((item) => item.dataset.day === date);
    if (panel) panel.classList.add("is-active");
  };

  dayLinks.forEach((link) => {
    link.onclick = () => {
      const day = link.dataset.day;
      setActiveTab("home", { scroll: false });
      if (day) setActive(day);
    };
  });

  const today = getDateString("Europe/Helsinki");
  const initial = dayPanels.find((panel) => panel.dataset.day === today) ?? dayPanels[0];
  if (initial) {
    setActive(initial.dataset.day);
  }
}

function init() {
  safeWriteStorage(LAST_UPDATED_KEY, String(Date.now()));
  appState = {
    outingGear: loadOutingGear(),
    pills: loadPillsState(),
    userItems: loadUserItems(),
    copyPhrases: loadCopyPhrases(),
    checklist: loadChecklistState(),
    ui: loadUiState(),
    updatedAt: loadUpdatedAt(),
  };
  applyUiState();
  renderTimeline();
  renderDayCarousel();
  renderBookings();
  renderThingys();
  setupPills();
  setupThingys();
  setupAddItemForm();
  setupAddItemModal();
  setupUserItemRemoval();
  setupEventDetailModal();
  setupCopySheet();
  setupBookings();
  setupBottomNav();
  setupUiToggles();
  setupDayNav();
  updateStickyOffset();
  window.AuroraState.ready = true;
  window.dispatchEvent(new CustomEvent("aurora-state-ready"));
  window.addEventListener("resize", updateStickyOffset);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
