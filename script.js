(() => {
  'use strict';

  const PRODUCTS = [
    { id: 'tshirt', name: 'Custom Printed T-Shirt', subtitle: 'Premium quality cotton', price: 1299, badge: '', icon: 'tshirt' },
    { id: 'nameplate', name: 'Acrylic Name Plate', subtitle: 'Custom size & design', price: 1850, badge: 'Best Seller', badgeClass: 'orange', icon: 'nameplate' },
    { id: 'weddingcard', name: 'Wedding Card', subtitle: 'Premium matte finish', price: 180, badge: 'New', badgeClass: 'green', icon: 'weddingcard' },
    { id: 'keychain', name: 'Custom Keychain', subtitle: 'Durable metal keychain', price: 350, badge: '', icon: 'keychain' },
    { id: 'frame', name: 'Photo Frame', subtitle: 'Wooden photo frame', price: 1250, badge: 'Best Seller', badgeClass: 'orange', icon: 'frame' },
    { id: 'mug', name: 'Custom Mug', subtitle: 'High-quality print', price: 850, badge: 'New', badgeClass: 'green', icon: 'mug' },
    { id: 'giftbox', name: 'Luxury Gift Box', subtitle: 'Curated gift packaging', price: 950, badge: '', icon: 'giftbox' },
    { id: 'totebag', name: 'Custom Tote Bag', subtitle: 'Reusable canvas tote', price: 750, badge: 'New', badgeClass: 'green', icon: 'tshirt' },
    { id: 'phonecase', name: 'Custom Phone Case', subtitle: 'Protective printed case', price: 1100, badge: 'New', badgeClass: 'green', icon: 'phonecase' },
    { id: 'cap', name: 'Custom Cap', subtitle: 'Embroidered cotton cap', price: 950, badge: '', icon: 'cap' }
  ];

  const IMAGE_URLS = {
    tshirt: 'assets/tshirt.jpg',
    nameplate: 'assets/name-plate.jpg',
    weddingcard: 'assets/wedding-card.jpg',
    keychain: 'assets/keychain.jpg',
    frame: 'assets/photo-frame.png',
    mug: 'assets/coffee-mug.jpg',
    giftbox: 'assets/gift-box.jpg',
    phonecase: 'assets/phone-case.jpg',
    cap: 'assets/cap.jpg'
  };

  const ICONS = {
    tshirt: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M20 8 L26 8 Q32 14 38 8 L44 8 L54 16 L48 24 L44 21 L44 54 Q44 56 42 56 L22 56 Q20 56 20 54 L20 21 L16 24 L10 16 Z" fill="#2b2620" stroke="#E3A63E" stroke-width="2" stroke-linejoin="round"/><rect x="27" y="10" width="10" height="4" rx="2" fill="#E3A63E"/></svg>',
    nameplate: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="10" y="24" width="44" height="18" rx="3" fill="#fff" stroke="#C98A1F" stroke-width="2"/><text x="32" y="37" font-family="Poppins, sans-serif" font-size="10" font-weight="700" fill="#121212" text-anchor="middle">NAME</text><rect x="20" y="42" width="6" height="10" fill="#7A756C"/><rect x="38" y="42" width="6" height="10" fill="#7A756C"/></svg>'
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const money = value => `PKR ${Number(value).toLocaleString('en-PK')}`;
  const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));

  function productVisual(product, size = 400) {
    const imageSource = product.image || IMAGE_URLS[product.id];
    if (imageSource) {
      return `<img src="${imageSource}" alt="${escapeHTML(product.name)}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='assets/placeholder.svg';">`;
    }
    return ICONS[product.icon] || ICONS.tshirt;
  }

  const elements = {
    userBtn: $('#userBtn'),
    userDropdown: $('#userDropdown'),
    searchBtn: $('#searchBtn'),
    searchOverlay: $('#searchOverlay'),
    searchClose: $('#searchClose'),
    searchInput: $('#searchInput'),
    searchResults: $('#searchResults'),
    cartBtn: $('#cartBtn'),
    cartDrawer: $('#cartDrawer'),
    cartOverlay: $('#cartOverlayBg'),
    cartClose: $('#cartClose'),
    cartBody: $('#cartBody'),
    cartCount: $('#cartCount'),
    cartSubtotal: $('#cartSubtotal'),
    checkoutBtn: $('#checkoutBtn'),
    toast: $('#toast'),
    newsletterForm: $('#newsletterForm'),
    newsletterEmail: $('#newsletterEmail'),
    newsletterMsg: $('#newsletterMsg'),
    productScroll: $('#prodScroll')
  };

  let cart = loadCart();
  let toastTimer;

  function loadCart() {
    try {
      const saved = JSON.parse(localStorage.getItem('printora-cart') || '[]');
      return Array.isArray(saved) ? saved.filter(item => (item.product || PRODUCTS.some(product => product.id === item.id)) && item.qty > 0) : [];
    } catch {
      return [];
    }
  }

  function saveCart() {
    try { localStorage.setItem('printora-cart', JSON.stringify(cart)); } catch { /* Storage may be disabled. */ }
  }

  function showToast(message) {
    if (!elements.toast) return;
    elements.toast.textContent = message;
    elements.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => elements.toast.classList.remove('show'), 2400);
  }

  function openCart() {
    elements.cartDrawer?.classList.add('open');
    elements.cartOverlay?.classList.add('open');
    elements.cartDrawer?.setAttribute('aria-hidden', 'false');
  }

  function closeCart() {
    elements.cartDrawer?.classList.remove('open');
    elements.cartOverlay?.classList.remove('open');
    elements.cartDrawer?.setAttribute('aria-hidden', 'true');
  }

  function addToCart(id) {
    const product = PRODUCTS.find(item => item.id === id);
    if (!product) return;
    const existing = cart.find(item => item.id === id);
    existing ? existing.qty += 1 : cart.push({ id, qty: 1 });
    saveCart();
    renderCart();
    showToast(`${product.name} added to cart`);
  }

  function changeQuantity(id, amount) {
    const item = cart.find(entry => entry.id === id);
    if (!item) return;
    item.qty += amount;
    if (item.qty <= 0) cart = cart.filter(entry => entry.id !== id);
    saveCart();
    renderCart();
  }

  function renderCart() {
    if (!elements.cartBody || !elements.cartCount || !elements.cartSubtotal) return;
    const detailedCart = cart.map(item => ({ ...item, product: item.product || PRODUCTS.find(product => product.id === item.id) })).filter(item => item.product);
    const totalQty = detailedCart.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = detailedCart.reduce((sum, item) => sum + item.qty * item.product.price, 0);
    elements.cartCount.textContent = totalQty;
    elements.cartCount.setAttribute('aria-label', `${totalQty} item${totalQty === 1 ? '' : 's'} in cart`);
    elements.cartSubtotal.textContent = money(subtotal);

    if (!detailedCart.length) {
      elements.cartBody.innerHTML = '<div class="cart-empty">Your cart is empty. Add a product to get started.</div>';
      return;
    }

    elements.cartBody.innerHTML = detailedCart.map(({ id, qty, product }) => `
      <div class="cart-item">
        <div class="ci-photo photo">${productVisual(product, 100)}</div>
        <div class="ci-info"><h4>${escapeHTML(product.name)}</h4><div class="ci-price">${money(product.price)}</div>
          <div class="qty-ctrl" aria-label="Quantity for ${escapeHTML(product.name)}">
            <button type="button" data-act="dec" data-id="${id}" aria-label="Decrease quantity">−</button><span>${qty}</span><button type="button" data-act="inc" data-id="${id}" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <button type="button" class="ci-remove" data-act="remove" data-id="${id}" aria-label="Remove ${escapeHTML(product.name)}">×</button>
      </div>`).join('');
  }

  function renderSearchResults(query) {
    const matches = PRODUCTS.filter(product => `${product.name} ${product.subtitle}`.toLowerCase().includes(query));
    if (!matches.length) {
      elements.searchResults.innerHTML = `<div class="sr-empty">No products match “${escapeHTML(query)}”.</div>`;
      return;
    }
    elements.searchResults.innerHTML = matches.map(product => `
      <button type="button" class="sr-item" data-product-id="${product.id}">
        <span class="sr-icon">${productVisual(product, 100)} ${escapeHTML(product.name)}</span><strong>${money(product.price)}</strong>
      </button>`).join('');
  }

  function renderProductsFromData() {
    if (!elements.productScroll) return;
    elements.productScroll.innerHTML = PRODUCTS.map(product => `
      <article class="prod-card">
        ${product.badge ? `<span class="badge ${product.badgeClass || ''}">${escapeHTML(product.badge)}</span>` : ''}
        <div class="photo">${productVisual(product)}</div>
        <div class="prod-info"><h4>${escapeHTML(product.name)}</h4><div class="sub">${escapeHTML(product.subtitle)}</div><div class="price">${money(product.price)}</div>
          <button type="button" class="add-cart-btn" data-id="${product.id}">Add to Cart</button>
        </div>
      </article>`).join('');
  }

  function setupEvents() {
    document.addEventListener('click', event => {
      if (!event.target.closest('.user-wrap')) elements.userDropdown?.classList.remove('open');
    });
    elements.userBtn?.addEventListener('click', event => {
      event.stopPropagation();
      const open = elements.userDropdown.classList.toggle('open');
      elements.userBtn.setAttribute('aria-expanded', String(open));
    });

    elements.searchBtn?.addEventListener('click', () => {
      elements.searchOverlay.classList.add('open');
      elements.searchOverlay.setAttribute('aria-hidden', 'false');
      elements.searchInput.value = '';
      elements.searchResults.innerHTML = '';
      elements.searchInput.focus();
    });
    const closeSearch = () => {
      elements.searchOverlay.classList.remove('open');
      elements.searchOverlay.setAttribute('aria-hidden', 'true');
    };
    elements.searchClose?.addEventListener('click', closeSearch);
    elements.searchOverlay?.addEventListener('click', event => { if (event.target === elements.searchOverlay) closeSearch(); });
    elements.searchInput?.addEventListener('input', event => renderSearchResults(event.target.value.trim().toLowerCase()));
    elements.searchResults?.addEventListener('click', event => {
      const button = event.target.closest('[data-product-id]');
      if (!button) return;
      addToCart(button.dataset.productId);
      closeSearch();
      openCart();
    });

    elements.cartBtn?.addEventListener('click', openCart);
    elements.cartClose?.addEventListener('click', closeCart);
    elements.cartOverlay?.addEventListener('click', closeCart);
    elements.cartBody?.addEventListener('click', event => {
      const button = event.target.closest('[data-act]');
      if (!button) return;
      if (button.dataset.act === 'inc') changeQuantity(button.dataset.id, 1);
      if (button.dataset.act === 'dec') changeQuantity(button.dataset.id, -1);
      if (button.dataset.act === 'remove') changeQuantity(button.dataset.id, -999);
    });
    elements.productScroll?.addEventListener('click', event => {
      const button = event.target.closest('.add-cart-btn');
      if (button) addToCart(button.dataset.id);
    });

    $('#prodPrev')?.addEventListener('click', () => elements.productScroll?.scrollBy({ left: -240, behavior: 'smooth' }));
    $('#prodNext')?.addEventListener('click', () => elements.productScroll?.scrollBy({ left: 240, behavior: 'smooth' }));
    elements.checkoutBtn?.addEventListener('click', event => {
      event.preventDefault();
      if (!cart.length) return showToast('Your cart is empty');
      const lines = cart.map(item => {
        const product = item.product || PRODUCTS.find(entry => entry.id === item.id);
        return `${item.qty}x ${product.name} (${money(item.qty * product.price)})`;
      }).join('\\n');
      const subtotal = cart.reduce((sum, item) => {
        const product = item.product || PRODUCTS.find(entry => entry.id === item.id);
        return sum + item.qty * product.price;
      }, 0);
      window.open(`https://wa.me/923001234567?text=${encodeURIComponent(`Hi Printora! I'd like to order:\n${lines}\n\nSubtotal: ${money(subtotal)}`)}`, '_blank', 'noopener');
    });

    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      closeCart();
      closeSearch();
      elements.userDropdown?.classList.remove('open');
    });

    elements.newsletterForm?.addEventListener('submit', event => {
      event.preventDefault();
      const email = elements.newsletterEmail.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        elements.newsletterMsg.textContent = 'Please enter a valid email address.';
        elements.newsletterMsg.className = 'form-message error';
        return;
      }
      elements.newsletterMsg.textContent = 'Subscribed! Watch your inbox for offers.';
      elements.newsletterMsg.className = 'form-message success';
      elements.newsletterForm.reset();
    });
  }

  function setupDesigner() {
    const form = $('#designerForm');
    if (!form) return;
    const productSelect = $('#designerProduct');
    const textInput = $('#designerText');
    const colorInput = $('#designerTextColor');
    const logoInput = $('#designerLogo');
    const productImage = $('#designerProductImage');
    const textPreview = $('#designerTextPreview');
    const logoPreview = $('#designerLogoPreview');
    const textCount = $('#designerTextCount');
    const colorValue = $('#designerColorValue');
    const status = $('#designerStatus');
    const resetButton = $('#designerReset');
    let logoDataUrl = '';

    const designerProducts = {
      tshirt: { name: 'Custom Printed T-Shirt', price: 1299, image: 'assets/tshirt.jpg', alt: 'Custom T-shirt preview' },
      mug: { name: 'Custom Mug', price: 850, image: 'assets/coffee-mug.jpg', alt: 'Custom coffee mug preview' },
      phonecase: { name: 'Custom Phone Case', price: 1100, image: 'assets/phone-case.jpg', alt: 'Custom phone case preview' },
      keychain: { name: 'Custom Keychain', price: 350, image: 'assets/keychain.jpg', alt: 'Custom keychain preview' },
      cap: { name: 'Custom Cap', price: 950, image: 'assets/cap.jpg', alt: 'Custom cap preview' },
      totebag: { name: 'Custom Tote Bag', price: 750, image: 'assets/tshirt.jpg', alt: 'Custom tote bag preview' }
    };

    function updateDesignerPreview() {
      const product = designerProducts[productSelect.value] || designerProducts.tshirt;
      const text = textInput.value.trim() || 'YOUR TEXT';
      productImage.src = product.image;
      productImage.alt = product.alt;
      textPreview.textContent = text;
      textPreview.style.color = colorInput.value;
      textCount.value = `${textInput.value.length}/28`;
      textCount.textContent = `${textInput.value.length}/28`;
      colorValue.textContent = colorInput.value;
      status.textContent = `${product.name} preview updated`;
    }

    textInput.addEventListener('input', updateDesignerPreview);
    colorInput.addEventListener('input', updateDesignerPreview);
    productSelect.addEventListener('change', updateDesignerPreview);
    logoInput.addEventListener('change', () => {
      const file = logoInput.files?.[0];
      if (!file) return;
      if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type) || file.size > 5 * 1024 * 1024) {
        logoInput.value = '';
        logoDataUrl = '';
        logoPreview.hidden = true;
        status.textContent = 'Use a PNG, JPG, WEBP, or SVG under 5 MB';
        showToast('Logo must be an image under 5 MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = event => {
        logoDataUrl = event.target.result;
        logoPreview.src = logoDataUrl;
        logoPreview.hidden = false;
        status.textContent = 'Logo uploaded and previewed';
      };
      reader.readAsDataURL(file);
    });
    resetButton.addEventListener('click', () => {
      form.reset();
      logoDataUrl = '';
      logoPreview.hidden = true;
      updateDesignerPreview();
      status.textContent = 'Ready to customize';
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      const product = designerProducts[productSelect.value] || designerProducts.tshirt;
      const text = textInput.value.trim() || 'YOUR TEXT';
      cart.push({
        id: `custom-${Date.now()}`,
        qty: 1,
        product: { id: productSelect.value, name: `${product.name} — “${text}”`, price: product.price, image: logoDataUrl || product.image }
      });
      saveCart();
      renderCart();
      openCart();
      showToast('Your custom product was added to cart');
    });
    updateDesignerPreview();
  }

  document.addEventListener('error', event => {
    const image = event.target;
    if (image instanceof HTMLImageElement && !image.dataset.fallbackApplied) {
      image.dataset.fallbackApplied = 'true';
      image.src = 'assets/placeholder.svg';
    }
  }, true);

  renderProductsFromData();
  renderCart();
  setupEvents();
  setupDesigner();
})();

