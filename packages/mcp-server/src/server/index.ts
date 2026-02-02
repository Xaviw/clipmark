/**
 * ClipMark MCP Server
 * 主入口
 */

import { initializeStorage } from './storage.js';
import { startHttpServer } from './http.js';
import { startMCPServer } from './mcp.js';
import { getConfig, validateConfig } from '../config/index.js';

/**
 * 主函数
 */
async function main(): Promise<void> {
  const config = getConfig();

  // 验证配置
  const validation = validateConfig(config);
  if (!validation.valid) {
    console.error(`Invalid configuration: ${validation.error}`);
    process.exit(1);
  }

  // 初始化存储
  console.log('Initializing storage...');
  await initializeStorage();
  console.log(`Storage initialized at ${config.dataDir}`);

  // 检查运行模式
  const mode = process.env.CLIPMARK_MODE || 'http';

  if (mode === 'mcp') {
    // MCP 模式 (stdio)
    console.log('Starting in MCP mode...');
    await startMCPServer();
  } else {
    // HTTP 模式 (默认)
    console.log('Starting in HTTP mode...');
    await startHttpServer();
  }
}

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// 启动服务
main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
