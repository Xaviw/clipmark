/**
 * Health check 路由
 */

import type { FastifyInstance } from 'fastify';

/**
 * 健康检查处理器
 */
async function healthCheckHandler(): Promise<{
  status: string;
  timestamp: number;
  uptime: number;
}> {
  return {
    status: 'ok',
    timestamp: Date.now(),
    uptime: process.uptime(),
  };
}

/**
 * 注册健康检查路由
 */
export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/health', healthCheckHandler);
}
