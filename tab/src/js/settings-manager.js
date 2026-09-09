/**
 * 设置管理器
 * 处理背景图片等设置功能
 */
const SettingsManager = (function () {
  const STORAGE_KEY = 'ywr-extension-settings';

  // 默认设置
  const defaultSettings = {
    backgroundImage: null, // base64 或 URL
    backgroundOpacity: 0.15, // 背景透明度 (0-1, 值越大背景越明显)
    backgroundBlur: 0, // 背景模糊度 (0-20px)
  };

  let settings = { ...defaultSettings };
  let panelEl = null;
  let overlayEl = null;
  let isScreensaverActive = false;
  let screensaverReady = false; // 防止进入屏保时立即被退出

  /**
   * 初始化
   */
  const init = () => {
    loadSettings();
    createSettingsPanel();
    createScreensaverLayer();
    bindEvents();
    applyBackground();
  };

  /**
   * 从 localStorage 加载设置
   */
  const loadSettings = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        settings = { ...defaultSettings, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
  };

  /**
   * 保存设置到 localStorage
   */
  const saveSettings = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  };

  /**
   * 创建设置面板 HTML
   */
  const createSettingsPanel = () => {
    // 遮罩层
    overlayEl = document.createElement('div');
    overlayEl.className = 'settings-overlay';
    overlayEl.id = 'settings-overlay';
    document.body.appendChild(overlayEl);

    // 设置面板
    panelEl = document.createElement('div');
    panelEl.className = 'settings-panel';
    panelEl.id = 'settings-panel';
    panelEl.innerHTML = `
    <div class="settings-panel-header">
      <span class="settings-panel-title">设置</span>
      <button class="settings-panel-close" id="settings-close">✕</button>
    </div>
    <div class="settings-tabs" role="tablist">
      <button class="settings-tab is-active" data-tab="appearance">外观</button>
      <button class="settings-tab" data-tab="layout">布局</button>
      <button class="settings-tab" data-tab="components">组件</button>
      <button class="settings-tab" data-tab="more">更多</button>
    </div>
    <div class="settings-panel-body">

      <!-- ============ 外观 ============ -->
      <div class="settings-tab-panel is-active" data-tab-panel="appearance">
        <div class="settings-section">
          <div class="settings-section-title">主题</div>
          <div class="settings-item">
            <div class="theme-picker-grid" id="theme-picker-grid"></div>
          </div>
        </div>

        <div class="settings-section">
          <div class="settings-section-title">壁纸</div>
          <div class="settings-item">
            <label class="settings-item-label">壁纸源</label>
            <div class="settings-item-desc">本地图片 / 渐变 / 在线图库，均可收藏</div>
            <div class="wallpaper-source-list" id="wallpaper-source-list"></div>
          </div>
          <div class="settings-item">
            <div class="settings-item-desc">或从本地上传新图片（JPG/PNG/WebP）</div>
            <div class="bg-upload-area" id="bg-upload-area">
              <div class="bg-upload-icon">🖼️</div>
              <div class="bg-upload-text">点击上传或拖拽图片</div>
              <img class="bg-upload-preview" id="bg-preview" alt="背景预览">
              <input type="file" class="bg-upload-input" id="bg-input" accept="image/*">
            </div>
            <div class="bg-controls">
              <button class="bg-control-btn" id="bg-online-btn">🎲 随机在线</button>
              <button class="bg-control-btn" id="bg-bing-btn">📷 Bing 今日</button>
              <button class="bg-control-btn" id="bg-change-btn">更换</button>
              <button class="bg-control-btn danger" id="bg-remove-btn">移除</button>
            </div>
          </div>
          <div class="settings-item">
            <label class="settings-item-label">背景透明度</label>
            <div class="slider-row">
              <input type="range" class="settings-slider" id="bg-opacity-slider" min="0" max="100" value="15">
              <span class="slider-value" id="bg-opacity-value">15%</span>
            </div>
          </div>
          <div class="settings-item">
            <label class="settings-item-label">背景模糊</label>
            <div class="slider-row">
              <input type="range" class="settings-slider" id="bg-blur-slider" min="0" max="20" value="0">
              <span class="slider-value" id="bg-blur-value">0px</span>
            </div>
          </div>
          <div class="settings-item">
            <label class="settings-item-label">每日自动换壁纸</label>
            <button class="settings-link-btn" id="bg-daily-btn">
              <span id="bg-daily-label">○ 已关闭</span>
              <span class="settings-link-arrow">→</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============ 布局 ============ -->
      <div class="settings-tab-panel" data-tab-panel="layout">
        <div class="settings-section">
          <div class="settings-section-title">小组件</div>
          <div id="widget-layout-list" class="widget-layout-list"></div>
        </div>
        <div class="settings-section">
          <div class="settings-section-title">侧栏</div>
          <div class="settings-item">
            <label class="settings-item-label">右侧 Tabs/History 栏</label>
            <button class="settings-link-btn" id="right-fold-btn">
              <span id="right-fold-label">显示</span>
              <span class="settings-link-arrow">→</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============ 组件 ============ -->
      <div class="settings-tab-panel" data-tab-panel="components">
        <div class="settings-section">
          <div class="settings-section-title">待办清单</div>
          <div class="settings-item">
            <button class="settings-link-btn" id="todo-clear-done-btn">
              <span>清除已完成</span>
              <span class="settings-link-arrow">→</span>
            </button>
          </div>
        </div>
        <div class="settings-section">
          <div class="settings-section-title">快捷工具</div>
          <div class="settings-item">
            <div class="settings-item-desc">管理常用工具入口</div>
            <div id="tools-edit-list"></div>
            <button class="settings-link-btn" id="tools-add-btn" style="margin-top:0.5rem">
              <span>＋ 添加工具</span>
              <span class="settings-link-arrow">→</span>
            </button>
          </div>
        </div>
        <div class="settings-section">
          <div class="settings-section-title">语录</div>
          <div class="settings-item">
            <button class="settings-link-btn" id="quote-next-btn">
              <span>换一条语录</span>
              <span class="settings-link-arrow">→</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============ 更多 ============ -->
      <div class="settings-tab-panel" data-tab-panel="more">
        <div class="settings-section">
          <div class="settings-section-title">屏保</div>
          <div class="settings-item">
            <button class="settings-link-btn" id="screensaver-btn">
              <span>🌙 进入屏保</span>
              <span class="settings-link-arrow">→</span>
            </button>
          </div>
        </div>
        <div class="settings-section">
          <div class="settings-section-title">扩展</div>
          <div class="settings-item">
            <button class="settings-link-btn" id="open-options-btn">
              <span>扩展选项</span>
              <span class="settings-link-arrow">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    `;
    document.body.appendChild(panelEl);
  };

  /**
   * 创建屏保层
   */
  const createScreensaverLayer = () => {
    const screensaverEl = document.createElement('div');
    screensaverEl.className = 'screensaver-layer';
    screensaverEl.id = 'screensaver-layer';
    screensaverEl.innerHTML = `
      <div class="screensaver-hint">
        <span>按任意键或移动鼠标退出屏保</span>
      </div>
    `;
    document.body.appendChild(screensaverEl);
  };

  const hasWallpaper = () =>
    new Promise((res) => {
      chrome.storage.local.get(["ywr-wallpaper"], (d) => {
        const cfg = d["ywr-wallpaper"];
        res(!!(cfg && cfg.current));
      });
    });

  /**
   * 进入屏保模式
   */
  const enterScreensaver = async () => {
    const ok = await hasWallpaper();
    if (!ok) { alert("请先设置背景图片"); return; }
    isScreensaverActive = true;
    screensaverReady = false; // 先设为 false，防止立即退出
    closePanel();
    
    const screensaverEl = document.getElementById('screensaver-layer');
    const contentArea = document.querySelector('.content-area');
    
    screensaverEl.classList.add('is-active');
    // 直接通过 JS 隐藏内容区域
    if (contentArea) {
      contentArea.style.setProperty('display', 'none', 'important');
      contentArea.style.setProperty('opacity', '0', 'important');
      contentArea.style.setProperty('visibility', 'hidden', 'important');
    }
    
    // 延迟 500ms 后才允许退出屏保（防止点击/移动事件立即触发退出）
    setTimeout(() => {
      screensaverReady = true;
    }, 500);
    
    // 3秒后隐藏提示
    setTimeout(() => {
      const hint = screensaverEl.querySelector('.screensaver-hint');
      if (hint && isScreensaverActive) {
        hint.classList.add('is-hidden');
      }
    }, 3000);
  };

  /**
   * 退出屏保模式
   */
  const exitScreensaver = () => {
    if (!isScreensaverActive) return;
    isScreensaverActive = false;
    screensaverReady = false;
    
    const screensaverEl = document.getElementById('screensaver-layer');
    const hint = screensaverEl.querySelector('.screensaver-hint');
    const contentArea = document.querySelector('.content-area');
    
    screensaverEl.classList.remove('is-active');
    hint.classList.remove('is-hidden');
    // 恢复内容区域显示
    if (contentArea) {
      contentArea.style.removeProperty('display');
      contentArea.style.removeProperty('opacity');
      contentArea.style.removeProperty('visibility');
    }
    
    // 恢复原来的背景透明度
    applyBackground();
  };

  /**
   * 应用背景设置
   */
  const applyBackground = () => {
    // 背景层与壁纸状态由 WallpaperManager 统一持有
    if (typeof WallpaperManager !== "undefined" && WallpaperManager.refresh) {
      WallpaperManager.refresh();
    }
  };

  /**
   * 绑定事件
   */
  const bindEvents = () => {
    // 打开设置面板
    const settingBtn = document.querySelector('.ipage-aside-setting');
    if (settingBtn) {
      settingBtn.addEventListener('click', openPanel);
    }

    // 关闭设置面板
    document.getElementById('settings-close').addEventListener('click', closePanel);
    overlayEl.addEventListener('click', closePanel);

    // [M3-4] 旧背景控件监听已移除；M4-2 在 Tab 化面板中对 bg-upload-area/bg-input/
    // bg-change-btn/bg-remove-btn/bg-opacity-slider/bg-blur-slider 重新绑定 WallpaperManager

    // 屏保模式按钮
    document.getElementById('screensaver-btn').addEventListener('click', () => {
      enterScreensaver();
    });

    // 扩展选项按钮
    document.getElementById('open-options-btn').addEventListener('click', () => {
      window.open('/options/index.html');
    });

    // ESC 关闭设置面板 或 退出屏保
    document.addEventListener('keydown', (e) => {
      if (isScreensaverActive && screensaverReady) {
        exitScreensaver();
        return;
      }
      if (e.key === 'Escape' && panelEl.classList.contains('is-visible')) {
        closePanel();
      }
    });

    // 点击退出屏保
    document.addEventListener('click', (e) => {
      if (isScreensaverActive && screensaverReady) {
        exitScreensaver();
      }
    });

    // 鼠标移动退出屏保（带延迟防抖）
    let mouseMoveTimer = null;
    document.addEventListener('mousemove', () => {
      if (isScreensaverActive && screensaverReady) {
        if (mouseMoveTimer) clearTimeout(mouseMoveTimer);
        mouseMoveTimer = setTimeout(() => {
          exitScreensaver();
        }, 100);
      }
    });


/* ================= M4-2：设置面板 Tab 化 ================= */

/* ---- 面板打开后刷新动态内容（第二个监听器，运行在 openPanel 之后） ---- */
const refreshDynamicPanels = () => {
  renderThemeGrid();
  renderSourceList();
  renderDailyLabel();
  renderWidgetLayout();
  renderRightFoldLabel();
  renderToolsEdit();
};
document.querySelector(".ipage-aside-setting") &&
  document.querySelector(".ipage-aside-setting").addEventListener("click", () => {
    setTimeout(refreshDynamicPanels, 0);
  });

/* ---- Tab 切换 ---- */
document.querySelectorAll(".settings-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".settings-tab").forEach((t) => t.classList.remove("is-active"));
    document.querySelectorAll(".settings-tab-panel").forEach((p) => p.classList.remove("is-active"));
    tab.classList.add("is-active");
    document.querySelector(`.settings-tab-panel[data-tab-panel="${tab.dataset.tab}"]`).classList.add("is-active");
  });
});

