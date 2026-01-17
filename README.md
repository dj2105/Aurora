# Aurora
Lapland

## Updating trip data

Edit the trip content in `assets/data/trip-data.js` (days, bookings, checklist, maps).【F:assets/data/trip-data.js†L1-L164】

## Resetting stored data

Clear these localStorage keys to reset user data:
- `aurora-checklist` (packing checklist state)
- `aurora-outing-gear-v1` (outing gear matrix)
- `aurora-pills-v1` (daily pills tracker per day)
- `aurora-user-items-v1` (user-added events + notes)
- `aurora-copy-phrases-v1` (copy phrases panel items)

In the UI you can also use the "Reset today" / "Reset all" buttons in the pills panel and the reset buttons in Outing Gear to clear local data quickly.

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

## Optional Firestore sync (anonymous auth + trip code)

This app is static and works offline by default. Optional cloud sync can be enabled using Firebase (no backend server required).

## Copy phrases panel

The Copy phrases panel provides quick copy buttons for addresses, transport identifiers, and essentials. It supports add/edit/delete for custom items, filters by category, and includes a search box. Phrases are stored locally for offline use and queued for sync when Firestore is enabled. Local edits are merged by item id with tombstone deletions, so removing a custom item persists across devices. The sync payload lives in the Firestore document `trips/{tripCode}/state/global` under `copyPhrases.items`.【F:assets/js/sync.js†L61-L167】

### Setup steps
1. Create a Firebase project and enable **Anonymous Authentication**.
2. Create a Firestore database in production mode.
3. Add your Firebase config in `firebase-config.js` (or provide the values as `<meta>` tags in `index.html`).
4. Deploy the Firestore rules below.
5. Reload the app, toggle “Sync across devices”, and create a new trip code.

### Firestore rules (firestore.rules)
```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }

    function isMember(tripCode) {
      return exists(/databases/$(database)/documents/trips/$(tripCode)/members/$(request.auth.uid));
    }

    match /trips/{tripCode} {
      allow create: if isSignedIn();
      allow read, update: if isSignedIn() && isMember(tripCode);

      match /state/{docId} {
        allow read, write: if isSignedIn() && isMember(tripCode);
      }

      match /members/{memberId} {
        allow read: if isSignedIn() && request.auth.uid == memberId;
        allow create: if isSignedIn()
          && request.auth.uid == memberId
          && get(/databases/$(database)/documents/trips/$(tripCode)).data.joinToken
             == request.resource.data.joinToken;
      }
    }
  }
}
```

### Firebase config example
```js
window.AURORA_FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```
