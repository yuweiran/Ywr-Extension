const $form = (function () {
  const formFunc = ({
    title,
    config = [
      { label: 'URL', property: 'url' },
      { label: '名称', property: 'name' }
    ],
    data = {
      url: '',
      name: ''
    },
    confirmCallBack = () => { }
  }) => {
    const formInstance = document.createElement('div')
    formInstance.setAttribute('class', 'form-mask')
    formInstance.innerHTML = `    
    <div class="eidt-form">
    <div class="edit-form-header">
      <div>${title || '标题'}</div>
      <div class="header-icon-close">
        <img
          class="icon-close"
          style="height: 1.2rem; width: 1.2rem;cursor:pointer"
          src="./public/img/svg/close.svg"
        />
      </div>
    </div>
    ${config.map((c => {
      return '<div><label>' + c.label + '</label> <input  data-property="' + c.property + '" type="text" value="' + data[c.property] + '"  /></div>'
    })).join('')}
    <div class= "edit-form-footer" >
      <button
        style="margin-left: auto"
        class="edit-button edit-cancel-button"
      >
        取消
      </button>
      <button
        style="margin-left: 1rem"
        class="edit-button edit-confirm-button"
      >
        确定
      </button>
    </ >
  </div >
    `
    document.body.appendChild(formInstance)
    formInstance.addEventListener('click', (e) => {
      if (e.target.classList[1] === 'edit-cancel-button' || e.target.classList[0] === 'icon-close') {
        formInstance.parentNode.removeChild(formInstance)
      } else if (e.target.classList[1] === 'edit-confirm-button') {
        //如何拿到数据
        formInstance.querySelectorAll('input').forEach(inputInstance => {
          let property = inputInstance.dataset.property
          data[property] = inputInstance.value
        })
        formInstance.parentNode.removeChild(formInstance)
        confirmCallBack(data)
      }
    })
  }

  return {
    create: formFunc
  }
})()