/* ---- 外观：主题网格 ---- */
const THEME_LIST = [
  { id: "slate-light", name: "石墨浅调" },
  { id: "midnight-ink", name: "深夜墨色" },
  { id: "coral-amber", name: "珊瑚金橙" },
  { id: "indigo-mint", name: "靛蓝薄荷" },
  { id: "violet-amber", name: "紫罗兰柠黄" },
  { id: "rose-sky", name: "玫红天蓝" },
];
const themeGrid = document.getElementById("theme-picker-grid");
const renderThemeGrid = () => {
  if (!themeGrid) return;
  const current = ThemeSwitcher.getTheme();
  themeGrid.innerHTML = THEME_LIST.map((t) => {
    const active = current === t.id ? " is-active" : "";
    return `<button class="theme-picker-item${active}" data-theme="${t.id}" title="${t.name}">
      <span class="theme-picker-swatch" data-theme="${t.id}"></span>
      <span class="theme-picker-name" data-theme="${t.id}">${t.name}</span>
    </button>`;
  }).join("");
};
themeGrid &&
  themeGrid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-theme]");
    if (!btn) return;
    ThemeSwitcher.setTheme(btn.dataset.theme);
    renderThemeGrid();
  });

/* ---- 外观：壁纸源列表 ---- */
const readWallpaperCfg = () =>
  new Promise((res) => chrome.storage.local.get(["ywr-wallpaper"], (d) => res(d["ywr-wallpaper"] || null)));
