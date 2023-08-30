//背景图、搜索引擎、快捷链接、字体颜色、
//input[range]颜色、个签渲染、鼠标左键点击效果

const collections = [
  {
    name: '前端1',
    order: 1,
    links: [
      { href: 'https://www.baidu.com', name: '百度', order: 1, remark: '百度一下，你就知道' },
      { href: 'https://www.npmjs.com', name: 'npmjs', order: 2, remark: 'npm' }
    ]
  },
  {
    name: '前端2',
    order: 2,
    links: [
      { href: 'https://www.baidu.com', name: '百度', order: 1, remark: '百度一下，你就知道' },
      { href: 'https://www.npmjs.com', name: 'npmjs', order: 2, remark: 'npm' }
    ]
  },
  {
    name: '前端3',
    order: 3,
    links: [
      { href: 'https://www.baidu.com', name: '百度', order: 1, remark: '百度一下，你就知道' },
      { href: 'https://www.npmjs.com', name: 'npmjs', order: 2, remark: 'npm' }
    ]
  },
  {
    name: '前端4',
    order: 4,
    links: [
      { href: 'https://www.baidu.com', name: '百度', order: 1, remark: '百度一下，你就知道' },
      { href: 'https://www.npmjs.com', name: 'npmjs', order: 2, remark: 'npm' }
    ]
  },
]
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
  $collections.renderCollections()
};
