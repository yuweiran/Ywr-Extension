// //接收数据
chrome.runtime.onMessage.addListener(async ({ keyword }, sender, sendResponse) => {
  // const response = await fetch('https://api.bing.com/qsonhs.aspx?type=cb&q=apple', {
  //   mode: 'no-cors',
  //   credentials: "include"
  // })
  // console.log(response)
  sendResponse({ response: "Hello from Service Worker!" }); // 发送响应消息
});
