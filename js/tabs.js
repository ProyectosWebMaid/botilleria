document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll(".tab-link");
  const panels = document.querySelectorAll(".tab-panel");
  if (!links.length) return;

  function activateTab(tab) {
    links.forEach((item) => item.classList.toggle("active", item.dataset.tab === tab));
    panels.forEach((panel) => panel.classList.toggle("active", panel.id === tab));
  }

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      activateTab(link.dataset.tab);
    });
  });
});
