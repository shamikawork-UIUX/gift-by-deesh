# GiftsByDeesh — website build brief

GiftsByDeesh (House of Deesh (Pvt) Ltd) is a playful Sri Lankan gift shop: Kinder chocolate bouquets, teddy bears, Hot Wheels sets and custom gift boxes, delivered islandwide. There is **no online payment yet** — every order is sent to the shop on **WhatsApp**. A payment gateway will be added later, so keep checkout logic in one place that is easy to swap.

## Stack

- Vite + React 18 + TypeScript
- React Router (routes: `/`, `/shop`, `/offers`, `/about`)
- Zustand for the cart (persist to localStorage so the basket survives page changes and refreshes)
- Plain CSS with CSS custom properties (one `tokens.css` + one CSS file per component). No UI kit.
- CSS keyframes for most animations; Framer Motion is allowed for the modal/drawer enter/exit if it keeps code simpler.
- Icons: `lucide-react`. Never emoji in the UI.

## Reference prototypes — read these first

`reference/` holds four working, interactive prototypes (one per page). They are the **visual and behavioural spec**:

| File | Page |
|---|---|
| `reference/home.dc.html` | Homepage `/` |
| `reference/shop.dc.html` | Shop Gifts `/shop` |
| `reference/offers.dc.html` | Offers `/offers` |
| `reference/about.dc.html` | About & Contact `/about` |

They use a template format, not React:
- `<helmet><style>` at the top = all CSS and keyframes (reuse these values and animations closely).
- Markup with `{{value}}` placeholders, `<sc-for list=… as=…>` = a loop, `<sc-if value=…>` = a conditional.
- The `<script type="text/x-dc">` at the bottom holds `class Component` = state, data and logic (`renderVals()` computes what the markup shows).

**Re-implement them as idiomatic React components** — do not copy the template format. Match the look, copy, data and animations as closely as possible. Where the four files repeat something (header, cart drawer, fly-to-basket, price block), build it ONCE as a shared component.

## Design tokens

```
--pink: #D6245F;        --pink-dark: #A8173F;
--ink: #1B1F3B;         --body: #4A4F66;        --muted: #6B6F85;
--cream: #FFF8F3;       --blush: #FBE3EA;       --blush-2: #FDF1F4;
--line: #F1E3E8;        --line-2: #EBD9DF;
--wa-green: #25D366;    --wa-ink: #0B2E17;      --sticker: #FFD84D;
```
Fonts (Google Fonts): **Fredoka** 500–700 for headings, **Plus Jakarta Sans** 400–700 for body, **Caveat** 600–700 for handwritten accents (About page only).
Cards radius 22–28px, buttons are pills, inputs radius 14px, max content width 1240px, section padding 96px, touch targets ≥ 44px.

## Site-wide rules (important)

1. **One basket only**: the basket icon in the sticky header. No floating cart buttons. The header is sticky and shrinks after 40px of scroll.
2. **Fly-to-basket**: every add-to-basket (product card, quick view, combo, panic picks, gift box) animates a token from the button into the header basket; on landing the basket wiggles, the badge pops and "+N" drops below the icon. Then the item is added to the shared cart.
3. **KOKO instalments**: everywhere a price appears (product cards, quick view total, box builder total, combos, panic picks, cart total) show `or 3 × LKR X with [KOKO]` where X = `Math.ceil(price / 3)` and KOKO is a small navy pill label. (Replace with KOKO's official badge from their merchant kit before launch.)
4. **Quick view = centred modal (bottom sheet on phones ≤760px). Cart = right-side drawer (full-screen on phones).** Never use the same pattern for both.
5. **Checkout = WhatsApp**: the cart's "Send order on WhatsApp" opens `https://wa.me/94721770653?text=…` with the order pre-written (format below). Put this in `src/lib/checkout.ts` so a payment gateway can replace it later.
6. Prices are in LKR, formatted `LKR 4,000` (`toLocaleString('en-US')`).
7. Accessibility: real `<button>`/`<a>`, labels on inputs, `aria-label` on icon buttons, text contrast ≥ 4.5:1, visible focus, modals/drawers trap focus and close on Escape, `prefers-reduced-motion` disables decorative loops.
8. Responsive, mobile-first: works from 360px to 1440px+. At ≤960px the nav becomes a fixed bottom tab bar (`TabBar.tsx`: Home, Shop, Offers, About); the basket stays in the header. Use the spacing tokens `--gutter`, `--sec-y`, `--sec-y-sm` (classes `.sec-y`, `.sec-t`, `.sec-b`…) instead of hard-coded section padding, and offset anything fixed to the bottom by `var(--bottom-ui)`.

### WhatsApp order message format

```
Hi GiftsByDeesh! I'd like to place an order:

1. Kinder Joy Bouquet × 2 — LKR 8,000
2. Custom Gift Box (Medium) × 1 — LKR 6,850
    • Kinder Joy ×4
    • Wrap: Blush pink
    • Gift tag: "Happy birthday!"

Delivery date: Saturday 17 October
Gift note: "Love you lots"
Payment: KOKO (3 instalments)
Total: LKR 14,850 (+ delivery, to be confirmed)
```

## Data

Put products, combos, occasions, box-builder items and FAQs in `src/data/*.ts`. Use the products and prices from the reference files. Many prices are **sample values** — keep them in data files so the client can edit them easily.

Contact: Gifts & teddies 072 177 0653 (wa: 94721770653) · Chocolate orders 072 896 2797 (wa: 94728962797) · Instagram @gifts_by_deesh · TikTok @giftsbydeesh.

## Placeholders still to fill (keep them visible as `[…]`)

`[TIME]`, `[AREA]` (delivery cut-off), `[DAYS]`, `[HOURS]` (opening hours), `[Founder name]`, story chapter `[YEAR]`s and text, payment methods, heat/melting policy, Mother's/Father's Day dates, all product photos (use soft coloured placeholder blocks with a label until real photos arrive — put images in `public/images/` later).

## Working style

- Build one step at a time (see `PROMPTS.md`). After each step make sure `npm run dev` runs with no errors or TypeScript warnings.
- Keep components small: `src/components/` (shared), `src/pages/` (one folder per page with its sections), `src/store/cart.ts`, `src/lib/`, `src/data/`.
