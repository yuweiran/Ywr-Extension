# 搜索联想词功能设计文档

> 日期：2026-03-22  
> 状态：已审核  
> 对应 TODO：缺失模块 — 搜索联想词 / 搜索建议

---

## 概述

为新标签页搜索框新增搜索联想词功能。用户输入时，通过 Service Worker 中转请求百度 OpenSearch 建议接口，在搜索框下方显示联想词面板，支持键盘 ↑↓ 导航、Enter 确认、Esc 关闭。

## 决策记录

| 决策点 | 选项 | 选定 | 理由 |
|--------|------|------|------|
| 数据源 | 跟随引擎 / 固定百度 / 纯本地 | **固定百度** | 实现简单，百度中文联想质量好 |
| 交互方式 | 简单列表 / 带键盘导航 | **带键盘导航** | 体验完整，与主流搜索框一致 |
| 网络请求 | 前端 JSONP / Service Worker 中转 | **SW 中转** | 集中管理网络请求，后续可扩展 |
| UI 方案 | 独立面板 / 复用 Dropdown / Web Component | **独立面板** | 边界清晰，不污染已有组件 |

## 架构与数据流

```
用户输入 → 400ms 防抖 → chrome.runtime.sendMessage({type:"suggest", keyword})
                              ↓
                    Service Worker (association.js)
                    fetch("https://suggestion.baidu.com/su?wd=xxx&action=opensearch")
                              ↓
                    解析 JSON → sendResponse(suggestions[])
                              ↓
                    execute/search.js 收到结果
                              ↓
                    渲染联想词面板 (suggestion-list)
                              ↓
               点击/Enter → 填入搜索框 → 调用 retrieveContent() 搜索
               ↑↓ 键 → 切换高亮项
               Esc/点外 → 隐藏面板
```

**百度 API**：`https://suggestion.baidu.com/su?wd={keyword}&action=opensearch`  
返回格式：`["keyword", ["建议1", "建议2", ...]]`

## 需要改动的文件

### 1. manifest.json

新增 `host_permissions`：

```json
"host_permissions": [
  "https://suggestion.baidu.com/*"
]
```

### 2. service-worker/association.js

替换当前空壳逻辑。接收 `{type: "suggest", keyword}` 消息，fetch 百度建议接口，返回字符串数组。

- 非 `suggest` 类型消息保持原逻辑不变
- fetch 失败时返回空数组，不抛错
- 使用 `return true` 保持 sendResponse 通道打开（异步响应）

### 3. tab/index.html

在 `#user_search_area` 内、`#user_input_area` 之后添加：

```html
<div class="suggestion-list" id="suggestion-list"></div>
```

### 4. tab/src/js/fun_module/declare/search.js

新增声明：

- `suggestionList` — `#suggestion-list` DOM 引用
- `activeIndex` — 当前高亮索引（-1 表示无选中）
- `originalInput` — 记住用户实际输入（↑↓ 导航时需要恢复）
- `renderSuggestions(items)` — 渲染面板项，每项 class `suggestion-item`
- `showSuggestions()` / `hideSuggestions()` — 显示/隐藏面板
- `highlightItem(index)` — 设置高亮样式，同步填入搜索框
- `getActiveText()` — 获取当前高亮项文本

### 5. tab/src/js/fun_module/execute/search.js

改写 `input` 事件监听：

- 400ms 防抖
- 输入为空 → 隐藏面板，不发请求
- 输入非空 → `chrome.runtime.sendMessage({type:"suggest", keyword})`
- 收到响应 → 截断至 8 条 → `renderSuggestions()` → `showSuggestions()`

改写 `keyup`/`keydown` 事件：

- `ArrowDown` → activeIndex + 1（循环到 0），高亮项文字填入搜索框
- `ArrowUp` → activeIndex - 1（循环到末尾），高亮项文字填入搜索框
- `Enter` → 有高亮用高亮项搜索，否则用原始输入搜索；隐藏面板
- `Escape` → 隐藏面板，恢复 originalInput

点击事件（事件委托在 `suggestion-list` 上）：

- 点击 `.suggestion-item` → 填入搜索框 → `retrieveContent()`

### 6. tab/src/css/search.css

新增样式：

```css
.suggestion-list {
  display: none;                    /* 默认隐藏 */
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg-2);
  border: 1px solid var(--border-1);
  border-top: none;
  border-radius: 0 0 0.5rem 0.5rem;
  max-height: 320px;
  overflow-y: auto;
  z-index: 100;
}

.suggestion-list.is-visible {
  display: block;
}

.suggestion-item {
  padding: 0.5rem 1rem;
  cursor: pointer;
  color: var(--text-1);
  font-size: 0.875rem;
}

.suggestion-item.is-active {
  background: var(--bg-3);
}

.suggestion-item:hover {
  background: var(--bg-3);
}
```

`#user_search_area` 需补充 `position: relative` 以确保面板定位正确。

## 行为规则

- 防抖 400ms，快速输入不频繁请求
- 面板最多显示 8 条
- `activeIndex` 初始 -1（无选中），↑↓ 循环：-1 → 0 → 1 → ... → 7 → -1
- ↑↓ 切换时把高亮文字填入输入框，但保留 `originalInput`
- Enter 无高亮 → 用输入框当前值搜索；有高亮 → 用高亮项搜索
- Esc → 隐藏面板，输入框恢复 `originalInput`
- 点击面板外 → 隐藏面板（复用已有 `document.body click → $dropdown.hidden()` 旁加一句 `$searchEles.hideSuggestions()`）
- 网络错误 → 静默失败，不显示面板，不影响正常搜索
- 输入框获得焦点且有缓存结果 → 不重新请求，直接显示上次结果

## 不做的事情

- 不做搜索引擎级联切换（固定百度）
- 不做本地集合/链接混合搜索（属于独立 TODO 项）
- 不做搜索历史记录
- 不改 `vender/fetch-jsonp.js`（SW 中转用原生 fetch，无需 JSONP）
