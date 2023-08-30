$collections.collectionsContainer.addEventListener('click', (event) => {
  if (event.target.className.indexOf($collections.btnLinkDelete) !== -1) {
    $notify.success({
      message: '删除成功！',
      duration: 2000
    })
  } else if (event.target.className.indexOf($collections.btnLinkEdit) !== -1) {
    const record = $store.links[parseInt(event.target.dataset.id)]
    const { name, url } = record
    $form.create({
      title: '编辑网址',
      config: [
        { property: 'url', label: 'URL' },
        { property: 'name', label: '名称', }
      ]
      ,
      data: {
        name,
        url
      },
      confirmCallback: (data) => {
        console.log(data)
      }
    })
  }
})