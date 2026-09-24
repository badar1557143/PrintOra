/* =========================================================
   PRINTORIA — Customization page (customize.html)
   Opens with the product from ?id=<n> already selected, lets the
   customer switch product without losing their design, and hosts
   the live Design Studio (Fabric.js) + cart handoff.
   ========================================================= */

let currentProduct = null;
let selectedColor = null;
let selectedSize = null;

/* ---- Design Studio state ---- */
let designCanvas = null;
let selectedObject = null;
let settingProps = false;      // guard: true while JS is programmatically filling the props panel
let isRestoringHistory = false;

/* ---- Print Sides state ----
   Each product exposes one or more "sides" (see getEffectiveSides in products.js).
   Every side keeps its own undo/redo history and its own "has the customer put a
   design on it yet" flag, so switching sides never loses work and the order total
   only counts a side once something has actually been placed on it. */
let currentSides = [];     // effective sides list for currentProduct
let activeSideId = null;   // id of the side currently loaded into designCanvas
let sidesState = {};       // side id -> { history: [json,...], historyIndex, hasContent }

/* ---- "Both Sides" quick option ----
   Shown only for products with a Front + Back pair. Purely a convenience: it walks
   the customer front -> back so they don't miss that Back is also customizable.
   Doesn't change pricing — each side's own price still only applies once it has
   a design, same as clicking the two side cards individually. */
let bothSidesRequested = false;   // customer tapped the "Both Sides" banner for this product
let bothSidesAutoSwitched = false; // guards the one-time auto-hop from Front to Back

function initCustomizePage(){
  const stage = document.getElementById("studio-stage");
  if (!stage) return;

  const choices = getCustomizableProducts();
  if (!choices.length) return;

  // Pre-select the product from the link (?id=). Unknown / non-customizable ids fall back to the first product.
  const requested = getProductById(getURLParam("id"));
  const start = requested && requested.customizable !== false ? requested : choices[0];

  renderProductPicker(choices);
  initPickerArrows();
  bindOptionControls();
  selectProduct(start, { initial: true });
  initDesignStudio();
  renderUploadLibrary();

  document.getElementById("add-to-cart-btn").addEventListener("click", () => handleAddToCart(false));
  document.getElementById("buy-now-btn").addEventListener("click", () => handleAddToCart(true));
  const downloadBtn = document.getElementById("download-design-btn");
  if (downloadBtn){
    attachDownloadMenu(downloadBtn, downloadBtn.parentElement, handleDownloadDesign);
  }
}

// Lets the customer save their design as a print file so they can attach it
// in the WhatsApp chat (a wa.me link can only pre-fill text, not attach files).
// Exports the artwork only, at 4x resolution, on a transparent background —
// then downloadDesignAsFormat() converts that into whichever format they pick.
function handleDownloadDesign(format){
  if (!anySideHasContent()){
    showToast("Add some text or an image to your design first");
    return;
  }
  const pngDataUrl = designCanvas.toDataURL({ format: "png", multiplier: 4 });
  const base = `${(currentProduct && currentProduct.name || "printoria-design").replace(/\s+/g, "-").toLowerCase()}-design`;
  downloadDesignAsFormat(pngDataUrl, format, base);
  showToast(`${format.toUpperCase()} downloaded — attach it to your WhatsApp order`);
}

/* ---------- Product picker ---------- */

function renderProductPicker(choices){
  const wrap = document.getElementById("cz-picker");
  if (!wrap) return;
  wrap.innerHTML = choices.map(p => `
    <button type="button" class="cz-chip" data-id="${p.id}" aria-pressed="false">
      <img src="${p.image}" alt="" width="56" height="56" loading="lazy">
      <span class="cz-chip-text">
        <span class="cz-chip-name">${p.name}</span>
        <span class="cz-chip-price">${formatPrice(p.price)}</span>
      </span>
    </button>`).join("");

  wrap.querySelectorAll(".cz-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const next = getProductById(chip.dataset.id);
      if (!next || next === currentProduct) return;
      const hadDesign = !!(designCanvas && designCanvas.getObjects().length);
      selectProduct(next);
      showToast(hadDesign ? `Switched to ${next.name} — your design was kept` : `Now customizing ${next.name}`);
    });
  });
}

function initPickerArrows(){
  const wrap = document.getElementById("cz-picker");
  const prev = document.getElementById("cz-prev");
  const next = document.getElementById("cz-next");
  if (!wrap || !prev || !next) return;

  const update = () => {
    prev.hidden = wrap.scrollLeft <= 2;
    next.hidden = wrap.scrollLeft + wrap.clientWidth >= wrap.scrollWidth - 2;
  };
  prev.addEventListener("click", () => wrap.scrollBy({ left: -wrap.clientWidth * 0.8, behavior: "smooth" }));
  next.addEventListener("click", () => wrap.scrollBy({ left: wrap.clientWidth * 0.8, behavior: "smooth" }));
  wrap.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
}

function highlightPickerChip(id, instant){
  const wrap = document.getElementById("cz-picker");
  if (!wrap) return;
  let selectedChip = null;
  wrap.querySelectorAll(".cz-chip").forEach(chip => {
    const on = Number(chip.dataset.id) === id;
    chip.classList.toggle("selected", on);
    chip.setAttribute("aria-pressed", on ? "true" : "false");
    if (on) selectedChip = chip;
  });
  if (selectedChip){
    // Centre the chosen product in the strip (handles a product far along the row).
    const left = selectedChip.offsetLeft - (wrap.clientWidth - selectedChip.offsetWidth) / 2;
    wrap.scrollTo({ left: Math.max(0, left), behavior: instant ? "auto" : "smooth" });
  }
}

/* ---------- Selected product: options, preview, price ---------- */

