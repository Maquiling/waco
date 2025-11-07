// ======== WACO FRONTEND SCRIPT ========

// DOM ELEMENTS
const productGrid = document.getElementById("products");
const cartContainer = document.getElementById("cart-container");
const cartBtn = document.getElementById("cartBtn");
const checkoutBtn = document.getElementById("checkoutBtn");
const cartItems = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");
const closeCartBtn = document.getElementById("closeCart");
const clearCartBtn = document.getElementById("clearCart");

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const authModal = document.getElementById("authModal");
const closeModalBtn = document.querySelector(".modal .close");
const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

// Cart data
let cart = [];

// ======== INITIAL LOAD ========
window.addEventListener("DOMContentLoaded", () => {
  fetchProducts();
  updateCart();
  restoreSession();
});

// ======== FETCH PRODUCTS ========
async function fetchProducts() {
  try {
    const res = await fetch("/api/products");
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      productGrid.innerHTML = '<p class="error">No products available.</p>';
      return;
    }

    const categories = [...new Set(data.map(p => p.category))];
    displayCategories(categories, data);
    displayProducts(data);
  } catch (err) {
    console.error("Failed to fetch products:", err);
    productGrid.innerHTML = `<p class="error">⚠️ Failed to load products. Make sure the server is running.</p>`;
  }
}

// ======== DISPLAY CATEGORIES ========
function displayCategories(categories, products) {
  const container = document.getElementById("category-buttons");
  if (!container) return;
  container.innerHTML = "";

  const allBtn = document.createElement("button");
  allBtn.textContent = "All";
  allBtn.className = "btn-secondary active";
  allBtn.addEventListener("click", () => {
    document.querySelectorAll("#category-buttons button").forEach(b => b.classList.remove("active"));
    allBtn.classList.add("active");
    displayProducts(products);
  });
  container.appendChild(allBtn);

  categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.textContent = cat;
    btn.className = "btn-secondary";
    btn.addEventListener("click", () => {
      document.querySelectorAll("#category-buttons button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const filtered = products.filter(p => p.category === cat);
      displayProducts(filtered);
    });
    container.appendChild(btn);
  });
}

