/**
 * HTTP 服务器
 */

import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { getConfig } from '../config/index.js';
import { itemsRoutes } from '../routes/items.js';
import { healthRoutes } from '../routes/health.js';

/**
 * HTTP 服务单例
 */
let httpServerInstance: FastifyInstance | null = null;
let isHttpServerStarting = false;

/**
 * 创建并启动 HTTP 服务器
 */
export async function createHttpServer(): Promise<FastifyInstance> {
  const config = getConfig();

  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      // 在 MCP 模式下，禁用日志输出到 stdout，避免干扰 stdio 通信
      // 或者将日志输出到 stderr
      stream: {
        write: (msg: string) => {
          console.error(msg.trim());
        },
      },
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

    // 使用 stderr 输出，避免干扰 MCP stdio 通信
    console.error(`ClipMark HTTP Server listening at ${address}`);

    httpServerInstance = fastify;
    return fastify;
  } catch (err: unknown) {
    isHttpServerStarting = false;

    // 如果端口已被占用，说明已有 HTTP 服务器在运行，这不是错误
    if (err instanceof Error && 'code' in err && err.code === 'EADDRINUSE') {
      console.error(`HTTP Server is already running on ${config.host}:${config.port}`);
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
