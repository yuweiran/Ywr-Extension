const $collections = (function () {
  const collectionsContainer = $el.__("#ipage-collections");
  const btnLinkDelete = "link-tool-remove"
  const btnLinkEdit = "link-tool-edit"
  const btnLinkAdd = "link-tool-add"
  const btnCollectionDelete = "link-collection-delete"
  const btnCollectionEdit = "link-collection-edit"
  const btnAddCollecation = $el.__(".tab-btn-add-collection")
  let collections = []

  const getCollections = async () => {
    collections = await $apis.getCollectionsAndLinks()
  }
  const renderCollections = async () => {
    await getCollections()
    //collections渲染列表
    let render_arr = []
    //得保证有order
    for (let ind = 0; ind < collections.length; ind++) {
      let collection = collections[ind]
      if (collection) {
        render_arr.push(`<div data-id="${collection.id}" class="collection">
        <div class="collection-head">
          <div>${collection.name}</div>
          <div class="collection-handle">
            <button><span data-id="${collection.id}" class="icon-delete ${btnCollectionDelete}"></span></button>
            <button><span data-id="${collection.id}" class="icon-edit-fill ${btnCollectionEdit}"></span></button>
            <button><span data-id="${collection.id}" class="icon-add ${btnLinkAdd}"></span></button>
          </div>
        </div>
        <div data-id="${collection.id}" class="collection-links">
          ${collection.children.map(link => {
          let iconTemplate = `<span class="icon-favicon collection-link-icon"></span>`
          if (link.icon) {
            iconTemplate = `<img class="collection-link-icon" src="${link.icon}" />`
          }
          return `
            <a data-id="${link.id}" class= "collection-link" href="${link.url}" target="_blank">
              <div class="collection-link-name">
                ${iconTemplate}<span class="collection-link-title">${link.name}</span>
              </div>
              <div class="collection-link-remark">${link.remark}</div>
              <div class="collection-link-handle">
                <div data-id="${link.id}"  class="icon-fill-delete  ${btnLinkDelete}"></div>
                <div data-id="${link.id}"  class="icon-fill-edit ${btnLinkEdit}"></div>
              </div>
            </a>
            `
        }).join('')
          }
        </div >
      </div > `)
      }
    }
    collectionsContainer.innerHTML = render_arr.join('');
    new Sortable(collectionsContainer, {
      animation: 150,
      onUpdate: async function () {
        //同一组类排序
        const sortedItems = this.toArray();
        for (let item in sortedItems) {
          await $apis.collection.edit({
            order: parseInt(item),
            id: parseInt(sortedItems[item])
          })
        }
      }
    })
    const linksSections = $el.__all(".collection-links")
    for (let linksSection of linksSections) {
      linksSection
      new Sortable(linksSection, {
        animation: 150,
        group: {
          name: 'linkShared',
        },
        onAdd: async function (ev) {
          const targetEl = this.el;
          const draggingEl = ev.item
          const collectionId = parseInt(targetEl.dataset.id)
          const sortedItems = this.toArray();
          if (ev.from.className !== "collection-links") {
            const id = draggingEl.dataset.id//当前的tab
            const link = $store.tabs[id]
            const newLink = document.createElement("a")
            newLink.className = "collection-link"
            newLink.href = link.url
            newLink.target = "_blank"
            newLink.innerHTML =
              `<div class="collection-link-name">${link.title}</div>
                <div class="collection-link-remark">${link.title}</div>
                <div class="collection-link-handle">
                  <div  class="icon-fill-delete  ${btnLinkDelete}"></div>
                  <div  class="icon-fill-edit ${btnLinkEdit}"></div>
                </div>`
            // 获取拖拽后的位置
            const newIndex = Array.from(targetEl.children).indexOf(draggingEl);
            // 使用 insertBefore 将元素插入到目标组的特定位置
            const referenceElement = targetEl.children[newIndex + 1];
            targetEl.insertBefore(newLink, referenceElement);
            draggingEl.parentNode.removeChild(draggingEl)
            //新加一项， 更新数据库,涉及到的order都需要更新，所有link数据都要更新，如何优化
            for (let item in sortedItems) {
              if (parseInt(item) === newIndex) {
                await $apis.link.add({
                  order: newIndex,
                  name: link.title,
                  remark: link.title,
                  url: link.url,
                  collection: collectionId,
                  icon: link.favIconUrl || ''
                })
              } else {
                await $apis.link.edit({
                  order: parseInt(item),
                  id: parseInt(sortedItems[item])
                })
              }
            }
            renderCollections()
          } else {
            const linkId = draggingEl.dataset.id
            for (let item in sortedItems) {
              if (sortedItems[item] === linkId) {
                await $apis.link.edit({
                  order: parseInt(item),
                  id: parseInt(sortedItems[item]),
                  collection: collectionId
                })
              } else {
                await $apis.link.edit({
                  order: parseInt(item),
                  id: parseInt(sortedItems[item])
                })
              }
            }
          }
        },
        onUpdate: async function () {
          //同一组类排序
          const sortedItems = this.toArray();
          for (let item in sortedItems) {
            await $apis.link.edit({
              order: parseInt(item),
              id: parseInt(sortedItems[item])
            })
          }
        }
      })

    }
  }
  const getCollectionsMaxOrder = async () => {
    return collections[collections.length - 1].ordr || 0
  }
  return {
    collectionsContainer,
    btnLinkDelete,
    btnLinkEdit,
    btnAddCollecation,
    btnLinkAdd,
    btnCollectionDelete,
    btnCollectionEdit,
    renderCollections,
    collections,
    getCollectionsMaxOrder
  };
})();