function selectProduct(p, opts){
  const initial = !!(opts && opts.initial);
  // Switching products keeps whatever is on the side currently being edited (existing
  // behaviour), so we carry that one side's design over before rebuilding sidesState
  // for the new product.
  const carryJson = (!initial && designCanvas && designCanvas.getObjects().length)
    ? JSON.stringify(designCanvas.toJSON())
    : null;

  currentProduct = p;
  selectedColor = p.colors[0];
  selectedSize = p.sizes[0];

  document.title = `Customize ${p.name} | PRINTORIA`;
  document.getElementById("breadcrumb-name").textContent = `Customize ${p.name}`;
  document.getElementById("cz-selected-name").textContent = p.name;

  // Preview stage background (per-color photo when the product has them)
  updatePreviewImage();
  if (p.colorImages){
    // Warm the cache so swapping colors/sides doesn't flash
    p.colors.forEach(c => {
      const img = new Image(); img.src = getColorImage(p, c);
      if (p.frontColorImages && p.frontColorImages[c]){ const fi = new Image(); fi.src = p.frontColorImages[c]; }
      if (p.backColorImages && p.backColorImages[c]){ const bi = new Image(); bi.src = p.backColorImages[c]; }
    });
  }

  // Product summary card
  document.getElementById("cz-thumb").alt = p.name;
  document.getElementById("cz-cat").textContent = p.category;
  document.getElementById("cz-name").textContent = p.name;
  document.getElementById("cz-price").textContent = formatPrice(p.price);
  const oldEl = document.getElementById("cz-old-price");
  if (p.oldPrice){
    oldEl.textContent = formatPrice(p.oldPrice);
    oldEl.style.display = "inline";
  } else {
    oldEl.style.display = "none";
  }
  document.getElementById("cz-details-link").href = `product.html?id=${p.id}`;

  // Colors
  const colorWrap = document.getElementById("pd-colors");
  colorWrap.innerHTML = p.colors.map((c, i) => `
    <button type="button" class="swatch ${i === 0 ? "selected" : ""}" style="background:${colorToHex(c)}" data-color="${c}" aria-label="${c}" title="${c}"></button>`).join("");
  colorWrap.querySelectorAll(".swatch").forEach(sw => {
    sw.addEventListener("click", () => {
      colorWrap.querySelectorAll(".swatch").forEach(s => s.classList.remove("selected"));
      sw.classList.add("selected");
      selectedColor = sw.dataset.color;
      updatePreviewImage();
      applySideView(currentSides.find(s => s.id === activeSideId));
      updateSidesPanelUI();
    });
  });

  // Sizes
  const sizeWrap = document.getElementById("pd-sizes");
  sizeWrap.innerHTML = p.sizes.map((s, i) => `
    <button type="button" class="pill ${i === 0 ? "selected" : ""}" data-size="${s}">${s}</button>`).join("");
  sizeWrap.querySelectorAll(".pill").forEach(pill => {
    pill.addEventListener("click", () => {
      sizeWrap.querySelectorAll(".pill").forEach(pl => pl.classList.remove("selected"));
      pill.classList.add("selected");
      selectedSize = pill.dataset.size;
    });
  });

  setupSidesForProduct(p, carryJson);
  highlightPickerChip(p.id, initial);

  // Keep the address bar in sync so the page can be refreshed / shared with this product selected.
  try {
    window.history.replaceState(null, "", customizeURL(p.id));
  } catch (e){ /* file:// or sandboxed previews may refuse — harmless */ }
}

function updatePreviewImage(){
  const previewBase = document.getElementById("preview-base");
  const frontImg = getStageImage(currentProduct, selectedColor, "front");
  previewBase.src = frontImg;
  previewBase.alt = `${currentProduct.name} in ${selectedColor}`;
  document.getElementById("cz-thumb").src = frontImg;
  // Lighter print-guide line so it stays visible over dark garments
  const stage = document.getElementById("studio-stage");
  if (stage) stage.classList.toggle("stage-dark", !!(currentProduct.colorImages && isDarkColor(selectedColor)));
}

/* =========================================================
   PRINT SIDES — right-hand panel + per-side canvas state
   ========================================================= */

// Swaps the stage between a garment photo (front/back) and a plain "flat" mock
// backdrop for sides with no garment photo yet (inside tag, packaging), and moves
// the dashed print guide to that side's own printable area.
function applySideView(sideDef){
  const stage = document.getElementById("studio-stage");
  const guide = document.querySelector(".print-guide");
  if (!stage || !sideDef) return;

  const isFlat = sideDef.view === "flat";
  stage.classList.toggle("side-flat", isFlat);
  stage.classList.remove("tone-tag", "tone-packaging");
  if (isFlat) stage.classList.add("tone-" + (sideDef.flatTone || "tag"));

  // Garment sides show that side's own mockup photo (front vs. back), when the
  // product has one — see frontColorImages/backColorImages in products.js.
  if (!isFlat && currentProduct){
    const previewBase = document.getElementById("preview-base");
    if (previewBase){
      previewBase.src = getStageImage(currentProduct, selectedColor, sideDef.id);
      const suffix = sideDef.id !== "default" ? ` — ${sideDef.label}` : "";
      previewBase.alt = `${currentProduct.name}${suffix} in ${selectedColor}`;
    }
  }

  if (guide) guide.style.inset = sideDef.printArea || "";

  let label = stage.querySelector(".flat-label");
  if (isFlat){
    if (!label){
      label = document.createElement("div");
      label.className = "flat-label";
      stage.appendChild(label);
    }
    label.textContent = sideDef.label;
  } else if (label){
    label.remove();
  }
}

function updateStudioHint(){
  const hint = document.getElementById("studio-hint-text");
  if (!hint) return;
  const sideDef = currentSides.find(s => s.id === activeSideId);
  if (sideDef && sideDef.id !== "default"){
    const dims = sideDef.dims ? ` (${sideDef.dims})` : "";
    hint.textContent = `Dashed line marks the ${sideDef.label.toLowerCase()} print area${dims}. Drag a layer to move it; use the corner handle to resize and the top handle to rotate.`;
  } else {
    hint.textContent = "Dashed line marks the printable area. Drag a layer to move it; use the corner handle to resize and the top handle to rotate.";
  }
}

