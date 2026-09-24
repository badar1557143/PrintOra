/* =========================================================
   PRINTORIA — Shared site behavior
   Loaded on every page. Handles navigation, cart badge,
   wishlist, toast notifications, and homepage rendering.
   ========================================================= */

/* ---------- Storage helpers (shared with cart.js / product.js) ---------- */
const STORAGE_CART = "printoria_cart";
const STORAGE_WISHLIST = "printoria_wishlist";

/* ---------- WhatsApp ----------
   One number powers the floating chat bubble (every page) plus the "Buy on
   WhatsApp" (product.html) and "Checkout on WhatsApp" (checkout.html) buttons.
   Replace with your real WhatsApp Business number: country code + number,
   digits only — no "+", spaces, or leading zero (e.g. Pakistan 03xx-xxxxxxx
   becomes "923xxxxxxxxx"). */
const WHATSAPP_NUMBER = "923222920135";

function whatsappLink(message){
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

// Floating chat bubble, added to every page that loads main.js.
function initWhatsAppFloat(){
  if (document.getElementById("whatsapp-float")) return;
  const a = document.createElement("a");
  a.id = "whatsapp-float";
  a.className = "whatsapp-float";
  a.target = "_blank";
  a.rel = "noopener";
  a.setAttribute("aria-label", "Chat with us on WhatsApp");
  a.title = "Chat with us on WhatsApp";
  a.href = whatsappLink("Hi PRINTORIA! I have a question.");
  a.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 1.67c2.19 0 4.25.85 5.8 2.4a8.2 8.2 0 0 1 2.42 5.84c0 4.55-3.71 8.25-8.25 8.25a8.24 8.24 0 0 1-4.2-1.15l-.3-.18-3.14.82.84-3.06-.2-.32a8.18 8.18 0 0 1-1.26-4.37c0-4.55 3.71-8.23 8.29-8.23zm-4.55 4.74c-.16 0-.42.06-.64.3-.22.24-.85.83-.85 2.03 0 1.2.87 2.35.99 2.51.12.16 1.7 2.7 4.19 3.68 2.07.82 2.49.66 2.94.62.45-.04 1.45-.59 1.65-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28-.24-.12-1.45-.71-1.67-.79-.22-.08-.39-.12-.55.12-.16.24-.63.79-.77.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.34-.76-1.83-.2-.48-.4-.42-.55-.42h-.35z"/></svg>`;
  document.body.appendChild(a);
}

/* ---------- Design file downloads (PNG / JPG / TIFF) ---------- */
// Shared by the Design Studio and the cart's "Download Design" menu. Print
// shops expect PNG (transparent), JPG (flattened, no transparency), or TIFF
// (uncompressed, high quality). We only ever start from a transparent PNG,
// then convert on the fly for the other two.

function triggerFileDownload(href, filename){
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// Encodes raw RGBA pixel data as an uncompressed baseline TIFF (no external
// library needed). Keeps the alpha channel, and tags the file at 300 DPI.
function encodeUncompressedTiff(width, height, rgba){
  const entries = [
    [256, 4, 1, width],                 // ImageWidth (LONG)
    [257, 4, 1, height],                // ImageLength (LONG)
    [258, 3, 4, null],                  // BitsPerSample (SHORT x4) -> offset filled in below
    [259, 3, 1, 1],                     // Compression: none
    [262, 3, 1, 2],                     // PhotometricInterpretation: RGB
    [273, 4, 1, null],                  // StripOffsets -> offset filled in below
    [277, 3, 1, 4],                     // SamplesPerPixel (RGBA)
    [278, 4, 1, height],                // RowsPerStrip
    [279, 4, 1, rgba.length],           // StripByteCounts
    [282, 5, 1, null],                  // XResolution -> offset
    [283, 5, 1, null],                  // YResolution -> offset
    [296, 3, 1, 2],                     // ResolutionUnit: inches
    [338, 3, 1, 2]                      // ExtraSamples: unassociated alpha
  ];
  const ifdStart = 8;
  const ifdSize = 2 + entries.length * 12 + 4;
  const bitsPerSampleOffset = ifdStart + ifdSize;
  const xResOffset = bitsPerSampleOffset + 8;
  const yResOffset = xResOffset + 8;
  const pixelDataOffset = yResOffset + 8;
  const buffer = new ArrayBuffer(pixelDataOffset + rgba.length);
  const view = new DataView(buffer);

  view.setUint8(0, 0x49); view.setUint8(1, 0x49); // "II" little-endian
  view.setUint16(2, 42, true);
  view.setUint32(4, ifdStart, true);

  let p = ifdStart;
  view.setUint16(p, entries.length, true); p += 2;
  entries.forEach(([tag, type, count, value]) => {
    let v = value;
    if (tag === 258) v = bitsPerSampleOffset;
    if (tag === 273) v = pixelDataOffset;
    if (tag === 282) v = xResOffset;
    if (tag === 283) v = yResOffset;
    view.setUint16(p, tag, true); p += 2;
    view.setUint16(p, type, true); p += 2;
    view.setUint32(p, count, true); p += 4;
    view.setUint32(p, v, true); p += 4;
  });
  view.setUint32(p, 0, true); // no more IFDs

  [8, 8, 8, 8].forEach((bits, i) => view.setUint16(bitsPerSampleOffset + i * 2, bits, true));
  view.setUint32(xResOffset, 300, true); view.setUint32(xResOffset + 4, 1, true);
  view.setUint32(yResOffset, 300, true); view.setUint32(yResOffset + 4, 1, true);

  new Uint8Array(buffer, pixelDataOffset).set(rgba);
  return new Blob([buffer], { type: "image/tiff" });
}

// pngDataUrl must be a transparent PNG. format is "png" | "jpg" | "tiff".
function downloadDesignAsFormat(pngDataUrl, format, filenameBase){
  if (format === "png"){
    triggerFileDownload(pngDataUrl, `${filenameBase}.png`);
    return;
  }
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");

    if (format === "jpg"){
      // JPG has no transparency, so flatten onto white first.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      triggerFileDownload(canvas.toDataURL("image/jpeg", 0.92), `${filenameBase}.jpg`);
      return;
    }

    if (format === "tiff"){
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const blob = encodeUncompressedTiff(canvas.width, canvas.height, data);
      const url = URL.createObjectURL(blob);
      triggerFileDownload(url, `${filenameBase}.tiff`);
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    }
  };
  img.src = pngDataUrl;
}

// Builds (or reuses) the small "PNG / JPG / TIFF" popover menu next to a
// trigger button. onPick(format) is called with "png" | "jpg" | "tiff".
function attachDownloadMenu(triggerBtn, wrap, onPick){
  let menu = wrap.querySelector(".download-menu");
  if (!menu){
    menu = document.createElement("div");
    menu.className = "download-menu";
    menu.innerHTML = `
      <button type="button" data-format="png">PNG<small>Transparent background</small></button>
      <button type="button" data-format="jpg">JPG<small>Flattened, no transparency</small></button>
      <button type="button" data-format="tiff">TIFF<small>Uncompressed, print quality</small></button>
    `;
    wrap.appendChild(menu);
    menu.querySelectorAll("button[data-format]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        menu.classList.remove("open");
        onPick(btn.dataset.format);
      });
    });
  }
  triggerBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    document.querySelectorAll(".download-menu.open").forEach(m => { if (m !== menu) m.classList.remove("open"); });
    menu.classList.toggle("open");
  });
  document.addEventListener("click", () => menu.classList.remove("open"));
}

