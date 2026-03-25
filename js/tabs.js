document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll(".tab-link");
  const panels = document.querySelectorAll(".tab-panel");
  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const target = link.dataset.tab;
      links.forEach((item) => item.classList.toggle("active", item.dataset.tab === target));
      panels.forEach((panel) => panel.classList.toggle("active", panel.id === target));
    });
  });
});
