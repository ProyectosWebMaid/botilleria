document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll(".tab-link");
  const panels = document.querySelectorAll(".tab-panel");

  if (!links.length || !panels.length) return;

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const tab = link.dataset.tab;

      links.forEach((item) => item.classList.remove("active"));
      panels.forEach((panel) => panel.classList.remove("active"));

      link.classList.add("active");
      const activePanel = document.getElementById(tab);
      if (activePanel) activePanel.classList.add("active");
    });
  });
});
