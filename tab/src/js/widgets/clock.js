(function () {
  if (typeof WidgetRegistry === "undefined") return;

  const greeting = (h) =>
    h < 5 ? "夜深了" : h < 9 ? "早上好" : h < 12 ? "上午好" : h < 14 ? "中午好" : h < 18 ? "下午好" : h < 23 ? "晚上好" : "夜深了";

  const paint = (slot) => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const week = ["日", "一", "二", "三", "四", "五", "六"][now.getDay()];
    slot.innerHTML = `
      <div class="clock-greeting">${greeting(now.getHours())}</div>
      <div class="clock-time">${hh}:${mm}</div>
      <div class="clock-date">${now.getMonth() + 1}月${now.getDate()}日 周${week}</div>`;
  };

  const render = (slot) => {
    paint(slot);
    // 每 30s 刷新一次；用 slot 上标记保证 interval 只启动一次
    if (!slot.__clockTimer) {
      slot.__clockTimer = setInterval(() => paint(slot), 30000);
    }
  };

  WidgetRegistry.register({
    id: "clock",
    title: "时钟",
    icon: "🕐",
    zones: ["topbar", "hero"],
    render,
  });
})();
