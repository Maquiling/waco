async function loadUserOrders() {
  try {
    const response = await fetch("/api/orders");
    if (!response.ok) throw new Error("Unauthorized or failed to load orders");
    const orders = await response.json();

    const list = document.getElementById("orders-list");
    list.innerHTML = "";

    if (orders.length === 0) {
      list.innerHTML = "<p>You have no orders yet.</p>";
      return;
    }

    orders.forEach(order => {
      const div = document.createElement("div");
      div.className = "order-item";

      // Safely handle list_of_orders (may be stringified JSON or plain text)
      let orderItems = [];
      try {
        orderItems = JSON.parse(order.list_of_orders);
      } catch {
        orderItems = order.list_of_orders?.split("\n") || [];
      }

      const detailsHTML = orderItems
        .map(item => `<li>${item}</li>`)
        .join("");

      div.innerHTML = `
        <div class="order-header">
          <h4>Order #${order.id}</h4>
          <button class="toggle-details">View Items ▼</button>
        </div>
        <div class="order-info">
          <p><strong>Status:</strong> ${order.Status}</p>
          <p><strong>Total:</strong> ₱${order.Total_Price}</p>
          <p><strong>Payment:</strong> ${order.Payment_method}</p>
          <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
        </div>
        <div class="order-details">
          <h5>Items Ordered:</h5>
          <ul>${detailsHTML}</ul>
        </div>
      `;

      // Add toggle function
      const toggleBtn = div.querySelector(".toggle-details");
      const detailsBox = div.querySelector(".order-details");
      toggleBtn.addEventListener("click", () => {
        const show = detailsBox.classList.toggle("show");
        toggleBtn.textContent = show ? "Hide Items ▲" : "View Items ▼";
      });

      list.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    document.getElementById("orders-list").innerHTML =
      "<p>Error loading orders. Please log in again.</p>";
  }
}

document.addEventListener("DOMContentLoaded", loadUserOrders);
