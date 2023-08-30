const $collections = (function () {
  const collectionsContainer = $el.__("#ipage-collections");
  const btnLinkDelete = "link-tool-remove"
  const btnLinkEdit = "link-tool-edit"

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
            <button><span class="icon-delete"></span></button>
            <button><span class="icon-edit-fill"></span></button>
            <button><span class="icon-add"></span></button>
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
    renderCollections
  };
})();