const sourceListEl = document.getElementById("wallpaper-source-list");
const renderSourceList = async () => {
  if (!sourceListEl) return;
  const cfg = await readWallpaperCfg();
  const sources = (cfg && cfg.library) || [];
  const favs = (cfg && cfg.favorites) || [];
  const curId = cfg && cfg.current ? cfg.current.id : null;
  if (sources.length === 0) {
    sourceListEl.innerHTML = '<div class="settings-item-desc">暂无壁纸，上传或生成一张吧</div>';
    return;
  }
  sourceListEl.innerHTML = sources
    .map((s) => {
      const active = s.id === curId ? " is-active" : "";
      const fav = favs.includes(s.id) ? "♥" : "♡";
      const label = s.type === "online" ? "🌐 " : s.type === "gradient" ? "🎨 " : "🖼️ ";
      return `<div class="wallpaper-source-item${active}" data-id="${s.id}">
        <span class="wallpaper-source-name">${label}${s.label || s.id}</span>
        <span class="wallpaper-source-actions">
          <button class="ws-btn ws-fav" data-id="${s.id}" title="收藏">${fav}</button>
          <button class="ws-btn ws-use" data-id="${s.id}" title="应用">✓</button>
          <button class="ws-btn ws-del" data-id="${s.id}" title="删除">✕</button>
        </span>
      </div>`;
    })
    .join("");
};
sourceListEl &&
  sourceListEl.addEventListener("click", async (e) => {
    const btn = e.target.closest(".ws-btn");
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.classList.contains("ws-use")) {
      await WallpaperManager.setCurrent(id);
    } else if (btn.classList.contains("ws-fav")) {
      await WallpaperManager.toggleFavorite(id);
    } else if (btn.classList.contains("ws-del")) {
      await WallpaperManager.removeSource(id);
    }
    await renderSourceList();
    renderDailyLabel();
  });

