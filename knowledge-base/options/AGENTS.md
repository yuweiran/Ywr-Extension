# 设置页知识库

## 概览
设置页负责主题、自定义背景、透明度、个人资料等配置，采用比新标签页更轻量的 declare/execute 双阶段结构。

## 结构
```text
knowledge-base/options/AGENTS.md  # 当前文档，对应源码 options/

options/
|- index.html            # 页面骨架与脚本加载顺序
|- load.js               # onload 启动入口
`- src/
   |- css/               # 设置页样式
   `- js/
      |- declare/        # DOM 获取、渲染辅助
      `- execute/        # 事件绑定、副作用处理
```

## 去哪里看
任务：新增一个设置分组
位置：options/index.html 与 options/src/js/declare/、options/src/js/execute/

任务：修改主题展示或主题交互
位置：options/src/js/declare/theme.js 与对应 execute 文件

任务：修改背景图、透明度、资料相关设置
位置：options/src/js/declare/ 和 execute/ 下同名文件

## 约定
- 页面脚本顺序固定：公共工具 -> declare -> execute -> load.js。
- declare 文件输出全局 `$...` 对象，execute 文件直接假定其已存在。
- `load.js` 只做轻启动，不承担重业务逻辑。

## 本目录反模式
- 不要把单个功能拆成不对称的 declare/execute 结构。
- 不要在这里引入只适用于 tab 页的数据逻辑。
- 不要误以为这里支持模块导入，当前仍依赖全局脚本。

## 备注
- 与 tab 页相比，这里复杂度明显低，但模式一致，是理解全局脚本架构的第二入口。