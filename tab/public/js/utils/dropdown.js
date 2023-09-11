
class Dropdown {
  value = null
  label = null
  data = null
  instance = null
  constructor(el, option = {}) {
    const options = Object.assign({
      value: "value",
      label: "label",
      data: []
    }, option)
    const { value, label, data, callback, tag } = options
    this.data = data
    this.value = value
    this.label = label

    const rect = el.getBoundingClientRect()
    const dropDownInstance = document.createElement("div")
    dropDownInstance.innerHTML = `
    ${data.map(v => {
      return `<div class="dropdown-item" data-id="${v.value}">${v.icon ? `<span data-id="${v.value}" class="icon-${v.icon} dropdown-item-icon"></span>` : ``}<span data-id="${v.value}" class="dropdown-item-text">${v[label]}</span></div>`
    }).join("")}
    `
    dropDownInstance.addEventListener("click", (e) => {
      if (e.target.className.indexOf("dropdown-item") !== -1 || e.target.className.indexOf("dropdown-item-icon") !== -1 || e.target.className.indexOf("dropdown-item-text") !== -1) {
        if (callback) {
          const value = e.target.dataset.id
          callback(value)
        }
        if (tag) {
          this.hidden()
        } else {
          this.remove()
        }
      }
    })
    dropDownInstance.className = "dropdown"
    dropDownInstance.style.transform = `translate(${rect.left}px,${rect.top + rect.height + 4}px)`
    this.instance = dropDownInstance
    document.body.appendChild(dropDownInstance)
  }
  hidden = () => {
    this.instance.style.display = "none"
  }
  show = () => {
    this.instance.style.display = "inline-block"
  }
  remove = () => {
    this.instance.parentNode.removeChild(this.instance)
  }
}
$dropdown = (() => {
  const dropdowns = []
  const dropdownsMap = new Map()
  const handleShow = (el, option = {}) => {
    const { tag } = option
    if (tag) {
      if (dropdownsMap.has(tag)) {
        const dd = dropdownsMap.get(tag)
        dd.show()
      } else {
        dropdownsMap.set(tag, new Dropdown(el, option))
      }
    } else {
      dropdowns.push(new Dropdown(el, option))
    }
  }
  const handleHidden = (el) => {
    dropdownsMap.forEach(dp => {
      dp.hidden()
    })
    dropdowns.forEach(dp => {
      dp.remove()
    })
  }
  return {
    show: handleShow,
    hidden: handleHidden,
  }
})()