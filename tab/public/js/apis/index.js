const $apis = (() => {
  const getCollectionsAndLinks = async () => {
    const collections = await $indexedDB.$tables.collections.list()
    for (let collection of collections) {
      $store.collections[collection.id] = structuredClone(collection)
      const links = await $indexedDB.$tables.links.list({
        collection: collection.id
      })
      links.forEach(l => {
        $store.links[l.id] = structuredClone(l)
      })
      collection.children = links
    }
    return collections
  }
  const exportConfig = async () => {
    const collections = await $indexedDB.$tables.collections.list()
    const links = await $indexedDB.$tables.links.list()
    const config = {
      collections,
      links
    }
    console.log(config)
    const jsonData = JSON.stringify(config, null, 2); // Pretty-print JSON
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.json';
    a.textContent = 'Download Config File';

    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const importConfig = async (file) => {
    return new Promise((res, rej) => {
      // 创建一个FileReader对象
      const reader = new FileReader();
      // 设置当读取完成后的回调函数
      reader.onload = async (event) => {
        const fileContent = event.target.result; // 获取文件内容
        const jsonData = JSON.parse(fileContent); // 解析JSON内容
        console.log(jsonData)
        // const stringContent = JSON.stringify(jsonData, null, 2)
        const { collections, links } = jsonData
        await $indexedDB.$tables.collections.addMuch(collections)
        await $indexedDB.$tables.links.addMuch(links)
        res()
      };
      // 读取文件内容
      reader.readAsText(file);
    })
  }
  return {
    getCollectionsAndLinks,
    exportConfig,
    importConfig
  }
})()