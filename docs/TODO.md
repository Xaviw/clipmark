# ClipMark - 开发计划

> 本文档包含完整的技术栈设计、架构方案和分阶段开发计划

---

## 一、技术栈设计

### 1.1 核心技术栈

| 层级 | 技术选型 | 版本 | 说明 |
|------|---------|------|------|
| **语言** | TypeScript | 5.x | 类型安全，提升开发效率 |
| **包管理** | pnpm | 8.x+ | Monorepo支持，高效磁盘空间利用 |
| **构建工具** | Vite | 5.x | 快速构建，HMR支持 |
| **扩展构建** | CRXJS | 2.x | 专为Chrome扩展设计的Vite插件 |

### 1.2 Chrome扩展技术栈

| 类别 | 技术选型 | 说明 |
|------|---------|------|
| **Manifest** | V3 | Chrome最新标准 |
| **UI框架** | Vanilla JS + Web Components | 轻量级，无框架依赖 |
| **状态管理** | 自研轻量级Store | 基于Proxy的响应式状态 |
| **转换库** | turndown | HTML转Markdown |
| **图标** | 自定义SVG | 确保在不同DPI下清晰 |
| **构建** | Vite + CRXJS | 支持TypeScript、热重载 |

### 1.3 MCP服务技术栈

| 类别 | 技术选型 | 说明 |
|------|---------|------|
| **运行时** | Node.js | 18.x+ |
| **HTTP框架** | fastify | 高性能，内置TypeScript支持 |
| **MCP SDK** | @modelcontextprotocol/server | 官方MCP协议实现 |
| **存储** | fs + JSON | 无需额外依赖 |
| **配置管理** | dotenv | 环境变量管理 |
| **构建** | Vite (库模式) | 输出CJS/ESM双格式 |

### 1.4 Shared包技术栈

| 类别 | 技术选型 | 说明 |
|------|---------|------|
| **构建** | tsup | 轻量级打包，输出双格式 |
| **类型导出** | TypeScript | 自动生成.d.ts |
| **工具库** | 自研 | 按需引入，无额外依赖 |

### 1.5 开发工具

| 类别 | 技术选型 | 配置 |
|------|---------|------|
| **代码检查** | ESLint | TypeScript推荐配置 |
| **代码格式** | Prettier | 统一代码风格 |
| **Git Hooks** | （暂不配置） | - |
| **测试** | （暂不配置） | - |

---

## 二、系统架构设计

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户系统                                 │
└─────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
        ┌───────────────────┐       ┌───────────────────┐
        │   Chrome Browser  │       │   AI Application  │
        │                   │       │   (Claude, etc.)  │
        └───────────────────┘       └───────────────────┘
                    │                           │
        ┌───────────┴───────────┐               │
        │   ClipMark Extension  │               │
        │                       │               │
        │  ┌─────────────────┐  │               │
        │  │ Clipboard       │  │               │
        │  │ Monitor         │  │               │
        │  └────────┬────────┘  │               │
        │           │            │               │
        │  ┌────────▼────────┐  │               │
        │  │ Content         │  │               │
        │  │ Converter       │  │               │
        │  └────────┬────────┘  │               │
        │           │            │               │
        │  ┌────────▼────────┐  │      ┌────────▼────────┐
        │  │ Local Storage   │  │      │ MCP Protocol    │
        │  │ (Primary)       │  │      │ Interface       │
        │  └────────┬────────┘  │      └────────┬────────┘
        │           │            │               │
        │  ┌────────▼────────┐  │      ┌────────▼────────┐
        │  │ HTTP Client     │──┼─────▶│ MCP Server       │
        │  │ (Backup)        │  │      │                  │
        │  └─────────────────┘  │      │ ┌──────────────┐ │
        └───────────────────────┘      │ │ HTTP API     │ │
                                       │ │ (REST)       │ │
        ┌───────────────────────┐      │ └──────┬───────┘ │
        │ Extension UI          │      │        │         │
        │ (Popup/Options)       │      │ ┌──────▼───────┐ │
        │                       │      │ │ File Storage │ │
        │  ┌─────────────────┐  │      │ │ (~/.clipmark)│ │
        │  │ History List    │  │      │ └──────────────┘ │
        │  │ Settings        │  │      └───────────────────┘
        │  │ Status Bar      │  │
        │  └─────────────────┘  │
        └───────────────────────┘
