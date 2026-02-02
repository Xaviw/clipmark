/**
 * Items API 路由
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getStorage } from '../server/storage.js';
import type { SaveItemRequest, SaveItemResponse, GetItemsResponse, DeleteItemResponse } from '@clipmark/shared';
import { CONTENT_LIMITS } from '@clipmark/shared';

/**
 * 保存项目
 */
async function saveItemHandler(
  request: FastifyRequest<{ Body: SaveItemRequest }>,
  reply: FastifyReply
): Promise<SaveItemResponse> {
  try {
    const storage = getStorage();
    const item = await storage.saveItem(request.body);

    return {
      id: item.id,
      success: true,
      message: 'Item saved successfully',
    };
  } catch (error) {
    reply.code(500);
    return {
      id: '',
      success: false,
      message: `Failed to save item: ${(error as Error).message}`,
    };
  }
}

/**
 * 获取项目列表
 */
async function getItemsHandler(
  request: FastifyRequest<{
    Querystring: { limit?: string; offset?: string };
  }>,
  reply: FastifyReply
): Promise<GetItemsResponse> {
  try {
    const storage = getStorage();
    const limit = Math.min(parseInt(request.query.limit || '10', 10), 100);
    const offset = Math.max(parseInt(request.query.offset || '0', 10), 0);

    const result = await storage.getItems(limit, offset);
    return result;
  } catch (error) {
    reply.code(500);
    return {
      items: [],
      total: 0,
    };
  }
}

/**
 * 获取单个项目
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
 * 删除单个项目
 */
async function deleteItemHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<DeleteItemResponse> {
  try {
    const storage = getStorage();
    const deleted = await storage.deleteItem(request.params.id);

    if (!deleted) {
      reply.code(404);
      return {
        success: false,
        message: 'Item not found',
      };
    }

    return {
      success: true,
      message: 'Item deleted successfully',
    };
  } catch (error) {
    reply.code(500);
    return {
      success: false,
      message: `Failed to delete item: ${(error as Error).message}`,
    };
  }
}

/**
 * 批量删除项目
 */
async function deleteItemsHandler(
  request: FastifyRequest<{ Body: { ids: string[] } }>,
  reply: FastifyReply
): Promise<{ success: boolean; message?: string; count?: number }> {
  try {
    const { ids } = request.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      reply.code(400);
      return {
        success: false,
        message: 'Invalid request: ids array is required',
      };
    }

    const storage = getStorage();
    const count = await storage.deleteItems(ids);

    return {
      success: true,
      message: `Deleted ${count} item(s)`,
      count,
    };
  } catch (error) {
    reply.code(500);
    return {
      success: false,
      message: `Failed to delete items: ${(error as Error).message}`,
    };
  }
}

/**
 * 注册路由
 */
export async function itemsRoutes(fastify: FastifyInstance): Promise<void> {
  // 保存项目
  fastify.post('/items', {
    schema: {
      body: {
        type: 'object',
        required: ['content', 'metadata'],
        properties: {
          content: { type: 'string', maxLength: CONTENT_LIMITS.MAX_CONTENT_SIZE },
          originalPlain: { type: 'string' },
          originalHtml: { type: 'string' },
          metadata: {
            type: 'object',
            required: ['sourceUrl', 'title', 'timestamp'],
            properties: {
              sourceUrl: { type: 'string' },
              title: { type: 'string' },
              timestamp: { type: 'number' },
            },
          },
        },
      },
    },
  }, saveItemHandler);

  // 获取项目列表
  fastify.get('/items', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'string', pattern: '^\\d+$' },
          offset: { type: 'string', pattern: '^\\d+$' },
        },
      },
    },
  }, getItemsHandler);

  // 获取单个项目
  fastify.get('/items/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, getItemHandler);

  // 删除单个项目
  fastify.delete('/items/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, deleteItemHandler);

  // 批量删除项目
  fastify.delete('/items', {
    schema: {
      body: {
        type: 'object',
        required: ['ids'],
        properties: {
          ids: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
    },
  }, deleteItemsHandler);
}
