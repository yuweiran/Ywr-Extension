const $modal = (function () {
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
    showRemoveButton = false,
    confirmCallback = () => { },
    removeCallback = () => { }
  }) => {
    const formInstance = document.createElement('div')
    formInstance.setAttribute('class', 'form-mask')
    formInstance.innerHTML = `    
    <div class="eidt-form">
    <div class="edit-form-header">
      <div>${title || '标题'}</div>
      <div class="header-icon-close">
        <div
          class="icon-close"
          style="height: 1.2rem; width: 1.2rem;cursor:pointer"
        ></div>
      </div>
    </div>
    ${config.map((c => {
      let inputHtml
      if (c.type !== "file") {
        inputHtml = `<input  spellcheck="false" data-property="${c.property}" type="${c.type || 'text'}" value="${data[c.property]}"  />`
      } else {
        inputHtml = `<input-file class="input-file"  data-property="${c.property}"  value="${data[c.property]}"  />`
      }
      return `<div><label>${c.label}</label> ${inputHtml}</div>`
    })).join('')}
    <div class= "edit-form-footer" >
      <button
        class="edit-button edit-cancel-button"
      >
        Cancel
      </button>
      <button
        style="margin-left: auto;visibility:${showRemoveButton ? 'visible' : 'hidden'} "
        class="edit-button edit-remove-button"
      >
      Delete
      </button>
      <button
        style="margin-left: 1rem"
        class="edit-button edit-confirm-button"
      >
        Confirm
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
        formInstance.querySelectorAll('.input-file').forEach(inputInstance => {
          let property = inputInstance.dataset.property
          data[property] = inputInstance.files
        })
        formInstance.parentNode.removeChild(formInstance)
        confirmCallback(data)
      } else if (e.target.classList[1] === 'edit-remove-button') {
        formInstance.querySelectorAll('input').forEach(inputInstance => {
          let property = inputInstance.dataset.property
          data[property] = inputInstance.value
        })
        formInstance.parentNode.removeChild(formInstance)
        removeCallback(data)
      }
    })
  }
  const confirmFunc = ({
    title,
    message,
    confirmCallback = () => { }
  }) => {
    const formInstance = document.createElement('div')
    formInstance.setAttribute('class', 'form-mask')
    formInstance.innerHTML = `    
    <div class="eidt-form">
    <div class="edit-form-header">
      <div>${title || '标题'}</div>
      <div class="header-icon-close">
        <div
          class="icon-close"
          style="height: 1.2rem; width: 1.2rem;cursor:pointer"
        ></div>
      </div>
    </div>
    ${message}
    <div class= "edit-form-footer" >
      <button
        class="edit-button edit-cancel-button"
      >
        取消
      </button>
      <button
        style="margin-left: auto"
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
        formInstance.parentNode.removeChild(formInstance)
        confirmCallback()
      }
    })
  }
  return {
    form: formFunc,
    confirm: confirmFunc
  }
})()