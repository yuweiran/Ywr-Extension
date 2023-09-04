$collections.collectionsContainer.addEventListener('click', (event) => {
  const currentClassName = event.target.className
  if (currentClassName.indexOf($collections.btnLinkDelete) !== -1) {
    //链接删除
    $modal.confirm({
      title: "warning",
      message: "Are you sure to delete current link?",
      confirmCallback: () => {
        $notify.success({
          message: 'operate success!',
          duration: 2000
        })
      }
    })
  } else if (currentClassName.indexOf($collections.btnLinkEdit) !== -1) {
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
      confirmCallback: (data) => {
        console.log(data)
      }
    })
  } else if (currentClassName.indexOf($collections.btnCollectionDelete) !== -1) {
    //collection删除
    $modal.confirm({
      title: "warning",
      message: "Are you sure to delete current collection?",
      confirmCallback: () => {
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
      confirmCallback: (data) => {
        console.log(data)
      }
    })
  } else if (currentClassName.indexOf($collections.btnLinkAdd) !== -1) {
    const collection = event.target.dataset.id
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
      confirmCallback: (data) => {
        console.log(data)
      }
    })
  }
})

$collections.btnAddCollecation.addEventListener('click', () => {
  $modal.form({
    title: 'Create Collection',
    config: [
      { property: 'name', label: 'Collection Name', }
    ],
    data: {
      name: ''
    },
    confirmCallback: (data) => {
      console.log(data)
    }
  })
})