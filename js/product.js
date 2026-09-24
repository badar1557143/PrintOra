/* =========================================================
   PRINTORIA — Product detail page
   The live Design Studio now lives on its own page
   (customize.html / js/customize.js). This page shows the
   product and links across to it with the product pre-selected.
   ========================================================= */

let currentProduct = null;
let selectedColor = null;
let selectedSize = null;

function initProductPage(){
  const root = document.getElementById("pd-title");
  if (!root) return;

  const id = getURLParam("id");
  currentProduct = getProductById(id) || PRODUCTS[0];
  const p = currentProduct;
  selectedColor = p.colors[0];
  selectedSize = p.sizes[0];

  document.title = `${p.name} | PRINTORIA`;
  document.getElementById("breadcrumb-name").textContent = p.name;

  // Gallery — for products with per-color photos the gallery and the color swatches stay in sync
  const mainImg = document.getElementById("gallery-main-img");
  mainImg.src = getColorImage(p, selectedColor);
  mainImg.alt = p.name;
  if (p.colorImages) mainImg.parentElement.classList.add("gallery-tall");
  const thumbsWrap = document.getElementById("gallery-thumbs");
  thumbsWrap.classList.toggle("many", p.gallery.length > 6); // 7 color views fit on one row
  thumbsWrap.innerHTML = p.gallery.map((src, i) => `
    <button class="${src === mainImg.getAttribute("src") ? "active" : ""}" data-src="${src}" aria-label="View image ${i+1}">
      <img src="${src}" alt="" loading="lazy">
    </button>`).join("");
  document.querySelectorAll("#gallery-thumbs button").forEach(btn => {
    btn.addEventListener("click", () => {
      const colorForThumb = p.colorImages && p.colors.find(c => p.colorImages[c] === btn.dataset.src);
      if (colorForThumb){
        selectColor(colorForThumb);
      } else {
        mainImg.src = btn.dataset.src;
        document.querySelectorAll("#gallery-thumbs button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
      }
    });
  });

  // Text fields
  document.getElementById("pd-cat").textContent = p.category;
  document.getElementById("pd-title").textContent = p.name;
  document.getElementById("pd-rating-stars").textContent = starString(p.rating);
  document.getElementById("pd-rating-text").textContent = `${p.rating} (${p.reviews} reviews)`;
  document.getElementById("pd-desc").textContent = p.description;
  document.getElementById("pd-price").textContent = formatPrice(p.price);
  if (p.oldPrice){
    document.getElementById("pd-old-price").textContent = formatPrice(p.oldPrice);
    document.getElementById("pd-old-price").style.display = "inline";
  }

  // "Customize This Product" -> customization page with this product pre-selected
  const customizeBtn = document.getElementById("customize-btn");
  if (customizeBtn){
    if (p.customizable === false){
      customizeBtn.style.display = "none";
    } else {
      customizeBtn.href = customizeURL(p.id);
    }
  }

  // Colors
  const colorWrap = document.getElementById("pd-colors");
  colorWrap.innerHTML = p.colors.map((c, i) => `
    <button class="swatch ${i === 0 ? "selected" : ""}" style="background:${colorToHex(c)}" data-color="${c}" aria-label="${c}" title="${c}"></button>`).join("");
  colorWrap.querySelectorAll(".swatch").forEach(sw => {
    sw.addEventListener("click", () => selectColor(sw.dataset.color));
  });

  // Sizes
  const sizeWrap = document.getElementById("pd-sizes");
  sizeWrap.innerHTML = p.sizes.map((s, i) => `
    <button class="pill ${i === 0 ? "selected" : ""}" data-size="${s}">${s}</button>`).join("");
  sizeWrap.querySelectorAll(".pill").forEach(pill => {
    pill.addEventListener("click", () => {
      sizeWrap.querySelectorAll(".pill").forEach(pl => pl.classList.remove("selected"));
      pill.classList.add("selected");
      selectedSize = pill.dataset.size;
      updateBuyWhatsAppLink();
    });
  });

  // Quantity
  const qtyInput = document.getElementById("pd-qty");
  document.getElementById("qty-minus").addEventListener("click", () => {
    qtyInput.value = Math.max(1, Number(qtyInput.value) - 1);
    updateBuyWhatsAppLink();
  });
  document.getElementById("qty-plus").addEventListener("click", () => {
    qtyInput.value = Number(qtyInput.value) + 1;
    updateBuyWhatsAppLink();
  });

  // Accordions
  document.querySelectorAll(".accordion-item").forEach(item => {
    const head = item.querySelector(".accordion-head");
    const body = item.querySelector(".accordion-body");
    head.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");
      document.querySelectorAll(".accordion-item").forEach(i => {
        i.classList.remove("open");
        i.querySelector(".accordion-body").style.maxHeight = null;
      });
      if (!isOpen){
        item.classList.add("open");
        body.style.maxHeight = body.scrollHeight + "px";
      }
    });
  });

  // Add to cart / buy now (plain product — designs are added from customize.html)
  document.getElementById("add-to-cart-btn").addEventListener("click", () => handleAddToCart(false));
  document.getElementById("buy-now-btn").addEventListener("click", () => handleAddToCart(true));

  // Buy on WhatsApp — opens a chat with the product + chosen options prefilled,
  // so the customer can confirm and order without going through the cart at all.
  updateBuyWhatsAppLink();
  document.getElementById("pd-qty").addEventListener("change", updateBuyWhatsAppLink);

  renderRelated(p);
}

