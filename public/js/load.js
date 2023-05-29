//背景图、搜索引擎、快捷链接、字体颜色、
//input[range]颜色、个签渲染、鼠标左键点击效果

/*------------------------------快捷链接区---------------------------------*/
window.onload = () => {
  //搜索引擎
  if (!localStorage.engine) {
    localStorage.setItem("engine", "baidu");
  }
  let selectedEngine = localStorage.getItem("engine");
  $searchEles.engineItem.forEach((v, i) => {
    v.getAttribute("data-engine") === selectedEngine
      ? v.classList.add("selected-engine-item")
      : v.classList.remove("selected-engine-item");
  });
  $linksEles.renderLinks()

};
