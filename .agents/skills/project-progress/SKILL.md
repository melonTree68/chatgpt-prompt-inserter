---
name: project-progress
description: 记录 chatgpt-prompt-inserter 项目各模块或功能已经完成的内容、动机、实现路径和对应 skill。用于快速了解当前项目进展，并维护各功能独立归档边界。
---

# Project Progress

## 维护原则

- 本 skill 只记录全局进展索引：每个模块或功能的动机、已实现功能、简要实现路径和对应 skill。
- 每个功能必须有独立 project-local skill，功能细节、调试流程、常见问题和后续维护说明归档到对应功能 skill。
- 不同功能的知识不要混写到同一个功能 skill。新增非 prompt insertion 功能时，优先使用 `$skill-creator` 在 `.agents/skills` 下创建新的 project-local skill，再在本 skill 中登记进展。
- `project-progress` 和 `project-story` 是全局标准 skill，不能替代具体功能 skill。

## 仓库基础

- 动机：让项目从空仓库进入可维护状态，避免系统生成文件污染版本历史。
- 已实现功能：新增 `.gitignore`，忽略 `.DS_Store`。
- 实现路径：在仓库根目录维护 Git 忽略规则，并按独立 objective 提交。
- 对应 skill：本 skill。

## Prompt Insertion

- 动机：在 ChatGPT 网页端快速复用常用 prompt，只填入输入框，不自动发送。
- 已实现功能：新增单文件 Tampermonkey 脚本，提供浮动入口、compact picker、prompt 管理主面板、Add/Edit/Delete、持久化存储和 composer 插入。
- 实现路径：`chatgpt-prompt-inserter.user.js` 通过 Tampermonkey `GM_getValue` / `GM_setValue` 管理 prompt；通过 DOM 注入 UI；通过 textarea/contenteditable 插入策略同步 ChatGPT composer。
- 对应 skill：`prompt-insertion`。

## Prompt List Import/Export

- 动机：prompt list 需要可备份、迁移和在不同浏览器或 Tampermonkey 环境间复用。
- 已实现功能：Prompt Manager 支持导出 JSON 数组文件、从 JSON 数组文件合并导入 prompt、跳过同名同内容重复项，并在 userscript metadata 中配置 ChatGPT 官方 favicon URL。
- 实现路径：`chatgpt-prompt-inserter.user.js` 使用浏览器原生 `Blob` / download link 导出；使用隐藏 file input 读取 JSON；导入时清洗字段、重建 id、保留合法时间字段并调用现有 `savePrompts()` 刷新 UI 和存储。
- 对应 skill：`prompt-list-io`。

## 功能级知识解耦

- 动机：项目即将开发 prompt insertion 之外的功能，需要避免单个功能 skill 承载整个项目知识，降低后续维护耦合。
- 已实现功能：明确每个功能对应一个独立 project-local skill；现有 `prompt-insertion` skill 只覆盖 prompt insertion；新增功能必须创建或更新自己的功能 skill。
- 实现路径：在标准项目 skills 中记录全局归档原则；在功能 skill 中声明适用边界和排除范围。
- 对应 skill：本 skill、`project-story`、`prompt-insertion`。

## 项目知识管理

- 动机：让后续开发者或 agent 能直接从项目本地 skill 理解系统状态和维护约束。
- 已实现功能：维护 `prompt-insertion`、`prompt-list-io` 等功能级 skill，并补齐 `project-progress` 与 `project-story` 两个标准项目 skill；确立功能级 skill 解耦规则。
- 实现路径：知识统一归档到 `.agents/skills`，不额外创建临时报告或独立 docs。
- 对应 skill：本 skill、`project-story`、`prompt-insertion`、`prompt-list-io`。
