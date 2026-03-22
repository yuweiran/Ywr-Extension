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
  // 联想词面板
  const suggestionList = $el.__("#suggestion-list");
  let activeIndex = -1;
  let originalInput = "";
  let cachedSuggestions = [];

  const initEngineIcon = (engine) => {
    engineBtn.innerHTML = `<span class="icon-${engine}"></span>`;
  };

  const renderSuggestions = (items) => {
    cachedSuggestions = items;
    activeIndex = -1;
    if (items.length === 0) {
      hideSuggestions();
      return;
    }
    suggestionList.innerHTML = items
      .map((text, i) => `<div class="suggestion-item" data-index="${i}">${text}</div>`)
      .join("");
    showSuggestions();
  };

  const showSuggestions = () => {
    suggestionList.classList.add("is-visible");
  };

  const hideSuggestions = () => {
    suggestionList.classList.remove("is-visible");
    activeIndex = -1;
  };

  const highlightItem = (index) => {
    const items = suggestionList.querySelectorAll(".suggestion-item");
    items.forEach((item) => item.classList.remove("is-active"));
    activeIndex = index;
    if (index >= 0 && index < items.length) {
      items[index].classList.add("is-active");
      userContent.value = cachedSuggestions[index];
    } else {
      userContent.value = originalInput;
    }
  };

  const getActiveText = () => {
    if (activeIndex >= 0 && activeIndex < cachedSuggestions.length) {
      return cachedSuggestions[activeIndex];
    }
    return null;
  };

  return {
    userContent,
    engineItem,
    btnRetrievalContent,
    contentArea,
    engineBtn,
    suggestionList,
    initEngineIcon,
    renderSuggestions,
    showSuggestions,
    hideSuggestions,
    highlightItem,
    getActiveText,
    get activeIndex() { return activeIndex; },
    set activeIndex(v) { activeIndex = v; },
    get originalInput() { return originalInput; },
    set originalInput(v) { originalInput = v; },
    get cachedSuggestions() { return cachedSuggestions; },
  };
})();
