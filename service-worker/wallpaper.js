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
  const next = mutator(cfg || { current: null, library: [], favorites: [], daily: false, view: { opacity: 0.15, blur: 0 } });
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
 * Bing 每日壁纸解析（唯一 fetch-and-parse 场景）
 */
async function fetchBingUrl() {
  const res = await fetch(
    "https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN"
  );
  if (!res.ok) throw new Error("bing http " + res.status);
  const json = await res.json();
  const base = json.images && json.images[0];
  if (!base || !base.url) throw new Error("bing empty");
  return "https://www.bing.com" + base.url;
}

/**
 * 验证 Picsum 重定向链可达（M3 spike；成功后只返回 URL，不存字节）
 */
async function spikePicsum() {
  const url = picsumUrl(await daySeed());
  const res = await fetch(url, { method: "HEAD" });
  if (!res.ok && res.status !== 302) throw new Error("picsum http " + res.status);
  return url;
}

/**
 * 更新在线源条目 url（用于每日轮换）
 */
async function rotateOnline() {
  return writeConfig((cfg) => {
    const online = (cfg.library || []).find((it) => it.type === "online");
    if (!online) return cfg;
    // Picsum 直连优先；若库中 bing 标记则走 Bing 解析
    if (online.provider === "bing") {
      online.url = null; // 置空由调用方补齐——rotate 使用 async 解析
    } else {
      online.url = picsumUrl(new Date().toISOString().slice(0, 10));
    }
    return cfg;
  }).then(async (cfg) => {
    // 二次处理 Bing 源（需要在写库前拿到 URL）
    const online = (cfg.library || []).find((it) => it.type === "online");
    if (online && online.provider === "bing") {
      const bingUrl = await fetchBingUrl();
      await writeConfig((c) => {
        const it = (c.library || []).find((x) => x.type === "online");
        if (it) it.url = bingUrl;
        return c;
      });
    }
    return cfg;
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
