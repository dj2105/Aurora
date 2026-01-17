import { bookings, checklist, days, maps } from "./assets/data/trip-data.js";

const storageKey = "aurora-checklist";
const outingGearKey = "aurora-outing-gear-v1";
const pillsKey = "aurora-pills-v1";
const userItemsKey = "aurora-user-items-v1";
const copyPhrasesKey = "aurora-copy-phrases-v1";
const uiKey = "aurora-ui-v1";
const LAST_UPDATED_KEY = "aurora-last-updated";
const syncMetaKey = "aurora-sync-meta-v1";
let displayZone = "transport";
let dayObserver;
let lastPillReminderDate = null;
let copyPhraseFilter = { search: "", category: "all" };
let editingCopyPhraseId = null;
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
const daysEl = document.getElementById("days-list");
const alertsEl = document.getElementById("alerts");
const bookingsGrid = document.getElementById("bookings-grid");
const mapsGrid = document.getElementById("maps-grid");
const checklistSections = document.getElementById("checklist-sections");
const searchInput = document.getElementById("search");

const nowLocationEl = document.getElementById("current-location");
const nowTimeEl = document.getElementById("current-time");
const nextTitleEl = document.getElementById("next-title");
const nextMetaEl = document.getElementById("next-meta");
const shareButton = document.getElementById("share-trip");
const printButton = document.getElementById("print-trip");
const exportChecklistButton = document.getElementById("export-checklist");
const importChecklistButton = document.getElementById("import-checklist");
const importChecklistInput = document.getElementById("import-checklist-input");
const backToTopButton = document.getElementById("back-to-top");
const actionToast = document.getElementById("action-toast");
const outingGearBody = document.getElementById("outing-gear-body");
const outingGearForm = document.getElementById("outing-gear-add");
const outingGearInput = document.getElementById("outing-gear-input");
const outingGearCountDaniel = document.getElementById("outing-gear-count-daniel");
const outingGearCountJaime = document.getElementById("outing-gear-count-jaime");
const addItemForm = document.getElementById("user-item-form");
const addItemDay = document.getElementById("user-item-day");
const addItemTime = document.getElementById("user-item-time");
const addItemTitle = document.getElementById("user-item-title");
const addItemDetail = document.getElementById("user-item-detail");
const addItemType = document.getElementById("user-item-type");
const notesInboxList = document.getElementById("notes-inbox-list");
const keyInfoContent = document.getElementById("key-info-content");
const pillsTodayDate = document.getElementById("pills-today-date");
const pillsTodayStatus = document.getElementById("pills-today-status");
const timeDisplaySelect = document.getElementById("time-display");
const bigTextToggle = document.getElementById("big-text-toggle");
const copyPhrasesBody = document.getElementById("copy-phrases-body");
const copyPhrasesForm = document.getElementById("copy-phrases-form");
const copyPhrasesCategory = document.getElementById("copy-phrases-category");
const copyPhrasesLabel = document.getElementById("copy-phrases-label");
const copyPhrasesText = document.getElementById("copy-phrases-text");
const copyPhrasesUrl = document.getElementById("copy-phrases-url");
const copyPhrasesSubmit = document.getElementById("copy-phrases-submit");
const copyPhrasesCancel = document.getElementById("copy-phrases-cancel");
const copyPhrasesSearch = document.getElementById("copy-phrases-search");
const copyPhrasesFilter = document.getElementById("copy-phrases-filter");
const tabButtons = Array.from(document.querySelectorAll(".bottom-nav__button"));
const tabSections = Array.from(document.querySelectorAll("[data-tab-section]"));

const activeTabKey = "aurora-active-tab";

const defaultOutingGear = [
  "Gloves",
  "Hat",
  "Neck gaiter",
  "Hand warmers",
  "Torch",
  "Phone",
  "Power bank",
  "Earphones",
  "Sunglasses",
  "Snacks / lunch",
  "Water",
  "Cash",
  "Passport(s)",
  "Lip balm",
  "Vape",
  "Tobacco",
  "Keys",
];

const keyInfo = {
  stay: {
    title: "Riverside Restplace",
    checkIn: "Check-in window: Tue 20 Jan · 15:00\u201322:00",
    checkOut: "Check-out window: Sat 24 Jan · by 11:00",
    lockbox: "Keys in lockbox (see host message).",
    phone: "+358 40 670 2904",
    payment: "Cash-only payment on arrival.",
  },
  trains: [
    {
      title: "Tue 20 Jan",
      route: "RVN \u2192 Kemi \u2192 Tornio-It\u00e4inen",
      times: "05:15 RVN \u00b7 07:38 Kemi \u00b7 08:21 Tornio-It\u00e4inen",
      seat: "Coach 2 \u00b7 Seats 23A / 23B",
    },
    {
      title: "Sat 24 Jan",
      route: "Kemi \u2192 Rovaniemi",
      times: "10:11 Kemi \u00b7 12:52 Rovaniemi",
      seat: "Coach 3 \u00b7 Seats 12A / 12B",
    },
  ],
};

