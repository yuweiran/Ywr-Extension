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
            <label class="settings-item-label">当前壁纸</label>
            <div class="current-wallpaper-info" id="current-wallpaper-info">无（纯主题色）</div>
          </div>

          <div class="settings-item">
            <div class="settings-item-desc">本地图片 / 在线图库 / 随机渐变 —— 应用即设为当前壁纸，不产生记录</div>
            <div class="bg-upload-area" id="bg-upload-area">
              <div class="bg-upload-icon">🖼️</div>
              <div class="bg-upload-text">点击上传或拖拽本地图片</div>
              <img class="bg-upload-preview" id="bg-preview" alt="背景预览">
              <input type="file" class="bg-upload-input" id="bg-input" accept="image/*">
            </div>
            <div class="bg-controls">
              <button class="bg-control-btn" id="bg-gradient-btn">🎨 随机渐变</button>
              <button class="bg-control-btn" id="bg-online-btn">🎲 随机在线</button>
              <button class="bg-control-btn" id="bg-bing-btn">📷 Bing 今日</button>
              <button class="bg-control-btn danger" id="bg-remove-btn">移除</button>
            </div>
          </div>

          <div class="settings-item">
            <button class="settings-link-btn" id="bg-fav-current-btn">
              <span id="bg-fav-current-label">♥ 收藏当前壁纸</span>
              <span class="settings-link-arrow">→</span>
            </button>
          </div>

          <div class="settings-item">
            <label class="settings-item-label">我的收藏</label>
            <div class="settings-item-desc">仅收藏过才会出现在这里</div>
            <div class="wallpaper-source-list" id="favorites-list"></div>
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
            <label class="settings-item-label">收藏区透明度</label>
            <div class="settings-item-desc">每组收藏集合面板(容器)的透出程度（仅壁纸存在时生效，链接卡片保持清晰）</div>
            <div class="slider-row">
              <input type="range" class="settings-slider" id="panel-opacity-slider" min="0" max="100" value="50">
              <span class="slider-value" id="panel-opacity-value">50%</span>
            </div>
          </div>
          <div class="settings-item">
            <label class="settings-item-label">收藏区模糊</label>
            <div class="settings-item-desc">玻璃感强度，越大壁纸透出越柔和</div>
            <div class="slider-row">
              <input type="range" class="settings-slider" id="panel-blur-slider" min="0" max="30" value="0">
              <span class="slider-value" id="panel-blur-value">0px</span>
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

    // 背景控件（上传/随机渐变/在线/收藏/滑块）绑定见下方 M4-2 外观 Tab 区块

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
  renderCurrentInfo();
  renderFavorites();
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

/* ---- 外观：当前壁纸信息 ---- */
const currentInfoEl = document.getElementById("current-wallpaper-info");
const favCurrentBtn = document.getElementById("bg-fav-current-btn");
const favCurrentLabel = document.getElementById("bg-fav-current-label");

const renderCurrentInfo = () => {
  const info = WallpaperManager.getCurrentInfo();
  if (!info) {
    if (currentInfoEl) currentInfoEl.textContent = "无（纯主题色）";
  } else {
    if (currentInfoEl) currentInfoEl.textContent = info.icon + (info.label || info.kind);
  }
  if (favCurrentBtn) {
    const isFav = WallpaperManager.isCurrentFavorite();
    favCurrentBtn.classList.toggle("is-faved", isFav);
    if (favCurrentLabel) favCurrentLabel.textContent = isFav ? "♥ 已在收藏中" : "♥ 收藏当前壁纸";
  }
};

favCurrentBtn &&
  favCurrentBtn.addEventListener("click", async () => {
    if (WallpaperManager.isCurrentFavorite()) {
      $notify.info && $notify.info();
      return;
    }
    const added = await WallpaperManager.favoriteCurrent();
    if (added) {
      renderFavorites();
      renderCurrentInfo();
      $notify.success({ message: "已收藏当前壁纸", duration: 1500 });
    } else {
      $notify.warning({ message: "当前没有可收藏的壁纸", duration: 2000 });
    }
  });

/* ---- 外观：我的收藏 ---- */
const favoritesListEl = document.getElementById("favorites-list");
const renderFavorites = async () => {
  if (!favoritesListEl) return;
  const favs = WallpaperManager.listFavorites();
  if (!favs || favs.length === 0) {
    favoritesListEl.innerHTML = '<div class="settings-item-desc">暂无收藏——应用壁纸后点「♥ 收藏当前壁纸」</div>';
    return;
  }
  favoritesListEl.innerHTML = favs
    .map((f) => {
      const icon = f.kind === "online" ? "🌐 " : f.kind === "gradient" ? "🎨 " : "🖼️ ";
      return `<div class="wallpaper-source-item" data-fid="${f.fid}">
        <span class="wallpaper-source-name">${icon}${f.label || f.fid}</span>
        <span class="wallpaper-source-actions">
          <button class="ws-btn ws-use" data-fid="${f.fid}" title="应用">✓</button>
          <button class="ws-btn ws-del" data-fid="${f.fid}" title="取消收藏">✕</button>
        </span>
      </div>`;
    })
    .join("");
};
favoritesListEl &&
  favoritesListEl.addEventListener("click", async (e) => {
    const btn = e.target.closest(".ws-btn");
    if (!btn) return;
    const fid = btn.dataset.fid;
    if (!fid) return;
    if (btn.classList.contains("ws-use")) {
      await WallpaperManager.applyFavorite(fid);
      $notify.success({ message: "已应用收藏壁纸", duration: 1500 });
    } else if (btn.classList.contains("ws-del")) {
      await WallpaperManager.removeFavorite(fid);
      $notify.success({ message: "已取消收藏", duration: 1200 });
    }
    await renderFavorites();
    renderCurrentInfo();
    renderDailyLabel();
  });

