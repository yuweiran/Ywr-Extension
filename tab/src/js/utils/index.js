const $utils = (function () {
  let throttle = (fn, wait) => {
    var timer = null;
    return function () {
      var context = this;
      var args = arguments;
      if (!timer) {
        timer = setTimeout(function () {
          fn.apply(context, args);
          timer = null;
        }, wait);
      }
    };
  };

  let trim = (str) => {
    str = str.replace(/^\s*|\s*$/g, "");
    return str;
  };

  let debounce = (func, wait) => {
    let timer;
    return function () {
      let context = this; // 注意 this 指向
      let args = arguments; // arguments中存着e

      if (timer) clearTimeout(timer);

      timer = setTimeout(() => {
        func.apply(context, args);
      }, wait);
    };
  };

  let pic_preview = (data) => {
    //input,element_show,filename_ele
    let { element_input, pic_show, filename_show } = data;
    let { files } = element_input;
    let filename = files[0].name;
    let render_str = "";
    let reg = /\.(jpg|jpeg|gif|png)$/;

    if (reg.test(filename)) {
      if (window.FileReader) {
        let reader = new FileReader();
        reader.readAsDataURL(files[0]); //文件读取为base64
        reader.onload = function (e) {
          render_str += "<img src='" + e.target.result + "'/>";
          filename_show.innerText = filename;
          pic_show.innerHTML = render_str;
        };
      }
    } else {
      filename_show.innerText = filename + "该文件格式不符";
      pic_show.innerHTML = "<img src=''/>";
    }
  };

  return {
    throttle,
    debounce,
    trim,
    pic_preview,
  };
})();
