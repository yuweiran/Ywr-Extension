let changeColor = document.getElementById("btn");

chrome.storage.sync.get("color", ({ color }) => {
  //拿到颜色
  changeColor.style.backgroundColor = color;
});

const setPageBackgroundColor = () => {
  chrome.storage.sync.get("color", ({ color }) => {
    document.body.style.backgroundColor = color;
  });
};

// 单击按钮时，执行setPageBackgroundColor
changeColor.addEventListener("click", async () => {
  //拿到当前标签页tab
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  //执行脚本
  //以下报错是说不要在chrome://开头的页面执行
  //"Uncaught (in promise) Error: Cannot access a chrome://URL"

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: setPageBackgroundColor,
  });
});
