// background.js
//#region 一些api
//chrome.runtime.onMessage.addListener
//chrome.storage.local.get/set
//chrome.storage.sync.set
//chrome.action.onClicked
//#endregion

//#region  //看到扩展边上的小字没，就是改那玩意儿
//这个local和sync有啥区别？
// chrome.storage.local.get(["badgeText"], ({ badgeText }) => {
//   chrome.action.setBadgeText({
//     text: badgeText || "ywr",
//   });
// });
chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({
    text: "OFF",
  });
});
// Listener is registered on startup，没太明白这个监听事件什么时候触发
chrome.action.onClicked.addListener(handleActionClick);

function handleActionClick() {
  console.log("handleActionClick点击");
}

const extensions = "http://127.0.0.1:5500";

//没生效
chrome.action.onClicked.addListener(async (tab) => {
  chrome.scripting.insertCSS({
    files: ["focus-mode.css"],
    target: { tabId: tab.id },
  });
});
//#endregion

//#region 点击按钮修改页面body颜色，这个逻辑在popup.js
let color = "#3aa757";

chrome.runtime.onInstalled.addListener(() => {
  //设置颜色。设置存储的值
  chrome.storage.sync.set({
    color,
  });
  console.log("Default background color set to %cgreen", `color: ${color}`);
});

//#endregion

//#region service worker通信
//这个好像是和service worker通信api。所以，应该是sendMessage时候触发
chrome.runtime.onMessage.addListener(({ type, name }) => {
  if (type === "set-name") {
    chrome.storage.local.set({ name });
  }
});

chrome.action.onClicked.addListener((tab) => {
  chrome.storage.local.get(["name"], ({ name }) => {
    chrome.tabs.sendMessage(tab.id, { name });
  });
});
//#endregion

//#region  service worker使用定时器、计时器 顶层注册，后面使用
chrome.alarms.create({ delayInMinutes: 3 });

chrome.alarms.onAlarm.addListener(() => {
  chrome.action.setIcon({
    path: "./images/icon.png",
  });
});
//#endregion

//#region 解析网页  Service Worker 无法访问 DOMParser API 或创建 <iframe> 来解析和遍历文档。
//但我们可以：创建新选项卡或使用库（undom、jsdom）
//需要完整原生浏览器环境的扩展可以使用 service worker 内部的 chrome.windows.create()和 chrome.tabs.create() API 来创建真正的浏览器窗口。此外，
//#endregion

//#region 音视频处理
// 目前无法直接在 Service Worker 中播放或捕获媒体。
// 为了使 Manifest V3 扩展能够利用网络的媒体播放和捕获功能，
// 该扩展需要使用 chrome.windows.create() 或 chrome.tabs.create() 创建一个窗口环境。
// 创建后，扩展可以使用消息传递(message passing)在播放文档和服务工作者之间进行协调。
//#endregion
