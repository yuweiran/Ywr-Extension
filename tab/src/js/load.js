function applyFavicon(base64) {
  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "shortcut icon";
    document.head.appendChild(link);
  }
  link.href = base64;
}

function resetFavicon() {
  const link = document.querySelector("link[rel~='icon']");
  if (link) link.href = "./src/img/icon/snow.png";
}

let isCollectionsRendering = false;
let shouldRefreshCollectionsAgain = false;

async function refreshCollections() {
  if (!$indexedDB?.$tables || !$collections?.renderCollections) return;
  if (isCollectionsRendering) {
    shouldRefreshCollectionsAgain = true;
    return;
  }
  isCollectionsRendering = true;
  try {
    do {
      shouldRefreshCollectionsAgain = false;
      await $collections.renderCollections();
    } while (shouldRefreshCollectionsAgain);
  } finally {
    isCollectionsRendering = false;
  }
}

window.onload = () => {
  //搜索引擎
  if (!localStorage.getItem("engine")) {
    localStorage.setItem("engine", "baidu");
  }
  const engine = localStorage.getItem("engine");
  $searchEles.initEngineIcon(engine);

  if (!localStorage.getItem("ywr-layout-right-fold")) {
    localStorage.setItem("ywr-layout-right-fold", "0");
  }
  $aside.initFoldState()
  document.body.addEventListener("click", () => {
    $dropdown.hidden()
  }, true)
  initIndexedDB().then(async (db) => {
    $indexedDB = db
    await initIndexedDBFunction(db, $indexedDBModel)
    // 收藏为主体：先渲染，避免被壁纸引擎初始化阻塞/中断
    refreshCollections()
    // 壁纸引擎：独立容错，失败仅降级，不影响收藏/搜索等主流程
    if (typeof WallpaperManager !== "undefined") {
      try {
        await WallpaperManager.init()
      } catch (e) {
        console.warn("WallpaperManager init failed (degraded):", e)
      }
    }
    if (typeof WidgetRegistry !== "undefined") {
      try {
        WidgetRegistry.init()
      } catch (e) {
        console.warn("WidgetRegistry init failed (degraded):", e)
      }
    }
  })

};

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "dataChanged") {
    refreshCollections();
  }
  if (message.type === "profileChanged") {
    chrome.storage.sync.get(["profile_signature"], (data) => {
      document.title = data.profile_signature || "新标签页";
    });
  }
  if (message.type === "tab:iconChanged") {
    chrome.storage.local.get(["extension_icon"], (data) => {
      if (data.extension_icon) applyFavicon(data.extension_icon);
    });
  }
  if (message.type === "tab:iconReset") {
    resetFavicon();
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    refreshCollections();
  }
});

// 初始加载签名到标题
chrome.storage.sync.get(["profile_signature"], (data) => {
  if (data.profile_signature) {
    document.title = data.profile_signature;
  }
});

// 初始加载自定义图标到 favicon
chrome.storage.local.get(["extension_icon"], (data) => {
  if (data.extension_icon) applyFavicon(data.extension_icon);
});

chrome.tabs.onUpdated.addListener(() => {
  $sections.updateTabsList();
  $sections.updateHistoryList();
});
chrome.tabs.onRemoved.addListener($sections.updateTabsList);
chrome.tabs.onMoved.addListener($sections.updateTabsList);
chrome.windows.onRemoved.addListener($sections.updateTabsList);

$sections.updateTabsList();
$sections.updateHistoryList();
