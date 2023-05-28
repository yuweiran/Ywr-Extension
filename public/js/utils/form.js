const $form = (function () {
  const formFunc = ({
    title,
    config
  }) => {
    const formInstance = document.createElement('div')
    formInstance.setAttribute('class', 'form-mask')
    notificationInstance.innerHTML = `    
    <div class="eidt-form">
    <div class="edit-form-header">
      <div>${title}</div>
      <div class="header-icon-close">
        <img
          style="height: 1.2rem; width: 1.2rem"
          src="./public/img/svg/close.svg"
        />
      </div>
    </div>
    <div><label>地址</label><input type="text" /></div>
    <div><label>名称</label><input type="text" /></div>
    <div class="edit-form-footer">
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
    </div>
  </div>
  `
  }
  return {

  }
})()