function sideCardHTML(s){
  const st = sidesState[s.id] || { hasContent: false };
  const active = s.id === activeSideId;
  const isFlat = s.view === "flat";
  const thumb = isFlat
    ? `<span class="side-thumb flat tone-${s.flatTone || "tag"}" aria-hidden="true"></span>`
    : `<span class="side-thumb"><img src="${getStageImage(currentProduct, selectedColor, s.id)}" alt="" loading="lazy"></span>`;
  const priceLabel = !s.price ? "Included" : (st.hasContent ? "Added" : `+${formatPrice(s.price)}`);
  return `
    <button type="button" class="side-card${active ? " active" : ""}${st.hasContent ? " added" : ""}" data-side="${s.id}" aria-pressed="${active}">
      ${thumb}
      <span class="side-info">
        <span class="side-top-row">
          <span class="side-name">${escapeHtml(s.label)}</span>
          <span class="side-price">${priceLabel}</span>
        </span>
        ${s.sublabel ? `<span class="side-sub">${escapeHtml(s.sublabel)}</span>` : ""}
        ${s.dims ? `<span class="side-dims">${escapeHtml(s.dims)}</span>` : ""}
      </span>
    </button>`;
}

// True for products offering exactly the Front + Back pair — the only shape the
// "Both Sides" quick option supports.
function hasFrontAndBack(){
  return currentSides.length === 2 && currentSides.some(s => s.id === "front") && currentSides.some(s => s.id === "back");
}

function bothSidesBannerHTML(){
  if (!hasFrontAndBack()) return "";
  const front = currentSides.find(s => s.id === "front");
  const back = currentSides.find(s => s.id === "back");
  const frontDone = !!(sidesState.front && sidesState.front.hasContent);
  const backDone = !!(sidesState.back && sidesState.back.hasContent);
  const bothDone = frontDone && backDone;
  const combined = (front.price || 0) + (back.price || 0);
  const priceLabel = bothDone ? "Added" : `+${formatPrice(combined)}`;
  return `
    <button type="button" class="side-card both-sides-card${bothDone ? " added" : ""}${bothSidesRequested ? " requested" : ""}" id="both-sides-card" aria-pressed="${bothSidesRequested}">
      <span class="side-thumb both-sides-thumb" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4 4 7v3h3v10h10V10h3V7l-4-3h-2a2 2 0 0 1-4 0z"/></svg>
      </span>
      <span class="side-info">
        <span class="side-top-row">
          <span class="side-name">Both Sides</span>
          <span class="side-price">${priceLabel}</span>
        </span>
        <span class="side-sub">${bothDone ? "Front and back are set" : "Print your design on Front and Back"}</span>
      </span>
    </button>`;
}

// Only shown for products that define a `sides` array (see products.js) — everything
// else keeps the plain single-canvas Design Studio it always had.
function renderSidesPanel(){
  const panel = document.getElementById("sides-panel");
  const list = document.getElementById("sides-list");
  if (!panel || !list) return;

  const show = !!(currentProduct && currentProduct.sides && currentProduct.sides.length);
  panel.hidden = !show;
  if (!show){ list.innerHTML = ""; return; }

  list.innerHTML = bothSidesBannerHTML() + currentSides.map(sideCardHTML).join("");
  list.querySelectorAll(".side-card:not(.both-sides-card)").forEach(card => {
    card.addEventListener("click", () => switchSide(card.dataset.side));
  });
  const bothBtn = document.getElementById("both-sides-card");
  if (bothBtn) bothBtn.addEventListener("click", activateBothSides);
}

// "Both Sides" click handler: walks the customer Front -> Back instead of making
// them notice and click the Back card themselves. No pricing changes — each side
// still only adds its price once it actually has a design on it.
function activateBothSides(){
  if (!hasFrontAndBack()) return;
  bothSidesRequested = true;
  const frontDone = sidesState.front && sidesState.front.hasContent;
  const backDone = sidesState.back && sidesState.back.hasContent;

  if (frontDone && backDone){
    showToast("Both sides are already set!");
  } else if (!frontDone){
    if (activeSideId !== "front") switchSide("front");
    showToast("Add your design to the Front — we'll take you to the Back next");
  } else {
    bothSidesAutoSwitched = true;
    if (activeSideId !== "back") switchSide("back");
    showToast("Now add your design to the Back");
  }
  updateSidesPanelUI();
}

// Lightweight refresh (active state, added/price labels, thumb color) that doesn't
// rebuild the DOM — keeps scroll position and avoids re-attaching listeners.
function updateSidesPanelUI(){
  const list = document.getElementById("sides-list");
  if (!list) return;
  list.querySelectorAll(".side-card:not(.both-sides-card)").forEach(card => {
    const id = card.dataset.side;
    const s = currentSides.find(x => x.id === id);
    const st = sidesState[id];
    if (!s || !st) return;
    card.classList.toggle("active", id === activeSideId);
    card.classList.toggle("added", st.hasContent);
    card.setAttribute("aria-pressed", id === activeSideId ? "true" : "false");
    const priceEl = card.querySelector(".side-price");
    if (priceEl) priceEl.textContent = !s.price ? "Included" : (st.hasContent ? "Added" : `+${formatPrice(s.price)}`);
    const img = card.querySelector(".side-thumb img");
    if (img) img.src = getStageImage(currentProduct, selectedColor, id);
  });

  const bothBtn = document.getElementById("both-sides-card");
  if (bothBtn && hasFrontAndBack()){
    const frontDone = sidesState.front && sidesState.front.hasContent;
    const backDone = sidesState.back && sidesState.back.hasContent;
    const bothDone = frontDone && backDone;
    bothBtn.classList.toggle("added", bothDone);
    bothBtn.classList.toggle("requested", bothSidesRequested);
    const priceEl = bothBtn.querySelector(".side-price");
    if (priceEl){
      const front = currentSides.find(s => s.id === "front");
      const back = currentSides.find(s => s.id === "back");
      const combined = (front.price || 0) + (back.price || 0);
      priceEl.textContent = bothDone ? "Added" : `+${formatPrice(combined)}`;
    }
    const subEl = bothBtn.querySelector(".side-sub");
    if (subEl) subEl.textContent = bothDone ? "Front and back are set" : "Print your design on Front and Back";
  }
}

