# ClipMark

智能剪贴板转 Markdown 工具 - 自动将网页复制内容转换为 AI 友好的 Markdown 格式

## 快速开始

### 系统要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Chrome 浏览器

### 安装

```bash
# 安装依赖
pnpm install

# 构建所有包
pnpm build

# 启动 MCP 服务器
pnpm start
```

### 加载扩展

1. 打开 Chrome 浏览器，访问 `chrome://extensions/`
2. 启用"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择 `packages/extension/dist` 目录

### 使用

1. 在任何网页上复制内容（Ctrl/Cmd + C）
2. 扩展自动将内容转换为 Markdown 格式
3. 通过 MCP 工具在 Claude Code 等 AI 工具中使用

## 包介绍

### @clipmark/extension

Chrome 浏览器扩展
- 监听页面复制事件，捕获 HTML 和纯文本
- 根据来源 URL 智能选择转换器
- 支持本地存储和历史管理
- 通过 HTTP API 同步到 MCP 服务器

### @clipmark/mcp-server

MCP 服务器
- 提供 HTTP API（端口 37283）
- 实现 MCP 协议（stdio）
- 文件存储（`~/.clipmark/data.json`）
- 支持健康检查、CRUD 操作

### @clipmark/shared

共享代码库
- 类型定义（ClipItem、SaveItemRequest 等）
- 转换器系统（支持扩展自定义转换器）
- 工具函数和常量配置

## 常用命令

```bash
# 开发模式
pnpm dev

# 构建生产版本
pnpm build

# 启动 MCP 服务器
pnpm start

# 代码检查
pnpm lint
pnpm format
pnpm type-check
```

## 项目结构

```
clipmark/
├── packages/
│   ├── extension/      # Chrome 扩展
│   ├── mcp-server/     # MCP 服务器
│   └── shared/         # 共享代码
├── CLAUDE.md           # Claude Code 项目指南
└── README.md           # 本文件
```

## 配置 MCP 客户端

在 `~/.config/claude/claude_desktop_config.json` 中添加：

```json
{
  "mcpServers": {
    "clipmark": {
      "command": "node",
      "args": ["/path/to/clipmark/packages/mcp-server/dist/index.js"]
    }
  }
}
```

## 许可证

MIT
