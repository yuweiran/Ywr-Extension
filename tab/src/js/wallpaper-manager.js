/**
 * WallpaperManager — 壁纸引擎（v2 模型）
 *
 * 数据模型（用户确认）：
 *   - current   当前壁纸（持久显示，但「不产生源列表记录」）
 *   - favorites 收藏列表 —— 只有用户点「收藏当前壁纸」才写入；可重新应用/删除
 *   - 渐变：仅「随机渐变」一个入口（无 12 组预设库）
 *   - 在线/本地/渐变均只落 current；重复应用不累积记录
 *
 * 存储分层：
 *   - local 图片二进制 -> IndexedDB 表 wallpapers（dataId 引用，收藏与当前可共享同一行；
 *     引用清理规则见各删除函数）
 *   - 配置 {current, favorites, daily, view} -> chrome.storage.local['ywr-wallpaper']
 *     （SW 的每日轮换 alarm 需要写，故配置不落 localStorage）
 *
 * 兼容：旧配置含 library/seeded —— 首次加载时迁移：library 丢弃；
 *   favorites 若为旧 id 数组则按 id 展开为完整对象（dataId 复用原 IDB 行）。
 */
const WallpaperManager = (function () {
  const CONFIG_KEY = "ywr-wallpaper";
  const LEGACY_SETTINGS_KEY = "ywr-extension-settings";
  const MAX_UPLOAD_BYTES = 1024 * 1024; // 1MB

  let config = null;
  let bgEl = null;
  let overlayEl = null;

  /* ---------- 配置读写 ---------- */
  const defaultConfig = () => ({
    current: null,
    favorites: [],
    daily: false,
    view: {
      opacity: 0.15, // 壁纸蒙层（值越大背景越明显）
      blur: 0,       // 壁纸本身模糊
      panelOpacity: 0.5, // 内容区(右栏/中间收藏区)容器玻璃的不透明度 0~1
      panelBlur: 8,      // 内容区容器玻璃模糊 px
    },
  });

  const loadConfig = () =>
    new Promise((resolve) => {
      chrome.storage.local.get([CONFIG_KEY], (data) => {
        config = data[CONFIG_KEY] || defaultConfig();
        resolve(config);
      });
    });

  const saveConfig = (next) =>
    new Promise((resolve) => {
      config = next;
      chrome.storage.local.set({ [CONFIG_KEY]: next }, resolve);
    });

  /* ---------- IndexedDB 访问（wallpapers 表） ---------- */
  const dbTable = () => ($indexedDB && $indexedDB.$tables ? $indexedDB.$tables.wallpapers : null);

  const dbAddWallpaper = async (record) => {
    const t = dbTable();
    if (!t) throw new Error("wallpapers table not ready");
    return await t.add(record); // IndexedModel.add 覆写 id = Date.now()
  };

  const dbGetWallpaper = (id) => {
    const t = dbTable();
    if (!t) return Promise.resolve(null);
    return t.list().then((rows) => rows.find((r) => r.id === id) || null);
  };

  const dbDeleteWallpaper = (id) => {
    const t = dbTable();
    return t ? t.delete(id) : Promise.resolve();
  };

  /* ---------- 背景层 ---------- */
  const ensureBackgroundLayer = () => {
    if (bgEl) return;
    bgEl = document.createElement("div");
    bgEl.className = "page-background";
    bgEl.id = "page-background";
    bgEl.innerHTML = '<div class="page-background-overlay" id="page-background-overlay"></div>';
    document.body.insertBefore(bgEl, document.body.firstChild);
    overlayEl = bgEl.querySelector(".page-background-overlay");
  };

  /** 把单个壁纸项解析为 CSS 背景值 */
  const itemToCss = async (item) => {
    if (!item) return null;
    if (item.kind === "local") {
      const row = await dbGetWallpaper(item.dataId);
      return row ? `url(${row.data})` : null;
    }
    if (item.kind === "gradient") return item.css || null;
    if (item.kind === "online") return item.url ? `url("${item.url}")` : null;
    return null;
  };

  const applyBackground = async () => {
    if (!config) return; // init() 前（config 仍为 null）安全跳过
    ensureBackgroundLayer();
    const css = await itemToCss(config.current);
    const isImage = config.current && config.current.kind === "online";
    const view = config.view || { opacity: 0.15, blur: 0, panelOpacity: 0.5, panelBlur: 8 };
    // 内容区(右栏/中间收藏容器)玻璃参数 -> CSS 变量（仅在 has-wallpaper 时被 CSS 使用）
    const root = document.documentElement.style;
    root.setProperty("--panel-glass-opacity", String(view.panelOpacity ?? 0.5));
    root.setProperty("--panel-glass-blur", (view.panelBlur ?? 0) + "px");
    if (css) {
      bgEl.style.backgroundImage = css;
      // 模糊时轻微放大背景层：避免 filter:blur 在元素边缘外采样透明而产生白边/晕边
      bgEl.style.transform = view.blur > 0 ? "scale(1.06)" : "none";
      bgEl.style.filter = view.blur > 0 ? `blur(${view.blur}px)` : "none";
      // 图片蒙层透明度：渐变可透 35%，图片按 view.opacity（越小越明显）
      overlayEl.style.opacity = isImage ? 1 - view.opacity : 0.35;
      document.body.classList.add("has-wallpaper");
    } else {
      bgEl.style.backgroundImage = "none";
      bgEl.style.transform = "none";
      bgEl.style.filter = "none";
      overlayEl.style.opacity = 1;
      document.body.classList.remove("has-wallpaper");
    }
  };

  /* ---------- 内部工具 ---------- */
  const itemLabel = (item) => {
    if (!item) return "";
    if (item.kind === "local") return item.label || "本地图片";
    if (item.kind === "gradient") return item.label || "随机渐变";
    if (item.kind === "online") return (item.provider === "bing" ? "Bing 壁纸" : "Picsum 壁纸") + (item.label ? " · " + item.label : "");
    return "";
  };

  const kindIcon = (kind) => (kind === "online" ? "🌐 " : kind === "gradient" ? "🎨 " : "🖼️ ");

  /** local 行是否仍被收藏或当前引用 */
  const isLocalIdReferenced = (dataId) => {
    if (!config || !dataId) return false;
    if (config.current && config.current.kind === "local" && config.current.dataId === dataId) return true;
    return (config.favorites || []).some((f) => f.kind === "local" && f.dataId === dataId);
  };

  /** 旧 local current 更换前清理无引用行 */
  const gcOldLocal = async (oldItem) => {
    if (oldItem && oldItem.kind === "local" && !isLocalIdReferenced(oldItem.dataId)) {
      await dbDeleteWallpaper(oldItem.dataId);
    }
  };

  /** 应用新 current（覆盖前先清理旧 local 无引用行） */
  const setCurrentItem = async (item) => {
    if (!config) config = defaultConfig();
    await gcOldLocal(config.current);
    config.current = item;
    await saveConfig(config);
    await applyBackground();
  };

  /* ========== 能力 API（config 在 init() 前为 null，读操作空安全） ========== */

  /** 随机渐变（唯一渐变入口；直接设为当前，不记录） */
  const applyRandomGradient = async () => {
    const hue1 = Math.floor(Math.random() * 360);
    const hue2 = (hue1 + 40 + Math.floor(Math.random() * 140)) % 360;
    const css = `linear-gradient(135deg, hsl(${hue1},70%,62%) 0%, hsl(${hue2},70%,55%) 100%)`;
    await setCurrentItem({ kind: "gradient", css, label: "随机渐变" });
    return { kind: "gradient", css };
  };

  /** 本地上传（压缩后入 IDB 并设为当前；不记录列表） */
  const uploadLocal = (file) =>
    new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith("image/")) {
        reject(new Error("仅支持图片文件"));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = async () => {
          try {
            const data = await compressImage(img);
            const bytes = data.length * 0.75;
            if (bytes > MAX_UPLOAD_BYTES) {
              reject(new Error("图片过大（>1MB），请压缩后重试"));
              return;
            }
            const row = await dbAddWallpaper({ type: "local", data });
            await setCurrentItem({ kind: "local", dataId: row.id, label: file.name });
            resolve({ kind: "local", dataId: row.id, label: file.name });
          } catch (e) {
            reject(e);
          }
        };
        img.onerror = () => reject(new Error("图片解码失败"));
        img.src = reader.result;
      };
      reader.onerror = () => reject(new Error("文件读取失败"));
      reader.readAsDataURL(file);
    });

  /** 在线壁纸（Picsum/Bing 已由 SW 给终态 URL；设为当前不记录） */
  const applyOnline = async (url, provider) => {
    const item = {
      kind: "online",
      url,
      provider: provider || "picsum",
      label: provider === "bing" ? "Bing 今日" : "Picsum 随机",
    };
    await setCurrentItem(item);
    return item;
  };

  /** 移除当前壁纸（回退纯主题色；local 行若无引用则清理） */
  const clearCurrent = async () => {
    if (!config) return;
    const old = config.current;
    if (old && old.kind === "local" && !isLocalIdReferenced(old.dataId)) {
      await dbDeleteWallpaper(old.dataId);
    }
    config.current = null;
    await saveConfig(config);
    await applyBackground();
  };

  /* ========== 收藏 ========== */

  /** 当前壁纸是否已在收藏中（gradient/online 按内容、local 按 dataId） */
  const isCurrentFavorite = () => {
    if (!config || !config.current) return false;
    const c = config.current;
    return (config.favorites || []).some((f) => {
      if (f.kind !== c.kind) return false;
      if (f.kind === "local") return f.dataId === c.dataId;
      if (f.kind === "online") return f.url === c.url;
      return f.css === c.css;
    });
  };

  /** 收藏当前壁纸（幂等：已收藏则返回 false 不重复） */
  const favoriteCurrent = async () => {
    if (!config || !config.current) return false;
    if (isCurrentFavorite()) return false;
    const c = config.current;
    const fav = { fid: "fav-" + Date.now(), kind: c.kind, addedAt: Date.now() };
    if (c.kind === "local") fav.dataId = c.dataId; // 共享 IDB 行
    if (c.kind === "gradient") fav.css = c.css;
    if (c.kind === "online") {
      fav.url = c.url;
      fav.provider = c.provider;
    }
    fav.label = itemLabel(c);
    config.favorites = config.favorites || [];
    config.favorites.push(fav);
    await saveConfig(config);
    return true;
  };

  /** 取消收藏/删除收藏项 */
  const removeFavorite = async (fid) => {
    if (!config) return;
    const idx = (config.favorites || []).findIndex((f) => f.fid === fid);
    if (idx === -1) return;
    const f = config.favorites[idx];
    config.favorites.splice(idx, 1);
    // local 收藏行仅在无人引用时清理
    if (f.kind === "local" && !isLocalIdReferenced(f.dataId)) {
      await dbDeleteWallpaper(f.dataId);
    }
    await saveConfig(config);
  };

  /** 应用某收藏项为当前壁纸（local 共享行不复制） */
  const applyFavorite = async (fid) => {
    if (!config) return false;
    const f = (config.favorites || []).find((x) => x.fid === fid);
    if (!f) return false;
    const item = { kind: f.kind, label: f.label };
    if (f.kind === "local") item.dataId = f.dataId;
    if (f.kind === "gradient") item.css = f.css;
    if (f.kind === "online") {
      item.url = f.url;
      item.provider = f.provider;
    }
    await setCurrentItem(item);
    return true;
  };

  const listFavorites = () => (config && config.favorites) || [];

  const getCurrentInfo = () => {
    if (!config || !config.current) return null;
    const c = config.current;
    return { kind: c.kind, label: itemLabel(c), icon: kindIcon(c.kind), isFav: isCurrentFavorite() };
  };

  /* ---------- 每日轮换 / 视图 ---------- */
  const setDaily = async (enabled) => {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: "wallpaper:setDaily", enabled }, (res) => {
        if (chrome.runtime.lastError || !res || !res.success) {
          reject(new Error(chrome.runtime.lastError ? chrome.runtime.lastError.message : "setDaily failed"));
          return;
        }
        if (config) config.daily = enabled;
        resolve(true);
      });
    });
  };

  const setView = async (patch) => {
    if (!config) return;
    const base = { opacity: 0.15, blur: 0, panelOpacity: 0.5, panelBlur: 8 };
    config.view = Object.assign({}, base, config.view || {}, patch);
    await saveConfig(config);
    await applyBackground();
  };

  const getView = () => {
    const base = { opacity: 0.15, blur: 0, panelOpacity: 0.5, panelBlur: 8 };
    return Object.assign({}, base, config && config.view ? config.view : {});
  };

  /* ---------- 旧数据迁移（v1：library + favorites id 数组 / 字符串） ---------- */
  const migrateLegacy = async () => {
    try {
      // 新模型特征：无 library 且 favorites 是含 fid 的对象数组 → 已是新结构
      const isNewModel =
        !config.library &&
        Array.isArray(config.favorites) &&
        config.favorites.every((f) => f && typeof f === "object" && typeof f.fid === "string");
      if (isNewModel) return;

      const oldLib = config.library || [];
      const oldFavIds = (config.favorites || [])
        .map((x) => (typeof x === "string" ? x : x && x.id))
        .filter((x) => x != null);
      const favs = [];
      for (const id of oldFavIds) {
        const src = oldLib.find((s) => String(s.id) === String(id));
        if (!src) continue;
        const fav = { fid: "fav-" + Date.now() + "-" + favs.length, kind: src.type, addedAt: Date.now() };
        if (src.type === "local") {
          const row = await dbGetWallpaper(src.id);
          if (row) {
            // 迁移复制一份独立数据行，避免共享引用在收藏删除时的清理歧义
            const copy = await dbAddWallpaper({ type: "local", data: row.data });
            fav.dataId = copy.id;
          } else continue;
        } else if (src.type === "gradient") {
          const row = await dbGetWallpaper(src.id);
          fav.css = row ? row.data : null;
          if (!fav.css) continue;
        } else if (src.type === "online") {
          fav.url = src.url || null;
          fav.provider = src.provider || "picsum";
          if (!fav.url) continue;
        }
        fav.label = src.label || src.id;
        favs.push(fav);
      }
      config.favorites = favs;
      // 旧 current 若指向旧 library 项，尽量还原为内联描述（否则置空）
      const oldCur = config.current;
      if (oldCur && oldCur.id != null && oldLib.length > 0) {
        const src = oldLib.find((s) => String(s.id) === String(oldCur.id));
        if (src && src.type === "gradient") {
          const row = await dbGetWallpaper(src.id);
          config.current = row ? { kind: "gradient", css: row.data, label: src.label || "渐变" } : null;
        } else if (src && src.type === "online") {
          config.current = src.url ? { kind: "online", url: src.url, provider: src.provider || "picsum", label: src.label || "在线" } : null;
        } else {
          // local 或未识别：不强行还原
          config.current = null;
        }
      }
      delete config.library;
      delete config.seeded;
      await saveConfig(config);
    } catch (e) {
      console.warn("WallpaperManager: legacy migrate failed", e);
    }
  };

  /* ---------- 初始化 ---------- */
  const init = async () => {
    await loadConfig();
    await migrateLegacy();
    ensureBackgroundLayer();
    await applyBackground();
    // 响应 SW 广播：每日轮换 / 状态变化
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === "wallpaperChanged") {
        loadConfig().then(applyBackground);
      }
    });
  };

  return {
    init,
    refresh: () => applyBackground(),
    // current
    getCurrentInfo,
    applyRandomGradient,
    uploadLocal,
    applyOnline,
    clearCurrent,
    // favorites
    listFavorites,
    favoriteCurrent,
    isCurrentFavorite,
    removeFavorite,
    applyFavorite,
    // view / daily
    setDaily,
    setView,
    getView,
    get daily() {
      return !!config && config.daily === true;
    },
  };
})();