// Loads the given side's saved design into the live Fabric canvas (or clears it and
// establishes a blank history baseline the first time that side is visited).
function loadSideIntoCanvas(id){
  const st = sidesState[id];
  if (!st || !designCanvas) return;
  const seed = st.history[st.historyIndex];
  isRestoringHistory = true;
  const done = () => {
    designCanvas.requestRenderAll();
    isRestoringHistory = false;
    selectedObject = null;
    updatePropsPanel(null);
    refreshLayersList();
    if (seed){
      st.hasContent = designCanvas.getObjects().length > 0;
      updateUndoRedoButtons();
      updateTotal();
      updateSidesPanelUI();
    } else {
      commitDesignHistory(); // establishes the blank baseline + refreshes total/panel/undo-redo
    }
  };
  if (seed) designCanvas.loadFromJSON(seed, done);
  else { designCanvas.clear(); done(); }
}

function switchSide(id){
  if (!sidesState[id] || id === activeSideId) return;
  activeSideId = id;
  applySideView(currentSides.find(s => s.id === id));
  updateStudioHint();
  if (designCanvas) loadSideIntoCanvas(id);
  else updateSidesPanelUI();
}

// Rebuilds Print Sides state for a (newly selected) product. carryJson, when given,
// is the design that was on the previously active side — it's carried onto the new
// product's first side so switching products never silently discards work.
function setupSidesForProduct(p, carryJson){
  currentSides = getEffectiveSides(p);
  sidesState = {};
  currentSides.forEach(s => { sidesState[s.id] = { history: [], historyIndex: -1, hasContent: false }; });
  activeSideId = currentSides[0].id;
  bothSidesRequested = false;
  bothSidesAutoSwitched = false;

  if (carryJson){
    const st = sidesState[activeSideId];
    st.history = [carryJson];
    st.historyIndex = 0;
    try {
      const parsed = JSON.parse(carryJson);
      st.hasContent = !!(parsed.objects && parsed.objects.length);
    } catch (e){ /* malformed/unexpected JSON — leave hasContent false */ }
  }

  applySideView(currentSides[0]);
  updateStudioHint();
  renderSidesPanel();

  if (designCanvas) loadSideIntoCanvas(activeSideId);
  updateTotal();
}

function bindOptionControls(){
  const qtyInput = document.getElementById("pd-qty");
  document.getElementById("qty-minus").addEventListener("click", () => {
    qtyInput.value = Math.max(1, Number(qtyInput.value) - 1);
    updateTotal();
  });
  document.getElementById("qty-plus").addEventListener("click", () => {
    qtyInput.value = Number(qtyInput.value) + 1;
    updateTotal();
  });
}

// Base product price plus the price of every side the customer has actually put a
// design on (matches the "Price applies when you add design to a side" rule shown
// in the Print Sides panel).
function computeUnitPrice(){
  if (!currentProduct) return 0;
  let unit = currentProduct.price;
  if (currentProduct.sides && currentProduct.sides.length){
    currentProduct.sides.forEach(s => {
      const st = sidesState[s.id];
      if (st && st.hasContent) unit += s.price;
    });
  }
  return unit;
}

function updateTotal(){
  if (!currentProduct) return;
  const qty = Number(document.getElementById("pd-qty").value) || 1;
  document.getElementById("cz-total").textContent = formatPrice(computeUnitPrice() * qty);
}

// True once at least one side (or the single implicit side, for products without
// a Print Sides picker) has a design on it.
function anySideHasContent(){
  if (currentProduct && currentProduct.sides && currentProduct.sides.length){
    return Object.keys(sidesState).some(id => sidesState[id].hasContent);
  }
  return !!(designCanvas && designCanvas.getObjects().length);
}

// Bundles every side that has a design into one object keyed by side id, for cart/
// checkout. Returns null for products with no Print Sides picker (single-canvas flow).
function collectSidesDesign(){
  if (!(currentProduct && currentProduct.sides && currentProduct.sides.length)) return null;
  const out = {};
  currentSides.forEach(s => {
    const st = sidesState[s.id];
    if (st && st.hasContent && st.history.length) out[s.id] = st.history[st.historyIndex];
  });
  return Object.keys(out).length ? out : null;
}

// Renders every side's saved JSON into an off-screen canvas and exports each as
// a transparent, high-res PNG — so a design made on the Back (or any side that
// isn't the one currently open) still gets attached to the cart item, not just
// whichever side happened to be on screen when "Add to Cart" was clicked.
function buildAllSideDesignFiles(sidesDesignMap, callback){
  const ids = Object.keys(sidesDesignMap || {});
  if (!ids.length){ callback([]); return; }
  const width = designCanvas.getWidth();
  const height = designCanvas.getHeight();
  const results = [];
  let remaining = ids.length;

  ids.forEach(sideId => {
    const temp = new fabric.StaticCanvas(null, { width, height });
    temp.loadFromJSON(sidesDesignMap[sideId], () => {
      temp.renderAll();
      const sideDef = currentSides.find(s => s.id === sideId);
      results.push({ id: sideId, label: (sideDef && sideDef.label) || sideId, dataUrl: temp.toDataURL({ format: "png", multiplier: 4 }) });
      temp.dispose();
      remaining -= 1;
      if (remaining === 0){
        results.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
        callback(results);
      }
    });
  });
}

