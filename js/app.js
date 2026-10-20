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

  const products = limit ? PRODUCTS.slice(0, limit) : PRODUCTS;
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

  if (!(product.colors || []).includes(color)) {
    alert("Please select an available color.");
    return false;
  }

  if (!["M", "L", "XL", "2XL"].includes(size)) {
    alert("Please select a valid size.");
    return false;
  }

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

  const rows = lines.map(({ item, index }) => {
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

  element.innerHTML = `
    ${rows}

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

    <section id="checkoutFormWrap" hidden>
      <div class="page-title">
        <p class="eyebrow">ALMOST YOURS</p>
        <h2>DELIVERY DETAILS</h2>
        <p>Enter your details to place your order.</p>
      </div>

      <form id="checkoutForm">
        <div class="form-field">
          <label for="customerName">Full Name</label>
          <input
            id="customerName"
            name="customer_name"
            type="text"
            placeholder="Enter your full name"
            minlength="2"
            maxlength="100"
            autocomplete="name"
            required
          >
        </div>

        <div class="form-field">
          <label for="customerPhone">Mobile Number</label>
          <input
            id="customerPhone"
            name="phone"
            type="tel"
            placeholder="Enter your mobile number"
            minlength="7"
            maxlength="25"
            autocomplete="tel"
            inputmode="tel"
            required
          >
        </div>

        <div class="form-field">
          <label for="customerAddress">Delivery Address</label>
          <textarea
            id="customerAddress"
            name="address"
            placeholder="Governorate, area, street, building and apartment"
            minlength="5"
            maxlength="500"
            autocomplete="street-address"
            rows="4"
            required
          ></textarea>
        </div>

        <p id="checkoutMessage" role="status" aria-live="polite"></p>

        <button class="btn" id="placeOrderButton" type="submit">
          PLACE ORDER
        </button>
      </form>
    </section>
  `;

  element.querySelectorAll("[data-remove-index]").forEach(button => {
    button.addEventListener("click", () => {
      removeCartIndex(Number(button.dataset.removeIndex));
    });
  });

  const checkoutButton = document.getElementById("checkoutButton");
  const formWrap = document.getElementById("checkoutFormWrap");
  const form = document.getElementById("checkoutForm");

  checkoutButton.addEventListener("click", () => {
    // Do not let customers submit products without confirmed prices.
    if (hasUnpricedItems) {
      alert("Please remove products whose prices are not available yet.");
      return;
    }

    formWrap.hidden = !formWrap.hidden;
    checkoutButton.textContent = formWrap.hidden
      ? "CHECKOUT"
      : "CLOSE FORM";

    if (!formWrap.hidden) {
      formWrap.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  form.addEventListener("submit", checkout);
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

async function checkout(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const message = document.getElementById("checkoutMessage");
  const button = document.getElementById("placeOrderButton");

  const customerName = form.elements.customer_name.value.trim();
  const phone = form.elements.phone.value.trim();
  const address = form.elements.address.value.trim();
  const cart = getCart();

  if (!cart.length) {
    message.textContent = "Your cart is empty.";
    return;
  }

  if (
    customerName.length < 2 ||
    phone.length < 7 ||
    address.length < 5
  ) {
    message.textContent = "Please check your name, phone and address.";
    return;
  }

  // Only the currently approved product can be ordered.
  for (const item of cart) {
    const product = getProduct(item.id);

    if (
      !product ||
      !Number.isInteger(item.qty) ||
      item.qty < 1 ||
      item.qty > 5 ||
      product.name !== "H/77 Essential Hoodie" ||
      product.price !== 700 ||
      item.color !== "Charcoal" ||
      !["M", "L", "XL", "2XL"].includes(item.size)
    ) {
      message.textContent =
        "Please review your cart. Only the Charcoal Essential Hoodie " +
        "priced at EGP 700 is currently available.";
      return;
    }
  }

  button.disabled = true;
  button.textContent = "PROCESSING...";
  message.textContent = "Submitting your order...";

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
          customer_name: customerName,
          phone,
          address,
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
      "Your order has been submitted successfully!\n" +
      `Order ID(s): ${orderIds.join(", ")}\n\n` +
      "Our team will contact you to confirm delivery."
    );
  } catch (error) {
    if (submittedKeys.length > 0) {
      const remaining = getCart().filter(item =>
        !submittedKeys.includes(cartKey(item))
      );

      saveCart(remaining);
      renderCart();
    }

    if (orderIds.length > 0) {
      alert(
        "Some items were saved as orders.\n" +
        `Order ID(s): ${orderIds.join(", ")}\n\n` +
        "Please check with us before submitting again."
      );
    } else {
      message.textContent =
        "We couldn't confirm your order. Your cart has been kept. " +
        error.message;
    }
  } finally {
    const currentButton = document.getElementById("placeOrderButton");

    if (currentButton) {
      currentButton.disabled = false;
      currentButton.textContent = "PLACE ORDER";
    }
  }
}

// Compatibility with older pages that may use this function.
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
