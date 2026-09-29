You are a senior product team working in this folder: Product Architect, Cloud/Backend Engineer, Frontend Engineer, UI/UX Designer, Security Engineer and QA. I am a beginner at backend and cloud work, so explain decisions briefly, automate everything you can, and never leave me with a half-working system.

## Read first
- docs/AUDIT.md (audit of the old code in ./legacy — it is NOT to be extended; its login was fake, its routes were unauthenticated, it had no tenant separation and it stored guest data in the admin's browser)
- docs/reference/ (screenshot of the old desktop layout — the layout idea is good, the visual design is bad)
- This whole brief.

## What we are building
A multi-tenant SaaS for hotels and restaurants ("clients"). Each client gets its own admin panel and can have one or many properties (Taj = one client with many hotels; a local lodge = one client with one property). Each property gets its own QR code. A guest scans it on their phone (no app install, no login) and sees a curated "around you" guide for THAT property: attractions, shopping/malls, transport hubs, hospitals, tech parks. Every place shows distance, travel time, opening hours and a route from that hotel, plus an "Open in Google Maps" button.

## Roles
1. Super Admin (us): manages all clients, plans, sees everything, can "view as" a client (always audit-logged).
2. Client Admin: belongs to exactly ONE organization; can only see and edit that organization's data. It must be impossible to read or write another organization's data, even by hand-editing API calls.
3. Guest: no login; reads only PUBLISHED data for one property.

## Hard rules (never violate)
- NO fake login, NO hardcoded credentials, NO auth bypass "for development", NO fallback sessions. Use real authentication in every environment.
- The organization/tenant is ALWAYS taken from the verified token on the server, never from the request body, URL or query.
- Guest data comes from the server by property slug, never from browser storage.
- Do NOT port booking, chauffeur, payment, gym/pharmacy screens or any code from ./legacy. Do NOT show competing hotels or dining to guests. Bottom strip = Hospitals and Tech Parks.
- No secrets in the repo. .env.example only. Never put any secret in browser code.
- Do not claim anything works unless you ran it. Show evidence (test output, screenshots).

## AWS stack (company requirement: AWS only, S3 for media)
- Region: ap-south-1 (Mumbai) unless I say otherwise.
- Auth: Amazon Cognito user pool. Groups: super_admin, client_admin. Custom attribute for organization id. Sessions in httpOnly secure cookies, not localStorage.
- Database: Amazon RDS for PostgreSQL. Multi-tenant with organization_id on every tenant table AND Postgres Row Level Security as a second safety layer (API sets the org and role per transaction; the app's DB user must not be able to bypass RLS).
- API: Node.js + TypeScript (Fastify), Zod validation on every input, running on ECS Fargate behind an Application Load Balancer. Before committing, verify current AWS service availability and pricing for the services you choose and tell me the monthly cost estimate; propose a cheaper option if there is one.
- Web: Next.js (App Router) + TypeScript + Tailwind CSS. One app with three areas: guest (/h/[slug]), client admin (/admin), super admin (/super). Deploy on AWS Amplify Hosting (or ECS if Amplify cannot do what we need).
- Media: S3 private bucket + CloudFront. Admins upload with short-lived presigned URLs; allow-list image types, size limit, generate resized WebP variants.
- Edge and caching: CloudFront in front of the guest API/pages with short TTL so QR scans do not hit the database every time. AWS WAF with rate limiting on login and public endpoints.
- Secrets: AWS Secrets Manager / SSM Parameter Store. Email invites: Amazon SES. Logs and alarms: CloudWatch.
- Infrastructure as code: AWS CDK in TypeScript (infra/ folder) so the whole environment can be recreated with one command.
- Maps and places: put Google Maps Platform (Places, Routes, Maps JS) behind an internal adapter interface so Amazon Location Service or OpenStreetMap can replace it later. Keep Google keys server-side wherever possible; restrict the browser map key by referrer and API. Precompute distance and travel time when an admin links a place to a property, store it in the database, and never call the Routes API on guest page views.
- Local development: docker-compose with PostgreSQL and LocalStack (S3) so I can run most things without spending on AWS. Authentication still uses a real dev Cognito user pool deployed by CDK.
- Repo layout: monorepo (pnpm workspaces): apps/web, apps/api, packages/shared (Zod schemas and types), infra/, docs/. Keep files small (no file over about 300 lines), typed, linted, and tested.

## Data model (PostgreSQL)
organizations(id, name, slug, plan, status, brand_primary_color, logo_key)
users(id, cognito_sub, email, role: super_admin|client_admin, organization_id nullable for super admin)
properties(id, organization_id, name, slug unique, tagline, description, address, lat, lng, phone, whatsapp, wifi_name, wifi_password, show_wifi, cover_key, gallery_keys[], status draft|published)
place_categories(id, key: attractions|shopping|transport|hospitals|tech_parks|custom, label, icon_key, sort_order)
places(id, organization_id, category_id, name, description, address, lat, lng, phone, website, google_place_id, hours jsonb, image_keys[], tags[])
property_places(property_id, place_id, sort_order, featured, distance_m, duration_walk_s, duration_drive_s, computed_at)
qr_codes(id, property_id, short_code unique, label, style jsonb, created_at)
scan_events(id, qr_code_id, property_id, scanned_at, device_type, language) — no personal data
audit_log(id, actor_user_id, action, target_type, target_id, organization_id, metadata jsonb, created_at)
plans(id, name, max_properties, max_places, max_qr_variants)
Every tenant table has RLS policies. Guests read only published properties through restricted views/endpoints.

## Design direction (follow the design brief below exactly)
Mobile first at 360px, then tablet, then desktop bento grid. Light theme by default with a tested dark mode, WCAG 2.2 AA, 44px tap targets, one card style, one icon family (Lucide), no emoji, no decorative logos, each element earns its place. Per-client logo and brand color. The full design spec is "PART 2 — DESIGN DIRECTION" in docs/PLAN.md — read it and follow it exactly; if the file is missing, stop and ask me for it.

## How to work
Work in phases 0 to 7 (listed below). For every phase: (1) write a short plan, (2) implement, (3) run it and run the tests, (4) take screenshots at 360, 390, 768 and 1280px where UI is involved, (5) fix what you find, (6) commit, (7) report: what was built, what you verified with evidence, what is still open, and exact commands for me to run it. Then STOP and wait for me to say "continue". Do not start the next phase on your own. Ask me only for things you truly cannot decide (AWS account access, domain name, pricing plan limits, launch languages); otherwise pick a sensible default, state it, and continue.

PHASES
0. Design research (docs/DESIGN_RESEARCH.md): digital hotel guidebooks (Touch Stay, Hostfully), Airbnb/Google Travel place pages, Material 3 / Apple HIG bottom sheets and chips, WCAG 2.2 AA. Findings only, no app code.
1. Foundation: monorepo, docker-compose, CDK stack for Cognito, S3+CloudFront, RDS; Postgres migrations and RLS; seed data (1 super admin, 2 organizations — a 3-property chain and a single local hotel — realistic places around Mysuru and Bengaluru in all five categories); automated tenant-isolation tests (Client A must fail to read, update or delete Client B's rows at both API and database level); README a beginner can follow; CI (lint, typecheck, tests).
2. Design system: tokens, per-client theming with contrast checks, components (Button, Chip, Badge Open/Closed/Closing soon, PlaceCard, BottomSheet, Tabs, Table, Dialog, Toast, Skeleton, EmptyState, Inputs), light/dark, axe-core clean.
3. Guest portal /h/[slug] (HIGHEST PRIORITY): hero, sticky action bar (Call, Directions, Wi-Fi), map card, sticky scroll-spy category chips, horizontal carousels, place detail as bottom sheet on mobile and side panel on desktop with Open-now badge, hours, distance/time from the hotel, route map and Open in Google Maps; emergency strip; language switcher scaffold; skeletons, empty and error states. Lighthouse mobile performance >= 90, accessibility >= 95; no horizontal scroll at 360px.
4. Client admin /admin: Cognito login, dashboard, property CRUD with tabbed editor and live guest preview, gallery upload to S3, places manager with Google Places autocomplete (auto-fill address, coordinates, hours, phone), category assignment, drag-reorder, copy places from one property to another, branding (logo, color), team invites via SES, plan limits enforced on the server.
5. Super admin /super: clients list and creation (invite first client admin), suspend/reactivate, plans, all-properties overview, platform analytics, audit-log viewer, "View as client" with a persistent banner and audit entries; suspended clients' guest pages show a friendly unavailable page.
6. QR studio: per-property QR variants (lobby, room, restaurant); qr-code-styling with logo, dot style and color; error correction H; contrast/scan-safety warnings; permanent short redirect /q/[code] that records a scan event then redirects; exports PNG, SVG, print-ready PDF (table tent and A5); automated test that decodes the exported QR.
7. Hardening and launch: end-to-end tests for all three roles, RLS tests, axe, Lighthouse, WAF rules, security headers, rate limits, CloudWatch alarms, backups, privacy note, Open Graph metadata, CDK deployment to a real AWS account, docs/HANDOVER.md (run, deploy, add a client, rotate secrets, monthly cost estimate).

# PART 1 — DECISIONS EXPLAINED (for you, not for Antigravity)

**Why Postgres and not MongoDB?** Your data is naturally relational (organization → properties → places). Postgres lets us add a second safety net (Row Level Security), so even a coding mistake in the API cannot leak one client's data to another. That is your most important business rule. MongoDB could work but only relies on code being right.

**Why Cognito?** It is AWS's managed login service. It handles passwords, reset flows and tokens so we never write our own (the old repo's biggest failure). Groups give us the two admin roles.

**Why an "adapter" for maps?** Google gives the best place data in India but costs money at scale. The adapter lets you switch to Amazon Location Service later without rewriting the app.

**Costs.** Fargate, RDS, ALB and NAT gateways have fixed monthly costs even with zero traffic. That's why Phase 1 makes Antigravity verify current pricing and give an estimate, and why local development uses Docker so you don't pay while building. I have not priced this myself, so check the estimate it produces.

**Things you still need to arrange:** an AWS account (with billing alerts set), a Google Maps Platform billing account, a domain name (short is better for QR codes), and the pricing-plan limits.

# PART 2 — DESIGN DIRECTION

## Problems in the current screenshot (fix all)
1. Near-black background with low-contrast grey text: fails WCAG AA (needs 4.5:1 for body text).
2. Text is tiny (10 to 11px) and truncated everywhere ("Sacred Hilltop & Monolithic Nand...").
3. Overlapping badges on photos cover the images; too many pills, icons and gold borders competing.
4. Every section has a different card style, so there is no hierarchy; the eye has no entry point.
5. Serif display type, gold accents, glow effects and emoji-style icons read as decoration, not information.
6. Desktop-only proportions; no phone layout.
7. Dining and other hotels shown, which works against the hotel paying for the product.

## Design principles
- **Hierarchy first**: the hotel is the hero. Everything else supports it.
- **Every element earns its place**: an icon appears only if it labels something or aids scanning. One icon family (Lucide), one stroke weight, no emoji, no decorative logos.
- **Light theme by default** (guests use phones in daylight and lobbies), with a tested dark mode via `prefers-color-scheme`.
- **Content is the visual**: real photos, generous whitespace, one card style.
- **Per-client branding**: each organization sets a logo and one primary color; the UI derives accessible tints from it. The platform's own brand stays out of the guest view except a small "Powered by" footer.
- **Accessibility**: WCAG 2.2 AA, 44×44px minimum tap targets, visible focus states, respects reduced motion, semantic HTML, alt text on all images.

## Tokens
- **Type**: one sans family for UI (Inter or Plus Jakarta Sans) plus one restrained display face for hotel names only (e.g. Fraunces or DM Serif Display). Scale: 12, 14, 16 (body minimum on mobile), 20, 24, 32, 44.
- **Spacing**: 4px base, 8px grid. **Radius**: 12px cards, 999px chips. **Elevation**: one soft shadow level plus 1px borders.
- **Neutral palette**: warm off-white background `#FAF8F5`, surface `#FFFFFF`, text `#1B1B1F`, muted text `#5B5B66` (verify contrast), border `#E7E3DC`. Brand color is per client; default deep teal `#0F5C5C`. Semantic: green for Open, red for Closed, amber for closing soon.
- **Motion**: 150 to 250ms ease-out, only for state changes (sheet opening, chip selection).

## Mobile layout (priority)
Single column, top to bottom:
1. Hotel hero: cover image, logo, name, tagline, rating if the owner enables it.
2. Sticky action bar: Call, Directions, Wi-Fi.
3. Map card: hotel pin, tap to expand to full screen.
4. Sticky horizontal category chips: Attractions, Shopping, Transport, Hospitals, Tech Parks (scroll-spy highlights the current section).
5. Per-category section: title plus horizontally scrolling cards (about 260px wide), "See all" opens a list.
6. Place detail as a full-height **bottom sheet** (swipe down to close, back button closes it): photos, Open/Closed badge, hours table, distance and time, route map, Directions button.
7. Footer: emergency numbers strip, language switcher, "Powered by".

## Tablet (768px+)
Two-column: hero and map on the left, sticky; categories scroll on the right.

## Desktop (1200px+) bento grid
+----------------------------------------------+
|              ATTRACTIONS (row of 5)           |
+-----------+------------------------+---------+
| SHOPPING  |   HOTEL HERO + GALLERY | TRANSPORT|
| & MALLS   |   MAP with hotel pin   |  HUBS    |
| (list)    |                        | (list)   |
+-----------+------------------------+---------+
|        HOSPITALS        |      TECH PARKS     |
+----------------------------------------------+

Side columns are compact lists (thumbnail, name, distance). Cap visible items at 3 to 4 with "View all". Never truncate a name to fewer than two lines.

## Admin panels
- Left sidebar plus top bar; data tables with search, filters and pagination; forms in side sheets, not separate pages, where possible.
- **Client admin**: Dashboard (scans this week, top places), Properties, Places (search Google Places and auto-fill), QR Codes, Branding, Team, Settings.
- **Super admin**: Clients (create, suspend, plan), Properties overview, Platform analytics, Audit log, "View as client" banner clearly shown while active.
- Property editor uses tabs (Details, Gallery, Nearby Places, QR, Preview); live "Preview as guest" in phone and desktop frames.

## QR design
- Generated per property (and optional variants: lobby, room, restaurant) via `qr-code-styling`.
- Encodes a short, permanent redirect URL (`/q/AB12CD`), never the raw property URL, so the destination can change and scans can be counted.
- Error correction level **H**; logo covers at most about 20% of the area; dark modules on a light background with contrast checked automatically; quiet zone at least 4 modules.
- Client can pick dot style (square, rounded, dots), color and logo; live preview; a scan-test warning if contrast is too low.
- Export: PNG, SVG and print-ready PDF (table tent and A5 card templates with hotel name and a "Scan to explore nearby" line).

## Extra features worth including (all directly relevant)
- Language switcher (English, Hindi, Kannada to start; structure ready for more) since guests are international.
- "Open now" badge and hours from Google Places; "closing soon" warning.
- Emergency strip: nearest hospital plus local emergency numbers.
- Featured / pinned places and drag-to-reorder per property.
- Duplicate a property's nearby places into another property (chains like Taj can set up ten hotels quickly).
- Scan analytics: scans per QR, per day, per language; most-tapped places.
- PWA install prompt is optional; offline caching of the last-viewed guide for poor lobby Wi-Fi.
- Plan limits (number of properties, places, QR variants) enforced server-side.

# PART 3 — WHAT TO CHECK AFTER EACH PHASE (your acceptance checklist)

| Phase | You should be able to... |
|---|---|
| 0 | Read a research doc that names real sources and gives concrete recommendations |
| 1 | Run one command to start everything locally; see tenant-isolation tests pass; no secrets in git |
| 2 | Open a components page and see every component in light and dark with no accessibility errors |
| 3 | Open `/h/<slug>` on your phone, with no horizontal scroll, place details opening as a bottom sheet |
| 4 | Log in as a client admin, create a property, add places by search, publish, and view the guest page |
| 5 | Log in as super admin, create a client, "view as" them, and see it in the audit log |
| 6 | Download a QR with a logo, scan it with your phone camera, land on the right hotel, see the scan counted |
| 7 | See the site live on AWS with a cost estimate and a handover document |
