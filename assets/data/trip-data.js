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
    location: "Tornio \u2192 Travel",
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
    title: "VR Trains (RVN \u2192 Tornio)",
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

export { bookings, checklist, days, maps };