function handleAddToCart(buyNow){
  const p = currentProduct;
  const qty = Number(document.getElementById("pd-qty").value) || 1;
  const hasDesign = anySideHasContent();
  const sidesDesign = collectSidesDesign();

  const finish = (previewDataUrl, designFiles) => {
    // Save a copy of the customer's design to their own device right when
    // they add it to the cart / buy now — before the cart write below —
    // so they already have the file even if they never reach checkout, or
    // checkout's own attach step doesn't cover their case (e.g. desktop,
    // where WhatsApp sharing falls back to a manual-attach step anyway).
    // Staggered a beat apart per file since browsers can silently block
    // several downloads triggered in the same instant.
    if (designFiles && designFiles.length){
      let delay = 0;
      designFiles.forEach(file => {
        setTimeout(() => {
          const base = `${(p.name || "printoria-design").replace(/\s+/g, "-").toLowerCase()}-${file.label.replace(/\s+/g, "-").toLowerCase()}`;
          triggerFileDownload(file.dataUrl, `${base}.png`);
        }, delay);
        delay += 400;
      });
    }

    addToCart({
      id: p.id,
      name: p.name,
      image: getStageImage(p, selectedColor, "front"),
      price: computeUnitPrice(),
      color: selectedColor,
      size: selectedSize,
      customText: hasDesign ? summarizeDesign() : "",
      customDesign: sidesDesign || (hasDesign ? designCanvas.toJSON() : null),
      designPreview: previewDataUrl || null,
      // Transparent, high-res artwork-only PNG(s) — the actual print file(s), one
      // per customized side (vs. designPreview above, which is a mockup thumbnail).
      designFiles: designFiles || [],
      qty: qty
    });
    showToast(designFiles && designFiles.length ? `${p.name} added to cart — design saved to your device` : `${p.name} added to cart`);
    if (buyNow){
      window.location.href = "checkout.html";
    }
  };

  const withDesignFiles = (previewDataUrl) => {
    if (!hasDesign){
      finish(previewDataUrl, []);
      return;
    }
    if (sidesDesign){
      // Multi-side product: export every customized side, not just the one on screen.
      buildAllSideDesignFiles(sidesDesign, (files) => finish(previewDataUrl, files));
    } else {
      // Single-canvas product: what's on screen right now is the whole design.
      finish(previewDataUrl, [{ id: "design", label: "Design", dataUrl: designCanvas.toDataURL({ format: "png", multiplier: 4 }) }]);
    }
  };

  if (hasDesign){
    buildDesignPreview(p, withDesignFiles);
  } else {
    withDesignFiles(null);
  }
}

function showStudioLoadError(){
  const stage = document.getElementById("studio-stage");
  if (stage && !stage.querySelector(".studio-error")){
    const msg = document.createElement("div");
    msg.className = "studio-error";
    msg.setAttribute("role", "alert");
    msg.textContent = "The design tool couldn't load. Check your internet connection and refresh the page.";
    stage.appendChild(msg);
  }
  document.querySelectorAll(".studio-toolbar .studio-btn").forEach(b => { b.disabled = true; });
  const upload = document.getElementById("tool-upload-image");
  if (upload) upload.disabled = true;
}

/* =========================================================
   DESIGN STUDIO — live, drag/resize/rotate product customizer
   Built on Fabric.js. Customers can add text layers and upload
   their own artwork, arrange it directly on the product, and
   the whole layered design is saved with the cart line item.
   ========================================================= */

function initDesignStudio(product){
  const canvasEl = document.getElementById("design-canvas");
  if (!canvasEl) return;
  if (typeof fabric === "undefined"){
    // Fabric.js is loaded from a CDN — tell the customer instead of failing silently.
    showStudioLoadError();
    return;
  }

  designCanvas = new fabric.Canvas("design-canvas", {
    preserveObjectStacking: true,
    selection: true
  });

  designCanvas.on("selection:created", onDesignSelectionChange);
  designCanvas.on("selection:updated", onDesignSelectionChange);
  designCanvas.on("selection:cleared", onDesignSelectionCleared);
  designCanvas.on("object:modified", commitDesignHistory);
  designCanvas.on("text:editing:exited", commitDesignHistory);

  // sidesState/activeSideId were already prepared by selectProduct(); now that the
  // canvas exists, load the active side's content (or establish its blank baseline).
  loadSideIntoCanvas(activeSideId);

  bindStudioToolbar(product);
  bindStudioPropertyPanel();
  bindStudioTabs();
  refreshLayersList();
}

function bindStudioToolbar(product){
  const addTextBtn = document.getElementById("tool-add-text");
  if (addTextBtn) addTextBtn.addEventListener("click", addTextLayer);

  const uploadInput = document.getElementById("tool-upload-image");
  if (uploadInput){
    uploadInput.addEventListener("change", (e) => {
      Array.from(e.target.files || []).forEach(addImageLayer);
      e.target.value = ""; // allow re-selecting the same file later
    });
  }

  const undoBtn = document.getElementById("tool-undo");
  if (undoBtn) undoBtn.addEventListener("click", undoDesign);
  const redoBtn = document.getElementById("tool-redo");
  if (redoBtn) redoBtn.addEventListener("click", redoDesign);

  const resetBtn = document.getElementById("tool-reset");
  if (resetBtn){
    resetBtn.addEventListener("click", () => {
      if (!designCanvas.getObjects().length) return;
      const sideDef = currentSides.find(s => s.id === activeSideId) || {};
      const label = (sideDef.label || "design").toLowerCase();
      if (!window.confirm(`Clear your ${label} design? This can't be undone.`)) return;
      designCanvas.clear();
      designCanvas.requestRenderAll();
      selectedObject = null;
      updatePropsPanel(null);
      refreshLayersList();
      const st = sidesState[activeSideId];
      st.history = [];
      st.historyIndex = -1;
      commitDesignHistory();
    });
  }
}

// New text should be readable on the garment shown: white on dark color photos, near-black otherwise.
function defaultTextColor(){
  const onPhoto = currentProduct && currentProduct.colorImages;
  return onPhoto && isDarkColor(selectedColor) ? "#ffffff" : "#15171b";
}

function addTextLayer(){
  const text = new fabric.IText("Your Text", {
    left: designCanvas.getWidth() / 2,
    top: designCanvas.getHeight() / 2,
    originX: "center",
    originY: "center",
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: 32,
    fill: defaultTextColor(),
    fontWeight: "normal",
    fontStyle: "normal",
    textAlign: "center"
  });
  designCanvas.add(text);
  designCanvas.setActiveObject(text);
  designCanvas.requestRenderAll();
  refreshLayersList();
  commitDesignHistory();
}

