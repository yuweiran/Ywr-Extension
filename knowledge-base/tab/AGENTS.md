# 新标签页知识库

## 概览
`tab/` 是项目主界面，也是仓库中复杂度最高的区域。它负责搜索、集合管理、侧栏标签与历史、主题切换、背景设置、拖拽排序等核心体验。

## 结构
```text
knowledge-base/tab/AGENTS.md  # 当前文档，对应源码 tab/

tab/
|- index.html                 # 主页面与完整脚本加载链
`- src/
   |- css/                    # 新标签页样式系统
   |- img/                    # 图标与 SVG 资源
   |- base/                   # 本地图标字体资源
   `- js/
      |- apis/                # UI 到数据层的桥接
      |- components/          # 自定义组件
      |- fun_module/          # declare/execute 功能模块
      |- indexeddb/           # 持久化层
      |- store/               # 运行期缓存
      |- load.js              # 页面启动入口
      |- settings-manager.js  # 背景/设置状态管理
      `- theme-switcher.js    # 主题切换与保存
```

## 去哪里看
任务：调整页面组成或脚本装配
位置：tab/index.html

任务：修改搜索、集合、侧栏、工具区交互
位置：tab/src/js/fun_module/

任务：修改集合和链接的数据流、导入导出
位置：tab/src/js/apis/ 与 tab/src/js/indexeddb/

任务：修改主题与背景保存逻辑
位置：tab/src/js/theme-switcher.js 与 tab/src/js/settings-manager.js

## 约定
- `tab/index.html` 的 script 顺序就是依赖顺序，不能随意重排。
- `window.onload` 在 `tab/src/js/load.js` 中作为最终启动门。
- 页面同时直接调用 Chrome Tabs、Windows、History API。
- `$store` 是缓存层，不是最终真相；很多渲染前仍要从 IndexedDB 回填。

## 本目录反模式
- 不要把这里当成现代 SPA 去理解，它是命令式初始化 + 全局对象协作。
- 不要在 UI 模块里随意新增持久化写法，应优先走 `$apis` 或 IndexedDB 封装。
- 不要只改 execute 文件而忽略 declare 文件中的元素缓存和前置状态。

## 备注
- 如果要大改新标签页，先继续阅读本知识库下的 `fun_module/` 和 `src/js/indexeddb/` 子文档。