function updateBuyWhatsAppLink(){
  const btn = document.getElementById("buy-whatsapp-btn");
  if (!btn || !currentProduct) return;
  const p = currentProduct;
  const qty = Number(document.getElementById("pd-qty").value) || 1;
  const lines = [
    `Hi! I'd like to order:`,
    `${p.name} (Qty: ${qty})`,
    selectedColor ? `Color: ${selectedColor}` : null,
    selectedSize ? `Size: ${selectedSize}` : null,
    `Price: ${formatPrice(p.price)} each`,
    window.location.href
  ].filter(Boolean);
  btn.href = whatsappLink(lines.join("\n"));
}

function selectColor(color){
  selectedColor = color;
  document.querySelectorAll("#pd-colors .swatch").forEach(sw => {
    sw.classList.toggle("selected", sw.dataset.color === color);
  });
  // Show that color's photo (products without per-color photos keep their current image)
  if (currentProduct.colorImages && currentProduct.colorImages[color]){
    const src = currentProduct.colorImages[color];
    document.getElementById("gallery-main-img").src = src;
    document.querySelectorAll("#gallery-thumbs button").forEach(b => {
      b.classList.toggle("active", b.dataset.src === src);
    });
  }
  updateBuyWhatsAppLink();
}

function handleAddToCart(buyNow){
  const p = currentProduct;
  const qty = Number(document.getElementById("pd-qty").value) || 1;
  addToCart({
    id: p.id,
    name: p.name,
    image: getColorImage(p, selectedColor),
    price: p.price,
    color: selectedColor,
    size: selectedSize,
    customText: "",
    customDesign: null,
    designPreview: null,
    qty: qty
  });
  showToast(`${p.name} added to cart`);
  if (buyNow){
    window.location.href = "checkout.html";
  }
}

function renderRelated(p){
  const wrap = document.getElementById("related-grid");
  if (!wrap) return;
  const related = PRODUCTS.filter(x => x.category === p.category && x.id !== p.id).slice(0, 4);
  const fallback = related.length ? related : PRODUCTS.filter(x => x.id !== p.id).slice(0, 4);
  wrap.innerHTML = fallback.map(productCardHTML).join("");
  bindWishlistButtons(wrap);
}

document.addEventListener("DOMContentLoaded", initProductPage);
