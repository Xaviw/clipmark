# ClipMark - 需求文档

**项目名称**: ClipMark
**项目定位**: 智能剪贴板转Markdown工具
**目标用户**: 开发者
**核心场景**: 将网页内容传递给AI工具（唯一场景）

---

## 项目概述

ClipMark 是一个智能剪贴板转换工具，将用户从网页中复制的内容自动转换为AI友好的Markdown格式，并通过MCP (Model Context Protocol) 服务提供给AI工具使用。

### 核心价值

- 提升开发者将网页内容传递给AI的效率
- 自动清理和格式化内容，减少token消耗
- 提供历史记录管理，方便复用

### 技术栈

- **语言**: TypeScript
- **包管理**: pnpm (monorepo)
- **浏览器扩展**: Chrome Manifest V3
- **MCP**: 标准MCP协议实现 (@modelcontextprotocol/server)
- **UI**: 原生 HTML/CSS/JavaScript
- **构建工具**: Vite + crxjs (扩展)
- **代码质量**: ESLint + Prettier + TypeScript

---

## 系统架构

### Monorepo 结构

```
clipmark/
├── packages/
│   ├── extension/          # Chrome扩展
│   ├── mcp-server/         # MCP服务
│   ├── shared/             # 共享代码（类型、工具函数、常量）
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.json
└── README.md
```

### 数据流向

```
用户复制内容
  → Chrome扩展监听复制事件（chrome.clipboard API）
  → 检查当前页面是否在启用列表中
  → 获取 text/html
  → 检查内容大小（限制5万字符）
  → 转换为Markdown（腾讯文档/默认策略）
  → 保存到扩展本地存储（主）
  → 调用MCP服务API保存（备份）
  → 扩展显示转换成功通知
  → AI通过MCP工具接口读取内容
```

### 通信架构

1. **扩展 → MCP**: HTTP REST API (用于保存转换后的内容)
2. **AI → MCP**: MCP标准协议 (用于读取内容)
3. **数据存储**: 扩展本地存储（主） + MCP服务内部存储（备份）

---

## 功能需求

### 1. Chrome浏览器扩展

#### 1.1 核心功能

##### 1.1.1 启用网址控制

- **功能**: 配置启用转换功能的网址白名单
- **输入方式**: 多行文本框，每行一个网址模式
- **格式**: 标准通配符格式（如 `*://*.example.com/*`）
  - `*://docs.qq.com/*` - 任何协议访问 docs.qq.com 的任何页面
  - `https://*.github.com/*` - HTTPS访问任何github.com子域的任何页面
  - `https://example.com/docs/*` - 只匹配example.com/docs/路径下的页面
- **默认行为**: 无配置时，所有网站启用
- **存储**: 使用 `chrome.storage.sync` 保存

##### 1.1.2 监听复制事件

- **方式**: 使用 `chrome.clipboard` API 监听剪贴板变化
- **时机**: 用户复制内容后立即触发
- **检查**:
  1. 当前页面URL是否匹配启用网址列表
  2. 原始HTML内容是否超过5万字符
- **数据获取**: 捕获 `text/html` 与 `text/plain` 格式的剪贴板数据
- **无需content script**: 不注入页面脚本，使用background/service worker监听

##### 1.1.3 内容转换

- **转换策略**: 支持针对域名配置特定的转换策略，若无配置则使用默认策略
- **转换规则**:
  - 腾讯文档(docs.qq.com、doc.weixin.qq.com)：参考 `@腾讯文档转换策略.md`
  - 默认：参考 `@基础转换策略.md`
- **转换失败处理**（抛出异常时）:
  - 降级方案: 直接使用 `text/plain` 原始内容
  - 显示通知: "转换失败，已保存原始文本内容"

- **内容超限处理**（原始HTML超过5万字符）:
  - 拒绝转换
  - 显示通知: "内容过大，已跳过转换（限制5万字符）"

##### 1.1.4 数据保存

- **存储策略**: 扩展本地存储为主，MCP服务为备份
- **保存时机**: 每次转换成功后立即保存
- **同步顺序**:
  1. 先保存到扩展本地存储（chrome.storage.local）
  2. 再调用MCP服务HTTP API保存
- **MCP API失败处理**: 静默失败，不在通知中提示，只在面板显示"服务未连接"
- **发送数据结构**:
  ```typescript
  {
    content: string; // 转换后的Markdown内容
    originalPlain: string; // 原始纯文本（备份）
    originalHtml: string; // 原始HTML（备份）
    metadata: {
      sourceUrl: string; // 来源页面URL
      title: string; // 页面标题
      timestamp: number; // Unix时间戳
    }
  }
  ```
