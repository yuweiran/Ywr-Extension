const $apis = (() => {
  //链接列表
  const getCollectionsAndLinks = async () => {
    const collections = (await $indexedDB.$tables.collections.list()).sort((a, b) => a.order - b.order)
    for (let collection of collections) {
      $store.collections[collection.id] = structuredClone(collection)
      const links = await $indexedDB.$tables.links.list({
        collection: collection.id
      })
      links.forEach(l => {
        $store.links[l.id] = structuredClone(l)
      })
      collection.children = links.sort((a, b) => a.order - b.order)
    }
    return collections
  }
  //配置导出
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
  //配置导入
  const importConfig = async (file) => {
    if (file.type !== "application/json") {
      $notify.error({
        message: "文件格式不支持！",
        duration: 2000
      })
      return
    }
    return new Promise((res, rej) => {
      // 创建一个FileReader对象
      const reader = new FileReader();
      // 设置当读取完成后的回调函数
      reader.onload = async (event) => {
        const fileContent = event.target.result; // 获取文件内容
        const jsonData = JSON.parse(fileContent); // 解析JSON内容
        // const stringContent = JSON.stringify(jsonData, null, 2)
        const { collections, links } = jsonData
        await $indexedDB.$tables.collections.addMany(collections, true)
        await $indexedDB.$tables.links.addMany(links, true)
        res()
      };
      // 读取文件内容
      reader.readAsText(file);
    })
  }

  //新建collection
  const collection = {
    add: async (collection) => {
      await $indexedDB.$tables.collections.add(collection)
    },
    edit: async (collection) => {
      await $indexedDB.$tables.collections.update(collection)
    },
    delete: async (id) => {
      //级联删除链接
      await $indexedDB.$tables.collections.delete(id)
      await $indexedDB.$tables.links.deleteWithCondition({
        collection: id
      })
    },
    updateOrder: async (records) => {
      for (let r of records) {
        await $indexedDB.$tables.update(r)
      }
    }
  }
  const link = {
    add: async (link) => {
      await $indexedDB.$tables.links.add(link)
    },
    edit: async (link) => {
      await $indexedDB.$tables.links.update(link)
    },
    delete: async (id) => {
      await $indexedDB.$tables.links.delete(id)
    },
    updateOrder: async (records) => {
      for (let r of records) {
        await $indexedDB.$tables.update(r)
      }
    }
  }

  return {
    getCollectionsAndLinks,
    exportConfig,
    importConfig,
    collection,
    link
  }
})()