/* ---- 外观：每日轮换 ---- */
const renderDailyLabel = async () => {
  const cfg = await readWallpaperCfg();
  const daily = !!(cfg && cfg.daily);
  const label = document.getElementById("bg-daily-label");
  if (label) label.textContent = daily ? "● 已开启" : "○ 已关闭";
};
const dailyBtn = document.getElementById("bg-daily-btn");
dailyBtn &&
  dailyBtn.addEventListener("click", async () => {
    const cfg = await readWallpaperCfg();
    const next = !(cfg && cfg.daily);
    WallpaperManager.setDaily(next).then(renderDailyLabel);
  });

/* ---- 外观：在线壁纸 / 上传 / 滑块（委托 WallpaperManager） ---- */
const onlineBtn = document.getElementById("bg-online-btn");
const bingBtn = document.getElementById("bg-bing-btn");
const applyOnline = (kind) => {
  chrome.runtime.sendMessage({ type: "wallpaper:fetch", kind }, (res) => {
    if (chrome.runtime.lastError || !res || !res.success) {
      const detail = res && res.error ? res.error : chrome.runtime.lastError ? chrome.runtime.lastError.message : "unknown";
      $notify.error({ message: "获取在线壁纸失败：" + detail, duration: 4000 });
      return;
    }
    WallpaperManager.addOnline(res.url, kind).then(() => {
      renderSourceList();
      $notify.success({ message: "已应用在线壁纸", duration: 2000 });
    });
  });
};
onlineBtn && onlineBtn.addEventListener("click", () => applyOnline("picsum"));
bingBtn && bingBtn.addEventListener("click", () => applyOnline("bing"));

