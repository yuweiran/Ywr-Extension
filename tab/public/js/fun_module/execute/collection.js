$collections.collectionsContainer.addEventListener('click', (event) => {
  const currentClassName = event.target.className
  if (currentClassName.indexOf($collections.btnLinkDelete) !== -1) {
    //链接删除
    $modal.confirm({
      title: "warning",
      message: "确定删除当前链接？",
      confirmCallback: () => {
        $notify.success({
          message: '删除成功！',
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
        { property: 'name', label: '名称', },
        { property: 'remark', label: '描述' },
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
      message: "确定删除当前collection？",
      confirmCallback: () => {
        $notify.success({
          message: '删除成功！',
          duration: 2000
        })
      }
    })
  } else if (currentClassName.indexOf($collections.btnCollectionEdit) !== -1) {
    //collection编辑
    const record = $store.collections[parseInt(event.target.dataset.id)]
    $modal.form({
      title: '编辑collection',
      config: [
        { property: 'name', label: '名称', }
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
        { property: 'name', label: '名称' },
        { property: 'remark', label: '描述' },
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