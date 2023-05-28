/**
 * 引擎切换
 * 联想词点击跳转
 * enter直接启动搜索
 * ↓和↑键切换联想词
 * 点击按钮实现搜索
 * 第三方联想词jsonp
 */

/* --------------------------------- 切换搜素引擎  ------------------------------------------- */

function handle_retrieval() {
  if ($searchEles.userContent.value.length > 0) {
    let engine = localStorage.getItem("engine");
    let base_url = "";
    switch (engine) {
      case "google":
        base_url = "https://www.google.com/search?q=";
        break;
      case "sougou":
        base_url = "https://www.sogou.com/web?ie=UTF-8&query=";
        break;
      case "baidu":
        base_url = "https://www.baidu.com/s?ie=UTF-8&wd=";
        break;
      case "360":
        base_url = "https://www.so.com/s?ie=UTF-8&q=";
        break;
      case "bing":
        base_url = "https://cn.bing.com/search?q=";
        break;
      default:
        break;
    }
    window.open(base_url + $searchEles.userContent.value);
    $searchEles.userContent.value = "";
  }
  location.reload();
}

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
$searchEles.btnRetrievalContent.onclick = function () {
  handle_retrieval();
};
