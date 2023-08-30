const $indexDBModel = (() => {
  const key = "id"
  const collections = {
    key,
    properties: [key, "name", "order"],
    initData: [
      { id: 1, name: "视频网站", order: 1 }
    ]
  }
  const links = {
    key,
    properties: [key, "name", "url", "remark", "order", "collection", "icon"],
    initData: [
      { id: 1, name: 'bilibili', url: "https://www.bilibili.com", remark: "一个视频网站", order: 1, collection: 1, icon: "" },
      { id: 2, name: 'bilibili', url: "https://www.bilibili.com", remark: "一个视频网站", order: 1, collection: 1, icon: "" },
    ]
  }
  return {
    collections,
    links
  }
})()