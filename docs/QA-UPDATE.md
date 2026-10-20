# QA update — October 2026

A UX / accessibility / QA audit was run against the live site (`npm run dev`) in headless Chrome at 1440px (desktop), 768px (tablet), 375px and 360px (phones), on `/`, `/shop`, `/offers`, `/about` and the 404 page. This document lists every issue found and what was changed. All fixes were re-verified in the browser afterwards.

**Already working well before the update:** no sideways scrolling at any width, skip link, visible focus outlines, dialogs trap focus / close on Escape / return focus, bottom tab bar at ≤960px, WhatsApp order message matches the brief, KOKO maths correct, reduced motion stops looping animations, labelled form fields, hero alt text.

## Summary

| ID | Area | Severity | Status |
|---|---|---|---|
| QA-01 | Header search icon had no search behind it | High | ✅ Fixed |
| QA-02 | "Remind me" said "You're on the list!" but saved nothing | High | ✅ Fixed (database + API) |
| QA-03 | Placeholder text visible (`[TIME]`, `[DATE]` …) | High | ◐ Dates fixed · rest needs client content |
| QA-04 | Basket emptied before the order was actually sent | Medium | ✅ Fixed |
| QA-05 | Desktop "Add to basket" only visible on hover | Medium | ✅ Fixed |
| QA-06 | Every page had the same browser-tab title | Medium | ✅ Fixed |
| QA-07 | Several text styles below 4.5:1 contrast | Medium | ✅ Fixed |
| QA-08 | Phones: occasion card covered the photo | Medium | ✅ Fixed |
| QA-09 | Phones: Gift Finder pushed products two screens down | Medium | ✅ Fixed |
| QA-10 | Offers banner gave away the SWEET10 "surprise" code | Low | ✅ Fixed |
| QA-11 | Reminder form: unclear empty-field error, focus not moved | Low | ✅ Fixed |
| QA-12 | Budget slider minimum below the cheapest gift | Low | ✅ Fixed |
| QA-13 | Phone tap targets under 44px | Low | ✅ Fixed |
| QA-14 | Focus not moved after changing page | Low | ✅ Fixed |
| QA-15 | Hero `fetchPriority` dropped by React + router warnings | Low | ✅ Fixed |
| QA-16 | Basket date chips cut off; tall phone footer | Low | ✅ Fixed |
| QA-17 | Inconsistent arrows on category tiles | Low | ✅ Fixed |

---

## Details

### QA-01 · Search
**Problem:** the header magnifying glass just linked to `/shop`, which had no search field.
**Fix:**
- Search box added to the Shop page (`src/pages/shop/ShopPage.tsx`, styles in `Shop.css`). Results filter as you type; the query is kept in the URL (`/shop?q=teddy`) so results can be shared.
- Matches product name, description, recipient, occasion and vibe, plus common words per vibe ("chocolate", "teddy", "toy" …). Every typed word must match.
- The header icon (`src/components/Header.tsx`) now opens Shop **with the search box focused**, also when already on Shop.
- The empty state says *No gifts match "…"* with suggestions (`EmptyState.tsx`).

