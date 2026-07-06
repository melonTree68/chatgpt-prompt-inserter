---
name: project-progress
description: 记录 prompt-dock 项目各模块或子系统已经完成的内容、动机、实现路径和对应 skill。用于快速了解当前项目进展。
---

# Project Progress

## 仓库基础

- 动机：让项目从空仓库进入可维护状态，避免系统生成文件污染版本历史。
- 已实现功能：新增 `.gitignore`，忽略 `.DS_Store`。
- 实现路径：在仓库根目录维护 Git 忽略规则，并按独立 objective 提交。
- 对应 skill：本 skill。

## ChatGPT Prompt Inserter

- 动机：在 ChatGPT 网页端快速复用常用 prompt，只填入输入框，不自动发送。
- 已实现功能：新增单文件 Tampermonkey 脚本，提供浮动入口、compact picker、prompt 管理主面板、Add/Edit/Delete、持久化存储和 composer 插入。
- 实现路径：`chatgpt-prompt-inserter.user.js` 通过 Tampermonkey `GM_getValue` / `GM_setValue` 管理 prompt；通过 DOM 注入 UI；通过 textarea/contenteditable 插入策略同步 ChatGPT composer。
- 对应 skill：`chatgpt-prompt-inserter`。

## 项目知识管理

- 动机：让后续开发者或 agent 能直接从项目本地 skill 理解系统状态和维护约束。
- 已实现功能：新增专门的 `chatgpt-prompt-inserter` skill，并补齐 `project-progress` 与 `project-story` 两个标准项目 skill。
- 实现路径：知识统一归档到 `.agents/skills`，不额外创建临时报告或独立 docs。
- 对应 skill：本 skill、`project-story`、`chatgpt-prompt-inserter`。
