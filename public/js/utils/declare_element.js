const $el = (function () {
  let __ = (declare) => {
    return document.querySelector(declare);
  };
  let __all = (declare) => {
    return document.querySelectorAll(declare);
  };
  return {
    __,
    __all,
  };
})();
