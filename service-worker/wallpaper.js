/**
 * Service Worker 端壁纸代理
 * - wallpaper:fetch      Bing archive 解析 / Picsum 重定向链验证
 * - wallpaper:setDaily   每日轮换开关（chrome.alarms 仅 SW 可用）
 * 图片字节永不写入 storage —— tab 页用返回的 URL 直连 CSS background-image
 */

const WALLPAPER_KEY = "ywr-wallpaper";
const DAILY_ALARM = "wallpaperDaily";

function getConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.get([WALLPAPER_KEY], (data) => {
      resolve(data[WALLPAPER_KEY] || null);
    });
  });
}

async function writeConfig(mutator) {
  const cfg = await getConfig();
  const next = mutator(cfg || { current: null, favorites: [], daily: false, view: { opacity: 0.15, blur: 0 } });
  await new Promise((resolve) => chrome.storage.local.set({ [WALLPAPER_KEY]: next }, resolve));
  return next;
}

async function daySeed() {
  return new Date().toISOString().slice(0, 10);
}

// 真随机 seed（供“随机在线”按钮；每日轮换才用 daySeed）
async function randomSeed() {
  return "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/**
 * Picsum 按日 URL（纯构造，无 fetch）
 */
function picsumUrl(seed) {
  return `https://picsum.photos/1920/1080?seed=${seed}`;
}

/**
 * Bing 壁纸解析（唯一 fetch-and-parse 场景）
 * idx 从近 8 天随机取一天，避免每次都返回同一张“今日壁纸”
 */
async function fetchBingUrl() {
  const idx = Math.floor(Math.random() * 8);
  const res = await fetch(
    `https://www.bing.com/HPImageArchive.aspx?format=js&idx=${idx}&n=1&mkt=zh-CN`
  );
  if (!res.ok) throw new Error("bing http " + res.status);
  const json = await res.json();
  const base = json.images && json.images[0];
  if (!base || !base.url) throw new Error("bing empty");
  return "https://www.bing.com" + base.url;
}

/**
 * 每日轮换：仅在「当前壁纸是 online」时把 URL 换成新一天的在线图；
 * 若当前是本地/渐变或没有壁纸则不动（收藏项不自动改动）。
 */
async function rotateOnline() {
  const cfg0 = await getConfig();
  if (!cfg0 || !cfg0.current || cfg0.current.kind !== "online") return cfg0;
  const provider = cfg0.current.provider === "bing" ? "bing" : "picsum";
  if (provider === "bing") {
    const bingUrl = await fetchBingUrl();
    return writeConfig((c) => {
      if (c.current && c.current.kind === "online") {
        c.current.url = bingUrl;
        c.current.provider = "bing";
      }
      return c;
    });
  }
  return writeConfig((c) => {
    if (c.current && c.current.kind === "online") {
      c.current.url = picsumUrl(new Date().toISOString().slice(0, 10));
      c.current.provider = "picsum";
    }
    return c;
  });
}

/**
 * alarm 回调：触发每日轮换
 */
async function handleDailyAlarm() {
  const cfg = await getConfig();
  if (!cfg || cfg.daily !== true) {
    // 陈旧 alarm：清理后返回
    chrome.alarms.clear(DAILY_ALARM);
    return;
  }
  await rotateOnline();
  chrome.runtime.sendMessage({ type: "wallpaperChanged" }).catch(() => {});
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === DAILY_ALARM) handleDailyAlarm();
});

/**
 * 对外消息路由（供 association.js 转发）
 */
export async function handleWallpaperMessage(message) {
  if (message.type === "wallpaper:fetch") {
    const kind = message.kind || "picsum";
    try {
      if (kind === "bing") {
        // Bing 需解析 JSON 提取图片 URL，必须经 SW fetch
        const url = await fetchBingUrl();
        return { success: true, url };
      }
      // Picsum：纯 URL 构造即终态（CSS background-image 直接加载，
      // 不依赖 SW fetch / 302 权限链）；“随机”用真随机 seed
      return { success: true, url: picsumUrl(await randomSeed()) };
    } catch (err) {
      return { success: false, error: err.message || "wallpaper fetch failed" };
    }
  }
  if (message.type === "wallpaper:setDaily") {
    const enabled = !!message.enabled;
    await writeConfig((cfg) => ({ ...cfg, daily: enabled }));
    if (enabled) {
      chrome.alarms.create(DAILY_ALARM, { periodInMinutes: 24 * 60 });
    } else {
      chrome.alarms.clear(DAILY_ALARM);
    }
    return { success: true };
  }
  return null;
}
