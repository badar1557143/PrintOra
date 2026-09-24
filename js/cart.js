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
        ${item.designPreview ? `<button class="ci-remove ci-download" data-i="${i}">Download Design</button>` : ""}
      </div>
      <div class="ci-price">${formatPrice(item.price * item.qty)}</div>
    </div>`).join("");

  wrap.querySelectorAll(".ci-download").forEach(btn => {
    btn.addEventListener("click", () => {
      const item = getCart()[Number(btn.dataset.i)];
      if (!item || !item.designPreview) return;
      const a = document.createElement("a");
      a.href = item.designPreview;
      a.download = `${(item.name || "printoria-design").replace(/\s+/g, "-").toLowerCase()}-design.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    });
  });

  const designHint = document.getElementById("design-file-hint");
  if (designHint) designHint.style.display = cart.some(item => item.designPreview) ? "block" : "none";

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

// Builds the WhatsApp checkout message from the cart + whatever contact/shipping
// fields the customer has filled in, plus their chosen payment method.
function buildCheckoutWhatsAppUrl(cart, subtotal, shipping, shippingMethod){
  const val = id => { const el = document.getElementById(id); return el && el.value.trim() ? el.value.trim() : null; };
  const itemLines = cart.map(item => {
    const opts = [item.color ? `Color: ${item.color}` : null, item.size ? `Size: ${item.size}` : null].filter(Boolean).join(", ");
    return `- ${item.name} × ${item.qty}${opts ? ` (${opts})` : ""} — ${formatPrice(item.price * item.qty)}${item.designPreview ? " [custom design — I'll attach the file]" : ""}`;
  });
  const hasDesigns = cart.some(item => item.designPreview);
  const paymentRadio = document.querySelector('input[name="payment"]:checked');
  const paymentLabel = { cod: "Cash on Delivery", whatsapp: "Pay on WhatsApp (bank transfer / mobile wallet)" };
  const lines = [
    "Hi! I'd like to place this order:",
    ...itemLines,
    `Subtotal: ${formatPrice(subtotal)}`,
    `Shipping (${shippingMethod && shippingMethod.value === "express" ? "Express" : "Standard"}): ${formatPrice(shipping)}`,
    `Total: ${formatPrice(subtotal + shipping)}`,
    `Payment: ${paymentRadio ? paymentLabel[paymentRadio.value] : paymentLabel.cod}`,
    "",
    val("full-name") ? `Name: ${val("full-name")}` : null,
    val("phone") ? `Phone: ${val("phone")}` : null,
    val("address") ? `Address: ${[val("address"), val("city"), val("postal"), val("country")].filter(Boolean).join(", ")}` : null,
    hasDesigns ? "" : null,
    hasDesigns ? "(I'll send my design image(s) as attachments right after this message.)" : null
  ].filter(line => line !== null);
  return whatsappLink(lines.join("\n"));
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
    const url = buildCheckoutWhatsAppUrl(cart, subtotal, shipping, shippingMethod);
    window.open(url, "_blank", "noopener");

    document.getElementById("checkout-form-wrap").style.display = "none";
    document.getElementById("checkout-confirmation").style.display = "block";
    localStorage.removeItem(STORAGE_CART);
    updateCartBadge();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderCartPage();
  initCheckoutPage();
});
