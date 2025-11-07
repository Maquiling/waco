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

// ===== AUTH SCRIPT =====
window.addEventListener("DOMContentLoaded", () => {
  const authModal = document.getElementById("authModal");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const closeModalBtn = document.getElementById("closeAuthModal");
  const googleBtn = document.getElementById("googleLoginBtn");
  const facebookBtn = document.getElementById("facebookLoginBtn");

  // ===== OPEN/CLOSE MODAL =====
  loginBtn.addEventListener("click", () => {
    authModal.style.display = "flex";
  });

  closeModalBtn.addEventListener("click", () => {
    authModal.style.display = "none";
  });

  window.addEventListener("click", e => {
    if (e.target === authModal) authModal.style.display = "none";
  });

  // ===== SOCIAL LOGIN =====
  googleBtn.addEventListener("click", () => {
    window.location.href = "/auth/google";
  });

  facebookBtn.addEventListener("click", () => {
    window.location.href = "/auth/facebook";
  });

  // ===== LOGOUT =====
  logoutBtn.addEventListener("click", async () => {
    try {
      localStorage.removeItem("User_email");
      const res = await fetch("/api/logout", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        showLoginState(false);
      } else {
        alert("❌ Logout failed");
      }
    } catch (err) {
      console.error("Logout failed:", err);
    }
  });

  // ===== SESSION RESTORE =====
  async function restoreSession() {
    try {
      const res = await fetch("/api/session-user");
      const data = await res.json();

      if (data.user) {
        saveUserEmail(data.user);
        showLoginState(true, data.user.name);
      } else {
        saveUserEmail(null);
        showLoginState(false);
      }
    } catch (err) {
      console.error("Session restore failed:", err);
    }
  }

  function saveUserEmail(user) {
    if (user?.email) {
      localStorage.setItem("User_email", user.email);
    } else {
      localStorage.removeItem("User_email");
    }
  }

  function showLoginState(isLoggedIn, name = "") {
    if (isLoggedIn) {
      loginBtn.classList.add("hidden");
      logoutBtn.classList.remove("hidden");
      logoutBtn.textContent = `Logout (${name})`;
    } else {
      loginBtn.classList.remove("hidden");
      logoutBtn.classList.add("hidden");
    }
  }

  restoreSession();
});

// ✅ Capture OAuth redirect email
const urlParams = new URLSearchParams(window.location.search);
const loginSuccess = urlParams.get("login");
const emailFromOAuth = urlParams.get("email");

if (loginSuccess === "success" && emailFromOAuth) {
  localStorage.setItem("User_email", emailFromOAuth);
  window.history.replaceState({}, document.title, "/"); // remove query params
}

// ===== CART DATA =====
let cart = [];

// ======== FETCH PRODUCTS ========
fetch("/api/products")
  .then(res => res.json())
  .then(products => {
    displayProductsByCategory(products);
  });

// Convert Product_Content into selectable size/price options
function parseProductContent(content) {
  const lines = content.split("\n").map(l => l.trim());
  const variations = [];

  lines.forEach(line => {
    const match = line.match(/(\d+oz):\s*₱\s*(\d+(\.\d+)?)/i);
    if (match) {
      variations.push({
        size: match[1],
        price: parseFloat(match[2])
      });
    }
  });

  return variations;
}

// ===== MY ORDERS MODAL SCRIPT =====
const myOrdersBtn = document.getElementById("myOrdersBtn");
const myOrdersModal = document.getElementById("myOrdersModal");
const closeBtn = myOrdersModal.querySelector(".close-btn");
const ordersContainer = document.getElementById("ordersContainer");

