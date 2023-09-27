const $sections = (() => {
  const sectionContainer = $el.__(".ipage-sections")
  const sectionTabsShow = $el.__(".section-tabs-show")
  const sectionHistoryShow = $el.__(".section-history-show")
  const sectionWindowItem = "section-window-item"
  const sectionTabsItem = "section-tab-item"
  const sectionTabsFavicon = "tab-item-favicon"
  const sectionTabsTitle = "tab-item-title"
  const sectionTabsClose = "tab-item-close"

  const sectionHistoryItem = "section-history-item"
  const sectionHistoryFavicon = "history-item-favicon"
  const sectionHistoryTitle = "history-item-title"
  const sectionHistoryClose = "history-item-close"

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
              faviconTemplate = `<div data-id="${tab.id}" class="icon-favicon ${sectionTabsFavicon}"></div>`
            }
            tabsList.push(`
            <div data-id="${tab.id}" class="${sectionTabsItem}">
              <div class="tab-item-prefixer">
                ${faviconTemplate}
                <div data-id="${tab.id}" class="${sectionTabsTitle}">${tab.title}</div>
              </div>
              <div data-id="${tab.id}" class="icon-close ${sectionTabsClose}"></div>
              <div class="tab-item-remark">${tab.title}</div>
            </div>
          `)
          }
        }))
        if (tabsList.length > 0) {
          windowsList.push(`
          <li data-id="${window.id}" class="${sectionWindowItem}">
            <div class="window-item-title">window${winInd + 1}</div>
            <div class="window-item-tabs">
              ${tabsList.join("")}
            </div>
          </li>
          `)
        }
      })
      sectionTabsShow.innerHTML = windowsList.join("")
      new Sortable(sectionTabsShow, {
        animation: 150,
        onUpdate: async function () {
          //顺序更新，修改浏览器tab顺序
          const sortedItems = this.toArray();

        }
      })
      const tabSectiona = $el.__all(".window-item-tabs")
      for (let tabSection of tabSectiona) {
        new Sortable(tabSection, {
          group: {
            name: 'linkShared',
            pull: 'clone',
            put: false // 不允许拖拽进这个列表
          },
          onUpdate: async function () {
            //顺序更新，修改浏览器tab顺序
            const sortedItems = this.toArray();
            sortedItems.forEach((v, i) => {
              chrome.tabs.move(parseInt(v), { index: i + 1 });
            })
          },
          animation: 150,
        })
      }
    })
  }
  const updateHistoryList = () => {

    chrome.history.search({ text: '', maxResults: 10 }, function (data) {
      $store.history = {}
      const hList = data.reduce((pre, cur) => {
        $store.history[cur.id] = cur.url
        let faviconTemplate = `<img data-id="${cur.id}" class="${sectionHistoryFavicon}" src="${cur.favIconUrl}" />`
        if (!cur.favIconUrl) {
          faviconTemplate = `<div data-id="${cur.id}" class="icon-favicon ${sectionHistoryFavicon}"></div>`
        }
        let hTemplate = `
        <div data-id="${cur.id}" class="${sectionHistoryItem}">
          <div class="history-item-prefixer">
            <div data-id="${cur.id}" class="${sectionHistoryTitle}">${cur.title || cur.url}</div>
          </div>
          <div data-id="${cur.id}" class="icon-close ${sectionHistoryClose}"></div>
        </div>
        `
        pre.push(hTemplate)
        return pre
      }, [])
      sectionHistoryShow.innerHTML = hList.join("")
    });
  }
  return {
    sectionContainer,
    sectionWindowItem,
    sectionTabsShow,
    sectionTabsItem,
    sectionTabsTitle,
    sectionTabsFavicon,
    sectionTabsClose,
    sectionHistoryShow,
    sectionHistoryItem,
    sectionHistoryFavicon,
    sectionHistoryTitle,
    sectionHistoryClose,
    updateTabsList,
    updateHistoryList
  }
})()