$linksEles.linksContainer.addEventListener('click', (e) => {
  if (e.target.classList[0] === "add-link-icon" || e.target.id === 'iconjia') {
    $formEles.pageMask.style.display = 'block';
  }

})
$linksEles.linksContainer.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  if (e.target.className !== 'links-container') {
    if (e.target.classList[0] === "add-link-icon" || e.target.id === 'iconjia') {
      console.log('点击无效')
    } else {
      $formEles.pageMask.style.display = 'block';
    }
  }
})
