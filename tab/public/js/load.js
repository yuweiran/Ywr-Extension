window.onload = () => {
  //搜索引擎
  if (!localStorage.engine) {
    localStorage.setItem("engine", "baidu");
  }
  let selectedEngine = localStorage.getItem("engine");
  $searchEles.engineItem.forEach((v, i) => {
    v.getAttribute("data-engine") === selectedEngine
      ? v.classList.add("selected-engine-item")
      : v.classList.remove("selected-engine-item");
  });
  initIndexedDB().then((db) => {
    $indexedDB = db
    initIndexedDBFunction(db, $indexedDBModel).then(() => {
      $collections.renderCollections()
    })
  })
};

chrome.tabs.onUpdated.addListener($sections.updateTabsList);
chrome.tabs.onRemoved.addListener($sections.updateTabsList);
chrome.tabs.onMoved.addListener($sections.updateTabsList);
chrome.windows.onRemoved.addListener($sections.updateTabsList);