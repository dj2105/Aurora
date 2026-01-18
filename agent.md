# agent.md — Aurora Trip Standalone Site

## Overview
- The site is a **single-file, standalone** experience (`index.html`) with all CSS/JS inline.
- The page is mobile-first and designed for quick, at-a-glance trip reference.

## Key Areas in `index.html`
- **Styles**: Inline `<style>` in the `<head>`.
- **Trip data**: The `days` array inside the `<script>` block.
- **Weather + aurora data**: `fetchWeather()` uses Open-Meteo + NOAA KP index.
- **Aurora link**: `AURORA_FORECAST_URL` constant and the dashboard link (`#aurora-forecast-link`).
- **Add event modal**: Controlled by the modal overlay + `openModal`/`closeModal` handlers.

## Editing Tips
- When adding new links, prefer **specific destination URLs** (e.g., direct map queries).
- Keep all new UI changes inside `index.html` to preserve the standalone format.
- Update the `days` array for schedule changes; event links appear under each event card.

## Housekeeping
- Legacy files are archived in `/old` for reference only.
- No build step: open `index.html` directly or serve locally for testing.
