const $collections = (function () {
  let collectionsContainer = $el.__("#ipage-collections");

  const renderCollections = async () => {
    //collections渲染列表
    let render_arr = [];
    //拿到collection列表
    let collectionsRecords = await $apis.getCollectionsAndLinks()
    console.log(collectionsRecords)
    for (let ind = 0; ind < collectionsRecords.length; ind++) {
      let collection = collectionsRecords[ind]
      if (collection) {
        render_arr.push(`          <div class="collection">
        <div class="collection-head">
          <div>前端开发</div>
          <div class="collection-handle">
            <button><span class="icon-delete"></span></button>
            <button><span class="icon-edit-fill"></span></button>
            <button><span class="icon-add"></span></button>
          </div>
        </div>
        <div class="collection-links">
          <div class="collection-link">
            <div class="collection-link-name">链接名称</div>
            <div class="collection-link-remark">备注信息</div>
            <div class="collection-link-handle">
              <div class="icon-fill-delete link-tool-remove"></div>
              <div class="icon-fill-edit link-tool-edit"></div>
            </div>
          </div>
          <div class="collection-link">
            <div class="collection-link-name">链接名称</div>
            <div class="collection-link-remark">备注信息</div>
            <div class="collection-link-handle">
              <div class="icon-fill-delete link-tool-remove"></div>
              <div class="icon-fill-edit link-tool-edit"></div>
            </div>
          </div>
          <div class="collection-link">
            <div class="collection-link-name">链接名称</div>
            <div class="collection-link-remark">备注信息</div>
            <div class="collection-link-handle">
              <div class="icon-fill-delete link-tool-remove"></div>
              <div class="icon-fill-edit link-tool-edit"></div>
            </div>
          </div>
          <div class="collection-link">
            <div class="collection-link-name">链接名称</div>
            <div class="collection-link-remark">备注信息</div>
            <div class="collection-link-handle">
              <div class="icon-fill-delete link-tool-remove"></div>
              <div class="icon-fill-edit link-tool-edit"></div>
            </div>
          </div>
          <div class="collection-link">
            <div class="collection-link-name">链接名称</div>
            <div class="collection-link-remark">备注信息</div>
            <div class="collection-link-handle">
              <div class="icon-fill-delete link-tool-remove"></div>
              <div class="icon-fill-edit link-tool-edit"></div>
            </div>
          </div>
          <div class="collection-link">
            <div class="collection-link-name">链接名称</div>
            <div class="collection-link-remark">备注信息</div>
            <div class="collection-link-handle">
              <div class="icon-fill-delete link-tool-remove"></div>
              <div class="icon-fill-edit link-tool-edit"></div>
            </div>
          </div>
          <div class="collection-link">
            <div class="collection-link-name">链接名称</div>
            <div class="collection-link-remark">备注信息</div>
            <div class="collection-link-handle">
              <div class="icon-fill-delete link-tool-remove"></div>
              <div class="icon-fill-edit link-tool-edit"></div>
            </div>
          </div>
          <div class="collection-link">
            <div class="collection-link-name">链接名称</div>
            <div class="collection-link-remark">备注信息</div>
            <div class="collection-link-handle">
              <div class="icon-fill-delete link-tool-remove"></div>
              <div class="icon-fill-edit link-tool-edit"></div>
            </div>
          </div>
          <div class="collection-link">
            <div class="collection-link-name">链接名称</div>
            <div class="collection-link-remark">备注信息</div>
            <div class="collection-link-handle">
              <div class="icon-fill-delete link-tool-remove"></div>
              <div class="icon-fill-edit link-tool-edit"></div>
            </div>
          </div>
          <div class="collection-link">
            <div class="collection-link-name">链接名称</div>
            <div class="collection-link-remark">备注信息</div>
            <div class="collection-link-handle">
              <div class="icon-fill-delete link-tool-remove"></div>
              <div class="icon-fill-edit link-tool-edit"></div>
            </div>
          </div>
        </div>
      </div>`)
      }
    }
    collectionsContainer.innerHTML = render_arr.join('');
  }
  return {
    collectionsContainer,
    renderCollections
  };
})();
