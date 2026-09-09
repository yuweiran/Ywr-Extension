/**
 * WallpaperManager — 多源壁纸引擎
 * 数据分层：
 *   - 二进制/渐变字符串  -> IndexedDB 表 wallpapers（tab 直接读写）
 *   - 配置(current/library/favorites/daily/view/seeded) -> chrome.storage.local['ywr-wallpaper']
 *     （SW 的 alarm 需要写，故配置不落 localStorage）
 * 能力 API（供 settings-manager 面板调用）：listSources/applySource/addGradient/
 *   uploadLocal/toggleFavorite/setCurrent/setDaily/getView/setView/removeSource/migrateLegacy
 */
const WallpaperManager = (function () {
  const CONFIG_KEY = "ywr-wallpaper";
  const LEGACY_SETTINGS_KEY = "ywr-extension-settings";
  const PRESET_GRADIENTS = [
    { label: "晨雾", gradient: "linear-gradient(135deg,#e0eafc 0%,#cfdef3 100%)" },
    { label: "暮光", gradient: "linear-gradient(135deg,#ffecd2 0%,#fcb69f 100%)" },
    { label: "深海", gradient: "linear-gradient(135deg,#2b5876 0%,#4e4376 100%)" },
    { label: "极光", gradient: "linear-gradient(135deg,#56ab2f 0%,#a8e063 100%)" },
    { label: "日落", gradient: "linear-gradient(135deg,#f83600 0%,#f9d423 100%)" },
    { label: "紫夜", gradient: "linear-gradient(135deg,#41295a 0%,#2f0743 100%)" },
    { label: "薄荷", gradient: "linear-gradient(135deg,#43cea2 0%,#185a9d 100%)" },
    { label: "蜜桃", gradient: "linear-gradient(135deg,#ff758c 0%,#ff7eb3 100%)" },
    { label: "天空", gradient: "linear-gradient(135deg,#4facfe 0%,#00f2fe 100%)" },
    { label: "柠檬", gradient: "linear-gradient(135deg,#f6d365 0%,#fda085 100%)" },
    { label: "石墨", gradient: "linear-gradient(135deg,#232526 0%,#414345 100%)" },
    { label: "晚霞", gradient: "linear-gradient(135deg,#ff9a9e 0%,#fecfef 100%)" },
  ];
  const MAX_UPLOAD_BYTES = 1024 * 1024; // 1MB

  let config = null;
  let bgEl = null;
  let overlayEl = null;

  /* ---------- 配置读写 ---------- */
  const defaultConfig = () => ({
    current: null,
    library: [],
    favorites: [],
    daily: false,
    view: { opacity: 0.15, blur: 0 },
    // seeded 仅在播种完成后补写，初始态不含
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
    // IndexedModel.add 会覆写 id = Date.now()
    return await t.add(record);
  };

  const dbGetWallpaper = (id) => {
    const t = dbTable();
    if (!t) return Promise.resolve(null);
    // list 走 getAll，此处按需从全部中取（数据量小）
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

  const resolveSourceCss = async (src) => {
    if (!src) return null;
    if (src.type === "local") {
      const row = await dbGetWallpaper(src.id);
      return row ? `url(${row.data})` : null;
    }
    if (src.type === "gradient") {
      const row = await dbGetWallpaper(src.id);
      return row ? row.data : null;
    }
    if (src.type === "online") {
      const meta = (config.library || []).find((it) => it.id === src.id);
      // URL 含 & 等字符时需加引号包裹，否则 CSS url() 解析会被截断
      return meta && meta.url ? `url("${meta.url}")` : null;
    }
    return null;
  };

  const applyBackground = async () => {
    if (!config) return; // init() 前（config 仍为 null）安全跳过
    ensureBackgroundLayer();
    const src = config.current;
    const css = await resolveSourceCss(src);
    const isImage = src && (src.type === "local" || src.type === "online");
    const view = config.view || { opacity: 0.15, blur: 0 };
    if (css) {
      bgEl.style.backgroundImage = css;
      bgEl.style.filter = view.blur > 0 ? `blur(${view.blur}px)` : "none";
      overlayEl.style.opacity = isImage ? 1 - view.opacity : 0.35;
      document.body.classList.add("has-wallpaper");
    } else {
      bgEl.style.backgroundImage = "none";
      overlayEl.style.opacity = 1;
      document.body.classList.remove("has-wallpaper");
    }
  };

  /* ---------- 生命周期：播种/迁移 ---------- */
  const seedPresetGradients = async () => {
    if (config.seeded === true) return;
    if (config.library && config.library.length > 0) return;
    const presets = [];
    for (const p of PRESET_GRADIENTS) {
      const row = await dbAddWallpaper({ type: "gradient", data: p.gradient });
      presets.push({ id: row.id, type: "gradient", label: p.label, addedAt: Date.now() });
    }
    config.library = presets;
    config.seeded = true;
    await saveConfig(config);
  };

  const migrateLegacy = async () => {
    try {
      const raw = localStorage.getItem(LEGACY_SETTINGS_KEY);
      if (!raw) return;
      const legacy = JSON.parse(raw);
      const oldImage = legacy && legacy.backgroundImage;
      if (!oldImage) return;
      const row = await dbAddWallpaper({ type: "local", data: oldImage });
      config.library = config.library || [];
      config.library.push({ id: row.id, type: "local", label: "我的壁纸", addedAt: Date.now() });
      config.current = { id: row.id, type: "local" };
      delete legacy.backgroundImage;
      localStorage.setItem(LEGACY_SETTINGS_KEY, JSON.stringify(legacy));
      await saveConfig(config);
    } catch (e) {
      console.warn("WallpaperManager: legacy migrate failed", e);
    }
  };

  /* ---------- 能力 API（config 在 init() 前为 null，所有读操作必须空安全） ---------- */
  const listSources = () => (config && config.library) || [];

  const setCurrent = async (id) => {
    if (!config) return false;
    const meta = (config.library || []).find((it) => it.id === id);
    if (!meta) return false;
    config.current = { id: meta.id, type: meta.type };
    await saveConfig(config);
    await applyBackground();
    return true;
  };

  const addGradient = async () => {
    // 随机生成渐变
    const hue1 = Math.floor(Math.random() * 360);
    const hue2 = (hue1 + 40 + Math.floor(Math.random() * 140)) % 360;
    const gradient = `linear-gradient(135deg, hsl(${hue1},70%,60%) 0%, hsl(${hue2},70%,55%) 100%)`;
    const row = await dbAddWallpaper({ type: "gradient", data: gradient });
    const meta = { id: row.id, type: "gradient", label: "随机渐变", addedAt: Date.now() };
    if (!config) config = defaultConfig();
    config.library = config.library || [];
    config.library.push(meta);
    await saveConfig(config);
    return meta;
  };

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
            const bytes = data.length * 0.75; // base64 近似字节数
            if (bytes > MAX_UPLOAD_BYTES) {
              reject(new Error("图片过大（>1MB），请压缩后重试"));
              return;
            }
            const row = await dbAddWallpaper({ type: "local", data });
            const meta = { id: row.id, type: "local", label: file.name, addedAt: Date.now() };
            config.library = config.library || [];
            config.library.push(meta);
            await saveConfig(config);
            resolve(meta);
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

  const compressImage = (img) =>
    new Promise((resolve) => {
      const MAX_SIDE = 1920;
      let { width, height } = img;
      if (width > MAX_SIDE || height > MAX_SIDE) {
        const ratio = MAX_SIDE / Math.max(width, height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      const qualities = [0.85, 0.6, 0.4, 0.2];
      let out = canvas.toDataURL("image/jpeg", 0.85);
      for (const q of qualities) {
        const data = canvas.toDataURL("image/jpeg", q);
        if (data.length * 0.75 <= MAX_UPLOAD_BYTES) {
          out = data;
          break;
        }
      }
      resolve(out);
    });

  const removeSource = async (id) => {
    if (!config) return;
    config.library = (config.library || []).filter((it) => it.id !== id);
    config.favorites = (config.favorites || []).filter((f) => f !== id);
    if (config.current && config.current.id === id) {
      config.current = null; // 回退主题色，不隐式跳转
    }
    await dbDeleteWallpaper(id);
    await saveConfig(config);
    await applyBackground();
  };

  const toggleFavorite = async (id) => {
    if (!config) return false;
    const favs = config.favorites || [];
    const idx = favs.indexOf(id);
    if (idx === -1) favs.push(id);
    else favs.splice(idx, 1);
    config.favorites = favs;
    await saveConfig(config);
    return config.favorites;
  };

  const isFavorite = (id) => !!config && (config.favorites || []).includes(id);

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
    config.view = Object.assign({}, config.view || { opacity: 0.15, blur: 0 }, patch);
    await saveConfig(config);
    await applyBackground();
  };

  const getView = () => (config && config.view) || { opacity: 0.15, blur: 0 };

  const addOnline = async (url, provider) => {
    if (!config) config = defaultConfig();
    const meta = {
      id: "online-" + Date.now(),
      type: "online",
      provider: provider || "picsum",
      url,
      label: provider === "bing" ? "Bing 每日壁纸" : "Picsum 随机",
      addedAt: Date.now(),
    };
    config.library = config.library || [];
    config.library.push(meta);
    config.current = { id: meta.id, type: "online" };
    await saveConfig(config);
    await applyBackground();
    return meta;
  };

  const getDaily = () => !!config && config.daily === true;

  /* ---------- 初始化 ---------- */
  const init = async () => {
    await loadConfig();
    await migrateLegacy();
    await seedPresetGradients();
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
    listSources,
    setCurrent,
    addGradient,
    uploadLocal,
    removeSource,
    toggleFavorite,
    isFavorite,
    setDaily,
    setView,
    getView,
    addOnline,
    get daily() {
      return getDaily();
    },
  };
})();
