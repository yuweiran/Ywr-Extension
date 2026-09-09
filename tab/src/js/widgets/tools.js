(function () {
  if (typeof WidgetRegistry === "undefined") return;

  // 取站点名首字符（去 www.），并依据主机名 hash 生成稳定的随机背景色
  const letterOf = (name, url) => {
    const raw = (name && name.trim()) || "";
    if (raw) return Array.from(raw)[0].toUpperCase();
    let host = "";
    try {
      host = new URL(url).hostname.replace(/^www\./, "");
    } catch (e) { /* ignore */ }
    return host ? Array.from(host)[0].toUpperCase() : "?";
  };

  const colorOf = (url) => {
    let s = url || "x";
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
    }
    const hue = hash % 360;
    const sat = 62 + (hash % 23); // 62%–84%
    const lig = 48 + (hash % 14); // 48%–61%
    return `hsl(${hue}, ${sat}%, ${lig}%)`;
  };

  const render = (slot) => {
    $widgetStore.tools.list().then((items) => {
      slot.innerHTML = `
        <div class="widget-head">🧭 常用工具</div>
        <div class="tools-grid">
          ${items
            .map(
              (it, i) => `<a class="tools-item" href="${it.url}" target="_blank" rel="noopener" data-i="${i}">
                <span class="tools-icon tools-letter" style="background:${colorOf(it.url)}">${letterOf(it.name, it.url)}</span>
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