### QA-02 · Reminders saved to a database
**Problem:** the reminder form showed a success message but the details only lived in component state (`TODO` in the code) and reset on reload.
**Decision:** store contacts in our own database — not customer login (too much friction for one tap) and not device IP (can't be messaged, changes, and is personal data). The same table will feed the admin dashboard.
**Fix:**
- New API `server/index.mjs` (no dependencies; Node built-in `http` + `node:sqlite`). Table `reminders`: channel, contact, occasions, `consent_at`, timestamps; unique per contact. Server-side validation, 10 KB body limit, per-IP rate limit. Admin list at `GET /api/reminders` protected by `ADMIN_TOKEN`. Also serves `dist/` in production (`npm start`).
- New client `src/lib/reminders.ts` (save / cancel, remembers this device's sign-up in localStorage).
- `ReminderModal.tsx`: real save with "Saving…" state and server error messages; WhatsApp is now the default channel (`whatsappReminders = true` in `src/data/offers.ts`); accepts `071 234 5678`, `71 234 5678` or `+94 …`; consent line added; pre-fills the contact used before.
- `GiftCalendar.tsx`: "Reminder set" survives a reload; tapping it cancels on the server, with a status message.
- `vite.config.ts` proxies `/api` to the API in development; `package.json` adds `npm run api` and `npm start`; `.gitignore` excludes `data/` (customer details).

### QA-03 · Placeholders
**Fixed:** Mother's Day and Father's Day showed `[DATE]`. They are now calculated (2nd Sunday of May, 3rd Sunday of June — Sri Lanka) for the next upcoming year, e.g. 9 May and 20 June 2027 (`src/data/offers.ts`).
**Still to do (client content):** `[TIME]`, `[AREA]`, `[DAYS]`, `[HOURS]`, `[Founder name]`, story `[YEAR]`s and text, FAQ `[X–Y]` days, product photos. Kept visible on purpose, per `CLAUDE.md`.

### QA-04 · Basket kept until the customer confirms
**Problem:** the basket was cleared 1.5 s after tapping "Send order on WhatsApp", even if WhatsApp never opened.
**Fix (`CartDrawer.tsx`):** the "ready in WhatsApp" view now offers **"I've sent it · clear my basket"** and **"Not yet · back to my basket"**, plus the existing retry link. The basket is only cleared on confirmation.

### QA-05 · Always-visible add button on desktop cards
**Fix (`ProductCard.tsx`, `ProductCard.css`):** a round pink "+" now shows at rest and widens into the full "Add to basket" pill on hover / keyboard focus. Touch devices keep the full button.

### QA-06 · Page titles · QA-14 · Focus after page change
**Fix (`src/components/Layout.tsx`, titles in `src/data/site.ts`):** each route sets its own title (e.g. *Shop Gifts · GiftsByDeesh*, *Page not found · GiftsByDeesh*). After client-side navigation focus moves to `<main>` so screen readers start on the new page — unless the page focused something itself (the search box).

### QA-07 · Colour contrast
| Text | Before | After |
|---|---|---|
| Pink section labels ("WATCH US WRAP" …) | 4.46:1 | new `--pink-text: #C41E55` token → 5.2:1 |
| Hero word "smile." | ~2.97:1 | `--pink-text` |
| Shop "Gift guide" tile label / text | 3.73 / 4.11:1 | white → 4.91:1 |
| Occasion numbers 01–04 | 3.34:1 | `#7A6870` → 5.2:1 |
| Reel length tags (side reels) | ~3.6:1 | solid white tag, side reels 75% opacity |
| About chapter labels | 4.37:1 | `#6F6066` → 5.38:1 |

Files: `styles/tokens.css`, `Home.css`, `Shop.css`, `Tiles.tsx`, `Occasions.css`, `Reels.css`, `About.css`.

### QA-08 · Occasion panel on phones
**Fix (`Occasions.css`, ≤600px):** the photo now sits above the card instead of underneath it, so real photos won't be hidden.

### QA-09 · Gift Finder on phones
**Fix (`GiftFinder.tsx`, `Shop.css`, ≤600px):** the three questions fold behind a **Refine** button (shows "Refine · 2 set" when filters are active). The first product now appears in the first screen (≈577px instead of ≈1,500px). Desktop is unchanged.

### QA-10 · Offers banner
**Fix (`src/data/site.ts`):** the banner now teases "a surprise deal hiding in the gift box below" instead of printing the code.

### QA-11 · Reminder form errors
**Fix (`ReminderModal.tsx`):** empty field → "Please enter your WhatsApp number / email address"; invalid number → "Please enter a Sri Lankan mobile number, e.g. 71 234 5678"; focus moves to the field on every error; the confirmation shows the number neatly (`+94 77 123 4567`).

### QA-12 · Budget slider
**Fix (`ShopPage.tsx`):** the minimum is now the cheapest product rounded down to the 500 step (LKR 2,500), so every slider position shows gifts.

### QA-13 · Tap targets
**Fix:** reel dots 28px → 44px tap area (`Reels.css`), footer links 36px → 44px on phones (`Footer.css`), logo link min 44px (`Header.css`). Verified: no control under 44px on phones.

### QA-15 · Console clean-up
**Fix:** hero image uses the lowercase `fetchpriority="high"` that React 18 actually renders (`Hero.tsx`); React Router v7 future flags enabled (`main.tsx`). Console now shows no warnings or errors.

### QA-16 · Basket layout
**Fix (`CartDrawer.css`, `CartDrawer.tsx`):** delivery dates wrap to a second row instead of being cut off; on phones the sticky footer is slimmer (fine print moved into the scrolling area).

### QA-17 · Category tiles
**Fix (`Bento.tsx`, `Bento.css`):** Kinder Gifts and Hot Wheels now have the same arrow button as the other two tiles.

---

## Verification

- `npm run typecheck` and `npm run build` pass.
- Browser re-test of every item above; no sideways scroll at 360px on any page; no console warnings.
- API tested: invalid number / occasion rejected, number normalised to `94XXXXXXXXX`, repeat sign-ups merged, cancel works, admin list requires the token.

## Not tested

Real screen readers, iOS Safari, real swipe gestures, slow networks, and WhatsApp actually opening (external links were blocked during testing so nothing was sent).
