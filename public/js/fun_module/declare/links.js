const $linksEles = (function () {
  let linksContainer = $el.__(".links-container");
  let linksPosition = $el.__(".links_position");
  let addLinkBtn = $el.__("#iconjia");

  let indicatorInstance = null

  const renderLinks = ({
    pageNum,//页码
    pageSize,//页面link数
    indicatorCallback } = {//点击dot时事件
      pageNum: 1,//页码
      pageSize: 15,//页面link数
      indicatorCallback: () => { }
    }) => {
    //快捷链接渲染
    if (!localStorage.linksinfo) {
      let linksinfo = [
        { href: "https://www.bilibili.com/", name: "bilibili" },
        { href: "https://leetcode-cn.com/", name: "leetcode" },
        { href: "https://github.com/", name: "gitHub" },
        { href: "https://gitee.com/", name: "gitee" },
        { href: "https://www.iconfont.cn/", name: "iconfont" },
        { href: "https://cn.vuejs.org/", name: "vue" },
        { href: "https://www.sass.hk/docs/", name: "scss" },
        { href: "https://es6.ruanyifeng.com/", name: "ES6入门" },
        { href: "https://stackoverflow.com/", name: "stackoverflow" },
        { href: "https://juejin.cn/", name: "掘金" },
        { href: "https://npmjs.com/", name: "npmjs" },
        { href: "https://unpkg.com/", name: "unpkg" },
        { href: "https://www.jsdelivr.com/", name: "jsdelivr" },
        { href: "https://developer.mozilla.org/zh-CN/", name: "MDN" },
        { href: "https://threejs.org/", name: "threejs" },
        { href: "https://www.wangeditor.com/", name: "wangeditor" },
      ];
      localStorage.setItem("linksinfo", JSON.stringify(linksinfo));
      // console.log(JSON.parse(localStorage.getItem("linksinfo"))||"[]");
    }
    let render_arr = [];
    let linksinfo = JSON.parse(localStorage.getItem("linksinfo"));
    for (let ind = (pageNum - 1) * pageSize; ind < pageNum * pageSize; ind++) {
      let link = linksinfo[ind]
      if (link) {
        render_arr.push(`<div class="links-td" >
        <a href="${link.href}" title="${link.name}" data-url="${link.href}" data-name="${link.name}" data-ind="${ind}" target="_blank">
          <p class="link_name">${link.name}</p>
        </a>
      </div>`)
      }
    }
    if (render_arr.length < 15) {
      render_arr.push(`<div class="links-td td-jia"><a><div class="add-link-icon"><span class="iconfont icon-jia" id="iconjia"></span></div></a></div>`)
    }
    linksContainer.innerHTML = render_arr.join('');

    //渲染指示器
    if (linksinfo.length >= pageSize) {
      if (indicatorInstance) {
        linksPosition.removeChild(indicatorInstance)
      }
      let indicatorDotsNum = Math.ceil((linksinfo.length + 1) / pageSize)
      const dots_arr = []
      const indicator = document.createElement('div')
      indicator.className = "indicator"
      for (let i = 0; i < indicatorDotsNum; i++) {
        let dotHtmlStr = `<div class="indicator-dot ${parseInt(pageNum) === i + 1 ? 'indicator-dot-active' : ''}"  data-ind="${i + 1}"></div>`
        dots_arr.push(dotHtmlStr)
      }
      indicator.innerHTML = dots_arr.join("")
      indicator.addEventListener('click', (e) => {
        //点击点的回调
        if (e.target.className.indexOf('indicator-dot') !== -1) {
          let currentPage = e.target.dataset.ind
          renderLinks({
            pageNum: currentPage,
            pageSize: pageSize,
            indicatorCallback
          })
          indicatorCallback({
            pageNum: currentPage,
            pageSize: pageSize
          })
        }
      })
      indicatorInstance = indicator
      linksPosition.appendChild(indicator)
    }
  }
  return {
    linksContainer,
    linksPosition,
    addLinkBtn,
    renderLinks
  };
})();
