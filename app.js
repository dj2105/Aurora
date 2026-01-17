const days = [
  {
    date: "2026-01-19",
    weekday: "Monday",
    location: "Rovaniemi",
    notes: "Arrival day. Pick up supplies and settle in.",
    timeZone: "Europe/Helsinki",
    events: [
      {
        time: "14:30",
        title: "Arrive in Rovaniemi",
        detail: "Pick up rental and stock essentials.",
        type: "transport",
        icon: "plane",
      },
      {
        time: "18:00",
        title: "Grocery run",
        detail: "Grab dinners + snacks for the week.",
        type: "food",
        icon: "shopping-cart",
      },
    ],
  },
  {
    date: "2026-01-20",
    weekday: "Tuesday",
    location: "Tornio",
    notes: "Travel day to the chalet.",
    timeZone: "Europe/Helsinki",
    events: [
      {
        time: "05:15",
        title: "VR Train to Tornio",
        detail: "Change at Kemi. Seats upstairs.",
        type: "transport",
        icon: "train",
      },
      {
        time: "15:00",
        title: "Check-in",
        detail: "Keys in lockbox. Warm up and unpack.",
        type: "logistics",
        icon: "home",
      },
      {
        time: "20:00",
        title: "Aurora check",
        detail: "Check cloud cover, step outside hourly.",
        type: "activity",
        icon: "star",
      },
    ],
  },
  {
    date: "2026-01-21",
    weekday: "Wednesday",
    location: "Tornio",
    notes: "First full chalet day. Aurora watch tonight.",
    timeZone: "Europe/Helsinki",
    events: [
      {
        time: "10:00",
        title: "Daylight window",
        detail: "Best light for photos.",
        type: "info",
        icon: "sun",
      },
      {
        time: "20:00",
        title: "Aurora watch",
        detail: "Check cloud cover first. Go outside every hour.",
        type: "activity",
        icon: "star",
      },
    ],
  },
  {
    date: "2026-01-22",
    weekday: "Thursday",
    location: "Tornio",
    notes: "Flexible day. Plan supplies + sauna night.",
    timeZone: "Europe/Helsinki",
    events: [
      {
        time: "11:00",
        title: "Slow morning + brunch",
        detail: "Warm up, check weather, plan afternoon.",
        type: "food",
        icon: "coffee",
      },
      {
        time: "18:00",
        title: "Sauna + dinner",
        detail: "Keep gear ready for a late aurora check.",
        type: "activity",
        icon: "flame",
      },
      {
        time: "21:00",
        title: "Aurora watch",
        detail: "Check cloud cover first. Go outside every hour.",
        type: "activity",
        icon: "star",
      },
    ],
  },
  {
    date: "2026-01-23",
    weekday: "Friday",
    location: "Tornio",
    notes: "Backup aurora night + restock supplies.",
    timeZone: "Europe/Helsinki",
    events: [
      {
        time: "12:00",
        title: "Supermarket top-up",
        detail: "Grab snacks + hot drinks for late night.",
        type: "food",
        icon: "shopping-cart",
      },
      {
        time: "20:30",
        title: "Aurora watch",
        detail: "Clear skies? Head to best spot early.",
        type: "activity",
        icon: "star",
      },
    ],
  },
  {
    date: "2026-01-24",
    weekday: "Saturday",
    location: "Tornio → Travel",
    notes: "Check-out + travel home.",
    timeZone: "Europe/Helsinki",
    events: [
      {
        time: "09:00",
        title: "Pack + check-out",
        detail: "Final sweep, charge power banks.",
        type: "logistics",
        icon: "bag",
      },
    ],
  },
];

const bookings = [
  {
    category: "Accommodation",
    title: "Riverside Restplace",
    ref: "Booking: 1 chalet",
    times: "Check-in: 15:00 Jan 20 | Out: Jan 24",
    address: "1409 Jokivarrentie, 95520 Tornio",
    contact: "+358 40 670 2904",
    notes: "Keys in lockbox.",
  },
  {
    category: "Transport",
    title: "VR Trains (RVN → Tornio)",
    ref: "Order: F6010236161049",
    times: "05:15 Dep Rovaniemi | 08:21 Arr Tornio",
    notes: "Change at Kemi. Seats upstairs.",
  },
];

const checklist = [
  {
    category: "Packing: Layers",
    items: [
      { label: "Thermals + base layers", checked: false },
      { label: "Mid layers (fleece, wool)", checked: false },
      { label: "Waterproof outer shell", checked: false },
    ],
  },
  {
    category: "Packing: Feet",
    items: [
      { label: "Waterproof boots", checked: false },
      { label: "Wool socks", checked: false },
      { label: "Spare insoles", checked: false },
    ],
  },
  {
    category: "Daily carry",
    items: [
      { label: "Power bank + cables", checked: false },
      { label: "Head torch", checked: false },
      { label: "Tickets + confirmations", checked: false },
      { label: "Water + snacks", checked: false },
    ],
  },
  {
    category: "Food shop (Tornio)",
    items: [
      { label: "Breakfast: yoghurt, oats, coffee", checked: false },
      { label: "Lunch: soups, smoked salmon, rye bread", checked: false },
      { label: "Dinner: pasta, jar sauce, frozen veg", checked: false },
      { label: "Sauna snacks: chocolate, crisps, berries", checked: false },
    ],
  },
];

const maps = [
  {
    label: "Riverside Restplace (Base)",
    query: "1409 Jokivarrentie, 95520 Tornio, Finland",
  },
  { label: "K-Citymarket Tornio", query: "K-Citymarket Tornio" },
  { label: "Rovaniemi Railway Station", query: "Rovaniemi Railway Station" },
  { label: "Tornio bus station", query: "Tornio bus station" },
  { label: "Aurora dark spot", query: "Tornio dark sky spot" },
];

const storageKey = "aurora-checklist";
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
    return event.home_time ? `${event.home_time} Home` : "—";
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
      <h3>${day.weekday} · ${day.date} · ${day.location}</h3>
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
  const targets = Array.from(section.querySelectorAll("[data-toc][id]"));
  targets.forEach((target) => {
    const link = document.createElement("a");
    link.href = `#${target.id}`;
    link.textContent = target.dataset.toc;
    nav.appendChild(link);
  });

  const globalTargets = [
    { id: "checklist", label: "Checklist" },
    { id: "emergency", label: "Emergency" },
  ];
  globalTargets.forEach((item) => {
    if (!document.getElementById(item.id)) return;
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
    nextMetaEl.textContent = `${nextDay.weekday} · ${nextEvent.time} · ${nextDay.location}`;
  } else {
    nextTitleEl.textContent = "No more events today";
    nextMetaEl.textContent = "";
  }
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
    sectionEl.innerHTML = `<h3>${section.category}</h3>`;

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
      });

      const text = document.createElement("span");
      text.textContent = item.label;
      wrapper.appendChild(checkbox);
      wrapper.appendChild(text);
      sectionEl.appendChild(wrapper);
    });

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
  renderTimeline();
  renderDays();
  renderBookings();
  renderMaps();
  renderChecklist();
  setupSearch();
  setupZoneToggle();
  updateNowNext();
  setupDayNav();
  updateStickyOffset();
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
