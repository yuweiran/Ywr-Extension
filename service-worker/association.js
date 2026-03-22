chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "suggest") {
    const keyword = message.keyword;
    fetch(`https://suggestion.baidu.com/su?wd=${encodeURIComponent(keyword)}&action=opensearch`)
      .then((res) => res.arrayBuffer())
      .then((buf) => JSON.parse(new TextDecoder("gbk").decode(buf)))
      .then((data) => {
        // OpenSearch 格式: ["keyword", ["建议1", "建议2", ...]]
        const suggestions = Array.isArray(data[1]) ? data[1] : [];
        console.log("Received suggestions:", suggestions);
        sendResponse({ suggestions });
      })
      .catch(() => {
        sendResponse({ suggestions: [] });
      });
    return true; // 保持 sendResponse 通道打开（异步响应）
  }
});
