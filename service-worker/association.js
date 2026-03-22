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
});
