const $sections = (() => {
  const sectionContainer = $el.__(".ipage-sections");
  const sectionTabsShow = $el.__(".section-tabs-show");
  const sectionHistoryShow = $el.__(".section-history-show");
  const sectionHistoryViewport = $el.__(".section-history-viewport");
  const sectionWindowItem = "section-window-item";
  const sectionTabsItem = "section-tab-item";
  const sectionTabsFavicon = "tab-item-favicon";
  const sectionTabsTitle = "tab-item-title";
  const sectionTabsClose = "tab-item-close";

  const sectionHistoryItem = "section-history-item";
  const sectionHistoryFavicon = "history-item-favicon";
  const sectionHistoryTitle = "history-item-title";
  const sectionHistoryClose = "history-item-close";
  const sectionHistoryClearAll = "section-history-clear-all";
  const historyPageBtnPrev = "history-page-prev";
  const historyPageBtnNext = "history-page-next";

  const sectionHistoryClearAllEle = $el.__(`.${sectionHistoryClearAll}`);
  const historyPagePrevEle = $el.__(`.${historyPageBtnPrev}`);
  const historyPageNextEle = $el.__(`.${historyPageBtnNext}`);
  const historyPageInfoEle = $el.__(".history-page-info");

  const historyMaxCount = 100;
  const historyPageState = {
    pageSize: 20,
    currentPage: 1,
    totalPages: 1,
  };
  let historyList = [];

  const escapeHtml = (text) => {
    if (text === undefined || text === null) return "";
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  };

  const syncHistoryPageState = () => {
    const totalCount = historyList.length;
    historyPageState.totalPages = Math.max(
      1,
      Math.ceil(totalCount / historyPageState.pageSize),
    );
    historyPageState.currentPage = Math.min(
      historyPageState.currentPage,
      historyPageState.totalPages,
    );
    historyPageState.currentPage = Math.max(1, historyPageState.currentPage);
  };

  const updateHistoryPageInfo = () => {
    if (!historyPageInfoEle || !historyPagePrevEle || !historyPageNextEle) return;
    historyPageInfoEle.innerText = `${historyPageState.currentPage} / ${historyPageState.totalPages}`;
    historyPagePrevEle.disabled = historyPageState.currentPage <= 1;
    historyPageNextEle.disabled =
      historyPageState.currentPage >= historyPageState.totalPages;
  };

  const renderHistoryPage = () => {
    const startIndex =
      (historyPageState.currentPage - 1) * historyPageState.pageSize;
    const historyInCurrentPage = historyList.slice(
      startIndex,
      startIndex + historyPageState.pageSize,
    );

    if (historyInCurrentPage.length === 0) {
      sectionHistoryShow.innerHTML = `<li class="section-history-empty">暂无最近浏览记录</li>`;
      updateHistoryPageInfo();
      return;
    }

    const hList = historyInCurrentPage.reduce((pre, cur) => {
      let faviconTemplate = `<img data-id="${cur.id}" class="${sectionHistoryFavicon}" src="${cur.favIconUrl}" />`;
      if (!cur.favIconUrl) {
        faviconTemplate = `<div data-id="${cur.id}" class="icon-favicon ${sectionHistoryFavicon}"></div>`;
      }
      const displayText = cur.title || cur.url || "(untitled)";
      const safeDisplayText = escapeHtml(displayText);
      const safeTitle = escapeHtml(displayText);
      const hTemplate = `
        <li data-id="${cur.id}" class="${sectionHistoryItem}">
          <div class="history-item-prefixer">
            ${faviconTemplate}
            <div data-id="${cur.id}" class="${sectionHistoryTitle}" title="${safeTitle}">${safeDisplayText}</div>
          </div>
          <div data-id="${cur.id}" class="icon-close ${sectionHistoryClose}"></div>
        </li>
      `;
      pre.push(hTemplate);
      return pre;
    }, []);

    sectionHistoryShow.innerHTML = hList.join("");
    if (sectionHistoryViewport) {
      sectionHistoryViewport.scrollTop = 0;
    }
    updateHistoryPageInfo();
  };

  const setHistoryPage = (nextPage) => {
    historyPageState.currentPage = nextPage;
    syncHistoryPageState();
    renderHistoryPage();
  };

  const updateTabsList = () => {
    $store.tabs = {};
    if (typeof chrome === "undefined" || !chrome.windows?.getAll) {
      if (sectionTabsShow) {
        sectionTabsShow.innerHTML = `<li class="section-history-empty">暂无活跃标签页</li>`;
      }
      return;
    }
    chrome.windows.getAll({ populate: true }, (windows) => {
      const windowsList = [];
      windows.forEach((window, winInd) => {
        const tabs = window.tabs;
        const tabsList = [];
        tabs.forEach((tab) => {
          $store.tabs[tab.id] = tab;
          if (
            !(
              tab.favIconUrl && tab.favIconUrl.startsWith("chrome-extension://")
            )
          ) {
            let faviconTemplate = `<img data-id="${tab.id}" class="${sectionTabsFavicon}" src="${tab.favIconUrl}" />`;
            if (!tab.favIconUrl) {
              faviconTemplate = `<div data-id="${tab.id}" class="icon-favicon ${sectionTabsFavicon}"></div>`;
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
          `);
          }
        });
        if (tabsList.length > 0) {
          windowsList.push(`
          <li data-id="${window.id}" class="${sectionWindowItem}">
            <div class="window-item-title">窗口 ${winInd + 1}</div>
            <div class="window-item-tabs">
              ${tabsList.join("")}
            </div>
          </li>
          `);
        }
      });
      sectionTabsShow.innerHTML = windowsList.join("");
      new Sortable(sectionTabsShow, {
        animation: 150,
        onUpdate: async function () {
          //顺序更新，修改浏览器tab顺序
          const sortedItems = this.toArray();
        },
      });
      const tabSections = $el.__all(".window-item-tabs");
      for (let tabSection of tabSections) {
        new Sortable(tabSection, {
          group: {
            name: "linkShared",
            pull: "clone",
            put: false, // 不允许拖拽进这个列表
          },
          onUpdate: async function () {
            //顺序更新，修改浏览器tab顺序
            const sortedItems = this.toArray();
            sortedItems.forEach((v, i) => {
              chrome.tabs.move(parseInt(v), { index: i + 1 });
            });
          },
          animation: 150,
        });
      }
    });
  };
  const updateHistoryList = () => {
    if (typeof chrome === "undefined" || !chrome.history?.search) {
      historyList = [];
      syncHistoryPageState();
      renderHistoryPage();
      return;
    }
    chrome.history.search(
      { text: "", maxResults: historyMaxCount },
      function (data) {
        $store.history = {};
        historyList = data.slice(0, historyMaxCount);
        historyList.forEach((cur) => {
          $store.history[cur.id] = cur.url;
        });
        syncHistoryPageState();
        renderHistoryPage();
      },
    );
  };

  const deleteHistoryById = (historyId) => {
    const url = $store.history[historyId];
    if (!url) return;
    chrome.history.deleteUrl({ url: url }, function () {
      updateHistoryList();
    });
  };

  const clearHistoryAll = () => {
    chrome.history.deleteAll(function () {
      updateHistoryList();
    });
  };

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
    sectionHistoryClearAll,
    historyPageBtnPrev,
    historyPageBtnNext,
    sectionHistoryClearAllEle,
    historyPagePrevEle,
    historyPageNextEle,
    historyPageInfoEle,
    updateTabsList,
    updateHistoryList,
    setHistoryPage,
    historyPageState,
    deleteHistoryById,
    clearHistoryAll,
  };
})();
