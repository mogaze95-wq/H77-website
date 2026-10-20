function getCart() {
  try {
    const cart = JSON.parse(localStorage.getItem("h77cart") || "[]");
    return Array.isArray(cart) ? cart : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem("h77cart", JSON.stringify(cart));
  updateCount();
}

function updateCount() {
  const count = getCart().reduce((sum, item) => {
    return sum + (
      Number.isInteger(item.qty) && item.qty > 0 ? item.qty : 0
    );
  }, 0);

  document.querySelectorAll("#cartCount").forEach(el => {
    el.textContent = count;
  });
}

function getProduct(id) {
  return PRODUCTS.find(product => product.id === Number(id));
}

function formatPrice(price) {
  return Number.isFinite(price) && price > 0
    ? `EGP ${price.toLocaleString("en-US")}`
    : "Price coming soon";
}

function productCard(product) {
  const hasPrice =
    Number.isFinite(product.price) && product.price > 0;

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
        ${hasPrice ? "SELECT OPTIONS" : "VIEW PRODUCT"}
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

  element.innerHTML = products.map(productCard).join("");
}

function addToCart(id, color = "", size = "") {
  const product = getProduct(id);

  if (!product) {
    alert("Product not found.");
    return false;
  }

  if (!Number.isFinite(product.price) || product.price <= 0) {
    alert("Price coming soon.");
    return false;
  }

  if (!product.colors.includes(color)) {
    alert("Please select an available color.");
    return false;
  }

  if (!["M", "L", "XL", "2XL"].includes(size)) {
    alert("Please select a valid size.");
    return false;
  }

  // Only the currently priced product can be purchased.
  if (
    product.name !== "H/77 Essential Hoodie" ||
    product.price !== 700 ||
    color !== "Charcoal"
  ) {
    alert("This product is not available for checkout yet.");
    return false;
  }

  const cart = getCart();

  const item = cart.find(entry =>
    entry.id === product.id &&
    (entry.color || "") === color &&
    (entry.size || "") === size
  );

  if (item) {
    if (item.qty >= 5) {
      alert("Maximum quantity is 5 per item.");
      return false;
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
  alert("Added to cart.");

  return true;
}

function renderCart() {
  const element = document.getElementById("cartItems");
  if (!element) return;

  const cart = getCart();

  // Keep the original index so each REMOVE button targets
  // the exact cart line, including its selected color and size.
  const lines = cart
    .map((item, index) => ({ item, index }))
    .filter(({ item }) =>
      getProduct(item.id) &&
      Number.isInteger(item.qty) &&
      item.qty > 0
    );

  if (!lines.length) {
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

  element.innerHTML = lines.map(({ item, index }) => {
    const product = getProduct(item.id);
    const hasPrice =
      Number.isFinite(product.price) && product.price > 0;

    if (hasPrice) {
      total += product.price * item.qty;
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
          <p>Color: ${item.color || "Not selected"}</p>
          <p>Size: ${item.size || "Not selected"}</p>
        </div>

        <div>Qty: ${item.qty}</div>

        <strong>
          ${hasPrice
            ? formatPrice(product.price * item.qty)
            : "Price coming soon"}
        </strong>

        <button type="button" data-remove-index="${index}">
          REMOVE
        </button>
      </div>
    `;
  }).join("");

  element.innerHTML += `
    <div class="cart-total">
      <span>TOTAL</span>
      <strong>
        ${hasUnpricedItems
          ? "Pending price confirmation"
          : formatPrice(total)}
      </strong>
    </div>

    <button class="btn" id="checkoutButton" type="button">
      CHECKOUT
    </button>
  `;

  element.querySelectorAll("[data-remove-index]").forEach(button => {
    button.addEventListener("click", () => {
      removeCartIndex(Number(button.dataset.removeIndex));
    });
  });

  document.getElementById("checkoutButton")
    ?.addEventListener("click", checkout);
}

function removeCartIndex(index) {
  const cart = getCart();

  if (!Number.isInteger(index) || index < 0 || index >= cart.length) {
    return;
  }

  cart.splice(index, 1);
  saveCart(cart);
  renderCart();
}

async function checkout() {
  const cart = getCart();

  if (!cart.length) {
    alert("Your cart is empty.");
    return;
  }

  // Validate every item before sending any order.
  for (const item of cart) {
    const product = getProduct(item.id);

    if (
      !product ||
      !Number.isInteger(item.qty) ||
      item.qty < 1 ||
      item.qty > 5
    ) {
      alert("Please review your cart and quantities.");
      return;
    }

    if (
      product.name !== "H/77 Essential Hoodie" ||
      product.price !== 700 ||
      item.color !== "Charcoal" ||
      !["M", "L", "XL", "2XL"].includes(item.size)
    ) {
      alert(
        "Only the H/77 Essential Hoodie in Charcoal, " +
        "priced at EGP 700, is currently available. " +
        "Please review your cart."
      );
      return;
    }
  }

  const customerName = prompt("Enter your full name:");
  if (customerName === null) return;

  const phone = prompt("Enter your phone number:");
  if (phone === null) return;

  const address = prompt("Enter your full delivery address:");
  if (address === null) return;

  if (
    customerName.trim().length < 2 ||
    phone.trim().length < 7 ||
    address.trim().length < 5
  ) {
    alert("Please enter a valid name, phone number and address.");
    return;
  }

  const button = document.getElementById("checkoutButton");
  if (button) {
    button.disabled = true;
    button.textContent = "PROCESSING...";
  }

  const submittedKeys = [];
  const orderIds = [];

  const cartKey = item =>
    `${item.id}|${item.color || ""}|${item.size || ""}`;

  try {
    for (const item of cart) {
      const product = getProduct(item.id);

      const response = await fetch("/api/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
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

      let result = null;

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
      submittedKeys.push(cartKey(item));
    }

    saveCart([]);
    renderCart();

    alert(
      `Order placed successfully!\n` +
      `Order ID(s): ${orderIds.join(", ")}\n\n` +
      "Our team will contact you to confirm delivery."
    );
  } catch (error) {
    // Remove confirmed lines only; preserve unconfirmed items.
    if (submittedKeys.length > 0) {
      const remaining = getCart().filter(item =>
        !submittedKeys.includes(cartKey(item))
      );

      saveCart(remaining);
      renderCart();
    }

    if (orderIds.length > 0) {
      alert(
        `Some orders were saved successfully.\n` +
        `Order ID(s): ${orderIds.join(", ")}\n\n` +
        "Check with us before resubmitting the remaining items.\n" +
        `Error: ${error.message}`
      );
    } else {
      alert(
        "We could not confirm your order. Your cart has been kept.\n\n" +
        error.message
      );
    }
  } finally {
    const currentButton = document.getElementById("checkoutButton");

    if (currentButton) {
      currentButton.disabled = false;
      currentButton.textContent = "CHECKOUT";
    }
  }
}

// Keep compatibility with any older page calling removeItem().
function removeItem(id, color = "", size = "") {
  const cart = getCart();

  const index = cart.findIndex(item =>
    item.id === Number(id) &&
    (item.color || "") === color &&
    (item.size || "") === size
  );

  if (index !== -1) {
    removeCartIndex(index);
  }
}

updateCount();
renderProducts("featuredProducts", 3);
renderProducts("shopProducts");
renderCart();

document.querySelectorAll(".menu-btn").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelector(".nav")?.classList.toggle("open");
  });
});
