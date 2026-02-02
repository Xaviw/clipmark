/**
 * HTTP 服务器
 */

import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { getConfig } from '../config/index.js';
import { itemsRoutes } from '../routes/items.js';
import { healthRoutes } from '../routes/health.js';

/**
 * 创建并启动 HTTP 服务器
 */
export async function createHttpServer(): Promise<FastifyInstance> {
  const config = getConfig();

  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
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
 * 启动 HTTP 服务器
 */
export async function startHttpServer(): Promise<void> {
  const config = getConfig();
  const fastify = await createHttpServer();

  try {
    const address = await fastify.listen({
      port: config.port,
      host: config.host,
    });

    console.log(`ClipMark HTTP Server listening at ${address}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

/**
 * 优雅关闭服务器
 */
export async function stopHttpServer(fastify: FastifyInstance): Promise<void> {
  await fastify.close();
}
