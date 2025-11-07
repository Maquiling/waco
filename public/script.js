let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Load products from MySQL
async function loadProducts() {
  const container = document.getElementById("product-list");
  container.innerHTML = "<p>Loading menu...</p>";

  try {
    const res = await fetch("/api/products");
    const products = await res.json();

    if (!products.length) {
      container.innerHTML = "<p>No products available.</p>";
      return;
    }

    container.innerHTML = products
      .map(
        (p) => `
      <div class="product">
        <img src="${p.img}" alt="${p.name}" />
        <h3>${p.name}</h3>
        <p class="price">₱${p.price}</p>
        <button onclick="addToCart(${p.id}, '${p.name}', ${p.price})">Add to Cart</button>
      </div>`
      )
      .join("");
  } catch (error) {
    container.innerHTML = "<p>Failed to load products.</p>";
  }
}

// Cart logic
function addToCart(id, name, price) {
  const existing = cart.find((item) => item.id === id);
  if (existing) existing.qty++;
  else cart.push({ id, name, price, qty: 1 });
  saveCart();
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  renderCart();
}

function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  document.getElementById("cart-count").textContent = count;
}

function renderCart() {
  const cartItemsDiv = document.getElementById("cart-items");
  const totalDiv = document.getElementById("cart-total");

  if (!cart.length) {
    cartItemsDiv.innerHTML = "<p>Your cart is empty.</p>";
    totalDiv.textContent = "Total: ₱0.00";
    return;
  }

  cartItemsDiv.innerHTML = cart
    .map(
      (item) => `
      <div class="cart-item">
        <span>${item.name} x ${item.qty}</span>
        <span>₱${(item.price * item.qty).toFixed(2)}</span>
        <button onclick="removeItem(${item.id})">−</button>
      </div>`
    )
    .join("");

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  totalDiv.textContent = `Total: ₱${total.toFixed(2)}`;
}

function removeItem(id) {
  const index = cart.findIndex((i) => i.id === id);
  if (index !== -1) {
    cart[index].qty--;
    if (cart[index].qty <= 0) cart.splice(index, 1);
  }
  saveCart();
}

// Checkout modal logic
const modal = document.getElementById("checkout-modal");
const summary = document.getElementById("checkout-summary");
const checkoutBtn = document.getElementById("checkout-btn");
const confirmOrder = document.getElementById("confirm-order");
const cancelCheckout = document.getElementById("cancel-checkout");

checkoutBtn.addEventListener("click", () => {
  if (!cart.length) {
    alert("Your cart is empty!");
    return;
  }

  modal.classList.add("active");
  renderCheckoutSummary();
});

cancelCheckout.addEventListener("click", () => {
  modal.classList.remove("active");
});

confirmOrder.addEventListener("click", () => {
  alert("✅ Thank you! Your order has been placed.");
  cart = [];
  saveCart();
  modal.classList.remove("active");
});

function renderCheckoutSummary() {
  summary.innerHTML = cart
    .map(
      (item) =>
        `<p>${item.name} x ${item.qty} — ₱${(item.price * item.qty).toFixed(2)}</p>`
    )
    .join("");

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  summary.innerHTML += `<hr><p><strong>Total: ₱${total.toFixed(2)}</strong></p>`;
}

// Panel + Cart Controls
document.getElementById("clear-cart").addEventListener("click", () => {
  cart = [];
  saveCart();
});

const cartPanel = document.getElementById("cart-panel");
document.getElementById("cart-btn").addEventListener("click", (e) => {
  e.preventDefault();
  cartPanel.classList.toggle("open");
  renderCart();
});

document.getElementById("close-cart").addEventListener("click", () => {
  cartPanel.classList.remove("open");
});

document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  updateCartCount();
});
