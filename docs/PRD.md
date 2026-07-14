# PRD — MakeDreamHomes Mobile (Phase 1)

**Product:** MakeDreamHomes mobile app (`MakeDreamHomesApp`)
**Stack:** Ionic React 8 + Vite 5 + Capacitor 8 (TypeScript)
**Backend:** existing NestJS API (`/app/*`), reused as-is — no new endpoints
**Status:** Draft for sign-off — implementation begins after approval
**Scope:** the 4 screens in the provided designs, plus shared chrome

---

## 1. Goal & scope

Replicate, on mobile, the four designed screens using the **same backend APIs** the web app already calls. Layout and visuals follow the mockups; data contracts follow the web implementation exactly (traced below).

**In scope (Phase 1) — "work on these first":**

| #   | Screen                      | Design | Route                          |
| --- | --------------------------- | ------ | ------------------------------ |
| 1   | **Home**                    | img 4  | `/home`                        |
| 2   | **Professionals** directory | img 2  | `/professionals`               |
| 3   | **Leads** (Latest Leads)    | img 3  | `/leads`                       |
| 4   | **Professional detail**     | img 1  | `/professionals/:slug`         |
| —   | Shared chrome               | all    | header, tab bar, search, cards |

**Out of scope (Phase 1), stubbed or deferred:**

- **Requirement** tab (center "+") → placeholder screen; full post-requirement form is a later phase.
- **Profile** tab → placeholder; needs full OTP auth.
- Hamburger side-menu contents, notifications screen, language switching UI (selector renders but is display-only in P1).
- Write-a-review flow (button may be hidden in P1).

**Auth in Phase 1:** all four screens' _content_ is **public** (no token needed). Only the **heart/save toggle** requires login. **Decided:** in P1 the heart triggers a lightweight "login required" prompt; the full OTP login flow (`otp/request·login·register`) is a fast-follow.

---

## 2. Architecture

### 2.1 API client (`src/lib/api/`)

- **Base URL:** `VITE_API_URL` env var, default `http://localhost:8080/api/v1`. All calls hit `{BASE}/app/...`.
  - ⚠️ On a real device, `localhost` = the device. Set `VITE_API_URL` to the LAN IP or deployed URL for device testing.
- **Response envelope:** `{ success, message, data, errors }`; pagination in `meta` (`meta.total`, `meta.totalPages`, `meta.counts`). Mirrors web `lib/api/client.ts`.
- **Auth:** Bearer token from storage on `auth:true` calls; on 401 refresh once via `POST /app/auth/refresh`, then retry. Token store = Capacitor Preferences (falls back to `localStorage` on web).
- **Image resolution:** `assetUrl(key)` — absolute URLs pass through; relative keys get `VITE_STORAGE_PUBLIC_URL` (default `http://localhost:8080/`) prefixed. Card avatars + portfolio thumbnails use it; the **detail header image is already absolute** (use raw, per web `profile-header.tsx:23`).
- **Geo context:** optional `lat`/`lng`/`radius` read from stored location (P1: may be empty → omitted from queries).

### 2.2 Navigation — `IonTabs`

Bottom tab bar with 5 items (matches design, icons per mockup):

`Home` · `Leads` · **`Requirement` (center +)** · `Professionals` · `Profile`

- `IonReactRouter` + `IonTabs`/`IonTabBar`; each tab is an `IonRouterOutlet` stack so detail pages (e.g. professional detail) push over the Professionals tab and keep the tab bar.
- Active tab styling matches design (primary color label + icon).

### 2.3 Shared components (`src/components/`)

