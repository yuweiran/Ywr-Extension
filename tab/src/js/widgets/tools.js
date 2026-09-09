(function () {
  if (typeof WidgetRegistry === "undefined") return;
  const FAVICON = "https://www.google.com/s2/favicons?domain=";

  const faviconOf = (url) => {
    let host = "";
    try {
      host = new URL(url).hostname;
    } catch (e) { /* ignore */ }
    return host ? FAVICON + host : "";
  };

  const render = (slot) => {
    $widgetStore.tools.list().then((items) => {
      slot.innerHTML = `
        <div class="widget-head">🧭 常用工具</div>
        <div class="tools-grid">
          ${items
            .map(
              (it, i) => `<a class="tools-item" href="${it.url}" target="_blank" rel="noopener" data-i="${i}">
                <img class="tools-icon" src="${faviconOf(it.url)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">
                <span class="tools-name">${it.name}</span>
              </a>`
            )
            .join("")}
        </div>`;
    });
  };

  WidgetRegistry.register({
    id: "tools",
    title: "工具组",
    icon: "🧭",
    zones: ["left"],
    render,
    refresh: render,
  });
})();
