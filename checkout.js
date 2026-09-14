(() => {
  'use strict';

  const cartKey = 'printora-cart';
  const money = value => `PKR ${Number(value).toLocaleString('en-PK')}`;
  const $ = selector => document.querySelector(selector);
  const products = {
    tshirt: { name: 'Custom Printed T-Shirt', price: 1299, image: 'assets/tshirt.jpg' },
    nameplate: { name: 'Acrylic Name Plate', price: 1850, image: 'assets/name-plate.jpg' },
    weddingcard: { name: 'Wedding Card', price: 180, image: 'assets/wedding-card.jpg' },
    keychain: { name: 'Custom Keychain', price: 350, image: 'assets/keychain.jpg' },
    frame: { name: 'Photo Frame', price: 1250, image: 'assets/photo-frame.png' },
    mug: { name: 'Custom Mug', price: 850, image: 'assets/coffee-mug.jpg' },
    giftbox: { name: 'Luxury Gift Box', price: 950, image: 'assets/gift-box.jpg' },
    phonecase: { name: 'Custom Phone Case', price: 1100, image: 'assets/phone-case.jpg' },
    cap: { name: 'Custom Cap', price: 950, image: 'assets/cap.jpg' },
    totebag: { name: 'Custom Tote Bag', price: 750, image: 'assets/tshirt.jpg' }
  };

  function readCart() {
    try { return JSON.parse(localStorage.getItem(cartKey) || '[]'); } catch { return []; }
  }

  function detailedCart() {
    return readCart().map(item => ({ ...item, product: item.product || products[item.id] })).filter(item => item.product && item.qty > 0);
  }

  function renderSummary() {
    const items = detailedCart();
    const container = $('#checkoutItems');
    const total = items.reduce((sum, item) => sum + item.qty * item.product.price, 0);
    $('#checkoutTotal').textContent = money(total);
    if (!items.length) {
      container.innerHTML = '<p class="muted">Your cart is empty. Return to the store and add a product first.</p>';
      $('#payButton').disabled = true;
      return { items, total };
    }
    container.innerHTML = items.map(item => `<div class="summary-item"><img src="${item.product.image}" alt=""><div><strong>${escapeHTML(item.product.name)}</strong><span>${item.qty} × ${money(item.product.price)}</span></div><b>${money(item.qty * item.product.price)}</b></div>`).join('');
    return { items, total };
  }

  function escapeHTML(value) { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char])); }

  function setStatus(message, type = '') {
    const status = $('#checkoutStatus');
    status.textContent = message;
    status.className = `checkout-status ${type}`;
  }

  function validateDemoPayment(method) {
    if (method === 'cod') return true;
    const number = $('#cardNumber').value.replace(/\D/g, '');
    const expiry = $('#cardExpiry').value.trim();
    const cvc = $('#cardCvc').value.trim();
    if (number.length !== 16 || !/^\d{2}\/\d{2}$/.test(expiry) || !/^\d{3,4}$/.test(cvc)) {
      setStatus('Enter a 16-digit demo card number, expiry in MM/YY format, and a 3–4 digit CVC.', 'error');
      return false;
    }
    return true;
  }

  async function submitCheckout(event) {
    event.preventDefault();
    const summary = renderSummary();
    if (!summary.items.length) return setStatus('Your cart is empty. Add a product before checkout.', 'error');
    const form = new FormData(event.currentTarget);
    const paymentMethod = form.get('paymentMethod');
    if (!validateDemoPayment(paymentMethod)) return;
    const button = $('#payButton');
    button.disabled = true;
    button.textContent = 'Authorizing demo payment…';
    setStatus('Creating your mock order…');
    const payload = { customer: { name: form.get('name'), email: form.get('email'), phone: form.get('phone'), address: form.get('address') }, paymentMethod, items: summary.items.map(item => ({ id: item.id, qty: item.qty, product: item.product })) };
    try {
      const response = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Checkout failed');
      localStorage.removeItem(cartKey);
      button.textContent = 'Payment complete';
      setStatus(`Order ${result.order.id} created successfully. Mock payment status: ${result.payment.status}.`, 'success');
      $('#checkoutItems').insertAdjacentHTML('afterbegin', `<div class="order-success"><strong>Thank you, ${escapeHTML(result.order.customer.name)}.</strong><span>Confirmation sent to ${escapeHTML(result.order.customer.email)}.</span></div>`);
    } catch (error) {
      button.disabled = false;
      button.textContent = 'Pay securely in demo →';
      setStatus(`${error.message}. Start the mock server and try again.`, 'error');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderSummary();
    $('#checkoutForm').addEventListener('submit', submitCheckout);
    document.querySelectorAll('input[name="paymentMethod"]').forEach(input => input.addEventListener('change', event => { $('#mockCardFields').hidden = event.target.value === 'cod'; }));
  });
})();
