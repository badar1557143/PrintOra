/* =========================================================
   PRINTORIA — Cart & checkout logic
   Cart persists in localStorage (see main.js for storage
   helpers: getCart, saveCart, addToCart).
   ========================================================= */

const SHIPPING_STANDARD = 250;
const SHIPPING_EXPRESS = 650;

function cartSubtotal(){
  return getCart().reduce((sum, item) => sum + item.price * item.qty, 0);
}

function renderCartPage(){
  const wrap = document.getElementById("cart-items");
  if (!wrap) return;

  const cart = getCart();
  const emptyState = document.getElementById("cart-empty");
  const layout = document.getElementById("cart-layout");

  if (cart.length === 0){
    layout.style.display = "none";
    emptyState.style.display = "block";
    return;
  }
  layout.style.display = "grid";
  emptyState.style.display = "none";

  wrap.innerHTML = cart.map((item, i) => `
    <div class="cart-item">
      <img src="${item.designPreview || item.customImage || item.image}" alt="${item.name}">
      <div>
        <div class="ci-name">${item.name}</div>
        <div class="ci-opts">
          ${item.color ? "Color: " + item.color + " · " : ""}${item.size ? "Size: " + item.size : ""}
          ${item.customText ? " · " + item.customText : ""}
        </div>
        <div class="qty-row">
          <button aria-label="Decrease quantity" data-i="${i}" class="ci-minus">−</button>
          <input type="text" value="${item.qty}" readonly>
          <button aria-label="Increase quantity" data-i="${i}" class="ci-plus">+</button>
        </div>
        <button class="ci-remove" data-i="${i}">Remove</button>
        ${(item.designFiles || []).map((f, fi) => `
          <span class="ci-download-wrap">
            <button class="ci-download" data-i="${i}" data-file="${fi}">Download ${(item.designFiles.length > 1 ? f.label : "Design")}</button>
          </span>
        `).join("")}
      </div>
      <div class="ci-price">${formatPrice(item.price * item.qty)}</div>
    </div>`).join("");

  wrap.querySelectorAll(".ci-download").forEach(btn => {
    const item = getCart()[Number(btn.dataset.i)];
    const file = item && item.designFiles && item.designFiles[Number(btn.dataset.file)];
    if (!file) return;
    attachDownloadMenu(btn, btn.parentElement, (format) => {
      const base = `${(item.name || "printoria-design").replace(/\s+/g, "-").toLowerCase()}-${file.label.replace(/\s+/g, "-").toLowerCase()}`;
      downloadDesignAsFormat(file.dataUrl, format, base);
    });
  });

  const designHint = document.getElementById("design-file-hint");
  if (designHint) designHint.style.display = cart.some(item => item.designFiles && item.designFiles.length) ? "block" : "none";

  wrap.querySelectorAll(".ci-remove").forEach(btn => {
    btn.addEventListener("click", () => {
      const cart = getCart();
      cart.splice(Number(btn.dataset.i), 1);
      saveCart(cart);
      renderCartPage();
      updateSummary();
    });
  });
  wrap.querySelectorAll(".ci-plus").forEach(btn => {
    btn.addEventListener("click", () => {
      const cart = getCart();
      cart[Number(btn.dataset.i)].qty += 1;
      saveCart(cart);
      renderCartPage();
      updateSummary();
    });
  });
  wrap.querySelectorAll(".ci-minus").forEach(btn => {
    btn.addEventListener("click", () => {
      const cart = getCart();
      const idx = Number(btn.dataset.i);
      cart[idx].qty = Math.max(1, cart[idx].qty - 1);
      saveCart(cart);
      renderCartPage();
      updateSummary();
    });
  });

  updateSummary();
}

function updateSummary(){
  const subtotalEl = document.getElementById("cart-subtotal");
  const shippingEl = document.getElementById("cart-shipping");
  const totalEl = document.getElementById("cart-total");
  if (!subtotalEl) return;
  const subtotal = cartSubtotal();
  const shipping = subtotal > 0 ? SHIPPING_STANDARD : 0;
  subtotalEl.textContent = formatPrice(subtotal);
  shippingEl.textContent = subtotal > 0 ? formatPrice(shipping) : "—";
  totalEl.textContent = formatPrice(subtotal + shipping);
}

/* ---------- Checkout page ---------- */
function renderCheckoutSummary(){
  const wrap = document.getElementById("checkout-items");
  if (!wrap) return;
  const cart = getCart();

  if (cart.length === 0){
    window.location.href = "cart.html";
    return;
  }

  wrap.innerHTML = cart.map(item => `
    <div class="summary-row">
      <span>${item.name} × ${item.qty}</span>
      <span>${formatPrice(item.price * item.qty)}</span>
    </div>`).join("");

  const subtotal = cartSubtotal();
  const shippingMethod = document.querySelector('input[name="shipping"]:checked');
  const shipping = shippingMethod && shippingMethod.value === "express" ? SHIPPING_EXPRESS : SHIPPING_STANDARD;

  document.getElementById("checkout-subtotal").textContent = formatPrice(subtotal);
  document.getElementById("checkout-shipping").textContent = formatPrice(shipping);
  document.getElementById("checkout-total").textContent = formatPrice(subtotal + shipping);
}

