const $aside = (() => {
  const btnSetting = $el.__(".ipage-aside-setting");
  const btnFold = $el.__(".btn-aside-fold");
  const asideRightArea = $el.__(".ipage-body-right");
  const FOLD_KEY = "ywr-layout-right-fold";
  const handleFoldToggle = () => {
    if ($aside.asideRightArea.classList.contains("is-fold")) {
      $aside.asideRightArea.classList.remove("is-fold");
      localStorage.setItem(FOLD_KEY, "0");
    } else {
      $aside.asideRightArea.classList.add("is-fold");
      localStorage.setItem(FOLD_KEY, "1");
    }
  };
  const initFoldState = () => {
    // 一次性迁移旧键
    const legacy = localStorage.getItem("is-aside-fold");
    if (legacy !== null && localStorage.getItem(FOLD_KEY) === null) {
      localStorage.setItem(FOLD_KEY, legacy);
    }
    localStorage.removeItem("is-aside-fold");
    const isFold = localStorage.getItem(FOLD_KEY) === "1";
    if (isFold) {
      $aside.asideRightArea.classList.add("is-fold");
    }
  };
  return {
    btnSetting,
    btnFold,
    asideRightArea,
    handleFoldToggle,
    initFoldState,
  };
})();
