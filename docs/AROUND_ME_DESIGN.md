### Mobile (under 768px) — top priority
Order top to bottom:
1. **Hotel header (about 168px)**: name, tagline, rating, three 44px buttons: Call, Route, Wi-Fi. Collapses to a 56px sticky bar with just the name on scroll.
2. **Map card (132px)** with the hotel pin and place pins, and a **Map | List toggle**. In Map mode the map fills the screen and a draggable bottom sheet (peek / half / full) lists nearby places sorted by distance; tapping a card highlights its pin and vice versa. In List mode the sections below show.
3. **Sticky category chips with counts** ("Attractions 10", "Shopping 5", "Transport 4", "Hospitals 5", "Tech Parks 3"). Tapping scrolls to that section; the active chip follows scrolling. Empty categories are hidden.
4. **Attractions**: horizontal snap-scroll cards, about 156px wide, so the third card peeks and shows there is more. Card: photo 84px, name (max 2 lines), "1.5 km · 5 min drive", Open/Closes-soon/Closed badge.
5. **Shopping, Transport, Hospitals, Tech Parks**: compact list rows, 56px each: 40px thumbnail, name, one meta line ("Mall · Open till 10 PM"), distance on the right. Show 3 rows then "See all N".
6. **Bottom bar (56px)**: Emergency numbers, Language.
"See all" opens a full-height sheet with search, sort (nearest / open now) and filter chips.

### Place detail (mobile full-height sheet, desktop side panel or modal)
Photo gallery with counter, category tag, name, Open-now badge with closing time, three tiles (Distance, Drive, Walk), mini-map with the route line from the hotel, hours (all days, closed days shown), address, phone, website, description. **Sticky bottom bar: "Directions from hotel" (primary), Call (if phone), Share.** Close by swipe, an X button and the browser Back button.

### Tablet (768 to 1279px)
Top row: hotel hero (left half) and map (right half), 280px high. Below: Attractions strip across the full width, then a 2-column grid of Shopping, Transport, Hospitals, Tech Parks panels. Same cards and rows as mobile.

### Desktop (1280px and up), one screen with no page scroll at 1440×900
3-column grid: 340px | flexible | 340px, and 3 rows.
- **Top row, full width:** Attractions strip (about 6 cards visible, arrows to scroll).
- **Middle-left:** Shopping and Malls list. **Middle-centre:** hotel hero on top (60%) with the map underneath (40%), pins clickable. **Middle-right:** Transport hubs list.
- **Bottom row:** Hospitals (2/3 width) and Tech Parks (1/3 width) strips.
- Each panel scrolls inside itself; the page itself does not scroll. Below 720px height, fall back to the tablet layout.

### Density and quality rules
- Text: 12px minimum (meta only), 14px body, 16 to 24px headings; names max 2 lines, meta 1 line; never cut a name to nothing.
- Tap targets at least 44px on mobile; rows 56 to 60px; cards 156 to 220px wide; 8px grid; 12px radius; one card style and one row style everywhere.
- Light theme by default, warm off-white `#F6F3EE`, surface white, text `#1C1B1A`, muted `#5C5A55`, border `#E4DFD6`, brand per hotel (default deep teal `#0E5A5A`). Status: Open green `#0F6B37` on `#E3F4EA`, Closes soon amber `#8A5A00` on `#FFF1D6`, Closed red `#B42318` on `#FDECEA`. Colour is never the only signal (badges carry text). Dark theme optional via `prefers-color-scheme`.
- One icon set (Lucide), used only where it labels something. No emoji. Font: Plus Jakarta Sans (UI). Optional display serif for the hotel name only.
- Images: lazy, WebP, fixed aspect ratios, skeletons while loading, neutral category placeholder when a place has no photo. Never hotlink photos.
- Hours and "open now" are computed from real data in the property's timezone.

### Admin dashboards (compact, same system)
Desktop: 240px sidebar (collapses to icons at 1024px), 56px top bar with search, tables 44px rows, forms in a right-side sheet instead of new pages, sticky "Save" bar, tabs for the property editor (Details, Gallery, Nearby Places, QR, Preview). Mobile: sidebar becomes a bottom tab bar (Dashboard, Properties, Places, QR, More); tables become cards; forms full-screen. Every list has loading, empty and error states; destructive actions ask for confirmation; forms show errors next to the field. The Nearby Places tab is the most important screen: search and add a place, see its distance/time immediately, drag to reorder, star to feature, remove, and a live guest preview beside it.
