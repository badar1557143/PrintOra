# PRINTORIA — Print-on-Demand E-commerce Website

A complete front-end e-commerce site (HTML5 / CSS3 / vanilla JS) for a
personalized-products brand: T-shirts, mugs, name plates, photo frames,
hoodies, tote bags, phone cases, posters, and gifts.

## How to view it

No build step needed — it's static HTML/CSS/JS.

1. Unzip the folder.
2. Open `index.html` in a browser, **or** for full functionality
   (some browsers restrict `localStorage`/fetch on `file://`), serve it
   locally, e.g.:
   ```
   cd PRINTORIA
   python3 -m http.server 8080
   ```
   then visit `http://localhost:8080`.

## Structure

```
PRINTORIA/
├── index.html        Home page
├── shop.html          All products, filters, search, sort
├── product.html       Product detail page (?id=…) with a "Customize This Product" button
├── customize.html     Customization page + live Design Studio (?id=… pre-selects the product)
├── cart.html          Cart (persisted in localStorage)
├── checkout.html      Checkout UI (front-end only, no payment wired up)
├── about.html         About + FAQ
├── contact.html       Contact form (front-end only)
├── css/style.css      Full design system + all page styles
├── js/products.js     Central product data array — edit this to add/change products
├── js/main.js         Shared nav, cart badge, wishlist, homepage + shop rendering
├── js/cart.js         Cart & checkout page logic
├── js/product.js      Product detail page logic
├── js/customize.js    Customization page: product picker + Design Studio (Fabric.js canvas)
└── assets/            Empty folders (images/, products/, icons/) reserved
                        for your own local photography if you want to
                        replace the Unsplash images referenced in
                        products.js
```

## Images

Product and lifestyle photography currently links to hotlinked,
license-free Unsplash photos (chosen to visually match each product
type) so the site looks real out of the box. For production, download
your own licensed photography into `assets/products/` and update the
`image` / `gallery` fields in `js/products.js` to local paths.

## What's real vs. placeholder

- **Real & working:** navigation, mobile menu, search, category/price
  filters, sorting, wishlist, the live **Design Studio** on the
  customization page (add unlimited text and uploaded-image layers, drag/resize/rotate
  each one on the product, undo/redo, layer reordering, delete/duplicate),
  cart (add/update/remove, persisted with `localStorage`, with a composed
  thumbnail of each customer's design), order summary math, and form
  validation.
- **Placeholder / not connected:** checkout does not charge a card or
  create a real order — there's no backend or payment gateway. The
  contact form and newsletter form don't send real emails. Swap these
  for real API calls when you connect a backend.

## Customization page

Every product's **Customize** button (shop grid, home page, related
products) links to `customize.html?id=<product id>`, so the page opens with
that product already selected. The "Customize This Product" button on
`product.html` and the "Customization" nav / hero links use the same page
(with no `?id`, it opens on the first product).

- A product strip at the top lists every customizable product; picking another
  one swaps the preview, price, colors and sizes **without losing the design**
  the customer has built, and keeps the address bar (`?id=`) in sync.
- Unknown or missing ids fall back to the first product.
- A product with `customizable: false` in `js/products.js` shows a plain
  "View" button instead and is left out of the strip.

## Design Studio

`customize.html` loads [Fabric.js](http://fabricjs.com/) from a CDN
(`<script src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js">`)
to power the live customizer:

- **Add Text** / **Upload Image** add new layers to an HTML canvas that
  sits over the product photo. Each layer can be dragged, resized (drag
  the corner handle), and rotated (drag the top handle) directly on the
  product — the preview always shows exactly what's been added.
- The **Properties** tab edits whatever layer is selected (text content,
  font, color, size, bold/italic, alignment; image opacity). The
  **Layers** tab lists every layer with reorder / delete controls.
- **Undo/Redo** and **Reset** are backed by an in-memory history stack.
- On "Add to Cart" / "Buy Now", the whole layered design is saved with
  the cart line item as JSON (so it's not lost, and could later be
  re-opened for editing or sent to a backend for production), plus a
  flattened preview image composited from the product photo + the
  design layers for display in the cart. If the product photo can't be
  read back into a canvas because of CORS (only matters for remote
  stock photos, not your own local files), the preview image is skipped
  gracefully but the design itself is still saved.
- Needs an internet connection to load Fabric.js from the CDN; for a
  fully offline build, download `fabric.min.js` and reference it
  locally instead.

## Customizing

Add or edit products by editing the `PRODUCTS` array in
`js/products.js` — every page reads from that single source, so a new
product automatically appears in the shop grid, search, and (via its
`id`) on `product.html?id=<id>`.

### Per-color product photos

A product can carry one photo per color. In `js/products.js` add
`colorImages: { "Black": "assets/products/….webp", … }` (keys must match the
names in `colors`). The customization page then swaps the preview photo when a
color swatch is clicked, and the product page keeps its gallery and swatches in
sync. The Classic Custom T-Shirt uses this with 7 colors (White, Black, Navy,
Sky Blue, Mustard, Beige, Brown) — photos are in `assets/products/tee-plain-*.webp`.

Optional `printArea: "top right bottom left"` (percent insets, e.g.
`"30% 27% 26% 27%"`) positions the dashed print guide on the preview. New
swatch colors go in `colorToHex()` in `js/products.js`.
