# agent.md — Trip Reference Pack Website (General Format Spec)

## Goal
Build a genuinely useful, phone-first trip website designed for quick reference while travelling. It should prioritise **speed, clarity, and “at-a-glance” retrieval** over long prose.

## Core Principles
- **Mobile-first** (thumb-friendly, large tap targets, minimal scrolling)
- **Fast** (static site, no heavy frameworks; loads well on airport/train Wi-Fi)
- **Offline-friendly** (service worker + caching; checklist stored locally)
- **Zero hunting** (key facts always visible or 1 tap away)
- **Time-zone aware** (display local time, with optional “home time” toggle)

---

## Information Architecture
### Global Layout
1. **Top edge timeline bar** (persistent across pages)
2. **Day sections/pages** (one per day, colour-coded or clearly separated)
3. **Quick tools drawer** (maps, weather, aurora, emergency, contacts)
4. **Sticky “Now / Next” panel** (shows the current moment + next upcoming item)

### Navigation
- **Timeline bar**: horizontally scrollable day chips (Mon–Sat), with:
  - day label + date
  - a tiny status marker (today / completed / upcoming)
  - tap → jump to that day section
- **Secondary nav** (optional): icons for “Plan”, “Maps”, “Checklist”, “Weather”, “Aurora”

---

## Key Pages / Sections

### 1) Home (Dashboard)
- **Now / Next**
  - current local time
  - next event title
  - time until next event
  - “tap to open details”
- **At-a-glance cards**
  - today’s travel legs (if any)
  - accommodation name + check-in/out times
  - critical alerts (e.g., “cash needed”, “early start”)
- **One-tap actions**
  - open map to current base
  - open weather for current base
  - open aurora forecast (if relevant)
  - open “tickets / bookings” links

### 2) Day Pages (or Day Sections on One Page)
Each day is a **timeline list**:

**Event row structure**
- left: time (and optionally home time beneath)
- centre: event title + short note
- right: action buttons:
  - **Map**
  - **Ticket**
  - **Call**
  - **Website**
- expandable details: seat/coach, platform, address, confirmation notes

**Day header**
- sunrise/sunset (local)
- “best daylight window” hint
- quick notes (e.g., “big shop day”, “laundry”, “travel day”)

### 3) Bookings & Documents
- separate cards for:
  - accommodation(s)
  - trains/buses
  - flights
  - tours/activities (if any)
- each card includes:
  - key times
  - address
  - contact / phone tap link
  - policy notes (e.g., payment method, check-in method)
  - **buttons** for map / booking page / PDF ticket

### 4) Maps Hub
A dedicated page of “tap-to-open” map links:
- base accommodation
- station(s)
- airport(s)
- supermarket(s)
- pharmacy
- “best dark spot / aurora spot” suggestions
- custom saved pins
Include:
- “open in Google Maps” buttons
- copy-to-clipboard addresses
- optional “walking / public transport” preset links

### 5) Checklist (Packing + Daily Carry)
A **tick-box system stored locally** (no login), split into:

**Packing checklist**
- base layers / mid layers / outerwear
- footwear
- gloves/hat/face
- electronics
- toiletries
- documents
- camera kit (optional)

**Daily carry checklist**
- power bank
- chargers
- wallet/cash
- tickets
- head torch
- water/snacks

**Checklist features**
- “select all in section”
- “reset section”
- “export as text” (for sharing)
- “show missing items only” toggle

### 6) Weather
- embed or link to a **trusted forecast source** for:
  - base location
  - travel-day locations
- show:
  - temperature
  - wind
  - precipitation
  - **hourly cloud cover** (important for night viewing)
- include “what to trust” short note:
  - cloud cover is decisive
  - wind chill guidance

### 7) Aurora / Night Sky
A quick-reference page that:
- prioritises **cloud cover first**
- includes:
  - links to aurora oval/forecast sources
  - a simple “if/then” routine:
    - if cloudy → sleep / relocate
    - if clear → check outside every hour
- practical kit reminder:
  - red light
  - battery strategy (cold drains)
  - basic camera tips (optional, short)

### 8) Local Food & Shopping
- a page designed for “what do we buy and where”
- sections:
  - “one big shop essentials”
  - “easy chalet meals”
  - “snacks for late nights”
- include:
  - pinned supermarket links
  - note about opening hours risk (Sunday/holidays)
  - “grab-and-go” options

### 9) Emergency / Practical
- medical/pharmacy links
- local emergency numbers
- taxi numbers / ride apps used locally
- address of accommodation in copy-ready format
- a tiny “what to say” panel (address + country + postcode)

---

## UI Features (Must-Haves)
- **Sticky timeline bar** at the top
- **Search** across events, bookings, addresses
- **One-tap links**: map / call / tickets / websites
- **Copy buttons** for key addresses and booking refs
- **Time-zone toggle** (Local / Home / Both)
- **Dark mode** (ideal for night checking)
- **Big typography** and generous spacing (gloves + cold fingers)

---

## Data Model (Suggested)
- `trip.meta`: travellers, time zones, base locations
- `days[]`: date, location, sunrise/sunset, notes
- `events[]`: start/end, title, type, location, links, tags
- `bookings[]`: category, provider, confirmation, links, contacts
- `checklist[]`: sections with items + default state

---

## Technical Requirements
- Static build (Astro / Next static export / plain HTML)
- No backend required
- Local storage for checklist + “completed” markers
- Service worker caching for offline
- Fast Lighthouse score target (mobile)
- Accessibility: ARIA labels for buttons, high contrast, keyboard navigable

---

## Acceptance Criteria
- A traveller can:
  - find today’s next movement in under 5 seconds
  - open the correct map in 1 tap
  - confirm what’s packed via checkboxes
  - view key times without scrolling through paragraphs
  - use the site in low light without blasting brightness
  - access the essentials even without signal
# User-provided custom instructions

Q&m refers to question and marking rooms
