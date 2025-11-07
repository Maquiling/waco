// Load cart from sessionStorage
let cart = JSON.parse(sessionStorage.getItem("wacoCart") || "[]");

const checkoutItems = document.getElementById("checkout-items");
const checkoutTotal = document.getElementById("checkout-total");
const backToCartBtn = document.getElementById("backToCartBtn");
const confirmPurchaseBtn = document.getElementById("confirmPurchaseBtn");

// Display items in checkout
function renderCheckout() {
  if (!checkoutItems) return;
  checkoutItems.innerHTML = "";
  let total = 0;

  cart.forEach(item => {
    const div = document.createElement("div");
    div.style.display = "flex";
    div.style.justifyContent = "space-between";
    div.style.padding = "8px 0";
    div.innerHTML = `
      <span>${item.name} x${item.qty}</span>
      <span>₱${(item.price * item.qty).toFixed(2)}</span>
    `;
    checkoutItems.appendChild(div);
    total += item.price * item.qty;
  });

  checkoutTotal.textContent = `Total: ₱${total.toFixed(2)}`;
}

renderCheckout();

// Back to Cart button
if (backToCartBtn) {
  backToCartBtn.addEventListener("click", () => {
    window.location.href = "/index.html"; // back to main page
  });
}

// Confirm Purchase button
if (confirmPurchaseBtn) {
  confirmPurchaseBtn.addEventListener("click", () => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }
    // Here you can integrate your payment API or order submission
    alert("✅ Thank you for your purchase!");
    // Clear sessionStorage cart after purchase
    sessionStorage.removeItem("wacoCart");
    window.location.href = "/index.html"; // redirect to homepage
  });
}
