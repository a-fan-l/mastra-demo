# Mastra Demo

这是一个基于 Mastra 框架的演示项目，展示了如何使用 Mastra 构建 AI 驱动的应用程序。

## 项目简介

该项目是一个使用 Mastra 框架构建的 AI 应用示例，集成了多种 AI 服务和工具，包括：
- OpenAI
- Cohere
- Google AI
- Pinecone 向量数据库
- MongoDB
- PostgreSQL
- LibSQL

## 技术栈

- TypeScript
- React
- Mastra Framework
- 多种 AI 服务和数据库集成

## 安装

1. 确保你的系统已安装 Node.js (推荐 v16 或更高版本)

2. 克隆项目并安装依赖：
```bash
git clone [项目地址]
cd mastra-demo
yarn install
```

## 开发

启动开发服务器：
```bash
yarn dev
```

## 构建

构建生产版本：
```bash
yarn build
```

## 项目结构

```
src/
├── mastra/
│   ├── agents/      # AI 代理定义
│   ├── database/    # 数据库配置和模型
│   ├── memories/    # 记忆管理
│   ├── rag/         # 检索增强生成
│   ├── services/    # 服务层
│   ├── tools/       # 工具函数
│   ├── workflows/   # 工作流程定义
│   └── index.ts     # 入口文件
```

## 主要功能

- AI 代理系统
- 向量数据库集成
- 多种数据库支持
- RAG (检索增强生成) 实现
- 工作流程管理

## 依赖

主要依赖包括：
- @mastra/core
- @mastra/libsql
- @mastra/memory
- @mastra/mongodb
- @mastra/pg
- @mastra/pinecone
- @mastra/rag
- React 及相关库
- 多种 AI SDK

## 许可证

ISC 