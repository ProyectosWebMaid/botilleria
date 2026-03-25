function setSession(user) {
  localStorage.setItem("botilleriaUser", JSON.stringify(user));
}
function getSession() {
  const raw = localStorage.getItem("botilleriaUser");
  return raw ? JSON.parse(raw) : null;
}
function clearSession() {
  localStorage.removeItem("botilleriaUser");
}
function requireRole(expectedRole) {
  const user = getSession();
  if (!user || user.role !== expectedRole) {
    window.location.href = "../index.html";
    return null;
  }
  const welcomeText = document.getElementById("welcomeText");
  if (welcomeText) welcomeText.textContent = `Bienvenido/a ${user.email} - Rol asignado: ${user.role}`;
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.onclick = () => {
    clearSession();
    window.location.href = "../index.html";
  };
  return user;
}
function money(value) {
  return "$" + Number(value || 0).toLocaleString("es-CL");
}
async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Error en la solicitud");
  return data;
}
