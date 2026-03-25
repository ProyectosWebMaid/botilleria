const demoUsers = [
  {
    email: "admin@lacentral.cl",
    password: "123456",
    role: "Administrador",
    redirect: "./pages/admin.html",
  },
  {
    email: "cajero@lacentral.cl",
    password: "123456",
    role: "Cajero",
    redirect: "./pages/cajero.html",
  },
  {
    email: "supervisor@lacentral.cl",
    password: "123456",
    role: "Supervisor",
    redirect: "./pages/supervisor.html",
  },
];

document.getElementById("loginForm").addEventListener("submit", function (event) {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const role = document.getElementById("role").value;

  const user = demoUsers.find(
    (item) => item.email === email && item.password === password && item.role === role
  );

  if (!user) {
    alert("Credenciales o rol incorrecto.");
    return;
  }

  localStorage.setItem(
    "botilleriaUser",
    JSON.stringify({
      email: user.email,
      role: user.role,
    })
  );

  window.location.href = user.redirect;
});