```

### 2.2 数据流设计

#### 2.2.1 内容捕获流程

```
1. 用户复制内容 (Copy)
   │
2. Clipboard API触发事件
   │
3. 检查当前页面URL是否匹配白名单
   ├─ 不匹配 → 退出
   └─ 匹配 ▼
4. 检查内容大小 (≤50000字符)
   ├─ 超限 → 显示"内容过大"通知 → 退出
   └─ 未超限 ▼
5. 获取剪贴板数据 (text/html + text/plain)
   │
6. 根据域名选择转换策略
   ├─ 腾讯文档 → TencentConverter
   └─ 其他 → DefaultConverter
   │
7. 执行HTML → Markdown转换
   ├─ 成功 ▼
   │  生成唯一ID
   │  构造ClipItem数据
   │  保存到本地存储 (chrome.storage.local)
   │  调用MCP API备份 (静默失败)
   │  显示"内容已转换"通知
   └─ 失败 ▼
      降级：保存原始text/plain
      显示"转换失败"通知
```

#### 2.2.2 AI读取流程

```
1. AI调用MCP工具 (get_latest_capture / get_capture_by_id)
   │
2. MCP Server接收请求
   │
3. 从File Storage读取数据
   │
4. 返回ClipItem
   │
5. AI获得格式化的Markdown内容
```

### 2.3 目录结构设计

```
clipmark/
├── packages/
│   ├── extension/                    # Chrome扩展
│   │   ├── src/
│   │   │   ├── background/           # Service Worker
│   │   │   │   ├── index.ts          # 入口
│   │   │   │   ├── clipboard.ts      # 剪贴板监听
│   │   │   │   ├── converter.ts      # 转换调度
│   │   │   │   ├── storage.ts        # 本地存储管理
│   │   │   │   └── api.ts            # MCP服务通信
│   │   │   ├── popup/                # 弹出面板
│   │   │   │   ├── index.html
│   │   │   │   ├── app.ts
│   │   │   │   ├── components/
│   │   │   │   │   ├── statusbar.ts
│   │   │   │   │   ├── history-list.ts
│   │   │   │   │   ├── history-item.ts
│   │   │   │   │   └── settings.ts
│   │   │   │   ├── store/
│   │   │   │   │   └── index.ts      # 响应式状态管理
│   │   │   │   └── styles/
│   │   │   │       └── main.css
│   │   │   ├── utils/
│   │   │   │   ├── dom.ts           # DOM工具
│   │   │   │   └── notification.ts  # 通知工具
│   │   │   └── types/
│   │   │       └── index.ts         # 扩展专用类型
│   │   ├── public/
│   │   │   └── icons/               # 图标资源
│   │   │       ├── icon-16.png
│   │   │       ├── icon-48.png
│   │   │       └── icon-128.png
│   │   ├── manifest.json            # 扩展清单
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── mcp-server/                   # MCP服务
│   │   ├── src/
│   │   │   ├── server/
│   │   │   │   ├── index.ts         # 服务入口
│   │   │   │   ├── http.ts          # HTTP服务器
│   │   │   │   ├── mcp.ts           # MCP协议实现
│   │   │   │   └── storage.ts       # 文件存储管理
│   │   │   ├── routes/
│   │   │   │   ├── items.ts         # Items API路由
│   │   │   │   └── health.ts        # 健康检查
│   │   │   └── config/
│   │   │       └── index.ts         # 配置管理
│   │   ├── .env.example
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── shared/                       # 共享包
│       ├── src/
│       │   ├── types/
│       │   │   ├── item.ts          # ClipItem类型
│       │   │   ├── api.ts           # API接口类型
│       │   │   └── config.ts        # 配置类型
│       │   ├── utils/
│       │   │   ├── date.ts          # 日期格式化
│       │   │   ├── string.ts        # 字符串处理
│       │   │   └── url.ts           # URL匹配
│       │   ├── constants/
│       │   │   └── index.ts         # 常量定义
│       │   ├── converters/
│       │   │   ├── base.ts          # 基础转换器接口
│       │   │   ├── tencent.ts       # 腾讯文档转换
│       │   │   ├── default.ts       # 默认转换
│       │   │   └── factory.ts       # 转换器工厂
│       │   └── index.ts
│       ├── package.json
│       ├── tsconfig.json
│       └── tsup.config.ts
│
├── .github/                          # GitHub配置
│   └── workflows/                    # CI/CD (可选)
│
├── .editorconfig                     # 编辑器配置
├── .eslintignore
├── .eslintrc.js
├── .prettierrc
├── pnpm-workspace.yaml               # pnpm workspace配置
├── package.json                      # 根package.json
├── tsconfig.json                     # 根TypeScript配置
├── TODO.md                           # 本文档
├── requirements.md                   # 需求文档
└── README.md                         # 项目说明
```

### 2.4 核心接口设计

#### 2.4.1 共享类型定义 (packages/shared/src/types/)

```typescript
// item.ts
export interface ClipItem {
  id: string;                    // UUID
  content: string;               // 转换后的Markdown
  originalPlain: string;         // 原始纯文本
  originalHtml: string;          // 原始HTML
  metadata: {
    sourceUrl: string;           // 来源URL
    title: string;               // 页面标题
    timestamp: number;           // 复制时间戳
  };
  createdAt: number;             // 创建时间
  size: number;                  // 内容大小（字符数）
}

