import { getDB } from "./db.js";

function broadcastDataChanged() {
  chrome.runtime.sendMessage({ type: "dataChanged" }).catch(() => {});
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "suggest") {
    const keyword = message.keyword;
    fetch(`https://suggestion.baidu.com/su?wd=${encodeURIComponent(keyword)}&action=opensearch`)
      .then((res) => res.arrayBuffer())
      .then((buf) => JSON.parse(new TextDecoder("gbk").decode(buf)))
      .then((data) => {
        const suggestions = Array.isArray(data[1]) ? data[1] : [];
        sendResponse({ suggestions });
      })
      .catch(() => {
        sendResponse({ suggestions: [] });
      });
    return true;
  }

  /* ---- Popup 消息处理 ---- */

  if (message.type === "popup:getCollections") {
    const tabUrl = message.url || "";
    getDB().then(async (tables) => {
      const collections = await tables.collections.list();
      collections.sort((a, b) => a.order - b.order);
      let savedCollectionIds = [];
      if (tabUrl) {
        const allLinks = await tables.links.list();
        savedCollectionIds = allLinks
          .filter((l) => l.url === tabUrl)
          .map((l) => l.collection);
      }
      sendResponse({ collections, savedCollectionIds });
    }).catch(() => sendResponse({ collections: [], savedCollectionIds: [] }));
    return true;
  }

  if (message.type === "popup:addLink") {
    const { collectionId, name, url, icon } = message;
    getDB().then(async (tables) => {
      const existing = await tables.links.list({ collection: collectionId });
      await tables.links.add({
        name,
        url,
        icon: icon || "",
        remark: "",
        order: existing.length,
        collection: collectionId,
      });
      sendResponse({ success: true });
      broadcastDataChanged();
    }).catch(() => sendResponse({ success: false }));
    return true;
  }

  if (message.type === "popup:removeLink") {
    const { collectionId, url } = message;
    getDB().then(async (tables) => {
      const links = await tables.links.list({ collection: collectionId });
      const target = links.find((l) => l.url === url);
      if (target) {
        await tables.links.delete(target.id);
        sendResponse({ success: true });
        broadcastDataChanged();
      } else {
        sendResponse({ success: false });
      }
    }).catch(() => sendResponse({ success: false }));
    return true;
  }

  if (message.type === "popup:searchLinks") {
    const kw = (message.keyword || "").toLowerCase();
    getDB().then(async (tables) => {
      const allLinks = await tables.links.list();
      const allCollections = await tables.collections.list();
      const collectionMap = {};
      allCollections.forEach((c) => (collectionMap[c.id] = c.name));

      const matched = allLinks.filter((l) =>
        (l.name || "").toLowerCase().includes(kw) ||
        (l.url || "").toLowerCase().includes(kw) ||
        (l.remark || "").toLowerCase().includes(kw)
      ).slice(0, 12).map((l) => ({
        name: l.name,
        url: l.url,
        icon: l.icon || "",
        collectionName: collectionMap[l.collection] || "",
      }));
      sendResponse({ links: matched });
    }).catch(() => sendResponse({ links: [] }));
    return true;
  }

  if (message.type === "popup:getRecentLinks") {
    const limit = message.limit || 6;
    getDB().then(async (tables) => {
      const allLinks = await tables.links.list();
      allLinks.sort((a, b) => b.id - a.id);
      const recent = allLinks.slice(0, limit).map((l) => ({
        name: l.name,
        url: l.url,
        icon: l.icon || "",
      }));
      sendResponse({ links: recent });
    }).catch(() => sendResponse({ links: [] }));
    return true;
  }

  /* ---- Options 数据导入导出 ---- */

  if (message.type === "data:export") {
    getDB().then(async (tables) => {
      const collections = await tables.collections.list();
      const links = await tables.links.list();
      sendResponse({
        success: true,
        data: {
          version: 1,
          exportDate: new Date().toISOString(),
          collections,
          links,
        },
      });
    }).catch((err) => sendResponse({ success: false, error: err.message || "导出失败" }));
    return true;
  }

  if (message.type === "data:import") {
    const { collections, links } = message.data || {};
    if (!Array.isArray(collections) || !Array.isArray(links)) {
      sendResponse({ success: false, error: "数据结构不完整" });
      return true;
    }
    getDB().then(async (tables) => {
      await tables.collections.clearAll();
      await tables.links.clearAll();
      let skipped = 0;
      for (const c of collections) {
        if (c.id && c.name) {
          await tables.collections.add({ name: c.name, order: c.order ?? 0 });
        } else {
          skipped++;
        }
      }
      // 建立旧 id → 新 id 映射（导入后 id 会重新生成）
      // 由于 add() 用 Date.now()，需按原顺序逐条写入
      // 先收集新的 collection id 映射
      const newCollections = await tables.collections.list();
      const collectionIdMap = {};
      const sortedOld = [...collections].filter((c) => c.id && c.name).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const sortedNew = [...newCollections].sort((a, b) => a.order - b.order);
      sortedOld.forEach((old, i) => {
        if (sortedNew[i]) collectionIdMap[old.id] = sortedNew[i].id;
      });
      for (const l of links) {
        if (l.id && l.name && l.url && l.collection) {
          const mappedCollection = collectionIdMap[l.collection] || l.collection;
          await tables.links.add({
            name: l.name,
            url: l.url,
            icon: l.icon || "",
            remark: l.remark || "",
            order: l.order ?? 0,
            collection: mappedCollection,
          });
        } else {
          skipped++;
        }
      }
      sendResponse({ success: true, skipped });
      broadcastDataChanged();
    }).catch((err) => sendResponse({ success: false, error: err.message || "导入失败" }));
    return true;
  }

  if (message.type === "profileChanged") {
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        chrome.tabs.sendMessage(tab.id, { type: "profileChanged" }).catch(() => {});
      }
    });
    return false;
  }
});