const defaultCopyPhrases = [
  {
    id: "phrase-accommodation",
    category: "places",
    label: "Accommodation address",
    text: "1409 Jokivarrentie, 95520 Tornio, Finland",
    url: "https://www.google.com/maps/search/?api=1&query=1409+Jokivarrentie+Tornio+Finland",
    source: "seed",
    updatedAt: 0,
    deleted: false,
  },
  {
    id: "phrase-kcitymarket",
    category: "shops",
    label: "K-Citymarket Tornio",
    text: "K-Citymarket Tornio",
    url: "https://www.google.com/maps/search/?api=1&query=K-Citymarket+Tornio",
    source: "seed",
    updatedAt: 0,
    deleted: false,
  },
  {
    id: "phrase-train-outbound",
    category: "transport",
    label: "Train: RVN → Kemi → Tornio-Itäinen",
    text: "05:15 RVN · 07:38 Kemi · 08:21 Tornio-Itäinen (Coach 2, Seats 23A/23B)",
    source: "seed",
    updatedAt: 0,
    deleted: false,
  },
  {
    id: "phrase-train-return",
    category: "transport",
    label: "Train: Kemi → Rovaniemi",
    text: "10:11 Kemi · 12:52 Rovaniemi (Coach 3, Seats 12A/12B)",
    source: "seed",
    updatedAt: 0,
    deleted: false,
  },
  {
    id: "phrase-emergency-112",
    category: "essentials",
    label: "Emergency 112",
    text: "Dial 112 for urgent assistance in Finland.",
    source: "seed",
    updatedAt: 0,
    deleted: false,
  },
];