function getCart(){
  try{ return JSON.parse(localStorage.getItem(STORAGE_CART)) || []; }
  catch(e){ return []; }
}
function saveCart(cart){
  localStorage.setItem(STORAGE_CART, JSON.stringify(cart));
  updateCartBadge();
}
function cartCount(){
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}
function addToCart(item){
  const cart = getCart();
  // Combine identical variant + product
  const existing = cart.find(c =>
    c.id === item.id && c.color === item.color && c.size === item.size &&
    JSON.stringify(c.customDesign || null) === JSON.stringify(item.customDesign || null)
  );
  if (existing){ existing.qty += item.qty; }
  else { cart.push(item); }
  saveCart(cart);
}

function getWishlist(){
  try{ return JSON.parse(localStorage.getItem(STORAGE_WISHLIST)) || []; }
  catch(e){ return []; }
}
function toggleWishlist(id){
  let list = getWishlist();
  if (list.includes(id)) list = list.filter(x => x !== id);
  else list.push(id);
  localStorage.setItem(STORAGE_WISHLIST, JSON.stringify(list));
  return list.includes(id);
}

function updateCartBadge(){
  document.querySelectorAll(".js-cart-count").forEach(el => {
    const count = cartCount();
    el.textContent = count;
    el.style.display = count > 0 ? "flex" : "none";
  });
}

