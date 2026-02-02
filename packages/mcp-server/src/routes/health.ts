/**
 * Health check 路由
 */

import type { FastifyInstance, FastifyReply } from 'fastify';
import { getStorage } from '../server/storage.js';

/**
 * 健康检查处理器
 */
async function healthCheckHandler(
  request: unknown,
  reply: FastifyReply
): Promise<{
  status: string;
  timestamp: number;
  uptime: number;
  storage: { total: number; totalSize: number };
}> {
  const storage = getStorage();
  const stats = await storage.getStats();

  return {
    status: 'ok',
    timestamp: Date.now(),
    uptime: process.uptime(),
    storage: stats,
  };
}

/**
 * 注册健康检查路由
 */
export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/health', healthCheckHandler);
}