const copyPhraseCategoryLabels = {
  places: "Places",
  transport: "Transport",
  shops: "Shops",
  essentials: "Essentials",
  custom: "Custom",
};

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
    items: defaultOutingGear.map((label) => ({
      id: createId("gear"),
      label,
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
        return {
          id: item?.id ?? createId("gear"),
          label: item.label,
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

function formatEventTime(event) {
  if (!event?.time) return "";
  if (displayZone === "ireland") {
    return event.home_time ? `${event.home_time} Ireland` : "\u2014";
  }
  if (displayZone === "both") {
    return `${event.time} Finland${event.home_time ? `\n${event.home_time} Ireland` : ""}`;
  }
  if (displayZone === "transport") {
    if (event.type === "transport") {
      return `${event.time} Finland${event.home_time ? `\n${event.home_time} Ireland` : ""}`;
    }
    return `${event.time} Finland`;
  }
  return `${event.time} Finland`;
}

function renderTimeline() {
  if (!timelineEl) return;
  timelineEl.innerHTML = "";
  const today = getDateString("Europe/Helsinki");

  days.forEach((day) => {
    const link = document.createElement("a");
    link.href = `#day-${day.date}`;
    link.className = "day-chip";
    link.dataset.day = day.date;
    link.textContent = `${day.weekday.slice(0, 3)} ${day.date.slice(5)}`;
    if (day.date === today) {
      link.classList.add("is-today");
    }
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
    .filter((event) => event.time)
    .sort((a, b) => {
      const aMinutes = parseTimeToMinutes(a.time);
      const bMinutes = parseTimeToMinutes(b.time);
      if (aMinutes === null && bMinutes === null) return a.order - b.order;
      if (aMinutes === null) return 1;
      if (bMinutes === null) return -1;
      return aMinutes - bMinutes;
    });
  const unscheduled = combined
    .filter((event) => !event.time)
    .sort((a, b) => a.order - b.order);
  return [...scheduled, ...unscheduled];
}

function renderOutingGear() {
  if (!outingGearBody) return;
  if (!appState.outingGear) return;
  outingGearBody.innerHTML = "";

  appState.outingGear.items.forEach((item, index) => {
    if (item.deleted) return;
    const row = document.createElement("div");
    row.className = "outing-gear__row";
    row.dataset.index = String(index);
    row.innerHTML = `
      <div class="outing-gear__item">
        <span>${item.label}</span>
        <button class="outing-gear__remove" type="button" data-gear-remove="${index}" aria-label="Remove ${item.label}">
          &times;
        </button>
      </div>
      <button class="gear-toggle ${item.checks.daniel ? "is-active" : ""}" type="button" data-gear-toggle="daniel" data-index="${index}" aria-pressed="${item.checks.daniel}">
        Daniel
      </button>
      <button class="gear-toggle ${item.checks.jaime ? "is-active" : ""}" type="button" data-gear-toggle="jaime" data-index="${index}" aria-pressed="${item.checks.jaime}">
        Jaime
      </button>
    `;
    outingGearBody.appendChild(row);
  });

  updateOutingGearCounts();
}

function updateOutingGearCounts() {
  if (!outingGearCountDaniel || !outingGearCountJaime || !appState.outingGear) return;
  const activeItems = appState.outingGear.items.filter((item) => !item.deleted);
  const total = activeItems.length;
  const danielDone = activeItems.filter((item) => item.checks.daniel).length;
  const jaimeDone = activeItems.filter((item) => item.checks.jaime).length;
  outingGearCountDaniel.textContent = `Daniel ${danielDone}/${total}`;
  outingGearCountJaime.textContent = `Jaime ${jaimeDone}/${total}`;
}

function renderKeyInfo() {
  if (!keyInfoContent) return;
  keyInfoContent.innerHTML = `
    <div class="key-info__section">
      <h4>${keyInfo.stay.title}</h4>
      <ul class="key-info__list">
        <li><strong>${keyInfo.stay.checkIn}</strong></li>
        <li><strong>${keyInfo.stay.checkOut}</strong></li>
        <li>${keyInfo.stay.lockbox}</li>
        <li><a href="tel:${keyInfo.stay.phone.replace(/\s+/g, "")}">${keyInfo.stay.phone}</a></li>
        <li>${keyInfo.stay.payment}</li>
      </ul>
    </div>
    <div class="key-info__section">
      <h4>Train quick refs</h4>
      <ul class="key-info__list">
        ${keyInfo.trains
          .map(
            (train) => `
            <li>
              <strong>${train.title}</strong><br />
              ${train.route}<br />
              ${train.times}<br />
              ${train.seat}
            </li>
          `
          )
          .join("")}
      </ul>
    </div>
  `;
}

function renderPillsIndicator() {
  if (!pillsTodayStatus || !pillsTodayDate) return;
  const today = getDateString("Europe/Helsinki");
  const todayDay = days.find((day) => day.date === today);
  const entry = getPillsEntry(today);
  pillsTodayDate.textContent = todayDay ? `${todayDay.weekday} \u00b7 ${todayDay.date}` : today;
  pillsTodayStatus.innerHTML = `
    <span class="pill-indicator ${entry.daniel ? "is-done" : ""}">Daniel ${entry.daniel ? "\u2713" : "\u25a2"}</span>
    <span class="pill-indicator ${entry.jaime ? "is-done" : ""}">Jaime ${entry.jaime ? "\u2713" : "\u25a2"}</span>
  `;
}

function renderNotesInbox() {
  if (!notesInboxList) return;
  notesInboxList.innerHTML = "";
  const notes = appState.userItems.filter((item) => !item.deleted && !item.day);
  if (!notes.length) {
    const empty = document.createElement("p");
    empty.className = "notes-inbox__empty";
    empty.textContent = "No notes yet.";
    notesInboxList.appendChild(empty);
    return;
  }
  notes.forEach((note) => {
    const card = document.createElement("div");
    card.className = "notes-card searchable";
    card.dataset.search = `${note.title} ${note.detail}`.toLowerCase();
    card.innerHTML = `
      <div class="notes-card__header">
        <h4>${note.title}</h4>
        <button type="button" data-user-remove="${note.id}">Remove</button>
      </div>
      ${note.detail ? `<p>${note.detail}</p>` : ""}
    `;
    notesInboxList.appendChild(card);
  });
}

function renderDays() {
  if (!daysEl) return;
  daysEl.innerHTML = "";

  days.forEach((day) => {
    const section = document.createElement("article");
    section.className = "day-card";
    section.id = `day-${day.date}`;

    const header = document.createElement("div");
    header.className = "day-header";
    header.innerHTML = `
      <h3>${day.weekday} \u00B7 ${day.date} \u00B7 ${day.location}</h3>
      ${day.notes ? `<p class="day-meta">${day.notes}</p>` : ""}
    `;

    const pillsRow = document.createElement("div");
    pillsRow.className = "day-pills";
    const pillsEntry = getPillsEntry(day.date);
    pillsRow.innerHTML = `
      <span class="day-pills__label">Daily pill</span>
      <button class="pill-toggle ${pillsEntry.daniel ? "is-active" : ""}" type="button" data-pill-toggle="daniel" data-pill-date="${day.date}" aria-pressed="${pillsEntry.daniel}">
        Daniel
      </button>
      <button class="pill-toggle ${pillsEntry.jaime ? "is-active" : ""}" type="button" data-pill-toggle="jaime" data-pill-date="${day.date}" aria-pressed="${pillsEntry.jaime}">
        Jaime
      </button>
    `;

    const jumpNav = document.createElement("nav");
    jumpNav.className = "day-jump";
    jumpNav.setAttribute("aria-label", `Jump to ${day.weekday} sections`);

    const scheduleSection = document.createElement("div");
    scheduleSection.className = "day-section";
    scheduleSection.id = `day-${day.date}-schedule`;
    scheduleSection.dataset.toc = "Schedule";
    scheduleSection.innerHTML = `
      <h4>Schedule</h4>
      <div class="event-list"></div>
    `;

    const eventList = scheduleSection.querySelector(".event-list");
    const mergedEvents = getMergedEvents(day);
    if (!mergedEvents.length) {
      eventList.innerHTML = `<p class="note">No scheduled events yet.</p>`;
    } else {
      mergedEvents.forEach((event) => {
        const eventEl = document.createElement("div");
        const isScheduled = Boolean(event.time);
        eventEl.className = `event searchable${isScheduled ? "" : " event--unscheduled"}`;
        const detailText = event.detail ?? "";
        eventEl.dataset.search = `${event.title} ${detailText} ${day.location}`.toLowerCase();
        if (event.source === "user") {
          eventEl.dataset.userId = event.id;
        }

        const timeText = isScheduled ? formatEventTime(event) : "";
        const timeLines = timeText ? timeText.split("\n") : [];
        const timeHtml = timeLines
          .map((line, index) => (index === 0 ? line : `<span>${line}</span>`))
          .join("");

        const links = (event.links ?? [])
          .map(
            (link) =>
              `<a href="${link.url}" target="_blank" rel="noreferrer">${link.label}</a>`
          )
          .join("");

        const actions = (event.actions ?? [])
          .map((action) => `<a href="${action.url}">${action.label}</a>`)
          .join("");

        const removeButton = event.source === "user"
          ? `<button class="event-remove" type="button" data-user-remove="${event.id}">Remove</button>`
          : "";

        eventEl.innerHTML = `
          ${isScheduled ? `<div class="event-time">${timeHtml}</div>` : ""}
          <div>
            ${isScheduled ? "" : `<p class="event-when">Any time</p>`}
            <p class="event-title">${event.title}</p>
            ${detailText ? `<p class="event-detail">${detailText}</p>` : ""}
            <div class="event-actions">${links}${actions}${removeButton}</div>
          </div>
        `;
        eventList.appendChild(eventEl);
      });
    }

    const auroraSection = document.createElement("div");
    auroraSection.className = "day-section";
    auroraSection.id = `day-${day.date}-aurora`;
    auroraSection.dataset.toc = "Aurora";
    auroraSection.innerHTML = `
      <h4>Aurora + Weather</h4>
      <div class="live-dashboard" data-day="${day.date}"></div>
    `;

    section.appendChild(header);
    section.appendChild(pillsRow);
    section.appendChild(jumpNav);
    section.appendChild(scheduleSection);
    section.appendChild(auroraSection);

    daysEl.appendChild(section);

    buildDayJumpNav(section);
  });
}

function buildDayJumpNav(section) {
  const nav = section.querySelector(".day-jump");
  if (!nav) return;
  nav.innerHTML = "";
  const targets = Array.from(section.querySelectorAll("[data-toc][id]")).map((target) => ({
    id: target.id,
    label: target.dataset.toc,
  }));

  const globalTargets = [
    { id: "checklist", label: "Checklist" },
    { id: "copy-phrases", label: "Copy phrases" },
  ].filter((item) => document.getElementById(item.id));

  const allTargets = [...targets, ...globalTargets];
  if (allTargets.length < 2) {
    nav.hidden = true;
    return;
  }
  nav.hidden = false;

  allTargets.forEach((item) => {
    const link = document.createElement("a");
    link.href = `#${item.id}`;
    link.textContent = item.label;
    nav.appendChild(link);
  });
}

function updateNowNext() {
  if (!nowLocationEl || !nextTitleEl || !nextMetaEl) return;
  const { hour, minute } = getTimeParts("Europe/Helsinki");
  const timeText = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  if (nowTimeEl) {
    nowTimeEl.textContent = timeText;
  }
  const today = getDateString("Europe/Helsinki");
  const todayDay = days.find((day) => day.date === today) ?? days[0];
  nowLocationEl.textContent = todayDay?.location ?? "";

  const nowMinutes = hour * 60 + minute;
  let nextEvent = null;
  let nextDay = todayDay;

  for (const day of days) {
    if (day.date < today) continue;
    const events = getMergedEvents(day)
      .filter((event) => event.time)
      .map((event) => ({
        ...event,
        minutes: parseTimeToMinutes(event.time) ?? 0,
      }))
      .sort((a, b) => a.minutes - b.minutes);

    for (const event of events) {
      if (day.date === today && event.minutes < nowMinutes) continue;
      nextEvent = event;
      nextDay = day;
      break;
    }
    if (nextEvent) break;
  }

  if (nextEvent) {
    nextTitleEl.textContent = nextEvent.title;
    nextMetaEl.textContent = `${nextDay.weekday} \u00B7 ${nextEvent.time} \u00B7 ${nextDay.location}`;
  } else {
    nextTitleEl.textContent = "No more events today";
    nextMetaEl.textContent = "";
  }

  renderPillsIndicator();
  maybeSendPillReminder();
}

function renderBookings() {
  if (!bookingsGrid) return;
  bookingsGrid.innerHTML = "";
  bookings.forEach((booking) => {
    const card = document.createElement("div");
    card.className = "card searchable";
    card.dataset.search = `${booking.title} ${booking.ref} ${booking.address ?? ""}`.toLowerCase();
    card.innerHTML = `
      <h3>${booking.title}</h3>
      <p class="meta">${booking.category}</p>
      ${booking.ref ? `<p class="meta">${booking.ref}</p>` : ""}
      ${booking.times ? `<p class="meta">${booking.times}</p>` : ""}
      ${booking.address ? `<p class="meta">${booking.address}</p>` : ""}
      ${booking.contact ? `<p class="meta">${booking.contact}</p>` : ""}
      ${booking.notes ? `<p class="meta">${booking.notes}</p>` : ""}
    `;
    bookingsGrid.appendChild(card);
  });
}

function renderMaps() {
  if (!mapsGrid) return;
  mapsGrid.innerHTML = "";
  maps.forEach((map) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(map.query)}`;
    const card = document.createElement("a");
    card.className = "card searchable";
    card.dataset.search = `${map.label} ${map.query}`.toLowerCase();
    card.href = url;
    card.target = "_blank";
    card.rel = "noreferrer";
    card.innerHTML = `
      <h3>${map.label}</h3>
      <p class="meta">${map.query}</p>
      <span>Open in Maps</span>
    `;
    mapsGrid.appendChild(card);
  });
}

function getCopyPhraseMatches(item) {
  const search = copyPhraseFilter.search.trim().toLowerCase();
  const category = copyPhraseFilter.category;
  const matchesCategory = category === "all" || item.category === category;
  if (!matchesCategory) return false;
  if (!search) return true;
  const haystack = `${item.label} ${item.text} ${item.category}`.toLowerCase();
  return haystack.includes(search);
}

function renderCopyPhrases() {
  if (!copyPhrasesBody) return;
  const items = (appState.copyPhrases?.items ?? [])
    .filter((item) => !item.deleted)
    .filter(getCopyPhraseMatches);

  copyPhrasesBody.innerHTML = "";

  if (!items.length) {
    const emptyRow = document.createElement("div");
    emptyRow.className = "copy-phrases__row copy-phrases__row--empty";
    emptyRow.textContent = "No phrases match this filter.";
    copyPhrasesBody.appendChild(emptyRow);
    return;
  }

  items.forEach((item) => {
    const categoryLabel = copyPhraseCategoryLabels[item.category] ?? "Custom";
    const row = document.createElement("div");
    row.className = "copy-phrases__row";
    row.dataset.phraseId = item.id;
    const labelWrap = document.createElement("div");
    const label = document.createElement("p");
    label.className = "copy-phrases__label";
    label.textContent = item.label;
    const category = document.createElement("p");
    category.className = "copy-phrases__category";
    category.textContent = categoryLabel;
    labelWrap.appendChild(label);
    labelWrap.appendChild(category);

    const textWrap = document.createElement("div");
    const text = document.createElement("p");
    text.className = "copy-phrases__text";
    text.textContent = item.text;
    textWrap.appendChild(text);

    const actions = document.createElement("div");
    actions.className = "copy-phrases__actions";
    const copyButton = document.createElement("button");
    copyButton.className = "pill pill--small";
    copyButton.type = "button";
    copyButton.dataset.copyPhrase = item.id;
    copyButton.textContent = "Copy";
    actions.appendChild(copyButton);

    if (item.url) {
      const openLink = document.createElement("a");
      openLink.className = "pill pill--small";
      openLink.href = item.url;
      openLink.target = "_blank";
      openLink.rel = "noreferrer";
      openLink.textContent = "Open";
      actions.appendChild(openLink);
    }

    if (item.source === "user") {
      const editButton = document.createElement("button");
      editButton.className = "pill pill--small";
      editButton.type = "button";
      editButton.dataset.editPhrase = item.id;
      editButton.textContent = "Edit";
      actions.appendChild(editButton);

      const deleteButton = document.createElement("button");
      deleteButton.className = "pill pill--small";
      deleteButton.type = "button";
      deleteButton.dataset.deletePhrase = item.id;
      deleteButton.textContent = "Delete";
      actions.appendChild(deleteButton);
    }

    row.appendChild(labelWrap);
    row.appendChild(textWrap);
    row.appendChild(actions);
    copyPhrasesBody.appendChild(row);
  });
}

function renderChecklist() {
  if (!checklistSections) return;
  const saved = appState.checklist ?? {};
  checklistSections.innerHTML = "";

  checklist.forEach((section, sectionIndex) => {
    const sectionEl = document.createElement("div");
    sectionEl.className = "checklist-section";
    const header = document.createElement("div");
    header.className = "checklist-header";
    const title = document.createElement("h3");
    title.textContent = section.category;
    const progress = document.createElement("span");
    progress.className = "checklist-progress";
    header.appendChild(title);
    header.appendChild(progress);
    sectionEl.appendChild(header);

    const updateProgress = () => {
      const total = section.items.length;
      const currentSaved = appState.checklist ?? {};
      const done = section.items.reduce((count, item, itemIndex) => {
        const checked = currentSaved?.[sectionIndex]?.[itemIndex] ?? item.checked;
        return count + (checked ? 1 : 0);
      }, 0);
      progress.textContent = `${done}/${total} done`;
    };

    section.items.forEach((item, itemIndex) => {
      const id = `check-${sectionIndex}-${itemIndex}`;
      const wrapper = document.createElement("label");
      wrapper.className = "checklist-item";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = id;
      checkbox.checked = saved?.[sectionIndex]?.[itemIndex] ?? item.checked;

      checkbox.addEventListener("change", () => {
        const nextSaved = { ...saved };
        if (!nextSaved[sectionIndex]) nextSaved[sectionIndex] = {};
        nextSaved[sectionIndex][itemIndex] = checkbox.checked;
        setState({ checklist: nextSaved }, { updatedSections: ["checklist"] });
      });

      const text = document.createElement("span");
      text.textContent = item.label;
      wrapper.appendChild(checkbox);
      wrapper.appendChild(text);
      sectionEl.appendChild(wrapper);
    });

    updateProgress();
    checklistSections.appendChild(sectionEl);
  });
}

function populateDaySelect() {
  if (!addItemDay) return;
  addItemDay.querySelectorAll("option:not([value=\"\"])").forEach((option) => option.remove());
  days.forEach((day) => {
    const option = document.createElement("option");
    option.value = day.date;
    option.textContent = `${day.weekday} \u00B7 ${day.date} \u00B7 ${day.location}`;
    addItemDay.appendChild(option);
  });
}

function setupOutingGear() {
  const gearSection = document.getElementById("outing-gear");
  if (!gearSection) return;
  renderOutingGear();

  gearSection.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const togglePerson = target.dataset.gearToggle;
    const resetTarget = target.dataset.gearReset;
    const removeIndex = target.dataset.gearRemove;

    if (togglePerson) {
      const index = Number(target.dataset.index);
      const item = appState.outingGear.items[index];
      if (!item) return;
      item.checks[togglePerson] = !item.checks[togglePerson];
      setState({ outingGear: { ...appState.outingGear } }, { updatedSections: ["gear"] });
      return;
    }

    if (removeIndex !== undefined) {
      const index = Number(removeIndex);
      const item = appState.outingGear.items[index];
      if (item) item.deleted = true;
      setState({ outingGear: { ...appState.outingGear } }, { updatedSections: ["gear"] });
      return;
    }

    if (resetTarget) {
      appState.outingGear.items.forEach((item) => {
        if (item.deleted) return;
        if (resetTarget === "all") {
          item.checks.daniel = false;
          item.checks.jaime = false;
        } else if (resetTarget === "daniel") {
          item.checks.daniel = false;
        } else if (resetTarget === "jaime") {
          item.checks.jaime = false;
        }
      });
      setState({ outingGear: { ...appState.outingGear } }, { updatedSections: ["gear"] });
    }
  });

  if (outingGearForm && outingGearInput) {
    outingGearForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const label = outingGearInput.value.trim();
      if (!label) {
        showActionToast("Add a gear item first.");
        return;
      }
      appState.outingGear.items.push({
        id: createId("gear"),
        label,
        checks: { daniel: false, jaime: false },
        deleted: false,
      });
      outingGearInput.value = "";
      setState({ outingGear: { ...appState.outingGear } }, { updatedSections: ["gear"] });
    });
  }
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
    renderOutingGear();
  }
  if (updatedSections.includes("pills")) {
    renderDays();
    setupDayNav();
    updateNowNext();
  }
  if (updatedSections.includes("userItems")) {
    renderDays();
    renderNotesInbox();
    setupDayNav();
    updateNowNext();
  }
  if (updatedSections.includes("copyPhrases")) {
    renderCopyPhrases();
  }
  if (updatedSections.includes("checklist")) {
    renderChecklist();
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
    const dayValue = addItemDay?.value || null;
    const timeValue = addItemTime?.value || null;
    const detailValue = addItemDetail?.value.trim() || "";
    const typeValue = addItemType?.value || "";

    const newItem = {
      id: createId("user"),
      day: dayValue || null,
      time: dayValue ? timeValue : null,
      title,
      detail: detailValue,
      type: typeValue,
      createdAt: Date.now(),
      deleted: false,
    };

    appState.userItems.push(newItem);
    setState({ userItems: [...appState.userItems] }, { updatedSections: ["userItems"] });
    addItemForm.reset();
    showActionToast(dayValue ? "Added to day plan." : "Added to notes inbox.");
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

function setupSearch() {
  if (!searchInput) return;
  searchInput.addEventListener("input", (event) => {
    const value = event.target.value.trim().toLowerCase();
    const items = document.querySelectorAll(".searchable");
    let matches = 0;

    items.forEach((item) => {
      const searchText = item.dataset.search ?? "";
      const visible = !value || searchText.includes(value);
      item.style.display = visible ? "" : "none";
      if (visible) matches += 1;
    });

    if (alertsEl) {
      alertsEl.textContent = value
        ? `${matches} matches for "${value}"`
        : "";
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

function resetCopyPhraseForm() {
  editingCopyPhraseId = null;
  if (copyPhrasesForm) copyPhrasesForm.reset();
  if (copyPhrasesSubmit) copyPhrasesSubmit.textContent = "Add phrase";
  if (copyPhrasesCancel) copyPhrasesCancel.hidden = true;
}

function setupCopyPhrases() {
  if (!copyPhrasesForm || !copyPhrasesBody) return;
  renderCopyPhrases();

  copyPhrasesForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const label = copyPhrasesLabel?.value.trim() ?? "";
    const text = copyPhrasesText?.value.trim() ?? "";
    const category = copyPhrasesCategory?.value ?? "custom";
    const url = copyPhrasesUrl?.value.trim() ?? "";

    if (!label || !text) {
      showActionToast("Add both a label and text.");
      return;
    }

    const items = appState.copyPhrases?.items ?? [];
    if (editingCopyPhraseId) {
      const phrase = items.find((item) => item.id === editingCopyPhraseId);
      if (!phrase || phrase.source !== "user") {
        showActionToast("Only custom phrases can be edited.");
        resetCopyPhraseForm();
        return;
      }
      phrase.label = label;
      phrase.text = text;
      phrase.category = category;
      phrase.url = url;
      phrase.updatedAt = Date.now();
      setState({ copyPhrases: { items: [...items] } }, { updatedSections: ["copyPhrases"] });
      resetCopyPhraseForm();
      showActionToast("Phrase updated.");
      return;
    }

    items.push({
      id: createId("phrase"),
      category,
      label,
      text,
      url,
      source: "user",
      updatedAt: Date.now(),
      deleted: false,
    });
    setState({ copyPhrases: { items: [...items] } }, { updatedSections: ["copyPhrases"] });
    resetCopyPhraseForm();
    showActionToast("Phrase added.");
  });

  if (copyPhrasesCancel) {
    copyPhrasesCancel.addEventListener("click", () => resetCopyPhraseForm());
  }

  copyPhrasesBody.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const copyId = target.dataset.copyPhrase;
    const editId = target.dataset.editPhrase;
    const deleteId = target.dataset.deletePhrase;
    const items = appState.copyPhrases?.items ?? [];

    if (copyId) {
      const phrase = items.find((item) => item.id === copyId);
      if (!phrase) return;
      try {
        await copyToClipboard(phrase.text);
        showActionToast("Copied.");
      } catch (error) {
        showActionToast("Copy failed.");
      }
      return;
    }

    if (editId) {
      const phrase = items.find((item) => item.id === editId);
      if (!phrase || phrase.source !== "user") return;
      editingCopyPhraseId = editId;
      if (copyPhrasesCategory) copyPhrasesCategory.value = phrase.category;
      if (copyPhrasesLabel) copyPhrasesLabel.value = phrase.label;
      if (copyPhrasesText) copyPhrasesText.value = phrase.text;
      if (copyPhrasesUrl) copyPhrasesUrl.value = phrase.url ?? "";
      if (copyPhrasesSubmit) copyPhrasesSubmit.textContent = "Save changes";
      if (copyPhrasesCancel) copyPhrasesCancel.hidden = false;
      return;
    }

    if (deleteId) {
      const phrase = items.find((item) => item.id === deleteId);
      if (!phrase || phrase.source !== "user") return;
      phrase.deleted = true;
      phrase.updatedAt = Date.now();
      setState({ copyPhrases: { items: [...items] } }, { updatedSections: ["copyPhrases"] });
      if (editingCopyPhraseId === deleteId) resetCopyPhraseForm();
      showActionToast("Phrase removed.");
    }
  });

  if (copyPhrasesSearch) {
    copyPhrasesSearch.addEventListener("input", (event) => {
      copyPhraseFilter.search = event.target.value;
      renderCopyPhrases();
    });
  }

  if (copyPhrasesFilter) {
    copyPhrasesFilter.addEventListener("change", (event) => {
      copyPhraseFilter.category = event.target.value;
      renderCopyPhrases();
    });
  }
}

function setupZoneToggle() {
  if (!timeDisplaySelect) return;
  timeDisplaySelect.value = displayZone;
  timeDisplaySelect.addEventListener("change", () => {
    displayZone = timeDisplaySelect.value;
    renderDays();
    setupDayNav();
    updateNowNext();
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

function setupChecklistExportImport() {
  if (exportChecklistButton) {
    exportChecklistButton.addEventListener("click", () => {
      const saved = appState.checklist ?? {};
      const payload = {
        exportedAt: new Date().toISOString(),
        checklist: buildChecklistExport(saved),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "aurora-checklist.json";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      showActionToast("Checklist exported.");
    });
  }

  if (importChecklistButton && importChecklistInput) {
    importChecklistButton.addEventListener("click", () => importChecklistInput.click());
    importChecklistInput.addEventListener("change", async () => {
      const file = importChecklistInput.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const sections = parsed?.checklist;
        if (!Array.isArray(sections)) {
          throw new Error("Invalid checklist file");
        }
        const saved = {};
        sections.forEach((section, sectionIndex) => {
          if (!Array.isArray(section.items)) return;
          saved[sectionIndex] = {};
          section.items.forEach((item, itemIndex) => {
            if (typeof item?.checked === "boolean") {
              saved[sectionIndex][itemIndex] = item.checked;
            }
          });
        });
        setState({ checklist: saved }, { updatedSections: ["checklist"] });
        showActionToast("Checklist imported.");
      } catch (error) {
        showActionToast("Unable to import checklist.");
      } finally {
        importChecklistInput.value = "";
      }
    });
  }
}

function setupShareAndPrint() {
  if (shareButton) {
    shareButton.addEventListener("click", async () => {
      const shareData = {
        title: document.title,
        text: "Aurora trip reference pack",
        url: window.location.href,
      };
      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch (error) {
          showActionToast("Share cancelled.");
        }
      } else if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(shareData.url);
          showActionToast("Trip link copied.");
        } catch (error) {
          showActionToast("Unable to copy trip link.");
        }
      } else {
        showActionToast("Sharing not supported.");
      }
    });
  }

  if (printButton) {
    printButton.addEventListener("click", () => window.print());
  }
}

function setActiveTab(tabId, { scroll = true } = {}) {
  if (!tabButtons.length || !tabSections.length) return;
  const availableTabs = tabButtons.map((button) => button.dataset.tab).filter(Boolean);
  const resolvedTab = availableTabs.includes(tabId) ? tabId : availableTabs[0];
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
  setActiveTab(storedTab ?? tabButtons[0]?.dataset.tab, { scroll: false });

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

function setupBackToTop() {
  if (!backToTopButton) return;
  backToTopButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  const toggleButton = () => {
    const show = window.scrollY > window.innerHeight;
    backToTopButton.hidden = !show;
  };
  toggleButton();
  window.addEventListener("scroll", toggleButton);
}

function updateStickyOffset() {
  const hud = document.getElementById("trip-hud");
  if (!hud) return;
  const offset = hud.offsetHeight + 8;
  document.documentElement.style.setProperty("--sticky-offset", `${offset}px`);
}

function scrollToTarget(id) {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function handleHashChange() {
  const hash = window.location.hash.replace("#", "");
  if (!hash) return;
  const target = document.getElementById(hash);
  if (!target) return;
  const tab = target.closest("[data-tab-section]")?.dataset.tabSection;
  if (tab) {
    setActiveTab(tab, { scroll: false });
  }
  requestAnimationFrame(() => scrollToTarget(hash));
}

function setupDayNav() {
  if (dayObserver) {
    dayObserver.disconnect();
  }
  const jumpButton = document.getElementById("jump-today");
  if (jumpButton) {
    jumpButton.onclick = () => {
      const today = days.find((day) => getDateString(day.timeZone) === day.date);
      if (today) {
        scrollToTarget(`day-${today.date}`);
      }
    };
  }

  const dayLinks = Array.from(document.querySelectorAll(".day-chip"));
  const daySections = Array.from(document.querySelectorAll(".day-card"));
  const linkMap = new Map(dayLinks.map((link) => [link.dataset.day, link]));

  const setActive = (date) => {
    dayLinks.forEach((link) => link.classList.remove("is-active"));
    const active = linkMap.get(date);
    if (active) active.classList.add("is-active");
  };

  dayObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id.replace("day-", "");
          setActive(id);
          history.replaceState(null, "", `#day-${id}`);
        }
      });
    },
    { rootMargin: "-35% 0px -55% 0px", threshold: 0 }
  );

  daySections.forEach((section) => dayObserver.observe(section));
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
  renderDays();
  renderBookings();
  renderMaps();
  renderCopyPhrases();
  renderChecklist();
  renderKeyInfo();
  renderPillsIndicator();
  renderNotesInbox();
  setupChecklistExportImport();
  setupOutingGear();
  setupPills();
  setupAddItemForm();
  setupUserItemRemoval();
  setupSearch();
  setupCopyPhrases();
  setupZoneToggle();
  updateNowNext();
  setupShareAndPrint();
  setupBottomNav();
  setupUiToggles();
  setupDayNav();
  updateStickyOffset();
  setupBackToTop();
  handleHashChange();
  window.AuroraState.ready = true;
  window.dispatchEvent(new CustomEvent("aurora-state-ready"));
  window.addEventListener("hashchange", handleHashChange);
  window.addEventListener("resize", updateStickyOffset);
  setInterval(updateNowNext, 60000);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
