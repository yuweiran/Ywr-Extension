const $theme = (() => {
  const coreItemTheme = $el.__(".core-item-theme");

  const renderThemeList = () => {
    const themeList = [
      { name: "dark", title: "深色" },
      { name: "light", title: "浅色" },
    ];
    const templateArr = themeList.reduce((pre, cur) => {
      pre.push(
        `<div class="theme-item" data-theme="${cur.name}">
          <div class="theme-item-effect theme-demo-${cur.name}"></div>
          <div class="theme-item-title">${cur.title}</div>
        </div>`
      );
      return pre;
    }, []);
    coreItemTheme.innerHTML = templateArr.join("");
  };
  return {
    coreItemTheme,
    renderThemeList,
  };
})($el);
