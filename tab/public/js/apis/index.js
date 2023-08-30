const $apis = (() => {
  const getCollectionsAndLinks = async () => {
    const collections = await $indexedDB.$tables.collections.list()
    for (let collection of collections) {
      const links = await $indexedDB.$tables.links.list({
        collection: collection.id
      })
      collection.children = links
    }
    return collections
  }
  return {
    getCollectionsAndLinks
  }
})()