$sections.sectionTabsShow.addEventListener("click", (e) => {
  const className = e.target.className
  const tabId = parseInt(e.target.dataset.id)
  if (className.indexOf($sections.sectionTabsFavicon) !== -1 || className.indexOf($sections.sectionTabsItem) !== -1 || className.indexOf($sections.sectionTabsTitle) !== -1) {
    const windowId = $store.tabs[tabId].windowId
    chrome.windows.update(windowId, { focused: true });
    chrome.tabs.update(tabId, { active: true });
  } else if (e.target.className.indexOf($sections.sectionTabsClose) !== -1) {
    chrome.tabs.remove(tabId);
  }
})