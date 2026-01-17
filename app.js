const tripData = {
  title: "Lapland Winter Expedition",
  travellers: ["Daniel", "Jaime"],
  dates: { start: "2026-01-19", end: "2026-01-24" },
  zones: {
    home: "Europe/Dublin",
    layover: "Europe/London",
    destination: "Europe/Helsinki",
  },
  base_locations: [
    {
      name: "Riverside Restplace",
      address: "1409 Jokivarrentie, 95520 Tornio, Finland",
      coords: "66.0, 24.0",
      map_link:
        "https://www.google.com/maps/search/?api=1&query=1409+Jokivarrentie+Tornio+Finland",
    },
  ],
};

const alerts = [
  {
    level: "critical",
    title: "BHX Air-Rail Link Delays",
    message:
      "Maintenance work on the Birmingham Airport monorail. Single shuttle only (every 6-8 mins). Allow extra time or walk (10-15 mins).",
  },
  {
    level: "warning",
    title: "Mon Night Accommodation",
    message:
      "Itinerary notes you need a plan for Monday night in Rovaniemi before the 05:15 Tuesday train.",
  },
  {
    level: "info",
    title: "Cold Weather Warning",
    message:
      "Temps can drop to -30°C. Keep phone batteries warm (inside jacket pocket).",
  },
];

