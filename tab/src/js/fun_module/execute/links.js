$linksEles.linksContainer.addEventListener('click', (e) => {
  if (e.target.classList[0] === "add-link-icon" || e.target.id === 'iconjia') {
    $modal.form({
      title: '添加网站',
      config: [
        { property: 'url', label: 'URL' },
        { property: 'name', label: 'Name', }
      ],
      data: {
        name: '',
        url: ''
      },
      confirmCallback: (data) => {
        const linksInfo = JSON.parse(localStorage.getItem('linksinfo'))
        linksInfo.push({ href: data.url, name: data.name })
        localStorage.setItem('linksinfo', JSON.stringify(linksInfo))
        $linksEles.renderLinks()
      }
    })
  }

})
$linksEles.linksContainer.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  if (e.target.className !== 'links-container') {
    if (e.target.classList[0] === "add-link-icon" || e.target.id === 'iconjia') {
      console.log('点击无效')
    } else {
      let name, url, ind
      if (e.target.children.length === 0) {
        ind = e.target.parentNode.dataset.ind
        name = e.target.parentNode.dataset.name
        url = e.target.parentNode.dataset.url
      } else {
        ind = e.target.dataset.ind
        name = e.target.dataset.name
        url = e.target.dataset.url
      }
      $modal.form({
        title: '编辑网址',
        config: [
          { property: 'url', label: 'URL' },
          { property: 'name', label: 'Name', }
        ]
        ,
        data: {
          ind,
          name,
          url
        },
        showRemoveButton: true,
        confirmCallback: (data) => {
          const linksInfo = JSON.parse(localStorage.getItem('linksinfo'))
          linksInfo[data.ind] = { href: data.url, name: data.name }
          localStorage.setItem('linksinfo', JSON.stringify(linksInfo))
          $linksEles.renderLinks()
        },
        removeCallback: (data) => {
          const linksInfo = JSON.parse(localStorage.getItem('linksinfo'))
          linksInfo.splice(data.ind, 1)
          localStorage.setItem('linksinfo', JSON.stringify(linksInfo))
          $linksEles.renderLinks()
        }
      })
    }
  }
})
