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
    collections.sort((a, b) => a.order - b.order)
  }
  const renderCollections = async () => {
    await getCollections()
    //collections渲染列表
    let render_arr = []
    //得保证有order
    for (let ind = 0; ind < collections.length; ind++) {
      let collection = collections[ind]
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
            <a class= "collection-link" href="${link.url}" target="_blank">
              <div class="collection-link-name">${link.name}</div>
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
    })
    const linksSections = $el.__all(".collection-links")
    for (let linksSection of linksSections) {
      linksSection
      new Sortable(linksSection, {
        animation: 150,
        group: {
          name: 'linkShared',
          pull: 'clone',
        },
      })
    }
  }
  const getMaxOrder = async () => {
    return collections[collections.length - 1].order || 0
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
    getMaxOrder
  };
})();