const days = [
  {
    date: "2026-01-19",
    weekday: "Monday",
    location: "Travel / Birmingham",
    sun_data: "BHX: 08:15 - 16:25",
    notes: "Layover day. Luggage storage needed at New St.",
    timeZone: "Europe/London",
    events: [
      {
        time: "06:15",
        home_time: "06:15",
        title: "Flight to Birmingham",
        detail: "DUB → BHX",
        type: "transport",
        icon: "plane",
      },
      {
        time: "07:25",
        title: "Land BHX",
        detail: "Take Air-Rail Link (or walk) to Birmingham Intl Station. Train to New St.",
        type: "transit",
        icon: "train",
      },
      {
        time: "09:00",
        title: "Luggage Drop",
        detail:
          "Excess Baggage Co. at Birmingham New Street (near platform 10A/11A). ~£8-13/bag.",
        type: "logistics",
        icon: "bag",
      },
      {
        time: "10:00",
        title: "Library of Birmingham",
        detail: "Views from The Secret Garden (7th Floor). Shakespeare Memorial Room.",
        type: "activity",
        icon: "camera",
        links: [{ label: "Info", url: "https://www.birmingham.gov.uk/libraries" }],
      },
      {
        time: "12:30",
        title: "Lunch: Bullring / Grand Central",
        detail: "Options: Mowgli (Indian Street Food) or Nando's.",
        type: "food",
        icon: "food",
      },
      {
        time: "14:30",
        title: "Return to Airport",
        detail: "Train New St → Birmingham Intl. Allow for Air-Rail delays.",
        type: "transit",
        icon: "train",
      },
      {
        time: "17:30",
        title: "Flight to Rovaniemi",
        detail: "BHX → RVN",
        type: "transport",
        icon: "plane",
      },
    ],
  },
  {
    date: "2026-01-20",
    weekday: "Tuesday",
    location: "Rovaniemi → Tornio",
    sun_data: "Tornio: 10:05 - 14:30 (Twilight 09:00-15:30)",
    notes: "Early start. Check-in day.",
    timeZone: "Europe/Helsinki",
    events: [
      {
        time: "05:15",
        title: "Train to Kemi",
        detail: "IC 22. Coach 1, Seats 67 & 68 (Upstairs).",
        type: "transport",
        icon: "train",
      },
      {
        time: "07:56",
        title: "Train to Tornio-Itäinen",
        detail: "Night Train 269. Coach 43, Seats 99 & 100.",
        type: "transport",
        icon: "train",
      },
      {
        time: "08:21",
        title: "Arrive Tornio",
        detail: "Transfer to accommodation area / kill time before check-in.",
        type: "logistics",
        icon: "map-pin",
      },
      {
        time: "12:00",
        title: "Supermarket Run",
        detail: "K-Citymarket or Prisma. Buy: Coffee, Oats, Pasta, Sauna Snacks.",
        type: "food",
        icon: "shopping-cart",
      },
      {
        time: "15:00",
        title: "Chalet Check-in",
        detail: "Riverside Restplace. Keys in lockbox.",
        type: "accommodation",
        icon: "home",
        actions: [{ label: "Call Host", url: "tel:+358406702904" }],
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
        title: "Daylight Window",
        detail: "Best light for photos.",
        type: "info",
        icon: "sun",
      },
      {
        time: "20:00",
        title: "Aurora Watch",
        detail: "Check cloud cover first. Go outside every hour.",
        type: "activity",
        icon: "star",
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
    title: "VR Trains (RVN->Tornio)",
    ref: "Order: F6010236161049",
    times: "05:15 Dep Rovaniemi | 08:21 Arr Tornio",
    notes: "Change at Kemi. Seats designated upstairs.",
  },
];

const checklist = [
  {
    category: "Packing: Feet",
    items: [
      { label: "Insulated Winter Boots (room for socks)", checked: false },
      { label: "4-6 pairs thick wool socks", checked: false },
    ],
  },
  {
    category: "Packing: Body",
    items: [
      { label: "Merino base layers (top/bottom)", checked: false },
      { label: "Fleece mid-layer", checked: false },
      { label: "Windproof/Insulated Coat", checked: false },
      { label: "Waterproof over-trousers", checked: false },
      { label: "Swimsuit (for Sauna)", checked: false },
      { label: "Microfibre towel", checked: false },
    ],
  },
  {
    category: "Packing: Tech & Extras",
    items: [
      { label: "Power bank (cold drains batteries)", checked: false },
      { label: "Head torch + red light mode", checked: false },
      { label: "Lip balm + Moisturiser (dry cold)", checked: false },
      { label: "Sunglasses (low sun glare)", checked: false },
      { label: "Ziploc bags (for electronics condensation)", checked: false },
    ],
  },
  {
    category: "Food Shop (Tornio)",
    items: [
      { label: "Breakfast: Yoghurt, Oats/Granola, Coffee", checked: false },
      { label: "Lunch: Soups, Smoked Salmon, Rye Bread", checked: false },
      { label: "Dinner: Pasta, Jar sauce, Mince/Chicken, Frozen Veg", checked: false },
      { label: "Sauna Snacks: Chocolate, Crisps, Frozen Berries", checked: false },
    ],
  },
];

const maps = [
  {
    label: "Riverside Restplace (Base)",
    query: "1409 Jokivarrentie, 95520 Tornio, Finland",
  },
  { label: "K-Citymarket Tornio", query: "K-Citymarket Tornio" },
  { label: "Birmingham New Street Station", query: "Birmingham New Street Station" },
  { label: "Library of Birmingham", query: "Library of Birmingham" },
  { label: "Rovaniemi Railway Station", query: "Rovaniemi Railway Station" },
];

const storageKey = "aurora-checklist";
let displayZone = "local";

const timelineEl = document.getElementById("timeline");
const daysEl = document.getElementById("days");
const alertsEl = document.getElementById("alerts");
const bookingsGrid = document.getElementById("bookings-grid");
const mapsGrid = document.getElementById("maps-grid");
const checklistSections = document.getElementById("checklist-sections");
const searchInput = document.getElementById("search");

const nowTimeEl = document.getElementById("current-time");
const nowLocationEl = document.getElementById("current-location");
const nextTitleEl = document.getElementById("next-title");
const nextMetaEl = document.getElementById("next-meta");

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
  timelineEl.innerHTML = "";
  days.forEach((day) => {
    const link = document.createElement("a");
    link.href = `#day-${day.date}`;
    link.className = "timeline-chip";
    link.textContent = `${day.weekday.slice(0, 3)} ${day.date.slice(5)}`;
    const currentDate = getDateString(day.timeZone);
    if (currentDate === day.date) {
      link.classList.add("is-today");
    }
    timelineEl.appendChild(link);
  });
}

function renderAlerts() {
  alertsEl.innerHTML = "";
  alerts.forEach((alert) => {
    const card = document.createElement("div");
    card.className = `alert ${alert.level}`;
    card.innerHTML = `<strong>${alert.title}</strong><p>${alert.message}</p>`;
    alertsEl.appendChild(card);
  });
}

function renderDays() {
  daysEl.innerHTML = "";
  days.forEach((day) => {
    const section = document.createElement("section");
    section.className = "day-card searchable";
    section.id = `day-${day.date}`;
    section.dataset.search = `${day.weekday} ${day.location} ${day.notes ?? ""}`.toLowerCase();

    section.innerHTML = `
      <div class="day-header">
        <h3>${day.weekday} · ${day.date} · ${day.location}</h3>
        ${day.sun_data ? `<p class="day-meta">${day.sun_data}</p>` : ""}
        ${day.notes ? `<p class="day-meta">${day.notes}</p>` : ""}
      </div>
      <div class="live-dashboard" data-day="${day.date}"></div>
      <div class="event-list"></div>
    `;

    const eventList = section.querySelector(".event-list");
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

    daysEl.appendChild(section);
  });
}

function renderBookings() {
  bookingsGrid.innerHTML = "";
  bookings.forEach((booking) => {
    const card = document.createElement("div");
    card.className = "card searchable";
    card.dataset.search = `${booking.category} ${booking.title} ${booking.ref} ${booking.address ?? ""}`.toLowerCase();

    card.innerHTML = `
      <h3>${booking.title}</h3>
      <p class="note">${booking.category}</p>
      <p>${booking.times}</p>
      ${booking.address ? `<p><strong>Address:</strong> ${booking.address}</p>` : ""}
      ${booking.contact ? `<p><strong>Contact:</strong> <a href="tel:${booking.contact.replace(/\s+/g, "")}">${booking.contact}</a></p>` : ""}
      <p><strong>Ref:</strong> ${booking.ref}</p>
      <p class="note">${booking.notes}</p>
      <div class="event-actions">
        ${booking.address ? `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.address)}" target="_blank" rel="noreferrer">Map</a>` : ""}
        <button class="copy-btn" data-copy="${booking.ref}">Copy Ref</button>
      </div>
    `;
    bookingsGrid.appendChild(card);
  });
}

function renderMaps() {
  mapsGrid.innerHTML = "";
  maps.forEach((map) => {
    const card = document.createElement("div");
    card.className = "card searchable";
    card.dataset.search = `${map.label} ${map.query}`.toLowerCase();
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(map.query)}`;

    card.innerHTML = `
      <h3>${map.label}</h3>
      <p>${map.query}</p>
      <div class="event-actions">
        <a href="${url}" target="_blank" rel="noreferrer">Open Map</a>
        <button class="copy-btn" data-copy="${map.query}">Copy</button>
      </div>
    `;
    mapsGrid.appendChild(card);
  });
}

