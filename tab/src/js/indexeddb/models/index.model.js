const $indexedDBModel = (() => {
  const key = "id";
  const collections = {
    key,
    properties: [key, "name", "order"],
  };
  const links = {
    key,
    properties: [key, "name", "url", "remark", "order", "collection", "icon"],
  };
  const todos = {
    key,
    properties: [key, "text", "done", "createdAt"],
  };
  const wallpapers = {
    key,
    // 注意：data 字段（base64/渐变字符串）不进索引，避免复制大体积
    properties: [key, "type"],
  };
  return {
    collections,
    links,
    todos,
    wallpapers,
  };
})();
