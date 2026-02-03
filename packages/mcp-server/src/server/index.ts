/**
 * ClipMark MCP Server
 * 主入口 - 默认启动 MCP + HTTP 服务
 */

import { initializeStorage } from './storage.js';
import { startMCPServer } from './mcp.js';
import { getConfig, validateConfig } from '../config/index.js';

/**
 * 主函数
 * 默认启动 MCP 模式，此时会自动启动 HTTP 服务器
 */
async function main(): Promise<void> {
  const config = getConfig();

  // 验证配置
  const validation = validateConfig(config);
  if (!validation.valid) {
    console.error(`Invalid configuration: ${validation.error}`);
    process.exit(1);
  }

  // 初始化存储（使用 stderr 输出，避免干扰 MCP stdio）
  console.error('Initializing storage...');
  await initializeStorage();
  console.error(`Storage initialized at ${config.dataDir}`);

  // 启动 MCP 服务器（会自动启动 HTTP 服务器）
  console.error('Starting ClipMark Server (MCP + HTTP)...');
  await startMCPServer();
}

// 错误处理（输出到 stderr）
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
