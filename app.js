import { bookings, checklist, days, maps } from "./assets/data/trip-data.js";

const storageKey = "aurora-checklist";
const LAST_UPDATED_KEY = "aurora-last-updated";
let displayZone = "local";
let dayObserver;

const timelineEl = document.getElementById("timeline");
const daysEl = document.getElementById("days-list");
const alertsEl = document.getElementById("alerts");
const bookingsGrid = document.getElementById("bookings-grid");
const mapsGrid = document.getElementById("maps-grid");
const checklistSections = document.getElementById("checklist-sections");
const searchInput = document.getElementById("search");

const nowTimeEl = document.getElementById("current-time");
const nowLocationEl = document.getElementById("current-location");
const nextTitleEl = document.getElementById("next-title");
const nextMetaEl = document.getElementById("next-meta");
const todayDateEl = document.getElementById("today-date");
const todayLocationEl = document.getElementById("today-location");
const todayEventsEl = document.getElementById("today-events");
const todayJumpButton = document.getElementById("today-jump");
const todayMapLink = document.getElementById("today-map");
const todaySupermarketLink = document.getElementById("today-supermarket");
const shareButton = document.getElementById("share-trip");
const printButton = document.getElementById("print-trip");
const exportChecklistButton = document.getElementById("export-checklist");
const importChecklistButton = document.getElementById("import-checklist");
const importChecklistInput = document.getElementById("import-checklist-input");
const backToTopButton = document.getElementById("back-to-top");
const actionToast = document.getElementById("action-toast");

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
  if (displayZone === "home") {
    return event.home_time ? `${event.home_time} Home` : "\u2014";
  }
  if (displayZone === "both") {
    return `${event.time} Local${event.home_time ? `\n${event.home_time} Home` : ""}`;
  }
  return `${event.time} Local`;
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
    if (!day.events.length) {
      eventList.innerHTML = `<p class="note">No scheduled events yet.</p>`;
    } else {
      day.events.forEach((event) => {
        const eventEl = document.createElement("div");
        eventEl.className = "event searchable";
        eventEl.dataset.search = `${event.title} ${event.detail} ${day.location}`.toLowerCase();

        const timeText = formatEventTime(event);
        const timeLines = timeText.split("\n");
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

        eventEl.innerHTML = `
          <div class="event-time">${timeHtml}</div>
          <div>
            <p class="event-title">${event.title}</p>
            <p class="event-detail">${event.detail}</p>
            <div class="event-actions">${links}${actions}</div>
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
    { id: "emergency", label: "Emergency" },
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
  if (!nowTimeEl || !nowLocationEl || !nextTitleEl || !nextMetaEl) return;
  const { hour, minute } = getTimeParts("Europe/Helsinki");
  nowTimeEl.textContent = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

  const today = getDateString("Europe/Helsinki");
  const todayDay = days.find((day) => day.date === today) ?? days[0];
  nowLocationEl.textContent = todayDay?.location ?? "";

  const nowMinutes = hour * 60 + minute;
  let nextEvent = null;
  let nextDay = todayDay;

  for (const day of days) {
    if (day.date < today) continue;
    const events = day.events
      .map((event) => ({
        ...event,
        minutes: Number.parseInt(event.time.split(":")[0], 10) * 60 +
          Number.parseInt(event.time.split(":")[1], 10),
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

  renderTodayCard();
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

function renderChecklist() {
  if (!checklistSections) return;
  const saved = JSON.parse(safeReadStorage(storageKey) ?? "{}");
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
      const done = section.items.reduce((count, item, itemIndex) => {
        const checked = saved?.[sectionIndex]?.[itemIndex] ?? item.checked;
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
        if (!saved[sectionIndex]) saved[sectionIndex] = {};
        saved[sectionIndex][itemIndex] = checkbox.checked;
        safeWriteStorage(storageKey, JSON.stringify(saved));
        updateProgress();
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

function setupZoneToggle() {
  const buttons = document.querySelectorAll(".zone-toggle__button");
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      displayZone = button.dataset.zone ?? "local";
      buttons.forEach((btn) => btn.classList.toggle("is-active", btn === button));
      renderDays();
      setupDayNav();
      updateNowNext();
    });
  });
}

function renderTodayCard() {
  if (!todayDateEl || !todayLocationEl || !todayEventsEl) return;
  const today = getDateString("Europe/Helsinki");
  const todayDay = days.find((day) => day.date === today) ?? days[0];
  const { hour, minute } = getTimeParts("Europe/Helsinki");
  const nowMinutes = hour * 60 + minute;

  todayDateEl.textContent = todayDay.date;
  todayLocationEl.textContent = todayDay.location;
  todayEventsEl.innerHTML = "";

  const upcomingEvents = [];
  days.forEach((day) => {
    if (day.date < today) return;
    day.events.forEach((event) => {
      const eventMinutes = Number.parseInt(event.time.split(":")[0], 10) * 60 +
        Number.parseInt(event.time.split(":")[1], 10);
      if (day.date === today && eventMinutes < nowMinutes) return;
      upcomingEvents.push({ day, event });
    });
  });

  if (!upcomingEvents.length) {
    const item = document.createElement("li");
    item.textContent = "No more events scheduled.";
    todayEventsEl.appendChild(item);
    return;
  }

  upcomingEvents.slice(0, 3).forEach(({ day, event }) => {
    const item = document.createElement("li");
    item.textContent = `${event.time} \u00B7 ${event.title} (${day.location})`;
    todayEventsEl.appendChild(item);
  });
}

function setupTodayActions() {
  const hud = document.getElementById("trip-hud");
  if (hud) {
    if (todayMapLink) todayMapLink.href = hud.dataset.baseMap ?? "#";
    if (todaySupermarketLink) {
      todaySupermarketLink.href = hud.dataset.supermarketMap ?? "#";
    }
  }
  if (todayJumpButton) {
    todayJumpButton.addEventListener("click", () => {
      const today = days.find((day) => getDateString(day.timeZone) === day.date);
      if (today) {
        scrollToTarget(`day-${today.date}`);
      }
    });
  }
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
      const saved = JSON.parse(safeReadStorage(storageKey) ?? "{}");
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
        safeWriteStorage(storageKey, JSON.stringify(saved));
        renderChecklist();
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
  renderTimeline();
  renderDays();
  renderTodayCard();
  renderBookings();
  renderMaps();
  renderChecklist();
  setupChecklistExportImport();
  setupTodayActions();
  setupSearch();
  setupZoneToggle();
  updateNowNext();
  setupShareAndPrint();
  setupDayNav();
  updateStickyOffset();
  setupBackToTop();
  handleHashChange();
  window.addEventListener("hashchange", handleHashChange);
  window.addEventListener("resize", updateStickyOffset);
  setInterval(updateNowNext, 60000);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
