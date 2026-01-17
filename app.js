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
        title: "Aurora Watch",
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
        title: "Aurora Watch",
        detail: "Clear skies? Head to best spot early.",
        type: "activity",
        icon: "star",
      },
    ],
  },
  {
    date: "2026-01-24",
    weekday: "Saturday",
    location: "Tornio â†’ Travel",
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
let dayObserver;
    link.className = "day-chip";
    link.dataset.day = day.date;
    const header = document.createElement("div");
    header.className = "day-header";
    header.innerHTML = `
      <h3>${day.weekday} Â· ${day.date} Â· ${day.location}</h3>
      ${day.sun_data ? `<p class="day-meta">${day.sun_data}</p>` : ""}
      ${day.notes ? `<p class="day-meta">${day.notes}</p>` : ""}
    `;

    const jumpNav = document.createElement("nav");
    jumpNav.className = "day-jump";
    jumpNav.setAttribute("aria-label", `Jump to ${day.weekday} sections`);

    const scheduleSection = document.createElement("div");
    scheduleSection.className = "day-section";
    scheduleSection.innerHTML = `
      <h4>Schedule</h4>
    const eventList = scheduleSection.querySelector(".event-list");
    const anchorsAdded = new Set();
    const anchorConfig = [
      {
        key: "flights",
        label: "Flights",
        match: (event) => event.icon === "plane" || /flight/i.test(event.title),
      },
      {
        key: "transport",
        label: "Transport",
        match: (event) =>
          ["transport", "transit", "logistics"].includes(event.type) &&
          !(event.icon === "plane" || /flight/i.test(event.title)),
      },
      { key: "food", label: "Food", match: (event) => event.type === "food" },
    ];
    const hasAuroraEvent = day.events.some(
      (event) => /aurora/i.test(event.title) || event.icon === "star"
    );

    if (!day.events.length) {
      eventList.innerHTML = `<p class="note">No scheduled events yet.</p>`;
    } else {
      day.events.forEach((event) => {
        anchorConfig.forEach((config) => {
          if (!anchorsAdded.has(config.key) && config.match(event)) {
            const anchor = document.createElement("div");
            anchor.className = "day-anchor";
            anchor.id = `day-${day.date}-${config.key}`;
            anchor.dataset.toc = config.label;
            eventList.appendChild(anchor);
            anchorsAdded.add(config.key);
          }
        });

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
    if (hasAuroraEvent) {
      auroraSection.dataset.toc = "Aurora";
    }
    auroraSection.innerHTML = `
      <h4>Aurora + Weather</h4>
      <div class="live-dashboard" data-day="${day.date}"></div>
    `;

    section.appendChild(header);
    section.appendChild(jumpNav);
    section.appendChild(scheduleSection);
    section.appendChild(auroraSection);

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

      setupDayNav();
      updateStickyOffset();
      handleHashChange();
  setupDayNav();
  updateStickyOffset();
  handleHashChange();
  window.addEventListener("hashchange", handleHashChange);
  window.addEventListener("resize", updateStickyOffset);