// ======== DISPLAY PRODUCTS ========
function displayProducts(products) {
  if (!productGrid) return;
  productGrid.innerHTML = "";

  products.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-img-container">
        <img src="${p.image || 'assets/placeholder.jpg'}" alt="${p.name}">
      </div>
      <h3>${p.name}</h3>
      <p>${p.description}</p>
      <p><strong>₱${parseFloat(p.price || 0).toFixed(2)}</strong></p>
      <button class="btn-secondary">Customize</button>
    `;
    card.querySelector("button").addEventListener("click", () => openCustomizeModal(p));
    productGrid.appendChild(card);
  });
}

// ======== PRODUCT CUSTOMIZATION MODAL ========

// Create modal HTML (appended once)
const customizeModal = document.createElement("div");
customizeModal.id = "customizeModal";
customizeModal.className = "modal";
customizeModal.innerHTML = `
  <div class="modal-content">
    <span class="close">&times;</span>
    <h2>Customize Drink</h2>

    <div class="custom-section">
      <label for="size">Size</label>
      <select id="size">
        <option value="Regular">Regular</option>
        <option value="Large">Large (+₱20)</option>
      </select>
    </div>

    <div class="custom-section">
      <label for="sugar">Sugar Level</label>
      <select id="sugar">
        <option value="0%">0%</option>
        <option value="25%">25%</option>
        <option value="50%">50%</option>
        <option value="75%">75%</option>
        <option value="100%" selected>100%</option>
      </select>
    </div>

    <div class="custom-section">
      <label for="addOns">Add-ons</label>
      <select id="addOns">
        <option value="None" selected>None</option>
        <option value="Pearls">Pearls (+₱10)</option>
        <option value="Cream Cheese">Cream Cheese (+₱15)</option>
      </select>
    </div>

    <button id="confirmAddBtn" class="btn-primary">Add to Cart</button>
  </div>
`;
document.body.appendChild(customizeModal);

const closeCustomizeBtn = customizeModal.querySelector(".close");
closeCustomizeBtn.addEventListener("click", () => (customizeModal.style.display = "none"));
window.addEventListener("click", e => {
  if (e.target === customizeModal) customizeModal.style.display = "none";
});

let selectedProduct = null;

function openCustomizeModal(product) {
  selectedProduct = product;
  customizeModal.querySelector("h2").textContent = `Customize ${product.name}`;
  customizeModal.style.display = "flex";
}

document.getElementById("confirmAddBtn").addEventListener("click", () => {
  if (!selectedProduct) return;

  const size = document.getElementById("size").value;
  const sugar = document.getElementById("sugar").value;
  const addOns = document.getElementById("addOns").value;

  let finalPrice = parseFloat(selectedProduct.price);
  if (size === "Large") finalPrice += 20;
  if (addOns === "Pearls") finalPrice += 10;
  if (addOns === "Cream Cheese") finalPrice += 15;

  addToCart(
    selectedProduct.id,
    `${selectedProduct.name} (${size}, ${sugar}, ${addOns})`,
    finalPrice
  );

  customizeModal.style.display = "none";
});

// ======== CART FUNCTIONS ========
function addToCart(id, name, price) {
  const existing = cart.find(i => i.id === id && i.name === name);
  if (existing) existing.qty++;
  else cart.push({ id, name, price, qty: 1 });
  updateCart();
  showCart();
}

function updateCart() {
  cartItems.innerHTML = "";
  let total = 0;
  cart.forEach((item, index) => {
    cartItems.innerHTML += `
      <li>${item.name} x${item.qty} - ₱${(item.price * item.qty).toFixed(2)}
      <button class="remove-btn" onclick="removeFromCart(${index})">✖</button></li>`;
    total += item.price * item.qty;
  });
  cartTotal.textContent = `Total: ₱${total.toFixed(2)}`;
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCart();
}

function showCart() {
  cartContainer.classList.add("show");
}

cartBtn.addEventListener("click", () => cartContainer.classList.toggle("show"));
closeCartBtn.addEventListener("click", () => cartContainer.classList.remove("show"));
clearCartBtn.addEventListener("click", () => {
  if (cart.length === 0) return alert("Cart is already empty!");
  if (confirm("Clear all items?")) {
    cart = [];
    updateCart();
  }
});
checkoutBtn.addEventListener("click", () => {
  if (cart.length === 0) return alert("Your cart is empty!");
  alert("✅ Thank you for your purchase!");
  cart = [];
  updateCart();
  cartContainer.classList.remove("show");
});

// ======== AUTH MODAL ========
loginBtn.addEventListener("click", () => {
  authModal.style.display = "flex";
  loginForm.classList.remove("hidden");
  signupForm.classList.add("hidden");
  loginTab.classList.add("active");
  signupTab.classList.remove("active");
});

closeModalBtn.addEventListener("click", () => (authModal.style.display = "none"));
window.addEventListener("click", e => {
  if (e.target === authModal) authModal.style.display = "none";
});

loginTab.addEventListener("click", () => {
  loginTab.classList.add("active");
  signupTab.classList.remove("active");
  loginForm.classList.remove("hidden");
  signupForm.classList.add("hidden");
});

signupTab.addEventListener("click", () => {
  signupTab.classList.add("active");
  loginTab.classList.remove("active");
  signupForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
});

// ======== LOGIN ========
loginForm.addEventListener("submit", async e => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    showWelcomeMessage(data.user.name);
    authModal.style.display = "none";
  } catch (err) {
    alert(`❌ ${err.message}`);
  }
});

// ======== SIGNUP ========
signupForm.addEventListener("submit", async e => {
  e.preventDefault();
  const name = document.getElementById("signupName").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;
  try {
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    alert("🎉 Account created successfully!");
    signupForm.reset();
    signupTab.classList.remove("active");
    loginTab.classList.add("active");
    signupForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
  } catch (err) {
    alert(`❌ ${err.message}`);
  }
});

// ======== SOCIAL LOGIN ========
document.getElementById("googleLoginBtn").addEventListener("click", () => {
  window.location.href = "/auth/google";
});

document.getElementById("facebookLoginBtn").addEventListener("click", () => {
  window.location.href = "/auth/facebook";
});

// ======== LOGOUT ========
logoutBtn.addEventListener("click", async () => {
  try {
    const res = await fetch("/api/logout", { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      loginBtn.classList.remove("hidden");
      logoutBtn.classList.add("hidden");
    } else {
      alert("❌ Logout failed");
    }
  } catch (err) {
    console.error("Logout failed:", err);
  }
});

// ======== HELPERS ========
function showWelcomeMessage(name) {
  loginBtn.classList.add("hidden");
  logoutBtn.classList.remove("hidden");
  logoutBtn.textContent = `Logout (${name})`;
}

// ======== AUTO SESSION RESTORE ========
async function restoreSession() {
  try {
    const res = await fetch("/api/session-user");
    const data = await res.json();
    if (data.user) showWelcomeMessage(data.user.name);
    else {
      loginBtn.classList.remove("hidden");
      logoutBtn.classList.add("hidden");
    }
  } catch (err) {
    console.error("Failed to restore session:", err);
  }
}
