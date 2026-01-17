const days = [
  {
    id: "day1",
    date: "2026-01-19",
    shortLabel: "Monday",
    label: "Monday",
    events: [
      {
        type: "flight",
        title: "Fly: Dublin (DUB) → Birmingham (BHX)",
        time: { local: "06:15", tz: "Europe/Dublin" },
        flight: {
          bookingRef: "FULUMW",
        },
        airportsShowTitles: false,
        airports: [
          {
            code: "DUB",
            name: "Dublin Airport",
            map: {
              label: "Open DUB map",
              href: "https://www.dublinairport.com/at-the-airport/the-map",
            },
            live: {
              label: "DUB live flights",
              href: "https://www.dublinairport.com/flight-information/live-arrivals",
            },
          },
          {
            code: "BHX",
            name: "Birmingham Airport",
            live: {
              label: "Birmingham live flights",
              href: "https://www.birminghamairport.co.uk/flights/",
            },
          },
        ],
      },
      {
        type: "flight",
        title: "Birmingham (BHX) → Rovaniemi (RVN)",
        time: { local: "17:30", tz: "Europe/London" },
        flightTitle: null,
        airportsTitle: null,
        airportsShowTitles: false,
        flight: {
          bookingRef: "SQ23KL",
        },
        airports: [
          {
            code: "BHX",
            name: "Birmingham Airport",
            live: { label: "Birmingham live flights", href: "https://www.birminghamairport.co.uk/flights/" },
          },
          {
            code: "RVN",
            name: "Rovaniemi Airport",
            live: {
              label: "Finavia — Rovaniemi flights",
              href: "https://www.finavia.fi/en/airports/rovaniemi/flights",
            },
            map: {
              label: "Finavia — Rovaniemi terminal",
              href: "https://www.finavia.fi/en/airports/rovaniemi",
            },
          },
        ],
      },
    ],
  },
  {
    id: "day2",
    date: "2026-01-20",
    shortLabel: "Tuesday",
    label: "Tuesday",
    baseLocation: "Rovaniemi → Tornio (check-in day)",
    daylight: {
      show: true,
      note: "Render sunrise/sunset dynamically for Tornio (your base).",
      sources: [
        {
          label: "Timeanddate — Tornio sunrise/sunset (date-specific)",
          href: "https://www.timeanddate.com/sun/finland/tornio?month=1&year=2026",
        },
      ],
    },
    events: [
      {
        type: "train",
        statusBadge: "Confirmed",
        title: "Train: Rovaniemi → Kemi (IC 22)",
        time: { local: "05:15", tz: "Europe/Helsinki" },
        arrivalTime: { local: "06:35", tz: "Europe/Helsinki" },
        seat: { coach: "1 (upstairs)", seats: ["67", "68"] },
        station: {
          depart: "Rovaniemi station",
          arrive: "Kemi station",
        },
        booking: {
          provider: "VR",
          orderNumber: "F6010236161049",
          ticketLinks: [
            {
              label: "VR tickets (link 1)",
              href: "https://www.vr.fi/lippu/JEsW6RBnBMeIZEsyfV7CmC5l?locale=en",
            },
            {
              label: "VR tickets (link 2)",
              href: "https://www.vr.fi/lippu/xXGY24hnMZo1HgymI9oh-M9f?locale=en",
            },
          ],
        },
        webFormatTips: [
          "Make the ticket links separate buttons: 'Open ticket' and 'Backup ticket'.",
          "Add a 'Show QR full-screen' affordance if your site can embed/preview.",
        ],
      },
      {
        type: "train",
        statusBadge: "Confirmed",
        title: "Train: Kemi → Tornio-Itäinen (Night train 269)",
        time: { local: "07:56", tz: "Europe/Helsinki" },
        arrivalTime: { local: "08:21", tz: "Europe/Helsinki" },
        seat: { coach: "43 (upstairs)", seats: ["99", "100"] },
        station: {
          depart: "Kemi station",
          arrive: "Tornio-Itäinen station",
        },
        booking: {
          provider: "VR",
          orderNumber: "F6010236161049",
          ticketLinks: [
            {
              label: "VR tickets (link 1)",
              href: "https://www.vr.fi/lippu/JEsW6RBnBMeIZEsyfV7CmC5l?locale=en",
            },
            {
              label: "VR tickets (link 2)",
              href: "https://www.vr.fi/lippu/xXGY24hnMZo1HgymI9oh-M9f?locale=en",
            },
          ],
        },
      },
      {
        type: "local_transport",
        statusBadge: "Plan needed",
        title: "Local transfer: Tornio-Itäinen → Riverside Restplace (Tornio)",
        details: [
          "No car: likely bus + walk, or taxi (especially with luggage).",
          "Use Tornio public transport page for route/timetables.",
        ],
        links: [
          {
            label: "Tornio public transport (city bus + timetables)",
            href: "https://www.tornio.fi/en/housing-and-environment/streets-and-transport/public-transport-within-the-city-area/",
          },
        ],
        webFormatTips: [
          "Add a 'Route' button that deep-links to Google/Apple Maps using the address field below.",
          "Add a 'Call taxi' slot (click-to-call) once you decide a provider.",
        ],
      },
      {
        type: "checkin",
        statusBadge: "Scheduled window",
        title: "Check-in: Riverside Restplace",
        timeWindow: { start: "15:00", end: "18:00", tz: "Europe/Helsinki" },
        place: {
          name: "Riverside Restplace",
          address: "1409 Jokivarrentie, 95520 Tornio, Finland",
          phone: { label: "Call host", href: "tel:+358406702904" },
          maps: [
            {
              label: "Open in Google Maps",
              href: "https://www.google.com/maps/search/?api=1&query=1409%20Jokivarrentie%2C%2095520%20Tornio%2C%20Finland",
            },
            {
              label: "Open in Apple Maps",
              href: "http://maps.apple.com/?q=1409%20Jokivarrentie%2C%2095520%20Tornio%2C%20Finland",
            },
          ],
        },
        notes: [
          "Keys: lockbox on location.",
          "Provider note: cash only (treat as 'extras/incidental' unless told otherwise).",
        ],
        webFormatTips: [
          "Render the phone number as a tap-to-call button.",
          "Add a 'Copy address' button for taxi apps.",
        ],
      },
      {
        type: "task",
        statusBadge: "Flexible",
        title: "Grocery shopping (after check-in)",
        details: [
          "Add staple food + hot drinks + easy dinners for aurora evenings.",
          "Put supermarkets as quick links; no fixed time needed.",
        ],
        links: [
          {
            label: "Find supermarkets near address (Google Maps)",
            href: "https://www.google.com/maps/search/supermarket/@?api=1&query=supermarket&query_place_id=",
          },
        ],
        webFormatTips: [
          "If your site supports location, replace the placeholder with a real 'near this address' search link.",
          "Add a checklist inside the event (editable): oats, yoghurt, bread, soup, pasta, snacks, thermos drink.",
        ],
      },
      {
        type: "aurora",
        statusBadge: "Night window",
        title: "Aurora watch (Tornio base)",
        details: [
          "Primary check: cloud cover (hourly). Secondary: aurora activity/oval.",
          "Best habit: quick outside checks when skies are clear; keep lights low.",
        ],
        links: [
          { label: "FMI aurora & space weather", href: "https://en.ilmatieteenlaitos.fi/auroras-and-space-weather" },
          { label: "FMI local weather (cloud/hourly)", href: "https://en.ilmatieteenlaitos.fi/local-weather" },
        ],
        webFormatTips: [
          "Embed two mini-widgets side-by-side: 'Cloud % next 6h' and 'Aurora activity'.",
          "Let users log sightings with a 'Seen? yes/no' toggle + optional photo upload.",
        ],
      },
    ],
  },
  {
    id: "day3",
    date: "2026-01-21",
    shortLabel: "Wednesday",
    label: "Wednesday",
    baseLocation: "Tornio (full day)",
    daylight: {
      show: true,
      sources: [
        {
          label: "Timeanddate — Tornio sunrise/sunset",
          href: "https://www.timeanddate.com/sun/finland/tornio?month=1&year=2026",
        },
      ],
    },
    events: [
      {
        type: "base_day",
        statusBadge: "Open plan",
        title: "Tornio base day",
        details: ["Local exploring / rest / sauna.", "Top-up groceries if needed."],
        links: [{ label: "TornioHaparanda visitor info", href: "https://www.torniohaparanda.com/en/" }],
        webFormatTips: [
          "Add an 'Ideas carousel' with 4 tiles (walks / museums / border area / cafes).",
          "Allow saving favourite places with a heart/bookmark icon.",
        ],
      },
      {
        type: "aurora",
        statusBadge: "Night window",
        title: "Aurora watch (Tornio)",
        links: [
          { label: "FMI aurora & space weather", href: "https://en.ilmatieteenlaitos.fi/auroras-and-space-weather" },
          { label: "FMI local weather (cloud/hourly)", href: "https://en.ilmatieteenlaitos.fi/local-weather" },
        ],
      },
    ],
  },
  {
    id: "day4",
    date: "2026-01-22",
    shortLabel: "Thursday",
    label: "Thursday",
    baseLocation: "Tornio (full day)",
    daylight: {
      show: true,
      sources: [
        {
          label: "Timeanddate — Tornio sunrise/sunset",
          href: "https://www.timeanddate.com/sun/finland/tornio?month=1&year=2026",
        },
      ],
    },
    events: [
      {
        type: "base_day",
        statusBadge: "Open plan",
        title: "Tornio base day",
        details: [
          "Optional day trip ideas can be pinned here (no fixed times).",
          "Use buses/taxi depending on weather and daylight.",
        ],
        links: [
          {
            label: "Tornio public transport",
            href: "https://www.tornio.fi/en/housing-and-environment/streets-and-transport/public-transport-within-the-city-area/",
          },
        ],
      },
      {
        type: "aurora",
        statusBadge: "Night window",
        title: "Aurora watch (Tornio)",
        links: [
          { label: "FMI aurora & space weather", href: "https://en.ilmatieteenlaitos.fi/auroras-and-space-weather" },
          { label: "FMI local weather (cloud/hourly)", href: "https://en.ilmatieteenlaitos.fi/local-weather" },
        ],
      },
    ],
  },
  {
    id: "day5",
    date: "2026-01-23",
    shortLabel: "Friday",
    label: "Friday",
    baseLocation: "Tornio (final full day)",
    daylight: {
      show: true,
      sources: [
        {
          label: "Timeanddate — Tornio sunrise/sunset",
          href: "https://www.timeanddate.com/sun/finland/tornio?month=1&year=2026",
        },
      ],
    },
    events: [
      {
        type: "base_day",
        statusBadge: "Open plan",
        title: "Last full day in Tornio",
        details: [
          "Good day for: any last supplies, packing admin, and a final aurora attempt.",
          "Optional: prep travel snacks for tomorrow’s train + flights.",
        ],
      },
      {
        type: "aurora",
        statusBadge: "Night window",
        title: "Aurora watch (Tornio — final night)",
        links: [
          { label: "FMI aurora & space weather", href: "https://en.ilmatieteenlaitos.fi/auroras-and-space-weather" },
          { label: "FMI local weather (cloud/hourly)", href: "https://en.ilmatieteenlaitos.fi/local-weather" },
        ],
      },
    ],
  },
  {
    id: "day6",
    date: "2026-01-24",
    shortLabel: "Saturday",
    label: "Saturday",
    baseLocation: "Tornio → Kemi → Rovaniemi → Birmingham → Dublin",
    daylight: {
      show: true,
      note: "Show Tornio + Rovaniemi daylight, as you move locations.",
      sources: [
        {
          label: "Timeanddate — Tornio sunrise/sunset",
          href: "https://www.timeanddate.com/sun/finland/tornio?month=1&year=2026",
        },
        {
          label: "Timeanddate — Rovaniemi sunrise/sunset",
          href: "https://www.timeanddate.com/sun/finland/rovaniemi?month=1&year=2026",
        },
      ],
    },
    events: [
      {
        type: "checkout",
        statusBadge: "Scheduled window",
        title: "Check-out: Riverside Restplace",
        timeWindow: { start: "08:00", end: "11:00", tz: "Europe/Helsinki" },
        place: {
          address: "1409 Jokivarrentie, 95520 Tornio, Finland",
          phone: { label: "Call host", href: "tel:+358406702904" },
        },
      },
      {
        type: "local_transport",
        statusBadge: "Plan needed",
        title: "Transfer: Tornio → Kemi station",
        details: [
          "No fixed time here; ensure you reach Kemi station in time for the 09:36 train.",
          "Use Tornio transport page + bus planners; taxi as fallback in icy weather.",
        ],
        links: [
          {
            label: "Tornio public transport",
            href: "https://www.tornio.fi/en/housing-and-environment/streets-and-transport/public-transport-within-the-city-area/",
          },
        ],
      },
      {
        type: "train",
        statusBadge: "Confirmed",
        title: "Train: Kemi → Rovaniemi (Night train 273)",
        time: { local: "09:36", tz: "Europe/Helsinki" },
        arrivalTime: { local: "10:59", tz: "Europe/Helsinki" },
        seat: { coach: "57 (upstairs)", seats: ["73", "74"] },
        booking: {
          provider: "VR",
          orderNumber: "F6010236161507",
          ticketLinks: [
            { label: "VR tickets (link 1)", href: "https://www.vr.fi/lippu/wWZ7RzDTh6tliMiaRKwdj8tU?locale=en" },
          ],
        },
      },
      {
        type: "bus",
        statusBadge: "Timetable needed",
        title: "Bus: Rovaniemi (city) ↔ Rovaniemi Airport (RVN)",
        details: [
          "Use Airportbus.fi for the airport bus timetable (Airport Express / Santa’s Express routes vary).",
          "Keep as a bus event with a single authoritative timetable link.",
        ],
        links: [
          { label: "Airportbus.fi timetables", href: "https://www.airportbus.fi/" },
          {
            label: "Finavia — RVN public transport overview",
            href: "https://www.finavia.fi/en/airports/rovaniemi/parking-access/public-transport",
          },
        ],
        webFormatTips: [
          "Let users pin the specific departure they choose (no default time).",
          "Add a 'Taxi fallback' button slot if bus frequency is low.",
        ],
      },
      {
        type: "flight",
        statusBadge: "Scheduled",
        title: "Fly: Rovaniemi (RVN) → Birmingham (BHX)",
        time: { local: "15:55", tz: "Europe/Helsinki" },
        flight: {
          airline: "Ryanair",
          flightNumber: "ADD_FROM_BOARDING_PASS",
          seatNumbers: "ADD_FROM_BOARDING_PASS",
          bookingRef: "SQ23KL",
        },
        links: [
          { label: "Finavia — RVN flights (live)", href: "https://www.finavia.fi/en/airports/rovaniemi/flights" },
          { label: "BHX live flights", href: "https://www.birminghamairport.co.uk/flights/" },
        ],
        webFormatTips: ["Show BOTH time zones on this event (Finland time + UK time) with a toggle."],
      },
      {
        type: "layover",
        statusBadge: "In-between",
        title: "Layover: Birmingham (BHX)",
        time: {
          local: "CALCULATE_FROM_ACTUAL_RVN_ARRIVAL_AND_20_50_DEPARTURE",
          tz: "Europe/London",
        },
        links: [{ label: "BHX live flights", href: "https://www.birminghamairport.co.uk/flights/" }],
      },
      {
        type: "flight",
        statusBadge: "Scheduled",
        title: "Fly: Birmingham (BHX) → Dublin (DUB)",
        time: { local: "20:50", tz: "Europe/London" },
        flight: {
          airline: "Ryanair",
          flightNumber: "ADD_FROM_BOARDING_PASS",
          seatNumbers: "ADD_FROM_BOARDING_PASS",
          bookingRef: "FULUMW",
        },
        links: [
          { label: "BHX live flights", href: "https://www.birminghamairport.co.uk/flights/" },
          { label: "DUB live flights", href: "https://www.dublinairport.com/flight-information/live-arrivals" },
        ],
      },
    ],
  },
];

const bookings = [];
const checklist = [];
const maps = [];

export { bookings, checklist, days, maps };
