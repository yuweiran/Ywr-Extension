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
  return {
    getCollectionsAndLinks
  }
})()