myOrdersBtn.addEventListener("click", async () => {
  myOrdersModal.style.display = "flex";
  ordersContainer.innerHTML = `<p class="loading">Loading your orders...</p>`;

  try {
    const userEmail = localStorage.getItem("User_email");

    if (!userEmail) {
      ordersContainer.innerHTML = `<p>Please log in to view your orders.</p>`;
      return;
    }

    const res = await fetch(`/api/orders?email=${encodeURIComponent(userEmail)}`);
    const data = await res.json();

    if (!data || data.length === 0) {
      ordersContainer.innerHTML = `<p>No ongoing orders found.</p>`;
      return;
    }

    ordersContainer.innerHTML = data
      .map(order => `
        <div class="order-card">
          <h4>Order #${order.Order_id}</h4>
          <p><strong>Status:</strong> ${order.Status}</p>
          <p><strong>Dining Option:</strong> ${order.Dining_option}</p>
          <p><strong>Payment Method:</strong> ${order.Payment_method}</p>
          <p><strong>Total:</strong> ₱${Number(order.Total_Price).toFixed(2)}</p>
          <p><strong>Items:</strong> ${order.list_of_orders}</p>
          <p><strong>Ordered At:</strong> ${new Date(order.Ordered_at).toLocaleString()}</p>
        </div>
      `)
      .join("");
  } catch (err) {
    console.error("Error fetching orders:", err);
    ordersContainer.innerHTML = `<p>Failed to load your orders. Please try again later.</p>`;
  }
});

// Close modal
closeBtn.addEventListener("click", () => {
  myOrdersModal.style.display = "none";
});
window.addEventListener("click", e => {
  if (e.target === myOrdersModal) myOrdersModal.style.display = "none";
});

// ======== CATEGORY DETECTION ========
function getCategoryFromContent(content) {
  content = content.toUpperCase();

  if (content.startsWith("ICED COFFEE")) return "Iced Coffee";
  if (content.startsWith("MILKTEA")) return "Milktea";
  if (content.startsWith("FRUIT YOGURT")) return "Fruit Yogurt";
  if (content.startsWith("FRUIT SODA")) return "Fruit Soda";
  if (content.startsWith("WAFFLE")) return "Waffles";
  if (content.startsWith("BURGER")) return "Waffles";

  return "Others";
}

