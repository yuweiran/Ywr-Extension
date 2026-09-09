(function () {
  if (typeof WidgetRegistry === "undefined") return;
  const ENGINES = [
    { id: "baidu", label: "百度", icon: "icon-baidu" },
    { id: "google", label: "Google", icon: "icon-google" },
    { id: "bing", label: "Bing", icon: "icon-bing" },
  ];

  const render = (slot) => {
    const current = localStorage.getItem("engine") || "baidu";
    slot.innerHTML = `<div class="engine-chips">
      ${ENGINES.map(
        (e) => `<button class="engine-chip${e.id === current ? " is-active" : ""}" data-engine="${e.id}">
          <span class="${e.icon}"></span>${e.label}</button>`
      ).join("")}
    </div>`;
    slot.querySelectorAll(".engine-chip").forEach((chip) =>
      chip.addEventListener("click", () => {
        if (typeof $searchEles !== "undefined" && $searchEles.setEngine) {
          $searchEles.setEngine(chip.dataset.engine);
        }
        render(slot);
        const input = document.getElementById("user-content");
        if (input) input.focus();
      })
    );
  };

  WidgetRegistry.register({
    id: "engines",
    title: "引擎",
    icon: "🔍",
    zones: ["hero"],
    render,
    refresh: render,
  });
})();
