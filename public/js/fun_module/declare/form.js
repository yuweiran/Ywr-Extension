const $formEles = (function () {
  let pageMask = $el.__(".form-mask");
  let btnConfirm = $el.__(".edit-confirm-button");
  let btnCancel = $el.__(".edit-cancel-button");
  return {
    pageMask, btnCancel, btnConfirm
  };
})();
// $formEles.pageMask.addEventListener('click', (e) => {
//   if (e.target.id === 'pageMask') {
//     $formEles.pageMask.style.display = "none"
//   }
// })
// $formEles.pageMask.addEventListener('contextmenu', (e) => {
//   if (e.target.id === 'pageMask') {
//     $formEles.pageMask.style.display = "none"
//   }
// })

// $formEles.btnCancel.addEventListener('click', () => {
//   $formEles.pageMask.style.display = "none"
// })