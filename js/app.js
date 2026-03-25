document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const role = document.getElementById("role").value;

    if (!email) {
      alert("Ingresa un correo para continuar.");
      return;
    }

    alert(`Bienvenido/a al sistema, ${email} (${role}).`);
    document.getElementById("dashboard").scrollIntoView({ behavior: "smooth" });
  });
});
