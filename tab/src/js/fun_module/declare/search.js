const $searchEles = (function () {
  // 搜索框
  const userContent = $el.__("#user-content");
  //
  const engineBtn = $el.__("#btn-retrieval-engine");
  // 搜索引擎
  const engineItem = $el.__all(".engine-item");
  // 搜索按钮
  const btnRetrievalContent = $el.__("#btn-retrieval-content");
  const contentArea = $el.__(".content-area");

  const handleAssociation = (response) => {
    console.log(response);
  };
  const initEngineIcon = (engine) => {
    engineBtn.innerHTML = `<span class="icon-${engine}"></span>`;
  };

  return {
    userContent,
    engineItem,
    btnRetrievalContent,
    contentArea,
    engineBtn,
    handleAssociation,
    initEngineIcon,
  };
})();
