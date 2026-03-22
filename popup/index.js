/**
 * Popup 弹窗逻辑
 * 功能：快速收藏、搜索链接、最近添加、快捷入口
 */

const searchInput = document.getElementById("search-input");
const searchResults = document.getElementById("search-results");
const searchList = document.getElementById("search-list");
const bookmarkSection = document.getElementById("bookmark-section");
const recentSection = document.getElementById("recent-section");
const collectionTags = document.getElementById("collection-tags");
const recentList = document.getElementById("recent-list");
const btnNewtab = document.getElementById("btn-newtab");
const btnSettings = document.getElementById("btn-settings");

let currentTab = null;

/* ---- 工具函数 ---- */

function faviconImg(icon, url) {
  const src = icon || (url ? `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(url)}&size=16` : "");
  return `<img src="${escapeAttr(src)}" width="16" height="16" onerror="this.style.display='none'" />`;
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

function escapeAttr(str) {
  return (str || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function sendMsg(msg) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(msg, (res) => {
      if (chrome.runtime.lastError) resolve(null);
      else resolve(res);
    });
  });
}

/* ---- 初始化 ---- */

async function init() {
  // 获取当前标签页
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;

  // 并行请求集合和最近链接
  const [colRes, recentRes] = await Promise.all([
    sendMsg({ type: "popup:getCollections", url: currentTab?.url || "" }),
    sendMsg({ type: "popup:getRecentLinks", limit: 6 }),
  ]);

  renderCollections(colRes?.collections || [], colRes?.savedCollectionIds || []);
  renderRecentLinks(recentRes?.links || []);
}

/* ---- 渲染集合标签 ---- */

function renderCollections(collections, savedCollectionIds = []) {
  if (collections.length === 0) {
    collectionTags.innerHTML = `<span class="empty-hint">暂无集合，请先在新标签页创建</span>`;
    return;
  }
  collectionTags.innerHTML = collections
    .map((c) => {
      const isSaved = savedCollectionIds.includes(c.id);
      return `<span class="collection-tag${isSaved ? " saved" : ""}" data-id="${c.id}" data-name="${escapeAttr(c.name)}">${isSaved ? "✓ " : ""}${escapeHTML(c.name)}</span>`;
    })
    .join("");
}

/* ---- 渲染最近链接 ---- */

function renderRecentLinks(links) {
  if (links.length === 0) {
    recentList.innerHTML = `<span class="empty-hint">还没有添加过链接</span>`;
    return;
  }
  recentList.innerHTML = links
    .map(
      (l) =>
        `<a class="link-item" href="${escapeAttr(l.url)}" title="${escapeAttr(l.name)}">${faviconImg(l.icon, l.url)}<span class="link-item-text">${escapeHTML(l.name)}</span></a>`
    )
    .join("");
}

/* ---- 渲染搜索结果 ---- */

function renderSearchResults(links) {
  if (links.length === 0) {
    searchList.innerHTML = `<span class="empty-hint">未找到匹配链接</span>`;
    return;
  }
  searchList.innerHTML = links
    .map(
      (l) =>
        `<a class="link-item" href="${escapeAttr(l.url)}" title="${escapeAttr(l.name)}">${faviconImg(l.icon, l.url)}<span class="link-item-text">${escapeHTML(l.name)}</span>${l.collectionName ? `<span class="link-item-collection">${escapeHTML(l.collectionName)}</span>` : ""}</a>`
    )
    .join("");
}

/* ---- 搜索（300ms 防抖） ---- */

let _searchTimer = null;

searchInput.addEventListener("input", () => {
  const keyword = searchInput.value.trim();
  if (_searchTimer) clearTimeout(_searchTimer);

  if (keyword.length === 0) {
    searchResults.style.display = "none";
    bookmarkSection.style.display = "";
    recentSection.style.display = "";
    return;
  }

  _searchTimer = setTimeout(async () => {
    const res = await sendMsg({ type: "popup:searchLinks", keyword });
    renderSearchResults(res?.links || []);
    searchResults.style.display = "";
    bookmarkSection.style.display = "none";
    recentSection.style.display = "none";
  }, 300);
});

/* ---- 快速收藏（点击集合标签） ---- */

collectionTags.addEventListener("click", async (e) => {
  const tag = e.target.closest(".collection-tag");
  if (!tag || !currentTab) return;

  const collectionId = Number(tag.dataset.id);
  const originalName = tag.dataset.name;

  if (tag.classList.contains("saved")) {
    // 取消收藏
    const res = await sendMsg({
      type: "popup:removeLink",
      collectionId,
      url: currentTab.url,
    });
    if (res?.success) {
      tag.textContent = originalName;
      tag.classList.remove("saved");
    }
  } else {
    // 添加收藏
    const res = await sendMsg({
      type: "popup:addLink",
      collectionId,
      name: currentTab.title || currentTab.url,
      url: currentTab.url,
      icon: currentTab.favIconUrl || "",
    });
    if (res?.success) {
      tag.textContent = "✓ " + originalName;
      tag.classList.add("saved");
    }
  }
});

/* ---- 链接点击 ---- */

document.addEventListener("click", (e) => {
  const link = e.target.closest(".link-item");
  if (link) {
    e.preventDefault();
    chrome.tabs.create({ url: link.getAttribute("href") });
  }
});

/* ---- 底部快捷按钮 ---- */

btnNewtab.addEventListener("click", () => {
  chrome.tabs.create({ url: "/tab/index.html" });
});

btnSettings.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

/* ---- 启动 ---- */

init();
