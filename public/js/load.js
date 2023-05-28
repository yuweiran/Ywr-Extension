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

  //快捷链接渲染
  if (!localStorage.linksinfo) {
    let linksinfo = [
      { href: "https://www.bilibili.com/", name: "bilibili" },
      { href: "https://leetcode-cn.com/", name: "LeetCode" },
      { href: "https://github.com/", name: "GitHub" },
      { href: "https://www.iconfont.cn/", name: "iconfont" },
      { href: "https://cn.vuejs.org/", name: "Vue2" },
      {
        href: "https://developers.weixin.qq.com/miniprogram/dev/framework/",
        name: "微信小程序",
      },
      { href: "https://www.sass.hk/docs/", name: "Scss" },
      { href: "https://es6.ruanyifeng.com/", name: "ES6入门" },
      { href: "https://stackoverflow.com/", name: "stackoverflow" },
      { href: "https://mp.weixin.qq.com/", name: "微信公众平台" },
      { href: "https://juejin.cn/", name: "掘金" },
    ];
    localStorage.setItem("linksinfo", JSON.stringify(linksinfo));
    // console.log(JSON.parse(localStorage.getItem("linksinfo"))||"[]");
  }
  let render_str = "";
  let linksinfo = JSON.parse(localStorage.getItem("linksinfo"));
  linksinfo.forEach((link, i) => {
    render_str += `<div class="links-td" >
        <a href="${link.href}" title="${link.name}"  data-ind="${i}" target="_blank">
          <p class="link_name">${link.name}</p>
        </a>
      </div>`;
  });
  render_str += `<div class="links-td td-jia"><a><div class="add-link-icon"><span class="iconfont icon-jia" id="iconjia"></span></div></a></div>`;
  $linksEles.linksContainer.innerHTML = render_str;
};
