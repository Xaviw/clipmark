/**
 * Items API 路由
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getStorage } from '../server/storage.js';
import type { ClipItem } from '@clipmark/shared';

/**
 * 同步所有数据（全量替换）
 */
async function syncItemsHandler(
  request: FastifyRequest<{ Body: { items: ClipItem[] } }>,
  reply: FastifyReply
): Promise<{ success: boolean; message?: string }> {
  try {
    const { items } = request.body;

    if (!Array.isArray(items)) {
      reply.code(400);
      return {
        success: false,
        message: 'Invalid request: items array is required',
      };
    }

    const storage = getStorage();
    await storage.replaceAllItems(items);

    return {
      success: true,
      message: 'Items synced successfully',
    };
  } catch (error) {
    reply.code(500);
    return {
      success: false,
      message: `Failed to sync items: ${(error as Error).message}`,
    };
  }
}

/**
 * 获取最新项目
 */
async function getLatestItemHandler(
  _request: FastifyRequest,
  reply: FastifyReply
): Promise<ClipItem | { error: string }> {
  try {
    const storage = getStorage();
    const item = await storage.getLatestItem();

    if (!item) {
      reply.code(404);
      return { error: 'No items found' };
    }

    return item;
  } catch (error) {
    reply.code(500);
    return { error: (error as Error).message };
  }
}

/**
 * 获取单个项目（按ID查询）
 */
async function getItemHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<ClipItem | { error: string }> {
  try {
    const storage = getStorage();
    const item = await storage.getItem(request.params.id);

    if (!item) {
      reply.code(404);
      return { error: 'Item not found' };
    }

    return item;
  } catch (error) {
    reply.code(500);
    return { error: (error as Error).message };
  }
}

/**
 * 注册路由
 */
export async function itemsRoutes(fastify: FastifyInstance): Promise<void> {
  // 同步所有数据（全量替换）
  fastify.post(
    '/items/sync',
    {
      schema: {
        body: {
          type: 'object',
          required: ['items'],
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                required: ['id', 'content', 'metadata', 'createdAt', 'size'],
                properties: {
                  id: { type: 'string' },
                  content: { type: 'string' },
                  metadata: {
                    type: 'object',
                    required: ['sourceUrl', 'title', 'timestamp'],
                    properties: {
                      sourceUrl: { type: 'string' },
                      title: { type: 'string' },
                      timestamp: { type: 'number' },
                    },
                  },
                  createdAt: { type: 'number' },
                  size: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
    syncItemsHandler
  );

  // 获取最新项目
  fastify.get('/items/latest', {}, getLatestItemHandler);

  // 获取单个项目（按ID查询）
  fastify.get(
    '/items/:id',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
      },
    },
    getItemHandler
  );
}
