const $linksEles = (function () {
  let linksContainer = $el.__(".links-container");
  let addLinkBtn = $el.__("#iconjia");

  const renderLinks = () => {
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
    let render_arr = [];
    let linksinfo = JSON.parse(localStorage.getItem("linksinfo"));
    linksinfo.forEach((link, i) => {
      if (i <= 14) {
        render_arr.push(`<div class="links-td" >
      <a href="${link.href}" title="${link.name}" data-url="${link.href}" data-name="${link.name}" data-ind="${i}" target="_blank">
        <p class="link_name">${link.name}</p>
      </a>
    </div>`)
      }
    });
    if (render_arr.length < 15) {
      render_arr.push(`<div class="links-td td-jia"><a><div class="add-link-icon"><span class="iconfont icon-jia" id="iconjia"></span></div></a></div>`)
    }
    linksContainer.innerHTML = render_arr.join('');
  }
  return {
    linksContainer,
    addLinkBtn,
    renderLinks
  };
})();
