$sections.sectionTabsShow.addEventListener("click", (e) => {
  const className = e.target.className
  const tabId = parseInt(e.target.dataset.id)
  if (className.indexOf($sections.sectionTabsFavicon) !== -1 || className.indexOf($sections.sectionTabsItem) !== -1 || className.indexOf($sections.sectionTabsTitle) !== -1) {
    const windowId = $store.tabs[tabId].windowId
    chrome.windows.update(windowId, { focused: true });
    chrome.tabs.update(tabId, { active: true });
  } else if (className.indexOf($sections.sectionTabsClose) !== -1) {
    chrome.tabs.remove(tabId);
  }
})
$sections.sectionHistoryShow.addEventListener("click", (e) => {
  const className = e.target.className
  const historyId = parseInt(e.target.dataset.id)
  const url = $store.history[historyId]
  if (className.indexOf($sections.sectionHistoryClose) !== -1) {
    chrome.history.deleteUrl({ url: url }, function (result) {
      $sections.updateHistoryList()
    });
  } else {
    window.open(url)
  }
})