/* ---------- Toast ---------- */
let toastTimer = null;
function showToast(message){
  let toast = document.getElementById("toast");
  if (!toast){
    toast = document.createElement("div");
    toast.id = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

/* ---------- Mobile nav ---------- */
function initMobileNav(){
  const btn = document.getElementById("hamburger");
  const nav = document.getElementById("mobile-nav");
  if (!btn || !nav) return;
  btn.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
  const close = () => {
    nav.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
  };

  nav.querySelectorAll("a").forEach(a => a.addEventListener("click", close));

  // Rotating a phone or widening the window shouldn't leave the drawer
  // half-open behind the desktop nav.
  let last = window.innerWidth;
  window.addEventListener("resize", () => {
    if (window.innerWidth !== last){
      last = window.innerWidth;
      if (window.innerWidth > 900) close();
    }
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && nav.classList.contains("open")){ close(); btn.focus(); }
  });
}

/* ---------- Newsletter ---------- */
function initNewsletter(){
  const form = document.querySelector(".newsletter-form");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = form.querySelector("input[type=email]");
    const msg = document.querySelector(".form-msg");
    if (input && input.value){
      msg.textContent = "You're subscribed. Watch your inbox for new designs and offers.";
      form.reset();
    } else {
      msg.textContent = "Please enter a valid email address.";
    }
  });
}

/* ---------- Reveal-on-scroll (shared observer, safe to call after any re-render) ---------- */
let revealObserver = null;
function getRevealObserver(){
  if (revealObserver || !("IntersectionObserver" in window)) return revealObserver;
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  return revealObserver;
}
// Call after any innerHTML update that introduces new .reveal elements —
// initial page load AND every dynamic re-render (shop filters/sort/search).
function observeReveal(root){
  const scope = root || document;
  const items = scope.querySelectorAll(".reveal:not(.visible)");
  if (items.length === 0) return;
  const io = getRevealObserver();
  if (!io){
    items.forEach(el => el.classList.add("visible"));
    return;
  }
  items.forEach(el => io.observe(el));
}
function initReveal(){
  observeReveal(document);
}

