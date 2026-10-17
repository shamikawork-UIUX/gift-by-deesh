# Prompts for Claude Code — paste one at a time

Run `claude` inside this folder. Paste a step, let it finish, check the site in your browser (http://localhost:5173), ask for fixes if needed, then move on. Claude Code reads CLAUDE.md automatically.

---

## Step 1 · Project setup

```
Read CLAUDE.md and skim the four files in reference/. Set up a Vite + React + TypeScript project in this folder (keep CLAUDE.md, PROMPTS.md and reference/ where they are). Install react-router-dom, zustand and lucide-react. Create:
- src/styles/tokens.css with the design tokens and Google Fonts
- a Layout with the pink announcement bar, the sticky shrinking header (logo, nav, search, basket with badge) and the navy footer, matching reference/home.dc.html
- routes for /, /shop, /offers, /about with simple placeholder pages
Then start the dev server and tell me the URL. Initialise git and commit.
```

## Step 2 · Shared building blocks

```
Build the shared pieces used on every page, following CLAUDE.md:
1. src/data/products.ts (all products and prices from the reference files)
2. src/store/cart.ts — Zustand store persisted to localStorage: lines {key, name, price, qty, tint, details?, sub?}, add (merges same key), inc, dec (min 1), remove with undo, delivery date, gift note, payment choice (full / koko).
3. PriceBlock component with the KOKO line (or 3 × LKR X with [KOKO]).
4. ProductCard component.
5. useFlyToBasket hook + FlyLayer: token arcs from the clicked button into the header basket, then calls cart.add; basket wiggles, badge pops, "+N" drops below.
6. CartDrawer (right side) exactly like the cart in reference/shop.dc.html: staggered items, steppers, remove + undo bar, expandable box details, date chips (next 5 days from tomorrow), gift note, pay choice, sticky footer with total + KOKO, "Send order on WhatsApp" with the paper-plane animation, success view and empty-teddy state. Opens from the header basket.
7. src/lib/checkout.ts — builds the WhatsApp message (format in CLAUDE.md) and the wa.me link.
Commit when done.
```

## Step 3 · Homepage, part 1

```
Build the top half of the homepage from reference/home.dc.html: hero, bento "Find the perfect gift" grid with hover reveals, "Customer favourites" with tabs + carousel + hover image swap + slide-up add button, and the heart "send a hint" envelope animation (letter slides in, flap closes, heart seal, envelope flies away, "Hint sent!" toast; open WhatsApp with a hint message at the end). Use the shared ProductCard, PriceBlock and fly-to-basket. Commit.
```

## Step 4 · Homepage, part 2 — gift box builder

```
Build the rest of the homepage from reference/home.dc.html: the "Make every moment special" split occasion section, the navy custom band, the "Pack a gift box, your way" builder (sizes, item steppers with category chips, wrap colours, gift tag, live box with drop-in items, wiggle, remove on hover, hanging tag, fill meter, "Box is full!", totals + KOKO), the lid/ribbon/bow closing animation that flies the box into the header basket and adds it to the cart as ONE line with its contents as details, the reels coverflow and the "three taps" steps. Commit.
```

## Step 5 · Shop page + quick view

```
Build /shop from reference/shop.dc.html: Gift Finder (who / occasion / budget slider), vibe chips that tint the page, live match count, sort, grid that re-deals with a staggered animation on every filter change, Gift/Wrapped toggle with the wrapping animation, the "Build your own box" tile and the wide "under LKR 5,000" guide tile mixed into the grid, and the empty state. Quick view is a CENTRED MODAL (two columns: photo left, details right; size, add-ons, quantity, live total + KOKO, add to basket with fly animation). Commit.
```

## Step 6 · Offers page

```
Build /offers from reference/offers.dc.html: hero with floating treats and live countdown (end date in src/data/offers.ts), "Unwrap a deal" tap-3-times gift with speech bubble, confetti, waving teddy and SWEET10 coupon with copy button, combo cards, the gifting calendar with the email reminder popup (validation, shake, success with ringing bell; just store the email in state for now and leave a TODO to connect Mailchimp/Brevo), and the PANIC button section. All adds use fly-to-basket. Commit.
```

## Step 7 · About & Contact page

```
Build /about from reference/about.dc.html: hero with waving heart, self-drawing squiggle and fanning polaroids; the scrapbook story with 3D page turns; the "gift machine" (Pick → Wrap → Ribbon → Deliver with play/pause and the scooter); flip-card promises; the two WhatsApp contact cards with copy-number; the FAQ accordion. Keep all [placeholders]. Commit.
```

## Step 8 · Polish pass

```
Go through every page at 375px, 768px and 1440px and fix layout issues. Add the mobile nav menu. Check accessibility (focus states, labels, Escape closes modal/drawer, focus trap, contrast, prefers-reduced-motion). Make sure the cart persists across pages and refreshes. Run npm run build with no errors. Commit.
```

## Step 9 · Deploy (when ready)

```
Help me deploy this site to Netlify (or Vercel) with SPA routing set up so /shop, /offers and /about work on refresh. Explain each step simply.
```

---

**Tips**
- If something looks off, describe it plainly or drag a screenshot into Claude Code: "the bento tiles are too short, compare with reference/home.dc.html".
- If a step is too big, ask for one section at a time.
- `git log` shows your commits; if something breaks badly you can ask Claude Code to go back to the last commit.