const fileInput2 = document.getElementById("bg-input");
const changeBtn = document.getElementById("bg-change-btn");
const removeBtn = document.getElementById("bg-remove-btn");
const uploadArea2 = document.getElementById("bg-upload-area");
changeBtn && changeBtn.addEventListener("click", (e) => { e.stopPropagation(); fileInput2 && fileInput2.click(); });
uploadArea2 &&
  uploadArea2.addEventListener("click", (e) => {
    if (e.target.closest(".bg-controls")) return;
    fileInput2 && fileInput2.click();
  });
fileInput2 &&
  fileInput2.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      WallpaperManager.uploadLocal(file)
        .then(() => { renderSourceList(); $notify.success({ message: "已添加壁纸", duration: 1500 }); })
        .catch((err) => $notify.error({ message: err.message, duration: 3000 }));
    }
  });
removeBtn &&
  removeBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    const cfg = await readWallpaperCfg();
    const id = cfg && cfg.current ? cfg.current.id : null;
    if (id) {
      await WallpaperManager.removeSource(id);
      renderSourceList();
    }
  });

const opacitySlider = document.getElementById("bg-opacity-slider");
const opacityValue = document.getElementById("bg-opacity-value");
const blurSlider = document.getElementById("bg-blur-slider");
const blurValue = document.getElementById("bg-blur-value");
let _viewTimer = null;
const queueView = (patch) => {
  if (_viewTimer) clearTimeout(_viewTimer);
  _viewTimer = setTimeout(() => WallpaperManager.setView(patch), 200);
};
const syncSliders = () => {
  const view = WallpaperManager.getView();
  if (opacitySlider) opacitySlider.value = Math.round(view.opacity * 100);
  if (opacityValue) opacityValue.textContent = Math.round(view.opacity * 100) + "%";
  if (blurSlider) blurSlider.value = view.blur;
  if (blurValue) blurValue.textContent = view.blur + "px";
};
opacitySlider && opacitySlider.addEventListener("input", (e) => {
  if (opacityValue) opacityValue.textContent = e.target.value + "%";
  queueView({ opacity: Number(e.target.value) / 100 });
});
blurSlider && blurSlider.addEventListener("input", (e) => {
  if (blurValue) blurValue.textContent = e.target.value + "px";
  queueView({ blur: Number(e.target.value) });
});
syncSliders();

/* ---- 布局：小组件开关+位置 ---- */
const renderWidgetLayout = () => {
  const list = document.getElementById("widget-layout-list");
  if (!list) return;
  const layout = WidgetRegistry.getLayout();
  const defs = [];
  WidgetRegistry.widgets.forEach((w, id) => defs.push({ id, ...w }));
  if (defs.length === 0) {
    list.innerHTML = '<div class="settings-item-desc">暂无小组件（M5 后出现）</div>';
    return;
  }
  const zoneLabels = { topbar: "顶栏", hero: "搜索区下", left: "左侧栏", off: "隐藏" };
  list.innerHTML = defs
    .map((d) => {
      const cfg = layout[d.id] || { zone: "off", enabled: false };
      const enabled = cfg.enabled !== false;
      const zones = (d.zones || ["off"])
        .map((z) => `<option value="${z}" ${cfg.zone === z ? "selected" : ""}>${zoneLabels[z] || z}</option>`)
        .join("");
      return `<div class="widget-layout-row" data-widget-id="${d.id}">
        <label class="widget-layout-name">${d.icon || ""} ${d.title}</label>
        <input type="checkbox" class="widget-toggle" data-id="${d.id}" ${enabled ? "checked" : ""}>
        <select class="widget-zone" data-id="${d.id}" ${enabled ? "" : "disabled"}>${zones}</select>
      </div>`;
    })
    .join("");
};
const layoutListEl = document.getElementById("widget-layout-list");
layoutListEl &&
  layoutListEl.addEventListener("change", (e) => {
    const id = e.target.dataset.id;
    if (!id) return;
    const layout = WidgetRegistry.getLayout();
    if (!layout[id]) layout[id] = { zone: "off", enabled: false };
    if (e.target.classList.contains("widget-toggle")) {
      layout[id].enabled = e.target.checked;
      if (e.target.checked) {
        // 重新打开：若 zone 仍是 off（关闭时被置 off），恢复默认 zone，否则无法渲染
        if (!layout[id].zone || layout[id].zone === "off") {
          const def = WidgetRegistry.widgets.get(id);
          layout[id].zone = def && def.zones && def.zones[0] ? def.zones[0] : "off";
        }
      } else {
        layout[id].zone = "off";
      }
      const row = e.target.closest(".widget-layout-row");
      const sel = row && row.querySelector(".widget-zone");
      if (sel) {
        sel.disabled = !e.target.checked;
        sel.value = layout[id].zone || "off";
      }
    } else if (e.target.classList.contains("widget-zone")) {
      layout[id].zone = e.target.value;
      layout[id].enabled = e.target.value !== "off";
      const row = e.target.closest(".widget-layout-row");
      const tog = row && row.querySelector(".widget-toggle");
      if (tog) tog.checked = layout[id].enabled;
    }
    WidgetRegistry.saveLayout(layout);
    WidgetRegistry.init(); // 全量重渲染（registry.renderAll 会先清除旧槽位）
  });