// Places an image (from a data URL) onto the active canvas — shared by a fresh
// upload and by re-using something from the saved Upload Library.
function placeImageOnCanvas(dataUrl){
  if (!designCanvas){
    showToast("Design Studio isn't ready yet");
    return;
  }
  fabric.Image.fromURL(dataUrl, (img) => {
    const maxDim = Math.min(designCanvas.getWidth(), designCanvas.getHeight()) * 0.55;
    const largestSide = Math.max(img.width || maxDim, img.height || maxDim);
    const scale = Math.min(1, maxDim / largestSide);
    img.set({
      left: designCanvas.getWidth() / 2,
      top: designCanvas.getHeight() / 2,
      originX: "center",
      originY: "center",
      scaleX: scale,
      scaleY: scale
    });
    designCanvas.add(img);
    designCanvas.setActiveObject(img);
    designCanvas.requestRenderAll();
    refreshLayersList();
    commitDesignHistory();
  });
}

function addImageLayer(file){
  if (!file || !file.type || file.type.indexOf("image") !== 0) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    addToUploadLibrary(ev.target.result, file.name);
    placeImageOnCanvas(ev.target.result);
  };
  reader.readAsDataURL(file);
}

/* ---------- Upload Library ----------
   Every file a customer uploads is also kept in localStorage (per-device, not
   per-account — there's no backend here) so they can reuse it in a later
   session or on a different side/product without re-uploading. */
const STORAGE_UPLOAD_LIBRARY = "printoria_upload_library";
const UPLOAD_LIBRARY_MAX = 40;

function getUploadLibrary(){
  try {
    return JSON.parse(localStorage.getItem(STORAGE_UPLOAD_LIBRARY) || "[]");
  } catch (e){
    return [];
  }
}

function saveUploadLibrary(library){
  try {
    localStorage.setItem(STORAGE_UPLOAD_LIBRARY, JSON.stringify(library));
    return true;
  } catch (e){
    return false; // quota exceeded
  }
}

function addToUploadLibrary(dataUrl, name){
  let library = getUploadLibrary();
  if (library.some(item => item.dataUrl === dataUrl)) return; // already saved
  library.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    dataUrl,
    name: name || "Upload"
  });
  if (library.length > UPLOAD_LIBRARY_MAX) library = library.slice(0, UPLOAD_LIBRARY_MAX);
  // If storage is full, drop the oldest entries until it fits.
  let droppedForSpace = false;
  while (library.length && !saveUploadLibrary(library)){
    library.pop();
    droppedForSpace = true;
  }
  if (droppedForSpace) showToast("Storage full — removed your oldest upload to make space");
  renderUploadLibrary();
}

function removeFromUploadLibrary(id){
  saveUploadLibrary(getUploadLibrary().filter(item => item.id !== id));
  renderUploadLibrary();
}

function escAttr(s){
  return String(s || "").replace(/"/g, "&quot;");
}

function renderUploadLibrary(){
  const grid = document.getElementById("upload-library-grid");
  const empty = document.getElementById("upload-library-empty");
  if (!grid) return;
  const library = getUploadLibrary();
  if (empty) empty.style.display = library.length ? "none" : "block";

  grid.innerHTML = library.map(item => `
    <div class="upload-lib-item" data-id="${item.id}" title="${escAttr(item.name)}">
      <img src="${item.dataUrl}" alt="${escAttr(item.name)}">
      <button type="button" class="upload-lib-remove" data-id="${item.id}" aria-label="Remove ${escAttr(item.name)} from library">×</button>
    </div>
  `).join("");

  grid.querySelectorAll(".upload-lib-item img").forEach(img => {
    img.addEventListener("click", () => {
      const id = img.closest(".upload-lib-item").dataset.id;
      const item = getUploadLibrary().find(i => i.id === id);
      if (item) placeImageOnCanvas(item.dataUrl);
    });
  });
  grid.querySelectorAll(".upload-lib-remove").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeFromUploadLibrary(btn.dataset.id);
    });
  });
}

/* ---------- Selection + property panel ---------- */

function onDesignSelectionChange(){
  selectedObject = designCanvas.getActiveObject();
  updatePropsPanel(selectedObject);
  refreshLayersList();
}

function onDesignSelectionCleared(){
  selectedObject = null;
  updatePropsPanel(null);
  refreshLayersList();
}

function updatePropsPanel(obj){
  const empty = document.getElementById("props-empty");
  const textPanel = document.getElementById("props-text");
  const imagePanel = document.getElementById("props-image");
  const sharedActions = document.getElementById("props-shared-actions");
  if (!empty || !textPanel || !imagePanel || !sharedActions) return;

  if (!obj){
    empty.style.display = "block";
    textPanel.style.display = "none";
    imagePanel.style.display = "none";
    sharedActions.style.display = "none";
    return;
  }

  empty.style.display = "none";
  sharedActions.style.display = "flex";

  if (obj.type === "i-text" || obj.type === "text" || obj.type === "textbox"){
    textPanel.style.display = "block";
    imagePanel.style.display = "none";
    settingProps = true;
    document.getElementById("prop-text-content").value = obj.text || "";
    document.getElementById("prop-text-font").value = obj.fontFamily || "'IBM Plex Sans', sans-serif";
    document.getElementById("prop-text-color").value = /^#/.test(obj.fill) ? obj.fill : "#15171b";
    const size = Math.round(obj.fontSize || 32);
    document.getElementById("prop-text-size").value = size;
    document.getElementById("prop-text-size-val").textContent = size;
    document.getElementById("prop-text-bold").classList.toggle("active", obj.fontWeight === "bold");
    document.getElementById("prop-text-italic").classList.toggle("active", obj.fontStyle === "italic");
    document.querySelectorAll("#prop-text-align .toggle-btn").forEach(b => {
      b.classList.toggle("active", b.dataset.align === (obj.textAlign || "left"));
    });
    settingProps = false;
  } else if (obj.type === "image"){
    textPanel.style.display = "none";
    imagePanel.style.display = "block";
    settingProps = true;
    const opacityPct = Math.round((obj.opacity == null ? 1 : obj.opacity) * 100);
    document.getElementById("prop-image-opacity").value = opacityPct;
    document.getElementById("prop-image-opacity-val").textContent = opacityPct;
    settingProps = false;
  } else {
    // Multiple objects selected at once — just offer duplicate/delete.
    textPanel.style.display = "none";
    imagePanel.style.display = "none";
  }
}

