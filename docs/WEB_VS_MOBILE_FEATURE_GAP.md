# Web → Mobile Feature Gap — Pending Items

**Web app:** `MakeDreamHomes` (Next.js) · **Mobile app:** `MakeDreamHomesApp` (Ionic React + Capacitor)

**Ground rule:** the two apps should have the **same features** — the _only_ intended difference is **design/UX** (Ionic mobile shell vs. Next.js web). This document lists **only what remains**.

**Verified 2026-07-21** by a per-item source audit of `MakeDreamHomesApp/src` against the web components. The ~60 items completed earlier that day (full chat system, reviews list + pagination, 4→5 review categories, requirement-form validation, logout/session, native share, Send-Message wiring) plus **7 more found already implemented in the audit** (`C2`, `D4`, `LD5`, `LC2`, `R20`, `P27`, `A10`) have been removed. Rows below reflect the audited status. Mobile is **TypeScript + ESLint clean**.

**Status legend:** ⛔ **Blocked** (needs a backend/config change) · 🔴 **Missing** · 🟠 **Partial** (exists but reduced/different) · 🟡 **Deferred** (large standalone effort) · ⚪ **Web-only by nature**.

---

## ⛔ Blocked — needs a change elsewhere

| #   | Gap                                         | Blocker                                                                                                                         |
| --- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| P24 | **Edit a posted requirement** (PATCH modal) | API leads controller has **no PATCH route** (only GET / GET-filters / GET-mine / GET-:id / POST). Needs `PATCH /app/leads/:id`. |
| SH1 | **Share link domain**                       | Native share works, but the public web domain defaults to `makedreamhomes.com`. Set `VITE_WEB_URL` to the prod domain.          |

---

## 1. HOME PAGE

| #   | Feature                                                                        | Web                                  | Mobile                                                                                        |
| --- | ------------------------------------------------------------------------------ | ------------------------------------ | --------------------------------------------------------------------------------------------- |
| H1  | Hero background photo + gradient wash                                          | `sections/hero.tsx`                  | 🟠 gradient wash present; no hero **photo** (only the HeroArt illustration in the promo card) |
| H2  | Hero headline copy (comma-split stacked lines)                                 | `hero.tsx`                           | 🟠 single static headline; not comma-split into stacked lines                                 |
| H4  | "Choose a Professional / Dealer / Supplier" paragraph + 3 inline listing links | `hero.tsx`                           | 🟠 paragraph text present; the 3 inline links are missing                                     |
| H5  | Guest-only role-rows card (Professional/Supplier/Dealer + "Join" CTA)          | `hero.tsx` + `guest-content.tsx`     | 🔴 missing (only a single "Post Requirement" CTA, shown regardless of auth)                   |
| H6  | Social rail (fixed Facebook/Instagram)                                         | `hero.tsx`                           | 🔴 missing entirely                                                                           |
| H7  | Decorative dot-grid accent                                                     | `DotGrid`                            | 🔴 missing                                                                                    |
| H8  | **Watch-Video** trigger tile (poster + play + ping ring)                       | `hero-search-bar.tsx`                | 🔴 missing                                                                                    |
| H9  | Watch-Video modal (YouTube/`youtu.be`/embed/shorts/bare-id + direct `<video>`) | `hero-search-bar.tsx`                | 🔴 missing                                                                                    |
| H10 | **How It Works** section (4 role cards, illustrations, numbered steps)         | `sections/how-it-works.tsx`          | 🔴 missing entirely                                                                           |
| H11 | Latest-leads tabs URL-driven + cross-preserve `proCategory`                    | `latest-leads-interactive.tsx`       | 🟠 works via local `useState`; not URL-driven, no cross-preserve                              |
| H14 | Find-professionals tabs cross-preserve `leadCategory` + optimistic pending     | `find-professionals-interactive.tsx` | 🟠 works via local state; no cross-preserve / optimistic                                      |
| H15 | Home strings fully translated                                                  | i18n                                 | 🔴 hard-coded English (see §10)                                                               |
| S6  | Global-search dropdown enter/exit animation + row stagger                      | `hero-search-bar.tsx`                | 🔴 plain conditional render, no framer-motion (cosmetic; search otherwise complete)           |

