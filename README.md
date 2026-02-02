# ClipMark

智能剪贴板转 Markdown 工具

## 项目简介

ClipMark 是一个 Chrome 浏览器扩展，用于将用户从网页中复制的内容自动转换为 AI 友好的 Markdown 格式，并通过 MCP (Model Context Protocol) 服务提供给 AI 工具使用。

### 核心功能

- 自动监听剪贴板复制事件
- 智能转换 HTML 为 Markdown 格式
- 支持腾讯文档等特殊网站的转换策略
- 本地存储历史记录
- MCP 服务接口供 AI 工具调用

## 技术栈

- **语言**: TypeScript 5.x
- **包管理**: pnpm (monorepo)
- **构建工具**: Vite + CRXJS
- **浏览器扩展**: Chrome Manifest V3
- **MCP 协议**: @modelcontextprotocol/sdk

## 项目结构

```
clipmark/
├── packages/
│   ├── extension/          # Chrome 扩展
│   ├── mcp-server/         # MCP 服务
│   └── shared/             # 共享代码（类型、工具函数、常量）
├── pnpm-workspace.yaml
├── package.json
└── tsconfig.json
```

## 开发

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
# 开发所有包
pnpm dev

# 开发特定包
pnpm --filter @clipmark/extension dev
pnpm --filter @clipmark/mcp-server dev
pnpm --filter @clipmark/shared dev
```

### 构建

```bash
# 构建所有包
pnpm build

# 构建特定包
pnpm --filter @clipmark/extension build
pnpm --filter @clipmark/mcp-server build
pnpm --filter @clipmark/shared build
```

### 代码检查

```bash
# 运行 ESLint
pnpm lint

# 格式化代码
pnpm format

# 类型检查
pnpm type-check
```

## 包说明

### @clipmark/extension

Chrome 浏览器扩展，负责监听剪贴板事件和内容转换。

### @clipmark/mcp-server

MCP 服务，提供 HTTP API 和 MCP 协议接口。

### @clipmark/shared

共享代码，包含类型定义、工具函数和转换策略。

## 开发计划

详细的开发计划请参考 [TODO.md](./TODO.md)

## 许可证

MIT