function loadChecklistState() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return checklist;
  try {
    const parsed = JSON.parse(saved);
    return parsed;
  } catch (error) {
    console.warn("Failed to parse checklist, resetting.", error);
    return checklist;
  }
}

function saveChecklistState(state) {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function renderChecklist() {
  const state = loadChecklistState();
  checklistSections.innerHTML = "";

  state.forEach((section, sectionIndex) => {
    const wrapper = document.createElement("div");
    wrapper.className = "checklist-section";

    wrapper.innerHTML = `
      <header>
        <h3>${section.category}</h3>
        <div>
          <button data-action="select" data-section="${sectionIndex}">Select all</button>
          <button data-action="reset" data-section="${sectionIndex}">Reset</button>
        </div>
      </header>
      <ul class="checklist-items"></ul>
    `;

    const list = wrapper.querySelector(".checklist-items");
    section.items.forEach((item, itemIndex) => {
      const li = document.createElement("li");
      const id = `check-${sectionIndex}-${itemIndex}`;
      li.innerHTML = `
        <label for="${id}">
          <input type="checkbox" id="${id}" data-section="${sectionIndex}" data-item="${itemIndex}" ${
        item.checked ? "checked" : ""
      } />
          <span>${item.label}</span>
        </label>
      `;
      list.appendChild(li);
    });

    checklistSections.appendChild(wrapper);
  });
}

function updateChecklistItem(sectionIndex, itemIndex, checked) {
  const state = loadChecklistState();
  state[sectionIndex].items[itemIndex].checked = checked;
  saveChecklistState(state);
}

function toggleChecklistSection(sectionIndex, checked) {
  const state = loadChecklistState();
  state[sectionIndex].items.forEach((item) => {
    item.checked = checked;
  });
  saveChecklistState(state);
  renderChecklist();
}

function handleCopy(target) {
  const text = target.getAttribute("data-copy");
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    target.textContent = "Copied";
    setTimeout(() => {
      target.textContent = target.dataset.originalLabel ?? "Copy";
    }, 2000);
  });
}