function bindStudioPropertyPanel(){
  const content = document.getElementById("prop-text-content");
  if (content){
    content.addEventListener("input", function(){
      if (settingProps || !selectedObject) return;
      selectedObject.set("text", this.value);
      designCanvas.requestRenderAll();
      refreshLayersList();
    });
    content.addEventListener("change", commitDesignHistory);
  }

  const font = document.getElementById("prop-text-font");
  if (font){
    font.addEventListener("change", function(){
      if (!selectedObject) return;
      selectedObject.set("fontFamily", this.value);
      designCanvas.requestRenderAll();
      commitDesignHistory();
    });
  }

  const color = document.getElementById("prop-text-color");
  if (color){
    color.addEventListener("input", function(){
      if (settingProps || !selectedObject) return;
      selectedObject.set("fill", this.value);
      designCanvas.requestRenderAll();
    });
    color.addEventListener("change", commitDesignHistory);
  }

  const size = document.getElementById("prop-text-size");
  if (size){
    size.addEventListener("input", function(){
      if (settingProps || !selectedObject) return;
      selectedObject.set("fontSize", Number(this.value));
      document.getElementById("prop-text-size-val").textContent = this.value;
      designCanvas.requestRenderAll();
    });
    size.addEventListener("change", commitDesignHistory);
  }

  const bold = document.getElementById("prop-text-bold");
  if (bold){
    bold.addEventListener("click", function(){
      if (!selectedObject) return;
      const isBold = selectedObject.fontWeight === "bold";
      selectedObject.set("fontWeight", isBold ? "normal" : "bold");
      this.classList.toggle("active", !isBold);
      designCanvas.requestRenderAll();
      commitDesignHistory();
    });
  }

  const italic = document.getElementById("prop-text-italic");
  if (italic){
    italic.addEventListener("click", function(){
      if (!selectedObject) return;
      const isItalic = selectedObject.fontStyle === "italic";
      selectedObject.set("fontStyle", isItalic ? "normal" : "italic");
      this.classList.toggle("active", !isItalic);
      designCanvas.requestRenderAll();
      commitDesignHistory();
    });
  }

  document.querySelectorAll("#prop-text-align .toggle-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!selectedObject) return;
      selectedObject.set("textAlign", btn.dataset.align);
      document.querySelectorAll("#prop-text-align .toggle-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      designCanvas.requestRenderAll();
      commitDesignHistory();
    });
  });

  const opacity = document.getElementById("prop-image-opacity");
  if (opacity){
    opacity.addEventListener("input", function(){
      if (settingProps || !selectedObject) return;
      selectedObject.set("opacity", Number(this.value) / 100);
      document.getElementById("prop-image-opacity-val").textContent = this.value;
      designCanvas.requestRenderAll();
    });
    opacity.addEventListener("change", commitDesignHistory);
  }

  const duplicate = document.getElementById("prop-duplicate");
  if (duplicate){
    duplicate.addEventListener("click", () => {
      if (!selectedObject || designCanvas.getActiveObjects().length > 1) return;
      selectedObject.clone((cloned) => {
        cloned.set({ left: selectedObject.left + 20, top: selectedObject.top + 20 });
        designCanvas.add(cloned);
        designCanvas.setActiveObject(cloned);
        designCanvas.requestRenderAll();
        refreshLayersList();
        commitDesignHistory();
      });
    });
  }

  const del = document.getElementById("prop-delete");
  if (del) del.addEventListener("click", deleteSelectedLayers);
}

function deleteSelectedLayers(){
  const objs = designCanvas.getActiveObjects();
  if (!objs.length) return;
  objs.forEach(o => designCanvas.remove(o));
  designCanvas.discardActiveObject();
  designCanvas.requestRenderAll();
  refreshLayersList();
  commitDesignHistory();
}

function bindStudioTabs(){
  document.querySelectorAll(".studio-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".studio-tab").forEach(t => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");
      const target = tab.dataset.tab;
      document.getElementById("tab-properties").style.display = target === "properties" ? "block" : "none";
      document.getElementById("tab-layers").style.display = target === "layers" ? "block" : "none";
    });
  });
}

/* ---------- Layers list ---------- */

