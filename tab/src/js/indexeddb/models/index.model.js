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
  return {
    collections,
    links,
  };
})();
