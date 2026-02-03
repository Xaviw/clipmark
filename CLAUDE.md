# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 常用命令

```bash
# 开发所有包
pnpm dev

# 构建所有包
pnpm build

# 启动 MCP 服务器
pnpm start

# 代码检查
pnpm lint
pnpm format
pnpm type-check
```

## 项目架构

ClipMark 是一个 monorepo 项目，包含三个核心包：

- **`@clipmark/extension`** - Chrome 浏览器扩展，负责监听页面复制事件并捕获内容
- **`@clipmark/mcp-server`** - MCP 服务器，提供 HTTP API 和 MCP 协议接口
- **`@clipmark/shared`** - 共享代码库，包含类型定义、工具函数和转换策略

### 核心工作流程

1. **内容捕获**：用户在网页复制内容时，Content Script 监听 `copy` 事件并通过 Clipboard API 读取 HTML 和纯文本
2. **内容转换**：Background Service Worker 根据来源 URL 选择合适的转换器，将 HTML 转换为 Markdown
3. **本地存储**：保存到 Chrome 本地存储（`chrome.storage.local`）
4. **服务器同步**：通过 HTTP API 同步到 MCP 服务器，保存到文件系统（`~/.clipmark/data.json`）
5. **AI 工具集成**：通过 MCP 协议或 HTTP API 暴露给 AI 工具调用

### 数据存储架构

**扩展端存储**：
- 使用 `chrome.storage.local` 存储剪贴板历史
- 提供本地 Popup UI 查看和管理
- 数据结构与服务器端保持一致

**服务器端存储**：
- 文件路径：`~/.clipmark/data.json`
- 使用 `FileStorage` 类实现文件存储管理（见 [storage.ts](packages/mcp-server/src/server/storage.ts)）
- 采用内存缓存 + 文件持久化的双层架构
- 支持数据版本控制和损坏恢复
- 单例模式确保多进程场景下的数据一致性

### 转换器系统

转换器位于 [packages/shared/src/converters/](packages/shared/src/converters/)，采用策略模式设计：

- **`ContentConverter` 接口** ([base.ts](packages/shared/src/converters/base.ts)): 所有转换器必须实现 `convert()` 和 `supports()` 方法
- **`DefaultConverter`**: 使用 Turndown 将 HTML 转换为 Markdown，作为兜底策略
- **`TencentConverter`**: 专门处理腾讯文档的转换

添加新转换器时：

1. 创建新类实现 `ContentConverter` 接口
2. 在 extension 的 [clipboard.ts](packages/extension/src/background/clipboard.ts) 中注册转换器
3. 转换器按 `supports()` 返回值优先匹配，首个匹配的转换器将被使用

### MCP 服务器架构

MCP 服务器支持两种运行模式：

- **HTTP 模式**：提供 REST API 端点
  - 默认端口：`37283`
  - 健康检查：`GET /health`
  - 保存项目：`POST /api/items`
  - 获取项目：`GET /api/items/:id`
  - 删除项目：`DELETE /api/items/:id`
  - 批量删除：`DELETE /api/items`
  - 见 [routes/items.ts](packages/mcp-server/src/routes/items.ts)

- **MCP 模式**：通过 stdio 实现的 MCP 协议
  - 配置文件：`~/.config/claude/claude_desktop_config.json`
  - 见 [server/mcp.ts](packages/mcp-server/src/server/mcp.ts)

MCP 工具：

- `get_latest_capture`: 获取最新的剪贴板内容
- `get_capture_by_id`: 根据 ID 获取历史记录

**扩展与服务器通信**（见 [api.ts](packages/extension/src/background/api.ts)）：
- 使用 `fetch` API 进行 HTTP 通信
- 内置超时控制（`API_CONFIG.TIMEOUT`）
- 静默失败机制：服务器不可用时不影响扩展功能
- 支持健康检查、保存、删除等操作

### 容错机制

- **转换失败**：保存原始纯文本作为降级方案
- **API 同步失败**：静默处理，确保本地存储不丢失
- **数据文件损坏**：自动备份损坏文件并创建新的空数据文件
- **多进程同步**：每次读取前重新加载文件，确保数据一致性
- **单例模式**：`FileStorage` 使用单例模式避免多实例冲突

## 开发指南

### 本地开发

1. **安装依赖**：
   ```bash
   pnpm install
   ```

2. **开发模式**：
   ```bash
   # 同时开发所有包
   pnpm dev
   ```

3. **构建生产版本**：
   ```bash
   pnpm build
   ```

4. **启动 MCP 服务器**：
   ```bash
   pnpm start
   # 服务器将在 http://localhost:37283 启动
   ```

### 加载扩展进行测试

1. 构建扩展：`pnpm --filter @clipmark/extension build`
2. 打开 Chrome 浏览器，访问 `chrome://extensions/`
3. 启用"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `packages/extension/dist` 目录

### MCP 工具测试

服务器启动后，可以通过以下方式测试：

```bash
# 健康检查
curl http://localhost:37283/health

# 获取最新项目（使用 MCP 工具）
# 在 Claude Code 或其他 MCP 客户端中调用
```