| Component                               | Used by                                  | Notes                                                                                                                                                                        |
| --------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AppHeader`                             | all                                      | `IonHeader`/`IonToolbar`: leading menu (☰), title **or** logo, trailing language selector + notification bell. Home shows the logo; others show a page title.               |
| `SearchBar`                             | Home, Professionals, Leads               | "Describe what you need" input + trailing sparkle/AI button. Debounced (400ms), writes the `search` query state. Sparkle button is visual in P1 (hook for future AI search). |
| `CategoryTabs`                          | Home sections, Professionals, Leads      | Pill segmented control. Labels/ids differ per screen (see each spec).                                                                                                        |
| `ProfessionalCard`                      | Home "Find Professionals", Professionals | avatar, category tag, rating+reviews, name, location, "N Active Lead", description, project thumbnails, heart.                                                               |
| `LeadCard`                              | Home "Latest Leads", Leads               | category icon, BUY/SELL badge, title/description, tags, time-ago, location, Est. Price, heart.                                                                               |
| `RatingBreakdown`                       | Professional detail                      | overall score + 4 sub-rows (Quality of Work, Behaviour & Communication, Timeliness, Transparency & Honesty).                                                                 |
| `PortfolioThumb` / `PortfolioCard`      | cards + detail                           | image (`assetUrl`) + title + city.                                                                                                                                           |
| `SaveButton`                            | all cards                                | heart; `entityType` `users`\|`leads`; toggles via API, seeds saved-state; auth-gated.                                                                                        |
| `EmptyState` / `ErrorState` / skeletons | all                                      | loading uses `IonSkeletonText` shimmer matching each card's shape.                                                                                                           |

### 2.4 Data fetching pattern

- Client-side fetch on mount (screens are public). List screens: `IonRefresher` (pull-to-refresh) + `IonInfiniteScroll` (append pages, `limit=10`), reusing the same service function for every page so params match exactly.
- Query state (active tab, search, filters) held in the screen; changing it resets to page 1.

### 2.5 Responsive spec (`html must be responsive`)

Mobile-first; the same code must scale up (Ionic also renders in the browser).

- **Phone (default, ≤767px):** single-column card lists, full-width; bottom tab bar; sticky header + search.
- **Tablet/desktop (Ionic `md` ≥768 / `lg` ≥992):** content container `max-width` centered (~720px for lists, ~960px for Home); card lists become a **2-column** grid via `IonGrid`/CSS `grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))` (Home "Find Professionals" is already 2-col on web).
- Fluid units (`%`, `rem`, `clamp()`), no fixed pixel widths on containers.
- Images: fixed **aspect-ratio** boxes + `object-fit: cover`; thumbnails `max-width:100%`.
- Text clamps: description 3 lines (`-webkit-line-clamp`), title 2 lines.
- Tap targets ≥44px; respect safe-area insets (`env(safe-area-inset-*)`) for notch/home-indicator.
- Verify at 320 / 393 / 768 / 1024 px with no horizontal body scroll.

---

## 3. Screen 1 — Home (`/home`)

**Layout (top→bottom):** AppHeader (logo) → SearchBar → Hero banner ("Hire a professional, buy/sell property or construction material" + **Post Requirement** button + illustration) → **Latest Leads** (section header + "View All" → `/leads`, audience tabs, ≤N lead cards) → **Find Professionals** (section header + "View All" → `/professionals`, category tabs, ≤N pro cards).

**APIs**

| Block                      | Endpoint               | Method | Params                                                                                   | Auth |
| -------------------------- | ---------------------- | ------ | ---------------------------------------------------------------------------------------- | ---- |
| Hero video (optional tile) | `/app/misc/hero-video` | GET    | —                                                                                        | No   |
| Search typeahead           | `/app/search`          | GET    | `q`(≥2), `limit≤20`, `category=all`                                                      | No   |
| Latest Leads               | `/app/leads`           | GET    | `page=1, limit=6, category=<tab>, sortBy=createdAt, sortOrder=DESC`                      | No   |
| Find Professionals         | `/app/users`           | GET    | `userType=<mapped>, page=1, limit=4, sortBy=createdAt, sortOrder=DESC [,lat,lng,radius]` | No   |

- **Leads tabs:** `professional` / `property` / `material` → "For Professionals / For Property / For Materials". Tab id → API `category`.
- **Pros tabs:** `professionals` / `property-dealers` / `material-suppliers` → API `userType` = `professional` / `dealer` / `supplier` (omit for "all").
- **Post Requirement** button → Requirement tab (placeholder in P1).
- **States:** skeletons per section; empty → "No leads/professionals yet"; error → retry.

---

## 4. Screen 2 — Professionals directory (`/professionals`)

**Layout:** AppHeader (title "Professionals") → SearchBar → CategoryTabs (Professionals / Property Dealers / Materials Suppliers) → infinite list of `ProfessionalCard` → floating **Filter** FAB (bottom-right).

**APIs**

| Block              | Endpoint                                                                                                        | Method | Key params                                                                                                                                                                             | Auth |
| ------------------ | --------------------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| Listing            | `/app/users`                                                                                                    | GET    | `userType, page, limit=10, search(≤100), professionalUserType\|productType\|propertyType, city[], locality[], places[], hasReviews, hasPortfolio, sortBy, sortOrder [,lat,lng,radius]` | No   |
| Sub-category chips | `/app/professional-categories` (pros) · `/app/supplier-products` (materials) · static PROPERTY_TYPES (property) | GET    | —                                                                                                                                                                                      | No   |
| Filter facets      | `/app/users/filters`                                                                                            | GET    | `userType, search, sub-type, hasReviews, hasPortfolio` → `{ locations[] }`                                                                                                             | No   |

- **Tab → userType:** `professionals→professional`, `property-dealers→dealer`, `material-suppliers→supplier`.
- **Sort options:** latest (`createdAt DESC`, default), topRated (`overallRating DESC`), experienced (`experience DESC`), nearest (`distance` + `lat/lng`).
- **Card fields:** `profession` (tag), `ratingAverage`+`categoryAverages`+`reviewCount` (hide if 0), `name`→detail, `location`, `description` (3-line), `showcase.items[]` (thumbnails), `leadCount` ("N Active Lead" → `/leads?userId=<encoded>`), heart (`entityType=users`).
- **Pagination:** `limit=10`, infinite scroll; list resets when tab/search/filter changes.
- **States:** card skeletons; empty → "No professionals match"; error → retry.

---

## 5. Screen 3 — Leads (`/leads`)

**Layout:** AppHeader (title "Latest Leads") → SearchBar → CategoryTabs (For Professionals / For Property Dealers / For Materials Suppliers) → infinite list of `LeadCard` → floating **Filter** FAB.

**APIs**

| Block              | Endpoint                  | Method | Key params                                                                                                                                      | Auth |
| ------------------ | ------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| Listing            | `/app/leads`              | GET    | `page, limit=10, category=<tab>, subcategory, search, city[], locality[], places[], sortBy=createdAt, sortOrder=DESC [,lat,lng,radius], userId` | No   |
| Filter facets      | `/app/leads/filters`      | GET    | `category, subcategory, search` → `LocationFilter[]`                                                                                            | No   |
| Sub-category chips | same sources as directory | GET    | —                                                                                                                                               | No   |

- **Tabs:** `professional` / `property` / `material` → API `category`.
- **Card fields:** BUY/SELL badge (derived from `category` `buy_*`/`sell_*`), category icon, `description` (title, 3-line + "Read more"), `tags[]` (first 5 + "+N", e.g. Residential/Flat), `relativeTimeFromDate(createdAt)` ("2h ago"), `location`, `formatBudget(budget)` (Est. Price, Indian Cr/L/K), optional `images[]`, heart (`entityType=leads`).
- `Lead` shape: `{ id, category, tagKey?, location, description, postedBy, createdAt, tags[], summary?, budget?, status?, images[] }`.
- **Filter:** locality only (no hasReviews/hasPortfolio for leads).
- **States:** card skeletons; empty → "No requirements yet"; error → retry.

---

## 6. Screen 4 — Professional detail (`/professionals/:slug`)

**Slug:** URL-safe base64 (`-`→`+`, `_`→`/`, re-pad, decode) → numeric id. Built via `encodeProfessionalId` on the card links.

**Layout:** AppHeader (title = pro name) → Profile card (photo, category tag, name, Location, About, heart) → **Portfolio** (project cards: image + title + city) → **Rating & Reviews** (overall score + 4-row breakdown).

**APIs**

| Block                             | Endpoint                   | Method | Params                                                   | Auth |
| --------------------------------- | -------------------------- | ------ | -------------------------------------------------------- | ---- |
| Profile                           | `/app/users/{id}`          | GET    | id (decoded slug); returns `ProfessionalDetail` verbatim | No   |
| Similar (optional footer)         | `/app/users/{id}/similar`  | GET    | —                                                        | No   |
| Review status (write-review gate) | `/app/reviews/status/{id}` | GET    | Bearer                                                   | Yes  |
| Submit review (deferred P1)       | `/app/reviews`             | POST   | `reviewForId + 4 scores + comment`                       | Yes  |

- **`ProfessionalDetail` fields:** `id, name, profession, location, image, about[], portfolio[], reviewsRating, reviewsCount, reviewsBreakdown{average, qualityOfWork, behaviourCommunication, timeliness, transparencyHonesty}, experienceYears, showcase, categoryAverages`.
- **Header:** photo ← `image` (raw), tag ← `profession`, name, location, `about[]` paragraphs, heart (`entityType=users`). _(Web shows Send Message + Write Review here; the mockup shows a heart — P1 uses the heart; message/review buttons are a later phase.)_
- **Portfolio:** render only if `portfolio.length>0`; per card image ← `assetUrl(item.image)`, title ← `item.title`, city ← `item.city`.
- **Rating & Reviews:** render only if `reviewsCount>0` & `reviewsBreakdown!=null`; overall ← `reviewsBreakdown.average` + `reviewsCount`; 4 rows ← breakdown keys with labels Quality of Work / Behaviour & Communication / Timeliness / Transparency & Honesty.
- **States:** header skeleton; `notFound` → "Professional not found"; portfolio/reviews sections hidden when empty.

---

## 7. Shared endpoints (cards & save)

| Purpose                  | Endpoint                                       | Method | Params                                     | Auth |
| ------------------------ | ---------------------------------------------- | ------ | ------------------------------------------ | ---- |
| Seed saved ids           | `/app/shortlists/my-ids`                       | GET    | `entityType=users\|leads`                  | Yes  |
| Toggle save              | `/app/shortlists/toggle`                       | POST   | `{ entityType, entityId }` → `{ isSaved }` | Yes  |
| Cities (geo)             | `/app/locations/cities`                        | GET    | —                                          | No   |
| Languages / translations | `/app/languages`, `/app/translations/{locale}` | GET    | —                                          | No   |

---

## 8. Proposed folder structure (mobile)

```
src/
  lib/api/          client.ts, professionals.ts, leads.ts, misc.ts, shortlists.ts, search.ts
  lib/              asset.ts, format.ts (budget, relative-time), auth/session.ts
  types/            index.ts (Lead, ProfessionalListing, ProfessionalDetail, ...)
  components/
    layout/         AppHeader, TabsShell
    common/         SearchBar, CategoryTabs, SaveButton, EmptyState, skeletons
    cards/          ProfessionalCard, LeadCard, PortfolioCard, RatingBreakdown
  pages/
    Home.tsx  Professionals.tsx  Leads.tsx  ProfessionalDetail.tsx
    Requirement.tsx (placeholder)  Profile.tsx (placeholder)
  theme/            variables.css (brand colors from designs)