// ======== DISPLAY PRODUCTS ========
function displayProductsByCategory(products) {
  if (!productGrid) return;
  productGrid.innerHTML = "";

  const categories = {};

  products.forEach(p => {
    const category = getCategoryFromContent(p.Product_Content);
    if (!categories[category]) categories[category] = [];
    categories[category].push(p);
  });

  Object.keys(categories).forEach(category => {
    const section = document.createElement("div");
    section.className = "category-section";

    section.innerHTML = `<h3 class="category-title">${category}</h3>`;

    const productList = document.createElement("div");
    productList.className = "product-list";

    categories[category].forEach(p => {
      const isWaffle = category === "Waffles";
      productList.innerHTML += `
        <div class="product-card">
          <img src="${p.Product_image.replace(/\\\\/g, '/').replace(/C:/, '')}" alt="${p.Product_Name}">
          <h4>${p.Product_Name}</h4>
          <p>${p.Product_Content.replace(/\n/g, "<br>")}</p>
          <button class="btn-secondary" onclick='${isWaffle
            ? `addToCart("${p.ProductID}", "${p.Product_Name}", ${p.price}, "${p.Product_image.replace(/\\\\/g, '/').replace(/C:/, '')}")` 
            : `openCustomizeModal(${JSON.stringify(p).replace(/"/g, '&quot;')})`
          }'>
            ${isWaffle ? "Add to Cart" : "Customize"}
          </button>
        </div>
      `;
    });

    section.appendChild(productList);
    productGrid.appendChild(section);
  });
}

// ======== CUSTOMIZE MODAL ========
const customizeModal = document.createElement("div");
customizeModal.id = "customizeModal";
customizeModal.className = "customize-modal";
customizeModal.innerHTML = `
  <div class="customize-modal-content">
    <span class="customize-close-icon">&times;</span>
    <img id="modal-image" class="customize-modal-image" src="assets/placeholder.jpg" alt="Product">
    <h2 class="customize-modal-title">Customize Drink</h2>
    <div class="customize-options"></div>
    <p class="customize-price">Price: <strong>₱0.00</strong></p>
    <button class="customize-add-btn">Add to Cart</button>
    <button class="customize-close-btn">Cancel</button>
  </div>
`;
document.body.appendChild(customizeModal);

const modalImage = customizeModal.querySelector("#modal-image");
const modalTitle = customizeModal.querySelector(".customize-modal-title");
const modalOptions = customizeModal.querySelector(".customize-options");
const modalPrice = customizeModal.querySelector(".customize-price strong");
const closeIcon = customizeModal.querySelector(".customize-close-icon");
const addBtn = customizeModal.querySelector(".customize-add-btn");
const cancelBtn = customizeModal.querySelector(".customize-close-btn");

let selectedProduct = null;
let selectedVariation = null;

function openCustomizeModal(product) {
  const isDrink =
    product.Product_Content.toUpperCase().includes("ICED") ||
    product.Product_Content.toUpperCase().includes("MILKTEA") ||
    product.Product_Content.toUpperCase().includes("YOGURT") ||
    product.Product_Content.toUpperCase().includes("SODA");

  if (!isDrink) {
    alert("⚠️ Only drinks can be customized.");
    return;
  }

  selectedProduct = product;
  selectedVariation = null;

  const variations = parseProductContent(product.Product_Content).filter(v =>
    ["16OZ", "22OZ", "12OZ", "18OZ"].includes(v.size.toUpperCase())
  );

  if (variations.length === 0) {
    alert("⚠️ No available 16oz or 22oz sizes for this drink.");
    return;
  }

  modalTitle.textContent = `Customize ${product.Product_Name}`;
  modalImage.src = product.Product_image
    ? product.Product_image.replace(/\\\\/g, "/").replace(/C:/, "")
    : "assets/placeholder.jpg";
  modalOptions.innerHTML = "";

  variations.forEach((v, index) => {
    const opt = document.createElement("label");
    opt.className = "customize-option";
    opt.innerHTML = `
      <input type="radio" name="drinkSize" value="${v.size}" data-price="${v.price}" ${index === 0 ? "checked" : ""}>
      <span>${v.size} - ₱${v.price.toFixed(2)}</span>
    `;
    modalOptions.appendChild(opt);
  });

  selectedVariation = variations[0];
  modalPrice.textContent = `₱${selectedVariation.price.toFixed(2)}`;
  customizeModal.classList.add("show");
}

function closeCustomizeModal() {
  customizeModal.classList.remove("show");
}
closeIcon.addEventListener("click", closeCustomizeModal);
cancelBtn.addEventListener("click", closeCustomizeModal);
window.addEventListener("click", e => {
  if (e.target === customizeModal) closeCustomizeModal();
});

modalOptions.addEventListener("change", e => {
  if (e.target.name === "drinkSize") {
    const price = parseFloat(e.target.dataset.price);
    const size = e.target.value;
    selectedVariation = { size, price };
    modalPrice.textContent = `₱${price.toFixed(2)}`;
  }
});

addBtn.addEventListener("click", () => {
  if (!selectedProduct || !selectedVariation) return;
  const name = `${selectedProduct.Product_Name} (${selectedVariation.size})`;
  addToCart(selectedProduct.Product_No, name, selectedVariation.price);
  closeCustomizeModal();
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

checkoutBtn.addEventListener("click", async () => {
  try {
    const res = await fetch("/api/session-user");
    const data = await res.json();

    if (!data.user) {
      return alert("Please login first!");
    }

    if (cart.length === 0) {
      return alert("Your cart is empty!");
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    window.location.href = "checkout.html";
  } catch (err) {
    console.error("Error checking session:", err);
    alert("Unable to verify login. Please try again.");
  }
});
