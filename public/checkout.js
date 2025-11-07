document.addEventListener("DOMContentLoaded", () => {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const checkoutItems = document.getElementById("checkout-items");
  const checkoutTotal = document.getElementById("checkout-total");
  const checkoutForm = document.getElementById("checkoutForm");
  const paymentMethod = document.getElementById("paymentMethod");
  const gcashRefField = document.getElementById("gcashRefField");

  if (cart.length === 0) {
    checkoutItems.innerHTML = "<p>Your cart is empty.</p>";
    checkoutTotal.textContent = "Total: ₱0.00";
    return;
  }

  // Display items
  checkoutItems.innerHTML = cart.map(item => `
    <div class="checkout-item">
      <p>${item.name} x${item.qty}</p>
      <p>₱${(item.price * item.qty).toFixed(2)}</p>
    </div>
  `).join("");

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  checkoutTotal.textContent = `Total: ₱${total.toFixed(2)}`;

  // Toggle Gcash reference field
  paymentMethod.addEventListener("change", () => {
    gcashRefField.style.display = paymentMethod.value === "Gcash" ? "block" : "none";
  });

  // Submit order
  checkoutForm.addEventListener("submit", async e => {
    e.preventDefault();

    const Status = "Pending";
    const Dining_option = document.getElementById("diningOption").value;
    const Payment_method = paymentMethod.value;
    const Gcash_reference = document.getElementById("gcashRef").value.trim();
    const User_email = document.getElementById("email").value.trim();
    const User_phone_no = document.getElementById("phone").value.trim();
    const User_address = document.getElementById("address").value.trim();

    // Validate fields
    if (!Dining_option || !Payment_method || !User_email || !User_phone_no || !User_address) {
      return alert("⚠️ Please fill in all required fields.");
    }
    if (Payment_method === "Gcash" && !Gcash_reference) {
      return alert("⚠️ Please enter your Gcash reference number.");
    }

    // ✅ ProductID fetched from products table via cart
    const Product_id = cart.map(item => item.id).join(", ");
    const list_of_orders = cart.map(item => `${item.name} x${item.qty}`).join(", ");
    const Total_Price = total;
    const Amount_of_bill = total;
    const Receipt = JSON.stringify(cart);

    const orderData = {
      Status,
      Dining_option,
      Product_id, // 👈 contains ProductID from DB (e.g., "IC1, IC2, ...")
      list_of_orders,
      Total_Price,
      Amount_of_bill,
      Payment_method,
      Gcash_reference,
      User_email,
      User_phone_no,
      User_address,
      Receipt,
    };

    console.log("🧾 Sending order:", orderData);

    try {
      const res = await fetch("/api/neworder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to place order");

      alert("✅ Order placed successfully!");
      localStorage.removeItem("cart");
      window.location.href = "thankyou.html";
    } catch (err) {
      alert(`❌ ${err.message}`);
    }
  });
});
