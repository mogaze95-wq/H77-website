function getCart() {
  try {
    const cart = JSON.parse(localStorage.getItem('h77cart') || '[]');
    return Array.isArray(cart) ? cart : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem('h77cart', JSON.stringify(cart));
  updateCount();
}

function updateCount() {
  const count = getCart().reduce((sum, item) => {
    return sum + (Number.isInteger(item.qty) && item.qty > 0 ? item.qty : 0);
  }, 0);

  document.querySelectorAll('#cartCount').forEach(el => {
    el.textContent = count;
  });
}

function getProduct(id) {
  return PRODUCTS.find(product => product.id === Number(id));
}

function formatPrice(price) {
  return Number.isFinite(price) && price >= 0
    ? `EGP ${price.toLocaleString('en-US')}`
    : 'Price coming soon';
}

function productCard(product) {
  const hasPrice =
    Number.isFinite(product.price) && product.price >= 0;

  return `
    <article class="product-card">
      <a href="product.html?id=${product.id}">
        <div class="product-img ${product.className}">
          <span>H/77</span>
        </div>
      </a>

      <div class="product-info">
        <div>
          <h3>${product.name}</h3>
          <p>${product.sub}</p>
        </div>
        <strong>${formatPrice(product.price)}</strong>
      </div>

      <a class="add" href="product.html?id=${product.id}">
        ${hasPrice ? 'SELECT OPTIONS' : 'VIEW PRODUCT'}
      </a>
    </article>
  `;
}

function renderProducts(elementId, limit) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const products = limit
    ? PRODUCTS.slice(0, limit)
    : PRODUCTS;

  element.innerHTML = products.map(productCard).join('');
}

function addToCart(id, color = '', size = '') {
  const product = getProduct(id);
  if (!product) return;

  if (!Number.isFinite(product.price) || product.price < 0) {
    alert('Price coming soon.');
    return;
  }

  if (!size) {
    alert('Please select a size.');
    return;
  }

  const cart = getCart();

  const item = cart.find(entry =>
    entry.id === product.id &&
    (entry.color || '') === color &&
    (entry.size || '') === size
  );

  if (item) {
    item.qty++;
  } else {
    cart.push({
      id: product.id,
      color,
      size,
      qty: 1
    });
  }

  saveCart(cart);
  renderCart();
  alert('Added to cart.');
}

function renderCart() {
  const element = document.getElementById('cartItems');
  if (!element) return;

  const cart = getCart().filter(item =>
    getProduct(item.id) &&
    Number.isInteger(item.qty) &&
    item.qty > 0
  );

  if (!cart.length) {
    element.innerHTML = `
      <div class="empty">
        <h2>Your cart is empty.</h2>
        <a class="btn" href="shop.html">SHOP DROP 01</a>
      </div>
    `;
    return;
  }

  let total = 0;
  let hasUnpricedItems = false;

  element.innerHTML = cart.map(item => {
    const product = getProduct(item.id);
    const price = product.price;
    const hasPrice = Number.isFinite(price) && price >= 0;

    if (hasPrice) {
      total += price * item.qty;
    } else {
      hasUnpricedItems = true;
    }

    const color = item.color || 'Default';
    const size = item.size || 'Not selected';

    return `
      <div class="cart-row">
        <div class="product-img mini ${product.className}">
          <span>H/77</span>
        </div>

        <div>
          <h3>${product.name}</h3>
          <p>Color: ${color}</p>
          <p>Size: ${size}</p>
        </div>

        <div>Qty: ${item.qty}</div>

        <strong>
          ${hasPrice
            ? formatPrice(price * item.qty)
            : 'Price coming soon'}
        </strong>

        <button
          onclick="removeItem(${product.id}, ${JSON.stringify(item.color || '')}, ${JSON.stringify(item.size || '')})">
          REMOVE
        </button>
      </div>
    `;
  }).join('');

  element.innerHTML += `
    <div class="cart-total">
      <span>TOTAL</span>
      <strong>
        ${hasUnpricedItems
          ? 'Pending price confirmation'
          : formatPrice(total)}
      </strong>
    </div>

    <button class="btn" onclick="checkout()">CHECKOUT</button>
  `;
}

function checkout() {
  const cart = getCart();

  if (!cart.length) {
    alert('Your cart is empty.');
    return;
  }

  const hasInvalidItems = cart.some(item =>
    !getProduct(item.id) ||
    !Number.isInteger(item.qty) ||
    item.qty < 1
  );

  if (hasInvalidItems) {
    alert('Please review your cart.');
    return;
  }

  const hasUnpricedItems = cart.some(item => {
    const product = getProduct(item.id);
    return !Number.isFinite(product.price) || product.price < 0;
  });

  if (hasUnpricedItems) {
    alert('Please confirm product prices before checkout.');
    return;
  }

  alert('Checkout demo — payment and shipping are not connected yet.');
}

function removeItem(id, color = '', size = '') {
  const cart = getCart();

  const index = cart.findIndex(item =>
    item.id === Number(id) &&
    (item.color || '') === color &&
    (item.size || '') === size
  );

  if (index !== -1) {
    cart.splice(index, 1);
  }

  saveCart(cart);
  renderCart();
}

updateCount();
renderProducts('featuredProducts', 3);
renderProducts('shopProducts');
renderCart();

document.querySelectorAll('.menu-btn').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelector('.nav')?.classList.toggle('open');
  });
});
