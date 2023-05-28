export const manifestConfig = {
  "name": "ywr的第一个扩展程序",
  "description": "一以贯之的努力，不得懈怠的人生",
  "version": "1.0",
  "manifest_version": 3,
  "background": {
    //加了这个，管理扩展程序那可以看到Service Worker可点击
    "service_worker": "background.js"
  },
  "permissions": [
    "storage"//大多数api都要在此注册,storage，你也不会是例外
  ],
  "action": {
    //这个设置后，点击扩展图标就有弹框了，内容自定义
    "default_popup": "/modules/popup.html",
    "default_icon": {
      "16": "/images/get_started16.png",
      "32": "/images/get_started32.png",
      "48": "/images/get_started48.png",
      "128": "/images/get_started128.png"
    }
  },
  "icons": {
    "16": "/images/get_started16.png",
    "32": "/images/get_started32.png",
    "48": "/images/get_started48.png",
    "128": "/images/get_started128.png"
  }
}