### 添加新转换器

1. 在 `packages/shared/src/converters/` 创建新类
2. 实现 `ContentConverter` 接口的 `convert()` 和 `supports()` 方法
3. 在 `packages/extension/src/background/clipboard.ts` 中注册转换器
4. 转换器按注册顺序和 `supports()` 返回值优先匹配

### 调试技巧

- **扩展调试**：在 `chrome://extensions/` 中查看 Service Worker 日志
- **服务器调试**：使用 `pnpm start` 启动时查看控制台输出
- **数据检查**：查看 `~/.clipmark/data.json` 文件内容
- **网络请求**：在 Chrome DevTools 的 Network 面板查看 API 调用

## 技术栈

- **语言**: TypeScript 5.x
- **包管理**: pnpm 10.x (monorepo)
- **构建工具**:
  - Vite + CRXJS (扩展)
  - tsup (共享包和 MCP 服务器)
- **MCP 协议**: @modelcontextprotocol/sdk
- **HTML 解析**: linkedom
- **HTML 转 Markdown**: turndown
- **存储**: JSON 文件 + 内存缓存

## 开发注意事项

### 系统要求
- Node.js >= 18.0.0
- pnpm >= 8.0.0 (推荐 10.x)
- Chrome 浏览器 (扩展开发)

### 架构设计原则
- **类型安全**: 所有包通过 `@clipmark/shared` 共享类型定义
- **容错优先**: 所有外部调用都有降级方案
- **性能优化**: 使用内存缓存减少文件 I/O
- **向后兼容**: 支持数据版本控制和迁移

### Chrome 扩展特性
- 使用 Manifest V3
- Service Worker 替代 Background Page
- Content Script 与 Background 通过消息传递通信
- 支持 Clipboard API 读取 HTML 和纯文本

### MCP 协议集成
- 支持标准 MCP 协议（stdio）
- 同时提供 HTTP API 供其他工具集成
- 工具返回结构化的 `ClipItem` 数据
- 支持根据 ID 查询历史记录

## 项目结构

```
clipmark/
├── packages/
│   ├── extension/              # Chrome 浏览器扩展
│   │   ├── src/
│   │   │   ├── background/     # Service Worker (后台脚本)
│   │   │   │   ├── index.ts    # 主入口
│   │   │   │   ├── clipboard.ts # 剪贴板处理和转换器
│   │   │   │   └── api.ts      # MCP 服务器通信
│   │   │   ├── content-scripts/ # 内容脚本
│   │   │   └── popup/          # 弹出窗口 UI
│   │   ├── manifest.json       # 扩展清单
│   │   └── vite.config.ts      # Vite 构建配置
│   │
│   ├── mcp-server/             # MCP 服务器
│   │   ├── src/
│   │   │   ├── routes/         # HTTP API 路由
│   │   │   │   ├── health.ts   # 健康检查
│   │   │   │   └── items.ts    # 项目 CRUD
│   │   │   └── server/         # 服务器核心
│   │   │       ├── index.ts    # 主入口
│   │   │       ├── http.ts     # HTTP 服务器
│   │   │       ├── mcp.ts      # MCP 协议实现
│   │   │       └── storage.ts  # 文件存储管理
│   │   └── tsup.config.ts      # tsup 构建配置
│   │
│   └── shared/                 # 共享代码库
│       ├── src/
│       │   ├── converters/     # HTML 转 Markdown 转换器
│       │   │   ├── base.ts     # 转换器接口
│       │   │   ├── default.ts  # 默认转换器
│       │   │   └── tencent.ts  # 腾讯文档转换器
│       │   ├── types/          # 类型定义
│       │   ├── utils/          # 工具函数
│       │   └── constants/      # 常量配置
│       └── tsup.config.ts
│
├── package.json                # 根 package.json
├── pnpm-workspace.yaml         # pnpm monorepo 配置
├── tsconfig.json               # TypeScript 根配置
└── CLAUDE.md                   # 本文件
```

## 常见问题

### Q: MCP 服务器无法启动？
A: 检查端口 37283 是否被占用：
```bash
lsof -i :37283
```

### Q: 扩展无法同步到服务器？
A: 确认 MCP 服务器正在运行，并检查：
1. 服务器健康检查：`curl http://localhost:37283/health`
2. 扩展的 Service Worker 日志是否有错误
3. 网络请求是否被 CORS 策略阻止

### Q: 转换结果不符合预期？
A: 可以：
1. 检查原始 HTML 是否正确获取（DevTools Network 面板）
2. 在 `clipboard.ts` 中调整转换器优先级
3. 为特定网站添加专用转换器

### Q: 如何清除所有数据？
A: 分别清除扩展和服务器数据：
1. 扩展：在 Popup 中点击"清空"按钮
2. 服务器：删除 `~/.clipmark/data.json` 文件

## 相关资源

- [MCP 协议规范](https://modelcontextprotocol.io/)
- [Chrome 扩展开发文档](https://developer.chrome.com/docs/extensions/)
- [Turndown 文档](https://github.com/mixmark-io/turndown)
