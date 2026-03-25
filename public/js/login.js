document.getElementById("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const notice = document.getElementById("loginNotice");
  notice.style.display = "none";

  const payload = {
    email: document.getElementById("email").value.trim(),
    password: document.getElementById("password").value.trim(),
    role: document.getElementById("role").value
  };

  try {
    const result = await api("/api/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    setSession(result.user);

    if (result.user.role === "Administrador") window.location.href = "./pages/admin.html";
    if (result.user.role === "Cajero") window.location.href = "./pages/cajero.html";
    if (result.user.role === "Supervisor") window.location.href = "./pages/supervisor.html";
    if (result.user.role === "Vendedor") window.location.href = "./pages/vendedor.html";
  } catch (error) {
    notice.textContent = error.message;
    notice.style.display = "block";
  }
});
