/**
 * WidgetRegistry — 小组件注册表
 * declare 阶段：各 widget 模块调用 WidgetRegistry.register({...}) 注册 payload（不产生顶层全局）
 * execute 阶段：WidgetRegistry.init() 读取 localStorage['ywr-widget-layout'] 并按 zone 渲染
 */
const WidgetRegistry = (function () {
  const STORAGE_KEY = "ywr-widget-layout";
  const widgets = new Map(); // id -> { id, title, icon, zones, render, refresh? }

  const register = (def) => {
    if (!def || !def.id) return;
    widgets.set(def.id, def);
  };

  const getLayout = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn("WidgetRegistry: parse layout failed", e);
    }
    return {};
  };

  const saveLayout = (layout) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    } catch (e) {
      console.warn("WidgetRegistry: save layout failed", e);
    }
  };

  /**
   * 默认布局：所有组件开，位置按模块 zones[0]
   */
  const defaultLayout = () => {
    const layout = {};
    widgets.forEach((w, id) => {
      layout[id] = { zone: w.zones && w.zones[0] ? w.zones[0] : "off", enabled: true };
    });
    return layout;
  };

  const init = () => {
    let layout = getLayout();
    if (Object.keys(layout).length === 0) {
      layout = defaultLayout();
      saveLayout(layout);
    }
    renderAll(layout);
  };

  const renderAll = (layout) => {
    // 只清除真正的 widget 挂载槽（section.widget[data-widget-id]）。
    // 不能用裸 [data-widget-id]：设置面板布局行(.widget-layout-row[data-widget-id])
    // 也带该属性，会被误删导致面板组件列表消失
    document.querySelectorAll(".widget[data-widget-id]").forEach((el) => el.remove());
    widgets.forEach((w, id) => {
      const cfg = layout[id] || { zone: "off", enabled: false };
      const zoneName = cfg.enabled === false ? "off" : cfg.zone || "off";
      const mount = document.querySelector(`[data-widget-zone="${zoneName}"]`);
      if (zoneName === "off" || !mount) return;
      const slot = document.createElement("section");
      slot.className = "widget";
      slot.setAttribute("data-widget", id);
      slot.setAttribute("data-widget-id", id);
      mount.appendChild(slot);
      try {
        w.render(slot, { enabled: true });
      } catch (e) {
        console.error(`WidgetRegistry: render ${id} failed`, e);
      }
    });
  };

  const refresh = (id) => {
    const def = widgets.get(id);
    if (!def || !def.refresh) return;
    document.querySelectorAll(`.widget[data-widget-id="${id}"]`).forEach((slot) => {
      try {
        def.refresh(slot);
      } catch (e) {
        console.error(`WidgetRegistry: refresh ${id} failed`, e);
      }
    });
  };

  return {
    register,
    init,
    refresh,
    getLayout,
    saveLayout,
    get widgets() {
      return widgets;
    },
  };
})();
