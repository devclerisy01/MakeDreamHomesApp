# Web → Mobile Feature Gap — Pending Items

**Web app:** `MakeDreamHomes` (Next.js) · **Mobile app:** `MakeDreamHomesApp` (Ionic React + Capacitor)

**Ground rule:** the two apps should have the **same features** — the _only_ intended difference is **design/UX** (Ionic mobile shell vs. Next.js web). This document lists **what remains missing/different in mobile**, plus (§12) **what mobile has that web does not**.

**Re-verified 2026-07-22** by a full per-item source audit of `MakeDreamHomesApp/src`. The **§1–§3 + §6 + §7 parity build** has since landed and is reflected below (resolved rows pruned from the tables and recorded in the changelog); §4, §5, §8–§12 are unchanged from the audit.

**Status legend:** ⛔ **Blocked** (needs a backend/config change) · 🔴 **Missing** · 🟠 **Partial** (exists but reduced/different) · 🟡 **Deferred** (large standalone effort) · ⚪ **Web-only by nature** · 🆕 **newly found** · ✅ **resolved (removed)**.

---

## Changelog — §5 Post-Requirement parity (2026-07-22)

- ✅ **R1/R2/R5/R6** multi-locality buy-property — up to 5 resolved-pick chips, a 50 km haversine guard from the first, sent as `addresses[]`; hand-typed text no longer commits (a real Places pick is required on every track). New `LocalityPicker` (`components/common/LocalityPicker.tsx`).
- ✅ **R3/R4** the picker soft-biases / hard-restricts 2nd+ predictions to the first pick's ~50 km circle and requests region-only results (`placeAutocomplete` + `AddressAutocomplete` now take `bias`/`restrict`/`regionsOnly`; the backend proxy already supported them).
- ✅ **R22** address field `autoComplete="off"` + neutral field name (suppresses WebView autofill).
- ✅ **R15** "Other" category is now a multi-chip input (Enter/comma commit, dedupe, backspace-remove).
- ✅ **R19** debounced live phone-taken check + inline "Log in instead" in the guest form (`isPhoneAvailable`).
- ✅ **R24** no track preselected (`type` starts null; submit scrolls to the track cards); ✅ **R23** posting lands on the profile's **My Leads** tab (`?tab=myLeads` via `useIonViewWillEnter`).
- Deferred → §10: **R12/R14** (⚪ desktop drag-drop, N/A on touch), **R17** (category slugs — couples with i18n), **R21** (speech locale — i18n).

---

## Changelog — §12 divergences removed (2026-07-22)

Owner decision: align mobile to web by **removing** the three "real divergences" (former §12a), rather than re-adding them to web.

- ✅ **X1 — professional "Available for Work" flow** removed from `Requirement.tsx`: dropped the hire/available toggle (`PRO_INTENTS`), `proIntent` state and `chooseProIntent`; the professional track now always posts `hire` and registers guests as a plain `person` (no `professionalCategoryId` in the guest draft) — matching the web form.
- ✅ **X2 — detail-page save button** removed from `ProfessionalDetail.tsx` (the `SaveButton` overlay on the avatar); save now lives only on listing/lead cards, as on web.
- ✅ **X3 — professional-lead intent badge** removed by making `leadIntentChip` (`leads.ts`) return only Buy/Sell (null for hire/available), mirroring web's `INTENT_CHIP`; affects `LeadCard` and `MyLeadCard`.

---

## Changelog — resolved in the parity build (2026-07-22)

Design was adapted to the mobile Ionic shell (not visually copied from web); only feature parity was targeted.

**§1 HOME**

- ✅ **H4** — the three inline listing links (Professional / Property Dealer / Supplier) now sit in the hero paragraph (`Home.tsx`).
- ✅ **H11 + H14** — Latest-Leads and Find-Professionals tabs are now **URL-driven** and **cross-preserve** the sibling category (`leadCategory` / `proCategory` query params, `Home.tsx`).