function refreshLayersList(){
  if (!designCanvas) return;
  const list = document.getElementById("layers-list");
  const empty = document.getElementById("layers-empty");
  const badge = document.getElementById("layer-count-badge");
  if (!list || !empty || !badge) return;

  const objects = designCanvas.getObjects().slice().reverse(); // topmost layer first
  badge.textContent = objects.length;

  if (!objects.length){
    list.innerHTML = "";
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  list.innerHTML = objects.map((obj, i) => {
    const isText = obj.type === "i-text" || obj.type === "text" || obj.type === "textbox";
    const label = isText ? (obj.text || "Text layer") : "Uploaded image";
    const thumb = isText
      ? `<span aria-hidden="true">Aa</span>`
      : `<img src="${obj.getSrc ? obj.getSrc() : ""}" alt="">`;
    return `<li class="layer-item ${obj === selectedObject ? "selected" : ""}" data-index="${i}">
      <span class="layer-thumb">${thumb}</span>
      <span class="layer-name">${escapeHtml(label)}</span>
      <span class="layer-actions">
        <button type="button" class="layer-up" aria-label="Bring forward" title="Bring forward">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
        </button>
        <button type="button" class="layer-down" aria-label="Send backward" title="Send backward">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
        </button>
        <button type="button" class="layer-delete" aria-label="Delete layer" title="Delete">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>
        </button>
      </span>
    </li>`;
  }).join("");

  list.querySelectorAll(".layer-item").forEach(li => {
    const idx = Number(li.dataset.index);
    const obj = objects[idx];
    li.addEventListener("click", (e) => {
      if (e.target.closest(".layer-actions")) return;
      designCanvas.setActiveObject(obj);
      designCanvas.requestRenderAll();
    });
    li.querySelector(".layer-up").addEventListener("click", (e) => {
      e.stopPropagation();
      obj.bringForward();
      designCanvas.requestRenderAll();
      refreshLayersList();
      commitDesignHistory();
    });
    li.querySelector(".layer-down").addEventListener("click", (e) => {
      e.stopPropagation();
      obj.sendBackwards();
      designCanvas.requestRenderAll();
      refreshLayersList();
      commitDesignHistory();
    });
    li.querySelector(".layer-delete").addEventListener("click", (e) => {
      e.stopPropagation();
      designCanvas.remove(obj);
      designCanvas.discardActiveObject();
      designCanvas.requestRenderAll();
      refreshLayersList();
      commitDesignHistory();
    });
  });
}

function escapeHtml(str){
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ---------- Undo / redo ---------- */

// History (undo/redo) and the hasContent/total/panel refresh are all kept per side
// (see sidesState) so switching sides never mixes up or loses another side's work.
function commitDesignHistory(){
  if (!designCanvas || isRestoringHistory) return;
  const st = sidesState[activeSideId];
  if (!st) return;
  const json = JSON.stringify(designCanvas.toJSON());
  if (st.history[st.historyIndex] !== json){
    st.history = st.history.slice(0, st.historyIndex + 1);
    st.history.push(json);
    st.historyIndex = st.history.length - 1;
  }
  st.hasContent = designCanvas.getObjects().length > 0;
  updateUndoRedoButtons();
  updateTotal();
  updateSidesPanelUI();

  // "Both Sides" was requested and the Front now has a design for the first time —
  // hop the customer over to Back so they don't have to notice and click it themselves.
  if (bothSidesRequested && !bothSidesAutoSwitched && activeSideId === "front" && st.hasContent){
    bothSidesAutoSwitched = true;
    setTimeout(() => {
      switchSide("back");
      showToast("Front looks great — now add your design to the Back");
    }, 400);
  }
}

function restoreDesignFromJSON(json){
  isRestoringHistory = true;
  designCanvas.loadFromJSON(json, () => {
    designCanvas.requestRenderAll();
    selectedObject = null;
    updatePropsPanel(null);
    refreshLayersList();
    updateUndoRedoButtons();
    const st = sidesState[activeSideId];
    if (st) st.hasContent = designCanvas.getObjects().length > 0;
    updateTotal();
    updateSidesPanelUI();
    isRestoringHistory = false;
  });
}

function undoDesign(){
  const st = sidesState[activeSideId];
  if (!st || st.historyIndex <= 0) return;
  st.historyIndex--;
  restoreDesignFromJSON(st.history[st.historyIndex]);
}

function redoDesign(){
  const st = sidesState[activeSideId];
  if (!st || st.historyIndex >= st.history.length - 1) return;
  st.historyIndex++;
  restoreDesignFromJSON(st.history[st.historyIndex]);
}

function updateUndoRedoButtons(){
  const undoBtn = document.getElementById("tool-undo");
  const redoBtn = document.getElementById("tool-redo");
  const st = sidesState[activeSideId];
  if (undoBtn) undoBtn.disabled = !st || st.historyIndex <= 0;
  if (redoBtn) redoBtn.disabled = !st || st.historyIndex >= st.history.length - 1;
}

/* ---------- Cart handoff ---------- */

function summarizeDesign(){
  if (!designCanvas) return "";
  const texts = designCanvas.getObjects().filter(o => o.type === "i-text" || o.type === "text").map(o => o.text).filter(Boolean);
  const imageCount = designCanvas.getObjects().filter(o => o.type === "image").length;
  const parts = [];
  if (texts.length) parts.push(texts.map(t => `\u201C${t}\u201D`).join(", "));
  if (imageCount) parts.push(`${imageCount} custom image${imageCount > 1 ? "s" : ""}`);
  return parts.join(" + ");
}

// Composites the product photo + the customer's design layers into one
// flat thumbnail for the cart/checkout screens. Falls back gracefully
// (calls back with null) if the product photo can't be read back due to
// cross-origin restrictions — the design itself is still saved either way.
function buildDesignPreview(product, callback){
  try {
    const stageW = designCanvas.getWidth();
    const stageH = designCanvas.getHeight();
    const tmp = document.createElement("canvas");
    tmp.width = stageW;
    tmp.height = stageH;
    const ctx = tmp.getContext("2d");

    const bgImg = new Image();
    bgImg.crossOrigin = "anonymous";
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      try {
        if (bgImg.complete && bgImg.naturalWidth > 0){
          // Cover-fit, matching how the stage shows the photo (object-fit: cover)
          const scale = Math.max(stageW / bgImg.naturalWidth, stageH / bgImg.naturalHeight);
          const dw = bgImg.naturalWidth * scale;
          const dh = bgImg.naturalHeight * scale;
          ctx.drawImage(bgImg, (stageW - dw) / 2, (stageH - dh) / 2, dw, dh);
        }
      } catch (e){ /* CORS-tainted background — continue without it */ }

      const designImg = new Image();
      designImg.onload = () => {
        try {
          ctx.drawImage(designImg, 0, 0, stageW, stageH);
          callback(tmp.toDataURL("image/png"));
        } catch (e){
          callback(null);
        }
      };
      designImg.onerror = () => callback(null);
      designImg.src = designCanvas.toDataURL({ format: "png" });
    };

    bgImg.onload = finish;
    bgImg.onerror = finish;
    // Match whichever side is on screen right now (front/back have different photos).
    bgImg.src = getStageImage(product, selectedColor, activeSideId);
    setTimeout(finish, 1500); // safety net in case neither event fires
  } catch (e){
    callback(null);
  }
}

document.addEventListener("DOMContentLoaded", initCustomizePage);