// api.ts
export interface SaveItemRequest {
  content: string;
  originalPlain: string;
  originalHtml: string;
  metadata: {
    sourceUrl: string;
    title: string;
    timestamp: number;
  };
}

export interface SaveItemResponse {
  id: string;
  success: boolean;
  message?: string;
}

export interface GetItemsResponse {
  items: ClipItem[];
  total: number;
}

// config.ts
export interface AppSettings {
  maxItems: number;              // 最大缓存数量 (1-100)
  autoCopy: boolean;             // 自动复制开关
  enabledUrls: string[];         // 启用网址列表
}

export const DEFAULT_SETTINGS: AppSettings = {
  maxItems: 5,
  autoCopy: false,
  enabledUrls: [],
};
```

#### 2.4.2 转换器接口 (packages/shared/src/converters/)

```typescript
// base.ts
export interface ContentConverter {
  /**
   * 将HTML转换为Markdown
   * @param html - 原始HTML内容
   * @param url - 来源URL（用于特定网站处理）
   * @returns Markdown字符串
   */
  convert(html: string, url: string): Promise<string>;

  /**
   * 检查是否支持该URL
   */
  supports(url: string): boolean;
}

// factory.ts
export class ConverterFactory {
  private converters: ContentConverter[] = [];

  register(converter: ContentConverter): void {
    this.converters.push(converter);
  }

  getConverter(url: string): ContentConverter {
    // 返回第一个支持该URL的转换器，否则返回默认转换器
    return this.converters.find(c => c.supports(url))
      || this.getDefaultConverter();
  }

  private getDefaultConverter(): ContentConverter {
    // 返回默认转换器
  }
}
```

#### 2.4.3 MCP HTTP API

```typescript
// REST API端点
POST   /api/items          // 保存新项目
GET    /api/items          // 获取项目列表
GET    /api/items/:id      // 获取单个项目
DELETE /api/items/:id      // 删除单个项目
DELETE /api/items          // 批量删除
GET    /health             // 健康检查