/* ---- 布局：右栏折叠 ---- */
const renderRightFoldLabel = () => {
  const label = document.getElementById("right-fold-label");
  if (label) label.textContent = $aside.asideRightArea.classList.contains("is-fold") ? "已折叠" : "显示";
};
const rightFoldBtn = document.getElementById("right-fold-btn");
rightFoldBtn &&
  rightFoldBtn.addEventListener("click", () => {
    $aside.handleFoldToggle();
    renderRightFoldLabel();
  });

/* ---- 组件：待办清完成 / 语录换一条 / 工具组 ---- */
const todoClearBtn = document.getElementById("todo-clear-done-btn");
todoClearBtn &&
  todoClearBtn.addEventListener("click", async () => {
    const t = $indexedDB && $indexedDB.$tables ? $indexedDB.$tables.todos : null;
    if (!t) return;
    const all = await t.list();
    for (const item of all) if (item.done === 1) await t.delete(item.id);
    WidgetRegistry.refresh("todo");
    $notify.success({ message: "已清除已完成项", duration: 1500 });
  });
const quoteNextBtn = document.getElementById("quote-next-btn");
quoteNextBtn &&
  quoteNextBtn.addEventListener("click", () => {
    // 推进主页语录到下一条（registry.invoke 会作用于已挂载的 quote 槽）
    const ran = WidgetRegistry.invoke("quote", "next");
    if (ran) $notify.success({ message: "已换一条", duration: 1200 });
  });

const renderToolsEdit = () => {
  const list = document.getElementById("tools-edit-list");
  if (!list || typeof $widgetStore === "undefined") return;
  $widgetStore.tools.list().then((items) => {
    list.innerHTML = items
      .map((it) => `<div class="tools-edit-row">${it.name}
        <button class="ws-btn ws-del" data-name="${it.name}">✕</button></div>`)
      .join("");
    list.querySelectorAll(".ws-del").forEach((b) =>
      b.addEventListener("click", () => {
        $widgetStore.tools.remove(b.dataset.name).then(() => {
          renderToolsEdit();
          WidgetRegistry.refresh("tools");
        });
      })
    );
  });
};
const toolsAddBtn = document.getElementById("tools-add-btn");
toolsAddBtn &&
  toolsAddBtn.addEventListener("click", () => {
    if (typeof $widgetStore === "undefined") return;
    const name = prompt("工具名称", "GitHub");
    const url = prompt("工具地址", "https://github.com");
    if (!name || !url) return;
    $widgetStore.tools.add({ name, url }).then(() => {
      renderToolsEdit();
      WidgetRegistry.refresh("tools");
    });
  });
  };

  /**
   * 打开设置面板
   */
  const openPanel = () => {
    panelEl.classList.add('is-visible');
    overlayEl.classList.add('is-visible');
  };

  /**
   * 关闭设置面板
   */
  const closePanel = () => {
    panelEl.classList.remove('is-visible');
    overlayEl.classList.remove('is-visible');
  };

  return {
    init,
    openPanel,
    closePanel,
  };
})();

// 页面加载后初始化
document.addEventListener('DOMContentLoaded', () => {
  SettingsManager.init();
});
