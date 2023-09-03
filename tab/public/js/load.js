//背景图、搜索引擎、快捷链接、字体颜色、
//input[range]颜色、个签渲染、鼠标左键点击效果
/*------------------------------快捷链接区---------------------------------*/
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
  chrome.tabs.onCreated.addListener(() => {
    console.log('nih')
  })
  chrome.tabs.onActivated.addListener(function (activeTab) {
    $store.tabs = {}
    chrome.tabs.query({}, function (tabs) {
      console.log(tabs)
      const activeTabDetail = (tabs.filter(t => t.id === activeTab.tabId))[0]
      if (activeTabDetail.favIconUrl && activeTabDetail.favIconUrl.startsWith("chrome-extension://")) {
        //当前的tab是扩展的tab页
        const tabsList = []
        tabs.forEach((tab => {
          if (!(tab.favIconUrl && tab.favIconUrl.startsWith("chrome-extension://"))) {
            let faviconTemplate = `<img class="tab-item-favicon" src="${tab.favIconUrl}" />`
            if (!tab.favIconUrl) {
              faviconTemplate = `<div class="tab-item-favicon">${tab.title[0]}</div>`
            }
            tabsList.push(`
            <li class="section-tab-item">
              ${faviconTemplate}<div class="tab-item-title">${tab.title}</div><div class="icon-close tab-item-close"></div>
            </li>
          `)
          }
        }))
        $sections.sectionTabsShow.innerHTML = tabsList.join("")
      }
    });
    //activeTab是tab标签页，则更新tab列表数据
  });
};
