const $apis = (() => {
  const getCollectionsAndLinks = async () => {
    const collections = await $indexedDB.$tables.collections.list({
      id: 2
    })
    console.log(collections)
    for (let collection of collections) {
      // const links = await $indexedDB.$tables.links.list()
    }
    return collections
  }
  return {
    getCollectionsAndLinks
  }
})()