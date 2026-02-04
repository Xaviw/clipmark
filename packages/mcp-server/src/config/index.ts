/**
 * MCP 服务配置
 */

import dotenv from 'dotenv';
import os from 'os';
import path from 'path';

// 加载环境变量
dotenv.config();

/**
 * 服务配置
 */
export interface ServerConfig {
  /** 服务端口 */
  port: number;
  /** 主机地址 */
  host: string;
  /** 数据存储目录 */
  dataDir: string;
  /** 日志存储目录 */
  logDir: string;
  /** CORS 允许的源 */
  corsOrigin: string[];
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: ServerConfig = {
  port: parseInt(process.env.PORT || '37283', 10),
  host: process.env.HOST || 'localhost',
  dataDir: process.env.DATA_DIR || path.join(os.homedir(), '.clipmark'),
  logDir: process.env.LOG_DIR || path.join(os.homedir(), '.clipmark', 'logs'),
  corsOrigin: process.env.CORS_ORIGIN?.split(',') || ['chrome-extension://*'],
};

/**
 * 获取配置
 */
export function getConfig(): ServerConfig {
  return { ...DEFAULT_CONFIG };
}

/**
 * 获取服务URL
 */
export function getServerUrl(): string {
  const config = getConfig();
  return `http://${config.host}:${config.port}`;
}

/**
 * 验证配置
 */
export function validateConfig(config: ServerConfig): { valid: boolean; error?: string } {
  if (config.port < 1 || config.port > 65535) {
    return { valid: false, error: 'Port must be between 1 and 65535' };
  }

  if (!config.dataDir) {
    return { valid: false, error: 'Data directory is required' };
  }

  return { valid: true };
}
