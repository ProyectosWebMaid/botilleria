function getCurrentUser() {
  const stored = localStorage.getItem("botilleriaUser");
  return stored ? JSON.parse(stored) : null;
}

function protectPage(expectedRole) {
  const user = getCurrentUser();

  if (!user) {
    window.location.href = "../index.html";
    return null;
  }

  if (user.role !== expectedRole) {
    alert("No tienes acceso a esta página.");
    window.location.href = "../index.html";
    return null;
  }

  const welcomeText = document.getElementById("welcomeText");
  if (welcomeText) {
    welcomeText.textContent = `Bienvenido/a ${user.email} - Rol asignado: ${user.role}`;
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("botilleriaUser");
      window.location.href = "../index.html";
    });
  }

  return user;
}
