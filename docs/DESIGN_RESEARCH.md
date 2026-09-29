# Phase 0: Design Research

This document outlines the findings from analyzing industry-standard digital hotel guidebooks, travel applications, and established design systems. These insights form the foundation for the UI/UX direction of our Hotel Guest Portal.

## 1. Digital Hotel Guidebooks (Touch Stay, Hostfully)
**What they do well:**
* **No-App Barrier:** They rely on PWAs or mobile-optimized web links, eliminating the friction of app store downloads.
* **White-Labeling:** They allow properties to inject their own branding (logos, brand colors, custom fonts).
* **Information Architecture:** Content is strictly categorized (e.g., Practical Info, Food & Drink, Attractions) to prevent overwhelming the user.

**Where they fall short (Opportunities for us):**
* **Performance:** Many feel clunky, resembling older web-views rather than native apps. They often lack smooth transitions.
* **Map Integration:** Maps are sometimes static images or require jumping out to a new tab too early, losing the user context.
* **Modern Aesthetics:** They often suffer from outdated visual hierarchy—too many competing styles, small fonts, and low-contrast elements.

## 2. Airbnb & Google Travel (Place Pages)
**Key Patterns to Adopt:**
* **Bottom Sheets (Airbnb):** Mobile map interactions are paired with bottom sheets. Tapping a pin brings up a peek sheet; swiping up expands it to show full details, keeping the map context alive.
* **Sticky Action Bars:** Critical actions ("Directions", "Call") are sticky at the bottom or top of the viewport, ensuring they are always accessible.
* **Horizontal Carousels:** For scanning multiple places quickly, horizontal scrolling cards (with snap-to-align) are preferred over vertical lists, saving vertical space for the map.
* **Scannability (Google Travel):** Highlighting "Open Now / Closed" status in semantic colors (Green/Red) and prominently displaying distance/travel time.

## 3. Design Systems (Material 3 & Apple HIG)
**Bottom Sheets / Sheets:**
* **Apple HIG:** Recommends using sheets for non-blocking tasks. They should have a visible "grabber" (drag handle) and support swipe-to-dismiss. They should dim the background to maintain focus.
* **Material 3:** Emphasizes standard and modal bottom sheets. Full-screen bottom sheets on mobile should include a clear "close" (X) button or back arrow in the top app bar for accessibility when swiping isn't intuitive to all users.

**Chips (Categories):**
* Both systems utilize chips for compact, horizontal categorization.
* Selected states must be immediately obvious (e.g., inverted colors, high-contrast borders).
* Horizontal scroll containers for chips must hide the scrollbar but support smooth momentum scrolling and edge gradients/fade-outs to indicate more content.

## 4. Accessibility (WCAG 2.2 AA)
**Critical Requirements for the Guest Portal:**
* **Tap Targets:** Minimum size of 44x44px for all interactive elements (buttons, chips, map pins, links) to prevent mis-taps.
* **Contrast Ratios:** 
  * Normal text (e.g., place descriptions, hours): Minimum 4.5:1 against the background.
  * Large text (headers) & UI components (icons, borders of inputs): Minimum 3:1.
* **Focus States:** As per WCAG 2.2 updates, focus indicators must be highly visible (e.g., a 2px solid outline with high contrast) for keyboard users.
* **Motion:** The sliding bottom sheets and scroll-spy interactions must respect the `prefers-reduced-motion` media query, falling back to instant transitions if requested by the user's OS.
* **Semantic HTML:** Use proper heading hierarchy (`h1` for hotel, `h2` for categories, `h3` for places) and ARIA labels for icon-only buttons (like the close button on a sheet).

## Conclusion & Recommendations
We will build a mobile-first, native-feeling web app. We will avoid the visual clutter of legacy systems by using a restrained color palette (light theme default, high contrast), employing Airbnb-style bottom sheets for place details to maintain map context, and strictly adhering to WCAG 2.2 AA for a frustration-free guest experience.