// MCP工具
get_latest_capture()       // 获取最新捕获
get_capture_by_id(id)      // 根据ID获取
```

---

## 三、分阶段开发计划

### Phase 1: 基础设施搭建 ✅ 已完成

**目标**: 建立项目基础结构和构建配置

#### 1.1 Monorepo初始化
- [x] 创建pnpm workspace配置
- [x] 配置根package.json（scripts、dependencies）
- [x] 设置TypeScript项目引用

#### 1.2 构建配置
- [x] 配置Shared包的tsup构建
- [x] 配置MCP服务的Vite构建（库模式）
- [x] 配置Extension的Vite + CRXJS构建

#### 1.3 代码质量工具
- [x] 配置ESLint（TypeScript规则）
- [x] 配置Prettier
- [x] 配置EditorConfig
- [x] 添加.gitignore

#### 1.4 文档
- [x] 创建项目README
- [x] 添加开发文档

**验收标准**:
- ✅ `pnpm install` 成功安装所有依赖
- ✅ `pnpm build` 能成功构建所有包
- ✅ 代码检查和格式化工具正常工作

---

### Phase 2: Shared包开发 ✅ 已完成

**目标**: 实现共享的类型定义、工具函数和转换策略

#### 2.1 类型定义
- [x] 实现ClipItem类型 (types/item.ts)
- [x] 实现API接口类型 (types/api.ts)
- [x] 实现配置类型 (types/config.ts)

#### 2.2 工具函数
- [x] 实现日期格式化函数 (utils/date.ts)
- [x] 实现字符串处理函数 (utils/string.ts)
  - truncateString（截断字符串）
  - formatSize（格式化文件大小）
- [x] 实现URL匹配函数 (utils/url.ts)
  - 通配符匹配逻辑
  - Chrome match pattern兼容

#### 2.3 常量定义
- [x] 定义默认设置值
- [x] 定义错误消息常量
- [x] 定义内容大小限制（50000字符）

#### 2.4 转换策略
- [x] 实现基础转换器接口 (converters/base.ts)
- [x] 实现默认转换器 (converters/default.ts)
  - 使用turndown库
  - 清理无用标签和属性
- [x] 实现腾讯文档转换器 (converters/tencent.ts)
  - 处理腾讯文档特殊HTML结构
  - 提取文档元数据
- [x] 实现转换器工厂 (converters/factory.ts)
- [x] 编写转换策略文档

#### 2.5 构建与导出
- [x] 配置tsup输出ESM和CJS双格式
- [x] 导出所有公共API
- [x] 生成类型定义文件

**验收标准**:
- ✅ 所有类型定义正确导出
- ✅ 工具函数单元可用
- ✅ 转换器能正确处理HTML到Markdown转换
- ✅ 包能被其他包正确import

---

### Phase 3: MCP服务开发 ✅ 已完成

**目标**: 实现MCP服务器的HTTP API和MCP协议接口

#### 3.1 项目初始化
- [x] 配置Vite库模式构建
- [x] 设置TypeScript配置
- [x] 添加dotenv配置

#### 3.2 HTTP服务器
- [x] 使用fastify创建HTTP服务器
- [x] 配置CORS（允许扩展访问）
- [x] 实现健康检查端点 (GET /health)
- [x] 配置请求日志

#### 3.3 数据存储
- [x] 实现文件存储管理 (storage.ts)
  - 创建数据目录 (~/.clipmark)
  - JSON读写操作
  - 数据损坏恢复
- [x] 实现内存缓存（Map存储）

#### 3.4 REST API
- [x] POST /api/items - 保存新项目
  - 生成UUID
  - 验证请求数据
  - 双重存储（内存+文件）
- [x] GET /api/items - 获取项目列表
  - 支持limit/offset参数
- [x] GET /api/items/:id - 获取单个项目
- [x] DELETE /api/items/:id - 删除单个项目
- [x] DELETE /api/items - 批量删除

#### 3.5 MCP协议实现
- [x] 使用@modelcontextprotocol/server创建MCP服务器
- [x] 实现get_latest_capture工具
- [x] 实现get_capture_by_id工具
- [x] 配置工具描述和参数schema

#### 3.6 错误处理
- [x] 实现统一的错误处理中间件
- [x] 返回友好的错误消息
- [x] 记录错误日志

**验收标准**:
- ✅ HTTP服务能正常启动和监听
- ✅ 所有API端点能正确处理请求
- ✅ MCP工具能被正确调用
- ✅ 数据能正确持久化到文件
- ✅ 错误情况能正确处理

---

### Phase 4: Chrome扩展核心功能 ✅ 已完成

**目标**: 实现扩展的后台逻辑和核心功能

#### 4.1 扩展基础配置
- [x] 创建manifest.json (Manifest V3)
- [x] 配置Vite + CRXJS
- [x] 创建扩展图标

#### 4.2 剪贴板监听
- [x] 使用chrome.clipboard API监听复制事件
- [x] 实现URL白名单检查
- [x] 实现内容大小检查（50000字符限制）
- [x] 获取text/html和text/plain数据

#### 4.3 内容转换
- [x] 集成Shared包的转换器
- [x] 实现转换调度逻辑
- [x] 实现转换失败的降级处理
- [x] 处理特殊字符和编码

#### 4.4 本地存储
- [x] 实现chrome.storage.local封装
- [x] 实现FIFO缓存策略
- [x] 实现设置存储（chrome.storage.sync）

#### 4.5 MCP服务通信
- [x] 实现HTTP客户端
- [x] 实现保存到MCP服务
- [x] 实现静默失败处理
- [x] 实现服务连接状态检测

#### 4.6 用户通知
- [x] 实现"内容已转换"通知
- [x] 实现"转换失败"通知
- [x] 实现"内容过大"通知
- [x] 配置通知显示时长和图标

#### 4.7 自动复制功能
- [x] 实现自动复制到剪贴板
- [x] 根据用户设置启用/禁用

**验收标准**:
- ✅ 扩展能正确安装和加载
- ✅ 复制内容能被正确监听和转换
- ✅ 数据能正确保存到本地存储
- ✅ MCP服务备份能正常工作
- ✅ 通知能正确显示

---

### Phase 5: Chrome扩展UI ✅ 已完成

**目标**: 实现扩展的弹出面板和设置界面

#### 5.1 UI基础架构
- [x] 设计响应式状态管理Store
- [x] 创建popup HTML结构
- [x] 实现基础CSS样式
- [x] 实现组件通信机制

#### 5.2 状态栏组件
- [x] 显示当前页面启用状态
- [x] 显示MCP服务连接状态
- [x] 实时更新状态

#### 5.3 历史记录列表
- [x] 实现历史记录渲染
- [x] 实现单条记录组件
  - 显示内容摘要
  - 显示转换时间
  - 显示内容大小
- [x] 实现复制按钮
  - 复制到剪贴板
  - 显示勾图标反馈
- [x] 实现删除按钮
  - 删除本地数据
  - 调用MCP API删除
- [x] 实现空状态提示
- [x] 实现滚动加载

#### 5.4 设置组件
- [x] 实现启用网址设置
  - 多行文本输入
  - 实时保存
- [x] 实现缓存数量设置
  - 数字输入验证
  - 实时保存
- [x] 实现自动复制设置
  - 复选框
  - 实时保存

#### 5.5 其他UI元素
- [x] 实现清空所有记录按钮
  - 二次确认弹窗
- [x] 实现刷新按钮（可选）

#### 5.6 UI优化
- [x] 添加加载状态
- [x] 添加错误提示
- [x] 优化动画效果
- [x] 响应式布局调整

**验收标准**:
- ✅ Popup能正确打开和显示
- ✅ 历史记录能正确展示
- ✅ 复制和删除功能正常工作
- ✅ 设置能正确保存和生效
- ✅ UI响应流畅，无明显卡顿

---

### Phase 6: 集成测试与优化 (预计2-3天)

**目标**: 端到端测试、错误处理完善和性能优化

#### 6.1 端到端测试
- [ ] 测试完整的复制到转换流程
- [ ] 测试MCP服务读取流程
- [ ] 测试扩展UI交互
- [ ] 测试数据同步

#### 6.2 错误处理
- [ ] 完善网络错误处理
- [ ] 完善数据损坏处理
- [ ] 完善用户输入验证
- [ ] 添加友好的错误提示

#### 6.3 性能优化
- [ ] 优化转换性能
- [ ] 优化存储读写
- [ ] 减少不必要的渲染
- [ ] 优化资源加载

#### 6.4 兼容性测试
- [ ] 测试Chrome最新版本
- [ ] 测试不同网站内容
- [ ] 测试边界情况

#### 6.5 文档完善
- [ ] 更新README
- [ ] 添加用户使用指南
- [ ] 添加开发者文档
- [ ] 添加故障排除指南

#### 6.6 发布准备
- [ ] 准备扩展商店素材
- [ ] 配置扩展打包
- [ ] 准备npm发布（MCP服务）
- [ ] 创建发布检查清单

**验收标准**:
- ✅ 主要功能流程无问题
- ✅ 错误情况有友好提示
- ✅ 性能满足预期
- ✅ 文档完整清晰
- ✅ 可以发布使用

---

## 四、开发优先级建议

### 高优先级（核心功能）
1. Shared包的类型定义和转换策略
2. MCP服务的数据存储和API
3. 扩展的剪贴板监听和转换
4. 扩展的本地存储

### 中优先级（重要功能）
1. 扩展的MCP服务通信
2. 扩展UI的历史记录列表
3. 扩展UI的设置页面
4. MCP协议的工具接口

### 低优先级（增强功能）
1. 自动复制功能
2. 刷新按钮
3. 高级UI动画
4. 额外的转换策略

---

## 五、风险与挑战

### 5.1 技术风险

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| Chrome Clipboard API限制 | 可能无法获取HTML内容 | 提前测试API能力，准备降级方案 |
| 腾讯文档HTML结构变化 | 转换失败 | 设计灵活的转换策略，易于更新 |
| MCP协议兼容性 | AI工具无法正常调用 | 严格遵循MCP规范，充分测试 |
| 扩展性能问题 | 影响用户浏览体验 | 优化转换逻辑，使用Web Worker |

### 5.2 开发风险

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| Monorepo配置复杂 | 延误项目启动 | 参考成熟方案，分步配置 |
| 跨包调试困难 | 开发效率低 | 建立清晰的调试流程 |
| 转换策略覆盖不全 | 部分网站转换失败 | 先实现默认策略，再逐步优化 |

---

## 六、后续优化方向

1. **转换策略扩展**
   - 支持更多网站（飞书文档、Notion等）
   - 用户自定义转换规则

2. **功能增强**
   - AI辅助内容清理
   - 内容标签和分类
   - 全文搜索

3. **用户体验**
   - 键盘快捷键
   - 内容预览
   - 导出功能

4. **服务改进**
   - 数据加密
   - 云端同步
   - 多设备支持

---

## 七、开发备注

### 开发顺序建议
按照Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6的顺序进行，每个Phase完成并验收后再进入下一阶段。

### 包依赖关系
```
extension → shared
mcp-server → shared
```

Shared包需要最先开发完成。

### 关键技术难点
1. Chrome Clipboard API的使用和限制
2. HTML到Markdown的转换质量
3. MCP协议的正确实现
4. 扩展与MCP服务的可靠通信

### 测试策略
虽然不进行单元测试，但需要在开发过程中进行：
- 手动功能测试
- 跨模块集成测试
- 真实场景测试

---

*文档版本: 1.0*
*最后更新: 2026-02-02*
