/**
 * 引擎切换
 * 联想词点击跳转
 * enter直接启动搜索
 * ↓和↑键切换联想词
 * 点击按钮实现搜索
 * 百度联想词 (Service Worker 中转)
 */

/* --------------------------------- 切换搜素引擎  ------------------------------------------- */

const retrieveContent = (content) => {
  let engine = localStorage.getItem("engine");
  let base_url = "";
  const engineReflect = {
    google: "https://www.google.com/search?q=",
    baidu: "https://www.baidu.com/s?ie=UTF-8&wd=",
    bing: "https://cn.bing.com/search?q=",
  };
  base_url = engineReflect[engine];
  $searchEles.userContent.value = "";
  $searchEles.hideSuggestions();
  window.open(base_url + content);
};

$searchEles.contentArea.addEventListener("mouseover", (e) => {
  if (e.target.classList[0] === "engine-item") {
    e.target.onclick = () => {
      let index = parseFloat(e.target.dataset.index);
      $searchEles.engineItem.forEach((v, i) => {
        if (index === i) {
          v.classList.add("selected-engine-item");
          let engine = v.getAttribute("data-engine");
          localStorage.setItem("engine", engine);
        } else {
          v.classList.remove("selected-engine-item");
        }
      });
    };
  }
});

//执行检索
$searchEles.btnRetrievalContent.addEventListener("click", (e) => {
  if ($searchEles.userContent.value.length > 0) {
    retrieveContent($searchEles.userContent.value);
  }
});

/* --------------------------------- 搜索联想词  ------------------------------------------- */

let _suggestTimer = null;

$searchEles.userContent.addEventListener('input', (e) => {
  const keyword = e.target.value.trim();
  $searchEles.originalInput = keyword;
  if (_suggestTimer) clearTimeout(_suggestTimer);
  if (keyword.length === 0) {
    $searchEles.hideSuggestions();
    return;
  }
  _suggestTimer = setTimeout(() => {
    chrome.runtime.sendMessage({ type: "suggest", keyword }, (res) => {
      if (chrome.runtime.lastError || !res) return;
      const items = (res.suggestions || []).slice(0, 8);
      $searchEles.renderSuggestions(items);
    });
  }, 400);
});

$searchEles.userContent.addEventListener("keydown", (e) => {
  const total = $searchEles.cachedSuggestions.length;
  if (total === 0) return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    const next = $searchEles.activeIndex < total - 1 ? $searchEles.activeIndex + 1 : -1;
    $searchEles.highlightItem(next);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    const prev = $searchEles.activeIndex > -1 ? $searchEles.activeIndex - 1 : total - 1;
    $searchEles.highlightItem(prev);
  } else if (e.key === "Escape") {
    $searchEles.hideSuggestions();
    $searchEles.userContent.value = $searchEles.originalInput;
  }
});

$searchEles.userContent.addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    const active = $searchEles.getActiveText();
    const value = active || $searchEles.userContent.value;
    if (value.length > 0) {
      retrieveContent(value);
    }
  }
});

$searchEles.suggestionList.addEventListener("click", (e) => {
  const item = e.target.closest(".suggestion-item");
  if (item) {
    retrieveContent(item.textContent);
  }
});

// 点击面板外隐藏联想词
document.addEventListener("click", (e) => {
  if (!e.target.closest("#user_search_area")) {
    $searchEles.hideSuggestions();
  }
}, true);

// 聚焦时如果有缓存结果则直接显示
$searchEles.userContent.addEventListener("focus", () => {
  if ($searchEles.cachedSuggestions.length > 0 && $searchEles.userContent.value.length > 0) {
    $searchEles.showSuggestions();
  }
});

/* --------------------------------- 引擎选择器  ------------------------------------------- */

$searchEles.engineBtn.addEventListener("click", () => {
  $dropdown.show($searchEles.engineBtn, {
    tag: "engine",
    data: [
      { id: "", icon: "baidu", value: "baidu", label: "Baidu" },
      { id: "", icon: "google", value: "google", label: "Google" },
      { id: "", icon: "bing", value: "bing", label: "Bing" },
    ],
    callback: (value) => {
      localStorage.setItem("engine", value);
      $searchEles.initEngineIcon(value)
    }
  })
})