**§2 DIRECTORY / CARDS / FILTERS**

- ✅ **D6** custom ✕ clear + `maxLength`; ✅ **D7** "Near Me" geolocate; ✅ **D8** directory-specific placeholder (`SearchBar.tsx`, `Professionals.tsx`).
- ✅ **F1** brand multi-select facet + counts; ✅ **F2** in-group search; ✅ **F3** collapse cap + "+N more"; ✅ **F4** keep-selected-visible; ✅ **F6** empty-filters "Post requirement" CTA; ✅ **F7** supplier ratings-group relabel (`FilterModal.tsx`, `Professionals.tsx`, `professionals.ts`).
- ✅ **PC2** track badge on the mixed Saved view; ✅ **PC3** per-category rating expand; ✅ **PC6** authorized badge; ✅ **PC7** RERA badge; ✅ **PC8 + PC9** supplier brands/products — surfaced as **text meta-lines** (design-adapted from web's brand logos / product chips); ✅ **PC13** per-track avatar placeholder icon; ✅ **PC14** supplier "Active Deals" wording (`ProfessionalCard.tsx`, `ListingBadge.tsx`, `Avatar.tsx`, `categories.ts`).

**§3 DETAIL**

- ✅ **Type gap closed** — mobile `ProfessionalListing` / `ProfessionalDetail` / `PortfolioItem` now carry `brands` / `authorizedBrands` / `reraNumber` / `isReraCertified` / portfolio `images[]` (`types/index.ts`, `professionals.ts`, `portfolio.ts`).
- ✅ **DT3** avatar placeholder; ✅ **DT4** authorized badge on the avatar; ✅ **DT7** supplier categories block (per-category brands + authorized-dealer chips, `SupplierMeta`); ✅ **DT8** portfolio brand chips; ✅ **DT11** on-detail Active-Leads section; ✅ **DT17** review pending-approval screen; ✅ **DT21** portfolio multi-image gallery/lightbox (`ProfessionalDetail.tsx`, `PortfolioCard.tsx`, `use-portfolio-gallery.ts`, `WriteReviewModal.tsx`).

**§6 PROFILE**

- ✅ **P2** dedicated My Leads tab, with **P20–P23** audience tabs+counts, subcategory chips, search, server pagination (`MyLeadsPanel.tsx`).
- ✅ **P24** edit-lead modal via `PATCH /app/leads/:id` (`EditLeadModal.tsx`, `updateLead` in `leads.ts`) — closes the last ⛔.
- ✅ **P25 / P26 / P28 / P29 / P30** Saved-Leads & Saved-Professionals tabs + counts + search + optimistic un-save reconcile (`SavedList.tsx`).
- ✅ **P15** portfolio pager; ✅ **P16** photo-count "+N" badge (`Profile.tsx`, `PortfolioTile.tsx`).
- ✅ **P18 / P19** supplier Categories + Products management (`SupplierCatalogSection.tsx`, `SupplierCategoryModal.tsx`, `SupplierProductModal.tsx`, `supplier-catalog.ts`).
- ✅ **P3** avatar cropper; ✅ **P5** avatar delete/clear; ✅ **P6** photo edit on the hero avatar (`ImageCropperModal.tsx` + `Profile.tsx`).
- ✅ **P7** location pencil → `AddressModal`; ✅ **P8** About pencil + empty placeholder; ✅ **P9** rating card in the hero (tap → reviews); ✅ **P11** phone row (non-business); ✅ **P12** actionable completion checklist; ✅ **P34** scroll + ring-highlight from the photo step; ✅ **P32** About editor with min-20 + voice (`AboutModal.tsx`, `AddressModal.tsx`, `VoiceTextarea.tsx`, `Profile.tsx`).

**§7 AUTH**

- ✅ **A5** SignupDraft now sent **with the OTP request** (fixed a broken signup); ✅ **A4** per-role title/subtitle; ✅ **A6** terms as tappable links; ✅ **A7** debounced phone-availability + inline "Log in instead"; ✅ **A9** signup scroll-to-first-error (`SignupModal.tsx`, `auth.ts`, `Requirement.tsx`).

**Residuals still open in these sections:** **H5** (guest role-rows card — `GuestRoleCard.tsx` exists but isn't wired into `Home`), **DT2** (combined `<h1>` + breadcrumb), **P17** (person accounts still see a Portfolio section), **P35** (reviews empty-state card), **P36** (copy-link vs native Share), plus the cosmetic/design items still listed in the tables below.

---

## Changelog — earlier (re-verification pass, since 2026-07-21)

- ✅ **Shared image `Lightbox` shipped** (`src/components/common/Lightbox.tsx`) → closed and removed LC5, LM1, R13, P4, P14.
- 🔁 **A2** reclassified 🔴→⚪ (OTP size variants are desktop-surface-specific; mobile's single `OtpVerify` bottom-sheet is the correct mobile form).
- 🔁 **R12, R14** reclassified 🔴→⚪ (drag-and-drop / responsive dropzone states are desktop-pointer affordances; upload itself is complete on mobile).
- 🔁 **LC1** downgraded 🔴→🟠 (a per-track **category icon** now conveys track on every lead card incl. the mixed Saved list; only the text badge is absent).

---

## ⛔ Blocked — needs a change elsewhere

| #   | Gap                   | Blocker                                                                                                                                                                     |
| --- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SH1 | **Share link domain** | Native share works; `publicProfileUrl` builds `${WEB_APP_URL}/en/...` and `WEB_APP_URL` defaults to `makedreamhomes.com`. Set deploy env `VITE_WEB_URL` to the prod domain. |

_(P24 previously sat here; it is now resolved — see the parity-build changelog.)_

---

## 1. HOME PAGE

| #   | Feature                                                                        | Web                                      | Mobile                                                                                                                    |
| --- | ------------------------------------------------------------------------------ | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| H1  | Hero background photo + gradient wash                                          | `sections/hero.tsx`                      | 🟠 gradient wash present; no hero **photo** (only the HeroArt illustration in the promo card)                             |
| H2  | Hero headline copy (comma-split stacked lines)                                 | `hero.tsx`                               | 🟠 single static headline; not comma-split into stacked lines                                                             |
| H5  | Guest-only role-rows card (Professional/Supplier/Dealer + "Join" CTA)          | `hero.tsx` + `guest-content.tsx`         | 🔴 `GuestRoleCard.tsx` exists but is not wired into `Home`; home shows a single "Post Requirement" CTA regardless of auth |
| H6  | Social rail (fixed Facebook/Instagram)                                         | `hero.tsx` / `floating-rails.tsx`        | 🔴 missing entirely (no social strings anywhere in `src`)                                                                 |
| H7  | Decorative dot-grid accent                                                     | `DotGrid`                                | 🔴 missing                                                                                                                |
| H8  | **Watch-Video** trigger tile (poster + play + ping ring)                       | `hero-search-bar.tsx`                    | 🔴 missing                                                                                                                |
| H9  | Watch-Video modal (YouTube/`youtu.be`/embed/shorts/bare-id + direct `<video>`) | `hero-search-bar.tsx`                    | 🔴 missing                                                                                                                |
| H10 | **How It Works** section (4 role cards, illustrations, numbered steps)         | `sections/how-it-works.tsx`              | 🔴 missing entirely                                                                                                       |
| H15 | Home strings fully translated                                                  | i18n                                     | 🔴 hard-coded English (see §10)                                                                                           |
| H16 | Hero inline **post-requirement link** inside the `<h1>` + italic "or" rule     | `hero.tsx` + `post-requirement-link.tsx` | 🔴 missing (plain static headline)                                                                                        |
| H17 | **"Download App"** store-badge rail (Google Play / App Store) on the hero      | `floating-rails.tsx`                     | 🔴 missing (no app-badge surface on home; see also N4)                                                                    |
| S6  | Global-search dropdown enter/exit animation + row stagger                      | `hero-search-bar.tsx`                    | 🔴 plain conditional render, no framer-motion (cosmetic; search otherwise complete)                                       |
| S7  | Global-search **"Try:" example-query chips**                                   | `hero-search-bar.tsx`                    | 🔴 intentionally omitted (`GlobalSearch.tsx` has no examples affordance)                                                  |

### 1b. Header / nav / footer / city / language

| #   | Feature                                                                                                   | Web                             | Mobile                                                                                                                                                 |
| --- | --------------------------------------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| N1  | Top nav links (Professionals / Dealers / Suppliers + **New-Leads red ping-dot**)                          | `navigation.ts`, `nav-link.tsx` | 🔴 bottom tab bar only; no dealers/suppliers items, no New-Leads dot                                                                                   |
| N2  | Consolidated **side drawer / hamburger** (nav + city + language + register + logout)                      | `mobile-menu.tsx`               | 🔴 a `SideMenu` was added then **removed**; pieces now scattered across header + login gate + Profile                                                  |
| N4  | **Footer** (brand, socials, link columns, app-store badges, legal, popular searches/locations, copyright) | `footer.tsx`                    | 🔴 entirely missing                                                                                                                                    |
| C1  | City-select **auto-geolocation on mount** (reverse-geocode → match/persist)                               | `city-select.tsx`               | 🟠 auto-detect at **app** mount, permission-gated (never prompts), matches nearest verified city by distance — no reverse-geocode, not on picker mount |
| C3  | Footer "Popular Locations" chips                                                                          | `popular-locations.tsx`         | 🔴 missing (no footer; the picker's "Popular cities" is a distance list, not footer chips)                                                             |
| L1  | Language options **dynamic from API**                                                                     | `getLanguageOptions()`          | 🔴 hard-coded en/hi/pa array in `AppHeader.tsx` (see §10)                                                                                              |
| L2  | Language change → **locale redirect + persist to profile**                                                | `language-toggle.tsx`           | 🔴 sets local state only; no locale switch, no persist (see §10)                                                                                       |

---

## 2. DIRECTORY / LISTINGS + CARDS + FILTERS

### 2a. Screen & controls

| #   | Feature                                                    | Web                     | Mobile                                                                                                                 |
| --- | ---------------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| D2  | Category-tab icons (icon chip + title)                     | `category-tabs.tsx`     | 🔴 label-only pills, no icons (cosmetic; tab feature works)                                                            |
| D5  | Subcategory **chip row** with "All" chip + "More" overflow | `subcategory-chips.tsx` | 🟠 filtering works, folded into the filter modal as a single-select group (placement is design)                        |
| D9  | Sort as top-right **dropdown**                             | `sort-dropdown.tsx`     | 🟠 sort works, as a single-select group inside the filter modal (placement is design)                                  |
| D11 | Auto-geolocation once on mount (directory)                 | `geo-sort.tsx`          | 🟠 runs at **app** mount (permission-gated, nearest-city); distance sort achieved, but not a directory-mount geolocate |

### 2b. Filter richness

| #   | Feature                            | Web        | Mobile                |
| --- | ---------------------------------- | ---------- | --------------------- |
| F5  | **FLIP animation** on list changes | `use-flip` | 🔴 missing (cosmetic) |

### 2c. Professional / dealer / supplier card

| #    | Feature                                         | Web                     | Mobile                                                                                               |
| ---- | ----------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------- |
| PC4  | Rating block links to reviews section           | `rating-block.tsx`      | 🟠 plain text span; whole card links to detail (same target as web's rating link)                    |
| PC11 | Save-flash pulse animation                      | `professional-card.tsx` | 🔴 heart swaps icon/color only, no flash                                                             |
| PC12 | Active-leads link → detail `#leads`             | `professional-card.tsx` | 🟠 goes to `leads?userId=` (filtered list) instead; no `#leads` anchor in mobile                     |
| PC15 | Inline **"Send Message"** on the directory card | `professional-card.tsx` | 🔴 no messaging action on the card; chat reachable only from detail (may be a compact-design choice) |

---

## 3. PROFESSIONAL / DEALER / SUPPLIER DETAIL

| #    | Feature                                                       | Web                         | Mobile                                                                                                                  |
| ---- | ------------------------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| DT2  | Page `<h1>` "{name} · {profession}" + breadcrumb              | `detail/[...slug]/page.tsx` | 🟠 name in AppHeader + profession chip + name `<h2>`; no combined h1, no breadcrumb                                     |
| DT18 | Write-Review: signup-resume persistence (`mdh.pendingReview`) | `write-review-button.tsx`   | 🟠 in-session callback via login-gate ref; works because signup is in-place (would drop only on an app-kill mid-signup) |
| DT20 | Similar-professionals **prev/next arrow buttons**             | `similar-professionals.tsx` | 🟠 swipe/scroll only (web arrows are desktop-only `sm:grid` — near-non-gap on phones)                                   |

---

## 4. LEADS LISTING + CARDS + DETAILS MODAL

| #    | Feature                                                                                          | Web                                       | Mobile                                                                                                    |
| ---- | ------------------------------------------------------------------------------------------------ | ----------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| LD1  | Property groups + subcategory as **chip rows**                                                   | `leads/page.tsx`, `subcategory-chips.tsx` | 🟠 works, but folded into the filter modal (not on-page chip rows)                                        |
| LD2  | Sort visible **dropdown**                                                                        | `sort-dropdown.tsx`                       | 🟠 works, but inside the filter modal                                                                     |
| LD3  | Search **clear (✕)** + maxLength + URL write                                                     | `search-bar.tsx`                          | 🔴 native clear, no maxLength, doesn't write `?search=` (reads `urlSearch`, never writes)                 |
| LD4  | Search **"Near Me"** geolocate                                                                   | `search-bar.tsx`                          | 🔴 missing                                                                                                |
| LD6  | Locality filter in-group search + collapse cap                                                   | `filter-sidebar.tsx`                      | 🔴 all areas listed flat                                                                                  |
| LD7  | Empty-filters CTA                                                                                | `filter-sidebar.tsx`                      | 🟠 empty message present, "Post requirement" CTA absent                                                   |
| LC1  | Lead card **track badge** (mixed "All" view)                                                     | `lead-card.tsx`                           | 🟠 no text badge, but a distinct per-track **category icon** conveys track on every card (incl. Saved)    |
| LC7  | Save-flash / card pulse                                                                          | `lead-card.tsx`                           | 🔴 missing                                                                                                |
| LB1  | Infinite-scroll: explicit retry button + no-JS fallback                                          | `leads-infinite-list.tsx`                 | 🟠 initial-load pull-to-refresh only; pagination errors swallowed, no retry button (no-JS N/A in the SPA) |
| LC8  | **"Posted by / Shared by"** handling (strip "Shared by X." suffix + show "Posted by <Business>") | `lead-card.tsx`                           | 🔴 `postedBy` on the type but never rendered; raw description shown verbatim (suffix stays in title)      |
| LC9  | Card-level **"Send Message"**                                                                    | `lead-card.tsx`                           | 🟠 exists only inside the details modal, not on the card                                                  |
| LC10 | Explicit **"Read more"** on the lead-card title                                                  | `lead-card.tsx`                           | 🟠 title clamped to 2 lines, whole-card tap opens modal; `ReadMoreText` exists but unused on the card     |

_(✅ **LC5** and ✅ **LM1** — card/modal images → lightbox — are implemented via the shared `Lightbox` and were removed.)_

---

## 5. POST-REQUIREMENT / REQUIREMENT FORM

Multi-locality buy-property, the smarter Places picker, the "Other" multi-chip input, the live phone-taken check, and the track-choice / My-Leads-redirect fixes all landed in the §5 parity build (see changelog): **R1–R6, R15, R19, R22, R23, R24** resolved. Remaining:

| #   | Feature                                            | Web                         | Mobile                                                                             |
| --- | -------------------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------- |
| R12 | Image attach: **drag-and-drop** dropzone           | `post-requirement-form.tsx` | ⚪ label picker only (drag-drop is a desktop-pointer affordance, N/A on touch)     |
| R14 | Image attach: compact-tile vs full-dropzone states | `post-requirement-form.tsx` | ⚪ fixed 64px tiles; responsive dropzone states are pure styling (upload complete) |
| R17 | Category values sent as **slugs** + i18n labels    | `post-requirement-form.tsx` | 🔴 sends display names (`CategoryOption` has no slug field); couples with §10      |
| R21 | Locale-driven speech language (hi-IN/en-IN)        | `voice-textarea.tsx`        | 🔴 hard-coded en-IN (the shared `VoiceTextarea` defaults to en-IN; see §10)        |

_(✅ **R13** — full-size lightbox preview of staged images — implemented and removed. Note: the shared `VoiceTextarea` was **not** retrofitted onto this screen; it keeps its own inline dictation logic.)_

---

## 6. PROFILE DASHBOARD + SUB-PAGES

Identity/hero editing, the Complete-Your-Profile checklist, My Leads & Saved sub-pages, the supplier catalog, and the About/Address/crop editors all landed in the parity build (see changelog): **P2, P3, P5–P9, P11, P12, P15, P16, P18–P26, P28–P30, P32, P34** resolved. Remaining:

| #   | Feature                                                             | Web                     | Mobile                                                                                                                                         |
| --- | ------------------------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| P17 | Portfolio gated to professionals+dealers (suppliers → Products)     | `portfolio-section.tsx` | 🟠 suppliers now get the Products catalog (P18/P19); the Portfolio section still renders for `person` accounts (web hides it for non-business) |
| P35 | Reviews **empty-state card** for business users with 0 reviews      | `reviews-section.tsx`   | 🔴 renders nothing when `hasReviews` is false                                                                                                  |
| P36 | Professional **copy-link** affordance (clipboard, completion-gated) | `hero-section.tsx`      | 🟠 offers native Share instead; not clipboard, not completion-gated                                                                            |

_(✅ **P4** and ✅ **P14** — avatar/portfolio fullscreen view — are implemented via the shared `Lightbox` and were removed.)_

---

## 7. AUTHENTICATION

Register-flow parity landed in the parity build (see changelog): **A4, A5, A6, A7, A9** resolved. Remaining:

| #   | Feature                                                  | Web                       | Mobile                                                                                       |
| --- | -------------------------------------------------------- | ------------------------- | -------------------------------------------------------------------------------------------- |
| A2  | OTP inline vs modal vs dropdown size variants            | `otp-modal.tsx`           | ⚪ single `OtpVerify` bottom-sheet reused everywhere (variants are desktop-surface-specific) |
| A8  | `?as=<role>` deep-link + aliases                         | `register-forms.tsx`      | 🔴 missing (signup is a modal; role defaults to "user"); ties to §11 deep-links              |
| A12 | `?login=true` URL trigger                                | `LoginUrlTrigger`         | 🔴 missing (no URL-param reading; login opens only via `openLogin`)                          |
| A13 | Pending-intent stash/replay **across signup navigation** | `login-gate-provider.tsx` | 🟠 in-session ref only; survives panel switch, not persisted to storage                      |
| A16 | Preferred-language auto-redirect                         | `auth-provider.tsx`       | 🔴 no i18n; `userPreferredLanguage` never read (see §10)                                     |

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

## 12. EXTRA IN MOBILE (present in mobile, NOT in web)

Native capabilities and design-shell adaptations — expected, and consistent with the design-only difference.

> _The three former §12a "real divergences" — the professional "Available for Work" flow (X1), the detail-page save button (X2), and the professional-lead intent badge (X3) — were **removed from mobile** on 2026-07-22 to restore web parity (see the changelog below)._

| #   | Extra                                           | Detail                                                                                                                                                |
| --- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| X4  | **Native animated splash screen**               | `capacitor.config.ts` SplashScreen (launchAutoHide:false) + `SplashScreen`/`AnimatedLogo`/`useSplash` + rAF hand-off. No web splash.                  |
| X5  | **Pull-to-refresh**                             | `IonRefresher` on Home / Professionals / Leads / Profile. No web equivalent gesture.                                                                  |
| X6  | **Native geolocation**                          | `@capacitor/geolocation` (`lib/native/geolocation.ts`) — native re-implementation of web browser-geo.                                                 |
| X7  | **Native speech recognition**                   | `@capacitor-community/speech-recognition` (`lib/native/speech.ts`), shared via `VoiceTextarea` — native re-implementation of the Web-Speech textarea. |
| X8  | **Filter FAB + active-count badge**             | Floating filter button with a numeric active-filter-count badge; web uses a persistent sidebar with no count badge.                                   |
| X9  | **Consolidated two-pane filter modal**          | Sort + Type + Ratings + Locations merged into one sheet; web splits these across sort dropdown, chip row, and sidebar.                                |
| X10 | **Per-track category icon tile** on lead cards  | Property/material/professional icon on every lead card; web's listing card has no category icon.                                                      |
| X11 | **Bottom tab bar** with live avatar Profile tab | Profile tab shows the user's avatar + first name once authed; web uses a header AuthMenu.                                                             |
| X12 | **In-profile Messages tab + Logout**            | Messages embedded as a profile tab and a Logout button inside the profile overview; web treats both as separate nav.                                  |

---

## Suggested implementation order (remaining)

1. ✅ ~~Shared image lightbox~~ — done (closed LC5, LM1, R13, P4, P14).
2. ✅ ~~Detail/card API fields + badges~~ — done (DT3/DT4/DT7/DT8/DT21, PC2/PC3/PC6–PC9/PC13/PC14; mobile types now carry the fields).
3. ✅ ~~Edit-lead (P24)~~ — done.
4. ✅ ~~Profile sub-pages + hero editing~~ — done (P2/P12/P15/P16/P20–P30 + P3/P5–P9/P11/P32/P34).
5. ✅ ~~Supplier catalog~~ — done (P18/P19, DT7).
6. ✅ ~~Auth register depth~~ — done (A4/A5/A6/A7/A9).
7. ✅ ~~Resolve the §12a divergences~~ — done (X1/X2/X3 removed from mobile to match web).
8. ✅ ~~Multi-locality picker + post-requirement parity~~ — done (R1–R6, R15, R19, R22, R23, R24). Remaining: **R17** (category slugs, with i18n).
9. **Directory / leads leftovers** — D2/D5/D9/D11, F5, PC4/PC11/PC12/PC15, LD1–LD10, LC1/LC7.
10. **Home content / nav** — H1/H2/H5–H10/H15–H17, S6/S7, N1/N2/N4, C1/C3.
11. **Remaining auth** — A8/A12/A13 (ties to §11 deep-links).
12. **Notifications** (§9), **real i18n** (§10), **deep-links/native** (§11).
13. **Small residuals** — H5 wiring, DT2 breadcrumb, P17 person-gating, P35 reviews empty-state, P36 copy-link, DT18/DT20.

_Design follows existing mobile Ionic patterns; only feature parity is targeted, not visual parity with web._
