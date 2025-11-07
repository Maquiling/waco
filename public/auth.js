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

      showLoginState(!!data.user, data.user?.name);
    } catch (err) {
      console.error("Session restore failed:", err);
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
