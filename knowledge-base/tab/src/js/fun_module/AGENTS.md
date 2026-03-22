# 新标签页功能模块知识库

## 概览
`fun_module/` 是新标签页的功能层，采用 declare/execute 双阶段组织：declare 负责定义和缓存，execute 负责真正把行为挂到页面上。

## 结构
```text
knowledge-base/tab/src/js/fun_module/AGENTS.md  # 当前文档，对应源码 tab/src/js/fun_module/

fun_module/
|- declare/
|  |- aside.js
|  |- collections.js
|  |- links.js
|  |- search.js
|  |- section.js
|  `- tools.js
`- execute/
   |- aside.js
   |- collection.js
   |- links.js
   |- search.js
   |- section.js
   `- tool.js
```

## 去哪里看
任务：修改搜索引擎选择、提交行为
位置：declare/search.js 与 execute/search.js

任务：修改集合渲染、拖拽排序、链接和集合增删改
位置：declare/collections.js 与 execute/collection.js

任务：修改侧栏折叠、标签列表、历史列表
位置：declare/aside.js、declare/section.js 与对应 execute 文件

任务：修改工具区和附加入口
位置：declare/tools.js 与 execute/tool.js

## 约定
- declare 文件通常会缓存 DOM 节点并返回一个全局模块对象。
- execute 文件不重复定义结构，只消费 declare 暴露的对象和方法。
- 集合和链接相关的数据写入优先经过 `$apis`，而不是直接操作 `$indexedDB`。
- 拖拽排序依赖 Sortable，排序后会显式更新 order 字段。

## 本目录反模式
- 不要把 CRUD 逻辑直接写进 HTML 内联事件。
- 不要绕过 `$apis` 直接在功能文件里读写 IndexedDB，除非你在重构数据边界。
- 不要单独重命名 declare/execute 对应文件，否则阅读和定位成本会急剧上升。

## 备注
- `collections.js` 是当前最重的功能模块之一，涉及渲染、拖拽、弹窗、批量排序等多重职责。