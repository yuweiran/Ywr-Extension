window.onload = () => {
  //搜索引擎
  if (!localStorage.engine) {
    localStorage.setItem("engine", "baidu");
  }
  const engine = localStorage.getItem("engine");
  $searchEles.initEngineIcon(engine)
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

chrome.tabs.onUpdated.addListener(() => {
  $sections.updateTabsList()
  $sections.updateHistoryList()
});
chrome.tabs.onRemoved.addListener($sections.updateTabsList);
chrome.tabs.onMoved.addListener($sections.updateTabsList);
chrome.windows.onRemoved.addListener($sections.updateTabsList);
