# Aurora
Lapland

## Live Weather + Aurora dashboard

Add a dashboard to any day section by including the placeholder:

```html
<div class="live-dashboard" data-day="2026-01-19"></div>
```

To change the default accommodation coordinates, edit the `DEFAULT_LOCATION` object in `assets/js/aurora-dashboard.js`.

Cache TTLs:
- Weather: 10 minutes
- Kp observed/forecast: 5 minutes
