const $notify = (function () {
  let dataInd = 0;
  const notificationList = [];
  const notifyFunc = ({ type, message, duration }) => {
    const notificationInstance = document.createElement("div");
    notificationInstance.setAttribute("class", "notification");
    notificationInstance.setAttribute("data-ind", dataInd++);
    notificationInstance.innerHTML = `    
    <div class="notification-header">
    <span class="icon-bulb" style="font-size: 1.2rem; color: var(--muted);">💡</span>
    <div style="margin-left: 4px; color: var(--text); font-weight: 500;">提示</div>
    <div class="notification-close" style="margin-left: auto; cursor: pointer;">
      <span style="font-size: 1rem; color: var(--muted);">✕</span>
    </div>
  </div>
  <div class="notification-body">${message}</div>
  `;
    // 绑定关闭按钮点击事件
    const closeBtn = notificationInstance.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      notificationInstance.parentNode.removeChild(notificationInstance);
      const index = notificationList.findIndex((instance) => {
        return notificationInstance.dataset.ind === instance.dataset.ind;
      });
      notificationList.splice(index, 1);
      updateInstancePosition();
    });

    document.body.appendChild(notificationInstance);
    notificationList.push(notificationInstance);
    updateInstancePosition();
    if (duration) {
      setTimeout(() => {
        notificationInstance.parentNode.removeChild(notificationInstance);
        const index = notificationList.findIndex((instance) => {
          return notificationInstance.dataset.ind === instance.dataset.ind;
        });
        notificationList.splice(index, 1);
        updateInstancePosition();
      }, duration);
    }
  };

  const updateInstancePosition = () => {
    let topCount = 0;
    notificationList.forEach((instance, ind) => {
      const { height } = instance.getBoundingClientRect();
      instance.style.top = 10 * ind + topCount + 10 + "px";
      topCount += height;
    });
  };

  const warningFunc = ({ message, duration }) => {
    notifyFunc({
      type: "warning",
      message,
      duration,
    });
  };
  const errorFunc = ({ message, duration }) => {
    notifyFunc({
      type: "error",
      message,
      duration,
    });
  };
  const successFunc = ({ message, duration }) => {
    notifyFunc({
      type: "success",
      message,
      duration,
    });
  };

  return {
    warning: warningFunc,
    error: errorFunc,
    success: successFunc,
    info: () => {},
  };
})();