### 1b. Header / nav / footer / city / language

| #   | Feature                                                                                                   | Web                             | Mobile                                                                                                                                                 |
| --- | --------------------------------------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| N1  | Top nav links (Professionals / Dealers / Suppliers + **New-Leads red ping-dot**)                          | `navigation.ts`, `nav-link.tsx` | 🔴 bottom tab bar only; no dealers/suppliers items, no New-Leads dot                                                                                   |
| N2  | Mobile hamburger drawer (nav + city + language + register + logout)                                       | `mobile-menu.tsx`               | 🔴 no consolidated drawer (pieces scattered across header + login gate)                                                                                |
| N4  | **Footer** (brand, socials, link columns, app-store badges, legal, popular searches/locations, copyright) | `footer.tsx`                    | 🔴 entirely missing                                                                                                                                    |
| C1  | City-select **auto-geolocation on mount** (reverse-geocode → match/persist)                               | `city-select.tsx`               | 🟠 auto-detect at **app** mount, permission-gated (never prompts), matches nearest verified city by distance — no reverse-geocode, not on picker mount |
| C3  | Footer "Popular Locations" chips                                                                          | `popular-locations.tsx`         | 🔴 missing (no footer; the picker's "Popular cities" is a distance list, not footer chips)                                                             |
| L1  | Language options **dynamic from API**                                                                     | `getLanguageOptions()`          | 🔴 hard-coded en/hi/pa array (see §10)                                                                                                                 |
| L2  | Language change → **locale redirect + persist to profile**                                                | `language-toggle.tsx`           | 🔴 sets local state only; no locale switch, no persist (see §10)                                                                                       |

---

## 2. DIRECTORY / LISTINGS + CARDS + FILTERS

### 2a. Screen & controls

| #   | Feature                                                    | Web                     | Mobile                                                                                                                 |
| --- | ---------------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| D2  | Category-tab icons (icon chip + title)                     | `category-tabs.tsx`     | 🔴 label-only pills, no icons                                                                                          |
| D5  | Subcategory **chip row** with "All" chip + "More" overflow | `subcategory-chips.tsx` | 🔴 folded into the filter modal as a single-select group                                                               |
| D6  | Search bar **custom clear (✕)** button                     | `search-bar.tsx`        | 🔴 native clear only, no maxLength                                                                                     |
| D7  | Search bar **"Near Me"** geolocate                         | `search-bar.tsx`        | 🔴 missing (reverse-geocode wired only into AddressAutocomplete/city picker)                                           |
| D8  | Directory-specific placeholder text                        | `page.tsx`              | 🔴 generic "Describe what you need"                                                                                    |
| D9  | Sort as top-right **dropdown**                             | `sort-dropdown.tsx`     | 🔴 sort is a single-select group inside the filter modal                                                               |
| D11 | Auto-geolocation once on mount (directory)                 | `geo-sort.tsx`          | 🟠 runs at **app** mount (permission-gated, nearest-city); distance sort achieved, but not a directory-mount geolocate |

### 2b. Filter richness

| #   | Feature                                              | Web                  | Mobile                                                                  |
| --- | ---------------------------------------------------- | -------------------- | ----------------------------------------------------------------------- |
| F1  | **Brand** multi-select facet (suppliers) with counts | `filter-sidebar.tsx` | 🔴 brand facet not fetched/rendered (`/filters` returns locations only) |
| F2  | **In-group search box** when >8 options              | `filter-sidebar.tsx` | 🔴 missing                                                              |
| F3  | **Collapse cap (6) + "+N more" / "Show less"**       | `filter-sidebar.tsx` | 🔴 all options listed                                                   |
| F4  | Keep selected option visible when collapsed          | `filter-sidebar.tsx` | 🔴 missing                                                              |
| F5  | **FLIP animation** on list changes                   | `use-flip`           | 🔴 missing                                                              |
| F6  | Empty-filters state **+ "Post requirement" CTA**     | `filter-sidebar.tsx` | 🔴 plain "No filters available." text, no CTA                           |

### 2c. Professional / dealer / supplier card

| #    | Feature                                                  | Web                     | Mobile                                                               |
| ---- | -------------------------------------------------------- | ----------------------- | -------------------------------------------------------------------- |
| PC2  | Track badge on the mixed "All" Saved view                | `professional-card.tsx` | 🔴 missing (no "All" tab either)                                     |
| PC3  | **Per-category rating averages** (5 rows)                | `rating-block.tsx`      | 🔴 only composite star; `categoryAverages` parsed but never rendered |
| PC4  | Rating block links to reviews section                    | `rating-block.tsx`      | 🔴 plain text span; whole card links to detail                       |
| PC6  | **Authorized badge (suppliers) + brands tooltip**        | `professional-card.tsx` | 🔴 missing (no brands/authorized fields on the listing type)         |
| PC7  | **RERA badge (dealers) + reraNumber tooltip**            | `professional-card.tsx` | 🔴 missing                                                           |
| PC8  | **Brand logos (suppliers)** — cap 4 + "+N more"          | `brand-logos.tsx`       | 🔴 missing (thumb strip is the showcase, not brand logos)            |
| PC9  | **Product/category chips (suppliers)** under description | `professional-card.tsx` | 🔴 missing                                                           |
| PC11 | Save-flash pulse animation                               | `professional-card.tsx` | 🔴 heart swaps icon/color only, no flash                             |
| PC12 | Active-leads link → detail `#leads`                      | `professional-card.tsx` | 🟠 goes to `leads?userId=` (filtered list) instead                   |

---

## 3. PROFESSIONAL / DEALER / SUPPLIER DETAIL

> **API gap:** the mobile detail path (`getProfessionalDetail`) is an untyped passthrough and the mobile `ProfessionalDetail`/`PortfolioItem` types declare none of `reraNumber` / `isReraCertified` / `brands` / `authorizedBrands` / `categories` — so DT4/DT7/DT8/PC6–PC9 first need these fields captured. (The backend detail response _does_ include them.)

| #    | Feature                                                                                            | Web                            | Mobile                                                                              |
| ---- | -------------------------------------------------------------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------- |
| DT2  | Page `<h1>` "{name} · {profession}" + breadcrumb                                                   | `detail/[...slug]/page.tsx`    | 🟠 name in AppHeader + profession chip + name `<h2>`; no combined h1, no breadcrumb |
| DT3  | Per-track **avatar placeholder image**                                                             | `profile-header.tsx`           | 🔴 initials only, no category placeholder                                           |
| DT4  | **Authorized badge overlay on avatar + tooltip** (suppliers)                                       | `profile-header.tsx`           | 🔴 missing                                                                          |
| DT7  | **Supplier "Categories" card** (per-category brands + authorized-dealer chips)                     | `supplier-categories-card.tsx` | 🔴 missing (not in mobile type/API)                                                 |
| DT8  | Portfolio card: **brand chips + authorized-dealer green shield**                                   | `portfolio-card.tsx`           | 🔴 missing (PortfolioItem has no brands)                                            |
| DT11 | **Active Leads table** on detail (columns, Buy/Sell badge, tags, per-row Send Message, pagination) | `leads-section.tsx`            | 🔴 entirely missing (listing card has a deep-link, detail page has no table)        |
| DT17 | Write-Review: success/**pending-approval** screen                                                  | `review-form.tsx`              | 🔴 closes + central toast only                                                      |
| DT18 | Write-Review: signup-resume persistence (`mdh.pendingReview`)                                      | `write-review-button.tsx`      | 🟠 in-session callback only (works because signup is in-place; not persisted)       |
| DT20 | Similar-professionals **prev/next arrow buttons**                                                  | `similar-professionals.tsx`    | 🟠 swipe/scroll only                                                                |

---

## 4. LEADS LISTING + CARDS + DETAILS MODAL

| #   | Feature                                                                         | Web                                            | Mobile                                                                             |
| --- | ------------------------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------- |
| LD1 | Property groups + subcategory as **chip rows**                                  | `leads/page.tsx`, `subcategory-chips.tsx`      | 🟠 works, but folded into the filter modal (not on-page chip rows)                 |
| LD2 | Sort visible **dropdown**                                                       | `sort-dropdown.tsx`                            | 🟠 works, but inside the filter modal                                              |
| LD3 | Search **clear (✕)** + maxLength + URL write                                    | `search-bar.tsx`                               | 🔴 native clear, no maxLength, doesn't write `?search=`                            |
| LD4 | Search **"Near Me"** geolocate                                                  | `search-bar.tsx`                               | 🔴 missing                                                                         |
| LD6 | Locality filter in-group search + collapse cap                                  | `filter-sidebar.tsx`                           | 🔴 all areas listed flat                                                           |
| LD7 | Empty-filters CTA                                                               | `filter-sidebar.tsx`                           | 🟠 empty message present, "Post requirement" CTA absent                            |
| LC1 | Lead card **track badge** (mixed "All" view)                                    | `lead-card.tsx`                                | 🔴 missing                                                                         |
| LC5 | **Image thumbnails on card** → lightbox                                         | `lead-card.tsx`                                | 🔴 no images on card (only inside the modal)                                       |
| LC7 | Save-flash / card pulse                                                         | `lead-card.tsx`                                | 🔴 missing                                                                         |
| LM1 | Lead details modal: **images open lightbox** (zoom/pan/wheel/arrows/thumb-rail) | `lead-details-modal.tsx` + `PortfolioLightbox` | 🔴 static non-clickable thumbnails                                                 |
| LB1 | Infinite-scroll: explicit retry button + no-JS fallback                         | `leads-infinite-list.tsx`                      | 🟠 initial-load pull-to-refresh only; pagination errors swallowed, no retry button |

---

## 5. POST-REQUIREMENT / REQUIREMENT FORM

| #   | Feature                                                                        | Web                                                     | Mobile                                                                                |
| --- | ------------------------------------------------------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| R1  | **Multi-locality buy-property**: up to **5 chips**                             | `post-requirement-form.tsx`                             | 🔴 single address string only                                                         |
| R2  | **50 km proximity guard** on extra localities                                  | `post-requirement-form.tsx`                             | 🔴 missing                                                                            |
| R3  | **Bias-restricted Places** (follow first pick then freeze)                     | `post-requirement-form.tsx`, `address-autocomplete.tsx` | 🔴 `placeAutocomplete` takes no bias/restrict args                                    |
| R4  | **regionsOnly** Places filter (hide POIs)                                      | `address-autocomplete.tsx`                              | 🔴 missing                                                                            |
| R5  | `localities[]` → `addresses` payload array                                     | `post-requirement-form.tsx`                             | 🔴 sends single flat address only                                                     |
| R6  | Reject hand-typed locality (require resolved Places pick)                      | `post-requirement-form.tsx`                             | 🔴 accepts hand-typed text                                                            |
| R12 | Image attach: **drag-and-drop** dropzone                                       | `post-requirement-form.tsx`                             | 🔴 label picker only (largely N/A on touch)                                           |
| R13 | Image attach: hover-eye + **full-size lightbox** preview                       | `post-requirement-form.tsx`                             | 🔴 remove ✕ only, tapping does nothing                                                |
| R14 | Image attach: compact-tile vs full-dropzone states                             | `post-requirement-form.tsx`                             | 🔴 fixed 16×16 tile                                                                   |
| R15 | "Other" category as **multiple chips** (Enter/comma commit, dedupe, backspace) | `category-chips.tsx`                                    | 🔴 single free-text value                                                             |
| R17 | Category values sent as **slugs** + i18n labels                                | `post-requirement-form.tsx`                             | 🔴 sends display names                                                                |
| R19 | **Debounced live phone-taken check** + inline "log in instead"                 | `use-phone-auth.ts`                                     | 🔴 checks only at submit (generic "Please login" link exists, not a live taken-check) |
| R21 | Locale-driven speech language (hi-IN/en-IN)                                    | `voice-textarea.tsx`                                    | 🔴 hard-coded en-IN (see §10)                                                         |
| R22 | Address field browser-autofill suppression                                     | `address-autocomplete.tsx`                              | 🔴 plain input                                                                        |
| R23 | Submit redirect target: **My Leads**                                           | `post-requirement-form.tsx`                             | 🟠 redirects to Profile (mobile's My-Leads surface)                                   |
| R24 | Track cards: nothing preselected (forces choice)                               | `post-requirement-form.tsx`                             | 🔴 defaults to "professional"                                                         |

---

## 6. PROFILE DASHBOARD + SUB-PAGES

### 6a. Identity & hero

| #   | Feature                                          | Web                                      | Mobile                                                                    |
| --- | ------------------------------------------------ | ---------------------------------------- | ------------------------------------------------------------------------- |
| P2  | Dedicated **My Leads** tab/page                  | `profile-tabs.tsx`, `my-leads-panel.tsx` | 🟠 folded into Overview as a static first-20 list, no tab                 |
| P3  | Avatar **cropper** on upload                     | `profile-photo-editor.tsx`               | 🔴 raw object-URL, no crop                                                |
| P4  | Avatar **fullscreen view** (lightbox)            | `profile-photo-editor.tsx`               | 🔴 missing                                                                |
| P5  | Avatar **delete/clear**                          | `profile-photo-editor.tsx`               | 🔴 replace-only                                                           |
| P6  | Photo edit **on the hero avatar**                | `hero-section.tsx`                       | 🔴 only inside EditProfileModal                                           |
| P7  | Location **inline edit pencil** → AddressModal   | `hero-section.tsx`, `address-modal.tsx`  | 🔴 display-only; edit via the full modal                                  |
| P8  | About **inline edit pencil** + empty placeholder | `hero-section.tsx`, `about-modal.tsx`    | 🟠 read-more view popup exists; no inline-edit pencil / empty placeholder |
| P9  | Rating card **in hero**                          | `hero-section.tsx`                       | 🟠 rendered as a separate bottom section                                  |
| P11 | Phone row (non-business)                         | `hero-section.tsx`                       | 🔴 not shown (location + email only)                                      |

### 6b. Complete-Your-Profile

| #   | Feature                                    | Web                | Mobile                                                                     |
| --- | ------------------------------------------ | ------------------ | -------------------------------------------------------------------------- |
| P12 | Checklist steps as **deep-action buttons** | `hero-section.tsx` | 🟠 computes step booleans but renders only the % ring; no per-step buttons |

### 6c. Portfolio & catalog

| #   | Feature                                                         | Web                           | Mobile                                          |
| --- | --------------------------------------------------------------- | ----------------------------- | ----------------------------------------------- |
| P14 | Portfolio tile **lightbox**                                     | `portfolio-section.tsx`       | 🔴 tiles not clickable                          |
| P15 | Portfolio **pager** (3/page)                                    | `portfolio-section.tsx`       | 🔴 all in grid, no pager                        |
| P16 | Portfolio photo-count "+N" badge                                | `portfolio-section.tsx`       | 🔴 mobile mapping carries a single cover only   |
| P17 | Portfolio gated to professionals+dealers (suppliers → Products) | `portfolio-section.tsx`       | 🟠 shown for all types; no Products alternative |
| P18 | **Supplier Categories** management                              | `supplier-category-modal.tsx` | 🔴 entirely missing                             |
| P19 | **Supplier Products** management                                | `supplier-product-modal.tsx`  | 🔴 entirely missing                             |

### 6d. My Leads / Saved sub-pages

| #   | Feature                                           | Web                             | Mobile                                                   |
| --- | ------------------------------------------------- | ------------------------------- | -------------------------------------------------------- |
| P20 | My Leads: audience tabs **with counts**           | `my-leads-panel.tsx`            | 🔴 missing (single `{limit:20}` fetch)                   |
| P21 | My Leads: subcategory chips                       | `my-leads-panel.tsx`            | 🔴 missing (API supports `subcategory`, UI unused)       |
| P22 | My Leads: search                                  | `my-leads-panel.tsx`            | 🔴 missing                                               |
| P23 | My Leads: server pagination                       | `my-leads-panel.tsx`            | 🔴 single page of 20, no pagination                      |
| P24 | My Leads: **Edit-lead modal (PATCH)**             | `edit-lead-modal.tsx`           | ⛔ blocked (no API PATCH — see top)                      |
| P25 | Saved-Leads: filter tabs + counts                 | `saved-panel-leads.tsx`         | 🔴 flat list                                             |
| P26 | Saved-Leads: search                               | `saved-panel-leads.tsx`         | 🔴 missing                                               |
| P28 | Saved-Leads: optimistic un-save + count reconcile | `saved-panel-leads.tsx`         | 🟠 optimistic remove works; no counts shown to reconcile |
| P29 | Saved-Professionals: filter tabs + counts         | `saved-panel-professionals.tsx` | 🔴 flat list                                             |
| P30 | Saved-Professionals: search + pagination          | `saved-panel-professionals.tsx` | 🟠 pagination (infinite scroll) present; no search       |

### 6e. Edit modals

| #   | Feature                                                    | Web                      | Mobile                                                |
| --- | ---------------------------------------------------------- | ------------------------ | ----------------------------------------------------- |
| P32 | About edit: dedicated modal, **min-20**, **VoiceTextarea** | `about-modal.tsx`        | 🔴 plain field in the full modal; no min-length/voice |
| P34 | Section scroll+highlight from checklist deep-actions       | `edit-profile-modal.tsx` | 🔴 no checklist, so no scroll/highlight               |

---

## 7. AUTHENTICATION

| #   | Feature                                                              | Web                       | Mobile                                                                |
| --- | -------------------------------------------------------------------- | ------------------------- | --------------------------------------------------------------------- |
| A2  | OTP inline vs modal vs dropdown size variants                        | `otp-modal.tsx`           | 🔴 single `OtpVerify` reused everywhere, no variants                  |
| A4  | Register **per-role conversational pitch** (headline/features/image) | `register-forms.tsx`      | 🔴 plain pill radiogroup                                              |
| A5  | **SignupDraft sent WITH the OTP request**                            | `register-forms.tsx`      | 🔴 `requestOtp` sends only `{phone}`; profile sent at verify          |
| A6  | Register terms consent **as clickable links**                        | `TermsConsent`            | 🔴 bold non-clickable text                                            |
| A7  | **Debounced phone-availability** check + inline "Log in instead"     | `use-phone-auth.ts`       | 🔴 checked only at submit                                             |
| A8  | `?as=<role>` deep-link + aliases                                     | `register-forms.tsx`      | 🔴 missing (signup is a modal; role defaults to "user")               |
| A9  | Register scroll-to-first-error                                       | `register-forms.tsx`      | 🟠 present in the requirement guest form; **not** in the signup modal |
| A12 | `?login=true` URL trigger                                            | `LoginUrlTrigger`         | 🔴 missing                                                            |
| A13 | Pending-intent stash/replay **across signup navigation**             | `login-gate-provider.tsx` | 🔴 in-session ref only; not stashed to storage                        |
| A16 | Preferred-language auto-redirect                                     | `auth-provider.tsx`       | 🔴 no i18n; `userPreferredLanguage` never read (see §10)              |

---

## 8. MESSAGING / CHAT

Fully implemented (list, thread, polling, grouping + date separators, lead context, optimistic send, unread badges, Send-Message wiring; styled to the web's Google-Chat design). Only the desktop-shell paradigms remain, and they are **web-only by nature**:

| #   | Feature                                                   | Web                 | Mobile                                        |
| --- | --------------------------------------------------------- | ------------------- | --------------------------------------------- |
| M10 | **Floating chat dock** (≤3 popups, minimize/expand/close) | `chat-dock.tsx`     | ⚪ web-only; mobile uses full-screen pages    |
| M11 | **ChatLauncher** FAB (pulse on new, 99+ badge)            | `chat-launcher.tsx` | ⚪ web-only; would overlap the bottom tab bar |

---

## 9. NOTIFICATIONS

| #   | Feature                            | Web            | Mobile                                             |
| --- | ---------------------------------- | -------------- | -------------------------------------------------- |
| NT2 | **New-leads nav dot** (red ping)   | `nav-link.tsx` | 🔴 missing (FAB filter-count badges are unrelated) |
| NT4 | Push notifications (FCM/OneSignal) | n/a            | 🔴 no push dependency installed                    |
| NT5 | Notification bell / center         | n/a            | 🔴 `ICONS.notifications` defined but unused        |

---

## 10. i18n / LANGUAGE — 🟡 deferred (mobile is hard-coded English)

| #   | Feature                                                           | Web                   | Mobile                                                    |
| --- | ----------------------------------------------------------------- | --------------------- | --------------------------------------------------------- |
| I1  | i18n framework (next-intl)                                        | `i18n/*`              | 🔴 none; inline English literals                          |
| I2  | **DB-driven catalogue** from `/app/languages` `/app/translations` | `i18n/request.ts`     | 🔴 not fetched; header list is a hard-coded 3-entry array |
| I3  | Language toggle **switches locale + persists**                    | `language-toggle.tsx` | 🔴 cosmetic local state; resets on remount                |
| I4  | `userPreferredLanguage` read/written                              | `language-toggle.tsx` | 🔴 on the type, never used                                |
| I5  | Locale-prefixed routing                                           | `i18n/routing.ts`     | 🔴 no locale prefix                                       |
| I6  | **RTL support**                                                   | `layout.tsx`          | 🔴 missing (manifest `supportsRtl` is scaffold default)   |
| I7  | **Per-script fonts** (Devanagari/Gurmukhi)                        | `layout.tsx`          | 🔴 only Plus Jakarta (Latin) bundled                      |

---

## 11. DEEP-LINKS / NATIVE — 🟡 deferred (plugins installed, unused)

| #   | Feature                                                          | Web | Mobile                                                                                |
| --- | ---------------------------------------------------------------- | --- | ------------------------------------------------------------------------------------- |
| SH3 | Capacitor App **`appUrlOpen`** handler                           | n/a | 🔴 `@capacitor/app` installed, no listener; no deep-link scheme in `capacitor.config` |
| SH4 | **Android deep-link intent-filter** (VIEW/BROWSABLE / App Links) | n/a | 🔴 manifest has only MAIN/LAUNCHER                                                    |
| SH5 | `?login`/`?returnTo`/`?as`/`?c` deep links                       | web | 🔴 only `?search`/`?type` read                                                        |
| NV1 | Haptic feedback                                                  | n/a | 🔴 `@capacitor/haptics` installed, unused                                             |
| NV2 | Status-bar styling                                               | n/a | 🔴 `@capacitor/status-bar` installed, unused                                          |
| NV3 | Keyboard handling                                                | n/a | 🔴 `@capacitor/keyboard` installed, unused                                            |
| NV4 | Hardware back-button interception                                | n/a | 🔴 `@capacitor/app` installed, no `backButton` listener                               |

---

## Suggested implementation order (remaining)

1. **Shared image lightbox** — one reusable component closes LC5, LM1, P14, R13, P4.
2. **Detail API fields + badges** — capture `rera`/`authorized`/`brands`/`categories`, then DT4, DT7, DT8, PC6–PC9.
3. **Profile sub-pages** — P20–P23 (My Leads) + P25/P26/P29 (Saved tabs/counts/search) + P12 checklist.
4. **Supplier catalog** — P18/P19, DT7 (endpoints `app/supplier-catalog` + `app/supplier-products` exist).
5. **Multi-locality picker** — R1–R6 (Places bias/restrict + `addresses[]` payload).
6. **Directory/leads controls** — D2/D5/D6/D7/D8/D9, F1–F6, LD1–LD4/LD6/LD7, LC1/LC7.
7. **Auth depth** — A2/A4/A5/A6/A7/A8/A9(signup)/A12/A13.
8. **Home content/nav** — H1–H11/H14, N1/N2/N4, C1/C3.
9. **Notifications** (§9), **real i18n** (§10), **deep-links/native** (§11).

_Design follows existing mobile Ionic patterns; only feature parity is targeted, not visual parity with web._