- **本地存储结构**:
  ```typescript
  {
    items: Array<{
      id: string; // MCP返回的记录ID
      content: string;
      metadata: {...};
      createdAt: number;
      size: number;
    }>;
    settings: {
      maxItems: number; // 最大缓存数量
      autoCopy: boolean; // 自动复制开关
      enabledUrls: string[]; // 启用网址列表
    };
  }
  ```

##### 1.1.5 用户通知

- **转换成功**: 浏览器原生通知
  - 标题: "内容已转换"
  - 内容: "已保存到剪贴板历史"
  - 图标: 扩展图标
  - 显示时长: 2秒
  - 点击行为: 无操作

- **转换失败**: 浏览器原生通知
  - 标题: "转换失败"
  - 内容: "已保存原始文本内容"
  - 图标: 警告图标
  - 显示时长: 2秒
  - 点击行为: 无操作

- **内容超限**: 浏览器原生通知
  - 标题: "内容过大"
  - 内容: "已跳过转换（限制5万字符）"
  - 显示时长: 2秒
  - 点击行为: 无操作

##### 1.1.6 自动复制（可选）

- 根据用户设置，转换成功后自动将Markdown内容复制到剪贴板
- 覆盖原始复制内容
- 使用 `navigator.clipboard.writeText()` API

#### 1.2 扩展面板UI

##### 1.2.1 面板触发

- **方式**: 点击浏览器工具栏的扩展图标
- **尺寸**: 使用浏览器默认popup尺寸

##### 1.2.2 状态栏（面板顶部）

- **显示位置**: 面板最顶部
- **显示内容**:
  - 当前页面启用状态: "当前页面：已启用" 或 "当前页面：未启用"
  - MCP服务连接状态: "服务未连接"（仅服务不可用时显示）
- **实时更新**: 每次打开面板时重新检测

##### 1.2.3 历史记录列表

- **显示内容**:
  - 内容来源：内容所在的网址
  - 内容摘要: 截取转换后Markdown的前50个字符，超出显示省略号
  - 转换时间: 格式化显示 "YYYY-MM-DD HH:mm:ss"
  - 内容大小: 显示字符数（如: "1000 字符"）
  - 记录ID: 用于MCP查询，隐藏在UI中

- **单条记录操作**:
  - 复制按钮: 点击复制该条Markdown内容到剪贴板，复制成功后显示勾图标，2秒后消失
  - 删除按钮: 删除该条记录（同时删除本地和MCP服务器数据）

- **列表排序**: 按时间倒序（最新的在最上面）

- **滚动方式**: 面板内滚动

- **空状态**: 无历史记录时显示友好提示

##### 1.2.4 设置区域

- **启用网址设置**:
  - 多行文本框: 每行一个网址模式
  - 支持标准通配符格式（如 `*://*.example.com/*`）
  - 说明文字: "每行一个网址，支持通配符。留空表示所有网站启用。"
  - 实时保存设置

- **缓存数量设置**:
  - 输入框: 数字输入，范围 1-100
  - 默认值: 5
  - 说明文字: "最多保留的历史记录数量"
  - 实时保存设置
  - 超出数量时，自动删除最旧的记录（FIFO策略）

- **自动复制设置**:
  - 复选框: "转换后自动复制到剪贴板"
  - 默认值: 未勾选
  - 实时保存设置

- **数据持久化**: 使用 `chrome.storage.sync` 保存设置

##### 1.2.5 其他UI元素

- **清空所有记录按钮**:
  - 二次确认弹窗
  - 同时清空本地和MCP服务器数据

- **刷新按钮**: 手动从MCP服务器同步最新数据（可选）

#### 1.3 权限要求

**manifest.json 配置**:

```json
{
  "permissions": [
    "clipboardRead",    // 读取剪贴板内容
    "clipboardWrite",   // 写入剪贴板（自动复制功能）
    "notifications",    // 显示通知
    "storage",          // 本地数据存储
    "activeTab"         // 获取当前页面信息
  ],
  "host_permissions": [
    "<all_urls>"        // 访问所有网站的内容
  ]
}
```

---

### 2. MCP服务

#### 2.1 服务职责

- 提供HTTP REST API供扩展调用（保存数据）
- 提供MCP标准工具接口供AI调用（读取数据）
- 管理转换后的内容存储
- 无需进行内容转换（转换由扩展完成）

#### 2.2 HTTP REST API

##### 2.2.1 保存内容

- **端点**: `POST /api/items`
- **请求体**:
  ```typescript
  {
    content: string;
    originalPlain: string;
    originalHtml: string;
    metadata: {
      sourceUrl: string;
      title: string;
      timestamp: number;
    }
  }
  ```
- **响应**:
  ```typescript
  {
    id: string;           // 生成的唯一ID
    success: boolean;
    message?: string;
  }
  ```

##### 2.2.2 删除内容

- **端点**: `DELETE /api/items/:id`
- **响应**:
  ```typescript
  {
    success: boolean;
    message?: string;
  }
  ```

##### 2.2.3 批量删除

