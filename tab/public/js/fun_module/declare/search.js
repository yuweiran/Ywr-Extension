const $searchEles = (function () {
  // 搜索框
  const userContent = $el.__("#user-content");
  // 搜索引擎
  const engineItem = $el.__all(".engine-item");
  // 搜索按钮
  const btnRetrievalContent = $el.__("#btn-retrieval-content");
  const contentArea = $el.__(".content-area");

  //防抖
  const timer = null

  const handleAssociation = (response) => {
    console.log(response)
  }
  return {
    userContent,
    engineItem,
    btnRetrievalContent,
    contentArea,
    timer,
    handleAssociation
  };
})();
