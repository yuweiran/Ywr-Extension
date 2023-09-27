const $notify = (function () {
  let dataInd = 0
  const notificationList = []
  const notifyFunc = ({ type, message, duration }) => {
    const notificationInstance = document.createElement('div')
    notificationInstance.setAttribute('class', 'notification')
    notificationInstance.setAttribute('data-ind', dataInd++)
    notificationInstance.innerHTML = `    
    <div class="notification-header">
    <div class="icon-bulb">
      <img
        style="height: 1.2rem; width: 1.2rem"
        src="./public/img/svg/bulb.svg"
      />
    </div>
    <div style="margin-left: 4px; color: #47f8b1f7">Tip</div>
    <div style="margin-left: auto">
      <img
        style="height: 1.2rem; width: 1.2rem"
        src="./public/img/svg/close.svg"
      />
    </div>
  </div>
  <div class="notification-body">${message}</div>
  `
    document.body.appendChild(notificationInstance)
    notificationList.push(notificationInstance)
    updateInstancePosition()
    if (duration) {
      setTimeout(() => {
        notificationInstance.parentNode.removeChild(notificationInstance)
        const index = notificationList.findIndex((instance) => {
          return notificationInstance.dataset.ind === instance.dataset.ind
        })
        notificationList.splice(index, 1)
        updateInstancePosition()
      }, duration)
    }
  }

  const updateInstancePosition = () => {
    let topCount = 0
    notificationList.forEach((instance, ind) => {
      const { height } = instance.getBoundingClientRect()
      instance.style.top = 10 * ind + topCount + 10 + 'px'
      topCount += height
    })
  }



  const warningFunc = ({ message, duration }) => {
    notifyFunc({
      type: 'warning',
      message,
      duration
    })
  }
  const errorFunc = ({ message, duration }) => {
    notifyFunc({
      type: 'error',
      message,
      duration
    })
  }
  const successFunc = ({ message, duration }) => {
    notifyFunc({
      type: 'success',
      message,
      duration
    })
  }

  return {
    warning: warningFunc,
    error: errorFunc,
    success: successFunc,
    info: () => { },
  }
})()