- **端点**: `DELETE /api/items`
- **请求体**:
  ```typescript
  {
    ids: string[];  // 要删除的ID列表
  }
  ```

##### 2.2.4 获取列表（用于扩展同步）

- **端点**: `GET /api/items`
- **查询参数**:
  - `limit`: 数量限制
  - `offset`: 偏移量
- **响应**:
  ```typescript
  {
    items: Array<{
      id: string;
      content: string;
      metadata: {...};
      createdAt: number;
    }>;
    total: number;
  }
  ```

#### 2.3 MCP工具接口

##### 2.3.1 get_latest_capture

- **功能**: 获取最新转换的剪贴板内容
- **参数**: 无
- **返回**:
  ```typescript
  {
    id: string;
    content: string; // Markdown内容
    metadata: {
      sourceUrl: string;
      title: string;
      timestamp: number;
    }
  }
  ```
- **错误处理**: 无内容时返回友好提示

##### 2.3.2 get_capture_by_id

- **功能**: 根据ID获取特定的剪贴板内容
- **参数**:
  ```typescript
  {
    id: string;
  }
  ```
- **返回**: 同 get_latest_capture
- **错误处理**: ID不存在时返回错误信息

#### 2.4 数据存储

##### 2.4.1 存储方案

- **内存存储**: 使用Map或数组存储活跃数据（快速访问）
- **持久化**: 写入本地文件（JSON格式）
  - 文件路径: `~/.clipmark/data.json`
  - 保存时机: 新增/删除数据后立即保存
- **并发处理**: 不考虑并发，简化实现

##### 2.4.2 数据结构

```typescript
interface StoredItem {
  id: string; // UUID
  content: string; // 转换后的Markdown
  originalPlain: string; // 原始纯文本
  originalHtml: string; // 原始HTML
  metadata: {
    sourceUrl: string;
    title: string;
    timestamp: number;
  };
  createdAt: number; // 服务器接收时间
  size: number; // 内容大小（字符数）
}
```

##### 2.4.3 数据损坏恢复

- **检测**: 启动时检测数据文件是否损坏
- **备份**: 将损坏文件备份为 `data.json.[YYYYMMDD_HHMMSS]`
- **恢复**: 重新创建空的数据文件

##### 2.4.4 数据清理

- 由扩展通过API触发删除
- 服务端不主动清理数据
- 提供批量清理接口

#### 2.5 服务配置

- **配置文件**: `.env` 文件
- **配置项**:
  - `PORT`: 服务端口，默认 37283（CLIPM的数字映射，避免常见端口冲突）
- **主机**: localhost（仅本地访问）
- **CORS**: 允许扩展的origin访问
- **日志**: 基础请求日志
- **环境**: 不区分开发/生产环境

#### 2.6 启动与部署

- **开发启动**: `node dist/index.js` 或 `pnpm dev`
- **未来部署**: 发布到npm，使用 `npx clipmark-mcp` 运行
- **无需额外服务**: 独立运行，无需数据库或其他依赖

---

### 3. Shared 包

#### 3.1 包内容

- **类型定义**: TypeScript interfaces/types
  - 数据结构类型（StoredItem, Metadata等）
  - API接口类型（请求/响应）
  - 配置类型

- **工具函数**:
  - 日期格式化
  - 字符串处理
  - URL匹配（通配符匹配）
  - 其他通用工具

- **常量配置**:
  - 默认设置值
  - 错误消息
  - 内容大小限制（50000字符）

#### 3.2 构建与使用

- **扩展**: 构建时将shared代码打包进bundle（通过Vite）
- **MCP服务**: 直接import使用
- **构建工具**: Vite + crxjs（扩展），tsc（MCP和shared）

---

## 开发基础设施

### 代码质量工具

- **ESLint**: 代码检查
- **Prettier**: 代码格式化
- **TypeScript**: 类型检查

### 测试

- 不需要单元测试和集成测试

### Git规范

- 不需要commitlint或husky

---

## 附录

### 相关文档

- `@腾讯文档转换策略.md` - 腾讯文档的详细转换规则
- `@基础转换策略.md` - 默认HTML到Markdown转换规则

### 设计决策记录

| 决策点 | 选择 | 理由 |
|-------|------|------|
| 目标用户 | 开发者 | 聚焦核心用户群 |
| 唯一场景 | 传递给AI | 简化产品定位 |
| 转换策略 | 腾讯文档+默认 | 覆盖核心用例，预留扩展性 |
| 存储策略 | 扩展本地为主 | 提升响应速度，离线可用 |
| API失败处理 | 静默失败 | 减少用户感知 |
| 内容限制 | 5万字符 | 平衡可用性与性能 |
| 启用控制 | 网址白名单 | 用户可控，按需启用 |
| 构建工具 | Vite + crxjs | 现代化Chrome扩展开发 |
