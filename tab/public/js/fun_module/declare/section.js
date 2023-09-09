$sections = (() => {
  const sectionContainer = $el.__(".ipage-sections")
  const sectionTabsShow = $el.__(".section-tabs-show")
  const sectionWindowItem = "section-window-item"
  const sectionTabsItem = "section-tab-item"
  const sectionTabsFavicon = "tab-item-favicon"
  const sectionTabsTitle = "tab-item-title"
  const sectionTabsClose = "tab-item-close"

  const updateTabsList = () => {
    $store.tabs = {}
    chrome.windows.getAll({ populate: true }, (windows) => {
      const windowsList = []
      windows.forEach((window, winInd) => {
        const tabs = window.tabs
        const tabsList = []
        tabs.forEach((tab => {
          $store.tabs[tab.id] = tab
          if (!(tab.favIconUrl && tab.favIconUrl.startsWith("chrome-extension://"))) {
            let faviconTemplate = `<img data-id="${tab.id}" class="${sectionTabsFavicon}" src="${tab.favIconUrl}" />`
            if (!tab.favIconUrl) {
              faviconTemplate = `<div data-id="${tab.id}" class="${sectionTabsFavicon}">${tab.title[0]}</div>`
            }
            tabsList.push(`
            <div data-id="${tab.id}" class="${sectionTabsItem}">
              ${faviconTemplate}<div data-id="${tab.id}" class="${sectionTabsTitle}">${tab.title}</div><div data-id="${tab.id}" class="icon-close ${sectionTabsClose}"></div>
            </div>
          `)
          }
        }))
        windowsList.push(`
          <li class="${sectionWindowItem}">
            <div class="window-item-title">WINDOW${winInd + 1}</div>
            <div class="window-item-tabs">
              ${tabsList.join("")}
            </div>
          </li>
        `)
      })
      sectionTabsShow.innerHTML = windowsList.join("")
      new Sortable(sectionTabsShow, {
        animation: 150,
      })
      const tabSectiona = $el.__all(".window-item-tabs")
      for (let tabSection of tabSectiona) {
        new Sortable(tabSection, {
          group: {
            name: 'linkShared',
            pull: 'clone',
            put: false // 不允许拖拽进这个列表
          },
          animation: 150,
        })
      }
    })
  }
  return {
    sectionContainer,
    sectionWindowItem,
    sectionTabsShow,
    sectionTabsItem,
    sectionTabsTitle,
    sectionTabsFavicon,
    sectionTabsClose,
    updateTabsList
  }
})()