// Short human-readable order reference, shared between the WhatsApp message
// and the downloaded summary document so the two are easy to match up.
function generateOrderRef(){
  return "PRT-" + Date.now().toString().slice(-6);
}

function checkoutContactInfo(){
  const val = id => { const el = document.getElementById(id); return el && el.value.trim() ? el.value.trim() : null; };
  return {
    name: val("full-name"),
    email: val("email"),
    phone: val("phone"),
    address: val("address"),
    city: val("city"),
    postal: val("postal"),
    country: val("country")
  };
}

function checkoutPaymentLabel(){
  const paymentRadio = document.querySelector('input[name="payment"]:checked');
  const paymentLabel = { cod: "Cash on Delivery", whatsapp: "Pay on WhatsApp (bank transfer / mobile wallet)" };
  return paymentRadio ? paymentLabel[paymentRadio.value] : paymentLabel.cod;
}

// Builds the order message text from the cart + whatever contact/shipping
// fields the customer has filled in, plus their chosen payment method. Used
// both for the wa.me link and as the text portion of a native share.
function buildOrderMessageText(cart, subtotal, shipping, shippingMethod, orderRef){
  const contact = checkoutContactInfo();
  const itemLines = cart.map(item => {
    const opts = [item.color ? `Color: ${item.color}` : null, item.size ? `Size: ${item.size}` : null].filter(Boolean).join(", ");
    return `- ${item.name} × ${item.qty}${opts ? ` (${opts})` : ""} — ${formatPrice(item.price * item.qty)}${item.designFiles && item.designFiles.length ? ` [custom design — ${item.designFiles.length > 1 ? item.designFiles.length + " files" : "file"} attached]` : ""}`;
  });
  const hasDesigns = cart.some(item => item.designFiles && item.designFiles.length);
  const lines = [
    "Hi! I'd like to place this order:",
    `Order Ref: ${orderRef}`,
    ...itemLines,
    `Subtotal: ${formatPrice(subtotal)}`,
    `Shipping (${shippingMethod && shippingMethod.value === "express" ? "Express" : "Standard"}): ${formatPrice(shipping)}`,
    `Total: ${formatPrice(subtotal + shipping)}`,
    `Payment: ${checkoutPaymentLabel()}`,
    "",
    contact.name ? `Name: ${contact.name}` : null,
    contact.phone ? `Phone: ${contact.phone}` : null,
    contact.address ? `Address: ${[contact.address, contact.city, contact.postal, contact.country].filter(Boolean).join(", ")}` : null,
    "",
    hasDesigns ? `(My design file(s) are attached — ref ${orderRef}.)` : null
  ].filter(line => line !== null);
  return lines.join("\n");
}

// data: URL (as produced by the Design Studio canvas export) -> File, so it
// can be handed to navigator.share() alongside the order text. Kept as a
// real "image/png" — Chrome's Web Share API maintains its own allow-list of
// shareable MIME types (images, video, audio, PDF, plain text, a few Office
// formats) and silently rejects the whole share if the file's type isn't on
// it. An earlier version of this code set the type to
// "application/octet-stream" to try to make WhatsApp treat the file as a
// Document instead of a compressed Photo — but that type isn't on Chrome's
// list, so canShare() always came back false and every share silently fell
// through to the download fallback. Real "image/png" is what makes the
// share sheet actually open; WhatsApp will attach it as a Photo.
function dataUrlToFile(dataUrl, filename, fallbackMime){
  const [header, data] = dataUrl.split(",");
  const mimeMatch = header.match(/data:(.*?);base64/);
  const mime = mimeMatch ? mimeMatch[1] : (fallbackMime || "image/png");
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}

function designFileName(item, file, orderRef){
  const base = `${(item.name || "printoria-design").replace(/\s+/g, "-").toLowerCase()}-${file.label.replace(/\s+/g, "-").toLowerCase()}-${orderRef}`;
  return `${base}.png`;
}