/* ---------- Product card builder (shared by home + shop) ---------- */
function productCardHTML(p){
  const isWishlisted = getWishlist().includes(p.id);
  const priceHTML = p.oldPrice
    ? `<span class="old">${formatPrice(p.oldPrice)}</span>${formatPrice(p.price)}`
    : formatPrice(p.price);
  return `
    <article class="product-card reveal">
      <div class="pc-media">
        <a href="${productURL(p)}" aria-label="View ${p.name}">
          <img src="${p.image}" alt="${p.name}" loading="lazy" width="400" height="400">
        </a>
        <button class="pc-wishlist ${isWishlisted ? "active" : ""}" data-id="${p.id}" aria-label="Add to wishlist" aria-pressed="${isWishlisted}">
          <svg viewBox="0 0 24 24" fill="${isWishlisted ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2"><path d="M12 21s-7.5-4.6-10-9.3C.4 8 2 4.5 5.6 4.1c2-.2 3.7.8 4.9 2.4C11.7 4.9 13.4 3.9 15.4 4.1 19 4.5 20.6 8 20 11.7 17.5 16.4 12 21 12 21z"/></svg>
        </button>
        <a class="pc-quick" href="${productURL(p)}">Quick View</a>
      </div>
      <div class="pc-body">
        <span class="pc-cat">${p.category}</span>
        <h3 class="pc-name">${p.name}</h3>
        <div class="pc-rating"><span class="stars">${starString(p.rating)}</span> ${p.rating} (${p.reviews})</div>
        <p class="pc-desc">${p.description}</p>
        <div class="pc-footer">
          <span class="pc-price">${priceHTML}</span>
          ${p.customizable === false
            ? `<a href="${productURL(p)}" class="btn btn-outline btn-sm">View</a>`
            : `<a href="${customizeURL(p.id)}" class="btn btn-outline btn-sm">Customize</a>`}
        </div>
      </div>
    </article>`;
}

function bindWishlistButtons(container){
  container.querySelectorAll(".pc-wishlist").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const id = Number(btn.dataset.id);
      const active = toggleWishlist(id);
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", active);
      btn.querySelector("svg").setAttribute("fill", active ? "currentColor" : "none");
      showToast(active ? "Added to wishlist" : "Removed from wishlist");
    });
  });
}

/* ---------- Homepage: category shortcuts, trending, just for you, testimonials ---------- */
function renderHomepage(){
  // Category shortcuts — small circular icons, one tap to a filtered shop view
  const catCircles = document.getElementById("category-circles");
  if (catCircles){
    catCircles.innerHTML = CATEGORIES.map(c => `
      <a href="shop.html?category=${encodeURIComponent(c.name)}" class="cat-circle" role="listitem">
        <span class="cat-circle-img">
          <img src="${c.image}" alt="" loading="lazy" width="140" height="140">
        </span>
        <span>${c.name}</span>
      </a>`).join("");
  }

  // Trending Now — the top category families, shown with a "searched for"
  // signal (derived from combined product review counts as a stand-in
  // for real search analytics)
  const trendRow = document.getElementById("trending-row");
  if (trendRow){
    const byCategory = CATEGORIES.map(c => {
      const inCat = PRODUCTS.filter(p => p.category === c.name);
      const reviews = inCat.reduce((sum, p) => sum + p.reviews, 0);
      return { ...c, image: inCat[0] ? inCat[0].image : c.image, searched: reviews * 480 };
    }).sort((a, b) => b.searched - a.searched).slice(0, 3);

    trendRow.innerHTML = byCategory.map(c => `
      <a href="shop.html?category=${encodeURIComponent(c.name)}" class="trend-card reveal">
        <div class="trend-media"><img src="${c.image}" alt="${c.name}" loading="lazy" width="400" height="400"></div>
        <h3>${c.name}</h3>
        <p>${formatCount(c.searched)} people searched for this</p>
      </a>`).join("");
  }

  const featured = document.getElementById("featured-grid");
  if (featured){
    featured.innerHTML = PRODUCTS.slice(0, 8).map(productCardHTML).join("");
    bindWishlistButtons(featured);
  }

  const testiGrid = document.getElementById("testimonial-grid");
  if (testiGrid){
    testiGrid.innerHTML = TESTIMONIALS.map(t => `
      <div class="testi-card reveal">
        <div class="testi-stars">${"★".repeat(t.rating)}</div>
        <p>"${t.text}"</p>
        <div class="testi-name">— ${t.name}</div>
      </div>`).join("");
  }
}

/* ---------- Shop page: filter, search, sort ---------- */
const shopState = { category: null, maxPrice: 5000, sort: "featured", query: "" };
const DEFAULT_MAX_PRICE = 5000;
// Populated by initShopPage; lets renderShop()'s empty-state reset button
// re-sync the filter controls without threading DOM refs between functions.
let shopSyncControls = null;

