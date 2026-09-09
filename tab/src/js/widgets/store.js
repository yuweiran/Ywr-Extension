/**
 * $widgetStore — 小组件数据边界
 * tools：localStorage JSON 数组（键 ywr-tools-list）
 * todo 数据不入此层（todos 走 IndexedDB 表）
 */
const $widgetStore = (function () {
  const TOOLS_KEY = "ywr-tools-list";
  const DEFAULT_TOOLS = [
    { name: "GitHub", url: "https://github.com" },
    { name: "知乎", url: "https://www.zhihu.com" },
    { name: "Gmail", url: "https://mail.google.com" },
    { name: "B站", url: "https://www.bilibili.com" },
    { name: "掘金", url: "https://juejin.cn" },
    { name: "邮箱", url: "https://mail.163.com" },
    { name: "地图", url: "https://maps.google.com" },
    { name: "翻译", url: "https://translate.google.com" },
  ];

  const tools = {
    list: () => {
      try {
        const raw = localStorage.getItem(TOOLS_KEY);
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) return Promise.resolve(list);
        }
      } catch (e) { /* ignore */ }
      try {
        localStorage.setItem(TOOLS_KEY, JSON.stringify(DEFAULT_TOOLS));
      } catch (e) { /* ignore */ }
      return Promise.resolve(DEFAULT_TOOLS.slice());
    },
    add: (item) =>
      tools.list().then((list) => {
        if (!item || !item.name || !item.url) return list;
        list.push({ name: item.name, url: item.url });
        try {
          localStorage.setItem(TOOLS_KEY, JSON.stringify(list));
        } catch (e) { /* ignore */ }
        return list;
      }),
    remove: (name) =>
      tools.list().then((list) => {
        const next = list.filter((it) => it.name !== name);
        try {
          localStorage.setItem(TOOLS_KEY, JSON.stringify(next));
        } catch (e) { /* ignore */ }
        return next;
      }),
  };

  return { tools };
})();
