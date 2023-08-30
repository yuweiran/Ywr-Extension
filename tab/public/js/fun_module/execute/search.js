/**
 * 引擎切换
 * 联想词点击跳转
 * enter直接启动搜索
 * ↓和↑键切换联想词
 * 点击按钮实现搜索
 * 第三方联想词jsonp
 */

/* --------------------------------- 切换搜素引擎  ------------------------------------------- */

const retrieveContent = (content) => {
  let engine = localStorage.getItem("engine");
  let base_url = "";
  const engineReflect = {
    google: "https://www.google.com/search?q=",
    sougou: "https://www.sogou.com/web?ie=UTF-8&query=",
    baidu: "https://www.baidu.com/s?ie=UTF-8&wd=",
    360: "https://www.so.com/s?ie=UTF-8&q=",
    bing: "https://cn.bing.com/search?q=",
  };
  base_url = engineReflect[engine];
  $searchEles.userContent.value = "";
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

//输入
$searchEles.userContent.addEventListener('input', (e) => {
  // if ($searchEles.timer) {
  //   clearTimeout($searchEles.timer)
  // }
  // $searchEles.timer = setTimeout(() => {
  //   const keyword = e.target.value
  //   chrome.runtime.sendMessage({ keyword: keyword });
  // }, 400)
})

$searchEles.userContent.addEventListener("keyup", (e) => {
  if (e.keyCode === 13) {
    if (e.target.value.length > 0) {
      retrieveContent($searchEles.userContent.value);
    }
  }
});