```

## 9. Decisions & remaining questions

**Locked (confirmed with stakeholder):**

1. ✅ **Heart/save in P1** — gate with a lightweight "login required" prompt; full OTP login is a fast-follow.
2. ✅ **Search "sparkle" button** — plain text search in P1 (like web); sparkle is visual-only, reserved for future AI/NL search.

**Still open (will default unless you say otherwise):** 3. **Brand colors/fonts** — default: pull exact hex/tokens from the web theme. 4. **Home section limits** — default: keep web's `limit=6` leads / `limit=4` pros.

## 10. Non-goals / risks

- No new backend endpoints; if a field the design needs isn't in the API response, it's flagged as a backend follow-up.
- Device `localhost` caveat (§2.1) — needs a reachable `VITE_API_URL` for on-device testing.
- Skeleton loaders must be kept in sync with any card layout change (repo rule).

## 11. Delivery plan (after sign-off)

1. Scaffolding: API client, token store, `assetUrl`/`format` utils, types, `TabsShell` + routes, `theme/variables.css`.
2. Shared components: `AppHeader`, `SearchBar`, `CategoryTabs`, `SaveButton`, `ProfessionalCard`, `LeadCard`, `RatingBreakdown`, skeletons.
3. Screens in order: Professionals → Leads → Professional detail → Home (Home reuses the card components).
4. Responsive pass + `qlty check`/`npm run build` green + on-device smoke test.
