const $collections = (function () {
  const collectionsContainer = $el.__("#ipage-collections");
  const btnLinkDelete = "link-tool-remove"
  const btnLinkEdit = "link-tool-edit"
  const btnLinkAdd = "link-tool-add"
  const btnCollectionDelete = "link-collection-delete"
  const btnCollectionEdit = "link-collection-edit"
  const btnAddCollecation = $el.__(".tab-btn-add-collection")

  const renderCollections = async () => {
    //collections渲染列表
    let render_arr = [];
    //拿到collection列表
    let collectionsRecords = await $apis.getCollectionsAndLinks()

    for (let ind = 0; ind < collectionsRecords.length; ind++) {
      let collection = collectionsRecords[ind]
      if (collection) {
        render_arr.push(`<div class="collection">
        <div class="collection-head">
          <div>${collection.name}</div>
          <div class="collection-handle">
            <button><span data-id="${collection.id}" class="icon-delete ${btnCollectionDelete}"></span></button>
            <button><span data-id="${collection.id}" class="icon-edit-fill ${btnCollectionEdit}"></span></button>
            <button><span data-id="${collection.id}" class="icon-add ${btnLinkAdd}"></span></button>
          </div>
        </div>
        <div class="collection-links">
          ${collection.children.map(link => {
          return `
            <div div class= "collection-link" >
            <div class="collection-link-name">${link.name}</div>
            <div class="collection-link-remark">${link.remark}</div>
            <div class="collection-link-handle">
              <div data-id="${link.id}"  class="icon-fill-delete  ${btnLinkDelete}"></div>
              <div data-id="${link.id}"  class="icon-fill-edit ${btnLinkEdit}"></div>
            </div>
          </div >
            `
        }).join('')
          }
        </div >
      </div > `)
      }
    }
    collectionsContainer.innerHTML = render_arr.join('');
  }
  return {
    collectionsContainer,
    btnLinkDelete,
    btnLinkEdit,
    btnAddCollecation,
    btnLinkAdd,
    btnCollectionDelete,
    btnCollectionEdit,
    renderCollections
  };
})();
