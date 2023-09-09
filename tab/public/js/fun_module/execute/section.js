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

// $sections.sectionTabsShow.addEventListener("pointerdown", (e) => {
//   if (e.button !== 2) {
//     const className = e.target.className
//     const tabId = parseInt(e.target.dataset.id)
//     if (className.indexOf($sections.sectionTabsFavicon) !== -1 || className.indexOf($sections.sectionTabsItem) !== -1 || className.indexOf($sections.sectionTabsTitle) !== -1) {
//       const tab = $store.tabs[tabId]
//       const currentTab = document.createElement("div")
//       currentTab.className = "collection-link is-dragging"
//       currentTab.innerHTML = `
//       <div class="collection-link-name">${tab.title}</div>
//         <div class="collection-link-remark">${tab.title}</div>
//         <div class="collection-link-handle">
//           <div class="icon-fill-delete  ${$collections.btnLinkDelete}"></div>
//           <div class="icon-fill-edit ${$collections.btnLinkEdit}"></div>
//         </div>`
//       currentTab.style.transform = `translate(${e.pageX}px,${e.pageY}px)`
//       document.body.appendChild(currentTab)
//       const updateNodePosition = (e) => {
//         currentTab.style.transform = `translate(${e.pageX}px,${e.pageY}px)`
//       }
//       const clearListener = (e) => {
//         document.body.removeEventListener("pointermove", updateNodePosition)
//         currentTab.parentNode.removeChild(currentTab)
//         document.body.removeEventListener("pointerup", clearListener)
//       }
//       document.body.addEventListener("pointermove", updateNodePosition)
//       document.body.addEventListener("pointerup", clearListener)
//     }
//   }
// })