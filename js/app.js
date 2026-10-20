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
    return sum + (
      Number.isInteger(item.qty) && item.qty > 0 ? item.qty : 0
    );
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
    if (item.qty >= 5) {
      alert('Maximum quantity is 5 per item.');
      return;
    }

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

    return `
      <div class="cart-row">
        <div class="product-img mini ${product.className}">
          <span>H/77</span>
        </div>

        <div>
          <h3>${product.name}</h3>
          <p>Color: ${item.color || 'Not selected'}</p>
          <p>Size: ${item.size || 'Not selected'}</p>
        </div>

        <div>Qty: ${item.qty}</div>

        <strong>
          ${hasPrice
            ? formatPrice(price * item.qty)
            : 'Price coming soon'}
        </strong>

        <button onclick="removeItem(
          ${product.id},
          ${JSON.stringify(item.color || '')},
          ${JSON.stringify(item.size || '')}
        )">REMOVE</button>
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

    <button class="btn" id="checkoutButton" onclick="checkout()">
      CHECKOUT
    </button>
  `;
}

async function checkout() {
  const cart = getCart();

  if (!cart.length) {
    alert('Your cart is empty.');
    return;
  }

  // Validate the entire cart before sending any orders.
  for (const item of cart) {
    const product = getProduct(item.id);

    if (
      !product ||
      !Number.isInteger(item.qty) ||
      item.qty < 1 ||
      item.qty > 5
    ) {
      alert('Please review your cart. Quantity must be between 1 and 5.');
      return;
    }

    if (
      product.name !== 'H/77 Essential Hoodie' ||
      item.color !== 'Charcoal' ||
      !['S', 'M', 'L', 'XL'].includes(item.size)
    ) {
      alert(
        'Currently, only the H/77 Essential Hoodie in Charcoal is available for checkout. Please review your product, color and size.'
      );
      return;
    }

    if (!Number.isFinite(product.price) || product.price !== 700) {
      alert('This product price is not configured for checkout.');
      return;
    }
  }

  const customerName = prompt('Enter your full name:');
  if (customerName === null) return;

  const phone = prompt('Enter your phone number:');
  if (phone === null) return;

  const address = prompt('Enter your full delivery address:');
  if (address === null) return;

  if (
    customerName.trim().length < 2 ||
    phone.trim().length < 7 ||
    address.trim().length < 5
  ) {
    alert('Please enter a valid name, phone number and delivery address.');
    return;
  }

  const button = document.getElementById('checkoutButton');

  if (button) {
    button.disabled = true;
    button.textContent = 'PROCESSING...';
  }

  const submittedKeys = [];
  const orderIds = [];

  try {
    // Each cart line is sent as a separate order.
    for (const item of cart) {
      const product = getProduct(item.id);

      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customer_name: customerName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          product_name: product.name,
          color: item.color,
          size: item.size,
          quantity: item.qty
        })
      });

      let result;

      try {
        result = await response.json();
      } catch {
        result = null;
      }

      if (
        !response.ok ||
        !result ||
        result.success !== true ||
        !result.order_id
      ) {
        throw new Error(
          result?.error || `Order request failed (${response.status}).`
        );
      }

      orderIds.push(result.order_id);

      submittedKeys.push(
        `${item.id}|${item.color || ''}|${item.size || ''}`
      );
    }

    // Clear the cart only after every line has been confirmed.
    saveCart([]);
    renderCart();

    alert(
      `Order placed successfully!\nOrder ID(s): ${orderIds.join(', ')}\n\nOur team will contact you to confirm delivery.`
    );
  } catch (error) {
    // Keep only lines that were not successfully submitted.
    if (submittedKeys.length > 0) {
      const remaining = getCart().filter(item => {
        const key =
          `${item.id}|${item.color || ''}|${item.size || ''}`;

        return !submittedKeys.includes(key);
      });

      saveCart(remaining);
      renderCart();
    }

    if (orderIds.length > 0) {
      alert(
        `Some orders were saved successfully. Order ID(s): ${orderIds.join(', ')}.\n\nThe remaining items were not confirmed. Please check with us before trying again.\n\nError: ${error.message}`
      );
    } else {
      alert(
        `We could not confirm your order. Your cart has been kept.\n\n${error.message}`
      );
    }
  } finally {
    const currentButton = document.getElementById('checkoutButton');

    if (currentButton) {
      currentButton.disabled = false;
      currentButton.textContent = 'CHECKOUT';
    }
  }
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
