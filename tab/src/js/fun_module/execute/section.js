$sections.sectionTabsShow.addEventListener("click", (e) => {
  const className = e.target.className;
  const tabId = parseInt(e.target.dataset.id);
  if (
    className.indexOf($sections.sectionTabsFavicon) !== -1 ||
    className.indexOf($sections.sectionTabsItem) !== -1 ||
    className.indexOf($sections.sectionTabsTitle) !== -1
  ) {
    const windowId = $store.tabs[tabId].windowId;
    chrome.windows.update(windowId, { focused: true });
    chrome.tabs.update(tabId, { active: true });
  } else if (className.indexOf($sections.sectionTabsClose) !== -1) {
    chrome.tabs.remove(tabId);
  }
});
$sections.sectionHistoryShow.addEventListener("click", (e) => {
  const className = e.target.className || "";
  const targetNode = e.target.closest("[data-id]");
  const historyId =
    targetNode && targetNode.dataset ? targetNode.dataset.id : null;
  const url = historyId ? $store.history[historyId] : null;
  if (!historyId || !url) {
    return;
  }
  if (className.indexOf($sections.sectionHistoryClose) !== -1) {
    $sections.deleteHistoryById(historyId);
  } else {
    window.open(url);
  }
});

$sections.historyPagePrevEle?.addEventListener("click", () => {
  $sections.setHistoryPage($sections.historyPageState.currentPage - 1);
});

$sections.historyPageNextEle?.addEventListener("click", () => {
  $sections.setHistoryPage($sections.historyPageState.currentPage + 1);
});

$sections.sectionHistoryClearAllEle?.addEventListener("click", () => {
  const ok = window.confirm("Are you sure to clear all history?");
  if (!ok) {
    return;
  }
  $sections.clearHistoryAll();
});
