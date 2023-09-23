const $aside = (() => {
  const btnSetting = $el.__(".ipage-aside-setting")
  const btnFold = $el.__(".btn-aside-fold")
  const asideRightArea = $el.__(".ipage-body-right")
  const handleFoldToggle = () => {
    if ($aside.asideRightArea.classList.contains("is-fold")) {
      $aside.asideRightArea.classList.remove("is-fold")
      localStorage.setItem("is-aside-fold", "0")
    } else {
      $aside.asideRightArea.classList.add("is-fold")
      localStorage.setItem("is-aside-fold", "1")
    }
  }
  const initFoldState = () => {
    const isFold = localStorage.getItem("is-aside-fold") === "1"
    if (isFold) {
      $aside.asideRightArea.classList.add("is-fold")
    }
  }
  return {
    btnSetting,
    btnFold,
    asideRightArea,
    handleFoldToggle,
    initFoldState
  }
})()