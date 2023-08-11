
chrome.alarms.create('testAlarms',{
  delayInMinutes: 0.1,//延迟触发
  periodInMinutes: 0.2,//触发频率
});
chrome.alarms.onAlarm.addListener(function(alarm) {
  console.log("定时器触发了！");
  // chrome.alarms.clear("myAlarm");
});
//获取所有定时器
chrome.alarms.getAll(function(alarms) {
  console.log(alarms);
});