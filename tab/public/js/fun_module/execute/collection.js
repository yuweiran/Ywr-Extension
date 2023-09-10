$collections.collectionsContainer.addEventListener('click', async (event) => {
  const currentClassName = event.target.className
  if (currentClassName.indexOf($collections.btnLinkDelete) !== -1) {
    event.preventDefault()
    //链接删除
    $modal.confirm({
      title: "warning",
      message: "Are you sure to delete current link?",
      confirmCallback: async () => {
        const linkId = parseInt(event.target.dataset.id)
        await $apis.link.delete(linkId)
        $collections.renderCollections()
        $notify.success({
          message: 'operate success!',
          duration: 2000
        })
      }
    })
  } else if (currentClassName.indexOf($collections.btnLinkEdit) !== -1) {
    event.preventDefault()
    //链接编辑
    const record = $store.links[parseInt(event.target.dataset.id)]
    $modal.form({
      title: 'Edit Link',
      config: [
        { property: 'url', label: 'URL' },
        { property: 'name', label: 'Name', },
        { property: 'remark', label: 'Description' },
      ]
      ,
      data: record,
      confirmCallback: async (data) => {
        await $apis.link.edit(data)
        $collections.renderCollections()
        $notify.success({
          message: 'operate success!',
          duration: 2000
        })
      }
    })
  } else if (currentClassName.indexOf($collections.btnCollectionDelete) !== -1) {
    //collection删除
    $modal.confirm({
      title: "warning",
      message: "Are you sure to delete current collection?",
      confirmCallback: async () => {
        const collectionId = parseInt(event.target.dataset.id)
        await $apis.collection.delete(collectionId)
        $collections.renderCollections()
        $notify.success({
          message: 'operate success!',
          duration: 2000
        })
      }
    })
  } else if (currentClassName.indexOf($collections.btnCollectionEdit) !== -1) {
    //collection编辑
    const record = $store.collections[parseInt(event.target.dataset.id)]
    $modal.form({
      title: 'Edit Collection',
      config: [
        { property: 'name', label: 'Name', }
      ]
      ,
      data: record,
      confirmCallback: async (data) => {
        await $apis.collection.edit(data)
        $collections.renderCollections()
        $notify.success({
          message: 'operate success!',
          duration: 2000
        })
      }
    })
  } else if (currentClassName.indexOf($collections.btnLinkAdd) !== -1) {
    const collection = parseInt(event.target.dataset.id)
    $modal.form({
      title: 'Create Link',
      config: [
        { property: 'url', label: 'URL' },
        { property: 'name', label: 'Name' },
        { property: 'remark', label: 'Description' },
      ],
      data: {
        name: "",
        url: "",
        remark: "",
        collection
      },
      confirmCallback: async (data) => {
        console.log(data)
        await $apis.link.add(data)
        $collections.renderCollections()
        $notify.success({
          message: 'operate success!',
          duration: 2000
        })
      }
    })
  }
})

$collections.btnAddCollecation.addEventListener('click', () => {
  $modal.form({
    title: 'Create Collection',
    config: [
      { property: 'name', label: 'Collection Name' }
    ],
    data: {
      name: ''
    },
    confirmCallback: async (data) => {
      const maxOrder = await $collections.getCollectionsMaxOrder()
      data.order = maxOrder + 1
      await $apis.collection.add(data)
      $collections.renderCollections()
      $notify.success({
        message: 'operate success!',
        duration: 2000
      })
    }
  })
})