function setupCopyButtons() {
  document.querySelectorAll(".copy-btn").forEach((button) => {
    if (!button.dataset.originalLabel) {
      button.dataset.originalLabel = button.textContent;
    }
    button.addEventListener("click", () => handleCopy(button));
  });
}

function renderNowNext() {
  const today = days.find((day) => getDateString(day.timeZone) === day.date);
  if (!today) {
    nowLocationEl.textContent = "Not in trip dates";
    nextTitleEl.textContent = "Trip starts soon";
    return;
  }

  const timeParts = getTimeParts(today.timeZone);
  const currentMinutes = timeParts.hour * 60 + timeParts.minute;

  nowTimeEl.textContent = `${String(timeParts.hour).padStart(2, "0")}:${String(timeParts.minute).padStart(2, "0")}`;
  nowLocationEl.textContent = `${today.location} · ${today.timeZone}`;

  const upcoming = today.events.find((event) => {
    const [hour, minute] = event.time.split(":").map(Number);
    return hour * 60 + minute > currentMinutes;
  });

  if (upcoming) {
    nextTitleEl.textContent = upcoming.title;
    nextMetaEl.textContent = `${upcoming.time} · ${upcoming.detail}`;
  } else {
    const nextDay = days[days.indexOf(today) + 1];
    if (nextDay) {
      nextTitleEl.textContent = `Next day: ${nextDay.weekday}`;
      nextMetaEl.textContent = `${nextDay.events[0]?.time ?? ""} · ${nextDay.events[0]?.title ?? ""}`;
    } else {
      nextTitleEl.textContent = "No more events";
      nextMetaEl.textContent = "";
    }
  }
}

function setupSearch() {
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    document.querySelectorAll(".searchable").forEach((item) => {
      const text = item.dataset.search ?? "";
      item.style.display = text.includes(query) ? "" : "none";
    });
  });
}

function setupTimeZoneToggle() {
  document.querySelectorAll(".toggle-btn").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".toggle-btn").forEach((btn) => btn.classList.remove("is-active"));
      button.classList.add("is-active");
      displayZone = button.dataset.zone;
      renderDays();
      setupCopyButtons();
    });
  });
}

function setupChecklistHandlers() {
  checklistSections.addEventListener("change", (event) => {
    if (!(event.target instanceof HTMLInputElement)) return;
    const sectionIndex = Number(event.target.dataset.section);
    const itemIndex = Number(event.target.dataset.item);
    updateChecklistItem(sectionIndex, itemIndex, event.target.checked);
  });

  checklistSections.addEventListener("click", (event) => {
    if (!(event.target instanceof HTMLButtonElement)) return;
    const action = event.target.dataset.action;
    const sectionIndex = Number(event.target.dataset.section);
    if (action === "select") {
      toggleChecklistSection(sectionIndex, true);
    }
    if (action === "reset") {
      toggleChecklistSection(sectionIndex, false);
    }
  });
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("Service worker registration failed", error);
    });
  }
}

function init() {
  renderTimeline();
  renderAlerts();
  renderDays();
  renderBookings();
  renderMaps();
  renderChecklist();
  setupCopyButtons();
  setupSearch();
  setupTimeZoneToggle();
  setupChecklistHandlers();
  renderNowNext();
  registerServiceWorker();
  setInterval(renderNowNext, 60000);
}

init();
