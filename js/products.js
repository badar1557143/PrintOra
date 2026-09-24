/* =========================================================
   PRINTORIA — Product data
   Edit this array to add, remove, or update products. Every
   page (shop, home, product detail, search) reads from here.
   ========================================================= */

const PRODUCTS = [
  {
    id: 1,
    name: "Classic Custom T-Shirt",
    seoTitle: "Custom Printed Cotton T-Shirt – Design Your Own | PrintOria",
    seo: {
      h1: "Custom Printed Cotton T-Shirt – Design Your Own",
      metaDescription: "Design your own custom printed cotton T-shirt with PrintOria. Soft ringspun cotton, 7 colors, sizes S–XXL. Upload a photo, name, or artwork — front or back.",
      breadcrumbName: "Custom Printed Cotton T-Shirt",
      ogImage: "assets/products/tee-plain-white.webp",
      imageAltBase: "Custom printed cotton T-shirt",
      featuresHTML: "Turn a plain tee into something that's actually yours. This custom printed cotton T-shirt is made on soft ringspun cotton and printed to order — upload a photo, your own artwork, a name, or a message, and print it on the front, the back, or both." +
        "<ul style=\"margin:10px 0 0;padding-left:18px;\">" +
        "<li>Soft ringspun cotton, printed to order</li>" +
        "<li>Front print, back print, or both (Rs. 200 per side)</li>" +
        "<li>7 colors: White, Black, Navy, Sky Blue, Mustard, Beige, Brown</li>" +
        "<li>Sizes S–XXL — see the Size Guide below for exact measurements</li>" +
        "<li>Upload your own photo, artwork, name, or message in the Design Studio</li>" +
        "</ul>",
      materials: "Soft ringspun cotton, printed to order.",
      faq: [
        { q: "What material is this shirt made from?", a: "Soft ringspun cotton, printed to order." },
        { q: "Can I print on both the front and back?", a: "Yes — front and back printing are each Rs. 200, added when you build your design in the Design Studio." },
        { q: "What sizes are available?", a: "S, M, L, XL, and XXL. Check the Size Guide above for exact chest, length, shoulder, and sleeve measurements in inches." },
        { q: "How long does production take?", a: "Because every shirt is made to order, production takes 2–4 days before it ships." },
        { q: "Can I return a custom T-shirt?", a: "Since each shirt is personalized, returns are accepted only if it arrives damaged or incorrect." }
      ]
    },
    category: "T-Shirts",
    price: 1499,
    oldPrice: null,
    rating: 4.8,
    reviews: 214,
    image: "assets/products/tee-plain-white.webp",
    // One photo per color: the customize + product pages swap the preview when a color is picked.
    colorImages: {
      "White":    "assets/products/tee-plain-white.webp",
      "Black":    "assets/products/tee-plain-black.webp",
      "Navy":     "assets/products/tee-plain-navy.webp",
      "Sky Blue": "assets/products/tee-plain-sky-blue.webp",
      "Mustard":  "assets/products/tee-plain-mustard.webp",
      "Beige":    "assets/products/tee-plain-beige.webp",
      "Brown":    "assets/products/tee-plain-brown.webp"
    },
    // Dedicated Design Studio mockups (customize.html) — front/back per color, one
    // pair per garment color so the Front/Back Print Sides show the right photo.
    frontColorImages: {
      "White":    "assets/products/tee-front-white.webp",
      "Black":    "assets/products/tee-front-black.webp",
      "Navy":     "assets/products/tee-front-navy.webp",
      "Sky Blue": "assets/products/tee-front-skyblue.webp",
      "Mustard":  "assets/products/tee-front-mustard.webp",
      "Beige":    "assets/products/tee-front-beige.webp",
      "Brown":    "assets/products/tee-front-brown.webp"
    },
    backColorImages: {
      "White":    "assets/products/tee-back-white.webp",
      "Black":    "assets/products/tee-back-black.webp",
      "Navy":     "assets/products/tee-back-navy.webp",
      "Sky Blue": "assets/products/tee-back-skyblue.webp",
      "Mustard":  "assets/products/tee-back-mustard.webp",
      "Beige":    "assets/products/tee-back-beige.webp",
      "Brown":    "assets/products/tee-back-brown.webp"
    },
    // Dashed print guide in the Design Studio, as % insets of the preview (top right bottom left)
    printArea: "30% 27% 26% 27%",
    gallery: [
      "assets/products/tee-plain-white.webp",
      "assets/products/tee-plain-black.webp",
      "assets/products/tee-plain-navy.webp",
      "assets/products/tee-plain-sky-blue.webp",
      "assets/products/tee-plain-mustard.webp",
      "assets/products/tee-plain-beige.webp",
      "assets/products/tee-plain-brown.webp"
    ],
    description: "Create a T-shirt with your own design. Soft ringspun cotton, printed to order with your name, photo, or artwork.",
    tags: ["shirt", "apparel", "custom", "cotton"],
    colors: ["White", "Black", "Navy", "Sky Blue", "Mustard", "Beige", "Brown"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    // Print Sides — the Design Studio (customize.html) shows one card per side.
    // "garment" sides print directly on the product photo; "flat" sides (no garment
    // photo available yet) show a plain mock backdrop instead, keyed by flatTone.
    // price is added to the order total only once the customer adds a design to that side.
    sides: [
      { id: "front", label: "Front", sublabel: "Front side design", price: 200, dims: '175" × 280"', view: "garment", printArea: "30% 27% 26% 27%" },
      { id: "back", label: "Back", sublabel: "Back design", price: 200, dims: '185" × 282"', view: "garment", printArea: "25% 25% 21% 25%" }
    ],
    customizable: true
  },
  {
    id: 2,
    name: "Personalized Ceramic Mug",
    category: "Mugs",
    price: 899,
    oldPrice: 1099,
    rating: 4.9,
    reviews: 356,
    image: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1481391319762-47dff72954d9?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Start your day with something personal. Dishwasher-safe ceramic mug, printed with your name, photo, or message.",
    tags: ["mug", "ceramic", "coffee", "gift"],
    colors: ["White", "Black"],
    sizes: ["11oz", "15oz"],
    customizable: true
  },
  {
    id: 4,
    name: "Personalized Photo Frame",
    category: "Photo Frames",
    price: 1799,
    oldPrice: null,
    rating: 4.9,
    reviews: 189,
    image: "assets/products/photo-frame-botanical.jpg",
    gallery: [
      "assets/products/photo-frame-botanical.jpg",
      "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Turn memories into something tangible. Solid wood photo frame with an optional engraved message along the edge.",
    tags: ["frame", "photo", "gift", "wood"],
    colors: ["Oak", "Black", "White"],
    sizes: ["4x6", "5x7", "8x10"],
    customizable: true
  },
  {
    id: 5,
    name: "Custom Hoodie",
    category: "Hoodies",
    price: 2999,
    oldPrice: 3499,
    rating: 4.8,
    reviews: 268,
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1542406775-a5eee5f5b0fa?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1509942774463-acf339cf87d5?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Comfort with your own style. A heavyweight fleece hoodie, printed or embroidered with your design.",
    tags: ["hoodie", "apparel", "custom", "fleece"],
    colors: ["Black", "Grey", "Maroon"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    sides: [
      { id: "front", label: "Front", sublabel: "Front side design", price: 250, dims: '180" × 300"', view: "garment", printArea: "24% 22% 30% 22%" },
      { id: "back", label: "Back", sublabel: "Back design", price: 250, dims: '190" × 305"', view: "garment", printArea: "20% 20% 26% 20%" }
    ],
    customizable: true
  },
  {
    id: 6,
    name: "Custom Tote Bag",
    category: "Tote Bags",
    price: 999,
    oldPrice: null,
    rating: 4.6,
    reviews: 97,
    image: "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1607344645866-009c320b63e0?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Carry something uniquely yours. Heavy canvas tote, printed with your design and built to last.",
    tags: ["tote", "bag", "canvas", "custom"],
    colors: ["Natural", "Black"],
    sizes: ["Standard"],
    customizable: true
  },
  {
    id: 7,
    name: "Personalized Phone Case",
    category: "Phone Cases",
    price: 1299,
    oldPrice: null,
    rating: 4.7,
    reviews: 143,
    image: "https://images.unsplash.com/photo-1601593346740-925612772716?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1601593346740-925612772716?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1585060544812-6b45742d762f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Protect your phone with personality. Impact-resistant case printed with your photo or design.",
    tags: ["phonecase", "accessory", "custom"],
    colors: ["Clear", "Black", "White"],
    sizes: ["iPhone", "Samsung"],
    customizable: true
  },
  {
    id: 8,
    name: "Custom Poster",
    category: "Posters",
    price: 1199,
    oldPrice: null,
    rating: 4.8,
    reviews: 88,
    image: "https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1582053433976-25c00369fc93?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Museum-quality giclée print of your photo or design, ready to frame.",
    tags: ["poster", "print", "wall art"],
    colors: ["Matte", "Glossy"],
    sizes: ["A4", "A3", "A2"],
    customizable: true
  },
  {
    id: 9,
    name: "Engraved Wooden Keychain",
    category: "Personalized Gifts",
    price: 599,
    oldPrice: null,
    rating: 4.9,
    reviews: 301,
    image: "https://images.unsplash.com/photo-1622560481156-3ca4dc8dd8c0?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1622560481156-3ca4dc8dd8c0?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1611930021592-a8cbe5c4d5cf?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Make every occasion special. A small laser-engraved keychain with a name, date, or short message.",
    tags: ["keychain", "gift", "wood", "engraving"],
    colors: ["Natural", "Dark Walnut"],
    sizes: ["Standard"],
    customizable: true
  },
  {
    id: 10,
    name: "Custom Baby Onesie",
    category: "Personalized Gifts",
    price: 1099,
    oldPrice: null,
    rating: 4.9,
    reviews: 176,
    image: "https://images.unsplash.com/photo-1522771930-78848d9293e8?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1522771930-78848d9293e8?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80"
    ],
    description: "A soft cotton onesie printed with a name or short message — a gift that's made for one baby only.",
    tags: ["baby", "gift", "apparel", "onesie"],
    colors: ["White", "Pale Yellow", "Sage"],
    sizes: ["0-3m", "3-6m", "6-12m"],
    customizable: true
  },
  {
    id: 11,
    name: "Custom Enamel Pin",
    category: "Personalized Gifts",
    price: 499,
    oldPrice: null,
    rating: 4.5,
    reviews: 64,
    image: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1620799139507-2a76f79a2f4d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1608889825205-eebdb9fc5806?auto=format&fit=crop&w=800&q=80"
    ],
    description: "A hard-enamel pin made from your own design or logo — small batches welcome.",
    tags: ["pin", "enamel", "accessory"],
    colors: ["Gold", "Silver", "Black"],
    sizes: ["Standard"],
    customizable: true
  },
  {
    id: 12,
    name: "Personalized Cutting Board",
    category: "Personalized Gifts",
    price: 2499,
    oldPrice: 2899,
    rating: 4.8,
    reviews: 112,
    image: "https://images.unsplash.com/photo-1594226801341-3f8f30ba1fee?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1594226801341-3f8f30ba1fee?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1584990347449-a5d9f800a783?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Solid maple cutting board, engraved with a family name or recipe — a kitchen piece made to be used.",
    tags: ["cutting board", "kitchen", "wood", "gift"],
    colors: ["Maple", "Walnut"],
    sizes: ["Medium", "Large"],
    customizable: true
  }
];

const CATEGORIES = [
  { name: "T-Shirts", desc: "Wear your personality.", image: "assets/products/tee-lucky-green.png" },
  { name: "Mugs", desc: "Start your day with something personal.", image: "assets/products/mug-gold-script.png" },
  { name: "Photo Frames", desc: "Turn memories into something tangible.", image: "assets/products/photo-frame-botanical.jpg" },
  { name: "Hoodies", desc: "Comfort with your own style.", image: "assets/products/hoodie-blue.png" },
  { name: "Tote Bags", desc: "Carry something uniquely yours.", image: "assets/products/tote-canvas.png" },
  { name: "Phone Cases", desc: "Protect your phone with personality.", image: "assets/products/phonecase-emerald-leaf.png" },
  { name: "Personalized Gifts", desc: "Make every occasion special.", image: "assets/products/mug-valentine.png" }
];

const TESTIMONIALS = [
  { name: "Sarah M.", rating: 5, text: "Exactly what I imagined. The print looked great and the quality exceeded my expectations." },
  { name: "Ahmed K.", rating: 5, text: "The customization process was simple and the mug turned out beautifully." },
  { name: "Fatima R.", rating: 5, text: "Ordered a photo frame as a gift — the print quality and finish were better than I expected." }
];

/* Utility: format price stored in cents-free integer (e.g. 1499 = Rs. 1,499) */
function formatPrice(amount){
  return "Rs. " + amount.toLocaleString("en-PK");
}

/* Utility: compact count for "N people searched for this" (e.g. 120300 -> "120.3k") */
function formatCount(n){
  if (n >= 1000){
    return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  }
  return String(n);
}

function getProductById(id){
  return PRODUCTS.find(p => p.id === Number(id));
}

function starString(rating){
  const full = Math.round(rating);
  return "★★★★★☆☆☆☆☆".slice(5 - full, 10 - full);
}

/* Utility: swatch color for a color name (used by product + customize pages) */
function colorToHex(name){
  const map = {
    White: "#F5F4F0", Black: "#1B1C1E", Navy: "#1F2A44", Grey: "#9C9A93",
    Maroon: "#5B1F26", Natural: "#E7DFCB", Oak: "#C9A66B", Walnut: "#5B3A29",
    "Dark Walnut": "#4A2E1F", Gold: "#C9A24B", Clear: "#E9E9EA", Maple: "#D8B98A",
    Matte: "#DAD7CF", Glossy: "#EFEDE7", Silver: "#C7C7C9", "Pale Yellow": "#F3E7B8", Sage: "#B7C4B0",
    "Sky Blue": "#AEC4D1", Mustard: "#E2A033", Beige: "#CFAD8C", Brown: "#5C3120"
  };
  return map[name] || "#CFCBC0";
}

/* Products that can be opened in the Design Studio (customize.html) */
function getCustomizableProducts(){
  return PRODUCTS.filter(p => p.customizable !== false);
}

/* Print Sides for the Design Studio. Products with their own `sides` array (see the
   T-Shirt / Hoodie entries above) get the multi-side picker; everything else falls
   back to a single implicit side so the rest of customize.js can treat every product
   the same way. */
function getEffectiveSides(p){
  if (p.sides && p.sides.length) return p.sides;
  return [{ id: "default", label: p.name, price: 0, view: "garment", printArea: p.printArea || "" }];
}

/* Link to the customization page with a product pre-selected */
function customizeURL(id){
  return "customize.html?id=" + encodeURIComponent(id);
}

/* Preview photo for a chosen color (falls back to the product's main photo when it has no per-color photos) */
function getColorImage(product, color){
  return (product.colorImages && product.colorImages[color]) || product.gallery[0];
}

/* Design Studio stage photo for a given Print Side + color (see customize.html).
   Prefers the side-specific mockup (frontColorImages / backColorImages) set on the
   product, falling back to the ordinary color photo for products that don't have
   dedicated Design Studio mockups. */
function getStageImage(product, color, sideId){
  if (sideId === "back" && product.backColorImages && product.backColorImages[color]){
    return product.backColorImages[color];
  }
  if (product.frontColorImages && product.frontColorImages[color]){
    return product.frontColorImages[color];
  }
  return getColorImage(product, color);
}

/* True for dark colors — used to pick a readable default text color on dark garments */
function isDarkColor(name){
  const hex = colorToHex(name).replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) < 110;
}
