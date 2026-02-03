/**
 * ClipMark 共享常量
 */

import { DEFAULT_SETTINGS, CONTENT_LIMITS } from '../types/config';

/**
 * 内容限制
 */
export { CONTENT_LIMITS };

/**
 * 默认设置
 */
export { DEFAULT_SETTINGS };

/**
 * API配置
 */
export const API_CONFIG = {
  /** 默认MCP服务地址 */
  DEFAULT_MCP_URL: 'http://localhost:37283',
  /** API端点 */
  ENDPOINTS: {
    /** 保存项目 */
    SAVE_ITEM: '/api/items',
    /** 获取列表 */
    GET_ITEMS: '/api/items',
    /** 获取单个项目 */
    GET_ITEM: '/api/items',
    /** 删除项目 */
    DELETE_ITEM: '/api/items',
    /** 健康检查 */
    HEALTH: '/health',
  } as const,
  /** 请求超时（毫秒） */
  TIMEOUT: 5000,
} as const;