function initShopPage(){
  const grid = document.getElementById("shop-grid");
  if (!grid) return;

  const urlCategory = getURLParam("category");
  if (urlCategory) shopState.category = urlCategory;

  const priceRange = document.getElementById("price-range");
  const priceLabel = document.getElementById("price-range-label");
  const searchInput = document.getElementById("shop-search");
  const catWrap = document.getElementById("category-filters");
  const cats = [...new Set(PRODUCTS.map(p => p.category))];

  function renderCategoryCheckboxes(){
    const active = shopState.category
      ? (Array.isArray(shopState.category) ? shopState.category : [shopState.category])
      : [];
    catWrap.innerHTML = cats.map(c => {
      const count = PRODUCTS.filter(p => p.category === c).length;
      return `
      <label class="filter-check">
        <input type="checkbox" value="${c}" ${active.includes(c) ? "checked" : ""}>
        <span>${c}</span>
        <span class="filter-check-count">${count}</span>
      </label>`;
    }).join("");
    catWrap.querySelectorAll("input").forEach(cb => {
      cb.addEventListener("change", () => {
        const checked = [...catWrap.querySelectorAll("input:checked")].map(c => c.value);
        shopState.category = checked.length ? checked : null;
        renderShop();
      });
    });
  }
  renderCategoryCheckboxes();

  // Keep every control in sync with shopState — used after "Clear all"
  // and after removing a single filter chip.
  function syncControls(){
    renderCategoryCheckboxes();
    if (priceRange) priceRange.value = shopState.maxPrice;
    if (priceLabel) priceLabel.textContent = formatPrice(shopState.maxPrice);
    if (searchInput) searchInput.value = shopState.query;
  }
  shopSyncControls = syncControls;

  if (priceRange){
    priceRange.addEventListener("input", () => {
      shopState.maxPrice = Number(priceRange.value);
      priceLabel.textContent = formatPrice(shopState.maxPrice);
      renderShop();
    });
  }

  const sortSelect = document.getElementById("sort-select");
  if (sortSelect){
    sortSelect.addEventListener("change", () => {
      shopState.sort = sortSelect.value;
      renderShop();
    });
  }

  if (searchInput){
    searchInput.addEventListener("input", () => {
      shopState.query = searchInput.value.trim().toLowerCase();
      renderShop();
    });
  }

  const clearBtn = document.getElementById("clear-filters");
  if (clearBtn){
    clearBtn.addEventListener("click", () => {
      shopState.category = null;
      shopState.maxPrice = DEFAULT_MAX_PRICE;
      shopState.query = "";
      syncControls();
      renderShop();
    });
  }

  // Active-filter chip removal (event delegation — chips are re-rendered often)
  const activeFiltersWrap = document.getElementById("active-filters");
  if (activeFiltersWrap){
    activeFiltersWrap.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-remove]");
      if (!btn) return;
      const kind = btn.dataset.remove;
      if (kind === "category"){
        const cats2 = Array.isArray(shopState.category) ? shopState.category : [shopState.category];
        const remaining = cats2.filter(c => c !== btn.dataset.value);
        shopState.category = remaining.length ? remaining : null;
      } else if (kind === "price"){
        shopState.maxPrice = DEFAULT_MAX_PRICE;
      } else if (kind === "query"){
        shopState.query = "";
      }
      syncControls();
      renderShop();
    });
  }

  // Mobile filter drawer
  const filterToggle = document.getElementById("filter-toggle");
  const filtersPanel = document.getElementById("filters-panel");
  const filtersBackdrop = document.getElementById("filters-backdrop");
  const filtersClose = document.getElementById("filters-close");
  const filtersApply = document.getElementById("filters-apply");
  if (filterToggle && filtersPanel){
    const openFilters = () => {
      filtersPanel.classList.add("open");
      filtersBackdrop.classList.add("show");
      filterToggle.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    };
    const closeFilters = () => {
      filtersPanel.classList.remove("open");
      filtersBackdrop.classList.remove("show");
      filterToggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    };
    filterToggle.addEventListener("click", openFilters);
    filtersClose.addEventListener("click", closeFilters);
    filtersBackdrop.addEventListener("click", closeFilters);
    filtersApply.addEventListener("click", closeFilters);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && filtersPanel.classList.contains("open")) closeFilters();
    });
    let lastWidth = window.innerWidth;
    window.addEventListener("resize", () => {
      if (window.innerWidth !== lastWidth){
        lastWidth = window.innerWidth;
        if (window.innerWidth > 900) closeFilters();
      }
    });
  }

  renderShop();
}