/* ---- 外观：每日轮换 ---- */
const renderDailyLabel = () => {
  const daily = WallpaperManager.daily === true;
  const label = document.getElementById("bg-daily-label");
  if (label) label.textContent = daily ? "● 已开启" : "○ 已关闭";
};
const dailyBtn = document.getElementById("bg-daily-btn");
dailyBtn &&
  dailyBtn.addEventListener("click", async () => {
    const next = !(WallpaperManager.daily === true);
    WallpaperManager.setDaily(next).then(renderDailyLabel);
  });

/* ---- 外观：在线壁纸 / 随机渐变 / 上传 / 移除（委托 WallpaperManager） ---- */
const onlineBtn = document.getElementById("bg-online-btn");
const bingBtn = document.getElementById("bg-bing-btn");
const gradientBtn = document.getElementById("bg-gradient-btn");
const applyOnline = (kind) => {
  chrome.runtime.sendMessage({ type: "wallpaper:fetch", kind }, (res) => {
    if (chrome.runtime.lastError || !res || !res.success) {
      const detail = res && res.error ? res.error : chrome.runtime.lastError ? chrome.runtime.lastError.message : "unknown";
      $notify.error({ message: "获取在线壁纸失败：" + detail, duration: 4000 });
      return;
    }
    // 先预载图片：成功才应用（避免静默失败/看起来没更新）
    const probe = new Image();
    probe.onload = () => {
      WallpaperManager.applyOnline(res.url, kind).then(() => {
        renderCurrentInfo();
        $notify.success({ message: "已应用在线壁纸", duration: 2000 });
      });
    };
    probe.onerror = () => {
      $notify.error({ message: "在线图片加载失败（网络/跨域）", duration: 4000 });
    };
    probe.src = res.url;
  });
};
onlineBtn && onlineBtn.addEventListener("click", () => applyOnline("picsum"));
bingBtn && bingBtn.addEventListener("click", () => applyOnline("bing"));
gradientBtn &&
  gradientBtn.addEventListener("click", () => {
    WallpaperManager.applyRandomGradient().then(() => {
      renderCurrentInfo();
      $notify.success({ message: "已应用随机渐变", duration: 1500 });
    });
  });

const fileInput2 = document.getElementById("bg-input");
const removeBtn = document.getElementById("bg-remove-btn");
const uploadArea2 = document.getElementById("bg-upload-area");
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
        .then(() => { renderCurrentInfo(); $notify.success({ message: "已应用本地图片", duration: 1500 }); })
        .catch((err) => $notify.error({ message: err.message, duration: 3000 }));
    }
  });
removeBtn &&
  removeBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    await WallpaperManager.clearCurrent();
    renderCurrentInfo();
    renderFavorites();
    $notify.success({ message: "已移除当前壁纸", duration: 1500 });
  });

const opacitySlider = document.getElementById("bg-opacity-slider");
const opacityValue = document.getElementById("bg-opacity-value");
const blurSlider = document.getElementById("bg-blur-slider");
const blurValue = document.getElementById("bg-blur-value");
const panelOpacitySlider = document.getElementById("panel-opacity-slider");
const panelOpacityValue = document.getElementById("panel-opacity-value");
const panelBlurSlider = document.getElementById("panel-blur-slider");
const panelBlurValue = document.getElementById("panel-blur-value");
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
  if (panelOpacitySlider) panelOpacitySlider.value = Math.round((view.panelOpacity ?? 0.5) * 100);
  if (panelOpacityValue) panelOpacityValue.textContent = Math.round((view.panelOpacity ?? 0.5) * 100) + "%";
  if (panelBlurSlider) panelBlurSlider.value = view.panelBlur ?? 0;
  if (panelBlurValue) panelBlurValue.textContent = (view.panelBlur ?? 0) + "px";
};
opacitySlider && opacitySlider.addEventListener("input", (e) => {
  if (opacityValue) opacityValue.textContent = e.target.value + "%";
  queueView({ opacity: Number(e.target.value) / 100 });
});
blurSlider && blurSlider.addEventListener("input", (e) => {
  if (blurValue) blurValue.textContent = e.target.value + "px";
  queueView({ blur: Number(e.target.value) });
});
panelOpacitySlider && panelOpacitySlider.addEventListener("input", (e) => {
  if (panelOpacityValue) panelOpacityValue.textContent = e.target.value + "%";
  queueView({ panelOpacity: Number(e.target.value) / 100 });
});
panelBlurSlider && panelBlurSlider.addEventListener("input", (e) => {
  if (panelBlurValue) panelBlurValue.textContent = e.target.value + "px";
  queueView({ panelBlur: Number(e.target.value) });
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
