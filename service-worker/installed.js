let color = "#3aa757";
chrome.runtime.onInstalled.addListener(() => {
  console.log('onInstalled')
  //加个off标签文字
  // chrome.action.setBadgeText({
  //   text: "OFF",
  // });
  chrome.storage.sync.set({
    color,
  });
  console.log("Default background color set to %cgreen", `color: ${color}`);
});
