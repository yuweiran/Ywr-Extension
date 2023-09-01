
class InputFile extends HTMLElement {
  inputFileTemplate = document.createElement('template')
  isMultiple = false
  files = []
  constructor() {
    super()
    this.initInputFileTemplate()
    this.showInfo = true;
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(this.inputFileTemplate.content.cloneNode(true))
    this.isMultiple = this.hasAttribute("multiple") ? this.getAttribute('multiple') !== 'false' : false
    console.log(this.isMultiple)
    this.shadowRoot.querySelector('.is-upload').setAttribute('multiple', this.isMultiple)
  }
  initInputFileTemplate = () => {
    this.inputFileTemplate.innerHTML = `
    <style>
      .is-upload{
       position:relative; 
       background-color:transparent;
      }
      .is-upload:before{
        content:"选择文件";
        display:flex;
        align-items:center;
        justify-content:center;
        background-color:#fff;
        text-align:center;
        position:absolute;
        top:0;
        left:0;
        width:100%;
        height:100%;
      }
      .icon-close{
        height:12px;
        width:12px;
        flex-shrink:0;
        cursor:pointer;
        margin-left:auto;
        position:relative;
      }
      .file-name{
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .icon-close:before,.icon-close:after{
        content:"";
        height:3px;
        width:100%;
        background-color:#000;
        position:absolute;
        left:0;
        top:50%;
      }
      .icon-close:before{
        transform:translate(0,-50%) rotate(45deg);
      }
      .icon-close:after{
        transform:translate(0,-50%) rotate(-45deg);
      }
      .file-item{
        padding:4px 10px;
        font-size:12px;
        display:flex;
        align-items:center;
      }
    </style>
    <div class="input-file">
      <input class="is-upload" type="file" />
      <div class="file-list"></div>
    </div>
  `
  }
  updateFileList = () => {
    const files = this.files
    const templateArr = []
    const fileList = this.shadowRoot.querySelector(".file-list")
    for (let fIndex = 0; fIndex < files.length; fIndex++) {
      const file = files[fIndex]
      templateArr.push(`<div class="file-item">
      <div class="file-name" title="${file.name}">${file.name}</div><div data-ind="${fIndex}" class="icon-close"></div>
     </div>`)
    }
    fileList.innerHTML = templateArr.join("")
  }
  getFiles = () => {
    return this.files
  }
  connectedCallback() {
    //挂载完成调用
    this.shadowRoot.querySelector('.is-upload').addEventListener('change', (event) => {
      const files = event.target.files
      if (this.isMultiple) {
        this.files = [...Array.from(files), ...this.files]
      } else {
        this.files = [files[0]]
      }
      this.updateFileList()
      this.shadowRoot.querySelector('.is-upload').value = ""
    })
    this.shadowRoot.querySelector('.file-list').addEventListener('click', (event) => {
      if (event.target.className.indexOf("icon-close") !== -1) {
        const index = event.target.dataset.ind
        this.files.splice(index, 1)
        this.updateFileList()
      }
    })
  }
  disconnectedCallback() {
    //取消挂载时调用
  }
  adoptedCallback() {
    //移动到新文档时调用，比如iframe
  }
  attributeChangedCallback() {
    //增删改属性时调用
  }
}

window.customElements.define('input-file', InputFile)