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

window.onload = () => {
  //搜索引擎
  if (!localStorage.getItem("engine")) {
    localStorage.setItem("engine", "baidu");
  }
  const engine = localStorage.getItem("engine");
  $searchEles.initEngineIcon(engine)

  if (!localStorage.getItem("is-aside-fold")) {
    localStorage.setItem("is-aside-fold", "0");
  }
  $aside.initFoldState()
  document.body.addEventListener("click", () => {
    $dropdown.hidden()
  }, true)
  initIndexedDB().then((db) => {
    $indexedDB = db
    initIndexedDBFunction(db, $indexedDBModel).then(() => {
      $collections.renderCollections()
    })
  })

};

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "dataChanged") {
    $collections.renderCollections();
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
  $sections.updateTabsList()
  $sections.updateHistoryList()
});
chrome.tabs.onRemoved.addListener($sections.updateTabsList);
chrome.tabs.onMoved.addListener($sections.updateTabsList);
chrome.windows.onRemoved.addListener($sections.updateTabsList);
