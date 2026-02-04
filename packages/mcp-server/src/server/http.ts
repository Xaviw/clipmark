/**
 * HTTP 服务器
 */

import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import * as fs from 'fs';
import * as path from 'path';
import * as net from 'net';
import { getConfig } from '../config/index.js';
import { itemsRoutes } from '../routes/items.js';
import { healthRoutes } from '../routes/health.js';

/**
 * HTTP 服务单例
 */
let httpServerInstance: FastifyInstance | null = null;
let isHttpServerStarting = false;

/**
 * 创建日志文件流
 */
function createLogStream(): fs.WriteStream {
  const config = getConfig();
  const logDir = config.logDir;

  // 确保日志目录存在
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // 生成日志文件名：http-YYYY-MM-DD.log
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const logFile = path.join(logDir, `http-${dateStr}.log`);

  // 创建可追加的文件流
  return fs.createWriteStream(logFile, { flags: 'a', encoding: 'utf8' });
}

/**
 * 写入日志消息到文件
 */
function writeLog(message: string): void {
  const config = getConfig();
  const logDir = config.logDir;

  // 确保日志目录存在
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // 生成日志文件名
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0];
  const logFile = path.join(logDir, `http-${dateStr}.log`);

  // 添加时间戳
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;

  // 追加写入日志文件
  fs.appendFileSync(logFile, logMessage, 'utf8');
}

/**
 * 创建并启动 HTTP 服务器
 */
export async function createHttpServer(): Promise<FastifyInstance> {
  const config = getConfig();

  // 创建日志文件流
  const logStream = createLogStream();

  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      // 将日志输出到文件，避免干扰 MCP stdio 通信
      stream: logStream,
    },
  });

  // 注册 CORS 插件
  await fastify.register(cors, {
    origin: config.corsOrigin,
    credentials: true,
  });

  // 注册路由
  await fastify.register(itemsRoutes, { prefix: '/api' });
  await fastify.register(healthRoutes);

  // 健康检查
  fastify.get('/', async () => {
    return {
      name: 'ClipMark MCP Server',
      version: '0.1.0',
      status: 'running',
    };
  });

  return fastify;
}

/**
 * 启动 HTTP 服务器（单例模式）
 * 确保即使多个 AI 客户端连接，也只有一个 HTTP 服务器实例
 *
 * 注意：如果端口已被占用（EADDRINUSE），说明已有 HTTP 服务器在运行，
 * 这种情况下会静默处理，不会抛出错误。这允许多个 MCP 客户端连接到同一个服务器。
 */
export async function startHttpServer(): Promise<FastifyInstance | null> {
  // 如果已经启动，直接返回现有实例
  if (httpServerInstance) {
    return httpServerInstance;
  }

  // 如果正在启动中，等待启动完成
  if (isHttpServerStarting) {
    // 等待最多 5 秒
    for (let i = 0; i < 50; i++) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (httpServerInstance) {
        return httpServerInstance;
      }
    }
    throw new Error('HTTP server startup timeout');
  }

  // 开始启动
  isHttpServerStarting = true;
  const config = getConfig();

  try {
    const fastify = await createHttpServer();
    const address = await fastify.listen({
      port: config.port,
      host: config.host,
    });

    // 将启动信息写入日志文件
    writeLog(`ClipMark HTTP Server listening at ${address}`);

    httpServerInstance = fastify;
    return fastify;
  } catch (err: unknown) {
    isHttpServerStarting = false;

    // 如果端口已被占用，说明已有 HTTP 服务器在运行，这不是错误
    if (err instanceof Error && 'code' in err && err.code === 'EADDRINUSE') {
      writeLog(`HTTP Server is already running on ${config.host}:${config.port}`);
      return null;
    }

    // 其他错误需要抛出
    throw err;
  }
}

/**
 * 优雅关闭服务器
 */
export async function stopHttpServer(): Promise<void> {
  if (httpServerInstance) {
    await httpServerInstance.close();
    httpServerInstance = null;
  }
  isHttpServerStarting = false;
}

/**
 * 获取 HTTP 服务器实例（不启动）
 */
export function getHttpServerInstance(): FastifyInstance | null {
  return httpServerInstance;
}

/**
 * 检查端口是否被占用
 */
export async function isPortInUse(port: number, host: string = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });

    server.once('listening', () => {
      server.close();
      resolve(false);
    });

    server.listen(port, host);
  });
}

/**
 * 检查 HTTP 服务器健康状态
 */
export async function checkHttpServerHealth(): Promise<boolean> {
  const config = getConfig();
  const url = `http://${config.host}:${config.port}/health`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(2000), // 2秒超时
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * 确保 HTTP 服务器可用（自愈机制）
 * 如果服务器不可用且端口未被占用，则自动重启
 */
export async function ensureHttpServer(): Promise<void> {
  const config = getConfig();

  // 如果当前进程有 HTTP 服务器实例，直接返回
  if (httpServerInstance) {
    return;
  }

  // 检查健康状态
  const isHealthy = await checkHttpServerHealth();
  if (isHealthy) {
    // 服务器健康，但不在当前进程（其他 MCP 进程启动的）
    return;
  }

  // 服务器不健康，检查端口是否被占用
  const portInUse = await isPortInUse(config.port, config.host);
  if (portInUse) {
    // 端口被占用但服务不健康，可能是僵尸进程，记录日志
    writeLog(`Port ${config.port} is in use but server is unhealthy`);
    return;
  }

  // 端口未被占用，重新启动 HTTP 服务器
  writeLog('HTTP server is down, restarting...');
  await startHttpServer();
}