// Tries the device's native share sheet so the order text and design
// file(s) go to WhatsApp *together*, attached to one message — the only way
// a webpage can actually hand a file to WhatsApp alongside text, since
// wa.me links carry text only. Only works where the browser supports
// sharing files (mainly mobile) and the customer picks WhatsApp from the
// sheet that opens. Returns a Promise if it can attempt a share, or null if
// the browser can't share files at all (desktop, mostly, or a cart with no
// custom designs), so the caller knows to fall back to opening wa.me.
//
// Note: shared this way, WhatsApp attaches the image as a (compressed)
// Photo — there's no reliable way to force Document mode through Chrome's
// Web Share API (see dataUrlToFile above). Full, uncompressed quality is
// only guaranteed via the manual-attach fallback below, where the customer
// picks "Document" themselves inside WhatsApp.
function tryNativeOrderShare(cart, orderRef, messageText){
  if (!navigator.share || !navigator.canShare) return null;

  const designFiles = [];
  cart.forEach(item => (item.designFiles || []).forEach(file => {
    designFiles.push(dataUrlToFile(file.dataUrl, designFileName(item, file, orderRef)));
  }));
  if (!designFiles.length || !navigator.canShare({ files: designFiles })) return null;

  return navigator.share({ text: messageText, files: designFiles });
}

function initCheckoutPage(){
  const form = document.getElementById("checkout-form");
  if (!form) return;

  renderCheckoutSummary();

  document.querySelectorAll('input[name="shipping"]').forEach(radio => {
    radio.addEventListener("change", () => {
      document.querySelectorAll(".radio-card").forEach(card => card.classList.remove("selected"));
      radio.closest(".radio-card").classList.add("selected");
      renderCheckoutSummary();
    });
  });
  document.querySelectorAll('input[name="payment"]').forEach(radio => {
    radio.addEventListener("change", () => {
      document.querySelectorAll(".payment-options .radio-card").forEach(card => card.classList.remove("selected"));
      radio.closest(".radio-card").classList.add("selected");
      renderCheckoutSummary();
    });
  });

  // Keep the WhatsApp message in sync as the customer fills in contact/shipping details
  ["full-name", "phone", "address", "city", "postal"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", renderCheckoutSummary);
  });
  const countryEl = document.getElementById("country");
  if (countryEl) countryEl.addEventListener("change", renderCheckoutSummary);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.checkValidity()){
      form.reportValidity();
      return;
    }
    const cart = getCart();
    const subtotal = cartSubtotal();
    const shippingMethod = document.querySelector('input[name="shipping"]:checked');
    const shipping = shippingMethod && shippingMethod.value === "express" ? SHIPPING_EXPRESS : SHIPPING_STANDARD;
    const orderRef = generateOrderRef();
    const messageText = buildOrderMessageText(cart, subtotal, shipping, shippingMethod, orderRef);
    const hasDesigns = cart.some(item => item.designFiles && item.designFiles.length);

    const finishOrder = (viaShare) => {
      const designNote = document.getElementById("confirmation-design-note");
      const heading = document.querySelector("#checkout-confirmation h2");
      const body = document.querySelector("#checkout-confirmation p");
      if (viaShare){
        if (heading) heading.textContent = "Order shared";
        if (body) body.innerHTML = `Your order and design file(s) were shared as one attachment — ref <strong>${orderRef}</strong>. Our team will confirm the total, delivery, and payment with you on WhatsApp.`;
      } else if (designNote){
        designNote.textContent = hasDesigns
          ? ", and we've downloaded your design file(s) to your device — attach them in that chat as a Document (not Photo) for full print quality, then send"
          : "";
      }
      document.getElementById("checkout-form-wrap").style.display = "none";
      document.getElementById("checkout-confirmation").style.display = "block";
      localStorage.removeItem(STORAGE_CART);
      updateCartBadge();
    };

    // Fallback for devices that can't share files (mostly desktop): open
    // WhatsApp with the pre-filled message, and auto-download each custom
    // design file so it's ready to attach manually. Staggered a beat apart
    // since browsers can silently block several downloads fired at once.
    const openWhatsAppAndDownload = () => {
      window.open(whatsappLink(messageText), "_blank", "noopener");
      let delay = 0;
      cart.forEach(item => (item.designFiles || []).forEach(file => {
        setTimeout(() => triggerFileDownload(file.dataUrl, designFileName(item, file, orderRef)), delay);
        delay += 500;
      }));
      finishOrder(false);
    };

    const sharePromise = tryNativeOrderShare(cart, orderRef, messageText);
    if (sharePromise){
      // The share sheet is up — text + design file(s) attached together in
      // one go, which a plain wa.me link can never do.
      sharePromise
        .then(() => finishOrder(true))
        .catch(err => {
          if (err && err.name === "AbortError"){
            // Customer closed the share sheet without picking anything —
            // don't also pop open WhatsApp behind their back.
            showToast("Order not sent — tap Place Order to try again.");
            return;
          }
          openWhatsAppAndDownload();
        });
    } else {
      openWhatsAppAndDownload();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderCartPage();
  initCheckoutPage();
});
