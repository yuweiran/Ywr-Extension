const $collections = (function () {
  const collectionsContainer = $el.__("#ipage-collections");
  const btnLinkDelete = "link-tool-remove";
  const btnLinkEdit = "link-tool-edit";
  const btnLinkAdd = "link-tool-add";
  const btnCollectionDelete = "link-collection-delete";
  const btnCollectionEdit = "link-collection-edit";
  const btnAddCollection = $el.__(".tab-btn-add-collection");
  let collections = [];

  const batchUpdateCollectionOrder = async (sortedItems) => {
    const tasks = sortedItems.map((id, order) =>
      $apis.collection.edit({ order, id: parseInt(id) })
    );
    await Promise.all(tasks);
  };
  const batchUpdateLinkOrder = async (sortedItems, extra = {}) => {
    const tasks = sortedItems.map((id, order) =>
      $apis.link.edit({ order, id: parseInt(id), ...extra })
    );
    await Promise.all(tasks);
  };
  const getCollections = async () => {
    collections = await $apis.getCollectionsAndLinks();
  };
  const escapeHtml = (str) => {
    if (str === undefined || str === null) return "";
    return String(str).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));
  };

  const getDomainOrRemark = (link) => {
    if (link.remark && link.remark.trim() && link.remark.trim() !== link.name.trim()) {
      return link.remark.trim();
    }
    try {
      const u = new URL(link.url);
      return u.hostname.replace(/^www\./, "");
    } catch (e) {
      return link.remark || link.url || "";
    }
  };

  const renderCollections = async () => {
    await getCollections();
    //collections渲染列表
    let render_arr = [];
    if (!collections || collections.length === 0) {
      collectionsContainer.innerHTML = `
        <div class="collections-empty-state">
          <div class="collections-empty-icon">✦</div>
          <div class="collections-empty-title">还没有任何收藏分组</div>
          <div class="collections-empty-desc">点击右上角「新建分组」创建你的第一个常用网站集合，或从右侧活跃标签页拖入链接</div>
        </div>
      `;
      return;
    }
    //得保证有order
    for (let ind = 0; ind < collections.length; ind++) {
      let collection = collections[ind];
      if (collection) {
        const count = Array.isArray(collection.children) ? collection.children.length : 0;
        render_arr.push(`<div data-id="${collection.id}" class="collection">
        <div class="collection-head">
          <div class="collection-title-group">
            <span class="collection-title-text">${escapeHtml(collection.name)}</span>
            <span class="collection-count">${count}</span>
          </div>
          <div class="collection-handle">
            <button title="添加链接" data-id="${collection.id}" class="${btnLinkAdd}"><span data-id="${
              collection.id
            }" class="icon-add ${btnLinkAdd}"></span></button>
            <button title="编辑分组" data-id="${collection.id}" class="${btnCollectionEdit}"><span data-id="${
              collection.id
            }" class="icon-edit-fill ${btnCollectionEdit}"></span></button>
            <button title="删除分组" data-id="${collection.id}" class="btn-collection-danger ${btnCollectionDelete}"><span data-id="${
              collection.id
            }" class="icon-delete ${btnCollectionDelete}"></span></button>
          </div>
        </div>
        <div data-id="${collection.id}" class="collection-links${count === 0 ? " is-empty" : ""}">
          ${collection.children
            .map((link) => {
              let iconTemplate = `<span class="icon-favicon collection-link-icon"></span>`;
              if (link.icon) {
                iconTemplate = `<img class="collection-link-icon" src="${escapeHtml(link.icon)}" alt="" onerror="this.outerHTML='<span class=\\'icon-favicon collection-link-icon\\'></span>'" />`;
              }
              const subText = getDomainOrRemark(link);
              return `
            <a data-id="${link.id}" class="collection-link" href="${escapeHtml(link.url)}" target="_blank" title="${escapeHtml(link.name)}${link.remark ? " — " + escapeHtml(link.remark) : ""}">
              <div class="collection-link-name">
                ${iconTemplate}
                <div class="collection-link-meta">
                  <span class="collection-link-title">${escapeHtml(link.name)}</span>
                  <div class="collection-link-remark">${escapeHtml(subText)}</div>
                </div>
              </div>
              <div class="collection-link-handle">
                <div data-id="${link.id}" title="编辑链接" class="icon-fill-edit ${btnLinkEdit}"></div>
                <div data-id="${link.id}" title="删除链接" class="icon-fill-delete ${btnLinkDelete}"></div>
              </div>
            </a>
            `;
            })
            .join("")}
        </div>
      </div>`);
      }
    }
    collectionsContainer.innerHTML = render_arr.join("");
    new Sortable(collectionsContainer, {
      animation: 150,
      onUpdate: async function () {
        //同一组类排序
        const sortedItems = this.toArray();
        await batchUpdateCollectionOrder(sortedItems);
      },
    });
    const linksSections = $el.__all(".collection-links");
    for (let linksSection of linksSections) {
      new Sortable(linksSection, {
        animation: 150,
        group: {
          name: "linkShared",
        },
        onAdd: async function (ev) {
          const targetEl = this.el;
          const draggingEl = ev.item;
          const collectionId = parseInt(targetEl.dataset.id);
          const sortedItems = this.toArray();
          if (ev.from.className !== "collection-links") {
            const id = draggingEl.dataset.id; //当前的tab
            const link = $store.tabs[id];
            const newIndex = Array.from(targetEl.children).indexOf(draggingEl);
            //新加一项， 更新数据库,涉及到的order都需要更新，所有link数据都要更新，如何优化
            const tasks = sortedItems.map((itemId, order) => {
              if (order === newIndex) {
                return $apis.link.add({
                  order,
                  name: link.title,
                  remark: link.title,
                  url: link.url,
                  collection: collectionId,
                  icon: link.favIconUrl || "",
                });
              }
              return $apis.link.edit({
                order,
                id: parseInt(itemId),
              });
            });
            await Promise.all(tasks);
            renderCollections();
          } else {
            const linkId = draggingEl.dataset.id;
            const tasks = sortedItems.map((itemId, order) => {
              if (itemId === linkId) {
                return $apis.link.edit({
                  order,
                  id: parseInt(itemId),
                  collection: collectionId,
                });
              }
              return $apis.link.edit({
                order,
                id: parseInt(itemId),
              });
            });
            await Promise.all(tasks);
          }
        },
        onUpdate: async function () {
          //同一组类排序
          const sortedItems = this.toArray();
          await batchUpdateLinkOrder(sortedItems);
        },
      });
    }
  };
  const getCollectionsMaxOrder = async () => {
    return collections.length > 0
      ? collections[collections.length - 1].order
      : 0;
  };
  return {
    collectionsContainer,
    btnLinkDelete,
    btnLinkEdit,
    btnAddCollection,
    btnLinkAdd,
    btnCollectionDelete,
    btnCollectionEdit,
    renderCollections,
    collections,
    getCollectionsMaxOrder,
  };
})();
