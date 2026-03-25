document.getElementById("loginForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const notice = document.getElementById("loginNotice");
  notice.style.display = "none";

  const data = loadData();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const role = document.getElementById("role").value;

  const user = data.users.find(item => item.email === email && item.password === password && item.role === role);
  if (!user) {
    notice.textContent = "Credenciales incorrectas.";
    notice.style.display = "block";
    return;
  }

  setSession({ id: user.id, email: user.email, role: user.role, name: user.name });

  if (role === "Administrador") window.location.href = "./pages/admin.html";
  if (role === "Cajero") window.location.href = "./pages/cajero.html";
  if (role === "Supervisor") window.location.href = "./pages/supervisor.html";
  if (role === "Vendedor") window.location.href = "./pages/vendedor.html";
});
