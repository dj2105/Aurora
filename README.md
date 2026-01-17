# Aurora
Lapland

## Updating trip data

Edit the trip content in `assets/data/trip-data.js` (days, bookings, checklist, maps).【F:assets/data/trip-data.js†L1-L164】

## Resetting stored data

Clear these localStorage keys to reset user data:
- `aurora-checklist` (packing checklist state)
- `aurora-outing-gear-v1` (outing gear matrix)
- `aurora-user-items-v1` (user-added events + notes)

## PWA cache versioning

When you need to force a refresh, bump `CACHE_VERSION` in `sw.js`. This will invalidate the old caches on next load.【F:sw.js†L1-L29】

## Testing on iOS Safari

1. Open `https://dj2105.github.io/Aurora/` in Safari.
2. Tap Share → Add to Home Screen.
3. Launch from the Home Screen and confirm offline access by toggling Airplane Mode.

## Live Weather + Aurora dashboard

Add a dashboard to any day section by including the placeholder:

```html
<div class="live-dashboard" data-day="2026-01-19"></div>
```

To change the default accommodation coordinates, edit the `DEFAULT_LOCATION` object in `assets/js/aurora-dashboard.js`.

Cache TTLs:
- Weather: 10 minutes
- Kp observed/forecast: 5 minutes
