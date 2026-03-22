# 项目知识库

生成时间：2026-03-22
提交：121ff78
分支：master

## 概览
这是一个基于 Manifest V3 的浏览器扩展项目，包含四个主要运行面：后台 Service Worker、新标签页覆盖、选项页、弹窗。
仓库没有构建步骤、包管理器和测试框架，除 Service Worker 外的大部分前端代码依赖传统 script 标签顺序加载和全局 `$...` 对象协作。

## 目录结构
```text
Ywr-Extension/
|- manifest.json                # 扩展入口、权限、运行面声明
|- service-worker/              # 后台事件监听与生命周期逻辑
|- tab/                         # 新标签页主界面，项目复杂度最高
|  |- src/js/fun_module/        # declare/execute 双阶段功能模块
|  `- src/js/indexeddb/         # 本地持久化与表结构封装
|- options/                     # 设置页，较轻量的 declare/execute 架构
|- popup/                       # 快捷弹窗
|- utils/                       # 共享工具与 UI 辅助方法
|- js/content.js                # 页面内容脚本，当前未在 manifest 中显式注册
|- vender/                      # 直接随仓库提交的第三方脚本
`- knowledge-base/              # 当前知识库目录
```

## 去哪里看
任务：修改扩展入口、权限、快捷键、新标签页覆盖
位置：manifest.json

任务：查看安装时默认值、消息监听、标签页事件
位置：service-worker/

任务：修改新标签页主功能、集合、搜索、拖拽、历史与标签侧栏
位置：tab/

任务：修改集合/链接的持久化、导入导出与排序
位置：tab/src/js/apis/ 与 tab/src/js/indexeddb/

任务：修改设置页主题、背景、透明度、个人资料
位置：options/

任务：修改弹窗逻辑
位置：popup/

任务：修改通知、表单、下拉框、DOM 查询等公共行为
位置：utils/

## 代码地图
符号：service-worker/index.js
作用：后台入口，通过导入子模块触发监听器注册

符号：$collections
作用：新标签页中负责集合渲染、拖拽排序、链接和集合 CRUD
位置：tab/src/js/fun_module/declare/collections.js 与 execute/collection.js

符号：$apis
作用：UI 与 IndexedDB 之间的数据桥接，包含配置导入导出
位置：tab/src/js/apis/index.js

符号：IndexedModel / initIndexedDB
作用：IndexedDB 的轻量封装与数据库初始化
位置：tab/src/js/indexeddb/index.js

符号：$store
作用：运行期缓存 collections、links、tabs、history
位置：tab/src/js/store/index.js

## 约定
- Service Worker 使用 ES Module；tab、options、popup 仍是传统脚本顺序加载。
- 共享对象通常挂在全局 `$name` 命名空间上，而不是使用 import/export。
- `declare/` 文件负责拿 DOM、缓存元素、暴露方法；`execute/` 文件负责绑定事件和副作用。
- `tab/index.html` 的 script 顺序本身就是运行时依赖图，改动顺序要格外谨慎。
- 持久化分三层：`chrome.storage.sync` 保存扩展级设置，`localStorage` 保存页面局部状态，IndexedDB 保存集合和链接等结构化数据。

## 本项目反模式
- 不要只把 declare/execute 链中的某一个文件改成模块化写法，否则会打断整个加载顺序。
- 不要默认 `js/content.js` 一定生效，它目前并没有直接出现在 manifest 的入口声明里。
- 不要在 `initIndexedDB()` 完成之前使用 `$indexedDB`。
- 不要在各个 execute 文件里随意新增存储键，优先沿用已有管理边界。
- 不要把知识库文件再散落回源码目录，本仓库当前约定统一放在 knowledge-base/ 下。

## 项目个性
- 新标签页是项目主战场，UI、浏览器 API、存储层、拖拽交互都堆叠在这里。
- 项目采用自定义的 declare/execute 双阶段模式，而不是现代框架或打包方案。
- 仓库里存在少量占位文件，例如 service-worker/background.js。

## 常用操作
```text
加载扩展：chrome://extensions -> 加载已解压的扩展程序 -> 仓库根目录
修改后刷新：chrome://extensions -> 点击 Reload
查看后台：chrome://extensions -> Service Worker -> Inspect
打开设置页：扩展管理页或 chrome-extension://<id>/options/index.html
打开新标签页：加载扩展后新开一个浏览器标签
构建/测试：仓库内未提供
```

## 备注
- 当前知识库按源码结构镜像存放在 knowledge-base/ 中，不直接写回源码目录。
- 优先阅读本文件，再根据问题进入子文档。