function getURLParam(name){
  return new URLSearchParams(window.location.search).get(name);
}

function renderActiveFilters(){
  const wrap = document.getElementById("active-filters");
  const toggleCount = document.getElementById("filter-toggle-count");
  if (!wrap) return;

  const chips = [];
  if (shopState.category){
    const cats = Array.isArray(shopState.category) ? shopState.category : [shopState.category];
    cats.forEach(c => chips.push({ label: c, kind: "category", value: c }));
  }
  if (shopState.maxPrice && shopState.maxPrice < DEFAULT_MAX_PRICE){
    chips.push({ label: `Under ${formatPrice(shopState.maxPrice)}`, kind: "price" });
  }
  if (shopState.query){
    chips.push({ label: `"${shopState.query}"`, kind: "query" });
  }

  if (chips.length === 0){
    wrap.hidden = true;
    wrap.innerHTML = "";
  } else {
    wrap.hidden = false;
    wrap.innerHTML = chips.map(c => `
      <span class="filter-chip">
        ${c.label}
        <button type="button" data-remove="${c.kind}" ${c.value ? `data-value="${c.value}"` : ""} aria-label="Remove filter">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </span>`).join("") + `<button type="button" class="filter-chip-clear-all" data-remove="all">Clear all</button>`;
  }

  if (toggleCount){
    if (chips.length > 0){
      toggleCount.hidden = false;
      toggleCount.textContent = chips.length;
    } else {
      toggleCount.hidden = true;
    }
  }
}

function renderShop(){
  const grid = document.getElementById("shop-grid");
  const countEl = document.getElementById("result-count");
  let list = PRODUCTS.slice();

  if (shopState.category){
    const cats = Array.isArray(shopState.category) ? shopState.category : [shopState.category];
    list = list.filter(p => cats.includes(p.category));
  }
  if (shopState.maxPrice){
    list = list.filter(p => p.price <= shopState.maxPrice);
  }
  if (shopState.query){
    const q = shopState.query;
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    );
  }
  switch (shopState.sort){
    case "price-asc": list.sort((a,b) => a.price - b.price); break;
    case "price-desc": list.sort((a,b) => b.price - a.price); break;
    case "rating": list.sort((a,b) => b.rating - a.rating); break;
    default: break;
  }

  renderActiveFilters();

  countEl.textContent = `${list.length} product${list.length === 1 ? "" : "s"}`;
  if (list.length === 0){
    grid.innerHTML = `
      <div class="empty-state">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <p>No products match your filters yet.</p>
        <button type="button" class="btn btn-outline btn-sm" id="empty-reset">Clear all filters</button>
      </div>`;
    const resetBtn = document.getElementById("empty-reset");
    if (resetBtn){
      resetBtn.addEventListener("click", () => {
        shopState.category = null;
        shopState.maxPrice = DEFAULT_MAX_PRICE;
        shopState.query = "";
        if (shopSyncControls) shopSyncControls();
        renderShop();
      });
    }
    return;
  }
  grid.innerHTML = list.map(productCardHTML).join("");
  bindWishlistButtons(grid);
  observeReveal(grid);
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
  initMobileNav();
  initNewsletter();
  renderHomepage();
  initShopPage();
  initReveal();
  initWhatsAppFloat();
});
