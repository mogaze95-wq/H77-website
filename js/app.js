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
    entry.color === color &&
    entry.size === size
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
