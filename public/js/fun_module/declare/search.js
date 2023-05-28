const $searchEles = (function () {
  let userContent = $el.__("#user-content");
  let engineItem = $el.__all(".engine-item");
  let btnRetrievalContent = $el.__("#btn-retrieval-content");
  let contentArea = $el.__(".content-area");
  return {
    userContent,
    engineItem,
    btnRetrievalContent,
    contentArea,
  };
})();
